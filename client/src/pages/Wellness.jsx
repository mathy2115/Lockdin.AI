import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import {
  format, subDays, startOfDay, isSameDay,
  parseISO, intervalToDuration
} from 'date-fns';
import { Layout, Timer, Zap, Brain, AlertCircle } from 'lucide-react';

export default function Wellness() {
  const [data, setData] = useState({
    sessions: [],
    moodLogs: [],
    isLoaded: false
  });

  useEffect(() => {
    const loadData = () => {
      const sessions = JSON.parse(localStorage.getItem('focusSessions') || '[]');
      const moodLogs = JSON.parse(localStorage.getItem('moodLogs') || '[]');
      setData({ sessions, moodLogs, isLoaded: true });
    };

    loadData();

    const handleStorageChange = (e) => {
      if (e.key === 'focusSessions' || e.key === 'moodLogs') {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const chartData = useMemo(() => {
    if (!data.isLoaded) return [];

    const last7Days = [...Array(7)].map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date,
        day: format(date, 'EEE'),
        fullDate: format(date, 'yyyy-MM-dd'),
        mood: 0,
        energy: 0,
        hours: 0,
        focusCount: 0,
        moodCount: 0
      };
    });

    // Aggregate Mood & Energy
    data.moodLogs.forEach(log => {
      const logDate = format(parseISO(log.date), 'yyyy-MM-dd');
      const dayData = last7Days.find(d => d.fullDate === logDate);
      if (dayData) {
        dayData.mood += (log.mood || 0);
        dayData.energy += (log.energy || 0);
        dayData.moodCount += 1;
      }
    });

    // Aggregate Focus Hours
    data.sessions.forEach(session => {
      const sessionDate = format(parseISO(session.date), 'yyyy-MM-dd');
      const dayData = last7Days.find(d => d.fullDate === sessionDate);
      if (dayData) {
        dayData.hours += (session.duration || 0) / 3600; // convert seconds to hours
        dayData.focusCount += 1;
      }
    });

    // Calculate Averages
    return last7Days.map(d => ({
      ...d,
      mood: d.moodCount > 0 ? Number((d.mood / d.moodCount).toFixed(1)) : 0,
      energy: d.moodCount > 0 ? Number((d.energy / d.moodCount).toFixed(1)) : 0,
      hours: Number(d.hours.toFixed(1))
    }));
  }, [data]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const daysWithMood = chartData.filter(d => d.moodCount > 0);
    const daysWithFocus = chartData.filter(d => d.focusCount > 0);

    const avgMood = daysWithMood.length > 0
      ? (daysWithMood.reduce((a, b) => a + b.mood, 0) / daysWithMood.length).toFixed(1)
      : '0.0';

    const avgEnergy = daysWithMood.length > 0
      ? (daysWithMood.reduce((a, b) => a + b.energy, 0) / daysWithMood.length).toFixed(1)
      : '0.0';

    const totalHours = chartData.reduce((a, b) => a + b.hours, 0).toFixed(1);

    const avgHoursPerDay = daysWithFocus.length > 0
      ? (totalHours / daysWithFocus.length)
      : 0;

    // Burnout Risk Calculation
    // Formula: High hours (>6/day) + Low Mood (<2.5) + Low Energy (<2.5)
    const moodFactor = daysWithMood.length > 0 ? (5 - Number(avgMood)) : 2.5;
    const energyFactor = daysWithMood.length > 0 ? (5 - Number(avgEnergy)) : 2.5;
    const hoursFactor = Math.min(avgHoursPerDay / 8, 1) * 5;

    const riskScore = (moodFactor + energyFactor + hoursFactor) / 3;
    const burnoutLevel = riskScore > 3.5 ? 'High' : riskScore > 2 ? 'Moderate' : 'Low';
    const burnoutPct = Math.round((riskScore / 5) * 100);
    const burnoutColor = burnoutLevel === 'High' ? '#FF8FAB' : burnoutLevel === 'Moderate' ? '#FFB347' : '#4FC3F7';

    return {
      avgMood,
      avgEnergy,
      totalHours,
      avgFocus: daysWithFocus.length > 0 ? (avgHoursPerDay).toFixed(1) : '0.0',
      burnoutLevel,
      burnoutPct,
      burnoutColor,
      hasData: daysWithMood.length > 0 || daysWithFocus.length > 0
    };
  }, [chartData]);

  if (!stats?.hasData && data.isLoaded) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-20 h-20 bg-fa-brand/10 rounded-full flex items-center justify-center mb-2">
          <Brain size={40} className="text-fa-brand animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-white font-['Sora']">Your DNA is forming...</h2>
        <p className="text-fa-text-secondary max-w-sm">
          We need a few focus sessions and mood logs to generate your wellness profile.
          Start your first session to see real-time analytics.
        </p>
        <button
          onClick={() => window.location.href = '/focus'}
          className="bg-fa-brand hover:bg-fa-brand/90 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-fa-brand/20"
        >
          Launch First Session
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-white font-['Sora']">Wellness Dashboard</h1>
        <p className="text-sm text-[var(--fa-text-secondary)] mt-1">Your 7-day focus and wellbeing overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Mood', value: `${stats.avgMood} / 5`, color: '#6C8EFF', icon: <Brain size={14} /> },
          { label: 'Avg Energy', value: `${stats.avgEnergy} / 5`, color: '#4FC3F7', icon: <Zap size={14} /> },
          { label: 'Total Hours', value: `${stats.totalHours}h`, color: '#B39DDB', icon: <Timer size={14} /> },
          { label: 'Avg Session', value: `${stats.avgFocus}h`, color: '#FFB347', icon: <Layout size={14} /> },
        ].map((stat) => (
          <div key={stat.label} className="bg-[var(--fa-bg-card)] rounded-xl p-4 border border-[var(--fa-border)] hover:border-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: stat.color }}>{stat.icon}</span>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--fa-text-secondary)]">{stat.label}</p>
            </div>
            <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Burnout Meter */}
      <div className="bg-[var(--fa-bg-card)] rounded-xl p-5 border border-[var(--fa-border)]">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-fa-text-muted" />
            <p className="text-sm font-medium text-white">Burnout Risk</p>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-white/5" style={{ color: stats.burnoutColor }}>
            {stats.burnoutLevel}
          </span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]"
            style={{ width: `${stats.burnoutPct}%`, backgroundColor: stats.burnoutColor }}
          />
        </div>
        <p className="text-xs text-[var(--fa-text-secondary)] mt-3 leading-relaxed">
          {stats.burnoutLevel === 'High'
            ? '🔥 High stress detected. Your body needs rest. We recommend shorter Pomodoro sessions today.'
            : stats.burnoutLevel === 'Moderate'
              ? '⚡ Moderate intensity. You are working hard, but make sure to include movement breaks.'
              : '💎 Optimal flow. You are managing your energy and focus perfectly. Keep this pace!'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood & Energy Chart */}
        <div className="bg-[var(--fa-bg-card)] rounded-xl p-5 border border-[var(--fa-border)]">
          <p className="text-sm font-bold text-white mb-6 uppercase tracking-widest text-[10px]">Wellbeing Trends (7 Days)</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: '#8892AA', fontSize: 10, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                domain={[0, 5]}
                tick={{ fill: '#8892AA', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1A2236', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                itemStyle={{ padding: '2px 0' }}
              />
              <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
              <Line
                name="Mood"
                type="monotone"
                dataKey="mood"
                stroke="#6C8EFF"
                strokeWidth={3}
                dot={{ r: 4, fill: '#6C8EFF', strokeWidth: 2, stroke: '#1A2236' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                name="Energy"
                type="monotone"
                dataKey="energy"
                stroke="#4FC3F7"
                strokeWidth={3}
                dot={{ r: 4, fill: '#4FC3F7', strokeWidth: 2, stroke: '#1A2236' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Focus Hours Chart */}
        <div className="bg-[var(--fa-bg-card)] rounded-xl p-5 border border-[var(--fa-border)]">
          <p className="text-sm font-bold text-white mb-6 uppercase tracking-widest text-[10px]">Deep Work Hours (7 Days)</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: '#8892AA', fontSize: 10, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8892AA', fontSize: 10 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#1A2236', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
              />
              <Bar dataKey="hours" radius={[6, 6, 0, 0]} barSize={24}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.hours > 4 ? '#6C8EFF' : '#B39DDB'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Focus DNA */}
      <div className="bg-gradient-to-br from-[#1A1E2E] to-[#2D243F] rounded-2xl p-6 border border-purple-500/20 shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-fa-brand/10 rounded-bl-full group-hover:scale-110 transition-transform"></div>
        <div className="mb-6 relative z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🧬 Focus DNA
          </h2>
          <p className="text-sm text-purple-200/70 mt-1 font-medium">Your personalised productivity fingerprint based on recent data.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          <div className="bg-black/20 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] text-purple-300/60 uppercase tracking-wider font-bold mb-1">Total Sessions</p>
            <p className="text-sm font-medium text-white">You have completed <span className="text-purple-400 font-bold">{data.sessions.length}</span> focus sessions in total.</p>
          </div>

          <div className="bg-black/20 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] text-purple-300/60 uppercase tracking-wider font-bold mb-1">Consistency</p>
            <p className="text-sm font-medium text-white">You logged activity on <span className="text-blue-400 font-bold">{chartData.filter(d => d.hours > 0).length}</span> out of the last 7 days.</p>
          </div>

          <div className="bg-black/20 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] text-purple-300/60 uppercase tracking-wider font-bold mb-1">Flow State</p>
            <p className="text-sm font-medium text-white">Your average session duration is <span className="text-emerald-400 font-bold">{data.sessions.length > 0 ? (data.sessions.reduce((a, b) => a + b.duration, 0) / data.sessions.length / 60).toFixed(0) : 0} minutes</span>.</p>
          </div>

          <div className="bg-black/20 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] text-purple-300/60 uppercase tracking-wider font-bold mb-1">Mood Correlation</p>
            <p className="text-sm font-medium text-white">Your energy is <span className="text-amber-400 font-bold">{Number(stats.avgEnergy) > Number(stats.avgMood) ? 'higher' : 'lower'}</span> than your mood on average.</p>
          </div>
        </div>
      </div>
    </div>
  );
}