// models/Bet.js

const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({

    // user
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // match
    matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        required: true
    },

    eventId: {
        type: String,
        required: true
    },

    // selected market -کاربر روی چی شرط بسته؟
    selection: {
        type: String,
        enum: [
            'HOME',
            'DRAW',
            'AWAY'
        ],
        required: true
    },

    // locked odds -ضریبی که موقع ثبت bet قفل شده.
    odd: {
        type: Number,
        required: true
    },

    // amount - مبلغ شرط.
    stake: {
        type: Number,
        required: true
    },

    // possible payout -مبلغ برد احتمالی.
    possibleWin: {
        type: Number,
        required: true
    },

    // actual payout - برد واقعی که پرداخت شده. - مبلغی که برنده شده
    payout: {
        type: Number,
        default: 0
    },

    // result
    status: {
        type: String,
        enum: [
            'PENDING',
            'WON',
            'LOST',
            'CANCELLED',
        ],
        default: 'PENDING'
    },

    // settlement - زمانی که شرط تسویه شد.
    settledAt: {
        type: Date,
        default: null
    },

    // match snapshot
    matchSnapshot: {

        homeTeam: String,

        awayTeam: String,

        kickoff: Date
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


betSchema.pre('save', function (next) {

    this.updatedAt = Date.now();

    next();
});


module.exports = mongoose.model('Bet', betSchema);