import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CameraOff, Loader2 } from 'lucide-react';

const FACE_API_MODEL_URL = '/weights';

const CameraMode = ({ onStateChange, onToggle, onCameraReady, onPresenceChange, isSessionActive }) => {
  const [isActive, setIsActive] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [displayState, setDisplayState] = useState('Focused');
  const [emotion, setEmotion] = useState({ label: 'neutral', confidence: 0 });

  const videoRef = useRef(null);
  const canvasRef = useRef(null); // hidden canvas — face-api reads from this
  const mpCameraRef = useRef(null);
  const poseRef = useRef(null);
  const emotionIntervalRef = useRef(null);
  const awayTimerRef = useRef(null);
  const isAwayRef = useRef(false);
  const isActiveRef = useRef(false);
  const modelsLoadedRef = useRef(false);

  // ─── Load face-api models ──────────────────────────────────────────
  const loadModels = async () => {
    try {
      setLoadingStatus('Loading face detection...');
      await window.faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_MODEL_URL);
      setLoadingStatus('Loading expression model...');
      await window.faceapi.nets.faceExpressionNet.loadFromUri(FACE_API_MODEL_URL);
      modelsLoadedRef.current = true;
      setModelsLoaded(true);
      console.log('[CameraMode] face-api models loaded');
    } catch (err) {
      console.error('[CameraMode] face-api load failed:', err);
      setLoadingStatus('Face model load failed — check console');
    }
  };

  // ─── State helpers ─────────────────────────────────────────────────
  const updateState = useCallback((isAway) => {
    const state = isAway ? 'Away' : 'Focused';
    setDisplayState(state);
    if (onStateChange) onStateChange(state.toLowerCase());
    if (onPresenceChange) onPresenceChange(!isAway);
  }, [onStateChange, onPresenceChange]);

  const handleAwaySignal = useCallback((isAway) => {
    if (isAway && !isAwayRef.current) {
      if (!awayTimerRef.current) {
        awayTimerRef.current = setTimeout(() => {
          isAwayRef.current = true;
          awayTimerRef.current = null;
          updateState(true);
        }, 3000);
      }
    } else if (!isAway) {
      if (awayTimerRef.current) {
        clearTimeout(awayTimerRef.current);
        awayTimerRef.current = null;
      }
      if (isAwayRef.current) {
        isAwayRef.current = false;
        updateState(false);
      }
    }
  }, [updateState]);

  // ─── MediaPipe pose results ────────────────────────────────────────
  const onPoseResults = useCallback((results) => {
    if (!isActiveRef.current) return;
    if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
      handleAwaySignal(true);
      return;
    }
    const nose = results.poseLandmarks[0];
    if (!nose || nose.visibility < 0.5) {
      handleAwaySignal(true);
      return;
    }
    handleAwaySignal(false);
  }, [handleAwaySignal]);

  // ─── Draw video frame to canvas, run face-api on canvas ───────────
  // face-api works reliably on HTMLCanvasElement — avoids toNetInput errors
  // that occur when video element isn't in a valid playable state
  const captureFrameToCanvas = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return false;
    if (video.readyState < 2 || video.videoWidth === 0) return false;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return true;
  };

  // ─── Emotion detection loop ────────────────────────────────────────
  const startEmotionLoop = useCallback(() => {
    clearInterval(emotionIntervalRef.current);
    emotionIntervalRef.current = setInterval(async () => {
      if (!isActiveRef.current || !modelsLoadedRef.current) return;
      if (!window.faceapi) return;

      // Draw current video frame to canvas
      const ok = captureFrameToCanvas();
      if (!ok) return;

      try {
        const canvas = canvasRef.current;
        const detection = await window.faceapi
          .detectSingleFace(canvas, new window.faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        if (detection) {
          const e = detection.expressions;
          const mapped = {
            happy: e.happy || 0,
            sad: (e.sad || 0) + (e.fearful || 0) + (e.disgusted || 0),
            angry: e.angry || 0,
            surprised: e.surprised || 0,
            neutral: e.neutral || 0,
          };
          const top = Object.entries(mapped).reduce((a, b) => b[1] > a[1] ? b : a);
          setEmotion({ label: top[0], confidence: Math.round(top[1] * 100) });
          console.log('[CameraMode] Emotion:', top[0], Math.round(top[1] * 100) + '%');
        } else {
          setEmotion({ label: 'neutral', confidence: 0 });
          console.log('[CameraMode] No face detected');
        }
      } catch (err) {
        console.error('[CameraMode] Detection error:', err);
      }
    }, 1500);
  }, []);

  // ─── Start camera ──────────────────────────────────────────────────
  const startCamera = async () => {
    setIsActive(true);
    isActiveRef.current = true;
    if (onToggle) onToggle(true);

    if (!modelsLoadedRef.current) await loadModels();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise(resolve => { videoRef.current.onloadedmetadata = resolve; });
        await videoRef.current.play();
      }

      // Init MediaPipe Pose
      setLoadingStatus('Loading pose model...');
      const pose = new window.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      });
      pose.setOptions({
        modelComplexity: 0,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      pose.onResults(onPoseResults);
      await pose.initialize();
      poseRef.current = pose;
      console.log('[CameraMode] MediaPipe Pose initialized');

      // MediaPipe Camera utility feeds frames to pose
      const mpCamera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (poseRef.current && isActiveRef.current) {
            await poseRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480
      });
      await mpCamera.start();
      mpCameraRef.current = mpCamera;
      console.log('[CameraMode] MediaPipe Camera utility started');

      setLoadingStatus('');
      startEmotionLoop();

      if (onCameraReady) onCameraReady();
      localStorage.setItem('camConsentGiven', 'true');

    } catch (err) {
      console.error('[CameraMode] Camera start failed:', err);
      setIsActive(false);
      isActiveRef.current = false;
      setLoadingStatus('');
      if (onToggle) onToggle(false);
    }
  };

  // ─── Stop camera ───────────────────────────────────────────────────
  const stopCamera = () => {
    if (isSessionActive) return;
    isActiveRef.current = false;
    setIsActive(false);
    if (onToggle) onToggle(false);

    if (mpCameraRef.current) { mpCameraRef.current.stop(); mpCameraRef.current = null; }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }

    clearInterval(emotionIntervalRef.current);
    if (awayTimerRef.current) { clearTimeout(awayTimerRef.current); awayTimerRef.current = null; }
    poseRef.current = null;
    isAwayRef.current = false;
  };

  // ─── Cleanup ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (mpCameraRef.current) mpCameraRef.current.stop();
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
      clearInterval(emotionIntervalRef.current);
      if (awayTimerRef.current) clearTimeout(awayTimerRef.current);
    };
  }, []);

  // ─── UI ────────────────────────────────────────────────────────────
  const stateStyle = displayState === 'Away'
    ? { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' }
    : { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };

  const emotionColors = {
    happy: 'text-yellow-400',
    sad: 'text-blue-400',
    angry: 'text-red-400',
    surprised: 'text-purple-400',
    neutral: 'text-gray-300',
  };

  return (
    <div className="flex flex-col h-full bg-[#FFFDF4] border border-[#E8D5A3] rounded-[16px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)]">

      {/* Hidden canvas — face-api reads from this, avoids toNetInput video errors */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#E8D5A3] bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-fa-brand/20 rounded-lg">
            <Camera className="text-fa-brand" size={20} />
          </div>
          <h3 className="font-bold text-[#1A1A2E]">AI Monitor</h3>
        </div>
        {isActive && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
            </div>
            {!isSessionActive && (
              <button onClick={stopCamera}
                className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors">
                <CameraOff size={14} /> Stop
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className={`flex-1 relative min-h-0 flex items-center justify-center ${isActive ? 'bg-black' : 'bg-[#FFFDF4]'}`}>
        {!isActive ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-fa-brand/10 flex items-center justify-center mb-4 border border-fa-brand/20">
              <Camera size={32} className="text-fa-brand" />
            </div>
            <h4 className="text-lg font-bold text-[#1A1A2E] mb-2">Camera Off</h4>
            <p className="text-sm text-gray-500 mb-6 max-w-[200px]">
              Camera must be active to start a focus session.
            </p>
            <button onClick={startCamera}
              className="px-6 py-2.5 bg-fa-brand hover:bg-fa-brand/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-fa-brand/20">
              Enable AI Camera
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay muted playsInline
              className="w-full h-full object-cover transform scale-x-[-1]"
            />

            {loadingStatus && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20">
                <Loader2 size={32} className="text-fa-brand animate-spin mb-3" />
                <span className="text-xs text-white font-bold uppercase tracking-widest">
                  {loadingStatus}
                </span>
              </div>
            )}

            {!loadingStatus && (
              <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-fa-text-secondary uppercase tracking-widest mb-0.5">Emotion</p>
                    <p className={`text-sm font-bold capitalize ${emotionColors[emotion.label] || 'text-gray-300'}`}>
                      {emotion.label}

                    </p>
                  </div>
                  <span className={`border px-3 py-1 rounded-full text-xs font-bold ${stateStyle.bg} ${stateStyle.text} ${stateStyle.border}`}>
                    {displayState}
                  </span>
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