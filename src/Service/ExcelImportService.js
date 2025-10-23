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
