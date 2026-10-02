// src/navigation/RootNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { UserProfileScreen } from '../features/profile/UserProfileScreen';
import { SearchScreen } from '../features/search/SearchScreen';
import { ForgotPasswordScreen } from '../features/auth/ForgotPasswordScreen';
import { SearchResultsScreen } from '../features/search/SearchResultsScreen';
import { JoinScreen } from '../features/auth/JoinScreen';
import { SignInScreen } from '../features/auth/SignInScreen';
import { ExploreScreen } from '../features/explore/ExploreScreen';
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

// Re-export so existing imports of RootStackParamList from
// `../navigation/RootNavigator` keep working.
export type { RootStackParamList };

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  // ✅ Turns incoming URLs into navigation actions.
  //
  // Handles:
  //   • cold start   (app opened via link while closed)
  //   • warm start   (app already running and receives a link)
  //   • web          (window.location + popstate)
  //
  // Shared post links look like:
  //   https://www.munolink.com/s/<postId>
  //   munolink://s/<postId>
  //
  // The hook resolves them to:
  //   navigate('MainTabs', { screen: 'Discover', params: { openPostId } })
  //
  // FeedScreen already reads `route.params.openPostId` and scrolls to
  // that specific post, so the recipient lands directly on it.
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

      {/* Pay */}
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

      {/* Search */}
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="SearchResults" component={SearchResultsScreen} />

      {/* Explore */}
      <Stack.Screen name="Explore" component={ExploreScreen} />

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
      <Stack.Screen
        name="Hub"
        component={() => null}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};