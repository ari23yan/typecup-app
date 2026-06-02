import { useEffect, useMemo, useState } from "react";
// import { getTypingStats } from "../../api/worldcup";
import toast from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./WorldCup.css";
import worldCupLogo from "../../assets/worldcup.png";
import walletIcon from "../../assets/whallet.png";

export default function WorldCup() {
    const navigate = useNavigate();
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
                                <strong>100,000</strong>
                                <span>ریال</span>
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
                        <h3>بـــازی هــــای امـــــروز</h3>
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