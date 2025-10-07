import {createContext, useEffect, useState} from "react";
import {fetchCategories} from "../Service/CategoryService.js";
import {fetchItems} from "../Service/ItemService.js";

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
                setCategories(response.data || []);
                setItemsData(itemResponse.data || []);
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