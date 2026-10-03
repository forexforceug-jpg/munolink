// src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { locationService } from '../services/location.service';

WebBrowser.maybeCompleteAuthSession();

// ============================================================
// Types
// ============================================================
interface AuthContextType {
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  user: User | null;
  session: Session | null;

  signUpWithEmail: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<void>;
  verifyEmailOtp: (
    email: string,
    token: string,
    fullName?: string
  ) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;

  signUpWithPhone: (
    phone: string,
    password: string,
    fullName?: string
  ) => Promise<void>;
  verifyPhoneOtp: (
    phone: string,
    token: string,
    fullName?: string
  ) => Promise<void>;
  signInWithPhonePassword: (phone: string, password: string) => Promise<void>;

  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  joinAsGuest: () => void;

  requestPasswordReset: (email: string) => Promise<void>;
  verifyPasswordResetOtp: (email: string, token: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;

  requestPhonePasswordReset: (phone: string) => Promise<void>;
  verifyPhonePasswordResetOtp: (phone: string, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================
// Helpers
// ============================================================
function generateNonce(length = 32): string {
  const bytes: any = Crypto.getRandomBytes(length);
  return Array.from(bytes as Uint8Array)
    .map((b: number) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function upsertUserProfile(params: {
  userId: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
}): Promise<void> {
  const { userId, fullName, email, phone } = params;
  if (!userId) return;

  const patch: Record<string, any> = { id: userId };

  if (fullName && fullName.trim().length > 0) {
    patch.full_name = fullName.trim();
  }
  if (email) patch.email = email;
  if (phone) patch.phone_number = phone;

  if (Object.keys(patch).length <= 1) return;

  try {
    const { error } = await supabase
      .from('users')
      .upsert(patch, { onConflict: 'id' });
    if (error && __DEV__) {
      console.log('ℹ️ upsertUserProfile warning:', error.message);
    }
  } catch (err) {
    if (__DEV__) console.log('ℹ️ upsertUserProfile threw:', err);
  }
}

function normaliseUgandanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('256')) return `+${digits}`;
  if (digits.startsWith('0')) return `+256${digits.slice(1)}`;
  return `+256${digits}`;
}

// ============================================================
// Location persistence
// ============================================================

/** Get coordinates on web using the browser geolocation API. */
function getWebLocation(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }

    // Fail fast if permission has already been denied.
    try {
      navigator.permissions
        ?.query({ name: 'geolocation' as PermissionName })
        .then((perm) => {
          if (perm.state === 'denied') {
            resolve(null);
          }
        })
        .catch(() => {});
    } catch {
      /* permission API not available */
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  });
}

/** One-shot reverse geocode (best effort — never throws). */
async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{
  city: string | null;
  region: string | null;
  country: string | null;
}> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        // Nominatim asks for a UA. Browsers ignore custom UA, this
        // is mostly here for native where it's honoured.
        'User-Agent': 'Munolink/1.0 (contact@munolink.com)',
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      return { city: null, region: null, country: null };
    }
    const data = (await res.json()) as any;
    const a = data?.address || {};
    return {
      city:
        a.city ||
        a.town ||
        a.village ||
        a.suburb ||
        a.county ||
        null,
      region: a.state || a.region || null,
      country: a.country || null,
    };
  } catch {
    return { city: null, region: null, country: null };
  }
}

/**
 * Persist the user's location fields to the `users` table.
 * Idempotent — writes at most once per user per install.
 */
