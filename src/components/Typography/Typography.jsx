import { useEffect, useMemo, useState } from "react";
import { getTypingStats } from "../../api/profile";
import toast from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import "./Typography.css";
export default function Typography() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await getTypingStats();
            if (data.success) {
                setStats(data.data);
            } else {
                toast.error(data.message || "خطا در دریافت آمار تایپ");
            }
        } catch (e) {
            toast.error("ارتباط با سرور برقرار نشد");
        } finally {
            setLoading(false);
        }
    };

    const computed = useMemo(() => {
        if (!stats) return null;

        const {
            maxWpm,
            avgWpm,
            avgAccuracy,
            maxScore,
            testsCount,
            totalDuration
        } = stats;

        let level = "Beginner";
        if (maxWpm >= 40) level = "Intermediate";
        if (maxWpm >= 60) level = "Advanced";
        if (maxWpm >= 80) level = "Expert";

        const totalMinutes = Math.round(totalDuration / 60); 
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        const performanceScore = Math.round(
            (avgWpm * 0.7) + (avgAccuracy * 0.3)
        );
        const performanceLabel =
            performanceScore < 30
                ? "جا برای پیشرفت زیاده :)"
                : performanceScore < 60
                    ? "در مسیر درست هستی "
                    : performanceScore < 80
                        ? "واقعاً خوب تایپ می‌کنی "
                        : "حرفه‌ای و ترسناک! ";

        return {
            level,
            hours,
            minutes,
            performanceScore,
            performanceLabel
        };
    }, [stats]);

    if (loading) {
        return <div className="typo-loading">در حال ساختن تایپوگرافی اختصاصی شما...</div>;
    }

    if (!stats) {
        return <div className="typo-loading">آماری برای نمایش پیدا نشد.</div>;
    }
    const handleBack = () => {
        navigate("/");
    };

    return (


        <div className="typo-page" dir="rtl">
            <button className="glass-button" onClick={handleBack}>
                <FaArrowLeft className="icon" />
                بازگشت
            </button>
            <div className="typo-header">
                <h1>تایپوگرافی تایپ‌کاپ</h1>
                <p className="typo-subtitle">
                    <span> تایپوگرافی </span>
                    روایت سرعت، دقت و ریتم تایپ شماست
                    <br />
                </p>
            </div>

            <div className="typo-main-card">
                <div className="typo-main-left">
                    <div className="typo-stats-grid">
                        <div className="typo-stat-card primary">
                            <span>بیشترین سرعت (WPM)</span>
                            <h2>{stats.maxWpm}</h2>
                            <p className="float" >{computed.level}</p>
                        </div>

                        <div className="typo-stat-card">
                            <span>میانگین سرعت</span>
                            <h3>{stats.avgWpm}</h3>
                        </div>

                        <div className="typo-stat-card">
                            <span>میانگین دقت</span>
                            <h3>{stats.avgAccuracy}%</h3>
                        </div>

                        <div className="typo-stat-card">
                            <span>بیشترین امتیاز</span>
                            <h3>{stats.maxScore}</h3>
                        </div>
                    </div>

                    <div className="typo-performance-card">
                        <div className="typo-performance-score">
                            <div
                                className="circle"
                                style={{
                                    background: `conic-gradient(rgb(253 185 82) 46.8deg, rgb(229, 231, 235)0deg)`
                                }}
                            >
                                <div className="inner">
                                    <span>{computed.performanceScore}</span>
                                    <small>از ۱۰۰</small>
                                </div>
                            </div>
                        </div>
                        <div className="typo-performance-text">
                            <h3>امتیاز سبک تایپ شما</h3>
                            <p>{computed.performanceLabel}</p>
                        </div>
                    </div>
                </div>

                <div className="typo-main-right">
                    <div className="typo-chart-card">
                        <h3>نمای کلی عملکرد شما</h3>
                        <div className="typo-chart">
                            <div className="typo-chart-bars">
                                <div className="bar-group">
                                    <span className="bar-label">سرعت</span>
                                    <div className="bar-outer">
                                        <div
                                            className="bar-inner speed"
                                            style={{ width: `${Math.min(stats.avgWpm, 100)}%` }}
                                        />
                                    </div>
                                    <span className="bar-value">{stats.avgWpm} WPM</span>
                                </div>

                                <div className="bar-group">
                                    <span className="bar-label">دقت</span>
                                    <div className="bar-outer">
                                        <div
                                            className="bar-inner accuracy"
                                            style={{ width: `${Math.min(stats.avgAccuracy, 100)}%` }}
                                        />
                                    </div>
                                    <span className="bar-value">{stats.avgAccuracy}%</span>
                                </div>

                                <div className="bar-group">
                                    <span className="bar-label">پیشرفت نسبت به رکورد</span>
                                    <div className="bar-outer">
                                        <div
                                            className="bar-inner progress"
                                            style={{
                                                width: `${Math.min(
                                                    (stats.avgWpm / (stats.maxWpm || 1)) * 100,
                                                    100
                                                )}%`
                                            }}
                                        />
                                    </div>
                                    <span className="bar-value">
                                        {Math.round(
                                            (stats.avgWpm / (stats.maxWpm || 1)) * 100
                                        )}
                                        %
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* دکمه اشتراک‌گذاری */}
                    <button
                        className="typo-share-btn"
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: "تایپوگرافی تایپ من",
                                    text: `بیشترین سرعت من ${stats.maxWpm} WPM و میانگین دقتم ${stats.avgAccuracy}% هست!`,
                                    url: window.location.href
                                });
                            } else {
                                navigator.clipboard.writeText(window.location.href);
                                toast("لینک صفحه کپی شد؛ هر جا دوست داشتی بچسبونش.");
                            }
                        }}
                    >
                        اشتراک‌گذاری تایپوگرافی
                    </button>
                </div>
            </div>
        </div>
    );
}
