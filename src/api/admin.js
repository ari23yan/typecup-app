import apiClient from "./apiClient";

export const chargeWallet = async (data) => {
    return await apiClient.post("/admin/charge-wallet", data);
};

export const getAllUsers = async () => {
    return apiClient("/admin/users");
};

export const getAllBets = async () => {
    return apiClient("/admin/bets");
};

export const getStats = async () => {
    return apiClient("/admin/stats");
};

// تابع کمکی برای بررسی خطای 403
export const isForbiddenError = (error) => {
    return error?.response?.status === 403 ||
        error?.statusCode === 403 ||
        error?.message?.includes("Admin access restricted");
};