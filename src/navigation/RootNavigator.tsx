import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { ShopProfileScreen } from '../features/shop/ShopProfileScreen';
import { SearchScreen } from '../features/search/SearchScreen';
import { JoinScreen } from '../features/auth/JoinScreen';
import { SignInScreen } from '../features/auth/SignInScreen';
import { BusinessRegistrationWizard } from '../features/business/BusinessRegistrationWizard';
import { BusinessDashboardScreen } from '../features/business/BusinessDashboardScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  Join: undefined;
  SignIn: undefined;
  ShopProfile: { shopId: string; shopName?: string };
  Search: undefined;
  BusinessRegistration: undefined;
  BusinessDashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"  // ← ADD THIS LINE
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Main App - Moved to the top */}
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      
      {/* Auth Screens */}
      <Stack.Screen name="Join" component={JoinScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      
      {/* Modal/Overlay Screens */}
      <Stack.Screen name="ShopProfile" component={ShopProfileScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      
      {/* Business Screens */}
      <Stack.Screen name="BusinessRegistration" component={BusinessRegistrationWizard} />
      <Stack.Screen name="BusinessDashboard" component={BusinessDashboardScreen} />
    </Stack.Navigator>
  );
};