import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DemoPage from './pages/DemoPage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import DesktopOnly from './components/DesktopOnly/DesktopOnly';
import Game from './components/Game/Game';
import TypographyPage from './pages/TypographyPage';
import AdminPage from './pages/AdminPage';
import WorldCupPage from './pages/WorldCupPage';
import { isMobile } from "react-device-detect";
import { Toaster } from "react-hot-toast";
import "flag-icons/css/flag-icons.min.css";
import './App.css';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppContent() {
  const location = useLocation();
  
  // مسیرهایی که در موبایل قابل مشاهده هستند
  const allowedOnMobile = ['/', '/worldcup'];
  // اگر موبایل باشد و مسیر فعلی در لیست مجاز نباشد
  if (isMobile && !allowedOnMobile.includes(location.pathname)) {
    return <DesktopOnly />;
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            direction: "rtl",
            textAlign: "right",
            fontFamily: "Vazirmatn, sans-serif",
          },
        }}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/game" element={
          <ProtectedRoute>
            <Game />
          </ProtectedRoute>
        } />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worldcup"
          element={
            <ProtectedRoute>
              <WorldCupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/typography"
          element={
            <ProtectedRoute>
              <TypographyPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;