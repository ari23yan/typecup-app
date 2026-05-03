import "./Profile.css";
import { FaTrophy, FaArrowLeft, FaEye, FaEyeSlash, FaSyncAlt } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { FaKey } from "react-icons/fa";
import { getProfile, updateProfile } from "../../api/profile";
import { logout, verifyOtp, sendPasswordResetOtp, passwordReset } from "../../api/auth";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../Auth/Auth.css";
import OtpInput from "../Otp/OtpInput";

import {
    loadCaptchaEnginge,
    LoadCanvasTemplate,
    validateCaptcha,
} from "react-simple-captcha";

const toPersianNumbers = (str) => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.replace(/[0-9]/g, (x) => persianDigits[parseInt(x)]);
};



export default function Profile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [scores, setScores] = useState([]);
    const [step, setStep] = useState("");
    const [phone, setPhone] = useState("");
    const [otpCode, setOtpCode] = useState(["", "", "", ""]);
    const [password, setPassword] = useState("");
    const [timeLeft, setTimeLeft] = useState(0);
    const [canResend, setCanResend] = useState(true);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [captchaValue, setCaptchaValue] = useState("");
    const resetPasswordRef = useRef(null);

    const [editData, setEditData] = useState({
        name: "",
        userName: "",
        phone: "",
        email: "",
    });

    const handleCloseModal = () => {
        setStep("");
        setOtpCode(["", "", "", ""]);
        setPassword("");
        setCaptchaValue("");
        setTimeLeft(0);
        setCanResend(true);
    };

    const handleResetCaptcha = () => {
        loadCaptchaEnginge(5, 'white', 'black', 'numbers');
        setCaptchaValue("");
        toast.success("کپچا بازنشانی شد");
    };

    useEffect(() => {
        if (step === "captcha") {
        loadCaptchaEnginge(5, 'white', 'black', 'numbers');
            setCaptchaValue("");
        }
    }, [step]);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const result = await getProfile();
                if (result.success) {
                    setUser(result.data.user);
                    setEditData(result.data.user);
                    setPhone(result.data.user.phone);
                    setScores(result.data.lastScores || []);
                } else {
                    toast.error(result.message);
                }
            } catch (err) {
                console.error("خطا در دریافت پروفایل:", err);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [timeLeft]);

    const handleSave = async () => {
        try {
            validate(editData);
            const result = await updateProfile(editData);
            if (result.success) {
                setUser(editData);
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = async () => {
        const result = await logout();
        if (result.success) {
            toast.success(result.message);
            navigate("/");
        } else {
            toast.error(result.message);
        }
    };

    const handleBack = () => {
        navigate("/");
    };

    function validate(editData) {
        if (
            !editData.name.trim() ||
            !editData.userName.trim() ||
            !editData.phone.trim() ||
            !editData.email.trim()
        ) {
            toast.error("لطفاً همه فیلدها را پر کنید");
            throw new Error("Validation failed");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editData.email)) {
            toast.error("ایمیل وارد شده معتبر نیست");
            throw new Error("Invalid email");
        }

        const usernameRegex = /^[A-Za-z0-9_]+$/;
        if (!usernameRegex.test(editData.userName)) {
            toast.error("نام کاربری باید فقط شامل حروف انگلیسی، اعداد یا _ باشد");
            throw new Error("Invalid username");
        }

        const isChanged =
            editData.name !== user.name ||
            editData.userName !== user.userName ||
            editData.email !== user.email;

        if (!isChanged) {
            toast.error("هیچ تغییری در اطلاعات ایجاد نشده است");
            throw new Error("No changes");
        }

        return true;
    }

    const handleSendOtp = async () => {
        if (!validateCaptcha(captchaValue)) {
            toast.error("کد کپچا اشتباه است");
            return;
        }

        if (!canResend && timeLeft > 0) {
            toast.error(`لطفاً ${toPersianNumbers(timeLeft.toString())} ثانیه صبر کنید`);
            return;
        }

        const data = await sendPasswordResetOtp(phone);

        if (data.success) {
            toast.success(data.message);
            setTimeLeft(60);
            setCanResend(false);
            setOtpCode(["", "", "", ""]);
            setStep("otp");
            setCaptchaValue("");
        } else {
            toast.error(data.message);
        }
    };

    const handleVerifyOtp = async () => {
        const code = otpCode.join("");

        if (code.length !== 4) {
            toast.error("لطفاً کد 4 رقمی را وارد کنید");
            return;
        }

        try {
            const data = await verifyOtp(phone, code);

            if (data.success) {
                toast.success(data.message);
                setStep("resetPassword");
                setPassword("");
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error("خطا در تایید کد");
        }
    };

    const handleResetPassword = async () => {
        if (!validatePassword(password)) {
            toast.error("رمز عبور باید حداقل 8 کاراکتر باشد");
            return;
        }

        try {
            const data = await passwordReset(phone, password);

            if (data.success) {
                toast.success("رمز عبور با موفقیت تغییر کرد");
                resetPasswordFlow();
                handleResetPassword();
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error("خطا در تغییر رمز عبور");
        }
    };

    const handleKeyPress = (e, callback) => {
        if (e.key === "Enter") {
            callback();
        }
    };

    function validatePassword(password) {
        return password.length >= 8;
    }

    const resetPasswordFlow = () => {
        setStep("idle");
        setOtpCode(["", "", "", ""]);
        setPassword("");
        setTimeLeft(0);
        setCanResend(true);
    };

    if (loading) return (
        <div className="loading-container">
            <div className="loader"></div>
            <p className="loading-message">در حال بارگذاری...</p>
        </div>
    );

    return (
        <>
            <div>
                {step === "captcha" && (
                    <>
                        <div dir="rtl" className="modal-overlay" onClick={handleCloseModal}>
                            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-content">
                                    <button className="modal-close" onClick={handleCloseModal}>
                                        ✕
                                    </button>
                                    <h2 className="modal-title">تایید کپچا</h2>

                                    <div className="modal-form">
                                        <div className="captcha-box" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <LoadCanvasTemplate />
                                            <button
                                                type="button"
                                                className="captcha-reset-btn"
                                                onClick={handleResetCaptcha}
                                                title="بازنشانی کپچا"
                                            >
                                                <FaSyncAlt />
                                            </button>
                                        </div>


                                        <input
                                            className="modal-input"
                                            placeholder="کد کپچا را وارد کنید"
                                            value={captchaValue}
                                            onChange={(e) => setCaptchaValue(e.target.value)}
                                            onKeyDown={(e) => handleKeyPress(e, handleSendOtp)}
                                        />

                                        <button className="modal-btn" onClick={handleSendOtp}>
                                            ارسال کد تایید
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {step === "idle" && (
                    <>
                        <div dir="rtl" className="modal-overlay" onClick={handleCloseModal}>
                            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-content">
                                    <button className="modal-close" onClick={handleCloseModal}>
                                        ✕
                                    </button>
                                    <h2 className="modal-title">ورود / ثبت نام</h2>

                                    <div className="modal-form">
                                        <input
                                            className="modal-input"
                                            placeholder="شماره موبایل"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleSendOtp();
                                            }}
                                        />

                                        <button className="modal-btn" onClick={handleSendOtp}>
                                            ادامه
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {step === "resetPassword" && (
                    <>
                        <div dir="rtl" className="modal-overlay" onClick={handleCloseModal}>
                            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-content">
                                    <button className="modal-close" onClick={handleCloseModal}>
                                        ✕
                                    </button>
                                    <h2 className="modal-title">تغییر رمز عبور</h2>
                                    <div className="modal-form">
                                        <div className="password-wrapper">
                                            <input
                                                ref={resetPasswordRef}
                                                className="modal-input password-input"
                                                placeholder="رمز عبور جدید"
                                                type={showResetPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                onKeyPress={(e) => handleKeyPress(e, handleResetPassword)}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowResetPassword(!showResetPassword)}
                                            >
                                                {showResetPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                        <button className="modal-btn" onClick={handleResetPassword}>
                                            تغییر رمز عبور
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {step === "otp" && (
                    <>
                        <div dir="rtl" className="modal-overlay" onClick={handleCloseModal}>
                            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-content">
                                    <button className="modal-close" onClick={handleCloseModal}>
                                        ✕
                                    </button>
                                    <h2 className="modal-title">تایید شماره</h2>

                                    <div className="modal-form">
                                        <p className="otp-text">
                                            کد تایید به شماره {toPersianNumbers(phone)} ارسال شد
                                        </p>

                                        <OtpInput
                                            onComplete={(code) => setOtpCode(code.split(""))}
                                            onSubmit={handleVerifyOtp}
                                        />

                                        <button className="modal-btn" onClick={handleVerifyOtp}>
                                            تایید کد
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="profile-page" dir="rtl">
                <div className="profile-card">
                    <div className="profile-header-actions">
                        <button className="logout-btn" onClick={handleLogout}>
                            <FiLogOut />
                            خروج از حساب
                        </button>

                        <button className="card-back-btn" onClick={handleBack}>
                            <FaArrowLeft className="icon" />
                            بازگشت
                        </button>
                    </div>

                    <h2 className="profile-title">پروفایل کاربر</h2>

                    <form className="profile-form">
                        <label className="form-label">نام</label>
                        <input
                            className="form-input"
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        />

                        <label className="form-label">نام کاربری</label>
                        <input
                            dir="ltr"
                            className="form-input"
                            value={editData.userName}
                            onChange={(e) => setEditData({ ...editData, userName: e.target.value })}
                        />

                        <label className="form-label">شماره تلفن</label>
                        <input
                            dir="ltr"
                            className="form-input"
                            disabled
                            value={editData.phone}
                        />

                        <label className="form-label">ایمیل</label>
                        <input
                            dir="ltr"
                            className="form-input"
                            value={editData.email}
                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        />
                    </form>

                    <button className="save-btn" onClick={handleSave}>
                        بروزرسانی پروفایل
                    </button>

                    <a
                        href="#"
                        className="modal-link"
                        onClick={(e) => {
                            e.preventDefault();
                            setStep("captcha");
                        }}
                    >
                        <FaKey className="forget-pass-icon" />
                        تغییر رمز عبور
                    </a>

                    <hr className="profile-divider" />

                    <h3 className="profile-subtitle">
                        <FaTrophy className="icon" />
                        آخرین رکوردهای شما
                    </h3>

                    <div className="score-list" dir="ltr">
                        {scores.length === 0 ? (
                            <p className="empty">هنوز رکوردی ثبت نشده</p>
                        ) : (
                            scores.map((s, i) => (
                                <div className="score-card" dir="rtl" key={i}>
                                    <div className="score-header">رکورد {toPersianNumbers((i + 1).toString())}</div>
                                    <div className="score-row">
                                        <span className="score-label">WPM:</span>
                                        <span className="score-value">{toPersianNumbers(s.wpm.toString())}</span>
                                    </div>
                                    <div className="score-row">
                                        <span className="score-label">دقت:</span>
                                        <span className="score-value">{toPersianNumbers(s.accuracy.toString())}%</span>
                                    </div>
                                    <div className="score-row">
                                        <span className="score-label">مدت:</span>
                                        <span className="score-value">{toPersianNumbers(s.duration.toString())} ثانیه</span>
                                    </div>
                                    <div className="score-row">
                                        <span className="score-label">تاریخ:</span>
                                        <span className="score-value" dir="ltr">
                                            {new Date(s.createdAt).toLocaleString("fa-IR")}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    )
};