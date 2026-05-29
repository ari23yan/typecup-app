// backend/utils/footballApi.js
const axios = require('axios');

const fetchWorldCupMatches = async () => {
    try {
        // استفاده از دیتای باز github (پروژه openfootball)
        // این یک منبع کاملا رایگان و بدون نیاز به KEY است
        const response = await axios.get('https://raw.githubusercontent.com/openfootball/world-cup.json/master/2022/worldcup.json');
        
        // توجه: ساختار این فایل شامل راندها (Rounds) است
        return response.data.rounds; 
    } catch (error) {
        console.error("Error fetching free football data:", error.message);
        return null;
    }
};

module.exports = { fetchWorldCupMatches };
