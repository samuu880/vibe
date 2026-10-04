import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send, Radio } from 'lucide-react';

interface VoiceRecorderProps {
  onRecorded: (audioUrl: string, duration: number, waveform: number[]) => void;
  onCancel?: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecorded, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      setDuration(0);

      // Web Audio API analyzer setup
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const peaks: number[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudio(url);
        setWaveformPeaks(peaks.length > 0 ? peaks : [0.2, 0.5, 0.9, 0.4, 0.7, 0.5, 0.8, 0.3]);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      // Start duration timer
      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setDuration((Date.now() - startTime) / 1000);
      }, 100);

      // Draw real-time frequency visualizer on canvas
      drawCanvas(analyser, peaks);
    } catch {
      // Fallback for denied mic
      alert('microphone access is required to record voice notes');
    }
  };

  const drawCanvas = (analyser: AnalyserNode, peaks: number[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let sum = 0;
      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        sum += dataArray[i];

        // Gradient bar
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(0.5, '#ec4899');
        gradient.addColorStop(1, '#06b6d4');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }

      const avg = sum / (bufferLength * 255);
      if (peaks.length < 32 && Math.random() > 0.6) {
        peaks.push(Math.max(0.1, Number(avg.toFixed(2))));
      }
    };

    render();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    stopRecordingCleanup();
  };

  const stopRecordingCleanup = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current || !recordedAudio) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSend = () => {
    if (recordedAudio) {
      onRecorded(recordedAudio, duration, waveformPeaks);
    }
  };

  const resetRecording = () => {
    setRecordedAudio(null);
    setDuration(0);
    setIsPlaying(false);
  };

  const formatSec = (sec: number) => {
    const s = Math.floor(sec);
    const ms = Math.floor((sec - s) * 10);
    return `00:${s < 10 ? '0' : ''}${s}.${ms}`;
  };

  return (
    <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-center">
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="text-zinc-400 flex items-center gap-1.5 lowercase">
          <Radio className={`w-3.5 h-3.5 ${isRecording ? 'text-red-500 animate-pulse' : 'text-purple-400'}`} />
          {isRecording ? 'recording voice vibe...' : recordedAudio ? 'preview voice note' : 'tap mic to record'}
        </span>
        <span className="font-mono text-purple-300 font-semibold">{formatSec(duration)}</span>
      </div>

      {/* Visualizer canvas */}
      <div className="h-16 w-full rounded-xl bg-black/40 border border-white/[0.05] overflow-hidden flex items-center justify-center relative mb-4">
        {isRecording ? (
          <canvas ref={canvasRef} width={280} height={60} className="w-full h-full" />
        ) : recordedAudio ? (
          <div className="flex items-center gap-1 w-full px-4 h-8 justify-center">
            {waveformPeaks.map((peak, idx) => (
              <div
                key={idx}
                className="w-1.5 rounded-full bg-gradient-to-t from-purple-500 to-pink-500 transition-all"
                style={{ height: `${Math.max(15, peak * 100)}%` }}
              />
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-zinc-500 lowercase flex items-center gap-1">
            <span>web audio api waveform visualizer</span>
          </div>
        )}
      </div>

      {/* Hidden audio element for preview */}
      {recordedAudio && (
        <audio
          ref={audioPlayerRef}
          src={recordedAudio}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-3">
        {!recordedAudio ? (
          !isRecording ? (
            <button
              onClick={startRecording}
              className="p-4 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30 hover:scale-110 active:scale-95 transition-all"
            >
              <Mic className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="p-4 rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 hover:scale-110 active:scale-95 transition-all animate-pulse"
            >
              <Square className="w-6 h-6" />
            </button>
          )
        ) : (
          <>
            <button
              onClick={resetRecording}
              className="p-2.5 rounded-full bg-white/[0.08] text-zinc-400 hover:text-white hover:bg-red-500/20 transition-all"
              title="discard"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlayback}
              className="p-3.5 rounded-full bg-purple-600 text-white shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <button
              onClick={handleSend}
              className="px-4 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md hover:opacity-90 active:scale-95 transition-all"
            >
              <span>attach</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-zinc-500 hover:text-zinc-300 ml-2 lowercase"
          >
            cancel
          </button>
        )}
      </div>
    </div>
  );
};
