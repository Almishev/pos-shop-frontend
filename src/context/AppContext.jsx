import {createContext, useEffect, useMemo, useState} from "react";
import {fetchCategories} from "../Service/CategoryService.js";
import {fetchItems, getEffectivePrices, getDbIdByItemId} from "../Service/ItemService.js";
import PromotionService from "../Service/PromotionService.js";

export const AppContext = createContext(null);

/** Auth-only context so route shell (App) does not remount on cart/catalog updates. */
export const AuthContext = createContext(null);

export const AppContextProvider = (props) => {

    const [categories, setCategories] = useState([]);
    const [itemsData, setItemsData] = useState([]);
    const [auth, setAuth] = useState({token: null, role: null, email: null, name: null});
    const [cartItems, setCartItems] = useState([]);

    const addToCart = (item) => {
        setCartItems((prev) => {
            const existingItem = prev.find(cartItem => cartItem.name === item.name);
            if (existingItem) {
                return prev.map(cartItem => cartItem.name === item.name ? {...cartItem, quantity: cartItem.quantity + 1} : cartItem);
            }
            return [...prev, {...item, quantity: 1}];
        });
    }

    const removeFromCart = (itemId) => {
        setCartItems((prev) => prev.filter(item => item.itemId !== itemId));
    }

    const updateQuantity = (itemId, newQuantity) => {
        const numericQty = typeof newQuantity === 'number' ? newQuantity : parseFloat(newQuantity);
        if (isNaN(numericQty) || numericQty <= 0) {
            setCartItems((prev) => prev.filter(item => item.itemId !== itemId));
            return;
        }
        const clamped = Math.round(numericQty * 100) / 100;
        setCartItems((prev) => prev.map(item => item.itemId === itemId ? {...item, quantity: clamped} : item));
    }

    const setAuthData = (token, role, email, name) => {
        setAuth({token, role, email, name});
    }

    const clearCart = () => {
        setCartItems([]);
    }

    useEffect(() => {
        async function loadData() {
            if (localStorage.getItem("token") && localStorage.getItem("role")) {
                setAuthData(
                    localStorage.getItem("token"),
                    localStorage.getItem("role"),
                    localStorage.getItem("email"),
                    localStorage.getItem("name")
                );
            }
            try {
                const response = await fetchCategories();
                const itemResponse = await fetchItems();
                const items = itemResponse.data || [];
                setCategories(response.data || []);
                try {
                    const missing = items.filter(it => !it.id && it.itemId);
                    if (missing.length > 0) {
                        await Promise.all(missing.map(async (it) => {
                            try {
                                const dbId = await getDbIdByItemId(it.itemId);
                                if (dbId) it.id = dbId;
                            } catch (_) {}
                        }));
                    }
                    const itemDbIds = items.map(it => it.id).filter(Boolean);
                    if (itemDbIds.length > 0) {
                        const effective = await getEffectivePrices(itemDbIds);
                        const map = new Map(effective.map(row => [row.itemDbId, row]));
                        items.forEach(it => {
                            const row = it.id ? map.get(it.id) : null;
                            if (row) {
                                it.effectivePrice = row.effectivePrice;
                                it.isPromo = row.isPromo;
                            } else {
                                it.effectivePrice = it.price;
                                it.isPromo = false;
                            }
                        });
                    }
                    try {
                        const promos = await PromotionService.getActivePromotions();
                        const byItemId = new Map((promos||[]).map(p => [p.itemId, p]));
                        items.forEach(it => {
                            if (!it.isPromo) {
                                const p = byItemId.get(it.itemId);
                                if (p) {
                                    it.isPromo = true;
                                    it.effectivePrice = p.promoPrice;
                                }
                            }
                        });
                    } catch (_) {}
                } catch (e) {
                    console.warn('Effective price load failed:', e);
                }
                setItemsData(items);
            } catch (error) {
                console.error('AppContext - Error loading data:', error);
                setCategories([]);
                setItemsData([]);
            }

        }
        loadData();
    }, []);

    const authContextValue = useMemo(
        () => ({ auth, setAuthData }),
        [auth],
    );

    const contextValue = useMemo(
        () => ({
            categories,
            setCategories,
            auth,
            setAuthData,
            itemsData,
            setItemsData,
            addToCart,
            cartItems,
            removeFromCart,
            updateQuantity,
            clearCart,
        }),
        [categories, auth, itemsData, cartItems],
    );

    return (
        <AuthContext.Provider value={authContextValue}>
            <AppContext.Provider value={contextValue}>
                {props.children}
            </AppContext.Provider>
        </AuthContext.Provider>
    );
}
