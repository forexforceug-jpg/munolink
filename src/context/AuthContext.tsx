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

interface AuthContextType {
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  user: User | null;
  session: Session | null;

  signUpWithEmail: (email: string, password: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;

  signUpWithPhone: (phone: string, password: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<void>;
  signInWithPhonePassword: (phone: string, password: string) => Promise<void>;

  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  joinAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function generateNonce(length = 32): string {
  const bytes: any = Crypto.getRandomBytes(length);
  return Array.from(bytes as Uint8Array)
    .map((b: number) => b.toString(16).padStart(2, '0'))
    .join('');
}

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
    Linking.getInitialURL().then((url) => { if (url) handleDeepLink({ url }); });
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  // ✅ Restore session on mount — Supabase handles all the persistence
  useEffect(() => {
    let cancelled = false;
    const initAuth = async () => {
      try {
        const { data: { session: restored } } = await supabase.auth.getSession();
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
    return () => { cancelled = true; };
  }, []);

  // ✅ Listen to all auth events — SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsAuthenticated(!!newSession);
        setIsGuest(!newSession);
      }
    );
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
      supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.params.id_token,
        nonce: rawNonceRef.current || undefined,
      }).then(({ error }) => {
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

  // ---- EMAIL ----
  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // Supabase sends the email OTP automatically
  };

  const verifyEmailOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  // ---- PHONE ----
  const signUpWithPhone = async (phone: string, password: string) => {
    const { error } = await supabase.auth.signUp({ phone, password });
    if (error) throw error;
    // Supabase triggers the Send SMS Hook → your Edge Function → Yoola
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    if (error) throw error;
  };

  const signInWithPhonePassword = async (phone: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ phone, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const joinAsGuest = () => {
    setIsGuest(true);
    setIsAuthenticated(false);
    setUser(null);
    setSession(null);
  };

  const contextValue = useMemo(() => ({
    isAuthenticated, isGuest, isLoading, user, session,
    signUpWithEmail, verifyEmailOtp, signInWithEmail,
    signUpWithPhone, verifyPhoneOtp, signInWithPhonePassword,
    signInWithGoogle, signOut, logout: signOut, joinAsGuest,
  }), [isAuthenticated, isGuest, isLoading, user, session]);

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};