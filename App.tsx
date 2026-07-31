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
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

const queryClient = new QueryClient();

export default function App() {
  const [isResetting, setIsResetting] = useState(true);

  useEffect(() => {
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
      }
    };
    resetAuth();
  }, []);

  if (isResetting) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1F2F5F' }}>
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={{ color: '#FFFFFF', marginTop: 12 }}>Resetting...</Text>
      </View>
    );
  }

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