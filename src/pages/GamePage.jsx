import Game from "../components/Game/Game";
import { useNavigate } from "react-router-dom";

export default function GamePage() {
  const navigate = useNavigate();
  
  return <Game onBack={() => navigate("/")} />;
}