// src/features/account/AccountScreen.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  RefreshControl,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { supabase } from '../../lib/supabase';
import { SceneRenderer } from '../opportunity/renderer/SceneRenderer';
import { FloatingActionRail } from '../feed/components/FloatingActionRail';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as VideoThumbnails from 'expo-video-thumbnails';

const { width, height } = Dimensions.get('window');

// --- Types ---
interface UserProfile {
  id: string;
  full_name: string | null;
  phone_number: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  role: string | null;
  wallet_balance: number | null;
  lifetime_savings: number | null;
  kyc_verified: boolean | null;
  created_at: string | null;
  location_city: string | null;
  location_region: string | null;
  location_country: string | null;
}

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  brand: string | null;
  description: string | null;
  specifications: any;
  images: string[] | null;
  tags: string[] | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  category_id: string | null;
  user_id?: string | null;
  like_count?: number | null;
  view_count?: number | null;
  price?: number | null;
  video?: string | null;
  video_thumbnail?: string | null;
  video_duration?: number | null;
  video_size?: number | null;
}

// ============================================================
// SKELETON LOADING COMPONENTS
// ============================================================

const ProfileSkeleton = () => (
  <View style={styles.skeletonProfile}>
    <View style={styles.skeletonAvatar} />
    <View style={styles.skeletonName} />
    <View style={styles.skeletonStats} />
    <View style={styles.skeletonBio} />
  </View>
);

// ============================================================
// SUB-COMPONENTS
// ============================================================

// --- Stats Row ---
const StatsRow = ({ following, followers, likes }: any) => (
  <View style={styles.statsRow}>
    <View style={styles.statItem}>
      <Text style={styles.statNumber}>{following || 0}</Text>
      <Text style={styles.statLabel}>Following</Text>
    </View>
    <View style={styles.statItem}>
      <Text style={styles.statNumber}>{followers || 0}</Text>
      <Text style={styles.statLabel}>Followers</Text>
    </View>
    <View style={styles.statItem}>
      <Text style={styles.statNumber}>{likes || 0}</Text>
      <Text style={styles.statLabel}>Likes</Text>
    </View>
  </View>
);

// ============================================================
// GRID POST ITEM - WITH PROPER THUMBNAIL FALLBACK
// ============================================================

