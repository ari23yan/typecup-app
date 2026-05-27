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
          درباره
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
            {/* بخش عنوان */}
            <header>
              <h2 className="modal-title">درباره ما</h2>
            </header>
            {/* بخش توضیحات اصلی */}
            <main className="modal-body">
              <p className="modal-text">
                TypeCup یک بازی تایپ رقابتی و متن‌باز است که برای بهبود سرعت تایپ، دقت و تمرکز طراحی شده.
                این بازی محیطی سرگرم‌کننده و چالش‌برانگیز فراهم می‌کند تا مهارت تایپ خود را به راحتی افزایش دهید.
              </p>
            </main>
            <footer className="modal-footer">
              <div className="modal-repo" dir="ltr">
                <span className="title-repo">Repository:</span>
                <a
                  href="https://github.com/ari23yan/typecup-app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="repo-link"
                  title="مشاهده سورس‌کد در گیت‌هاب"
                >
                  https://github.com/ari23yan/typecup-app
                </a>
              </div>

              <hr className="profile-divider" />


              <p className="modal-dev">
                Developed With <span role="img" aria-label="love">❤</span> In Tehran By{' '}
                <a
                  href="http://ari23yan.github.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', color: '#ffd700' }}
                >
                  TwentyThree
                </a>
              </p>
            </footer>
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