import React, { useState } from 'react';
import { Sparkles, MessageCircle, Plus, Key, LogOut, User as UserIcon, Shield, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVibe } from '../context/VibeContext';
import { AuraBadge } from './AuraBadge';

interface NavbarProps {
  onOpenCreate: () => void;
  onOpenDm: () => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onOpenLegal: (type: 'privacy' | 'terms') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreate,
  onOpenDm,
  onOpenAdmin,
  onOpenAuth,
  onOpenLegal,
}) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadMessagesCount } = useVibe();
  const [logoClicks, setLogoClicks] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Easter egg: 3 fast clicks on the logo opens the Secret Admin Vault!
  const handleLogoClick = () => {
    const next = logoClicks + 1;
    if (next >= 3) {
      setLogoClicks(0);
      onOpenAdmin();
    } else {
      setLogoClicks(next);
      setTimeout(() => setLogoClicks(0), 1000);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/[0.08] px-4 py-3 sm:px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo in Syne Font */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-1.5 group select-none text-left"
            title="triple click for secret admin vault"
          >
            <span className="font-syne text-2xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 group-hover:opacity-90 transition-opacity">
              vibe
            </span>
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
          </button>

          <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-500 uppercase tracking-widest px-2 py-0.5 rounded bg-white/[0.03]">
            .app
          </span>
        </div>

        {/* Center: Aura & Streak status */}
        {isAuthenticated && user && (
          <div className="hidden md:flex items-center">
            <AuraBadge aura={user.aura} tier={user.aura_tier} streakDays={user.streak_days} />
          </div>
        )}

        {/* Right action controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <>
              {/* Drop Vibe Button */}
              <button
                onClick={onOpenCreate}
                className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/30 hover:opacity-90 active:scale-95 transition-all lowercase"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">drop vibe</span>
              </button>

              {/* DMs / Messages */}
              <button
                onClick={onOpenDm}
                className="relative p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white transition-all active:scale-95"
                title="direct messages"
              >
                <MessageCircle className="w-5 h-5" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {unreadMessagesCount}
                  </span>
                )}
              </button>

              {/* Secret Admin icon */}
              <button
                onClick={onOpenAdmin}
                className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all border border-red-500/20"
                title="secret admin vault"
              >
                <Key className="w-4 h-4" />
              </button>

              {/* User Avatar & Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 focus:outline-none"
                >
                  <img
                    src={user?.avatar_url}
                    alt={user?.username}
                    className="w-8 h-8 rounded-full object-cover border border-purple-500/50 hover:scale-105 transition-transform"
                  />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl glass-modal border border-white/[0.1] shadow-2xl p-2 z-50 text-left space-y-1 text-xs">
                    <div className="px-3 py-2 border-b border-white/[0.08]">
                      <div className="font-semibold text-white lowercase">@{user?.username}</div>
                      <div className="text-[10px] text-zinc-400 lowercase">{user?.age} y/o • 14+ verified</div>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenLegal('privacy');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2 lowercase text-left"
                    >
                      <Shield className="w-3.5 h-3.5 text-purple-400" />
                      <span>privacy & data</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenLegal('terms');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2 lowercase text-left"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                      <span>terms & safety</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 lowercase text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>sign out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-xs hover:opacity-90 active:scale-95 transition-all lowercase"
            >
              sign in / join (14+)
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
