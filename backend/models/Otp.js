const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
  phone: String,
  code: String,
  expiresAt: Date
});

module.exports = mongoose.model("Otp", OtpSchema);
