const cron = require('node-cron');
const axios = require('axios');
const Match = require('../models/worldcup/Match');
const Odds = require('../models/worldcup/Odds');
const Bet = require('../models/worldcup/Bet');
const User = require("../models/User");
const Team = require("../models/worldcup/Team");

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
            "stadium_id": "1",
            "finished": "TRUE",
            "time_elapsed": "FT",
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
        let games;

        if (USE_MOCK) {
            // استفاده از MOCK DATA برای تست
            console.log('🔵 Using MOCK DATA for testing');
            games = mockMatchData.games;
        } else {
            // استفاده از API واقعی
            const response = await axios.get('https://worldcup26.ir/get/games');
            games = response.data.games || [];
        }

        if (!games || !games.length) {
            console.log('No games data received');
            return;
        }

        // فقط بازی 1 رو برای تست بگیر
        const matches = await Match.find({
            isFinished: false,
            matchId: '1'  // فقط بازی مکزیک vs آفریقای جنوبی
        });

        console.log(`Found ${matches.length} unfinished matches to check`);

        for (const match of matches) {
            console.log(`\n--- Processing match ${match.matchId} ---`);

            try {
                const game = games.find(g => g.id === match.matchId || g._id === match.matchId);

                if (!game) {
                    console.log(`No game data found for match ${match.matchId}`);
                    continue;
                }

                console.log(`Match: ${game.home_team_name_en} vs ${game.away_team_name_en}`);
                console.log(`API Status: finished=${game.finished}, time_elapsed=${game.time_elapsed}`);
                console.log(`API Score: ${game.home_score} - ${game.away_score}`);

                // Update scores
                match.homeScore = game.home_score !== 'null' ? parseInt(game.home_score) : 0;
                match.awayScore = game.away_score !== 'null' ? parseInt(game.away_score) : 0;

                console.log(`Updated scores: ${match.homeScore} - ${match.awayScore}`);

                // Map status
                let status = 'NS';
                if (game.finished === 'TRUE' || game.time_elapsed === 'FT') {
                    status = 'FT';
                } else if (game.time_elapsed === 'LIVE' || game.time_elapsed === '2nd' || game.time_elapsed === '1st') {
                    status = 'LIVE';
                } else if (game.time_elapsed === 'HT' || game.time_elapsed === 'halftime') {
                    status = 'HT';
                }
                match.status = status;
                match.isLive = (status === 'LIVE');

                console.log(`Match status: ${status}`);

                // FT = Full Time
                if (status === 'FT') {
                    console.log('🏁 Match finished! Settling bets...');
                    match.isFinished = true;

                    // Update odds status
                    await Odds.updateMany(
                        { matchId: match.matchId },
                        {
                            status: 'SETTLED',
                            updatedAt: new Date()
                        }
                    );
                    console.log('✓ Odds marked as SETTLED');

                    // Detect result
                    let result = 'DRAW';
                    if (match.homeScore > match.awayScore) {
                        result = 'HOME';
                    } else if (match.homeScore < match.awayScore) {
                        result = 'AWAY';
                    }

                    console.log(`Match result: ${result} (${match.homeScore}-${match.awayScore})`);

                    // Get pending bets
                    const bets = await Bet.find({
                        matchId: match.matchId,
                        status: 'PENDING'
                    });

                    console.log(`Found ${bets.length} pending bets for this match`);

                    if (bets.length === 0) {
                        console.log('⚠️ No pending bets found!');
                    }

                    // Process each bet
                    for (const bet of bets) {
                        console.log(`\n--- Processing bet ${bet._id} ---`);
                        console.log(`Bet selection: ${bet.selection}`);
                        console.log(`Bet stake: ${bet.stake}`);
                        console.log(`Possible win: ${bet.possibleWin}`);
                        const user = await User.findById(bet.userId);

                        if (!user) {
                            console.log(`❌ User not found for bet ${bet._id}`);
                            continue;
                        }

                        console.log(`User: ${user.email || user._id}`);
                        console.log(`User balance before: ${user.wallet.balance}`);

                        if (bet.selection === result) {
                            // BET WON
                            bet.status = 'WON';
                            bet.payout = bet.possibleWin;

                            // Update user wallet
                            user.wallet.balance += bet.possibleWin;
                            user.wallet.totalWin += bet.possibleWin;
                            user.wallet.totalWagered = (user.wallet.totalWagered || 0) + bet.stake;

                            // Update betting stats
                            user.bettingStats.wonBets = (user.bettingStats.wonBets || 0) + 1;

                            console.log(`✅ BET WON! Added ${bet.possibleWin} to wallet`);
                            console.log(`User balance after: ${user.wallet.balance}`);

                        } else {
                            // BET LOST
                            bet.status = 'LOST';
                            bet.payout = 0;

                            // Update betting stats
                            user.bettingStats.lostBets = (user.bettingStats.lostBets || 0) + 1;
                            user.wallet.totalWagered = (user.wallet.totalWagered || 0) + bet.stake;

                            console.log(`❌ BET LOST! No payout`);
                        }

                        // Save user changes
                        await user.save();

                        // Save bet changes
                        bet.settledAt = new Date();
                        await bet.save();

                        let match = await Match.findOne({ matchId: game.id });
                        if (!match) {
                            // Create new match
                            match = new Match({
                                matchId: game.id,
                                homeTeam: homeTeam._id,
                                awayTeam: awayTeam._id,
                                homeTeamId: game.home_team_id,
                                awayTeamId: game.away_team_id,
                                homeScore: game.home_score !== 'null' ? parseInt(game.home_score) : null,
                                awayScore: game.away_score !== 'null' ? parseInt(game.away_score) : null,
                                localDate: new Date(game.local_date),
                                persianDate: game.persian_date,
                                status: status,
                                round: parseInt(game.matchday),
                                isFinished: isFinished,
                                isLive: isLive,
                                venue: game.stadium_id ? `Stadium ${game.stadium_id}` : null, // Optional
                                group: game.group, // Add if in schema
                                matchday: game.matchday // Add if in schema
                            });
                            await match.save();
                            console.log(`✅ Created match: ${homeTeam.name_en} vs ${awayTeam.name_en} (ID: ${game.id})`);
                        } else {
                            // Update existing match - only update essential fields
                            match.homeTeam = homeTeam._id;
                            match.awayTeam = awayTeam._id;
                            match.homeTeamId = game.home_team_id;
                            match.awayTeamId = game.away_team_id;
                            match.homeScore = game.home_score !== 'null' ? parseInt(game.home_score) : null;
                            match.awayScore = game.away_score !== 'null' ? parseInt(game.away_score) : null;
                            match.status = status;
                            match.isFinished = isFinished;
                            match.isLive = isLive;
                            await match.save();
                            console.log(`🔄 Updated match: ${match.matchId} - ${status}`);
                        }
                        console.log(`Bet status updated to: ${bet.status}`);
                    }

                    console.log(`\n✅ Settled ${bets.length} bets for match ${match.matchId}`);
                    console.log(`Final result: ${result}`);
                }
                await match.save();
                console.log(`Match ${match.matchId} saved successfully`);

            } catch (err) {
                console.log(`Failed to update match ${match.matchId}:`, err.message);
                console.error(err);
            }
        }
        console.log('=================================');
        console.log('Cron job completed\n');

    } catch (err) {
        console.log('Cron job error:', err.message);
        console.error(err);
    }
});

console.log('Cron job started - checking every minute');