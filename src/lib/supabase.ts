// src/lib/supabase.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// ✅ Correct import - Database is exported as a type
import { Database } from '../types/database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.',
  );
}

/**
 * Storage strategy:
 *  - Native (iOS / Android): use AsyncStorage so sessions survive app restarts.
 *  - Web: use `window.localStorage` via a minimal shim so that a browser
 *    refresh keeps the user signed in.
 *
 * Supabase's own `persistSession: true` handles most of this, but the storage
 * adapter has to be platform-appropriate — using AsyncStorage's web shim
 * is fine, but localStorage is more reliable across hard refreshes.
 */
const webStorage = {
  getItem: async (key: string) => {
    try {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, value);
    } catch {
      // ignore — private mode, quota exceeded, etc.
    }
  },
  removeItem: async (key: string) => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: Platform.OS === 'web' ? (webStorage as any) : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // We handle OAuth deep links manually in AuthContext.
      detectSessionInUrl: false,
    },
    db: {
      schema: 'public',
    },
  },
);