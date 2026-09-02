// src/features/account/AccountScreen.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  Animated,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

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
  banner_url?: string | null;
  business_type: string | null;
  is_active: boolean | null;
  description?: string | null;
  phone?: string | null;
  opening_hours?: string | null;
  is_open?: boolean | null;
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
    id: 'help', 
    icon: 'help-circle-outline', 
    label: 'Help & Support', 
    subtitle: 'FAQs, customer support & assistance',
    route: 'HelpSupport'
  },
];

// ============================================================
// SKELETON LOADING COMPONENTS
// ============================================================

const ProfileSkeleton = () => (
  <View style={styles.skeletonProfile}>
    <View style={styles.skeletonAvatar} />
    <View style={styles.skeletonProfileInfo}>
      <View style={styles.skeletonName} />
      <View style={styles.skeletonDetail} />
      <View style={styles.skeletonDetail} />
      <View style={styles.skeletonJoined} />
    </View>
  </View>
);

const WalletSkeleton = () => (
  <View style={styles.skeletonWallet}>
    <View style={styles.skeletonWalletHeader} />
    <View style={styles.skeletonWalletBalance} />
    <View style={styles.skeletonWalletSavings} />
  </View>
);

const MenuSkeleton = () => (
  <View style={styles.skeletonMenu}>
    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.skeletonMenuItem}>
        <View style={styles.skeletonMenuIcon} />
        <View style={styles.skeletonMenuContent}>
          <View style={styles.skeletonMenuLabel} />
          <View style={styles.skeletonMenuSubtitle} />
        </View>
      </View>
    ))}
  </View>
);

const BusinessSkeleton = () => (
  <View style={styles.skeletonBusiness}>
    <View style={styles.skeletonBusinessHeader} />
    {[1, 2].map((i) => (
      <View key={i} style={styles.skeletonBusinessItem} />
    ))}
  </View>
);

// ============================================================
// SUB-COMPONENTS
// ============================================================

const MenuItem = ({ item, onPress }: any) => (
  <TouchableOpacity style={styles.menuItem} onPress={() => onPress(item.id)} activeOpacity={0.7}>
    <View style={styles.menuIconContainer}>
      <Ionicons name={item.icon} size={22} color="#4A7DFF" />
    </View>
    <View style={styles.menuContent}>
      <Text style={styles.menuLabel}>{item.label}</Text>
      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#6A7A9E" />
  </TouchableOpacity>
);

// ============================================================
// GUEST PROFILE COMPONENT
// ============================================================
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
      activeOpacity={0.8}
    >
      <Text style={styles.guestSignInText}>Create Account</Text>
    </TouchableOpacity>
  </View>
);

