import './CartSummary.css';
import {useContext, useState, useEffect} from "react";
import {AppContext} from "../../context/AppContext.jsx";
import ReceiptPopup from "../ReceiptPopup/ReceiptPopup.jsx";
import {createOrder, deleteOrder} from "../../Service/OrderService.js";
import toast from "react-hot-toast";
import {createRazorpayOrder, verifyPayment, initiatePosPayment} from "../../Service/PaymentService.js";
import {AppConstants} from "../../util/constants.js";
import FiscalService from "../../Service/FiscalService.js";
import InventoryService from "../../Service/InventoryService.js";
import LoyaltyService from "../../Service/LoyaltyService.js";
import CashDrawerService from "../../Service/CashDrawerService.js";

const CartSummary = ({customerName, mobileNumber, setMobileNumber, setCustomerName, loyaltyCustomer}) => {
    const {cartItems, clearCart} = useContext(AppContext);

    const [isProcessing, setIsProcessing] = useState(false);
    const [orderDetails, setOrderDetails] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [loyaltyDiscounts, setLoyaltyDiscounts] = useState(null);

    const formatBGN = (amount) => new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'BGN' }).format(amount || 0);

    const getItemVatRate = (item) => (item.vatRate ?? 0.20);

    // Bulgarian VAT (ДДС) handling with prices that are VAT-inclusive (gross)
    const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = cartItems.reduce((total, item) => {
        const rate = getItemVatRate(item) || 0;
        const lineTotal = (item.price || 0) * (item.quantity || 0);
        if (rate <= 0) return total; // no VAT
        const base = lineTotal / (1 + rate);
        const vatAmount = lineTotal - base;
        return total + vatAmount;
    }, 0);
    const loyaltyDiscountAmount = loyaltyDiscounts?.totalDiscount || 0;
    // Grand total must NOT add VAT again because subtotal already includes VAT
    const grandTotal = subtotal - loyaltyDiscountAmount;

    // Calculate loyalty discounts when cart items or loyalty customer changes
    useEffect(() => {
        const calculateLoyaltyDiscounts = async () => {
            if (cartItems.length > 0 && loyaltyCustomer) {
                try {
                    const discountRequest = {
                        customerId: loyaltyCustomer.customerId,
                        loyaltyCardBarcode: loyaltyCustomer.loyaltyCardBarcode,
                        phoneNumber: loyaltyCustomer.phoneNumber,
                        cartItems: cartItems.map(item => ({
                            itemId: item.itemId,
                            itemName: item.name,
                            categoryId: item.category?.categoryId,
                            barcode: item.barcode,
                            price: item.price,
                            quantity: item.quantity,
                            vatRate: getItemVatRate(item)
                        })),
                        subtotal: subtotal
                    };

                    const response = await LoyaltyService.calculateDiscounts(discountRequest);
                    setLoyaltyDiscounts(response.data);
                } catch (error) {
                    console.error('Error calculating loyalty discounts:', error);
                    setLoyaltyDiscounts(null);
                }
            } else {
                setLoyaltyDiscounts(null);
            }
        };

        calculateLoyaltyDiscounts();
    }, [cartItems, loyaltyCustomer, subtotal]);

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
        // След печат започваме нова продажба
        setShowPopup(false);
        setOrderDetails(null);
    }

    // Автоматично показване на бележката след успешно плащане
    useEffect(() => {
        if (orderDetails) {
            // Показваме попъпа и чистим количката веднага след setOrderDetails
            setShowPopup(true);
            clearAll();
        }
    }, [orderDetails]);

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
        // НАП изискване: Проверка за активна cash drawer session преди създаване на поръчка
        try {
            const activeSession = await CashDrawerService.getActiveSession();
            if (!activeSession) {
                toast.error(
                    "За да създадете поръчка, трябва първо да започнете работен ден (Контрол на касата) с въведена начална сума и избрано фискално устройство. " +
                    "Това е задължително изискване на НАП.",
                    { duration: 6000 }
                );
                return;
            }
        } catch (error) {
            console.error('Error checking active session:', error);
            toast.error("Грешка при проверка на активна сесия. Моля, опитайте отново.");
            return;
        }
        
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
        let splitCashAmount = 0;
        let splitCardAmount = 0;
        if (paymentMode === "split") {
            const cashInput = window.prompt("Въведете сума в брой:", String(grandTotal.toFixed(2)));
            const cashAmount = parseFloat(cashInput || '0');
            const cardAmount = parseFloat((grandTotal - (isNaN(cashAmount) ? 0 : cashAmount)).toFixed(2));
            if (isNaN(cashAmount) || cashAmount < 0) {
                toast.error("Невалидна сума в брой");
                return;
            }
            if (cardAmount < 0) {
                toast.error("Сумата с карта не може да е отрицателна");
                return;
            }
            const totalCheck = parseFloat((cashAmount + cardAmount).toFixed(2));
            const grandCheck = parseFloat(grandTotal.toFixed(2));
            if (totalCheck !== grandCheck) {
                toast.error("Сборът на суми не съвпада с крайната сума");
                return;
            }
            orderData.paymentMethod = "SPLIT";
            orderData.cashAmount = cashAmount;
            orderData.cardAmount = cardAmount;
            splitCashAmount = cashAmount;
            splitCardAmount = cardAmount;
        }

        // Потвърждение от касиера преди да продължим с плащане
        const methodLabel = paymentMode === 'cash' ? 'в брой' : paymentMode === 'card' ? 'с карта' : paymentMode === 'split' ? 'съвместно' : paymentMode;
        let confirmText = `Потвърждавате плащане ${methodLabel} за ${formatBGN(grandTotal)}?`;
        if (paymentMode === 'split') {
            confirmText = `Потвърждавате съвместно плащане?\nВ брой: ${formatBGN(splitCashAmount)}\nКарта: ${formatBGN(splitCardAmount)}\nОбщо: ${formatBGN(grandTotal)}`;
        }
        if (!window.confirm(confirmText)) {
            return;
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
            } else if (response.status === 201 && paymentMode === "card") {
                try {
                    const initResp = await initiatePosPayment({
                        orderId: savedData.orderId,
                        amount: grandTotal,
                        currency: 'BGN'
                    });
                    const result = initResp.data;
                    if (result.status === 'APPROVED') {
                        toast.success("Картово плащане одобрено");
                        setOrderDetails({
                            ...savedData,
                            paymentDetails: {
                                posTransactionId: result.transactionId,
                                authCode: result.authCode,
                                status: result.status
                            }
                        });
                    } else {
                        await deleteOrderOnFailure(savedData.orderId);
                        toast.error("Картово плащане отказано");
                    }
                } catch (err) {
                    await deleteOrderOnFailure(savedData.orderId);
                    console.error(err);
                    toast.error("Грешка при картово плащане");
                }
            } else if (response.status === 201 && paymentMode === "split") {
                try {
                    // приемаме кеш частта на място
                    if (splitCashAmount > 0) {
                        toast.success(`Прието в брой: ${formatBGN(splitCashAmount)}`);
                    }
                    if (splitCardAmount > 0) {
                        const initResp = await initiatePosPayment({
                            orderId: savedData.orderId,
                            amount: splitCardAmount,
                            currency: 'BGN'
                        });
                        const result = initResp.data;
                        if (result.status === 'APPROVED') {
                            toast.success("Картова част: одобрена");
                            setOrderDetails({
                                ...savedData,
                                paymentDetails: {
                                    ...savedData.paymentDetails,
                                    posTransactionId: result.transactionId,
                                    authCode: result.authCode,
                                    status: result.status,
                                    cashAmount: splitCashAmount,
                                    cardAmount: splitCardAmount
                                },
                                paymentMethod: 'SPLIT'
                            });
                        } else {
                            await deleteOrderOnFailure(savedData.orderId);
                            toast.error("Картова част: отказана");
                        }
                    } else {
                        // изцяло кеш
                        setOrderDetails({ ...savedData, paymentMethod: 'SPLIT' });
                    }
                } catch (err) {
                    await deleteOrderOnFailure(savedData.orderId);
                    console.error(err);
                    toast.error("Грешка при картовата част");
                }
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
                    <span className="text-light">Междинна сума (с ДДС):</span>
                    <span className="text-light">{formatBGN(subtotal)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                    <span className="text-light">ДДС: </span>
                    <span className="text-light">{formatBGN(tax)}</span>
                </div>
                {loyaltyDiscounts && loyaltyDiscountAmount > 0 && (
                    <div className="d-flex justify-content-between mb-2">
                        <span className="text-success">🎯 Лоялна отстъпка:</span>
                        <span className="text-success">-{formatBGN(loyaltyDiscountAmount)}</span>
                    </div>
                )}
                <div className="d-flex justify-content-between mb-4">
                    <span className="text-light">Крайна сума за плащане:</span>
                    <span className="text-light">{formatBGN(grandTotal)}</span>
                </div>
            </div>

            <div className="d-flex gap-3">
                <button className="btn btn-success flex-grow-1"
                    onClick={() => completePayment("cash")}
                        disabled={isProcessing || !!orderDetails}
                >
                    {isProcessing ? "Обработка...": "В брой"}
                </button>
                {/*}
                <button className="btn btn-primary flex-grow-1"
                        onClick={() => completePayment("upi")}
                        disabled={isProcessing}
                >
                    {isProcessing ? "Обработка...": "UPI"}
                </button>
                */}
                <button className="btn btn-info flex-grow-1"
                        onClick={() => completePayment("card")}
                        disabled={isProcessing || !!orderDetails}
                >
                    {isProcessing ? "Обработка...": "Карта"}
                </button>
                <button className="btn btn-secondary flex-grow-1"
                        onClick={() => completePayment("split")}
                        disabled={isProcessing || !!orderDetails}
                >
                    {isProcessing ? "Обработка...": "Съвместно"}
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
                        onClose={() => { setShowPopup(false); setOrderDetails(null); }}
                        onPrint={handlePrintReceipt}
                    />
                )
            }
        </div>
    )
}

export default CartSummary;