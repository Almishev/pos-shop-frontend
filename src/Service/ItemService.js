import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const createAuthInstance = (extraHeaders = {}) => {
    const token = localStorage.getItem('token');
    return axios.create({
        baseURL: API_BASE_URL,
        headers: {
            Authorization: `Bearer ${token}`,
            ...extraHeaders,
        },
    });
};

/** Multipart create/update — do not force Content-Type (browser sets boundary). */
export const addItem = async (item) => createAuthInstance().post('/admin/items', item);

export const deleteItem = async (itemId) => createAuthInstance().delete(`/admin/items/${itemId}`);

export const fetchItems = async () => createAuthInstance().get('/items');

export const findItemByBarcode = async (barcode) =>
    createAuthInstance().get(`/items/barcode/${encodeURIComponent(barcode)}`);

export const searchItems = async (searchTerm) =>
    createAuthInstance().get(`/items/search?q=${encodeURIComponent(searchTerm)}`);

export const generateBarcode = async () => createAuthInstance().get('/items/generate-barcode');

export const getItemById = async (itemId) => {
    try {
        return await createAuthInstance().get(`/items/${itemId}`);
    } catch (error) {
        console.error('getItemById error:', error);
        throw error;
    }
};

export const getDbIdByItemId = async (itemId) => {
    const response = await createAuthInstance().get(`/items/${itemId}`);
    return response.data?.id;
};

export const getEffectivePrices = async (itemDbIds) => {
    const response = await createAuthInstance({
        'Content-Type': 'application/json',
    }).post('/items/effective', { itemDbIds });
    return response.data;
};

export const updateItem = async (itemId, itemData) =>
    createAuthInstance().put(`/admin/items/${itemId}`, itemData);
