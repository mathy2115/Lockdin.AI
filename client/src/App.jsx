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

function App() {
  // Simple check for token - in a real app, you'd use a proper AuthContext
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <AIProvider>
      <TimerProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected Routes */}
            <Route path="/" element={isAuthenticated ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={isAuthenticated ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} />
            <Route path="/planner" element={isAuthenticated ? <Layout><AcademicPlanner /></Layout> : <Navigate to="/login" />} />
            <Route path="/focus" element={isAuthenticated ? <Layout><FocusSession /></Layout> : <Navigate to="/login" />} />
            <Route path="/wellness" element={isAuthenticated ? <Layout><Wellness /></Layout> : <Navigate to="/login" />} />
            <Route path="/onboarding" element={isAuthenticated ? <Onboarding /> : <Navigate to="/login" />} />
            <Route path="/settings" element={isAuthenticated ? <Layout><div className="text-white p-8">Settings page coming soon...</div></Layout> : <Navigate to="/login" />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          {isAuthenticated && <PomodoroMiniWidget />}
        </BrowserRouter>
      </TimerProvider>
    </AIProvider>
  );
}

export default App;