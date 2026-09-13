import './CartSummary.css';
import {useContext, useState, useEffect} from "react";
import {createPortal} from "react-dom";
import {AppContext} from "../../context/AppContext.jsx";
import ReceiptPopup from "../ReceiptPopup/ReceiptPopup.jsx";
import {createOrder, deleteOrder} from "../../Service/OrderService.js";
import toast from "react-hot-toast";
import {initiatePosPayment} from "../../Service/PaymentService.js";
import FiscalService from "../../Service/FiscalService.js";
import LoyaltyService from "../../Service/LoyaltyService.js";
import CashDrawerService from "../../Service/CashDrawerService.js";
import { formatMoney, SHOP_CURRENCY } from "../../util/formatMoney.js";

const CartSummary = ({loyaltyCustomer, onClearLoyaltyCustomer}) => {
    const {cartItems, clearCart} = useContext(AppContext);

    const [isProcessing, setIsProcessing] = useState(false);
    const [orderDetails, setOrderDetails] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [loyaltyDiscounts, setLoyaltyDiscounts] = useState(null);

    const getItemVatRate = (item) => {
        const r = Number(item.vatRate);
        return Number.isFinite(r) ? r : 0.20;
    };

    const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

    // Bulgarian VAT (ДДС) — prices are VAT-inclusive (gross); sum rounded per line to 2dp
    const subtotal = round2(cartItems.reduce((total, item) => total + (item.price * item.quantity), 0));
    const tax = round2(cartItems.reduce((total, item) => {
        const rate = getItemVatRate(item);
        const lineTotal = (item.price || 0) * (item.quantity || 0);
        if (rate <= 0) return total;
        const base = lineTotal / (1 + rate);
        const vatAmount = round2(lineTotal - base);
        return total + vatAmount;
    }, 0));
    const loyaltyDiscountAmount = loyaltyDiscounts?.totalDiscount || 0;
    // Grand total must NOT add VAT again because subtotal already includes VAT
    const grandTotal = round2(subtotal - loyaltyDiscountAmount);

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
        if (onClearLoyaltyCustomer) onClearLoyaltyCustomer();
        clearCart();
    }

    const closeReceipt = () => {
        setShowPopup(false);
        setOrderDetails(null);
        clearAll();
    }

    const handlePrintReceipt = (opts) => {
        if (opts?.fallbackSamePage) {
            const finish = () => {
                window.removeEventListener('afterprint', finish);
                closeReceipt();
            };
            window.addEventListener('afterprint', finish);
            window.print();
            return;
        }
        // New-window print already started in ReceiptPopup — close modal
        closeReceipt();
    }

    /** Open receipt modal; cart is cleared when the modal closes/prints. */
    const openReceipt = (data) => {
        setShowPaymentModal(false);
        setOrderDetails(data);
        setShowPopup(true);
    }

    const openPaymentModal = () => {
        if (cartItems.length === 0) {
            toast.error("Количката е празна");
            return;
        }
        setShowPaymentModal(true);
    }

    const selectPaymentMethod = (paymentMode) => {
        setShowPaymentModal(false);
        completePayment(paymentMode);
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
        let activeSession;
        try {
            activeSession = await CashDrawerService.getActiveSession();
            if (!activeSession) {
                toast.error(
                    "За да създадете поръчка, трябва първо да започнете работен ден (Контрол на касата) с въведена начална сума и избрано фискално устройство. " +
                    "Това е задължително изискване на НАП.",
                    { duration: 6000 }
                );
                return;
            }
            if (!activeSession.deviceSerialNumber) {
                toast.error("Активната касова сесия няма фискално устройство. Започнете отново работния ден.");
                return;
            }
        } catch (error) {
            console.error('Error checking active session:', error);
            toast.error("Грешка при проверка на активна сесия. Моля, опитайте отново.");
            return;
        }
        
        // Customer only from loyalty card; empty when walk-in (hidden on receipt)
        const finalCustomerName = loyaltyCustomer
            ? `${loyaltyCustomer.firstName || ''} ${loyaltyCustomer.lastName || ''}`.trim()
            : '';
        const finalMobileNumber = loyaltyCustomer?.phoneNumber || '';

        if (cartItems.length === 0) {
            toast.error("Количката е празна");
            return;
        }
        const orderData = {
            customerName: finalCustomerName,
            phoneNumber: finalMobileNumber,
            cartItems: cartItems.map(item => ({
                itemId: item.itemId,
                name: item.name,
                barcode: item.barcode,
                price: item.price,
                quantity: item.quantity,
                vatRate: getItemVatRate(item)
            })),
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
        let confirmText = `Потвърждавате плащане ${methodLabel} за ${formatMoney(grandTotal)}?`;
        if (paymentMode === 'split') {
            confirmText = `Потвърждавате съвместно плащане?\nВ брой: ${formatMoney(splitCashAmount)}\nКарта: ${formatMoney(splitCardAmount)}\nОбщо: ${formatMoney(grandTotal)}`;
        }
        if (!window.confirm(confirmText)) {
            return;
        }
        setIsProcessing(true);
        try {

            const response = await createOrder(orderData);
            const savedData = response.data;
            
            // Фискализация задължителна — при неуспех отменяме продажбата
            try {
                await sendToFiscalDevice(savedData, activeSession.deviceSerialNumber);
            } catch (fiscalError) {
                console.error('Fiscal device error:', fiscalError);
                await deleteOrderOnFailure(savedData.orderId);
                toast.error(
                    'Продажбата е отказана: фискалният бон не е издаден. Стоките са върнати в склада.',
                    { duration: 7000 }
                );
                return;
            }
            
            // Inventory is now updated server-side inside OrderServiceImpl#createOrder.
            // We skip the client-side inventory call to avoid duplicate updates and 403s.
            
            if (response.status === 201 && paymentMode === "cash") {
                toast.success("Плащане в брой прието");
                openReceipt(savedData);
            } else if (response.status === 201 && paymentMode === "card") {
                try {
                    const initResp = await initiatePosPayment({
                        orderId: savedData.orderId,
                        amount: grandTotal,
                        currency: SHOP_CURRENCY
                    });
                    const result = initResp.data;
                    if (result.status === 'APPROVED') {
                        toast.success("Картово плащане одобрено");
                        openReceipt({
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
                        toast.success(`Прието в брой: ${formatMoney(splitCashAmount)}`);
                    }
                    if (splitCardAmount > 0) {
                        const initResp = await initiatePosPayment({
                            orderId: savedData.orderId,
                            amount: splitCardAmount,
                            currency: SHOP_CURRENCY
                        });
                        const result = initResp.data;
                        if (result.status === 'APPROVED') {
                            toast.success("Картова част: одобрена");
                            openReceipt({
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
                        openReceipt({ ...savedData, paymentMethod: 'SPLIT' });
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

    const sendToFiscalDevice = async (orderData, deviceSerialNumber) => {
        try {
            if (!deviceSerialNumber) {
                throw new Error('Няма фискално устройство в касовата сесия');
            }

            const fiscalReceiptData = {
                orderId: orderData.orderId,
                deviceSerialNumber,
                subtotal: orderData.subtotal,
                vatAmount: orderData.tax,
                grandTotal: orderData.grandTotal,
                cashierName: orderData.cashierUsername || undefined,
                items: (orderData.items || orderData.cartItems || []).map(item => ({
                    itemName: item.name,
                    barcode: item.barcode || '',
                    unitPrice: item.price,
                    quantity: item.quantity,
                    totalPrice: item.price * item.quantity,
                    vatRate: Math.round(((item.vatRate ?? 0.20) * 100) * 100) / 100
                }))
            };
            
            await FiscalService.sendReceipt(fiscalReceiptData);
            toast.success('Фискалният бон е изпратен');
            
        } catch (error) {
            console.error('Error sending to fiscal device:', error);
            throw error;
        }
    };

    const paymentModal = showPaymentModal && createPortal(
        <div
            className="payment-modal-overlay"
            onClick={() => !isProcessing && setShowPaymentModal(false)}
            role="presentation"
        >
            <div
                className="payment-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="payment-modal-title"
            >
                <h5 id="payment-modal-title" className="payment-modal-title">Плащане</h5>
                <p className="payment-modal-hint">Сума за плащане</p>
                <div className="payment-modal-amount">{formatMoney(grandTotal)}</div>
                {loyaltyDiscounts && loyaltyDiscountAmount > 0 && (
                    <p className="payment-modal-discount">
                        Вкл. лоялна отстъпка: −{formatMoney(loyaltyDiscountAmount)}
                    </p>
                )}
                <div className="payment-modal-actions">
                    <button
                        type="button"
                        className="btn btn-success payment-modal-btn"
                        onClick={() => selectPaymentMethod("cash")}
                        disabled={isProcessing}
                    >
                        В брой
                    </button>
                    <button
                        type="button"
                        className="btn btn-info payment-modal-btn"
                        onClick={() => selectPaymentMethod("card")}
                        disabled={isProcessing}
                    >
                        Карта
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary payment-modal-btn"
                        onClick={() => selectPaymentMethod("split")}
                        disabled={isProcessing}
                    >
                        Съвместно
                    </button>
                </div>
                <button
                    type="button"
                    className="btn btn-outline-light payment-modal-cancel"
                    onClick={() => setShowPaymentModal(false)}
                    disabled={isProcessing}
                >
                    Отказ
                </button>
            </div>
        </div>,
        document.body
    );

    return (
        <div className="cart-summary mt-1">
            <div className="cart-summary-details">
                <div className="cart-summary-secondary d-flex justify-content-between">
                    <span>Междинна сума (с ДДС):</span>
                    <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="cart-summary-secondary d-flex justify-content-between">
                    <span>ДДС:</span>
                    <span>{formatMoney(tax)}</span>
                </div>
                {loyaltyDiscounts && loyaltyDiscountAmount > 0 && (
                    <div className="cart-summary-secondary d-flex justify-content-between text-success">
                        <span>Лоялна отстъпка:</span>
                        <span>-{formatMoney(loyaltyDiscountAmount)}</span>
                    </div>
                )}
                <div className="cart-summary-total d-flex justify-content-between align-items-baseline">
                    <span className="cart-summary-total-label">За плащане</span>
                    <span className="cart-summary-total-value">{formatMoney(grandTotal)}</span>
                </div>
            </div>

            <div className="mt-2">
                <button
                    type="button"
                    className="btn btn-success w-100 cart-pay-btn"
                    onClick={openPaymentModal}
                    disabled={isProcessing || cartItems.length === 0 || !!orderDetails}
                >
                    {isProcessing ? "Обработка..." : "Плащане"}
                </button>
            </div>

            {paymentModal}

            {
                showPopup && orderDetails && (
                    <ReceiptPopup
                        orderDetails={{
                            ...orderDetails,
                            items: orderDetails.items || [],
                        }}
                        onClose={closeReceipt}
                        onPrint={handlePrintReceipt}
                    />
                )
            }
        </div>
    )
}

export default CartSummary;
