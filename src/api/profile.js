import apiClient from "./apiClient";

export const getProfile = async () => {
    return apiClient("/profile");
};

export const updateProfile = (data) => {
    return apiClient("/profile", {
        method: "POST",
        body: JSON.stringify(data)
    });
};
