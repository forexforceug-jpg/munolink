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

  // ✅ fullName is optional on all signup/verify flows
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

  // ✅ Password reset flow
  requestPasswordReset: (email: string) => Promise<void>;
  verifyPasswordResetOtp: (email: string, token: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
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
 * Non-fatal: if RLS blocks it before email/phone confirmation,
 * we retry after OTP verification.
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
  if (email) {
    patch.email = email;
  }
  if (phone) {
    patch.phone_number = phone;
  }

  // Nothing to write except the id
  if (Object.keys(patch).length <= 1) return;

  try {
    const { error } = await supabase
      .from('users')
      .upsert(patch, { onConflict: 'id' });
    if (error) {
      // Non-fatal; may fail if the users row doesn't exist yet or RLS blocks.
      if (__DEV__) {
        console.log('ℹ️ upsertUserProfile warning:', error.message);
      }
    }
  } catch (err) {
    if (__DEV__) console.log('ℹ️ upsertUserProfile threw:', err);
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
  // EMAIL
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
        data: {
          full_name: trimmedName,
        },
      },
    });
    if (error) throw error;

    // Best-effort: write to public.users now. If RLS or row-not-yet-
    // created blocks it, verifyEmailOtp will retry.
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

    // Pull the name from anywhere we might have stashed it.
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
  // PHONE
  // ============================================================
  const signUpWithPhone = async (
    phone: string,
    password: string,
    fullName?: string
  ) => {
    const trimmedName = fullName?.trim() || null;

    const { data, error } = await supabase.auth.signUp({
      phone,
      password,
      options: {
        data: {
          full_name: trimmedName,
        },
      },
    });
    if (error) throw error;

    if (data?.user?.id) {
      await upsertUserProfile({
        userId: data.user.id,
        fullName: trimmedName,
        phone,
      });
    }
  };

  const verifyPhoneOtp = async (
    phone: string,
    token: string,
    fullName?: string
  ) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
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
        phone,
      });
    }
  };

  const signInWithPhonePassword = async (
    phone: string,
    password: string
  ) => {
    const { error } = await supabase.auth.signInWithPassword({
      phone,
      password,
    });
    if (error) throw error;
  };

  // ============================================================
  // PASSWORD RESET
  // ============================================================
  //
  // Three-step flow:
  //
  //   1. requestPasswordReset(email)
  //      → sends a "Reset password" email containing `{{ .Token }}`
  //        (a 6-digit code) to the user.
  //
  //   2. verifyPasswordResetOtp(email, token)
  //      → exchanges the code for a short-lived recovery session.
  //        After this succeeds, supabase.auth.updateUser({ password })
  //        is authorized on the current client.
  //
  //   3. updatePassword(newPassword)
  //      → sets the new password using the recovery session.
  //
  // NOTE: The Supabase project's "Reset password" email template
  // MUST include {{ .Token }} for step 2 to work. If it only
  // contains {{ .ConfirmationURL }}, no OTP is generated and
  // verifyPasswordResetOtp will fail with an "invalid token" error.
  // ============================================================

  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // No redirect needed for the OTP flow. If you later build a
      // web-hosted reset page, set this to that URL instead.
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

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
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
      // ✅ Password reset flow
      requestPasswordReset,
      verifyPasswordResetOtp,
      updatePassword,
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