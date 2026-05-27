import apiClient from "./apiClient";
import CryptoJS from 'crypto-js';
const secretKey = import.meta.env.VITE_GAME_SECRET_KEY; 


const createSignature = (score, correctWords, wpm) => {
  const dataToHash = `${score}-${correctWords}-${wpm}`;
  const signature = CryptoJS.HmacSHA256(dataToHash, secretKey).toString();
  return signature;
};

export const getWordsByWave = async (wave) => {
  return await apiClient.get(`/game/words/${wave}`);
};

export const saveGameResult = async (gameData) => {
  const signature = createSignature(
    gameData.score,
    gameData.correctWords,
    gameData.wpm,
    gameData.duration,
    gameData.accuracy,
    gameData.waveReached,
    gameData.errors,
  );
  const dataToSend = {
    ...gameData,
    signature: signature,
  };

  return await apiClient.post("/game/save-result", dataToSend);
};

export const getLeaderboard = async (params = {}) => {
  return await apiClient.get("/game/leaderboard", { params });
};

export const getLeaderboardSeasons = async () => {
  return await apiClient.get("/game/leaderboard/seasons");
};
