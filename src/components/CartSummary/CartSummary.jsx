import './CartSummary.css';
import '../shared/QtyNumpad.css';
import {useContext, useState, useEffect, useRef} from "react";
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
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [splitCashDraft, setSplitCashDraft] = useState('');
    const replaceSplitKeyRef = useRef(true);
    const [loyaltyDiscounts, setLoyaltyDiscounts] = useState(null);

    const getItemVatRate = (item) => {
        const r = Number(item.vatRate);
        return Number.isFinite(r) ? r : 0.20;
    };

    const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

    const vatFromGross = (gross, rate) => {
        if (!rate || rate <= 0 || gross <= 0) return 0;
        const base = gross / (1 + rate);
        return round2(gross - base);
    };

    // Bulgarian VAT (ДДС) — prices are VAT-inclusive (gross); per-line, after loyalty discounts
    const subtotal = round2(cartItems.reduce((total, item) => total + (item.price * item.quantity), 0));
    const loyaltyDiscountAmount = Number(loyaltyDiscounts?.totalDiscount) || 0;

    const discountByItemId = {};
    for (const d of loyaltyDiscounts?.appliedDiscounts || []) {
        if (!d?.itemId) continue;
        const amt = Number(d.discountAmount) || 0;
        discountByItemId[d.itemId] = (discountByItemId[d.itemId] || 0) + amt;
    }
    const allocatedItemDiscount = Object.values(discountByItemId).reduce((s, v) => s + v, 0);
    // Cart-level (AMOUNT) discounts have no itemId — spread by line share of subtotal
    const leftoverDiscount = Math.max(0, loyaltyDiscountAmount - allocatedItemDiscount);

    const tax = round2(cartItems.reduce((total, item) => {
        const lineGross = (item.price || 0) * (item.quantity || 0);
        let lineDiscount = discountByItemId[item.itemId] || 0;
        if (leftoverDiscount > 0 && subtotal > 0) {
            lineDiscount += leftoverDiscount * (lineGross / subtotal);
        }
        const netGross = Math.max(0, lineGross - lineDiscount);
        return total + vatFromGross(netGross, getItemVatRate(item));
    }, 0));

    // Grand total must NOT add VAT again because subtotal already includes VAT
    const grandTotal = round2(subtotal - loyaltyDiscountAmount);

    const parsedSplitCash = (() => {
        const n = parseFloat((splitCashDraft || '').toString().replace(',', '.'));
        return Number.isFinite(n) ? round2(n) : NaN;
    })();
    const splitCardPreview = Number.isFinite(parsedSplitCash)
        ? round2(grandTotal - parsedSplitCash)
        : round2(grandTotal);

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
        setShowSplitModal(false);
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

    const openSplitModal = () => {
        setShowPaymentModal(false);
        setSplitCashDraft(String(grandTotal.toFixed(2)));
        replaceSplitKeyRef.current = true;
        setShowSplitModal(true);
    };

    const closeSplitModal = () => {
        setShowSplitModal(false);
        setSplitCashDraft('');
        replaceSplitKeyRef.current = true;
    };

    const isValidMoneyDraft = (value) => /^\d*(?:\.\d{0,2})?$/.test(value);

    const appendSplitKey = (key) => {
        setSplitCashDraft((prev) => {
            const current = (prev ?? '').toString();
            if (key === 'C') {
                replaceSplitKeyRef.current = false;
                return '';
            }
            if (key === '⌫') {
                replaceSplitKeyRef.current = false;
                return current.slice(0, -1);
            }
            if (key === '.') {
                const replace = replaceSplitKeyRef.current;
                replaceSplitKeyRef.current = false;
                if (replace) return '0.';
                if (current.includes('.')) return current;
                return current === '' ? '0.' : `${current}.`;
            }
            if (replaceSplitKeyRef.current) {
                replaceSplitKeyRef.current = false;
                return key;
            }
            if (current === '0') return key;
            const next = `${current}${key}`;
            return isValidMoneyDraft(next) ? next : current;
        });
    };

    const confirmSplitPayment = () => {
        const cashAmount = parsedSplitCash;
        if (!Number.isFinite(cashAmount) || cashAmount < 0) {
            toast.error("Невалидна сума в брой");
            return;
        }
        const cardAmount = round2(grandTotal - cashAmount);
        if (cardAmount < 0) {
            toast.error("Сумата с карта не може да е отрицателна");
            return;
        }
        if (round2(cashAmount + cardAmount) !== round2(grandTotal)) {
            toast.error("Сборът на суми не съвпада с крайната сума");
            return;
        }
        setShowSplitModal(false);
        completePayment("split", { cashAmount, cardAmount });
    };

    // Physical keyboard → same as on-screen split numpad
    useEffect(() => {
        if (!showSplitModal || isProcessing) return;
        const onKeyDown = (e) => {
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                closeSplitModal();
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                confirmSplitPayment();
                return;
            }
            if (e.key === 'Backspace') {
                e.preventDefault();
                e.stopPropagation();
                appendSplitKey('⌫');
                return;
            }
            if (e.key === 'Delete') {
                e.preventDefault();
                e.stopPropagation();
                appendSplitKey('C');
                return;
            }
            if (e.key === '.' || e.key === ',') {
                e.preventDefault();
                e.stopPropagation();
                appendSplitKey('.');
                return;
            }
            if (/^[0-9]$/.test(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                appendSplitKey(e.key);
            }
        };
        document.addEventListener('keydown', onKeyDown, true);
        return () => document.removeEventListener('keydown', onKeyDown, true);
    }, [showSplitModal, isProcessing, splitCashDraft, grandTotal]);

    const selectPaymentMethod = (paymentMode) => {
        if (paymentMode === "split") {
            openSplitModal();
            return;
        }
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

    const completePayment = async (paymentMode, splitAmounts = null) => {
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

        // Line prices after loyalty (net gross) so order/fiscal/receipt stay consistent
        const netCartItems = cartItems.map(item => {
            const lineGross = (item.price || 0) * (item.quantity || 0);
            let lineDiscount = discountByItemId[item.itemId] || 0;
            if (leftoverDiscount > 0 && subtotal > 0) {
                lineDiscount += leftoverDiscount * (lineGross / subtotal);
            }
            const netGross = Math.max(0, lineGross - lineDiscount);
            const qty = item.quantity || 0;
            const unitPrice = qty > 0 ? round2(netGross / qty) : round2(item.price || 0);
            return {
                itemId: item.itemId,
                name: item.name,
                barcode: item.barcode,
                price: unitPrice,
                quantity: item.quantity,
                vatRate: getItemVatRate(item)
            };
        });
        const netSubtotal = grandTotal;

        const orderData = {
            customerName: finalCustomerName,
            phoneNumber: finalMobileNumber,
            cartItems: netCartItems,
            subtotal: netSubtotal,
            tax,
            grandTotal,
            paymentMethod: paymentMode.toUpperCase()
        }
        let splitCashAmount = 0;
        let splitCardAmount = 0;
        if (paymentMode === "split") {
            const cashAmount = Number(splitAmounts?.cashAmount);
            const cardAmount = Number(splitAmounts?.cardAmount);
            if (!Number.isFinite(cashAmount) || cashAmount < 0) {
                toast.error("Невалидна сума в брой");
                return;
            }
            if (!Number.isFinite(cardAmount) || cardAmount < 0) {
                toast.error("Сумата с карта не може да е отрицателна");
                return;
            }
            if (round2(cashAmount + cardAmount) !== round2(grandTotal)) {
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
            if (paymentMode === 'split') {
                setShowSplitModal(true);
            }
            return;
        }
        setIsProcessing(true);
        try {
            // Card / split-with-card: approve POS before order + fiscal (sim order for real POS later)
            let cardPaymentDetails = null;
            if (paymentMode === "card" || (paymentMode === "split" && splitCardAmount > 0)) {
                const amount = paymentMode === "card" ? grandTotal : splitCardAmount;
                try {
                    // Temporary order id for POS sim — real terminal will use pre-auth / then create order
                    const initResp = await initiatePosPayment({
                        orderId: `PENDING-${Date.now()}`,
                        amount,
                        currency: SHOP_CURRENCY
                    });
                    const result = initResp.data;
                    if (result.status !== 'APPROVED') {
                        toast.error(paymentMode === "card" ? "Картово плащане отказано" : "Картова част: отказана");
                        return;
                    }
                    cardPaymentDetails = {
                        posTransactionId: result.transactionId,
                        authCode: result.authCode,
                        status: result.status,
                        ...(paymentMode === "split" ? { cashAmount: splitCashAmount, cardAmount: splitCardAmount } : {})
                    };
                    if (paymentMode === "card") {
                        toast.success("Картово плащане одобрено");
                    } else {
                        toast.success("Картова част: одобрена");
                    }
                } catch (err) {
                    console.error(err);
                    toast.error(paymentMode === "card" ? "Грешка при картово плащане" : "Грешка при картовата част");
                    return;
                }
            }

            if (paymentMode === "split" && splitCashAmount > 0) {
                toast.success(`Прието в брой: ${formatMoney(splitCashAmount)}`);
            }

            const response = await createOrder(orderData);
            const savedData = response.data;
            
            // Фискализация след одобрение (при карта) — при неуспех отменяме продажбата
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
            
            if (response.status === 201 && paymentMode === "cash") {
                toast.success("Плащане в брой прието");
                openReceipt(savedData);
            } else if (response.status === 201 && paymentMode === "card") {
                openReceipt({
                    ...savedData,
                    paymentDetails: cardPaymentDetails
                });
            } else if (response.status === 201 && paymentMode === "split") {
                openReceipt({
                    ...savedData,
                    paymentMethod: 'SPLIT',
                    paymentDetails: {
                        ...(savedData.paymentDetails || {}),
                        status: cardPaymentDetails?.status || 'COMPLETED',
                        ...(cardPaymentDetails || {}),
                        cashAmount: splitCashAmount,
                        cardAmount: splitCardAmount
                    }
                });
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
                    totalPrice: round2((item.price || 0) * (item.quantity || 0)),
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

    const splitModal = showSplitModal && createPortal(
        <div
            className="qty-numpad-overlay"
            role="presentation"
            onClick={() => !isProcessing && closeSplitModal()}
        >
            <div
                className="qty-numpad-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="split-numpad-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="qty-numpad-header">
                    <h6 id="split-numpad-title" className="qty-numpad-title">
                        Съвместно плащане — сума в брой
                    </h6>
                    <button
                        type="button"
                        className="qty-numpad-close"
                        onClick={closeSplitModal}
                        aria-label="Затвори"
                        disabled={isProcessing}
                    >
                        ×
                    </button>
                </div>
                <div className="split-numpad-meta">
                    <span>Общо: <strong>{formatMoney(grandTotal)}</strong></span>
                    <span>Карта: <strong>{formatMoney(Math.max(0, splitCardPreview))}</strong></span>
                </div>
                <div className="qty-numpad-display" aria-live="polite">
                    {splitCashDraft === '' ? '0' : splitCashDraft}
                </div>
                <div className="split-numpad-quick">
                    <button
                        type="button"
                        className="btn btn-outline-warning"
                        onClick={() => {
                            setSplitCashDraft(String(grandTotal.toFixed(2)));
                            replaceSplitKeyRef.current = true;
                        }}
                        disabled={isProcessing}
                    >
                        Всичко в брой
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline-light"
                        onClick={() => appendSplitKey('C')}
                        disabled={isProcessing}
                    >
                        Изчисти
                    </button>
                </div>
                <div className="qty-numpad" role="group" aria-label="Цифрова клавиатура за сума в брой">
                    {['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫'].map((key) => (
                        <button
                            key={key}
                            type="button"
                            className="qty-numpad-key"
                            onClick={() => appendSplitKey(key)}
                            disabled={isProcessing}
                        >
                            {key}
                        </button>
                    ))}
                    <button
                        type="button"
                        className="qty-numpad-key qty-numpad-clear"
                        onClick={() => appendSplitKey('C')}
                        disabled={isProcessing}
                    >
                        Изчисти
                    </button>
                </div>
                <div className="qty-numpad-actions">
                    <button
                        type="button"
                        className="btn btn-outline-light qty-numpad-action"
                        onClick={closeSplitModal}
                        disabled={isProcessing}
                    >
                        Отказ
                    </button>
                    <button
                        type="button"
                        className="btn btn-warning qty-numpad-action"
                        onClick={confirmSplitPayment}
                        disabled={isProcessing}
                    >
                        Потвърди
                    </button>
                </div>
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
            {splitModal}

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
