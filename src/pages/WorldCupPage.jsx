import WorldCup from "../components/WorldCup/WorldCup";
import { useNavigate } from "react-router-dom";

export default function WorldCupPage() {
  const navigate = useNavigate();
  
  return <WorldCup onBack={() => navigate("/")} />;
}