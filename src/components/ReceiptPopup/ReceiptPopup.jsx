import './ReceiptPopup.css';
import './Print.css';
import { createPortal } from 'react-dom';
import { formatMoney } from '../../util/formatMoney.js';

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
        case 'SPLIT':
            return 'СЪВМЕСТНО';
        case 'BANK_TRANSFER':
        case 'BANK':
            return 'БАНКОВ ПРЕВОД';
        case 'VOUCHER':
            return 'ВАУЧЕР';
        default:
            return method || '-';
    }
};

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Group VAT by rate; amounts rounded to 2 decimals per group (receipt display). */
const groupByVat = (items = []) => {
    const groups = {};
    items.forEach(i => {
        const rate = Number(i.vatRate ?? 0.20);
        const key = `${Math.round(rate * 100)}`;
        const qty = i.quantity ?? 0;
        const unit = i.price ?? i.unitPrice ?? 0;
        const lineTotal = unit * qty;
        const base = rate > 0 ? lineTotal / (1 + rate) : lineTotal;
        const vatAmount = lineTotal - base;
        if (!groups[key]) groups[key] = { base: 0, vat: 0 };
        groups[key].base += base;
        groups[key].vat += vatAmount;
    });
    Object.keys(groups).forEach((k) => {
        groups[k].base = round2(groups[k].base);
        groups[k].vat = round2(groups[k].vat);
    });
    return groups;
};

const sumVatFromGroups = (groups) =>
    round2(Object.values(groups).reduce((s, g) => s + (g.vat || 0), 0));

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Build standalone HTML for print (same approach as reports — no SPA CSS conflicts). */
export const buildReceiptPrintHtml = (orderDetails) => {
    const items = orderDetails?.items || [];
    const vatGroups = groupByVat(items);
    const taxFromGroups = sumVatFromGroups(vatGroups);
    const taxTotal = orderDetails?.tax != null && orderDetails.tax !== ''
        ? round2(orderDetails.tax)
        : taxFromGroups;
    const name = (orderDetails.customerName || '').trim();
    const phone = (orderDetails.phoneNumber || '').trim();
    const showName = name && name !== 'Случаен клиент';
    const showPhone = phone && phone !== '0000000000';

    const itemsHtml = items.map((item) => `
        <tr>
            <td>${escapeHtml(item.name)} x${escapeHtml(item.quantity)}</td>
            <td style="text-align:right">${escapeHtml(formatMoney((item.price || 0) * (item.quantity || 0)))}</td>
        </tr>`).join('');

    const vatHtml = Object.keys(vatGroups).sort((a, b) => Number(b) - Number(a)).map((k) =>
        `<div>Ставка ${escapeHtml(k)}%: Основа ${escapeHtml(formatMoney(vatGroups[k].base))} | ДДС ${escapeHtml(formatMoney(vatGroups[k].vat))}</div>`
    ).join('');

    let paymentExtra = '';
    const method = (orderDetails.paymentMethod || '').toString().toUpperCase();
    if (method === 'SPLIT') {
        const cash = orderDetails.paymentDetails?.cashAmount || 0;
        const card = orderDetails.paymentDetails?.cardAmount || 0;
        paymentExtra += `<p><strong>В брой:</strong> ${escapeHtml(formatMoney(cash))}</p>`;
        paymentExtra += `<p><strong>С карта:</strong> ${escapeHtml(formatMoney(card))}</p>`;
    }
    if (method === 'CARD' || method === 'CREDIT_CARD' || method === 'DEBIT_CARD' || method === 'SPLIT') {
        const auth = orderDetails.paymentDetails?.authCode || orderDetails.paymentDetails?.posAuthCode;
        const txn = orderDetails.paymentDetails?.posTransactionId;
        if (auth || txn) {
            paymentExtra += `<p><strong>Auth code:</strong> ${escapeHtml(auth || '-')}</p>`;
            paymentExtra += `<p><strong>Txn ID:</strong> ${escapeHtml(txn || '-')}</p>`;
        }
    }
    if (orderDetails.originalOrderId) {
        paymentExtra += `<p><strong>Сторно към:</strong> ${escapeHtml(orderDetails.originalOrderId)}</p>`;
    }

    return `<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="utf-8"/>
  <title>Касова бележка - ${escapeHtml(orderDetails.orderId)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 16px; color: #000; background: #fff; }
    h2 { text-align: center; margin: 0 0 12px; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    td { padding: 4px 0; border-bottom: 1px solid #ddd; font-size: 13px; }
    .totals td { border-bottom: none; padding: 3px 0; }
    .muted { font-size: 12px; color: #333; margin: 6px 0; }
    hr { border: none; border-top: 1px solid #000; margin: 10px 0; }
    @media print { body { margin: 8mm; } @page { size: portrait; margin: 8mm; } }
  </style>
</head>
<body>
  <h2>Касова бележка</h2>
  <p><strong>Номер на поръчка:</strong> ${escapeHtml(orderDetails.orderId)}</p>
  ${showName ? `<p><strong>Клиент:</strong> ${escapeHtml(name)}</p>` : ''}
  ${showPhone ? `<p><strong>Телефон:</strong> ${escapeHtml(phone)}</p>` : ''}
  <hr/>
  <p><strong>Поръчани артикули</strong></p>
  <table>${itemsHtml}</table>
  <hr/>
  <table class="totals">
    <tr><td><strong>Обща сума (с ДДС):</strong></td><td style="text-align:right">${escapeHtml(formatMoney(orderDetails.subtotal))}</td></tr>
    <tr><td><strong>ДДС:</strong></td><td style="text-align:right">${escapeHtml(formatMoney(taxTotal))}</td></tr>
    <tr><td><strong>Крайна сума за плащане:</strong></td><td style="text-align:right">${escapeHtml(formatMoney(orderDetails.grandTotal))}</td></tr>
  </table>
  <div class="muted">${vatHtml}</div>
  <p><strong>Метод на плащане:</strong> ${escapeHtml(getPaymentMethodLabel(orderDetails.paymentMethod))}</p>
  ${paymentExtra}
</body>
</html>`;
};

