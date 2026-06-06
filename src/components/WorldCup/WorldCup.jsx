import { useEffect, useMemo, useState } from "react";
// import { getTypingStats } from "../../api/worldcup";
import toast from "react-hot-toast";
import { FaArrowLeft, FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./WorldCup.css";
import worldCupLogo from "../../assets/worldcup.png";
import walletIcon from "../../assets/whallet.png";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import { getUserWallet } from "../../api/worldcup";

export default function WorldCup() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
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

                {/* Menu Cards */}
                <div className="worldcup-menu">
                    <div className="menu-card">
                        <h3>LeaderBoard</h3>
                    </div>

                    <div className="menu-card">
                        <h3>بـــازی هــــای هفته</h3>

                        <button
                            className="view-all-btn"
                            onClick={() => navigate("/worldcup/matches")}
                        >
                            مشاهده همه بازی‌ها
                        </button>
                    </div>

                    <div className="menu-card">
                        <h3>پـیـــش بینـــی هـــای مـــن</h3>
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