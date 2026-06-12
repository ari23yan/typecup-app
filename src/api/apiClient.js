import axios from "axios";
import API_BASE_URL from "../config/api";
import toast from "react-hot-toast";

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
            toast.error("تعداد درخواست‌ها بیش از حد مجاز است.");
            return Promise.resolve({ success: false, status: 429 });
        }

        if (error.response?.status === 401) {
            localStorage.removeItem("token");

            toast.error("نشست شما منقضی شده است. در حال انتقال به صفحه اصلی...", {
                autoClose: 2000
            });

            setTimeout(() => {
                window.location.href = "/";
            }, 2000);

            return Promise.resolve({
                success: false,
                status: 401,
                message: "نشست شما منقضی شده است."
            });
        }

        // مدیریت خطای 403 - دسترسی غیرمجاز
        if (error.response?.status === 403) {
            toast.error("شما دسترسی به این بخش را ندارید. در حال انتقال به صفحه اصلی...", {
                autoClose: 2000
            });
            window.location.href = "/";
            return Promise.resolve({
                success: false,
                status: 403,
                message: "دسترسی غیرمجاز"
            });
        }

        const errorMessage = error.response?.data?.message || "خطایی رخ داد.";
        // toast.error(errorMessage);

        return Promise.resolve({
            success: false,
            status: error.response?.status || 0,
            message: errorMessage
        });
    }
);

export default apiClient;