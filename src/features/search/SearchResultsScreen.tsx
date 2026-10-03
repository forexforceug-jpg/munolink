// src/features/search/SearchResultsScreen.tsx

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
  FlatList,
  Dimensions,
  StatusBar,
  Platform,
  Image,
  useWindowDimensions,
  ScrollView,
  ActivityIndicator,
  ViewToken,
  ViewabilityConfig,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { SceneRenderer } from '../opportunity/renderer/SceneRenderer';
import { FloatingActionRail } from '../feed/components/FloatingActionRail';
import { ReviewsBottomSheet } from '../feed/components/ReviewsBottomSheet';
import { AIBottomSheet } from '../feed/components/AIBottomSheet';
import { DirectionsBottomSheet } from '../feed/components/DirectionsBottomSheet';
import { StyledAlert } from '../feed/components/StyledAlert';
import * as Haptics from 'expo-haptics';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useIsFocused } from '@react-navigation/native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FULLSCREEN_VIEWABILITY_CONFIG: ViewabilityConfig = {
  itemVisiblePercentThreshold: 60,
  minimumViewTime: 100,
};

const DESKTOP_FEED_ASPECT = 9 / 16;
const DESKTOP_FALLBACK_MAX_HEIGHT = 900;
const DESKTOP_GRID_COLUMNS = 6;

interface SearchResult {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  catalogImages: string[];
  description: string;
  rating: number | null;
  reviewCount: number | null;
  area: string | null;
  inStock: boolean;
  category: string | null;
  type: 'product' | 'service' | 'event';
  createdAt?: string;
  userId: string;
  userFullName: string;
  userAvatar: string | null;
  userLatitude: number | null;
  userLongitude: number | null;
  userPhone: string | null;
  video: string | null;
  video_thumbnail: string | null;
  video_duration: number | null;
  video_size: number | null;
  likeCount?: number;
  viewCount?: number;
  shareCount?: number;
  commentCount?: number;
  saveCount?: number;
  isSaved?: boolean;
  specifications?: any;
  relevanceScore?: number;
  aiTag?: boolean;
  price_type?: string | null;
}

interface SearchIntent {
  keywords: string[];
  categories: string[];
  priceRange: { min: number; max: number } | null;
  location: string | null;
  type: 'product' | 'service' | 'all';
  inStock: boolean;
  minRating: number;
}

