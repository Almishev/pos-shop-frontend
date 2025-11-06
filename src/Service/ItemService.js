import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const instance = axios.create({ baseURL: API_BASE_URL, headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });

export const addItem = async (item) => instance.post('/admin/items', item);

export const deleteItem = async (itemId) => instance.delete(`/admin/items/${itemId}`);

export const fetchItems = async () => instance.get('/items');

export const findItemByBarcode = async (barcode) => instance.get(`/items/barcode/${barcode}`);

export const searchItems = async (searchTerm) => instance.get(`/items/search?q=${encodeURIComponent(searchTerm)}`);

export const generateBarcode = async () => instance.get('/items/generate-barcode');

export const getItemById = async (itemId) => {
    const url = `/items/${itemId}`;
    try {
        const response = await instance.get(url);
        return response;
    } catch (error) {
        console.error('getItemById error:', error);
        throw error;
    }
}

export const getDbIdByItemId = async (itemId) => {
    const url = `/items/${itemId}`;
    const response = await instance.get(url);
    return response.data?.id;
}

export const getEffectivePrices = async (itemDbIds) => {
    const url = `/items/effective`;
    const response = await instance.post(url, { itemDbIds });
    return response.data;
}

export const updateItem = async (itemId, itemData) => instance.put(`/admin/items/${itemId}`, itemData, { headers: { 'Content-Type': 'multipart/form-data' } });