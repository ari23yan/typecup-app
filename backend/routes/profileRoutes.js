const express = require("express");
const router = express.Router();
const { getProfile,updateProfile,getTypingStats } = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, getProfile);
router.post("/", authMiddleware, updateProfile);
router.get("/typing-stats",authMiddleware, getTypingStats);

module.exports = router;
