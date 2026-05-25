const TypingScore = require('../models/TypingScore');
const Word = require('../models/Word');
const ApiResponse = require('../utils/ApiResponse');
const MESSAGES = require("../constants/responseMessages");
const { getCurrentJalaaliSeason, getSeasonName } = require('../utils/SeasonHelper');
const crypto = require('crypto');

exports.saveGameResult = async (req, res) => {
    try {

        const { score, wpm, correctWords,duration,accuracy,waveReached,errors, signature } = req.body;
        const secretKey = process.env.GAME_SECRET_KEY;

        const expectedData = `${score}-${correctWords}-${wpm}`;
        const expectedSignature = crypto
            .createHmac('sha256', secretKey)
            .update(expectedData)
            .digest('hex');

        if (signature !== expectedSignature) {
            return res.status(401).json({ message: "دیتای ارسالی دستکاری شده است!" });
        }

        const userId = req.user.id;
        const currentSeason = getCurrentJalaaliSeason();

        if (score > (correctWords * 10)) {
            return res.status(400).json(new ApiResponse(400, "دیتای ارسالی نامعتبر است (Score Mismatch)", null, false));
        }

        if (wpm > 200) {
            return res.status(400).json(new ApiResponse(400, "سرعت تایپ غیرطبیعی شناسایی شد.", null, false));
        }

        const minTimeRequired = (correctWords * 0.5);
        if (duration < minTimeRequired && correctWords > 5) {
            return res.status(400).json(new ApiResponse(400, "زمان بازی با تعداد کلمات همخوانی ندارد.", null, false));
        }

        if (accuracy > 100 || accuracy < 0) {
            return res.status(400).json(new ApiResponse(400, "دقت نامعتبر.", null, false));
        }

        const typingScore = new TypingScore({
            user: userId,
            score,
            wpm: Math.round(wpm),
            accuracy: parseFloat(accuracy.toFixed(1)),
            duration: Math.round(duration),
            waveReached: waveReached || 1,
            correctWords: correctWords || 0,
            mistakes: errors || 0,
            season: {
                year: currentSeason.year,
                seasonNumber: currentSeason.seasonNumber
            }
        });

        await typingScore.save();

        const isNewScoreRecord = true;

        return res.json(
            new ApiResponse(200, MESSAGES.SUCCESS.DEFAULT, { isNewScoreRecord }, true)
        );

    } catch (error) {
        console.log("error errorerrorerror",error)
        return res.status(500).json(new ApiResponse(500, MESSAGES.ERROR.DEFAULT, null, false));
    }
};

exports.getWordsByWave = async (req, res) => {
    try {
        const { wave } = req.params;

        let difficulty = 1;
        if (wave <= 2) difficulty = 1;
        else if (wave <= 4) difficulty = 2;
        else difficulty = 3;

        const words = await Word.aggregate([
            { $match: { difficulty: { $lte: difficulty } } },
            { $sample: { size: 50 } }
        ]);
        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.DEFAULT,
                words,
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


exports.getLeaderboard = async (req, res) => {
    try {
        const { limit = 10, sortBy = "score", year, seasonNumber } = req.query;

        const validSortFields = ["score", "wpm", "avgAccuracy", "waveReached"];
        const sortField = validSortFields.includes(sortBy) ? sortBy : "score";

        const currentSeason = getCurrentJalaaliSeason();

        const selectedYear = year ? parseInt(year) : currentSeason.year;
        const selectedSeasonNumber = seasonNumber ? parseInt(seasonNumber) : currentSeason.seasonNumber;

        const leaderboard = await TypingScore.aggregate([
            {
                $match: {
                    "season.year": selectedYear,
                    "season.seasonNumber": selectedSeasonNumber
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $group: {
                    _id: "$user._id",
                    user: { $first: "$user" },
                    score: { $max: "$score" },
                    wpm: { $max: "$wpm" },
                    avgAccuracy: { $avg: "$accuracy" },
                    waveReached: { $max: "$waveReached" },
                    lastPlayed: { $max: "$createdAt" }
                }
            },
            {
                $sort: {
                    [sortField]: -1
                }
            },
            {
                $limit: parseInt(limit)
            }
        ]);

        const formattedLeaderboard = leaderboard.map(item => ({
            userId: item._id,
            score: item.score,
            wpm: item.wpm,
            avgAccuracy: item.avgAccuracy ? Math.round(item.avgAccuracy * 10) / 10 : 0,
            waveReached: item.waveReached,
            lastPlayed: item.lastPlayed,
            user: {
                userName: item.user.userName
            }
        }));

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.DEFAULT,
                {
                    season: {
                        year: selectedYear,
                        seasonNumber: selectedSeasonNumber,
                        label: getSeasonName(selectedSeasonNumber) + "     " + selectedYear
                    },
                    items: formattedLeaderboard
                },
                true
            )
        );
    } catch (error) {
        console.error("Leaderboard error:", error); // برای دیباگ
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

exports.getSeasons = async (req, res) => {
    try {

        const seasons = await TypingScore.aggregate([
            {
                $group: {
                    _id: {
                        year: "$season.year",
                        seasonNumber: "$season.seasonNumber"
                    }
                }
            },
            {
                $sort: {
                    "_id.year": -1,
                    "_id.seasonNumber": -1
                }
            }
        ]);

        const formatted = seasons.map(s => ({
            year: s._id.year,
            seasonNumber: s._id.seasonNumber,
            label: `${getSeasonName(s._id.seasonNumber)} ${s._id.year}`
        }));

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.DEFAULT,
                formatted,
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


