import { useEffect, useState, useRef, useCallback } from "react";
import useSound from "use-sound";
import "./Demo.css";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";

import {
    FaTrophy,
    FaClock,
    FaCheckCircle,
    FaShareAlt,
    FaArrowRight,
    FaArrowLeft,
    FaExclamationTriangle,
    FaKeyboard,
    FaChevronDown
} from "react-icons/fa";

import clickSound from "../../assets/audio/clickSound.mp3";
import errorSound from "../../assets/audio/errorSound.mp3";

const persianWords = [
    "سلام", "کتاب", "برنامه", "کامپیوتر", "اینترنت", "دانشگاه", "هوش", "تایپ", "قلم", "موبایل",
    "الگوریتم", "پردازنده", "فناوری", "مدرسه", "دانشجو", "استاد", "کلاس", "درس", "پژوهش", "پروژه",
    "سیستم", "شبکه", "سرور", "پایگاه", "داده", "اطلاعات", "دیجیتال", "نرم", "سخت", "ربات",
    "یادگیری", "ماشین", "مدل", "تحلیل", "کد", "ویرایشگر", "مرورگر", "صفحه", "نمایشگر", "کیبورد",
    "ماوس", "فایل", "پوشه", "ویندوز", "لینوکس", "اندروید", "اپلیکیشن", "پیام", "ایمیل", "امنیت",
    "رمز", "کاربر", "حساب", "ورود", "خروج", "سرعت", "حافظه", "ذخیره", "پردازش", "تصویر",
    "صدا", "ویدیو", "دوربین", "نور", "رنگ", "طراحی", "گرافیک", "هنر", "موسیقی", "فیلم",
    "داستان", "رمان", "شعر", "ادبیات", "زبان", "فرهنگ", "تاریخ", "جغرافیا", "اقتصاد", "مدیریت",
    "بازار", "خرید", "فروش", "پول", "بانک", "سرمایه", "کار", "شغل", "شرکت", "کارخانه",
    "مهندس", "پزشک", "پرستار", "بیمار", "درمان", "دارو", "سلامت", "بدن", "ورزش", "تمرین",
    "قهرمان", "مسابقه", "بازی", "برد", "باخت", "دوست", "خانواده", "خانه", "شهر", "کشور"
];

const englishWords = [
    "code", "react", "keyboard", "internet", "game",
    "developer", "speed", "logic", "computer", "design",
    "algorithm", "framework", "javascript"
];

