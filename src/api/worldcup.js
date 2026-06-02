import apiClient from "./apiClient";

export const getProfile = async () => {
    return apiClient("/worldcup");
};

export const chargeWallet = async (data) => {
    return await apiClient.post("/worldcup/charge-wallet", data);
};

