// src/features/profile/UserProfileScreen.tsx

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
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
  RefreshControl,
  FlatList,
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
import { StyledAlert } from '../feed/components/StyledAlert';
import * as Haptics from 'expo-haptics';
import { Opportunity, calculateDistance } from '../../services/feed.service';
import { locationService } from '../../services/location.service';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useIsFocused } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
// ============================================================
// MODULE-LEVEL VIEWABILITY CONFIG
// ============================================================
const FULLSCREEN_VIEWABILITY_CONFIG: ViewabilityConfig = {
  itemVisiblePercentThreshold: 60,
  minimumViewTime: 100,
};

// ============================================================
// TYPES
// ============================================================

interface UserProfileData {
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
  posts_count?: number;
  followers_count?: number;
  following_count?: number;
  likes_count?: number;
  is_following?: boolean;
}

interface UserPost {
  id: string;
  name: string;
  category: string;
  description: string | null;
  images: string[] | null;
  video: string | null;
  video_thumbnail: string | null;
  price: number | null;
  like_count: number;
  view_count: number;
  share_count: number;
  comment_count: number;
  created_at: string | null;
  specifications?: any;
  distance?: number;
  saveCount?: number;
  isSaved?: boolean;
  price_type?: string | null;
}

interface UserProfileScreenProps {
  route: any;
  navigation: any;
}

// ============================================================
// HELPERS
// ============================================================

function isSpecificationsObject(specs: any): specs is { [key: string]: any } {
  return specs && typeof specs === 'object' && !Array.isArray(specs);
}

function extractPriceFromSpecifications(post: any): number {
  let price = post.price || 0;
  const specs = post.specifications || {};

  if (price === 0 && isSpecificationsObject(specs)) {
    const specPrice = specs.price || specs.regular_price || null;
    if (specPrice !== null && specPrice !== undefined) {
      const parsedPrice =
        typeof specPrice === 'number'
          ? specPrice
          : parseFloat(String(specPrice));
      if (!isNaN(parsedPrice)) price = parsedPrice;
    }
  }
  return price;
}

function extractPriceType(post: any): string | null {
  if (typeof post?.price_type === 'string' && post.price_type.length > 0) {
    return post.price_type;
  }
  const specs = post?.specifications;
  if (isSpecificationsObject(specs)) {
    if (typeof specs.price_type === 'string' && specs.price_type.length > 0) {
      return specs.price_type;
    }
  }
  return null;
}

// ============================================================
// STATS ROW — Posts replaced with Likes
// ============================================================
const StatsRow = ({ likes, followers, following, onStatPress }: any) => (
  <View style={styles.statsRow}>
    <TouchableOpacity
      style={styles.statItem}
      onPress={() => onStatPress('likes')}
    >
      <Text style={styles.statNumber}>{likes || 0}</Text>
      <Text style={styles.statLabel}>Likes</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.statItem}
      onPress={() => onStatPress('followers')}
    >
      <Text style={styles.statNumber}>{followers || 0}</Text>
      <Text style={styles.statLabel}>Followers</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.statItem}
      onPress={() => onStatPress('following')}
    >
      <Text style={styles.statNumber}>{following || 0}</Text>
      <Text style={styles.statLabel}>Following</Text>
    </TouchableOpacity>
  </View>
);

