import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const TimerContext = createContext(null);

const MODES = {
  Classic: { work: 25 * 60, break: 5 * 60 },
  'Deep Work': { work: 50 * 60, break: 10 * 60 },
};

export const TimerProvider = ({ children }) => {
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
  const onSessionCompleteRef = useRef(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { customWorkRef.current = customWork; }, [customWork]);
  useEffect(() => { customBreakRef.current = customBreak; }, [customBreak]);

  const handlePhaseEnd = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null;

    if (phaseRef.current === 'Work') {
      setSessionsCompleted((prev) => prev + 1);
      setShowCongrats(true);
      setTimeout(() => setShowCongrats(false), 3000);
      if (onSessionCompleteRef.current) onSessionCompleteRef.current();
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
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
    }
    const interval = setInterval(() => {
      const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
      if (remaining <= 0) handlePhaseEnd();
      else setTimeLeft(remaining);
    }, 500);
    return () => clearInterval(interval);
  }, [isRunning, handlePhaseEnd]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning && endTimeRef.current) {
        const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);
        if (remaining <= 0) handlePhaseEnd();
        else setTimeLeft(remaining);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning, handlePhaseEnd]);

  useEffect(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    document.title = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} - Lockdin.AI`;
  }, [timeLeft]);

  useEffect(() => {
    if (mode === 'Custom' && !isRunning && phase === 'Work') {
      const workTime = customWork * 60;
      setTimeout(() => setTimeLeft(workTime), 0);
      initialTimeLeft.current = workTime;
    }
  }, [customWork, mode, isRunning, phase]);

  const startTimer = (onStart) => {
    if (!isRunning && phase === 'Work' && timeLeft === initialTimeLeft.current) {
      if (onStart) onStart(() => setIsRunning(true));
      else setIsRunning(true);
    } else {
      setIsRunning(true);
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
    endTimeRef.current = null;
  };

  const resetTimer = () => {
    setIsRunning(false);
    endTimeRef.current = null;
    setPhase('Work');
    const workTime = modeRef.current === 'Custom'
      ? customWorkRef.current * 60
      : MODES[modeRef.current]?.work || 25 * 60;
    setTimeLeft(workTime);
    initialTimeLeft.current = workTime;
  };

  const changeMode = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    endTimeRef.current = null;
    setPhase('Work');
    const workTime = newMode === 'Custom'
      ? customWork * 60
      : MODES[newMode]?.work || customWork * 60;
    setTimeLeft(workTime);
    initialTimeLeft.current = workTime;
  };

  const finishSessionEarly = () => {
    if (phase === 'Work' && isRunning) {
      handlePhaseEnd();
    }
  };

  return (
    <TimerContext.Provider value={{
      mode, phase, isRunning, timeLeft, customWork, customBreak,
      sessionsCompleted, showCongrats, initialTimeLeft,
      setCustomWork, setCustomBreak,
      startTimer, pauseTimer, resetTimer, changeMode,
      onSessionCompleteRef, finishSessionEarly
    }}>
      {children}
    </TimerContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTimer = () => useContext(TimerContext);