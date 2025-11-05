import axios from "axios";
import { API_BASE_URL } from "../util/constants.js";

export const login = async (data) => {
    // Use relative path - Vite proxy will handle routing to backend
    // This works from both localhost and network IPs
    const loginUrl = import.meta.env.VITE_API_BASE_URL ? 
        `${import.meta.env.VITE_API_BASE_URL}/login` : 
        '/api/login'; // Relative path - Vite proxy forwards to backend
    
    console.log('Login attempt to:', loginUrl);
    console.log('Login data:', { email: data.email, password: '***' });
    
    try {
        const response = await axios.post(loginUrl, data, {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: false // Don't send cookies for CORS
        });
        console.log('Login successful:', response.status);
        return response;
    } catch (error) {
        console.error('Login error:', error);
        console.error('Login error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers
        });
        throw error;
    }
}