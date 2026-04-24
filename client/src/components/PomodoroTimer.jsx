import { useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useTimer } from '../context/TimerContext';

const PomodoroTimer = ({ activeTask, cameraActive, onStart, onSessionComplete }) => {
  const {
    mode, phase, isRunning, timeLeft, customWork, customBreak,
    sessionsCompleted, showCongrats, initialTimeLeft,
    setCustomWork, setCustomBreak,
    startTimer, pauseTimer, resetTimer, changeMode,
    onSessionCompleteRef, finishSessionEarly
  } = useTimer();

  useEffect(() => {
    onSessionCompleteRef.current = () => {
      // Pass the actual duration spent in work phase
      const totalWorkTime = mode === 'Custom' 
        ? customWork * 60 
        : (mode === 'Deep Work' ? 50 * 60 : 25 * 60);
      const durationSpent = totalWorkTime - timeLeft;
      if (onSessionComplete) onSessionComplete(durationSpent);
    };
  }, [onSessionComplete, onSessionCompleteRef, mode, customWork, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercentage = ((initialTimeLeft.current - timeLeft) / initialTimeLeft.current) * 100;
  const textColorClass = phase === 'Work' ? 'text-[#4FC3F7]' : 'text-[#B39DDB]';
  const bgProgressClass = phase === 'Work' ? 'bg-[#4FC3F7]' : 'bg-[#B39DDB]';

  const getModeLabel = (m) => {
    if (m === 'Classic') return 'Classic · 25m work / 5m break';
    if (m === 'Deep Work') return 'Deep Work · 50m work / 10m break';
    return 'Custom';
  };

  const handleStartClick = () => {
    if (!cameraActive) return;
    const startWithRecommendation = (recommendedMode) => {
      if (recommendedMode === 'Classic') changeMode('Classic');
      startTimer();
    };
    if (onStart) onStart(startWithRecommendation);
    else startTimer();
  };

  useEffect(() => {
    if (isRunning && !cameraActive) {
      pauseTimer();
    }
  }, [isRunning, cameraActive, pauseTimer]);

  return (
    <div className="bg-[#1A2236] border border-[rgba(255,255,255,0.07)] h-full rounded-[16px] p-8 flex flex-col items-center relative overflow-hidden shadow-xl">
      <div className="flex space-x-2 bg-fa-bg-page p-1 rounded-full mb-3">
        {['Classic', 'Deep Work', 'Custom'].map((m) => (
          <button
            key={m}
            onClick={() => changeMode(m)}
            disabled={isRunning}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              mode === m ? 'bg-fa-brand text-white' : 'text-fa-text-secondary hover:text-fa-text-primary'
            } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode !== 'Custom' && (
        <p className="text-xs text-fa-text-muted mb-6 uppercase tracking-widest font-bold">{getModeLabel(mode)}</p>
      )}

      {mode === 'Custom' && (
        <div className="flex space-x-4 mb-6">
          <div className="flex flex-col items-center">
            <label className="text-[10px] font-black text-fa-text-secondary mb-1 uppercase tracking-tighter">Work (min)</label>
            <input
              type="number"
              value={customWork}
              onChange={(e) => setCustomWork(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={isRunning}
              className="w-16 bg-fa-bg-page border border-fa-border rounded-lg text-center text-fa-text-primary py-1 outline-none focus:border-fa-brand disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col items-center">
            <label className="text-[10px] font-black text-fa-text-secondary mb-1 uppercase tracking-tighter">Break (min)</label>
            <input
              type="number"
              value={customBreak}
              onChange={(e) => setCustomBreak(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={isRunning}
              className="w-16 bg-fa-bg-page border border-fa-border rounded-lg text-center text-fa-text-primary py-1 outline-none focus:border-fa-brand disabled:opacity-50"
            />
          </div>
        </div>
      )}

      <div className="relative mb-6 text-center mt-4">
        <h1 className="font-['JetBrains_Mono',monospace] text-8xl font-light text-white tracking-tighter mb-2">
          {formatTime(timeLeft)}
        </h1>
        <div className={`text-[10px] font-black tracking-[0.2em] uppercase ${textColorClass}`}>
          {phase === 'Break' ? '· Recharge ·' : `· Focus Session ${sessionsCompleted + 1} ·`}
        </div>
      </div>

      <div className="w-full max-w-sm h-1.5 bg-white/5 rounded-full overflow-hidden mb-12">
        <div
          className={`h-full ${bgProgressClass} transition-all duration-500 ease-linear shadow-[0_0_10px_rgba(111,76,255,0.5)]`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex flex-col items-center gap-4 w-full max-w-xs z-10">
        <div className="flex items-center space-x-4 w-full">
          {!isRunning ? (
            <button
              onClick={handleStartClick}
              disabled={!cameraActive}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-2xl font-bold transition-all ${
                cameraActive 
                  ? 'bg-fa-brand text-white shadow-lg shadow-fa-brand/30 hover:scale-[1.02] active:scale-100' 
                  : 'bg-white/5 text-fa-text-muted cursor-not-allowed border border-white/5'
              }`}
            >
              <Play size={20} fill="currentColor" />
              <span>Start Session</span>
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="flex-1 flex items-center justify-center space-x-2 py-4 border-2 border-fa-brand/30 text-fa-brand rounded-2xl hover:bg-fa-brand/5 transition-all font-bold"
            >
              <Pause size={20} fill="currentColor" />
              <span>Pause</span>
            </button>
          )}
          <button
            onClick={resetTimer}
            className="w-14 h-14 flex items-center justify-center text-fa-text-muted hover:text-white hover:bg-white/5 rounded-2xl transition-all border border-white/5"
            title="Reset Timer"
          >
            <RotateCcw size={22} />
          </button>
        </div>

        {isRunning && phase === 'Work' && (
          <button
            onClick={finishSessionEarly}
            className="w-full py-3 text-xs font-black uppercase tracking-widest text-fa-text-secondary hover:text-white transition-colors"
          >
            Finish Session Early
          </button>
        )}

        {!cameraActive && (
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest animate-pulse text-center">
            {isRunning ? '⚠️ Session paused — camera disconnected' : '⚠️ Enable camera to start session'}
          </p>
        )}
      </div>

      <div className="w-full border-t border-white/5 pt-8 mt-auto">
        {activeTask && (
          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 text-center mb-4">
            <span className="text-[10px] font-black text-fa-text-secondary uppercase tracking-widest block mb-1">Active Target</span>
            <span className="text-sm font-bold text-white truncate block">{activeTask}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
          <span className="text-fa-text-secondary">Completed Sessions</span>
          <span className="text-fa-brand bg-fa-brand/10 px-2 py-0.5 rounded">{sessionsCompleted}</span>
        </div>
      </div>

      {showCongrats && (
        <div className="absolute top-12 bg-emerald-500 text-white px-6 py-2 rounded-full animate-in fade-in slide-in-from-top-4 shadow-xl text-xs font-black uppercase tracking-widest">
          Mission Accomplished!
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;