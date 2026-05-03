import { useEffect, useState, useRef } from "react";
import useSound from "use-sound";
import "./Game.css";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import { getWordsByWave, saveGameResult } from "../../api/game";

import {
    FaTrophy,
    FaClock,
    FaCheckCircle,
    FaShareAlt,
    FaArrowRight,
    FaArrowLeft,
    FaExclamationTriangle,
    FaKeyboard,
    FaChevronDown,
    FaStar,
    FaTimesCircle,
    FaBolt,
    FaBullseye,
    FaList
} from "react-icons/fa";

import clickSound from "../../assets/audio/clickSound.mp3";
import errorSound from "../../assets/audio/errorSound.mp3";

export default function Game({ onBack }) {
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

    const [wordBank, setWordBank] = useState([]);
    const [savedResult, setSavedResult] = useState(null);

    const recentWordsRef = useRef([]);
    const isProcessingRef = useRef(false);
    const spawnIntervalRef = useRef(null);
    const endGameTimeoutRef = useRef(null);
    const isEndingRef = useRef(false);

    const [playClick] = useSound(clickSound, { volume: .6 });
    const [playError] = useSound(errorSound, { volume: .6 });

    const handleBack = () => {
        if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
        if (endGameTimeoutRef.current) clearTimeout(endGameTimeoutRef.current);
        navigate("/");
    };

    const loadWords = async (waveNum) => {
        try {
            const response = await getWordsByWave(waveNum);
            if (response.success && response.data && response.data.length > 0) {
                const words = response.data.map(word =>
                    typeof word === 'string' ? word : word.text || word.word
                );
                setWordBank(prev => {
                    const combined = [...prev, ...words];
                    return Array.from(new Set(combined));
                });
            }
        } catch (error) {
            console.error("Error fetching words:", error);
        }
    };

    useEffect(() => {
        if (started && wordBank.length === 0) {
            loadWords(1).then(() => {
                if (maxWave > 1) loadWords(2);
            });
        }
    }, [started]);

    useEffect(() => {
        if (started && wave > 1 && wave < maxWave) {
            loadWords(wave + 1);
        }
    }, [wave]);

    async function endGame() {
        if (gameOver || isEndingRef.current) return;
        isEndingRef.current = true;
        setGameOver(true);

        if (spawnIntervalRef.current) {
            clearInterval(spawnIntervalRef.current);
            spawnIntervalRef.current = null;
        }

        let finalTime = totalTime;
        if (startTime && !totalTime) {
            const end = Date.now();
            finalTime = ((end - startTime) / 1000).toFixed(1);
            setTotalTime(finalTime);
        }

        // محاسبه WPM
        const calculatedWpm = Math.round((correctWords / (finalTime / 60)) || 0);
        const calculatedAccuracy = correctWords + errors > 0
            ? (correctWords / (correctWords + errors)) * 100
            : 100;

        try {
            const response = await saveGameResult({
                wpm: calculatedWpm,
                accuracy: parseFloat(calculatedAccuracy.toFixed(1)),
                duration: Math.round(parseFloat(finalTime)),
                waveReached: wave,
                correctWords: correctWords,
                errors: errors,
                score: score
            });

            if (response?.data?.success) {
                setSavedResult(response.data.data);
            }
        } catch (error) {
            console.error("Error saving result:", error);
        }

        setShowModal(true);
    }

    const checkAndEndGame = (newErrors) => {
        if (newErrors >= 3 && !gameOver && !isEndingRef.current) {
            if (endGameTimeoutRef.current) {
                clearTimeout(endGameTimeoutRef.current);
            }
            endGameTimeoutRef.current = setTimeout(() => endGame(), 50);
        }
    };

    function getWordList() {
        if (wordBank.length > 0) return wordBank;
        return [];
    }

    function normalizeChar(c) {
        if (!c) return c;
        let n = c.normalize("NFKC");
        const map = {
            'ي': 'ی', 'ى': 'ی', 'ئ': 'ی', 'ی': 'ی',
            'ك': 'ک', 'ک': 'ک', 'أ': 'ا', 'إ': 'ا',
            'آ': 'ا', 'ا': 'ا', 'ة': 'ه', 'ؤ': 'و'
        };
        if (map[n]) n = map[n];
        return n.replace(/[\u064B-\u065F]/g, "");
    }

    function randomWord(existingWords = []) {
        const list = getWordList();
        if (!list.length) return "کلمه";

        const usedFirstChars = existingWords.map(w => normalizeChar(w.text[0]));
        let availableWords = list.filter(w => !usedFirstChars.includes(normalizeChar(w[0])));

        if (availableWords.length === 0) availableWords = list;

        let attempts = 0;
        let word;
        do {
            word = availableWords[Math.floor(Math.random() * availableWords.length)];
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
        if (wave === 1) return rnd < 0.7 ? 1 : 2;
        if (wave === 2) return rnd < 0.4 ? 1 : 2;
        if (wave === 3) return rnd < 0.3 ? 1 : (rnd < 0.8 ? 2 : 3);
        if (wave === 4) return rnd < 0.5 ? 2 : 3;
        return 3;
    }

    function getWaveConfig() {
        switch (wave) {
            case 1: return { spawn: 2000, speed: 20, multi: 1 };
            case 2: return { spawn: 1600, speed: 16, multi: 2 };
            case 3: return { spawn: 1200, speed: 13, multi: 2 };
            case 4: return { spawn: 900, speed: 10, multi: 3 };
            case 5: return { spawn: 700, speed: 8, multi: 3 };
            default: return { spawn: 2000, speed: 20, multi: 1 };
        }
    }

    function getMaxConcurrentWords() {
        if (wave <= 2) return 8;
        if (wave <= 4) return 12;
        return 16;
    }

    const getWaveScoreThreshold = (waveNum) => {
        const thresholds = {
            1: 150,
            2: 300,
            3: 450,
            4: 600,
            5: Infinity
        };
        return thresholds[waveNum] || Infinity;
    };

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

    function handleShare() {
        const calculatedWpm = Math.round((correctWords / (totalTime / 60)) || 0);
        const shareText = `من در تایپ کاپ به امتیاز ${score} رسیدم! 🎯\nمرحله ${wave}/${maxWave}\nکلمات صحیح: ${correctWords}\nخطاها: ${errors}\nسرعت تایپ: ${calculatedWpm} WPM`;
        if (navigator.share) {
            navigator.share({ title: 'تایپ کاپ', text: shareText });
        } else {
            navigator.clipboard.writeText(shareText);
            toast.success("متن اشتراک‌گذاری کپی شد!");
        }
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
                        text: randomWord(updated),
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
    }, [started, gameOver, isWaveTransition, wave, pendingWave, wordBank]);

    // تایمر حذف کلمات
    useEffect(() => {
        if (!started || gameOver) return;

        const checkInterval = setInterval(() => {
            const now = Date.now();
            const wordsToRemove = [];

            fallingWords.forEach(word => {
                if (now - word.createdAt >= word.duration * 1000) {
                    wordsToRemove.push(word.id);
                }
            });

            if (wordsToRemove.length > 0) {
                wordsToRemove.forEach(id => {
                    if (!gameOver && !isEndingRef.current) {
                        playError();

                        setErrors(prev => {
                            if (prev >= 3) return prev;
                            const newErrors = prev + 1;
                            checkAndEndGame(newErrors);
                            return newErrors;
                        });

                        if (activeWordId === id) {
                            setActiveWordId(null);
                            setProgress(0);
                            isProcessingRef.current = false;
                        }
                    }
                });

                setFallingWords(prev => prev.filter(w => !wordsToRemove.includes(w.id)));
            }
        }, 100);

        return () => clearInterval(checkInterval);
    }, [started, gameOver, fallingWords, activeWordId]);

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
                        const threshold = getWaveScoreThreshold(wave);

                        // بررسی ارتقای مرحله
                        if (newScore >= threshold && wave < maxWave && !pendingWave && !isWaveTransition) {
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
            if (endGameTimeoutRef.current) clearTimeout(endGameTimeoutRef.current);
        };
    }, [waveTransitionTimeout]);

    const goToResults = () => {
        navigate("/leaderboard");
    };

    const calculatedWpm = correctWords / (totalTime / 60) || 0;
    const calculatedAccuracy = correctWords + errors > 0
        ? (correctWords / (correctWords + errors)) * 100
        : 100;

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
                        <p className="soon-tag">تایپ‌کاپ</p>
                        <div className="prize-box">
                            <div className="prize-icon">🏆</div>
                            <div className="prize-info">
                                <h3>جایزه فصل</h3>
                                <p>هر فصل (۳ ماه) یک بار</p>
                                <div className="prize-amount">۱,۰۰۰,۰۰۰ تومان</div>
                                <p className="prize-desc">به نفر اول هر فصل تعلق می‌گیرد!</p>
                            </div>
                        </div>

                        <div className="guide-text">
                            <p>1) کلمات از بالای صفحه سقوط می‌کنند. قبل از رسیدن به خط قرمز، آن‌ها را تایپ کنید!</p>
                            <p>2) اگر ۳ کلمه به خط پایین برسند، بازی تمام می‌شود.</p>
                            <p>3) با هر کلمه صحیح ۱۰ امتیاز می‌گیرید.</p>
                            <p>4) با عبور از امتیاز هر مرحله، به مرحله بعد می‌روید.</p>
                        </div>

                        <div className="button-group">
                            <button className="start-btn" onClick={() => setStarted(true)}>
                                <FaTrophy className="icon" />
                                شروع بازی
                            </button>
                            <button className="results-btn" onClick={goToResults}>
                                <FaList className="icon" />
                                مشاهده نتایج
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {started && (
                <>
                    {showWaveText && (
                        <div className="wave-popup"> مرحله {wave} </div>
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
                            <span>{Math.min(errors, 3)}/3</span>
                        </div>
                        <div className="hud-item">
                            <FaChevronDown className="icon" />
                            <span>{fallingWords.length}</span>
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
                            {savedResult?.isNewScoreRecord ? "🎉 رکورد جدید امتیاز! 🎉" :
                                savedResult?.isNewWpmRecord ? "🚀 رکورد جدید سرعت! 🚀" :
                                    "بازی تمام شد"}
                        </h2>
                        <div className="modal-stats">
                            <p><FaStar className="icon" /> امتیاز نهایی: {score}</p>
                            <p><FaCheckCircle className="icon" /> کلمات صحیح: {correctWords}</p>
                            <p><FaTimesCircle className="icon" /> خطاها: {Math.min(errors, 3)}</p>
                            <p><FaClock className="icon" /> زمان: {totalTime} ثانیه</p>
                            <p><FaBolt className="icon" /> سرعت تایپ: {Math.round(calculatedWpm)} WPM</p>
                            <p><FaBullseye className="icon" /> دقت: {Math.round(calculatedAccuracy)}%</p>
                            <p><FaKeyboard className="icon" /> مرحله رسیده: {wave}</p>
                        </div>
                        {savedResult?.message && (
                            <p className="record-message">{savedResult.message}</p>
                        )}
                        <div className="modal-buttons">
                            <button className="modal-btn" onClick={handleBack}>
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