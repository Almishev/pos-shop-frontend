import axios from "axios";

export const exportOrdersReport = async (dateFrom, dateTo) => {
    const params = new URLSearchParams({ dateFrom, dateTo });
    return await axios.post(`http://localhost:8087/api/v1.0/reports/export?${params.toString()}`, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
}

export const getCashierSummaries = async (dateFrom, dateTo) => {
    const params = new URLSearchParams({ dateFrom, dateTo });
    return await axios.get(`http://localhost:8087/api/v1.0/reports/cashiers?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
}
