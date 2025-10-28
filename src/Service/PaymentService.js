import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const instance = axios.create({ baseURL: API_BASE_URL, headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });

export const createRazorpayOrder = async (data) => instance.post('/payments/create-order', data);

export const verifyPayment = async (paymentData) => instance.post('/payments/verify', paymentData);

export const initiatePosPayment = async (data) => instance.post('/pos-payments/initiate', data);

export const refundPosPayment = async (data) => instance.post('/pos-payments/refund', data);