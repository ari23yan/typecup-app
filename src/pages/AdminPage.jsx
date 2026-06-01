import Admin from "../components/Admin/Admin";
import { useNavigate } from "react-router-dom";

export default function AdminPage() {
  const navigate = useNavigate();
  
  return <Admin onBack={() => navigate("/")} />;
}