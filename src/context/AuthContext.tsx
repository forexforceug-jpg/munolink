// src/context/AuthContext.tsx

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';

WebBrowser.maybeCompleteAuthSession();

// ============================================================
// TYPES
// ============================================================
interface AuthContextType {
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  user: any | null;
  session: Session | null;

  signIn: (userData: any) => Promise<void>;
  signInWithPhone: (phone: string, fullName?: string) => Promise<void>;
  signUpWithEmail: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  joinAsGuest: () => void;
  refreshSession: () => Promise<void>;
  createSessionForUser: (userId: string) => Promise<void>;
  setIsAuthenticated: (value: boolean) => void;
  setIsGuest: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================
// HELPERS
// ============================================================
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateNonce(length = 32): string {
  const bytes: any = Crypto.getRandomBytes(length);
  return Array.from(bytes as Uint8Array)
    .map((b: number) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Writes both the Supabase session (handled automatically) and our own
 * lightweight mirror of the user data + a presence marker. The presence
 * marker is what `checkAuth` uses on cold start to decide whether to trust
 * the AsyncStorage copy for phone/email sign-ins.
 */
async function persistUser(userData: any) {
  try {
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    await AsyncStorage.setItem('authToken', `token_${Date.now()}`);
    if (Platform.OS === 'web') {
      try {
        window.localStorage.setItem('userData', JSON.stringify(userData));
        window.localStorage.setItem('authToken', `token_${Date.now()}`);
      } catch {
        // ignore
      }
    }
  } catch (e) {
    console.warn('persistUser failed:', e);
  }
}

async function clearPersistedUser() {
  try {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
    if (Platform.OS === 'web') {
      try {
        window.localStorage.removeItem('authToken');
        window.localStorage.removeItem('userData');
      } catch {
        // ignore
      }
    }
  } catch (e) {
    console.warn('clearPersistedUser failed:', e);
  }
}

async function readPersistedUser(): Promise<any | null> {
  try {
    let raw = await AsyncStorage.getItem('userData');
    if (!raw && Platform.OS === 'web') {
      try {
        raw = window.localStorage.getItem('userData');
      } catch {
        raw = null;
      }
    }
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ============================================================
// PROVIDER
// ============================================================
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const rawNonceRef = React.useRef<string | null>(null);

  // ============================================================
  // GOOGLE OAUTH REQUEST (native only)
  // ============================================================
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  // ============================================================
  // DEEP LINK HANDLER — for OAuth redirects coming back into the app
  //
  // When Supabase completes the OAuth exchange, it redirects the user
  // back to our app via the registered scheme. The URL contains
  // `access_token` and `refresh_token` in the fragment or query string.
  // We extract them and hand them to Supabase to establish a session.
  // ============================================================
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      console.log('🔗 Deep link received:', event.url);

      try {
        const { params, errorCode } = QueryParams.getQueryParams(event.url);

        if (errorCode) {
          console.error('OAuth error from deep link:', errorCode);
          Alert.alert('Error', 'Authentication failed. Please try again.');
          return;
        }

        const { access_token, refresh_token } = params;

        if (access_token && refresh_token) {
          console.log('✅ Tokens found in deep link. Setting session...');

          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) {
            console.error('❌ setSession error:', error.message);
            Alert.alert('Error', 'Failed to establish session.');
            return;
          }

          if (data.session) {
            console.log('✅ Session established from deep link');
            // onAuthStateChange will handle the rest
          }
        }
      } catch (err) {
        console.warn('Deep link handling error:', err);
      }
    };

    // Handle the URL that opened the app (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // Handle URLs received while the app is running (warm start)
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  // ============================================================
  // ✅ CHECK AUTH ON START
  //
  // Priority:
  //   1. Supabase's own persisted session (survives refresh via
  //      AsyncStorage on native / localStorage on web)
  //   2. Our AsyncStorage mirror (used by phone/email sign-ins that
  //      don't create a Supabase session)
  //   3. Fall back to guest
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        console.log('🔍 Checking auth state...');

        // 1️⃣ Try Supabase's own persisted session first
        try {
          const { data, error } = await supabase.auth.getSession();
          if (!cancelled && !error && data.session?.user) {
            console.log(
              '✅ Restored Supabase session for:',
              data.session.user.id
            );

            setSession(data.session);

            const { data: dbUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.session.user.id)
              .maybeSingle();

            const db: any = dbUser || {};

            const mergedUser = {
              id: data.session.user.id,
              email: db.email || data.session.user.email,
              full_name:
                db.full_name ||
                data.session.user.user_metadata?.full_name ||
                data.session.user.user_metadata?.name ||
                'Munolink Member',
              name:
                db.full_name ||
                data.session.user.user_metadata?.full_name ||
                'Munolink Member',
              phone: db.phone_number || data.session.user.phone || '',
              phone_number: db.phone_number || data.session.user.phone || '',
              avatar_url:
                db.avatar_url ||
                data.session.user.user_metadata?.avatar_url ||
                null,
              role: db.role || 'customer',
              wallet_balance: db.wallet_balance || 0,
              lifetime_savings: db.lifetime_savings || 0,
              location_city: db.location_city || null,
              location_region: db.location_region || null,
              location_country: db.location_country || null,
              latitude: db.latitude ?? null,
              longitude: db.longitude ?? null,
            };

            setUser(mergedUser);
            setIsAuthenticated(true);
            setIsGuest(false);

            await persistUser(mergedUser);

            return; // ✅ Done — no need to check AsyncStorage
          }
        } catch (supabaseErr) {
          console.warn('⚠️ Supabase session check failed:', supabaseErr);
        }

        // 2️⃣ Fall back to our own persisted user (phone/email sign-ins)
        const parsedUser = await readPersistedUser();

        if (!parsedUser?.id) {
          console.log('ℹ️ No stored auth data found');
          if (!cancelled) {
            setIsAuthenticated(false);
            setIsGuest(true);
          }
          return;
        }

        console.log('✅ Found stored user:', parsedUser.id);

        // Optional DB check — but even if it fails, trust the cached
        // copy so the user isn't logged out on refresh.
        try {
          const { data: dbUser, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('id', parsedUser.id)
            .maybeSingle();

          const db: any = dbUser || {};

          if (dbUser && !cancelled) {
            setUser({
              ...parsedUser,
              full_name: db.full_name || parsedUser.full_name,
              avatar_url: db.avatar_url || parsedUser.avatar_url,
              email: db.email || parsedUser.email,
              role: db.role || 'customer',
              wallet_balance: db.wallet_balance || 0,
              lifetime_savings: db.lifetime_savings || 0,
              location_city: db.location_city || null,
              location_region: db.location_region || null,
              location_country: db.location_country || null,
              latitude: db.latitude ?? null,
              longitude: db.longitude ?? null,
            });
            setIsAuthenticated(true);
            setIsGuest(false);
          } else if (dbError) {
            // Trust the cached session
            console.warn('⚠️ DB check failed, using cached session');
            if (!cancelled) {
              setUser(parsedUser);
              setIsAuthenticated(true);
              setIsGuest(false);
            }
          } else {
            // User truly not in DB — sign them out
            console.log('⚠️ User not found in DB, clearing session');
            await clearPersistedUser();
            if (!cancelled) {
              setIsAuthenticated(false);
              setIsGuest(true);
              setUser(null);
            }
          }
        } catch (networkErr) {
          console.warn(
            '⚠️ DB check threw, using cached session:',
            networkErr
          );
          if (!cancelled) {
            setUser(parsedUser);
            setIsAuthenticated(true);
            setIsGuest(false);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        if (!cancelled) {
          setIsAuthenticated(false);
          setIsGuest(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    checkAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // ✅ LISTEN TO SUPABASE AUTH EVENTS
  //
  // This fires on SIGNED_IN after OAuth, on SIGNED_OUT, and on
  // TOKEN_REFRESHED. It also ensures AsyncStorage stays in sync.
  // ============================================================
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('🔔 Supabase auth event:', event);

      if (event === 'SIGNED_IN' && newSession) {
        setSession(newSession);
        setIsAuthenticated(true);
        setIsGuest(false);

        // Mirror the user data into our own storage
        const u = newSession.user;
        const merged = {
          id: u.id,
          email: u.email,
          full_name:
            u.user_metadata?.full_name ||
            u.user_metadata?.name ||
            'Munolink Member',
          name:
            u.user_metadata?.full_name ||
            u.user_metadata?.name ||
            'Munolink Member',
          phone: u.phone || '',
          phone_number: u.phone || '',
          avatar_url:
            u.user_metadata?.avatar_url ||
            u.user_metadata?.picture ||
            null,
        };
        setUser((prev: any) => {
          const combined = { ...(prev || {}), ...merged };
          persistUser(combined);
          return combined;
        });
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
        setIsGuest(true);
        await clearPersistedUser();
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        setSession(newSession);
        try {
          await AsyncStorage.setItem(
            'authToken',
            newSession.access_token
          );
        } catch {
          // ignore
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ============================================================
  // GOOGLE OAUTH RESPONSE (native path)
  // ============================================================
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        handleGoogleSignIn(id_token, rawNonceRef.current || undefined);
      } else {
        Alert.alert('Error', 'No ID token received from Google.');
      }
    } else if (response?.type === 'error') {
      console.error('Google OAuth error:', response.error);
      Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string, rawNonce?: string) => {
    try {
      setIsLoading(true);
      console.log('🔑 Signing in with Google ID token');

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
        nonce: rawNonce,
      });

      if (error) throw error;

      if (data.user) {
        const googleUser = data.user;
        const userName =
          googleUser.user_metadata?.full_name ||
          googleUser.user_metadata?.name ||
          'Google User';
        const userEmail = googleUser.email || null;
        const avatar =
          googleUser.user_metadata?.avatar_url ||
          googleUser.user_metadata?.picture ||
          null;

        const { data: existing } = await supabase
          .from('users')
          .select('*')
          .eq('id', googleUser.id)
          .maybeSingle();

        const existingAny: any = existing || {};

        if (!existing) {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: googleUser.id,
              phone_number: googleUser.phone || '',
              full_name: userName,
              email: userEmail,
              avatar_url: avatar,
              role: 'customer',
              wallet_balance: 0,
              lifetime_savings: 0,
              kyc_verified: false,
            } as any);

          if (insertError) {
            console.error('Error creating Google user row:', insertError);
          }
        }

        const userData = {
          id: googleUser.id,
          phone: googleUser.phone || existingAny.phone_number || '',
          phone_number: existingAny.phone_number || googleUser.phone || '',
          email: userEmail,
          full_name: existingAny.full_name || userName,
          name: existingAny.full_name || userName,
          avatar_url: existingAny.avatar_url || avatar,
          created_at: new Date().toISOString(),
          isVerified: true,
          role: existingAny.role || 'customer',
          wallet_balance: existingAny.wallet_balance || 0,
          lifetime_savings: existingAny.lifetime_savings || 0,
          location_city: existingAny.location_city || null,
          location_region: existingAny.location_region || null,
          location_country: existingAny.location_country || null,
          latitude: existingAny.latitude ?? null,
          longitude: existingAny.longitude ?? null,
        };

        await persistUser(userData);

        setUser(userData);
        setIsAuthenticated(true);
        setIsGuest(false);
        setSession(data.session);

        Alert.alert('Success', 'Signed in with Google successfully!');
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to sign in with Google. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // GOOGLE SIGN-IN (platform-aware entry point)
  //
  // Web: use Supabase's OAuth redirect (popup blockers + user
  //      activation issues make expo-auth-session unreliable here).
  // Native: keep the nonce + id_token flow.
  // ============================================================
  const signInWithGoogle = async () => {
    if (Platform.OS === 'web') {
      const origin =
        typeof window !== 'undefined' && window.location
          ? window.location.origin
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: origin,
        },
      });

      if (error) {
        console.error('Web Google sign-in error:', error);
        Alert.alert(
          'Error',
          error.message || 'Failed to sign in with Google.'
        );
      }
      return;
    }

    // Native path
    try {
      rawNonceRef.current = generateNonce();
      await promptAsync();
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
    }
  };

  // ============================================================
  // PHONE
  // ============================================================
  const signInWithPhone = async (
    phone: string,
    fullName?: string
  ): Promise<void> => {
    console.log('📝 Signing in with phone:', phone);

    try {
      const cleanPhone = phone.replace(/\s/g, '');
      const fullPhone = cleanPhone.startsWith('+')
        ? cleanPhone
        : `+256${cleanPhone}`;

      const { data: existingUser } = await supabase
        .from('users')
        .select('id, full_name, phone_number')
        .eq('phone_number', fullPhone)
        .maybeSingle();

      let userId: string;
      let userName: string;

      if (existingUser) {
        userId = existingUser.id;
        userName =
          existingUser.full_name || fullName?.trim() || 'Munolink Member';

        if (fullName?.trim() && !existingUser.full_name) {
          await supabase
            .from('users')
            .update({ full_name: fullName.trim() })
            .eq('id', userId);
          userName = fullName.trim();
        }
      } else {
        userId = generateUUID();
        userName = fullName?.trim() || 'Munolink Member';

        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            phone_number: fullPhone,
            full_name: userName,
            role: 'customer',
            wallet_balance: 0,
            lifetime_savings: 0,
            kyc_verified: false,
            created_at: new Date().toISOString(),
          } as any);

        if (insertError) throw insertError;
      }

      const userData = {
        id: userId,
        phone: fullPhone,
        phone_number: fullPhone,
        full_name: userName,
        name: userName,
        created_at: new Date().toISOString(),
        isVerified: true,
        role: 'customer',
        wallet_balance: 0,
        lifetime_savings: 0,
      };

      await persistUser(userData);

      setUser(userData);
      setIsAuthenticated(true);
      setIsGuest(false);
    } catch (error) {
      console.error('❌ Phone sign in error:', error);
      throw error;
    }
  };

  // ============================================================
  // EMAIL SIGN UP
  // ============================================================
  const signUpWithEmail = async (
    fullName: string,
    email: string,
    password: string
  ): Promise<void> => {
    console.log('📝 Email sign up:', email);

    try {
      const normalizedEmail = normalizeEmail(email);
      const trimmedName = fullName.trim();

      if (!trimmedName || trimmedName.length < 2) {
        throw new Error('Please enter your full name');
      }
      if (!normalizedEmail || !normalizedEmail.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const { data: existing } = await (supabase.from('users' as any) as any)
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existing) {
        throw new Error('An account with this email already exists');
      }

      const userId = generateUUID();

      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          full_name: trimmedName,
          email: normalizedEmail,
          password_hash: password, // ⚠️ plain-text for now
          role: 'customer',
          wallet_balance: 0,
          lifetime_savings: 0,
          kyc_verified: false,
          created_at: new Date().toISOString(),
        } as any);

      if (insertError) throw insertError;

      const userData = {
        id: userId,
        email: normalizedEmail,
        full_name: trimmedName,
        name: trimmedName,
        created_at: new Date().toISOString(),
        isVerified: true,
        role: 'customer',
        wallet_balance: 0,
        lifetime_savings: 0,
      };

      await persistUser(userData);

      setUser(userData);
      setIsAuthenticated(true);
      setIsGuest(false);

      console.log('✅ Email sign up successful');
    } catch (error) {
      console.error('❌ Email sign up error:', error);
      throw error;
    }
  };

  // ============================================================
  // EMAIL SIGN IN
  // ============================================================
  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<void> => {
    console.log('📝 Email sign in:', email);

    try {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail || !password) {
        throw new Error('Please enter your email and password');
      }

      const { data: existing, error: fetchError } = await (supabase
        .from('users' as any) as any)
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!existing) {
        throw new Error('No account found with this email');
      }
      if (!(existing as any).password_hash) {
        throw new Error(
          'This account uses a different sign-in method. Try phone or Google.'
        );
      }

      if ((existing as any).password_hash !== password) {
        throw new Error('Incorrect password');
      }

      const userData = {
        id: existing.id,
        email: (existing as any).email,
        full_name: existing.full_name || 'Munolink Member',
        name: existing.full_name || 'Munolink Member',
        avatar_url: existing.avatar_url || null,
        created_at: existing.created_at || new Date().toISOString(),
        isVerified: true,
        role: existing.role || 'customer',
        wallet_balance: existing.wallet_balance || 0,
        lifetime_savings: existing.lifetime_savings || 0,
      };

      await persistUser(userData);

      setUser(userData);
      setIsAuthenticated(true);
      setIsGuest(false);

      console.log('✅ Email sign in successful');
    } catch (error) {
      console.error('❌ Email sign in error:', error);
      throw error;
    }
  };

  // ============================================================
  // LEGACY signIn
  // ============================================================
  const signIn = async (userData: any): Promise<void> => {
    console.warn('⚠️ signIn() is legacy — prefer dedicated methods');
    if (!userData?.id) userData.id = generateUUID();

    await persistUser(userData);

    setUser(userData);
    setIsAuthenticated(true);
    setIsGuest(false);
  };

  // ============================================================
  // SIGN OUT
  // ============================================================
  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase signOut failed:', e);
      }

      await clearPersistedUser();

      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      setIsGuest(true);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = signOut;

  const joinAsGuest = (): void => {
    setIsGuest(true);
    setIsAuthenticated(false);
    setUser(null);
    setSession(null);
  };

  const refreshSession = async (): Promise<void> => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setSession(data.session);
        setIsAuthenticated(true);
        setIsGuest(false);
        return;
      }

      const parsedUser = await readPersistedUser();
      if (parsedUser) {
        setUser(parsedUser);
        setIsAuthenticated(true);
        setIsGuest(false);
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
    }
  };

  const createSessionForUser = useCallback(
    async (userId: string): Promise<void> => {
      await refreshSession();
    },
    []
  );

  // ============================================================
  // CONTEXT VALUE
  // ============================================================
  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      isGuest,
      isLoading,
      user,
      session,
      signIn,
      signInWithPhone,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      logout,
      joinAsGuest,
      refreshSession,
      createSessionForUser,
      setIsAuthenticated,
      setIsGuest,
    }),
    [
      isAuthenticated,
      isGuest,
      isLoading,
      user,
      session,
      signIn,
      signInWithPhone,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut,
      logout,
      joinAsGuest,
      refreshSession,
      createSessionForUser,
    ]
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