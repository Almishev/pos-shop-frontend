const CHANNEL_NAME = "pos-customer-display";
const STORAGE_KEY = "pos-customer-display-state";

/** @typedef {'idle' | 'sale' | 'payment' | 'thankYou'} DisplayPhase */

/**
 * @typedef {Object} CustomerDisplayState
 * @property {DisplayPhase} type
 * @property {Array<{name?: string, price?: number, quantity?: number, itemId?: string}>} cartItems
 * @property {number} subtotal
 * @property {number} tax
 * @property {number} grandTotal
 * @property {number} loyaltyDiscount
 * @property {string|null} paymentMethod
 * @property {{name?: string, price?: number, quantity?: number}|null} lastItem
 * @property {number} updatedAt
 */

/** @returns {CustomerDisplayState} */
export function createIdleDisplayState() {
    return {
        type: "idle",
        cartItems: [],
        subtotal: 0,
        tax: 0,
        grandTotal: 0,
        loyaltyDiscount: 0,
        paymentMethod: null,
        lastItem: null,
        updatedAt: Date.now(),
    };
}

let channel = null;

function getChannel() {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
        return null;
    }
    if (!channel) {
        channel = new BroadcastChannel(CHANNEL_NAME);
    }
    return channel;
}

/** @param {Partial<CustomerDisplayState> & {type: DisplayPhase}} state */
export function publishDisplayState(state) {
    const payload = {
        ...createIdleDisplayState(),
        ...state,
        updatedAt: Date.now(),
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_) {
        /* ignore quota / private mode */
    }
    const ch = getChannel();
    if (ch) {
        try {
            ch.postMessage(payload);
        } catch (_) {
            /* ignore */
        }
    }
    return payload;
}

/** @returns {CustomerDisplayState|null} */
export function readStoredDisplayState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (_) {
        return null;
    }
}

/**
 * @param {(state: CustomerDisplayState) => void} handler
 * @returns {() => void} unsubscribe
 */
export function subscribeDisplayState(handler) {
    const ch = getChannel();
    const onMessage = (event) => {
        if (event?.data?.type) {
            handler(event.data);
        }
    };
    const onStorage = (event) => {
        if (event.key !== STORAGE_KEY || !event.newValue) return;
        try {
            handler(JSON.parse(event.newValue));
        } catch (_) {
            /* ignore */
        }
    };

    if (ch) {
        ch.addEventListener("message", onMessage);
    }
    window.addEventListener("storage", onStorage);

    return () => {
        if (ch) {
            ch.removeEventListener("message", onMessage);
        }
        window.removeEventListener("storage", onStorage);
    };
}

export function openCustomerDisplayWindow() {
    const url = `${window.location.origin}/customer-display`;
    const win = window.open(url, "posCustomerDisplay", "noopener,noreferrer");
    if (!win) {
        return false;
    }
    try {
        win.focus();
    } catch (_) {
        /* ignore */
    }
    return true;
}
