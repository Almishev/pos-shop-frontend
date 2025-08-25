import axios from 'axios';

const API_BASE_URL = 'http://localhost:8087/api/v1.0';

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
        const response = await instance.get('/fiscal/devices');
        return response.data;
    },

    getDeviceBySerialNumber: async (serialNumber) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/fiscal/devices/${serialNumber}`);
        return response.data;
    },

    registerDevice: async (deviceData) => {
        const instance = createAuthInstance();
        const response = await instance.post('/fiscal/devices', deviceData);
        return response.data;
    },

    updateDevice: async (deviceData) => {
        const instance = createAuthInstance();
        const response = await instance.put('/fiscal/devices', deviceData);
        return response.data;
    },

    deleteDevice: async (deviceId) => {
        const instance = createAuthInstance();
        await instance.delete(`/fiscal/devices/${deviceId}`);
    },

    checkDeviceStatus: async (serialNumber) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/fiscal/devices/${serialNumber}/status`);
        return response.data;
    },

    checkDeviceReady: async (serialNumber) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/fiscal/devices/${serialNumber}/ready`);
        return response.data;
    },

    // Fiscal Receipts
    sendReceipt: async (receiptData) => {
        const instance = createAuthInstance();
        const response = await instance.post('/fiscal/receipts', receiptData);
        return response.data;
    },

    getReceiptStatus: async (fiscalNumber) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/fiscal/receipts/${fiscalNumber}`);
        return response.data;
    },

    // Fiscal Reports
    generateDailyReport: async (reportData) => {
        const instance = createAuthInstance();
        const response = await instance.post('/fiscal/reports/daily', reportData);
        return response.data;
    },

    generateShiftReport: async (reportData) => {
        const instance = createAuthInstance();
        const response = await instance.post('/fiscal/reports/shift', reportData);
        return response.data;
    },

    generateMonthlyReport: async (reportData) => {
        const instance = createAuthInstance();
        const response = await instance.post('/fiscal/reports/monthly', reportData);
        return response.data;
    },

    generateYearlyReport: async (reportData) => {
        const instance = createAuthInstance();
        const response = await instance.post('/fiscal/reports/yearly', reportData);
        return response.data;
    },

    getAllReports: async () => {
        const instance = createAuthInstance();
        const response = await instance.get('/fiscal/reports');
        return response.data;
    },

    getReportById: async (reportId) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/fiscal/reports/${reportId}`);
        return response.data;
    },

    getReportsByType: async (reportType) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/fiscal/reports/type/${reportType}`);
        return response.data;
    },

    getReportsByDateRange: async (startDate, endDate) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/fiscal/reports/date-range?startDate=${startDate}&endDate=${endDate}`);
        return response.data;
    },

    sendReportToNAF: async (reportId) => {
        const instance = createAuthInstance();
        const response = await instance.post(`/fiscal/reports/${reportId}/send-to-naf`);
        return response.data;
    },

    // Statistics
    getSalesForDate: async (date) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/fiscal/reports/stats/sales/${date}`);
        return response.data;
    },

    getVATForDate: async (date) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/fiscal/reports/stats/vat/${date}`);
        return response.data;
    },

    getReceiptsForDate: async (date) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/fiscal/reports/stats/receipts/${date}`);
        return response.data;
    },

    // X and Z Reports
    generateXReport: async (deviceSerialNumber) => {
        const instance = createAuthInstance();
        const response = await instance.post(`/fiscal/devices/${deviceSerialNumber}/x-report`);
        return response.data;
    },

    generateZReport: async (deviceSerialNumber) => {
        const instance = createAuthInstance();
        const response = await instance.post(`/fiscal/devices/${deviceSerialNumber}/z-report`);
        return response.data;
    }
};

export default FiscalService;
