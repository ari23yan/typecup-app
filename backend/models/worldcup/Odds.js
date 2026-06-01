const mongoose = require('mongoose');

const oddsSchema = new mongoose.Schema({
    matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        required: true,
        index: true
    },

    homeWin: {
        type: Number,
        required: true
    },

    draw: {
        type: Number,
        required: true
    },

    awayWin: {
        type: Number,
        required: true
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


module.exports = mongoose.model('Odds', oddsSchema);