const jwt = require("jsonwebtoken");
const MESSAGES = require("../constants/responseMessages");
const ApiResponse = require("../utils/ApiResponse");


module.exports = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json(
            new ApiResponse(
                401,
                MESSAGES.ERROR.INVALID_TOKEN,
                null,
                false
            )
        );
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json(
            new ApiResponse(
                401,
                MESSAGES.ERROR.INVALID_TOKEN,
                null,
                false
            )
        );
    }
};
