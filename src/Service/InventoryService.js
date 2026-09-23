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

    /**
     * Server-side paginated items for inventory table.
     * @param {{ page?: number, size?: number, search?: string, searchBy?: string, category?: string, status?: string, sort?: string }} params
     */
    getItemsPage: async (params = {}) => {
        const instance = createAuthInstance();
        const {
            page = 0,
            size = 20,
            search = '',
            searchBy = 'name',
            category = '',
            status = '',
            sort = 'name,asc'
        } = params;
        const response = await instance.get('/items/paged', {
            params: {
                page,
                size,
                sort,
                ...(search ? { search } : {}),
                ...(searchBy ? { searchBy } : {}),
                ...(category ? { category } : {}),
                ...(status ? { status } : {})
            }
        });
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
