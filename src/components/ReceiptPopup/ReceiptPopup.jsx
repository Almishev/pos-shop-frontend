import './ReceiptPopup.css';
import './Print.css';

const ReceiptPopup = ({orderDetails, onClose, onPrint}) => {
    const formatBGN = (amount) => new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'BGN' }).format(amount || 0);
    const getPaymentMethodLabel = (method) => {
        const key = (method || '').toString().toUpperCase();
        switch (key) {
            case 'CASH':
            case 'CASH_PAYMENT':
                return 'В БРОЙ';
            case 'CARD':
            case 'CREDIT_CARD':
            case 'DEBIT_CARD':
                return 'КАРТА';
            case 'UPI':
            case 'ONLINE':
            case 'RAZORPAY':
                return 'ОНЛАЙН ПЛАЩАНЕ';
            case 'BANK_TRANSFER':
            case 'BANK':
                return 'БАНКОВ ПРЕВОД';
            case 'VOUCHER':
                return 'ВАУЧЕР';
            default:
                return method || '-';
        }
    };
    const groupByVat = (items = []) => {
        const groups = {};
        items.forEach(i => {
            const rate = (i.vatRate ?? 0.20);
            const key = `${Math.round(rate * 100)}`; // "20", "9", "0"
            const qty = i.quantity ?? 0;
            const unit = i.price ?? i.unitPrice ?? 0;
            const lineTotal = unit * qty; // assuming price is gross (incl. VAT)
            const base = rate >= 0 ? lineTotal / (1 + rate) : 0;
            const vatAmount = lineTotal - base;
            if (!groups[key]) groups[key] = { base: 0, vat: 0 };
            groups[key].base += base;
            groups[key].vat += vatAmount;
        });
        return groups;
    };
    const vatGroups = groupByVat(orderDetails?.items || []);
    return (
        <div className="receipt-popup-overlay text-dark">
            <div className="receipt-popup">
                <div className="text-center mb-4">
                    <i className="bi bi-check-circle-fill text-success fs-1"></i>
                </div>
                <h3 className="text-center mb-4">Касова бележка</h3>
                <p>
                    <strong>Номер на поръчка:</strong> {orderDetails.orderId}
                </p>
                <p>
                    <strong>Име:</strong> {orderDetails.customerName}
                </p>
                <p>
                    <strong>Телефон:</strong> {orderDetails.phoneNumber}
                </p>
                <hr className="my-3" />
                <h5 className="mb-3">Поръчани артикули</h5>
                <div className="cart-items-scrollable">
                    {orderDetails.items.map((item, index) => (
                        <div key={index} className="d-flex justify-content-between mb-2">
                            <span>{item.name} x{item.quantity}</span>
                            <span>{formatBGN((item.price * item.quantity))}</span>
                        </div>
                    ))}
                </div>
                <hr className="my-3" />
                <div className="d-flex justify-content-between mb-2">
                    <span>
                        <strong>Обща сума (с ДДС):</strong>
                    </span>
                    <span>{formatBGN(orderDetails.subtotal)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                    <span>
                        <strong>ДДС :</strong>
                    </span>
                    <span>{formatBGN(orderDetails.tax)}</span>
                </div>
                <div className="mb-2">
                    <small>
                        {Object.keys(vatGroups).map((k) => (
                            <div key={k}>
                                Ставка {k}%: Основа {formatBGN(vatGroups[k].base)} | ДДС {formatBGN(vatGroups[k].vat)}
                            </div>
                        ))}
                    </small>
                </div>
                <div className="d-flex justify-content-between mb-4">
                    <span>
                        <strong>Крайна сума за плащане:</strong>
                    </span>
                    <span>{formatBGN(orderDetails.grandTotal)}</span>
                </div>
                <p>
                    <strong>Метод на плащане: </strong> {getPaymentMethodLabel(orderDetails.paymentMethod)}
                </p>
                {
                    orderDetails.paymentMethod === 'SPLIT' && (
                        <>
                            <p>
                                <strong>В брой: </strong> {formatBGN(orderDetails.paymentDetails?.cashAmount || 0)}
                            </p>
                            <p>
                                <strong>С карта: </strong> {formatBGN(orderDetails.paymentDetails?.cardAmount || 0)}
                            </p>
                            <p>
                                <small>Сбор: {formatBGN((orderDetails.paymentDetails?.cashAmount || 0) + (orderDetails.paymentDetails?.cardAmount || 0))}</small>
                            </p>
                            {(orderDetails.paymentDetails?.posTransactionId || orderDetails.paymentDetails?.authCode || orderDetails.paymentDetails?.posAuthCode) && (
                                <>
                                    <p>
                                        <strong>Auth code: </strong> {orderDetails.paymentDetails?.authCode || orderDetails.paymentDetails?.posAuthCode || '-'}
                                    </p>
                                    <p>
                                        <strong>Txn ID: </strong> {orderDetails.paymentDetails?.posTransactionId || '-'}
                                    </p>
                                </>
                            )}
                        </>
                    )
                }
                {orderDetails.originalOrderId && (
                    <p>
                        <strong>Сторно към:</strong> {orderDetails.originalOrderId}
                    </p>
                )}
                {
                    (orderDetails.paymentMethod === 'CARD' || orderDetails.paymentMethod === 'CREDIT_CARD' || orderDetails.paymentMethod === 'DEBIT_CARD') && (
                        <>
                            <p>
                                <strong>Auth code: </strong> {orderDetails.paymentDetails?.authCode || orderDetails.paymentDetails?.posAuthCode || '-'}
                            </p>
                            <p>
                                <strong>Txn ID: </strong> {orderDetails.paymentDetails?.posTransactionId || '-'}
                            </p>
                        </>
                    )
                }
                {
                    orderDetails.paymentMethod === "UPI" && (
                        <>
                            <p>
                                <strong>Razorpay Поръчка: </strong> {orderDetails.razorpayOrderId}
                            </p>
                            <p>
                                <strong>Razorpay Плащане: </strong> {orderDetails.razorpayPaymentId}
                            </p>
                        </>
                    )
                }
                <div className="d-flex justify-content-end gap-3 mt-4">
                    <button className="btn btn-warning" onClick={onPrint}>Печат</button>
                    <button className="btn btn-danger" onClick={onClose}>Затвори</button>
                </div>
            </div>
        </div>
    )
}

export default ReceiptPopup;