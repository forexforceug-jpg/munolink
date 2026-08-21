// src/features/account/AccountScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

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

// --- Menu Items ---
const menuItems = [
  { 
    id: 'profile', 
    icon: 'person-outline', 
    label: 'Profile Settings', 
    subtitle: 'Edit your personal information and avatar',
    route: 'Profile'
  },
  { 
    id: 'start_business', 
    icon: 'rocket-outline', 
    label: 'Start a Business', 
    subtitle: 'Sell products or offer services on Munolink',
    route: 'BusinessRegistration'
  },
  { 
    id: 'sell', 
    icon: 'storefront-outline', 
    label: 'Sell on Munolink', 
    subtitle: 'Manage your shop or service business',
    route: 'BusinessDashboard'
  },
  { 
    id: 'help', 
    icon: 'help-circle-outline', 
    label: 'Help & Support', 
    subtitle: 'FAQs, customer support & assistance',
    route: 'HelpSupport'
  },
];

// --- Sub-components ---
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

// ============================================================
// MAIN ACCOUNT CONTENT
// ============================================================
const AccountContent = ({ navigation }: any) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDesktop } = useBreakpoint();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userShops, setUserShops] = useState<Shop[]>([]);
  const [showBalance, setShowBalance] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalReviews: 0,
    joinedYear: new Date().getFullYear(),
  });

  // --- Fetch User Data ---
  const fetchUserData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userId = user.id;

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (profile) {
        setUserProfile({
          id: profile.id,
          full_name: profile.full_name,
          phone_number: profile.phone_number,
          avatar_url: profile.avatar_url || null,
          role: profile.role,
          wallet_balance: profile.wallet_balance,
          lifetime_savings: profile.lifetime_savings,
          kyc_verified: profile.kyc_verified,
          created_at: profile.created_at,
        });
      } else {
        setUserProfile({
          id: userId,
          full_name: user.full_name || 'User',
          phone_number: user.phone || '',
          avatar_url: null,
          role: 'customer',
          wallet_balance: 0,
          lifetime_savings: 0,
          kyc_verified: false,
          created_at: new Date().toISOString(),
        });
      }

      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id, name, is_verified, rating, review_count, logo_url')
        .eq('owner_id', userId);

      if (shopsError) throw shopsError;
      setUserShops(shops || []);

      if (profile?.created_at) {
        const joinedDate = new Date(profile.created_at);
        setStats(prev => ({ ...prev, joinedYear: joinedDate.getFullYear() }));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  // --- Upload Avatar ---
  const pickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.jpg,.jpeg,.png';
        input.style.display = 'none';
        document.body.appendChild(input);

        const fileSelected = new Promise((resolve, reject) => {
          input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
              const objectUrl = URL.createObjectURL(file);
              resolve({
                uri: objectUrl,
                name: file.name || 'image.jpg',
                mimeType: file.type || 'image/jpeg',
                size: file.size || 0,
                blob: file,
              });
            } else {
              reject(new Error('No file selected'));
            }
            if (input.parentNode) input.parentNode.removeChild(input);
          };
          input.oncancel = () => {
            reject(new Error('Cancelled'));
            if (input.parentNode) input.parentNode.removeChild(input);
          };
        });

        input.click();
        const fileData = await fileSelected as any;
        await uploadAvatar(fileData);
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          name: asset.fileName || `avatar_${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
          size: asset.fileSize || 0,
        };
        await uploadAvatar(file);
      }
    } catch (error: any) {
      if (error.message !== 'Cancelled') {
        console.error('Image pick error:', error);
        Alert.alert('Error', 'Failed to select image. Please try again.');
      }
    }
  };

  // --- Upload Avatar to Storage ---
  const uploadAvatar = async (file: any) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    setUploading(true);
    try {
      console.log('📤 Uploading avatar...');

      let base64Data = '';
      
      if (Platform.OS === 'web' && file.blob) {
        const reader = new FileReader();
        base64Data = await new Promise((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1] || result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file.blob);
        });
      } else if (file.uri) {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const reader = new FileReader();
        base64Data = await new Promise((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1] || result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      const mimeType = file.mimeType || 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      const bucket = 'avatars';
      const path = `${user.id}/avatar_${Date.now()}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, dataUrl, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      setUserProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);

      Alert.alert('Success', 'Avatar updated successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  // --- Handle Menu Item Press ---
  const handleMenuItemPress = (id: string) => {
    console.log('🔗 Menu item pressed:', id);
    
    switch (id) {
      case 'profile':
        navigation.navigate('Profile');
        break;
      case 'start_business':
        navigation.navigate('BusinessRegistration');
        break;
      case 'sell':
        navigation.navigate('BusinessDashboard');
        break;
      case 'help':
        navigation.navigate('HelpSupport');
        break;
      default:
        Alert.alert('Coming Soon', 'This feature will be available soon.');
    }
  };

  // --- Handle Logout ---
  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.replace('Join');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          }
        },
      ]
    );
  };

  // --- Render Avatar Upload Option ---
  const renderAvatarUpload = () => {
    const avatarUrl = userProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.full_name || 'User')}&background=4A7DFF&color=fff&size=200`;
    const isVerified = userProfile?.kyc_verified || false;

    return (
      <View style={styles.profileSection}>
        <View style={styles.profileLeft}>
          <TouchableOpacity 
            style={styles.profileImageContainer} 
            onPress={pickImage}
            disabled={uploading}
            activeOpacity={0.8}
          >
            <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
            <View style={styles.cameraButton}>
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.profileInfo}>
          <View style={styles.profileNameRow}>
            <Text style={styles.profileName}>{userProfile?.full_name || 'User'}</Text>
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>✓</Text>
              </View>
            )}
          </View>
          <View style={styles.profileDetail}>
            <Ionicons name="call-outline" size={14} color="#8A8AAE" />
            <Text style={styles.profileDetailText}>{userProfile?.phone_number || 'No phone'}</Text>
          </View>
          <View style={styles.profileDetail}>
            <Ionicons name="briefcase-outline" size={14} color="#8A8AAE" />
            <Text style={styles.profileDetailText}>
              {userShops.length > 0 ? `${userShops.length} Business${userShops.length > 1 ? 'es' : ''}` : 'No business yet'}
            </Text>
          </View>
          <Text style={styles.profileJoined}>Joined {stats.joinedYear}</Text>
        </View>
      </View>
    );
  };

  // --- Render Wallet Card ---
  const renderWalletCard = () => {
    const walletBalance = userProfile?.wallet_balance || 0;
    const lifetimeSavings = userProfile?.lifetime_savings || 0;

    return (
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
    );
  };

  // --- Render Menu Items ---
  const renderMenuItems = () => (
    <View style={styles.menuContainer}>
      {menuItems.map((item) => (
        <MenuItem key={item.id} item={item} onPress={handleMenuItemPress} />
      ))}
    </View>
  );

  // --- Render Business Card ---
  const renderBusinessCard = () => {
    if (userShops.length === 0) {
      return null; // Don't show anything if no business
    }

    return (
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
    );
  };

  // --- Loading State ---
  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDesktop && styles.desktopContainer]}>
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={styles.loadingText}>Loading your account...</Text>
      </View>
    );
  }

  // --- Guest View ---
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, isDesktop && styles.desktopContainer]}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <GuestProfile navigation={navigation} />
          
          {/* Guest Menu Items */}
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
                <Ionicons name="information-circle-outline" size={22} color="#4A7DFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>About Munolink</Text>
                <Text style={styles.menuSubtitle}>Version 1.0.0</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8A8AAE" />
            </View>
          </View>

          <TouchableOpacity style={styles.signInPrompt} onPress={() => navigation.navigate('Join')}>
            <Text style={styles.signInPromptText}>Sign in to access more features</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    );
  }

  // ============================================================
  // MAIN RENDER (Desktop & Mobile)
  // ============================================================
  return (
    <View style={[styles.container, isDesktop && styles.desktopContainer]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />

      {/* Desktop Header */}
      {isDesktop && (
        <View style={styles.desktopHeader}>
          <Text style={styles.desktopHeaderTitle}>Account</Text>
          <Text style={styles.desktopHeaderSubtitle}>Manage your profile and settings</Text>
        </View>
      )}

      {/* Mobile Header */}
      {!isDesktop && (
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
      )}

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isDesktop ? (
          <View style={styles.desktopGrid}>
            <View style={styles.desktopLeftColumn}>
              {renderAvatarUpload()}
              {renderWalletCard()}
            </View>

            <View style={styles.desktopRightColumn}>
              {renderMenuItems()}
              {renderBusinessCard()}
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#E74C3C" />
                <Text style={styles.logoutText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {renderAvatarUpload()}
            {renderWalletCard()}
            {renderMenuItems()}
            {renderBusinessCard()}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#E74C3C" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

// ============================================================
// MAIN EXPORT
// ============================================================
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

// ============================================================
// STYLES (Keep all existing styles)
// ============================================================
// ... styles remain the same ...
// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  loadingContainer: {
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
  signInPrompt: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  signInPromptText: {
    color: '#4A7DFF',
    fontSize: 14,
    fontWeight: '500',
  },
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
  profileJoined: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 4,
  },
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
  desktopContainer: {
    flex: 1,
    backgroundColor: '#F8F9FC',
    padding: 24,
  },
  desktopHeader: {
    marginBottom: 24,
  },
  desktopHeaderTitle: {
    color: '#1F2F5F',
    fontSize: 32,
    fontWeight: 'bold',
  },
  desktopHeaderSubtitle: {
    color: '#8A8AAE',
    fontSize: 16,
    marginTop: 4,
  },
  desktopScrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 40,
  },
  desktopGrid: {
    flexDirection: 'row',
    gap: 24,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  desktopLeftColumn: {
    flex: 1,
    minWidth: 300,
    maxWidth: 420,
  },
  desktopRightColumn: {
    flex: 2,
    minWidth: 400,
  },
});