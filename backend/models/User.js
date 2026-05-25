const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  phone: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String
  },

  name: String,
  userName: String,
  lastName: String,
  email: String,

  wallet: {
    balance: { type: Number, default: 0 }, // موجودی کیف پول
    totalBet: { type: Number, default: 0 }, // کل شرط‌بندی‌ها
    totalWin: { type: Number, default: 0 } // کل بردها
  },
  bettingStats: {
    totalBets: { type: Number, default: 0 },
    wonBets: { type: Number, default: 0 },
    lostBets: { type: Number, default: 0 }
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
