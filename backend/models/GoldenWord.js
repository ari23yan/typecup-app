const mongoose = require('mongoose');

const goldenWordSchema = new mongoose.Schema({
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
    multiplier: {
        type: Number,
        default: 10 // ضریب امتیاز کلمه طلایی (X10)
    },
    isActive: {
        type: Boolean,
        default: true // آیا کلمه طلایی فعال است؟
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('GoldenWord', goldenWordSchema);