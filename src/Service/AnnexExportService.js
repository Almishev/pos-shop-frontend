import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const auth = () => axios.create({
    baseURL: API_BASE_URL,
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

export const fetchAnnexTable = (params) => auth().get("/reports/annex29", { params });

export const downloadAnnexCsv = (params) => auth().get("/reports/annex29/csv", {
    params,
    responseType: "blob"
});
