import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Play, Pause, Zap, RefreshCw, Send, Trash2 } from 'lucide-react';
import { Vibe } from '../types';
import { useVibe } from '../context/VibeContext';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

interface PostCardProps {
  vibe: Vibe;
}

export const PostCard: React.FC<PostCardProps> = ({ vibe }) => {
  const { likeVibe, addComment, getComments, deleteVibe } = useVibe();
  const { user } = useAuth();
  const [isSwapped, setIsSwapped] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTapRef = useRef<number>(0);

  const comments = getComments(vibe.id);

  // Double-tap to like (Instagram style)
  const handleCardDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!vibe.liked_by_me) {
        likeVibe(vibe.id);
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#ec4899', '#8b5cf6'],
        });
      }
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
    }
    lastTapRef.current = now;
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    setCommentError(null);
    const res = await addComment(vibe.id, commentInput);
    if (!res.success) {
      setCommentError(res.error || 'could not post comment');
      return;
    }
    setCommentInput('');
  };

  const isOwner = user && user.id === vibe.user_id;

  return (
    <article className="w-full max-w-lg mx-auto rounded-3xl glass-panel border border-white/[0.08] overflow-hidden shadow-2xl transition-all duration-300 hover:border-purple-500/30 mb-6">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={vibe.user_avatar}
              alt={vibe.username}
              className="w-10 h-10 rounded-full object-cover border border-purple-500/40"
            />
            {vibe.is_on_time && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#09090f] flex items-center justify-center text-[8px] text-white">
                ⚡️
              </span>
            )}
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-white lowercase">
                {vibe.username}
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-white/[0.06] text-purple-300">
                {vibe.user_aura_tier}
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 lowercase">
              {vibe.type === 'bereal' ? (vibe.is_on_time ? 'on time bereal' : 'late drop') : vibe.type}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Aura score badge for post */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono">
            <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span>+{vibe.aura_earned}</span>
          </div>

          {isOwner && (
            <button
              onClick={() => deleteVibe(vibe.id)}
              className="p-1.5 rounded-full text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Media Content Area */}
      <div
        onClick={handleCardDoubleTap}
        className="relative aspect-square w-full bg-zinc-950 flex items-center justify-center overflow-hidden cursor-pointer select-none"
      >
        {/* BeReal Dual Camera Mode */}
        {vibe.type === 'bereal' && (
          <>
            <img
              src={isSwapped ? vibe.front_image_url : vibe.back_image_url}
              alt="environment"
              className="w-full h-full object-cover transition-all duration-500"
            />

            {/* Picture-in-Picture PIP Selfie */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsSwapped(!isSwapped);
              }}
              className="absolute top-4 left-4 w-28 h-36 rounded-2xl overflow-hidden border-2 border-white/90 shadow-2xl cursor-pointer bg-zinc-900 group"
            >
              <img
                src={isSwapped ? vibe.back_image_url : vibe.front_image_url}
                alt="selfie"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-white" />
              </div>
            </motion.div>
          </>
        )}

        {/* Regular Single Photo/Video Post */}
        {vibe.type === 'post' && vibe.media_url && (
          <img
            src={vibe.media_url}
            alt="vibe visual"
            className="w-full h-full object-cover"
          />
        )}

        {/* Voice Note Post with Dynamic Soundwave */}
        {vibe.type === 'audio' && (
          <div className="w-full h-full p-8 flex flex-col items-center justify-center bg-gradient-to-br from-purple-950/40 via-zinc-950 to-pink-950/30">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleAudio();
              }}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-2xl shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all mb-6"
            >
              {isPlayingAudio ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </button>

            {/* Audio Waveform visualization */}
            <div className="flex items-center gap-1.5 h-16 w-full max-w-xs justify-center mb-4">
              {(vibe.audio_waveform || [0.3, 0.6, 0.9, 0.4, 0.7, 0.5, 0.8, 0.3, 0.6]).map((val, idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    height: isPlayingAudio ? `${Math.max(20, Math.random() * 100)}%` : `${val * 100}%`,
                  }}
                  transition={{ duration: 0.2 }}
                  className="w-2 rounded-full bg-gradient-to-t from-purple-500 to-cyan-400"
                />
              ))}
            </div>

            <span className="text-xs text-zinc-400 font-mono">
              {vibe.audio_duration ? `${vibe.audio_duration.toFixed(1)}s voice note` : 'audio vibe'}
            </span>

            {vibe.audio_url && (
              <audio
                ref={audioRef}
                src={vibe.audio_url}
                onEnded={() => setIsPlayingAudio(false)}
                className="hidden"
              />
            )}
          </div>
        )}

        {/* Double-Tap Heart Burst Animation */}
        <AnimatePresence>
          {showHeartAnim && (
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 1.4, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute pointer-events-none drop-shadow-2xl"
            >
              <Heart className="w-28 h-28 text-pink-500 fill-pink-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Post Actions & Caption */}
      <div className="p-4 text-left">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => likeVibe(vibe.id)}
              className="flex items-center gap-1.5 group transition-transform active:scale-75"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  vibe.liked_by_me ? 'text-pink-500 fill-pink-500' : 'text-zinc-400 group-hover:text-pink-400'
                }`}
              />
              <span className="text-xs font-semibold text-zinc-300">
                {vibe.likes_count}
              </span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs font-semibold">
                {vibe.comments_count + comments.length}
              </span>
            </button>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'vibe', url: window.location.href });
                }
              }}
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {vibe.moderation_flag === 'flagged' && (
            <span className="text-[10px] text-amber-400 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
              under review
            </span>
          )}
        </div>

        {/* Caption */}
        <p className="text-sm text-zinc-200 lowercase leading-relaxed mb-2">
          <span className="font-bold text-white mr-2">{vibe.username}</span>
          {vibe.caption}
        </p>

        {/* Tags */}
        {vibe.tags && vibe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {vibe.tags.map(tag => (
              <span
                key={tag}
                className="text-[11px] text-purple-400 hover:text-purple-300 lowercase cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Comments Section Toggle */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-3 border-t border-white/[0.06] space-y-3"
            >
              {/* Existing comments */}
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-zinc-500 lowercase py-1">no comments yet. drop the first vibe.</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="text-xs flex items-start gap-2">
                      <span className="font-semibold text-zinc-200">{c.username}</span>
                      <span className="text-zinc-400 lowercase">{c.content}</span>
                    </div>
                  ))
                )}
              </div>

              {commentError && (
                <p className="text-xs text-red-400 lowercase">{commentError}</p>
              )}

              {/* Add comment input */}
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  placeholder="say something (ai moderated)..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 lowercase"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-500 active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
};
