const MESSAGES = {
    SUCCESS: {
        DEFAULT: "عملیات موفقیت آمیز بود",
        OTP_SENT: "کد تایید ارسال شد",
        LOGIN: "ورود با موفقیت انجام شد",
        LOGOUT: "با موفقیت خارج شدید",
        REGISTER: "ثبت نام با موفقیت انجام شد",
        CHANGE_PASSWORD: "رمز عبور با موفقیت تغییر کرد",
        UPDATE_PROFILE: "پروفایل با موفقیت بروزرسانی شد",
        NEW_RECORD_WPM_SCORE: "رکورد جدید امتیاز و سرعت! 🎉🎉",
        NEW_RECORD_SCORE: "رکورد جدید امتیاز!",
        NEW_RECORD_WPM: "رکورد جدید سرعت تایپ! 🚀",
        SCORE_SAVED: "امتیاز شما ذخیره شد. موفق باشید!"
    },

    ERROR: {
        DEFAULT: "عملیات با خطا مواجه شد",
        INVALID_OTP: "کد تایید نامعتبر است",
        OTP_EXPIRED: "کد تایید منقضی شده است",
        USER_NOT_FOUND: "کاربر یافت نشد",
        INVALID_CREDENTIALS: "رمز عبور صحیح نمی باشد",
        USERNAME_ALREADY_EXIST: "این نام کاربری/ایمیل قبلاً توسط شخص دیگری انتخاب شده است.",
        INVALID_TOKEN: "توکن نامعتبر می باشد",
        TO_MANY_REQUEST: "تعداد درخواست‌های شما بیش از حد مجاز است لطفاً بعداً تلاش کنید."
    }
};
module.exports = MESSAGES;
