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

const DeliveryService = {
    list: async () => {
        const response = await createAuthInstance().get('/inventory/deliveries');
        return response.data;
    },

    get: async (deliveryId) => {
        const response = await createAuthInstance().get(`/inventory/deliveries/${deliveryId}`);
        return response.data;
    },

    createDraft: async (request) => {
        const response = await createAuthInstance().post('/inventory/deliveries', request);
        return response.data;
    },

    updateDraft: async (deliveryId, request) => {
        const response = await createAuthInstance().put(`/inventory/deliveries/${deliveryId}`, request);
        return response.data;
    },

    post: async (deliveryId) => {
        const response = await createAuthInstance().post(`/inventory/deliveries/${deliveryId}/post`);
        return response.data;
    }
};

export default DeliveryService;
