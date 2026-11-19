// src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthSession, AuthUser } from '../types/auth';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { locationService } from '../services/location.service';
import { apiRequest, authApi } from '../lib/api';
import { getStoredSession } from '../lib/sessionStorage';

WebBrowser.maybeCompleteAuthSession();

// ============================================================
// Types
// ============================================================
interface AuthContextType {
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  session: AuthSession | null;

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
  fullName?: string | null;
}): Promise<void> {
  const patch: { fullName?: string } = {};
  if (params.fullName?.trim()) patch.fullName = params.fullName.trim();
  await apiRequest('/users/me/profile', { method: 'PUT', body: patch });
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
  const query = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
  });
  const result = await apiRequest<{
    data: {
      city: string | null;
      region: string | null;
      country: string | null;
    };
  }>(`/location/reverse-geocode?${query}`, { auth: false });
  return result.data;
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
    const { location: row } = await apiRequest<{
      location: {
        latitude: number | null;
        longitude: number | null;
        location_city: string | null;
        location_region: string | null;
        location_country: string | null;
      } | null;
    }>('/users/me/location');

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

    await apiRequest('/users/me/location', {
      method: 'PUT',
      body: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        city,
        region,
        country,
      },
    });

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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const rawNonceRef = React.useRef<string | null>(null);
  const [, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  const activateSession = async (active: AuthSession | null) => {
    setSession(active);
    setUser(active?.user ?? null);
    setIsAuthenticated(!!active);
    setIsGuest(!active);
    if (active?.user.id) {
      void persistUserLocation(active.user.id);
    }
  };

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      try {
        const { params, errorCode } = QueryParams.getQueryParams(event.url);
        if (errorCode) return;
        const { access_token, refresh_token } = params;
        if (access_token && refresh_token) {
          const result = await authApi.adoptSession(
            access_token,
            refresh_token
          );
          await activateSession(result.session);
        }
      } catch (err) {
        console.error('Backend OAuth callback failed:', err);
      }
    };

    void Linking.getInitialURL().then((url) => {
      if (url) void handleDeepLink({ url });
    });
    const sub = Linking.addEventListener('url', (event) => {
      void handleDeepLink(event);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const initAuth = async () => {
      try {
        const stored = await getStoredSession();
        if (!stored) {
          if (!cancelled) setIsGuest(true);
          return;
        }

        const { user: restoredUser } = await authApi.me();
        const current = await getStoredSession();
        if (!cancelled && current) {
          await activateSession({ ...current, user: restoredUser });
        }
      } catch (error) {
        console.error('Backend auth session restore failed:', error);
        if (!cancelled) setIsGuest(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void initAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (response?.type === 'success' && response.params.id_token) {
      void authApi
        .signInWithGoogleToken(
          response.params.id_token,
          rawNonceRef.current || undefined
        )
        .then(({ session: active }) => activateSession(active))
        .catch((error) => console.error('Google sign-in failed:', error));
    }
  }, [response]);

  const signInWithGoogle = async () => {
    if (Platform.OS === 'web') {
      const url = await authApi.googleUrl(window.location.origin);
      window.location.assign(url);
      return;
    }
    try {
      rawNonceRef.current = generateNonce();
      await promptAsync();
    } catch {
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
    const result = await authApi.signUp({
      email,
      password,
      fullName: trimmedName || undefined,
    });
    if (result.session) {
      await activateSession(result.session);
      if (trimmedName) await upsertUserProfile({ fullName: trimmedName });
    }
  };

  const verifyEmailOtp = async (
    email: string,
    token: string,
    fullName?: string
  ) => {
    const result = await authApi.verifyOtp({
      email,
      token,
      type: 'signup',
    });
    if (result.session) await activateSession(result.session);

    const fromArgs = fullName?.trim() || null;
    const fromMeta =
      (result.user?.user_metadata as any)?.full_name?.trim?.() || null;
    const resolvedName = fromArgs || fromMeta || null;

    if (resolvedName) await upsertUserProfile({ fullName: resolvedName });
  };

  const signInWithEmail = async (email: string, password: string) => {
    const result = await authApi.signIn({ email, password });
    await activateSession(result.session);
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
    const result = await authApi.signUp({
      phone: e164,
      password,
      fullName: trimmedName || undefined,
    });
    if (result.session) {
      await activateSession(result.session);
      if (trimmedName) await upsertUserProfile({ fullName: trimmedName });
    }
  };

  const verifyPhoneOtp = async (
    phone: string,
    token: string,
    fullName?: string
  ) => {
    const e164 = normaliseUgandanPhone(phone);

    const result = await authApi.verifyOtp({
      phone: e164,
      token,
      type: 'sms',
    });
    if (result.session) await activateSession(result.session);

    const fromArgs = fullName?.trim() || null;
    const fromMeta =
      (result.user?.user_metadata as any)?.full_name?.trim?.() || null;
    const resolvedName = fromArgs || fromMeta || null;

    if (resolvedName) await upsertUserProfile({ fullName: resolvedName });
  };

  const signInWithPhonePassword = async (phone: string, password: string) => {
    const e164 = normaliseUgandanPhone(phone);
    const result = await authApi.signIn({ phone: e164, password });
    await activateSession(result.session);
  };

  // ============================================================
  // EMAIL PASSWORD RESET
  // ============================================================
  const requestPasswordReset = async (email: string) => {
    await authApi.requestPasswordReset(email);
  };

  const verifyPasswordResetOtp = async (email: string, token: string) => {
    const result = await authApi.verifyOtp({
      email,
      token,
      type: 'recovery',
    });
    if (result.session) await activateSession(result.session);
  };

  // ============================================================
  // PHONE PASSWORD RESET
  // ============================================================
  const requestPhonePasswordReset = async (phone: string) => {
    const e164 = normaliseUgandanPhone(phone);

    if (!e164 || e164.length < 10) {
      throw new Error('Please enter a valid phone number.');
    }

    await authApi.requestPhonePasswordReset(e164);
  };

  const verifyPhonePasswordResetOtp = async (phone: string, token: string) => {
    const e164 = normaliseUgandanPhone(phone);

    const result = await authApi.verifyOtp({
      phone: e164,
      token,
      type: 'sms',
    });
    if (result.session) await activateSession(result.session);
  };

  const updatePassword = async (newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    if (!(await getStoredSession())) {
      throw new Error(
        'You must verify your code first before setting a new password.'
      );
    }

    try {
      await authApi.updatePassword(newPassword);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      const raw = message.toLowerCase();
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

      throw new Error(message || 'Failed to update password.');
    }
  };

  // ============================================================
  // SIGN OUT / GUEST
  // ============================================================
  const signOut = async () => {
    try {
      await authApi.signOut();
    } finally {
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
      setIsGuest(true);
    }
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
