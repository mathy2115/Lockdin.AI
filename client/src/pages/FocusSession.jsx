import React, { useState } from 'react';
import PomodoroTimer from '../components/PomodoroTimer';
import TaskManager from '../components/TaskManager';
import MoodCheckIn from '../components/MoodCheckIn';
import AdaptiveNudgeSystem from '../components/AdaptiveNudgeSystem';

const FocusSession = () => {
  const [activeTask, setActiveTask] = useState(null);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [modalType, setModalType] = useState('before'); // 'before' or 'after'
  const [startTimerCallback, setStartTimerCallback] = useState(null);
  
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

  const handleMoodSubmit = () => {
    setShowMoodModal(false);
    if (modalType === 'before' && startTimerCallback) {
      startTimerCallback();
      setStartTimerCallback(null);
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
    </div>
  );
};

export default FocusSession;
