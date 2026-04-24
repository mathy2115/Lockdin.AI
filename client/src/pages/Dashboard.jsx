import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    // Clear other data if needed, or keep profile for next login
    navigate('/login');
  };

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between pb-6 border-b border-fa-border mb-6">
        <h2 className="text-2xl font-semibold text-fa-text-primary">Dashboard</h2>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-fa-bg-shell hover:bg-fa-state-stressed/10 text-fa-text-secondary hover:text-fa-state-stressed rounded-lg border border-fa-border hover:border-fa-state-stressed/30 transition-all"
        >
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </header>
      
      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-fa-border rounded-2xl bg-fa-bg-shell/30">
        <div className="text-center">
          <h3 className="text-xl font-medium text-fa-text-secondary mb-2">Welcome to your Dashboard</h3>
          <p className="text-fa-text-muted">This area is under construction.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
