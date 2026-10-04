import React from 'react';
import { Home, Plus, MessageCircle, Shield, Sparkles } from 'lucide-react';
import { useVibe } from '../context/VibeContext';

interface MobileNavProps {
  onOpenCreate: () => void;
  onOpenDm: () => void;
  onOpenAdmin: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  onOpenCreate,
  onOpenDm,
  onOpenAdmin,
}) => {
  const { unreadMessagesCount } = useVibe();

  return (
    <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto">
      <div className="p-2 rounded-3xl glass-modal border border-white/[0.12] shadow-2xl flex items-center justify-around">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="p-3 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all"
          title="home"
        >
          <Home className="w-5 h-5 text-purple-400" />
        </button>

        <button
          onClick={onOpenCreate}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 text-white shadow-lg shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all -translate-y-2"
          title="drop vibe"
        >
          <Plus className="w-6 h-6" />
        </button>

        <button
          onClick={onOpenDm}
          className="relative p-3 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all"
          title="messages"
        >
          <MessageCircle className="w-5 h-5 text-pink-400" />
          {unreadMessagesCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center">
              {unreadMessagesCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
