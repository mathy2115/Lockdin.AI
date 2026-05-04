import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Timer, Flame, CheckSquare, HeartPulse, ChevronRight } from 'lucide-react';
import { format, isToday, parseISO, differenceInDays } from 'date-fns';
import { useSettings } from '../hooks/useSettings';

const Dashboard = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning ☀️";
    if (hour < 18) return "Good afternoon 🌤️";
    return "Good evening 🌙";
  };
  
  const firstName = settings?.profile?.name ? settings.profile.name.split(' ')[0] : 'Arya';

  return (
    <div className="h-full flex flex-col font-['Plus_Jakarta_Sans',sans-serif] animate-slide-up">
      <header className="flex items-center justify-between pb-6 mb-6">
        <div>
          <h2 className="text-3xl font-['Sora'] font-bold text-[#1A1A2E] mb-1">{getGreeting()}, {firstName}!</h2>
          <p className="text-gray-500 font-medium">Welcome back. Ready for deep work?</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#FFFDF4] hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-xl border border-[#E8D5A3] shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-0.5 font-medium"
        >
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </header>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-8 pb-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Focus */}
          <div className="relative overflow-hidden bg-[#FFFDF4] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#E8D5A3] border-t-4 border-t-[#6C63FF] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] group">
            <div className="absolute -right-4 -bottom-4 text-[#6C63FF] opacity-[0.05] group-hover:scale-110 transition-transform duration-500">
              <Timer size={100} />
            </div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Today's Focus</span>
              <div className="w-10 h-10 rounded-full bg-[#6C63FF]/10 flex items-center justify-center text-[#6C63FF]">
                <Timer size={20} />
              </div>
            </div>
            <div className="text-4xl font-bold text-[#1A1A2E] mb-1 relative z-10">{stats.focusTime}</div>
            <div className="text-sm text-gray-500 font-medium relative z-10">Recorded today</div>
          </div>

          {/* Card 2: Streak */}
          <div className="relative overflow-hidden bg-[#FFFDF4] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#E8D5A3] border-t-4 border-t-[#FF6B6B] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] group">
            <div className="absolute -right-4 -bottom-4 text-[#FF6B6B] opacity-[0.05] group-hover:scale-110 transition-transform duration-500">
              <Flame size={100} />
            </div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Current Streak</span>
              <div className="w-10 h-10 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center text-[#FF6B6B]">
                <Flame size={20} />
              </div>
            </div>
            <div className="text-4xl font-bold text-[#1A1A2E] mb-1 relative z-10">{stats.streak}</div>
            <div className="text-sm text-gray-500 font-medium relative z-10">Daily commitment</div>
          </div>

          {/* Card 3: Tasks */}
          <div className="relative overflow-hidden bg-[#FFFDF4] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#E8D5A3] border-t-4 border-t-[#00C896] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] group">
            <div className="absolute -right-4 -bottom-4 text-[#00C896] opacity-[0.05] group-hover:scale-110 transition-transform duration-500">
              <CheckSquare size={100} />
            </div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Tasks Completed</span>
              <div className="w-10 h-10 rounded-full bg-[#00C896]/10 flex items-center justify-center text-[#00C896]">
                <CheckSquare size={20} />
              </div>
            </div>
            <div className="text-4xl font-bold text-[#1A1A2E] mb-1 relative z-10">{stats.tasksCompleted}</div>
            <div className="text-sm text-gray-500 font-medium relative z-10">From Academic Hub</div>
          </div>

          {/* Card 4: Burnout Risk */}
          <div className="relative overflow-hidden bg-[#FFFDF4] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#E8D5A3] border-t-4 border-t-[#FFB347] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] cursor-pointer group" onClick={() => navigate('/wellness')}>
            <div className="absolute -right-4 -bottom-4 text-[#FFB347] opacity-[0.05] group-hover:scale-110 transition-transform duration-500">
              <HeartPulse size={100} />
            </div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Burnout Risk</span>
              <div className="w-10 h-10 rounded-full bg-[#FFB347]/10 flex items-center justify-center text-[#FFB347]">
                <HeartPulse size={20} />
              </div>
            </div>
            <div className={`text-4xl font-bold mb-1 relative z-10 ${
              stats.burnoutRisk === 'High' ? 'text-[#FF6B6B]' : 
              stats.burnoutRisk === 'Medium' ? 'text-[#FFB347]' : 'text-[#00C896]'
            }`}>{stats.burnoutRisk}</div>
            <div className="text-sm text-gray-500 font-medium relative z-10">Based on recent mood</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gradient-to-r from-[#EEF2FF] to-[#E0E7FF] rounded-2xl p-8 shadow-[0_10px_40px_rgba(79,70,229,0.15)] relative overflow-hidden group cursor-pointer transition-transform duration-300 hover:-translate-y-1" onClick={() => navigate('/focus')}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#4F46E5]/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
            <div className="relative z-10 flex flex-col h-full justify-center">
              <div>
                <h3 className="text-3xl font-['Sora'] font-bold text-[#3730A3] mb-3 tracking-tight">Ready for Deep Work?</h3>
                <p className="text-[#3730A3]/80 text-lg mb-8 max-w-md leading-relaxed">Activate AI camera mode to track your focus, block distractions, and stay accountable to your goals.</p>
              </div>
              <button className="self-start bg-[#4F46E5] text-white font-bold py-3.5 px-8 rounded-xl transition-all hover:scale-105 shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_10px_25px_rgba(79,70,229,0.4)] flex items-center gap-2">
                <Timer size={20} />
                Start Focus Session
              </button>
            </div>
          </div>

          <div className="bg-[#FFFDF4] border border-[#E8D5A3] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] flex flex-col h-full transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#1A1A2E] font-['Sora']">Up Next</h3>
              <button className="text-sm text-[#4F46E5] font-semibold flex items-center gap-1 hover:text-[#3730A3] transition-colors bg-[#EEF2FF] px-3 py-1.5 rounded-lg" onClick={() => navigate('/planner')}>
                View All <ChevronRight size={16} />
              </button>
            </div>
            
            <div className="space-y-4 flex-1">
              {stats.upNext.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-8 bg-gray-50 rounded-xl border border-dashed border-[#E5E7EB]">
                  <CheckSquare size={40} className="mb-3 opacity-20" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs mt-1">No upcoming tasks.</p>
                </div>
              ) : (
                stats.upNext.map((task, idx) => {
                  return (
                    <div key={task.id} className="relative bg-[#FFFDF4] p-4 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#E8D5A3] group hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden" onClick={() => navigate('/planner')}>
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#4F46E5]"></div>
                      <div className="pl-3">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{task.subject}</span>
                          {task.date && <span className="text-xs font-semibold text-[#7C6FFF] bg-[#EEF2FF] px-2 py-0.5 rounded">{format(parseISO(task.date), 'MMM d')}</span>}
                        </div>
                        <p className="text-sm font-bold text-[#1A1A2E] leading-tight mt-1 group-hover:text-[#4F46E5] transition-colors">{task.topic || task.title}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
