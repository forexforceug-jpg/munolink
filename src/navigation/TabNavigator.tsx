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
const { width } = Dimensions.get('window');

// Custom Tab Bar Button for Pay
const CustomTabBarButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={styles.payButton}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <LinearGradient
      colors={['#4A7DFF', '#6B94FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.payButtonGradient}
    >
      <View style={styles.payButtonInner}>
        {children}
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

// Custom Tab Icon
const TabIcon = ({ focused, icon, label, isPay = false, iconType = 'Ionicons' }: any) => {
  const iconColor = focused ? '#4A7DFF' : 'rgb(255, 255, 255)';
  const iconSize = focused ? 24 : 22;

  const renderIcon = () => {
    switch (iconType) {
      case 'Ionicons':
        return <Ionicons name={icon} size={iconSize} color={iconColor} />;
      case 'Feather':
        return <Feather name={icon} size={iconSize} color={iconColor} />;
      case 'MaterialIcons':
        return <MaterialIcons name={icon} size={iconSize} color={iconColor} />;
      default:
        return <Ionicons name={icon} size={iconSize} color={iconColor} />;
    }
  };

  if (isPay) {
    return (
      <View style={styles.payIconContainer}>
        <Ionicons name="card" size={26} color="#FFFFFF" />
        <Text style={styles.payLabel}>Pay</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.tabItem}>
      <View style={[
        styles.iconWrapper,
        focused && styles.iconWrapperFocused
      ]}>
        {renderIcon()}
      </View>
      <Text style={[
        styles.tabLabel,
        focused && styles.tabLabelFocused
      ]}>{label}</Text>
      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
};

export const TabNavigator = () => {
  const { isDesktop } = useBreakpoint();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: isDesktop 
          ? { display: 'none' } 
          : styles.tabBar,
        tabBarActiveTintColor: '#4A7DFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarShowLabel: false,
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
    height: 65,
    paddingBottom: 10,
    paddingTop: 8,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 4,
  },
  iconWrapper: {
    padding: 6,
    borderRadius: 12,
  },
  iconWrapperFocused: {
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
  },
  tabLabel: {
    color: 'rgb(255, 255, 255)',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  tabLabelFocused: {
    color: '#4A7DFF',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#4A7DFF',
  },
  payButton: {
    top: -12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
  },
  payButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  payButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  payLabel: {
    color: '#FFFFFF',
    fontSize: 9,
    marginTop: 1,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});