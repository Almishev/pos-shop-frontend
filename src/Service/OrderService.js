import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const createAuthInstance = () => axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    }
});

export const createOrder = async (order) => createAuthInstance().post('/orders', order);

export const deleteOrder = async (id) => createAuthInstance().delete(`/orders/${id}`);

// New: server-side paginated orders
export const getOrders = async ({ page = 0, size = 20, sort = 'createdAt,desc', q, dateFrom, dateTo } = {}) => {
    const params = new URLSearchParams({ page: String(page), size: String(size), sort });
    if (q && q.trim()) params.append('q', q.trim());
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    return await createAuthInstance().get(`/orders?${params.toString()}`);
}

export const getOrderById = async (orderId) =>
    createAuthInstance().get(`/orders/${encodeURIComponent(orderId)}`);

export const refundOrder = async (orderId, payload) =>
    createAuthInstance().post(`/orders/${orderId}/refund`, payload);

export const archiveOrders = async (cutoffDate = null, destination = 'local') => {
    const params = new URLSearchParams();
    if (cutoffDate) {
        params.append('cutoffDate', cutoffDate);
    }
    if (destination) {
        params.append('destination', destination);
    }
    const url = `/orders/archive/run${params.toString() ? '?' + params.toString() : ''}`;
    return createAuthInstance().post(url);
};
