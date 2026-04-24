import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const PomodoroTimer = ({ activeTask, onStart, onSessionComplete }) => {
  const [mode, setMode] = useState('Classic');
  const [phase, setPhase] = useState('Work');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [customWork, setCustomWork] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);

  const initialTimeLeft = useRef(25 * 60);
  const endTimeRef = useRef(null);
  const phaseRef = useRef('Work');
  const modeRef = useRef('Classic');
  const customWorkRef = useRef(25);
  const customBreakRef = useRef(5);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { customWorkRef.current = customWork; }, [customWork]);
  useEffect(() => { customBreakRef.current = customBreak; }, [customBreak]);

  const MODES = {
    Classic: { work: 25 * 60, break: 5 * 60 },
    'Deep Work': { work: 50 * 60, break: 10 * 60 },
  };

  const handlePhaseEnd = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null;

    if (phaseRef.current === 'Work') {
      setSessionsCompleted((prev) => prev + 1);
      setShowCongrats(true);
      setTimeout(() => setShowCongrats(false), 3000);
      if (onSessionComplete) onSessionComplete();
      const breakTime = modeRef.current === 'Custom'
        ? customBreakRef.current * 60
        : MODES[modeRef.current].break;
      setPhase('Break');
      setTimeLeft(breakTime);
      initialTimeLeft.current = breakTime;
    } else {
      const workTime = modeRef.current === 'Custom'
        ? customWorkRef.current * 60
        : MODES[modeRef.current].work;
      setPhase('Work');
      setTimeLeft(workTime);
      initialTimeLeft.current = workTime;
    }
  }, [onSessionComplete]);

  // Main countdown interval
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + timeLeft * 1000;
      }
      interval = setInterval(() => {
        const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          handlePhaseEnd();
        } else {
          setTimeLeft(remaining);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isRunning, handlePhaseEnd]);

  // Snap timer when returning to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning && endTimeRef.current) {
        const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          handlePhaseEnd();
        } else {
          setTimeLeft(remaining);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning, handlePhaseEnd]);

  // Update document title
  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.title = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} - Lockdin.AI`;
  }, [timeLeft]);

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
    endTimeRef.current = null;
    setPhase('Work');
    const workTime = mode === 'Custom' ? customWork * 60 : MODES[mode].work;
    setTimeLeft(workTime);
    initialTimeLeft.current = workTime;
  };

  const changeMode = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    endTimeRef.current = null;
    setPhase('Work');
    const workTime = newMode === 'Custom' ? customWork * 60 : MODES[newMode]?.work || customWork * 60;
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
  const textColorClass = phase === 'Work' ? 'text-[#4FC3F7]' : 'text-[#B39DDB]';
  const bgProgressClass = phase === 'Work' ? 'bg-[#4FC3F7]' : 'bg-[#B39DDB]';

  const getModeLabel = (m) => {
    if (m === 'Classic') return 'Classic · 25m work / 5m break';
    if (m === 'Deep Work') return 'Deep Work · 50m work / 10m break';
    return 'Custom';
  };

  return (
    <div className="bg-[#1A2236] border border-[rgba(255,255,255,0.07)] rounded-[16px] p-8 flex flex-col items-center relative overflow-hidden">

      <div className="flex space-x-2 bg-fa-bg-page p-1 rounded-full mb-3">
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

      {mode !== 'Custom' && (
        <p className="text-xs text-fa-text-muted mb-6">{getModeLabel(mode)}</p>
      )}

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

      <div className="relative mb-6 text-center">
        <h1 className="font-['JetBrains_Mono',monospace] text-7xl font-light text-[#F0F4FF] tracking-tight mb-2">
          {formatTime(timeLeft)}
        </h1>
        <div className={`text-xs font-semibold tracking-widest uppercase ${textColorClass}`}>
          {mode} · SESSION {sessionsCompleted + 1} {phase === 'Break' ? '· BREAK TIME' : '· WORK'}
        </div>
      </div>

      <div className="w-full max-w-xs h-1 bg-fa-bg-page rounded-full overflow-hidden mb-10">
        <div
          className={`h-full ${bgProgressClass} transition-all duration-500 ease-linear`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

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

      {showCongrats && (
        <div className="absolute top-8 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-3 rounded-full animate-in fade-in slide-in-from-top-4 shadow-lg text-sm font-medium">
          Session complete! Take a break.
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;