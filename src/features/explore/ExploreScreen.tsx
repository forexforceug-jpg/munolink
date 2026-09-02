// src/features/explore/ExploreScreen.tsx

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { SceneEngine, OpportunityFormatter, SceneRenderer } from '../opportunity';
import { FloatingActionRail } from '../feed/components/FloatingActionRail';
import { ReviewsBottomSheet } from '../feed/components/ReviewsBottomSheet';
import { AIBottomSheet } from '../feed/components/AIBottomSheet';
import { DirectionsBottomSheet } from '../feed/components/DirectionsBottomSheet';
import { SimpleDetailsModal } from '../feed/components/SimpleDetailsModal';
import { Opportunity as RawOpportunity } from '../../services/feed.service';
import * as Haptics from 'expo-haptics';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

const { width, height } = Dimensions.get('window');

// --- Types ---
interface ExploreItem extends RawOpportunity {
  type: 'product' | 'service';
  image: string;
  shopName: string;
  price: number;
  rating: number;
  category: string;
  providerName?: string;
}

// --- Filter Categories (Dynamic from DB) ---
const DEFAULT_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'products', label: 'Products' },
  { key: 'services', label: 'Services' },
  { key: 'electronics', label: 'Electronics' },
  { key: 'fashion', label: 'Fashion' },
  { key: 'groceries', label: 'Groceries' },
  { key: 'construction', label: 'Construction' },
  { key: 'automotive', label: 'Automotive' },
  { key: 'health', label: 'Health' },
  { key: 'education', label: 'Education' },
  { key: 'hospitality', label: 'Hospitality' },
];

const sortOptions = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'price_low', label: 'Price: Low to High' },
  { key: 'price_high', label: 'Price: High to Low' },
  { key: 'rating', label: 'Top Rated' },
];

// --- Sub-components ---

const FilterChip = ({ label, selected, onPress, count }: any) => (
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
);

// Grid Result Card
const GridResultCard = React.memo(({ item, onPress }: any) => {
  const imageUrl = item.image || item.imageUrl || '';
  const displayName = item.type === 'service' ? item.providerName || item.shopName : item.shopName;

  return (
    <TouchableOpacity 
      style={styles.gridCard} 
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: imageUrl || 'https://via.placeholder.com/200/4A7DFF/FFFFFF?text=No+Image' }} 
        style={styles.gridImage}
        resizeMode="cover"
      />
      <View style={styles.gridOverlay}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.gridGradient}
        />
        <View style={styles.gridInfo}>
          <Text style={styles.gridTitle} numberOfLines={1}>{item.title || 'Item'}</Text>
          <Text style={styles.gridPrice}>UGX {item.price?.toLocaleString() || '0'}</Text>
          <View style={styles.gridFooter}>
            <Text style={styles.gridShop} numberOfLines={1}>{displayName || 'Shop'}</Text>
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
// MAIN EXPLORE CONTENT
// ============================================================

