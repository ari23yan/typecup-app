import { useEffect, useState } from "react";
import {
    chargeWallet,
    getAllUsers,
    getAllBets,
    getStats,
} from "../../api/admin";

import toast from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
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

    const loadData = async () => {
        try {
            const [usersRes, betsRes, statsRes] = await Promise.all([
                getAllUsers(),
                getAllBets(),
                getStats(),
            ]);


            setUsers(usersRes?.data || []);
            setBets(betsRes?.data || []);
            setStats(statsRes?.data || null);
        } catch (err) {
            console.error('Error loading data:', err);
            toast.error("خطا در دریافت اطلاعات");
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleChargeWallet = async () => {
        debugger
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
                
                {/* فیلترها */}
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