import axios from "axios";
import { API_BASE_URL } from "../util/constants.js";

export const addCategory = async (category) => {
    return await axios.post(`${API_BASE_URL}/admin/categories`, category, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const deleteCategory = async (categoryId) => {
    return await axios.delete(`${API_BASE_URL}/admin/categories/${categoryId}`, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}

export const fetchCategories = async () => {
    return await axios.get(`${API_BASE_URL}/categories`, {headers: {'Authorization': `Bearer ${localStorage.getItem('token')}`}});
}