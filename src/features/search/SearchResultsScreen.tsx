// src/features/search/SearchResultsScreen.tsx

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useAuth } from '../../context/AuthContext';
import { SceneRenderer } from '../opportunity/renderer/SceneRenderer';
import { FloatingActionRail } from '../feed/components/FloatingActionRail';
import { ReviewsBottomSheet } from '../feed/components/ReviewsBottomSheet';
import { AIBottomSheet } from '../feed/components/AIBottomSheet';
import { DirectionsBottomSheet } from '../feed/components/DirectionsBottomSheet';
import * as Haptics from 'expo-haptics';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ViewabilityConfig, ViewToken } from 'react-native';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// --- Types ---
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

// --- Filter Categories (10+ categories like Explore) ---
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
// HELPER: GET ITEM IMAGE
// ============================================================

const getItemImage = (item: SearchResult): string => {
  if (item.catalogImages && item.catalogImages.length > 0) {
    return item.catalogImages[0];
  }
  if (item.imageUrl) {
    return item.imageUrl;
  }
  if (item.video_thumbnail) {
    return item.video_thumbnail;
  }
  const productName = item.title || 'Product';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(productName)}&background=4A7DFF&color=fff&size=200&font-size=0.33`;
};

// ============================================================
// SUB-COMPONENTS - FILTER CHIP (Matches Explore)
// ============================================================

const FilterChip = React.memo(({ label, selected, onPress, count }: any) => (
  <TouchableOpacity
    style={[styles.filterChip, selected && styles.filterChipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
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
// GRID RESULT CARD - NO PRICE BADGE
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
  const hasPrice = item.price !== undefined && item.price !== null && item.price > 0;

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
          <Text style={styles.gridTitle} numberOfLines={1}>{item.title || 'Post'}</Text>
          {hasPrice && (
            <Text style={styles.gridPrice}>UGX {item.price!.toLocaleString()}</Text>
          )}
          <View style={styles.gridFooter}>
            <Text style={styles.gridShop} numberOfLines={1}>{displayName}</Text>
            {item.likeCount && item.likeCount > 0 && (
              <Text style={styles.gridRating}>❤️ {item.likeCount}</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ============================================================
// MAIN SEARCH RESULTS CONTENT
// ============================================================

const SearchResultsContent = ({ route, navigation }: SearchResultsScreenProps) => {
  const { height, width } = useWindowDimensions();
  const { isDesktop } = useBreakpoint();
  const { user } = useAuth();

  const { 
    results, 
    query, 
    initialIndex = 0, 
    intent,
    hasResults = true,
    totalResults = 0,
    recommendationsCount = 0
  } = route.params || { results: [], query: '', initialIndex: 0 };

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>(results);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  
  const flatListRef = useRef<FlatList>(null);
  const trackedViewRef = useRef<string>('');
  const currentIndexRef = useRef(initialIndex);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [savedItemsMap, setSavedItemsMap] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'fullscreen'>('grid');
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  
  const [selectedOpportunity, setSelectedOpportunity] = useState<SearchResult | null>(null);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [aiContextHint, setAiContextHint] = useState('');

  const memoizedResults = useMemo(() => results, [results]);

  // Get filter counts for badges
  const getFilterCounts = useCallback(() => {
    const counts: Record<string, number> = {
      all: memoizedResults.length,
      products: memoizedResults.filter(item => item.type === 'product').length,
      services: memoizedResults.filter(item => item.type === 'service').length,
      electronics: memoizedResults.filter(item => 
        item.category?.toLowerCase().includes('electronics') ||
        item.category?.toLowerCase().includes('phone') ||
        item.category?.toLowerCase().includes('computer')
      ).length,
      fashion: memoizedResults.filter(item => 
        item.category?.toLowerCase().includes('fashion') ||
        item.category?.toLowerCase().includes('clothing')
      ).length,
      food: memoizedResults.filter(item => 
        item.category?.toLowerCase().includes('food') ||
        item.category?.toLowerCase().includes('restaurant')
      ).length,
      art: memoizedResults.filter(item => 
        item.category?.toLowerCase().includes('art') ||
        item.category?.toLowerCase().includes('craft')
      ).length,
      vehicles: memoizedResults.filter(item => 
        item.category?.toLowerCase().includes('vehicle') ||
        item.category?.toLowerCase().includes('car') ||
        item.category?.toLowerCase().includes('auto')
      ).length,
      property: memoizedResults.filter(item => 
        item.category?.toLowerCase().includes('property') ||
        item.category?.toLowerCase().includes('real estate') ||
        item.category?.toLowerCase().includes('house')
      ).length,
      jobs: memoizedResults.filter(item => 
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
        filtered = filtered.filter(item => item.type === 'product');
      } else if (activeFilter === 'services') {
        filtered = filtered.filter(item => item.type === 'service');
      } else {
        filtered = filtered.filter(item => 
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
  }, [results, initialIndex]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleFilterPress = useCallback((filterKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filterKey);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleGridItemPress = useCallback((item: SearchResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedItem(item);
    setViewMode('fullscreen');
    
    const index = memoizedResults.findIndex(r => r.id === item.id);
    if (index !== -1) {
      currentIndexRef.current = index;
      setCurrentIndex(index);
    }
  }, [memoizedResults]);

  const handleBackToGrid = useCallback(() => {
    setViewMode('grid');
    setSelectedItem(null);
  }, []);

  // ============================================================
  // VIEWABILITY
  // ============================================================

  const onViewableItemsChanged = useCallback((info: { viewableItems: ViewToken<SearchResult>[]; changed: ViewToken<SearchResult>[] }) => {
    const { viewableItems } = info;
    if (!viewableItems || viewableItems.length === 0) return;

    const firstItem = viewableItems[0];
    const index = firstItem.index;
    
    if (index === null || index === undefined) return;
    if (index === currentIndexRef.current) return;
    if (index < 0 || index >= filteredResults.length) return;

    currentIndexRef.current = index;
    setCurrentIndex(index);
  }, [filteredResults]);

  const viewabilityConfig = useMemo<ViewabilityConfig>(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300,
  }), []);

  const keyExtractor = useCallback((item: SearchResult, index: number) => {
    return `result-${item.id}-${index}`;
  }, []);

  const getItemLayout = useCallback((data: any, index: number) => {
    const itemHeight = isDesktop ? height : height;
    return {
      length: itemHeight,
      offset: itemHeight * index,
      index,
    };
  }, [isDesktop, height]);

  // ============================================================
  // RENDER GRID ITEM
  // ============================================================

  const renderGridItem = useCallback(
    ({ item }: { item: SearchResult }) => (
      <GridResultCard item={item} onPress={handleGridItemPress} />
    ),
    [handleGridItemPress]
  );

  // ============================================================
  // LIST HEADER - 10+ Categories like Explore
  // ============================================================

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

  // ============================================================
  // RENDER FULLSCREEN ITEM
  // ============================================================

  const renderFullScreenItem = useCallback(
    ({ item }: { item: SearchResult }) => {
      if (!item) return null;
      
      const isSaved = savedItemsMap[item.id] || false;

      // Build media array
      const mediaItems = [];
      const thumbnail = item.video_thumbnail || item.catalogImages?.[0] || item.imageUrl || undefined;
      
      if (item.video) {
        mediaItems.push({ 
          type: 'video' as const, 
          url: item.video,
          thumbnail: thumbnail
        });
      }
      
      if (item.catalogImages && item.catalogImages.length > 0) {
        for (const img of item.catalogImages) {
          if (mediaItems.some(m => m.url === img)) continue;
          mediaItems.push({ type: 'image' as const, url: img });
        }
      } else if (item.imageUrl && !item.video) {
        mediaItems.push({ type: 'image' as const, url: item.imageUrl });
      }
      
      if (mediaItems.length === 0) {
        const placeholderText = encodeURIComponent(item.title || 'Item');
        mediaItems.push({ 
          type: 'image' as const, 
          url: `https://via.placeholder.com/400x400/1A2A4F/4A7DFF?text=${placeholderText.substring(0, 20)}` 
        });
      }

      // Get price type for badge
      let priceType: 'fixed' | 'negotiable' | 'starting_from' | 'free' = 'fixed';
      if (item.price === 0 || item.price === null) {
        priceType = 'free';
      } else if (item.specifications && typeof item.specifications === 'object') {
        if (item.specifications.price_type) {
          priceType = item.specifications.price_type;
        }
      }

      const displayName = item.userFullName || 'User';

      const cardWidth = isDesktop ? 420 : width;
      const cardHeight = isDesktop ? height : height;

      // Build Opportunity object for FloatingActionRail
      const opportunity = {
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
      };

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
            onShowMore={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedOpportunity(item);
            }}
            onShare={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                userId: item.userId || '',
                userName: item.userFullName || 'User',
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
            autoPlayInterval={9000}
            resetKey={item.id}
            bottomOffset={0}
          />

          <View style={styles.actionRailWrapper}>
            <FloatingActionRail
              key={`rail-${item.id}`}
              opportunity={opportunity}
              onUserPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('UserProfile', {
                  userId: item.userId || '',
                  userName: item.userFullName || 'User',
                });
              }}
              onReviewsPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedOpportunity(item);
                setShowReviewsModal(true);
              }}
              onDirectionsPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedOpportunity(item);
                setShowDirectionsModal(true);
              }}
              onSharePress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              onAIPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setSelectedOpportunity(item);
                setAiContextHint(`Search results for "${query}"`);
                setShowAIModal(true);
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
              shareCount={item.shareCount || 0}
              reviewCount={0}
            />
          </View>
        </View>
      );
    },
    [isDesktop, width, height, navigation, user?.id, savedItemsMap, query]
  );

  // ============================================================
  // MODAL HANDLERS
  // ============================================================

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

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (!memoizedResults) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={styles.loadingText}>Loading results...</Text>
      </SafeAreaView>
    );
  }

  // ============================================================
  // EMPTY STATE
  // ============================================================

  if (memoizedResults.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
        <TouchableOpacity style={styles.emptyBackButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          <Text style={styles.emptyBackText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.emptyContent}>
          <Ionicons name="search-outline" size={64} color="#8A8AAE" />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search terms</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================
  // FULLSCREEN VIEW
  // ============================================================

  if (viewMode === 'fullscreen') {
    return (
      <GestureHandlerRootView style={styles.container}>
        <BottomSheetModalProvider>
          <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

            <TouchableOpacity style={styles.backButton} onPress={handleBackToGrid}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              <Text style={styles.backButtonText}>Back to results</Text>
            </TouchableOpacity>

            <FlatList
              ref={flatListRef}
              data={filteredResults}
              renderItem={renderFullScreenItem}
              keyExtractor={keyExtractor}
              pagingEnabled={!isDesktop}
              showsVerticalScrollIndicator={false}
              snapToInterval={isDesktop ? undefined : height}
              snapToAlignment="start"
              decelerationRate="fast"
              viewabilityConfig={viewabilityConfig}
              onViewableItemsChanged={onViewableItemsChanged}
              getItemLayout={getItemLayout}
              initialScrollIndex={currentIndex}
              removeClippedSubviews={true}
              maxToRenderPerBatch={isDesktop ? 3 : 1}
              windowSize={isDesktop ? 5 : 2}
              onScrollToIndexFailed={() => {}}
              scrollEventThrottle={32}
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

  // ============================================================
  // GRID VIEW - MATCHES EXPLORE SCREEN STYLE
  // ============================================================

  const numColumns = isDesktop ? 4 : 3;
  const gridKey = isDesktop ? 'desktop-grid' : 'mobile-grid';

  return (
    <SafeAreaView style={[styles.container, isDesktop && styles.containerDesktop]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      {/* Header with Search Query - Shows the search term instead of "Results" */}
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonHeader}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {query || 'Search'}
          </Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {filteredResults.length}
        </Text>
      </View>

      {/* Intent Chips - Show detected search intent */}
      {intent && (intent.keywords.length > 0 || intent.categories.length > 0 || intent.priceRange || intent.location) && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.intentContainer}
          contentContainerStyle={styles.intentContent}
        >
          {intent.keywords.length > 0 && (
            <View style={styles.intentChip}>
              <Ionicons name="search" size={12} color="#4A7DFF" />
              <Text style={styles.intentChipText}>{intent.keywords.join(', ')}</Text>
            </View>
          )}
          {intent.categories.length > 0 && (
            <View style={styles.intentChip}>
              <Ionicons name="pricetag" size={12} color="#4A7DFF" />
              <Text style={styles.intentChipText}>{intent.categories.join(', ')}</Text>
            </View>
          )}
          {intent.priceRange && (
            <View style={styles.intentChip}>
              <Ionicons name="cash" size={12} color="#4A7DFF" />
              <Text style={styles.intentChipText}>
                UGX {intent.priceRange.min.toLocaleString()} - {intent.priceRange.max.toLocaleString()}
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
              <Ionicons name="checkmark-circle" size={12} color="#2ECC71" />
              <Text style={styles.intentChipText}>In Stock</Text>
            </View>
          )}
          {intent.minRating > 0 && (
            <View style={styles.intentChip}>
              <Ionicons name="star" size={12} color="#F1C40F" />
              <Text style={styles.intentChipText}>{intent.minRating}+ Stars</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Main Grid with Sticky Filters */}
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
            <Text style={styles.emptyGridSubtext}>Try adjusting your filter</Text>
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
// MAIN COMPONENT (Wrapped with ResponsiveLayout)
// ============================================================

export const SearchResultsScreen = ({ route, navigation }: SearchResultsScreenProps) => {
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
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  containerDesktop: {
    backgroundColor: '#0D0D1A',
    padding: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D1A',
    padding: 20,
  },
  loadingText: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 12,
  },
  list: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },

  // ============================================================
  // HEADER - Shows search query instead of "Results"
  // ============================================================
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
  backButtonHeader: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  headerSubtitle: {
    color: '#8A8AAE',
    fontSize: 14,
    marginLeft: 8,
  },

  // ============================================================
  // INTENT CHIPS
  // ============================================================
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
  intentChipText: {
    color: '#8A8AAE',
    fontSize: 10,
  },

  // ============================================================
  // FILTERS - 10+ Categories, Sticky
  // ============================================================
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
  filterChipText: {
    color: '#8A8AAE',
    fontSize: 12,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#4A7DFF',
  },
  filterChipBadge: {
    backgroundColor: '#4A7DFF',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  filterChipBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },

  // ============================================================
  // GRID STYLES (Matches Explore)
  // ============================================================
  gridContainer: {
    padding: 4,
    paddingBottom: 20,
  },
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
  gridGradient: {
    width: '100%',
    height: '100%',
  },
  gridInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  gridTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  gridPrice: {
    color: '#4A7DFF',
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
  gridShop: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    flex: 1,
  },
  gridRating: {
    color: '#F1C40F',
    fontSize: 11,
  },

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
  emptyGridSubtext: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 4,
  },
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

  // ============================================================
  // FULLSCREEN STYLES
  // ============================================================
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
  backButtonText: {
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

  // ============================================================
  // EMPTY STATE
  // ============================================================
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  emptyBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    gap: 8,
  },
  emptyBackText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
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
  emptySubtext: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 8,
  },
});