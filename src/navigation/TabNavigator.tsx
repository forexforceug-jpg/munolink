// src/navigation/TabNavigator.tsx

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  PixelRatio,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';

import { FeedScreen } from '../features/feed/FeedScreen';
import { ExploreScreen } from '../features/explore/ExploreScreen';
import { PayScreen } from '../features/pay/PayScreen';
import { InboxScreen } from '../features/inbox/InboxScreen';
import { AccountScreen } from '../features/account/AccountScreen';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../lib/supabase';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');
const pixelRatio = PixelRatio.get();

// ----------------------------------------------------------------
// Responsive sizing
// ----------------------------------------------------------------
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 420;

export const BASE_TAB_HEIGHT = 60;

// Minimum bottom buffer to keep the tab bar clear of browser chrome
// on web (Safari URL bar, Android Chrome gesture area, etc.).
const WEB_BOTTOM_BUFFER = 12;

// Extra vertical padding baked into the tab bar's rendered style.
// These are used by getTabBarHeight() so consumers get the exact
// rendered height, not an approximation.
const TAB_BAR_PADDING_TOP = 8;
const TAB_BAR_PADDING_BOTTOM_EXTRA = 6;

const getIconSize = (baseSize: number) => {
  const scaled = baseSize * Math.min(pixelRatio / 2, 1.2);
  return Math.round(scaled);
};

// ----------------------------------------------------------------
// Web safe-area bottom helper
// ----------------------------------------------------------------
let cachedWebSafeBottom: number | null = null;

function getWebSafeAreaBottom(): number {
  if (Platform.OS !== 'web') return 0;
  if (cachedWebSafeBottom !== null) return cachedWebSafeBottom;

  if (typeof document === 'undefined') {
    cachedWebSafeBottom = 0;
    return 0;
  }

  try {
    const probe = document.createElement('div');
    probe.style.position = 'fixed';
    probe.style.bottom = '0';
    probe.style.left = '0';
    probe.style.width = '0';
    probe.style.height = 'env(safe-area-inset-bottom, 0px)';
    probe.style.pointerEvents = 'none';
    probe.style.visibility = 'hidden';
    document.body.appendChild(probe);
    const rect = probe.getBoundingClientRect();
    const value = rect.height || 0;
    document.body.removeChild(probe);
    cachedWebSafeBottom = value;
    return value;
  } catch {
    cachedWebSafeBottom = 0;
    return 0;
  }
}

// ----------------------------------------------------------------
// getTabBarHeight — single source of truth
//
// Returns the EXACT rendered height of the tab bar for the current
// platform + device. Any screen that needs to clear the tab bar
// (e.g. FeedScreen's info panel) should call this with the same
// `insets` from `useSafeAreaInsets()`.
// ----------------------------------------------------------------
export function getTabBarHeight(insets: EdgeInsets): number {
  const webSafeBottom = getWebSafeAreaBottom();

  const effectiveBottomInset =
    Platform.OS === 'web'
      ? Math.max(insets.bottom, webSafeBottom) + WEB_BOTTOM_BUFFER
      : insets.bottom;

  return (
    BASE_TAB_HEIGHT +
    effectiveBottomInset +
    TAB_BAR_PADDING_TOP +
    TAB_BAR_PADDING_BOTTOM_EXTRA
  );
}

// ----------------------------------------------------------------
// Custom Pay button
// ----------------------------------------------------------------
type CustomTabBarButtonProps = {
  children?: React.ReactNode;
  onPress?: (e: any) => void;
  accessibilityState?: any;
};

const CustomTabBarButton = ({
  onPress,
  accessibilityState,
}: CustomTabBarButtonProps) => {
  const focused = !!accessibilityState?.selected;

  const circleSize = isSmallDevice ? 34 : isMediumDevice ? 36 : 38;
  const iconSize = isSmallDevice ? getIconSize(18) : getIconSize(20);

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel=""
      accessibilityState={accessibilityState}
    >
      <View
        style={[
          styles.iconWrapper,
          focused && styles.iconWrapperFocused,
          { padding: isSmallDevice ? 4 : 6 },
        ]}
      >
        <LinearGradient
          colors={['#4A7DFF', '#376FFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.payCircle,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
            },
          ]}
        >
          <Ionicons name="card" size={iconSize} color="#FFFFFF" />
        </LinearGradient>
      </View>
      {focused && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
  );
};

