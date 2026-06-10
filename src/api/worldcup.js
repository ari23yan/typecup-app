import apiClient from "./apiClient";

export const getMatches = async () => {
    try {
        const response = await apiClient.get(`/worldcup/matches`);
        return response;
    } catch (error) {
        console.error('Error fetching matches:', error);
        return { success: false, data: null };
    }
};

export const getUserBets = async () => {
    try {
        const response = await apiClient.get(`/worldcup/my-bets`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return response;
    } catch (error) {
        console.error('Error fetching user bets:', error);
        return { success: false, data: [] };
    }
};

export const getUserWallet = async () => {
    try {
        const response = await apiClient.get(`/worldcup/wallet`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        return response;
    } catch (error) {
        console.error('Error fetching wallet:', error);
        return { success: false, data: { balance: 0, pendingBetsCount: 0, totalPendingAmount: 0 } };
    }
};

export const placeBet = async (betData) => {
    try {
        const response = await apiClient.post(
            '/worldcup/bet',
            betData,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            }
        );

        return response;
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: error.response?.data?.message
        };
    }
};