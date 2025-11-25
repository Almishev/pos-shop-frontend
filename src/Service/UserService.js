import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Get auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Create axios instance with auth header (gets fresh token on each request)
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

export const addUser = async (user) => {
    const instance = createAuthInstance();
    return instance.post('/admin/register', user);
};

export const deleteUser = async (id) => {
    const instance = createAuthInstance();
    return instance.delete(`/admin/users/${id}`);
};

export const fetchUsers = async () => {
    const instance = createAuthInstance();
    return instance.get('/admin/users');
};