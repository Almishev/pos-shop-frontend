import './CustomerDisplay.css';
import {useEffect, useRef, useState} from "react";
import {
    createIdleDisplayState,
    readStoredDisplayState,
    subscribeDisplayState,
} from "../../util/customerDisplaySync.js";
import {formatMoney} from "../../util/formatMoney.js";

const THANK_YOU_MS = 5000;

const paymentLabel = (method) => {
    if (!method) return "";
    const m = String(method).toUpperCase();
    if (m === "CASH") return "В брой";
    if (m === "CARD") return "С карта";
    if (m === "SPLIT") return "Смесено";
    return method;
};

const CustomerDisplay = () => {
    const [state, setState] = useState(() => readStoredDisplayState() || createIdleDisplayState());
    const thankYouUntilRef = useRef(0);
    const thankYouTimerRef = useRef(null);

    useEffect(() => {
        document.body.classList.add("customer-display-active");
        return () => {
            document.body.classList.remove("customer-display-active");
            if (thankYouTimerRef.current) {
                clearTimeout(thankYouTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const apply = (next) => {
            if (!next?.type) return;
            const now = Date.now();

            if (next.type === "thankYou") {
                thankYouUntilRef.current = now + THANK_YOU_MS;
                setState(next);
                if (thankYouTimerRef.current) clearTimeout(thankYouTimerRef.current);
                thankYouTimerRef.current = setTimeout(() => {
                    setState(createIdleDisplayState());
                    thankYouUntilRef.current = 0;
                }, THANK_YOU_MS);
                return;
            }

            if (now < thankYouUntilRef.current && next.type === "idle") {
                return;
            }

            if (thankYouTimerRef.current && next.type !== "idle") {
                clearTimeout(thankYouTimerRef.current);
                thankYouTimerRef.current = null;
                thankYouUntilRef.current = 0;
            }

            setState(next);
        };

        return subscribeDisplayState(apply);
    }, []);

    const items = state.cartItems || [];
    const lastItem = state.lastItem;
    const discount = Number(state.loyaltyDiscount) || 0;

    return (
        <div className={`cfd cfd-${state.type || "idle"}`}>
            <header className="cfd-header">
                <div className="cfd-brand">Supermarket POS</div>
                <div className="cfd-clock">
                    {new Date(state.updatedAt || Date.now()).toLocaleTimeString("bg-BG", {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </div>
            </header>

            {state.type === "idle" && (
                <main className="cfd-main cfd-idle">
                    <p className="cfd-welcome">Добре дошли</p>
                    <p className="cfd-hint">Очакваме следващия клиент</p>
                </main>
            )}

            {state.type === "sale" && (
                <main className="cfd-main cfd-sale">
                    {lastItem && (
                        <section className="cfd-last-item" aria-live="polite">
                            <div className="cfd-last-name">{lastItem.name}</div>
                            <div className="cfd-last-meta">
                                <span>× {lastItem.quantity}</span>
                                <span>{formatMoney((lastItem.price || 0) * (lastItem.quantity || 0))}</span>
                            </div>
                        </section>
                    )}
                    <ul className="cfd-lines">
                        {items.map((item, idx) => (
                            <li key={`${item.itemId || item.name}-${idx}`} className="cfd-line">
                                <span className="cfd-line-name">
                                    {item.name}
                                    <span className="cfd-line-qty"> × {item.quantity}</span>
                                </span>
                                <span className="cfd-line-price">
                                    {formatMoney((item.price || 0) * (item.quantity || 0))}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <footer className="cfd-totals">
                        {discount > 0 && (
                            <div className="cfd-total-row cfd-discount">
                                <span>Отстъпка</span>
                                <span>−{formatMoney(discount)}</span>
                            </div>
                        )}
                        <div className="cfd-total-row cfd-grand">
                            <span>Общо</span>
                            <span>{formatMoney(state.grandTotal)}</span>
                        </div>
                    </footer>
                </main>
            )}

            {state.type === "payment" && (
                <main className="cfd-main cfd-payment">
                    <p className="cfd-payment-label">За плащане</p>
                    <p className="cfd-payment-amount">{formatMoney(state.grandTotal)}</p>
                    {discount > 0 && (
                        <p className="cfd-payment-discount">Отстъпка −{formatMoney(discount)}</p>
                    )}
                </main>
            )}

            {state.type === "thankYou" && (
                <main className="cfd-main cfd-thanks">
                    <p className="cfd-thanks-title">Благодарим ви!</p>
                    <p className="cfd-payment-amount">{formatMoney(state.grandTotal)}</p>
                    {state.paymentMethod && (
                        <p className="cfd-payment-method">{paymentLabel(state.paymentMethod)}</p>
                    )}
                </main>
            )}
        </div>
    );
};

export default CustomerDisplay;
