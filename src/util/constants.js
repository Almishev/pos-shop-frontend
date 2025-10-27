export const AppConstants = {
    RAZORPAY_KEY_ID: "your_key_id"
}

// API Configuration - use environment variable or fallback to relative path
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';