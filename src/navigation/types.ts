// src/navigation/types.ts

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  MainTabs: undefined;
  Join: undefined;
  SignIn: undefined;
  ShopProfile: { shopId: string; shopName?: string };
  Search: undefined;
  PrivacyPolicy: undefined;
TermsOfService: undefined;
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
  UserProfile: {
    userId: string;
    userName?: string;
  };
  Notifications: undefined;
  PayScreen: undefined;
  Hub: undefined;

  UploadCamera: undefined;
  UploadEditor: {
    editResult: {
      uri: string;
      type: 'image' | 'video';
      trimStart: number;
      trimEnd: number;
      videoThumbnail: string | null;
      fileSize: number | null;
      textOverlays?: Array<{
        id: string;
        text: string;
        x: number;
        y: number;
        color: string;
        fontSize: number;
      }>;
    };
  };
};

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;