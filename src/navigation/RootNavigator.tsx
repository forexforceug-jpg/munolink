// src/navigation/RootNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { UserProfileScreen } from '../features/profile/UserProfileScreen';
import { SearchScreen } from '../features/search/SearchScreen';
import { SearchResultsScreen } from '../features/search/SearchResultsScreen';
import { JoinScreen } from '../features/auth/JoinScreen';
import { SignInScreen } from '../features/auth/SignInScreen';
import { ExploreScreen } from '../features/explore/ExploreScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { HelpSupportScreen } from '../features/help/HelpSupportScreen';
import { InboxScreen } from '../features/inbox/InboxScreen';
import {PayScreen} from '../features/pay/PayScreen';
export type RootStackParamList = {
  MainTabs: undefined;
  Join: undefined;
  SignIn: undefined;
  ShopProfile: { shopId: string; shopName?: string };
  Search: undefined;
  SearchResults: {
    results: any[];
    query: string;
    initialIndex?: number;
    intent?: any;
    hasResults?: boolean;
    totalResults?: number;
    recommendationsCount?: number;
  };
  Explore: undefined;
  BusinessRegistration: undefined;
  BusinessDashboard: undefined;
  Profile: undefined;
  HelpSupport: undefined;
  Inbox: {
    userId?: string;
    userName?: string;
    shopId?: string;
  };
  // ✅ ADD UserProfile to the param list
  UserProfile: {
    userId: string;
    userName?: string;
  };
  Notifications: undefined;
  PayScreen: undefined;
  Hub: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      
      {/* Auth Screens */}
      <Stack.Screen name="Join" component={JoinScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      {/* Pay Screen */}
      <Stack.Screen name="PayScreen" component={PayScreen} />
      {/* Account Screens */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="Inbox" component={InboxScreen} />
      
      {/* User Profile Screen */}
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: false }} />
      {/* Search Screens */}
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
      
      {/* Explore */}
      <Stack.Screen name="Explore" component={ExploreScreen} />
      {/* Placeholder screens */}
      <Stack.Screen 
        name="Notifications" 
        component={() => null} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Hub" 
        component={() => null} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};