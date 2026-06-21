const Match = require('../models/worldcup/Match');
const Bet = require('../models/worldcup/Bet');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const MESSAGES = require('../constants/responseMessages');
const mongoose = require('mongoose');
const Odds = require('../models/worldcup/Odds');



exports.getMatches = async (req, res) => {
    try {
        const nowInIran = new Date().toLocaleString("en-US", { timeZone: "Asia/Tehran" });
        const todayStart = new Date(nowInIran);
        todayStart.setHours(0, 0, 0, 0);


        // دیروز به جای امروز
        const yesterdayStart = new Date(nowInIran);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);  // یک روز عقب‌تر
        yesterdayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date(nowInIran);
        todayEnd.setHours(23, 59, 59, 999);

        // تبدیل به UTC برای مقایسه با دیتابیس
        const startUTC = new Date(yesterdayStart.toLocaleString("en-US", { timeZone: "UTC" }));
        const endUTC = new Date(todayEnd.toLocaleString("en-US", { timeZone: "UTC" }));


        const nextWeek = new Date(startUTC);
        nextWeek.setDate(startUTC.getDate() + 7);

        const matches = await Match.aggregate([
            // {
            //     $match: {
            //         localDate: {
            //             $gte: now,
            //             $lte: nextWeek
            //         }
            //         // isFinished: false  
            //     }
            // },

            {
                $match: {
                    isFinished: false,
                    isLive: false,
                    $expr: {
                        $and: [
                            { $gte: [{ $toDate: "$localDate" }, startUTC] },
                            { $lte: [{ $toDate: "$localDate" }, nextWeek] }


                        ]
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
                    homeScore: 1,
                    awayScore: 1,
                    stadiumId: 1,
                    kickoffUtc: 1,
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

        // دریافت شرط‌های کاربر با اطلاعات کامل مسابقه
        const bets = await Bet.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId)
                }
            },
            // مرتب‌سازی بر اساس تاریخ ثبت (جدیدترین اول)
            {
                $sort: {
                    createdAt: -1
                }
            },
            // Join با جدول مسابقات برای دریافت اطلاعات کامل
            {
                $lookup: {
                    from: "matches",
                    localField: "matchId",
                    foreignField: "matchId",
                    as: "matchDetails"
                }
            },
            {
                $unwind: {
                    path: "$matchDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            // Join با جدول تیم‌ها برای اطلاعات تیم میزبان
            {
                $lookup: {
                    from: "teams",
                    localField: "matchDetails.homeTeamId",
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
            // Join با جدول تیم‌ها برای اطلاعات تیم مهمان
            {
                $lookup: {
                    from: "teams",
                    localField: "matchDetails.awayTeamId",
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
            {
                $project: {
                    _id: 0,
                    betId: "$_id",
                    matchId: 1,
                    selection: 1,
                    odd: 1,
                    stake: 1,
                    possibleWin: 1,
                    status: 1,
                    settledAt: 1,
                    createdAt: 1,
                    matchDetails: {
                        localDate: "$matchDetails.localDate",
                        persianDate: "$matchDetails.persianDate",
                        status: "$matchDetails.status",
                        homeScore: "$matchDetails.homeScore",
                        awayScore: "$matchDetails.awayScore"
                    },
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
                    }
                }
            }
        ]);

        // محاسبه آمار کلی
        const stats = {
            totalBets: bets.length,
            pendingBets: bets.filter(bet => bet.status === 'PENDING').length,
            wonBets: bets.filter(bet => bet.status === 'WON').length,
            lostBets: bets.filter(bet => bet.status === 'LOST').length,
            totalStake: bets.reduce((sum, bet) => sum + bet.stake, 0),
            totalPossibleWin: bets.reduce((sum, bet) => sum + bet.possibleWin, 0)
        };

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.DEFAULT,
                {
                    bets,
                    stats
                },
                true
            )
        );

    } catch (error) {
        console.error('Error in getMyBets:', error);
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
exports.getLiveMatches = async (req, res) => {
    try {
        const now = new Date();

        const todayStartUTC = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            0, 0, 0, 0
        ));

        const nextWeek = new Date(todayStartUTC);
        nextWeek.setUTCDate(todayStartUTC.getUTCDate() + 7);

        const matches = await Match.aggregate([
            {
                $match: {
                    isLive: true,
                    kickoffUtc: {
                        $gte: todayStartUTC,
                        $lte: nextWeek
                    }
                }
            },

            {
                $addFields: {
                    matchStartTime: "$kickoffUtc"
                }
            },

            {
                $addFields: {
                    elapsedSeconds: {
                        $max: [
                            0,
                            {
                                $floor: {
                                    $divide: [
                                        { $subtract: [now, "$matchStartTime"] },
                                        1000
                                    ]
                                }
                            }
                        ]
                    }
                }
            },

            {
                $addFields: {
                    minutes: { $floor: { $divide: ["$elapsedSeconds", 60] } },
                    seconds: { $mod: ["$elapsedSeconds", 60] }
                }
            },

            {
                $addFields: {
                    matchTime: {
                        $concat: [
                            {
                                $cond: {
                                    if: { $lt: ["$minutes", 10] },
                                    then: {
                                        $concat: ["0", { $toString: "$minutes" }]
                                    },
                                    else: { $toString: "$minutes" }
                                }
                            },
                            ":",
                            {
                                $cond: {
                                    if: { $lt: ["$seconds", 10] },
                                    then: {
                                        $concat: ["0", { $toString: "$seconds" }]
                                    },
                                    else: { $toString: "$seconds" }
                                }
                            }
                        ]
                    }
                }
            },

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
                    kickoffUtc: 1,
                    persianDate: 1,
                    status: 1,
                    homeScore: 1,
                    awayScore: 1,
                    matchTime: 1,

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
                $sort: { kickoffUtc: 1 }
            }
        ]);

        return res.json(
            new ApiResponse(200, MESSAGES.SUCCESS.DEFAULT, matches, true)
        );

    } catch (error) {
        console.error(error);

        return res.status(500).json(
            new ApiResponse(500, MESSAGES.ERROR.DEFAULT, null, false)
        );
    }
};
exports.getLeaderboard = async (req, res) => {
    try {
        const leaderboardData = await Bet.aggregate([
            {
                $match: {
                    status: { $in: ['WON', 'LOST'] }
                }
            },
            {
                $group: {
                    _id: "$userId",
                    totalBets: { $sum: 1 },
                    wonBets: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "WON"] }, 1, 0]
                        }
                    },
                    lostBets: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "LOST"] }, 1, 0]
                        }
                    },
                    totalStake: { $sum: "$stake" },
                    totalPayout: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "WON"] },
                                "$payout",
                                0
                            ]
                        }
                    },
                    netProfit: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", "WON"] },
                                { $subtract: ["$payout", "$stake"] },
                                0
                            ]
                        }
                    }
                }
            },
            {
                $addFields: {
                    winRate: {
                        $cond: [
                            { $eq: ["$totalBets", 0] },
                            0,
                            { $multiply: [{ $divide: ["$wonBets", "$totalBets"] }, 100] }
                        ]
                    }
                }
            },
            {
                $sort: {
                    wonBets: -1,
                    netProfit: -1,
                    winRate: -1
                }
            },
            {
                $limit: 10
            },
            {
                $lookup: {
                    from: "users",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [
                                        "$_id",
                                        { $toObjectId: "$$userId" }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "user"
                }
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    // اطلاعات کاربر
                    name: "$user.name",
                    userName: "$user.userName",
                    lastName: "$user.lastName",
                    phone: "$user.phone",
                    email: "$user.email",
                    // اضافه کردن فیلد fullName برای نمایش ترکیبی
                    fullName: {
                        $trim: {
                            input: {
                                $concat: [
                                    { $ifNull: ["$user.name", ""] },
                                    " ",
                                    { $ifNull: ["$user.lastName", ""] }
                                ]
                            }
                        }
                    },
                    // نمایش نام نمایشی (اولویت با userName، سپس name)
                    displayName: {
                        $ifNull: [
                            "$user.userName",
                            { $ifNull: ["$user.name", "کاربر"] }
                        ]
                    },
                    // امتیاز (می‌توانید بر اساس معیارهای خود محاسبه کنید)
                    score: {
                        $add: [
                            { $multiply: ["$wonBets", 10] },
                            { $multiply: ["$totalBets", 1] },
                            { $divide: ["$netProfit", 1000] }
                        ]
                    },
                    stats: {
                        totalBets: "$totalBets",
                        wonBets: "$wonBets",
                        lostBets: "$lostBets",
                        winRate: { $round: ["$winRate", 2] },
                        totalStake: "$totalStake",
                        totalPayout: "$totalPayout",
                        netProfit: "$netProfit"
                    }
                }
            }
        ]);

        const rankedLeaderboard = leaderboardData.map((user, index) => ({
            rank: index + 1,
            ...user
        }));

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.DEFAULT,
                {
                    leaderboard: rankedLeaderboard
                },
                true
            )
        );

    } catch (error) {
        console.error('Error in getLeaderboardByWins:', error);
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