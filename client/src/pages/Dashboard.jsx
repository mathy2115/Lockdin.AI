import { useNavigate } from 'react-router-dom';
import { LogOut, Timer, Flame, CheckSquare, HeartPulse } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="h-full flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <header className="flex items-center justify-between pb-6 border-b border-fa-border mb-6">
        <div>
          <h2 className="text-2xl font-['Sora'] font-bold text-fa-text-primary">Dashboard</h2>
          <p className="text-fa-text-secondary mt-1">Welcome back. Ready for deep work?</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-fa-bg-shell hover:bg-fa-state-stressed/10 text-fa-text-secondary hover:text-fa-state-stressed rounded-lg border border-fa-border transition-all"
        >
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </header>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 pb-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-fa-bg-shell border border-fa-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-fa-text-secondary">Today's Focus</span>
              <Timer size={18} className="text-fa-brand" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">2.5h</div>
            <div className="text-xs text-green-400 font-medium">+45m from yesterday</div>
          </div>

          <div className="bg-fa-bg-shell border border-fa-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-fa-text-secondary">Current Streak</span>
              <Flame size={18} className="text-orange-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">4 Days</div>
            <div className="text-xs text-fa-text-muted font-medium">Keep it up!</div>
          </div>

          <div className="bg-fa-bg-shell border border-fa-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-fa-text-secondary">Tasks Completed</span>
              <CheckSquare size={18} className="text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">6</div>
            <div className="text-xs text-fa-text-muted font-medium">2 remaining today</div>
          </div>

          <div className="bg-fa-bg-shell border border-fa-border rounded-2xl p-5 shadow-sm cursor-pointer hover:border-fa-brand/50 transition-colors" onClick={() => navigate('/wellness')}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-fa-text-secondary">Burnout Risk</span>
              <HeartPulse size={18} className="text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">Low</div>
            <div className="text-xs text-fa-text-muted font-medium">Click to see Wellness</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
          <div className="bg-gradient-to-br from-[#1A1E2E] to-[#2D243F] rounded-2xl p-8 border border-fa-brand/20 shadow-lg relative overflow-hidden group cursor-pointer" onClick={() => navigate('/focus')}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-fa-brand/10 rounded-bl-full group-hover:scale-110 transition-transform"></div>
            <h3 className="text-xl font-bold text-white mb-2 relative z-10">Start a Focus Session</h3>
            <p className="text-sm text-fa-text-secondary mb-6 relative z-10 max-w-[80%]">Use AI camera mode to track your focus and stay accountable.</p>
            <button className="bg-fa-brand hover:bg-fa-brand/90 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors relative z-10">
              Launch Timer
            </button>
          </div>

          <div className="bg-fa-bg-shell border border-fa-border rounded-2xl p-8 shadow-sm">
            <h3 className="text-lg font-bold text-white mb-4">Up Next</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-fa-bg-page p-3 rounded-xl border border-fa-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <span className="text-sm font-medium text-fa-text-primary">Calculus Assignment</span>
                </div>
                <span className="text-xs font-semibold text-fa-text-secondary bg-fa-bg-hover px-2 py-1 rounded">Today</span>
              </div>
              <div className="flex items-center justify-between bg-fa-bg-page p-3 rounded-xl border border-fa-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className="text-sm font-medium text-fa-text-primary">Read Chapter 4</span>
                </div>
                <span className="text-xs font-semibold text-fa-text-secondary bg-fa-bg-hover px-2 py-1 rounded">Tomorrow</span>
              </div>
            </div>
            <button className="text-sm text-fa-brand font-medium mt-5 hover:underline" onClick={() => navigate('/planner')}>
              View academic hub →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
