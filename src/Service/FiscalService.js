import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const getAuthToken = () => localStorage.getItem('token');

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

const FiscalService = {
    getAllDevices: async () => {
        const instance = createAuthInstance();
        try {
            const response = await instance.get('/admin/fiscal-devices');
            return response.data;
        } catch (error) {
            console.error('Error in getAllDevices:', error);
            throw error;
        }
    },

    getDeviceBySerialNumber: async (serialNumber) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/admin/devices/${serialNumber}`);
        return response.data;
    },

    registerDevice: async (deviceData) => {
        const instance = createAuthInstance();
        try {
            const response = await instance.post('/admin/fiscal-devices', deviceData);
            return response.data;
        } catch (error) {
            console.error('Error in registerDevice:', error);
            throw error;
        }
    },

    updateDevice: async (deviceData) => {
        const instance = createAuthInstance();
        try {
            const response = await instance.put('/admin/fiscal-devices', deviceData);
            return response.data;
        } catch (error) {
            console.error('Error in updateDevice:', error);
            throw error;
        }
    },

    deleteDevice: async (deviceId) => {
        const instance = createAuthInstance();
        try {
            await instance.delete(`/admin/fiscal-devices/${deviceId}`);
        } catch (error) {
            console.error('Error in deleteDevice:', error);
            throw error;
        }
    },

    checkDeviceStatus: async (serialNumber) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/admin/devices/${serialNumber}/status`);
        return response.data;
    },

    checkDeviceReady: async (serialNumber) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/admin/devices/${serialNumber}/ready`);
        return response.data;
    },

    sendReceipt: async (receiptData) => {
        const instance = createAuthInstance();
        const response = await instance.post('/admin/receipts', receiptData);
        return response.data;
    },

    getReceiptStatus: async (fiscalNumber) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/admin/receipts/${fiscalNumber}`);
        return response.data;
    },

    generateShiftReport: async (reportData) => {
        const instance = createAuthInstance();
        try {
            const response = await instance.post('/admin/fiscal-reports/shift', reportData);
            return response.data;
        } catch (error) {
            console.error('Error in generateShiftReport:', error);
            throw error;
        }
    },

    generateStoreDailyReport: async (reportData) => {
        const instance = createAuthInstance();
        try {
            const response = await instance.post('/admin/fiscal-reports/store-daily', reportData);
            return response.data;
        } catch (error) {
            console.error('Error in generateStoreDailyReport:', error);
            throw error;
        }
    },

    generateMonthlyReport: async (reportData) => {
        const instance = createAuthInstance();
        const response = await instance.post('/admin/fiscal-reports/monthly', reportData);
        return response.data;
    },

    generateYearlyReport: async (reportData) => {
        const instance = createAuthInstance();
        const response = await instance.post('/admin/fiscal-reports/yearly', reportData);
        return response.data;
    },

    getReports: async ({ page = 0, size = 20, type, dateFrom, dateTo } = {}) => {
        const instance = createAuthInstance();
        const params = new URLSearchParams({
            page: String(page),
            size: String(size),
            sort: 'generatedAt,desc'
        });
        params.append('sort', 'id,desc');
        if (type) params.append('type', type);
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
        const response = await instance.get(`/admin/fiscal-reports?${params.toString()}`);
        return response.data;
    },

    archiveReports: async (cutoffDate = null, destination = 'local') => {
        const instance = createAuthInstance();
        const params = new URLSearchParams();
        if (cutoffDate) params.append('cutoffDate', cutoffDate);
        if (destination) params.append('destination', destination);
        const url = `/admin/fiscal-reports/archive/run${params.toString() ? '?' + params.toString() : ''}`;
        const response = await instance.post(url);
        return response.data;
    },

    sendReportToNAF: async (reportId) => {
        const instance = createAuthInstance();
        const response = await instance.post(`/admin/fiscal-reports/${reportId}/send-to-naf`);
        return response.data;
    }
};

export default FiscalService;
