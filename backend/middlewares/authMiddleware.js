const jwt = require("jsonwebtoken");
const MESSAGES = require("../constants/responseMessages");
const ApiResponse = require("../utils/ApiResponse");


// Modify your existing middleware
module.exports = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json(
            new ApiResponse(401, MESSAGES.ERROR.INVALID_TOKEN, null, false)
        );
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Add admin check for specific routes
        if (req.originalUrl.includes('/admin') && decoded.userName !== "ari23yan") {
            return res.status(403).json(
                new ApiResponse(403, "Admin access restricted to ari23yan only", null, false)
            );
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json(
            new ApiResponse(401, MESSAGES.ERROR.INVALID_TOKEN, null, false)
        );
    }
};