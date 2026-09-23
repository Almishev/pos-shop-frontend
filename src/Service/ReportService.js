import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const createAuthInstance = () => {
    const token = localStorage.getItem('token');
    return axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
};

export const exportOrdersReport = async (dateFrom, dateTo, destination = 'local') => {
    const params = new URLSearchParams({ dateFrom, dateTo, destination });
    const instance = createAuthInstance();
    return await instance.post(`/reports/export?${params.toString()}`, {});
};

export const getCashierSummaries = async (dateFrom, dateTo) => {
    const params = new URLSearchParams({ dateFrom, dateTo });
    const instance = createAuthInstance();
    return await instance.get(`/reports/cashiers?${params.toString()}`);
};
