import { useLocation, useNavigate } from 'react-router-dom';
import { Pause, Play, Timer } from 'lucide-react';
import { useTimer } from '../context/TimerContext';

const PomodoroMiniWidget = () => {
  const { isRunning, timeLeft, phase, pauseTimer, startTimer } = useTimer();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isRunning || location.pathname === '/focus') return null;

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const isWork = phase === 'Work';

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border border-[rgba(255,255,255,0.08)] bg-[#1A2236] cursor-pointer"
      onClick={() => navigate('/focus')}
    >
      <Timer size={14} className={isWork ? 'text-[#4FC3F7]' : 'text-[#B39DDB]'} />
      <div className="flex flex-col leading-tight">
        <span className="font-['JetBrains_Mono',monospace] text-sm font-semibold text-[#F0F4FF]">
          {formatted}
        </span>
        <span className={`text-[10px] uppercase tracking-widest font-semibold ${isWork ? 'text-[#4FC3F7]' : 'text-[#B39DDB]'}`}>
          {phase}
        </span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          isRunning ? pauseTimer() : startTimer();
        }}
        className="ml-1 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-fa-text-muted hover:text-white"
      >
        {isRunning ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
      </button>
    </div>
  );
};

export default PomodoroMiniWidget;