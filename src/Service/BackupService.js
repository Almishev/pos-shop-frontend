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

/** Full PostgreSQL dump — does not delete data */
export const createDatabaseBackup = async (destination = 'local') => {
    const instance = createAuthInstance();
    return await instance.post(`/admin/backup?destination=${encodeURIComponent(destination)}`, {});
};

export const listDatabaseBackups = async () => {
    const instance = createAuthInstance();
    return await instance.get('/admin/backup');
};

export const downloadDatabaseBackup = async (filename) => {
    const instance = createAuthInstance();
    const response = await instance.get(`/admin/backup/${encodeURIComponent(filename)}`, {
        responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};
