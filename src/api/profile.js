// api/profile.js
import apiClient from "./apiClient";

export const getProfile = async () => {
    try {
        const response = await apiClient.get("/profile");
        return response; 
    } catch (error) {
        console.error("Get profile error:", error);
        throw error;
    }
};

export const updateProfile = async (data) => {
    try {
        const response = await apiClient.post("/profile", data); 
        return response;
    } catch (error) {
        console.error("Update profile error:", error);
        throw error;
    }
};

export const getTypingStats = async () => {
    try {
        const response = await apiClient.get("/profile/typing-stats");
        return response;
    } catch (error) {
        console.error("Get typing stats error:", error);
        throw error;
    }
};