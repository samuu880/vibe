import PocketBase from 'pocketbase';

// Default PocketBase backend URL or local instance
const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL || 'https://vibe-pb.fly.dev';

export const pb = new PocketBase(POCKETBASE_URL);

// Auto-cancellation of duplicate pending requests
pb.autoCancellation(false);

/**
 * Check if the PocketBase service is currently responding
 */
export async function checkPocketBaseHealth(): Promise<boolean> {
  try {
    const health = await pb.health.check();
    return health.code === 200;
  } catch {
    return false;
  }
}
