// src/features/search/SearchResultsScreen.tsx

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
  Image,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useAuth } from '../../context/AuthContext';
import { SceneEngine, OpportunityFormatter, SceneRenderer } from '../opportunity';
import { FloatingActionRail } from '../feed/components/FloatingActionRail';
import { ReviewsBottomSheet } from '../feed/components/ReviewsBottomSheet';
import { AIBottomSheet } from '../feed/components/AIBottomSheet';
import { DirectionsBottomSheet } from '../feed/components/DirectionsBottomSheet';
import { SimpleDetailsModal } from '../feed/components/SimpleDetailsModal';
import * as Haptics from 'expo-haptics';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Opportunity as RawOpportunity } from '../../services/feed.service';
import { recommendationService } from '../../services/recommendation.service';
import { mapItemType } from '../../utils/typeHelpers';
import { ViewabilityConfig, ViewToken } from 'react-native';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// --- Types ---
interface SearchResult extends RawOpportunity {
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

// --- Filter Types ---
type FilterType = 'all' | 'products' | 'services' | 'shops' | 'providers';

interface FilterOption {
  key: FilterType;
  label: string;
  icon: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'all', label: 'All', icon: 'apps-outline' },
  { key: 'products', label: 'Products', icon: 'cube-outline' },
  { key: 'services', label: 'Services', icon: 'construct-outline' },
  { key: 'shops', label: 'Shops', icon: 'storefront-outline' },
  { key: 'providers', label: 'Providers', icon: 'people-outline' },
];

// ============================================================
// IMAGE HELPER
// ============================================================

const getItemImage = (item: any): string => {
  try {
    const normalizedOpportunity = OpportunityFormatter.format(item);
    const engine = new SceneEngine(normalizedOpportunity);
    const scenes = engine.compose();

    for (const scene of scenes) {
      if (scene.type === 'hero' && scene.image) {
        return scene.image;
      }
      if (scene.type === 'gallery' && scene.data?.images && scene.data.images.length > 0) {
        return scene.data.images[0];
      }
      if (scene.type === 'details' && scene.image) {
        return scene.image;
      }
      if (scene.type === 'trust' && scene.image) {
        return scene.image;
      }
    }

    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      const img = item.images[0];
      if (img && img.startsWith('http')) return img;
    }
    if (item.image && item.image.startsWith('http')) return item.image;
    if (item.image_url && item.image_url.startsWith('http')) return item.image_url;
    if (item.logo_url && item.logo_url.startsWith('http')) return item.logo_url;

    const productName = item.title || 'Product';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(productName)}&background=4A7DFF&color=fff&size=200&font-size=0.33`;
  } catch (error) {
    const productName = item.title || 'Product';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(productName)}&background=4A7DFF&color=fff&size=200&font-size=0.33`;
  }
};

// --- Sub-components ---

