const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    eventId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    leagueId: {
        type: String,
        default: '4429'
    },

    season: {
        type: String,
        default: '2026'
    },

    homeTeam: {
        type: String,
        required: true
    },

    awayTeam: {
        type: String,
        required: true
    },

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

    // Minute / progress
    progress: {
        type: String,
        default: null
    },

    round: Number,

    venue: String,

    country: String,

    kickoff: Date,

    dateEvent: String,

    timeEvent: String,

    // Media
    thumbnail: String,

    poster: String,

    video: String,

    // Betting
    odds: {

        home: {
            type: Number,
            default: null
        },

        draw: {
            type: Number,
            default: null
        },

        away: {
            type: Number,
            default: null
        }
    },

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


matchSchema.pre('save', function(next) {

    this.updatedAt = Date.now();

    next();
});


module.exports = mongoose.model('Match', matchSchema);