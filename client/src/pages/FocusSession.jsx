import { useState } from 'react';
import PomodoroTimer from '../components/PomodoroTimer';
import TaskManager from '../components/TaskManager';
import MoodCheckIn from '../components/MoodCheckIn';
import AdaptiveNudgeSystem from '../components/AdaptiveNudgeSystem';
import CameraMode from '../components/CameraMode';
import { useAI } from '../context/AIContext';
import { useTimer } from '../context/TimerContext';
import { Loader2, Sparkles, X } from 'lucide-react';

const FocusSession = () => {
  const [activeTask, setActiveTask] = useState(null);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const { isRunning } = useTimer();
  const [modalType, setModalType] = useState('before'); // 'before' or 'after'
  const [startTimerCallback, setStartTimerCallback] = useState(null);
  const [aiDebrief, setAiDebrief] = useState(null);
  const [isDebriefLoading, setIsDebriefLoading] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  
  const { getSessionBreakdown, resetSessionBreakdown } = useAI();

  // Camera state
  const [cameraState, setCameraState] = useState('focused');
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleStartTimer = (startCallback) => {
    setModalType('before');
    if (isCameraActive) resetSessionBreakdown();
    setStartTimerCallback(() => startCallback);
    setShowMoodModal(true);
  };

  const handleSessionComplete = (durationInSeconds) => {
    setSessionDuration(durationInSeconds || 0);
    setModalType('after');
    setShowMoodModal(true);
  };

  const handleMoodSubmit = async (moodData) => {
    setShowMoodModal(false);
    
    if (modalType === 'before') {
      if (startTimerCallback) {
        startTimerCallback(moodData.recommendation);
        setStartTimerCallback(null);
      }
    } else if (modalType === 'after') {
      setIsDebriefLoading(true);
      const breakdown = getSessionBreakdown();
      
      try {
        const response = await fetch('http://localhost:5000/api/ai/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            duration: Math.round(sessionDuration / 60),
            task: activeTask || 'Deep Work Session',
            focusScore: 8,
            moodBefore: 5,
            moodAfter: moodData?.mood || 7,
            states: { 
              focused: breakdown.focused_pct || 80, 
              distracted: breakdown.distracted_pct || 10, 
              stressed: breakdown.stressed_pct || 10,
              fatigued: breakdown.fatigued_pct || 0
            },
            nudges: 2,
            completed: true,
            notes: moodData?.note || ''
          })
        });
        const data = await response.json();
        setAiDebrief(data.message || data.error);
      } catch {
        setAiDebrief('Great session! Make sure to take a good break before your next one.');
      } finally {
        setIsDebriefLoading(false);
      }
    }
  };

  const handleMoodSkip = () => {
    setShowMoodModal(false);
    if (modalType === 'before' && startTimerCallback) {
      startTimerCallback();
      setStartTimerCallback(null);
    }
  };

  return (
    <div className="h-full flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <header className="flex items-center justify-between pb-6 mb-6 border-b border-fa-border flex-shrink-0">
        <div>
          <h2 className="text-2xl font-['Sora'] font-bold text-fa-text-primary">Focus Session</h2>
          <p className="text-fa-text-secondary mt-1">AI-powered deep work session.</p>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 mb-6 items-stretch">
        <div className="flex flex-col h-full">
          <PomodoroTimer 
            activeTask={activeTask} 
            cameraActive={isCameraActive}
            onStart={handleStartTimer} 
            onSessionComplete={handleSessionComplete} 
          />
        </div>
        
        <div className="flex flex-col h-full">
          <CameraMode 
            onStateChange={(state) => setCameraState(state)} 
            onToggle={(isActive) => setIsCameraActive(isActive)}
            isSessionActive={isRunning}
          />
        </div>
      </div>

      <div className="w-full mt-auto">
        <TaskManager onFocusTask={setActiveTask} />
      </div>

      {showMoodModal && (
        <MoodCheckIn 
          type={modalType} 
          onSubmit={handleMoodSubmit} 
          onSkip={handleMoodSkip} 
        />
      )}

      <AdaptiveNudgeSystem 
        currentState={cameraState} 
        currentTask={activeTask || 'your task'} 
      />

      {isDebriefLoading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1A2236] border border-fa-brand/30 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 size={40} className="text-fa-brand animate-spin" />
            <p className="text-white font-medium">Analysing your session...</p>
          </div>
        </div>
      )}

      {aiDebrief && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-b from-[#1A1E2E] to-[#2D243F] border border-fa-brand/30 rounded-[20px] p-8 w-full max-w-[500px] shadow-[0_0_50px_rgba(111,76,255,0.15)] animate-in zoom-in-95 duration-300 relative overflow-hidden">
            
            <button 
              onClick={() => setAiDebrief(null)}
              className="absolute top-4 right-4 p-2 text-fa-text-muted hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors z-20"
            >
              <X size={18} />
            </button>

            {sessionDuration < 600 && (
              <div className="absolute top-0 left-0 right-0 bg-amber-500/20 border-b border-amber-500/30 py-2 text-center z-20">
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center justify-center gap-2">
                  ⚠️ Short session — insights may be limited
                </p>
              </div>
            )}

            <div className="absolute top-0 right-0 w-40 h-40 bg-fa-brand/10 rounded-bl-full z-0 blur-xl"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center mt-4">
              <div className="w-16 h-16 rounded-full bg-fa-brand/20 flex items-center justify-center mb-6 border border-fa-brand/30 shadow-[0_0_15px_rgba(111,76,255,0.4)]">
                <Sparkles size={32} className="text-fa-brand" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-6 font-['Sora']">Session Debrief</h2>
              
              <div className="bg-black/20 border border-white/5 rounded-xl p-6 mb-8 text-left w-full shadow-inner overflow-y-auto max-h-[300px] custom-scrollbar">
                <p className="text-fa-text-primary text-sm leading-relaxed whitespace-pre-wrap">
                  {aiDebrief}
                </p>
              </div>

              <button
                onClick={() => setAiDebrief(null)}
                className="w-full py-3.5 bg-fa-brand hover:bg-fa-brand/90 text-white rounded-xl font-bold shadow-lg shadow-fa-brand/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Close & Rest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusSession;
