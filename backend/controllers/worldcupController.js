const Match = require('../models/worldcup/Match');
const Bet = require('../models/worldcup/Bet');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const MESSAGES = require('../constants/responseMessages');
const mongoose = require('mongoose');
const Odds = require('../models/worldcup/Odds');



exports.getMatches = async (req, res) => {
    try {
        const now = new Date();

        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        const matches = await Match.aggregate([
            {
                $match: {
                    localDate: {
                        $gte: now,
                        $lte: nextWeek
                    }
                    // isFinished: false  
                }
            },


            // Home Team
            {
                $lookup: {
                    from: "teams",
                    localField: "homeTeamId",
                    foreignField: "teamId",
                    as: "homeTeam"
                }
            },
            {
                $unwind: {
                    path: "$homeTeam",
                    preserveNullAndEmptyArrays: true
                }
            },

            // Away Team
            {
                $lookup: {
                    from: "teams",
                    localField: "awayTeamId",
                    foreignField: "teamId",
                    as: "awayTeam"
                }
            },
            {
                $unwind: {
                    path: "$awayTeam",
                    preserveNullAndEmptyArrays: true
                }
            },

            // Odds
            {
                $lookup: {
                    from: "odds",
                    localField: "matchId",
                    foreignField: "matchId",
                    as: "odds"
                }
            },
            {
                $unwind: {
                    path: "$odds",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $project: {
                    _id: 0,
                    matchId: 1,
                    localDate: 1,
                    persianDate: 1,
                    status: 1,
                    homeScore: 1,
                    awayScore: 1,

                    homeTeam: {
                        teamId: "$homeTeam.teamId",
                        name_fa: "$homeTeam.name_fa",
                        name_en: "$homeTeam.name_en",
                        flag: "$homeTeam.flag"
                    },

                    awayTeam: {
                        teamId: "$awayTeam.teamId",
                        name_fa: "$awayTeam.name_fa",
                        name_en: "$awayTeam.name_en",
                        flag: "$awayTeam.flag"
                    },

                    odds: {
                        homeWin: "$odds.homeWin",
                        draw: "$odds.draw",
                        awayWin: "$odds.awayWin"
                    }
                }
            },

            {
                $sort: {
                    localDate: 1
                }
            }
        ]);

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.DEFAULT,
                matches,
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
exports.placeBet = async (req, res) => {
    try {
        const { matchId, selection, amount } = req.body;
        const userId = req.user.id;

        // اعتبارسنجی ورودی‌ها
        if (!matchId || !selection || !amount) {
            return res.status(400).json(
                new ApiResponse(400, "تمامی فیلدهای مورد نیاز (matchId, selection, amount) الزامی هستند", null, false)
            );
        }

        if (amount <= 0) {
            return res.status(400).json(
                new ApiResponse(400, "مبلغ شرط باید بیشتر از صفر باشد", null, false)
            );
        }



        // اعتبارسنجی نوع شرط
        const validSelections = ['HOME', 'DRAW', 'AWAY'];
        if (!validSelections.includes(selection)) {
            return res.status(400).json(
                new ApiResponse(400, "نوع شرط معتبر نیست. مقادیر مجاز: HOME, DRAW, AWAY", null, false)
            );
        }

        // 1. پیدا کردن مسابقه
        const match = await Match.findOne({ matchId });
        if (!match) {
            return res.status(404).json(
                new ApiResponse(404, "مسابقه یافت نشد", null, false)
            );
        }

        const existingBet = await Bet.findOne({
            userId,
            matchId: matchId // یا matchId بسته به ساختار دیتابیس
        });

        if (existingBet) {
            return res.status(400).json(
                new ApiResponse(
                    400,
                    "شما قبلاً برای این مسابقه شرط ثبت کرده‌اید",
                    null,
                    false
                )
            );
        }

        // 2. بررسی TBD بودن تیم‌ها
        if (match.home_team?.isTBD || match.away_team?.isTBD) {
            return res.status(400).json(
                new ApiResponse(400, "تیم‌های این مسابقه هنوز مشخص نشده‌اند", null, false)
            );
        }

        // 3. بررسی شروع مسابقه
        const now = new Date();
        if (match.matchStartTime && now >= match.matchStartTime) {
            return res.status(400).json(
                new ApiResponse(400, "زمان شرط‌بندی برای این مسابقه به اتمام رسیده است", null, false)
            );
        }


        const OddValue = await Odds.findOne({ matchId });

        // 4. دریافت ضریب مناسب بر اساس انتخاب کاربر
        let odd;
        switch (selection) {
            case 'HOME':
                odd = OddValue.homeWin;
                break;
            case 'DRAW':
                odd = OddValue.draw;
                break;
            case 'AWAY':
                odd = OddValue.awayWin;
                break;
            default:
                odd = null;
        }

        if (!odd || odd <= 0) {
            return res.status(400).json(
                new ApiResponse(400, "ضریب انتخابی معتبر نیست", null, false)
            );
        }

        // 5. محاسبه برد احتمالی
        const possibleWin = amount * odd;

        // 6. بررسی موجودی کاربر
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json(
                new ApiResponse(404, "کاربر یافت نشد", null, false)
            );
        }

        if (user.balance < amount) {
            return res.status(400).json(
                new ApiResponse(400, "موجودی کافی نیست", null, false)
            );
        }
        user.wallet.balance -= amount;
        await user.save();

        const bet = new Bet({
            userId,
            matchId: match.matchId,
            selection,
            odd,
            stake: amount,
            possibleWin,
            payout: 0,
            status: 'PENDING',
            settledAt: null,
            matchSnapshot: {
                homeTeam: match.home_team?.name || match.homeTeam || 'Unknown',
                awayTeam: match.away_team?.name || match.awayTeam || 'Unknown',
                kickoff: match.matchStartTime || match.kickoff || new Date()
            }
        });

        await bet.save();

        return res.status(200).json(
            new ApiResponse(200, "شرط با موفقیت ثبت شد", {
                betId: bet._id,
                matchId: match.matchId || match._id,
                selection,
                odd,
                stake: amount,
                possibleWin,
                status: bet.status,
                matchSnapshot: bet.matchSnapshot,
                createdAt: bet.createdAt
            }, true)
        );

    } catch (error) {
        console.log('Error in placeBet:', error);
        return res.status(500).json(
            new ApiResponse(500, MESSAGES.ERROR.DEFAULT || "خطایی در ثبت شرط رخ داد", null, false)
        );
    }
};
exports.getMyBets = async (req, res) => {
    try {
        const userId = req.user.id;

        const userBets = bets.filter(bet => bet.userId === userId);

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.DEFAULT,
                userBets,
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
// دریافت موجودی کیف پول
exports.getWallet = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId).select("wallet");

        if (!user) {
            return res.status(404).json(
                new ApiResponse(
                    404,
                    MESSAGES.ERROR.USER_NOT_FOUND,
                    null,
                    false
                )
            );
        }

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.DEFAULT,
                {
                    balance: user.wallet.balance
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