const ExploreContent = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();
  const { user } = useAuth();
  const { height, width } = useWindowDimensions();

  const [items, setItems] = useState<ExploreItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ExploreItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('relevance');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSortModal, setShowSortModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'fullscreen'>('grid');
  const [selectedItem, setSelectedItem] = useState<ExploreItem | null>(null);
  const [savedItemsMap, setSavedItemsMap] = useState<Record<string, boolean>>({});
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  
  // Modal states
  const [selectedOpportunity, setSelectedOpportunity] = useState<ExploreItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const searchInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ============================================================
  // FETCH CATEGORIES
  // ============================================================
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name, slug')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        const categoryOptions = [
          { key: 'all', label: 'All' },
          { key: 'products', label: 'Products' },
          { key: 'services', label: 'Services' },
          ...data.map((cat: any) => ({
            key: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '_'),
            label: cat.name,
          })),
        ];
        setCategories(categoryOptions);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  // ============================================================
  // FETCH DATA
  // ============================================================
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch products with shop info
      const { data: productsData, error: productsError } = await supabase
        .from('shop_products')
        .select('*, catalog: catalog_id(*), shop: shop_id(id, name, rating)')
        .eq('in_stock', true)
        .order('created_at', { ascending: false })
        .limit(50);

      let allItems: ExploreItem[] = [];

      if (!productsError && productsData) {
        const productItems = productsData.map((p: any) => ({
          id: p.catalog_id,
          title: p.catalog?.name || 'Product',
          shopName: p.shop?.name || 'Shop',
          shopId: p.shop_id,
          price: p.regular_price || 0,
          currency: 'UGX',
          image: p.catalog?.images?.[0] || '',
          catalogImages: p.catalog?.images || [],
          description: p.catalog?.description || '',
          specifications: p.catalog?.specifications || {},
          rating: p.shop?.rating || 0,
          reviewCount: 0,
          area: null,
          inStock: p.in_stock !== false,
          category: p.catalog?.category || 'Uncategorized',
          type: 'product' as const,
          imageUrl: p.catalog?.images?.[0] || '',
          shopLogo: null,
        }));
        allItems = [...allItems, ...productItems];
      }

      // Fetch services with user/provider info
      const { data: servicesData, error: servicesError } = await supabase
        .from('provider_services')
        .select('*, service: service_id(*), user: user_id(id, full_name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!servicesError && servicesData) {
        const serviceItems = servicesData.map((s: any) => ({
          id: s.service_id,
          title: s.service?.name || 'Service',
          shopName: s.user?.full_name || 'Provider',
          providerName: s.user?.full_name || 'Provider',
          shopId: s.user_id,
          price: s.price || 0,
          currency: 'UGX',
          image: s.service?.images?.[0] || '',
          catalogImages: s.service?.images || [],
          description: s.service?.description || '',
          specifications: s.service?.specifications || {},
          rating: 0,
          reviewCount: 0,
          area: null,
          inStock: s.is_active !== false,
          category: s.service?.category || 'Uncategorized',
          type: 'service' as const,
          imageUrl: s.service?.images?.[0] || '',
          shopLogo: null,
          duration: s.service?.duration || null,
        }));
        allItems = [...allItems, ...serviceItems];
      }

      // Shuffle and set
      const shuffled = allItems.sort(() => Math.random() - 0.5);
      setItems(shuffled);
      setFilteredItems(shuffled);
    } catch (error) {
      console.error('Error fetching explore data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, [fetchData, fetchCategories]);

  // ============================================================
  // FILTERS AND SORTING
  // ============================================================
  const applyFilters = useCallback(() => {
    let result = [...items];

    // Filter by category
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'products') {
        result = result.filter(item => item.type === 'product');
      } else if (selectedFilter === 'services') {
        result = result.filter(item => item.type === 'service');
      } else {
        result = result.filter(item => 
          item.category?.toLowerCase().replace(/\s+/g, '_') === selectedFilter ||
          item.category?.toLowerCase() === selectedFilter
        );
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(item =>
        item.title?.toLowerCase().includes(query) ||
        item.shopName?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (selectedSort) {
      case 'price_low':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_high':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        break;
    }

    setFilteredItems(result);
  }, [items, selectedFilter, selectedSort, searchQuery]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleItemPress = useCallback((item: ExploreItem) => {
    Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
    setSelectedItem(item);
    setViewMode('fullscreen');
  }, []);

  const handleBackToGrid = useCallback(() => {
    setViewMode('grid');
    setSelectedItem(null);
  }, []);

  // ============================================================
  // FULLSCREEN RENDER
  // ============================================================
  const renderFullScreenItem = useCallback((item: ExploreItem) => {
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
          title={item.title || 'Item'}
          price={item.price || 0}
          shopName={item.type === 'service' ? item.providerName || item.shopName : item.shopName}
          rating={item.rating ?? undefined}
          area={item.area ?? undefined}
          inStock={item.inStock}
          currency={item.currency || 'UGX'}
          isDesktop={isDesktop}
          providerName={item.type === 'service' ? item.providerName || item.shopName : undefined}
          type={item.type}
          onPrimaryAction={() => {
            navigation.navigate('ShopProfile', {
              shopId: item.shopId,
              shopName: item.shopName,
            });
          }}
          onShare={() => {
            Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
          }}
          onSave={() => {
            if (!user?.id) return;
            Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
            const currentSaved = savedItemsMap[item.id] || false;
            const newSaved = !currentSaved;
            setSavedItemsMap(prev => ({ ...prev, [item.id]: newSaved }));
          }}
          onShowMore={() => {
            Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
            setSelectedOpportunity(item);
            setShowDetailsModal(true);
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
              Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
              setShowReviewsModal(true);
            }}
            onDirectionsPress={() => {
              Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
              setShowDirectionsModal(true);
            }}
            onSharePress={() => {
              Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
            }}
            onAIPress={() => {
              Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Heavy);
              setSelectedOpportunity(item);
              setShowAIModal(true);
            }}
            onSavePress={() => {
              if (!user?.id) return;
              Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
              const currentSaved = savedItemsMap[item.id] || false;
              const newSaved = !currentSaved;
              setSavedItemsMap(prev => ({ ...prev, [item.id]: newSaved }));
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
  }, [isDesktop, width, height, navigation, user?.id, savedItemsMap]);

  // ============================================================
  // MODAL HANDLERS
  // ============================================================
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

  const handleCloseDetails = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedOpportunity(null);
  }, []);

  // ============================================================
  // SORT MODAL
  // ============================================================
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
              <Text style={[
                styles.sortOptionText,
                selectedSort === option.key && styles.sortOptionTextActive,
              ]}>
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

  // ============================================================
  // LOADING / EMPTY STATES
  // ============================================================
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={styles.loadingText}>Loading explore...</Text>
      </SafeAreaView>
    );
  }

  // ============================================================
  // FULLSCREEN VIEW
  // ============================================================
  if (viewMode === 'fullscreen' && selectedItem) {
    const allItems = filteredItems;
    const currentIndex = allItems.findIndex(item => item.id === selectedItem.id);
    const initialIndex = currentIndex !== -1 ? currentIndex : 0;

    return (
      <GestureHandlerRootView style={styles.container}>
        <BottomSheetModalProvider>
          <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

            <TouchableOpacity style={styles.backButton} onPress={handleBackToGrid}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              <Text style={styles.backButtonText}>Back to explore</Text>
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
              contextHint={`Explore item: ${selectedOpportunity?.title}`}
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

  // ============================================================
  // GRID VIEW
  // ============================================================
  const numColumns = isDesktop ? 4 : 2;
  const gridKey = isDesktop ? 'desktop-grid' : 'mobile-grid';

  return (
    <SafeAreaView style={[styles.container, isDesktop && styles.containerDesktop]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      {/* Desktop Header */}
      {isDesktop && (
        <View style={styles.desktopHeader}>
          <Text style={styles.desktopHeaderTitle}>Explore</Text>
          <Text style={styles.desktopHeaderSubtitle}>Discover products and services</Text>
        </View>
      )}

      {/* Mobile Header */}
      {!isDesktop && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
        </View>
      )}

      {/* Search Bar - Fixed Height */}
      <View style={[styles.searchContainer, isDesktop && styles.searchContainerDesktop]}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={20} color="#8A8AAE" />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search products and services..."
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
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="options-outline" size={24} color="#4A7DFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Chips - Fixed Height ScrollView */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {categories.map((filter) => {
            const count = filter.key === 'all' ? items.length :
                         filter.key === 'products' ? items.filter(i => i.type === 'product').length :
                         filter.key === 'services' ? items.filter(i => i.type === 'service').length :
                         items.filter(i => i.category?.toLowerCase().replace(/\s+/g, '_') === filter.key || 
                                   i.category?.toLowerCase() === filter.key).length;
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

      {/* Results Count - Fixed Height */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      {/* Grid - Takes remaining space */}
      <FlatList
        key={gridKey}
        data={filteredItems}
        renderItem={({ item }) => (
          <GridResultCard item={item} onPress={handleItemPress} />
        )}
        keyExtractor={(item, index) => `explore-${item.id}-${index}`}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContainer}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={8}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#8A8AAE" />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters or search terms</Text>
          </View>
        }
      />

      {renderSortModal()}
    </SafeAreaView>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
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

// ============================================================
// STYLES - DARK THEME
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
  },
  loadingText: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 12,
  },

  // Desktop Header
  desktopHeader: {
    marginBottom: 20,
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

  // Mobile Header
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#0D0D1A',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0D0D1A',
    gap: 10,
    minHeight: 56,
  },
  searchContainerDesktop: {
    paddingHorizontal: 0,
  },
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
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    padding: 0,
  },
  sortButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Filters
  filterContainer: {
    backgroundColor: '#0D0D1A',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    minHeight: 48,
    maxHeight: 56,
  },
  filterContent: {
    paddingHorizontal: 16,
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

  // Results
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0D0D1A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    minHeight: 36,
  },
  resultsCount: {
    color: '#8A8AAE',
    fontSize: 12,
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

  // Empty State
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
  emptySubtext: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 4,
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  sortOptionActive: {
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },
  sortOptionText: {
    color: '#E8ECF4',
    fontSize: 16,
  },
  sortOptionTextActive: {
    color: '#4A7DFF',
    fontWeight: '500',
  },
});