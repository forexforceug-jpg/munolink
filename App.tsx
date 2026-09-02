// App.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import * as Updates from 'expo-updates';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';

// Keep splash screen visible while we initialize
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function App() {
  const [isResetting, setIsResetting] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [appIsReady, setAppIsReady] = useState(false);

  // ============================================================
  // CHECK FOR OTA UPDATES
  // ============================================================
  const checkForUpdates = async () => {
    try {
      if (!__DEV__) {
        const update = await Updates.checkForUpdateAsync();
        
        if (update.isAvailable) {
          console.log('📦 Update available!');
          setUpdateAvailable(true);
          
          setTimeout(() => {
            Alert.alert(
              'Update Available',
              'A new version of Munolink is available. Would you like to update now?',
              [
                { 
                  text: 'Later', 
                  style: 'cancel',
                  onPress: () => {
                    setUpdateAvailable(false);
                  }
                },
                {
                  text: 'Update',
                  onPress: async () => {
                    setIsUpdating(true);
                    try {
                      await Updates.fetchUpdateAsync();
                      await Updates.reloadAsync();
                    } catch (error) {
                      console.error('Update failed:', error);
                      Alert.alert('Update Failed', 'Please try again later.');
                      setIsUpdating(false);
                    }
                  },
                },
              ]
            );
          }, 1000);
        } else {
          console.log('✅ App is up to date');
        }
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  // ============================================================
  // LOAD RESOURCES
  // ============================================================
  const loadResources = useCallback(async () => {
    try {
      // Simulate loading time (minimum 2 seconds to show splash screen)
      await new Promise(resolve => setTimeout(resolve, 2000));
      await resetAuth();
      await checkForUpdates();
      return true;
    } catch (error) {
      console.error('Error loading resources:', error);
      return false;
    }
  }, []);

  // ============================================================
  // RESET AUTH DATA
  // ============================================================
  const resetAuth = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      console.log('🗑️ All auth data cleared');
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  };

  // ============================================================
  // INITIALIZE APP
  // ============================================================
  useEffect(() => {
    async function initializeApp() {
      try {
        await loadResources();
        setAppIsReady(true);
        
        // Hide splash screen after a short delay
        setTimeout(async () => {
          await SplashScreen.hideAsync();
          setIsResetting(false);
        }, 300);
      } catch (error) {
        console.error('Error initializing app:', error);
        await SplashScreen.hideAsync();
        setIsResetting(false);
        setAppIsReady(true);
      }
    }

    initializeApp();
  }, [loadResources]);

  // ============================================================
  // LOADING STATES - Show splash icon instead of text
  // ============================================================
  
  if (isResetting || !appIsReady) {
    // Try to load the splash icon
    let SplashIcon = null;
    try {
      SplashIcon = require('./assets/adaptive-icon.png');
    } catch (e) {
      // Fallback if splash-icon.png doesn't exist
      SplashIcon = null;
    }

    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1F2F5F' }}>
        <StatusBar style="light" />
        {SplashIcon ? (
          <Image 
            source={SplashIcon} 
            style={{ width: 120, height: 120, resizeMode: 'contain' }}
          />
        ) : (
          // Fallback text if icon not found
          <Text style={{ fontSize: 48, color: '#FFFFFF', fontWeight: 'bold', marginBottom: 12 }}>🛍️</Text>
        )}
        <Text style={{ color: '#FFFFFF', marginTop: 12, fontWeight: '600', fontSize: 18 }}>Munolink</Text>
        <ActivityIndicator size="small" color="#4A7DFF" style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (isUpdating) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1F2F5F' }}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={{ color: '#FFFFFF', marginTop: 12, fontWeight: '600' }}>Updating Munolink</Text>
        <Text style={{ color: '#8A8AAE', marginTop: 4, fontSize: 12 }}>Please wait...</Text>
      </View>
    );
  }

  // ============================================================
  // MAIN APP
  // ============================================================
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#1F2F5F' }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SafeAreaProvider>
            <BottomSheetModalProvider>
              <StatusBar style="light" />
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </BottomSheetModalProvider>
          </SafeAreaProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}