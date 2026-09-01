// src/navigation/RootNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { ShopProfileScreen } from '../features/shop/ShopProfileScreen';
import { SearchScreen } from '../features/search/SearchScreen';
import { SearchResultsScreen } from '../features/search/SearchResultsScreen';
import { JoinScreen } from '../features/auth/JoinScreen';
import { SignInScreen } from '../features/auth/SignInScreen';
import { BusinessRegistrationWizard } from '../features/business/BusinessRegistrationWizard';
import { BusinessDashboardScreen } from '../features/business/BusinessDashboardScreen';
import { ExploreScreen } from '../features/explore/ExploreScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { HelpSupportScreen } from '../features/help/HelpSupportScreen';
import { InboxScreen } from '../features/inbox/InboxScreen';

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
      
      {/* Account Screens */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="Inbox" component={InboxScreen} />
      
      {/* Business Screens */}
      <Stack.Screen name="ShopProfile" component={ShopProfileScreen} />
      
      {/* Search Screens */}
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
      
      {/* Explore */}
      <Stack.Screen name="Explore" component={ExploreScreen} />
      
      {/* Business Registration */}
      <Stack.Screen name="BusinessRegistration" component={BusinessRegistrationWizard} />
      <Stack.Screen name="BusinessDashboard" component={BusinessDashboardScreen} />
    </Stack.Navigator>
  );
};