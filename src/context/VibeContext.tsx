import React, { createContext, useContext, useState, useEffect } from 'react';
import { Vibe, DirectMessage, Comment } from '../types';
import { useAuth } from './AuthContext';
import { moderateText, moderateImage } from '../lib/moderation';
import confetti from 'canvas-confetti';

interface VibeContextType {
  vibes: Vibe[];
  messages: DirectMessage[];
  unreadMessagesCount: number;
  activeDmUser: string | null;
  setActiveDmUser: (user: string | null) => void;
  createVibe: (vibeData: Partial<Vibe>) => Promise<{ success: boolean; error?: string }>;
  likeVibe: (vibeId: string) => void;
  addComment: (vibeId: string, content: string) => Promise<{ success: boolean; error?: string }>;
  getComments: (vibeId: string) => Comment[];
  sendMessage: (receiverId: string, content: string, audioUrl?: string, audioDuration?: number, isEphemeral?: boolean) => Promise<boolean>;
  deleteVibe: (vibeId: string) => void;
  dailyDropActive: boolean;
  timeRemainingSec: number;
}

const INITIAL_VIBES: Vibe[] = [
  {
    id: 'vibe_br_1',
    user_id: 'usr_milo',
    username: 'milo_vibes',
    user_avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    user_aura_tier: 'certified vibe',
    type: 'bereal',
    front_image_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
    back_image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    caption: '2 min vibe check ⚡️ coding the drop with lo-fi on repeat',
    tags: ['bereal', 'nightroutine', 'vibes'],
    aura_earned: 500,
    likes_count: 247,
    comments_count: 18,
    is_on_time: true,
    moderation_flag: 'clean',
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'vibe_audio_1',
    user_id: 'usr_sofia',
    username: 'sofiap',
    user_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    user_aura_tier: 'main character',
    type: 'audio',
    audio_url: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg',
    audio_duration: 12.3,
    audio_waveform: [0.15, 0.45, 0.85, 0.65, 0.95, 0.55, 0.35, 0.75, 0.45, 0.65, 0.85, 0.35, 0.25],
    caption: 'voice note from the coffee shop terrace ☕️ rain is hitting different today',
    tags: ['audio', 'rain', 'cozy'],
    aura_earned: 250,
    likes_count: 142,
    comments_count: 9,
    is_on_time: false,
    moderation_flag: 'clean',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'vibe_post_2',
    user_id: 'usr_kai',
    username: 'kai_zen',
    user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    user_aura_tier: 'god tier',
    type: 'post',
    media_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    caption: 'neon reflections in shibuya at 3am. aura never drops.',
    tags: ['tokyo', 'aesthetic', 'cyber'],
    aura_earned: 300,
    likes_count: 512,
    comments_count: 42,
    moderation_flag: 'clean',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
];

const INITIAL_MESSAGES: DirectMessage[] = [
  {
    id: 'dm_1',
    sender_id: 'usr_sofia',
    receiver_id: 'usr_me',
    content: 'yo! did you do the 2-min vibe check yet?',
    is_ephemeral: false,
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'dm_2',
    sender_id: 'usr_me',
    receiver_id: 'usr_sofia',
    content: 'just dropped it! got the +500 on-time aura ⚡️',
    is_ephemeral: false,
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 'dm_3',
    sender_id: 'usr_sofia',
    receiver_id: 'usr_me',
    content: 'listen to this snippet:',
    audio_url: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg',
    audio_duration: 6.2,
    is_ephemeral: false,
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
];

const VibeContext = createContext<VibeContextType | undefined>(undefined);

export function VibeProvider({ children }: { children: React.ReactNode }) {
  const { user, awardAura } = useAuth();
  const [vibes, setVibes] = useState<Vibe[]>(() => {
    const saved = localStorage.getItem('vibe_feed');
    return saved ? JSON.parse(saved) : INITIAL_VIBES;
  });
  const [messages, setMessages] = useState<DirectMessage[]>(() => {
    const saved = localStorage.getItem('vibe_messages');
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [activeDmUser, setActiveDmUser] = useState<string | null>(null);

  // Daily BeReal Vibe Check countdown timer (simulating live 2-minute drop window)
  const [dailyDropActive] = useState(true);
  const [timeRemainingSec, setTimeRemainingSec] = useState(120);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemainingSec(prev => (prev > 0 ? prev - 1 : 120));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('vibe_feed', JSON.stringify(vibes));
  }, [vibes]);

  useEffect(() => {
    localStorage.setItem('vibe_messages', JSON.stringify(messages));
  }, [messages]);

  const createVibe = async (vibeData: Partial<Vibe>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'you must be logged in' };

    // 1. AI Content Moderation for text
    const textMod = moderateText(vibeData.caption || '');
    if (textMod.isBlocked) {
      return { success: false, error: textMod.reason };
    }

    // 2. AI Content Moderation for images
    if (vibeData.front_image_url) {
      const imgMod = await moderateImage(vibeData.front_image_url);
      if (imgMod.isBlocked) {
        return { success: false, error: imgMod.reason };
      }
    }
    if (vibeData.back_image_url) {
      const imgMod = await moderateImage(vibeData.back_image_url);
      if (imgMod.isBlocked) {
        return { success: false, error: imgMod.reason };
      }
    }
    if (vibeData.media_url) {
      const imgMod = await moderateImage(vibeData.media_url);
      if (imgMod.isBlocked) {
        return { success: false, error: imgMod.reason };
      }
    }

    // Calculate aura earned
    let earned = 100;
    if (vibeData.type === 'bereal') {
      earned = vibeData.is_on_time ? 500 : 150;
    } else if (vibeData.type === 'audio') {
      earned = 250;
    }

    const newVibe: Vibe = {
      id: `vibe_${Date.now()}`,
      user_id: user.id,
      username: user.username,
      user_avatar: user.avatar_url,
      user_aura_tier: user.aura_tier,
      type: vibeData.type || 'post',
      front_image_url: vibeData.front_image_url,
      back_image_url: vibeData.back_image_url,
      media_url: vibeData.media_url,
      audio_url: vibeData.audio_url,
      audio_duration: vibeData.audio_duration,
      audio_waveform: vibeData.audio_waveform || [0.2, 0.5, 0.8, 0.4, 0.9, 0.6, 0.3],
      caption: vibeData.caption || '',
      tags: vibeData.tags || [],
      aura_earned: earned,
      likes_count: 0,
      liked_by_me: false,
      comments_count: 0,
      is_on_time: vibeData.is_on_time,
      late_minutes: vibeData.late_minutes,
      moderation_flag: textMod.isFlagged ? 'flagged' : 'clean',
      created_at: new Date().toISOString(),
    };

    setVibes(prev => [newVibe, ...prev]);
    awardAura(earned, `posted a new ${vibeData.type}`);

    // Trigger celebration confetti for high-aura drops
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.85 },
      colors: ['#8b5cf6', '#ec4899', '#06b6d4'],
    });

    return { success: true };
  };

  const likeVibe = (vibeId: string) => {
    setVibes(prev =>
      prev.map(v => {
        if (v.id === vibeId) {
          const isLiked = v.liked_by_me;
          if (!isLiked) {
            awardAura(10, 'liked a vibe');
          }
          return {
            ...v,
            likes_count: isLiked ? v.likes_count - 1 : v.likes_count + 1,
            liked_by_me: !isLiked,
          };
        }
        return v;
      })
    );
  };

  const addComment = async (vibeId: string, content: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'login required' };

    // AI moderation on comment
    const mod = moderateText(content);
    if (mod.isBlocked) {
      return { success: false, error: mod.reason };
    }

    const newComment: Comment = {
      id: `comm_${Date.now()}`,
      vibe_id: vibeId,
      user_id: user.id,
      username: user.username,
      user_avatar: user.avatar_url,
      content,
      created_at: new Date().toISOString(),
    };

    setComments(prev => ({
      ...prev,
      [vibeId]: [...(prev[vibeId] || []), newComment],
    }));

    setVibes(prev =>
      prev.map(v => (v.id === vibeId ? { ...v, comments_count: v.comments_count + 1 } : v))
    );

    awardAura(15, 'commented on vibe');
    return { success: true };
  };

  const getComments = (vibeId: string): Comment[] => {
    return comments[vibeId] || [];
  };

  const sendMessage = async (
    receiverId: string,
    content: string,
    audioUrl?: string,
    audioDuration?: number,
    isEphemeral = false
  ): Promise<boolean> => {
    if (!user) return false;

    // AI moderation check
    if (content) {
      const mod = moderateText(content);
      if (mod.isBlocked) {
        alert(`message blocked: ${mod.reason}`);
        return false;
      }
    }

    const newMsg: DirectMessage = {
      id: `dm_${Date.now()}`,
      sender_id: user.id,
      receiver_id: receiverId,
      content,
      audio_url: audioUrl,
      audio_duration: audioDuration,
      is_ephemeral: isEphemeral,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMsg]);
    awardAura(5, 'sent message');
    return true;
  };

  const deleteVibe = (vibeId: string) => {
    setVibes(prev => prev.filter(v => v.id !== vibeId));
  };

  const unreadMessagesCount = messages.filter(
    m => !m.is_read && user && m.receiver_id === user.id
  ).length;

  return (
    <VibeContext.Provider
      value={{
        vibes,
        messages,
        unreadMessagesCount,
        activeDmUser,
        setActiveDmUser,
        createVibe,
        likeVibe,
        addComment,
        getComments,
        sendMessage,
        deleteVibe,
        dailyDropActive,
        timeRemainingSec,
      }}
    >
      {children}
    </VibeContext.Provider>
  );
}

export function useVibe() {
  const context = useContext(VibeContext);
  if (!context) {
    throw new Error('useVibe must be used within a VibeProvider');
  }
  return context;
}
