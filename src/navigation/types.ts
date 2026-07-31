import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  MainTabs: undefined;
  Join: undefined;
  SignIn: undefined;
  ShopProfile: { shopId: string; shopName?: string };
  Search: undefined;
  BusinessRegistration: undefined;
};

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;