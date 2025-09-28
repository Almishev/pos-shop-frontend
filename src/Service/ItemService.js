import axios from "axios";

export const addItem = async (item) => {
    return await axios.post(`http://localhost:8087/api/v1.0/admin/items`, item, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const deleteItem = async (itemId) => {
    return await axios.delete(`http://localhost:8087/api/v1.0/admin/items/${itemId}`, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const fetchItems = async () => {
    return await axios.get('http://localhost:8087/api/v1.0/items', {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const findItemByBarcode = async (barcode) => {
    return await axios.get(`http://localhost:8087/api/v1.0/items/barcode/${barcode}`, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const searchItems = async (searchTerm) => {
    return await axios.get(`http://localhost:8087/api/v1.0/items/search?q=${encodeURIComponent(searchTerm)}`, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const generateBarcode = async () => {
    return await axios.get('http://localhost:8087/api/v1.0/items/generate-barcode', {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const getItemById = async (itemId) => {
    console.log('=== getItemById called ===');
    console.log('Getting item by ID:', itemId);
    console.log('Item ID type:', typeof itemId);
    const token = localStorage.getItem('token');
    console.log('Token exists:', !!token);
    const url = `http://localhost:8087/api/v1.0/items/${itemId}`;
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

export const updateItem = async (itemId, itemData) => {
    return await axios.put(`http://localhost:8087/api/v1.0/admin/items/${itemId}`, itemData, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
        }
    });
}