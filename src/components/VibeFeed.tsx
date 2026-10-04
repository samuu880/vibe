import React, { useState } from 'react';
import { Camera, Radio, Grid, Zap, Clock, Sparkles } from 'lucide-react';
import { useVibe } from '../context/VibeContext';
import { PostCard } from './PostCard';
import { VibeType } from '../types';

interface VibeFeedProps {
  onOpenCreate: () => void;
}

export const VibeFeed: React.FC<VibeFeedProps> = ({ onOpenCreate }) => {
  const { vibes, timeRemainingSec } = useVibe();
  const [filter, setFilter] = useState<'all' | VibeType>('all');

  const filteredVibes = vibes.filter(v => {
    if (filter === 'all') return true;
    return v.type === filter;
  });

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full max-w-xl mx-auto px-3 sm:px-0 py-4 space-y-6">
      {/* 2-Min Daily Vibe Drop Alert Banner (BeReal style) */}
      <div className="relative p-5 rounded-3xl glass-panel border border-purple-500/30 overflow-hidden shadow-2xl text-left aura-glow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-cyan-400 flex items-center justify-center text-white shadow-lg bereal-ring">
                <Camera className="w-6 h-6" />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#09090f] animate-ping" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-syne font-bold text-base text-white tracking-tight lowercase">
                  time to vibe.
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full">
                  live drop window
                </span>
              </div>
              <p className="text-xs text-zinc-400 lowercase mt-0.5">
                what are you doing right now? snap front + back cam.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenCreate}
            className="px-4 py-2 rounded-2xl bg-white text-black font-bold text-xs hover:bg-zinc-200 active:scale-95 transition-all shadow-md lowercase flex items-center gap-1.5 shrink-0"
          >
            <Zap className="w-3.5 h-3.5 fill-black" />
            <span>post drop</span>
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5 font-mono text-purple-300">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>{formatTimer(timeRemainingSec)} remaining for +500 aura</span>
          </div>
          <span className="text-zinc-500 lowercase">no filters • real moments</span>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center justify-center gap-2 py-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold lowercase transition-all flex items-center gap-1.5 ${
            filter === 'all'
              ? 'bg-white text-black shadow-md'
              : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.08]'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>all drops</span>
        </button>

        <button
          onClick={() => setFilter('bereal')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold lowercase transition-all flex items-center gap-1.5 ${
            filter === 'bereal'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.08]'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>bereal drops</span>
        </button>

        <button
          onClick={() => setFilter('audio')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold lowercase transition-all flex items-center gap-1.5 ${
            filter === 'audio'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
              : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.08]'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>voice notes</span>
        </button>
      </div>

      {/* Posts Stream */}
      <div className="space-y-6">
        {filteredVibes.length === 0 ? (
          <div className="p-12 text-center rounded-3xl glass-panel border border-white/[0.06] text-zinc-500">
            <Sparkles className="w-10 h-10 mx-auto text-zinc-600 mb-3" />
            <p className="text-sm font-semibold lowercase text-zinc-400">no vibes in this section yet</p>
            <p className="text-xs lowercase text-zinc-600 mt-1">be the first to drop something authentic</p>
          </div>
        ) : (
          filteredVibes.map(vibe => (
            <PostCard key={vibe.id} vibe={vibe} />
          ))
        )}
      </div>
    </div>
  );
};