// Filter Chip Component
const FilterChip = React.memo(({ option, isActive, onPress, count }: any) => (
  <TouchableOpacity
    style={[
      styles.filterChip,
      isActive && styles.filterChipActive,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons 
      name={option.icon} 
      size={16} 
      color={isActive ? '#FFFFFF' : '#8A8AAE'} 
    />
    <Text style={[
      styles.filterChipText,
      isActive && styles.filterChipTextActive,
    ]}>
      {option.label}
    </Text>
    {count !== undefined && count > 0 && (
      <View style={[
        styles.filterChipBadge,
        isActive && styles.filterChipBadgeActive,
      ]}>
        <Text style={[
          styles.filterChipBadgeText,
          isActive && styles.filterChipBadgeTextActive,
        ]}>
          {count}
        </Text>
      </View>
    )}
  </TouchableOpacity>
));

// Grid Result Card - NO BADGES
const GridResultCard = React.memo(({ item, onPress }: any) => {
  const imageUrl = getItemImage(item);

  return (
    <TouchableOpacity 
      style={styles.gridCard} 
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: imageUrl }} 
        style={styles.gridImage}
        resizeMode="cover"
      />
      <View style={styles.gridOverlay}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.gridGradient}
        />
        <View style={styles.gridInfo}>
          <Text style={styles.gridTitle} numberOfLines={1}>{item.title || 'Product'}</Text>
          <Text style={styles.gridPrice}>UGX {item.price?.toLocaleString() || '0'}</Text>
          <View style={styles.gridFooter}>
            <Text style={styles.gridShop} numberOfLines={1}>{item.shopName || 'Shop'}</Text>
            {item.rating && item.rating > 0 && (
              <Text style={styles.gridRating}>⭐ {item.rating.toFixed(1)}</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ============================================================
// SEARCH RESULTS CONTENT
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

  // State
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>(results);
  
  // Refs for stable values
  const flatListRef = useRef<FlatList>(null);
  const trackedViewRef = useRef<string>('');
  const currentIndexRef = useRef(initialIndex);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [savedItemsMap, setSavedItemsMap] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'fullscreen'>('grid');
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  
  // Modal states
  const [selectedOpportunity, setSelectedOpportunity] = useState<SearchResult | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [aiContextHint, setAiContextHint] = useState('');

  // Memoized results
  const memoizedResults = useMemo(() => results, [results]);

  // Get counts for each filter
  const getFilterCounts = useCallback(() => {
    const counts = {
      all: memoizedResults.length,
      products: memoizedResults.filter(item => item.type === 'product').length,
      services: memoizedResults.filter(item => item.type === 'service').length,
      shops: new Set(memoizedResults.map(item => item.shopId || item.shopName).filter(Boolean)).size,
      providers: new Set(memoizedResults.map(item => item.shopId || item.shopName).filter(Boolean)).size,
    };
    return counts;
  }, [memoizedResults]);

  const filterCounts = getFilterCounts();

  // Apply filter
  useEffect(() => {
    let filtered = [...memoizedResults];
    
    switch (activeFilter) {
      case 'products':
        filtered = filtered.filter(item => item.type === 'product');
        break;
      case 'services':
        filtered = filtered.filter(item => item.type === 'service');
        break;
      case 'shops':
        const shopMap = new Map();
        filtered.forEach(item => {
          const key = item.shopId || item.shopName;
          if (key && !shopMap.has(key)) {
            shopMap.set(key, { ...item });
          }
        });
        filtered = Array.from(shopMap.values());
        break;
      case 'providers':
        const providerMap = new Map();
        filtered.forEach(item => {
          const key = item.shopName || item.shopId;
          if (key && !providerMap.has(key)) {
            providerMap.set(key, { ...item });
          }
        });
        filtered = Array.from(providerMap.values());
        break;
      default:
        break;
    }
    
    setFilteredResults(filtered);
  }, [activeFilter, memoizedResults]);

  // Reset tracked view when results change
  useEffect(() => {
    trackedViewRef.current = '';
    currentIndexRef.current = initialIndex;
    setCurrentIndex(initialIndex);
  }, [results, initialIndex]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleFilterPress = useCallback((filterKey: FilterType) => {
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
    
    if (user?.id) {
      recommendationService.trackInteraction(
        user.id,
        item.id,
        'view',
        mapItemType(item.type)
      ).catch(() => {});
    }
  }, [memoizedResults, user?.id]);

  const handleBackToGrid = useCallback(() => {
    setViewMode('grid');
    setSelectedItem(null);
  }, []);

  // STABLE: onViewableItemsChanged
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

    const item = filteredResults[index];
    if (item && user?.id && trackedViewRef.current !== item.id) {
      trackedViewRef.current = item.id;
      recommendationService.trackInteraction(
        user.id,
        item.id,
        'view',
        mapItemType(item.type)
      ).catch(() => {});
    }
  }, [filteredResults, user?.id]);

  // STABLE: viewabilityConfig
  const viewabilityConfig = useMemo<ViewabilityConfig>(() => ({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300,
  }), []);

  // STABLE: keyExtractor
  const keyExtractor = useCallback((item: SearchResult, index: number) => {
    return `result-${item.id}-${index}`;
  }, []);

  // STABLE: getItemLayout
  const getItemLayout = useCallback((data: any, index: number) => {
    const itemHeight = isDesktop ? height : height;
    return {
      length: itemHeight,
      offset: itemHeight * index,
      index,
    };
  }, [isDesktop, height]);

  // STABLE: renderGridItem
  const renderGridItem = useCallback(
    ({ item }: { item: SearchResult }) => (
      <GridResultCard item={item} onPress={handleGridItemPress} />
    ),
    [handleGridItemPress]
  );

  // STABLE: renderFullScreenItem
  const renderFullScreenItem = useCallback(
    ({ item }: { item: SearchResult }) => {
      if (!item) return null;
      
      const isSaved = savedItemsMap[item.id] || false;

      const normalizedOpportunity = OpportunityFormatter.format(item);
      const engine = new SceneEngine(normalizedOpportunity);
      const scenes = engine.compose();

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
            scenes={scenes}
            title={item.title || 'Product'}
            price={item.price || 0}
            shopName={item.shopName || 'Shop'}
            rating={item.rating ?? undefined}
            area={item.area ?? undefined}
            inStock={item.inStock}
            currency={item.currency || 'UGX'}
            isDesktop={isDesktop}
            onPrimaryAction={() => {
              navigation.navigate('ShopProfile', {
                shopId: item.shopId,
                shopName: item.shopName,
              });
            }}
            onShare={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (user?.id) {
                recommendationService.trackInteraction(
                  user.id,
                  item.id,
                  'share',
                  mapItemType(item.type)
                ).catch(() => {});
              }
            }}
            onSave={() => {
              if (!user?.id) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const currentSaved = savedItemsMap[item.id] || false;
              const newSaved = !currentSaved;
              setSavedItemsMap(prev => ({ ...prev, [item.id]: newSaved }));
              recommendationService.trackInteraction(
                user.id,
                item.id,
                newSaved ? 'save' : 'unsave',
                mapItemType(item.type)
              ).catch(() => {});
            }}
            onShowMore={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedOpportunity(item);
              setShowDetailsModal(true);
              if (user?.id) {
                recommendationService.trackInteraction(
                  user.id,
                  item.id,
                  'view',
                  mapItemType(item.type)
                ).catch(() => {});
              }
            }}
            onSceneChange={(index) => {
              if (__DEV__) {
                console.log('Scene changed to:', index);
              }
            }}
            width={cardWidth}
            height={cardHeight}
            autoPlay={false}
            autoPlayInterval={9000}
            resetKey={item.id}
          />

          <View style={styles.actionRailWrapper}>
            <FloatingActionRail
              key={`rail-${item.id}`}
              opportunity={item}
              onShopPress={(shopId) => {
                navigation.navigate('ShopProfile', {
                  shopId,
                  shopName: item.shopName,
                });
              }}
              onReviewsPress={(productId) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const found = filteredResults.find(r => r.id === productId);
                if (found) {
                  setSelectedOpportunity(found);
                  setShowReviewsModal(true);
                }
              }}
              onDirectionsPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowDirectionsModal(true);
              }}
              onSharePress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (user?.id) {
                  recommendationService.trackInteraction(
                    user.id,
                    item.id,
                    'share',
                    mapItemType(item.type)
                  ).catch(() => {});
                }
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
                recommendationService.trackInteraction(
                  user.id,
                  item.id,
                  newSaved ? 'save' : 'unsave',
                  mapItemType(item.type)
                ).catch(() => {});
              }}
              isSaved={isSaved}
              savedCount={item.savedCount || 0}
              shareCount={item.shareCount || 0}
              reviewCount={item.reviewCount || 0}
              distance={item.distance || 0}
              shopLogo={item.shopLogo || null}
            />
          </View>
        </View>
      );
    },
    [
      isDesktop,
      width,
      height,
      navigation,
      user?.id,
      savedItemsMap,
      filteredResults,
      query,
    ]
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

  const handleCloseDetails = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedOpportunity(null);
  }, []);

  // ============================================================
  // EMPTY STATE
  // ============================================================

  if (!memoizedResults || memoizedResults.length === 0) {
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

            <SimpleDetailsModal
              visible={showDetailsModal}
              opportunity={selectedOpportunity}
              onClose={handleCloseDetails}
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
              contextHint={aiContextHint}
              onClose={handleCloseAI}
              isDesktopView={false}
            />

            <DirectionsBottomSheet
              visible={showDirectionsModal}
              opportunity={selectedOpportunity}
              onClose={handleCloseDirections}
              isDesktopView={false}
            />
          </SafeAreaView>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    );
  }

  // ============================================================
  // GRID VIEW (Default)
  // ============================================================

  const numColumns = isDesktop ? 4 : 2;
  const gridKey = isDesktop ? 'desktop-grid' : 'mobile-grid';
  const hasFilters = filteredResults.length !== memoizedResults.length;
  const hasDirectResults = totalResults > 0;

  return (
    <SafeAreaView style={[styles.container, isDesktop && styles.containerDesktop]}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {query}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {hasDirectResults 
              ? `${totalResults} matches found` 
              : `Showing ${memoizedResults.length} recommendations`}
            {recommendationsCount > 0 && hasDirectResults && ` + ${recommendationsCount} recommendations`}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerViewToggle} onPress={() => {
          setCurrentIndex(0);
          setViewMode('fullscreen');
        }}>
          <Ionicons name="expand-outline" size={22} color="#4A7DFF" />
          <Text style={styles.headerViewToggleText}>Full</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {FILTER_OPTIONS.map((option) => (
          <FilterChip
            key={option.key}
            option={option}
            isActive={activeFilter === option.key}
            onPress={() => handleFilterPress(option.key)}
            count={filterCounts[option.key]}
          />
        ))}
      </ScrollView>

      {/* Results Count with Intent Info */}
      <View style={styles.resultsCountContainer}>
        <Text style={styles.resultsCountText}>
          Showing {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'}
          {!hasDirectResults && ` (${recommendationsCount || 0} recommendations included)`}
          {hasFilters && ` (filtered from ${memoizedResults.length})`}
        </Text>
        {activeFilter !== 'all' && (
          <TouchableOpacity onPress={() => handleFilterPress('all')}>
            <Text style={styles.clearFilterText}>Clear filter</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Intent Info - Show what was parsed from the query */}
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

      {/* Grid FlatList */}
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
        ListEmptyComponent={
          <View style={styles.noResults}>
            <Ionicons name="filter-outline" size={48} color="#8A8AAE" />
            <Text style={styles.noResultsTitle}>No {activeFilter} found</Text>
            <Text style={styles.noResultsSubtext}>Try adjusting your filter</Text>
            <TouchableOpacity 
              style={styles.clearFilterButton}
              onPress={() => handleFilterPress('all')}
            >
              <Text style={styles.clearFilterButtonText}>Show all results</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          recommendationsCount > 0 && !hasDirectResults ? (
            <View style={styles.recommendationFooter}>
              <Ionicons name="bulb-outline" size={20} color="#F1C40F" />
              <Text style={styles.recommendationFooterText}>
                Showing {recommendationsCount} recommended items based on your search
              </Text>
            </View>
          ) : null
        }
      />

      {/* Modals */}
      <SimpleDetailsModal
        visible={showDetailsModal}
        opportunity={selectedOpportunity}
        onClose={handleCloseDetails}
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
        contextHint={aiContextHint}
        onClose={handleCloseAI}
        isDesktopView={false}
      />

      <DirectionsBottomSheet
        visible={showDirectionsModal}
        opportunity={selectedOpportunity}
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
    // Desktop specific styles - padding handled by ResponsiveLayout
  },
  list: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(13, 13, 26, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerBack: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 1,
  },
  headerViewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(74, 125, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerViewToggleText: {
    color: '#4A7DFF',
    fontSize: 12,
    fontWeight: '500',
  },

  // Intent chips
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

  // Filters
  filterContainer: {
    maxHeight: 52,
    backgroundColor: 'rgba(13, 13, 26, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 4,
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 3,
    minHeight: 30,
  },
  filterChipActive: {
    backgroundColor: '#4A7DFF',
    borderColor: '#4A7DFF',
  },
  filterChipText: {
    color: '#8A8AAE',
    fontSize: 12,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterChipBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  filterChipBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterChipBadgeText: {
    color: '#8A8AAE',
    fontSize: 9,
    fontWeight: '600',
  },
  filterChipBadgeTextActive: {
    color: '#FFFFFF',
  },

  // Results count
  resultsCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(13, 13, 26, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  resultsCountText: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  clearFilterText: {
    color: '#4A7DFF',
    fontSize: 12,
    fontWeight: '500',
  },

  // Grid
  gridContainer: {
    padding: 8,
    paddingBottom: 20,
  },
  gridCard: {
    flex: 1,
    margin: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1A1A2E',
    position: 'relative',
    aspectRatio: 0.9,
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

  // Recommendation footer
  recommendationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    backgroundColor: 'rgba(241, 196, 15, 0.05)',
    borderRadius: 8,
    marginHorizontal: 8,
    marginTop: 8,
  },
  recommendationFooterText: {
    color: '#8A8AAE',
    fontSize: 12,
    textAlign: 'center',
  },

  // Empty state
  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  noResultsSubtext: {
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

  // Fullscreen
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

  // Empty State
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