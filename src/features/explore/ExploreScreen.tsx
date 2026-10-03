// src/features/explore/ExploreScreen.tsx

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Dimensions,
  StatusBar,
  useWindowDimensions,
  Image,
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  ListRenderItem,
  ViewToken,
  ViewabilityConfig,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { SceneRenderer } from '../opportunity/renderer/SceneRenderer';
import { FloatingActionRail } from '../feed/components/FloatingActionRail';
import { ReviewsBottomSheet } from '../feed/components/ReviewsBottomSheet';
import { AIBottomSheet } from '../feed/components/AIBottomSheet';
import { DirectionsBottomSheet } from '../feed/components/DirectionsBottomSheet';
import { StyledAlert } from '../feed/components/StyledAlert';
import {
  feedService,
  Opportunity,
  calculateDistance,
} from '../../services/feed.service';
import { locationService } from '../../services/location.service';
import * as Haptics from 'expo-haptics';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useIsFocused } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const FULLSCREEN_VIEWABILITY_CONFIG: ViewabilityConfig = {
  itemVisiblePercentThreshold: 60,
  minimumViewTime: 100,
};

const DESKTOP_FEED_ASPECT = 9 / 16;
const DESKTOP_FALLBACK_MAX_HEIGHT = 900;
const DESKTOP_GRID_COLUMNS = 6;

type PriceType =
  | 'fixed'
  | 'negotiable'
  | 'starting_from'
  | 'free'
  | 'showcase';

interface ExplorePost {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  images: string[];
  video: string | null;
  video_thumbnail: string | null;
  video_duration: number | null;
  video_size: number | null;
  hashtags: string[];
  location: string | null;
  category: string | null;
  status: string;
  like_count: number;
  view_count: number;
  share_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  user_full_name: string | null;
  user_avatar: string | null;
  detected_category: string | null;
  detected_intent: string | null;
  detected_tags: string[];
  userId: string;
  userFullName: string;
  userAvatar: string | null;
  imageUrl: string;
  catalogImages: string[];
  user_cover_url?: string | null;
  distance?: number;
  saveCount?: number;
  isSaved?: boolean;
  specifications?: any;
  price_type?: PriceType | string | null;
}

const VALID_PRICE_TYPES: PriceType[] = [
  'fixed',
  'negotiable',
  'starting_from',
  'free',
  'showcase',
];

function resolvePostPriceType(item: ExplorePost): PriceType {
  const candidates: Array<unknown> = [
    item.price_type,
    (item as any)?.specifications?.price_type,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && (VALID_PRICE_TYPES as string[]).includes(c)) {
      return c as PriceType;
    }
  }
  if (!item.price || item.price <= 0) return 'free';
  return 'fixed';
}

const DEFAULT_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'products', label: 'Products' },
  { key: 'services', label: 'Services' },
  { key: 'electronics', label: 'Electronics' },
  { key: 'fashion', label: 'Fashion' },
  { key: 'food', label: 'Food' },
  { key: 'art', label: 'Art' },
  { key: 'vehicles', label: 'Vehicles' },
  { key: 'property', label: 'Property' },
  { key: 'jobs', label: 'Jobs' },
];

const sortOptions = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'latest', label: 'Latest' },
  { key: 'price_low', label: 'Price: Low to High' },
  { key: 'price_high', label: 'Price: High to Low' },
  { key: 'popular', label: 'Most Popular' },
];