export const printReceiptInNewWindow = (orderDetails) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        throw new Error('POPUP_BLOCKED');
    }
    printWindow.document.write(buildReceiptPrintHtml(orderDetails));
    printWindow.document.close();
    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
    }, 250);
};

const ReceiptPopup = ({orderDetails, onClose, onPrint}) => {
    const vatGroups = groupByVat(orderDetails?.items || []);
    const taxFromGroups = sumVatFromGroups(vatGroups);
    // Prefer server/order tax (already after loyalty) over recompute from lines
    const taxTotal = orderDetails?.tax != null && orderDetails.tax !== ''
        ? round2(orderDetails.tax)
        : taxFromGroups;

    const handlePrintClick = () => {
        try {
            printReceiptInNewWindow(orderDetails);
            if (typeof onPrint === 'function') {
                onPrint();
            }
        } catch (e) {
            if (e?.message === 'POPUP_BLOCKED') {
                // Fallback: same-page print (Print.css + scoped LabelTemplates)
                if (typeof onPrint === 'function') {
                    onPrint({ fallbackSamePage: true });
                } else {
                    window.print();
                }
            } else {
                console.error(e);
                window.print();
            }
        }
    };

    const content = (
        <div className="receipt-popup-overlay text-dark">
            <div className="receipt-popup">
                <div className="text-center mb-4 no-print">
                    <i className="bi bi-check-circle-fill text-success fs-1"></i>
                </div>
                <h3 className="text-center mb-4">Касова бележка</h3>
                <p>
                    <strong>Номер на поръчка:</strong> {orderDetails.orderId}
                </p>
                {(() => {
                    const name = (orderDetails.customerName || '').trim();
                    const phone = (orderDetails.phoneNumber || '').trim();
                    const showName = name && name !== 'Случаен клиент';
                    const showPhone = phone && phone !== '0000000000';
                    if (!showName && !showPhone) return null;
                    return (
                        <>
                            {showName && (
                                <p>
                                    <strong>Клиент:</strong> {name}
                                </p>
                            )}
                            {showPhone && (
                                <p>
                                    <strong>Телефон:</strong> {phone}
                                </p>
                            )}
                        </>
                    );
                })()}
                <hr className="my-3" />
                <h5 className="mb-3">Поръчани артикули</h5>
                <div className="cart-items-scrollable">
                    {(orderDetails.items || []).map((item, index) => (
                        <div key={index} className="d-flex justify-content-between mb-2">
                            <span>{item.name} x{item.quantity}</span>
                            <span>{formatMoney((item.price * item.quantity))}</span>
                        </div>
                    ))}
                </div>
                <hr className="my-3" />
                <div className="d-flex justify-content-between mb-2">
                    <span>
                        <strong>Обща сума (с ДДС):</strong>
                    </span>
                    <span>{formatMoney(orderDetails.subtotal)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                    <span>
                        <strong>ДДС :</strong>
                    </span>
                    <span>{formatMoney(taxTotal)}</span>
                </div>
                <div className="mb-2">
                    <small>
                        {Object.keys(vatGroups).sort((a, b) => Number(b) - Number(a)).map((k) => (
                            <div key={k}>
                                Ставка {k}%: Основа {formatMoney(vatGroups[k].base)} | ДДС {formatMoney(vatGroups[k].vat)}
                            </div>
                        ))}
                    </small>
                </div>
                <div className="d-flex justify-content-between mb-4">
                    <span>
                        <strong>Крайна сума за плащане:</strong>
                    </span>
                    <span>{formatMoney(orderDetails.grandTotal)}</span>
                </div>
                <p>
                    <strong>Метод на плащане: </strong> {getPaymentMethodLabel(orderDetails.paymentMethod)}
                </p>
                {
                    orderDetails.paymentMethod === 'SPLIT' && (
                        <>
                            <p>
                                <strong>В брой: </strong> {formatMoney(orderDetails.paymentDetails?.cashAmount || 0)}
                            </p>
                            <p>
                                <strong>С карта: </strong> {formatMoney(orderDetails.paymentDetails?.cardAmount || 0)}
                            </p>
                            <p>
                                <small>Сбор: {formatMoney((orderDetails.paymentDetails?.cashAmount || 0) + (orderDetails.paymentDetails?.cardAmount || 0))}</small>
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
                <div className="d-flex justify-content-end gap-3 mt-4 no-print">
                    <button className="btn btn-warning" onClick={handlePrintClick}>Печат</button>
                    <button className="btn btn-danger" onClick={onClose}>Затвори</button>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}

export default ReceiptPopup;