interface SearchResultsScreenProps {
  route: {
    params: {
      results: SearchResult[];
      query: string;
      initialIndex?: number;
      intent?: SearchIntent;
      hasResults?: boolean;
      totalResults?: number;
      recommendationsCount?: number;
    };
  };
  navigation: any;
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

const VALID_PRICE_TYPES = [
  'fixed',
  'negotiable',
  'starting_from',
  'free',
  'showcase',
] as const;

type PriceType = typeof VALID_PRICE_TYPES[number];

function resolvePriceType(item: SearchResult): PriceType {
  const fromRow =
    typeof item.price_type === 'string' && item.price_type.length > 0
      ? item.price_type
      : null;

  const fromSpecs =
    item.specifications &&
    typeof item.specifications === 'object' &&
    typeof item.specifications.price_type === 'string' &&
    item.specifications.price_type.length > 0
      ? item.specifications.price_type
      : null;

  const raw = fromRow || fromSpecs;

  if (raw && (VALID_PRICE_TYPES as readonly string[]).includes(raw)) {
    if (
      (raw === 'fixed' || raw === 'negotiable') &&
      (!item.price || item.price <= 0)
    ) {
      return 'free';
    }
    return raw as PriceType;
  }

  if (item.price === 0 || item.price === null || item.price === undefined) {
    return 'free';
  }
  return 'fixed';
}

const FilterChip = React.memo(({ label, selected, onPress, count }: any) => (
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
));

const GridResultCard = React.memo(({ item, onPress }: any) => {
  let imageUrl = '';
  if (item.catalogImages && item.catalogImages.length > 0) {
    imageUrl = item.catalogImages[0];
  } else if (item.video_thumbnail) {
    imageUrl = item.video_thumbnail;
  } else if (item.imageUrl) {
    imageUrl = item.imageUrl;
  }

  const displayName = item.userFullName || 'User';
  const hasVideo = !!item.video;
  const priceType = resolvePriceType(item);
  const isFree = priceType === 'free';
  const isShowcase = priceType === 'showcase';
  const hasPrice =
    !isFree &&
    !isShowcase &&
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
            {item.title || 'Post'}
          </Text>

          {isFree && <Text style={styles.gridPriceFree}>Free</Text>}
          {isShowcase && (
            <Text style={styles.gridPriceShowcase}>Showcase</Text>
          )}
          {hasPrice && (
            <Text style={styles.gridPrice}>
              UGX {item.price!.toLocaleString()}
            </Text>
          )}

          <View style={styles.gridFooter}>
            <Text style={styles.gridShop} numberOfLines={1}>
              {displayName}
            </Text>
            {item.likeCount && item.likeCount > 0 && (
              <Text style={styles.gridRating}>❤️ {item.likeCount}</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const ItemMediaLoadingSpinner: React.FC = () => {
  return (
    <View style={styles.itemMediaSpinnerOverlay} pointerEvents="none">
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
};

function buildOpportunityFromResult(item: SearchResult): any {
  const effectivePriceType = resolvePriceType(item);
  const specs = (item as any).specifications || {};

  return {
    id: item.id,
    title: item.title || 'Untitled',
    price: item.price || 0,
    currency: item.currency || 'UGX',
    imageUrl: item.catalogImages?.[0] || item.imageUrl || '',
    catalogImages: item.catalogImages || [],
    description: item.description || '',
    rating: item.rating,
    reviewCount: item.reviewCount || 0,
    userLatitude: item.userLatitude || null,
    userLongitude: item.userLongitude || null,
    userPhone: item.userPhone || null,
    area: item.area || null,
    inStock: item.inStock !== false,
    category: item.category || null,
    type: item.type || 'product',
    createdAt: item.createdAt,
    userId: item.userId || '',
    userFullName: item.userFullName || 'User',
    userAvatar: item.userAvatar || null,
    video: item.video || null,
    video_thumbnail: item.video_thumbnail || null,
    video_duration: item.video_duration || null,
    video_size: item.video_size || null,
    likeCount: item.likeCount || 0,
    viewCount: item.viewCount || 0,
    shareCount: item.shareCount || 0,
    commentCount: item.commentCount || 0,
    saveCount: item.saveCount || 0,
    isSaved: item.isSaved || false,
    distance: undefined,
    specifications: {
      ...specs,
      price_type: effectivePriceType,
    },
    price_type: effectivePriceType,
  };
}

interface FullscreenItemProps {
  item: SearchResult;
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
  query: string;
  onShowMore: (item: SearchResult) => void;
  onShare: () => void;
  onSave: (item: SearchResult) => void;
  onLike: (item: SearchResult) => void;
  onInbox: (item: SearchResult) => void;
  onMediaLoadStateChange: (isLoading: boolean) => void;
  onUserPress: (item: SearchResult) => void;
  onReviewsPress: (item: SearchResult) => void;
  onDirectionsPress: (item: SearchResult) => void;
  onAIPress: (item: SearchResult) => void;
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
  const opportunity = buildOpportunityFromResult(item);

  const mediaItems: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }[] = [];
  const thumbnail =
    item.video_thumbnail ||
    item.catalogImages?.[0] ||
    item.imageUrl ||
    undefined;

  if (item.video) {
    mediaItems.push({
      type: 'video',
      url: item.video,
      thumbnail,
    });
  }

  if (item.catalogImages && item.catalogImages.length > 0) {
    for (const img of item.catalogImages) {
      if (mediaItems.some((m) => m.url === img)) continue;
      mediaItems.push({ type: 'image', url: img });
    }
  } else if (item.imageUrl && !item.video) {
    mediaItems.push({ type: 'image', url: item.imageUrl });
  }

  if (mediaItems.length === 0) {
    const placeholderText = encodeURIComponent(item.title || 'Item');
    mediaItems.push({
      type: 'image',
      url: `https://via.placeholder.com/400x400/1A2A4F/4A7DFF?text=${placeholderText.substring(
        0,
        20
      )}`,
    });
  }

  const priceType = resolvePriceType(item);
  const displayName = item.userFullName || 'User';
  const isVisible = isFocused && index === fullscreenIndex;
  const specs = (item as any).specifications || {};

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
        title={item.title || 'Product'}
        price={item.price || 0}
        priceType={priceType}
        currency={item.currency || 'UGX'}
        userName={displayName}
        filter={specs.filter ?? null}
        textOverlays={specs.text_overlays ?? null}
        userAvatar={item.userAvatar || null}
        description={item.description || null}
        rating={item.rating ?? undefined}
        area={item.area ?? undefined}
        inStock={item.inStock !== false}
        type={item.type || 'product'}
        createdAt={item.createdAt}
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
          if (__DEV__) console.log('Scene changed to:', idx, source);
        }}
        onBehavioralEvent={(event) => {
          if (__DEV__) console.log('Behavioral event:', event);
        }}
        autoPlay={true}
        autoPlayInterval={5000}
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
            savedCount={0}
            shareCount={item.shareCount || 0}
            reviewCount={0}
            distance={0}
            userAvatar={item.userAvatar || null}
          />
        </View>
      )}
    </View>
  );
};

