import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const auth = () => axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

export const fetchAudit = (params) => auth().get("/audit", { params });

export const fetchOperators = () => auth().get("/audit/operators");

export const logoutRequest = () => auth().post("/logout");
