import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Get auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Create axios instance with auth header
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
    // Fiscal Devices
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

    // Fiscal Receipts
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

    // Fiscal Reports
    generateDailyReport: async (reportData) => {
        const instance = createAuthInstance();
        const response = await instance.post('/admin/fiscal-reports/daily', reportData);
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

    getAllReports: async () => {
        const instance = createAuthInstance();
        try {
            const response = await instance.get('/admin/fiscal-reports');
            return response.data;
        } catch (error) {
            console.error('Error in getAllReports:', error);
            throw error;
        }
    },

    getReportById: async (reportId) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/admin/fiscal-reports/${reportId}`);
        return response.data;
    },

    getReportsByType: async (reportType) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/admin/fiscal-reports/type/${reportType}`);
        return response.data;
    },

    getReportsByDateRange: async (startDate, endDate) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/admin/fiscal-reports/date-range?startDate=${startDate}&endDate=${endDate}`);
        return response.data;
    },

    sendReportToNAF: async (reportId) => {
        const instance = createAuthInstance();
        const response = await instance.post(`/admin/fiscal-reports/${reportId}/send-to-naf`);
        return response.data;
    },

    // Statistics
    getSalesForDate: async (date) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/admin/fiscal-reports/stats/sales/${date}`);
        return response.data;
    },

    getVATForDate: async (date) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/admin/fiscal-reports/stats/vat/${date}`);
        return response.data;
    },

    getReceiptsForDate: async (date) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/admin/fiscal-reports/stats/receipts/${date}`);
        return response.data;
    },

    // X and Z Reports
    generateXReport: async (deviceSerialNumber) => {
        const instance = createAuthInstance();
        const response = await instance.post(`/admin/devices/${deviceSerialNumber}/x-report`);
        return response.data;
    },

    generateZReport: async (deviceSerialNumber) => {
        const instance = createAuthInstance();
        const response = await instance.post(`/admin/devices/${deviceSerialNumber}/z-report`);
        return response.data;
    }
};

export default FiscalService;
