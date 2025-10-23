import axios from "axios";
import { API_BASE_URL } from "../util/constants.js";

export const login = async (data) => {
    return await axios.post(`${API_BASE_URL}/login`, data);
}