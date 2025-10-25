import axios from "axios";

export const addItem = async (item) => {
    return await axios.post(`/api/admin/items`, item, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const deleteItem = async (itemId) => {
    return await axios.delete(`/api/admin/items/${itemId}`, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const fetchItems = async () => {
    return await axios.get('/api/items', {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const findItemByBarcode = async (barcode) => {
    return await axios.get(`/api/items/barcode/${barcode}`, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const searchItems = async (searchTerm) => {
    return await axios.get(`/api/items/search?q=${encodeURIComponent(searchTerm)}`, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const generateBarcode = async () => {
    return await axios.get('/api/items/generate-barcode', {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const getItemById = async (itemId) => {
    console.log('=== getItemById called ===');
    console.log('Getting item by ID:', itemId);
    console.log('Item ID type:', typeof itemId);
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    const url = `/api/items/${itemId}`;
    console.log('Request URL:', url);
    try {
        const response = await axios.get(url, {headers: {'Authorization': `Bearer ${token}`}});
        console.log('getItemById response:', response);
        return response;
    } catch (error) {
        console.error('getItemById error:', error);
        console.error('Error response:', error.response);
        throw error;
    }
}

export const getDbIdByItemId = async (itemId) => {
    const token = localStorage.getItem('token');
    const url = `/api/items/${itemId}`;
    const response = await axios.get(url, {headers: {'Authorization': `Bearer ${token}`}});
    return response.data?.id;
}

export const getEffectivePrices = async (itemDbIds) => {
    const token = localStorage.getItem('token');
    const url = `/api/items/effective`;
    const response = await axios.post(url, { itemDbIds }, {headers: {'Authorization': `Bearer ${token}`}});
    return response.data;
}

export const updateItem = async (itemId, itemData) => {
    return await axios.put(`/api/admin/items/${itemId}`, itemData, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
        }
    });
}
