import React, { useState } from 'react';
import PomodoroTimer from '../components/PomodoroTimer';
import TaskManager from '../components/TaskManager';
import MoodCheckIn from '../components/MoodCheckIn';
import AdaptiveNudgeSystem from '../components/AdaptiveNudgeSystem';
import { Loader2, Sparkles, X } from 'lucide-react';

const FocusSession = () => {
  const [activeTask, setActiveTask] = useState(null);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [modalType, setModalType] = useState('before'); // 'before' or 'after'
  const [startTimerCallback, setStartTimerCallback] = useState(null);
  const [aiDebrief, setAiDebrief] = useState(null);
  const [isDebriefLoading, setIsDebriefLoading] = useState(false);
  
  // Mock AI detected state for testing the nudge system
  const [systemState, setSystemState] = useState('focused');

  const handleStartTimer = (startCallback) => {
    setModalType('before');
    setStartTimerCallback(() => startCallback);
    setShowMoodModal(true);
  };

  const handleSessionComplete = () => {
    setModalType('after');
    setShowMoodModal(true);
  };

  const handleMoodSubmit = async (moodData) => {
    setShowMoodModal(false);
    if (modalType === 'before' && startTimerCallback) {
      startTimerCallback();
      setStartTimerCallback(null);
    } else if (modalType === 'after') {
      setIsDebriefLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/ai/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            duration: 25, // Mocked 25 mins
            task: activeTask?.title || 'Deep Work Session',
            focusScore: 8,
            moodBefore: 5,
            moodAfter: moodData?.mood || 7,
            states: { focused: 80, distracted: 10, stressed: 10 },
            nudges: 2,
            completed: true,
            notes: moodData?.note || ''
          })
        });
        const data = await response.json();
        setAiDebrief(data.message || data.error);
      } catch (err) {
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
          <p className="text-fa-text-secondary mt-1">Manual mode — dive into deep work.</p>
        </div>
        
        {/* Mock State Controller for testing Adaptive Nudge System */}
        <div className="flex items-center gap-3 bg-fa-bg-page border border-fa-border p-2 rounded-lg">
          <span className="text-xs text-fa-text-secondary font-medium uppercase tracking-wider">Test State:</span>
          <select 
            value={systemState}
            onChange={(e) => setSystemState(e.target.value)}
            className="bg-fa-bg-hover text-sm border-none rounded px-2 py-1 text-fa-text-primary focus:outline-none focus:ring-1 focus:ring-fa-brand"
          >
            <option value="focused">Focused</option>
            <option value="distracted">Distracted</option>
            <option value="stressed">Stressed</option>
            <option value="fatigued">Fatigued</option>
            <option value="away">Away</option>
          </select>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="w-full lg:w-[60%] flex flex-col min-h-0">
          <PomodoroTimer 
            activeTask={activeTask} 
            onStart={handleStartTimer} 
            onSessionComplete={handleSessionComplete} 
          />
        </div>
        
        <div className="w-full lg:w-[40%] flex flex-col min-h-0 h-[800px] lg:h-auto">
          <TaskManager onFocusTask={setActiveTask} />
        </div>
      </div>

      {showMoodModal && (
        <MoodCheckIn 
          type={modalType} 
          onSubmit={handleMoodSubmit} 
          onSkip={handleMoodSkip} 
        />
      )}

      {/* Adaptive Nudge System */}
      <AdaptiveNudgeSystem 
        currentState={systemState} 
        currentTask={activeTask?.title || 'your task'} 
      />

      {/* AI Post-Session Debrief Loading */}
      {isDebriefLoading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#1A2236] border border-fa-brand/30 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 size={40} className="text-fa-brand animate-spin" />
            <p className="text-white font-medium">Analysing your session...</p>
          </div>
        </div>
      )}

      {/* AI Post-Session Debrief Modal */}
      {aiDebrief && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-b from-[#1A1E2E] to-[#2D243F] border border-fa-brand/30 rounded-[20px] p-8 w-full max-w-[500px] shadow-[0_0_50px_rgba(111,76,255,0.15)] animate-in zoom-in-95 duration-300 relative overflow-hidden">
            
            <button 
              onClick={() => setAiDebrief(null)}
              className="absolute top-4 right-4 p-2 text-fa-text-muted hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors z-20"
            >
              <X size={18} />
            </button>

            <div className="absolute top-0 right-0 w-40 h-40 bg-fa-brand/10 rounded-bl-full z-0 blur-xl"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-fa-brand/20 flex items-center justify-center mb-6 border border-fa-brand/30 shadow-[0_0_15px_rgba(111,76,255,0.4)]">
                <Sparkles size={32} className="text-fa-brand" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-6 font-['Sora']">Session Debrief</h2>
              
              <div className="bg-black/20 border border-white/5 rounded-xl p-6 mb-8 text-left w-full shadow-inner">
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
