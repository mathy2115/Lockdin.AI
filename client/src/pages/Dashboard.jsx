import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Timer, Flame, CheckSquare, HeartPulse, ChevronRight } from 'lucide-react';
import { format, isToday, parseISO, differenceInDays } from 'date-fns';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    focusTime: '0h',
    streak: '0 Days',
    tasksCompleted: 0,
    burnoutRisk: 'Low',
    upNext: []
  });

  useEffect(() => {
    // 1. Focus Time & Streak
    const sessions = JSON.parse(localStorage.getItem('focusSessions') || '[]');
    const todaySessions = sessions.filter(s => isToday(parseISO(s.date)));
    const totalTodaySeconds = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const hours = (totalTodaySeconds / 3600).toFixed(1);

    // Calculate Streak
    let streak = 0;
    if (sessions.length > 0) {
      const sortedDates = [...new Set(sessions.map(s => s.date.split('T')[0]))].sort().reverse();
      let current = new Date();
      current.setHours(0,0,0,0);
      
      for (let dateStr of sortedDates) {
        const d = new Date(dateStr);
        d.setHours(0,0,0,0);
        const diff = differenceInDays(current, d);
        if (diff === 0 || diff === 1) {
          streak++;
          current = d;
        } else {
          break;
        }
      }
    }

    // 2. Tasks Completed
    const tasks = JSON.parse(localStorage.getItem('academicTasks') || '[]');
    const completedCount = tasks.filter(t => t.status === 'done').length;

    // 3. Burnout Risk (from latest mood)
    const moodLogs = JSON.parse(localStorage.getItem('moodLogs') || '[]');
    let risk = 'Low';
    if (moodLogs.length > 0) {
      const latest = moodLogs[moodLogs.length - 1];
      const avg = (latest.mood + latest.energy + (6 - latest.stress)) / 3; // Stress is inverted in risk
      if (avg < 2) risk = 'High';
      else if (avg < 3.5) risk = 'Medium';
    }

    // 4. Up Next (2 upcoming tasks)
    const upcoming = tasks
      .filter(t => t.status !== 'done')
      .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date) - new Date(b.date);
      })
      .slice(0, 2);

    setStats({
      focusTime: hours + 'h',
      streak: streak + ' Days',
      tasksCompleted: completedCount,
      burnoutRisk: risk,
      upNext: upcoming
    });
  }, []);

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
            <div className="text-3xl font-bold text-white mb-1">{stats.focusTime}</div>
            <div className="text-xs text-fa-text-muted font-medium">Recorded today</div>
          </div>

          <div className="bg-fa-bg-shell border border-fa-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-fa-text-secondary">Current Streak</span>
              <Flame size={18} className="text-orange-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.streak}</div>
            <div className="text-xs text-fa-text-muted font-medium">Daily commitment</div>
          </div>

          <div className="bg-fa-bg-shell border border-fa-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-fa-text-secondary">Tasks Completed</span>
              <CheckSquare size={18} className="text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.tasksCompleted}</div>
            <div className="text-xs text-fa-text-muted font-medium">From Academic Hub</div>
          </div>

          <div className="bg-fa-bg-shell border border-fa-border rounded-2xl p-5 shadow-sm cursor-pointer hover:border-fa-brand/50 transition-colors" onClick={() => navigate('/wellness')}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-fa-text-secondary">Burnout Risk</span>
              <HeartPulse size={18} className="text-blue-400" />
            </div>
            <div className={`text-3xl font-bold mb-1 ${
              stats.burnoutRisk === 'High' ? 'text-red-400' : 
              stats.burnoutRisk === 'Medium' ? 'text-amber-400' : 'text-white'
            }`}>{stats.burnoutRisk}</div>
            <div className="text-xs text-fa-text-muted font-medium">Based on recent mood</div>
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
              {stats.upNext.length === 0 ? (
                <div className="text-sm text-fa-text-muted italic py-4">No tasks yet. Add tasks in Academic Hub.</div>
              ) : (
                stats.upNext.map((task, idx) => (
                  <div key={task.id} className="flex items-center justify-between bg-fa-bg-page p-3 rounded-xl border border-fa-border/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-red-400' : 'bg-blue-400'}`}></div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-fa-brand uppercase tracking-wider">{task.subject}</span>
                        <span className="text-sm font-medium text-fa-text-primary">{task.topic || task.title}</span>
                      </div>
                    </div>
                    {task.date && <span className="text-[10px] font-semibold text-fa-text-secondary bg-fa-bg-hover px-2 py-1 rounded">{format(parseISO(task.date), 'MMM d')}</span>}
                  </div>
                ))
              )}
            </div>
            <button className="text-sm text-fa-brand font-medium mt-5 flex items-center gap-1 hover:underline" onClick={() => navigate('/planner')}>
              View academic hub <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
