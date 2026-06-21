// routes/worldcupRoutes.js
const express = require('express');
const router = express.Router();
const worldcupController = require('../controllers/worldcupController');
const authenticateToken = require('../middlewares/authMiddleware');

router.get('/matches', authenticateToken, worldcupController.getMatches);
router.post('/bet', authenticateToken, worldcupController.placeBet);
router.get('/my-bets', authenticateToken, worldcupController.getMyBets);
router.get('/wallet', authenticateToken, worldcupController.getWallet);
router.get('/live-matches', authenticateToken, worldcupController.getLiveMatches);
router.get('/leaderboard', authenticateToken, worldcupController.getLeaderboard);

module.exports = router;