const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateToken = require('../middlewares/authMiddleware');
// میتونید یه middleware برای بررسی ادمین اضافه کنید
// const isAdmin = (req, res, next) => {
//     // فرض میکنیم req.user.role === 'admin'
//     if (req.user && req.user.userName === 'admin') {
//         next();
//     } else {
//         res.status(403).json({ success: false, message: "دسترسی غیرمجاز" });
//     }
// };

router.post('/import-matches', authenticateToken, adminController.importMatches);
router.post('/import-teams', authenticateToken, adminController.importTeams);
router.post('/import-odds', authenticateToken, adminController.importOdds);
router.post('/charge-wallet', authenticateToken, adminController.chargeWallet);
router.get('/users', authenticateToken, adminController.getAllUsers);
router.get('/bets', authenticateToken, adminController.getAllBets);
router.get('/stats', authenticateToken, adminController.getStats);

module.exports = router;