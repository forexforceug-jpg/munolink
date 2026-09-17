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
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

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

  // Google OAuth request (must be at top level)
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  // ============================================================
  // CHECK AUTH ON START
  // ============================================================
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking auth state...');

        const token = await AsyncStorage.getItem('authToken');
        const userDataStr = await AsyncStorage.getItem('userData');

        if (!token || !userDataStr) {
          console.log('ℹ️ No stored auth data found');
          setIsAuthenticated(false);
          setIsGuest(true);
          return;
        }

        let parsedUser: any;
        try {
          parsedUser = JSON.parse(userDataStr);
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('userData');
          setIsAuthenticated(false);
          setIsGuest(true);
          return;
        }

        if (!parsedUser?.id) {
          console.log('⚠️ Invalid user data, clearing session');
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('userData');
          setIsAuthenticated(false);
          setIsGuest(true);
          return;
        }

        console.log('✅ Found stored user:', parsedUser.id);

        // Fail-safe DB check
        try {
          const { data: dbUser, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('id', parsedUser.id)
            .maybeSingle();

          if (dbUser) {
            console.log('✅ User verified in database');
            setUser({
              ...parsedUser,
              full_name: dbUser.full_name || parsedUser.full_name,
              avatar_url: dbUser.avatar_url || parsedUser.avatar_url,
              email: (dbUser as any).email || parsedUser.email,
              role: dbUser.role || 'customer',
              wallet_balance: dbUser.wallet_balance || 0,
              lifetime_savings: dbUser.lifetime_savings || 0,
              location_city: dbUser.location_city || null,
              location_region: dbUser.location_region || null,
              location_country: dbUser.location_country || null,
              latitude: dbUser.latitude ?? null,
              longitude: dbUser.longitude ?? null,
            });
            setIsAuthenticated(true);
            setIsGuest(false);
            console.log('✅ Session restored successfully');
          } else if (dbError) {
            console.warn(
              '⚠️ Could not verify user with DB. Using cached session:',
              dbError.message
            );
            setUser(parsedUser);
            setIsAuthenticated(true);
            setIsGuest(false);
          } else {
            console.log('⚠️ User not found in database, clearing session');
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('userData');
            setIsAuthenticated(false);
            setIsGuest(true);
            setUser(null);
          }
        } catch (networkErr) {
          console.warn('⚠️ DB check threw, using cached session:', networkErr);
          setUser(parsedUser);
          setIsAuthenticated(true);
          setIsGuest(false);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
        setIsGuest(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ============================================================
  // GOOGLE OAUTH RESPONSE
  // ============================================================
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        handleGoogleSignIn(id_token);
      } else {
        Alert.alert('Error', 'No ID token received from Google.');
      }
    } else if (response?.type === 'error') {
      console.error('Google OAuth error:', response.error);
      Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string) => {
    try {
      setIsLoading(true);
      console.log('🔑 Signing in with Google ID token');

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
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

        // Check if we already have this user
        const { data: existing } = await supabase
          .from('users')
          .select('*')
          .eq('id', googleUser.id)
          .maybeSingle();

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
          phone: googleUser.phone || (existing as any)?.phone_number || '',
          email: userEmail,
          full_name: (existing as any)?.full_name || userName,
          avatar_url: (existing as any)?.avatar_url || avatar,
          created_at: new Date().toISOString(),
          isVerified: true,
          role: 'customer',
          wallet_balance: 0,
          lifetime_savings: 0,
        };

        await AsyncStorage.setItem('authToken', `token_${Date.now()}`);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));

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

  const signInWithGoogle = async () => {
    try {
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
        full_name: userName,
        name: userName,
        created_at: new Date().toISOString(),
        isVerified: true,
        role: 'customer',
        wallet_balance: 0,
        lifetime_savings: 0,
      };

      await AsyncStorage.setItem('authToken', `token_${Date.now()}`);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);
      setIsGuest(false);
    } catch (error) {
      console.error('❌ Phone sign in error:', error);
      throw error;
    }
  };

  // ============================================================
  // EMAIL SIGN UP (NO HASHING — plain text for now)
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

      // Check email uniqueness
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
          password_hash: password, // ⚠️ plain-text for now — do NOT ship this
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

      await AsyncStorage.setItem('authToken', `token_${Date.now()}`);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

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
  // EMAIL SIGN IN (NO HASHING — plain-text comparison)
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

      await AsyncStorage.setItem('authToken', `token_${Date.now()}`);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

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

    await AsyncStorage.setItem('authToken', `token_${Date.now()}`);
    await AsyncStorage.setItem('userData', JSON.stringify(userData));

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
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
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
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        setUser(JSON.parse(userDataStr));
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