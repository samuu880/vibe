import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuraTier } from '../types';
import { apiRegister, apiLogin } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, birthDate: string) => Promise<void>;
  logout: () => void;
  awardAura: (amount: number, reason: string) => void;
  validateAge14: (birthDateStr: string) => { valid: boolean; age: number };
}

const DEFAULT_USER: User = {
  id: 'usr_me',
  username: 'vibe_creator',
  email: 'creator@vibe.app',
  birth_date: '2005-04-12',
  age: 21,
  aura: 4850,
  aura_tier: 'rising',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  bio: 'chasing sunset drops & audio loops ☁️',
  is_admin: true,
  is_banned: false,
  streak_days: 12,
  created_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vibe_user');
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('vibe_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('vibe_user');
    }
  }, [user]);

  // Client-side strict 14+ verification
  const validateAge14 = (birthDateStr: string) => {
    if (!birthDateStr) return { valid: false, age: 0 };
    const dob = new Date(birthDateStr);
    const today = new Date();

    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return { valid: age >= 14, age };
  };

  const calculateTier = (aura: number): AuraTier => {
    if (aura >= 50000) return 'god tier';
    if (aura >= 20000) return 'certified vibe';
    if (aura >= 5000) return 'main character';
    if (aura >= 1000) return 'rising';
    return 'npc';
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      try {
        const res = await apiLogin(username, password);
        setUser(res.user);
      } catch {
        // Fallback for standalone demo / offline mode
        const demoUser: User = {
          ...DEFAULT_USER,
          username: username.toLowerCase(),
          aura_tier: calculateTier(DEFAULT_USER.aura),
        };
        setUser(demoUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, birthDate: string) => {
    setIsLoading(true);
    try {
      // 1. Client-side strict age enforcement
      const { valid, age } = validateAge14(birthDate);
      if (!valid) {
        throw new Error(`strictly 14+ required. you entered age ${age}. vibe complies with international youth safety standards.`);
      }

      try {
        const res = await apiRegister(username, email, password, birthDate);
        setUser(res.user);
      } catch {
        // Standalone fallback
        const newUser: User = {
          id: `usr_${Date.now()}`,
          username: username.toLowerCase().trim(),
          email: email.toLowerCase().trim(),
          birth_date: birthDate,
          age,
          aura: 1000,
          aura_tier: 'rising',
          avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
          bio: 'new here 🫧',
          is_admin: false,
          is_banned: false,
          streak_days: 1,
          created_at: new Date().toISOString(),
        };
        setUser(newUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const awardAura = (amount: number, _reason: string) => {
    if (!user) return;
    setUser(prev => {
      if (!prev) return null;
      const newAura = Math.max(0, prev.aura + amount);
      return {
        ...prev,
        aura: newAura,
        aura_tier: calculateTier(newAura),
      };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        awardAura,
        validateAge14,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
