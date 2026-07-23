const cron = require('node-cron');
const axios = require('axios');
const Match = require('../models/worldcup/Match');
const Bet = require('../models/worldcup/Bet');
const User = require("../models/User");
const Team = require("../models/worldcup/Team");
const { DateTime } = require('luxon');

// ==================== تنظیمات ====================
const USE_MOCK = false;

// Mock Data (برای تست)
const mockMatchData = { /* ... همان قبلی */ };

// ==================== توابع کمکی ====================
function getMatchResult(homeScore, awayScore) {
    if (homeScore > awayScore) return 'home';
    if (homeScore < awayScore) return 'away';
    return 'draw';
}

const stadiumTimezones = {
    1: "America/Mexico_City", 2: "America/Mexico_City", 3: "America/Monterrey",
    4: "America/Chicago", 5: "America/Chicago", 6: "America/Chicago",
    7: "America/New_York", 8: "America/New_York", 9: "America/New_York",
    10: "America/New_York", 11: "America/New_York", 12: "America/Toronto",
    13: "America/Vancouver", 14: "America/Los_Angeles", 15: "America/Los_Angeles",
    16: "America/Los_Angeles"
};

async function settleBetsForMatch(matchId, result) {
    try {
        const bets = await Bet.find({ matchId: matchId, status: 'PENDING' });
        if (!bets.length) return;

        console.log(`💰 Processing ${bets.length} bets for match ${matchId}`);

        for (const bet of bets) {
            const matchResult = getMatchResult(result.homeScore, result.awayScore);
            const betResult = (bet.selection === matchResult.toUpperCase()) ? 'WON' : 'LOST';
            const payoutAmount = (betResult === 'WON') ? Math.round(bet.stake * bet.odd) : 0;

            await Bet.updateOne({ _id: bet._id }, {
                $set: {
                    status: betResult,
                    payout: payoutAmount,
                    settledAt: new Date()
                }
            });

            if (betResult === 'WON') {
                await User.updateOne(
                    { _id: bet.userId },
                    { $inc: { 'wallet.balance': payoutAmount, 'wallet.totalWin': payoutAmount, 'bettingStats.wonBets': 1 } }
                );
            } else {
                await User.updateOne({ _id: bet.userId }, { $inc: { 'bettingStats.lostBets': 1 } });
            }
        }
    } catch (error) {
        console.error(`❌ Error settling bets for ${matchId}:`, error.message);
    }
}

// ==================== پردازش مسابقه (اصلاح اصلی) ====================
async function processGame(game) {
    try {
        const matchId = String(game.id || game._id).trim();
        const stadiumId = String(game.stadium_id || game.stadiumId || game.stadiumID);

        const zone = stadiumTimezones[stadiumId] || "UTC";

        let stadiumTime;
        if (game.local_date?.includes("T")) {
            stadiumTime = DateTime.fromISO(game.local_date, { zone });
        } else {
            stadiumTime = DateTime.fromFormat(game.local_date, "MM/dd/yyyy HH:mm", { zone });
        }

        // وضعیت
        let status = 'notstarted';
        let isFinished = false;
        let isLive = false;

        if (game.finished === 'TRUE' || ['FT', 'finished', 'fulltime'].includes(game.time_elapsed)) {
            status = 'finished';
            isFinished = true;
        } else if (['live', '1st', '2nd'].includes(game.time_elapsed)) {
            status = 'live';
            isLive = true;
        } else if (['HT', 'halftime'].includes(game.time_elapsed)) {
            status = 'HT';
            isLive = true;
        }

        const homeScore = parseInt(game.home_score) || 0;
        const awayScore = parseInt(game.away_score) || 0;

        // === مدیریت تیم‌ها (بهبود مهم) ===
        let homeTeamDoc = null;
        let awayTeamDoc = null;

        // تلاش برای پیدا کردن تیم با teamId
        if (game.home_team_id && game.home_team_id !== "0") {
            homeTeamDoc = await Team.findOne({ teamId: String(game.home_team_id).trim() });
        }
        if (game.away_team_id && game.away_team_id !== "0") {
            awayTeamDoc = await Team.findOne({ teamId: String(game.away_team_id).trim() });
        }

        // اگر تیم پیدا نشد → ایجاد با نام و teamId
        if (!homeTeamDoc && game.home_team_name_en) {
            homeTeamDoc = await Team.findOneAndUpdate(
                { teamId: String(game.home_team_id || '0').trim() },
                {
                    teamId: String(game.home_team_id || '0').trim(),
                    name_en: game.home_team_name_en,
                    name_fa: game.home_team_name_fa || game.home_team_label,
                    label: game.home_team_label || null
                },
                { upsert: true, new: true }
            );
        }

        if (!awayTeamDoc && game.away_team_name_en) {
            awayTeamDoc = await Team.findOneAndUpdate(
                { teamId: String(game.away_team_id || '0').trim() },
                {
                    teamId: String(game.away_team_id || '0').trim(),
                    name_en: game.away_team_name_en,
                    name_fa: game.away_team_name_fa || game.away_team_label,
                    label: game.away_team_label || null
                },
                { upsert: true, new: true }
            );
        }

        // پیدا کردن یا ایجاد مسابقه
        let match = await Match.findOne({ matchId });

        const updateData = {
            homeScore,
            awayScore,
            status,
            isFinished,
            isLive,
            timeElapsed: game.time_elapsed,
            localDate: game.local_date,
            persianDate: game.persian_date,
            kickoffUtc: stadiumTime.toUTC().toISO(),
            venue: `Stadium ${stadiumId}`,
            group: game.group,
            matchday: game.matchday,
            type: game.type,
            stadiumId: stadiumId,
        };

        if (homeTeamDoc) {
            updateData.homeTeam = homeTeamDoc._id;
            updateData.homeTeamId = String(game.home_team_id || homeTeamDoc.teamId);
        }
        if (awayTeamDoc) {
            updateData.awayTeam = awayTeamDoc._id;
            updateData.awayTeamId = String(game.away_team_id || awayTeamDoc.teamId);
        }

        if (!match) {
            // ایجاد جدید
            match = new Match({
                matchId,
                ...updateData,
                betsSettled: false,
                leagueId: "4429",
            });
            await match.save();
            console.log(`✅ NEW MATCH: ${matchId} | ${game.home_team_name_en} vs ${game.away_team_name_en}`);
        } else {
            // بروزرسانی
            if (status === 'finished' && !match.betsSettled) {
                await settleBetsForMatch(matchId, { homeScore, awayScore });
                updateData.betsSettled = true;
            }

            await Match.updateOne({ matchId }, { $set: updateData });
            console.log(`✅ UPDATED: ${matchId} → ${status} | ${homeScore}-${awayScore}`);
        }
    } catch (err) {
        console.error(`❌ Error processing game ${game.id}:`, err.message);
    }
}

// ==================== کرون جاب ====================
cron.schedule('* * * * *', async () => {
    console.log('🔄 Checking matches...');

    try {
        let games = USE_MOCK
            ? mockMatchData.games
            : (await axios.get('http://185.173.104.222:3000/games', { timeout: 30000 })).data.games || [];

        if (games.length) {
            const batchSize = 8;
            for (let i = 0; i < games.length; i += batchSize) {
                const batch = games.slice(i, i + batchSize);
                await Promise.all(batch.map(game => processGame(game)));
            }
        }

        console.log('✅ Cron job completed successfully\n');
    } catch (err) {
        console.error('❌ Cron error:', err.message);
    }
});

console.log('🚀 Cron job started - checking every minute');