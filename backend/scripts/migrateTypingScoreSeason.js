const mongoose = require("mongoose");
const moment = require("moment-jalaali");
const TypingScore = require("../models/TypingScore");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/typecup";

function getSeason(date) {
    const m = moment(date);
    const jMonth = m.jMonth() + 1;
    const jYear = m.jYear();

    let seasonNumber;

    if (jMonth <= 3) seasonNumber = 1;
    else if (jMonth <= 6) seasonNumber = 2;
    else if (jMonth <= 9) seasonNumber = 3;
    else seasonNumber = 4;

    return {
        year: jYear,
        seasonNumber
    };
}

async function migrate() {
    await mongoose.connect(MONGO_URI);

    console.log("connected to db");

    const scores = await TypingScore.find({
        season: { $exists: false }
    });

    console.log(`Found ${scores.length} records to migrate`);

    for (const score of scores) {
        const season = getSeason(score.createdAt);

        await TypingScore.updateOne(
            { _id: score._id },
            { $set: { season } }
        );
    }

    console.log("migration finished");

    process.exit();
}

migrate();
