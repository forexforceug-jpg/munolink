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
import { Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';

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

  // Email signup / verify / sign in
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

  // Phone signup / verify / sign in
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

  // Google / signout / guest
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  joinAsGuest: () => void;

  // ✅ EMAIL password reset (Supabase native)
  requestPasswordReset: (email: string) => Promise<void>;
  verifyPasswordResetOtp: (email: string, token: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;

  // ✅ PHONE password reset (Supabase SMS OTP)
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

/**
 * Best-effort persist of the user's profile row.
 */
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

/**
 * Normalise a Ugandan phone number to E.164 (+256XXXXXXXXX).
 */
function normaliseUgandanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('256')) return `+${digits}`;
  if (digits.startsWith('0')) return `+256${digits.slice(1)}`;
  return `+256${digits}`;
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

  // Listen to all auth events
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsAuthenticated(!!newSession);
      setIsGuest(!newSession);
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
        .then(({ error }) => {
          if (error) Alert.alert('Error', error.message);
        });
    }
  }, [response]);

  const signInWithGoogle = async () => {
    if (Platform.OS === 'web') {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) Alert.alert('Error', error.message);
      return;
    }
    try {
      rawNonceRef.current = generateNonce();
      await promptAsync();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to sign in with Google.');
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

    if (data?.user?.id && resolvedName) {
      await upsertUserProfile({
        userId: data.user.id,
        fullName: resolvedName,
        email,
      });
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

    if (data?.user?.id && resolvedName) {
      await upsertUserProfile({
        userId: data.user.id,
        fullName: resolvedName,
        phone: e164,
      });
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
  // EMAIL PASSWORD RESET (native Supabase recovery)
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
  // PHONE PASSWORD RESET (SMS OTP → session → updateUser)
  // ============================================================
  //
  // Supabase does not have a dedicated "recover by phone" endpoint,
  // so we reuse the phone sign-in OTP channel:
  //
  //   Step 1  signInWithOtp({ phone })           → sends SMS code
  //   Step 2  verifyOtp({ phone, token, 'sms' }) → establishes session
  //   Step 3  updateUser({ password })           → sets new password
  //
  // This is the standard and secure way to reset a password with
  // only a phone number, and it works with the same Supabase SMS
  // provider you already have configured.
  //
  const requestPhonePasswordReset = async (phone: string) => {
    const e164 = normaliseUgandanPhone(phone);

    if (!e164 || e164.length < 10) {
      throw new Error('Please enter a valid phone number.');
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: e164,
      options: {
        // If the user doesn't exist yet, don't silently create one —
        // we want an explicit "account not found" error instead.
        shouldCreateUser: false,
      },
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

    // Requires an active session — Supabase enforces this.
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
      // Supabase returns `same_password` when the new password equals
      // the current one. Surface a friendly message instead of the
      // raw API error.
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
      // Email reset
      requestPasswordReset,
      verifyPasswordResetOtp,
      updatePassword,
      // Phone reset
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