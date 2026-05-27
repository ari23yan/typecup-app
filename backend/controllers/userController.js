const User = require("../models/User");
const TypingScore = require("../models/TypingScore");
const ApiResponse = require("../utils/ApiResponse");
const MESSAGES = require("../constants/responseMessages");
const { getSeasonName } = require("../utils/SeasonHelper");

exports.getProfile = async (req, res) => {
    try {

        const userId = req.user.id;

        const user = await User.findById(userId).select("-password -__v -_id -updatedAt -createdAt");

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

        const lastScores = await TypingScore.find({ user: userId })
            .select("-_id -user -updatedAt -__v")
            .sort({ createdAt: -1 })
            .limit(10);

        const formattedScores = lastScores.map(score => {
            const scoreObj = score.toObject();
            return {
                ...scoreObj,
                seasonLabel: `${getSeasonName(scoreObj.season.seasonNumber)} - ${scoreObj.season.year}`
            };
        });

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.DEFAULT,
                {
                    user,
                    lastScores: formattedScores
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



exports.updateProfile = async (req, res) => {
    try {
        const { name, userName, email } = req.body;
        const userId = req.user.id;

        const existingUser = await User.findOne({
            userName,
            _id: { $ne: userId }
        });

        if (existingUser) {
            return res.status(400).json(
                new ApiResponse(
                    400,
                    MESSAGES.ERROR.USERNAME_ALREADY_EXIST,
                    null,
                    false
                )
            );
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { name, userName, email } },
            { new: true }
        );

        if (!updatedUser) {
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
                MESSAGES.SUCCESS.UPDATE_PROFILE,
                updatedUser,
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

exports.getTypingStats = async (req, res) => {
    try {

        const userId = req.user.id;

        const scores = await TypingScore.find({ user: userId });

        if (!scores || scores.length === 0) {
            return res.json(
                new ApiResponse(
                    200,
                    MESSAGES.SUCCESS.DEFAULT,
                    {
                        maxWpm: 0,
                        avgWpm: 0,
                        avgAccuracy: 0,
                        maxScore: 0,
                        testsCount: 0,
                        totalDuration: 0
                    },
                    true
                )
            );
        }

        const testsCount = scores.length;

        const maxWpm = Math.max(...scores.map(s => s.wpm));

        const maxScore = Math.max(...scores.map(s => s.score));

        const avgWpm =
            scores.reduce((sum, s) => sum + s.wpm, 0) / testsCount;

        const avgAccuracy =
            scores.reduce((sum, s) => sum + s.accuracy, 0) / testsCount;

        const totalDuration =
            scores.reduce((sum, s) => sum + (s.duration || 0), 0);

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.DEFAULT,
                {
                    maxWpm: Math.round(maxWpm),
                    avgWpm: Math.round(avgWpm),
                    avgAccuracy: Math.round(avgAccuracy),
                    maxScore: Math.round(maxScore),
                    testsCount,
                    totalDuration
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



