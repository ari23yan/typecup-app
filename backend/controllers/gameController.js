const TypingScore = require('../models/TypingScore');
const Word = require('../models/Word');
const ApiResponse = require('../utils/ApiResponse');
const MESSAGES = require("../constants/responseMessages");
const { getCurrentJalaaliSeason, getSeasonName } = require('../utils/SeasonHelper');
const crypto = require('crypto');

exports.saveGameResult = async (req, res) => {
    try {
        const { score, wpm, correctWords, duration, accuracy, waveReached, errors, signature } = req.body;
        const secretKey = process.env.GAME_SECRET_KEY;

        const expectedData = `${score}-${correctWords}-${wpm}`;
        const expectedSignature = crypto
            .createHmac('sha256', secretKey)
            .update(expectedData)
            .digest('hex');

        if (signature !== expectedSignature) {
            return res.json(
                new ApiResponse(401, MESSAGES.ERROR.WRONG_SIGNITURE, null, false)
            );
        }

        const userId = req.user.id;
        const currentSeason = getCurrentJalaaliSeason();

        // پیدا کردن بهترین نمره قبلی کاربر در این فصل
        const bestScoreInSeason = await TypingScore.findOne({
            user: userId,
            'season.year': currentSeason.year,
            'season.seasonNumber': currentSeason.seasonNumber
        }).sort({ score: -1 }).limit(1);

        let isNewScoreRecord = false;

        if (!bestScoreInSeason) {
            isNewScoreRecord = true;
        }
        else if (score > bestScoreInSeason.score) {
            isNewScoreRecord = true;
        }
        else if (score === bestScoreInSeason.score && wpm > bestScoreInSeason.wpm) {
            isNewScoreRecord = true;
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

        return res.json(
            new ApiResponse(200, MESSAGES.SUCCESS.DEFAULT, { isNewScoreRecord }, true)
        );
    } catch (error) {
        console.error('Error saving game result:', error);
        return res.status(500).json(new ApiResponse(500, MESSAGES.ERROR.DEFAULT, null, false));
    }
};

exports.getWordsByWave = async (req, res) => {
    try {
        const { wave } = req.params;
        const waveNumber = parseInt(wave, 10);
        const words = await Word.aggregate([
            { $match: { difficulty: { $lte: waveNumber } } },
            { $sample: { size: 50 } },
            { $project: { text: 1, _id: 0 } }
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


