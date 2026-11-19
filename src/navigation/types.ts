// src/navigation/types.ts

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';

export interface CheckoutRouteParams {
  sellerId: string;
  sellerName: string;
  title: string;
  unitPrice: number;
  currency: string;
  priceType: string;
}

export type MainTabParamList = {
  Discover: undefined;
  Explore: undefined;
  Pay:
    | {
        checkout?: CheckoutRouteParams;
        pendingPaymentId?: string;
      }
    | undefined;
  Inbox: { userId?: string; userName?: string; shopId?: string } | undefined;
  Account: undefined;
  Search: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Join: undefined;
  SignIn: undefined;
  ShopProfile: { shopId: string; shopName?: string };
  PrivacyPolicy: undefined;
  ForgotPassword: { email?: string } | undefined;
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
  PayScreen: { checkout?: CheckoutRouteParams } | undefined;
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