const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    matchId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    leagueId: {
        type: String,
        default: '4429'
    },

    type: {
        type: String,
        default: null
    },


    homeTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',  // ارتباط با مدل Team
        required: true
    },

    awayTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',  // ارتباط با مدل Team
        required: true
    },

    // نگهداری ID اصلی تیم از سرویس خارجی
    homeTeamId: String,
    awayTeamId: String,

    homeTeamBadge: String,
    awayTeamBadge: String,

    // Scores
    homeScore: {
        type: Number,
        default: null
    },

    awayScore: {
        type: Number,
        default: null
    },
    localDate: Date,
    persianDate: String,
    // Match status
    status: {
        type: String,
        enum: [
            'NS',      // Not Started
            'LIVE',
            'HT',      // Half Time
            'FT',      // Full Time
            'POSTPONED',
            'CANCELLED'
        ],
        default: 'NS'
    },
    group: {
        type: String,
        default: null
    },
    round: Number,

   
    timeElapsed: String,
  
    // Control
    isFinished: {
        type: Boolean,
        default: false
    },

    isLive: {
        type: Boolean,
        default: false
    },

    isPostponed: {
        type: Boolean,
        default: false
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

matchSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Match', matchSchema);