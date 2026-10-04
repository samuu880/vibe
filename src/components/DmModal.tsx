import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mic, Flame, ShieldAlert, Sparkles, CheckCheck, Play, Pause } from 'lucide-react';
import { useVibe } from '../context/VibeContext';
import { useAuth } from '../context/AuthContext';
import { VoiceRecorder } from './VoiceRecorder';

interface DmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DmModal: React.FC<DmModalProps> = ({ isOpen, onClose }) => {
  const { messages, sendMessage, activeDmUser, setActiveDmUser } = useVibe();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isEphemeral, setIsEphemeral] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

  const recipientUsername = activeDmUser || 'sofiap';
  const recipientId = 'usr_sofia';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    await sendMessage(recipientId, inputText.trim(), undefined, undefined, isEphemeral);
    setInputText('');
  };

  const handleSendVoiceNote = async (audioUrl: string, duration: number) => {
    await sendMessage(recipientId, 'voice note', audioUrl, duration, isEphemeral);
    setShowVoiceRecorder(false);
  };

  const toggleAudio = (id: string, url: string) => {
    if (playingAudioId === id) {
      audioElementsRef.current[id]?.pause();
      setPlayingAudioId(null);
    } else {
      if (playingAudioId && audioElementsRef.current[playingAudioId]) {
        audioElementsRef.current[playingAudioId].pause();
      }
      if (!audioElementsRef.current[id]) {
        const audio = new Audio(url);
        audio.onended = () => setPlayingAudioId(null);
        audioElementsRef.current[id] = audio;
      }
      audioElementsRef.current[id].play();
      setPlayingAudioId(id);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-lg h-[620px] rounded-3xl glass-modal border border-white/[0.1] shadow-2xl flex flex-col overflow-hidden text-left"
          >
            {/* DM Header */}
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
                    alt={recipientUsername}
                    className="w-10 h-10 rounded-full object-cover border border-purple-500/40"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0a10]" />
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-syne font-bold text-sm text-white lowercase">
                      {recipientUsername}
                    </span>
                    <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full font-mono">
                      main character
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 lowercase">
                    active now
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEphemeral(!isEphemeral)}
                  className={`p-2 rounded-full border transition-all ${
                    isEphemeral
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'border-white/10 text-zinc-400 hover:text-white'
                  }`}
                  title={isEphemeral ? 'ephemeral mode on (disappears after reading)' : 'normal chat mode'}
                >
                  <Flame className="w-4 h-4" />
                </button>

                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Ephemeral Notice Banner */}
            {isEphemeral && (
              <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-between text-[11px] text-amber-300 lowercase">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  ephemeral mode: messages vanish after closing
                </span>
                <span className="font-mono text-[10px] opacity-75">e2e vibe privacy</span>
              </div>
            )}

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => {
                const isMe = user && msg.sender_id === user.id;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs lowercase leading-relaxed ${
                        isMe
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none shadow-lg shadow-purple-600/20'
                          : 'bg-white/[0.06] border border-white/[0.08] text-zinc-200 rounded-bl-none'
                      }`}
                    >
                      {/* Audio Note player inside chat bubble */}
                      {msg.audio_url ? (
                        <div className="flex items-center gap-3 py-1">
                          <button
                            onClick={() => toggleAudio(msg.id, msg.audio_url!)}
                            className="p-2 rounded-full bg-white/20 hover:scale-105 active:scale-95 transition-all text-white"
                          >
                            {playingAudioId === msg.id ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5 ml-0.5" />
                            )}
                          </button>
                          <div className="flex items-center gap-1 h-5">
                            {[0.3, 0.7, 0.9, 0.4, 0.8, 0.5, 0.3].map((h, i) => (
                              <span
                                key={i}
                                className={`w-1 rounded-full ${
                                  playingAudioId === msg.id ? 'bg-white animate-pulse' : 'bg-white/60'
                                }`}
                                style={{ height: `${h * 100}%` }}
                              />
                            ))}
                          </div>
                          <span className="font-mono text-[10px] opacity-80">
                            {msg.audio_duration ? `${msg.audio_duration.toFixed(1)}s` : 'audio'}
                          </span>
                        </div>
                      ) : (
                        <span>{msg.content}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-1 px-1">
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-purple-400" />}
                      {msg.is_ephemeral && <Flame className="w-2.5 h-2.5 text-amber-400" />}
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Voice Recorder Overlay or Text Bar */}
            <div className="p-3 border-t border-white/[0.08] bg-white/[0.02]">
              {showVoiceRecorder ? (
                <VoiceRecorder
                  onRecorded={handleSendVoiceNote}
                  onCancel={() => setShowVoiceRecorder(false)}
                />
              ) : (
                <form onSubmit={handleSendText} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowVoiceRecorder(true)}
                    className="p-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-purple-400 hover:text-purple-300 transition-colors"
                    title="record voice note"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="send a vibe or dm..."
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-xs text-white placeholder-zinc-500 lowercase"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
