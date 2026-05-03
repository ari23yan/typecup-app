const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        unique: true
    },
    language: {
        type: String,
        enum: ['persian', 'english'],
        required: true
    },
    difficulty: {
        type: Number,
        enum: [1, 2, 3, 4, 5], // سطح دشواری متناسب با مرحله
        default: 1
    },
    category: {
        type: String,
        default: 'general'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Word', wordSchema);