const jwt = require("jsonwebtoken");
const MESSAGES = require("../constants/responseMessages");


module.exports = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: MESSAGES.ERROR.INVALID_TOKEN
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: MESSAGES.ERROR.INVALID_TOKEN
        });
    }
};
