import apiClient from "./apiClient";

export const getWordsByWave = async (wave) => {
  return await apiClient.get(`/game/words/${wave}`);
};

export const saveGameResult = async (gameData) => {
  return await apiClient.post("/game/save-result", gameData);
};

export const getLeaderboard = async (limit = 10, textId = null) => {
  let url = `/game/leaderboard?limit=${limit}`;

  if (textId) {
    url += `&textId=${textId}`;
  }

  return await apiClient.get(url);
};
