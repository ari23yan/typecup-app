const User = require("../models/User");
const ApiResponse = require("../utils/ApiResponse");
const MESSAGES = require("../constants/responseMessages");
const Odds = require('../models/worldcup/Odds');
const Match = require('../models/worldcup/Match');
const Team = require('../models/worldcup/Team');
const Bet = require('../models/worldcup/Bet');
const axios = require('axios');

exports.importMatches = async (req, res) => {
    try {
        const response = await axios.get(
            `https://worldcup26.ir/get/games`
        );

        const matches = response.data.games || [];

        for (const item of matches) {
            await Match.findOneAndUpdate(
                {
                    matchId: item.id
                },
                {
                    matchId: item.id,
                    homeTeamId: item.home_team_id,
                    awayTeamId: item.away_team_id,
                    homeTeamNameEn: item.home_team_name_en,
                    homeTeamNameFa: item.home_team_name_fa,
                    awayTeamNameEn: item.away_team_name_en,
                    awayTeamNameFa: item.away_team_name_fa,
                    homeScore: item.home_score,
                    awayScore: item.away_score,
                    homeScorers: item.home_scorers === "null" ? null : item.home_scorers,
                    awayScorers: item.away_scorers === "null" ? null : item.away_scorers,
                    group: item.group,
                    matchday: item.matchday,
                    localDate: item.local_date,
                    persianDate: item.persian_date,
                    stadiumId: item.stadium_id,
                    finished: item.finished === "TRUE",
                    timeElapsed: item.time_elapsed,
                    type: item.type
                },
                {
                    upsert: true,
                    new: true
                }
            );
        }

        res.json({
            success: true,
            imported: matches.length,
            total: matches.length
        });

    } catch (err) {
        console.error('Import error:', err.response?.data || err.message);
        res.status(500).json({
            success: false,
            error: err.response?.data?.message || err.message
        });
    }
};

exports.importTeams = async (req, res) => {
    try {
        const response = await axios.get(`https://worldcup26.ir/get/teams`);

        const teams = response.data.teams || [];
        for (const item of teams) {
            await Team.findOneAndUpdate(
                {
                    teamId: item.id
                },
                {
                    teamId: item.id,
                    name_en: item.name_en,
                    name_fa: item.name_fa,
                    flag: item.flag,
                    fifa_code: item.fifa_code
                },
                {
                    upsert: true,
                    new: true
                }
            );
        }

        res.json({
            success: true,
            imported: teams.length,
            total: teams.length
        });
    } catch (err) {
        console.error('Import error:', err.response?.data || err.message);
        res.status(500).json({
            success: false,
            error: err.response?.data?.message || err.message
        });
    }
};

