// WorldCup.jsx - نسخه کامل با مدال ثبت شرط

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaArrowLeft, FaSpinner, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./WorldCup.css";
import worldCupLogo from "../../assets/worldcup.png";
import walletIcon from "../../assets/whallet.png";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { getUserWallet, getMatches, placeBet } from "../../api/worldcup";

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

    // دریافت مقدار کیف پول
    useEffect(() => {


        fetchWallet();
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
            debugger
            if (result.success) {
                toast.success("شرط شما با موفقیت ثبت شد!");

                fetchWallet();

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
                                        onClick={() => navigate(`/worldcup/match/${match.matchId}`)}
                                    >
                                        <div className="match-date">
                                            <span className="persian-date">{match.persianDate?.replace(/-/g, "/")}</span>
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
                        <div
                            className="game-card main-card"
                            onClick={() => navigate("/worldcup/my-predictions")}
                        >
                            <div className="card-header">
                                <h3>پیش‌بینی‌های من</h3>
                                <div className="header-line"></div>
                            </div>
                            <div className="card-content centered"></div>
                        </div>

                        <div
                            className="game-card main-card"
                            onClick={() => navigate("/worldcup/leaderboard")}
                        >
                            <div className="card-header">
                                <h3>لیدربورد</h3>
                                <div className="header-line"></div>
                            </div>
                            <div className="card-content centered"></div>
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