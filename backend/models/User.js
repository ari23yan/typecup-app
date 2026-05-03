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

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
