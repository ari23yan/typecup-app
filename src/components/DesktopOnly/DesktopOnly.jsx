import "./DesktopOnly.css";
import { FaTrophy } from "react-icons/fa";
import "@fontsource/orbitron/700.css";

export default function DesktopOnly() {
  return (
    <div className="desktop-only-container">
      <div className="glass-card">
        <h1 className="title">
          Type
          <FaTrophy className="cup-icon" />
          Cup
        </h1>

        <p className="fa" dir="rtl">
          این اپ روی موبایل در دسترس نیست
        </p>

        <p className="en">
          Please open this app using a laptop or desktop
        </p>
      </div>
    </div>
  );
}
