import axios from "axios";

export const latestOrders = async () => {
    return await axios.get("/api/orders/latest", {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const createOrder = async (order) => {
    return await axios.post("/api/orders", order, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const deleteOrder = async (id) => {
    return await axios.delete(`/api/orders/${id}`, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

// New: server-side paginated orders
export const getOrders = async ({ page = 0, size = 20, sort = 'createdAt,desc', q, dateFrom, dateTo } = {}) => {
    const params = new URLSearchParams({ page: String(page), size: String(size), sort });
    if (q && q.trim()) params.append('q', q.trim());
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    return await axios.get(`/api/orders?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
}

export const refundOrder = async (orderId, payload) => {
    return await axios.post(`/api/orders/${orderId}/refund`, payload, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
}