// ----------------------------------------------------------------
// Custom tab icon
// ----------------------------------------------------------------
type TabIconProps = {
  focused: boolean;
  icon: string;
  label: string;
  isPay?: boolean;
  iconType?: 'Ionicons' | 'Feather' | 'MaterialIcons';
  badgeCount?: number;
};

const TabIcon = ({
  focused,
  icon,
  label,
  isPay = false,
  iconType = 'Ionicons',
  badgeCount = 0,
}: TabIconProps) => {
  if (isPay) return null;

  const iconColor = focused ? '#4A7DFF' : 'rgba(255,255,255,0.6)';

  const baseIconSize = isSmallDevice ? 22 : isMediumDevice ? 24 : 26;
  const iconSize = getIconSize(baseIconSize);
  const labelSize = isSmallDevice ? 9 : 10;
  const wrapperPadding = isSmallDevice ? 4 : 6;

  const renderIcon = () => {
    const commonProps = { size: iconSize, color: iconColor };
    switch (iconType) {
      case 'Feather':
        return <Feather name={icon as any} {...commonProps} />;
      case 'MaterialIcons':
        return <MaterialIcons name={icon as any} {...commonProps} />;
      case 'Ionicons':
      default:
        return <Ionicons name={icon as any} {...commonProps} />;
    }
  };

  const showBadge = badgeCount > 0;

  return (
    <View style={styles.tabItem}>
      <View
        style={[
          styles.iconWrapper,
          { padding: wrapperPadding },
          focused && styles.iconWrapperFocused,
        ]}
      >
        {renderIcon()}

        {showBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText} numberOfLines={1}>
              {badgeCount > 99 ? '99+' : String(badgeCount)}
            </Text>
          </View>
        )}
      </View>

      <Text
        style={[
          styles.tabLabel,
          { fontSize: labelSize },
          focused && styles.tabLabelFocused,
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>

      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
};

// ================================================================
// Hook: unread message count
// ================================================================
const useUnreadMessageCount = (): number => {
  const { user, isAuthenticated } = useAuth();
  const [count, setCount] = useState(0);

  const userIdRef = useRef<string | null>(null);
  userIdRef.current = user?.id ?? null;

  const isMountedRef = useRef(true);
  const channelRef = useRef<any>(null);

  const fetchCount = useCallback(async () => {
    const uid = userIdRef.current;

    if (!uid || !isAuthenticated) {
      if (isMountedRef.current) setCount(0);
      return;
    }

    try {
      const { count: unread, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', uid)
        .eq('is_read', false);

      if (error) {
        if (__DEV__) {
          console.log('ℹ️ Unread count query warning:', error.message);
        }
        return;
      }

      if (isMountedRef.current) {
        setCount(unread || 0);
      }
    } catch (err) {
      if (__DEV__) console.log('ℹ️ Unread count error:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    isMountedRef.current = true;

    fetchCount();
    const interval = setInterval(fetchCount, 15000);

    const uid = userIdRef.current;

    if (uid && isAuthenticated) {
      const channelName = `unread-badge-${uid}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

      try {
        const channel = supabase.channel(channelName);

        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${uid}`,
          },
          () => {
            fetchCount();
          }
        );

        channel.subscribe();

        channelRef.current = channel;
      } catch (err) {
        if (__DEV__) console.log('ℹ️ Realtime subscription failed:', err);
      }
    }

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);

      const ch = channelRef.current;
      channelRef.current = null;

      if (ch) {
        try {
          ch.unsubscribe();
        } catch {
          /* noop */
        }
      }
    };
  }, [user?.id, isAuthenticated, fetchCount]);

  return count;
};

