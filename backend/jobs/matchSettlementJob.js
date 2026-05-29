const cron = require('node-cron');

const axios = require('axios');

const Match = require('../models/worldcup/Match');

const Odds = require('../models/worldcup/Odds');

const Bet = require('../models/worldcup/Bet');


// every 1 minute
cron.schedule('* * * * *', async () => {

    console.log('checking matches...');

    try {

        // unfinished matches
        const matches = await Match.find({

            isFinished: false
        });

        for (const match of matches) {

            try {

                const response = await axios.get(
                    `https://www.thesportsdb.com/api/v1/json/123/lookupevent.php?id=${match.eventId}`
                );

                const data = response.data.events?.[0];

                if (!data) {

                    continue;
                }

                // update scores
                match.homeScore = data.intHomeScore;

                match.awayScore = data.intAwayScore;

                match.status = data.strStatus;

                // FT = Full Time
                if (data.strStatus === 'FT') {

                    match.isFinished = true;

                    // close odds
                    await Odds.updateMany(

                        {
                            eventId: match.eventId
                        },

                        {
                            status: 'SETTLED'
                        }
                    );

                    // detect result
                    let result = 'DRAW';

                    if (match.homeScore > match.awayScore) {

                        result = 'HOME';
                    }

                    if (match.homeScore < match.awayScore) {

                        result = 'AWAY';
                    }

                    // pending bets
                    const bets = await Bet.find({

                        eventId: match.eventId,

                        status: 'PENDING'
                    });

                    for (const bet of bets) {

                        if (bet.selection === result) {

                            bet.status = 'WON';

                            bet.payout = bet.possibleWin;

                        } else {

                            bet.status = 'LOST';

                            bet.payout = 0;
                        }

                        bet.settledAt = new Date();

                        await bet.save();

                        // TODO:
                        // update user wallet
                    }

                    console.log(
                        `settled ${bets.length} bets for ${match.eventId}`
                    );
                }

                await match.save();

            } catch (err) {

                console.log(
                    `failed match ${match.eventId}`,
                    err.message
                );
            }
        }

    } catch (err) {

        console.log(err.message);
    }

});