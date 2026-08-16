import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');

type AccountScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// --- Types ---
interface UserProfile {
  id: string;
  full_name: string | null;
  phone_number: string;
  avatar_url: string | null;
  role: string | null;
  wallet_balance: number | null;
  lifetime_savings: number | null;
  kyc_verified: boolean | null;
  created_at: string | null;
}

interface Shop {
  id: string;
  name: string;
  is_verified: boolean | null;
  rating: number | null;
  review_count: number | null;
  logo_url: string | null;
}

// --- Quick Access Shortcuts ---
const shortcuts = [
  { id: 'orders', icon: '📦', label: 'My Orders' },
  { id: 'bookings', icon: '📅', label: 'My Bookings' },
  { id: 'wishlist', icon: '❤️', label: 'Wishlist' },
  { id: 'saved', icon: '📍', label: 'Saved Places' },
];

// --- Menu Items ---
const menuItems = [
  { id: 'profile', icon: 'person-outline', label: 'Profile Information', subtitle: 'Edit personal details and preferences' },
  { id: 'payments', icon: 'card-outline', label: 'Payment Methods', subtitle: 'Manage mobile money, cards & bank accounts' },
  { id: 'addresses', icon: 'location-outline', label: 'Addresses', subtitle: 'Manage delivery and service locations' },
  { id: 'orders', icon: 'cube-outline', label: 'My Orders', subtitle: 'View order history and track purchases' },
  { id: 'bookings', icon: 'calendar-outline', label: 'My Bookings', subtitle: 'Manage service appointments and reservations' },
  { id: 'wishlist', icon: 'heart-outline', label: 'Wishlist & Collections', subtitle: 'Access saved products and services' },
  { id: 'start_business', icon: 'rocket-outline', label: 'Start a Business', subtitle: 'Sell products or offer services on Munolink' },
  { id: 'sell', icon: 'storefront-outline', label: 'Sell on Munolink', subtitle: 'Manage your shop or service business' },
  { id: 'help', icon: 'help-circle-outline', label: 'Help & Support', subtitle: 'FAQs, customer support & assistance' },
];

// --- Sub-components ---

// Shortcut Item
const ShortcutItem = ({ item, count }: any) => (
  <TouchableOpacity style={styles.shortcutItem}>
    <View style={styles.shortcutIcon}>
      <Text style={styles.shortcutIconText}>{item.icon}</Text>
      {count > 0 && (
        <View style={styles.shortcutBadge}>
          <Text style={styles.shortcutBadgeText}>{count}</Text>
        </View>
      )}
    </View>
    <Text style={styles.shortcutLabel}>{item.label}</Text>
  </TouchableOpacity>
);

// Menu Item
const MenuItem = ({ item, onPress }: any) => (
  <TouchableOpacity style={styles.menuItem} onPress={() => onPress(item.id)}>
    <View style={styles.menuIconContainer}>
      <Ionicons name={item.icon} size={22} color="#4A7DFF" />
    </View>
    <View style={styles.menuContent}>
      <Text style={styles.menuLabel}>{item.label}</Text>
      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#8A8AAE" />
  </TouchableOpacity>
);

// --- Guest Profile Component ---
const GuestProfile = ({ navigation }: any) => (
  <View style={styles.guestProfile}>
    <View style={styles.guestAvatar}>
      <Text style={styles.guestAvatarText}>👤</Text>
    </View>
    <Text style={styles.guestName}>Guest User</Text>
    <Text style={styles.guestSubtext}>Not signed in</Text>
    <TouchableOpacity 
      style={styles.guestSignInButton} 
      onPress={() => navigation.navigate('Join')}
    >
      <Text style={styles.guestSignInText}>Create Account</Text>
    </TouchableOpacity>
  </View>
);