interface SearchResultsContentProps extends SearchResultsScreenProps {
  viewMode: 'grid' | 'fullscreen';
  setViewMode: (mode: 'grid' | 'fullscreen') => void;
  onDesktopFullscreenStateChange?: (state: {
    fullscreenIndex: number;
    totalCount: number;
    currentItem: SearchResult | null;
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
    opportunity: any,
    productTitle: string
  ) => void;
  onDesktopDirectionsRequest?: (opportunity: any) => void;
  onDesktopAIRequest?: (opportunity: any) => void;
  onDesktopDetailsRequest?: (opportunity: any) => void;
}

const SearchResultsContent: React.FC<SearchResultsContentProps> = ({
  route,
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
}) => {
  const { height, width } = useWindowDimensions();
  const { isDesktop } = useBreakpoint();
  const { user } = useAuth();
  const isFocused = useIsFocused();

  const {
    results,
    query,
    initialIndex = 0,
    intent,
    hasResults = true,
    totalResults = 0,
    recommendationsCount = 0,
  } = route.params || { results: [], query: '', initialIndex: 0 };

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>(
    results
  );
  const [categories] = useState(DEFAULT_CATEGORIES);

  const flatListRef = useRef<FlatList>(null);
  const trackedViewRef = useRef<string>('');
  const currentIndexRef = useRef(initialIndex);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [fullscreenIndex, setFullscreenIndex] = useState(initialIndex);
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

  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);

