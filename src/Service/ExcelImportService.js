import axios from 'axios';

const API_BASE_URL = '/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
    };
};

export const importProductsFromExcel = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(
            `${API_BASE_URL}/admin/import/products`,
            formData,
            {
                headers: getAuthHeaders()
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error importing products from Excel:', error);
        throw error;
    }
};

export const importDeliveriesFromExcel = async (file, {
    supplierName = '',
    referenceNumber = '',
    deliveryDate = '',
    notes = '',
    postImmediately = false
} = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (supplierName) formData.append('supplierName', supplierName);
    if (referenceNumber) formData.append('referenceNumber', referenceNumber);
    if (deliveryDate) formData.append('deliveryDate', deliveryDate);
    if (notes) formData.append('notes', notes);
    formData.append('postImmediately', String(!!postImmediately));

    const response = await axios.post(
        `${API_BASE_URL}/admin/import/deliveries`,
        formData,
        { headers: getAuthHeaders() }
    );
    return response.data;
};
