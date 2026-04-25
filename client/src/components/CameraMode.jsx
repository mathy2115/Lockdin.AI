import { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, Loader2 } from 'lucide-react';

const TM_MODEL_URL = '/tm-model/';

const CameraMode = ({ onStateChange, onToggle, isSessionActive }) => {
  const [hasConsent, setHasConsent] = useState(() => localStorage.getItem('camConsentGiven') === 'true');
  const [isActive, setIsActive] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const [emotionData, setEmotionData] = useState({ label: 'neutral', confidence: 0 });
  const [postureData, setPostureData] = useState({ label: 'Loading...', confidence: 0 });
  const [currentState, setCurrentState] = useState('Focused');

  const videoRef = useRef(null);
  const tmModelRef = useRef(null);
  const emotionIntervalRef = useRef(null);
  const postureIntervalRef = useRef(null);

  // Latest readings refs to avoid stale closures in setInterval
  const latestEmotionRef = useRef({ label: 'neutral', confidence: 1 });
  const latestPostureRef = useRef('Good Posture');
  const noFaceDetectedRef = useRef(false);
  const emotionBufferRef = useRef([]);
  const faceMeshRef = useRef(null);
  const latestLandmarksRef = useRef(null);
  const consecutiveNeutralRef = useRef(0);

  // 1. Initialize Models
  const loadModels = async () => {
    try {
      // Initialize MediaPipe Face Mesh
      if (!faceMeshRef.current) {
        const faceMesh = new window.FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });
        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        faceMesh.onResults((results) => {
          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            latestLandmarksRef.current = results.multiFaceLandmarks[0];
            noFaceDetectedRef.current = false;
          } else {
            latestLandmarksRef.current = null;
            noFaceDetectedRef.current = true;
          }
        });
        faceMeshRef.current = faceMesh;
      }

      // Load TM Pose model
      if (!tmModelRef.current) {
        if (!window.tmPose) {
          console.error('Teachable Machine not loaded');
          return;
        }
        const modelURL = TM_MODEL_URL + "model.json";
        const metadataURL = TM_MODEL_URL + "metadata.json";
        tmModelRef.current = await window.tmPose.load(modelURL, metadataURL);
      }

      setModelsLoaded(true);
    } catch (err) {
      console.error("Failed to load AI models:", err);
    }
  };

  // 2. Start Camera
  const startCamera = async () => {
    localStorage.setItem('camConsentGiven', 'true');
    setHasConsent(true);
    setIsActive(true);
    if (onToggle) onToggle(true);

    if (!modelsLoaded) {
      await loadModels();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setIsActive(false);
    }
  };

  // 3. Stop Camera
  const stopCamera = () => {
    if (isSessionActive) return; // Cannot stop mid-session
    setIsActive(false);
    if (onToggle) onToggle(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    clearInterval(emotionIntervalRef.current);
    clearInterval(postureIntervalRef.current);
  };

  // 4. Resolve State Logic
  const resolveState = () => {
    const emotionDataObj = latestEmotionRef.current;
    const emotion = emotionDataObj.label ? emotionDataObj.label.toLowerCase() : 'neutral';
    const confidence = emotionDataObj.confidence || 0;
    
    const posture = latestPostureRef.current; 
    const noFace = noFaceDetectedRef.current;

    let nextState = 'Focused';

    if (posture === 'Away' || noFace) {
      nextState = 'Away';
    } else if (posture === 'Head in Hands') {
      nextState = 'Stressed';
    } else if (emotion === 'sad' && confidence > 0.35) {
      nextState = 'Stressed';
    } else if (emotion === 'angry' && confidence > 0.35) {
      nextState = 'Stressed';
    } else if (emotion === 'fearful' && confidence > 0.3) {
      nextState = 'Fatigued';
    } else if (emotion === 'disgusted' && confidence > 0.3) {
      nextState = 'Fatigued';
    } else if (emotion === 'surprised' && confidence > 0.35) {
      nextState = 'Distracted';
    } else if (emotion === 'happy' && confidence > 0.4) {
      nextState = 'Focused';
    } else if (emotion === 'neutral' && confidence > 0.5) {
      nextState = 'Focused';
    } else {
      nextState = 'Focused';
    }

    setCurrentState(nextState);
  };

  useEffect(() => {
    if (currentState && onStateChange) {
      onStateChange(currentState.toLowerCase());
    }
  }, [currentState, onStateChange]);

  // 5. Detection Loops
  const handleVideoPlay = () => {
    // Emotion Loop (600ms)
    emotionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

      if (faceMeshRef.current) {
        await faceMeshRef.current.send({ image: videoRef.current });
      }

      const landmarks = latestLandmarksRef.current;
      if (landmarks) {
        noFaceDetectedRef.current = false;

        // Heuristic Logic
        const getDist = (p1, p2) => Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
        const faceHeight = getDist(landmarks[10], landmarks[152]);
        
        const mouthOpenRatio = getDist(landmarks[13], landmarks[14]) / faceHeight;
        const eyebrowRatio = getDist(landmarks[70], landmarks[159]) / faceHeight;
        const mouthCenterY = (landmarks[61].y + landmarks[291].y) / 2;
        const mouthCornerRatio = (landmarks[0].y - mouthCenterY) / faceHeight;

        const mouthOpen = mouthOpenRatio > 0.08;
        const smiling = mouthCornerRatio > 0.02;
        const frowned = mouthCornerRatio < -0.02;

        let detectedLabel = 'neutral';
        if (mouthOpen && smiling) detectedLabel = 'happy';
        else if (mouthOpen) detectedLabel = 'surprised';
        else if (frowned) detectedLabel = 'sad';

        const detectedConfidence = 0.8; // Constant for heuristic

        // Rolling Buffer of last 5
        const buffer = emotionBufferRef.current;
        buffer.push(detectedLabel);
        if (buffer.length > 5) buffer.shift();

        let finalEmotion = detectedLabel;
        if (buffer.length === 5) {
          const counts = {};
          buffer.forEach(e => counts[e] = (counts[e] || 0) + 1);
          if (counts['neutral'] && counts['neutral'] >= 4) {
             finalEmotion = 'neutral';
          } else {
             let maxCount = 0;
             let mostFreq = finalEmotion;
             Object.entries(counts).forEach(([emotion, count]) => {
                if (emotion !== 'neutral' && count > maxCount) {
                   maxCount = count;
                   mostFreq = emotion;
                }
             });
             if (maxCount > 0) finalEmotion = mostFreq;
          }
        }

        latestEmotionRef.current = { label: finalEmotion, confidence: detectedConfidence };
        setEmotionData({ label: finalEmotion, confidence: Math.round(detectedConfidence * 100) });
      } else {
        noFaceDetectedRef.current = true;
        latestEmotionRef.current = { label: 'none', confidence: 0 };
        emotionBufferRef.current = [];
        consecutiveNeutralRef.current = 0;
        setEmotionData({ label: 'none', confidence: 0 });
      }
      resolveState();
    }, 600);

    // Posture Loop (2.0s)
    postureIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

      const { posenetOutput } = await tmModelRef.current.estimatePose(videoRef.current);
      const prediction = await tmModelRef.current.predict(posenetOutput);

      if (prediction && prediction.length > 0) {
        const highestPosture = prediction.reduce((prev, current) => (prev.probability > current.probability) ? prev : current);

        let mappedLabel = highestPosture.className;
        if (mappedLabel === "Class 1 - Good Posture") mappedLabel = 'Good Posture';
        else if (mappedLabel === "Class 2 - Away from Screen") mappedLabel = 'Away';
        else if (mappedLabel === "Class 3 - Head in Hands") mappedLabel = 'Head in Hands';

        latestPostureRef.current = mappedLabel;
        setPostureData({ label: mappedLabel, confidence: Math.round(highestPosture.probability * 100) });
      }
      resolveState();
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      clearInterval(emotionIntervalRef.current);
      clearInterval(postureIntervalRef.current);
    };
  }, []);

  // UI Render Helpers
  const getStateBadge = () => {
    switch (currentState) {
      case 'Focused': return <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg"><span className="text-base">🎯</span> Focused</span>;
      case 'Distracted': return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg"><span className="text-base">👀</span> Distracted</span>;
      case 'Stressed': return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg"><span className="text-base">😤</span> Stressed</span>;
      case 'Fatigued': return <span className="bg-fa-brand/20 text-fa-brand border border-fa-brand/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg"><span className="text-base">😴</span> Fatigued</span>;
      case 'Away': return <span className="bg-gray-500/20 text-gray-400 border border-gray-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg"><span className="text-base">💤</span> Away</span>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1A2236] border border-[rgba(255,255,255,0.07)] rounded-[16px] overflow-hidden shadow-xl">
      {/* Camera Header / Control Bar */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-fa-brand/20 rounded-lg">
            <Camera className="text-fa-brand" size={20} />
          </div>
          <h3 className="font-bold text-white">AI Monitor</h3>
        </div>
        
        {isActive && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
            </div>
            {!isSessionActive && (
              <button
                onClick={stopCamera}
                className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors"
              >
                <CameraOff size={14} /> Stop
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 relative min-h-0 bg-black flex items-center justify-center">
        {!isActive ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-fa-brand/10 flex items-center justify-center mb-4 border border-fa-brand/20">
              <Camera size={32} className="text-fa-brand" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Camera Off</h4>
            <p className="text-sm text-fa-text-secondary mb-6 max-w-[200px]">
              Enable AI monitoring to track focus, posture, and emotions.
            </p>
            <button
              onClick={startCamera}
              className="px-6 py-2.5 bg-fa-brand hover:bg-fa-brand/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-fa-brand/20"
            >
              Enable AI Camera
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              onPlay={handleVideoPlay}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover transform scale-x-[-1]"
            />

            {!modelsLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20">
                <Loader2 size={32} className="text-fa-brand animate-spin mb-3" />
                <span className="text-xs text-fa-text-primary font-bold uppercase tracking-widest">Loading AI Models...</span>
              </div>
            )}

            {/* Overlays */}
            {modelsLoaded && (
              <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3 pointer-events-none">
                <div className="flex justify-between items-end">
                  <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-fa-text-secondary uppercase tracking-widest">Emotion</p>
                      <p className="text-sm font-bold text-white capitalize">{emotionData.label} <span className="text-fa-brand ml-1">({emotionData.confidence}%)</span></p>
                    </div>
                  </div>
                  {getStateBadge()}
                </div>
                
                <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-fa-text-secondary uppercase tracking-widest">Posture Detection</p>
                    <p className="text-sm font-bold text-white">{postureData.label}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CameraMode;
