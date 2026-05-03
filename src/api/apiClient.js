import axios from "axios";
import API_BASE_URL from "../config/api";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 429) {
            return Promise.resolve({
                success: false,
                status: 429,
                message: error.response?.data
            });
        }

        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            return Promise.resolve({
                success: false,
                status: 401,
                message: "نشست شما منقضی شده است. لطفاً دوباره وارد شوید."
            });
        }

        return Promise.resolve({
            success: false,
            status: error.response?.status || 0,
            message: error.response?.data?.message || "خطایی رخ داد."
        });
    }
);

export default apiClient;
