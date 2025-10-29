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

export const createRazorpayOrder = async (data) => {
    const instance = createAuthInstance();
    return instance.post('/payments/create-order', data);
};

export const verifyPayment = async (paymentData) => {
    const instance = createAuthInstance();
    return instance.post('/payments/verify', paymentData);
};

export const initiatePosPayment = async (data) => {
    const instance = createAuthInstance();
    return instance.post('/pos-payments/initiate', data);
};

export const refundPosPayment = async (data) => {
    const instance = createAuthInstance();
    return instance.post('/pos-payments/refund', data);
};