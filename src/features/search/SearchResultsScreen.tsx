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

// ============================================================
// TYPES
// ============================================================
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
  /** ✅ Carried through from the catalog row (or specifications) */
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

// ============================================================
// ✅ HELPER: Resolve effective price type for a SearchResult
//    Priority:
//      1. item.price_type (catalog row)
//      2. item.specifications.price_type (legacy rows)
//      3. 'free' if price is 0 / null / undefined
//      4. 'fixed' fallback
// ============================================================
const VALID_PRICE_TYPES = [
  'fixed',
  'negotiable',
  'starting_from',
  'free',
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
    // If it says fixed but price is 0/undefined → free
    if (raw === 'fixed' && (!item.price || item.price <= 0)) {
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

// ============================================================
// GRID RESULT CARD
// ✅ Now shows "Free" for free items, price for others.
// ============================================================
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
  const hasPrice =
    !isFree &&
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

          {isFree ? (
            <Text style={styles.gridPriceFree}>Free</Text>
          ) : hasPrice ? (
            <Text style={styles.gridPrice}>
              UGX {item.price!.toLocaleString()}
            </Text>
          ) : null}

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

// ============================================================
// HELPER: build Opportunity from SearchResult
// ✅ Now carries price_type through.
// ============================================================
function buildOpportunityFromResult(item: SearchResult): any {
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
    specifications: item.specifications || {},
    // ✅ NEW
    price_type: item.price_type ?? null,
  };
}

// ============================================================
// FULLSCREEN ITEM
// ============================================================
interface FullscreenItemProps {
  item: SearchResult;
  index: number;
  fullscreenIndex: number;
  isFocused: boolean;
  isDesktop: boolean;
  winWidth: number;
  winHeight: number;
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
}

const FullscreenItem: React.FC<FullscreenItemProps> = ({
  item,
  index,
  fullscreenIndex,
  isFocused,
  isDesktop,
  winWidth,
  winHeight,
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

  // ✅ Resolve price type — single source of truth
  const priceType = resolvePriceType(item);

  const displayName = item.userFullName || 'User';
  const cardWidth = isDesktop ? 420 : winWidth;
  const cardHeight = isDesktop ? winHeight : winHeight;

  const isVisible = isFocused && index === fullscreenIndex;

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
        // ✅ Correctly-resolved price type
        priceType={priceType}
        currency={item.currency || 'UGX'}
        userName={displayName}
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
          savedCount={0}
          shareCount={item.shareCount || 0}
          reviewCount={0}
          distance={0}
          userAvatar={item.userAvatar || null}
        />
      </View>
    </View>
  );
};

// ============================================================
// MAIN CONTENT
// ============================================================
const SearchResultsContent = ({
  route,
  navigation,
}: SearchResultsScreenProps) => {
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

  // ✅ Likes
  const [likedItemsMap, setLikedItemsMap] = useState<Record<string, boolean>>(
    {}
  );
  const [likeCountMap, setLikeCountMap] = useState<Record<string, number>>({});

  const [loadingItemsMap, setLoadingItemsMap] = useState<
    Record<string, boolean>
  >({});

  const [viewMode, setViewMode] = useState<'grid' | 'fullscreen'>('grid');
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);

  const [selectedOpportunity, setSelectedOpportunity] =
    useState<SearchResult | null>(null);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [aiContextHint, setAiContextHint] = useState('');

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

  // ✅ Prefetch likes
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
    [memoizedResults]
  );

  const handleBackToGrid = useCallback(() => {
    setViewMode('grid');
    setSelectedItem(null);
    setFullscreenIndex(0);
  }, []);

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

  const getItemLayout = useCallback(
    (data: any, index: number) => {
      const itemHeight = isDesktop ? height : height;
      return {
        length: itemHeight,
        offset: itemHeight * index,
        index,
      };
    },
    [isDesktop, height]
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

  // ✅ Toggle like
  const handleLikePress = useCallback(
    async (opportunity: any) => {
      if (!user?.id) {
        navigation.navigate('Join');
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
    [user?.id, likedItemsMap, navigation]
  );

  if (!memoizedResults) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={styles.loadingText}>Loading results...</Text>
      </SafeAreaView>
    );
  }

  if (memoizedResults.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
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
      <GestureHandlerRootView style={styles.container}>
        <BottomSheetModalProvider>
          <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToGrid}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              <Text style={styles.backButtonText}>Back to results</Text>
            </TouchableOpacity>

            <FlatList
              ref={flatListRef}
              data={filteredResults}
              renderItem={({ item, index }) => (
                <FullscreenItem
                  item={item}
                  index={index}
                  fullscreenIndex={fullscreenIndex}
                  isFocused={isFocused}
                  isDesktop={isDesktop}
                  winWidth={width}
                  winHeight={height}
                  isSaved={savedItemsMap[item.id] || false}
                  isLiked={likedItemsMap[item.id] || false}
                  likeCount={likeCountMap[item.id] ?? item.likeCount ?? 0}
                  isItemLoading={loadingItemsMap[item.id] === true}
                  query={query}
                  onShowMore={(p) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedOpportunity(p);
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
                    handleLikePress(buildOpportunityFromResult(p));
                  }}
                  onInbox={(p) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    if (!user?.id) {
                      navigation.navigate('Join');
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
                    setSelectedOpportunity(p);
                    setShowReviewsModal(true);
                  }}
                  onDirectionsPress={(p) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedOpportunity(p);
                    setShowDirectionsModal(true);
                  }}
                  onAIPress={(p) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    setSelectedOpportunity(p);
                    setAiContextHint(`Search results for "${query}"`);
                    setShowAIModal(true);
                  }}
                />
              )}
              keyExtractor={keyExtractor}
              pagingEnabled={!isDesktop}
              showsVerticalScrollIndicator={false}
              snapToInterval={isDesktop ? undefined : height}
              snapToAlignment="start"
              decelerationRate="fast"
              viewabilityConfig={FULLSCREEN_VIEWABILITY_CONFIG}
              onViewableItemsChanged={handleViewableItemsChanged}
              getItemLayout={getItemLayout}
              initialScrollIndex={currentIndex}
              extraData={`${fullscreenIndex}-${isFocused}-${Object.keys(
                loadingItemsMap
              )
                .map((k) => `${k}:${loadingItemsMap[k] ? 1 : 0}`)
                .join(',')}`}
              removeClippedSubviews={false}
              maxToRenderPerBatch={isDesktop ? 3 : 2}
              windowSize={isDesktop ? 5 : 3}
              onScrollToIndexFailed={() => {}}
              scrollEventThrottle={16}
              style={styles.list}
            />

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
          </SafeAreaView>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    );
  }

  const numColumns = isDesktop ? 4 : 3;
  const gridKey = isDesktop ? 'desktop-grid' : 'mobile-grid';

  return (
    <SafeAreaView
      style={[styles.container, isDesktop && styles.containerDesktop]}
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

  return (
    <ResponsiveLayout
      currentRoute="Search"
      onNavigate={(route) => navigation?.navigate(route)}
      floatingActions={null}
      hideContextPanel={true}
      fullWidth={true}
    >
      <SearchResultsContent route={route} navigation={navigation} />
    </ResponsiveLayout>
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
  // ✅ Green "Free" label
  gridPriceFree: {
    color: '#2ECC71',
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