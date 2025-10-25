import axios from 'axios';

const baseURL = '/api';

const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`
});

const LoyaltyService = {
    // Customer management
    createCustomer: (customerData) => {
        return axios.post(`${baseURL}/loyalty/customers`, customerData, { headers: getAuthHeaders() });
    },

    updateCustomer: (customerId, customerData) => {
        return axios.put(`${baseURL}/loyalty/customers/${customerId}`, customerData, { headers: getAuthHeaders() });
    },

    getCustomerById: (customerId) => {
        return axios.get(`${baseURL}/loyalty/customers/${customerId}`, { headers: getAuthHeaders() });
    },

    getCustomerByLoyaltyCard: (loyaltyCardBarcode) => {
        return axios.get(`${baseURL}/loyalty/customers/loyalty-card/${loyaltyCardBarcode}`, { headers: getAuthHeaders() });
    },

    getCustomerByPhone: (phoneNumber) => {
        return axios.get(`${baseURL}/loyalty/customers/phone/${phoneNumber}`, { headers: getAuthHeaders() });
    },

    searchCustomers: (searchTerm) => {
        return axios.get(`${baseURL}/loyalty/customers/search?searchTerm=${searchTerm}`, { headers: getAuthHeaders() });
    },

    getAllCustomers: () => {
        return axios.get(`${baseURL}/loyalty/customers`, { headers: getAuthHeaders() });
    },

    deleteCustomer: (customerId) => {
        return axios.delete(`${baseURL}/loyalty/customers/${customerId}`, { headers: getAuthHeaders() });
    },

    // Loyalty card management
    generateLoyaltyCardBarcode: () => {
        return axios.get(`${baseURL}/loyalty/loyalty-cards/generate`, { headers: getAuthHeaders() });
    },

    activateLoyaltyCard: (customerId, loyaltyCardBarcode) => {
        return axios.post(`${baseURL}/loyalty/loyalty-cards/activate`, {
            customerId,
            loyaltyCardBarcode
        }, { headers: getAuthHeaders() });
    },

    deactivateLoyaltyCard: (customerId) => {
        return axios.post(`${baseURL}/loyalty/loyalty-cards/deactivate`, {
            customerId
        }, { headers: getAuthHeaders() });
    },

    // Promotion rules management
    createPromotionRule: (ruleData) => {
        return axios.post(`${baseURL}/loyalty/promotion-rules`, ruleData, { headers: getAuthHeaders() });
    },

    updatePromotionRule: (ruleId, ruleData) => {
        return axios.put(`${baseURL}/loyalty/promotion-rules/${ruleId}`, ruleData, { headers: getAuthHeaders() });
    },

    getPromotionRuleById: (ruleId) => {
        return axios.get(`${baseURL}/loyalty/promotion-rules/${ruleId}`, { headers: getAuthHeaders() });
    },

    getAllPromotionRules: () => {
        return axios.get(`${baseURL}/loyalty/promotion-rules`, { headers: getAuthHeaders() });
    },

    getActivePromotionRules: () => {
        return axios.get(`${baseURL}/loyalty/promotion-rules/active`, { headers: getAuthHeaders() });
    },

    deletePromotionRule: (ruleId) => {
        return axios.delete(`${baseURL}/loyalty/promotion-rules/${ruleId}`, { headers: getAuthHeaders() });
    },

    activatePromotionRule: (ruleId) => {
        return axios.post(`${baseURL}/loyalty/promotion-rules/${ruleId}/activate`, {}, { headers: getAuthHeaders() });
    },

    deactivatePromotionRule: (ruleId) => {
        return axios.post(`${baseURL}/loyalty/promotion-rules/${ruleId}/deactivate`, {}, { headers: getAuthHeaders() });
    },

    // Discount calculation
    calculateDiscounts: (cartData) => {
        return axios.post(`${baseURL}/loyalty/calculate-discounts`, cartData, { headers: getAuthHeaders() });
    },

    // Loyalty points management
    addLoyaltyPoints: (customerId, points, orderId) => {
        return axios.post(`${baseURL}/loyalty/customers/${customerId}/points/add`, {
            points,
            orderId
        }, { headers: getAuthHeaders() });
    },

    redeemLoyaltyPoints: (customerId, points, orderId) => {
        return axios.post(`${baseURL}/loyalty/customers/${customerId}/points/redeem`, {
            points,
            orderId
        }, { headers: getAuthHeaders() });
    },

    // Analytics and reports
    getTopCustomers: (limit = 10) => {
        return axios.get(`${baseURL}/loyalty/analytics/top-customers?limit=${limit}`, { headers: getAuthHeaders() });
    },

    getMostUsedPromotions: (limit = 10) => {
        return axios.get(`${baseURL}/loyalty/analytics/most-used-promotions?limit=${limit}`, { headers: getAuthHeaders() });
    }
};

export default LoyaltyService;
