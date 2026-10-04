import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Zap, X } from 'lucide-react';
import { AuraTier } from '../types';

interface AuraBadgeProps {
  aura: number;
  tier: AuraTier;
  streakDays: number;
}

const TIER_THRESHOLDS = [
  { tier: 'npc', min: 0, max: 1000, color: 'text-zinc-400', border: 'border-zinc-700' },
  { tier: 'rising', min: 1000, max: 5000, color: 'text-cyan-400', border: 'border-cyan-500/40' },
  { tier: 'main character', min: 5000, max: 20000, color: 'text-purple-400', border: 'border-purple-500/40' },
  { tier: 'certified vibe', min: 20000, max: 50000, color: 'text-pink-400', border: 'border-pink-500/40' },
  { tier: 'god tier', min: 50000, max: 100000, color: 'text-amber-300', border: 'border-amber-400/50' },
];

export const AuraBadge: React.FC<AuraBadgeProps> = ({ aura, tier, streakDays }) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentTierInfo = TIER_THRESHOLDS.find(t => t.tier === tier) || TIER_THRESHOLDS[0];
  const nextTierIndex = TIER_THRESHOLDS.findIndex(t => t.tier === tier) + 1;
  const nextTier = nextTierIndex < TIER_THRESHOLDS.length ? TIER_THRESHOLDS[nextTierIndex] : null;

  const progressPercent = nextTier
    ? Math.min(100, Math.max(0, ((aura - currentTierInfo.min) / (nextTier.min - currentTierInfo.min)) * 100))
    : 100;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] hover:border-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-black/40"
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
          <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 animate-pulse" />
          <span className="font-mono text-purple-200">
            {aura.toLocaleString()} <span className="text-[10px] text-zinc-400 font-sans">aura</span>
          </span>
        </div>

        <span className="w-1 h-1 rounded-full bg-zinc-600" />

        <div className="flex items-center gap-1 text-[11px] text-zinc-400 group-hover:text-zinc-200 lowercase">
          <span>🔥</span>
          <span>{streakDays}d</span>
        </div>

        <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-white/[0.05] ${currentTierInfo.color}`}>
          {tier}
        </span>
      </button>

      {/* Gamification Aura Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md p-6 rounded-3xl glass-modal border border-purple-500/20 shadow-2xl text-left"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-syne text-xl font-bold tracking-tight text-white lowercase">
                    your aura status
                  </h3>
                  <p className="text-xs text-zinc-400 lowercase">gen-z gamified social score</p>
                </div>
              </div>

              {/* Aura meter */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] mb-5">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-3xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                    {aura.toLocaleString()}
                  </span>
                  <span className={`text-xs font-bold uppercase tracking-wider ${currentTierInfo.color}`}>
                    {tier}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>{currentTierInfo.min.toLocaleString()}</span>
                  <span>{nextTier ? `next tier: ${nextTier.tier} (${nextTier.min.toLocaleString()})` : 'max tier'}</span>
                </div>
              </div>

              {/* How to gain aura */}
              <div className="space-y-2 mb-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                  how to stack aura
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="font-bold text-emerald-400">+500 aura</div>
                    <div className="text-zinc-400 text-[11px] lowercase">on-time bereal drop</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="font-bold text-purple-400">+250 aura</div>
                    <div className="text-zinc-400 text-[11px] lowercase">voice note upload</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="font-bold text-pink-400">+100 aura</div>
                    <div className="text-zinc-400 text-[11px] lowercase">daily post streak</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="font-bold text-cyan-400">+10 aura</div>
                    <div className="text-zinc-400 text-[11px] lowercase">each like received</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
              >
                got it, let's stack aura
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
