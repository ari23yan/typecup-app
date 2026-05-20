import { useEffect, useState } from "react";
import "./Leaderboard.css";
import { getLeaderboard, getLeaderboardSeasons } from "../../api/game";
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
  const [seasonLabel, setSeasonLabel] = useState("");
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSeasonLoading, setIsSeasonLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSeasons = async () => {
    setIsSeasonLoading(true);
    try {
      const response = await getLeaderboardSeasons();
      if (response.success && response.data) {
        const seasonList = response.data || [];
        setSeasons(seasonList);

        const currentSeason =
          seasonList.find((s) => s.isCurrent) || seasonList[0];

        if (currentSeason) {
          setSelectedSeason(
            `${currentSeason.year}-${currentSeason.seasonNumber}`
          );
        }
      } else {
        toast.error(response.message);
      }
    } catch (err) {
      toast.error("دریافت لیست فصل‌ها ناموفق بود");
    } finally {
      setIsSeasonLoading(false);
    }
  };

  const fetchLeaderboard = async (seasonValue) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = { limit: 50 };

      if (seasonValue) {
        const [year, seasonNumber] = seasonValue.split("-");
        params.year = Number(year);
        params.seasonNumber = Number(seasonNumber);
      }

      const response = await getLeaderboard(params);

      if (response.success && response.data) {
        setLeaderboard(response.data.items || []);
        setSeasonLabel(response.data.season?.label || "");
      } else {
        toast.error(response.message);
      }
    } catch (err) {
      toast.error("مشکلی در ارتباط با سرور وجود دارد");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasons();
  }, []);

  useEffect(() => {
    if (selectedSeason) {
      fetchLeaderboard(selectedSeason);
    }
  }, [selectedSeason]);

  const isMobile = window.innerWidth <= 768;

  const formatDateTime = (dateString, mobile = false) => {
    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: mobile ? "short" : "long",
      day: "numeric",
      timeZone: "Asia/Tehran"
    };

    if (!mobile) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }

    return new Intl.DateTimeFormat("fa-IR", options).format(date);
  };

  const getMedal = (index) => {
    if (index === 0) return <FaMedal className="medal gold" />;
    if (index === 1) return <FaMedal className="medal silver" />;
    if (index === 2) return <FaMedal className="medal bronze" />;
    return <span className="rank-number">{index + 1}</span>;
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-card">
        {/* دکمه‌های بالا */}
        <div className="leaderboard-header-actions">
          <button className="card-back-btn" onClick={() => navigate("/")}>
            <FaArrowLeft />
            بازگشت
          </button>

          <button
            className="logout-btn"
            onClick={() => fetchLeaderboard(selectedSeason)}
          >
            <FaStar />
            بروزرسانی
          </button>
        </div>

        {/* عنوان + فیلتر فصل */}
        <div className="leaderboard-header-top">


          <div className="leaderboard-season-filter">
            <div className="season-filter-header">
              <span className="season-filter-title">
                انتخاب فصل
              </span>

              {seasonLabel && (
                <span className="leaderboard-season-badge">
                  فصل جاری: <strong>{seasonLabel}</strong>
                </span>
              )}
            </div>

            <div className="season-select-row">
              <FaCalendarAlt className="season-select-icon" />
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                disabled={isSeasonLoading}
              >
                {isSeasonLoading ? (
                  <option>در حال بارگذاری...</option>
                ) : seasons.length === 0 ? (
                  <option>فصلی وجود ندارد</option>
                ) : (
                  seasons.map((season) => (
                    <option
                      key={`${season.year}-${season.seasonNumber}`}
                      value={`${season.year}-${season.seasonNumber}`}
                    >
                      {season.label}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* بنر جایزه */}
        <div className="prize-banner">
          <div className="prize-icon">🏆</div>
          <div className="prize-text">
            <span>جایزه فصل</span>
            <strong>۱,۰۰۰,۰۰۰ تومان</strong>
            <span>به نفر اول هر فصل تعلق می‌گیرد</span>
          </div>
        </div>

        {isLoading || isSeasonLoading ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p>در حال بارگذاری...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button className="retry-btn" onClick={() => fetchLeaderboard(selectedSeason)}>
              تلاش مجدد
            </button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="empty-container">
            <FaGamepad className="empty-icon" />
            <p>هنوز هیچ نتیجه‌ای برای این فصل ثبت نشده است</p>
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
                  {Math.max(...leaderboard.map((u) => u.score), 0)}
                </span>
                <span className="stat-label">بیشترین امتیاز</span>
              </div>

              <div className="stat-item">
                <span className="stat-value">
                  {Math.max(...leaderboard.map((u) => u.wpm), 0)}
                </span>
                <span className="stat-label">بیشترین WPM</span>
              </div>

              <div className="stat-item">
                <span className="stat-value">
                  {Math.round(
                    leaderboard.reduce((sum, u) => sum + (u.avgAccuracy || 0), 0) / leaderboard.length
                  )}%
                </span>
                <span className="stat-label">میانگین دقت</span>
              </div>
            </div>

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
                <div
                  key={player.userId || index}
                  className={`leaderboard-item ${index < 3 ? "top-three" : ""}`}
                >
                  <div className="item-rank">{getMedal(index)}</div>

                  <div className="item-user">
                    <FaUser className="user-icon" />
                    <span>{player.user?.userName || "کاربر ناشناس"}</span>
                  </div>

                  <div className="item-stats">
                    <div className="stat">
                      <FaCrown className="stat-icon score-icon" />
                      <span>{player.score}</span>
                    </div>

                    <div className="stat">
                      <FaChartLine className="stat-icon" />
                      <span>{player.wpm}</span>
                      <small>WPM</small>
                    </div>

                    <div className="stat">
                      <FaCheckCircle className="stat-icon" />
                      <span>{Math.round(player.avgAccuracy || 0)}%</span>
                    </div>

                    <div className="stat">
                      <FaGamepad className="stat-icon" />
                      <span>{player.waveReached}</span>
                    </div>

                    <div className="stat date-stat">
                      <FaCalendarAlt className="stat-icon" />
                      <span>{formatDateTime(player.lastPlayed, isMobile)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="leaderboard-footer">
              <p>🏆 رتبه‌بندی بر اساس بهترین امتیاز (Score) هر بازیکن</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