// ============================================================
// GRID POST ITEM
// ============================================================
const GridPostItem = ({ item, onPress, userName }: any) => {
  const imageUrl =
    item.images && item.images.length > 0
      ? item.images[0]
      : item.video_thumbnail || null;
  const hasVideo = !!item.video;
  const displayName = userName || 'User';

  const price = extractPriceFromSpecifications(item);
  const priceType = extractPriceType(item);
  const isFree = priceType === 'free' || price <= 0;
  const hasPrice = !isFree && price > 0;

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

      <View style={styles.gridOverlay}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.gridGradient}
        />
        <View style={styles.gridInfo}>
          <Text style={styles.gridTitle} numberOfLines={1}>
            {item.name || 'Post'}
          </Text>

          {isFree ? (
            <Text style={styles.gridPriceFree}>Free</Text>
          ) : hasPrice ? (
            <Text style={styles.gridPrice}>
              UGX {price.toLocaleString()}
            </Text>
          ) : null}

          <View style={styles.gridFooter}>
            <Text style={styles.gridUser} numberOfLines={1}>
              {displayName}
            </Text>
            {item.like_count && item.like_count > 0 && (
              <Text style={styles.gridLikes}>❤️ {item.like_count}</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================================
// HELPER: build Opportunity from UserPost
// ============================================================
function buildOpportunityFromPost(
  item: UserPost,
  profile: UserProfileData | null,
  isSaved: boolean
): Opportunity {
  const price = extractPriceFromSpecifications(item);

  return {
    id: item.id,
    title: item.name || 'Post',
    price: price,
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
    video_duration: null,
    video_size: null,
    likeCount: item.like_count || 0,
    viewCount: item.view_count || 0,
    shareCount: item.share_count || 0,
    commentCount: item.comment_count || 0,
    saveCount: item.saveCount || 0,
    isSaved,
    distance: item.distance,
    specifications: item.specifications || {},
    price_type: item.price_type ?? null,
  } as any;
}

// ============================================================
// PER-ITEM MEDIA LOADING SPINNER (fullscreen carousel)
// ============================================================
const ItemMediaLoadingSpinner: React.FC = () => {
  return (
    <View style={styles.itemMediaSpinnerOverlay} pointerEvents="none">
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
};

// ============================================================
// GRID POSTS LOADING SPINNER
// ============================================================
const PostsLoadingSpinner: React.FC = () => {
  return (
    <View style={styles.postsLoadingContainer}>
      <ActivityIndicator size="large" color="#4A7DFF" />
      <Text style={styles.postsLoadingText}>Loading posts...</Text>
    </View>
  );
};

// ============================================================
// FULLSCREEN ITEM
// ============================================================
interface FullscreenItemProps {
  item: UserPost;
  index: number;
  fullscreenIndex: number;
  isFocused: boolean;
  isDesktop: boolean;
  winWidth: number;
  winHeight: number;
  userProfile: UserProfileData | null;
  userId: string | undefined;
  isSaved: boolean;
  isLiked: boolean;
  likeCount: number;
  isItemLoading: boolean;
  onShowMore: (item: UserPost) => void;
  onShare: () => void;
  onSave: (item: UserPost) => void;
  onLike: (item: UserPost) => void;
  onInbox: () => void;
  onMediaLoadStateChange: (isLoading: boolean) => void;
  onUserPress: () => void;
  onReviewsPress: (item: UserPost) => void;
  onDirectionsPress: (item: UserPost) => void;
  onAIPress: (item: UserPost) => void;
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
  isSaved,
  isLiked,
  likeCount,
  isItemLoading,
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
}) => {
  const opportunity = buildOpportunityFromPost(item, userProfile, isSaved);

  const mediaItems: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }[] = [];

  const thumbnail =
    item.video_thumbnail ||
    (item.images && item.images.length > 0 ? item.images[0] : null);

  if (item.video) {
    mediaItems.push({
      type: 'video',
      url: item.video,
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

  const price = extractPriceFromSpecifications(item);
  const priceType = extractPriceType(item);

  const cardWidth = isDesktop ? 420 : winWidth;
  const cardHeight = isDesktop ? winHeight : winHeight;

  const isVisible = isFocused && index === fullscreenIndex;
  const specs = (item as any).specifications || {};

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
        priceType={priceType as any}
        currency="UGX"
        userName={userProfile?.full_name || 'User'}
        userAvatar={userProfile?.avatar_url || null}
        description={item.description || null}
        rating={null}
        area={userProfile?.location_city || null}
        inStock={true}
        filter={specs.filter ?? null}
        textOverlays={specs.text_overlays ?? null}
        type="product"
        createdAt={item.created_at || undefined}
        isDesktop={isDesktop}
        width={cardWidth}
        height={cardHeight}
        onShowMore={() => onShowMore(item)}
        onShare={onShare}
        onSave={() => onSave(item)}
        onPrimaryAction={onInbox}
        onInboxPress={onInbox}
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
          onUserPress={onUserPress}
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
    </View>
  );
};

// ============================================================
// MAIN CONTENT
// ============================================================

const UserProfileContent = ({
  route,
  navigation,
}: UserProfileScreenProps) => {
  const { userId } = route.params || {};
  const { user: currentUser } = useAuth();
  const { isDesktop } = useBreakpoint();
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const [viewMode, setViewMode] = useState<'grid' | 'fullscreen'>('grid');
  const [selectedItem, setSelectedItem] = useState<UserPost | null>(null);
  const [savedItemsMap, setSavedItemsMap] = useState<Record<string, boolean>>(
    {}
  );

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

  // ✅ StyledAlert state
  const [styledAlertConfig, setStyledAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    icon?: string;
    iconColor?: string;
    buttons: {
      text: string;
      onPress: () => void;
      style?: 'default' | 'cancel' | 'destructive' | 'primary';
    }[];
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showStyledAlert = useCallback(
    (config: {
      title: string;
      message: string;
      icon?: string;
      iconColor?: string;
      buttons: {
        text: string;
        onPress: () => void;
        style?: 'default' | 'cancel' | 'destructive' | 'primary';
      }[];
    }) => {
      setStyledAlertConfig({
        visible: true,
        ...config,
      });
    },
    []
  );

  const hideStyledAlert = useCallback(() => {
    setStyledAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  // ============================================================
  // INBOX
  // ============================================================
  const handleInboxPress = useCallback(() => {
    if (!currentUser) {
      showStyledAlert({
        title: 'Sign in required',
        message: 'Please sign in to message this user.',
        icon: 'lock-closed-outline',
        iconColor: '#4A7DFF',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      return;
    }
    if (isOwnProfile) {
      showStyledAlert({
        title: 'Info',
        message: 'You cannot message yourself.',
        icon: 'information-circle-outline',
        iconColor: '#4A7DFF',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      return;
    }

    navigation.navigate('Inbox', {
      userId: userId,
      userName: userProfile?.full_name || 'User',
    });
  }, [
    currentUser,
    userId,
    userProfile,
    isOwnProfile,
    navigation,
    showStyledAlert,
    hideStyledAlert,
  ]);

  // ============================================================
  // FETCH PROFILE
  // ============================================================
  const fetchUserProfile = useCallback(async () => {
    if (!userId) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const isOwn = currentUser?.id === userId;
      setIsOwnProfile(isOwn);

      const { count: postsCount } = await supabase
        .from('catalog')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active');

      let followersCountData = 0;
      let followingCountData = 0;
      let isFollowingUser = false;
      let totalLikes = 0;

      try {
        const { count } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId);
        followersCountData = count || 0;
      } catch {}

      try {
        const { count } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId);
        followingCountData = count || 0;
      } catch {}

      if (currentUser && !isOwn) {
        try {
          const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', userId)
            .maybeSingle();
          if (followData) isFollowingUser = true;
        } catch {}
      }

      try {
        const { data: myPostIds } = await supabase
          .from('catalog')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'active');

        const postIds = (myPostIds || []).map((r: any) => r.id);

        if (postIds.length > 0) {
          const { count, error: likeErr } = await (supabase as any)
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .in('post_id', postIds);

          if (!likeErr) {
            totalLikes = count || 0;
          }
        }
      } catch (err) {
        console.warn('Failed to count likes:', err);
      }

      setUserProfile({
        id: userData.id,
        full_name: userData.full_name || 'User',
        phone_number: userData.phone_number || '',
        avatar_url: userData.avatar_url || null,
        cover_url: userData.cover_url || null,
        bio: userData.bio || null,
        role: userData.role || 'customer',
        wallet_balance: userData.wallet_balance || 0,
        lifetime_savings: userData.lifetime_savings || 0,
        kyc_verified: userData.kyc_verified || false,
        created_at: userData.created_at || null,
        location_city: userData.location_city || null,
        location_region: userData.location_region || null,
        location_country: userData.location_country || null,
        latitude: userData.latitude ?? null,
        longitude: userData.longitude ?? null,
        posts_count: postsCount || 0,
        followers_count: followersCountData,
        following_count: followingCountData,
        likes_count: totalLikes,
        is_following: isFollowingUser,
      });

      setIsFollowing(isFollowingUser);
      setFollowersCount(followersCountData);
      setFollowingCount(followingCountData);
      setLikesCount(totalLikes);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      showStyledAlert({
        title: 'Error',
        message: 'Failed to load user profile',
        icon: 'alert-circle-outline',
        iconColor: '#E74C3C',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
    }
  }, [userId, currentUser, showStyledAlert, hideStyledAlert]);

  // ============================================================
  // FETCH POSTS
  // ============================================================
  const fetchUserPosts = useCallback(async () => {
    if (!userId || !userProfile) return;

    setPostsLoading(true);

    try {
      const { data, error } = await supabase
        .from('catalog')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
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
      } catch {}

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
      } catch {}

      let userCoords: { latitude: number; longitude: number } | undefined;
      try {
        const loc = await locationService.getCurrentLocation();
        if (loc?.latitude != null && loc?.longitude != null) {
          userCoords = { latitude: loc.latitude, longitude: loc.longitude };
        }
      } catch {}

      const posts: UserPost[] = rows.map((item: any) => {
        let distance: number | undefined;
        if (
          userCoords &&
          userProfile.latitude != null &&
          userProfile.longitude != null
        ) {
          distance = calculateDistance(
            userCoords.latitude,
            userCoords.longitude,
            userProfile.latitude,
            userProfile.longitude
          );
        }

        return {
          id: item.id,
          name: item.name || 'Untitled',
          category: item.category || 'Uncategorized',
          description: item.description || null,
          images: item.images || null,
          video: item.video || null,
          video_thumbnail: item.video_thumbnail || null,
          price: item.price || null,
          like_count: item.like_count || 0,
          view_count: item.view_count || 0,
          share_count: item.share_count || 0,
          comment_count: commentCounts[item.id] || 0,
          created_at: item.created_at || null,
          specifications: item.specifications || {},
          distance,
          saveCount: saveCounts[item.id] || 0,
          isSaved: false,
          price_type: extractPriceType(item),
        };
      });

      setUserPosts(posts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setPostsLoading(false);
    }
  }, [userId, userProfile]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await fetchUserProfile();
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    if (userProfile) fetchUserPosts();
  }, [userProfile, fetchUserPosts]);

  useEffect(() => {
    if (userId) loadAllData();
  }, [userId]);

  // ✅ Seed loadingItemsMap
  useEffect(() => {
    if (userPosts.length === 0) return;

    setLoadingItemsMap((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const post of userPosts) {
        if (next[post.id] === undefined) {
          next[post.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [userPosts]);

  // ✅ Prefetch likes
  useEffect(() => {
    if (!currentUser?.id) return;
    const postIds = userPosts.map((p) => p.id);
    if (postIds.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('likes')
          .select('post_id')
          .eq('user_id', currentUser.id)
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
  }, [currentUser?.id, userPosts]);

  const handleMediaLoadStateChange = useCallback(
    (postId: string, isLoading: boolean) => {
      setLoadingItemsMap((prev) => {
        if (prev[postId] === isLoading) return prev;
        return { ...prev, [postId]: isLoading };
      });
    },
    []
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAllData();
  }, [loadAllData]);

  // ============================================================
  // FOLLOW
  // ============================================================
  const handleFollowPress = useCallback(async () => {
    if (!currentUser) {
      showStyledAlert({
        title: 'Sign in required',
        message: 'Please sign in to follow this user.',
        icon: 'lock-closed-outline',
        iconColor: '#4A7DFF',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      return;
    }
    if (isOwnProfile) {
      showStyledAlert({
        title: 'Info',
        message: 'You cannot follow yourself.',
        icon: 'information-circle-outline',
        iconColor: '#4A7DFF',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      return;
    }

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId);
        if (error) throw error;
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: userId });
        if (error) throw error;
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Follow error:', error);
      showStyledAlert({
        title: 'Error',
        message: 'Failed to update follow status',
        icon: 'alert-circle-outline',
        iconColor: '#E74C3C',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
    }
  }, [
    currentUser,
    userId,
    isFollowing,
    isOwnProfile,
    showStyledAlert,
    hideStyledAlert,
  ]);

  // ============================================================
  // TOGGLE LIKE
  // ============================================================
  const handleLikePress = useCallback(
    async (item: UserPost) => {
      if (!currentUser?.id) {
        showStyledAlert({
          title: 'Sign in required',
          message: 'Please sign in to like posts.',
          icon: 'lock-closed-outline',
          iconColor: '#4A7DFF',
          buttons: [
            { text: 'OK', style: 'primary', onPress: hideStyledAlert },
          ],
        });
        return;
      }

      const currentlyLiked = likedItemsMap[item.id] || false;
      const nextLiked = !currentlyLiked;

      setLikedItemsMap((prev) => ({ ...prev, [item.id]: nextLiked }));
      setLikeCountMap((prev) => {
        const current = prev[item.id] ?? item.like_count ?? 0;
        return {
          ...prev,
          [item.id]: Math.max(0, current + (nextLiked ? 1 : -1)),
        };
      });

      setLikesCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)));

      try {
        if (nextLiked) {
          const { error } = await (supabase as any)
            .from('likes')
            .insert({ user_id: currentUser.id, post_id: item.id });
          if (error && (error as any).code !== '23505') throw error;
        } else {
          const { error } = await (supabase as any)
            .from('likes')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('post_id', item.id);
          if (error) throw error;
        }
      } catch (err) {
        console.error('Like toggle failed:', err);
        setLikedItemsMap((prev) => ({ ...prev, [item.id]: currentlyLiked }));
        setLikeCountMap((prev) => {
          const current = prev[item.id] ?? item.like_count ?? 0;
          return {
            ...prev,
            [item.id]: Math.max(0, current + (currentlyLiked ? 1 : -1)),
          };
        });
        setLikesCount((prev) =>
          Math.max(0, prev + (currentlyLiked ? 1 : -1))
        );
      }
    },
    [
      currentUser?.id,
      likedItemsMap,
      showStyledAlert,
      hideStyledAlert,
    ]
  );

  // ============================================================
  // FULLSCREEN HANDLERS
  // ============================================================
  const handleItemPress = useCallback(
    (item: UserPost) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const idx = userPosts.findIndex((p) => p.id === item.id);
      setSelectedItem(item);
      setFullscreenIndex(idx >= 0 ? idx : 0);
      setViewMode('fullscreen');
    },
    [userPosts]
  );

  const handleBackToGrid = useCallback(() => {
    setViewMode('grid');
    setSelectedItem(null);
    setFullscreenIndex(0);
  }, []);

  const handleStatPress = useCallback(
    (type: string) => {
      let count = 0;
      let label = '';
      let icon = 'information-circle-outline';
      switch (type) {
        case 'likes':
          count = likesCount;
          label = 'Likes';
          icon = 'heart-outline';
          break;
        case 'followers':
          count = followersCount;
          label = 'Followers';
          icon = 'people-outline';
          break;
        case 'following':
          count = followingCount;
          label = 'Following';
          icon = 'person-add-outline';
          break;
      }
      showStyledAlert({
        title: label,
        message: `${count} ${label.toLowerCase()}`,
        icon,
        iconColor: '#4A7DFF',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
    },
    [likesCount, followersCount, followingCount, showStyledAlert, hideStyledAlert]
  );

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

  // ============================================================
  // STABLE VIEWABILITY HANDLER
  // ============================================================
  const onViewableItemsChangedRef = useRef<
    | ((info: {
        viewableItems: ViewToken<UserPost>[];
        changed: ViewToken<UserPost>[];
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
      viewableItems: ViewToken<UserPost>[];
      changed: ViewToken<UserPost>[];
    }) => {
      onViewableItemsChangedRef.current?.(info);
    }
  ).current;

  // ============================================================
  // LOADING / ERROR
  // ============================================================
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['top']}>
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ============================================================
  // FULLSCREEN VIEW
  // ============================================================
  if (viewMode === 'fullscreen' && selectedItem) {
    const allItems = userPosts;
    const currentIndex = allItems.findIndex(
      (item) => item.id === selectedItem.id
    );
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
                    userId={userId}
                    isSaved={savedItemsMap[item.id] || false}
                    isLiked={likedItemsMap[item.id] || false}
                    likeCount={likeCountMap[item.id] ?? item.like_count ?? 0}
                    isItemLoading={loadingItemsMap[item.id] === true}
                    onShowMore={(p) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedOpportunity(
                        buildOpportunityFromPost(p, userProfile, false)
                      );
                      setShowAIModal(true);
                    }}
                    onShare={() =>
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    }
                    onSave={(p) => {
                      if (!currentUser?.id) return;
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSavedItemsMap((prev) => ({
                        ...prev,
                        [p.id]: !(prev[p.id] ?? p.isSaved ?? false),
                      }));
                    }}
                    onLike={(p) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleLikePress(p);
                    }}
                    onInbox={handleInboxPress}
                    onMediaLoadStateChange={(isLoading) =>
                      handleMediaLoadStateChange(item.id, isLoading)
                    }
                    onUserPress={() =>
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    }
                    onReviewsPress={(p) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedOpportunity(
                        buildOpportunityFromPost(p, userProfile, false)
                      );
                      setShowReviewsModal(true);
                    }}
                    onDirectionsPress={(p) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedOpportunity(
                        buildOpportunityFromPost(p, userProfile, false)
                      );
                      setShowDirectionsModal(true);
                    }}
                    onAIPress={(p) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      setSelectedOpportunity(
                        buildOpportunityFromPost(p, userProfile, false)
                      );
                      setShowAIModal(true);
                    }}
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
                  ? `${userProfile.full_name || 'User'}'s post`
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

            {/* ✅ StyledAlert */}
            <StyledAlert
              visible={styledAlertConfig.visible}
              title={styledAlertConfig.title}
              message={styledAlertConfig.message}
              icon={styledAlertConfig.icon}
              iconColor={styledAlertConfig.iconColor}
              buttons={styledAlertConfig.buttons}
              onClose={hideStyledAlert}
            />
          </View>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    );
  }

  // ============================================================
  // GRID VIEW
  // ============================================================
  return (
    <SafeAreaView
      style={[styles.container, isDesktop && styles.desktopContainer]}
      edges={['top']}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {userProfile.full_name || 'User'}
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF" />
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
      >
        <View style={styles.coverContainer}>
          {userProfile.cover_url ? (
            <Image
              source={{ uri: userProfile.cover_url }}
              style={styles.coverImage}
            />
          ) : (
            <View style={[styles.coverImage, styles.coverPlaceholder]}>
              <LinearGradient
                colors={['rgba(74,125,255,0.3)', 'rgba(74,125,255,0.1)']}
                style={styles.coverGradient}
              />
            </View>
          )}
        </View>

        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{
                uri:
                  userProfile.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    userProfile.full_name || 'User'
                  )}&background=4A7DFF&color=fff&size=200&bold=true`,
              }}
              style={styles.profileImage}
            />
          </View>

          <View style={styles.profileActions}>
            {!isOwnProfile && (
              <>
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    isFollowing && styles.followingButton,
                  ]}
                  onPress={handleFollowPress}
                >
                  <Text
                    style={[
                      styles.followButtonText,
                      isFollowing && styles.followingButtonText,
                    ]}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.inboxButton}
                  onPress={handleInboxPress}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={20}
                    color="#4A7DFF"
                  />
                </TouchableOpacity>
              </>
            )}
            {isOwnProfile && (
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => navigation.navigate('Account')}
              >
                <Text style={styles.editProfileButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {userProfile.full_name || 'User'}
          </Text>

          {userProfile.bio ? (
            <Text style={styles.userBio}>{userProfile.bio}</Text>
          ) : null}

          {(userProfile.location_city ||
            userProfile.location_region ||
            userProfile.location_country) && (
            <View style={styles.userLocation}>
              <Ionicons name="location-outline" size={14} color="#8A8AAE" />
              <Text style={styles.userLocationText}>
                {[
                  userProfile.location_city,
                  userProfile.location_region,
                  userProfile.location_country,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>
          )}
        </View>

        <StatsRow
          likes={likesCount}
          followers={followersCount}
          following={followingCount}
          onStatPress={handleStatPress}
        />

        {postsLoading ? (
          <PostsLoadingSpinner />
        ) : userPosts.length === 0 ? (
          <View style={styles.emptyPosts}>
            <Ionicons name="images-outline" size={48} color="#8A8AAE" />
            <Text style={styles.emptyPostsTitle}>No posts yet</Text>
            <Text style={styles.emptyPostsSubtext}>
              {isOwnProfile
                ? 'Share your first post with the community'
                : 'This user has not posted anything yet'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={userPosts}
            renderItem={({ item }) => (
              <GridPostItem
                item={item}
                onPress={handleItemPress}
                userName={userProfile.full_name || 'User'}
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

      {/* ✅ StyledAlert (grid view) */}
      <StyledAlert
        visible={styledAlertConfig.visible}
        title={styledAlertConfig.title}
        message={styledAlertConfig.message}
        icon={styledAlertConfig.icon}
        iconColor={styledAlertConfig.iconColor}
        buttons={styledAlertConfig.buttons}
        onClose={hideStyledAlert}
      />
    </SafeAreaView>
  );
};

// ============================================================
// MAIN EXPORT
// ============================================================

export const UserProfileScreen = ({
  route,
  navigation,
}: UserProfileScreenProps) => {
  const { isDesktop } = useBreakpoint();

  return (
    <ResponsiveLayout
      currentRoute="UserProfile"
      onNavigate={(route) => navigation?.navigate(route)}
      floatingActions={null}
      hideContextPanel={true}
      fullWidth={true}
    >
      <UserProfileContent route={route} navigation={navigation} />
    </ResponsiveLayout>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  desktopContainer: { padding: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#8A8AAE', fontSize: 14, marginTop: 12 },
  errorText: { color: '#E74C3C', fontSize: 18, fontWeight: 'bold' },
  goBackText: { color: '#4A7DFF', fontSize: 16, marginTop: 12 },

  itemMediaSpinnerOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  postsLoadingContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postsLoadingText: {
    color: '#8A8AAE',
    fontSize: 13,
    marginTop: 12,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#0D0D1A',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: { flexDirection: 'row', gap: 12 },
  headerIcon: { padding: 4 },
  backButton: { padding: 4, zIndex: 10 },
  scrollContent: { paddingBottom: 20 },
  coverContainer: { height: 150, backgroundColor: '#1A1A2E' },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { backgroundColor: 'rgba(74,125,255,0.1)' },
  coverGradient: { width: '100%', height: '100%' },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: -30,
  },
  profileImageContainer: {
    padding: 3,
    backgroundColor: '#0D0D1A',
    borderRadius: 50,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#4A7DFF',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#4A7DFF',
    borderRadius: 20,
  },
  followingButton: { backgroundColor: 'rgba(255,255,255,0.1)' },
  followButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  followingButtonText: { color: '#8A8AAE' },
  inboxButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(74,125,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74,125,255,0.2)',
  },
  editProfileButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  editProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  userInfo: { paddingHorizontal: 16, marginTop: 10 },
  userName: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  userBio: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  userLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  userLocationText: { color: '#8A8AAE', fontSize: 12 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    marginTop: 12,
    marginBottom: 8,
  },
  statItem: { alignItems: 'center' },
  statNumber: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#8A8AAE', fontSize: 12, marginTop: 2 },
  postsGrid: { paddingHorizontal: 4 },
  gridPostItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 2,
    position: 'relative',
  },
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
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
    zIndex: 5,
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  gridGradient: { width: '100%', height: '100%' },
  gridInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
  },
  gridTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  gridPrice: {
    color: '#4A7DFF',
    fontSize: 10,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginTop: 1,
  },
  gridPriceFree: {
    color: '#2ECC71',
    fontSize: 10,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginTop: 1,
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  gridUser: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    flex: 1,
  },
  gridLikes: { color: '#F1C40F', fontSize: 9 },
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
  },
  bottomSpacer: { height: 20 },
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
  actionRailWrapper: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -150 }],
    zIndex: 50,
  },
});