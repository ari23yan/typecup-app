const express = require("express");
const router = express.Router();

const {
  checkPhone,
  verifyOtp,
  register,
  resetPassword,
  login,
  logout,
  sendPasswordResetOtp
} = require("../controllers/authController");

router.post("/check-phone", checkPhone);
router.post("/login", login);
router.post("/logout", logout);
router.post("/verify-otp", verifyOtp);
router.post("/register", register);
router.post("/password-reset/otp", sendPasswordResetOtp);
router.post("/password-reset", resetPassword);

module.exports = router;
