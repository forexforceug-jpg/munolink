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
  Platform,
  KeyboardAvoidingView,
  ActionSheetIOS,
  ViewToken,
  ViewabilityConfig,
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
import { ReviewsBottomSheet } from '../feed/components/ReviewsBottomSheet';
import { AIBottomSheet } from '../feed/components/AIBottomSheet';
import { DirectionsBottomSheet } from '../feed/components/DirectionsBottomSheet';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system/legacy';
import { Opportunity, calculateDistance } from '../../services/feed.service';
import { locationService } from '../../services/location.service';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useIsFocused } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const FULLSCREEN_VIEWABILITY_CONFIG: ViewabilityConfig = {
  itemVisiblePercentOverride: 60,
  itemVisiblePercentThreshold: 60,
  minimumViewTime: 100,
} as ViewabilityConfig;

// ============================================================
// ✅ Price type
// ============================================================
type PriceType = 'fixed' | 'negotiable' | 'free';

const PRICE_TYPE_OPTIONS: {
  key: PriceType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'fixed', label: 'Fixed', icon: 'pricetag-outline' },
  { key: 'negotiable', label: 'Negotiable', icon: 'swap-horizontal-outline' },
  { key: 'free', label: 'Free', icon: 'gift-outline' },
];

// ============================================================
// HELPERS
// ============================================================

async function uriToBlob(uri: string): Promise<Blob> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return await response.blob();
  }

  return new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error(`Failed to read URI: ${uri}`));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

async function uploadLocalFile(
  uri: string,
  destinationPath: string,
  contentType: string
): Promise<{ publicUrl: string | null; error: string | null }> {
  try {
    if (Platform.OS === 'web') {
      const blob = await uriToBlob(uri);
      if (!blob || blob.size === 0) {
        return { publicUrl: null, error: 'File is empty' };
      }
      const { error } = await supabase.storage
        .from('catalog-images')
        .upload(destinationPath, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: blob.type || contentType,
        });
      if (error) return { publicUrl: null, error: error.message };
      const {
        data: { publicUrl },
      } = supabase.storage.from('catalog-images').getPublicUrl(destinationPath);
      return { publicUrl, error: null };
    }

    const supabaseUrl =
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      'https://ffbjvrwkvnwocuyapajo.supabase.co';
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!anonKey) {
      return { publicUrl: null, error: 'Missing Supabase anon key' };
    }

    const uploadUrl = `${supabaseUrl}/storage/v1/object/catalog-images/${destinationPath}`;

    const result = await FileSystem.uploadAsync(uploadUrl, uri, {
      httpMethod: 'POST',
      uploadType: (FileSystem as any).FileSystemUploadType?.BINARY_CONTENT
        ? (FileSystem as any).FileSystemUploadType.BINARY_CONTENT
        : 0,
      headers: {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        'Content-Type': contentType,
        'x-upsert': 'false',
      },
    });

    if (result.status < 200 || result.status >= 300) {
      console.error('❌ Upload failed with status:', result.status, result.body);
      return {
        publicUrl: null,
        error: `Upload failed (HTTP ${result.status}): ${result.body}`,
      };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('catalog-images').getPublicUrl(destinationPath);

    return { publicUrl, error: null };
  } catch (err: any) {
    console.error('❌ uploadLocalFile error:', err);
    return { publicUrl: null, error: err?.message || 'Upload failed' };
  }
}

async function deleteStorageFileFromPublicUrl(
  publicUrl: string | null | undefined
) {
  if (!publicUrl) return;

  try {
    const marker = '/storage/v1/object/public/catalog-images/';
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return;

    const path = publicUrl.substring(idx + marker.length);
    const { error } = await supabase.storage
      .from('catalog-images')
      .remove([path]);
    if (error) {
      console.warn('⚠️ Storage delete failed:', path, error.message);
    } else if (__DEV__) {
      console.log('🗑️ Storage file removed:', path);
    }
  } catch (err) {
    console.warn('⚠️ Storage delete threw:', err);
  }
}

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
  latitude: number | null;
  longitude: number | null;
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
  share_count?: number | null;
  comment_count?: number | null;
  price?: number | null;
  price_type?: PriceType | null;
  video?: string | null;
  video_thumbnail?: string | null;
  video_duration?: number | null;
  video_size?: number | null;
  distance?: number;
  saveCount?: number;
  isSaved?: boolean;
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

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

