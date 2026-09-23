import './CartItems.css';
import '../shared/QtyNumpad.css';
import {useContext, useEffect, useRef, useState} from "react";
import {AppContext} from "../../context/AppContext.jsx";
import { formatMoney } from "../../util/formatMoney.js";

const CartItems = () => {
    const {cartItems, removeFromCart, updateQuantity} = useContext(AppContext);
    const prevCartRef = useRef([]);
    const itemRefs = useRef({});

    const [showQtyModal, setShowQtyModal] = useState(false);
    const [activeItem, setActiveItem] = useState(null);
    const [tempQty, setTempQty] = useState('1');
    const replaceOnNextKeyRef = useRef(true);

    useEffect(() => {
        const prev = prevCartRef.current;
        let targetId = null;

        if (cartItems.length > prev.length) {
            targetId = cartItems[cartItems.length - 1]?.itemId;
        } else {
            for (const item of cartItems) {
                const old = prev.find((p) => p.itemId === item.itemId);
                if (old && item.quantity > old.quantity) {
                    targetId = item.itemId;
                    break;
                }
            }
        }

        prevCartRef.current = cartItems.map((i) => ({
            itemId: i.itemId,
            quantity: i.quantity,
        }));

        if (!targetId) return;

        requestAnimationFrame(() => {
            const el = itemRefs.current[targetId];
            if (!el) return;
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        });
    }, [cartItems]);

    const openQtyModal = (item) => {
        setActiveItem(item);
        setTempQty(String(item.quantity ?? 1));
        replaceOnNextKeyRef.current = true;
        setShowQtyModal(true);
    };

    const closeQtyModal = () => {
        setShowQtyModal(false);
        setActiveItem(null);
        setTempQty('1');
        replaceOnNextKeyRef.current = true;
    };

    const isValidQtyDraft = (value) => /^\d*(?:\.\d{0,2})?$/.test(value);

    const appendQtyKey = (key) => {
        setTempQty((prev) => {
            const current = (prev ?? '').toString();
            if (key === 'C') {
                replaceOnNextKeyRef.current = false;
                return '';
            }
            if (key === '⌫') {
                replaceOnNextKeyRef.current = false;
                return current.slice(0, -1);
            }
            if (key === '.') {
                const replace = replaceOnNextKeyRef.current;
                replaceOnNextKeyRef.current = false;
                if (replace) return '0.';
                if (current.includes('.')) return current;
                return current === '' ? '0.' : `${current}.`;
            }
            if (replaceOnNextKeyRef.current) {
                replaceOnNextKeyRef.current = false;
                return key;
            }
            if (current === '0') return key;
            const next = `${current}${key}`;
            return isValidQtyDraft(next) ? next : current;
        });
    };

    // Physical keyboard → same as on-screen numpad
    useEffect(() => {
        if (!showQtyModal) return;
        const onKeyDown = (e) => {
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                closeQtyModal();
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                saveQty();
                return;
            }
            if (e.key === 'Backspace') {
                e.preventDefault();
                e.stopPropagation();
                appendQtyKey('⌫');
                return;
            }
            if (e.key === 'Delete') {
                e.preventDefault();
                e.stopPropagation();
                appendQtyKey('C');
                return;
            }
            if (e.key === '.' || e.key === ',') {
                e.preventDefault();
                e.stopPropagation();
                appendQtyKey('.');
                return;
            }
            if (/^[0-9]$/.test(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                appendQtyKey(e.key);
            }
        };
        document.addEventListener('keydown', onKeyDown, true);
        return () => document.removeEventListener('keydown', onKeyDown, true);
    }, [showQtyModal, tempQty, activeItem]);

    const saveQty = () => {
        const normalized = (tempQty || '').toString().replace(',', '.').trim();
        if (!isValidQtyDraft(normalized) || normalized === '' || normalized === '.') {
            return alert('Невалидно количество. Пример: 1, 2.5, 0.25');
        }
        const value = parseFloat(normalized);
        if (isNaN(value) || value <= 0) {
            return alert('Количеството трябва да е по-голямо от 0');
        }
        updateQuantity(activeItem.itemId, value);
        closeQtyModal();
    };

    return (
        <div className="cart-items-inner">
            {cartItems.length === 0 ? (
                <p className="text-secondary mb-0 px-1">Количката е празна.</p>
            ) : (
                <div className="cart-items-list">
                    {cartItems.map((item) => (
                        <div
                            key={item.itemId}
                            ref={(node) => {
                                if (node) itemRefs.current[item.itemId] = node;
                                else delete itemRefs.current[item.itemId];
                            }}
                            className="cart-item-row"
                        >
                            <div className="cart-item-main">
                                <div className="cart-item-info min-width-0">
                                    <span className="cart-item-name text-truncate" title={item.name}>{item.name}</span>
                                    {item.barcode && (
                                        <span className="cart-item-barcode text-truncate">
                                            <i className="bi bi-upc-scan"></i> {item.barcode}
                                        </span>
                                    )}
                                </div>
                                <span className="cart-item-line-total">{formatMoney(item.price * item.quantity)}</span>
                            </div>
                            <div className="cart-item-actions">
                                <button
                                    className="btn btn-outline-light btn-sm cart-qty-btn"
                                    onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                                    disabled={item.quantity === 1}
                                    title="Намали"
                                >
                                    <i className="bi bi-dash"></i>
                                </button>
                                <button
                                    type="button"
                                    className="cart-qty-value cart-qty-value-btn"
                                    title="Задай количество"
                                    onClick={() => openQtyModal(item)}
                                >
                                    {item.quantity}
                                </button>
                                <button
                                    className="btn btn-outline-light btn-sm cart-qty-btn"
                                    onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                                    title="Увеличи"
                                >
                                    <i className="bi bi-plus"></i>
                                </button>
                                <button
                                    className="btn btn-outline-warning btn-sm cart-qty-btn cart-qty-btn-keyboard"
                                    title="Цифрова клавиатура"
                                    onClick={() => openQtyModal(item)}
                                >
                                    <i className="bi bi-keyboard"></i>
                                </button>
                                <button
                                    className="btn btn-outline-danger btn-sm cart-qty-btn"
                                    onClick={() => removeFromCart(item.itemId)}
                                    title="Премахни"
                                >
                                    <i className="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showQtyModal && (
                <div className="qty-numpad-overlay" role="presentation" onClick={closeQtyModal}>
                    <div
                        className="qty-numpad-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="qty-numpad-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="qty-numpad-header">
                            <h6 id="qty-numpad-title" className="qty-numpad-title">
                                Количество{activeItem?.name ? `: ${activeItem.name}` : ''}
                            </h6>
                            <button type="button" className="qty-numpad-close" onClick={closeQtyModal} aria-label="Затвори">
                                ×
                            </button>
                        </div>
                        <div className="qty-numpad-display" aria-live="polite">
                            {tempQty === '' ? '0' : tempQty}
                        </div>
                        <div className="qty-numpad" role="group" aria-label="Цифрова клавиатура">
                            {['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫'].map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    className="qty-numpad-key"
                                    onClick={() => appendQtyKey(key)}
                                >
                                    {key}
                                </button>
                            ))}
                            <button
                                type="button"
                                className="qty-numpad-key qty-numpad-clear"
                                onClick={() => appendQtyKey('C')}
                            >
                                Изчисти
                            </button>
                        </div>
                        <div className="qty-numpad-actions">
                            <button type="button" className="btn btn-outline-light qty-numpad-action" onClick={closeQtyModal}>
                                Отказ
                            </button>
                            <button type="button" className="btn btn-warning qty-numpad-action" onClick={saveQty}>
                                Запази
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CartItems;