async function persistUserLocation(userId: string): Promise<void> {
  if (!userId) return;

  // Guard: have we already written location for this user?
  const guardKey = `@munolink/location_written/${userId}`;
  try {
    const already = await AsyncStorage.getItem(guardKey);
    if (already === '1') return;
  } catch {
    /* ignore — fall through and try again */
  }

  try {
    // Skip if the row already has location set.
    const { data: row, error: readErr } = await supabase
      .from('users')
      .select('latitude, longitude, location_city, location_region, location_country')
      .eq('id', userId)
      .maybeSingle();

    if (readErr && __DEV__) {
      console.log('ℹ️ location read warning:', readErr.message);
    }

    if (
      row?.latitude != null &&
      row?.longitude != null &&
      (row?.location_city || row?.location_region || row?.location_country)
    ) {
      // Nothing to do — mark guarded and bail.
      try {
        await AsyncStorage.setItem(guardKey, '1');
      } catch {}
      return;
    }

    // Acquire coordinates.
    let coords: { latitude: number; longitude: number } | null = null;

    if (Platform.OS === 'web') {
      coords = await getWebLocation();
    } else {
      try {
        const loc = await locationService.getCurrentLocation();
        if (loc?.latitude != null && loc?.longitude != null) {
          coords = { latitude: loc.latitude, longitude: loc.longitude };
        }
      } catch {
        coords = null;
      }
    }

    if (!coords) return; // user denied / unavailable — try again next time

    const { city, region, country } = await reverseGeocode(
      coords.latitude,
      coords.longitude
    );

    const patch: Record<string, any> = {
      id: userId,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
    if (city) patch.location_city = city;
    if (region) patch.location_region = region;
    if (country) patch.location_country = country;

    const { error: upErr } = await supabase
      .from('users')
      .upsert(patch, { onConflict: 'id' });

    if (upErr) {
      if (__DEV__) console.log('ℹ️ location upsert warning:', upErr.message);
      return;
    }

    try {
      await AsyncStorage.setItem(guardKey, '1');
    } catch {}
  } catch (err) {
    if (__DEV__) console.log('ℹ️ persistUserLocation threw:', err);
  }
}

// ============================================================
// Provider
// ============================================================
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const rawNonceRef = React.useRef<string | null>(null);

  // Deep link handler for Google OAuth on web
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      try {
        const { params, errorCode } = QueryParams.getQueryParams(event.url);
        if (errorCode) return;
        const { access_token, refresh_token } = params;
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        }
      } catch (err) {
        console.warn('Deep link error:', err);
      }
    };
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  // Restore session on mount
  useEffect(() => {
    let cancelled = false;
    const initAuth = async () => {
      try {
        const {
          data: { session: restored },
        } = await supabase.auth.getSession();
        if (!cancelled && restored) {
          setSession(restored);
          setUser(restored.user);
          setIsAuthenticated(true);
          setIsGuest(false);
          // Fire-and-forget location write for restored sessions.
          persistUserLocation(restored.user.id).catch(() => {});
        } else if (!cancelled) {
          setIsGuest(true);
        }
      } catch (e) {
        console.error('Auth init error:', e);
        if (!cancelled) setIsGuest(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    initAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  // Listen to all auth events — handles Google / OAuth completions
  // that don't pass through our signup helpers.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsAuthenticated(!!newSession);
      setIsGuest(!newSession);

      // ✅ Any time a user becomes authenticated (including the
      // Google redirect completing), make sure we have location.
      if (
        newSession?.user?.id &&
        (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')
      ) {
        persistUserLocation(newSession.user.id).catch(() => {});
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Google OAuth (native)
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success' && response.params.id_token) {
      supabase.auth
        .signInWithIdToken({
          provider: 'google',
          token: response.params.id_token,
          nonce: rawNonceRef.current || undefined,
        })
        .then(({ data, error }) => {
          if (error) throw error;
          // onAuthStateChange also fires, but call directly so the
          // persistence happens immediately in this flow.
          if (data?.user?.id) {
            persistUserLocation(data.user.id).catch(() => {});
          }
        })
        .catch(() => {
          /* silent — UI handles */
        });
    }
  }, [response]);

  const signInWithGoogle = async () => {
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
      return;
    }
    try {
      rawNonceRef.current = generateNonce();
      await promptAsync();
    } catch (error: any) {
      throw new Error('Failed to sign in with Google.');
    }
  };

  // ============================================================
  // EMAIL SIGNUP / VERIFY / SIGNIN
  // ============================================================
  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName?: string
  ) => {
    const trimmedName = fullName?.trim() || null;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: trimmedName },
      },
    });
    if (error) throw error;

    if (data?.user?.id) {
      await upsertUserProfile({
        userId: data.user.id,
        fullName: trimmedName,
        email,
      });
      // ✅ Persist location for the new account.
      persistUserLocation(data.user.id).catch(() => {});
    }
  };

  const verifyEmailOtp = async (
    email: string,
    token: string,
    fullName?: string
  ) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });
    if (error) throw error;

    const fromArgs = fullName?.trim() || null;
    const fromMeta =
      (data?.user?.user_metadata as any)?.full_name?.trim?.() || null;
    const resolvedName = fromArgs || fromMeta || null;

    if (data?.user?.id) {
      if (resolvedName) {
        await upsertUserProfile({
          userId: data.user.id,
          fullName: resolvedName,
          email,
        });
      }
      // ✅ Persist location after verification.
      persistUserLocation(data.user.id).catch(() => {});
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  // ============================================================
  // PHONE SIGNUP / VERIFY / SIGNIN
  // ============================================================
  const signUpWithPhone = async (
    phone: string,
    password: string,
    fullName?: string
  ) => {
    const trimmedName = fullName?.trim() || null;
    const e164 = normaliseUgandanPhone(phone);

    const { data, error } = await supabase.auth.signUp({
      phone: e164,
      password,
      options: {
        data: { full_name: trimmedName },
      },
    });
    if (error) throw error;

    if (data?.user?.id) {
      await upsertUserProfile({
        userId: data.user.id,
        fullName: trimmedName,
        phone: e164,
      });
      // ✅ Persist location for the new account.
      persistUserLocation(data.user.id).catch(() => {});
    }
  };

  const verifyPhoneOtp = async (
    phone: string,
    token: string,
    fullName?: string
  ) => {
    const e164 = normaliseUgandanPhone(phone);

    const { data, error } = await supabase.auth.verifyOtp({
      phone: e164,
      token,
      type: 'sms',
    });
    if (error) throw error;

    const fromArgs = fullName?.trim() || null;
    const fromMeta =
      (data?.user?.user_metadata as any)?.full_name?.trim?.() || null;
    const resolvedName = fromArgs || fromMeta || null;

    if (data?.user?.id) {
      if (resolvedName) {
        await upsertUserProfile({
          userId: data.user.id,
          fullName: resolvedName,
          phone: e164,
        });
      }
      // ✅ Persist location after verification.
      persistUserLocation(data.user.id).catch(() => {});
    }
  };

  const signInWithPhonePassword = async (
    phone: string,
    password: string
  ) => {
    const e164 = normaliseUgandanPhone(phone);
    const { error } = await supabase.auth.signInWithPassword({
      phone: e164,
      password,
    });
    if (error) throw error;
  };

  // ============================================================
  // EMAIL PASSWORD RESET
  // ============================================================
  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: undefined,
    });
    if (error) throw error;
  };

  const verifyPasswordResetOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });
    if (error) throw error;
  };

  // ============================================================
  // PHONE PASSWORD RESET
  // ============================================================
  const requestPhonePasswordReset = async (phone: string) => {
    const e164 = normaliseUgandanPhone(phone);

    if (!e164 || e164.length < 10) {
      throw new Error('Please enter a valid phone number.');
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: e164,
      options: { shouldCreateUser: false },
    });
    if (error) throw error;
  };

  const verifyPhonePasswordResetOtp = async (
    phone: string,
    token: string
  ) => {
    const e164 = normaliseUgandanPhone(phone);

    const { error } = await supabase.auth.verifyOtp({
      phone: e164,
      token,
      type: 'sms',
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const {
      data: { session: active },
    } = await supabase.auth.getSession();

    if (!active) {
      throw new Error(
        'You must verify your code first before setting a new password.'
      );
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      const raw = (error.message || '').toLowerCase();
      const code = (error as any)?.code || '';

      if (
        code === 'same_password' ||
        raw.includes('same_password') ||
        raw.includes('should be different') ||
        raw.includes('different from')
      ) {
        throw new Error(
          'Your new password must be different from your current one. Please choose a different password.'
        );
      }

      if (raw.includes('weak') || raw.includes('short')) {
        throw new Error(
          'Please choose a stronger password (at least 6 characters).'
        );
      }

      if (
        raw.includes('auth session missing') ||
        raw.includes('session not found') ||
        raw.includes('jwt expired')
      ) {
        throw new Error(
          'Your reset session has expired. Please request a new code.'
        );
      }

      throw new Error(error.message || 'Failed to update password.');
    }
  };

  // ============================================================
  // SIGN OUT / GUEST
  // ============================================================
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const joinAsGuest = () => {
    setIsGuest(true);
    setIsAuthenticated(false);
    setUser(null);
    setSession(null);
  };

  // ============================================================
  // Context value
  // ============================================================
  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      isGuest,
      isLoading,
      user,
      session,
      signUpWithEmail,
      verifyEmailOtp,
      signInWithEmail,
      signUpWithPhone,
      verifyPhoneOtp,
      signInWithPhonePassword,
      signInWithGoogle,
      signOut,
      logout: signOut,
      joinAsGuest,
      requestPasswordReset,
      verifyPasswordResetOtp,
      updatePassword,
      requestPhonePasswordReset,
      verifyPhonePasswordResetOtp,
    }),
    [isAuthenticated, isGuest, isLoading, user, session]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};