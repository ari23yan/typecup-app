const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    teamId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name_en: {
        type: String,
    },
    name_fa: {
        type: String,
    },
    flag: {
        type: String,
    },

    fifa_code: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

teamSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});


module.exports = mongoose.model('Team', teamSchema);