import { Vibe, DirectMessage, SystemStats, User } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function apiRegister(username: string, email: string, password: string, birthDate: string) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      email,
      password,
      birth_date: birthDate,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'registration failed');
  }
  return data;
}

export async function apiLogin(username: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'login failed');
  }
  return data;
}

export async function apiGetFeed(): Promise<Vibe[]> {
  try {
    const res = await fetch(`${API_BASE}/api/vibes`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.vibes || [];
  } catch {
    return [];
  }
}

export async function apiCreateVibe(vibe: Partial<Vibe>) {
  const res = await fetch(`${API_BASE}/api/vibes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vibe),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'failed to publish vibe');
  }
  return data;
}

export async function apiLikeVibe(vibeId: string) {
  const res = await fetch(`${API_BASE}/api/vibes/like/${vibeId}`, {
    method: 'POST',
  });
  return res.json();
}

export async function apiGetSecretVaultStats(secretToken: string): Promise<SystemStats> {
  const res = await fetch(`${API_BASE}/api/vault/stats`, {
    headers: {
      'X-Admin-Secret-Key': secretToken,
    },
  });

  if (!res.ok) {
    throw new Error('invalid vault secret key or access denied');
  }
  return res.json();
}

export async function apiBanUser(secretToken: string, username: string) {
  const res = await fetch(`${API_BASE}/api/vault/ban/${username}`, {
    method: 'POST',
    headers: {
      'X-Admin-Secret-Key': secretToken,
    },
  });
  return res.json();
}
