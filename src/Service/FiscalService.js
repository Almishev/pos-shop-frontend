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
        console.log('=== FiscalService.getAllDevices called ===');
        const token = getAuthToken();
        console.log('Token exists:', !!token);
        console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'null');

        const instance = createAuthInstance();
        console.log('Making request to:', API_BASE_URL + '/admin/fiscal-devices');

        try {
            const response = await instance.get('/admin/fiscal-devices');
            console.log('Response received:', response);
            console.log('Response status:', response.status);
            console.log('Response data:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error in getAllDevices:', error);
            console.error('Error response:', error.response);
            console.error('Error status:', error.response?.status);
            console.error('Error data:', error.response?.data);
            throw error;
        }
    },

    getDeviceBySerialNumber: async (serialNumber) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/admin/devices/${serialNumber}`);
        return response.data;
    },

    registerDevice: async (deviceData) => {
        console.log('=== FiscalService.registerDevice called ===');
        console.log('Device data:', deviceData);
        
        const instance = createAuthInstance();
        console.log('Making POST request to:', API_BASE_URL + '/admin/fiscal-devices');
        
        try {
            const response = await instance.post('/admin/fiscal-devices', deviceData);
            console.log('Device registered successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error in registerDevice:', error);
            console.error('Error response:', error.response);
            throw error;
        }
    },

    updateDevice: async (deviceData) => {
        console.log('=== FiscalService.updateDevice called ===');
        console.log('Device data:', deviceData);
        
        const instance = createAuthInstance();
        console.log('Making PUT request to:', API_BASE_URL + '/admin/fiscal-devices');
        
        try {
            const response = await instance.put('/admin/fiscal-devices', deviceData);
            console.log('Device updated successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error in updateDevice:', error);
            console.error('Error response:', error.response);
            throw error;
        }
    },

    deleteDevice: async (deviceId) => {
        console.log('=== FiscalService.deleteDevice called ===');
        console.log('Device ID:', deviceId);
        
        const instance = createAuthInstance();
        console.log('Making DELETE request to:', API_BASE_URL + '/admin/fiscal-devices/' + deviceId);
        
        try {
            await instance.delete(`/admin/fiscal-devices/${deviceId}`);
            console.log('Device deleted successfully');
        } catch (error) {
            console.error('Error in deleteDevice:', error);
            console.error('Error response:', error.response);
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
        const response = await instance.post('/admin/fiscal-reports/shift', reportData);
        return response.data;
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
        const response = await instance.get('/admin/fiscal-reports');
        return response.data;
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