// ============================================================
// BUSINESS EDIT MODAL
// ============================================================
const BusinessEditModal = ({ 
  visible, 
  shop, 
  onClose, 
  onSave,
  uploading,
}: any) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    opening_hours: '',
    is_open: true,
  });

  useEffect(() => {
    if (shop) {
      setFormData({
        name: shop.name || '',
        description: shop.description || '',
        phone: shop.phone || '',
        opening_hours: shop.opening_hours || '',
        is_open: shop.is_open !== undefined ? shop.is_open : true,
      });
    }
  }, [shop]);

  if (!visible || !shop) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Business</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalGroup}>
              <Text style={styles.modalLabel}>Business Name</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Business name"
                placeholderTextColor="#6A7A9E"
              />
            </View>

            <View style={styles.modalGroup}>
              <Text style={styles.modalLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Describe your business"
                placeholderTextColor="#6A7A9E"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalGroup}>
              <Text style={styles.modalLabel}>Phone</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="+256 700 000 000"
                placeholderTextColor="#6A7A9E"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.modalGroup}>
              <Text style={styles.modalLabel}>Working Hours</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.opening_hours}
                onChangeText={(text) => setFormData(prev => ({ ...prev, opening_hours: text }))}
                placeholder="Mon-Fri 9AM-5PM"
                placeholderTextColor="#6A7A9E"
              />
            </View>

            <View style={styles.modalToggleRow}>
              <Text style={styles.modalLabel}>Business Open</Text>
              <TouchableOpacity
                style={[styles.modalToggle, formData.is_open && styles.modalToggleActive]}
                onPress={() => setFormData(prev => ({ ...prev, is_open: !prev.is_open }))}
              >
                <View style={[styles.modalToggleDot, formData.is_open && styles.modalToggleDotActive]} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.modalSaveButton, uploading && styles.modalSaveButtonDisabled]}
              onPress={() => onSave(shop.id, formData)}
              disabled={uploading}
            >
              <LinearGradient
                colors={['#4A7DFF', '#6B94FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalSaveGradient}
              >
                {uploading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Changes</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

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
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalReviews: 0,
    joinedYear: new Date().getFullYear(),
  });
  
  // Animation for fade-in
  const fadeAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, []);

  // --- Upload Business Image ---
  const uploadBusinessImage = async (uri: string, folder: string): Promise<string> => {
    try {
      console.log('📤 Uploading business image to catalog-images...');
      
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExt = blob.type.split('/')[1] || 'jpg';
      const fileName = `business/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('catalog-images')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('catalog-images')
        .getPublicUrl(fileName);

      console.log('✅ Uploaded:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading business image:', error);
      throw error;
    }
  };

  // --- Pick Logo for Business ---
  const pickBusinessLogo = async (shop: Shop) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        try {
          const logoUrl = await uploadBusinessImage(result.assets[0].uri, 'logos');
          
          // Update shop logo with type assertion
          const { error } = await supabase
            .from('shops')
            .update({ logo_url: logoUrl } as any)
            .eq('id', shop.id);

          if (error) throw error;

          // Update local state
          setUserShops(prev => prev.map(s => 
            s.id === shop.id ? { ...s, logo_url: logoUrl } : s
          ));

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Success', 'Logo updated successfully!');
        } catch (error: any) {
          console.error('Upload error:', error);
          Alert.alert('Error', error.message || 'Failed to update logo');
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Image pick error:', error);
    }
  };

  // --- Pick Banner for Business ---
  const pickBusinessBanner = async (shop: Shop) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        try {
          const bannerUrl = await uploadBusinessImage(result.assets[0].uri, 'banners');
          
          // Update shop banner with type assertion
          const { error } = await supabase
            .from('shops')
            .update({ banner_url: bannerUrl } as any)
            .eq('id', shop.id);

          if (error) throw error;

          // Update local state
          setUserShops(prev => prev.map(s => 
            s.id === shop.id ? { ...s, banner_url: bannerUrl } : s
          ));

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Success', 'Banner updated successfully!');
        } catch (error: any) {
          console.error('Upload error:', error);
          Alert.alert('Error', error.message || 'Failed to update banner');
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Image pick error:', error);
    }
  };

  // --- Save Business Details ---
  const saveBusinessDetails = async (shopId: string, formData: any) => {
    setSavingBusiness(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          name: formData.name,
          description: formData.description || null,
          phone: formData.phone || null,
          opening_hours: formData.opening_hours || null,
          is_open: formData.is_open,
        } as any)
        .eq('id', shopId);

      if (error) throw error;

      // Update local state
      setUserShops(prev => prev.map(s => 
        s.id === shopId ? { ...s, ...formData } : s
      ));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Business details updated successfully!');
      setShowEditModal(false);
      setEditingShop(null);
    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert('Error', error.message || 'Failed to update business');
    } finally {
      setSavingBusiness(false);
    }
  };

  // --- Handle Business Press ---
  const handleBusinessPress = useCallback((businessId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('BusinessDashboard', { businessId });
  }, [navigation]);

  // --- Business Item with Edit Actions ---
  const renderBusinessItemWithActions = useCallback((shop: Shop) => {
    const showLogoOptions = () => {
      Alert.alert(
        'Update Business Media',
        'Choose what you want to update',
        [
          { text: 'Change Logo', onPress: () => pickBusinessLogo(shop) },
          { text: 'Change Banner', onPress: () => pickBusinessBanner(shop) },
          { text: 'Edit Details', onPress: () => {
            setEditingShop(shop);
            setShowEditModal(true);
          }},
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    };

    return (
      <TouchableOpacity 
        key={shop.id}
        style={styles.businessItem} 
        onPress={() => handleBusinessPress(shop.id)}
        activeOpacity={0.7}
        onLongPress={showLogoOptions}
      >
        <View style={styles.businessItemLeft}>
          {shop.logo_url ? (
            <Image source={{ uri: shop.logo_url }} style={styles.businessItemLogo} />
          ) : (
            <View style={styles.businessItemLogoPlaceholder}>
              <Text style={styles.businessItemLogoText}>
                {shop.name?.charAt(0)?.toUpperCase() || '🏪'}
              </Text>
            </View>
          )}
          <View>
            <View style={styles.businessItemNameRow}>
              <Text style={styles.businessItemName}>{shop.name}</Text>
              {shop.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>✓</Text>
                </View>
              )}
            </View>
            <View style={styles.businessItemMeta}>
              <Text style={styles.businessItemType}>
                {shop.business_type === 'service' ? '🔧 Service' : 
                 shop.business_type === 'institution' ? '🏛️ Institution' : '🛍️ Shop'}
              </Text>
              <Text style={styles.businessItemDot}>•</Text>
              <Text style={[styles.businessItemActive, shop.is_active ? styles.active : styles.inactive]}>
                {shop.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.businessItemRight}>
          <TouchableOpacity 
            style={styles.businessEditButton}
            onPress={(e) => { 
              e.stopPropagation(); 
              setEditingShop(shop);
              setShowEditModal(true);
            }}
          >
            <Ionicons name="create-outline" size={16} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.businessEditButton}
            onPress={(e) => { 
              e.stopPropagation(); 
              showLogoOptions();
            }}
          >
            <Ionicons name="image-outline" size={16} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
        </View>
      </TouchableOpacity>
    );
  }, [handleBusinessPress]);

  // --- Fetch User Data ---
  const fetchUserData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userId = user.id;

      // Fetch user profile
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

      // Fetch shops
      const { data: shopsData, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      let allBusinesses: Shop[] = [];

      if (!shopsError && shopsData) {
        allBusinesses = shopsData.map(s => ({
          id: s.id,
          name: s.name,
          is_verified: s.is_verified || false,
          rating: s.rating || null,
          review_count: s.review_count || null,
          logo_url: s.logo_url || null,
          banner_url: (s as any).banner_url || null,
          business_type: s.business_type || 'shop',
          is_active: s.is_active || false,
          description: s.description || null,
          phone: s.phone || null,
          opening_hours: s.opening_hours || null,
          is_open: s.is_open !== undefined ? s.is_open : true,
        }));
      }

      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('provider_services')
        .select('id, service_id, price, is_active, created_at')
        .eq('user_id', userId);

      if (!servicesError && servicesData && servicesData.length > 0) {
        const serviceIds = servicesData.map(s => s.service_id);
        const { data: serviceCatalogs } = await supabase
          .from('service_catalog')
          .select('id, name, category, description, images')
          .in('id', serviceIds);
        
        if (serviceCatalogs) {
          const serviceBusinesses = servicesData.map(s => {
            const catalog = serviceCatalogs.find(c => c.id === s.service_id);
            return {
              id: s.id,
              name: catalog?.name || 'Service',
              is_verified: false,
              rating: null,
              review_count: null,
              logo_url: catalog?.images?.[0] || null,
              banner_url: null,
              business_type: 'service',
              is_active: s.is_active || false,
              description: catalog?.description || null,
              phone: null,
              is_open: true,
            };
          });
          allBusinesses = [...allBusinesses, ...serviceBusinesses];
        }
      }

      // Fetch institutions
      const { data: institutionsData, error: institutionsError } = await supabase
        .from('institutions')
        .select('id, name, is_verified, rating, review_count, logo, cover_image, is_open, description, phone')
        .eq('created_by', userId);

      if (!institutionsError && institutionsData) {
        const institutionBusinesses = institutionsData.map(s => ({
          id: s.id,
          name: s.name,
          is_verified: s.is_verified || false,
          rating: s.rating || null,
          review_count: s.review_count || null,
          logo_url: s.logo || null,
          banner_url: s.cover_image || null,
          business_type: 'institution',
          is_active: s.is_open || false,
          description: s.description || null,
          phone: s.phone || null,
          is_open: s.is_open !== undefined ? s.is_open : true,
        }));
        allBusinesses = [...allBusinesses, ...institutionBusinesses];
      }

      console.log('✅ Found businesses:', allBusinesses.length);
      setUserShops(allBusinesses);

      if (profile?.created_at) {
        const joinedDate = new Date(profile.created_at);
        setStats(prev => ({ ...prev, joinedYear: joinedDate.getFullYear() }));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load your account data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const onRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    fetchUserData();
  }, [fetchUserData]);

  // --- Handle Menu Item Press ---
  const handleMenuItemPress = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (id) {
      case 'profile':
        navigation.navigate('Profile');
        break;
      case 'start_business':
        navigation.navigate('BusinessRegistration');
        break;
      case 'help':
        navigation.navigate('HelpSupport');
        break;
      default:
        Alert.alert('Coming Soon', 'This feature will be available soon.');
    }
  }, [navigation]);

  // --- Handle Logout ---
  const handleLogout = useCallback(() => {
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
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
  }, [logout, navigation]);

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
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });

        const file = {
          uri: asset.uri,
          name: asset.fileName || `avatar_${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
          size: asset.fileSize || 0,
          blob: blob,
          base64: base64,
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

  const uploadAvatar = async (file: any) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    setUploading(true);
    try {
      let base64Data = '';
      let mimeType = file.mimeType || 'image/jpeg';
      const fileName = `avatar_${Date.now()}.jpg`;
      const filePath = `avatars/${user.id}/${fileName}`;

      if (file.base64) {
        base64Data = (file.base64 as string).split(',')[1] || file.base64;
      } else if (Platform.OS === 'web' && file.blob) {
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

      if (!base64Data) {
        throw new Error('Failed to convert image to base64');
      }

      const { data, error: uploadError } = await supabase.storage
        .from('catalog-images')
        .upload(filePath, base64Data, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('catalog-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      setUserProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Avatar updated successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  // --- Render Avatar Upload ---
  const renderAvatarUpload = useCallback(() => {
    const avatarUrl = userProfile?.avatar_url || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.full_name || 'User')}&background=4A7DFF&color=fff&size=200&bold=true`;
    
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
            <Image 
              source={{ uri: avatarUrl }} 
              style={styles.profileImage}
              onError={() => console.log('Avatar image failed to load, using fallback')}
            />
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
  }, [userProfile, userShops.length, uploading, stats.joinedYear]);

  // --- Render Wallet Card ---
  const renderWalletCard = useCallback(() => {
    const walletBalance = userProfile?.wallet_balance || 0;
    const lifetimeSavings = userProfile?.lifetime_savings || 0;

    return (
      <TouchableOpacity 
        style={styles.walletCard} 
        onPress={() => navigation.navigate('Wallet')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#4A7DFF', '#6B94FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.walletGradient}
        >
          <View style={styles.walletHeader}>
            <Text style={styles.walletTitle}>💰 Munolink Wallet</Text>
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
            <TouchableOpacity 
              style={styles.addMoneyButton}
              onPress={() => navigation.navigate('AddMoney')}
            >
              <Text style={styles.addMoneyText}>+ Add Money</Text>
            </TouchableOpacity>
          </View>
          {lifetimeSavings > 0 && (
            <View style={styles.lifetimeSavingsContainer}>
              <Text style={styles.lifetimeSavingsLabel}>💎 Lifetime Savings</Text>
              <Text style={styles.lifetimeSavingsValue}>UGX {lifetimeSavings.toLocaleString()}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }, [userProfile, showBalance, navigation]);

  // --- Render Business Card ---
  const renderBusinessCard = useCallback(() => {
    if (userShops.length === 0) {
      return (
        <TouchableOpacity 
          style={styles.businessCardEmpty}
          onPress={() => navigation.navigate('BusinessRegistration')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#1A2A4F', '#2A3F6F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.businessGradientEmpty}
          >
            <Text style={styles.businessEmptyIcon}>🚀</Text>
            <Text style={styles.businessEmptyTitle}>Start Your Business</Text>
            <Text style={styles.businessEmptyText}>
              Create your first shop or service to start selling on Munolink
            </Text>
            <View style={styles.businessEmptyButton}>
              <Text style={styles.businessEmptyButtonText}>Get Started →</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      );
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
            <Text style={styles.businessTitle}>🏪 My Businesses</Text>
            <View style={styles.businessHeaderActions}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('BusinessRegistration')}
                style={styles.businessAddButton}
              >
                <Ionicons name="add-circle-outline" size={18} color="rgba(255,255,255,0.6)" />
                <Text style={styles.businessManage}>Add New</Text>
              </TouchableOpacity>
            </View>
          </View>
          {userShops.map((shop) => renderBusinessItemWithActions(shop))}
          <Text style={styles.businessHint}>Long press a business to update logo or banner</Text>
        </LinearGradient>
      </View>
    );
  }, [userShops, navigation, renderBusinessItemWithActions]);

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
    <SafeAreaView style={[styles.container, isDesktop && styles.desktopContainer]} edges={['top']}>        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
        <Animated.View style={{ opacity: fadeAnim }}>
          <ProfileSkeleton />
          <WalletSkeleton />
          <MenuSkeleton />
          <BusinessSkeleton />
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ============================================================
  // GUEST VIEW
  // ============================================================
  if (!isAuthenticated) {
    return (
    <SafeAreaView style={[styles.container, isDesktop && styles.desktopContainer]} edges={['top']}>  
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A7DFF" />
          }
        >
          <GuestProfile navigation={navigation} />
          
          <View style={styles.menuContainer}>
            <MenuItem 
              item={{ 
                id: 'help', 
                icon: 'help-circle-outline', 
                label: 'Help & Support', 
                subtitle: 'FAQs and customer support',
                route: 'HelpSupport'
              }} 
              onPress={() => navigation.navigate('HelpSupport')} 
            />
            <MenuItem 
              item={{ 
                id: 'about', 
                icon: 'information-circle-outline', 
                label: 'About Munolink', 
                subtitle: 'Version 1.0.0',
                route: 'About'
              }} 
              onPress={() => Alert.alert('About Munolink', 'Version 1.0.0\n\nConnecting buyers and sellers in Uganda.')} 
            />
          </View>

          <TouchableOpacity style={styles.signInPrompt} onPress={() => navigation.navigate('Join')}>
            <Text style={styles.signInPromptText}>Sign in to access more features</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
    </SafeAreaView>    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
  <SafeAreaView style={[styles.container, isDesktop && styles.desktopContainer]} edges={['top']}>
    <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      {isDesktop && (
        <View style={styles.desktopHeader}>
          <Text style={styles.desktopHeaderTitle}>Account</Text>
          <Text style={styles.desktopHeaderSubtitle}>Manage your profile and settings</Text>
        </View>
      )}

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
              <Ionicons name="notifications-outline" size={22} color="#8A8AAE" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.topIcon} onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={22} color="#8A8AAE" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A7DFF" />
        }
        style={{ opacity: fadeAnim }}
      >
        {isDesktop ? (
          <View style={styles.desktopGrid}>
            <View style={styles.desktopLeftColumn}>
              {renderAvatarUpload()}
              {renderWalletCard()}
            </View>

            <View style={styles.desktopRightColumn}>
              <View style={styles.menuContainer}>
                {menuItems.map((item) => (
                  <MenuItem key={item.id} item={item} onPress={handleMenuItemPress} />
                ))}
              </View>
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
            <View style={styles.menuContainer}>
              {menuItems.map((item) => (
                <MenuItem key={item.id} item={item} onPress={handleMenuItemPress} />
              ))}
            </View>
            {renderBusinessCard()}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#E74C3C" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      {/* Business Edit Modal */}
      <BusinessEditModal
        visible={showEditModal}
        shop={editingShop}
        onClose={() => {
          setShowEditModal(false);
          setEditingShop(null);
        }}
        onSave={saveBusinessDetails}
        uploading={savingBusiness}
      />
    </SafeAreaView>  );
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
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
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
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  locationText: {
    color: '#E8ECF4',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  guestProfile: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    color: '#FFFFFF',
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
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    borderColor: '#1A1A2E',
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
    color: '#FFFFFF',
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
    boxShadow: '0px 4px 12px rgba(74, 125, 255, 0.3)',
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
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
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
    color: '#FFFFFF',
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
    boxShadow: '0px 2px 8px rgba(0,0,0,0.2)',
    elevation: 2,
  },
  businessCardEmpty: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0,0,0,0.2)',
    elevation: 2,
  },
  businessGradient: {
    padding: 16,
  },
  businessGradientEmpty: {
    padding: 24,
    alignItems: 'center',
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
  businessHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  businessAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  businessManage: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  businessItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  businessItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  businessItemLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  businessItemLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessItemLogoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  businessItemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  businessItemName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  businessItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  businessItemType: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  businessItemDot: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
  },
  businessItemActive: {
    fontSize: 11,
    fontWeight: '500',
  },
  active: {
    color: '#2ECC71',
  },
  inactive: {
    color: '#E74C3C',
  },
  businessItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  businessItemRating: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  businessEditButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 4,
  },
  businessHint: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  businessEmptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  businessEmptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  businessEmptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  businessEmptyButton: {
    backgroundColor: 'rgba(74, 125, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  businessEmptyButtonText: {
    color: '#4A7DFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    backgroundColor: '#0D0D1A',
    padding: 24,
  },
  desktopHeader: {
    marginBottom: 24,
  },
  desktopHeaderTitle: {
    color: '#FFFFFF',
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
    maxWidth: 700,
  },

  // ============================================================
  // SKELETON STYLES
  // ============================================================
  skeletonProfile: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  skeletonAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 14,
  },
  skeletonProfileInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  skeletonName: {
    width: '60%',
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  skeletonDetail: {
    width: '80%',
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  skeletonJoined: {
    width: '40%',
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  skeletonWallet: {
    backgroundColor: '#1A2A4F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    height: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  skeletonWalletHeader: {
    width: '50%',
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonWalletBalance: {
    width: '70%',
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonWalletSavings: {
    width: '60%',
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  skeletonMenu: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    marginBottom: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  skeletonMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  skeletonMenuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skeletonMenuContent: {
    flex: 1,
    gap: 4,
  },
  skeletonMenuLabel: {
    width: '40%',
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  skeletonMenuSubtitle: {
    width: '60%',
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  skeletonBusiness: {
    backgroundColor: '#0D1A2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    height: 150,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  skeletonBusinessHeader: {
    width: '40%',
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonBusinessItem: {
    width: '100%',
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    marginBottom: 8,
  },

  // ============================================================
  // MODAL STYLES
  // ============================================================
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalGroup: {
    marginBottom: 16,
  },
  modalLabel: {
    color: '#8A8AAE',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  modalToggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 2,
  },
  modalToggleActive: {
    backgroundColor: '#4A7DFF',
  },
  modalToggleDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: 0 }],
  },
  modalToggleDotActive: {
    transform: [{ translateX: 20 }],
  },
  modalSaveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
  },
  modalSaveButtonDisabled: {
    opacity: 0.5,
  },
  modalSaveGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});