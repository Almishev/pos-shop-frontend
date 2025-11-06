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

const InventoryService = {
    // Stock operations
    updateStock: async (request) => {
        const instance = createAuthInstance();
        const response = await instance.post('/inventory/stock/update', request);
        return response.data;
    },

    addStock: async (request) => {
        const instance = createAuthInstance();
        const response = await instance.post('/inventory/stock/add', request);
        return response.data;
    },

    removeStock: async (request) => {
        const instance = createAuthInstance();
        const response = await instance.post('/inventory/stock/remove', request);
        return response.data;
    },

    adjustStock: async (request) => {
        const instance = createAuthInstance();
        const response = await instance.post('/inventory/stock/adjust', request);
        return response.data;
    },

    // Inventory queries
    getItemStock: async (itemId) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/inventory/stock/${itemId}`);
        return response.data;
    },

    getLowStockItems: async () => {
        const instance = createAuthInstance();
        const response = await instance.get('/inventory/stock/low');
        return response.data;
    },

    getOutOfStockItems: async () => {
        const instance = createAuthInstance();
        const response = await instance.get('/inventory/stock/out-of-stock');
        return response.data;
    },

    getOverstockItems: async () => {
        const instance = createAuthInstance();
        const response = await instance.get('/inventory/stock/overstock');
        return response.data;
    },

    getInventorySummary: async () => {
        const instance = createAuthInstance();
        const response = await instance.get('/inventory/summary');
        return response.data;
    },

    getAllItems: async () => {
        const instance = createAuthInstance();
        const response = await instance.get('/items');
        return response.data;
    },

    // Transaction history
    getItemTransactionHistory: async (itemId) => {
        const instance = createAuthInstance();
        const response = await instance.get(`/inventory/transactions/${itemId}`);
        return response.data;
    },

    getRecentTransactions: async () => {
        const instance = createAuthInstance();
        const response = await instance.get('/inventory/transactions/recent');
        return response.data;
    },

    // Alerts
    getActiveAlerts: async () => {
        const instance = createAuthInstance();
        const response = await instance.get('/inventory/alerts');
        return response.data;
    },

    // Automatic operations
    processSaleTransaction: async (itemId, quantity, orderId) => {
        const instance = createAuthInstance();
        await instance.post('/inventory/auto/sale', null, {
            params: { itemId, quantity, orderId }
        });
    },

    processPurchaseTransaction: async (itemId, quantity, purchaseOrderId) => {
        const instance = createAuthInstance();
        await instance.post('/inventory/auto/purchase', null, {
            params: { itemId, quantity, purchaseOrderId }
        });
    }
};

export default InventoryService;
