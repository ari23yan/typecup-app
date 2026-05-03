import Profile from "../components/Profile/Profile";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate("/");
  };
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
    window.location.reload();
  };
  
  return <Profile onBack={handleBack} onLogout={handleLogout} />;
}