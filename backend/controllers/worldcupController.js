const Match = require('../models/worldcup/Match');
const Bet = require('../models/worldcup/Bet');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const MESSAGES = require('../constants/responseMessages');


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
// شرط‌بندی (آپدیت شده برای پشتیبانی از مسابقات TBD)
exports.placeBet = async (req, res) => {
    try {
        const { matchId, betType, amount } = req.body;
        const userId = req.user.id;

        // پیدا کردن مسابقه
        const match = await Match.findOne({ matchId });
        if (!match) {
            return res.status(404).json(
                new ApiResponse(404, "مسابقه یافت نشد", null, false)
            );
        }

        // بررسی TBD بودن تیم‌ها
        if (match.home_team.isTBD || match.away_team.isTBD) {
            return res.status(400).json(
                new ApiResponse(400, "تیم‌های این مسابقه هنوز مشخص نشده‌اند", null, false)
            );
        }

        // بررسی شروع مسابقه
        const now = new Date();
        if (match.matchStartTime && now >= match.matchStartTime) {
            return res.status(400).json(
                new ApiResponse(400, "زمان شرط‌بندی برای این مسابقه به اتمام رسیده است", null, false)
            );
        }

        // بقیه کد شرط‌بندی مثل قبل...
        // [همون کد قبلی رو اینجا قرار بده]

    } catch (error) {
        return res.status(500).json(
            new ApiResponse(500, MESSAGES.ERROR.DEFAULT, null, false)
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