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