// src/navigation/RootNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { UserProfileScreen } from '../features/profile/UserProfileScreen';
import { ForgotPasswordScreen } from '../features/auth/ForgotPasswordScreen';
import { SearchResultsScreen } from '../features/search/SearchResultsScreen';
import { JoinScreen } from '../features/auth/JoinScreen';
import { SignInScreen } from '../features/auth/SignInScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { HelpSupportScreen } from '../features/help/HelpSupportScreen';
import { InboxScreen } from '../features/inbox/InboxScreen';
import { PayScreen } from '../features/pay/PayScreen';
import { UploadCameraScreen } from '../features/upload/UploadCameraScreen';
import { UploadEditorScreen } from '../features/upload/UploadEditorScreen';
import { PrivacyPolicyScreen } from '../features/legal/PrivacyPolicyScreen';
import { TermsOfServiceScreen } from '../features/legal/TermsOfServiceScreen';
import { useDeepLinks } from '../hooks/useDeepLinks';
import type { RootStackParamList } from './types';

export type { RootStackParamList };

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  useDeepLinks();

  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />

      {/* Auth */}
      <Stack.Screen name="Join" component={JoinScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: false }}
      />

      {/* Legal */}
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />

      {/* Pay (still available as a pushed screen for deep flows) */}
      <Stack.Screen name="PayScreen" component={PayScreen} />

      {/* Account */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="Inbox" component={InboxScreen} />

      {/* User Profile */}
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ headerShown: false }}
      />

      {/* Search results — still a stack screen because it's a
          detail pushed on top of the Search tab. The Search *tab*
          itself is registered inside TabNavigator. */}
      <Stack.Screen name="SearchResults" component={SearchResultsScreen} />

      {/* ✅ Upload flow */}
      <Stack.Screen
        name="UploadCamera"
        component={UploadCameraScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="UploadEditor"
        component={UploadEditorScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />

      {/* Placeholders */}
      <Stack.Screen
        name="Notifications"
        component={() => null}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};