const GridPostItem = ({ item, onPress }: any) => {
  // ✅ Get image with proper fallback
  let imageUrl = null;
  
  // 1. Try images array first
  if (item.images && item.images.length > 0) {
    imageUrl = item.images[0];
  }
  // 2. Try video_thumbnail
  else if (item.video_thumbnail && isValidImageUrl(item.video_thumbnail)) {
    imageUrl = item.video_thumbnail;
  }
  // 3. Try specifications.video_thumbnail
  else if (item.specifications && typeof item.specifications === 'object') {
    const specThumbnail = item.specifications.video_thumbnail;
    if (specThumbnail && isValidImageUrl(specThumbnail)) {
      imageUrl = specThumbnail;
    }
  }
  
  const hasVideo = !!item.video || !!item.specifications?.video;
  
  // ✅ Get price from specifications
  let price = null;
  if (item.specifications && typeof item.specifications === 'object') {
    price = item.specifications.price || item.specifications.regular_price || null;
  }
  if (!price && item.price) {
    price = item.price;
  }

  return (
    <TouchableOpacity 
      style={styles.gridPostItem} 
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.gridPostImage} />
      ) : (
        <View style={styles.gridPostPlaceholder}>
          <Ionicons name="image-outline" size={32} color="#8A8AAE" />
        </View>
      )}
      
      {hasVideo && (
        <View style={styles.gridVideoBadge}>
          <Ionicons name="play-circle" size={20} color="#FFFFFF" />
        </View>
      )}
      
      <View style={styles.gridPostOverlay}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gridPostGradient}
        />
        <View style={styles.gridPostInfo}>
          <Text style={styles.gridPostTitle} numberOfLines={1}>{item.name || 'Untitled'}</Text>
          {price && (
            <Text style={styles.gridPostPrice}>UGX {Number(price).toLocaleString()}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================================
// GUEST ACCOUNT SCREEN
// ============================================================

const GuestAccountScreen = ({ navigation }: any) => {
  return (
    <View style={styles.guestContainer}>
      <View style={styles.guestHeader}>
        <Text style={styles.guestHeaderTitle}>Munolink</Text>
      </View>

      <View style={styles.guestContent}>
        <View style={styles.guestAvatarContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#4A7DFF" />
        </View>

        <Text style={styles.guestTitle}>Welcome to Munolink</Text>
        <Text style={styles.guestSubtitle}>
          Create an account to follow people, save posts, and share your own opportunities with the community.
        </Text>

        <TouchableOpacity 
          style={styles.guestSignUpButton}
          onPress={() => navigation.navigate('Join')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4A7DFF', '#6B94FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.guestSignUpGradient}
          >
            <Text style={styles.guestSignUpText}>Create Account</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.guestLogInButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Text style={styles.guestLogInText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.guestContinueButton}
          onPress={() => navigation.navigate('Feed')}
          activeOpacity={0.6}
        >
          <Text style={styles.guestContinueText}>Continue as guest</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.guestFeatures}>
        <View style={styles.guestFeature}>
          <View style={styles.guestFeatureIcon}>
            <Ionicons name="compass-outline" size={24} color="#4A7DFF" />
          </View>
          <Text style={styles.guestFeatureLabel}>Discover</Text>
        </View>
        <View style={styles.guestFeature}>
          <View style={styles.guestFeatureIcon}>
            <Ionicons name="heart-outline" size={24} color="#4A7DFF" />
          </View>
          <Text style={styles.guestFeatureLabel}>Save</Text>
        </View>
        <View style={styles.guestFeature}>
          <View style={styles.guestFeatureIcon}>
            <Ionicons name="chatbubble-outline" size={24} color="#4A7DFF" />
          </View>
          <Text style={styles.guestFeatureLabel}>Connect</Text>
        </View>
        <View style={styles.guestFeature}>
          <View style={styles.guestFeatureIcon}>
            <Ionicons name="add-circle-outline" size={24} color="#4A7DFF" />
          </View>
          <Text style={styles.guestFeatureLabel}>Share</Text>
        </View>
      </View>
    </View>
  );
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Validates if a URL points to a valid image based on extension
 */
const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.heic'];
  const lowerUrl = url.toLowerCase();
  return validExtensions.some(ext => lowerUrl.endsWith(ext)) || lowerUrl.includes('image');
};

/**
 * Safely gets a value from specifications (Json type)
 */
const getFromSpecs = (specs: any, key: string): string | null => {
  if (!specs || typeof specs !== 'object') return null;
  const value = specs[key];
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return null;
};

/**
 * Gets a valid thumbnail URL with fallback
 */
const getValidThumbnail = (item: CatalogItem): string | undefined => {
  // Check direct video_thumbnail first
  if (item.video_thumbnail && isValidImageUrl(item.video_thumbnail)) {
    return item.video_thumbnail;
  }
  // Check specifications (Json type)
  const specThumbnail = getFromSpecs(item.specifications, 'video_thumbnail');
  if (specThumbnail && isValidImageUrl(specThumbnail)) {
    return specThumbnail;
  }
  // Fallback to first image
  if (item.images && item.images.length > 0 && isValidImageUrl(item.images[0])) {
    return item.images[0];
  }
  return undefined;
};

/**
 * Gets video URL from direct property or specifications
 */
const getVideoUrl = (item: CatalogItem): string | null => {
  // Check direct video first
  if (item.video) return item.video;
  // Check specifications (Json type)
  const specVideo = getFromSpecs(item.specifications, 'video');
  if (specVideo) return specVideo;
  return null;
};

// ============================================================
// MAIN ACCOUNT CONTENT
// ============================================================

const AccountContent = ({ navigation }: any) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDesktop } = useBreakpoint();
  
  // --- State ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  
  // Fullscreen view state
  const [viewMode, setViewMode] = useState<'grid' | 'fullscreen'>('grid');
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [savedItemsMap, setSavedItemsMap] = useState<Record<string, boolean>>({});
  
  // --- Edit Profile Form ---
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone_number: '',
    bio: '',
    location_city: '',
    location_region: '',
    location_country: '',
  });
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [editCover, setEditCover] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  
  // --- Create Post Form ---
  const [postForm, setPostForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    images: [] as string[],
    tags: [] as string[],
    video: null as string | null,
    videoThumbnail: null as string | null,
    videoDuration: null as number | null,
    videoSize: null as number | null,
  });
  const [savingPost, setSavingPost] = useState(false);
  
  // --- Stats ---
  const [stats, setStats] = useState({
    following: 0,
    followers: 0,
    likes: 0,
    joinedYear: new Date().getFullYear(),
  });

  const flatListRef = useRef<FlatList>(null);

  // ============================================================
  // FETCH FUNCTIONS
  // ============================================================

  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const userData = data as any;
        return {
          id: userData.id,
          full_name: userData.full_name || user.full_name || 'User',
          phone_number: userData.phone_number || user.phone || '',
          avatar_url: userData.avatar_url || null,
          cover_url: userData.cover_url || null,
          bio: userData.bio || null,
          role: userData.role || 'customer',
          wallet_balance: userData.wallet_balance || 0,
          lifetime_savings: userData.lifetime_savings || 0,
          kyc_verified: userData.kyc_verified || false,
          created_at: userData.created_at || new Date().toISOString(),
          location_city: userData.location_city || null,
          location_region: userData.location_region || null,
          location_country: userData.location_country || null,
        } as UserProfile;
      }
      
      return {
        id: user.id,
        full_name: user.full_name || 'User',
        phone_number: user.phone || '',
        avatar_url: null,
        cover_url: null,
        bio: null,
        role: 'customer',
        wallet_balance: 0,
        lifetime_savings: 0,
        kyc_verified: false,
        created_at: new Date().toISOString(),
        location_city: null,
        location_region: null,
        location_country: null,
      } as UserProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, [user]);

  const fetchUserCatalog = useCallback(async () => {
    if (!user?.id) return [];

    try {
      console.log('📊 Fetching catalog for user:', user.id);
      
      const { data, error } = await supabase
        .from('catalog')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching catalog:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} items for user`);

      return (data || []).map((item: any) => ({
        id: item.id,
        name: item.name || 'Untitled',
        category: item.category || 'Uncategorized',
        subcategory: item.subcategory || null,
        brand: item.brand || null,
        description: item.description || null,
        specifications: item.specifications || {},
        images: item.images || null,
        tags: item.tags || null,
        is_active: item.is_active || null,
        created_at: item.created_at || null,
        updated_at: item.updated_at || null,
        category_id: item.category_id || null,
        user_id: item.user_id || null,
        like_count: item.like_count || 0,
        view_count: item.view_count || 0,
        price: item.price || null,
        video: item.video || null,
        video_thumbnail: item.video_thumbnail || null,
        video_duration: item.video_duration || null,
        video_size: item.video_size || null,
      }));
    } catch (error) {
      console.error('Error fetching catalog:', error);
      return [];
    }
  }, [user]);

  // --- FETCH FOLLOWERS & FOLLOWING FROM CORRECT TABLE ---
  const fetchFollowStats = useCallback(async () => {
    if (!user?.id) return { followers: 0, following: 0 };

    try {
      // Get followers count (people following this user)
      const { count: followersCount, error: followersError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      if (followersError) {
        console.error('Error fetching followers:', followersError);
      }

      // Get following count (people this user is following)
      const { count: followingCount, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      if (followingError) {
        console.error('Error fetching following:', followingError);
      }

      return {
        followers: followersCount || 0,
        following: followingCount || 0,
      };
    } catch (error) {
      console.error('Error fetching follow stats:', error);
      return { followers: 0, following: 0 };
    }
  }, [user?.id]);

  const loadAllData = useCallback(async () => {
    if (!user?.id) {
      console.log('⚠️ No user ID, skipping data load');
      setLoading(false);
      return;
    }

    console.log('🔄 Loading data for user:', user.id);
    setLoading(true);
    
    try {
      const [profile, catalogData, followStats] = await Promise.all([
        fetchUserProfile(),
        fetchUserCatalog(),
        fetchFollowStats(),
      ]);

      console.log('📊 Profile loaded:', !!profile);
      console.log('📊 Catalog items loaded:', catalogData.length);
      console.log('📊 Followers:', followStats.followers);
      console.log('📊 Following:', followStats.following);

      if (profile) {
        setUserProfile(profile);
        if (profile.created_at) {
          const joinedDate = new Date(profile.created_at);
          setStats(prev => ({ ...prev, joinedYear: joinedDate.getFullYear() }));
        }
      }
      
      setCatalogItems(catalogData);
      
      const totalLikes = catalogData.reduce((sum, item) => {
        return sum + (item.like_count || 0);
      }, 0);
      
      setStats(prev => ({
        ...prev,
        likes: totalLikes,
        followers: followStats.followers,
        following: followStats.following,
      }));
      
      console.log('✅ Data loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, fetchUserProfile, fetchUserCatalog, fetchFollowStats]);

  useEffect(() => {
    loadAllData();
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadAllData();
    }
  }, [isAuthenticated]);

  const onRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    loadAllData();
  }, [loadAllData]);

  // ============================================================
  // AVATAR & COVER UPLOAD - UNIFIED BLOB UPLOAD
  // ============================================================

  const uploadProfileImage = async (uri: string, folder: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = blob.type.split('/')[1] || 'jpg';
      const fileName = `${folder}/${user?.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('catalog-images')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('catalog-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // ============================================================
  // PICK AVATAR - UNIFIED FOR BOTH PROFILE AND EDIT MODAL
  // ============================================================

  const pickAvatar = useCallback(async () => {
    try {
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
        
        // If we're in edit mode, set the edit avatar
        if (showEditProfile) {
          setEditAvatar(asset.uri);
          return;
        }
        
        // Otherwise, upload directly for profile avatar
        setUploading(true);
        try {
          const avatarUrl = await uploadProfileImage(asset.uri, 'avatars');
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ avatar_url: avatarUrl })
            .eq('id', user?.id);

          if (updateError) throw updateError;

          setUserProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Success', 'Avatar updated successfully!');
        } catch (error) {
          console.error('Avatar upload error:', error);
          Alert.alert('Error', 'Failed to upload avatar');
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Avatar pick error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  }, [user?.id, showEditProfile]);

  // ============================================================
  // PICK COVER - FOR EDIT PROFILE MODAL
  // ============================================================

  const pickCover = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setEditCover(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Cover pick error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  }, []);

  // ============================================================
  // UPDATE PROFILE
  // ============================================================

  const updateProfile = async () => {
    if (!user?.id) return;

    setSavingProfile(true);

    try {
      let avatarUrl = userProfile?.avatar_url || null;
      let coverUrl = userProfile?.cover_url || null;

      if (editAvatar) {
        try {
          avatarUrl = await uploadProfileImage(editAvatar, 'avatars');
        } catch (error) {
          console.error('Avatar upload failed:', error);
          Alert.alert('Error', 'Failed to upload avatar');
          setSavingProfile(false);
          return;
        }
      }

      if (editCover) {
        try {
          coverUrl = await uploadProfileImage(editCover, 'covers');
        } catch (error) {
          console.error('Cover upload failed:', error);
          Alert.alert('Error', 'Failed to upload cover image');
          setSavingProfile(false);
          return;
        }
      }

      const updateData: any = {};
      
      if (editForm.full_name.trim()) {
        updateData.full_name = editForm.full_name.trim();
      }
      if (editForm.phone_number.trim()) {
        updateData.phone_number = editForm.phone_number.trim();
      }
      updateData.bio = editForm.bio.trim() || null;
      updateData.location_city = editForm.location_city.trim() || null;
      updateData.location_region = editForm.location_region.trim() || null;
      updateData.location_country = editForm.location_country.trim() || null;

      if (avatarUrl) updateData.avatar_url = avatarUrl;
      if (coverUrl) updateData.cover_url = coverUrl;

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      setUserProfile(prev => prev ? {
        ...prev,
        full_name: editForm.full_name.trim() || prev.full_name,
        phone_number: editForm.phone_number.trim() || prev.phone_number,
        bio: editForm.bio.trim() || null,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
        location_city: editForm.location_city.trim() || null,
        location_region: editForm.location_region.trim() || null,
        location_country: editForm.location_country.trim() || null,
      } : null);

      setEditAvatar(null);
      setEditCover(null);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Success', 'Profile updated successfully!');
      setShowEditProfile(false);
      
      loadAllData();

    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // ============================================================
  // CREATE POST
  // ============================================================

  const pickMedia = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const selectedAssets = result.assets;
        
        const images: string[] = [];
        let video: string | null = null;
        let videoThumbnail: string | null = null;
        let videoDuration: number | null = null;
        let videoSize: number | null = null;
        
        for (const asset of selectedAssets) {
          if (asset.type === 'video') {
            video = asset.uri;
            videoDuration = asset.duration || null;
            videoSize = asset.fileSize || null;
            
            try {
              const thumbnailResult = await VideoThumbnails.getThumbnailAsync(
                asset.uri,
                { time: 1000, quality: 0.7 }
              );
              if (thumbnailResult && thumbnailResult.uri) {
                videoThumbnail = thumbnailResult.uri;
                console.log('📸 Auto-generated thumbnail:', videoThumbnail);
              }
            } catch (thumbError) {
              console.error('❌ Auto thumbnail generation failed:', thumbError);
            }
          } else {
            images.push(asset.uri);
          }
        }
        
        setPostForm(prev => ({
          ...prev,
          images: [...prev.images, ...images],
          video: video,
          videoThumbnail: videoThumbnail,
          videoDuration: videoDuration,
          videoSize: videoSize,
        }));
        
        if (video && !videoThumbnail) {
          Alert.alert(
            '📸 Thumbnail Needed',
            'Please select a thumbnail image for your video.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Media pick error:', error);
      Alert.alert('Error', 'Failed to select media');
    }
  };

  const pickThumbnail = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [16, 9],
      });

      if (!result.canceled && result.assets[0]) {
        setPostForm(prev => ({
          ...prev,
          videoThumbnail: result.assets[0].uri,
        }));
        console.log('📸 Manual thumbnail selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Thumbnail pick error:', error);
      Alert.alert('Error', 'Failed to select thumbnail');
    }
  };

  const removePostImage = (index: number) => {
    setPostForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeVideo = () => {
    setPostForm(prev => ({
      ...prev,
      video: null,
      videoThumbnail: null,
      videoDuration: null,
      videoSize: null,
    }));
  };

  const removeThumbnail = () => {
    setPostForm(prev => ({
      ...prev,
      videoThumbnail: null,
    }));
  };

  const uploadVideoAndThumbnail = async (videoUri: string, thumbnailUri: string | null) => {
    if (!user?.id) return { videoUrl: null, videoThumbnail: null, videoDuration: null, videoSize: null };

    try {
      const videoResponse = await fetch(videoUri);
      const videoBlob = await videoResponse.blob();
      
      let videoExt = 'mp4';
      const mimeType = videoBlob.type;
      if (mimeType.includes('mp4')) videoExt = 'mp4';
      else if (mimeType.includes('quicktime')) videoExt = 'mov';
      else if (mimeType.includes('x-matroska')) videoExt = 'mkv';
      else if (mimeType.includes('webm')) videoExt = 'webm';
      else if (mimeType.includes('avi')) videoExt = 'avi';
      
      const videoFileName = `videos/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${videoExt}`;
      
      console.log('📹 Uploading video:', videoFileName);
      
      const { data: videoData, error: videoError } = await supabase.storage
        .from('catalog-images')
        .upload(videoFileName, videoBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: mimeType || 'video/mp4',
        });

      if (videoError) {
        console.error('❌ Video upload error:', videoError);
        throw videoError;
      }

      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('catalog-images')
        .getPublicUrl(videoFileName);

      console.log('✅ Video uploaded:', videoUrl);

      let videoThumbnail: string | null = null;

      if (thumbnailUri) {
        try {
          console.log('📸 Uploading thumbnail from:', thumbnailUri);
          
          const thumbResponse = await fetch(thumbnailUri);
          const thumbBlob = await thumbResponse.blob();
          
          const thumbFileName = `videos/${user.id}/${Date.now()}-thumb-${Math.random().toString(36).slice(2, 10)}.jpg`;
          
          console.log('📸 Uploading thumbnail as:', thumbFileName);
          
          const { data: thumbData, error: thumbError } = await supabase.storage
            .from('catalog-images')
            .upload(thumbFileName, thumbBlob, {
              cacheControl: '3600',
              upsert: false,
              contentType: 'image/jpeg',
            });

          if (thumbError) {
            console.error('❌ Thumbnail upload error:', thumbError);
          } else if (thumbData) {
            const { data: { publicUrl: thumbPublicUrl } } = supabase.storage
              .from('catalog-images')
              .getPublicUrl(thumbFileName);
            videoThumbnail = thumbPublicUrl;
            console.log('✅ Thumbnail uploaded:', videoThumbnail);
          }
        } catch (thumbError) {
          console.error('❌ Thumbnail upload failed:', thumbError);
        }
      }

      return { 
        videoUrl, 
        videoThumbnail,
        videoDuration: postForm.videoDuration,
        videoSize: postForm.videoSize,
      };

    } catch (error) {
      console.error('❌ Video upload error:', error);
      throw error;
    }
  };

  const createPost = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in');
      return;
    }

    if (!postForm.name.trim()) {
      Alert.alert('Error', 'Please enter a name/title');
      return;
    }

    setSavingPost(true);

    try {
      let uploadedUrls: string[] = [];
      let videoUrl: string | null = null;
      let videoThumbnail: string | null = null;
      let videoDuration: number | null = null;
      let videoSize: number | null = null;

      for (const uri of postForm.images) {
        try {
          const response = await fetch(uri);
          const blob = await response.blob();
          const fileExt = blob.type.split('/')[1] || 'jpg';
          const fileName = `posts/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${fileExt}`;
          
          const { data, error } = await supabase.storage
            .from('catalog-images')
            .upload(fileName, blob, {
              cacheControl: '3600',
              upsert: false,
            });

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('catalog-images')
            .getPublicUrl(fileName);
          
          uploadedUrls.push(publicUrl);
          console.log('✅ Image uploaded:', publicUrl);
        } catch (error) {
          console.error('Failed to upload image:', error);
        }
      }

      if (postForm.video) {
        try {
          const result = await uploadVideoAndThumbnail(postForm.video, postForm.videoThumbnail);
          videoUrl = result.videoUrl;
          videoThumbnail = result.videoThumbnail;
          videoDuration = result.videoDuration;
          videoSize = result.videoSize;
          console.log('📹 Video URL:', videoUrl);
          console.log('📸 Thumbnail URL:', videoThumbnail);
          console.log('⏱️ Duration:', videoDuration);
          console.log('📦 Size:', videoSize);
        } catch (error) {
          console.error('Video upload failed:', error);
          Alert.alert('Error', 'Failed to upload video. Please try again.');
          setSavingPost(false);
          return;
        }
      }

      const tagsArray = postForm.tags
        .join(' ')
        .split(' ')
        .filter(tag => tag.startsWith('#'))
        .map(tag => tag.replace('#', ''));

      const insertData: any = {
        name: postForm.name.trim(),
        description: postForm.description.trim() || null,
        category: postForm.category.trim() || 'Uncategorized',
        images: uploadedUrls.length > 0 ? uploadedUrls : null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        specifications: postForm.price ? { price: parseFloat(postForm.price) } : {},
        is_active: true,
        user_id: user.id,
      };

      if (videoUrl) {
        insertData.video = videoUrl;
      }
      
      if (videoThumbnail && isValidImageUrl(videoThumbnail)) {
        insertData.video_thumbnail = videoThumbnail;
        console.log('✅ Adding valid thumbnail:', videoThumbnail);
      } else if (uploadedUrls.length > 0) {
        insertData.video_thumbnail = uploadedUrls[0];
        console.log('📸 Using first image as fallback thumbnail:', uploadedUrls[0]);
      } else {
        insertData.video_thumbnail = null;
        console.log('⚠️ No thumbnail available');
      }

      if (videoDuration !== null) {
        insertData.video_duration = Math.round(videoDuration);
        console.log('⏱️ Adding duration:', insertData.video_duration);
      }
      if (videoSize !== null) {
        insertData.video_size = videoSize;
        console.log('📦 Adding size:', insertData.video_size);
      }

      console.log('📝 Inserting post data...');

      const { data, error } = await supabase
        .from('catalog')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Insert error:', error);
        throw error;
      }

      if (data) {
        const newItem: CatalogItem = {
          id: data.id,
          name: data.name || 'Untitled',
          category: data.category || 'Uncategorized',
          subcategory: data.subcategory || null,
          brand: data.brand || null,
          description: data.description || null,
          specifications: data.specifications || {},
          images: data.images || null,
          tags: data.tags || null,
          is_active: data.is_active || null,
          created_at: data.created_at || null,
          updated_at: data.updated_at || null,
          category_id: data.category_id || null,
          user_id: data.user_id || null,
          like_count: data.like_count || 0,
          view_count: data.view_count || 0,
          price: data.price || null,
          video: data.video || null,
          video_thumbnail: data.video_thumbnail || null,
          video_duration: data.video_duration || null,
          video_size: data.video_size || null,
        };
        setCatalogItems(prev => [newItem, ...prev]);
      }

      Alert.alert('✅ Success', 'Your post has been published!');
      setShowCreatePost(false);
      setPostForm({
        name: '',
        description: '',
        category: '',
        price: '',
        images: [],
        tags: [],
        video: null,
        videoThumbnail: null,
        videoDuration: null,
        videoSize: null,
      });
      
      loadAllData();

    } catch (error: any) {
      console.error('❌ Error creating post:', error);
      Alert.alert('Error', error.message || 'Failed to create post');
    } finally {
      setSavingPost(false);
    }
  };

  // ============================================================
  // FULLSCREEN VIEW HANDLERS
  // ============================================================
  
  const handleItemPress = useCallback((item: CatalogItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedItem(item);
    setViewMode('fullscreen');
  }, []);

  const handleBackToGrid = useCallback(() => {
    setViewMode('grid');
    setSelectedItem(null);
  }, []);

  const renderFullScreenItem = useCallback((item: CatalogItem) => {
    if (!item) return null;

    const isSaved = savedItemsMap[item.id] || false;
    
    const mediaItems = [];
    const thumbnail = getValidThumbnail(item);
    const videoUrl = getVideoUrl(item);
    
    if (videoUrl) {
      mediaItems.push({ 
        type: 'video' as const, 
        url: videoUrl,
        thumbnail: thumbnail
      });
    }
    
    if (item.images && item.images.length > 0) {
      for (const img of item.images) {
        if (mediaItems.some(m => m.url === img)) continue;
        mediaItems.push({ type: 'image' as const, url: img });
      }
    }
    
    if (mediaItems.length === 0) {
      const placeholderText = encodeURIComponent(item.name || 'Post');
      mediaItems.push({ 
        type: 'image' as const, 
        url: `https://via.placeholder.com/400x400/1A2A4F/4A7DFF?text=${placeholderText.substring(0, 20)}` 
      });
    }

    let price = item.price || null;
    if (!price && item.specifications && typeof item.specifications === 'object') {
      price = item.specifications.price || item.specifications.regular_price || null;
    }

    const cardWidth = isDesktop ? 420 : width;
    const cardHeight = isDesktop ? height : height;

    return (
      <View
        style={{
          height: cardHeight,
          width: cardWidth,
          paddingVertical: 0,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <SceneRenderer
          key={item.id}
          media={mediaItems}
          title={item.name || 'Post'}
          price={price || 0}
          currency="UGX"
          userName={userProfile?.full_name || 'User'}
          userAvatar={userProfile?.avatar_url || null}
          description={item.description || null}
          rating={null}
          area={null}
          inStock={true}
          type="product"
          createdAt={item.created_at || undefined}
          isDesktop={isDesktop}
          width={cardWidth}
          height={cardHeight}
          onShowMore={() => {
            Alert.alert('📝 Post Details', item.description || 'No description available');
          }}
          onShare={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Alert.alert('🔗 Share', `Share post: ${item.name}`);
          }}
          onSave={() => {
            if (!user?.id) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const currentSaved = savedItemsMap[item.id] || false;
            const newSaved = !currentSaved;
            setSavedItemsMap(prev => ({ ...prev, [item.id]: newSaved }));
          }}
          onPrimaryAction={() => {
            navigation.navigate('Inbox', {
              userId: user?.id,
              userName: userProfile?.full_name || 'User',
            });
          }}
          onSceneChange={(index, source) => {
            if (__DEV__) {
              console.log('Scene changed to:', index, source);
            }
          }}
          onBehavioralEvent={(event) => {
            if (__DEV__) {
              console.log('Behavioral event:', event);
            }
          }}
          autoPlay={false}
          autoPlayInterval={5000}
          resetKey={item.id}
          bottomOffset={0}
        />

        <View style={styles.actionRailWrapper}>
          <FloatingActionRail
            key={`rail-${item.id}`}
            opportunity={item as any}
            onUserPress={() => {
              navigation.navigate('UserProfile', {
                userId: user?.id,
                userName: userProfile?.full_name || 'User',
              });
            }}
            onReviewsPress={() => {}}
            onDirectionsPress={() => {}}
            onSharePress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('🔗 Share', `Share post: ${item.name}`);
            }}
            onAIPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              Alert.alert('🤖 AI Assistant', `Analyzing post: ${item.name}`);
            }}
            onSavePress={() => {
              if (!user?.id) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const currentSaved = savedItemsMap[item.id] || false;
              const newSaved = !currentSaved;
              setSavedItemsMap(prev => ({ ...prev, [item.id]: newSaved }));
            }}
            isSaved={isSaved}
            savedCount={0}
            shareCount={0}
            reviewCount={0}
          />
        </View>
      </View>
    );
  }, [isDesktop, width, height, navigation, user?.id, userProfile, savedItemsMap]);

  // ============================================================
  // SETTINGS HANDLERS
  // ============================================================

  const handleSettingsPress = () => {
    setShowSettings(true);
  };

  const handleSettingsAction = (action: string) => {
    setShowSettings(false);
    switch (action) {
      case 'profile':
        setShowEditProfile(true);
        if (userProfile) {
          setEditForm({
            full_name: userProfile.full_name || '',
            phone_number: userProfile.phone_number || '',
            bio: userProfile.bio || '',
            location_city: userProfile.location_city || '',
            location_region: userProfile.location_region || '',
            location_country: userProfile.location_country || '',
          });
          setEditAvatar(null);
          setEditCover(null);
        }
        break;
      case 'help':
        navigation.navigate('HelpSupport');
        break;
      case 'wallet':
        navigation.navigate('Wallet');
        break;
      case 'logout':
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
        break;
      default:
        break;
    }
  };

  // ============================================================
  // MODAL RENDERERS
  // ============================================================

  const renderEditProfileModal = () => {
    const avatarUrl = editAvatar || userProfile?.avatar_url || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.full_name || 'User')}&background=4A7DFF&color=fff&size=200&bold=true`;
    
    const coverUrl = editCover || userProfile?.cover_url || null;

    return (
      <Modal
        visible={showEditProfile}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowEditProfile(false);
          setEditAvatar(null);
          setEditCover(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: height * 0.92 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setShowEditProfile(false);
                setEditAvatar(null);
                setEditCover(null);
              }}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={updateProfile} disabled={savingProfile}>
                <Text style={[styles.modalPost, savingProfile && styles.modalPostDisabled]}>
                  {savingProfile ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              <View style={styles.editCoverContainer}>
                {coverUrl ? (
                  <Image source={{ uri: coverUrl }} style={styles.editCoverImage} />
                ) : (
                  <View style={styles.editCoverPlaceholder}>
                    <Ionicons name="image-outline" size={40} color="#8A8AAE" />
                    <Text style={styles.editCoverPlaceholderText}>Add Cover Image</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.editCoverButton} onPress={pickCover}>
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.editAvatarContainer}>
                <TouchableOpacity style={styles.editAvatarWrapper} onPress={pickAvatar}>
                  <Image source={{ uri: avatarUrl }} style={styles.editAvatarImage} />
                  <View style={styles.editAvatarButton}>
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.editForm}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Full Name</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Your full name"
                    placeholderTextColor="#6A7A9E"
                    value={editForm.full_name}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, full_name: text }))}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="+256 700 000 000"
                    placeholderTextColor="#6A7A9E"
                    keyboardType="phone-pad"
                    value={editForm.phone_number}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, phone_number: text }))}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Bio</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea]}
                    placeholder="Tell people about yourself..."
                    placeholderTextColor="#6A7A9E"
                    multiline
                    numberOfLines={3}
                    value={editForm.bio}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, bio: text }))}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>City</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., Jinja"
                    placeholderTextColor="#6A7A9E"
                    value={editForm.location_city}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, location_city: text }))}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Region</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., Eastern Region"
                    placeholderTextColor="#6A7A9E"
                    value={editForm.location_region}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, location_region: text }))}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Country</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., Uganda"
                    placeholderTextColor="#6A7A9E"
                    value={editForm.location_country}
                    onChangeText={(text) => setEditForm(prev => ({ ...prev, location_country: text }))}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderCreatePostModal = () => (
    <Modal
      visible={showCreatePost}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setShowCreatePost(false);
        setPostForm({
          name: '',
          description: '',
          category: '',
          price: '',
          images: [],
          tags: [],
          video: null,
          videoThumbnail: null,
          videoDuration: null,
          videoSize: null,
        });
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowCreatePost(false);
              setPostForm({
                name: '',
                description: '',
                category: '',
                price: '',
                images: [],
                tags: [],
                video: null,
                videoThumbnail: null,
                videoDuration: null,
                videoSize: null,
              });
            }}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Post</Text>
            <TouchableOpacity onPress={createPost} disabled={savingPost || !postForm.name.trim()}>
              <Text style={[styles.modalPost, (savingPost || !postForm.name.trim()) && styles.modalPostDisabled]}>
                {savingPost ? 'Posting...' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.mediaSection}>
              <Text style={styles.formLabel}>Media</Text>
              <Text style={styles.formHelperText}>Select images or a video (max 5 images)</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mediaScrollContent}
              >
                {postForm.images.map((uri, index) => (
                  <View key={index} style={styles.mediaPreviewContainer}>
                    <Image source={{ uri }} style={styles.mediaPreview} />
                    <TouchableOpacity style={styles.mediaRemove} onPress={() => removePostImage(index)}>
                      <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
                {postForm.video && (
                  <View style={styles.mediaPreviewContainer}>
                    <View style={[styles.mediaPreview, styles.videoPreviewWrapper]}>
                      <Ionicons name="videocam" size={32} color="#4A7DFF" />
                      <Text style={styles.videoPreviewText}>Video</Text>
                      {postForm.videoDuration && (
                        <Text style={styles.videoDurationText}>
                          {Math.round(postForm.videoDuration)}s
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity style={styles.mediaRemove} onPress={removeVideo}>
                      <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}
                {(postForm.images.length + (postForm.video ? 1 : 0)) < 6 && (
                  <TouchableOpacity style={styles.mediaAdd} onPress={pickMedia}>
                    <Ionicons name="camera" size={32} color="#4A7DFF" />
                    <Text style={styles.mediaAddText}>Add Media</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>

            {postForm.video && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Video Thumbnail</Text>
                <Text style={styles.formHelperText}>Select a thumbnail image for your video</Text>
                <View style={styles.thumbnailContainer}>
                  {postForm.videoThumbnail ? (
                    <View style={styles.thumbnailPreviewContainer}>
                      <Image source={{ uri: postForm.videoThumbnail }} style={styles.thumbnailPreview} />
                      <TouchableOpacity style={styles.thumbnailRemove} onPress={removeThumbnail}>
                        <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.thumbnailAddButton} onPress={pickThumbnail}>
                      <Ionicons name="image-outline" size={40} color="#4A7DFF" />
                      <Text style={styles.thumbnailAddText}>Select Thumbnail</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <View style={styles.formGroup}>
              <TextInput
                style={styles.formInput}
                placeholder="Title *"
                placeholderTextColor="#8A8AAE"
                value={postForm.name}
                onChangeText={(text) => setPostForm(prev => ({ ...prev, name: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <TextInput
                style={styles.formInput}
                placeholder="Price (UGX) - Optional"
                placeholderTextColor="#8A8AAE"
                keyboardType="numeric"
                value={postForm.price}
                onChangeText={(text) => setPostForm(prev => ({ ...prev, price: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <TextInput
                style={styles.formInput}
                placeholder="Category - Optional"
                placeholderTextColor="#8A8AAE"
                value={postForm.category}
                onChangeText={(text) => setPostForm(prev => ({ ...prev, category: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="Description - Optional"
                placeholderTextColor="#8A8AAE"
                multiline
                numberOfLines={3}
                value={postForm.description}
                onChangeText={(text) => setPostForm(prev => ({ ...prev, description: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <TextInput
                style={styles.formInput}
                placeholder="#hashtags #separated #by #spaces"
                placeholderTextColor="#8A8AAE"
                value={postForm.tags.join(' ')}
                onChangeText={(text) => setPostForm(prev => ({ ...prev, tags: text.split(' ') }))}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderSettingsModal = () => {
    const settingsOptions = [
      { key: 'profile', icon: 'person-outline', label: 'Profile Settings' },
      { key: 'wallet', icon: 'wallet-outline', label: 'Wallet' },
      { key: 'help', icon: 'help-circle-outline', label: 'Help & Support' },
      { key: 'logout', icon: 'log-out-outline', label: 'Log Out', danger: true },
    ];

    return (
      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.settingsOverlay}>
          <TouchableOpacity style={styles.settingsBackdrop} activeOpacity={1} onPress={() => setShowSettings(false)} />
          <View style={styles.settingsSheet}>
            <View style={styles.settingsHandle} />
            <Text style={styles.settingsTitle}>Settings</Text>
            {settingsOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[styles.settingsOption, option.danger && styles.settingsOptionDanger]}
                onPress={() => handleSettingsAction(option.key)}
              >
                <View style={styles.settingsOptionLeft}>
                  <Ionicons name={option.icon as any} size={22} color={option.danger ? '#E74C3C' : '#FFFFFF'} />
                  <Text style={[styles.settingsOptionText, option.danger && styles.settingsOptionDangerText]}>
                    {option.label}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8A8AAE" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDesktop && styles.desktopContainer]} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A7DFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return <GuestAccountScreen navigation={navigation} />;
  }

  if (viewMode === 'fullscreen' && selectedItem) {
    const allItems = catalogItems;
    const currentIndex = allItems.findIndex(item => item.id === selectedItem.id);
    const initialIndex = currentIndex !== -1 ? currentIndex : 0;

    return (
      <View style={styles.fullscreenContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

        <TouchableOpacity style={styles.fullscreenBackButton} onPress={handleBackToGrid}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          <Text style={styles.fullscreenBackText}>Back</Text>
        </TouchableOpacity>

        <FlatList
          ref={flatListRef}
          data={allItems}
          renderItem={({ item }) => (
            <View style={{ height: height, width: width }}>
              {renderFullScreenItem(item)}
            </View>
          )}
          keyExtractor={(item, index) => `fullscreen-${item.id}-${index}`}
          pagingEnabled={!isDesktop}
          showsVerticalScrollIndicator={false}
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          initialScrollIndex={initialIndex}
          getItemLayout={(data, index) => ({
            length: height,
            offset: height * index,
            index,
          })}
          removeClippedSubviews={true}
          maxToRenderPerBatch={isDesktop ? 3 : 1}
          windowSize={isDesktop ? 5 : 2}
          scrollEventThrottle={32}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDesktop && styles.desktopContainer]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Munolink</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={handleSettingsPress}>
            <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A7DFF" />}
      >
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.profileImageContainer} 
            onPress={pickAvatar} 
            disabled={uploading} 
            activeOpacity={0.8}
          >
            <Image 
              source={{ 
                uri: userProfile?.avatar_url || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.full_name || 'User')}&background=4A7DFF&color=fff&size=200&bold=true` 
              }} 
              style={styles.profileImage} 
            />
            <View style={styles.cameraButton}>
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.username}>
            @{userProfile?.full_name?.toLowerCase().replace(/\s/g, '') || 'user'}
          </Text>

          {userProfile?.bio && (
            <Text style={styles.bioText}>{userProfile.bio}</Text>
          )}

          <StatsRow 
            following={stats.following} 
            followers={stats.followers} 
            likes={stats.likes} 
          />

          <TouchableOpacity style={styles.editProfileButton} onPress={() => setShowEditProfile(true)}>
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs - Posts, Saved, Liked */}
        <View style={styles.tabsContainer}>
          {[
            { key: 'posts', icon: 'grid-outline', label: 'Posts' },
            { key: 'saved', icon: 'bookmark-outline', label: 'Saved' },
            { key: 'liked', icon: 'heart-outline', label: 'Liked' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons name={tab.icon as any} size={22} color={activeTab === tab.key ? '#FFFFFF' : '#8A8AAE'} />
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Posts Grid */}
        {catalogItems.length === 0 ? (
          <View style={styles.emptyPosts}>
            <Ionicons name="images-outline" size={48} color="#8A8AAE" />
            <Text style={styles.emptyPostsTitle}>No posts yet</Text>
            <Text style={styles.emptyPostsSubtext}>Share your first post with the community</Text>
            <TouchableOpacity style={styles.createPostButton} onPress={() => setShowCreatePost(true)}>
              <Text style={styles.createPostButtonText}>Create Post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={catalogItems}
            renderItem={({ item }) => <GridPostItem item={item} onPress={handleItemPress} />}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.postsGrid}
          />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: 90 }]} 
        onPress={() => setShowCreatePost(true)} 
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#4A7DFF', '#6B94FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {renderCreatePostModal()}
      {renderEditProfileModal()}
      {renderSettingsModal()}
    </SafeAreaView>
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
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  desktopContainer: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIcon: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  bottomSpacer: {
    height: 20,
  },
  skeletonProfile: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  skeletonAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  skeletonName: {
    width: 120,
    height: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  skeletonStats: {
    width: 200,
    height: 40,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  skeletonBio: {
    width: 150,
    height: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  guestContainer: {
    flex: 1,
    backgroundColor: '#0D0D1A',
    paddingHorizontal: 24,
  },
  guestHeader: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  guestHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  guestContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical:  20,
  },
  guestAvatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(74, 125, 255, 0.15)',
  },
  guestTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  guestSubtitle: {
    color: '#8A8AAE',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  guestSignUpButton: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  guestSignUpGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  guestSignUpText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  guestLogInButton: {
    width: '100%',
    maxWidth: 320,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    marginBottom: 16,
  },
  guestLogInText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  guestContinueButton: {
    paddingVertical: 8,
  },
  guestContinueText: {
    color: '#8A8AAE',
    fontSize: 14,
    fontWeight: '400',
  },
  guestFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
  },
  guestFeature: {
    alignItems: 'center',
  },
  guestFeatureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  guestFeatureLabel: {
    color: '#8A8AAE',
    fontSize: 11,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    borderColor: '#0D0D1A',
  },
  username: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  bioText: {
    color: '#8A8AAE',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  editProfileButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 24,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  editProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4A7DFF',
  },
  tabLabel: {
    color: '#8A8AAE',
    fontSize: 12,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  postsGrid: {
    paddingVertical: 4,
  },
  gridPostItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 2,
    position: 'relative',
  },
  gridPostImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  gridPostPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridVideoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  gridPostOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  gridPostGradient: {
    width: '100%',
    height: '100%',
  },
  gridPostInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
  },
  gridPostTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  gridPostPrice: {
    color: '#4A7DFF',
    fontSize: 10,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginTop: 1,
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyPostsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyPostsSubtext: {
    color: '#8A8AAE',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  createPostButton: {
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
  },
  createPostButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullscreenBackButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 60,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  fullscreenBackText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  actionRailWrapper: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -150 }],
    zIndex: 50,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#4A7DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 100,
  },
  fabGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
    minHeight: height * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalCancel: {
    color: '#8A8AAE',
    fontSize: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalPost: {
    color: '#4A7DFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalPostDisabled: {
    color: '#8A8AAE',
    opacity: 0.5,
  },
  modalBody: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  formHelperText: {
    color: '#8A8AAE',
    fontSize: 11,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  mediaSection: {
    marginBottom: 16,
  },
  mediaScrollContent: {
    gap: 8,
  },
  mediaPreviewContainer: {
    position: 'relative',
  },
  mediaPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  mediaRemove: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  mediaAdd: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  mediaAddText: {
    color: '#8A8AAE',
    fontSize: 10,
  },
  videoPreviewWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 125, 255, 0.1)',
  },
  videoPreviewText: {
    color: '#4A7DFF',
    fontSize: 10,
    marginTop: 2,
  },
  videoDurationText: {
    color: '#8A8AAE',
    fontSize: 9,
    marginTop: 1,
  },
  thumbnailContainer: {
    marginTop: 4,
  },
  thumbnailPreviewContainer: {
    position: 'relative',
    width: 160,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnailPreview: {
    width: '100%',
    height: '100%',
  },
  thumbnailRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 2,
  },
  thumbnailAddButton: {
    width: 160,
    height: 90,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  thumbnailAddText: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  editCoverContainer: {
    position: 'relative',
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 40,
  },
  editCoverImage: {
    width: '100%',
    height: '100%',
  },
  editCoverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editCoverPlaceholderText: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 8,
  },
  editCoverButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(74, 125, 255, 0.85)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  editAvatarContainer: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    zIndex: 10,
  },
  editAvatarWrapper: {
    position: 'relative',
  },
  editAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#1A1A2E',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4A7DFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1A1A2E',
  },
  editForm: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  settingsOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  settingsBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  settingsSheet: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
  },
  settingsHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8A8AAE',
    alignSelf: 'center',
    marginBottom: 12,
  },
  settingsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  settingsOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingsOptionDanger: {
    borderBottomWidth: 0,
  },
  settingsOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsOptionText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  settingsOptionDangerText: {
    color: '#E74C3C',
  },
});