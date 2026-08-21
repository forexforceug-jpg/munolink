// src/navigation/RootNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { ShopProfileScreen } from '../features/shop/ShopProfileScreen';
import { SearchScreen } from '../features/search/SearchScreen';
import { JoinScreen } from '../features/auth/JoinScreen';
import { SignInScreen } from '../features/auth/SignInScreen';
import { BusinessRegistrationWizard } from '../features/business/BusinessRegistrationWizard';
import { BusinessDashboardScreen } from '../features/business/BusinessDashboardScreen';
import { ExploreScreen } from '../features/explore/ExploreScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { HelpSupportScreen } from '../features/help/HelpSupportScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  Join: undefined;
  SignIn: undefined;
  ShopProfile: { shopId: string; shopName?: string };
  Search: undefined;
  Explore: undefined;
  BusinessRegistration: undefined;
  BusinessDashboard: undefined;
  Profile: undefined;
  HelpSupport: undefined;
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
      
      {/* Business Screens */}
      <Stack.Screen name="ShopProfile" component={ShopProfileScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Explore" component={ExploreScreen} />
      <Stack.Screen name="BusinessRegistration" component={BusinessRegistrationWizard} />
      <Stack.Screen name="BusinessDashboard" component={BusinessDashboardScreen} />
    </Stack.Navigator>
  );
};