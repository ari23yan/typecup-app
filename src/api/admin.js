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

// آپدیت ضریب تکی
export const updateOdd = async (data) => {
    try {
        const response = await axios.post(`/admin/update-odd`, data, {
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};


// دریافت لیست مسابقات با ضرایب
export const getMatchesWithOdds = async () => {
    try {
        const response = await apiClient.get(`/admin/matches-with-odds`, {
        });
        return response;
    } catch (error) {
        throw error.response?.data || error;
    }
};


// تابع کمکی برای بررسی خطای 403
export const isForbiddenError = (error) => {
    return error?.response?.status === 403 ||
        error?.statusCode === 403 ||
        error?.message?.includes("Admin access restricted");
};
