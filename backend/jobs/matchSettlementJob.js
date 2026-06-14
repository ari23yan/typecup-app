const cron = require('node-cron');
const axios = require('axios');
const Match = require('../models/worldcup/Match');
const Odds = require('../models/worldcup/Odds');
const Bet = require('../models/worldcup/Bet');
const User = require("../models/User");
const Team = require("../models/worldcup/Team");
const { DateTime } = require('luxon');
// برای تست - استفاده از MOCK DATA
const USE_MOCK = false; // تغییر به false برای استفاده از API واقعی

// Mock Data
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

// every 1 minute
cron.schedule('* * * * *', async () => {
    console.log('checking matches...');
    console.log('=================================');

    try {
        // افزایش timeout کلی برای کل عملیات
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Cron job timeout after 2 minutes')), 120000)
        );

        const mainPromise = (async () => {
            let games;

            if (USE_MOCK) {
                console.log('🔵 Using MOCK DATA for testing');
                games = mockMatchData.games;
            } else {
                const response = await axios.get('http://185.173.104.222:3000/games', {
                    timeout: 30000 // 30 ثانیه
                });
                games = response.data.games || [];
            }

            if (!games || !games.length) {
                console.log('No games data received');
                return;
            }

            console.log(`📊 Total games from API: ${games.length}`);

            // پردازش همزمان مسابقات با Promise.all
            const batchSize = 5; // پردازش 5 تایی همزمان
            for (let i = 0; i < games.length; i += batchSize) {
                const batch = games.slice(i, i + batchSize);
                await Promise.all(batch.map(game => processGame(game)));
                console.log(`✅ Processed batch ${i / batchSize + 1}/${Math.ceil(games.length / batchSize)}`);
            }
        })();

        // اجرا با timeout
        await Promise.race([mainPromise, timeoutPromise]);

        console.log('=================================');
        console.log('Cron job completed\n');

    } catch (err) {
        console.log('❌ Cron job error:', err.message);
        console.error(err);
    }
});

const stadiumTimezones = {
    1: "America/Mexico_City",
    2: "America/Mexico_City",
    3: "America/Monterrey",
    4: "America/Chicago",
    5: "America/Chicago",
    6: "America/Chicago",
    7: "America/New_York",
    8: "America/New_York",
    9: "America/New_York",
    10: "America/New_York",
    11: "America/New_York",
    12: "America/Toronto",
    13: "America/Vancouver",
    14: "America/Los_Angeles",
    15: "America/Los_Angeles",
    16: "America/Los_Angeles"
};

// تابع جداگانه برای پردازش هر مسابقه
async function processGame(game) {
    const zone = stadiumTimezones[String(game.stadium_id)];

    let stadiumTime;

    if (game.local_date.includes("T")) {
        stadiumTime = DateTime.fromISO(game.local_date, { zone });
    } else {
        stadiumTime = DateTime.fromFormat(
            game.local_date,
            "MM/dd/yyyy HH:mm",
            { zone }
        );
    }

    const iranTime = stadiumTime.setZone("Asia/Tehran"); const matchId = String(game.id).trim();

    // جستجوی مسابقه در دیتابیس
    let match = await Match.findOne({ matchId: matchId });

    // تعیین وضعیت مسابقه با منطق کامل
    let status = 'notstarted';
    let isFinished = false;
    let isLive = false;

    // محاسبه زمان مسابقه


    // منطق تعیین وضعیت (همان کد قبلی شما)
    if (game.finished === 'TRUE' || game.time_elapsed === 'FT' || game.time_elapsed === 'fulltime') {
        status = 'finished';
        isFinished = true;
        isLive = false;
    } else if (game.time_elapsed === 'live' || game.time_elapsed === '1st' || game.time_elapsed === '2nd') {
        status = 'live';
        isLive = true;
        isFinished = false;
    } else if (game.time_elapsed === 'HT' || game.time_elapsed === 'halftime') {
        status = 'HT';
        isLive = true;
        isFinished = false;
    }
    else if (game.time_elapsed === 'notstarted' || game.time_elapsed === 'NS') {
        status = 'notstarted';
        isLive = false;
        isFinished = false;
    } else {
        status = 'notstarted';
        isLive = false;
        isFinished = false;
    }

    // اگر مسابقه وجود نداشت، ایجاد کن
    if (!match) {
        // پیدا کردن تیم‌ها (با استفاده از lean() برای سرعت بیشتر)
        let [homeTeam, awayTeam] = await Promise.all([
            Team.findOne({ teamId: String(game.home_team_id).trim() }).lean(),
            Team.findOne({ teamId: String(game.away_team_id).trim() }).lean()
        ]);

        if (!homeTeam) {
            homeTeam = new Team({
                teamId: String(game.home_team_id).trim(),
                name_en: game.home_team_name_en,
                name_fa: game.home_team_name_fa,
            });
            await homeTeam.save();
        }

        if (!awayTeam) {
            awayTeam = new Team({
                teamId: String(game.away_team_id).trim(),
                name_en: game.away_team_name_en,
                name_fa: game.away_team_name_fa,
            });
            await awayTeam.save();
        }

        // ایجاد مسابقه جدید
        match = new Match({
            matchId: matchId,
            homeTeam: homeTeam._id,
            awayTeam: awayTeam._id,
            homeTeamId: String(game.home_team_id).trim(),
            awayTeamId: String(game.away_team_id).trim(),
            homeScore: game.home_score !== 'null' ? parseInt(game.home_score) : 0,
            awayScore: game.away_score !== 'null' ? parseInt(game.away_score) : 0,
            localDate: game.local_date,
            kickoffUtc: DateTime.fromFormat(
                game.local_date,
                "MM/dd/yyyy HH:mm",
                { zone }
            ).toUTC().toISO(),
            persianDate: game.persian_date,
            status: status,
            round: parseInt(game.matchday),
            isFinished: isFinished,
            isLive: isLive,
            venue: game.stadium_id ? `Stadium ${game.stadium_id}` : null,
            group: game.group,
            matchday: game.matchday,
            timeElapsed: game.time_elapsed,
            type: game.type,
            homeScorers: game.home_scorers !== 'null' ? game.home_scorers : null,
            awayScorers: game.away_scorers !== 'null' ? game.away_scorers : null,
            leagueId: "4429",
            betsSettled: false,
            isPostponed: false,
            stadiumId: game.stadium_id
        });

        await match.save();
        console.log(`✅ NEW MATCH: ${matchId}`);
    } else {
        // به‌روزرسانی مسابقه موجود با استفاده از updateOne برای سرعت بیشتر
        const updateData = {
            homeScore: game.home_score !== 'null' ? parseInt(game.home_score) : 0,
            awayScore: game.away_score !== 'null' ? parseInt(game.away_score) : 0,
            status: status,
            isFinished: isFinished,
            isLive: isLive,
            timeElapsed: game.time_elapsed
        };

        if (game.home_scorers !== 'null') {
            updateData.homeScorers = game.home_scorers;
        }
        if (game.away_scorers !== 'null') {
            updateData.awayScorers = game.away_scorers;
        }

        if (status === 'finished' && !match.betsSettled) {
            updateData.betsSettled = true;
            console.log(`🏁 Match ${matchId} finished, bets ready to settle`);
        }

        await Match.updateOne({ matchId: matchId }, { $set: updateData });
        console.log(`✅ UPDATED: ${matchId} - ${status}`);
    }
}

console.log('Cron job started - checking every minute');