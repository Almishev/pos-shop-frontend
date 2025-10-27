import axios from "axios";
import { API_BASE_URL } from "../util/constants.js";

export const login = async (data) => {
    // For login, use direct backend URL since it's permitAll()
    const loginUrl = import.meta.env.VITE_API_BASE_URL ? 
        `${import.meta.env.VITE_API_BASE_URL}/login` : 
        'http://localhost:8087/api/v1.0/login';
    return await axios.post(loginUrl, data);
}