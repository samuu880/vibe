import React from 'react';
import { Home, Flame, MessageCircle, Shield, FileText, Sparkles, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVibe } from '../context/VibeContext';

interface SidebarProps {
  onOpenCreate: () => void;
  onOpenDm: () => void;
  onOpenAdmin: () => void;
  onOpenLegal: (type: 'privacy' | 'terms') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenCreate,
  onOpenDm,
  onOpenAdmin,
  onOpenLegal,
}) => {
  const { user } = useAuth();
  const { unreadMessagesCount } = useVibe();

  return (
    <aside className="hidden lg:flex flex-col w-64 p-4 sticky top-16 h-[calc(100vh-4rem)] border-r border-white/[0.06] text-left justify-between">
      <div className="space-y-6">
        {/* User preview card */}
        {user && (
          <div className="p-4 rounded-3xl glass-panel border border-white/[0.08] text-left">
            <div className="flex items-center gap-3 mb-2">
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover border border-purple-500/40"
              />
              <div>
                <div className="font-semibold text-sm text-white lowercase">
                  @{user.username}
                </div>
                <div className="text-[10px] text-zinc-400 lowercase">
                  {user.age} y/o • <span className="text-emerald-400">14+ verified</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.06] flex justify-between items-center text-xs">
              <span className="text-zinc-400 lowercase">current aura</span>
              <span className="font-mono font-bold text-purple-300">
                {user.aura.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Navigation links */}
        <nav className="space-y-1 text-xs">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.05] text-white font-semibold flex items-center gap-3 lowercase transition-all"
          >
            <Home className="w-4 h-4 text-purple-400" />
            <span>home feed</span>
          </button>

          <button
            onClick={onOpenDm}
            className="w-full px-4 py-2.5 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/[0.04] flex items-center justify-between lowercase transition-all"
          >
            <div className="flex items-center gap-3">
              <MessageCircle className="w-4 h-4 text-pink-400" />
              <span>direct messages</span>
            </div>
            {unreadMessagesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white font-bold text-[10px]">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenCreate}
            className="w-full px-4 py-2.5 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/[0.04] flex items-center gap-3 lowercase transition-all"
          >
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            <span>create drop</span>
          </button>
        </nav>
      </div>

      {/* Legal & Compliance Footer */}
      <div className="pt-4 border-t border-white/[0.06] space-y-2 text-[11px] text-zinc-500 lowercase">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenLegal('privacy')}
            className="hover:text-zinc-300 transition-colors"
          >
            privacy policy
          </button>
          <span>•</span>
          <button
            onClick={() => onOpenLegal('terms')}
            className="hover:text-zinc-300 transition-colors"
          >
            terms of service
          </button>
        </div>

        <div className="text-[10px] text-zinc-600">
          vibe platform • gdpr & 14+ compliant
        </div>
      </div>
    </aside>
  );
};
