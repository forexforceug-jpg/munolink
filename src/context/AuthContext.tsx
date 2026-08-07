import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  user: any | null;
  session: Session | null;
  signIn: (userData: any) => Promise<void>;
  signInWithPhone: (phone: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  joinAsGuest: () => void;
  refreshSession: () => Promise<void>;
  createSessionForUser: (userId: string) => Promise<void>;
  setIsAuthenticated: (value: boolean) => void;
  setIsGuest: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to generate a valid UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Google Auth Request
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check AsyncStorage for custom auth
        const token = await AsyncStorage.getItem('authToken');
        const userDataStr = await AsyncStorage.getItem('userData');
        
        if (token && userDataStr) {
          const parsedUser = JSON.parse(userDataStr);
          setIsAuthenticated(true);
          setIsGuest(false);
          setUser(parsedUser);
          console.log('✅ User authenticated via custom auth:', parsedUser);
        } else {
          setIsAuthenticated(false);
          setIsGuest(true);
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

  // Handle Google OAuth Response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token, access_token } = response.params;
      console.log('✅ Google OAuth response received:', { 
        hasIdToken: !!id_token, 
        hasAccessToken: !!access_token 
      });
      
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
      
      console.log('🔑 Attempting to sign in with Google ID token');
      
      // Sign in with Google using Supabase
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        console.error('Supabase sign in error:', error);
        throw error;
      }

      if (data.user) {
        console.log('✅ Google user authenticated:', data.user.id);
        
        // Get user data from Google
        const googleUser = data.user;
        const userData = {
          id: googleUser.id,
          phone: googleUser.phone || '',
          full_name: googleUser.user_metadata?.full_name || googleUser.user_metadata?.name || 'Google User',
          avatar_url: googleUser.user_metadata?.avatar_url || googleUser.user_metadata?.picture || null,
          created_at: new Date().toISOString(),
          isVerified: true,
        };

        // Store in AsyncStorage
        await AsyncStorage.setItem('authToken', `token_${Date.now()}`);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));

        // Check if user exists in our users table, if not create them
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', googleUser.id)
          .maybeSingle();

        if (userError && userError.code !== 'PGRST116') {
          console.error('Error checking user:', userError);
        }

        if (!existingUser) {
          console.log('📝 Creating new user in database');
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: googleUser.id,
              phone_number: googleUser.phone || '',
              full_name: googleUser.user_metadata?.full_name || googleUser.user_metadata?.name || 'Google User',
              avatar_url: googleUser.user_metadata?.avatar_url || googleUser.user_metadata?.picture || null,
              role: 'customer',
              wallet_balance: 0,
              lifetime_savings: 0,
            });

          if (insertError) {
            console.error('Error creating user:', insertError);
          } else {
            console.log('✅ User created successfully');
          }
        }

        setUser(userData);
        setIsAuthenticated(true);
        setIsGuest(false);
        setSession(data.session);
        
        Alert.alert('Success', 'Signed in with Google successfully!');
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      Alert.alert('Error', error.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Google - triggers the OAuth flow
  const signInWithGoogle = async () => {
    try {
      console.log('🚀 Starting Google sign-in...');
      await promptAsync();
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
    }
  };

  // Simple sign in with phone - stores in AsyncStorage
  const signInWithPhone = async (phone: string): Promise<void> => {
    console.log('📝 Signing in with phone (custom auth):', phone);
    try {
      const userId = generateUUID();
      const userData = {
        id: userId,
        phone: phone,
        created_at: new Date().toISOString(),
        name: 'Munolink Member',
        isVerified: true,
      };

      await AsyncStorage.setItem('authToken', `token_${Date.now()}`);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);
      setIsGuest(false);
      
      console.log('✅ User signed in successfully with ID:', userId);
    } catch (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
  };

  // Legacy sign in method
  const signIn = async (userData: any): Promise<void> => {
    console.log('📝 Signing in user:', userData);
    try {
      if (!userData.id) {
        userData.id = generateUUID();
      }
      
      await AsyncStorage.setItem('authToken', `token_${Date.now()}`);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      setIsGuest(false);
      
      console.log('✅ User signed in successfully with ID:', userData.id);
    } catch (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Sign out from Supabase as well
      await supabase.auth.signOut();
      
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      setIsGuest(true);
      console.log('🚪 User signed out');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        const parsedUser = JSON.parse(userDataStr);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setIsGuest(false);
        console.log('✅ Session refreshed from AsyncStorage');
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
    }
  };

  const createSessionForUser = async (userId: string): Promise<void> => {
    console.log('🔄 Creating session for user:', userId);
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const parsedUser = JSON.parse(userDataStr);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setIsGuest(false);
        console.log('✅ Session created from AsyncStorage');
      }
    } catch (error) {
      console.error('❌ Failed to create session:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isGuest,
        isLoading,
        user,
        session,
        signIn,
        signInWithPhone,
        signInWithGoogle,
        signOut,
        joinAsGuest,
        refreshSession,
        createSessionForUser,
        setIsAuthenticated,
        setIsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};