// src/navigation/TabNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { FeedScreen } from '../features/feed/FeedScreen';
import { HubScreen } from '../features/hub/HubScreen';
import { PayScreen } from '../features/pay/PayScreen';
import { InboxScreen } from '../features/inbox/InboxScreen';
import { AccountScreen } from '../features/account/AccountScreen';
import { useBreakpoint } from '../hooks/useBreakpoint';

const Tab = createBottomTabNavigator();
const { width, height } = Dimensions.get('window');

// Responsive sizing
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 420;

// Custom Tab Bar Button for Pay
const CustomTabBarButton = ({ children, onPress }: any) => {
  const buttonSize = isSmallDevice ? 52 : 60;
  const iconSize = isSmallDevice ? 22 : 26;
  
  return (
    <TouchableOpacity
      style={[styles.payButton, { top: isSmallDevice ? -8 : -12 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#4A7DFF', '#376fff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.payButtonGradient, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
      >
        <View style={[styles.payButtonInner, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}>
          <Ionicons name="card" size={iconSize} color="#FFFFFF" />
          <Text style={[styles.payLabel, { fontSize: isSmallDevice ? 8 : 9 }]}>Pay</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Custom Tab Icon
const TabIcon = ({ focused, icon, label, isPay = false, iconType = 'Ionicons' }: any) => {
  const iconColor = focused ? '#4A7DFF' : 'rgba(255,255,255,0.6)';
  const iconSize = isSmallDevice ? 20 : (isMediumDevice ? 22 : 24);
  const labelSize = isSmallDevice ? 9 : 10;
  const wrapperPadding = isSmallDevice ? 4 : 6;

  const renderIcon = () => {
    const commonProps = { size: iconSize, color: iconColor };
    switch (iconType) {
      case 'Ionicons':
        return <Ionicons name={icon} {...commonProps} />;
      case 'Feather':
        return <Feather name={icon} {...commonProps} />;
      case 'MaterialIcons':
        return <MaterialIcons name={icon} {...commonProps} />;
      default:
        return <Ionicons name={icon} {...commonProps} />;
    }
  };

  if (isPay) {
    return null; // Pay button uses CustomTabBarButton
  }
  
  return (
    <View style={styles.tabItem}>
      <View style={[
        styles.iconWrapper,
        { padding: wrapperPadding },
        focused && styles.iconWrapperFocused
      ]}>
        {renderIcon()}
      </View>
      <Text 
        style={[
          styles.tabLabel,
          { fontSize: labelSize },
          focused && styles.tabLabelFocused
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

export const TabNavigator = () => {
  const { isDesktop } = useBreakpoint();

  // Hide tab bar on desktop
  if (isDesktop) {
    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tab.Screen name="Discover" component={FeedScreen} />
        <Tab.Screen name="Hub" component={HubScreen} />
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
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#4A7DFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarShowLabel: false,
        tabBarBackground: () => (
          <View style={styles.tabBarBackground} />
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
              icon="compass" 
              label="Discover" 
              iconType="Ionicons" 
            />
          ),
        }}
      />
      
      <Tab.Screen
        name="Hub"
        component={HubScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              focused={focused} 
              icon="grid-outline" 
              label="Hub" 
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
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              focused={focused} 
              icon="card" 
              label="Pay" 
              isPay={true} 
              iconType="Ionicons" 
            />
          ),
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

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 80 : 70,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 8,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  tabBarBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 80 : 70,
    // ✅ More transparent - 55% opacity for better visibility of content behind
    backgroundColor: 'rgba(26, 42, 79, 0.55)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    ...Platform.select({
      ios: {
        // ✅ iOS - even more transparent with blur effect
        backgroundColor: 'rgba(26, 42, 79, 0.45)',
      },
      android: {
        // ✅ Android - slightly more opaque for better readability
        backgroundColor: 'rgba(26, 42, 79, 0.60)',
      },
    }),
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 2,
    flex: 1,
    // ✅ Prevent text from wrapping
    flexDirection: 'column',
  },
  iconWrapper: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    // ✅ Force single line
    flexShrink: 0,
    flexWrap: 'nowrap',
    maxWidth: '100%',
  },
  tabLabelFocused: {
    color: '#4A7DFF',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: -14,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#4A7DFF',
  },
  payButton: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#4A7DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  payButtonGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#4A7DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  payButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  payLabel: {
    color: '#FFFFFF',
    marginTop: 1,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});