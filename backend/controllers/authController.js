const Otp = require("../models/Otp");
const User = require("../models/User");
const MESSAGES = require("../constants/responseMessages");
const ApiResponse = require("../utils/ApiResponse");
const generateOTP = require("../utils/Otp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendOtpSms = require("../utils/smsProvider");



exports.checkPhone = async (req, res) => {
    try {
        const { phone } = req.body;

        const user = await User.findOne({ phone });

        if (user) {
            return res.json(
                new ApiResponse(
                    200,
                    MESSAGES.SUCCESS.DEFAULT,
                    { status: "login" },
                    true
                )
            );
        }

        const code = generateOTP(4);
        await sendOtpSms(phone, code);

        await Otp.create({
            phone,
            code,
            expiresAt: Date.now() + 120000
        });

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.OTP_SENT,
                { phoneNumber: phone, status: "register" },
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



exports.verifyOtp = async (req, res) => {

    try {

        const { phone, code } = req.body;

        const otp = await Otp.findOne({ phone, code });

        if (!otp) {

            return res.status(400).json(
                new ApiResponse(
                    400,
                    MESSAGES.ERROR.INVALID_OTP,
                    null,
                    false
                )
            );

        }

        if (otp.expiresAt < Date.now()) {

            return res.status(400).json(
                new ApiResponse(
                    400,
                    MESSAGES.ERROR.OTP_EXPIRED,
                    null,
                    false
                )
            );

        }

        await Otp.deleteMany({ phone });

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.DEFAULT,
                null,
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


exports.register = async (req, res) => {

    try {

        const { phone, name, userName, email, password } = req.body;

        const existingUser = await User.findOne({
            $or: [
                { email },
                { userName }
            ]
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

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            phone,
            name,
            userName,
            email,
            password: hashedPassword
        });



        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.REGISTER,
                {
                    token,
                    user
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


exports.login = async (req, res) => {

    try {

        const { phone, password } = req.body;

        const user = await User.findOne({ phone });

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

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json(
                new ApiResponse(
                    400,
                    MESSAGES.ERROR.INVALID_CREDENTIALS,
                    null,
                    false
                )
            );
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.LOGIN,
                {
                    token,
                    user
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


exports.sendPasswordResetOtp = async (req, res) => {
    try {
        const { phone } = req.body;

        const user = await User.findOne({ phone });

        if (!user) {
            return res.json(
                new ApiResponse(
                    400,
                    MESSAGES.ERROR.USER_NOT_FOUND,
                    null,
                    true
                )
            );

        }

        const code = generateOTP(4);

        await sendOtpSms(phone, code);

        await Otp.create({
            phone,
            code,
            expiresAt: Date.now() + 120000
        });

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.OTP_SENT,
                { phoneNumber: phone },
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

exports.resetPassword = async (req, res) => {

    try {

        const { phone, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.updateOne(
            { phone },
            { password: hashedPassword }
        );

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.CHANGE_PASSWORD,
                null,
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


exports.logout = async (req, res) => {
    try {
        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.LOGOUT,
                null,
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