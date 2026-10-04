import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, RefreshCw, Zap, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useVibe } from '../context/VibeContext';
import { moderateText } from '../lib/moderation';

interface BeRealDropProps {
  onClose?: () => void;
}

export const BeRealDrop: React.FC<BeRealDropProps> = ({ onClose }) => {
  const { createVibe, timeRemainingSec } = useVibe();
  const [caption, setCaption] = useState('');
  const [isSwapped, setIsSwapped] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sample authentic presets if webcam is denied or unavailable
  const fallbackFront = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80';
  const fallbackBack = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80';

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      } else {
        // Fallback for environments without camera
        setFrontImage(fallbackFront);
        setBackImage(fallbackBack);
      }
    } catch {
      // Permission denied or virtual environment
      setFrontImage(fallbackFront);
      setBackImage(fallbackBack);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureDualSnapshots = () => {
    setIsCapturing(true);
    if (videoRef.current && cameraActive) {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const selfieUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFrontImage(selfieUrl);
        // Back simulated environment
        setBackImage(fallbackBack);
      }
    } else {
      setFrontImage(fallbackFront);
      setBackImage(fallbackBack);
    }
    setIsCapturing(false);
  };

  const handlePublish = async () => {
    if (!frontImage || !backImage) {
      setErrorMsg('capture your dual vibe first');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    // AI Moderation test
    const mod = moderateText(caption);
    if (mod.isBlocked) {
      setErrorMsg(`blocked by ai moderation: ${mod.reason}`);
      setIsSubmitting(false);
      return;
    }

    const isOnTime = timeRemainingSec > 0;
    const res = await createVibe({
      type: 'bereal',
      front_image_url: frontImage,
      back_image_url: backImage,
      caption: caption || '2 min vibe check ⚡️',
      is_on_time: isOnTime,
      tags: ['bereal', 'vibes', 'daily'],
    });

    setIsSubmitting(false);
    if (!res.success) {
      setErrorMsg(res.error || 'could not publish drop');
      return;
    }

    if (onClose) onClose();
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 rounded-3xl glass-panel border border-white/[0.1] shadow-2xl relative">
      {/* Top vibe check header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-syne font-bold text-sm tracking-wide lowercase text-white">
            2 min vibe check
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTimer(timeRemainingSec)}</span>
          <span className="text-[10px] text-emerald-400 font-bold ml-1">+500 aura</span>
        </div>
      </div>

      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300 lowercase"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      {/* Dual Camera Viewport */}
      <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-black/60 border border-white/[0.08] shadow-inner mb-4">
        {/* Main Background Image */}
        {backImage ? (
          <img
            src={isSwapped ? frontImage || fallbackFront : backImage}
            alt="environment"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-zinc-500">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Camera className="w-12 h-12 text-zinc-600 animate-bounce" />
                <p className="text-xs text-zinc-400 lowercase">tap capture to snap your dual vibe</p>
              </div>
            )}
          </div>
        )}

        {/* Picture-in-Picture (PIP) Selfie Window */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSwapped(!isSwapped)}
          className="absolute top-4 left-4 w-28 h-36 rounded-2xl overflow-hidden border-2 border-white/80 shadow-2xl cursor-pointer bg-zinc-900 group"
        >
          <img
            src={isSwapped ? backImage || fallbackBack : frontImage || fallbackFront}
            alt="selfie PIP"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-white" />
          </div>
          <span className="absolute bottom-1 right-1 text-[9px] bg-black/60 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-md font-mono">
            swap
          </span>
        </motion.div>

        {/* Real-time On-time indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-zinc-300">
          <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span>{timeRemainingSec > 0 ? 'on time' : 'late drop'}</span>
        </div>
      </div>

      {/* Caption input with live AI moderation scan */}
      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="add caption (ai-moderated)..."
            className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-sm text-white placeholder-zinc-500 lowercase transition-all"
          />
          <div className="absolute right-3 top-3 text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ai active</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex gap-2">
          <button
            onClick={captureDualSnapshots}
            disabled={isCapturing}
            className="flex-1 py-3 px-4 rounded-2xl bg-white/[0.08] hover:bg-white/[0.12] text-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Camera className="w-4 h-4 text-purple-400" />
            <span>{frontImage ? 'retake drop' : 'snap vibe'}</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{isSubmitting ? 'verifying...' : 'post drop (+500)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
