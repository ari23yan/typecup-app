const cron = require('node-cron');
const axios = require('axios');
const Match = require('../models/worldcup/Match');
const Bet = require('../models/worldcup/Bet');
const User = require("../models/User");
const Team = require("../models/worldcup/Team");
const { DateTime } = require('luxon');

// ==================== تنظیمات ====================
const USE_MOCK = false; // false = استفاده از API واقعی

// Mock Data برای تست
const mockMatchData = {
    "games": [
        {
            "_id": "679c9c8a5749c4077500e001",
            "id": "1",
            "home_team_id": "1",
            "away_team_id": "2",
            "home_score": "1",
            "away_score": "2",
            "home_scorers": "Jimenez 45'",
            "away_scorers": "Mokoena 23', Tau 78'",
            "group": "A",
            "matchday": "1",
            "local_date": "06/11/2026 13:00",
            "persian_date": "1405-03-21 13:00",
            "stadiumId": "1",
            "finished": "TRUE",
            "time_elapsed": "finished",
            "type": "group",
            "home_team_name_en": "Mexico",
            "home_team_name_fa": "مکزیک",
            "away_team_name_en": "South Africa",
            "away_team_name_fa": "آفریقای جنوبی"
        }
    ]
};

const stadiumTimezones = {
    1: "America/Mexico_City", 2: "America/Mexico_City", 3: "America/Monterrey",
    4: "America/Chicago", 5: "America/Chicago", 6: "America/Chicago",
    7: "America/New_York", 8: "America/New_York", 9: "America/New_York",
    10: "America/New_York", 11: "America/New_York", 12: "America/Toronto",
    13: "America/Vancouver", 14: "America/Los_Angeles", 15: "America/Los_Angeles",
    16: "America/Los_Angeles"
};
// ==================== توابع کمکی ====================
function getMatchResult(homeScore, awayScore) {
    if (homeScore > awayScore) return 'home';
    if (homeScore < awayScore) return 'away';
    return 'draw';
}

// تسویه شرط‌ها - نسخه اصلاح شده با فیلدهای درست مدل
async function settleBetsForMatch(matchId, result) {
    try {
        const bets = await Bet.find({
            matchId: matchId,
            status: 'PENDING'
        });

        if (!bets.length) return;

        console.log(`💰 Processing ${bets.length} bets for match ${matchId}`);

        for (const bet of bets) {
            const matchResult = getMatchResult(result.homeScore, result.awayScore);
            const expectedSelection = matchResult.toUpperCase();

            let betResult = 'LOST';
            let payoutAmount = 0;

            if (bet.selection === expectedSelection) {
                betResult = 'WON';
                payoutAmount = Math.round(bet.stake * bet.odd);
            }

            // آپدیت با فیلدهای درست مدل
            await Bet.updateOne({ _id: bet._id }, {
                $set: {
                    status: betResult,
                    payout: payoutAmount,
                    settledAt: new Date()
                }
            });

            if (betResult === 'WON') {
                // اصلاح شده: به‌روزرسانی wallet.balance
                await User.updateOne(
                    { _id: bet.userId },
                    {
                        $inc: {
                            'wallet.balance': payoutAmount,
                            'wallet.totalWin': payoutAmount,
                            'bettingStats.wonBets': 1
                        }
                    }
                );
                console.log(`💵 WON → Bet ${bet._id} | +${payoutAmount} تومان`);
            } else {
                // برای شرط‌های باخته، آمار را به‌روزرسانی کنید
                await User.updateOne(
                    { _id: bet.userId },
                    { $inc: { 'bettingStats.lostBets': 1 } }
                );
                console.log(`❌ LOST → Bet ${bet._id}`);
            }
        }
    } catch (error) {
        console.error(`❌ Error settling bets for ${matchId}:`, error.message);
    }
}
// فیکس خودکار شرط‌های قدیمی
async function settleAllPendingBets() {
    try {
        const pendingBets = await Bet.find({ status: 'PENDING' }).lean();

        if (!pendingBets.length) return;

        console.log(`🔧 Auto-fixing ${pendingBets.length} pending bets...`);

        for (const bet of pendingBets) {
            const match = await Match.findOne({ matchId: bet.matchId });
            if (match && (match.isFinished || match.status === 'finished')) {
                await settleBetsForMatch(bet.matchId, {
                    homeScore: Number(match.homeScore || 0),
                    awayScore: Number(match.awayScore || 0)
                });
            }
        }
    } catch (error) {
        console.error('❌ Error in settleAllPendingBets:', error.message);
    }
}

