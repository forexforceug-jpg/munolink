import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as Updates from 'expo-updates';
import * as SplashScreen from 'expo-splash-screen';

// Keep splash screen visible while we initialize
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function App() {
  const [isResetting, setIsResetting] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // ============================================================
  // CHECK FOR OTA UPDATES
  // ============================================================
  const checkForUpdates = async () => {
    try {
      // Only check for updates in production builds
      if (!__DEV__) {
        const update = await Updates.checkForUpdateAsync();
        
        if (update.isAvailable) {
          console.log('📦 Update available!');
          setUpdateAvailable(true);
          
          // Show update prompt
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
        } else {
          console.log('✅ App is up to date');
        }
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      // Don't block the app if update check fails
    }
  };

  // ============================================================
  // RESET AUTH DATA (if needed)
  // ============================================================
  const resetAuth = async () => {
    try {
      // Clear ALL auth-related data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      console.log('🗑️ All auth data cleared');
    } catch (error) {
      console.error('Error clearing auth:', error);
    } finally {
      setIsResetting(false);
      
      // Check for updates after auth reset
      await checkForUpdates();
      
      // Hide splash screen
      await SplashScreen.hideAsync();
    }
  };

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    resetAuth();
  }, []);

  // ============================================================
  // LOADING STATES
  // ============================================================
  
  // Initial reset state
  if (isResetting) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1F2F5F' }}>
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={{ color: '#FFFFFF', marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  // Update download state
  if (isUpdating) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1F2F5F' }}>
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={{ color: '#FFFFFF', marginTop: 12 }}>Downloading update...</Text>
        <Text style={{ color: '#8A8AAE', marginTop: 4, fontSize: 12 }}>Please wait</Text>
      </View>
    );
  }

  // ============================================================
  // MAIN APP
  // ============================================================
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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