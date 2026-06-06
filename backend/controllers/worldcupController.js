const Match = require('../models/worldcup/Match');
const Bet = require('../models/worldcup/Bet');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const MESSAGES = require('../constants/responseMessages');

// دریافت همه مسابقات با فیلتر مرحله
exports.getMatches = async (req, res) => {
    try {
        const { stage } = req.query; // 'group' یا 'knockout'

        let query = {};
        if (stage === 'group') {
            query.stage = 'group';
        } else if (stage === 'knockout') {
            query.stage = { $in: ['round_of_16', 'quarter_final', 'semi_final', 'final'] };
        }

        const matches = await Match.find(query).sort({ matchStartTime: 1 });

        // گروه‌بندی برای مرحله گروهی
        if (stage === 'group') {
            const groupedMatches = matches.reduce((acc, match) => {
                if (!acc[match.group]) {
                    acc[match.group] = [];
                }
                acc[match.group].push(match);
                return acc;
            }, {});

            return res.json(
                new ApiResponse(200, MESSAGES.SUCCESS.DEFAULT, {
                    tournament: "جام جهانی ۲۰۲۶",
                    stage: "مرحله گروهی",
                    groups: Object.entries(groupedMatches).map(([group, matches]) => ({
                        group,
                        matches
                    }))
                }, true)
            );
        }

        // برای مرحله حذفی
        const knockoutRounds = {
            round_of_16: { name: "یک هشتم نهایی", matches: [] },
            quarter_final: { name: "یک چهارم نهایی", matches: [] },
            semi_final: { name: "نیمه نهایی", matches: [] },
            final: { name: "فینال", matches: [] }
        };

        matches.forEach(match => {
            if (knockoutRounds[match.stage]) {
                knockoutRounds[match.stage].matches.push(match);
            }
        });

        return res.json(
            new ApiResponse(200, MESSAGES.SUCCESS.DEFAULT, {
                tournament: "جام جهانی ۲۰۲۶",
                stage: "مرحله حذفی",
                rounds: Object.values(knockoutRounds).filter(round => round.matches.length > 0)
            }, true)
        );

    } catch (error) {
        console.error(error);
        return res.status(500).json(
            new ApiResponse(500, MESSAGES.ERROR.DEFAULT, null, false)
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