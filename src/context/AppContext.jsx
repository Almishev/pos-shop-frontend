import {createContext, useEffect, useState} from "react";
import {fetchCategories} from "../Service/CategoryService.js";
import {fetchItems, getEffectivePrices, getDbIdByItemId} from "../Service/ItemService.js";
import PromotionService from "../Service/PromotionService.js";

export const AppContext = createContext(null);

export const AppContextProvider = (props) => {

    const [categories, setCategories] = useState([]);
    const [itemsData, setItemsData] = useState([]);
    const [auth, setAuth] = useState({token: null, role: null, email: null, name: null});
    const [cartItems, setCartItems] = useState([]);

    const addToCart = (item) => {
        const existingItem = cartItems.find(cartItem => cartItem.name === item.name);
        if (existingItem) {
            setCartItems(cartItems.map(cartItem => cartItem.name === item.name ? {...cartItem, quantity: cartItem.quantity + 1} : cartItem));
        } else {
            setCartItems([...cartItems, {...item, quantity: 1}]);
        }
    }

    const removeFromCart = (itemId) => {
        setCartItems(cartItems.filter(item => item.itemId !== itemId));
    }

    const updateQuantity = (itemId, newQuantity) => {
        const numericQty = typeof newQuantity === 'number' ? newQuantity : parseFloat(newQuantity);
        if (isNaN(numericQty) || numericQty <= 0) {
            // Remove the item if quantity is zero or negative
            setCartItems(cartItems.filter(item => item.itemId !== itemId));
            return;
        }
        // Clamp to 2 decimals
        const clamped = Math.round(numericQty * 100) / 100;
        setCartItems(cartItems.map(item => item.itemId === itemId ? {...item, quantity: clamped} : item));
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
                console.log('AppContext - Categories response:', response);
                console.log('AppContext - Items response:', itemResponse);
                const items = itemResponse.data || [];
                setCategories(response.data || []);
                // Обогати с ефективни цени
                try {
                    // 1) Попълни липсващи DB id чрез itemId
                    const missing = items.filter(it => !it.id && it.itemId);
                    if (missing.length > 0) {
                        await Promise.all(missing.map(async (it) => {
                            try {
                                const dbId = await getDbIdByItemId(it.itemId);
                                if (dbId) it.id = dbId;
                            } catch (_) {}
                        }));
                    }
                    // 2) Зареди ефективни цени за всички, за които имаме DB id
                    const itemDbIds = items.map(it => it.id).filter(Boolean);
                    console.log('Effective pricing - DB ids count:', itemDbIds.length);
                    if (itemDbIds.length > 0) {
                        const effective = await getEffectivePrices(itemDbIds);
                        console.log('Effective pricing - response size:', effective?.length, effective);
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
                        const bread = items.find(i => i.name === 'Хляб');
                        if (bread) console.log('Bread after effective:', bread);
                    }
                    // 3) Допълнителен fallback: приложи активни промоции по itemId
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

    const setAuthData = (token, role, email, name) => {
        setAuth({token, role, email, name});
    }

    const clearCart = () => {
        setCartItems([]);
    }

    const contextValue = {
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
        clearCart
    }

    return <AppContext.Provider value={contextValue}>
        {props.children}
    </AppContext.Provider>
}