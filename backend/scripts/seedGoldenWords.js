/**
 * اسکریپت پر کردن جدول کلمات طلایی
 * اجرا:  node scripts/seedGoldenWords.js
 */
require('dotenv').config({
    path: process.env.NODE_ENV === "production" ? ".env.production" : ".env"
});

const mongoose = require('mongoose');
const GoldenWord = require('../models/GoldenWord');

const goldenWords = [
    // ===== فوق‌سخت (difficulty 5) =====
    { text: "قسطنطنیه",   language: "persian", difficulty: 5 },
    { text: "استسقاء",   language: "persian", difficulty: 5 },
    { text: "استحفاظ",   language: "persian", difficulty: 5 },
    { text: "اجتناب",    language: "persian", difficulty: 5 },
    { text: "اضمحلال",   language: "persian", difficulty:  5 },
    { text: "استیصال",   language: "persian", difficulty: 5 },
    { text: "استنکاف",   language: "persian", difficulty: 5 },
    { text: "تسخیر",     language: "persian", difficulty: 5 },
    { text: "تلألؤ",     language: "persian", difficulty: 5 },
    { text: "تصلب",      language: "persian", difficulty: 5 },
    { text: "تقارب",     language: "persian", difficulty: 5 },
    { text: "تواتر",     language: "persian", difficulty: 5 },
    { text: "تلاطم",     language: "persian", difficulty: 5 },
    { text: "اضطراب",    language: "persian", difficulty: 5 },
    { text: "انحطاط",    language: "persian", difficulty: 5 },
    { text: "استنطاق",   language: "persian", difficulty: 5 },
    { text: "استشهاد",   language: "persian", difficulty: 5 },
    { text: "استیلاد",   language: "persian", difficulty: 5 },
    { text: "استکبار",   language: "persian", difficulty: 5 },
    { text: "متلألئ",    language: "persian", difficulty: 5 },

    // ===== خیلی سخت (difficulty 4) =====
    { text: "غوطه‌ور",   language: "persian", difficulty: 4 },
    { text: "غلظت",      language: "persian", difficulty: 4 },
    { text: "قربانی",    language: "persian", difficulty: 4 },
    { text: "مخمصه",     language: "persian", difficulty: 4 },
    { text: "معضل",      language: "persian", difficulty: 4 },
    { text: "مهلکه",     language: "persian", difficulty: 4 },
    { text: "وصله",      language: "persian", difficulty: 4 },
    { text: "هیئت",      language: "persian", difficulty: 4 },
    { text: "موسسه",     language: "persian", difficulty: 4 },
    { text: "متقن",      language: "persian", difficulty: 4 },
    { text: "مستند",     language: "persian", difficulty: 4 },
    { text: "مشوب",      language: "persian", difficulty: 4 },
    { text: "مقرون",     language: "persian", difficulty: 4 },
    { text: "مضمحل",     language: "persian", difficulty: 4 },
    { text: "منقضی",     language: "persian", difficulty: 4 },
    { text: "متواتر",    language: "persian", difficulty: 4 },
    { text: "متلاطم",    language: "persian", difficulty: 4 },

    // ===== سخت (difficulty 3) =====
    { text: "افتخار",    language: "persian", difficulty: 3 },
    { text: "ثروت",      language: "persian", difficulty: 3 },
    { text: "گنجینه",    language: "persian", difficulty: 3 },
    { text: "پیروزی",    language: "persian", difficulty: 3 },
    { text: "شکوه",      language: "persian", difficulty: 3 },
    { text: "جلال",      language: "persian", difficulty: 3 },
    { text: "اقتدار",    language: "persian", difficulty: 3 },
    { text: "هیمنه",     language: "persian", difficulty: 3 },
];

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    let inserted = 0;

    for (const word of goldenWords) {
        const result = await GoldenWord.updateOne(
            { text: word.text },
            { $set: { ...word, multiplier: 10, isActive: true } },
            { upsert: true }
        );

        if (result.upsertedCount > 0) {
            inserted += result.upsertedCount;
            console.log(`➕ inserted: ${word.text}`);
        } else {
            console.log(`➖ already exists / updated: ${word.text}`);
        }
    }

    const total = await GoldenWord.countDocuments({});
    console.log(`\n✅ Done! ${inserted} new golden words inserted. Total: ${total}`);

    await mongoose.connection.close();
    process.exit(0);
};

run().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});