const GridPostItem = ({ item, onPress, onLongPress }: any) => {
  let imageUrl = null;
  if (item.images && item.images.length > 0) {
    imageUrl = item.images[0];
  } else if (item.video_thumbnail) {
    imageUrl = item.video_thumbnail;
  } else if (item.specifications && typeof item.specifications === 'object') {
    const specThumbnail = item.specifications.video_thumbnail;
    if (specThumbnail) imageUrl = specThumbnail;
  }

  const hasVideo = !!item.video || !!item.specifications?.video;

  let price = null;
  if (item.specifications && typeof item.specifications === 'object') {
    price =
      item.specifications.price || item.specifications.regular_price || null;
  }
  if (!price && item.price) {
    price = item.price;
  }

  return (
    <TouchableOpacity
      style={styles.gridPostItem}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress?.(item)}
      delayLongPress={350}
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

      <TouchableOpacity
        style={styles.gridMenuButton}
        onPress={() => onLongPress?.(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="ellipsis-horizontal" size={16} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.gridPostOverlay} pointerEvents="none">
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gridPostGradient}
        />
        <View style={styles.gridPostInfo}>
          <Text style={styles.gridPostTitle} numberOfLines={1}>
            {item.name || 'Untitled'}
          </Text>
          {price && (
            <Text style={styles.gridPostPrice}>
              UGX {Number(price).toLocaleString()}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const GuestAccountScreen = ({ navigation }: any) => {
  return (
    <View style={styles.guestContainer}>
      <View style={styles.guestHeader}>
        <Text style={styles.guestHeaderTitle}>Account</Text>
      </View>

      <View style={styles.guestContent}>
        <View style={styles.guestAvatarContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#4A7DFF" />
        </View>

        <Text style={styles.guestTitle}>Welcome to Munolink</Text>
        <Text style={styles.guestSubtitle}>
          Create an account to follow people, save posts, and share your own
          opportunities with the community.
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
          onPress={() => navigation.navigate('SignIn')}
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
    </View>
  );
};

// ============================================================
// HELPERS
// ============================================================

const isRemoteUrl = (u: string | null | undefined): boolean =>
  !!u && (u.startsWith('http://') || u.startsWith('https://'));

const getFromSpecs = (specs: any, key: string): string | null => {
  if (!specs || typeof specs !== 'object') return null;
  const value = specs[key];
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return null;
};

const getVideoUrl = (item: CatalogItem): string | null => {
  if (item.video) return item.video;
  const specVideo = getFromSpecs(item.specifications, 'video');
  if (specVideo) return specVideo;
  return null;
};

const getPriceFromItem = (item: CatalogItem): number | null => {
  let price = item.price || null;
  if (!price && item.specifications && typeof item.specifications === 'object') {
    const specPrice =
      item.specifications.price || item.specifications.regular_price || null;
    if (specPrice !== null && specPrice !== undefined) {
      price =
        typeof specPrice === 'number'
          ? specPrice
          : parseFloat(String(specPrice));
    }
  }
  return price;
};

// ✅ Extract price_type from item, defaulting sensibly
const getPriceTypeFromItem = (item: CatalogItem): PriceType => {
  const t = item.price_type;
  if (t === 'fixed' || t === 'negotiable' || t === 'free') return t;
  // Fallback: if price is 0, treat as free
  const p = getPriceFromItem(item);
  return p === 0 || p === null ? 'free' : 'fixed';
};

function buildOpportunityFromCatalogItem(
  item: CatalogItem,
  profile: UserProfile | null,
  isSaved: boolean
): Opportunity {
  return {
    id: item.id,
    title: item.name || 'Post',
    price: getPriceFromItem(item) || 0,
    currency: 'UGX',
    imageUrl: item.images?.[0] || item.video_thumbnail || '',
    catalogImages: item.images || [],
    description: item.description || '',
    rating: null,
    reviewCount: item.comment_count || 0,
    area: profile?.location_city || null,
    userLatitude: profile?.latitude ?? null,
    userLongitude: profile?.longitude ?? null,
    userPhone: profile?.phone_number || null,
    inStock: true,
    category: item.category || null,
    type: 'product',
    createdAt: item.created_at || undefined,
    userId: profile?.id || '',
    userFullName: profile?.full_name || 'User',
    userAvatar: profile?.avatar_url || null,
    video: item.video || null,
    video_thumbnail: item.video_thumbnail || null,
    video_duration: item.video_duration ?? null,
    video_size: item.video_size ?? null,
    likeCount: item.like_count || 0,
    viewCount: item.view_count || 0,
    shareCount: item.share_count || 0,
    commentCount: item.comment_count || 0,
    saveCount: item.saveCount || 0,
    isSaved,
    distance: item.distance,
    specifications: item.specifications || {},
  };
}

const ItemMediaLoadingSpinner: React.FC = () => {
  return (
    <View style={styles.itemMediaSpinnerOverlay} pointerEvents="none">
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
};

// ============================================================
// FULLSCREEN ITEM
// ============================================================
interface FullscreenItemProps {
  item: CatalogItem;
  index: number;
  fullscreenIndex: number;
  isFocused: boolean;
  isDesktop: boolean;
  winWidth: number;
  winHeight: number;
  userProfile: UserProfile | null;
  userId: string | undefined;
  isSaved: boolean;
  isLiked: boolean;
  likeCount: number;
  isItemLoading: boolean;
  isMine: boolean;
  onShowMore: (item: CatalogItem) => void;
  onShare: () => void;
  onSave: (item: CatalogItem) => void;
  onLike: (item: CatalogItem) => void;
  onInbox: (item: CatalogItem) => void;
  onMediaLoadStateChange: (isLoading: boolean) => void;
  onUserPress: (item: CatalogItem) => void;
  onReviewsPress: (item: CatalogItem) => void;
  onDirectionsPress: (item: CatalogItem) => void;
  onAIPress: (item: CatalogItem) => void;
  onOverflowPress: (item: CatalogItem) => void;
}

const FullscreenItem: React.FC<FullscreenItemProps> = ({
  item,
  index,
  fullscreenIndex,
  isFocused,
  isDesktop,
  winWidth,
  winHeight,
  userProfile,
  userId,
  isSaved,
  isLiked,
  likeCount,
  isItemLoading,
  isMine,
  onShowMore,
  onShare,
  onSave,
  onLike,
  onInbox,
  onMediaLoadStateChange,
  onUserPress,
  onReviewsPress,
  onDirectionsPress,
  onAIPress,
  onOverflowPress,
}) => {
  const opportunity = buildOpportunityFromCatalogItem(
    item,
    userProfile,
    isSaved
  );

  const mediaItems: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }[] = [];

  const videoUrl = getVideoUrl(item);
  const thumbnail = item.video_thumbnail || item.images?.[0];

  if (videoUrl) {
    mediaItems.push({
      type: 'video',
      url: videoUrl,
      thumbnail: thumbnail || undefined,
    });
  }

  if (item.images && item.images.length > 0) {
    for (const img of item.images) {
      if (mediaItems.some((m) => m.url === img)) continue;
      mediaItems.push({ type: 'image', url: img });
    }
  }

  if (mediaItems.length === 0) {
    const placeholderText = encodeURIComponent(item.name || 'Post');
    mediaItems.push({
      type: 'image',
      url: `https://via.placeholder.com/400x400/1A2A4F/4A7DFF?text=${placeholderText.substring(
        0,
        20
      )}`,
    });
  }

  const price = getPriceFromItem(item) || 0;
  const cardWidth = isDesktop ? 420 : winWidth;
  const cardHeight = isDesktop ? winHeight : winHeight;

  const isVisible = isFocused && index === fullscreenIndex;

  return (
    <View
      style={{
        height: cardHeight,
        width: cardWidth,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <SceneRenderer
        key={item.id}
        media={mediaItems}
        title={item.name || 'Post'}
        price={price}
        currency="UGX"
        userName={userProfile?.full_name || 'User'}
        userAvatar={userProfile?.avatar_url || null}
        description={item.description || null}
        rating={null}
        area={userProfile?.location_city || null}
        inStock={true}
        type="product"
        createdAt={item.created_at || undefined}
        isDesktop={isDesktop}
        width={cardWidth}
        height={cardHeight}
        onShowMore={() => onShowMore(item)}
        onShare={onShare}
        onSave={() => onSave(item)}
        onPrimaryAction={() => onInbox(item)}
        onInboxPress={() => onInbox(item)}
        showInboxButton={true}
        onMediaLoadStateChange={onMediaLoadStateChange}
        onSceneChange={(idx, source) => {
          if (__DEV__) console.log('Scene changed:', idx, source);
        }}
        onBehavioralEvent={(event) => {
          if (__DEV__) console.log('Behavioral event:', event);
        }}
        autoPlay={true}
        autoPlayInterval={5000}
        resetKey={item.id}
        bottomOffset={0}
        isVisible={isVisible}
      />

      {isItemLoading && isVisible && <ItemMediaLoadingSpinner />}

      <View style={styles.actionRailWrapper}>
        <FloatingActionRail
          key={`rail-${item.id}`}
          opportunity={opportunity}
          isLiked={isLiked}
          likeCount={likeCount}
          onLikePress={() => onLike(item)}
          onUserPress={() => onUserPress(item)}
          onReviewsPress={() => onReviewsPress(item)}
          onDirectionsPress={() => onDirectionsPress(item)}
          onSharePress={onShare}
          onAIPress={() => onAIPress(item)}
          onSavePress={() => onSave(item)}
          isSaved={isSaved}
          savedCount={item.saveCount || 0}
          shareCount={item.share_count || 0}
          reviewCount={item.comment_count || 0}
          distance={item.distance || 0}
          userAvatar={userProfile?.avatar_url || null}
        />
      </View>

      {isMine && (
        <TouchableOpacity
          style={styles.fullscreenOverflowButton}
          onPress={() => onOverflowPress(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================================
// MAIN CONTENT
// ============================================================

const AccountContent = ({ navigation }: any) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDesktop } = useBreakpoint();
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const [showEditPost, setShowEditPost] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'fullscreen'>('grid');
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [savedItemsMap, setSavedItemsMap] = useState<Record<string, boolean>>(
    {}
  );

  // ✅ Likes
  const [likedItemsMap, setLikedItemsMap] = useState<Record<string, boolean>>(
    {}
  );
  const [likeCountMap, setLikeCountMap] = useState<Record<string, number>>({});

  const [loadingItemsMap, setLoadingItemsMap] = useState<
    Record<string, boolean>
  >({});

  const [fullscreenIndex, setFullscreenIndex] = useState(0);

  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);

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

  // ✅ Post form — now includes `priceType`
  const [postForm, setPostForm] = useState({
    name: '',
    description: '',
    price: '',
    priceType: 'fixed' as PriceType,
    images: [] as string[],
    video: null as string | null,
    videoThumbnail: null as string | null,
    videoDuration: null as number | null,
    videoSize: null as number | null,
  });
  const [savingPost, setSavingPost] = useState(false);

  const [removedImagesDuringEdit, setRemovedImagesDuringEdit] = useState<
    string[]
  >([]);
  const [removedVideoDuringEdit, setRemovedVideoDuringEdit] = useState<
    string | null
  >(null);
  const [removedThumbnailDuringEdit, setRemovedThumbnailDuringEdit] = useState<
    string | null
  >(null);

  const [stats, setStats] = useState({
    following: 0,
    followers: 0,
    likes: 0,
    joinedYear: new Date().getFullYear(),
  });

  const flatListRef = useRef<FlatList>(null);

  // ============================================================
  // FETCH
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
          latitude: userData.latitude ?? null,
          longitude: userData.longitude ?? null,
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
        latitude: null,
        longitude: null,
      } as UserProfile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, [user]);

  const fetchUserCatalog = useCallback(
    async (profile: UserProfile | null) => {
      if (!user?.id) return [];

      try {
        const { data, error } = await supabase
          .from('catalog')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const rows = data || [];

        let commentCounts: Record<string, number> = {};
        try {
          const { data: commentData, error: commentError } = await supabase
            .from('comments')
            .select('post_id')
            .in(
              'post_id',
              rows.map((r: any) => r.id)
            );
          if (!commentError && commentData) {
            commentData.forEach((c: any) => {
              commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
            });
          }
        } catch (e) {
          console.log('Comment counts unavailable');
        }

        let saveCounts: Record<string, number> = {};
        try {
          const { data: saveData, error: saveError } = await supabase
            .from('saves')
            .select('post_id')
            .in(
              'post_id',
              rows.map((r: any) => r.id)
            );
          if (!saveError && saveData) {
            saveData.forEach((s: any) => {
              saveCounts[s.post_id] = (saveCounts[s.post_id] || 0) + 1;
            });
          }
        } catch (e) {
          console.log('Save counts unavailable');
        }

        let userCoords: { latitude: number; longitude: number } | undefined;
        try {
          const loc = await locationService.getCurrentLocation();
          if (loc?.latitude != null && loc?.longitude != null) {
            userCoords = { latitude: loc.latitude, longitude: loc.longitude };
          }
        } catch {}

        return rows.map((item: any) => {
          let distance: number | undefined;
          if (
            userCoords &&
            profile?.latitude != null &&
            profile?.longitude != null
          ) {
            distance = calculateDistance(
              userCoords.latitude,
              userCoords.longitude,
              profile.latitude,
              profile.longitude
            );
          }

          return {
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
            share_count: item.share_count || 0,
            comment_count: commentCounts[item.id] || 0,
            price: item.price || null,
            // ✅ Price type from DB
            price_type: (item.price_type as PriceType) || null,
            video: item.video || null,
            video_thumbnail: item.video_thumbnail || null,
            video_duration: item.video_duration || null,
            video_size: item.video_size || null,
            distance,
            saveCount: saveCounts[item.id] || 0,
            isSaved: false,
          } as CatalogItem;
        });
      } catch (error) {
        console.error('Error fetching catalog:', error);
        return [];
      }
    },
    [user]
  );

  const fetchFollowStats = useCallback(async () => {
    if (!user?.id) return { followers: 0, following: 0 };

    try {
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      return {
        followers: followersCount || 0,
        following: followingCount || 0,
      };
    } catch (error) {
      console.error('Error fetching follow stats:', error);
      return { followers: 0, following: 0 };
    }
  }, [user?.id]);

  const fetchLikeStats = useCallback(
    async (myCatalogIds: string[]) => {
      if (!user?.id || myCatalogIds.length === 0) return 0;

      try {
        const { count, error } = await (supabase as any)
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .in('post_id', myCatalogIds);

        if (error) throw error;
        return count || 0;
      } catch (error) {
        console.error('Error fetching like stats:', error);
        return 0;
      }
    },
    [user?.id]
  );

  const loadAllData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const profile = await fetchUserProfile();

      if (profile) {
        setUserProfile(profile);
        if (profile.created_at) {
          const joinedDate = new Date(profile.created_at);
          setStats((prev) => ({
            ...prev,
            joinedYear: joinedDate.getFullYear(),
          }));
        }
      }

      const catalogData = await fetchUserCatalog(profile);
      setCatalogItems(catalogData);

      const myCatalogIds = catalogData.map((c) => c.id);

      const [followStats, totalLikes] = await Promise.all([
        fetchFollowStats(),
        fetchLikeStats(myCatalogIds),
      ]);

      setStats((prev) => ({
        ...prev,
        likes: totalLikes,
        followers: followStats.followers,
        following: followStats.following,
      }));
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    user,
    fetchUserProfile,
    fetchUserCatalog,
    fetchFollowStats,
    fetchLikeStats,
  ]);

  useEffect(() => {
    loadAllData();
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) loadAllData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (catalogItems.length === 0) return;

    setLoadingItemsMap((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const item of catalogItems) {
        if (next[item.id] === undefined) {
          next[item.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [catalogItems]);

  useEffect(() => {
    if (!user?.id) return;
    const postIds = catalogItems.map((c) => c.id);
    if (postIds.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);

        if (cancelled || error || !data) return;

        const likedIds: Record<string, boolean> = {};
        data.forEach((row: any) => {
          likedIds[row.post_id] = true;
        });
        setLikedItemsMap((prev) => ({ ...prev, ...likedIds }));
      } catch (e) {
        console.warn('Failed to prefetch likes:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, catalogItems]);

  const handleMediaLoadStateChange = useCallback(
    (itemId: string, isLoading: boolean) => {
      setLoadingItemsMap((prev) => {
        if (prev[itemId] === isLoading) return prev;
        return { ...prev, [itemId]: isLoading };
      });
    },
    []
  );

  const onRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    loadAllData();
  }, [loadAllData]);

  // ============================================================
  // PROFILE IMAGE UPLOAD
  // ============================================================

  const uploadProfileImage = async (
    uri: string,
    folder: string
  ): Promise<string> => {
    const blob = await uriToBlob(uri);

    if (!blob || blob.size === 0) {
      throw new Error('Image file is empty or unreadable');
    }

    const fileExt = (blob.type || 'image/jpeg').split('/')[1] || 'jpg';
    const fileName = `${folder}/${user?.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('catalog-images')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: blob.type || 'image/jpeg',
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from('catalog-images').getPublicUrl(fileName);

    return publicUrl;
  };

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

        if (showEditProfile) {
          setEditAvatar(asset.uri);
          return;
        }

        setUploading(true);
        try {
          const avatarUrl = await uploadProfileImage(asset.uri, 'avatars');

          const { error: updateError } = await supabase
            .from('users')
            .update({ avatar_url: avatarUrl })
            .eq('id', user?.id);

          if (updateError) throw updateError;

          setUserProfile((prev) =>
            prev ? { ...prev, avatar_url: avatarUrl } : null
          );
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

      if (error) throw error;

      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: editForm.full_name.trim() || prev.full_name,
              phone_number: editForm.phone_number.trim() || prev.phone_number,
              bio: editForm.bio.trim() || null,
              avatar_url: avatarUrl,
              cover_url: coverUrl,
              location_city: editForm.location_city.trim() || null,
              location_region: editForm.location_region.trim() || null,
              location_country: editForm.location_country.trim() || null,
            }
          : null
      );

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

  const openEditPost = useCallback((item: CatalogItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setEditingPostId(item.id);
    setRemovedImagesDuringEdit([]);
    setRemovedVideoDuringEdit(null);
    setRemovedThumbnailDuringEdit(null);

    const price = getPriceFromItem(item);
    const priceType = getPriceTypeFromItem(item);

    setPostForm({
      name: item.name || '',
      description: item.description || '',
      price: price != null && price > 0 ? String(price) : '',
      priceType,
      images: item.images || [],
      video: item.video || null,
      videoThumbnail: item.video_thumbnail || null,
      videoDuration: item.video_duration ?? null,
      videoSize: item.video_size ?? null,
    });

    setShowEditPost(true);
  }, []);

  const confirmDeletePost = useCallback(
    (item: CatalogItem) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      Alert.alert(
        'Delete Post',
        `Are you sure you want to delete "${item.name}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const filesToRemove: string[] = [
                  ...(item.images || []),
                  item.video || null,
                  item.video_thumbnail || null,
                ].filter((u): u is string => !!u && isRemoteUrl(u));

                await Promise.all(
                  filesToRemove.map((u) => deleteStorageFileFromPublicUrl(u))
                );

                const { error } = await supabase
                  .from('catalog')
                  .delete()
                  .eq('id', item.id)
                  .eq('user_id', user?.id);

                if (error) throw error;

                setCatalogItems((prev) =>
                  prev.filter((c) => c.id !== item.id)
                );

                if (selectedItem?.id === item.id) {
                  setSelectedItem(null);
                  setViewMode('grid');
                }

                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
                Alert.alert('✅ Deleted', 'Post removed successfully.');
              } catch (error: any) {
                console.error('Error deleting post:', error);
                Alert.alert(
                  'Error',
                  error?.message || 'Failed to delete post.'
                );
              }
            },
          },
        ]
      );
    },
    [user?.id, selectedItem?.id]
  );

  const showPostActions = useCallback(
    (item: CatalogItem) => {
      if (!item || !user?.id || item.user_id !== user.id) return;

      const options = ['Edit Post', 'Delete Post', 'Cancel'];
      const destructiveIndex = 1;
      const cancelIndex = 2;

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options,
            cancelButtonIndex: cancelIndex,
            destructiveButtonIndex: destructiveIndex,
            title: item.name || 'Post',
          },
          (buttonIndex) => {
            if (buttonIndex === 0) openEditPost(item);
            else if (buttonIndex === 1) confirmDeletePost(item);
          }
        );
      } else {
        Alert.alert(item.name || 'Post', 'Choose an action', [
          {
            text: 'Edit Post',
            onPress: () => openEditPost(item),
          },
          {
            text: 'Delete Post',
            style: 'destructive',
            onPress: () => confirmDeletePost(item),
          },
          { text: 'Cancel', style: 'cancel' },
        ]);
      }
    },
    [user?.id, openEditPost, confirmDeletePost]
  );

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
              }
            } catch (thumbError) {
              console.error('❌ Auto thumbnail generation failed:', thumbError);
            }
          } else {
            images.push(asset.uri);
          }
        }

        setPostForm((prev) => ({
          ...prev,
          images: [...prev.images, ...images],
          video: video,
          videoThumbnail: videoThumbnail || prev.videoThumbnail,
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
        setPostForm((prev) => ({
          ...prev,
          videoThumbnail: result.assets[0].uri,
        }));
      }
    } catch (error) {
      console.error('Thumbnail pick error:', error);
      Alert.alert('Error', 'Failed to select thumbnail');
    }
  };

  const removePostImage = (index: number) => {
    setPostForm((prev) => {
      const uri = prev.images[index];
      if (uri && isRemoteUrl(uri)) {
        setRemovedImagesDuringEdit((r) => [...r, uri]);
      }
      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      };
    });
  };

  const removeVideo = () => {
    setPostForm((prev) => {
      if (prev.video && isRemoteUrl(prev.video)) {
        setRemovedVideoDuringEdit(prev.video);
      }
      return {
        ...prev,
        video: null,
        videoDuration: null,
        videoSize: null,
      };
    });
  };

  const removeThumbnail = () => {
    setPostForm((prev) => {
      if (prev.videoThumbnail && isRemoteUrl(prev.videoThumbnail)) {
        setRemovedThumbnailDuringEdit(prev.videoThumbnail);
      }
      return { ...prev, videoThumbnail: null };
    });
  };

  const uploadVideoAndThumbnail = async (
    videoUri: string,
    thumbnailUri: string | null
  ) => {
    if (!user?.id) throw new Error('Not signed in');

    let videoExt = 'mp4';
    let mimeType = 'video/mp4';
    const uriLower = videoUri.toLowerCase();
    if (uriLower.endsWith('.mov')) {
      videoExt = 'mov';
      mimeType = 'video/quicktime';
    } else if (uriLower.endsWith('.mkv')) {
      videoExt = 'mkv';
      mimeType = 'video/x-matroska';
    } else if (uriLower.endsWith('.webm')) {
      videoExt = 'webm';
      mimeType = 'video/webm';
    } else if (uriLower.endsWith('.avi')) {
      videoExt = 'avi';
      mimeType = 'video/x-msvideo';
    }

    const videoFileName = `videos/${user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}.${videoExt}`;

    const videoResult = await uploadLocalFile(
      videoUri,
      videoFileName,
      mimeType
    );

    if (!videoResult.publicUrl) {
      throw new Error(videoResult.error || 'Video upload failed');
    }

    let videoThumbnail: string | null = null;

    if (thumbnailUri) {
      try {
        const thumbFileName = `videos/${user.id}/${Date.now()}-thumb-${Math.random()
          .toString(36)
          .slice(2, 10)}.jpg`;

        const thumbResult = await uploadLocalFile(
          thumbnailUri,
          thumbFileName,
          'image/jpeg'
        );

        if (thumbResult.publicUrl) {
          videoThumbnail = thumbResult.publicUrl;
        } else {
          console.warn('⚠️ Thumbnail upload failed:', thumbResult.error);
        }
      } catch (thumbError) {
        console.error('❌ Thumbnail upload failed (non-fatal):', thumbError);
      }
    }

    return {
      videoUrl: videoResult.publicUrl,
      videoThumbnail,
      videoDuration: postForm.videoDuration,
      videoSize: postForm.videoSize,
    };
  };

  // ============================================================
  // ✅ CREATE POST — now uses priceType
  // ============================================================
  const createPost = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in');
      return;
    }

    if (!postForm.name.trim()) {
      Alert.alert('Error', 'Please enter a name/title');
      return;
    }

    // ✅ Validate price for non-free types
    if (postForm.priceType !== 'free') {
      const priceNum = parseFloat(postForm.price);
      if (!priceNum || priceNum <= 0) {
        Alert.alert(
          'Error',
          postForm.priceType === 'negotiable'
            ? 'Please enter a starting price'
            : 'Please enter a valid price'
        );
        return;
      }
    }

    setSavingPost(true);

    try {
      const uploadedUrls: string[] = [];
      let videoUrl: string | null = null;
      let videoThumbnail: string | null = null;
      let videoDuration: number | null = null;
      let videoSize: number | null = null;

      for (const uri of postForm.images) {
        try {
          const ext = uri.toLowerCase().endsWith('.png')
            ? 'png'
            : uri.toLowerCase().endsWith('.webp')
            ? 'webp'
            : 'jpg';
          const fileName = `posts/${user.id}/${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 10)}.${ext}`;
          const contentType =
            ext === 'png'
              ? 'image/png'
              : ext === 'webp'
              ? 'image/webp'
              : 'image/jpeg';

          const result = await uploadLocalFile(uri, fileName, contentType);

          if (result.publicUrl) {
            uploadedUrls.push(result.publicUrl);
          } else {
            console.warn('⚠️ Image upload failed:', result.error);
          }
        } catch (error) {
          console.error('Failed to upload image:', error);
        }
      }

      if (postForm.video) {
        try {
          const result = await uploadVideoAndThumbnail(
            postForm.video,
            postForm.videoThumbnail
          );
          videoUrl = result.videoUrl;
          videoThumbnail = result.videoThumbnail;
          videoDuration = result.videoDuration;
          videoSize = result.videoSize;
        } catch (error: any) {
          console.error('Video upload failed:', error);
          Alert.alert(
            'Error',
            error?.message || 'Failed to upload video. Please try again.'
          );
          setSavingPost(false);
          return;
        }
      }

      // ✅ Compute final price and price_type
      const finalPrice =
        postForm.priceType === 'free' ? 0 : parseFloat(postForm.price) || 0;

      const insertData: any = {
        name: postForm.name.trim(),
        description: postForm.description.trim() || null,
        // The DB requires `category` — default to Uncategorized since
        // the field is no longer collected from the user.
        category: 'Uncategorized',
        images: uploadedUrls.length > 0 ? uploadedUrls : null,
        // ✅ Price + type
        price: finalPrice,
        price_type: postForm.priceType,
        specifications:
          postForm.priceType !== 'free'
            ? { price: finalPrice, price_type: postForm.priceType }
            : { price_type: 'free' },
        is_active: true,
        user_id: user.id,
      };

      if (videoUrl) insertData.video = videoUrl;

      if (isRemoteUrl(videoThumbnail)) {
        insertData.video_thumbnail = videoThumbnail;
      } else if (uploadedUrls.length > 0) {
        insertData.video_thumbnail = uploadedUrls[0];
      } else {
        insertData.video_thumbnail = null;
      }

      if (videoDuration !== null) {
        insertData.video_duration = Math.round(videoDuration);
      }
      if (videoSize !== null) {
        insertData.video_size = videoSize;
      }

      const { data, error } = await supabase
        .from('catalog')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

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
          share_count: data.share_count || 0,
          comment_count: 0,
          price: data.price || null,
          price_type: (data.price_type as PriceType) || postForm.priceType,
          video: data.video || null,
          video_thumbnail: data.video_thumbnail || null,
          video_duration: data.video_duration || null,
          video_size: data.video_size || null,
          distance: undefined,
          saveCount: 0,
          isSaved: false,
        };
        setCatalogItems((prev) => [newItem, ...prev]);
      }

      Alert.alert('✅ Success', 'Your post has been published!');
      setShowCreatePost(false);
      resetPostForm();
      loadAllData();
    } catch (error: any) {
      console.error('❌ Error creating post:', error);
      Alert.alert('Error', error.message || 'Failed to create post');
    } finally {
      setSavingPost(false);
    }
  };

  // ============================================================
  // ✅ UPDATE POST — now uses priceType
  // ============================================================
  const updatePost = async () => {
    if (!user?.id || !editingPostId) {
      Alert.alert('Error', 'Missing post to update');
      return;
    }

    if (!postForm.name.trim()) {
      Alert.alert('Error', 'Please enter a name/title');
      return;
    }

    if (postForm.priceType !== 'free') {
      const priceNum = parseFloat(postForm.price);
      if (!priceNum || priceNum <= 0) {
        Alert.alert(
          'Error',
          postForm.priceType === 'negotiable'
            ? 'Please enter a starting price'
            : 'Please enter a valid price'
        );
        return;
      }
    }

    setSavingPost(true);

    try {
      const finalImages: string[] = [];
      for (const uri of postForm.images) {
        if (isRemoteUrl(uri)) {
          finalImages.push(uri);
        } else {
          try {
            const ext = uri.toLowerCase().endsWith('.png')
              ? 'png'
              : uri.toLowerCase().endsWith('.webp')
              ? 'webp'
              : 'jpg';
            const fileName = `posts/${user.id}/${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 10)}.${ext}`;
            const contentType =
              ext === 'png'
                ? 'image/png'
                : ext === 'webp'
                ? 'image/webp'
                : 'image/jpeg';

            const result = await uploadLocalFile(uri, fileName, contentType);
            if (result.publicUrl) {
              finalImages.push(result.publicUrl);
            }
          } catch (err) {
            console.error('Failed to upload image during edit:', err);
          }
        }
      }

      let videoUrl: string | null = null;
      let videoThumbnail: string | null = null;
      let videoDuration: number | null = null;
      let videoSize: number | null = null;

      if (postForm.video) {
        if (isRemoteUrl(postForm.video)) {
          videoUrl = postForm.video;
          videoThumbnail = isRemoteUrl(postForm.videoThumbnail)
            ? postForm.videoThumbnail
            : postForm.videoThumbnail || null;
          videoDuration = postForm.videoDuration;
          videoSize = postForm.videoSize;
        } else {
          try {
            const result = await uploadVideoAndThumbnail(
              postForm.video,
              postForm.videoThumbnail
            );
            videoUrl = result.videoUrl;
            videoThumbnail = result.videoThumbnail;
            videoDuration = result.videoDuration;
            videoSize = result.videoSize;
          } catch (err: any) {
            Alert.alert(
              'Error',
              err?.message || 'Failed to upload new video.'
            );
            setSavingPost(false);
            return;
          }
        }
      }

      const finalPrice =
        postForm.priceType === 'free' ? 0 : parseFloat(postForm.price) || 0;

      const updateData: any = {
        name: postForm.name.trim(),
        description: postForm.description.trim() || null,
        images: finalImages.length > 0 ? finalImages : null,
        // ✅ Price + type
        price: finalPrice,
        price_type: postForm.priceType,
        specifications:
          postForm.priceType !== 'free'
            ? { price: finalPrice, price_type: postForm.priceType }
            : { price_type: 'free' },
        video: videoUrl,
        video_thumbnail: isRemoteUrl(videoThumbnail) ? videoThumbnail : null,
        video_duration:
          videoDuration !== null ? Math.round(videoDuration) : null,
        video_size: videoSize,
      };

      const { data, error } = await supabase
        .from('catalog')
        .update(updateData)
        .eq('id', editingPostId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const deletions: string[] = [
        ...removedImagesDuringEdit,
        removedVideoDuringEdit,
        removedThumbnailDuringEdit,
      ].filter((u): u is string => !!u && isRemoteUrl(u));

      if (deletions.length > 0) {
        Promise.all(
          deletions.map((u) => deleteStorageFileFromPublicUrl(u))
        ).catch(() => {});
      }

      if (data) {
        setCatalogItems((prev) =>
          prev.map((c) =>
            c.id === editingPostId
              ? {
                  ...c,
                  name: data.name || c.name,
                  description: data.description || null,
                  images: data.images || null,
                  specifications: data.specifications || {},
                  price: data.price || null,
                  price_type:
                    (data.price_type as PriceType) || postForm.priceType,
                  video: data.video || null,
                  video_thumbnail: data.video_thumbnail || null,
                  video_duration: data.video_duration || null,
                  video_size: data.video_size || null,
                  updated_at: data.updated_at || c.updated_at,
                }
              : c
          )
        );
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Success', 'Post updated successfully!');

      setShowEditPost(false);
      setEditingPostId(null);
      resetPostForm();
      loadAllData();
    } catch (error: any) {
      console.error('❌ Error updating post:', error);
      Alert.alert('Error', error.message || 'Failed to update post');
    } finally {
      setSavingPost(false);
    }
  };

  const resetPostForm = () => {
    setPostForm({
      name: '',
      description: '',
      price: '',
      priceType: 'fixed',
      images: [],
      video: null,
      videoThumbnail: null,
      videoDuration: null,
      videoSize: null,
    });
    setRemovedImagesDuringEdit([]);
    setRemovedVideoDuringEdit(null);
    setRemovedThumbnailDuringEdit(null);
  };

  const handleItemPress = useCallback(
    (item: CatalogItem) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const idx = catalogItems.findIndex((c) => c.id === item.id);
      setSelectedItem(item);
      setFullscreenIndex(idx >= 0 ? idx : 0);
      setViewMode('fullscreen');
    },
    [catalogItems]
  );

  const handleBackToGrid = useCallback(() => {
    setViewMode('grid');
    setSelectedItem(null);
    setFullscreenIndex(0);
  }, []);

  const handleCloseAI = useCallback(() => {
    setShowAIModal(false);
    setSelectedOpportunity(null);
  }, []);
  const handleCloseDirections = useCallback(() => {
    setShowDirectionsModal(false);
    setSelectedOpportunity(null);
  }, []);
  const handleCloseReviews = useCallback(() => {
    setShowReviewsModal(false);
    setSelectedOpportunity(null);
  }, []);

  const handleLikePress = useCallback(
    async (opportunity: Opportunity) => {
      if (!user?.id) return;

      const currentlyLiked = likedItemsMap[opportunity.id] || false;
      const nextLiked = !currentlyLiked;

      setLikedItemsMap((prev) => ({ ...prev, [opportunity.id]: nextLiked }));
      setLikeCountMap((prev) => {
        const current = prev[opportunity.id] ?? opportunity.likeCount ?? 0;
        return {
          ...prev,
          [opportunity.id]: Math.max(0, current + (nextLiked ? 1 : -1)),
        };
      });

      try {
        if (nextLiked) {
          const { error } = await (supabase as any)
            .from('likes')
            .insert({ user_id: user.id, post_id: opportunity.id });
          if (error && (error as any).code !== '23505') throw error;
        } else {
          const { error } = await (supabase as any)
            .from('likes')
            .delete()
            .eq('user_id', user.id)
            .eq('post_id', opportunity.id);
          if (error) throw error;
        }

        loadAllData();
      } catch (err) {
        console.error('Like toggle failed:', err);
        setLikedItemsMap((prev) => ({
          ...prev,
          [opportunity.id]: currentlyLiked,
        }));
        setLikeCountMap((prev) => {
          const current = prev[opportunity.id] ?? opportunity.likeCount ?? 0;
          return {
            ...prev,
            [opportunity.id]: Math.max(
              0,
              current + (currentlyLiked ? 1 : -1)
            ),
          };
        });
      }
    },
    [user?.id, likedItemsMap, loadAllData]
  );

  const onViewableItemsChangedRef = useRef<
    | ((info: {
        viewableItems: ViewToken<CatalogItem>[];
        changed: ViewToken<CatalogItem>[];
      }) => void)
    | null
  >(null);

  onViewableItemsChangedRef.current = (info) => {
    const { viewableItems } = info;
    if (!viewableItems || viewableItems.length === 0) return;

    const firstItem = viewableItems[0];
    const idx = firstItem.index;
    if (idx == null) return;
    if (idx === fullscreenIndex) return;
    setFullscreenIndex(idx);
  };

  const handleFullscreenViewableItemsChanged = useRef(
    (info: {
      viewableItems: ViewToken<CatalogItem>[];
      changed: ViewToken<CatalogItem>[];
    }) => {
      onViewableItemsChangedRef.current?.(info);
    }
  ).current;

  const handleSettingsPress = () => setShowSettings(true);

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
        navigation.navigate('Pay');
        break;
      case 'logout':
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
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
            },
          },
        ]);
        break;
    }
  };

  const renderEditProfileModal = () => {
    const avatarUrl =
      editAvatar ||
      userProfile?.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        userProfile?.full_name || 'User'
      )}&background=4A7DFF&color=fff&size=200&bold=true`;

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
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[styles.modalContent, { height: height * 0.92 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowEditProfile(false);
                  setEditAvatar(null);
                  setEditCover(null);
                }}
              >
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={updateProfile} disabled={savingProfile}>
                <Text
                  style={[
                    styles.modalPost,
                    savingProfile && styles.modalPostDisabled,
                  ]}
                >
                  {savingProfile ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalBodyContent}
            >
              <View style={styles.editCoverContainer}>
                {coverUrl ? (
                  <Image
                    source={{ uri: coverUrl }}
                    style={styles.editCoverImage}
                  />
                ) : (
                  <View style={styles.editCoverPlaceholder}>
                    <Ionicons name="image-outline" size={40} color="#8A8AAE" />
                    <Text style={styles.editCoverPlaceholderText}>
                      Add Cover Image
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.editCoverButton}
                  onPress={pickCover}
                >
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.editAvatarContainer}>
                <TouchableOpacity
                  style={styles.editAvatarWrapper}
                  onPress={pickAvatar}
                >
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.editAvatarImage}
                  />
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
                    onChangeText={(text) =>
                      setEditForm((prev) => ({ ...prev, full_name: text }))
                    }
                    returnKeyType="next"
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
                    onChangeText={(text) =>
                      setEditForm((prev) => ({ ...prev, phone_number: text }))
                    }
                    returnKeyType="next"
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
                    onChangeText={(text) =>
                      setEditForm((prev) => ({ ...prev, bio: text }))
                    }
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>City</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., Jinja"
                    placeholderTextColor="#6A7A9E"
                    value={editForm.location_city}
                    onChangeText={(text) =>
                      setEditForm((prev) => ({ ...prev, location_city: text }))
                    }
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Region</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., Eastern Region"
                    placeholderTextColor="#6A7A9E"
                    value={editForm.location_region}
                    onChangeText={(text) =>
                      setEditForm((prev) => ({
                        ...prev,
                        location_region: text,
                      }))
                    }
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Country</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., Uganda"
                    placeholderTextColor="#6A7A9E"
                    value={editForm.location_country}
                    onChangeText={(text) =>
                      setEditForm((prev) => ({
                        ...prev,
                        location_country: text,
                      }))
                    }
                    returnKeyType="done"
                  />
                </View>

                <View style={{ height: 60 }} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // ============================================================
  // ✅ POST FORM MODAL — with Price Type selector
  // ============================================================
  const renderPostFormModal = (
    visible: boolean,
    isEdit: boolean,
    onClose: () => void,
    onSubmit: () => void
  ) => {
    const isFree = postForm.priceType === 'free';

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {isEdit ? 'Edit Post' : 'Create Post'}
              </Text>
              <TouchableOpacity
                onPress={onSubmit}
                disabled={savingPost || !postForm.name.trim()}
              >
                <Text
                  style={[
                    styles.modalPost,
                    (savingPost || !postForm.name.trim()) &&
                      styles.modalPostDisabled,
                  ]}
                >
                  {savingPost
                    ? isEdit
                      ? 'Saving...'
                      : 'Posting...'
                    : isEdit
                    ? 'Save'
                    : 'Post'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalBodyContent}
            >
              {/* ---------- MEDIA ---------- */}
              <View style={styles.mediaSection}>
                <Text style={styles.formLabel}>Media</Text>
                <Text style={styles.formHelperText}>
                  Select images or a video (max 5 images)
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.mediaScrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {postForm.images.map((uri, index) => (
                    <View
                      key={`${uri}-${index}`}
                      style={styles.mediaPreviewContainer}
                    >
                      <Image source={{ uri }} style={styles.mediaPreview} />
                      <TouchableOpacity
                        style={styles.mediaRemove}
                        onPress={() => removePostImage(index)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#FFFFFF"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {postForm.video && (
                    <View style={styles.mediaPreviewContainer}>
                      <View
                        style={[styles.mediaPreview, styles.videoPreviewWrapper]}
                      >
                        <Ionicons name="videocam" size={32} color="#4A7DFF" />
                        <Text style={styles.videoPreviewText}>Video</Text>
                        {postForm.videoDuration && (
                          <Text style={styles.videoDurationText}>
                            {Math.round(postForm.videoDuration)}s
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.mediaRemove}
                        onPress={removeVideo}
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#FFFFFF"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                  {postForm.images.length + (postForm.video ? 1 : 0) < 6 && (
                    <TouchableOpacity
                      style={styles.mediaAdd}
                      onPress={pickMedia}
                    >
                      <Ionicons name="camera" size={32} color="#4A7DFF" />
                      <Text style={styles.mediaAddText}>Add Media</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>

              {/* ---------- VIDEO THUMBNAIL ---------- */}
              {postForm.video && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Video Thumbnail</Text>
                  <Text style={styles.formHelperText}>
                    Select a thumbnail image for your video
                  </Text>
                  <View style={styles.thumbnailContainer}>
                    {postForm.videoThumbnail ? (
                      <View style={styles.thumbnailPreviewContainer}>
                        <Image
                          source={{ uri: postForm.videoThumbnail }}
                          style={styles.thumbnailPreview}
                        />
                        <TouchableOpacity
                          style={styles.thumbnailRemove}
                          onPress={removeThumbnail}
                        >
                          <Ionicons
                            name="close-circle"
                            size={24}
                            color="#FFFFFF"
                          />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.thumbnailAddButton}
                        onPress={pickThumbnail}
                      >
                        <Ionicons
                          name="image-outline"
                          size={40}
                          color="#4A7DFF"
                        />
                        <Text style={styles.thumbnailAddText}>
                          Select Thumbnail
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {/* ---------- TITLE ---------- */}
              <View style={styles.formGroup}>
                <TextInput
                  style={styles.formInput}
                  placeholder="Title *"
                  placeholderTextColor="#8A8AAE"
                  value={postForm.name}
                  onChangeText={(text) =>
                    setPostForm((prev) => ({ ...prev, name: text }))
                  }
                  returnKeyType="next"
                />
              </View>

              {/* ---------- PRICE TYPE ---------- */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Price Type</Text>
                <Text style={styles.formHelperText}>
                  Choose how you want to price this post
                </Text>

                <View style={styles.priceTypeRow}>
                  {PRICE_TYPE_OPTIONS.map((opt) => {
                    const selected = postForm.priceType === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        style={[
                          styles.priceTypeChip,
                          selected && styles.priceTypeChipActive,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light
                          );
                          setPostForm((prev) => ({
                            ...prev,
                            priceType: opt.key,
                            // Free → wipe the price
                            price: opt.key === 'free' ? '' : prev.price,
                          }));
                        }}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name={opt.icon}
                          size={16}
                          color={selected ? '#4A7DFF' : '#8A8AAE'}
                        />
                        <Text
                          style={[
                            styles.priceTypeChipText,
                            selected && styles.priceTypeChipTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* ---------- PRICE ---------- */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {postForm.priceType === 'negotiable'
                    ? 'Starting Price (UGX) *'
                    : 'Price (UGX) *'}
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    isFree && styles.formInputDisabled,
                  ]}
                  placeholder={
                    isFree
                      ? 'Free — no price needed'
                      : postForm.priceType === 'negotiable'
                      ? 'Enter a starting price'
                      : 'Enter your price'
                  }
                  placeholderTextColor="#8A8AAE"
                  keyboardType="numeric"
                  editable={!isFree}
                  value={isFree ? '' : postForm.price}
                  onChangeText={(text) =>
                    setPostForm((prev) => ({ ...prev, price: text }))
                  }
                  returnKeyType="next"
                />
              </View>

              {/* ---------- DESCRIPTION ---------- */}
              <View style={styles.formGroup}>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Description - Optional"
                  placeholderTextColor="#8A8AAE"
                  multiline
                  numberOfLines={3}
                  value={postForm.description}
                  onChangeText={(text) =>
                    setPostForm((prev) => ({ ...prev, description: text }))
                  }
                />
              </View>

              <View style={{ height: 60 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

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
          <TouchableOpacity
            style={styles.settingsBackdrop}
            activeOpacity={1}
            onPress={() => setShowSettings(false)}
          />
          <View style={styles.settingsSheet}>
            <View style={styles.settingsHandle} />
            <Text style={styles.settingsTitle}>Settings</Text>
            {settingsOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.settingsOption,
                  option.danger && styles.settingsOptionDanger,
                ]}
                onPress={() => handleSettingsAction(option.key)}
              >
                <View style={styles.settingsOptionLeft}>
                  <Ionicons
                    name={option.icon as any}
                    size={22}
                    color={option.danger ? '#E74C3C' : '#FFFFFF'}
                  />
                  <Text
                    style={[
                      styles.settingsOptionText,
                      option.danger && styles.settingsOptionDangerText,
                    ]}
                  >
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

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, isDesktop && styles.desktopContainer]}
        edges={['top']}
      >
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
    const currentIndex = allItems.findIndex((i) => i.id === selectedItem.id);
    const initialIndex = currentIndex !== -1 ? currentIndex : 0;

    return (
      <GestureHandlerRootView style={styles.fullscreenContainer}>
        <BottomSheetModalProvider>
          <View style={styles.fullscreenContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

            <TouchableOpacity
              style={styles.fullscreenBackButton}
              onPress={handleBackToGrid}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              <Text style={styles.fullscreenBackText}>Back</Text>
            </TouchableOpacity>

            <FlatList
              ref={flatListRef}
              data={allItems}
              renderItem={({ item, index }) => (
                <View style={{ height: height, width: width }}>
                  <FullscreenItem
                    item={item}
                    index={index}
                    fullscreenIndex={fullscreenIndex}
                    isFocused={isFocused}
                    isDesktop={isDesktop}
                    winWidth={width}
                    winHeight={height}
                    userProfile={userProfile}
                    userId={user?.id}
                    isSaved={savedItemsMap[item.id] || false}
                    isLiked={likedItemsMap[item.id] || false}
                    likeCount={likeCountMap[item.id] ?? item.like_count ?? 0}
                    isItemLoading={loadingItemsMap[item.id] === true}
                    isMine={item.user_id === user?.id}
                    onShowMore={(p) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedOpportunity(
                        buildOpportunityFromCatalogItem(p, userProfile, false)
                      );
                      setShowAIModal(true);
                    }}
                    onShare={() =>
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    }
                    onSave={(p) => {
                      if (!user?.id) return;
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSavedItemsMap((prev) => ({
                        ...prev,
                        [p.id]: !(prev[p.id] ?? p.isSaved ?? false),
                      }));
                    }}
                    onLike={(p) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleLikePress(
                        buildOpportunityFromCatalogItem(p, userProfile, false)
                      );
                    }}
                    onInbox={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      navigation.navigate('Inbox', {
                        userId: user?.id,
                        userName: userProfile?.full_name || 'User',
                      });
                    }}
                    onMediaLoadStateChange={(isLoading) =>
                      handleMediaLoadStateChange(item.id, isLoading)
                    }
                    onUserPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      navigation.navigate('UserProfile', {
                        userId: user?.id,
                        userName: userProfile?.full_name || 'User',
                      });
                    }}
                    onReviewsPress={(p) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedOpportunity(
                        buildOpportunityFromCatalogItem(p, userProfile, false)
                      );
                      setShowReviewsModal(true);
                    }}
                    onDirectionsPress={(p) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedOpportunity(
                        buildOpportunityFromCatalogItem(p, userProfile, false)
                      );
                      setShowDirectionsModal(true);
                    }}
                    onAIPress={(p) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      setSelectedOpportunity(
                        buildOpportunityFromCatalogItem(p, userProfile, false)
                      );
                      setShowAIModal(true);
                    }}
                    onOverflowPress={(p) => showPostActions(p)}
                  />
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
              viewabilityConfig={FULLSCREEN_VIEWABILITY_CONFIG}
              onViewableItemsChanged={handleFullscreenViewableItemsChanged}
              extraData={`${fullscreenIndex}-${isFocused}-${Object.keys(
                loadingItemsMap
              )
                .map((k) => `${k}:${loadingItemsMap[k] ? 1 : 0}`)
                .join(',')}`}
              removeClippedSubviews={false}
              maxToRenderPerBatch={isDesktop ? 3 : 2}
              windowSize={isDesktop ? 5 : 3}
              scrollEventThrottle={16}
            />

            <ReviewsBottomSheet
              visible={showReviewsModal}
              productId={selectedOpportunity?.id || ''}
              productTitle={selectedOpportunity?.title || ''}
              onClose={handleCloseReviews}
            />

            <AIBottomSheet
              visible={showAIModal}
              opportunity={selectedOpportunity}
              contextHint={
                selectedOpportunity
                  ? `My post: ${selectedOpportunity.title}`
                  : ''
              }
              onClose={handleCloseAI}
              isDesktopView={isDesktop}
            />

            <DirectionsBottomSheet
              visible={showDirectionsModal}
              opportunity={selectedOpportunity}
              onClose={handleCloseDirections}
              isDesktopView={isDesktop}
            />
          </View>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, isDesktop && styles.desktopContainer]}
      edges={['top']}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={handleSettingsPress}
          >
            <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4A7DFF"
          />
        }
        keyboardShouldPersistTaps="handled"
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
                uri:
                  userProfile?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    userProfile?.full_name || 'User'
                  )}&background=4A7DFF&color=fff&size=200&bold=true`,
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
            @
            {userProfile?.full_name?.toLowerCase().replace(/\s/g, '') || 'user'}
          </Text>

          {userProfile?.bio && (
            <Text style={styles.bioText}>{userProfile.bio}</Text>
          )}

          <StatsRow
            following={stats.following}
            followers={stats.followers}
            likes={stats.likes}
          />

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => setShowEditProfile(true)}
          >
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

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
              <Ionicons
                name={tab.icon as any}
                size={22}
                color={activeTab === tab.key ? '#FFFFFF' : '#8A8AAE'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.key && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {catalogItems.length === 0 ? (
          <View style={styles.emptyPosts}>
            <Ionicons name="images-outline" size={48} color="#8A8AAE" />
            <Text style={styles.emptyPostsTitle}>No posts yet</Text>
            <Text style={styles.emptyPostsSubtext}>
              Share your first post with the community
            </Text>
            <TouchableOpacity
              style={styles.createPostButton}
              onPress={() => {
                resetPostForm();
                setShowCreatePost(true);
              }}
            >
              <Text style={styles.createPostButtonText}>Create Post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={catalogItems}
            renderItem={({ item }) => (
              <GridPostItem
                item={item}
                onPress={handleItemPress}
                onLongPress={showPostActions}
              />
            )}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.postsGrid}
          />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { bottom: 90 }]}
        onPress={() => {
          resetPostForm();
          setShowCreatePost(true);
        }}
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

      {renderPostFormModal(
        showCreatePost,
        false,
        () => {
          setShowCreatePost(false);
          resetPostForm();
        },
        createPost
      )}

      {renderPostFormModal(
        showEditPost,
        true,
        () => {
          setShowEditPost(false);
          setEditingPostId(null);
          resetPostForm();
        },
        updatePost
      )}

      {renderEditProfileModal()}
      {renderSettingsModal()}
    </SafeAreaView>
  );
};

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
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  desktopContainer: { padding: 24 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#8A8AAE', fontSize: 14, marginTop: 12 },

  itemMediaSpinnerOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  headerRight: { flexDirection: 'row', gap: 12 },
  headerIcon: { padding: 4 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
  bottomSpacer: { height: 20 },

  guestContainer: { flex: 1, backgroundColor: '#0D0D1A', paddingHorizontal: 24 },
  guestHeader: { paddingTop: 12, paddingBottom: 8 },
  guestHeaderTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  guestContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
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
  guestSignUpGradient: { paddingVertical: 14, alignItems: 'center' },
  guestSignUpText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
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
  guestLogInText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  guestContinueButton: { paddingVertical: 8 },
  guestContinueText: { color: '#8A8AAE', fontSize: 14, fontWeight: '400' },

  profileHeader: { alignItems: 'center', paddingTop: 8, paddingBottom: 16 },
  profileImageContainer: { position: 'relative', marginBottom: 12 },
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
  statItem: { alignItems: 'center' },
  statNumber: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  statLabel: { color: '#8A8AAE', fontSize: 12 },
  editProfileButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 24,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  editProfileButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
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
  tabActive: { borderBottomColor: '#4A7DFF' },
  tabLabel: { color: '#8A8AAE', fontSize: 12, fontWeight: '500' },
  tabLabelActive: { color: '#FFFFFF' },
  postsGrid: { paddingVertical: 4 },
  gridPostItem: { flex: 1 / 3, aspectRatio: 1, padding: 2, position: 'relative' },
  gridPostImage: { width: '100%', height: '100%', borderRadius: 4 },
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
    right: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  gridMenuButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  gridPostOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  gridPostGradient: { width: '100%', height: '100%' },
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
  emptyPosts: { alignItems: 'center', paddingVertical: 60 },
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
  createPostButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  fullscreenContainer: { flex: 1, backgroundColor: '#000000' },
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
  fullscreenBackText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
  fullscreenOverflowButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 60,
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
  modalCancel: { color: '#8A8AAE', fontSize: 16 },
  modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  modalPost: { color: '#4A7DFF', fontSize: 16, fontWeight: '600' },
  modalPostDisabled: { color: '#8A8AAE', opacity: 0.5 },
  modalBody: { padding: 16 },
  modalBodyContent: { paddingBottom: 60 },
  formGroup: { marginBottom: 14 },
  formLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '500', marginBottom: 4 },
  formHelperText: { color: '#8A8AAE', fontSize: 11, marginBottom: 6 },
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
  formInputDisabled: {
    opacity: 0.5,
  },
  formTextArea: { height: 80, textAlignVertical: 'top' },

  // ✅ Price type chips
  priceTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  priceTypeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  priceTypeChipActive: {
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
    borderColor: '#4A7DFF',
  },
  priceTypeChipText: {
    color: '#8A8AAE',
    fontSize: 12,
    fontWeight: '500',
  },
  priceTypeChipTextActive: {
    color: '#4A7DFF',
    fontWeight: '600',
  },

  mediaSection: { marginBottom: 16 },
  mediaScrollContent: { gap: 8 },
  mediaPreviewContainer: { position: 'relative' },
  mediaPreview: { width: 80, height: 80, borderRadius: 8 },
  mediaRemove: { position: 'absolute', top: -4, right: -4 },
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
  mediaAddText: { color: '#8A8AAE', fontSize: 10 },
  videoPreviewWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 125, 255, 0.1)',
  },
  videoPreviewText: { color: '#4A7DFF', fontSize: 10, marginTop: 2 },
  videoDurationText: { color: '#8A8AAE', fontSize: 9, marginTop: 1 },
  thumbnailContainer: { marginTop: 4 },
  thumbnailPreviewContainer: {
    position: 'relative',
    width: 160,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnailPreview: { width: '100%', height: '100%' },
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
  thumbnailAddText: { color: '#8A8AAE', fontSize: 12 },
  editCoverContainer: {
    position: 'relative',
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 40,
  },
  editCoverImage: { width: '100%', height: '100%' },
  editCoverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editCoverPlaceholderText: { color: '#8A8AAE', fontSize: 14, marginTop: 8 },
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
  editAvatarWrapper: { position: 'relative' },
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
  settingsOverlay: { flex: 1, justifyContent: 'flex-end' },
  settingsBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
  settingsOptionDanger: { borderBottomWidth: 0 },
  settingsOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsOptionText: { color: '#FFFFFF', fontSize: 15 },
  settingsOptionDangerText: { color: '#E74C3C' },
});