import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import FocusSession from './pages/FocusSession';
import AcademicPlanner from './pages/AcademicPlanner';
import Wellness from './pages/Wellness';
import { AIProvider } from './context/AIContext';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const ProtectedLayoutRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AIProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedLayoutRoute>
              <Dashboard />
            </ProtectedLayoutRoute>
          } 
        />
        <Route 
          path="/focus" 
          element={
            <ProtectedLayoutRoute>
              <FocusSession />
            </ProtectedLayoutRoute>
          } 
        />
        <Route 
          path="/planner" 
          element={
            <ProtectedLayoutRoute>
              <AcademicPlanner />
            </ProtectedLayoutRoute>
          } 
        />
        <Route 
          path="/wellness" 
          element={
            <ProtectedLayoutRoute>
              <Wellness />
            </ProtectedLayoutRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
    </AIProvider>
  );
}

export default App;