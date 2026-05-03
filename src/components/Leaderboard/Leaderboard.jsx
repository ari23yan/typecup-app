import { useEffect, useState } from "react";
import "./Leaderboard.css";
import { getLeaderboard } from "../../api/game";
import {
  FaTrophy,
  FaUser,
  FaChartLine,
  FaMedal,
  FaArrowLeft,
  FaGamepad,
  FaCheckCircle,
  FaStar,
  FaCalendarAlt,
  FaCrown
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getLeaderboard(50);
      if (response.success && response.data) {
        setLeaderboard(response.data);
      } else {
        toast.error(response.message);
        setError("خطا در دریافت اطلاعات");
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setError("مشکلی در ارتباط با سرور وجود دارد");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleBack = () => {
    navigate("/");
  };

  const getMedal = (index) => {
    switch (index) {
      case 0: return <FaMedal className="medal gold" />;
      case 1: return <FaMedal className="medal silver" />;
      case 2: return <FaMedal className="medal bronze" />;
      default: return <span className="rank-number">{index + 1}</span>;
    }
  };

  const formatDateTime = (dateString, isMobile = false) => {
    const date = new Date(dateString);
    const options = {
      year: 'numeric',
      month: isMobile ? 'short' : 'long',
      day: 'numeric',
      timeZone: 'Asia/Tehran'
    };
    if (!isMobile) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return new Intl.DateTimeFormat('fa-IR', options).format(date);
  };

  const isMobile = window.innerWidth <= 768;

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-card">
        <div className="leaderboard-header-actions">

          <button className="card-back-btn" onClick={handleBack}>
            <FaArrowLeft className="icon" />
            بازگشت
          </button>
          <button className="logout-btn" onClick={fetchLeaderboard}>
            <FaStar className="icon" />
            بروزرسانی
          </button>
        </div>

        <h2 className="leaderboard-title">
          <FaTrophy className="icon" />
          جدول رتبه‌بندی
        </h2>

        <div className="prize-banner">
          <div className="prize-icon">🏆</div>
          <div className="prize-text">
            <span>جایزه فصل</span>
            <strong>۱,۰۰۰,۰۰۰ تومان</strong>
            <span>به نفر اول هر فصل تعلق می‌گیرد!</span>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p>در حال بارگذاری...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button className="retry-btn" onClick={fetchLeaderboard}>
              تلاش مجدد
            </button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="empty-container">
            <FaGamepad className="empty-icon" />
            <p>هنوز هیچ نتیجه‌ای ثبت نشده است</p>
            <button className="start-game-btn" onClick={() => navigate("/game")}>
              شروع بازی
            </button>
          </div>
        ) : (
          <>
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-value">{leaderboard.length}</span>
                <span className="stat-label">بازیکن</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {Math.max(...leaderboard.map(u => u.score), 0)}
                </span>
                <span className="stat-label">بیشترین امتیاز</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {Math.max(...leaderboard.map(u => u.wpm), 0)}
                </span>
                <span className="stat-label">بیشترین WPM</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {Math.round(leaderboard.reduce((sum, u) => sum + (u.avgAccuracy || 0), 0) / leaderboard.length)}%
                </span>
                <span className="stat-label">میانگین دقت</span>
              </div>
            </div>

            {/* Header for the leaderboard list */}
            <div className="leaderboard-list-header">
              <div className="header-rank">رتبه</div>
              <div className="header-user">بازیکن</div>
              <div className="header-stats">
                <span className="stat-title">امتیاز</span>
                <span className="stat-title">WPM</span>
                <span className="stat-title">دقت</span>
                <span className="stat-title">مرحله</span>
                <span className="stat-title date-title">آخرین بازی</span>
              </div>
            </div>


            <div className="leaderboard-list">
              {leaderboard.map((player, index) => (
                <div key={player._id || index} className={`leaderboard-item ${index < 3 ? 'top-three' : ''}`}>
                  <div className="item-rank">
                    {getMedal(index)}
                  </div>
                  <div className="item-user">
                    <FaUser className="user-icon" />
                    <span>{player.user?.userName || 'کاربر ناشناس'}</span>
                  </div>
                  <div className="item-stats">
                    {/* Best Score */}
                    <div className="stat">
                      <FaCrown className="stat-icon score-icon" />
                      <span>{player.score}</span>
                    </div>
                    {/* Best WPM */}
                    <div className="stat">
                      <FaChartLine className="stat-icon" />
                      <span>{player.wpm}</span>
                      <small>WPM</small>
                    </div>
                    {/* Average Accuracy */}
                    <div className="stat">
                      <FaCheckCircle className="stat-icon" />
                      <span>{Math.round(player.avgAccuracy || 0)}%</span>
                    </div>
                    {/* Wave Reached */}
                    <div className="stat">
                      <FaGamepad className="stat-icon" />
                      <span>{player.waveReached}</span>
                    </div>
                    {/* Last Played */}
                    <div className="stat date-stat">
                      <FaCalendarAlt className="stat-icon" />
                      <span>{formatDateTime(player.lastPlayed, isMobile)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="leaderboard-footer" >
              <p>🏆 رتبه‌بندی بر اساس بهترین امتیاز (Score) هر بازیکن</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
