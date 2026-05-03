const TypingScore = require('../models/TypingScore');
const Word = require('../models/Word');
const ApiResponse = require('../utils/ApiResponse');
const MESSAGES = require("../constants/responseMessages");

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


exports.saveGameResult = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            wpm,
            accuracy,
            duration,
            waveReached,
            correctWords,
            errors,
            score
        } = req.body;

        const typingScore = new TypingScore({
            user: userId,
            score: score,
            wpm: Math.round(wpm),
            accuracy: parseFloat(accuracy.toFixed(1)),
            duration: Math.round(duration),
            waveReached: waveReached || 1,
            correctWords: correctWords || 0,
            mistakes: errors || 0
        });

        await typingScore.save();
        const bestScore = await TypingScore.findOne({
            user: userId
        }).sort({ score: -1 }).limit(1);

        const bestWpm = await TypingScore.findOne({
            user: userId
        }).sort({ wpm: -1 }).limit(1);

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.DEFAULT,
                {
                    scoreId: typingScore._id,
                    finalScore: score,
                    isNewScoreRecord: bestScore && bestScore.score > score ? false : true,
                    isNewWpmRecord: bestWpm && bestWpm.wpm > wpm ? false : true,
                    message: this.getRecordMessage(bestScore, bestWpm, score, wpm)
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

exports.getRecordMessage = (bestScore, bestWpm, currentScore, currentWpm) => {
    const isNewScoreRecord = !bestScore || bestScore.score < currentScore;
    const isNewWpmRecord = !bestWpm || bestWpm.wpm < currentWpm;
    if (isNewScoreRecord && isNewWpmRecord) {
        return MESSAGES.SUCCESS.NEW_RECORD_WPM_SCORE;
    } else if (isNewScoreRecord) {
        return MESSAGES.SUCCESS.NEW_RECORD_SCORE;
    } else if (isNewWpmRecord) {
        return MESSAGES.SUCCESS.NEW_RECORD_WPM;
    }
    return MESSAGES.SUCCESS.SCORE_SAVED;
};

exports.getLeaderboard = async (req, res) => {
    try {
        const { limit = 10, sortBy = 'score' } = req.query;

        const validSortFields = ['score', 'wpm', 'accuracy', 'waveReached'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'score';

        const sortOrder = -1;

        const leaderboard = await TypingScore.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $group: {
                    _id: '$user._id',
                    user: { $first: '$user' },
                    score: { $max: '$score' },
                    wpm: { $max: '$wpm' },
                    avgAccuracy: { $avg: '$accuracy' },
                    waveReached: { $max: '$waveReached' },
                    lastPlayed: { $max: '$createdAt' }
                }
            },
            {
                $sort: {
                    [sortField === 'score' ? 'bestScore' :
                        sortField === 'wpm' ? 'bestWpm' :
                            sortField === 'waveReached' ? 'bestWaveReached' : sortField]: sortOrder
                }
            },
            { $limit: parseInt(limit) },
            {
                $project: {
                    _id: 0,
                    userId: '$_id',
                    score: 1,
                    wpm: 1,
                    avgAccuracy: {
                        $divide: [
                            { $trunc: { $multiply: ['$avgAccuracy', 100] } },
                            100
                        ]
                    },
                    waveReached: 1,
                    lastPlayed: 1,
                    user: {
                        _id: 1,
                        userName: 1,
                        email: 1
                    }
                }
            }
        ]);

        return res.json(
            new ApiResponse(
                200,
                MESSAGES.SUCCESS.DEFAULT,
                leaderboard,
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
