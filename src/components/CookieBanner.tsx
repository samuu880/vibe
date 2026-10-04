import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Cookie, Check, SlidersHorizontal } from 'lucide-react';
import { CookiePreferences } from '../types';

export const CookieBanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: true,
    personalization: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem('vibe_cookie_consent');
    if (!saved) {
      // Delay display slightly for smoother UX
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const updated: CookiePreferences = {
      necessary: true,
      analytics: true,
      personalization: true,
      acceptedAt: new Date().toISOString(),
    };
    saveAndClose(updated);
  };

  const handleRejectNonEssential = () => {
    const updated: CookiePreferences = {
      necessary: true,
      analytics: false,
      personalization: false,
      acceptedAt: new Date().toISOString(),
    };
    saveAndClose(updated);
  };

  const handleSaveCustom = () => {
    const updated: CookiePreferences = {
      ...prefs,
      necessary: true,
      acceptedAt: new Date().toISOString(),
    };
    saveAndClose(updated);
  };

  const saveAndClose = (p: CookiePreferences) => {
    localStorage.setItem('vibe_cookie_consent', JSON.stringify(p));
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          aria-label="Cookie consent banner"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-5 rounded-3xl glass-modal border border-white/[0.12] shadow-2xl text-left"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-sm text-white lowercase">
                your privacy & cookies
              </h3>
              <p className="text-xs text-zinc-400 lowercase mt-1 leading-relaxed">
                vibe uses essential cookies to authenticate your session and minimal telemetry to preserve server speed. we strictly protect youth privacy (14+ verified).
              </p>
            </div>
          </div>

          {/* Granular Settings */}
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="py-3 border-y border-white/[0.08] my-3 space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white lowercase">essential cookies</span>
                  <p className="text-[10px] text-zinc-500 lowercase">required for auth & security tokens</p>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-400/10 px-2 py-0.5 rounded">
                  always active
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white lowercase">performance telemetry</span>
                  <p className="text-[10px] text-zinc-500 lowercase">measures go cache hit rates & latency</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.analytics}
                  onChange={e => setPrefs({ ...prefs, analytics: e.target.checked })}
                  className="accent-purple-600 rounded cursor-pointer w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white lowercase">personalization</span>
                  <p className="text-[10px] text-zinc-500 lowercase">remembers feed filters and aura badges</p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.personalization}
                  onChange={e => setPrefs({ ...prefs, personalization: e.target.checked })}
                  className="accent-purple-600 rounded cursor-pointer w-4 h-4"
                />
              </div>
            </motion.div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            {!showDetails ? (
              <>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-xs hover:opacity-90 active:scale-95 transition-all lowercase"
                >
                  accept all
                </button>
                <button
                  onClick={handleRejectNonEssential}
                  className="py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 text-xs transition-all lowercase"
                >
                  essential only
                </button>
                <button
                  onClick={() => setShowDetails(true)}
                  className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-all"
                  title="customize preferences"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={handleSaveCustom}
                className="w-full py-2 rounded-xl bg-purple-600 text-white font-semibold text-xs hover:opacity-90 active:scale-95 transition-all lowercase"
              >
                save selected preferences
              </button>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
