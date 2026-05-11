import Demo from "../components/Typography/Typography";
import { useNavigate } from "react-router-dom";

export default function TypographyPage() {
  const navigate = useNavigate();
  
  return <Demo onBack={() => navigate("/")} />;
}