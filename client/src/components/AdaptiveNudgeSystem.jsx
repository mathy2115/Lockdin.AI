import { useState, useEffect, useRef } from 'react';

const DEFAULT_SETTINGS = {
  frequency: 'Medium', // Low (10m), Medium (5m), High (2m)
  style: 'Gentle', // Silent, Gentle, Vocal
  breathing: true,
  stretch: true,
  hydration: true,
  encouragement: true,
};

const FREQUENCY_MAP = {
  Low: 10 * 60 * 1000,
  Medium: 5 * 60 * 1000,
  High: 2 * 60 * 1000,
};

export default function AdaptiveNudgeSystem({ currentState = 'focused', currentTask = 'Work' }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('nudgeSettings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [encouragementMessage, setEncouragementMessage] = useState('');
  const [showHydration, setShowHydration] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false); // To dismiss the current popup

  // Refs for tracking
  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);
  const focusStartTimeRef = useRef(null);
  const intervalRef = useRef(null);
  // Debounced state to prevent flicker on away detection
  const [stableState, setStableState] = useState(currentState);
  const awayTimerRef = useRef(null);
  const stateStartTimeRef = useRef(Date.now());
  const [activeNudge, setActiveNudge] = useState(null); // 'breathing', 'stretch', 'away_return'

  useEffect(() => {
    if (currentState === 'away') {
      // Only set away after 3 seconds of continuous away detection
      awayTimerRef.current = setTimeout(() => {
        setStableState('away');
      }, 3000);
    } else {
      // Any non-away state clears the timer and updates immediately
      clearTimeout(awayTimerRef.current);
      setTimeout(() => setStableState(currentState), 0);
    }
    return () => clearTimeout(awayTimerRef.current);
  }, [currentState]);

  // Save settings when they change
  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('nudgeSettings', JSON.stringify(newSettings));
  };

  const toggleSetting = (key) => {
    updateSettings({ ...settings, [key]: !settings[key] });
  };

  // Audio utility
  const playTone = (frequency, waveType = 'sine', duration = 0) => {
    if (settings.style === 'Silent') return;

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      stopTone(); // Stop existing tone

      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = waveType;
      osc.frequency.value = frequency;

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Fade in
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 1);

      osc.start();

      if (duration > 0) {
        // Fade out
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime + duration - 1);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
        osc.stop(ctx.currentTime + duration);
      }

      oscillatorRef.current = { osc, gainNode };
    } catch (e) {
      console.error('Audio playback failed', e);
    }
  };

  const stopTone = () => {
    if (oscillatorRef.current && audioCtxRef.current) {
      try {
        const { osc, gainNode } = oscillatorRef.current;
        gainNode.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 0.5);
        osc.stop(audioCtxRef.current.currentTime + 0.5);
      } catch {
        // Ignore errors if already stopped
      }
      oscillatorRef.current = null;
    }
  };

  const speakNudge = (text) => {
    if (settings.style === 'Vocal' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower, calmer
      window.speechSynthesis.speak(utterance);
    }
  };

  // Fetch encouragement
  const fetchEncouragement = async (task) => {
    if (!settings.encouragement) return;
    try {
      // Mocking the API response since it might not exist yet
      setTimeout(() => setEncouragementMessage(`You've got this! Keep tackling ${task}.`), 0);

      const response = await fetch('/api/nudge/encourage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskName: task }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.message) setEncouragementMessage(data.message);
      }
    } catch (error) {
      console.error('Failed to fetch encouragement:', error);
    }
  };

  // Nudge Timers Effect
  useEffect(() => {
    stateStartTimeRef.current = Date.now();
    setActiveNudge(null);
    setIsDismissed(false);
    stopTone();
    window.speechSynthesis?.cancel();

    const interval = setInterval(() => {
      const elapsed = Date.now() - stateStartTimeRef.current;

      if (currentState === 'stressed' && elapsed > 60000 && !activeNudge && !isDismissed) {
        if (settings.breathing) {
          setActiveNudge('breathing');
          playTone(432, 'sine');
          speakNudge("Let's take a deep breath. Inhale for 4 seconds, hold for 7, exhale for 8.");
          fetchEncouragement(currentTask);
        }
      }

      if (currentState === 'fatigued' && elapsed > 90000 && !activeNudge && !isDismissed) {
        if (settings.stretch) {
          setActiveNudge('stretch');
          playTone(417, 'triangle', 2);
          speakNudge("You seem tired. Time for a quick stretch break.");
        }
      }

      if (stableState === 'away' && elapsed > 180000 && !activeNudge) {
        setActiveNudge('away_return');
        speakNudge("You've been away for a while. Everything okay?");
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      stopTone();
    };
  }, [currentState, stableState, settings, currentTask, activeNudge, isDismissed]);

  // Hydration tracking effect
  useEffect(() => {
    if (!settings.hydration) return;

    const checkHydration = () => {
      if (currentState === 'focused' && focusStartTimeRef.current) {
        const elapsed = Date.now() - focusStartTimeRef.current;
        if (elapsed > 90 * 60 * 1000) { // 90 mins
          setShowHydration(true);
          speakNudge("You've been focused for 90 minutes. Time for a water break!");
          focusStartTimeRef.current = Date.now(); // reset timer
        }
      }
    };

    const interval = setInterval(checkHydration, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [currentState, settings.hydration]);

  // Periodic Nudge Logic (Frequency based)
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (currentState === 'focused') return; // Only periodic nudges for non-focused states if needed, or based on logic.
    // In this implementation, the states themselves act as the nudge. The frequency could control how often we re-trigger it.

    const freqMs = FREQUENCY_MAP[settings.frequency];
    intervalRef.current = setInterval(() => {
      // Re-trigger current state nudges if not dismissed
      if (!isDismissed) {
        // Optionally replay sounds or TTS here based on frequency
      }
    }, freqMs);

    return () => clearInterval(intervalRef.current);
  }, [settings.frequency, currentState, isDismissed]);

  const renderSettings = () => {
    if (!showSettings) return null;
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-[#FFFDF4] border border-[#E8D5A3] rounded-xl p-6 w-full max-w-md shadow-2xl animate-fade-in text-[#1A1A2E]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Nudge Settings</h2>
            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-[#1A1A2E]">&times;</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500">Nudge Frequency</label>
              <select
                value={settings.frequency}
                onChange={(e) => updateSettings({ ...settings, frequency: e.target.value })}
                className="w-full bg-white border border-[#E8D5A3] rounded px-3 py-2 text-sm focus:outline-none focus:border-fa-brand"
              >
                <option value="Low">Low (Every 10 mins)</option>
                <option value="Medium">Medium (Every 5 mins)</option>
                <option value="High">High (Every 2 mins)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-500">Nudge Style</label>
              <select
                value={settings.style}
                onChange={(e) => updateSettings({ ...settings, style: e.target.value })}
                className="w-full bg-white border border-[#E8D5A3] rounded px-3 py-2 text-sm focus:outline-none focus:border-fa-brand"
              >
                <option value="Silent">Silent (Badge only)</option>
                <option value="Gentle">Gentle (Popup & Tones)</option>
                <option value="Vocal">Vocal (Read aloud)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-fa-border">
              <h3 className="text-sm font-semibold mb-3 text-gray-500">Nudge Types</h3>
              {[
                { key: 'breathing', label: 'Breathing Exercise (Stressed after 60s)' },
                { key: 'stretch', label: 'Stretch Reminder (Tired after 90s)' },
                { key: 'hydration', label: 'Hydration Reminder (90m Focus)' },
                { key: 'encouragement', label: 'Encouragement Messages' },
              ].map(item => (
                <label key={item.key} className="flex items-center justify-between py-2 cursor-pointer group">
                  <span className="text-sm group-hover:text-fa-brand transition-colors">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={settings[item.key]}
                    onChange={() => toggleSetting(item.key)}
                    className="accent-fa-brand w-4 h-4 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-4 right-4 z-40 p-2 bg-fa-bg-page border border-fa-border rounded-full shadow-lg hover:border-fa-brand transition-colors group"
        title="Nudge Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-fa-text-muted group-hover:text-fa-brand transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {renderSettings()}

      {/* Hydration Reminder */}
      {showHydration && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-50 border border-blue-200 text-blue-800 px-6 py-3 rounded-full shadow-sm flex items-center gap-3 animate-fade-in">
          <span>💧</span>
          <span className="text-sm font-medium">You've been focused for 90 mins — water break?</span>
          <button onClick={() => setShowHydration(false)} className="ml-4 text-xs bg-blue-500/20 hover:bg-blue-500/40 px-3 py-1 rounded transition-colors">Dismiss</button>
        </div>
      )}

      {/* Stressed State */}
      {activeNudge === 'breathing' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#FFFDF4] border border-red-200 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden">
            <button onClick={() => { setIsDismissed(true); setActiveNudge(null); }} className="absolute top-4 right-4 text-fa-text-muted hover:text-white">&times;</button>

            <h3 className="text-xl font-bold text-fa-state-stressed mb-2">Take a moment</h3>
            <p className="text-fa-text-secondary text-sm mb-8">Breathe in (4s), Hold (7s), Breathe out (8s)</p>

            <div className="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center">
              <div className="absolute w-full h-full rounded-full border-4 border-fa-state-stressed/20"></div>
              <div
                className="absolute bg-fa-state-stressed/30 rounded-full"
                style={{
                  width: '100%',
                  height: '100%',
                  animation: 'breathe 19s infinite ease-in-out'
                }}
              ></div>
              <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes breathe {
                  0% { transform: scale(0.3); opacity: 0.5; }
                  21% { transform: scale(1); opacity: 0.8; }
                  58% { transform: scale(1); opacity: 0.8; }
                  100% { transform: scale(0.3); opacity: 0.5; }
                }
              `}} />
              <span className="relative text-fa-state-stressed font-medium">Breathe</span>
            </div>

            {settings.encouragement && encouragementMessage && (
              <div className="bg-white p-4 rounded-lg border border-[#E8D5A3]">
                <p className="text-[#1A1A2E] text-sm italic">"{encouragementMessage}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fatigued State */}
      {activeNudge === 'stretch' && (
        <div className="fixed bottom-16 right-4 z-40 bg-[#FFFDF4] border border-orange-200 rounded-lg p-4 shadow-2xl animate-slide-up max-w-sm w-full">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-fa-state-fatigued font-semibold">Time for a break?</h3>
            <button onClick={() => { setIsDismissed(true); setActiveNudge(null); }} className="text-fa-text-muted hover:text-white">&times;</button>
          </div>
          <p className="text-fa-text-secondary text-sm mb-4">You seem tired. Let's do a quick desk stretch.</p>

          <div className="bg-white rounded mb-4 overflow-hidden flex items-center justify-center border border-[#E8D5A3] h-32">
            <img
              src="https://placehold.co/400x200/2a2a35/a3a3c2?text=Neck+Stretch+GIF"
              alt="Stretch reminder"
              className="object-cover opacity-80"
            />
          </div>

          <button
            onClick={() => { setIsDismissed(true); setActiveNudge(null); }}
            className="w-full bg-fa-state-fatigued/20 hover:bg-fa-state-fatigued/30 text-fa-state-fatigued border border-fa-state-fatigued/50 rounded py-1.5 text-sm transition-colors"
          >
            I stretched!
          </button>
        </div>
      )}

      {/* Away State */}
      {stableState === 'away' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md animate-fade-in">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">👋</div>
            <h2 className="text-3xl font-bold text-[#1A1A2E] mb-2">Session paused</h2>
            <p className="text-gray-600 text-lg">
              {activeNudge === 'away_return' ? "You've been gone for a bit. Need a hand returning?" : "Welcome back. The timer has been paused."}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
