const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/words/:wave', authMiddleware, gameController.getWordsByWave);
router.post('/save-result', authMiddleware, gameController.saveGameResult);
router.get('/leaderboard', gameController.getLeaderboard);

module.exports = router;