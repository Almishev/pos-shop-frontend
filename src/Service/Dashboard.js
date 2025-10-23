import axios from "axios";

export const fetchDashboardData = async () => {
    return await axios.get("/api/dashboard", {headers: {'Authorization': `Bearer ${localStorage.getItem("token")}`}});
}

