// App.tsx

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { AuthProvider } from './src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  Alert,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import * as Updates from 'expo-updates';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';

// Keep splash screen visible while we initialize.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* noop */
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// ============================================================
// SPLASH / LOADING SCREEN — animated icon only
// ============================================================
function LoadingScreen() {
  const insets = useSafeAreaInsets();

  let SplashIcon: any = null;
  try {
    SplashIcon = require('./assets/favicon.png');
  } catch {
    SplashIcon = null;
  }

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.05,
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 0.7,
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [opacity, scale, pulseScale]);

  return (
    <View
      style={[
        styles.loadingContainer,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <StatusBar style="dark" />

      <Animated.View
        style={{
          opacity,
          transform: [{ scale: Animated.multiply(scale, pulseScale) }],
        }}
      >
        {SplashIcon ? (
          <Image
            source={SplashIcon}
            style={styles.splashIcon}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.splashFallbackEmoji}>🛍️</Text>
        )}
      </Animated.View>
    </View>
  );
}

// ============================================================
// NAVIGATE HELPER — retries until the navigator is ready
// ============================================================
function navigateToPost(postId: string) {
  const attempt = (tries = 0) => {
    if (navigationRef.isReady()) {
      (navigationRef as any).navigate('MainTabs', {
        screen: 'Discover',
        params: { openPostId: postId },
      });
      return;
    }
    if (tries < 20) {
      setTimeout(() => attempt(tries + 1), 100);
    } else if (__DEV__) {
      console.log('⚠️ Navigator never became ready for deep link');
    }
  };
  attempt();
}

// ============================================================
// APP
// ============================================================
export default function App() {
  const [isResetting, setIsResetting] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [appIsReady, setAppIsReady] = useState(false);

  const didCheckForUpdates = useRef(false);

  // ============================================================
  // DEEP LINK HANDLER (native + web)
  //
  // Handles three kinds of URLs:
  //   1. Native scheme:   munolink://post/<postId>
  //   2. Native scheme:   munolink:///post/<postId>
  //   3. Web query:       https://www.munolink.com/?post=<postId>
  //
  // All three end up navigating to that post in the Feed.
  // ============================================================
  useEffect(() => {
    const handleNativeUrl = (event: { url: string }) => {
      try {
        const url = event.url;
        const parsed = Linking.parse(url);

        let rawPath = parsed.path || '';
        const host = parsed.hostname || '';

        // munolink://post/<id> — the scheme parses `post` as hostname.
        if (host === 'post') {
          rawPath = rawPath ? `/${rawPath.replace(/^\/+/, '')}` : '';
        }

        const postId = rawPath.replace(/^\/+/, '').split('/')[0];

        if (!postId) {
          if (__DEV__) console.log('⚠️ Deep link without a post id:', url);
          return;
        }

        if (__DEV__) console.log('🔗 Native deep link to post:', postId);
        navigateToPost(postId);
      } catch (err) {
        if (__DEV__) console.warn('Native deep link parse error:', err);
      }
    };

    // ---- Native path: Linking events ----
    Linking.getInitialURL()
      .then((url) => {
        if (url) handleNativeUrl({ url });
      })
      .catch(() => {
        /* noop */
      });

    const sub = Linking.addEventListener('url', handleNativeUrl);

    // ---- Web path: ?post=<id> in the current URL ----
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const postIdFromQuery = params.get('post');

        if (postIdFromQuery) {
          if (__DEV__) {
            console.log('🌐 Web deep link to post:', postIdFromQuery);
          }
          navigateToPost(postIdFromQuery);
        }
      } catch (err) {
        if (__DEV__) console.warn('Web URL parse error:', err);
      }
    }

    return () => sub.remove();
  }, []);

  // ============================================================
  // RESET AUTH DATA
  // ============================================================
  const resetAuth = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'userData']);
      if (__DEV__) console.log('🗑️ All auth data cleared');
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  }, []);

  // ============================================================
  // CHECK FOR OTA UPDATES
  // ============================================================
  const checkForUpdates = useCallback(async () => {
    if (__DEV__ || didCheckForUpdates.current) return;
    didCheckForUpdates.current = true;

    try {
      const update = await Updates.checkForUpdateAsync();

      if (!update.isAvailable) {
        if (__DEV__) console.log('✅ App is up to date');
        return;
      }

      if (__DEV__) console.log('📦 Update available!');
      setUpdateAvailable(true);

      setTimeout(() => {
        Alert.alert(
          'Update Available',
          'A new version of Munolink is available. Would you like to update now?',
          [
            {
              text: 'Later',
              style: 'cancel',
              onPress: () => setUpdateAvailable(false),
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
                  setUpdateAvailable(false);
                }
              },
            },
          ],
          { cancelable: false }
        );
      }, 1000);
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }, []);

  // ============================================================
  // LOAD RESOURCES
  // ============================================================
  const loadResources = useCallback(async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await resetAuth();
      await checkForUpdates();
      return true;
    } catch (error) {
      console.error('Error loading resources:', error);
      return false;
    }
  }, [resetAuth, checkForUpdates]);

  // ============================================================
  // INITIALIZE APP
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    async function initializeApp() {
      try {
        await loadResources();
        if (cancelled) return;
        setAppIsReady(true);

        setTimeout(async () => {
          if (cancelled) return;
          try {
            await SplashScreen.hideAsync();
          } catch {
            /* noop */
          }
          setIsResetting(false);
        }, 300);
      } catch (error) {
        console.error('Error initializing app:', error);
        if (cancelled) return;
        try {
          await SplashScreen.hideAsync();
        } catch {
          /* noop */
        }
        setIsResetting(false);
        setAppIsReady(true);
      }
    }

    initializeApp();

    return () => {
      cancelled = true;
    };
  }, [loadResources]);

  // ============================================================
  // LOADING STATES
  // ============================================================
  if (isResetting || !appIsReady) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  if (isUpdating) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  // ============================================================
  // MAIN APP
  // ============================================================
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BottomSheetModalProvider>
              <StatusBar style="light" />
              <NavigationContainer ref={navigationRef}>
                <RootNavigator />
              </NavigationContainer>
            </BottomSheetModalProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  splashIcon: {
    width: 76,
    height: 76,
  },
  splashFallbackEmoji: {
    fontSize: 56,
    marginBottom: 0,
  },
});