import Demo from "../components/Demo/Demo";
import { useNavigate } from "react-router-dom";

export default function DemoPage() {
  const navigate = useNavigate();
  
  return <Demo onBack={() => navigate("/")} />;
}