  const [selectedOpportunity, setSelectedOpportunity] =
    useState<SearchResult | null>(null);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [aiContextHint, setAiContextHint] = useState('');

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
    height * 0.92,
    DESKTOP_FALLBACK_MAX_HEIGHT
  );
  const desktopFallbackWidth = desktopFallbackHeight * DESKTOP_FEED_ASPECT;

  const itemHeight = isDesktop
    ? desktopItemHeight ?? desktopFallbackHeight
    : height;
  const itemWidth = isDesktop ? desktopItemWidth ?? desktopFallbackWidth : width;

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

  const memoizedResults = useMemo(() => results, [results]);

  const getFilterCounts = useCallback(() => {
    const counts: Record<string, number> = {
      all: memoizedResults.length,
      products: memoizedResults.filter((item) => item.type === 'product')
        .length,
      services: memoizedResults.filter((item) => item.type === 'service')
        .length,
      electronics: memoizedResults.filter(
        (item) =>
          item.category?.toLowerCase().includes('electronics') ||
          item.category?.toLowerCase().includes('phone') ||
          item.category?.toLowerCase().includes('computer')
      ).length,
      fashion: memoizedResults.filter(
        (item) =>
          item.category?.toLowerCase().includes('fashion') ||
          item.category?.toLowerCase().includes('clothing')
      ).length,
      food: memoizedResults.filter(
        (item) =>
          item.category?.toLowerCase().includes('food') ||
          item.category?.toLowerCase().includes('restaurant')
      ).length,
      art: memoizedResults.filter(
        (item) =>
          item.category?.toLowerCase().includes('art') ||
          item.category?.toLowerCase().includes('craft')
      ).length,
      vehicles: memoizedResults.filter(
        (item) =>
          item.category?.toLowerCase().includes('vehicle') ||
          item.category?.toLowerCase().includes('car') ||
          item.category?.toLowerCase().includes('auto')
      ).length,
      property: memoizedResults.filter(
        (item) =>
          item.category?.toLowerCase().includes('property') ||
          item.category?.toLowerCase().includes('real estate') ||
          item.category?.toLowerCase().includes('house')
      ).length,
      jobs: memoizedResults.filter(
        (item) =>
          item.category?.toLowerCase().includes('job') ||
          item.category?.toLowerCase().includes('employment')
      ).length,
    };
    return counts;
  }, [memoizedResults]);

  const filterCounts = getFilterCounts();

  useEffect(() => {
    let filtered = [...memoizedResults];

    if (activeFilter !== 'all') {
      if (activeFilter === 'products') {
        filtered = filtered.filter((item) => item.type === 'product');
      } else if (activeFilter === 'services') {
        filtered = filtered.filter((item) => item.type === 'service');
      } else {
        filtered = filtered.filter(
          (item) =>
            item.category?.toLowerCase().includes(activeFilter) ||
            item.category?.toLowerCase().replace(/\s+/g, '_') === activeFilter
        );
      }
    }

    setFilteredResults(filtered);
  }, [activeFilter, memoizedResults]);

  useEffect(() => {
    trackedViewRef.current = '';
    currentIndexRef.current = initialIndex;
    setCurrentIndex(initialIndex);
    setFullscreenIndex(initialIndex);
  }, [results, initialIndex]);

  useEffect(() => {
    if (filteredResults.length === 0) return;

    setLoadingItemsMap((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const r of filteredResults) {
        if (next[r.id] === undefined) {
          next[r.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [filteredResults]);

  useEffect(() => {
    if (!user?.id) return;
    const postIds = filteredResults.map((r) => r.id);
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
  }, [user?.id, filteredResults]);

  const handleMediaLoadStateChange = useCallback(
    (itemId: string, isLoading: boolean) => {
      setLoadingItemsMap((prev) => {
        if (prev[itemId] === isLoading) return prev;
        return { ...prev, [itemId]: isLoading };
      });
    },
    []
  );

  const handleFilterPress = useCallback((filterKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filterKey);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleGridItemPress = useCallback(
    (item: SearchResult) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedItem(item);
      setViewMode('fullscreen');

      const index = memoizedResults.findIndex((r) => r.id === item.id);
      if (index !== -1) {
        currentIndexRef.current = index;
        setCurrentIndex(index);
        setFullscreenIndex(index);
      }
    },
    [memoizedResults, setViewMode]
  );

  const handleBackToGrid = useCallback(() => {
    setViewMode('grid');
    setSelectedItem(null);
    setFullscreenIndex(0);
  }, [setViewMode]);

  const onViewableItemsChangedRef = useRef<
    | ((info: {
        viewableItems: ViewToken<SearchResult>[];
        changed: ViewToken<SearchResult>[];
      }) => void)
    | null
  >(null);

  onViewableItemsChangedRef.current = (info) => {
    const { viewableItems } = info;
    if (!viewableItems || viewableItems.length === 0) return;

    const firstItem = viewableItems[0];
    const index = firstItem.index;

    if (index === null || index === undefined) return;
    if (index === currentIndexRef.current) return;
    if (index < 0 || index >= filteredResults.length) return;

    currentIndexRef.current = index;
    setCurrentIndex(index);
    setFullscreenIndex(index);
  };

  const handleViewableItemsChanged = useRef(
    (info: {
      viewableItems: ViewToken<SearchResult>[];
      changed: ViewToken<SearchResult>[];
    }) => {
      onViewableItemsChangedRef.current?.(info);
    }
  ).current;

  const keyExtractor = useCallback(
    (item: SearchResult, index: number) => `result-${item.id}-${index}`,
    []
  );

  const renderGridItem = useCallback(
    ({ item }: { item: SearchResult }) => (
      <GridResultCard item={item} onPress={handleGridItemPress} />
    ),
    [handleGridItemPress]
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
            const count = filterCounts[filter.key] || 0;
            return (
              <FilterChip
                key={filter.key}
                label={filter.label}
                selected={activeFilter === filter.key}
                count={count}
                onPress={() => handleFilterPress(filter.key)}
              />
            );
          })}
        </ScrollView>
      </View>
    );
  }, [categories, activeFilter, filterCounts, handleFilterPress]);

  const handleCloseAI = useCallback(() => {
    setShowAIModal(false);
    setSelectedOpportunity(null);
    setAiContextHint('');
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
    async (opportunity: any) => {
      if (!user?.id) {
        showStyledAlert({
          title: 'Join Munolink',
          message: 'Create a free account to like posts.',
          icon: 'lock-closed-outline',
          iconColor: '#4A7DFF',
          buttons: [
            { text: 'Continue Browsing', style: 'cancel', onPress: hideStyledAlert },
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
    [
      user?.id,
      likedItemsMap,
      navigation,
      showStyledAlert,
      hideStyledAlert,
    ]
  );

  // ============================================================
  // ASPECT RESOLUTION
  // ============================================================
  const getPostAspect = useCallback(
    (item: SearchResult | null | undefined) => {
      if (!item) return null;
      const cached = aspectCacheRef.current.get(item.id);
      if (cached && isFinite(cached) && cached > 0) return cached;
      return null;
    },
    []
  );

  const resolvePostAspect = useCallback(async (item: SearchResult) => {
    if (!item?.id) return;
    if (aspectCacheRef.current.has(item.id)) return;

    const url =
      (item.catalogImages && item.catalogImages[0]) ||
      item.video_thumbnail ||
      item.imageUrl ||
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
        aspectCacheRef.current.set(item.id, size.width / size.height);
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
    const end = Math.min(filteredResults.length - 1, fullscreenIndex + 3);
    for (let i = start; i <= end; i++) {
      const post = filteredResults[i];
      if (post) resolvePostAspect(post);
    }
  }, [
    isDesktop,
    viewMode,
    filteredResults,
    fullscreenIndex,
    resolvePostAspect,
  ]);

  useEffect(() => {
    if (!isDesktop) {
      setCurrentMediaAspect(null);
      return;
    }
    const post = filteredResults[fullscreenIndex] ?? null;
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
    filteredResults,
    fullscreenIndex,
    aspectCacheVersion,
    reportedAspect,
    getPostAspect,
  ]);

  const desktopFillMode: 'contain' | 'cover' =
    isDesktop && currentMediaAspect ? 'contain' : 'cover';

  // ============================================================
  // Report fullscreen state upward
  // ============================================================
  useEffect(() => {
    if (!isDesktop) return;
    if (viewMode !== 'fullscreen') return;
    if (!onDesktopFullscreenStateChange) return;

    const item = filteredResults[fullscreenIndex] ?? null;
    if (!item) return;

    const isSaved = savedItemsMap[item.id] ?? item.isSaved ?? false;
    const isLiked = likedItemsMap[item.id] || false;
    const likeCount = likeCountMap[item.id] ?? item.likeCount ?? 0;

    onDesktopFullscreenStateChange({
      fullscreenIndex,
      totalCount: filteredResults.length,
      currentItem: item,
      isSaved,
      isLiked,
      likeCount,
    });
  }, [
    isDesktop,
    viewMode,
    filteredResults,
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
      if (flatListRef.current && idx >= 0 && idx < filteredResults.length) {
        try {
          flatListRef.current.scrollToIndex({ index: idx, animated: true });
          setFullscreenIndex(idx);
          setCurrentIndex(idx);
        } catch {
          /* noop */
        }
      }
    };

    onDesktopScrollToIndex(fn);
  }, [isDesktop, filteredResults.length, onDesktopScrollToIndex]);

  useEffect(() => {
    if (!isDesktop) return;
    if (!onDesktopRailHandlersChange) return;

    const item = filteredResults[fullscreenIndex] ?? null;
    if (!item) return;

    const isSaved = savedItemsMap[item.id] ?? item.isSaved ?? false;
    const opportunity = buildOpportunityFromResult(item);

    onDesktopRailHandlersChange({
      onLike: () => handleLikePress(opportunity),
      onSave: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSavedItemsMap((prev) => ({
          ...prev,
          [item.id]: !(prev[item.id] ?? item.isSaved ?? false),
        }));
      },
      onUser: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('UserProfile', {
          userId: item.userId || '',
          userName: item.userFullName || 'User',
        });
      },
      onReviews: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isDesktop && onDesktopReviewsRequest) {
          onDesktopReviewsRequest(opportunity, item.title || 'Post');
        } else {
          setSelectedOpportunity(item);
          setShowReviewsModal(true);
        }
      },
      onDirections: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isDesktop && onDesktopDirectionsRequest) {
          onDesktopDirectionsRequest(opportunity);
        } else {
          setSelectedOpportunity(item);
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
          setSelectedOpportunity(item);
          setAiContextHint(`Search results for "${query}"`);
          setShowAIModal(true);
        }
      },
    });
  }, [
    isDesktop,
    filteredResults,
    fullscreenIndex,
    savedItemsMap,
    likedItemsMap,
    likeCountMap,
    query,
    handleLikePress,
    navigation,
    onDesktopRailHandlersChange,
    onDesktopReviewsRequest,
    onDesktopDirectionsRequest,
    onDesktopAIRequest,
  ]);

  if (!memoizedResults) {
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
        <Text style={styles.loadingText}>Loading results...</Text>
      </SafeAreaView>
    );
  }

  if (memoizedResults.length === 0) {
    return (
      <SafeAreaView
        style={[
          styles.emptyContainer,
          Platform.OS === 'web' && styles.containerWeb,
        ]}
        edges={['top']}
      >
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
        <TouchableOpacity
          style={styles.emptyBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          <Text style={styles.emptyBackText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.emptyContent}>
          <Ionicons name="search-outline" size={64} color="#8A8AAE" />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtext}>
            Try adjusting your search terms
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (viewMode === 'fullscreen') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToGrid}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          <Text style={styles.backButtonText}>Back to results</Text>
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
            data={filteredResults}
            renderItem={({ item, index }) => (
              <View
                style={{
                  height: isDesktop ? itemHeight : height,
                  width: isDesktop ? itemWidth : width,
                }}
              >
                <FullscreenItem
                  item={item}
                  index={index}
                  fullscreenIndex={fullscreenIndex}
                  isFocused={isFocused}
                  isDesktop={isDesktop}
                  cardWidth={isDesktop ? itemWidth : width}
                  cardHeight={isDesktop ? itemHeight : height}
                  isSaved={savedItemsMap[item.id] || false}
                  isLiked={likedItemsMap[item.id] || false}
                  likeCount={likeCountMap[item.id] ?? item.likeCount ?? 0}
                  isItemLoading={loadingItemsMap[item.id] === true}
                  query={query}
                  onShowMore={(p) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const opp = buildOpportunityFromResult(p);
                    if (isDesktop && onDesktopDetailsRequest) {
                      onDesktopDetailsRequest(opp);
                    } else {
                      setSelectedOpportunity(p);
                    }
                  }}
                  onShare={() =>
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  }
                  onSave={(p) => {
                    if (!user?.id) {
                      showStyledAlert({
                        title: 'Join Munolink',
                        message: 'Create a free account to save items.',
                        icon: 'lock-closed-outline',
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
                    setSavedItemsMap((prev) => ({
                      ...prev,
                      [p.id]: !(prev[p.id] ?? p.isSaved ?? false),
                    }));
                  }}
                  onLike={(p) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleLikePress(buildOpportunityFromResult(p));
                  }}
                  onInbox={(p) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    if (!user?.id) {
                      showStyledAlert({
                        title: 'Join Munolink',
                        message:
                          'Create a free account to message sellers and providers.',
                        icon: 'lock-closed-outline',
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
                      userId: p.userId || '',
                      userName: p.userFullName || 'User',
                    });
                  }}
                  onMediaLoadStateChange={(isLoading) =>
                    handleMediaLoadStateChange(item.id, isLoading)
                  }
                  onUserPress={(p) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('UserProfile', {
                      userId: p.userId || '',
                      userName: p.userFullName || 'User',
                    });
                  }}
                  onReviewsPress={(p) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const opp = buildOpportunityFromResult(p);
                    if (isDesktop && onDesktopReviewsRequest) {
                      onDesktopReviewsRequest(opp, p.title || 'Post');
                    } else {
                      setSelectedOpportunity(p);
                      setShowReviewsModal(true);
                    }
                  }}
                  onDirectionsPress={(p) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const opp = buildOpportunityFromResult(p);
                    if (isDesktop && onDesktopDirectionsRequest) {
                      onDesktopDirectionsRequest(opp);
                    } else {
                      setSelectedOpportunity(p);
                      setShowDirectionsModal(true);
                    }
                  }}
                  onAIPress={(p) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    const opp = buildOpportunityFromResult(p);
                    if (isDesktop && onDesktopAIRequest) {
                      onDesktopAIRequest(opp);
                    } else {
                      setSelectedOpportunity(p);
                      setAiContextHint(`Search results for "${query}"`);
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
            keyExtractor={keyExtractor}
            pagingEnabled={!isDesktop}
            showsVerticalScrollIndicator={false}
            snapToInterval={isDesktop ? undefined : height}
            snapToAlignment="start"
            decelerationRate="fast"
            viewabilityConfig={FULLSCREEN_VIEWABILITY_CONFIG}
            onViewableItemsChanged={handleViewableItemsChanged}
            getItemLayout={(data, index) => {
              const h = isDesktop ? itemHeight : height;
              return {
                length: h,
                offset: h * index,
                index,
              };
            }}
            initialScrollIndex={currentIndex}
            extraData={`${fullscreenIndex}-${isFocused}-${
              isDesktop ? currentMediaAspect ?? 'na' : 'na'
            }-${Object.keys(loadingItemsMap)
              .map((k) => `${k}:${loadingItemsMap[k] ? 1 : 0}`)
              .join(',')}`}
            removeClippedSubviews={false}
            maxToRenderPerBatch={isDesktop ? 3 : 2}
            windowSize={isDesktop ? 5 : 3}
            onScrollToIndexFailed={() => {}}
            scrollEventThrottle={16}
            style={styles.list}
          />
        </View>

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
              opportunity={selectedOpportunity as any}
              contextHint={aiContextHint}
              onClose={handleCloseAI}
              isDesktopView={false}
            />

            <DirectionsBottomSheet
              visible={showDirectionsModal}
              opportunity={selectedOpportunity as any}
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

  const numColumns = isDesktop ? DESKTOP_GRID_COLUMNS : 3;
  const gridKey = isDesktop ? 'desktop-grid-6col' : 'mobile-grid';

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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButtonHeader}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {query || 'Search'}
          </Text>
        </View>
        <Text style={styles.headerSubtitle}>{filteredResults.length}</Text>
      </View>

      {intent &&
        (intent.keywords.length > 0 ||
          intent.categories.length > 0 ||
          intent.priceRange ||
          intent.location) && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.intentContainer}
            contentContainerStyle={styles.intentContent}
          >
            {intent.keywords.length > 0 && (
              <View style={styles.intentChip}>
                <Ionicons name="search" size={12} color="#4A7DFF" />
                <Text style={styles.intentChipText}>
                  {intent.keywords.join(', ')}
                </Text>
              </View>
            )}
            {intent.categories.length > 0 && (
              <View style={styles.intentChip}>
                <Ionicons name="pricetag" size={12} color="#4A7DFF" />
                <Text style={styles.intentChipText}>
                  {intent.categories.join(', ')}
                </Text>
              </View>
            )}
            {intent.priceRange && (
              <View style={styles.intentChip}>
                <Ionicons name="cash" size={12} color="#4A7DFF" />
                <Text style={styles.intentChipText}>
                  UGX {intent.priceRange.min.toLocaleString()} -{' '}
                  {intent.priceRange.max.toLocaleString()}
                </Text>
              </View>
            )}
            {intent.location && (
              <View style={styles.intentChip}>
                <Ionicons name="location" size={12} color="#4A7DFF" />
                <Text style={styles.intentChipText}>{intent.location}</Text>
              </View>
            )}
            {intent.inStock && (
              <View style={styles.intentChip}>
                <Ionicons
                  name="checkmark-circle"
                  size={12}
                  color="#2ECC71"
                />
                <Text style={styles.intentChipText}>In Stock</Text>
              </View>
            )}
            {intent.minRating > 0 && (
              <View style={styles.intentChip}>
                <Ionicons name="star" size={12} color="#F1C40F" />
                <Text style={styles.intentChipText}>
                  {intent.minRating}+ Stars
                </Text>
              </View>
            )}
          </ScrollView>
        )}

      <FlatList
        key={gridKey}
        data={filteredResults}
        renderItem={renderGridItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContainer}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={8}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyGrid}>
            <Ionicons name="filter-outline" size={48} color="#8A8AAE" />
            <Text style={styles.emptyGridTitle}>No {activeFilter} found</Text>
            <Text style={styles.emptyGridSubtitle}>
              Try adjusting your filter
            </Text>
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => handleFilterPress('all')}
            >
              <Text style={styles.clearFilterButtonText}>Show all results</Text>
            </TouchableOpacity>
          </View>
        }
        stickyHeaderIndices={[0]}
      />

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
export const SearchResultsScreen = ({
  route,
  navigation,
}: SearchResultsScreenProps) => {
  const { isDesktop } = useBreakpoint();

  const [viewMode, setViewMode] = useState<'grid' | 'fullscreen'>('grid');

  const [fsState, setFsState] = useState<{
    fullscreenIndex: number;
    totalCount: number;
    currentItem: SearchResult | null;
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

  const [contextPanelView, setContextPanelView] = useState<
    'details' | 'reviews' | 'directions' | null
  >(null);
  const [aiViewActive, setAiViewActive] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<any | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProductTitle, setSelectedProductTitle] =
    useState<string>('');

  if (!isDesktop) {
    return (
      <SearchResultsContent
        route={route}
        navigation={navigation}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
    );
  }

  const currentItem = fsState?.currentItem || null;
  const currentOpportunity = currentItem
    ? buildOpportunityFromResult(currentItem)
    : null;

  const renderDesktopActionRail = () => {
    if (viewMode !== 'fullscreen') return null;
    if (!currentItem || !railHandlers) return null;

    return (
      <FloatingActionRail
        key={`search-rail-${currentItem.id}`}
        opportunity={currentOpportunity}
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
        savedCount={0}
        shareCount={currentItem.shareCount || 0}
        reviewCount={0}
        distance={0}
        userAvatar={currentItem.userAvatar || null}
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
          currentRoute="Search"
          fullWidth={isGrid}
          hideContextPanel={isGrid}
          desktopActionRail={renderDesktopActionRail()}
          desktopNavArrows={renderDesktopNavArrows()}
          feedAspectRatio={undefined}
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
              ? `Search: ${selectedOpportunity.title}`
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
            /* handled inside SearchResultsContent */
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
          <SearchResultsContent
            route={route}
            navigation={navigation}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onDesktopFullscreenStateChange={setFsState}
            onDesktopScrollToIndex={(fn) => {
              scrollToFullscreenIndexRef.current = fn;
            }}
            onDesktopRailHandlersChange={setRailHandlers}
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

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  containerDesktop: { backgroundColor: '#0D0D1A', padding: 24 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D1A',
    padding: 20,
  },
  loadingText: { color: '#8A8AAE', fontSize: 14, marginTop: 12 },
  list: { flex: 1, backgroundColor: '#0D0D1A' },

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
  headerDesktop: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 12,
  },
  containerWeb: {
    flex: 1,
    backgroundColor: '#0D0D1A',
    height: '100dvh' as any,
    maxHeight: '100dvh' as any,
    overflow: 'hidden',
    position: 'relative' as any,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButtonHeader: { padding: 4 },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  headerSubtitle: { color: '#8A8AAE', fontSize: 14, marginLeft: 8 },

  intentContainer: {
    backgroundColor: 'rgba(13, 13, 26, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 4,
  },
  intentContent: {
    paddingHorizontal: 16,
    gap: 6,
    alignItems: 'center',
  },
  intentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
    marginRight: 4,
  },
  intentChipText: { color: '#8A8AAE', fontSize: 10 },

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
  gridPriceFree: {
    color: '#2ECC71',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  gridPriceShowcase: {
    color: '#6C5CE7',
    fontSize: 13,
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

  emptyGrid: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyGridTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyGridSubtitle: { color: '#8A8AAE', fontSize: 14, marginTop: 4 },
  clearFilterButton: {
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  clearFilterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

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

  emptyContainer: { flex: 1, backgroundColor: '#0D0D1A' },
  emptyBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    gap: 8,
  },
  emptyBackText: { color: '#FFFFFF', fontSize: 16 },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: { color: '#8A8AAE', fontSize: 14, marginTop: 8 },
});