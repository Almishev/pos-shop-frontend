import axios from "axios";

export const exportOrdersReport = async (dateFrom, dateTo) => {
    const params = new URLSearchParams({ dateFrom, dateTo });
    return await axios.post(`/api/reports/export?${params.toString()}`, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
}

export const getCashierSummaries = async (dateFrom, dateTo) => {
    const params = new URLSearchParams({ dateFrom, dateTo });
    return await axios.get(`/api/reports/cashiers?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
}
