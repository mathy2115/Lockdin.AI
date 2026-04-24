import { createContext, useContext, useState, useRef } from 'react';

const AIContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAI = () => useContext(AIContext);

export const AIProvider = ({ children }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState({ label: 'Neutral', confidence: 0 });
  const [currentPosture, setCurrentPosture] = useState({ label: 'Good posture', confidence: 0 });
  const [resolvedState, setResolvedState] = useState('focused');
  
  // Track percentages for the session
  const statsRef = useRef({
    focused: 0,
    distracted: 0,
    stressed: 0,
    fatigued: 0,
    away: 0,
    totalTicks: 0
  });

  const updateAIState = (emotion, posture, state) => {
    if (emotion) setCurrentEmotion(emotion);
    if (posture) setCurrentPosture(posture);
    if (state) {
      setResolvedState(state);
      // Update running stats
      statsRef.current.totalTicks += 1;
      statsRef.current[state] = (statsRef.current[state] || 0) + 1;
    }
  };

  const getSessionBreakdown = () => {
    const { focused, distracted, stressed, fatigued, totalTicks } = statsRef.current;
    if (totalTicks === 0) return { focused_pct: 0, distracted_pct: 0, stressed_pct: 0, fatigued_pct: 0 };
    return {
      focused_pct: Math.round((focused / totalTicks) * 100),
      distracted_pct: Math.round((distracted / totalTicks) * 100),
      stressed_pct: Math.round((stressed / totalTicks) * 100),
      fatigued_pct: Math.round((fatigued / totalTicks) * 100),
    };
  };

  const resetSessionBreakdown = () => {
    statsRef.current = {
      focused: 0,
      distracted: 0,
      stressed: 0,
      fatigued: 0,
      away: 0,
      totalTicks: 0
    };
  };

  return (
    <AIContext.Provider value={{
      isCameraActive,
      setIsCameraActive,
      currentEmotion,
      currentPosture,
      resolvedState,
      updateAIState,
      getSessionBreakdown,
      resetSessionBreakdown
    }}>
      {children}
    </AIContext.Provider>
  );
};
