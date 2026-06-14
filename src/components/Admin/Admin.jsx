import { useEffect, useState } from "react";
import {
    chargeWallet,
    getAllUsers,
    getAllBets,
    getStats,
    getMatchesWithOdds,
    updateOdd,
} from "../../api/admin";

import toast from "react-hot-toast";
import { FaArrowLeft, FaEdit, FaSave, FaTimes, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import "./Admin.css";

export default function Admin() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [bets, setBets] = useState([]);
    const [stats, setStats] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [selectedUser, setSelectedUser] = useState("");
    const [amount, setAmount] = useState("");

    // Stateهای مربوط به ضریب بازی‌ها
    const [matches, setMatches] = useState([]);
    const [editingOdd, setEditingOdd] = useState(null);
    const [editFormData, setEditFormData] = useState({
        homeWin: "",
        draw: "",
        awayWin: ""
    });
    const [bulkEditMode, setBulkEditMode] = useState(false);
    const [selectedMatches, setSelectedMatches] = useState([]);
    const [bulkOdds, setBulkOdds] = useState({
        homeWin: "",
        draw: "",
        awayWin: ""
    });

    const loadData = async () => {
        try {
            const [usersRes, betsRes, statsRes, matchesRes] = await Promise.all([
                getAllUsers(),
                getAllBets(),
                getStats(),
                getMatchesWithOdds(),
            ]);

            setUsers(usersRes?.data || []);
            setBets(betsRes?.data || []);
            setStats(statsRes?.data || null);
            setMatches(matchesRes?.data || []);
        } catch (err) {
            console.error('Error loading data:', err);
            toast.error("خطا در دریافت اطلاعات");
        }
    };


    useEffect(() => {
        loadData();
    }, []);

    const handleChargeWallet = async () => {
        if (!selectedUser || !amount) {
            return toast.error("کاربر و مبلغ را وارد کنید");
        }

        try {
            const res = await chargeWallet({
                userId: selectedUser,
                amount: Number(amount),
            });

            toast.success(res.message || "کیف پول شارژ شد");

            setAmount("");
            loadData();
        } catch (err) {
            toast.error(err?.message || "خطا در شارژ کیف پول");
        }
    };

    // شروع ویرایش ضریب
    const handleEditOdd = (match) => {
        setEditingOdd(match.matchId);
        setEditFormData({
            homeWin: match.odds?.homeWin || "",
            draw: match.odds?.draw || "",
            awayWin: match.odds?.awayWin || ""
        });
    };

    // لغو ویرایش
    const handleCancelEdit = () => {
        setEditingOdd(null);
        setEditFormData({ homeWin: "", draw: "", awayWin: "" });
    };

    // ذخیره ضریب تکی
    const handleSaveOdd = async (matchId) => {
        if (!editFormData.homeWin || !editFormData.draw || !editFormData.awayWin) {
            toast.error("لطفاً تمام ضرایب را وارد کنید");
            return;
        }

        try {
            const result = await updateOdd({
                matchId: matchId,
                homeWin: parseFloat(editFormData.homeWin),
                draw: parseFloat(editFormData.draw),
                awayWin: parseFloat(editFormData.awayWin)
            });

            if (result.success) {
                toast.success("ضریب با موفقیت به‌روزرسانی شد");
                handleCancelEdit();
                loadData(); // reload data
            } else {
                toast.error(result.message || "خطا در به‌روزرسانی ضریب");
            }
        } catch (error) {
            toast.error(error?.message || "خطا در به‌روزرسانی ضریب");
        }
    };
    // انتخاب/لغو انتخاب مسابقه برای ویرایش گروهی
    const toggleMatchSelection = (matchId) => {
        setSelectedMatches(prev => {
            if (prev.includes(matchId)) {
                return prev.filter(id => id !== matchId);
            } else {
                return [...prev, matchId];
            }
        });
    };

    // انتخاب همه مسابقات
    const selectAllMatches = () => {
        if (selectedMatches.length === matches.length) {
            setSelectedMatches([]);
        } else {
            setSelectedMatches(matches.map(m => m._id));
        }
    };


    // فیلتر کردن شرط‌ها
    const filteredBets = bets.filter(bet => {
        const matchesSearch = searchTerm === "" ||
            bet.user?.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bet.selectedTeamNameFa?.includes(searchTerm) ||
            bet.selectedTeamName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "ALL" || bet.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // محاسبه آمار شرط‌ها
    const totalBetsAmount = filteredBets.reduce((sum, bet) => sum + (bet.amount || 0), 0);
    const totalWonAmount = filteredBets
        .filter(bet => bet.status === "WON")
        .reduce((sum, bet) => sum + (bet.winAmount || 0), 0);

    return (
        <div className="admin-page">
            <div className="admin-header">
                <button onClick={() => navigate(-1)} className="back-button">
                    <FaArrowLeft />
                </button>
                <h2>پنل مدیریت</h2>
            </div>

            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <h4>کاربران</h4>
                        <span>{stats.totalUsers ?? 0}</span>
                    </div>

                    <div className="stat-card">
                        <h4>موجودی کل</h4>
                        <span>{stats.totalWalletBalance?.toLocaleString() ?? 0} تومان</span>
                    </div>

                    <div className="stat-card">
                        <h4>تعداد شرط ها</h4>
                        <span>{stats.totalBets ?? 0}</span>
                    </div>

                    <div className="stat-card">
                        <h4>مبلغ شرط ها</h4>
                        <span>{stats.totalBetAmount?.toLocaleString() ?? 0} تومان</span>
                    </div>

                    <div className="stat-card">
                        <h4>پرداخت شده</h4>
                        <span>{stats.totalPaidOut?.toLocaleString() ?? 0} تومان</span>
                    </div>

                    <div className="stat-card">
                        <h4>در انتظار</h4>
                        <span>{stats.pendingBets ?? 0}</span>
                    </div>
                </div>
            )}

            {/* بخش جدید: مدیریت ضریب بازی‌ها */}
            <div className="odds-management-section">
                <div className="section-header">
                    <h3>مدیریت ضریب بازی‌ها</h3>
                </div>
                <div className="odds-table-wrapper" style={{ height: '500px', overflowY: 'auto' }}>
                    <div className="odds-table-container">
                        <table className="odds-table">
                            <thead>
                                <tr>
                                    <th>تاریخ مسابقه</th>
                                    <th>تیم میزبان</th>
                                    <th>تیم مهمان</th>
                                    <th>برد میزبان</th>
                                    <th>مساوی</th>
                                    <th>برد مهمان</th>
                                    <th>عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matches.map((match) => {
                                    const matchId = match.matchId;
                                    const homeTeamName = match.homeTeam?.name_fa || match.homeTeamNameFa || match.homeTeamName || '-';
                                    const homeTeamFlag = match.homeTeam?.flag || match.homeTeamFlag;
                                    const awayTeamName = match.awayTeam?.name_fa || match.awayTeamNameFa || match.awayTeamName || '-';
                                    const awayTeamFlag = match.awayTeam?.flag || match.awayTeamFlag;
                                    const isFinished = match.status === 'finished' || match.finished;

                                    return (
                                        <tr key={matchId} className={isFinished ? 'finished-match' : ''}>
                                            <td className="match-date-cell">
                                                <span className="match-date">{match.persianDate}</span>
                                                {isFinished && <span className="finished-badge">اتمام شده</span>}
                                            </td>
                                            <td className="team-cell">
                                                <div className="team-info">
                                                    {homeTeamFlag && <img src={homeTeamFlag} alt={homeTeamName} className="team-flag" />}
                                                    <span className="team-name">{homeTeamName}</span>
                                                </div>
                                            </td>
                                            <td className="team-cell">
                                                <div className="team-info">
                                                    {awayTeamFlag && <img src={awayTeamFlag} alt={awayTeamName} className="team-flag" />}
                                                    <span className="team-name">{awayTeamName}</span>
                                                </div>
                                            </td>
                                            {editingOdd === matchId ? (
                                                <>
                                                    <td className="odd-edit-cell">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={editFormData.homeWin}
                                                            onChange={(e) => setEditFormData({ ...editFormData, homeWin: e.target.value })}
                                                            className="odd-input"
                                                            placeholder="میزبان"
                                                        />
                                                    </td>
                                                    <td className="odd-edit-cell">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={editFormData.draw}
                                                            onChange={(e) => setEditFormData({ ...editFormData, draw: e.target.value })}
                                                            className="odd-input"
                                                            placeholder="مساوی"
                                                        />
                                                    </td>
                                                    <td className="odd-edit-cell">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={editFormData.awayWin}
                                                            onChange={(e) => setEditFormData({ ...editFormData, awayWin: e.target.value })}
                                                            className="odd-input"
                                                            placeholder="مهمان"
                                                        />
                                                    </td>
                                                    <td className="action-buttons">
                                                        <button onClick={() => handleSaveOdd(matchId)} className="save-button" title="ذخیره">
                                                            <FaSave />
                                                        </button>
                                                        <button onClick={handleCancelEdit} className="cancel-button" title="انصراف">
                                                            <FaTimes />
                                                        </button>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="odd-value home-odd">{match.odds?.homeWin || "-"}</td>
                                                    <td className="odd-value draw-odd">{match.odds?.draw || "-"}</td>
                                                    <td className="odd-value away-odd">{match.odds?.awayWin || "-"}</td>
                                                    <td className="action-buttons">
                                                        <button onClick={() => handleEditOdd(match)} className="edit-button" title="ویرایش ضریب">
                                                            <FaEdit />
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div className="wallet-section">
                <h3>شارژ کیف پول</h3>

                <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                >
                    <option value="">انتخاب کاربر</option>
                    {users.map((user) => (
                        <option key={user._id} value={user._id}>
                            {user.userName} ({typeof user.wallet === 'object' ? user.wallet.balance : user.wallet || 0} تومان)
                        </option>
                    ))}
                </select>

                <input
                    type="number"
                    placeholder="مبلغ"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />

                <button onClick={handleChargeWallet} className="charge-button">
                    شارژ کیف پول
                </button>
            </div>

            <div className="users-section">
                <h3>لیست کاربران</h3>
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>نام کاربری</th>
                                <th>نام</th>
                                <th>ایمیل</th>
                                <th>موجودی</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id}>
                                    <td>{user.userName}</td>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{typeof user.wallet === 'object' ? user.wallet.balance : user.wallet || 0} تومان</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bets-section">
                <h3>شرط های ثبت شده</h3>

                <div className="filters">
                    <input
                        type="text"
                        placeholder="جستجو بر اساس کاربر یا تیم..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="status-filter"
                    >
                        <option value="ALL">همه وضعیت‌ها</option>
                        <option value="PENDING">در انتظار</option>
                        <option value="WON">برنده</option>
                        <option value="LOST">باخته</option>
                    </select>
                </div>

                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>کاربر</th>
                                <th>مسابقه</th>
                                <th>تیم انتخاب شده</th>
                                <th>نوع شرط</th>
                                <th>ضریب</th>
                                <th>مبلغ شرط</th>
                                <th>مبلغ برد</th>
                                <th>وضعیت</th>
                                <th>تاریخ ثبت</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBets.map((bet, index) => (
                                <tr key={bet._id || index} className={`bet-row ${bet.status?.toLowerCase()}`}>
                                    <td>
                                        <div className="user-info">
                                            <strong>{bet.user?.userName || "-"}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        {bet.matchInfo && (
                                            <div className="match-info">
                                                <span className="teams">
                                                    {bet.matchInfo.homeTeamName || bet.matchInfo.homeTeamName} vs {bet.matchInfo.awayTeamName || bet.matchInfo.awayTeamName}
                                                </span>
                                                {bet.matchInfo.finished && (
                                                    <span className="result">
                                                        نتیجه: {bet.matchInfo.homeScore || 0} - {bet.matchInfo.awayScore || 0}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span className="selected-team">
                                            {bet.selectedTeamNameFa || bet.selectedTeamName}
                                        </span>
                                    </td>
                                    <td>{bet.selectionText}</td>
                                    <td>{bet.odd}</td>
                                    <td>{bet.amount?.toLocaleString()} تومان</td>
                                    <td className={bet.winAmount > 0 ? 'win-amount' : ''}>
                                        {bet.winAmount?.toLocaleString() || 0} تومان
                                    </td>
                                    <td>
                                        <span className={`status-badge ${bet.status?.toLowerCase()}`}>
                                            {bet.statusText}
                                        </span>
                                    </td>
                                    <td>{bet.createdAtFormatted}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredBets.length === 0 && (
                        <div className="no-data">
                            هیچ شرطی یافت نشد
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}