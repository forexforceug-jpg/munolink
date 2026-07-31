import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  user: any | null;
  signIn: (userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  joinAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // CHANGE: Set both to false initially
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          setIsAuthenticated(true);
          setIsGuest(false);
          console.log('🔐 User is authenticated');
        } else {
          console.log('👤 User is a guest');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const signIn = async (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
    setIsGuest(false);
    await AsyncStorage.setItem('authToken', 'dummy-token');
    console.log('✅ User signed in');
  };

  const signOut = async () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsGuest(true);
    await AsyncStorage.removeItem('authToken');
    console.log('🚪 User signed out');
  };

  const joinAsGuest = () => {
    setIsGuest(true);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isGuest,
        isLoading,
        user,
        signIn,
        signOut,
        joinAsGuest,
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