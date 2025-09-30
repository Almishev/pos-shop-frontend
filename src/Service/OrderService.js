import axios from "axios";

export const latestOrders = async () => {
    return await axios.get("http://localhost:8087/api/v1.0/orders/latest", {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const createOrder = async (order) => {
    return await axios.post("http://localhost:8087/api/v1.0/orders", order, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const deleteOrder = async (id) => {
    return await axios.delete(`http://localhost:8087/api/v1.0/orders/${id}`, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

// New: server-side paginated orders
export const getOrders = async ({ page = 0, size = 20, sort = 'createdAt,desc', q, dateFrom, dateTo } = {}) => {
    const params = new URLSearchParams({ page: String(page), size: String(size), sort });
    if (q && q.trim()) params.append('q', q.trim());
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    return await axios.get(`http://localhost:8087/api/v1.0/orders?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
}