import axios from 'axios';
// Reuse the same token getter pattern used in FiscalService
const getAuthToken = () => {
    return localStorage.getItem('token');
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const createAuthInstance = () => {
    const token = getAuthToken();
    return axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
};

const CashDrawerService = {
    // Започване на работен ден
    startWorkDay: async (startAmount, notes = '', deviceSerialNumber = undefined, registerId = undefined) => {
        const instance = createAuthInstance();
        const payload = {
            startAmount: startAmount,
            notes: notes
        };
        if (deviceSerialNumber) payload.deviceSerialNumber = deviceSerialNumber;
        if (registerId) payload.registerId = registerId;
        const response = await instance.post('/cash-drawer/start', payload);
        return response.data;
    },

    // Приключване на работен ден
    endWorkDay: async (sessionId, endAmount, notes = '') => {
        const instance = createAuthInstance();
        const response = await instance.post(`/cash-drawer/end/${sessionId}`, {
            endAmount: endAmount,
            notes: notes
        });
        return response.data;
    },

    // Получаване на активна сесия
    getActiveSession: async () => {
        const instance = createAuthInstance();
        try {
            const response = await instance.get('/cash-drawer/active');
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return null; // Няма активна сесия
            }
            throw error;
        }
    },

    // Получаване на моите сесии
    getMySessions: async () => {
        const instance = createAuthInstance();
        const response = await instance.get('/cash-drawer/my-sessions');
        return response.data;
    },

    // Получаване на всички активни сесии (за админи)
    getActiveSessions: async () => {
        const instance = createAuthInstance();
        const response = await instance.get('/cash-drawer/active-sessions');
        return response.data;
    },

    // Получаване на сесии за дата (за админи)
    getSessionsByDate: async (date) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/cash-drawer/sessions/${date}`);
        return response.data;
    }
};

export default CashDrawerService;
