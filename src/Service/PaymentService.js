import axios from "axios";

export const createRazorpayOrder = async (data) => {
    return await axios.post(`/api/payments/create-order`, data, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const verifyPayment = async (paymentData) => {
    return await axios.post('/api/payments/verify', paymentData, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const initiatePosPayment = async (data) => {
    return await axios.post('/api/pos-payments/initiate', data, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const refundPosPayment = async (data) => {
    return await axios.post('/api/pos-payments/refund', data, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}