import './CartItems.css';
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
        setShowQtyModal(true);
    };

    const closeQtyModal = () => {
        setShowQtyModal(false);
        setActiveItem(null);
        setTempQty('1');
    };

    const saveQty = () => {
        const normalized = (tempQty || '').toString().replace(',', '.').trim();
        if (!/^\d*(?:\.\d{0,2})?$/.test(normalized) || normalized === '') {
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
        <div className="cart-items-inner p-3 h-100">
            {cartItems.length === 0 ? (
                <p className="text-light">
                    Количката е празна.
                </p>
            ) : (
                <div className="cart-items-list">
                    {cartItems.map((item) => (
                        <div
                            key={item.itemId}
                            ref={(node) => {
                                if (node) itemRefs.current[item.itemId] = node;
                                else delete itemRefs.current[item.itemId];
                            }}
                            className="cart-item mb-3 p-3 bg-dark rounded"
                        >
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="mb-0 text-light">{item.name}</h6>
                                <p className="mb-0 text-light">
                                    {formatMoney(item.price * item.quantity)}
                                </p>
                            </div>
                            {item.barcode && (
                                <div className="mb-2">
                                    <small className="text-light">
                                        <i className="bi bi-upc-scan"></i> {item.barcode}
                                    </small>
                                </div>
                            )}
                            <div className="d-flex justify-content-between align-item-center">
                                <div className="d-flex align-items center gap-2">
                                    <button className="btn btn-danger btn-sm"
                                        onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                                        disabled={item.quantity === 1}>
                                        <i className="bi bi-dash"></i>
                                    </button>
                                    <span className="text-light">{item.quantity}</span>
                                    <button className="btn btn-primary btn-sm" onClick={() => updateQuantity(item.itemId, item.quantity + 1)}>
                                        <i className="bi bi-plus"></i>
                                    </button>
                                    <button className="btn btn-outline-light btn-sm" title="Задай количество" onClick={() => openQtyModal(item)}>
                                        <i className="bi bi-keyboard"></i>
                                    </button>
                                </div>
                                <button className="btn btn-danger btn-sm" style={{width: "auto"}} onClick={() => removeFromCart(item.itemId)}>
                                    <i className="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* Quantity Modal */}
            {showQtyModal && (
                <div className="modal d-block" tabIndex="-1" style={{background: 'rgba(0,0,0,0.6)'}}>
                    <div className="modal-dialog modal-sm modal-dialog-centered">
                        <div className="modal-content bg-dark text-light">
                            <div className="modal-header border-secondary">
                                <h6 className="modal-title">Задаване на количество</h6>
                                <button type="button" className="btn-close btn-close-white" onClick={closeQtyModal}></button>
                            </div>
                            <div className="modal-body">
                                <label className="modal-title text-light d-block">Количество (до 2 десетични знака)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    className="form-control"
                                    value={tempQty}
                                    onChange={(e)=>setTempQty(e.target.value)}
                                    onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); saveQty(); } }}
                                    autoFocus
                                />
                            </div>
                            <div className="modal-footer border-secondary">
                                <button type="button" className="btn btn-secondary" onClick={closeQtyModal}>Отказ</button>
                                <button type="button" className="btn btn-primary" onClick={saveQty}>Запази</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CartItems;
