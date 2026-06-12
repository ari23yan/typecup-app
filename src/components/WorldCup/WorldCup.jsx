
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaArrowLeft, FaSpinner, FaTimes, FaTrophy, FaClock, FaTimesCircle, FaCheckCircle, FaFutbol } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./WorldCup.css";
import worldCupLogo from "../../assets/worldcup.png";
import walletIcon from "../../assets/whallet.png";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import jalaali from 'jalaali-js';
import { DateTime } from "luxon";

import { getUserWallet, getUserBets, getMatches, placeBet, getLiveMatches } from "../../api/worldcup";

export default function WorldCup() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [matches, setMatches] = useState([]);
    const [wallet, setWallet] = useState({
        balance: 0,
        pendingBetsCount: 0,
        totalPendingAmount: 0
    });

    // State for bet modal
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [showBetModal, setShowBetModal] = useState(false);
    const [selectedSelection, setSelectedSelection] = useState(null);
    const [betAmount, setBetAmount] = useState("");
    const [placingBet, setPlacingBet] = useState(false);


    // State for my bets
    const [myBets, setMyBets] = useState([]);
    const [loadingBets, setLoadingBets] = useState(false);

    // اضافه کنید به state های قبلی
    const [liveMatches, setLiveMatches] = useState([]);
    const [loadingLive, setLoadingLive] = useState(false);


    // تابع دریافت بازی‌های زنده
    const fetchLiveMatches = async () => {
        setLoadingLive(true);
        try {
            const result = await getLiveMatches();
            if (result.success) {
                setLiveMatches(result.data);
            }
        } catch (error) {
            console.error("Error fetching live matches:", error);
        } finally {
            setLoadingLive(false);
        }
    };

    // دریافت پیش‌بینی‌های من
    const fetchMyBets = async () => {
        setLoadingBets(true);
        try {
            const result = await getUserBets();
            if (result.success) {
                setMyBets(result.data.bets);
            } else {
                console.error("Error fetching bets:", result.message);
            }
        } catch (error) {
            console.error("Error fetching my bets:", error);
        } finally {
            setLoadingBets(false);
        }
    };

    // تابع برای نمایش وضعیت شرط به فارسی
    const getStatusText = (status) => {
        switch (status) {
            case 'PENDING':
                return { text: 'در انتظار', className: 'status-pending', icon: <FaClock /> };
            case 'WON':
                return { text: 'برنده', className: 'status-won', icon: <FaCheckCircle /> };
            case 'LOST':
                return { text: 'باخته', className: 'status-lost', icon: <FaTimesCircle /> };
            default:
                return { text: 'نامشخص', className: 'status-unknown', icon: null };
        }
    };

    function toPersianDate(utcDate) {
        const iranTime = DateTime
            .fromISO(utcDate, { zone: "utc" })
            .setZone("Asia/Tehran");

        const { jy, jm, jd } = jalaali.toJalaali(
            iranTime.year,
            iranTime.month,
            iranTime.day
        );

        return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")} ${iranTime.toFormat("HH:mm")}`;
    }

    // Usage example:
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
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        fetchMyBets();
        fetchWallet();
        fetchLiveMatches();
        const interval = setInterval(fetchLiveMatches, 30000);
        return () => clearInterval(interval);

    }, []);

    // دریافت لیست بازی ها
    useEffect(() => {
        const fetchWeekMatches = async () => {
            try {
                const result = await getMatches();
                if (result.success) {
                    setMatches(result.data);
                }
            } catch (error) {
                console.log(error);
                toast.error("خطا در دریافت لیست مسابقات");
            }
        };
        fetchWeekMatches();
    }, []);

    // Handle opening bet modal
    const handleOpenBetModal = (match, e) => {
        e.stopPropagation(); // Prevent navigating to match details
        setSelectedMatch(match);
        setSelectedSelection(null);
        setBetAmount("");
        setShowBetModal(true);
    };

    // Handle closing bet modal
    const handleCloseBetModal = () => {
        setShowBetModal(false);
        setSelectedMatch(null);
        setSelectedSelection(null);
        setBetAmount("");
    };

    // Handle selection of HOME/DRAW/AWAY
    const handleSelectSelection = (selection, odd) => {
        setSelectedSelection({
            type: selection,
            odd: odd,
            label: selection === 'HOME' ? selectedMatch.homeTeam.name_fa :
                selection === 'DRAW' ? 'مساوی' :
                    selectedMatch.awayTeam.name_fa
        });
    };

    // Handle amount change with validation
    const handleAmountChange = (e) => {
        const value = e.target.value;
        // Only allow numbers
        if (value === "" || /^\d+$/.test(value)) {
            setBetAmount(value);
        }
    };

    // Calculate possible win
    const calculatePossibleWin = () => {
        if (!betAmount || !selectedSelection) return 0;
        return parseInt(betAmount) * selectedSelection.odd;
    };

    // Handle submit bet
    const handleSubmitBet = async () => {
        // Validation
        if (!selectedSelection) {
            toast.error("لطفاً نتیجه مورد نظر خود را انتخاب کنید");
            return;
        }

        const amount = parseInt(betAmount);
        if (!amount || amount <= 0) {
            toast.error("لطفاً مبلغ معتبر وارد کنید");
            return;
        }

        if (amount > wallet.balance) {
            toast.error("موجودی کیف پول شما کافی نیست");
            return;
        }

        if (amount < 1000) {
            toast.error("حداقل مبلغ شرط ۱,۰۰۰ تومان است");
            return;
        }

        setPlacingBet(true);

        try {
            const result = await placeBet({
                matchId: selectedMatch.matchId,
                selection: selectedSelection.type,
                amount: amount
            });
            if (result.success) {
                toast.success("شرط شما با موفقیت ثبت شد!");

                fetchWallet();
                fetchMyBets();
                handleCloseBetModal();
            } else {
                toast.error(result.message || "خطا در ثبت شرط");
            }
        } catch (error) {
            console.error("Error placing bet:", error);
            toast.error("خطا در ارتباط با سرور");
        } finally {
            setPlacingBet(false);
        }
    };

    // Add quick amount buttons
    const quickAmounts = [10000, 20000, 50000, 100000];

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
    // From URL like "https://flagcdn.com/w80/ca.png" or "/flags/ca.png"
    const getCountryCode = (flagUrl) => {
        // Extract filename without extension
        const fileName = flagUrl.split('/').pop(); // gets "ca.png"
        const countryCode = fileName.split('.')[0]; // gets "ca"
        return countryCode.toLowerCase();
    };


    return (
        <div className="worldcup-page">
            <div className="worldcup-container">
                {/* Header */}
                <div className="worldcup-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
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
                                    {(wallet.balance)?.toLocaleString("fa-IR")}
                                </strong>
                                <span>تومان</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Menu Cards */}
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
                                        onClick={(e) => handleOpenBetModal(match, e)}
                                    >
                                        <div className="match-date">
                                            {toPersianDate(match.kickoffUtc)}
                                        </div>

                                        <div className="match-teams">
                                            <div className="team home-team">
                                                {/* <img
                                                    src={match.homeTeam.flag}
                                                    alt={match.homeTeam.name_fa}
                                                    className="team-flag"
                                                /> */}
                                                <span className={`fi fi-${getCountryCode(match.homeTeam.flag)}`}></span>


                                                <span className="team-name">{match.homeTeam.name_fa}</span>
                                            </div>

                                            <div className="match-vs">VS</div>

                                            <div className="team away-team">
                                                <span className={`fi fi-${getCountryCode(match.awayTeam.flag)}`}></span>
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
                                            <button
                                                className="predict-btn"
                                                onClick={(e) => handleOpenBetModal(match, e)}
                                            >
                                                پیش‌بینی
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="side-cards-container">
                        {/* My Predictions Card with direct list of bets */}
                        <div className="game-card main-card my-predictions-card">
                            <div className="card-header">
                                <h3>پیش‌بینی‌های من</h3>
                                <div className="header-line"></div>
                            </div>
                            <div className="card-content my-predictions-content">
                                {loadingBets ? (
                                    <div className="bets-loading">
                                        <FaSpinner className="spinning" />
                                        <span>در حال بارگذاری...</span>
                                    </div>
                                ) : myBets.length === 0 ? (
                                    <div className="no-bets">
                                        <p>هنوز پیش‌بینی ثبت نکرده‌اید</p>
                                    </div>
                                ) : (
                                    <div className="my-bets-list">
                                        {myBets.slice(0, 5).map((bet) => {
                                            const status = getStatusText(bet.status);
                                            return (
                                                <div key={bet.betId} className="my-bet-item">
                                                    <div className="bet-match-info">
                                                        <div className="bet-teams">
                                                            <span className="home-team-name">{bet.homeTeam?.name_fa}</span>
                                                            <span className="vs-icon">VS</span>
                                                            <span className="away-team-name">{bet.awayTeam?.name_fa}</span>
                                                        </div>
                                                        <div className="bet-selection">
                                                            انتخاب: <strong>{getSelectedTeamName(bet)}</strong>
                                                        </div>
                                                    </div>

                                                    <div className="bet-details-row">
                                                        <div className="bet-detail">
                                                            <span className="detail-label">تاریخ ثبت:</span>
                                                            <span className="detail-value">
                                                                {new Date(bet.createdAt).toLocaleDateString("fa-IR")}
                                                            </span>
                                                        </div>
                                                        <div className="bet-detail">
                                                            <span className="detail-label">مبلغ شرط:</span>
                                                            <span className="detail-value">
                                                                {bet.stake?.toLocaleString("fa-IR")} تومان
                                                            </span>
                                                        </div>
                                                        <div className="bet-detail">
                                                            <span className="detail-label">برد احتمالی:</span>
                                                            <span className="detail-value">
                                                                {bet.possibleWin?.toLocaleString("fa-IR")} تومان
                                                            </span>
                                                        </div>
                                                        <div className={`bet-status-badge ${status.className}`}>
                                                            {status.icon}
                                                            <span>{status.text}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {myBets.length > 5 && (
                                            <div className="more-bets-hint">
                                                {myBets.length - 5} پیش‌بینی دیگر...
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="game-card main-card live-matches-card">
                            <div className="card-header">
                                <h3>بازی‌های زنده</h3>
                                <div className="header-line"></div>
                            </div>
                            <div className="card-content live-matches-content">
                                {loadingLive ? (
                                    <div className="live-loading">
                                        <FaSpinner className="spinning" />
                                        <span>در حال بارگذاری...</span>
                                    </div>
                                ) : liveMatches.length === 0 ? (
                                    <div className="no-live-matches">
                                        <FaFutbol className="no-live-icon" />
                                        <p>هیچ بازی زنده‌ای وجود ندارد</p>
                                    </div>
                                ) : (
                                    <div className="live-matches-list">
                                        {liveMatches.map((match) => (
                                            <div
                                                key={match.matchId}
                                                className="live-match-item"
                                            >
                                                <div className="live-match-header">
                                                    <div className="live-indicator-small">
                                                        <div className="live-dot-small"></div>
                                                        <span>زنده</span>
                                                    </div>
                                                    <div className="match-time-small">
                                                        <span className="timer" >{match.matchTime}</span>
                                                        <FaClock className="icon" />
                                                        {/* <span>{match.persianDate?.replace(/-/g, "/")}</span> */}
                                                    </div>
                                                </div>

                                                <div className="live-score">
                                                    <div className="live-team">
                                                        <span className={`fi fi-${getCountryCode(match.homeTeam.flag)}`}></span>
                                                        <span className="live-team-name">{match.homeTeam.name_fa}</span>
                                                        <span className="live-team-score">
                                                            {match.homeScore !== undefined ? match.homeScore : "0"}
                                                        </span>
                                                    </div>
                                                    <div className="live-vs">VS</div>
                                                    <div className="live-team">
                                                        <span className="live-team-score">
                                                            {match.awayScore !== undefined ? match.awayScore : "0"}
                                                        </span>
                                                        <span className="live-team-name">{match.awayTeam.name_fa}</span>
                                                        <span className={`fi fi-${getCountryCode(match.awayTeam.flag)}`}></span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

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

            {/* Bet Modal */}
            {showBetModal && selectedMatch && (
                <div className="bet-modal-overlay" onClick={handleCloseBetModal}>
                    <div className="bet-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="bet-modal-header">
                            <h3>ثبت پیش‌بینی</h3>
                            <button className="close-modal-btn" onClick={handleCloseBetModal}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className="bet-modal-body">
                            {/* Match Info */}
                            <div className="modal-match-info">
                                <div className="modal-teams">
                                    <span>{selectedMatch.homeTeam.name_fa}</span>
                                    <span className="vs">VS</span>
                                    <span>{selectedMatch.awayTeam.name_fa}</span>
                                </div>
                                <div className="modal-date">
                                    {selectedMatch.persianDate?.replace(/-/g, "/")}
                                </div>
                            </div>

                            {/* Selection Buttons */}
                            <div className="modal-selections">
                                <h4>انتخاب نتیجه:</h4>
                                <div className="selection-buttons">
                                    <button
                                        className={`selection-btn ${selectedSelection?.type === 'HOME' ? 'active' : ''}`}
                                        onClick={() => handleSelectSelection('HOME', selectedMatch.odds.homeWin)}
                                    >
                                        <span className="selection-label">برد {selectedMatch.homeTeam.name_fa}</span>
                                        <span className="selection-odd">{selectedMatch.odds.homeWin.toFixed(2)}</span>
                                    </button>
                                    <button
                                        className={`selection-btn ${selectedSelection?.type === 'DRAW' ? 'active' : ''}`}
                                        onClick={() => handleSelectSelection('DRAW', selectedMatch.odds.draw)}
                                    >
                                        <span className="selection-label">مساوی</span>
                                        <span className="selection-odd">{selectedMatch.odds.draw.toFixed(2)}</span>
                                    </button>
                                    <button
                                        className={`selection-btn ${selectedSelection?.type === 'AWAY' ? 'active' : ''}`}
                                        onClick={() => handleSelectSelection('AWAY', selectedMatch.odds.awayWin)}
                                    >
                                        <span className="selection-label">برد {selectedMatch.awayTeam.name_fa}</span>
                                        <span className="selection-odd">{selectedMatch.odds.awayWin.toFixed(2)}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="modal-amount">
                                <h4>مبلغ شرط (تومان):</h4>
                                <input
                                    type="text"
                                    value={betAmount}
                                    onChange={handleAmountChange}
                                    placeholder="مبلغ را وارد کنید"
                                    className="amount-input"
                                />

                                <div className="quick-amounts">
                                    {quickAmounts.map((amount) => (
                                        <button
                                            key={amount}
                                            className="quick-amount-btn"
                                            onClick={() => setBetAmount(amount.toString())}
                                        >
                                            {amount.toLocaleString("fa-IR")}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Calculation Preview */}
                            {selectedSelection && betAmount && parseInt(betAmount) > 0 && (
                                <div className="modal-calculation">
                                    <div className="calc-row">
                                        <span>مبلغ شرط:</span>
                                        <span>{parseInt(betAmount).toLocaleString("fa-IR")} تومان</span>
                                    </div>
                                    <div className="calc-row">
                                        <span>ضریب:</span>
                                        <span>{selectedSelection.odd.toFixed(2)}</span>
                                    </div>
                                    <div className="calc-row total">
                                        <span>برد احتمالی:</span>
                                        <span>{calculatePossibleWin().toLocaleString("fa-IR")} تومان</span>
                                    </div>
                                </div>
                            )}

                            {/* Current Balance */}
                            <div className="modal-balance">
                                <span>موجودی کیف پول:</span>
                                <strong>{(wallet.balance).toLocaleString("fa-IR")} تومان</strong>
                            </div>

                            {/* Error if amount > balance */}
                            {betAmount && parseInt(betAmount) > wallet.balance && (
                                <div className="modal-error">
                                    موجودی کیف پول شما کافی نیست!
                                </div>
                            )}
                        </div>

                        <div className="bet-modal-footer">
                            <button className="cancel-bet-btn" onClick={handleCloseBetModal}>
                                انصراف
                            </button>
                            <button
                                className="submit-bet-btn"
                                onClick={handleSubmitBet}
                                disabled={!selectedSelection || !betAmount || parseInt(betAmount) > wallet.balance || placingBet}
                            >
                                {placingBet ? (
                                    <>
                                        <FaSpinner className="spinning" />
                                        در حال ثبت...
                                    </>
                                ) : (
                                    "ثبت شرط"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}