import { loadCaptchaEnginge, LoadCanvasTemplate, validateCaptcha } from 'react-simple-captcha';
import { useEffect, useState } from 'react';

export default function Captcha() {
    const [captchaValue, setCaptchaValue] = useState("");

    useEffect(() => {
        loadCaptchaEnginge(6); // تعداد کاراکترهای کپچا
    }, []);

    const handleCheck = () => {
        if (validateCaptcha(captchaValue)) {
            alert("Captcha درست است");
        } else {
            alert("Captcha اشتباه است");
        }
    };

    return (
        <div>
            <LoadCanvasTemplate />
            
            <input
                placeholder="عبارت را وارد کنید"
                value={captchaValue}
                onChange={(e) => setCaptchaValue(e.target.value)}
            />

            <button onClick={handleCheck}>تایید</button>
        </div>
    );
}
