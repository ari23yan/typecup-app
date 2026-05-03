import { FaTrophy } from "react-icons/fa";
import { useState } from "react";
import { Link } from "react-router-dom";
import AuthModal from "../Auth/Auth";
import "./MainForm.css";
import "@fontsource/orbitron/700.css";

export default function MainForm() {
  const [showAbout, setShowAbout] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));

  const [authState, setAuthState] = useState({
    step: "phone",
    phone: "",
    password: "",
    otpType: null,
    otp: ["", "", "", ""],
    name: "",
    email: "",
    userName: "",
    timeLeft: 0,
    canResend: false,
    showPassword: false,
    showRegisterPassword: false,
    showResetPassword: false
  });

  return (
    <div className="main-container">
      <div className="menu-box">
        <h1 className="title">
          Type
          <FaTrophy className="cup-icon" />
          Cup
        </h1>

        {isAuthenticated ? (
          <Link to="/game" className="menu-btn" style={{ textDecoration: 'none' }}>
            شروع بازی
          </Link>
        ) : (
          <></>
        )}

        <Link to="/demo" className="menu-btn" style={{ textDecoration: 'none' }}>
          دمو
        </Link>

        <Link to="/leaderboard" className="menu-btn" style={{ textDecoration: 'none' }}>
          نتایج لیگ تایپ‌کاپ
        </Link>

        {!isAuthenticated ? (
          <button className="menu-btn" onClick={() => setShowAuth(true)}>
            ورود / ثبت نام
          </button>
        ) : (
          <Link to="/profile" className="menu-btn" style={{ textDecoration: 'none' }}>
            پروفایل
          </Link>
        )}

        <a className="menu-btn" onClick={() => setShowAbout(true)}>
          درباره ما
        </a>

        <a
          className="menu-btn"
          onClick={() => window.open('https://reymit.ir/ari23yan')}
        >
          حمایت مالی
        </a>
      </div>

      {showAbout && (
        <div dir="rtl" className="modal-overlay" onClick={() => setShowAbout(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">درباره ما</h2>
            <p className="modal-text">
              TypeCup یک بازی تایپ رقابتی است که برای تمرین سرعت تایپ و سرگرمی ساخته شده.
            </p>
            <p className="modal-dev">
              Developed With ❤ In Tehran By Ariyan Rahmani
            </p>
            <button className="close-btn" onClick={() => setShowAbout(false)}>
              بستن
            </button>
          </div>
        </div>
      )}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccessAuthenticate={() => {
            setIsAuthenticated(true);
            setShowAuth(false);
          }}
          savedState={authState}
          onSaveState={setAuthState}
        />
      )}
    </div>
  );
}