// ==================== پردازش مسابقه ====================
async function processGame(game) {
    try {
        const zone = stadiumTimezones[String(game.stadiumId || game.stadium_id)] || "UTC";
        let stadiumTime = game.local_date?.includes("T")
            ? DateTime.fromISO(game.local_date, { zone })
            : DateTime.fromFormat(game.local_date, "MM/dd/yyyy HH:mm", { zone });

        const matchId = String(game.id).trim();
        let match = await Match.findOne({ matchId });

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

        const homeScore = parseInt(game.home_score || 0);
        const awayScore = parseInt(game.away_score || 0);

        if (!match) {
            // ایجاد مسابقه جدید (کد قبلی)
            let [homeTeam, awayTeam] = await Promise.all([
                Team.findOne({ teamId: String(game.home_team_id).trim() }).lean(),
                Team.findOne({ teamId: String(game.away_team_id).trim() }).lean()
            ]);

            if (!homeTeam) {
                homeTeam = new Team({ teamId: String(game.home_team_id).trim(), name_en: game.home_team_name_en, name_fa: game.home_team_name_fa });
                await homeTeam.save();
            }
            if (!awayTeam) {
                awayTeam = new Team({ teamId: String(game.away_team_id).trim(), name_en: game.away_team_name_en, name_fa: game.away_team_name_fa });
                await awayTeam.save();
            }

            match = new Match({
                matchId, homeTeam: homeTeam._id, awayTeam: awayTeam._id,
                homeTeamId: String(game.home_team_id).trim(),
                awayTeamId: String(game.away_team_id).trim(),
                homeScore, awayScore,
                localDate: game.local_date,
                kickoffUtc: stadiumTime.toUTC().toISO(),
                persianDate: game.persian_date,
                status, round: parseInt(game.matchday || 0),
                isFinished, isLive,
                venue: `Stadium ${game.stadiumId || game.stadium_id}`,
                group: game.group, matchday: game.matchday,
                timeElapsed: game.time_elapsed, type: game.type,
                leagueId: "4429", betsSettled: false,
                stadiumId: game.stadiumId || game.stadium_id
            });
            await match.save();
            console.log(`✅ NEW MATCH: ${matchId}`);
        } else {
            const updateData = { homeScore, awayScore, status, isFinished, isLive, timeElapsed: game.time_elapsed };

            if (status === 'finished' && !match.betsSettled) {
                await settleBetsForMatch(matchId, { homeScore, awayScore });
                updateData.betsSettled = true;
            }

            await Match.updateOne({ matchId }, { $set: updateData });
            console.log(`✅ UPDATED: ${matchId} → ${status}`);
        }
    } catch (err) {
        console.error(`❌ Error in processGame ${game.id}:`, err.message);
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
            const batchSize = 5;
            for (let i = 0; i < games.length; i += batchSize) {
                const batch = games.slice(i, i + batchSize);
                await Promise.all(batch.map(game => processGame(game)));
            }
        }

        // فیکس شرط‌های قدیمی
        await settleAllPendingBets();

        console.log('✅ Cron job completed\n');
    } catch (err) {
        console.error('❌ Cron error:', err.message);
    }
});

console.log('🚀 Cron job started - checking every minute');