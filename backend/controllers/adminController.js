const User = require("../models/User");
const ApiResponse = require("../utils/ApiResponse");
const MESSAGES = require("../constants/responseMessages");
const Odds = require('../models/worldcup/Odds');
const Match = require('../models/worldcup/Match');
const axios = require('axios');


exports.importMatches = async (req, res) => {

    try {

        const season = req.body.season || '2026';

        const response = await axios.get(
            `https://www.thesportsdb.com/api/v1/json/123/eventsseason.php?id=4429&s=${season}`
        );

        const events = response.data.events || [];

        for (const item of events) {

            await Match.findOneAndUpdate(

                {
                    eventId: item.idEvent
                },

                {
                    eventId: item.idEvent,

                    leagueId: item.idLeague,

                    season: item.strSeason,

                    homeTeam: item.strHomeTeam,

                    awayTeam: item.strAwayTeam,

                    homeTeamId: item.idHomeTeam,

                    awayTeamId: item.idAwayTeam,

                    homeTeamBadge: item.strHomeTeamBadge,

                    awayTeamBadge: item.strAwayTeamBadge,

                    homeScore: item.intHomeScore,

                    awayScore: item.intAwayScore,

                    status: item.strStatus,

                    round: item.intRound,

                    venue: item.strVenue,

                    country: item.strCountry,

                    kickoff: item.strTimestamp
                },

                {
                    upsert: true,
                    new: true
                }
            );
        }

        res.json({
            success: true,
            imported: events.length
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });
    }
};


exports.updateOdds = async (req, res) => {

    try {

        const odds = await Odds.findOneAndUpdate(

            {
                eventId: req.params.eventId
            },

            {
                homeWin: req.body.homeWin,

                draw: req.body.draw,

                awayWin: req.body.awayWin,

                updatedAt: new Date()
            },

            {
                new: true
            }
        );

        res.json({
            success: true,
            odds
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });
    }
};

exports.createBulkOdds = async (req, res) => {

    try {

        const oddsList = req.body;

        if (!Array.isArray(oddsList)) {

            return res.status(400).json({
                error: 'body must be array'
            });
        }

        let created = 0;

        let updated = 0;

        for (const item of oddsList) {

            const match = await Match.findOne({
                eventId: item.eventId
            });

            if (!match) {

                continue;
            }

            const exists = await Odds.findOne({
                eventId: item.eventId
            });

            if (exists) {

                exists.homeWin = item.homeWin;

                exists.draw = item.draw;

                exists.awayWin = item.awayWin;

                exists.updatedAt = new Date();

                await exists.save();

                updated++;

            } else {

                await Odds.create({

                    matchId: match._id,

                    eventId: item.eventId,

                    homeWin: item.homeWin,

                    draw: item.draw,

                    awayWin: item.awayWin
                });

                created++;
            }
        }

        res.json({

            success: true,

            created,

            updated
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });
    }
};














// شارژ کیف پول کاربر (دستی)
exports.chargeWallet = async (req, res) => {
    try {
        const { userId, amount } = req.body;

        if (!userId || !amount || amount <= 0) {
            return res.status(400).json(
                new ApiResponse(400, "اطلاعات نامعتبر", null, false)
            );
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(
                new ApiResponse(404, MESSAGES.ERROR.USER_NOT_FOUND, null, false)
            );
        }

        // فرض میکنیم user.wallet دارید
        if (!user.wallet) {
            user.wallet = 0;
        }

        user.wallet += amount;
        await user.save();

        return res.json(
            new ApiResponse(
                200,
                `کیف پول کاربر با موفقیت به مبلغ ${amount} تومان شارژ شد`,
                {
                    userId: user._id,
                    userName: user.userName,
                    newBalance: user.wallet
                },
                true
            )
        );

    } catch (error) {
        console.error(error);
        return res.status(500).json(
            new ApiResponse(
                500,
                MESSAGES.ERROR.DEFAULT,
                null,
                false
            )
        );
    }
};

// دریافت لیست همه کاربران (برای شارژ دستی)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("_id userName name wallet email")
            .sort({ createdAt: -1 });

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.DEFAULT,
                users,
                true
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                MESSAGES.ERROR.DEFAULT,
                null,
                false
            )
        );
    }
};

// دریافت همه شرط‌های ثبت شده
exports.getAllBets = async (req, res) => {
    try {
        const allBets = global.betsStore;

        // دریافت اطلاعات کاربر برای هر شرط
        const betsWithUser = await Promise.all(
            allBets.map(async (bet) => {
                const user = await User.findById(bet.userId).select("userName name email");
                return {
                    ...bet,
                    user
                };
            })
        );

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.DEFAULT,
                betsWithUser,
                true
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                MESSAGES.ERROR.DEFAULT,
                null,
                false
            )
        );
    }
};

// آمار کلی سیستم
exports.getStats = async (req, res) => {
    try {
        const users = await User.find();
        const totalUsers = users.length;
        const totalWalletBalance = users.reduce((sum, user) => sum + (user.wallet || 0), 0);

        const allBets = global.betsStore;
        const totalBets = allBets.length;
        const totalBetAmount = allBets.reduce((sum, bet) => sum + bet.amount, 0);
        const totalPaidOut = allBets
            .filter(bet => bet.status === "WON")
            .reduce((sum, bet) => sum + (bet.winAmount || 0), 0);

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.DEFAULT,
                {
                    totalUsers,
                    totalWalletBalance,
                    totalBets,
                    totalBetAmount,
                    totalPaidOut,
                    pendingBets: allBets.filter(b => b.status === "PENDING").length
                },
                true
            )
        );
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(
                500,
                MESSAGES.ERROR.DEFAULT,
                null,
                false
            )
        );
    }
};