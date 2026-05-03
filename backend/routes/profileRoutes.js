const express = require("express");
const router = express.Router();
const { getProfile,updateProfile } = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, getProfile);
router.post("/", authMiddleware, updateProfile);

module.exports = router;
