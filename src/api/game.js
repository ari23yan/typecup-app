import apiClient from "./apiClient";

export const getWordsByWave = async (wave) => {
  return await apiClient.get(`/game/words/${wave}`);
};

export const saveGameResult = async (gameData) => {
  return await apiClient.post("/game/save-result", gameData);
};

export const getLeaderboard = async (params = {}) => {
  return await apiClient.get("/game/leaderboard", params);
};

export const getLeaderboardSeasons = async () => {
  return await apiClient.get("/game/leaderboard/seasons");
};