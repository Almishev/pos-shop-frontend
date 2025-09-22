import './CartSummary.css';
import {useContext, useState} from "react";
import {AppContext} from "../../context/AppContext.jsx";
import ReceiptPopup from "../ReceiptPopup/ReceiptPopup.jsx";
import {createOrder, deleteOrder} from "../../Service/OrderService.js";
import toast from "react-hot-toast";
import {createRazorpayOrder, verifyPayment} from "../../Service/PaymentService.js";
import {AppConstants} from "../../util/constants.js";
import FiscalService from "../../Service/FiscalService.js";
import InventoryService from "../../Service/InventoryService.js";

const CartSummary = ({customerName, mobileNumber, setMobileNumber, setCustomerName}) => {
    const {cartItems, clearCart} = useContext(AppContext);

    const [isProcessing, setIsProcessing] = useState(false);
    const [orderDetails, setOrderDetails] = useState(null);
    const [showPopup, setShowPopup] = useState(false);

    const formatBGN = (amount) => new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'BGN' }).format(amount || 0);

    const getItemVatRate = (item) => (item.vatRate ?? 0.20);

    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = cartItems.reduce((total, item) => total + (item.price * item.quantity) * getItemVatRate(item), 0);
    const grandTotal = subtotal + tax;

    const clearAll = () => {
        setCustomerName("");
        setMobileNumber("");
        clearCart();
    }

    const placeOrder = () => {
        setShowPopup(true);
        clearAll();
    }

    const handlePrintReceipt = () => {
        window.print();
    }

    const loadRazorpayScript = () => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        })
    }

    const deleteOrderOnFailure = async (orderId) => {
        try {
            await deleteOrder(orderId);
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        }
    }

    const completePayment = async (paymentMode) => {
        // Използваме дефаултни стойности ако не са въведени данни
        const finalCustomerName = customerName.trim() || "Случаен клиент";
        const finalMobileNumber = mobileNumber.trim() || "0000000000";

        if (cartItems.length === 0) {
            toast.error("Количката е празна");
            return;
        }
        const orderData = {
            customerName: finalCustomerName,
            phoneNumber: finalMobileNumber,
            cartItems,
            subtotal: subtotal,
            tax,
            grandTotal,
            paymentMethod: paymentMode.toUpperCase()
        }
        setIsProcessing(true);
        try {

            const response = await createOrder(orderData);
            const savedData = response.data;
            
            // Send to fiscal device after successful order creation
            try {
                await sendToFiscalDevice(savedData);
            } catch (fiscalError) {
                console.error('Fiscal device error:', fiscalError);
                toast.error('Внимание: Фискалният бон не е изпратен');
            }
            
            // Inventory is now updated server-side inside OrderServiceImpl#createOrder.
            // We skip the client-side inventory call to avoid duplicate updates and 403s.
            
            if (response.status === 201 && paymentMode === "cash") {
                toast.success("Плащане в брой прието");
                setOrderDetails(savedData);
            } else if (response.status === 201 && paymentMode === "upi") {
                const razorpayLoaded = await loadRazorpayScript();
                if (!razorpayLoaded) {
                    toast.error('Неуспешно зареждане на Razorpay');
                    await deleteOrderOnFailure(savedData.orderId);
                    return;
                }

                //create razorpay order
                const razorpayResponse = await createRazorpayOrder({amount: grandTotal, currency: 'INR'});
                const options = {
                    key: AppConstants.RAZORPAY_KEY_ID,
                    amount: razorpayResponse.data.amount,
                    currency: razorpayResponse.data.currency,
                    order_id: razorpayResponse.data.id,
                    name: "My Retail Shop",
                    description: "Order payment",
                    handler: async function (response) {
                        await verifyPaymentHandler(response,  savedData);
                    },
                    prefill: {
                        name: finalCustomerName,
                        contact: finalMobileNumber
                    },
                    theme: {
                        color: "#3399cc"
                    },
                    modal: {
                        ondismiss: async () => {
                            await deleteOrderOnFailure(savedData.orderId);
                            toast.error("Плащането е отменено");
                        }
                    },
                };
                const rzp = new window.Razorpay(options);
                rzp.on("payment.failed", async (response) => {
                    await deleteOrderOnFailure(savedData.orderId);
                    toast.error("Плащането неуспешно");
                    console.error(response.error.description);
                });
                rzp.open();
            }
        }catch(error) {
            console.error(error);
            toast.error("Грешка при обработка на плащането");
        } finally {
            setIsProcessing(false);
        }
    }

    const sendToFiscalDevice = async (orderData) => {
        try {
            // Get first available fiscal device
            const devices = await FiscalService.getAllDevices();
            if (devices.length === 0) {
                throw new Error('No fiscal devices registered');
            }
            
            const device = devices[0]; // Use first device
            const fiscalReceiptData = {
                orderId: orderData.orderId,
                deviceSerialNumber: device.serialNumber,
                subtotal: orderData.subtotal,
                vatAmount: orderData.tax,
                grandTotal: orderData.grandTotal,
                cashierName: "Cashier", // You can get this from context
                items: (orderData.items || orderData.cartItems || []).map(item => ({
                    itemName: item.name,
                    barcode: item.barcode || '',
                    unitPrice: item.price,
                    quantity: item.quantity,
                    totalPrice: item.price * item.quantity,
                    vatRate: Math.round(((item.vatRate ?? 0.20) * 100) * 100) / 100
                }))
            };
            
            const fiscalResponse = await FiscalService.sendReceipt(fiscalReceiptData);
            console.log('Fiscal receipt sent:', fiscalResponse);
            toast.success('Фискалният бон е изпратен');
            
        } catch (error) {
            console.error('Error sending to fiscal device:', error);
            throw error;
        }
    };

    const updateInventory = async (orderData) => {
        try {
            // Process each item in the order to update inventory
            const items = orderData.items || orderData.cartItems || [];
            for (const item of items) {
                await InventoryService.processSaleTransaction(
                    item.itemId,
                    item.quantity,
                    orderData.orderId
                );
            }
            console.log('Inventory updated successfully');
            toast.success('Складът е обновен');
            
        } catch (error) {
            console.error('Error updating inventory:', error);
            throw error;
        }
    };

    const verifyPaymentHandler = async (response, savedOrder) => {
        const paymentData = {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            orderId: savedOrder.orderId
        };
        try {
            const paymentResponse = await verifyPayment(paymentData);
            if (paymentResponse.status === 200) {
                toast.success("Payment successful");
                setOrderDetails({
                    ...savedOrder,
                    paymentDetails: {
                        razorpayOrderId: response.razorpay_order_id,
                        razorpayPaymentId: response.razorpay_payment_id,
                        razorpaySignature: response.razorpay_signature
                    },
                });
            }else {
                toast.error("Payment processing failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("Плащането неуспешно");
        }
    };

    return (
        <div className="mt-2">
            <div className="cart-summary-details">
                <div className="d-flex justify-content-between mb-2">
                    <span className="text-light">Междинна сума:</span>
                    <span className="text-light">{formatBGN(subtotal)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                    <span className="text-light">ДДС (20%):</span>
                    <span className="text-light">{formatBGN(tax)}</span>
                </div>
                <div className="d-flex justify-content-between mb-4">
                    <span className="text-light">Общо:</span>
                    <span className="text-light">{formatBGN(grandTotal)}</span>
                </div>
            </div>

            <div className="d-flex gap-3">
                <button className="btn btn-success flex-grow-1"
                    onClick={() => completePayment("cash")}
                        disabled={isProcessing}
                >
                    {isProcessing ? "Обработка...": "В брой"}
                </button>
                <button className="btn btn-primary flex-grow-1"
                        onClick={() => completePayment("upi")}
                        disabled={isProcessing}
                >
                    {isProcessing ? "Обработка...": "UPI"}
                </button>
            </div>
            <div className="d-flex gap-3 mt-3">
                <button className="btn btn-warning flex-grow-1"
                    onClick={placeOrder}
                    disabled={isProcessing || !orderDetails}
                >
                    Разпечатай бележка
                </button>
            </div>
            {
                showPopup && (
                    <ReceiptPopup
                        orderDetails={{
                            ...orderDetails,
                            razorpayOrderId: orderDetails.paymentDetails?.razorpayOrderId,
                            razorpayPaymentId: orderDetails.paymentDetails?.razorpayPaymentId,
                        }}
                        onClose={() => setShowPopup(false)}
                        onPrint={handlePrintReceipt}
                    />
                )
            }
        </div>
    )
}

export default CartSummary;