export default function Demo({ onBack }) {

    const navigate = useNavigate();
    const [isWaveTransition, setIsWaveTransition] = useState(false);
    const [waveTransitionTimeout, setWaveTransitionTimeout] = useState(null);
    const [started, setStarted] = useState(false);
    const [fallingWords, setFallingWords] = useState([]);
    const [errors, setErrors] = useState(0);
    const [progress, setProgress] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [activeWordId, setActiveWordId] = useState(null);
    const [correctWords, setCorrectWords] = useState(0);
    const [score, setScore] = useState(0);
    const [wave, setWave] = useState(1);
    const maxWave = 5;

    const [pendingWave, setPendingWave] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [totalTime, setTotalTime] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showWaveText, setShowWaveText] = useState(false);

    const recentWordsRef = useRef([]);
    const isProcessingRef = useRef(false);
    const spawnIntervalRef = useRef(null);

    const [playClick] = useSound(clickSound, { volume: .6 });
    const [playError] = useSound(errorSound, { volume: .6 });

    const handleBack = () => {
        navigate("/");
    };

    function getWordList() {
        if (wave < 5) return persianWords;
        return [...persianWords, ...englishWords];
    }

    function normalizeChar(c) {
        if (!c) return c;

        let n = c.normalize("NFKC");
        const map = {
            'ي': 'ی', 'ى': 'ی', 'ئ': 'ی', 'ی': 'ی', 'ك': 'ک', 'ک': 'ک',
            'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ا': 'ا', 'ة': 'ه', 'ؤ': 'و'
        };

        if (map[n]) n = map[n];
        n = n.replace(/[\u064B-\u065F]/g, "");
        return n;
    }

    function randomWord() {
        const list = getWordList();
        let attempts = 0;
        let word;

        do {
            word = list[Math.floor(Math.random() * list.length)];
            attempts++;
            if (attempts > 20) break;
        } while (recentWordsRef.current.includes(word) && attempts < 20);

        recentWordsRef.current.unshift(word);
        if (recentWordsRef.current.length > 5) recentWordsRef.current.pop();

        return word;
    }

    function generateSafeX(existingWords, minGap = 12) {
        const used = existingWords.map(w => w.x);
        for (let attempt = 0; attempt < 40; attempt++) {
            const x = 5 + Math.random() * 85;
            const safe = used.every(u => Math.abs(u - x) > minGap);
            if (safe) return x;
        }
        return 5 + Math.random() * 85;
    }

    function getSpawnCount(multi) {
        const rnd = Math.random();
        if (wave <= 2) {
            if (rnd < 0.8) return 1;
            return 2;
        }
        if (rnd < 0.7) return 1;
        if (rnd < 0.9) return 2;
        return Math.min(2, multi);
    }

    function getWaveConfig() {
        switch (wave) {
            case 1: return { spawn: 2800, speed: 25, multi: 1 };
            case 2: return { spawn: 2400, speed: 20, multi: 1 };
            case 3: return { spawn: 2000, speed: 16, multi: 2 };
            case 4: return { spawn: 1600, speed: 12, multi: 2 };
            case 5: return { spawn: 1300, speed: 9, multi: 3 };
            default: return { spawn: 2800, speed: 25, multi: 1 };
        }
    }

    function getMaxConcurrentWords() {
        if (wave <= 2) return 6;
        if (wave <= 4) return 8;
        return 10;
    }

    const checkKeyboardLanguage = (e, targetWord = null) => {
        if (e.key.length === 1 && /[a-zA-Z\u0600-\u06FF]/.test(e.key)) {
            const isPersian = /[\u0600-\u06FF]/.test(normalizeChar(e.key));

            if (targetWord) {
                const isTargetWordPersian = /[\u0600-\u06FF]/.test(targetWord.text[0]);
                if (isPersian !== isTargetWordPersian) {
                    toast.error("لطفاً زبان کیبورد خود را تغییر دهید!", { duration: 1500, position: "top-center", icon: "⌨️" });
                    return false;
                }
            } else {
                const hasMatchingWord = fallingWords.some(word => {
                    const isWordPersian = /[\u0600-\u06FF]/.test(word.text[0]);
                    return isWordPersian === isPersian;
                });

                if (!hasMatchingWord) {
                    toast.error(`لطفاً زبان کیبورد را به ${isPersian ? "فارسی" : "انگلیسی"} تغییر دهید!`, { duration: 1500, position: "top-center", icon: "⌨️" });
                    return false;
                }
            }
        }
        return true;
    };

    const startWave = (newWave) => {
        if (gameOver) return;

        setIsWaveTransition(true);
        setShowWaveText(true);
        setActiveWordId(null);
        setProgress(0);
        isProcessingRef.current = false;

        recentWordsRef.current = [];

        const timeout = setTimeout(() => {
            if (!gameOver) {
                setIsWaveTransition(false);
                setShowWaveText(false);
            }
        }, 1500);

        setWaveTransitionTimeout(timeout);
    };

    const endGame = useCallback(() => {
        if (gameOver) return;
        setGameOver(true);

        if (spawnIntervalRef.current) {
            clearInterval(spawnIntervalRef.current);
            spawnIntervalRef.current = null;
        }

        if (startTime && !totalTime) {
            const end = Date.now();
            const finalTime = ((end - startTime) / 1000).toFixed(1);
            setTotalTime(finalTime);
        }
        setShowModal(true);
    }, [gameOver, startTime, totalTime]);

    // بررسی تعداد خطاها
    useEffect(() => {
        if (errors >= 3 && !gameOver) {
            endGame();
        }
    }, [errors, gameOver, endGame]);

    function handleShare() {
        // تابع اشتراک‌گذاری
    }

    useEffect(() => {
        if (started && !gameOver) setStartTime(Date.now());
    }, [started]);

    useEffect(() => {
        if (pendingWave && fallingWords.length === 0 && !isWaveTransition) {
            setWave(pendingWave);
            startWave(pendingWave);
            setPendingWave(null);
        }
    }, [fallingWords, pendingWave, isWaveTransition]);

    // اسپاون کلمات
    useEffect(() => {
        if (!started || gameOver || isWaveTransition || pendingWave) return;

        if (spawnIntervalRef.current) {
            clearInterval(spawnIntervalRef.current);
        }

        const config = getWaveConfig();

        const spawnWord = () => {
            setFallingWords(prev => {
                if (prev.length >= getMaxConcurrentWords()) return prev;

                const count = getSpawnCount(config.multi);
                let updated = [...prev];

                for (let i = 0; i < count && updated.length < getMaxConcurrentWords(); i++) {
                    const newWord = {
                        id: Date.now() + Math.random() + i,
                        text: randomWord(),
                        x: generateSafeX(updated),
                        duration: config.speed,
                        createdAt: Date.now()
                    };
                    updated.push(newWord);
                }
                return updated;
            });
        };

        spawnIntervalRef.current = setInterval(spawnWord, config.spawn);

        return () => {
            if (spawnIntervalRef.current) {
                clearInterval(spawnIntervalRef.current);
                spawnIntervalRef.current = null;
            }
        };
    }, [started, gameOver, isWaveTransition, wave, pendingWave]);

    // تایمر حذف کلمات (منطق اصلاح شده)
    useEffect(() => {
        if (!started || gameOver) return;

        const checkInterval = setInterval(() => {
            setFallingWords(prev => {
                const now = Date.now();
                const expiredWords = prev.filter(word => (now - word.createdAt) >= (word.duration * 1000));

                if (expiredWords.length > 0) {
                    playError();
                    setErrors(e => e + expiredWords.length);

                    setActiveWordId(currentActive => {
                        if (expiredWords.some(w => w.id === currentActive)) {
                            setProgress(0);
                            isProcessingRef.current = false;
                            return null;
                        }
                        return currentActive;
                    });

                    return prev.filter(word => (now - word.createdAt) < (word.duration * 1000));
                }
                return prev;
            });
        }, 100);

        return () => clearInterval(checkInterval);
    }, [started, gameOver, playError]);

    // هندل کیبورد
    useEffect(() => {
        if (!started || gameOver || isWaveTransition) return;

        const handleKeyDown = (e) => {
            if (gameOver || isWaveTransition) return;
            if (isProcessingRef.current) return;

            if (e.key === "Backspace" || e.key === " " || e.key === "Space") {
                e.preventDefault();
                return;
            }

            if (e.key.length !== 1) return;

            if (!activeWordId) {
                if (!checkKeyboardLanguage(e, null)) {
                    e.preventDefault();
                    return;
                }

                const target = fallingWords.find(w => {
                    const firstChar = w.text[0];
                    return normalizeChar(firstChar) === normalizeChar(e.key);
                });

                if (target) {
                    isProcessingRef.current = true;
                    setActiveWordId(target.id);
                    setProgress(1);
                    playClick();
                    setTimeout(() => { isProcessingRef.current = false; }, 50);
                }
                return;
            }

            const activeWord = fallingWords.find(w => w.id === activeWordId);
            if (!activeWord) {
                setActiveWordId(null);
                setProgress(0);
                isProcessingRef.current = false;
                return;
            }

            if (!checkKeyboardLanguage(e, activeWord)) {
                e.preventDefault();
                return;
            }

            const currentProgress = progress;
            const expectedChar = activeWord.text[currentProgress];

            if (!expectedChar) {
                setActiveWordId(null);
                setProgress(0);
                isProcessingRef.current = false;
                return;
            }

            const typedNormalized = normalizeChar(e.key);
            const expectedNormalized = normalizeChar(expectedChar);

            if (typedNormalized === expectedNormalized) {
                isProcessingRef.current = true;
                playClick();
                const nextProgress = currentProgress + 1;

                if (nextProgress === activeWord.text.length) {
                    const gained = 10;
                    setCorrectWords(c => c + 1);

                    setScore(prevScore => {
                        const newScore = prevScore + gained;
                        const waveTargets = {
                            1: 150,
                            2: 300,
                            3: 450,
                            4: 600,
                            5: 750
                        };

                        const targetScore = waveTargets[wave];
                        if (targetScore && newScore >= targetScore && wave < maxWave && !pendingWave && !isWaveTransition) {
                            setPendingWave(wave + 1);
                        }
                        return newScore;
                    });

                    setFallingWords(w => w.filter(wd => wd.id !== activeWord.id));
                    setActiveWordId(null);
                    setProgress(0);
                } else {
                    setProgress(nextProgress);
                }

                setTimeout(() => { isProcessingRef.current = false; }, 50);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [started, gameOver, fallingWords, activeWordId, progress, wave, pendingWave, isWaveTransition]);

    useEffect(() => {
        if (!started) return;
        setShowWaveText(true);
        const t = setTimeout(() => setShowWaveText(false), 1500);
        return () => clearTimeout(t);
    }, [wave, started]);

    useEffect(() => {
        return () => {
            if (waveTransitionTimeout) clearTimeout(waveTransitionTimeout);
            if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
        };
    }, [waveTransitionTimeout]);

    return (
        <div className="game">
            <Toaster />
            <button className="glass-button" onClick={handleBack}>
                <FaArrowLeft className="icon" />
                بازگشت
            </button>

            {!started && (
                <div className="start-screen" dir="rtl">
                    <div className="guide-box">
                        <h1>راهنمای بازی</h1>
                        <p className="soon-tag">نسخه دمو</p>
                        <div className="guide-text">
                            <p>1) کلمات از بالای صفحه سقوط می‌کنند. قبل از اینکه به خط پایین برسند، آن‌ها را سریع تایپ کنید تا حذف شوند.</p>
                            <p>2) اگر ۳ کلمه به خط پایین برسند و حذف نشوند، بازی به پایان می‌رسد.</p>
                        </div>
                        <button className="start-btn" onClick={() => setStarted(true)}>
                            <FaTrophy className="icon" />
                            شروع بازی
                        </button>
                    </div>
                </div>
            )}

            {started && (
                <>
                    {showWaveText && (
                        <div className="wave-popup">مرحله {wave}</div>
                    )}

                    <div className="hud-box">
                        <div className="hud-item">
                            <FaTrophy className="icon" />
                            <span>{score}</span>
                        </div>
                        <div className="hud-item">
                            <FaKeyboard className="icon" />
                            <span>مرحله {wave}/{maxWave}</span>
                        </div>
                        <div className="hud-item error">
                            <FaExclamationTriangle className="icon" />
                            <span>{errors}/3</span>
                        </div>
                        <div className="hud-item">
                            <FaChevronDown className="icon" />
                            <span> {fallingWords.length}</span>
                        </div>
                    </div>

                    {fallingWords.map(word => (
                        <div
                            key={word.id}
                            className="falling-word"
                            style={{
                                left: `${word.x}%`,
                                animationDuration: `${word.duration}s`
                            }}
                        >
                            {word.text.split("").map((char, i) => (
                                <span
                                    key={i}
                                    style={{
                                        color: word.id === activeWordId && i < progress ? "#ff9800" : "white"
                                    }}
                                >
                                    {char}
                                </span>
                            ))}
                        </div>
                    ))}
                    <div className="fail-line"></div>
                </>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2 className="modal-title">
                            <FaTrophy className="icon" />
                            بازی تمام شد
                        </h2>
                        <div className="modal-stats">
                            <p>⭐ امتیاز: {score}</p>
                            <p><FaCheckCircle className="icon" /> کلمات درست: {correctWords}</p>
                            <p><FaClock className="icon" /> زمان بازی: {totalTime} ثانیه</p>
                        </div>
                        <div className="modal-buttons">
                            <button className="modal-btn" onClick={onBack}>
                                <FaArrowRight className="icon" />
                                بازگشت
                            </button>
                            <button className="modal-btn" onClick={handleShare}>
                                <FaShareAlt className="icon" />
                                اشتراک‌گذاری
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