// --- AccountContent Component (Extracted for reuse) ---
const AccountContent = ({ navigation }: any) => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userShops, setUserShops] = useState<Shop[]>([]);
  const [showBalance, setShowBalance] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalReviews: 0,
    joinedYear: new Date().getFullYear(),
  });

  // Fetch user data from Supabase
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userId = user?.id;

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      setUserProfile(profile);

      // Fetch user's shops
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id, name, is_verified, rating, review_count, logo_url')
        .eq('owner_id', userId);

      if (shopsError) throw shopsError;
      setUserShops(shops || []);

      // Set joined year from profile
      if (profile?.created_at) {
        const joinedDate = new Date(profile.created_at);
        setStats(prev => ({ ...prev, joinedYear: joinedDate.getFullYear() }));
      }

      // Fetch order count (mock for now - you'll need to implement this)
      // const { count: orderCount } = await supabase
      //   .from('transactions')
      //   .select('*', { count: 'exact', head: true })
      //   .eq('user_id', userId);
      // setStats(prev => ({ ...prev, totalOrders: orderCount || 0 }));

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuItemPress = (id: string) => {
    console.log('🔗 Menu item pressed:', id);
    
    if (id === 'start_business') {
      navigation.navigate('BusinessRegistration');
      return;
    }
    
    Alert.alert('Navigation', `Navigating to ${id}`);
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive' },
      ]
    );
  };

  // --- Loading State ---
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4A7DFF" />
          <Text style={styles.loadingText}>Loading your account...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Guest View ---
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Top Bar */}
        <View style={styles.topBar}>
          <Text style={styles.logo}>Munolink</Text>
          <TouchableOpacity style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#4A7DFF" />
            <Text style={styles.locationText}>Jinja, Uganda</Text>
            <Ionicons name="chevron-down" size={14} color="#4A7DFF" />
          </TouchableOpacity>
          <View style={styles.topRight}>
            <TouchableOpacity style={styles.topIcon}>
              <Ionicons name="notifications-outline" size={22} color="#1F2F5F" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.topIcon}>
              <Ionicons name="settings-outline" size={22} color="#1F2F5F" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <GuestProfile navigation={navigation} />

          {/* Settings Section - Available to guests */}
          <View style={styles.menuContainer}>
            <View style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="language-outline" size={22} color="#4A7DFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Language</Text>
                <Text style={styles.menuSubtitle}>English</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8A8AAE" />
            </View>
            <View style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="location-outline" size={22} color="#4A7DFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Location</Text>
                <Text style={styles.menuSubtitle}>Jinja, Uganda</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8A8AAE" />
            </View>
            <View style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="moon-outline" size={22} color="#4A7DFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Appearance</Text>
                <Text style={styles.menuSubtitle}>System Default</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8A8AAE" />
            </View>
            <View style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="notifications-outline" size={22} color="#4A7DFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Notifications</Text>
                <Text style={styles.menuSubtitle}>On</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8A8AAE" />
            </View>
          </View>

          {/* Help & About */}
          <View style={styles.menuContainer}>
            <View style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="help-circle-outline" size={22} color="#4A7DFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Help & Support</Text>
                <Text style={styles.menuSubtitle}>FAQs and customer support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8A8AAE" />
            </View>
            <View style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="document-text-outline" size={22} color="#4A7DFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Privacy Policy</Text>
                <Text style={styles.menuSubtitle}>How we protect your data</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8A8AAE" />
            </View>
            <View style={styles.menuItem}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="information-circle-outline" size={22} color="#4A7DFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>About Munolink</Text>
                <Text style={styles.menuSubtitle}>Version 1.0.0</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8A8AAE" />
            </View>
          </View>

          {/* Locked Features */}
          <View style={styles.lockedFeatures}>
            <Text style={styles.lockedTitle}>🔒 Unlock features:</Text>
            <View style={styles.lockedRow}>
              <Ionicons name="lock-closed-outline" size={16} color="#8A8AAE" />
              <Text style={styles.lockedText}>Wallet</Text>
            </View>
            <View style={styles.lockedRow}>
              <Ionicons name="lock-closed-outline" size={16} color="#8A8AAE" />
              <Text style={styles.lockedText}>Orders</Text>
            </View>
            <View style={styles.lockedRow}>
              <Ionicons name="lock-closed-outline" size={16} color="#8A8AAE" />
              <Text style={styles.lockedText}>Bookings</Text>
            </View>
            <View style={styles.lockedRow}>
              <Ionicons name="lock-closed-outline" size={16} color="#8A8AAE" />
              <Text style={styles.lockedText}>Inbox</Text>
            </View>
            <View style={styles.lockedRow}>
              <Ionicons name="lock-closed-outline" size={16} color="#8A8AAE" />
              <Text style={styles.lockedText}>Business Tools</Text>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Authenticated User View ---
  const displayName = userProfile?.full_name || user?.name || 'User';
  const displayPhone = userProfile?.phone_number || user?.phone || '';
  const avatarUrl = userProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4A7DFF&color=fff&size=100`;
  const isVerified = userProfile?.kyc_verified || false;
  const walletBalance = userProfile?.wallet_balance || 0;
  const lifetimeSavings = userProfile?.lifetime_savings || 0;
  const shopCount = userShops.length;
  const hasBusiness = shopCount > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>Munolink</Text>
        <TouchableOpacity style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="#4A7DFF" />
          <Text style={styles.locationText}>Jinja, Uganda</Text>
          <Ionicons name="chevron-down" size={14} color="#4A7DFF" />
        </TouchableOpacity>
        <View style={styles.topRight}>
          <TouchableOpacity style={styles.topIcon}>
            <Ionicons name="notifications-outline" size={22} color="#1F2F5F" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topIcon}>
            <Ionicons name="settings-outline" size={22} color="#1F2F5F" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileLeft}>
            <View style={styles.profileImageContainer}>
              <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
              <TouchableOpacity style={styles.cameraButton}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName}>{displayName}</Text>
              {isVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>✓</Text>
                </View>
              )}
            </View>
            <View style={styles.profileDetail}>
              <Ionicons name="call-outline" size={14} color="#8A8AAE" />
              <Text style={styles.profileDetailText}>{displayPhone}</Text>
            </View>
            <View style={styles.profileDetail}>
              <Ionicons name="briefcase-outline" size={14} color="#8A8AAE" />
              <Text style={styles.profileDetailText}>
                {hasBusiness ? `${shopCount} Business${shopCount > 1 ? 'es' : ''}` : 'No business yet'}
              </Text>
            </View>
          </View>
        </View>

        {/* Wallet Card */}
        <TouchableOpacity style={styles.walletCard}>
          <LinearGradient
            colors={['#4A7DFF', '#6B94FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.walletGradient}
          >
            <View style={styles.walletHeader}>
              <Text style={styles.walletTitle}>Munolink Wallet</Text>
              <Text style={styles.walletView}>View Wallet ›</Text>
            </View>
            <View style={styles.walletBalanceRow}>
              <View style={styles.walletBalanceContainer}>
                <Text style={styles.walletBalanceLabel}>Available Balance</Text>
                <View style={styles.walletBalanceRow}>
                  <Text style={styles.walletBalance}>
                    {showBalance ? `UGX ${walletBalance.toLocaleString()}` : '••••••'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
                    <Ionicons 
                      name={showBalance ? 'eye-outline' : 'eye-off-outline'} 
                      size={20} 
                      color="rgba(255,255,255,0.7)" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={styles.addMoneyButton}>
                <Text style={styles.addMoneyText}>+ Add Money</Text>
              </TouchableOpacity>
            </View>
            {lifetimeSavings > 0 && (
              <View style={styles.lifetimeSavingsContainer}>
                <Text style={styles.lifetimeSavingsLabel}>💰 Lifetime Savings</Text>
                <Text style={styles.lifetimeSavingsValue}>UGX {lifetimeSavings.toLocaleString()}</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Access Shortcuts */}
        <View style={styles.shortcutsContainer}>
          {shortcuts.map((item) => (
            <ShortcutItem key={item.id} item={item} count={0} />
          ))}
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <MenuItem key={item.id} item={item} onPress={handleMenuItemPress} />
          ))}
        </View>

        {/* My Business Card (if user has a shop) */}
        {hasBusiness && (
          <View style={styles.businessCard}>
            <LinearGradient
              colors={['#1A2A4F', '#2A3F6F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.businessGradient}
            >
              <View style={styles.businessHeader}>
                <Text style={styles.businessTitle}>🏪 My Business</Text>
                <TouchableOpacity onPress={() => navigation.navigate('BusinessDashboard')}>
                  <Text style={styles.businessManage}>Manage ›</Text>
                </TouchableOpacity>
              </View>
              {userShops.map((shop) => (
                <View key={shop.id} style={styles.businessItem}>
                  <View style={styles.businessItemLeft}>
                    <Text style={styles.businessItemName}>{shop.name}</Text>
                    {shop.is_verified && (
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedBadgeText}>✓</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.businessItemRight}>
                    {shop.rating && (
                      <Text style={styles.businessItemRating}>⭐ {shop.rating.toFixed(1)}</Text>
                    )}
                  </View>
                </View>
              ))}
            </LinearGradient>
          </View>
        )}

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#E74C3C" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Main AccountScreen Component (Wrapped with ResponsiveLayout) ---
export const AccountScreen = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();

  return (
    <ResponsiveLayout 
      currentRoute="Account" 
      onNavigate={(route) => navigation?.navigate(route)}
      floatingActions={null}
      hideContextPanel={true}
      fullWidth={true}
    >
      <AccountContent navigation={navigation} />
    </ResponsiveLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#8A8AAE',
    fontSize: 16,
    marginTop: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2F5F',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  locationText: {
    color: '#1F2F5F',
    fontSize: 12,
    fontWeight: '500',
  },
  topRight: {
    flexDirection: 'row',
    gap: 8,
  },
  topIcon: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  // Guest Profile
  guestProfile: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  guestAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 125, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  guestAvatarText: {
    fontSize: 36,
  },
  guestName: {
    color: '#1F2F5F',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  guestSubtext: {
    color: '#8A8AAE',
    fontSize: 14,
    marginBottom: 16,
  },
  guestSignInButton: {
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderRadius: 8,
  },
  guestSignInText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Profile Section
  profileSection: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  profileLeft: {
    marginRight: 14,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#4A7DFF',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4A7DFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2F5F',
  },
  verifiedBadge: {
    backgroundColor: '#4A7DFF',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  verifiedBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  profileDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  profileDetailText: {
    color: '#8A8AAE',
    fontSize: 13,
  },
  // Wallet Card
  walletCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#4A7DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  walletGradient: {
    padding: 16,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  walletView: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  walletBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletBalanceContainer: {
    flex: 1,
  },
  walletBalanceLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: 4,
  },
  walletBalance: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  addMoneyButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addMoneyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  lifetimeSavingsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lifetimeSavingsLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  lifetimeSavingsValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Shortcuts
  shortcutsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  shortcutItem: {
    alignItems: 'center',
    gap: 4,
  },
  shortcutIcon: {
    position: 'relative',
  },
  shortcutIconText: {
    fontSize: 24,
  },
  shortcutBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#E74C3C',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  shortcutBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  shortcutLabel: {
    color: '#8A8AAE',
    fontSize: 10,
  },
  // Menu Items
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
  },
  menuSubtitle: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 1,
  },
  // Locked Features
  lockedFeatures: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  lockedTitle: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  lockedText: {
    color: '#8A8AAE',
    fontSize: 13,
  },
  // Business Card
  businessCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  businessGradient: {
    padding: 16,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  businessTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  businessManage: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  businessItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  businessItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  businessItemName: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  businessItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  businessItemRating: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  // Log Out
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 20,
  },
});