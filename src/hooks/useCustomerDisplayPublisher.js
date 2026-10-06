import {useEffect, useRef} from "react";
import {publishDisplayState} from "../util/customerDisplaySync.js";

/**
 * Publishes cashier cart/payment state to the customer display window.
 */
export function useCustomerDisplayPublisher({
    cartItems = [],
    subtotal = 0,
    tax = 0,
    grandTotal = 0,
    loyaltyDiscount = 0,
    paymentOpen = false,
    isProcessing = false,
    thankYou = null,
}) {
    const lastItemRef = useRef(null);
    const prevLenRef = useRef(0);

    useEffect(() => {
        const len = cartItems.length;
        if (len > prevLenRef.current && len > 0) {
            lastItemRef.current = cartItems[len - 1];
        } else if (len === 0) {
            lastItemRef.current = null;
        } else if (len > 0) {
            lastItemRef.current = cartItems[len - 1];
        }
        prevLenRef.current = len;
    }, [cartItems]);

    useEffect(() => {
        if (thankYou) {
            publishDisplayState({
                type: "thankYou",
                cartItems: thankYou.cartItems || [],
                subtotal: thankYou.subtotal ?? 0,
                tax: thankYou.tax ?? 0,
                grandTotal: thankYou.grandTotal ?? 0,
                loyaltyDiscount: thankYou.loyaltyDiscount ?? 0,
                paymentMethod: thankYou.paymentMethod || null,
                lastItem: null,
            });
            return;
        }

        if (paymentOpen || isProcessing) {
            publishDisplayState({
                type: "payment",
                cartItems,
                subtotal,
                tax,
                grandTotal,
                loyaltyDiscount,
                paymentMethod: null,
                lastItem: lastItemRef.current,
            });
            return;
        }

        if (!cartItems.length) {
            publishDisplayState({ type: "idle" });
            return;
        }

        publishDisplayState({
            type: "sale",
            cartItems,
            subtotal,
            tax,
            grandTotal,
            loyaltyDiscount,
            paymentMethod: null,
            lastItem: lastItemRef.current,
        });
    }, [
        cartItems,
        subtotal,
        tax,
        grandTotal,
        loyaltyDiscount,
        paymentOpen,
        isProcessing,
        thankYou,
    ]);
}
