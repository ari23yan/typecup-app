const User = require("../models/User");
const ApiResponse = require("../utils/ApiResponse");
const MESSAGES = require("../constants/responseMessages");

// لیست شرط‌ها رو از کنترلر worldcup بیارید (یا یه ماژول مشترک بسازید)
// اینجا برای سادگی یه آرایه گلوبال فرض میکنیم
global.betsStore = global.betsStore || [];

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

// تسویه شرط (برنده یا بازنده اعلام کردن)
exports.settleBet = async (req, res) => {
    try {
        const { betId, result } = req.body; // result: 'won' or 'lost'
        
        const bet = global.betsStore.find(b => b.id === parseInt(betId));
        if (!bet) {
            return res.status(404).json(
                new ApiResponse(404, "شرط یافت نشد", null, false)
            );
        }
        
        if (bet.status !== "PENDING") {
            return res.status(400).json(
                new ApiResponse(400, "این شرط قبلاً تسویه شده است", null, false)
            );
        }
        
        if (result === "won") {
            // پرداخت برد به کاربر
            const user = await User.findById(bet.userId);
            if (user) {
                user.wallet += bet.potentialWin;
                await user.save();
                bet.status = "WON";
                bet.winAmount = bet.potentialWin;
            }
        } else if (result === "lost") {
            bet.status = "LOST";
            bet.winAmount = 0;
        } else {
            return res.status(400).json(
                new ApiResponse(400, "نتیجه نامعتبر", null, false)
            );
        }
        
        bet.settledAt = new Date();
        
        return res.json(
            new ApiResponse(
                200,
                "شرط با موفقیت تسویه شد",
                bet,
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