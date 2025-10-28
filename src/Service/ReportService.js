import axios from 'axios';

const createAuthInstance = () => {
    const token = localStorage.getItem('token');
    return axios.create({
        baseURL: '/api',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
};

export const exportOrdersReport = async (dateFrom, dateTo) => {
    const params = new URLSearchParams({ dateFrom, dateTo });
    const instance = createAuthInstance();
    return await instance.post(`/reports/export?${params.toString()}`, {});
};

export const getCashierSummaries = async (dateFrom, dateTo) => {
    const params = new URLSearchParams({ dateFrom, dateTo });
    const instance = createAuthInstance();
    return await instance.get(`/reports/cashiers?${params.toString()}`);
};
