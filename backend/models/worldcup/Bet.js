const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    betType: { 
        type: String, 
        enum: ['home_win', 'away_win', 'draw'],
        required: true 
    },
    amount: { type: Number, required: true, min: 1000 },
    odds: { type: Number, required: true },
    potentialWin: { type: Number, required: true },
    status: {
        type: String,
        enum: ['PENDING', 'WON', 'LOST', 'CANCELLED'],
        default: 'PENDING'
    },
    actualWin: { type: Number, default: 0 },
    betTime: { type: Date, default: Date.now },
    settledAt: Date,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bet', betSchema);