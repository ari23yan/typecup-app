const mongoose = require("mongoose");

const typingScoreSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true 
    },
    score: {
        type: Number,
        required: true,
        index: -1
    },
    wpm: {
        type: Number,
        required: true
    },
    accuracy: {
        type: Number,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    waveReached: {
        type: Number,
        default: 1,
        min: 1,
        max: 5
    },
    correctWords: {
        type: Number,
        default: 0
    },
    mistakes: {
        type: Number,
        default: 0
    },
}, {
    timestamps: true
});

typingScoreSchema.index({ score: -1, accuracy: -1 });

module.exports = mongoose.model("TypingScore", typingScoreSchema);
