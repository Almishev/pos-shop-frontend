import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const instance = axios.create({ baseURL: API_BASE_URL, headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });

export const addUser = async (user) => instance.post('/admin/register', user);

export const deleteUser = async (id) => instance.delete(`/admin/users/${id}`);

export const fetchUsers = async () => instance.get('/admin/users');