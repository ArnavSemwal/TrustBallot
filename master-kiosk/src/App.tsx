import { Routes, Route, Navigate } from 'react-router-dom';
import LanguagePage from './pages/LanguagePage';
import AuthPage from './pages/AuthPage';
import BallotPage from './pages/BallotPage';
import ReviewPage from './pages/ReviewPage';
import SuccessPage from './pages/SuccessPage';
import AdminDashboard from './pages/AdminDashboard';
import { useKiosk } from './context/KioskContext';

export default function App() {
  const { secondsLeft } = useKiosk();

  if (secondsLeft <= 0) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0D233A] text-white font-sans select-none px-8 text-center gap-4">
        <div className="w-20 h-20 rounded-full border-4 border-red-400 flex items-center justify-center text-4xl">⏱</div>
        <h1 className="text-3xl font-bold">Session Timed Out</h1>
        <p className="text-white/70 max-w-md">
          No vote was recorded. For security, this session has been destroyed.
          Please contact the polling officer to restart the process.
        </p>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<LanguagePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/ballot" element={<BallotPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/audit" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Inactivity Toast */}
      {secondsLeft > 0 && secondsLeft <= 15 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 animate-bounce select-none pointer-events-none z-[100]">
          <span className="text-2xl leading-none">⚠</span>
          <span className="font-semibold text-sm uppercase tracking-wider">
            Inactivity Detected — Resetting in {secondsLeft}s
          </span>
        </div>
      )}
    </>
  );
}