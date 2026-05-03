import { useState, useRef, useEffect } from "react";
import "./OtpInput.css";

const OTP_LENGTH = 4;

export default function OtpInput({ onComplete, onSubmit }) {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const inputsRef = useRef([]);

  useEffect(() => {
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1].focus();
    }

    const fullOtp = newOtp.join("");
    if (newOtp.every((digit) => digit !== "")) {
      onComplete?.(fullOtp);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        inputsRef.current[index - 1].focus();
      }
    }
    
    if (e.key === "Enter") {
      const fullOtp = otp.join("");
      if (fullOtp.length === OTP_LENGTH && fullOtp.every(digit => digit !== "")) {
        onSubmit?.();
      }
    }
  };

  const clearOtp = () => {
    setOtp(Array(OTP_LENGTH).fill(""));
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  };

  return (
    <div dir="ltr" className="otp-container">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          className="otp-input"
          type="text"
          placeholder="-"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e.target.value, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
        />
      ))}
    </div>
  );
}