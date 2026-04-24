import { useState } from 'react';
import axios from 'axios';

const MOOD_OPTIONS = [
  { emoji: '😞', label: 'Rough', value: 1 },
  { emoji: '😕', label: 'Low', value: 2 },
  { emoji: '😐', label: 'Okay', value: 3 },
  { emoji: '🙂', label: 'Good', value: 4 },
  { emoji: '😄', label: 'Great', value: 5 },
];

const ENERGY_OPTIONS = [
  { emoji: '🪫', label: 'Drained', value: 1 },
  { emoji: '😴', label: 'Tired', value: 2 },
  { emoji: '😑', label: 'Okay', value: 3 },
  { emoji: '⚡', label: 'Alert', value: 4 },
  { emoji: '🔥', label: 'Charged', value: 5 },
];

const STRESS_OPTIONS = [
  { emoji: '😰', label: 'Overwhelmed', value: 1 },
  { emoji: '😟', label: 'High', value: 2 },
  { emoji: '😐', label: 'Okay', value: 3 },
  { emoji: '🙂', label: 'Low', value: 4 },
  { emoji: '😌', label: 'None', value: 5 },
];

const EmojiSelector = ({ options, selected, onSelect }) => (
  <div className="flex justify-between gap-2">
    {options.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onSelect(opt.value)}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl flex-1 transition-all border ${
          selected === opt.value
            ? 'bg-[#6C8EFF]/20 border-[#6C8EFF]'
            : 'border-transparent hover:bg-[#1A2236]'
        }`}
      >
        <span className="text-2xl">{opt.emoji}</span>
        <span className="text-[10px] text-fa-text-secondary">{opt.label}</span>
      </button>
    ))}
  </div>
);

const MoodCheckIn = ({ type, onSubmit, onSkip }) => {
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [stress, setStress] = useState(null);
  const [note, setNote] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  const title = type === 'before' ? "How are you feeling?" : "How was that session?";
  const buttonText = type === 'before' ? "Let's Go →" : "Save & Continue";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (type === 'before' && !showWarning) {
      const totalScore = (mood || 0) + (energy || 0) + (stress || 0);
      if (totalScore <= 7) {
        setShowWarning(true);
        return;
      }
    }

    const token = localStorage.getItem('token');
    const moodData = { mood, energy, stress, note };

    try {
      await axios.post(
        'http://localhost:5000/api/mood',
        moodData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Mood log failed:', err);
    }

    // Save to localStorage for Dashboard
    const logs = JSON.parse(localStorage.getItem('moodLogs') || '[]');
    logs.push({
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      mood: mood,
      energy: energy,
      stress: stress,
      timestamp: Date.now()
    });
    localStorage.setItem('moodLogs', JSON.stringify(logs));
    window.dispatchEvent(new Event('wellnessDataUpdate'));

    onSubmit(moodData);
  };

  const canSubmit = mood !== null && energy !== null && stress !== null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-[#1A2236] border border-[rgba(255,255,255,0.07)] rounded-[20px] p-8 w-full max-w-[460px] shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {showWarning ? (
          <div className="flex flex-col items-center text-center gap-4">
            <span className="text-5xl">😔</span>
            <h2 className="text-xl font-bold text-white font-['Sora']">
              You seem drained
            </h2>
            <p className="text-sm text-fa-text-secondary leading-relaxed">
              Based on your mood, energy and stress levels, a long focus session might do more harm than good. We recommend starting with a Classic 25-min session instead.
            </p>
            <div className="flex flex-col w-full gap-3 mt-4">
              <button
                onClick={() => { setShowWarning(false); onSubmit({ mood, energy, stress, note, recommendation: 'Classic' }); }}
                className="w-full py-4 bg-fa-brand text-white rounded-xl font-bold shadow-lg shadow-fa-brand/20"
              >
                Start Classic Session
              </button>
              <button
                onClick={() => { setShowWarning(false); onSubmit({ mood, energy, stress, note }); }}
                className="w-full py-3 text-fa-text-secondary rounded-xl text-sm font-semibold hover:text-white transition-colors"
              >
                I'll push through anyway
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-['Sora'] font-bold text-fa-text-primary text-center mb-8">
              {title}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <p className="text-sm text-fa-text-secondary mb-3">Mood</p>
                <EmojiSelector options={MOOD_OPTIONS} selected={mood} onSelect={setMood} />
              </div>

              <div>
                <p className="text-sm text-fa-text-secondary mb-3">Energy</p>
                <EmojiSelector options={ENERGY_OPTIONS} selected={energy} onSelect={setEnergy} />
              </div>

              <div>
                <p className="text-sm text-fa-text-secondary mb-3">Stress</p>
                <EmojiSelector options={STRESS_OPTIONS} selected={stress} onSelect={setStress} />
              </div>

              <div>
                <label className="block text-sm text-fa-text-secondary mb-2">
                  Anything on your mind? (optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-[#0A0E1A] border border-[rgba(255,255,255,0.07)] rounded-xl px-4 py-3 text-sm text-fa-text-primary focus:outline-none focus:border-[#6C8EFF]"
                  placeholder="e.g. Feeling a bit sleepy..."
                />
              </div>

              <div className="flex flex-col items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`w-full py-4 rounded-xl font-semibold transition-all ${
                    canSubmit
                      ? 'bg-[#6C8EFF] hover:bg-[#6C8EFF]/90 text-white shadow-lg shadow-[#6C8EFF]/20'
                      : 'bg-[#6C8EFF]/30 text-white/40 cursor-not-allowed'
                  }`}
                >
                  {buttonText}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default MoodCheckIn;