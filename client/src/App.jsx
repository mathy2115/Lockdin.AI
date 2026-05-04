import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AIProvider } from './context/AIContext';
import { TimerProvider } from './context/TimerContext';
import Layout from './components/Layout';
import PomodoroMiniWidget from './components/PomodoroMiniWidget';

// Pages
import Dashboard from './pages/Dashboard';
import AcademicPlanner from './pages/AcademicPlanner';
import FocusSession from './pages/FocusSession';
import Wellness from './pages/Wellness';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { useSettings } from './hooks/useSettings';
import { useEffect } from 'react';

function App() {
  const { settings } = useSettings();
  const isAuthenticated = !!localStorage.getItem('token');

  useEffect(() => {
    if (settings?.appearance) {
      document.documentElement.style.setProperty('--fa-brand', settings.appearance.accent);
      if (settings.appearance.theme === 'light') {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
    }
  }, [settings.appearance]);

  return (
    <AIProvider>
      <TimerProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />} />
            <Route path="/dashboard" element={isAuthenticated ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} />
            <Route path="/planner" element={isAuthenticated ? <Layout><AcademicPlanner /></Layout> : <Navigate to="/login" />} />
            <Route path="/focus" element={isAuthenticated ? <Layout><FocusSession /></Layout> : <Navigate to="/login" />} />
            <Route path="/wellness" element={isAuthenticated ? <Layout><Wellness /></Layout> : <Navigate to="/login" />} />
            <Route path="/settings" element={isAuthenticated ? <Layout><Settings /></Layout> : <Navigate to="/login" />} />
            <Route path="/onboarding" element={isAuthenticated ? <Onboarding /> : <Navigate to="/login" />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>

          {/* PomodoroMiniWidget is global — shows on all pages except /focus */}
          {isAuthenticated && <PomodoroMiniWidget />}

          {/* CameraMode and AdaptiveNudgeSystem live ONLY inside FocusSession — not here */}
        </BrowserRouter>
      </TimerProvider>
    </AIProvider>
  );
}

export default App;