exports.importOdds = async (req, res) => {
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
                matchId: item.matchId
            });

            if (!match) {
                continue;
            }

            const exists = await Odds.findOne({
                matchId: match._id
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

        // اگر wallet وجود ندارد یا ساختار آن درست نیست
        if (!user.wallet) {
            user.wallet = {
                balance: 0,
                totalBet: 0,
                totalWin: 0
            };
        }

        // افزایش موجودی
        user.wallet.balance += amount;
        await user.save();

        return res.json(
            new ApiResponse(
                200,
                `کیف پول کاربر با موفقیت به مبلغ ${amount} تومان شارژ شد`,
                {
                    userId: user._id,
                    userName: user.userName,
                    newBalance: user.wallet.balance
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
            .select("_id userName name email wallet")
            .sort({ createdAt: -1 });

        // تبدیل داده‌ها به فرمت مناسب برای فرانت
        const formattedUsers = users.map(user => ({
            _id: user._id,
            userName: user.userName,
            name: user.name,
            email: user.email,
            wallet: user.wallet?.balance || 0, // فقط balance را نمایش بده
            walletDetails: user.wallet // اگر نیاز به جزئیات داری
        }));

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.DEFAULT,
                formattedUsers,
                true
            )
        );
    } catch (error) {
        console.error('getAllUsers error:', error);
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
        
        const allBets = await Bet.find()
            .populate('userId', 'userName name email')
            .sort({ createdAt: -1 });

        // تبدیل ساختار داده به فرمت مناسب
        const betsWithUser = await Promise.all(allBets.map(async (bet) => {
            // دریافت اطلاعات مسابقه
            const match = await Match.findById(bet.matchId);
            
            let homeTeamName = '-';
            let awayTeamName = '-';
            let selectedTeamName = '-';
            let selectedTeamNameFa = '-';
            let selectedTeamFlag = null;
            
            if (match) {
                // دریافت نام تیم میزبان از جدول Team
                if (match.homeTeamId && match.homeTeamId !== '0') {
                    const homeTeam = await Team.findOne({ teamId: match.homeTeamId });
                    if (homeTeam) {
                        homeTeamName = homeTeam.name_fa || homeTeam.name_en || '-';
                    }
                }
                
                // دریافت نام تیم مهمان از جدول Team
                if (match.awayTeamId && match.awayTeamId !== '0') {
                    const awayTeam = await Team.findOne({ teamId: match.awayTeamId });
                    if (awayTeam) {
                        awayTeamName = awayTeam.name_fa || awayTeam.name_en || '-';
                    }
                }
                
                // تعیین تیم انتخاب شده بر اساس انتخاب کاربر
                const selection = bet.selection?.toUpperCase();
                if (selection === 'HOME') {
                    selectedTeamName = homeTeamName;
                    selectedTeamNameFa = homeTeamName;
                    if (match.homeTeamId && match.homeTeamId !== '0') {
                        const homeTeam = await Team.findOne({ teamId: match.homeTeamId });
                        selectedTeamFlag = homeTeam?.flag || null;
                    }
                } else if (selection === 'AWAY') {
                    selectedTeamName = awayTeamName;
                    selectedTeamNameFa = awayTeamName;
                    if (match.awayTeamId && match.awayTeamId !== '0') {
                        const awayTeam = await Team.findOne({ teamId: match.awayTeamId });
                        selectedTeamFlag = awayTeam?.flag || null;
                    }
                } else if (selection === 'DRAW') {
                    selectedTeamName = 'مساوی';
                    selectedTeamNameFa = 'مساوی';
                }
            }
            
            // فرمت کردن تاریخ
            const formattedDate = bet.createdAt ? new Date(bet.createdAt).toLocaleDateString('fa-IR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }) : '-';
            
            // تعیین وضعیت به فارسی
            let statusText = '';
            switch(bet.status) {
                case 'PENDING':
                    statusText = 'در انتظار';
                    break;
                case 'WON':
                    statusText = 'برنده';
                    break;
                case 'LOST':
                    statusText = 'باخته';
                    break;
                default:
                    statusText = bet.status;
            }
            
            // تعیین نوع شرط به فارسی
            let selectionText = '';
            switch(bet.selection?.toUpperCase()) {
                case 'HOME':
                    selectionText = 'پیروزی میزبان';
                    break;
                case 'AWAY':
                    selectionText = 'پیروزی مهمان';
                    break;
                case 'DRAW':
                    selectionText = 'مساوی';
                    break;
                default:
                    selectionText = bet.selection;
            }
            
            return {
                _id: bet._id,
                userId: bet.userId?._id,
                matchId: bet.matchId,
                matchInfo: match ? {
                    homeTeamName: homeTeamName,
                    awayTeamName: awayTeamName,
                    homeScore: match.homeScore || 0,
                    awayScore: match.awayScore || 0,
                    finished: match.isFinished || false,
                    status: match.status,
                    homeTeamId: match.homeTeamId,
                    awayTeamId: match.awayTeamId
                } : null,
                selection: bet.selection,
                selectionText: selectionText,
                selectedTeamName: selectedTeamName,
                selectedTeamNameFa: selectedTeamNameFa,
                selectedTeamFlag: selectedTeamFlag,
                odd: bet.odd,
                amount: bet.stake,
                winAmount: bet.payout || 0,
                possibleWin: bet.possibleWin || 0,
                status: bet.status,
                statusText: statusText,
                createdAt: bet.createdAt,
                createdAtFormatted: formattedDate,
                user: bet.userId ? {
                    _id: bet.userId._id,
                    userName: bet.userId.userName,
                    name: bet.userId.name,
                    email: bet.userId.email
                } : null
            };
        }));
        
        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.DEFAULT,
                betsWithUser,
                true
            )
        );
    } catch (error) {
        console.error('getAllBets error:', error);
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
        // آمار کاربران
        const users = await User.find();
        const totalUsers = users.length;

        // اصلاح محاسبه موجودی کل - دسترسی به balance داخل آبجکت wallet
        const totalWalletBalance = users.reduce((sum, user) => {
            const walletBalance = user.wallet?.balance || 0;
            return sum + walletBalance;
        }, 0);

        // آمار شرط‌ها از دیتابیس
        const allBets = await Bet.find();
        const totalBets = allBets.length;
        const totalBetAmount = allBets.reduce((sum, bet) => sum + (bet.stake || 0), 0);
        const totalPaidOut = allBets
            .filter(bet => bet.status === "WON")
            .reduce((sum, bet) => sum + (bet.payout || 0), 0);

        const pendingBets = await Bet.countDocuments({ status: "PENDING" });

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
                    pendingBets
                },
                true
            )
        );
    } catch (error) {
        console.error("getStats error ->", error);
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