import apiClient from "./apiClient";

export const checkPhone = async (phone) => {
    return await apiClient.post("/auth/check-phone", { phone });
};

export const verifyOtp = async (phone, code) => {
    return await apiClient.post("/auth/verify-otp", { phone, code });
};

export const login = async (phone, password) => {
    const result = await apiClient.post("/auth/login", { phone, password });

    if (!result.error && result.token) {
        localStorage.setItem("token", result.token);
    }

    return result;
};

export const register = async (userData) => {
    return await apiClient.post("/auth/register", userData);
};

export const sendPasswordResetOtp = async (phone) => {
    return await apiClient.post("/auth/password-reset/otp", { phone });
};

export const passwordReset = async (phone, password) => {
    return await apiClient.post("/auth/password-reset", { phone, password });
};

export const logout = async () => {
    const res = await apiClient.post("/auth/logout");

    localStorage.removeItem("token");
    return res;
};
