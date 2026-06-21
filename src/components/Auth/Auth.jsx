import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import {
    checkPhone,
    verifyOtp,
    login,
    register,
    sendPasswordResetOtp,
    passwordReset
} from "../../api/auth";

import OtpInput from "../Otp/OtpInput";
import { FaKey, FaEye, FaEyeSlash, FaSyncAlt } from "react-icons/fa";
import {
    loadCaptchaEnginge,
    LoadCanvasTemplate,
    validateCaptcha,
} from "react-simple-captcha";

export default function AuthModal({
    onClose,
    onSuccessAuthenticate,
    savedState,
    onSaveState
}) {

    const [step, setStep] = useState(savedState.step);
    const [phone, setPhone] = useState(savedState.phone);
    const [password, setPassword] = useState(savedState.password);
    const [otpType, setOtpType] = useState(savedState.otpType);
    const [otp, setOtp] = useState(savedState.otp);
    const [name, setName] = useState(savedState.name);
    const [email, setEmail] = useState(savedState.email);
    const [userName, setUserName] = useState(savedState.userName);
    const [timeLeft, setTimeLeft] = useState(savedState.timeLeft);
    const [canResend, setCanResend] = useState(savedState.canResend);

    const [showPassword, setShowPassword] = useState(savedState.showPassword);
    const [showRegisterPassword, setShowRegisterPassword] = useState(savedState.showRegisterPassword);
    const [showResetPassword, setShowResetPassword] = useState(savedState.showResetPassword);

    // Captcha state
    const [captchaValue, setCaptchaValue] = useState("");

    // loading states
    const [checkPhoneLoading, setCheckPhoneLoading] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

    const phoneInputRef = useRef(null);
    const loginPasswordRef = useRef(null);
    const registerNameRef = useRef(null);
    const registerUsernameRef = useRef(null);
    const registerEmailRef = useRef(null);
    const registerPasswordRef = useRef(null);
    const resetPasswordRef = useRef(null);
    const captchaInputRef = useRef(null);

    useEffect(() => {
        onSaveState({
            step,
            phone,
            password,
            otpType,
            otp,
            name,
            email,
            userName,
            timeLeft,
            canResend,
            showPassword,
            showRegisterPassword,
            showResetPassword
        });
    }, [
        step,
        phone,
        password,
        otpType,
        otp,
        name,
        email,
        userName,
        timeLeft,
        canResend,
        showPassword,
        showRegisterPassword,
        showResetPassword,
        onSaveState
    ]);

    useEffect(() => {
        if (step === "phone" && phoneInputRef.current) {
            phoneInputRef.current.focus();
        } else if (step === "login" && loginPasswordRef.current) {
            loginPasswordRef.current.focus();
        } else if (step === "register" && registerNameRef.current) {
            registerNameRef.current.focus();
        } else if (step === "resetPassword" && resetPasswordRef.current) {
            resetPasswordRef.current.focus();
        } else if (step === "captcha" && captchaInputRef.current) {
            captchaInputRef.current.focus();
        }
    }, [step]);

    useEffect(() => {
        if (step === "otp" && timeLeft === 0 && !canResend) {
            setTimeLeft(60);
            setCanResend(false);
        }
    }, [step]);

    useEffect(() => {
        let timer;

        if (step === "otp" && timeLeft > 0) {
            timer = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && step === "otp") {
            setCanResend(true);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [step, timeLeft]);

    // Load captcha when step changes to captcha
    useEffect(() => {
        if (step === "captcha") {
            loadCaptchaEnginge(5, 'white', 'black', 'numbers');
            setCaptchaValue("");
        }
    }, [step]);

    const handleKeyPress = (e, handler, loading) => {
        if (e.key === "Enter" && !loading) {
            handler();
        }
    };

    function validatePhoneNumber(phoneNumber) {
        const regex = /^(?:\+98|98|0)?9\d{9}$/;
        return regex.test(phoneNumber);
    }

    const handleCheckPhone = async () => {

        if (checkPhoneLoading) return;

        if (!validatePhoneNumber(phone)) {
            toast.error("شماره موبایل معتبر نیست");
            return;
        }

        try {
            setCheckPhoneLoading(true);

            const data = await checkPhone(phone);

            if (data.data.status === "login") {
                setStep("login");
            } else {
                toast.success(data.message);
                setOtpType("register");
                setStep("otp");
            }

        } finally {
            setCheckPhoneLoading(false);
        }
    };

    const handleSendOtp = async () => {

        if (resendLoading) return;

        // Check captcha for reset password flow
        if (otpType === "reset") {
            if (!validateCaptcha(captchaValue)) {
                toast.error("کد کپچا اشتباه است");
                return;
            }
        }

        if (!canResend && timeLeft > 0) {
            toast.error(`لطفاً ${timeLeft} ثانیه صبر کنید`);
            return;
        }

        try {
            setResendLoading(true);

            const data = await sendPasswordResetOtp(phone);

            if (data.success) {
                toast.success(data.message);
                setOtpType("reset");
                setTimeLeft(60);
                setCanResend(false);
                setOtp(["", "", "", ""]);
                setStep("otp");
                setCaptchaValue("");
            } else {
                toast.error(data.message);
            }

        } finally {
            setResendLoading(false);
        }
    };

    const handleResetPassword = async () => {

        if (resetLoading) return;

        if (!validatePassword(password)) {
            toast.error("رمز عبور باید حداقل 8 کاراکتر باشد");
            return;
        }

        try {
            setResetLoading(true);

            const data = await passwordReset(phone, password);

            if (data.success) {
                toast.success("رمز عبور با موفقیت تغییر کرد");
                setStep("login");
                setPassword("");
            } else {
                toast.error(data.message);
            }

        } finally {
            setResetLoading(false);
        }
    };

    const handleVerifyOtp = async () => {

        if (otpLoading) return;

        try {
            setOtpLoading(true);

            const code = otp;
            const data = await verifyOtp(phone, code);

            if (data.success) {
                toast.success(data.message);

                if (otpType === "register") {
                    setStep("register");
                }

                if (otpType === "reset") {
                    setStep("resetPassword");
                }

            } else {
                toast.error(data.message);
            }

        } finally {
            setOtpLoading(false);
        }
    };

    const handleLogin = async () => {
        if (loginLoading) return;

        try {
            setLoginLoading(true);
            const data = await login(phone, password);

            if (data && data.success) {
                localStorage.setItem("token", data.data.token);
                toast.success(data.message || "خوش آمدید");
                onClose();
                onSuccessAuthenticate();
            } else {
                toast.error(data?.message || "خطای ناشناخته");
            }
        } catch (err) {
            toast.error("خطای ارتباط با سرور");
        } finally {
            setLoginLoading(false);
        }
    };

    const handleRegister = async () => {

        if (registerLoading) return;

        if (!validateName(name)) {
            toast.error("نام باید فارسی و کمتر از 20 کاراکتر باشد");
            return;
        }

        if (!validateUsername(userName)) {
            toast.error("نام کاربری باید انگلیسی، بدون فاصله و کمتر از ۲۰ کاراکتر باشد");
            return;
        }


        if (!validateEmail(email)) {
            toast.error("ایمیل معتبر نیست");
            return;
        }

        if (!validatePassword(password)) {
            toast.error("رمز عبور باید حداقل 8 کاراکتر باشد");
            return;
        }

        try {
            setRegisterLoading(true);

            const result = await register({
                phone,
                name,
                userName,
                email,
                password
            });

            if (result.success) {
                toast.success(result.message);

                localStorage.setItem("token", result.data.token);

                onClose();
                onSuccessAuthenticate();

            } else {
                toast.error(result.message);
            }

        } finally {
            setRegisterLoading(false);
        }
    };

    function validateName(name) {
        const regex = /^[آ-ی\s]{2,20}$/;
        return regex.test(name);
    }

    function validateUsername(username) {
        const regex = /^[a-zA-Z0-9_]{3,20}$/;
        return regex.test(username);
    }

    function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    function validatePassword(password) {
        return password.length >= 8;
    }

    const handleForgotPassword = () => {
        if (!validatePhoneNumber(phone)) {
            toast.error("شماره موبایل معتبر نیست");
            return;
        }
        setOtpType("reset");
        setStep("captcha");
    };

    const handleResetCaptcha = () => {
        loadCaptchaEnginge(5, 'white', 'black', 'numbers');
        setCaptchaValue("");
        toast.success("کپچا بازنشانی شد");
    };

    const renderCaptchaStep = () => (
        <div className="modal-form">
            <div className="captcha-box" style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                <LoadCanvasTemplate />
                <button
                    type="button"
                    className="captcha-reset-btn"
                    onClick={handleResetCaptcha}
                    title="بازنشانی کپچا"
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        color: '#666',
                        padding: '8px'
                    }}
                >
                    <FaSyncAlt />
                </button>
            </div>

            <input
                ref={captchaInputRef}
                className="modal-input"
                placeholder="کد کپچا را وارد کنید"
                value={captchaValue}
                onChange={(e) => setCaptchaValue(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleSendOtp, resendLoading)}
            />

            <button
                className="modal-btn"
                onClick={handleSendOtp}
                disabled={resendLoading}
            >
                {resendLoading ? <span className="btn-loader"></span> : "ارسال کد تایید"}
            </button>
        </div>
    );

    return (
        <div dir="rtl" className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">

                    <button className="modal-close" onClick={onClose}>
                        ✕
                    </button>

                    <h2 className="modal-title">ورود / ثبت نام</h2>

                    {step === "phone" && (
                        <div className="modal-form">

                            <input
                                ref={phoneInputRef}
                                className="modal-input"
                                placeholder="شماره موبایل"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                onKeyPress={(e) =>
                                    handleKeyPress(e, handleCheckPhone, checkPhoneLoading)
                                }
                                maxLength={11}
                            />

                            <button
                                className="modal-btn"
                                onClick={handleCheckPhone}
                                disabled={checkPhoneLoading}
                            >
                                {checkPhoneLoading ? <span className="btn-loader"></span> : "ادامه"}
                            </button>

                        </div>
                    )}

                    {step === "login" && (
                        <div className="modal-form">
                            <div className="password-wrapper">
                                <input
                                    ref={loginPasswordRef}
                                    className="modal-input password-input"
                                    placeholder="رمز عبور"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyPress={(e) =>
                                        handleKeyPress(e, handleLogin, loginLoading)
                                    }
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>

                            <a
                                className="modal-link forgot-password-btn"
                                onClick={handleForgotPassword}
                                type="button"
                            >
                                <FaKey className="forget-pass-icon" />
                                تغییر رمز عبور
                            </a>

                            <button
                                className="modal-btn"
                                onClick={handleLogin}
                                disabled={loginLoading}
                            >
                                {loginLoading ? <span className="btn-loader"></span> : "ورود"}
                            </button>
                        </div>
                    )}

                    {step === "captcha" && renderCaptchaStep()}

                    {step === "otp" && (
                        <div className="modal-form">

                            <p className="otp-text">
                                کد تایید به شماره {phone} ارسال شد
                            </p>

                            <OtpInput
                                onComplete={(code) => setOtp(code)}
                                onSubmit={handleVerifyOtp}
                            />

                            <button
                                className="modal-btn"
                                onClick={handleVerifyOtp}
                                disabled={otpLoading}
                            >
                                {otpLoading ? <span className="btn-loader"></span> : "تایید کد"}
                            </button>

                            <div className="resend-section">

                                {timeLeft > 0 ? (
                                    <p className="timer-text">
                                        ارسال مجدد کد پس از {timeLeft} ثانیه
                                    </p>
                                ) : (
                                    <button
                                        className="modal-link resend-btn"
                                        onClick={() => {
                                            setOtpType("reset");
                                            setStep("captcha");
                                            setCaptchaValue("");
                                        }}
                                        disabled={resendLoading}
                                    >
                                        {resendLoading ? <span className="btn-loader"></span> : "ارسال مجدد کد"}
                                    </button>
                                )}

                            </div>

                        </div>
                    )}

                    {step === "register" && (
                        <div className="modal-form">
                            <input
                                ref={registerNameRef}
                                className="modal-input"
                                placeholder="نام (فارسی)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && registerUsernameRef.current) {
                                        registerUsernameRef.current.focus();
                                    }
                                }}
                            />
                            <input
                                ref={registerUsernameRef}
                                className="modal-input"
                                placeholder="نام کاربری (انگلیسی)"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && registerEmailRef.current) {
                                        registerEmailRef.current.focus();
                                    }
                                }}
                            />
                            <input
                                ref={registerEmailRef}
                                className="modal-input"
                                placeholder="ایمیل"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && registerPasswordRef.current) {
                                        registerPasswordRef.current.focus();
                                    }
                                }}
                            />
                            <div className="password-wrapper">
                                <input
                                    ref={registerPasswordRef}
                                    className="modal-input password-input"
                                    placeholder="رمز عبور"
                                    type={showRegisterPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyPress={(e) => handleKeyPress(e, handleRegister, registerLoading)}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                >
                                    {showRegisterPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            <button
                                className="modal-btn"
                                onClick={handleRegister}
                                disabled={registerLoading}
                            >
                                {registerLoading ? <span className="btn-loader"></span> : "تکمیل ثبت نام"}
                            </button>
                        </div>
                    )}

                    {step === "resetPassword" && (
                        <div className="modal-form">

                            <div className="password-wrapper">

                                <input
                                    ref={resetPasswordRef}
                                    className="modal-input password-input"
                                    placeholder="رمز عبور جدید"
                                    type={showResetPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyPress={(e) =>
                                        handleKeyPress(
                                            e,
                                            handleResetPassword,
                                            resetLoading
                                        )
                                    }
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowResetPassword(!showResetPassword)
                                    }
                                >
                                    {showResetPassword
                                        ? <FaEyeSlash />
                                        : <FaEye />}
                                </button>

                            </div>

                            <button
                                className="modal-btn"
                                onClick={handleResetPassword}
                                disabled={resetLoading}
                            >
                                {resetLoading ? <span className="btn-loader"></span> : "تغییر رمز عبور"}

                            </button>

                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}