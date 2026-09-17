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
  price_type?: string | null;
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
    const hasPrice =
      item.price !== undefined && item.price !== null && item.price > 0;

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

interface FullscreenItemProps {
  item: ExplorePost;
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
  const opportunity = buildOpportunityFromPost(item, isSaved);

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
        priceType={item.price_type as any}
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
          userAvatar={item.user_avatar || null}
        />
      </View>
    </View>
  );
};

const ExploreContent = ({ navigation }: any) => {
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
  const [viewMode, setViewMode] = useState<'grid' | 'fullscreen'>('grid');
  const [selectedItem, setSelectedItem] = useState<ExplorePost | null>(null);
  const [savedItemsMap, setSavedItemsMap] = useState<Record<string, boolean>>(
    {}
  );

  // ✅ Likes
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

  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);

  const flatListRef = useRef<FlatList>(null);
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
          specifications: opp.specifications || {},
                price_type:
        (opp as any).price_type ??
        (opp.specifications && (opp.specifications as any).price_type) ??
        null,
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

  // ✅ Prefetch likes
  useEffect(() => {
    if (!user?.id) return;
    const postIds = filteredItems.map((o) => o.id);
    if (postIds.length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          // `likes` is not present in the generated Supabase database types.
          .from('likes' as any)
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
    },
    [filteredItems]
  );

  const handleBackToGrid = useCallback(() => {
    setViewMode('grid');
    setSelectedItem(null);
    setFullscreenIndex(0);
  }, []);

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

  // ✅ Toggle like
  const handleLikePress = useCallback(
    async (opportunity: Opportunity) => {
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
      <SafeAreaView style={[styles.container, styles.centered]} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={styles.loadingText}>Loading explore...</Text>
      </SafeAreaView>
    );
  }

  if (viewMode === 'fullscreen' && selectedItem) {
    const allItems = filteredItems;
    const currentIndex = allItems.findIndex(
      (item) => item.id === selectedItem.id
    );
    const initialIndex = currentIndex !== -1 ? currentIndex : 0;

    return (
      <GestureHandlerRootView style={styles.container}>
        <BottomSheetModalProvider>
          <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToGrid}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              <Text style={styles.backButtonText}>Back to explore</Text>
            </TouchableOpacity>

            <FlatList
              ref={flatListRef}
              data={allItems}
              renderItem={({ item, index }) => (
                <View style={{ height: winHeight, width: winWidth }}>
                  <FullscreenItem
                    item={item}
                    index={index}
                    fullscreenIndex={fullscreenIndex}
                    isFocused={isFocused}
                    isDesktop={isDesktop}
                    winWidth={winWidth}
                    winHeight={winHeight}
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
                      setSelectedOpportunity(buildOpportunityFromPost(p, false));
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
                      handleLikePress(buildOpportunityFromPost(p, false));
                    }}
                    onInbox={(p) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      if (!user?.id) {
                        navigation.navigate('Join');
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
                      setSelectedOpportunity(buildOpportunityFromPost(p, false));
                      setShowReviewsModal(true);
                    }}
                    onDirectionsPress={(p) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedOpportunity(buildOpportunityFromPost(p, false));
                      setShowDirectionsModal(true);
                    }}
                    onAIPress={(p) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      setSelectedOpportunity(buildOpportunityFromPost(p, false));
                      setShowAIModal(true);
                    }}
                  />
                </View>
              )}
              keyExtractor={(item, index) => `fullscreen-${item.id}-${index}`}
              pagingEnabled={!isDesktop}
              showsVerticalScrollIndicator={false}
              snapToInterval={winHeight}
              snapToAlignment="start"
              decelerationRate="fast"
              initialScrollIndex={initialIndex}
              getItemLayout={(data, index) => ({
                length: winHeight,
                offset: winHeight * index,
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
                  ? `Explore: ${selectedOpportunity.title}`
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
        key={gridKey}
        data={filteredItems}
        renderItem={renderGridItem}
        keyExtractor={(item, index) => `explore-${item.id}-${index}`}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContainer}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={8}
        ListHeaderComponent={ListHeader}
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

      {renderSortModal()}
    </SafeAreaView>
  );
};

export const ExploreScreen = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();

  return (
    <ResponsiveLayout
      currentRoute="Explore"
      onNavigate={(route) => navigation?.navigate(route)}
      floatingActions={null}
      hideContextPanel={true}
      fullWidth={true}
    >
      <ExploreContent navigation={navigation} />
    </ResponsiveLayout>
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
});