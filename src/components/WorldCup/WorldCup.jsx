import { useEffect, useMemo, useState } from "react";
// import { getTypingStats } from "../../api/worldcup";
import toast from "react-hot-toast";
import { FaArrowLeft, FaSpinner, } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./WorldCup.css";
import worldCupLogo from "../../assets/worldcup.png";
import walletIcon from "../../assets/whallet.png";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { getUserWallet, getMatches } from "../../api/worldcup";

export default function WorldCup() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [matches, setMatches] = useState([]);
    const [wallet, setWallet] = useState({
        balance: 0,
        pendingBetsCount: 0,
        totalPendingAmount: 0
    });
    const WorldCupSkeleton = () => {
        return (
            <div className="worldcup-container">


                <div className="worldcup-header">
                    <Skeleton
                        baseColor="rgba(255,255,255,0.08)"
                        highlightColor="rgba(255,255,255,0.15)"
                        circle
                        width={40}
                        height={40}
                    />
                    <Skeleton
                        baseColor="rgba(255,255,255,0.08)"
                        highlightColor="rgba(255,255,255,0.15)"
                        width={120}
                        height={60}
                    />
                    <Skeleton
                        baseColor="rgba(255,255,255,0.08)"
                        highlightColor="rgba(255,255,255,0.15)"
                        width={130}
                        height={60}
                        borderRadius={12}
                    />
                </div>

                <div className="worldcup-menu">
                    {[1, 2, 3].map((item) => (
                        <div className="menu-card" key={item}>
                            <Skeleton
                                baseColor="rgba(255,255,255,0.08)"
                                highlightColor="rgba(255,255,255,0.15)"
                                height={30}
                                width="70%"
                            />
                            <Skeleton
                                baseColor="rgba(255,255,255,0.08)"
                                highlightColor="rgba(255,255,255,0.15)"
                                height={16}
                                width="100%"
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);
    //دریافت مقدار کیف پول
    useEffect(() => {
        const fetchWallet = async () => {
            try {
                setLoading(true);
                const result = await getUserWallet();
                if (result.success) {
                    setWallet(result.data);
                } else {
                    toast.error("خطا در دریافت اطلاعات کیف پول");
                }
            } catch (error) {
                toast.error("خطا در دریافت اطلاعات کیف پول");
            } finally {
                setLoading(false);
            }
        };

        fetchWallet();
    }, []);
    //دریافت لیست بازی ها
    useEffect(() => {
        const fetchWeekMatches = async () => {
            try {
                const result = await getMatches(); // مثلا هفته جاری
                
                if (result.success) {
                    setMatches(result.data);
                }
            } catch (error) {
                console.log(error);
            }
        };
        fetchWeekMatches();
    }, []);

    if (loading) {
        return (
            <div className="worldcup-page">
                <div className="page-loader" dir="rtl">
                    <FaSpinner className="loading-icon" />
                    <span>در حال بارگذاری...</span>
                </div>

                <WorldCupSkeleton />
            </div>
        );
    }
    return (
        <div className="worldcup-page">

            <div className="worldcup-container">

                {/* Header */}
                <div className="worldcup-header">
                    <button
                        className="back-btn"
                        onClick={() => navigate(-1)}
                    >
                        <FaArrowLeft />
                    </button>

                    <div className="worldcup-brand">
                        <img
                            src={worldCupLogo}
                            alt="World Cup"
                            className="worldcup-logo"
                        />
                    </div>

                    <div className="wallet-card">
                        <img src={walletIcon} alt="wallet" className="wallet-icon" />

                        <div className="wallet-info">
                            <span className="wallet-title">کیف پول</span>

                            <div className="wallet-balance">
                                <strong>
                                    {(wallet.balance / 10)?.toLocaleString("fa-IR")}
                                </strong>
                                <span>تومان</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Menu Cards - Unified Design */}
                <div className="worldcup-menu">
                    <div className="game-card main-card">
                        <div className="card-header">
                            <h3>بازی‌های هفته</h3>
                            <div className="header-line"></div>
                        </div>
                        <div className="card-content">
                            <div className="matches-list">
                                {matches.map((match) => (
                                    <div
                                        key={match.matchId}
                                        className="match-item"
                                        onClick={() => navigate(`/worldcup/match/${match.matchId}`)}
                                    >
                                        <div className="match-date">

                                            <span className="persian-date">{match.persianDate.replace(/-/g, "/")}</span>
                                        </div>

                                        <div className="match-teams">
                                            <div className="team home-team">
                                                <img
                                                    src={match.homeTeam.flag}
                                                    alt={match.homeTeam.name_fa}
                                                    className="team-flag"
                                                />
                                                <span className="team-name">{match.homeTeam.name_fa}</span>
                                            </div>

                                            <div className="match-vs">VS</div>

                                            <div className="team away-team">
                                                <img
                                                    src={match.awayTeam.flag}
                                                    alt={match.awayTeam.name_fa}
                                                    className="team-flag"
                                                />
                                                <span className="team-name">{match.awayTeam.name_fa}</span>
                                            </div>
                                        </div>

                                        <div className="match-odds">
                                            <div className="odd-item">
                                                <span className="odd-label">برد {match.homeTeam.name_fa}</span>
                                                <span className="odd-value">{match.odds.homeWin.toFixed(2)}</span>
                                            </div>
                                            <div className="odd-item">
                                                <span className="odd-label">مساوی</span>
                                                <span className="odd-value">{match.odds.draw.toFixed(2)}</span>
                                            </div>
                                            <div className="odd-item">
                                                <span className="odd-label">برد {match.awayTeam.name_fa}</span>
                                                <span className="odd-value">{match.odds.awayWin.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className="match-prediction-btn">
                                            <button className="predict-btn">پیش‌بینی</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="side-cards-container">
                        {/* کارت پیش‌بینی‌های من */}
                        <div
                            className="game-card main-card"
                            onClick={() => navigate("/worldcup/my-predictions")}
                        >
                            <div className="card-header">
                                <h3>پیش‌بینی‌های من</h3>
                                <div className="header-line"></div>
                            </div>
                            <div className="card-content centered">
                            </div>
                        </div>
                        {/* کارت لیدربورد */}
                        <div
                            className="game-card main-card"
                            onClick={() => navigate("/worldcup/leaderboard")}>
                            <div className="card-header">
                                <h3>لیدربورد</h3>
                                <div className="header-line"></div>
                            </div>
                            <div className="card-content centered">
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div className="footer-banner">
                <p>
                    تمامی عواید این بازی صرف تأمین هزینه‌های درمان کودکان در
                    بیمارستان اطفال می‌شود
                </p>
            </div>

        </div>
    );
}