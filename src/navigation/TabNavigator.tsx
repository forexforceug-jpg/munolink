// src/navigation/TabNavigator.tsx

import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeedScreen } from '../features/feed/FeedScreen';
import { ExploreScreen } from '../features/explore/ExploreScreen';
import { PayScreen } from '../features/pay/PayScreen';
import { InboxScreen } from '../features/inbox/InboxScreen';
import { AccountScreen } from '../features/account/AccountScreen';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useAuth } from '../context/AuthContext';
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

const getIconSize = (baseSize: number) => {
  const scaled = baseSize * Math.min(pixelRatio / 2, 1.2);
  return Math.round(scaled);
};

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
  const labelSize = isSmallDevice ? 9 : 10;

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Pay"
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

      <Text
        style={[
          styles.tabLabel,
          { fontSize: labelSize },
          focused ? styles.tabLabelFocused : styles.payLabelInactive,
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        Pay
      </Text>

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
//
// ✅ Crash-proof against Supabase Realtime v2 rules:
//    1. supabase.channel(name)         — build
//    2. .on(...).on(...)...            — attach ALL handlers
//    3. .subscribe()                   — subscribe LAST
//    4. .unsubscribe()                 — cleanup
//
// ✅ Unique channel name per effect run so Strict Mode / HMR / rapid
//    auth-state flips can never reuse an already-subscribed channel.
//
// ✅ userId read from a ref so fetchCount stays stable and the effect
//    only re-runs when the id actually changes.
//
// ✅ Poll fallback every 15s in case realtime drops.
//
// ✅ isMountedRef guard so async callbacks don't touch state after
//    the component unmounts.
//
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
        // Non-fatal — badge just won't update.
        if (__DEV__) {
          console.log('ℹ️ Unread count query warning:', error.message);
        }
        return;
      }

      if (isMountedRef.current) {
        setCount(unread || 0);
      }
    } catch (err) {
      // Non-fatal — swallow so we never blank the screen over a badge.
      if (__DEV__) console.log('ℹ️ Unread count error:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    isMountedRef.current = true;

    // Initial + poll
    fetchCount();
    const interval = setInterval(fetchCount, 15000);

    // Realtime (optional) — only when logged in
    const uid = userIdRef.current;

    if (uid && isAuthenticated) {
      // ✅ Unique name — new channel object every effect run.
      const channelName = `unread-badge-${uid}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

      try {
        const channel = supabase.channel(channelName);

        // ✅ Attach ALL listeners BEFORE subscribe.
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

        // ✅ Subscribe LAST.
        channel.subscribe();

        channelRef.current = channel;
      } catch (err) {
        // Non-fatal — we still have the 15s polling fallback.
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
          /* noop — safe to swallow */
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

  const tabBarHeight = BASE_TAB_HEIGHT + insets.bottom;

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
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabBarHeight,
            paddingBottom: insets.bottom + 6,
            paddingTop: 8,
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
  );
};

// ----------------------------------------------------------------
// Styles
// ----------------------------------------------------------------
const styles = StyleSheet.create({
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