const FilterChip = ({ label, selected, onPress, count }: any) => (
  <TouchableOpacity
    style={[styles.filterChip, selected && styles.filterChipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text
      style={[styles.filterChipText, selected && styles.filterChipTextActive]}
    >
      {label}
    </Text>
    {count !== undefined && count > 0 && (
      <View style={styles.filterChipBadge}>
        <Text style={styles.filterChipBadgeText}>{count}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const GridResultCard = React.memo(
  ({
    item,
    onPress,
  }: {
    item: ExplorePost;
    onPress: (item: ExplorePost) => void;
  }) => {
    let imageUrl = '';
    if (item.images && item.images.length > 0) {
      imageUrl = item.images[0];
    } else if (item.video_thumbnail) {
      imageUrl = item.video_thumbnail;
    } else if (item.user_cover_url) {
      imageUrl = item.user_cover_url;
    } else if (item.user_avatar) {
      imageUrl = item.user_avatar;
    }

    const displayName = item.user_full_name || 'User';
    const hasVideo = !!item.video;
    const effectivePriceType = resolvePostPriceType(item);
    const hasPrice =
      effectivePriceType !== 'free' &&
      effectivePriceType !== 'showcase' &&
      item.price !== undefined &&
      item.price !== null &&
      item.price > 0;

    return (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={() => onPress(item)}
        activeOpacity={0.8}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.gridImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.gridImage, styles.gridImagePlaceholder]}>
            <Ionicons name="image-outline" size={40} color="#4A7DFF" />
          </View>
        )}

        {hasVideo && (
          <View style={styles.videoBadge}>
            <Ionicons name="play-circle" size={24} color="#FFFFFF" />
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

            {hasPrice && (
              <Text style={styles.gridPrice}>
                UGX {item.price!.toLocaleString()}
              </Text>
            )}
            {effectivePriceType === 'showcase' && (
              <Text style={styles.gridShowcase}>Showcase</Text>
            )}

            <View style={styles.gridFooter}>
              <Text style={styles.gridShop} numberOfLines={1}>
                {displayName}
              </Text>
              {item.like_count && item.like_count > 0 && (
                <Text style={styles.gridRating}>❤️ {item.like_count}</Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

function buildOpportunityFromPost(
  item: ExplorePost,
  isSaved: boolean
): Opportunity {
  const specs = (item as any).specifications || {};
  const effectivePriceType = resolvePostPriceType(item);

  return {
    id: item.id,
    title: item.name || 'Untitled',
    price: item.price || 0,
    currency: item.currency || 'UGX',
    imageUrl:
      item.images?.[0] ||
      item.video_thumbnail ||
      item.user_cover_url ||
      '',
    catalogImages: item.images || [],
    description: item.description || '',
    rating: null,
    reviewCount: item.comment_count || 0,
    userLatitude: null,
    userLongitude: null,
    userPhone: null,
    area: item.location || null,
    inStock: true,
    category: item.category || item.detected_category || null,
    type: 'product',
    createdAt: item.created_at,
    userId: item.user_id,
    userFullName: item.user_full_name || 'User',
    userAvatar: item.user_avatar || null,
    video: item.video || null,
    video_thumbnail: item.video_thumbnail || null,
    video_duration: item.video_duration || null,
    video_size: item.video_size || null,
    likeCount: item.like_count || 0,
    viewCount: item.view_count || 0,
    shareCount: item.share_count || 0,
    commentCount: item.comment_count || 0,
    saveCount: item.saveCount || 0,
    isSaved,
    distance: item.distance,
    specifications: {
      ...specs,
      price_type: effectivePriceType,
    },
    ...({ price_type: effectivePriceType } as any),
  };
}

const ItemMediaLoadingSpinner: React.FC = () => {
  return (
    <View style={styles.itemMediaSpinnerOverlay} pointerEvents="none">
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
};

interface FullscreenItemProps {
  item: ExplorePost;
  index: number;
  fullscreenIndex: number;
  isFocused: boolean;
  isDesktop: boolean;
  cardWidth: number;
  cardHeight: number;
  isSaved: boolean;
  isLiked: boolean;
  likeCount: number;
  isItemLoading: boolean;
  onShowMore: (item: ExplorePost) => void;
  onShare: () => void;
  onSave: (item: ExplorePost) => void;
  onLike: (item: ExplorePost) => void;
  onInbox: (item: ExplorePost) => void;
  onMediaLoadStateChange: (isLoading: boolean) => void;
  onUserPress: (item: ExplorePost) => void;
  onReviewsPress: (item: ExplorePost) => void;
  onDirectionsPress: (item: ExplorePost) => void;
  onAIPress: (item: ExplorePost) => void;
  onNaturalSize?: (
    size: { width: number; height: number } | null
  ) => void;
  fillMode?: 'contain' | 'cover';
}

const FullscreenItem: React.FC<FullscreenItemProps> = ({
  item,
  index,
  fullscreenIndex,
  isFocused,
  isDesktop,
  cardWidth,
  cardHeight,
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
  onNaturalSize,
  fillMode = 'contain',
}) => {
  const opportunity = buildOpportunityFromPost(item, isSaved);
  const effectivePriceType = resolvePostPriceType(item);

  const mediaItems: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }[] = [];

  const thumbnail =
    item.video_thumbnail ||
    item.images?.[0] ||
    item.user_cover_url ||
    item.user_avatar ||
    undefined;

  if (item.video) {
    mediaItems.push({
      type: 'video',
      url: item.video,
      thumbnail,
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

  const displayName = item.user_full_name || 'User';
  const specs = (item as any).specifications || {};
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
        price={item.price || 0}
        currency={item.currency || 'UGX'}
        userName={displayName}
        userAvatar={item.user_avatar || null}
        description={item.description || null}
        rating={null}
        area={item.location || null}
        inStock={true}
        type="product"
        createdAt={item.created_at}
        isDesktop={isDesktop}
        width={cardWidth}
        height={cardHeight}
        onShowMore={() => onShowMore(item)}
        onShare={onShare}
        filter={specs.filter ?? null}
        textOverlays={specs.text_overlays ?? null}
        onSave={() => onSave(item)}
        onPrimaryAction={() => onInbox(item)}
        onInboxPress={() => onInbox(item)}
        showInboxButton={true}
        onMediaLoadStateChange={onMediaLoadStateChange}
        onSceneChange={(sceneIdx, source) => {
          if (__DEV__) console.log('Scene changed:', sceneIdx, source);
        }}
        onBehavioralEvent={(event) => {
          if (__DEV__) console.log('Behavioral event:', event);
        }}
        autoPlay={true}
        autoPlayInterval={5000}
        priceType={effectivePriceType}
        resetKey={item.id}
        useExplicitBottomOffset={isDesktop ? false : true}
        bottomOffset={0}
        isVisible={isVisible}
        onNaturalSize={onNaturalSize}
        fillMode={isDesktop ? fillMode : 'contain'}
      />

      {isItemLoading && isVisible && <ItemMediaLoadingSpinner />}

      {!isDesktop && (
        <View style={styles.actionRailWrapper}>
          <FloatingActionRail
            key={`rail-${item.id}`}
            opportunity={opportunity}
            isLiked={isLiked}
            bottomInset={80}
            rightShift={-6}
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
            userAvatar={item.user_avatar || null}
          />
        </View>
      )}
    </View>
  );
};

interface ExploreContentProps {
  navigation: any;
  viewMode: 'grid' | 'fullscreen';
  setViewMode: (mode: 'grid' | 'fullscreen') => void;
  onDesktopFullscreenStateChange?: (state: {
    fullscreenIndex: number;
    totalCount: number;
    currentPost: ExplorePost | null;
    isSaved: boolean;
    isLiked: boolean;
    likeCount: number;
  }) => void;
  onDesktopScrollToIndex?: (fn: (idx: number) => void) => void;
  onDesktopRailHandlersChange?: (handlers: {
    onLike: () => void;
    onSave: () => void;
    onUser: () => void;
    onReviews: () => void;
    onDirections: () => void;
    onShare: () => void;
    onAI: () => void;
  }) => void;
  onDesktopReviewsRequest?: (
    opportunity: Opportunity,
    productTitle: string
  ) => void;
  onDesktopDirectionsRequest?: (opportunity: Opportunity) => void;
  onDesktopAIRequest?: (opportunity: Opportunity) => void;
  onDesktopDetailsRequest?: (opportunity: Opportunity) => void;
  /** Called whenever the visible fullscreen post changes, so the
   * parent can reset the context panel to Featured. */
  onDesktopFullscreenIndexChange?: (index: number, postId: string) => void;
}

const ExploreContent: React.FC<ExploreContentProps> = ({
  navigation,
  viewMode,
  setViewMode,
  onDesktopFullscreenStateChange,
  onDesktopScrollToIndex,
  onDesktopRailHandlersChange,
  onDesktopReviewsRequest,
  onDesktopDirectionsRequest,
  onDesktopAIRequest,
  onDesktopDetailsRequest,
  onDesktopFullscreenIndexChange,
}) => {
  const { isDesktop } = useBreakpoint();
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const { height: winHeight, width: winWidth } = useWindowDimensions();

  const [items, setItems] = useState<ExplorePost[]>([]);
  const [filteredItems, setFilteredItems] = useState<ExplorePost[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('relevance');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExplorePost | null>(null);
  const [savedItemsMap, setSavedItemsMap] = useState<Record<string, boolean>>(
    {}
  );
  const [likedItemsMap, setLikedItemsMap] = useState<Record<string, boolean>>(
    {}
  );
  const [likeCountMap, setLikeCountMap] = useState<Record<string, number>>({});
  const [categories] = useState(DEFAULT_CATEGORIES);
  const [showSearch, setShowSearch] = useState(false);
  const [loadingItemsMap, setLoadingItemsMap] = useState<
    Record<string, boolean>
  >({});
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [gridScrollY, setGridScrollY] = useState(0);

  // ✅ Mobile-only modal state. Never used when isDesktop is true.
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);

  const aspectCacheRef = useRef<Map<string, number>>(new Map());
  const [aspectCacheVersion, setAspectCacheVersion] = useState(0);
  const [reportedAspect, setReportedAspect] = useState<number | null>(null);
  const reportedAspectPostIdRef = useRef<string | null>(null);
  const [currentMediaAspect, setCurrentMediaAspect] = useState<number | null>(
    null
  );

  const [desktopItemHeight, setDesktopItemHeight] = useState<number | null>(
    null
  );
  const [desktopItemWidth, setDesktopItemWidth] = useState<number | null>(
    null
  );

  const desktopFallbackHeight = Math.min(
    winHeight * 0.92,
    DESKTOP_FALLBACK_MAX_HEIGHT
  );
  const desktopFallbackWidth = desktopFallbackHeight * DESKTOP_FEED_ASPECT;

  const itemHeight = isDesktop
    ? desktopItemHeight ?? desktopFallbackHeight
    : winHeight;
  const itemWidth = isDesktop
    ? desktopItemWidth ?? desktopFallbackWidth
    : winWidth;

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

  const flatListRef = useRef<FlatList>(null);
  const gridListRef = useRef<FlatList>(null);
  const searchInputRef = useRef<TextInput>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      let userCoords: { latitude: number; longitude: number } | undefined;
      try {
        const loc = await locationService.getCurrentLocation();
        if (loc?.latitude != null && loc?.longitude != null) {
          userCoords = { latitude: loc.latitude, longitude: loc.longitude };
        }
      } catch (err) {
        console.log('⚠️ Could not get location for explore distances:', err);
      }

      const opportunities: Opportunity[] = await feedService.getOpportunities(
        userCoords
      );

      if (!opportunities || opportunities.length === 0) {
        setItems([]);
        setFilteredItems([]);
        setIsLoading(false);
        return;
      }

      const posts: ExplorePost[] = opportunities.map((opp) => {
        const images = opp.catalogImages || [];
        const specs = (opp as any).specifications || {};
        const rawPriceType =
          (opp as any).price_type ?? specs.price_type ?? null;

        return {
          id: opp.id,
          user_id: opp.userId || '',
          name: opp.title || 'Untitled',
          description: opp.description || null,
          price: opp.price ?? null,
          currency: opp.currency || 'UGX',
          images: images,
          video: opp.video || null,
          video_thumbnail: opp.video_thumbnail || null,
          video_duration: opp.video_duration || null,
          video_size: opp.video_size || null,
          hashtags: opp.hashtags || [],
          location: opp.area || null,
          category: opp.category || null,
          status: 'active',
          like_count: opp.likeCount || 0,
          view_count: opp.viewCount || 0,
          share_count: opp.shareCount || 0,
          comment_count: opp.commentCount || 0,
          created_at: opp.createdAt || new Date().toISOString(),
          updated_at: opp.createdAt || new Date().toISOString(),
          user_full_name: opp.userFullName || 'User',
          user_avatar: opp.userAvatar || null,
          detected_category: opp.category || null,
          detected_intent: null,
          detected_tags: opp.hashtags || [],
          userId: opp.userId || '',
          userFullName: opp.userFullName || 'User',
          userAvatar: opp.userAvatar || null,
          imageUrl: images[0] || opp.video_thumbnail || '',
          catalogImages: images,
          user_cover_url: null,
          distance: opp.distance,
          saveCount: opp.saveCount || 0,
          isSaved: opp.isSaved || false,
          specifications: specs,
          price_type: rawPriceType,
        };
      });

      const shuffled = posts.sort(() => Math.random() - 0.5);
      setItems(shuffled);
      setFilteredItems(shuffled);
    } catch (error) {
      console.error('❌ Error fetching explore data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);

    try {
      await fetchData();
      try {
        gridListRef.current?.scrollToOffset({ offset: 0, animated: true });
      } catch {
        /* noop */
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      if (__DEV__) console.error('❌ Explore refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, fetchData]);

  const applyFilters = useCallback(() => {
    let result = [...items];

    if (selectedFilter !== 'all') {
      if (selectedFilter === 'products') {
        result = result.filter(
          (item) =>
            item.detected_intent === 'sell' ||
            item.detected_category?.toLowerCase().includes('product') ||
            true
        );
      } else if (selectedFilter === 'services') {
        result = result.filter(
          (item) =>
            item.detected_intent === 'service' ||
            item.detected_category?.toLowerCase().includes('service')
        );
      } else {
        result = result.filter(
          (item) =>
            item.category?.toLowerCase().replace(/\s+/g, '_') ===
              selectedFilter ||
            item.category?.toLowerCase() === selectedFilter ||
            item.detected_category?.toLowerCase().replace(/\s+/g, '_') ===
              selectedFilter ||
            item.detected_category?.toLowerCase() === selectedFilter
        );
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name?.toLowerCase().includes(query) ||
          (item.description &&
            item.description.toLowerCase().includes(query)) ||
          item.user_full_name?.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query) ||
          item.hashtags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    switch (selectedSort) {
      case 'latest':
        result.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'price_low':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_high':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'popular':
        result.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
        break;
      default:
        break;
    }

    setFilteredItems(result);
  }, [items, selectedFilter, selectedSort, searchQuery]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    if (filteredItems.length === 0) return;

    setLoadingItemsMap((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const post of filteredItems) {
        if (next[post.id] === undefined) {
          next[post.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [filteredItems]);

  useEffect(() => {
    if (!user?.id) return;
    const postIds = filteredItems.map((o) => o.id);
    if (postIds.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const [likesRes, savesRes] = await Promise.all([
          supabase
            .from('likes' as any)
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', postIds),
          supabase
            .from('saves' as any)
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', postIds),
        ]);

        if (cancelled) return;

        if (!likesRes.error && likesRes.data) {
          const likedIds: Record<string, boolean> = {};
          likesRes.data.forEach((row: any) => {
            likedIds[row.post_id] = true;
          });
          setLikedItemsMap((prev) => ({ ...prev, ...likedIds }));
        }

        if (!savesRes.error && savesRes.data) {
          const savedIds: Record<string, boolean> = {};
          savesRes.data.forEach((row: any) => {
            savedIds[row.post_id] = true;
          });
          setSavedItemsMap((prev) => ({ ...prev, ...savedIds }));
        }
      } catch (e) {
        if (__DEV__) console.warn('Explore prefetch failed:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, filteredItems]);

  const handleMediaLoadStateChange = useCallback(
    (postId: string, isLoading: boolean) => {
      setLoadingItemsMap((prev) => {
        if (prev[postId] === isLoading) return prev;
        return { ...prev, [postId]: isLoading };
      });
    },
    []
  );

  const handleItemPress = useCallback(
    (item: ExplorePost) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const idx = filteredItems.findIndex((p) => p.id === item.id);
      setSelectedItem(item);
      setFullscreenIndex(idx >= 0 ? idx : 0);
      setViewMode('fullscreen');

      // ✅ Reset the desktop context panel to Featured on entry.
      if (isDesktop && onDesktopFullscreenIndexChange) {
        onDesktopFullscreenIndexChange(idx >= 0 ? idx : 0, item.id);
      }
    },
    [filteredItems, setViewMode, isDesktop, onDesktopFullscreenIndexChange]
  );

  const handleBackToGrid = useCallback(() => {
    setViewMode('grid');
    setSelectedItem(null);
    setFullscreenIndex(0);
  }, [setViewMode]);

  const toggleSearch = useCallback(() => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    } else {
      setSearchQuery('');
    }
  }, [showSearch]);

  const fullscreenViewabilityRef = useRef<
    | ((info: {
        viewableItems: ViewToken<ExplorePost>[];
        changed: ViewToken<ExplorePost>[];
      }) => void)
    | null
  >(null);

  fullscreenViewabilityRef.current = (info) => {
    const { viewableItems } = info;
    if (!viewableItems || viewableItems.length === 0) return;
    const first = viewableItems[0];
    const idx = first.index;
    if (idx == null) return;
    if (idx === fullscreenIndex) return;
    setFullscreenIndex(idx);

    // ✅ Reset the desktop context panel to Featured when the
    // visible post changes.
    if (isDesktop && onDesktopFullscreenIndexChange) {
      const post = filteredItems[idx];
      if (post) onDesktopFullscreenIndexChange(idx, post.id);
    }
  };

  const handleFullscreenViewableItemsChanged = useRef(
    (info: {
      viewableItems: ViewToken<ExplorePost>[];
      changed: ViewToken<ExplorePost>[];
    }) => {
      fullscreenViewabilityRef.current?.(info);
    }
  ).current;

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
    async (post: ExplorePost) => {
      if (!user?.id) {
        showStyledAlert({
          title: '🔒 Join Munolink',
          message: 'Create a free account to like posts.',
          icon: 'lock-closed',
          iconColor: '#4A7DFF',
          buttons: [
            {
              text: 'Continue Browsing',
              style: 'cancel',
              onPress: hideStyledAlert,
            },
            {
              text: 'Join Now',
              style: 'primary',
              onPress: () => {
                hideStyledAlert();
                navigation.navigate('Join');
              },
            },
          ],
        });
        return;
      }

      const currentlyLiked = likedItemsMap[post.id] || false;
      const nextLiked = !currentlyLiked;

      setLikedItemsMap((prev) => ({ ...prev, [post.id]: nextLiked }));
      setLikeCountMap((prev) => {
        const current = prev[post.id] ?? post.like_count ?? 0;
        return {
          ...prev,
          [post.id]: Math.max(0, current + (nextLiked ? 1 : -1)),
        };
      });

      try {
        if (nextLiked) {
          const { error } = await (supabase as any)
            .from('likes')
            .insert({ user_id: user.id, post_id: post.id });
          if (error && (error as any).code !== '23505') throw error;
        } else {
          const { error } = await (supabase as any)
            .from('likes')
            .delete()
            .eq('user_id', user.id)
            .eq('post_id', post.id);
          if (error) throw error;
        }
      } catch (err) {
        console.error('Like toggle failed:', err);
        setLikedItemsMap((prev) => ({ ...prev, [post.id]: currentlyLiked }));
        setLikeCountMap((prev) => {
          const current = prev[post.id] ?? post.like_count ?? 0;
          return {
            ...prev,
            [post.id]: Math.max(0, current + (currentlyLiked ? 1 : -1)),
          };
        });
      }
    },
    [user?.id, likedItemsMap, navigation, showStyledAlert, hideStyledAlert]
  );

  const handleSavePress = useCallback(
    async (post: ExplorePost) => {
      if (!user?.id) {
        showStyledAlert({
          title: '🔒 Join Munolink',
          message: 'Create a free account to save items.',
          icon: 'lock-closed',
          iconColor: '#4A7DFF',
          buttons: [
            {
              text: 'Continue Browsing',
              style: 'cancel',
              onPress: hideStyledAlert,
            },
            {
              text: 'Join Now',
              style: 'primary',
              onPress: () => {
                hideStyledAlert();
                navigation.navigate('Join');
              },
            },
          ],
        });
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const currentlySaved =
        savedItemsMap[post.id] ?? post.isSaved ?? false;
      const nextSaved = !currentlySaved;

      setSavedItemsMap((prev) => ({
        ...prev,
        [post.id]: nextSaved,
      }));

      try {
        if (nextSaved) {
          const { error } = await (supabase as any)
            .from('saves')
            .insert({ user_id: user.id, post_id: post.id });
          if (error && (error as any).code !== '23505') throw error;
        } else {
          const { error } = await (supabase as any)
            .from('saves')
            .delete()
            .eq('user_id', user.id)
            .eq('post_id', post.id);
          if (error) throw error;
        }
      } catch (err) {
        console.error('Save toggle failed:', err);
        setSavedItemsMap((prev) => ({
          ...prev,
          [post.id]: currentlySaved,
        }));
      }
    },
    [
      user?.id,
      navigation,
      savedItemsMap,
      showStyledAlert,
      hideStyledAlert,
    ]
  );

  const getPostAspect = useCallback((post: ExplorePost | null | undefined) => {
    if (!post) return null;
    const cached = aspectCacheRef.current.get(post.id);
    if (cached && isFinite(cached) && cached > 0) return cached;
    return null;
  }, []);

  const resolvePostAspect = useCallback(async (post: ExplorePost) => {
    if (!post?.id) return;
    if (aspectCacheRef.current.has(post.id)) return;

    const url =
      post.imageUrl ||
      post.video_thumbnail ||
      post.user_cover_url ||
      undefined;
    if (!url || typeof url !== 'string') return;

    try {
      const size = await new Promise<{ width: number; height: number }>(
        (resolve, reject) => {
          (Image as any).getSize(
            url,
            (w: number, h: number) => resolve({ width: w, height: h }),
            (err: any) => reject(err)
          );
        }
      );
      if (size.width > 0 && size.height > 0) {
        aspectCacheRef.current.set(post.id, size.width / size.height);
        setAspectCacheVersion((v) => v + 1);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isDesktop) return;
    if (viewMode !== 'fullscreen') return;
    const start = Math.max(0, fullscreenIndex - 1);
    const end = Math.min(filteredItems.length - 1, fullscreenIndex + 3);
    for (let i = start; i <= end; i++) {
      const post = filteredItems[i];
      if (post) resolvePostAspect(post);
    }
  }, [isDesktop, viewMode, filteredItems, fullscreenIndex, resolvePostAspect]);

  useEffect(() => {
    if (!isDesktop) {
      setCurrentMediaAspect(null);
      return;
    }
    const post = filteredItems[fullscreenIndex] ?? null;
    if (!post) {
      setCurrentMediaAspect(null);
      return;
    }
    const cached = getPostAspect(post);
    if (cached) {
      setCurrentMediaAspect(cached);
      return;
    }
    if (reportedAspect && reportedAspectPostIdRef.current === post.id) {
      setCurrentMediaAspect(reportedAspect);
    } else {
      setCurrentMediaAspect(null);
    }
  }, [
    isDesktop,
    filteredItems,
    fullscreenIndex,
    aspectCacheVersion,
    reportedAspect,
    getPostAspect,
  ]);

  const desktopFillMode: 'contain' | 'cover' =
    isDesktop && currentMediaAspect ? 'contain' : 'cover';

  useEffect(() => {
    if (!isDesktop) return;
    if (viewMode !== 'fullscreen') return;
    if (!onDesktopFullscreenStateChange) return;

    const post = filteredItems[fullscreenIndex] ?? null;
    if (!post) return;

    const isSaved = savedItemsMap[post.id] ?? post.isSaved ?? false;
    const isLiked = likedItemsMap[post.id] || false;
    const likeCount = likeCountMap[post.id] ?? post.like_count ?? 0;

    onDesktopFullscreenStateChange({
      fullscreenIndex,
      totalCount: filteredItems.length,
      currentPost: post,
      isSaved,
      isLiked,
      likeCount,
    });
  }, [
    isDesktop,
    viewMode,
    filteredItems,
    fullscreenIndex,
    savedItemsMap,
    likedItemsMap,
    likeCountMap,
    onDesktopFullscreenStateChange,
  ]);

  useEffect(() => {
    if (!isDesktop) return;
    if (!onDesktopScrollToIndex) return;

    const fn = (idx: number) => {
      if (flatListRef.current && idx >= 0 && idx < filteredItems.length) {
        try {
          flatListRef.current.scrollToIndex({ index: idx, animated: true });
          setFullscreenIndex(idx);
        } catch {
          /* noop */
        }
      }
    };

    onDesktopScrollToIndex(fn);
  }, [isDesktop, filteredItems.length, onDesktopScrollToIndex]);

  useEffect(() => {
    if (!isDesktop) return;
    if (!onDesktopRailHandlersChange) return;

    const post = filteredItems[fullscreenIndex] ?? null;
    if (!post) return;

    const isSaved = savedItemsMap[post.id] ?? post.isSaved ?? false;
    const opportunity = buildOpportunityFromPost(post, isSaved);

    onDesktopRailHandlersChange({
      onLike: () => handleLikePress(post),
      onSave: () => handleSavePress(post),
      onUser: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('UserProfile' as any, {
          userId: post.user_id,
          userName: post.user_full_name || 'User',
        });
      },
      onReviews: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isDesktop && onDesktopReviewsRequest) {
          onDesktopReviewsRequest(opportunity, post.name || 'Post');
        } else {
          setSelectedOpportunity(opportunity);
          setShowReviewsModal(true);
        }
      },
      onDirections: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isDesktop && onDesktopDirectionsRequest) {
          onDesktopDirectionsRequest(opportunity);
        } else {
          setSelectedOpportunity(opportunity);
          setShowDirectionsModal(true);
        }
      },
      onShare: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onAI: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        if (isDesktop && onDesktopAIRequest) {
          onDesktopAIRequest(opportunity);
        } else {
          setSelectedOpportunity(opportunity);
          setShowAIModal(true);
        }
      },
    });
  }, [
    isDesktop,
    filteredItems,
    fullscreenIndex,
    savedItemsMap,
    handleLikePress,
    handleSavePress,
    navigation,
    onDesktopRailHandlersChange,
    onDesktopReviewsRequest,
    onDesktopDirectionsRequest,
    onDesktopAIRequest,
  ]);

  const renderSortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSortModal(false)}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort By</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortOption,
                selectedSort === option.key && styles.sortOptionActive,
              ]}
              onPress={() => {
                setSelectedSort(option.key);
                setShowSortModal(false);
              }}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  selectedSort === option.key && styles.sortOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
              {selectedSort === option.key && (
                <Ionicons name="checkmark" size={20} color="#4A7DFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  const renderGridItem: ListRenderItem<ExplorePost> = useCallback(
    ({ item }) => <GridResultCard item={item} onPress={handleItemPress} />,
    [handleItemPress]
  );

  const ListHeader = useMemo(() => {
    return (
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {categories.map((filter) => {
            const count =
              filter.key === 'all'
                ? items.length
                : filter.key === 'products'
                ? items.filter(
                    (i) =>
                      i.detected_intent === 'sell' ||
                      i.detected_category?.toLowerCase().includes('product')
                  ).length
                : filter.key === 'services'
                ? items.filter(
                    (i) =>
                      i.detected_intent === 'service' ||
                      i.detected_category?.toLowerCase().includes('service')
                  ).length
                : items.filter(
                    (i) =>
                      i.category?.toLowerCase().replace(/\s+/g, '_') ===
                        filter.key ||
                      i.category?.toLowerCase() === filter.key ||
                      i.detected_category?.toLowerCase().replace(/\s+/g, '_') ===
                        filter.key ||
                      i.detected_category?.toLowerCase() === filter.key
                  ).length;
            return (
              <FilterChip
                key={filter.key}
                label={filter.label}
                selected={selectedFilter === filter.key}
                count={count}
                onPress={() => setSelectedFilter(filter.key)}
              />
            );
          })}
        </ScrollView>
      </View>
    );
  }, [categories, selectedFilter, items]);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.centered,
          Platform.OS === 'web' && styles.containerWeb,
        ]}
        edges={['top']}
      >
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={styles.loadingText}>Loading explore...</Text>
      </SafeAreaView>
    );
  }

  // -------- FULLSCREEN ----------
  if (viewMode === 'fullscreen' && selectedItem) {
    const allItems = filteredItems;
    const currentIndex = allItems.findIndex(
      (item) => item.id === selectedItem.id
    );
    const initialIndex = currentIndex !== -1 ? currentIndex : 0;

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToGrid}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          <Text style={styles.backButtonText}>Back to explore</Text>
        </TouchableOpacity>

        <View
          style={{ flex: 1, width: '100%' }}
          onLayout={(e) => {
            if (!isDesktop) return;
            const { width: w, height: h } = e.nativeEvent.layout;
            if (
              h > 0 &&
              (Math.abs(h - (desktopItemHeight ?? 0)) > 1 ||
                Math.abs(w - (desktopItemWidth ?? 0)) > 1)
            ) {
              setDesktopItemHeight(h);
              setDesktopItemWidth(w);
            }
          }}
        >
          <FlatList
            ref={flatListRef}
            data={allItems}
            renderItem={({ item, index }) => (
              <View
                style={{
                  height: isDesktop ? itemHeight : winHeight,
                  width: isDesktop ? itemWidth : winWidth,
                }}
              >
                <FullscreenItem
                  item={item}
                  index={index}
                  fullscreenIndex={fullscreenIndex}
                  isFocused={isFocused}
                  isDesktop={isDesktop}
                  cardWidth={isDesktop ? itemWidth : winWidth}
                  cardHeight={isDesktop ? itemHeight : winHeight}
                  isSaved={
                    savedItemsMap[item.id] !== undefined
                      ? savedItemsMap[item.id]
                      : item.isSaved || false
                  }
                  isLiked={likedItemsMap[item.id] || false}
                  likeCount={likeCountMap[item.id] ?? item.like_count ?? 0}
                  isItemLoading={loadingItemsMap[item.id] === true}
                  onShowMore={(p) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const opp = buildOpportunityFromPost(p, false);
                    if (isDesktop && onDesktopDetailsRequest) {
                      onDesktopDetailsRequest(opp);
                    } else {
                      setSelectedOpportunity(opp);
                      setShowAIModal(true);
                    }
                  }}
                  onShare={() =>
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  }
                  onSave={(p) => handleSavePress(p)}
                  onLike={(p) => handleLikePress(p)}
                  onInbox={(p) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    if (!user?.id) {
                      showStyledAlert({
                        title: '🔒 Join Munolink',
                        message:
                          'Create a free account to message sellers and providers.',
                        icon: 'lock-closed',
                        iconColor: '#4A7DFF',
                        buttons: [
                          {
                            text: 'Continue Browsing',
                            style: 'cancel',
                            onPress: hideStyledAlert,
                          },
                          {
                            text: 'Join Now',
                            style: 'primary',
                            onPress: () => {
                              hideStyledAlert();
                              navigation.navigate('Join');
                            },
                          },
                        ],
                      });
                      return;
                    }
                    navigation.navigate('Inbox', {
                      userId: p.user_id || '',
                      userName: p.user_full_name || 'User',
                    });
                  }}
                  onMediaLoadStateChange={(isLoading) =>
                    handleMediaLoadStateChange(item.id, isLoading)
                  }
                  onUserPress={(p) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('UserProfile' as any, {
                      userId: p.user_id,
                      userName: p.user_full_name || 'User',
                    });
                  }}
                  onReviewsPress={(p) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const opp = buildOpportunityFromPost(p, false);
                    if (isDesktop && onDesktopReviewsRequest) {
                      onDesktopReviewsRequest(opp, p.name || 'Post');
                    } else {
                      setSelectedOpportunity(opp);
                      setShowReviewsModal(true);
                    }
                  }}
                  onDirectionsPress={(p) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const opp = buildOpportunityFromPost(p, false);
                    if (isDesktop && onDesktopDirectionsRequest) {
                      onDesktopDirectionsRequest(opp);
                    } else {
                      setSelectedOpportunity(opp);
                      setShowDirectionsModal(true);
                    }
                  }}
                  onAIPress={(p) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    const opp = buildOpportunityFromPost(p, false);
                    if (isDesktop && onDesktopAIRequest) {
                      onDesktopAIRequest(opp);
                    } else {
                      setSelectedOpportunity(opp);
                      setShowAIModal(true);
                    }
                  }}
                  onNaturalSize={(size) => {
                    if (!isDesktop) return;
                    if (index !== fullscreenIndex) return;
                    if (size && size.width > 0 && size.height > 0) {
                      const aspect = size.width / size.height;
                      if (!aspectCacheRef.current.has(item.id)) {
                        aspectCacheRef.current.set(item.id, aspect);
                        setAspectCacheVersion((v) => v + 1);
                      }
                      setReportedAspect(aspect);
                      reportedAspectPostIdRef.current = item.id;
                    }
                  }}
                  fillMode={desktopFillMode}
                />
              </View>
            )}
            keyExtractor={(item, index) => `fullscreen-${item.id}-${index}`}
            pagingEnabled={!isDesktop}
            showsVerticalScrollIndicator={false}
            snapToInterval={isDesktop ? undefined : winHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            initialScrollIndex={initialIndex}
            getItemLayout={(data, index) => {
              const h = isDesktop ? itemHeight : winHeight;
              return {
                length: h,
                offset: h * index,
                index,
              };
            }}
            viewabilityConfig={FULLSCREEN_VIEWABILITY_CONFIG}
            onViewableItemsChanged={handleFullscreenViewableItemsChanged}
            extraData={`${fullscreenIndex}-${isFocused}-${
              isDesktop ? currentMediaAspect ?? 'na' : 'na'
            }-${Object.keys(loadingItemsMap)
              .map((k) => `${k}:${loadingItemsMap[k] ? 1 : 0}`)
              .join(',')}`}
            removeClippedSubviews={false}
            maxToRenderPerBatch={isDesktop ? 3 : 2}
            windowSize={isDesktop ? 5 : 3}
            scrollEventThrottle={16}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                try {
                  flatListRef.current?.scrollToIndex({
                    index: info.index,
                    animated: false,
                    viewPosition: 0,
                  });
                } catch {
                  /* noop */
                }
              }, 200);
            }}
          />
        </View>

        {/* ✅ Mobile-only modals. On desktop the ContextPanel
            handles reviews / directions / AI / details. */}
        {!isDesktop && (
          <>
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
                  ? `Explore: ${selectedOpportunity.title}`
                  : ''
              }
              onClose={handleCloseAI}
              isDesktopView={false}
            />

            <DirectionsBottomSheet
              visible={showDirectionsModal}
              opportunity={selectedOpportunity}
              onClose={handleCloseDirections}
              isDesktopView={false}
            />
          </>
        )}

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
    );
  }

  // -------- GRID ----------
  const numColumns = isDesktop ? DESKTOP_GRID_COLUMNS : 3;
  const gridKey = isDesktop ? 'desktop-grid-6col' : 'mobile-grid-3col';

  const showWebRefreshButton =
    Platform.OS === 'web' && !isDesktop && gridScrollY < 40;

  return (
    <SafeAreaView
      style={[
        styles.container,
        Platform.OS === 'web' && styles.containerWeb,
        isDesktop && styles.containerDesktop,
      ]}
      edges={['top']}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Explore</Text>
          {!isDesktop && (
            <TouchableOpacity
              onPress={toggleSearch}
              style={styles.searchIconButton}
            >
              <Ionicons
                name={showSearch ? 'close' : 'search'}
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.sortButtonHeader}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="options-outline" size={24} color="#4A7DFF" />
        </TouchableOpacity>
      </View>

      {showSearch && (
        <View
          style={[
            styles.searchContainer,
            isDesktop && styles.searchContainerDesktop,
          ]}
        >
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search-outline" size={20} color="#8A8AAE" />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search posts..."
              placeholderTextColor="#8A8AAE"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#8A8AAE" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <FlatList
        ref={gridListRef}
        key={gridKey}
        data={filteredItems}
        renderItem={renderGridItem}
        keyExtractor={(item, index) => `explore-${item.id}-${index}`}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.gridContainer, { paddingBottom: 100 }]}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={8}
        ListHeaderComponent={ListHeader}
        onScroll={(e) => setGridScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4A7DFF"
            colors={['#4A7DFF']}
            progressBackgroundColor="#1A2A4F"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#8A8AAE" />
            <Text style={styles.emptyTitle}>No posts found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your filters or search terms
            </Text>
          </View>
        }
        stickyHeaderIndices={[0]}
      />

      {showWebRefreshButton && (
        <TouchableOpacity
          style={styles.webRefreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
          activeOpacity={0.7}
          accessibilityLabel="Refresh explore"
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="refresh" size={22} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      )}

      {renderSortModal()}

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
export const ExploreScreen = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();

  const [viewMode, setViewMode] = useState<'grid' | 'fullscreen'>('grid');

  const [fsState, setFsState] = useState<{
    fullscreenIndex: number;
    totalCount: number;
    currentPost: ExplorePost | null;
    isSaved: boolean;
    isLiked: boolean;
    likeCount: number;
  } | null>(null);

  const scrollToFullscreenIndexRef = useRef<((idx: number) => void) | null>(
    null
  );

  const [railHandlers, setRailHandlers] = useState<{
    onLike: () => void;
    onSave: () => void;
    onUser: () => void;
    onReviews: () => void;
    onDirections: () => void;
    onShare: () => void;
    onAI: () => void;
  } | null>(null);

  // ✅ ContextPanel state — defaults to Featured (null view + AI off)
  const [contextPanelView, setContextPanelView] = useState<
    'details' | 'reviews' | 'directions' | null
  >(null);
  const [aiViewActive, setAiViewActive] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProductTitle, setSelectedProductTitle] =
    useState<string>('');

  // ✅ Reset the panel to Featured whenever the fullscreen post
  // changes (entering fullscreen, or swiping to a different post).
  const handleFullscreenIndexChange = useCallback(
    (_index: number, _postId: string) => {
      setContextPanelView(null);
      setAiViewActive(false);
      setSelectedOpportunity(null);
      setSelectedProductId('');
      setSelectedProductTitle('');
    },
    []
  );

  if (!isDesktop) {
    return (
      <ExploreContent
        navigation={navigation}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
    );
  }

  const currentPost = fsState?.currentPost || null;
  const currentOpportunity = currentPost
    ? buildOpportunityFromPost(currentPost, fsState?.isSaved || false)
    : null;

  const renderDesktopActionRail = () => {
    if (viewMode !== 'fullscreen') return null;
    if (!currentPost || !railHandlers) return null;

    return (
      <FloatingActionRail
        key={`explore-rail-${currentPost.id}`}
        opportunity={currentOpportunity!}
        bottomInset={0}
        rightShift={0}
        isLiked={fsState?.isLiked || false}
        likeCount={fsState?.likeCount || 0}
        onLikePress={railHandlers.onLike}
        onUserPress={railHandlers.onUser}
        onReviewsPress={() => {
          if (!currentOpportunity) return;
          setSelectedOpportunity(currentOpportunity);
          setSelectedProductId(currentOpportunity.id);
          setSelectedProductTitle(currentOpportunity.title || 'Post');
          setAiViewActive(false);
          setContextPanelView('reviews');
        }}
        onDirectionsPress={() => {
          if (!currentOpportunity) return;
          setSelectedOpportunity(currentOpportunity);
          setAiViewActive(false);
          setContextPanelView('directions');
        }}
        onSharePress={railHandlers.onShare}
        onAIPress={() => {
          if (!currentOpportunity) return;
          setSelectedOpportunity(currentOpportunity);
          setContextPanelView(null);
          setAiViewActive(true);
        }}
        onSavePress={railHandlers.onSave}
        isSaved={fsState?.isSaved || false}
        savedCount={currentPost.saveCount || 0}
        shareCount={currentPost.share_count || 0}
        reviewCount={currentPost.comment_count || 0}
        distance={currentPost.distance || 0}
        userAvatar={currentPost.user_avatar || null}
      />
    );
  };

  const renderDesktopNavArrows = () => {
    if (viewMode !== 'fullscreen') return null;
    if (!fsState) return null;

    const atStart = fsState.fullscreenIndex === 0;
    const atEnd = fsState.fullscreenIndex >= fsState.totalCount - 1;

    return (
      <View style={{ alignItems: 'center', gap: 8 }}>
        <TouchableOpacity
          style={[styles.navArrow, atStart && styles.navArrowDisabled]}
          onPress={() => {
            if (!atStart) {
              scrollToFullscreenIndexRef.current?.(
                fsState.fullscreenIndex - 1
              );
            }
          }}
          disabled={atStart}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-up"
            size={28}
            color={atStart ? '#555' : '#FFFFFF'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navArrow, atEnd && styles.navArrowDisabled]}
          onPress={() => {
            if (!atEnd) {
              scrollToFullscreenIndexRef.current?.(
                fsState.fullscreenIndex + 1
              );
            }
          }}
          disabled={atEnd}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-down"
            size={28}
            color={atEnd ? '#555' : '#FFFFFF'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const isGrid = viewMode === 'grid';

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0D0D1A' }}>
      <BottomSheetModalProvider>
        <ResponsiveLayout
          currentRoute="Explore"
          fullWidth={isGrid}
          hideContextPanel={isGrid}
          desktopActionRail={renderDesktopActionRail()}
          desktopNavArrows={renderDesktopNavArrows()}
          feedAspectRatio={undefined /* SceneRenderer reports it up */}
          selectedOpportunity={
            selectedOpportunity || currentOpportunity || null
          }
          featuredOpportunities={[]}
          contextPanelView={contextPanelView}
          onContextPanelViewChange={setContextPanelView}
          selectedProductId={selectedProductId}
          selectedProductTitle={selectedProductTitle}
          selectedOpportunityForModal={selectedOpportunity}
          aiViewActive={aiViewActive}
          onAIClose={() => {
            setAiViewActive(false);
            setSelectedOpportunity(null);
            setContextPanelView(null);
          }}
          aiContextHint={
            selectedOpportunity
              ? `Explore: ${selectedOpportunity.title}`
              : ''
          }
          directionsViewActive={contextPanelView === 'directions'}
          onDirectionsClose={() => {
            setContextPanelView(null);
            setSelectedOpportunity(null);
          }}
          onReviewsPress={(productId, productTitle) => {
            setSelectedProductId(productId);
            setSelectedProductTitle(productTitle || '');
            setAiViewActive(false);
            setContextPanelView('reviews');
          }}
          onShowMorePress={(opp) => {
            setSelectedOpportunity(opp);
            setAiViewActive(false);
            setContextPanelView('details');
          }}
          onSharePress={() => {
            /* handled inside ExploreContent */
          }}
          onAIPress={(opp) => {
            setSelectedOpportunity(opp);
            setContextPanelView(null);
            setAiViewActive(true);
          }}
          onCloseReviews={() => {
            setContextPanelView(null);
            setSelectedProductId('');
            setSelectedProductTitle('');
          }}
          onCloseDetails={() => {
            setContextPanelView(null);
            setSelectedOpportunity(null);
          }}
        >
          <ExploreContent
            navigation={navigation}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onDesktopFullscreenStateChange={setFsState}
            onDesktopScrollToIndex={(fn) => {
              scrollToFullscreenIndexRef.current = fn;
            }}
            onDesktopRailHandlersChange={setRailHandlers}
            onDesktopFullscreenIndexChange={handleFullscreenIndexChange}
            onDesktopReviewsRequest={(opp, title) => {
              setSelectedOpportunity(opp);
              setSelectedProductId(opp.id);
              setSelectedProductTitle(title);
              setAiViewActive(false);
              setContextPanelView('reviews');
            }}
            onDesktopDirectionsRequest={(opp) => {
              setSelectedOpportunity(opp);
              setAiViewActive(false);
              setContextPanelView('directions');
            }}
            onDesktopAIRequest={(opp) => {
              setSelectedOpportunity(opp);
              setContextPanelView(null);
              setAiViewActive(true);
            }}
            onDesktopDetailsRequest={(opp) => {
              setSelectedOpportunity(opp);
              setAiViewActive(false);
              setContextPanelView('details');
            }}
          />
        </ResponsiveLayout>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  containerDesktop: { backgroundColor: '#0D0D1A', padding: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#0D0D1A',
  },
  headerDesktop: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  searchIconButton: { padding: 4 },
  sortButtonHeader: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    minHeight: 40,
    minWidth: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0D0D1A',
    gap: 10,
  },
  searchContainerDesktop: { paddingHorizontal: 0 },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    minHeight: 44,
  },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 14, padding: 0 },

  filterContainer: {
    backgroundColor: '#0D0D1A',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    minHeight: 48,
    maxHeight: 56,
  },
  filterContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 4,
    minHeight: 32,
  },
  filterChipActive: {
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
    borderColor: '#4A7DFF',
  },
  filterChipText: { color: '#8A8AAE', fontSize: 12, fontWeight: '500' },
  filterChipTextActive: { color: '#4A7DFF' },
  filterChipBadge: {
    backgroundColor: '#4A7DFF',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  filterChipBadgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: 'bold' },

  gridContainer: { padding: 4, paddingBottom: 20 },
  gridCard: {
    flex: 1,
    margin: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1A1A2E',
    position: 'relative',
    aspectRatio: 0.9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridImagePlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 12,
    padding: 4,
    zIndex: 5,
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  gridGradient: { width: '100%', height: '100%' },
  gridInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  gridTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  gridPrice: { color: '#4A7DFF', fontSize: 13, fontWeight: '700', marginTop: 2 },
  gridShowcase: {
    color: '#6C5CE7',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  gridShop: { color: 'rgba(255,255,255,0.7)', fontSize: 11, flex: 1 },
  gridRating: { color: '#F1C40F', fontSize: 11 },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: { color: '#8A8AAE', fontSize: 14, marginTop: 4 },

  backButton: {
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
  backButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
  actionRailWrapper: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -150 }],
    zIndex: 50,
  },
  navArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  navArrowDisabled: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderColor: 'rgba(255,255,255,0.05)',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  sortOptionActive: { backgroundColor: 'rgba(74, 125, 255, 0.08)' },
  sortOptionText: { color: '#E8ECF4', fontSize: 16 },
  sortOptionTextActive: { color: '#4A7DFF', fontWeight: '500' },

  containerWeb: {
    flex: 1,
    backgroundColor: '#0D0D1A',
    height: '100dvh' as any,
    maxHeight: '100dvh' as any,
    overflow: 'hidden',
    position: 'relative' as any,
  },

  webRefreshButton: {
    position: 'absolute',
    bottom: 90,
    left: '50%',
    marginLeft: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(74, 125, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
    shadowColor: '#4A7DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});