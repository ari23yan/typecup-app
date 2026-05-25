// models/Match.js
const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    matchId: { type: String, required: true, unique: true },
    stage: { type: String, enum: ['group', 'round_of_16', 'quarter_final', 'semi_final', 'final'], required: true },
    round: String, // برای مرحله حذفی: 'round_of_16', 'quarter_finals', etc.
    group: { type: String, default: null }, // فقط برای مرحله گروهی
    
    // اطلاعات مسابقه
    day_of_week_fa: String,
    date_fa: String,
    time_fa: String,
    
    home_team: {
        name: String,
        flag_url: String,
        odds_win: String,
        isTBD: { type: Boolean, default: false } // برای مسابقاتی که تیمش هنوز مشخص نیست
    },
    away_team: {
        name: String,
        flag_url: String,
        odds_win: String,
        isTBD: { type: Boolean, default: false }
    },
    draw_odds: String,
    
    // وضعیت مسابقه
    matchStatus: { 
        type: String, 
        enum: ['NOT_STARTED', 'IN_PROGRESS', 'FINISHED', 'TBD'],
        default: 'NOT_STARTED'
    },
    matchStartTime: Date,
    
    // نتیجه
    result: {
        home_score: { type: Number, default: null },
        away_score: { type: Number, default: null },
        winner: { type: String, enum: ['home', 'away', 'draw', null], default: null }
    },
    
    // برای مسابقات حذفی - تعیین تیم‌های صعود کننده
    advancesTo: {
        winnerAdvancesTo: String, // matchId بعدی که برنده بهش میره
        loserAdvancesTo: String  // برای رده‌بندی
    },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// ایندکس برای جستجوی بهتر
matchSchema.index({ stage: 1, matchStatus: 1 });
matchSchema.index({ 'home_team.name': 1, 'away_team.name': 1 });

module.exports = mongoose.model('Match', matchSchema);