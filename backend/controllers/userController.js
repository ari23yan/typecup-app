const User = require("../models/User");
const TypingScore = require("../models/TypingScore");
const ApiResponse = require("../utils/ApiResponse");
const MESSAGES = require("../constants/responseMessages");

exports.getProfile = async (req, res) => {
    try {

        const userId = req.user.id; 

        const user = await User.findById(userId).select("-password");

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
            .sort({ wpm: -1, createdAt: -1 })
            .limit(10);

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.DEFAULT,
                {
                    user,
                    lastScores
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
            { $set: { name, userName, email }},
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