// ----------------------------------------------------------------
// TabNavigator
// ----------------------------------------------------------------
export const TabNavigator = () => {
  const { isDesktop } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const unreadCount = useUnreadMessageCount();

  const webSafeBottom = useMemo(() => getWebSafeAreaBottom(), []);

  const effectiveBottomInset =
    Platform.OS === 'web'
      ? Math.max(insets.bottom, webSafeBottom) + WEB_BOTTOM_BUFFER
      : insets.bottom;

  // The tab bar's rendered height includes the top padding and the
  // extra bottom padding baked into the style below. Keep this in
  // sync with getTabBarHeight().
  const tabBarHeight =
    BASE_TAB_HEIGHT +
    effectiveBottomInset +
    TAB_BAR_PADDING_TOP +
    TAB_BAR_PADDING_BOTTOM_EXTRA;

  if (isDesktop) {
    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tab.Screen name="Discover" component={FeedScreen} />
        <Tab.Screen name="Explore" component={ExploreScreen} />
        <Tab.Screen name="Pay" component={PayScreen} />
        <Tab.Screen name="Inbox" component={InboxScreen} />
        <Tab.Screen name="Account" component={AccountScreen} />
      </Tab.Navigator>
    );
  }

  return (
    <View style={styles.navigatorWrapper}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: [
            styles.tabBar,
            {
              height: tabBarHeight,
              paddingBottom: effectiveBottomInset + TAB_BAR_PADDING_BOTTOM_EXTRA,
              paddingTop: TAB_BAR_PADDING_TOP,
            },
          ],
          tabBarActiveTintColor: '#4A7DFF',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
          tabBarShowLabel: false,
          tabBarBackground: () => (
            <View style={[styles.tabBarBackground, { height: tabBarHeight }]} />
          ),
        }}
      >
        <Tab.Screen
          name="Discover"
          component={FeedScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                icon="home"
                label="Home"
                iconType="Ionicons"
              />
            ),
          }}
        />

        <Tab.Screen
          name="Explore"
          component={ExploreScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                icon="grid-outline"
                label="Explore"
                iconType="Ionicons"
              />
            ),
          }}
        />

        <Tab.Screen
          name="Pay"
          component={PayScreen}
          options={{
            tabBarButton: (props) => <CustomTabBarButton {...props} />,
            tabBarIcon: () => null,
          }}
        />

        <Tab.Screen
          name="Inbox"
          component={InboxScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                icon="chatbubbles"
                label="Inbox"
                iconType="Ionicons"
                badgeCount={unreadCount}
              />
            ),
          }}
        />

        <Tab.Screen
          name="Account"
          component={AccountScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                icon="person"
                label="Account"
                iconType="Ionicons"
              />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

// ----------------------------------------------------------------
// Styles
// ----------------------------------------------------------------
const styles = StyleSheet.create({
  navigatorWrapper: {
    flex: 1,
    ...Platform.select({
      web: {
        height: '100dvh' as any,
        maxHeight: '100dvh' as any,
        overflow: 'hidden',
        position: 'relative' as any,
      },
      default: {},
    }),
  },

  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A2A4F',
    borderTopWidth: 0,
    elevation: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
      },
      web: {
        position: 'fixed' as any,
        zIndex: 1000,
      },
    }),
  },

  tabBarBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A2A4F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },

  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 2,
    flex: 1,
    flexDirection: 'column',
  },

  iconWrapper: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
    position: 'relative',
  },

  iconWrapperFocused: {
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
  },

  tabLabel: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
    flexShrink: 0,
    maxWidth: '100%',
  },

  tabLabelFocused: {
    color: '#4A7DFF',
    fontWeight: '600',
  },

  payLabelInactive: {
    color: 'rgba(255,255,255,0.7)',
  },

  activeIndicator: {
    position: 'absolute',
    top: -14,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#4A7DFF',
  },

  payCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#4A7DFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1A2A4F',
    zIndex: 10,
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
});