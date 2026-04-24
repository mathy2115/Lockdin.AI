import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Loader2 } from 'lucide-react';

const TM_MODEL_URL = 'https://teachablemachine.withgoogle.com/models/aptIgRtjs/';
const FACE_API_WEIGHTS = '/weights'

const CameraMode = ({ onStateChange, onToggle }) => {
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
  const latestEmotionRef = useRef('neutral');
  const latestPostureRef = useRef('Good Posture');
  const noFaceDetectedRef = useRef(false);

  // 1. Initialize Models
  const loadModels = async () => {
    try {
      // Load face-api models
      if (!window.faceapi.nets.tinyFaceDetector.isLoaded) {
        await window.faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_WEIGHTS);
        await window.faceapi.nets.faceExpressionNet.loadFromUri(FACE_API_WEIGHTS);
      }

      // Load TM Pose model
      if (!tmModelRef.current) {
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
    const emotion = latestEmotionRef.current.toLowerCase();
    const posture = latestPostureRef.current; // Keep exact casing from TM model if needed, but we'll do case-insensitive
    const postureLower = posture.toLowerCase();
    const noFace = noFaceDetectedRef.current;

    let nextState = 'Focused';

    if (postureLower === 'away' || noFace) {
      nextState = 'Away';
    } else if (postureLower === 'head in hands') {
      nextState = 'Stressed';
    } else if (postureLower === 'slouching' && (emotion === 'sad' || emotion === 'angry')) {
      nextState = 'Stressed';
    } else if (emotion === 'sad' || emotion === 'fearful') {
      nextState = 'Fatigued';
    } else if (emotion === 'surprised' || emotion === 'disgusted') {
      nextState = 'Distracted';
    } else if (postureLower === 'good posture' && (emotion === 'neutral' || emotion === 'happy')) {
      nextState = 'Focused';
    } else {
      nextState = 'Focused';
    }

    setCurrentState(prev => {
      if (prev !== nextState) {
        if (onStateChange) onStateChange(nextState.toLowerCase());
      }
      return nextState;
    });
  };

  // 5. Detection Loops
  const handleVideoPlay = () => {
    if (!window.faceapi || !tmModelRef.current) return;

    // Emotion Loop (1.5s)
    emotionIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

      const detections = await window.faceapi
        .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections) {
        noFaceDetectedRef.current = false;
        const expressions = detections.expressions;
        const dominantEmotion = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
        const confidence = Math.round(expressions[dominantEmotion] * 100);

        latestEmotionRef.current = dominantEmotion;
        setEmotionData({ label: dominantEmotion, confidence });
      } else {
        noFaceDetectedRef.current = true;
        latestEmotionRef.current = 'none';
        setEmotionData({ label: 'none', confidence: 0 });
      }
      resolveState();
    }, 1500);

    // Posture Loop (2.0s)
    postureIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

      const { posenetOutput } = await tmModelRef.current.estimatePose(videoRef.current);
      const prediction = await tmModelRef.current.predict(posenetOutput);

      if (prediction && prediction.length > 0) {
        const highestPosture = prediction.reduce((prev, current) => (prev.probability > current.probability) ? prev : current);

        latestPostureRef.current = highestPosture.className;
        setPostureData({ label: highestPosture.className, confidence: Math.round(highestPosture.probability * 100) });
      }
      resolveState();
    }, 2000);
  };

  useEffect(() => {
    return () => stopCamera();
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

  if (!hasConsent && !isActive) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-[#161b22] border border-[#6366f1]/30 rounded-2xl p-6 text-center max-w-sm shadow-2xl animate-in slide-in-from-bottom-8">
        <Camera size={32} className="text-[#6366f1] mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Enable Camera Mode</h3>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          Your camera is processed locally in your browser. No video is ever stored or sent anywhere.
        </p>
        <button
          onClick={startCamera}
          className="w-full bg-[#6366f1] hover:bg-[#6366f1]/90 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-[#6366f1]/20"
        >
          I understand, enable camera
        </button>
      </div>
    );
  }

  if (!isActive && hasConsent) {
    return (
      <button
        onClick={startCamera}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#161b22] border border-[#6366f1]/30 hover:bg-[#6366f1]/10 px-4 py-3 rounded-xl text-white font-semibold shadow-xl transition-colors"
      >
        <Camera size={18} className="text-[#6366f1]" />
        Start Camera Mode
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 animate-in slide-in-from-bottom-8">
      {/* State Badge & Stats Overlay (above PiP) */}
      <div className="flex flex-col items-end gap-2 mr-1">
        {modelsLoaded && getStateBadge()}

        {modelsLoaded && (
          <div className="bg-[#161b22]/90 backdrop-blur-md border border-white/10 rounded-lg p-2.5 text-right shadow-xl">
            <p className="text-[11px] font-medium text-gray-300">
              Emotion: <span className="text-white capitalize">{emotionData.label}</span> <span className="text-[#6366f1]">({emotionData.confidence}%)</span>
            </p>
            <p className="text-[11px] font-medium text-gray-300 mt-1">
              Posture: <span className="text-white">{postureData.label}</span>
            </p>
          </div>
        )}
      </div>

      {/* Control / Toggle Bar */}
      <div className="flex items-center gap-3 bg-[#161b22] border border-white/10 px-3 py-1.5 rounded-full shadow-lg">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">Active</span>
        </div>
        <div className="w-px h-3 bg-white/10"></div>
        <button
          onClick={stopCamera}
          className="text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
        >
          <CameraOff size={12} /> Stop
        </button>
      </div>

      {/* PiP Window */}
      <div className="relative bg-[#0d1117] rounded-xl overflow-hidden border-2 border-[#6366f1]/40 shadow-[0_8px_30px_rgb(0,0,0,0.5)] w-[160px] h-[120px]">
        {!modelsLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#161b22] z-20">
            <Loader2 size={24} className="text-[#6366f1] animate-spin mb-2" />
            <span className="text-[10px] text-gray-400 font-medium">Loading AI models...</span>
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
      </div>
    </div>
  );
};

export default CameraMode;
