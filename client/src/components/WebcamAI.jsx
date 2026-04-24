import { useState, useEffect, useRef } from 'react';
import { useAI } from '../context/AIContext';
import { Camera, CameraOff } from 'lucide-react';

// =========================================================================
// IMPORTANT: REPLACE THIS URL WITH YOUR ACTUAL GOOGLE TEACHABLE MACHINE URL
// =========================================================================
const TM_MODEL_URL = 'YOUR_TM_MODEL_URL_HERE'; 

const WebcamAI = () => {
  const { isCameraActive, setIsCameraActive, updateAIState, currentEmotion, currentPosture } = useAI();
  const [hasConsent, setHasConsent] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [tmModel, setTmModel] = useState(null);
  
  const videoRef = useRef(null);
  const emotionIntervalRef = useRef(null);
  const postureIntervalRef = useRef(null);
  
  // Keep track of the latest readings to resolve the combined state
  const latestEmotionRef = useRef('neutral');
  const latestPostureRef = useRef('Good posture');

  useEffect(() => {
    if (TM_MODEL_URL === 'YOUR_TM_MODEL_URL_HERE') {
      console.warn("⚠️ ACTION REQUIRED: You must replace 'YOUR_TM_MODEL_URL_HERE' in WebcamAI.jsx with your actual Google Teachable Machine Pose Model URL!");
    }
  }, []);

  // 1. Initialize Models
  const loadModels = async () => {
    try {
      // Load face-api models from a reliable open-source repo
      const MODEL_URL = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';
      await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await window.faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      
      // Load Google Teachable Machine Pose Model
      if (TM_MODEL_URL !== 'YOUR_TM_MODEL_URL_HERE') {
        const modelURL = TM_MODEL_URL + "model.json";
        const metadataURL = TM_MODEL_URL + "metadata.json";
        const tm = await window.tmPose.load(modelURL, metadataURL);
        setTmModel(tm);
      }
      
      setModelsLoaded(true);
    } catch (err) {
      console.error("Failed to load AI models:", err);
    }
  };

  // 2. Start Camera
  const startCamera = async () => {
    setHasConsent(true);
    setIsCameraActive(true);
    
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
      setIsCameraActive(false);
      setHasConsent(false);
    }
  };

  // 3. Stop Camera
  const stopCamera = () => {
    setIsCameraActive(false);
    setHasConsent(false);
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    clearInterval(emotionIntervalRef.current);
    clearInterval(postureIntervalRef.current);
  };

  // 4. Resolve 5-State Logic
  const resolveState = (emotionLabel, postureLabel) => {
    const e = emotionLabel.toLowerCase();
    const p = postureLabel.toLowerCase();
    
    let state;

    if (p.includes('away')) {
      state = 'away';
    } else if (p.includes('slouch') && e === 'sad') {
      state = 'stressed';
    } else if (p.includes('slouch') && e === 'angry') {
      state = 'stressed';
    } else if (p.includes('head in hands') || p.includes('hands')) {
      state = 'stressed';
    } else if (e === 'sad' || e === 'fearful') {
      state = 'fatigued';
    } else if (e === 'surprised') {
      state = 'distracted';
    } else if (p.includes('good') && e === 'neutral') {
      state = 'focused';
    } else if (e === 'happy') {
      state = 'focused';
    } else {
      state = 'focused';
    }

    return state;
  };

  // 5. Detection Loops
  const handleVideoPlay = () => {
    if (!window.faceapi) return;

    // Emotion Loop (Every 1.5s)
    emotionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

      const detections = await window.faceapi
        .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections) {
        const expressions = detections.expressions;
        // Sort to find the highest confidence emotion
        const highestEmotion = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
        const confidence = Math.round(expressions[highestEmotion] * 100);
        
        latestEmotionRef.current = highestEmotion;
        
        updateAIState(
          { label: highestEmotion.charAt(0).toUpperCase() + highestEmotion.slice(1), confidence },
          null,
          resolveState(latestEmotionRef.current, latestPostureRef.current)
        );
      }
    }, 1500);

    // Posture Loop (Every 2.0s)
    postureIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
      if (!tmModel) {
        // Fallback mock if no TM model is provided
        updateAIState(null, { label: 'Good posture', confidence: 100 }, resolveState(latestEmotionRef.current, 'Good posture'));
        return;
      }

      const { posenetOutput } = await tmModel.estimatePose(videoRef.current);
      const prediction = await tmModel.predict(posenetOutput);
      
      if (prediction && prediction.length > 0) {
        // Sort to find highest probability posture
        const highestPosture = prediction.reduce((prev, current) => (prev.probability > current.probability) ? prev : current);
        const confidence = Math.round(highestPosture.probability * 100);
        
        latestPostureRef.current = highestPosture.className;
        
        updateAIState(
          null,
          { label: highestPosture.className, confidence },
          resolveState(latestEmotionRef.current, latestPostureRef.current)
        );
      }
    }, 2000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // UI Renders
  if (!hasConsent && !isCameraActive) {
    return (
      <div className="bg-fa-bg-shell border border-fa-border rounded-xl p-6 text-center max-w-sm">
        <Camera size={32} className="text-fa-brand mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Enable AI Camera Mode</h3>
        <p className="text-sm text-fa-text-secondary mb-4 leading-relaxed">
          Unlock real-time emotion and posture detection. 
          <br/><strong className="text-white">Privacy first:</strong> All processing happens locally in your browser. No video is ever recorded or sent anywhere.
        </p>
        <button 
          onClick={startCamera}
          className="w-full bg-fa-brand hover:bg-fa-brand/90 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          Opt-In & Enable Camera
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 animate-in slide-in-from-bottom-8">
      {/* Privacy Toggle / Status Bar */}
      <div className="flex items-center gap-3 bg-[#1A1E2E] border border-fa-border px-3 py-1.5 rounded-full shadow-lg">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-white">Camera Active</span>
        </div>
        <div className="w-px h-4 bg-fa-border"></div>
        <button 
          onClick={stopCamera}
          className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
        >
          <CameraOff size={14} /> Stop
        </button>
      </div>

      {/* PiP Window */}
      <div className="relative bg-black rounded-xl overflow-hidden border-2 border-fa-brand/50 shadow-2xl w-48 aspect-video group">
        {!modelsLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-fa-bg-shell z-20">
            <div className="w-5 h-5 border-2 border-fa-brand border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-[10px] text-fa-text-secondary uppercase tracking-wider font-bold">Loading AI...</span>
          </div>
        )}
        
        <video 
          ref={videoRef}
          onPlay={handleVideoPlay}
          autoPlay 
          muted 
          playsInline
          className="w-full h-full object-cover transform scale-x-[-1]" 
        />
        
        {/* Real-time Overlays */}
        {modelsLoaded && (
          <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1 z-10">
            <div className="flex justify-between items-center bg-black/60 backdrop-blur-sm px-2 py-1 rounded border border-white/10">
              <span className="text-[10px] font-medium text-white truncate pr-1">{currentEmotion.label}</span>
              <span className="text-[10px] font-bold text-fa-brand">{currentEmotion.confidence}%</span>
            </div>
            <div className="flex justify-between items-center bg-black/60 backdrop-blur-sm px-2 py-1 rounded border border-white/10">
              <span className="text-[10px] font-medium text-white truncate pr-1">{currentPosture.label}</span>
              {currentPosture.confidence > 0 && (
                <span className="text-[10px] font-bold text-blue-400">{currentPosture.confidence}%</span>
              )}
            </div>
          </div>
        )}

        {/* Warning if TM URL is missing */}
        {TM_MODEL_URL === 'YOUR_TM_MODEL_URL_HERE' && (
          <div className="absolute top-2 left-2 right-2 bg-amber-500/90 text-black text-[9px] font-bold px-1.5 py-1 rounded text-center leading-tight">
            ⚠ Placeholder TM Model URL. See console.
          </div>
        )}
      </div>
    </div>
  );
};

export default WebcamAI;
