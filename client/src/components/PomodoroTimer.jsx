import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const PomodoroTimer = ({ activeTask, onStart, onSessionComplete }) => {
  const [mode, setMode] = useState('Classic'); // Classic, Deep Work, Custom
  const [phase, setPhase] = useState('Work'); // Work, Break
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [customWork, setCustomWork] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);

  const initialTimeLeft = useRef(25 * 60);

  const MODES = {
    Classic: { work: 25 * 60, break: 5 * 60 },
    'Deep Work': { work: 50 * 60, break: 10 * 60 },
  };

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      handlePhaseEnd();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    // Update document title
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.title = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} - Lockdin.AI`;
  }, [timeLeft]);

  const handlePhaseEnd = () => {
    setIsRunning(false);
    if (phase === 'Work') {
      setSessionsCompleted((prev) => prev + 1);
      setShowCongrats(true);
      setTimeout(() => setShowCongrats(false), 3000);
      
      if (onSessionComplete) onSessionComplete();

      setPhase('Break');
      const breakTime = mode === 'Custom' ? customBreak * 60 : MODES[mode].break;
      setTimeLeft(breakTime);
      initialTimeLeft.current = breakTime;
    } else {
      setPhase('Work');
      const workTime = mode === 'Custom' ? customWork * 60 : MODES[mode].work;
      setTimeLeft(workTime);
      initialTimeLeft.current = workTime;
    }
  };

  const startTimer = () => {
    if (!isRunning && phase === 'Work' && timeLeft === initialTimeLeft.current) {
      if (onStart) onStart(() => setIsRunning(true));
      else setIsRunning(true);
    } else {
      setIsRunning(true);
    }
  };

  const pauseTimer = () => setIsRunning(false);

  const resetTimer = () => {
    setIsRunning(false);
    setPhase('Work');
    const workTime = mode === 'Custom' ? customWork * 60 : MODES[mode].work;
    setTimeLeft(workTime);
    initialTimeLeft.current = workTime;
  };

  const changeMode = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    setPhase('Work');
    const workTime = newMode === 'Custom' ? customWork * 60 : MODES[newMode].work;
    setTimeLeft(workTime);
    initialTimeLeft.current = workTime;
  };

  useEffect(() => {
    if (mode === 'Custom' && !isRunning && phase === 'Work') {
      const workTime = customWork * 60;
      setTimeLeft(workTime);
      initialTimeLeft.current = workTime;
    }
  }, [customWork, mode, isRunning, phase]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((initialTimeLeft.current - timeLeft) / initialTimeLeft.current) * 100;
  const accentColor = phase === 'Work' ? '#4FC3F7' : '#B39DDB';
  const textColorClass = phase === 'Work' ? 'text-[#4FC3F7]' : 'text-[#B39DDB]';
  const bgProgressClass = phase === 'Work' ? 'bg-[#4FC3F7]' : 'bg-[#B39DDB]';

  return (
    <div className="bg-[#1A2236] border border-[rgba(255,255,255,0.07)] rounded-[16px] p-8 flex flex-col items-center relative overflow-hidden">
      
      {/* Mode Selector */}
      <div className="flex space-x-2 bg-fa-bg-page p-1 rounded-full mb-8">
        {['Classic', 'Deep Work', 'Custom'].map((m) => (
          <button
            key={m}
            onClick={() => changeMode(m)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              mode === m ? 'bg-fa-brand text-white' : 'text-fa-text-secondary hover:text-fa-text-primary'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === 'Custom' && (
        <div className="flex space-x-4 mb-6">
          <div className="flex flex-col items-center">
            <label className="text-xs text-fa-text-muted mb-1">Work (min)</label>
            <input 
              type="number" 
              value={customWork} 
              onChange={(e) => setCustomWork(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 bg-fa-bg-page border border-fa-border rounded-lg text-center text-fa-text-primary py-1 outline-none focus:border-fa-brand"
            />
          </div>
          <div className="flex flex-col items-center">
            <label className="text-xs text-fa-text-muted mb-1">Break (min)</label>
            <input 
              type="number" 
              value={customBreak} 
              onChange={(e) => setCustomBreak(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 bg-fa-bg-page border border-fa-border rounded-lg text-center text-fa-text-primary py-1 outline-none focus:border-fa-brand"
            />
          </div>
        </div>
      )}

      {/* Timer Display */}
      <div className="relative mb-6 text-center">
        <h1 className="font-['JetBrains_Mono',monospace] text-7xl font-light text-[#F0F4FF] tracking-tight mb-2">
          {formatTime(timeLeft)}
        </h1>
        <div className={`text-xs font-semibold tracking-widest uppercase ${textColorClass}`}>
          {mode} · SESSION {sessionsCompleted + 1} {phase === 'Break' && '(BREAK)'}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs h-1 bg-fa-bg-page rounded-full overflow-hidden mb-10">
        <div 
          className={`h-full ${bgProgressClass} transition-all duration-1000 ease-linear`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-4 mb-8 z-10">
        {!isRunning ? (
          <button 
            onClick={startTimer}
            className="flex items-center justify-center space-x-2 w-32 py-3 bg-fa-brand text-white rounded-xl shadow-lg shadow-fa-brand/20 hover:bg-fa-brand/90 transition-all font-medium"
          >
            <Play size={18} fill="currentColor" />
            <span>Start</span>
          </button>
        ) : (
          <button 
            onClick={pauseTimer}
            className="flex items-center justify-center space-x-2 w-32 py-3 border border-fa-brand text-fa-brand rounded-xl hover:bg-fa-brand/10 transition-all font-medium bg-transparent"
          >
            <Pause size={18} fill="currentColor" />
            <span>Pause</span>
          </button>
        )}
        <button 
          onClick={resetTimer}
          className="flex items-center justify-center w-12 h-12 text-fa-text-muted hover:text-fa-text-secondary hover:bg-fa-bg-page rounded-xl transition-all bg-transparent border border-transparent"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Stats & Active Task */}
      <div className="w-full border-t border-fa-border pt-6 mt-auto">
        <div className="flex justify-between items-center text-sm mb-4">
          <span className="text-fa-text-muted">Sessions today:</span>
          <span className="text-fa-text-primary font-medium">{sessionsCompleted}</span>
        </div>
        
        {activeTask && (
          <div className="bg-fa-bg-page p-4 rounded-xl border border-fa-border text-left">
            <span className="text-xs text-fa-text-muted block mb-1">Currently working on:</span>
            <span className="text-sm font-medium text-fa-text-primary truncate block">{activeTask}</span>
          </div>
        )}
      </div>

      {/* Congrats Toast */}
      {showCongrats && (
        <div className="absolute top-8 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-3 rounded-full animate-in fade-in slide-in-from-top-4 shadow-lg text-sm font-medium">
          Session complete! Take a break.
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;
