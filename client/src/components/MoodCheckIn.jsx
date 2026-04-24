import React, { useState } from 'react';

const MoodCheckIn = ({ type, onSubmit, onSkip }) => {
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [note, setNote] = useState('');

  const title = type === 'before' ? "How are you feeling?" : "How was that session?";
  const buttonText = type === 'before' ? "Let's go!" : "Save & Continue";

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (type === 'after') {
      const existing = JSON.parse(localStorage.getItem('checkins') || '[]');
      existing.push({
        date: new Date().toISOString(),
        mood,
        energy,
        note
      });
      localStorage.setItem('checkins', JSON.stringify(existing));
    }
    
    onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#1A2236] border border-[rgba(255,255,255,0.07)] rounded-[20px] p-8 w-full max-w-[420px] shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-['Sora'] font-bold text-fa-text-primary text-center mb-8">{title}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div>
            <div className="flex justify-between text-2xl mb-4">
              <span>😔</span>
              <span className="text-sm font-medium text-[#6C8EFF] bg-[#6C8EFF]/10 px-3 py-1 rounded-full flex items-center">Mood: {mood}/10</span>
              <span>😊</span>
            </div>
            <input 
              type="range" min="1" max="10" 
              value={mood} 
              onChange={(e) => setMood(e.target.value)}
              className="w-full h-2 bg-[#2E3A55] rounded-lg appearance-none cursor-pointer accent-[#6C8EFF]"
            />
          </div>

          <div>
            <div className="flex justify-between text-2xl mb-4">
              <span>😴</span>
              <span className="text-sm font-medium text-[#6C8EFF] bg-[#6C8EFF]/10 px-3 py-1 rounded-full flex items-center">Energy: {energy}/10</span>
              <span>⚡</span>
            </div>
            <input 
              type="range" min="1" max="10" 
              value={energy} 
              onChange={(e) => setEnergy(e.target.value)}
              className="w-full h-2 bg-[#2E3A55] rounded-lg appearance-none cursor-pointer accent-[#6C8EFF]"
            />
          </div>

          <div>
            <label className="block text-sm text-fa-text-secondary mb-2">Anything on your mind? (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#0A0E1A] border border-[rgba(255,255,255,0.07)] rounded-xl px-4 py-3 text-sm text-fa-text-primary focus:outline-none focus:border-[#6C8EFF]"
              placeholder="e.g. Feeling a bit sleepy..."
            />
          </div>

          <div className="flex flex-col items-center space-y-4 pt-2">
            <button
              type="submit"
              className="w-full py-4 bg-[#6C8EFF] hover:bg-[#6C8EFF]/90 text-white rounded-xl font-semibold shadow-lg shadow-[#6C8EFF]/20 transition-all"
            >
              {buttonText}
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-fa-text-muted hover:text-fa-text-secondary transition-colors bg-transparent border-none"
            >
              Skip for now
            </button>
          </div>

        </form>
      </div>
      
      {/* Click outside listener area */}
      <div className="absolute inset-0 -z-10" onClick={onSkip}></div>
    </div>
  );
};

export default MoodCheckIn;
