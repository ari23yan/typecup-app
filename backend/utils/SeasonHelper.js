const moment = require('moment-jalaali');


exports.getCurrentJalaaliSeason = () => {
    const m = moment();
    const jMonth = m.jMonth() + 1; // در moment-jalaali ماه‌ها از 0 شروع می‌شوند (0=فروردین)
    const jYear = m.jYear();

    let seasonNumber;
    let seasonName;

    if (jMonth <= 3) {
        seasonNumber = 1;
        seasonName = "بهار";
    } else if (jMonth <= 6) {
        seasonNumber = 2;
        seasonName = "تابستان";
    } else if (jMonth <= 9) {
        seasonNumber = 3;
        seasonName = "پاییز";
    } else {
        seasonNumber = 4;
        seasonName = "زمستان";
    }

    return {
        year: jYear,
        seasonNumber: seasonNumber,
        displayName: `${seasonName} ${jYear}`
    };
};



exports.getSeasonName = (num) => {
    const names = { 1: "بهار", 2: "تابستان", 3: "پاییز", 4: "زمستان" };
    return names[num] || "";
};


