import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const instance = axios.create({ baseURL: API_BASE_URL, headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });

export const latestOrders = async () => instance.get('/orders/latest');

export const createOrder = async (order) => instance.post('/orders', order);

export const deleteOrder = async (id) => instance.delete(`/orders/${id}`);

// New: server-side paginated orders
export const getOrders = async ({ page = 0, size = 20, sort = 'createdAt,desc', q, dateFrom, dateTo } = {}) => {
    const params = new URLSearchParams({ page: String(page), size: String(size), sort });
    if (q && q.trim()) params.append('q', q.trim());
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    return await instance.get(`/orders?${params.toString()}`);
}

export const refundOrder = async (orderId, payload) => instance.post(`/orders/${orderId}/refund`, payload);