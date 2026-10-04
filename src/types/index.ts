export type AuraTier = 'npc' | 'rising' | 'main character' | 'certified vibe' | 'god tier';

export interface User {
  id: string;
  username: string;
  email: string;
  birth_date: string; // YYYY-MM-DD
  age: number;
  aura: number;
  aura_tier: AuraTier;
  avatar_url: string;
  bio: string;
  is_admin: boolean;
  is_banned: boolean;
  streak_days: number;
  created_at: string;
}

export type VibeType = 'bereal' | 'post' | 'audio';

export interface Vibe {
  id: string;
  user_id: string;
  username: string;
  user_avatar: string;
  user_aura_tier: AuraTier;
  type: VibeType;
  front_image_url?: string;
  back_image_url?: string;
  media_url?: string;
  audio_url?: string;
  audio_duration?: number;
  audio_waveform?: number[];
  caption: string;
  tags: string[];
  aura_earned: number;
  likes_count: number;
  liked_by_me?: boolean;
  comments_count: number;
  is_on_time?: boolean;
  late_minutes?: number;
  moderation_flag: 'clean' | 'flagged' | 'blocked';
  created_at: string;
}

export interface Comment {
  id: string;
  vibe_id: string;
  user_id: string;
  username: string;
  user_avatar: string;
  content: string;
  created_at: string;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  audio_url?: string;
  audio_duration?: number;
  is_ephemeral: boolean;
  is_read: boolean;
  created_at: string;
}

export interface ModerationIncident {
  id: string;
  user_id: string;
  content_type: 'text' | 'media';
  reason: string;
  confidence: number;
  raw_content: string;
  action: 'blocked' | 'flagged' | 'approved';
  timestamp: string;
}

export interface SystemStats {
  system: {
    status: string;
    uptime_seconds: number;
    go_routines: number;
    memory_alloc_mb: number;
  };
  cache: {
    active_keys: number;
    hits: number;
    misses: number;
    hit_ratio: number;
  };
  community: {
    total_users: number;
    total_vibes: number;
    flagged_vibes: number;
  };
  moderation_logs: ModerationIncident[];
  users: User[];
}

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  personalization: boolean;
  acceptedAt?: string;
}
