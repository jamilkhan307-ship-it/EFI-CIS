import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase credentials in environment variables.");
}

// Custom lock implementation that uses a simple mutex instead of navigator.locks
// This prevents the "Lock broken by another request with the 'steal' option" error
// that occurs in React StrictMode and during HMR reloads
const locks = new Map<string, Promise<any>>();

const customLock = async (name: string, _acquireTimeout: number, callback: () => Promise<any>) => {
  // If there's an existing lock, wait for it to finish
  const existing = locks.get(name);
  if (existing) {
    try { await existing; } catch { /* ignore */ }
  }
  
  // Now run our callback
  const promise = callback();
  locks.set(name, promise);
  
  try {
    return await promise;
  } finally {
    // Only delete if this is still our lock
    if (locks.get(name) === promise) {
      locks.delete(name);
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    lock: customLock as any,
    persistSession: true,
    storageKey: 'cir-portal-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
