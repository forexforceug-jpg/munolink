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
  ListRenderItem,
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
import { Opportunity } from '../../services/feed.service';
import * as Haptics from 'expo-haptics';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

const { width, height } = Dimensions.get('window');

// --- Types ---
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
}

// --- Filter Categories ---
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

// ============================================================
// PRICE BADGE HELPER
// ============================================================


// ============================================================
// SUB-COMPONENTS
// ============================================================

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

// ============================================================
// GRID RESULT CARD - WITH PRICE BADGE
// ============================================================
const GridResultCard = React.memo(({ item, onPress }: { item: ExplorePost; onPress: (item: ExplorePost) => void }) => {
  // Get thumbnail
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
          <Text style={styles.gridTitle} numberOfLines={1}>{item.name || 'Post'}</Text>
          
          {/* ✅ Show price if it exists */}
          {hasPrice && (
            <Text style={styles.gridPrice}>UGX {item.price!.toLocaleString()}</Text>
          )}
          
          <View style={styles.gridFooter}>
            <Text style={styles.gridShop} numberOfLines={1}>{displayName}</Text>
            {item.like_count && item.like_count > 0 && (
              <Text style={styles.gridRating}>❤️ {item.like_count}</Text>
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

  const [items, setItems] = useState<ExplorePost[]>([]);
  const [filteredItems, setFilteredItems] = useState<ExplorePost[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('relevance');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSortModal, setShowSortModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'fullscreen'>('grid');
  const [selectedItem, setSelectedItem] = useState<ExplorePost | null>(null);
  const [savedItemsMap, setSavedItemsMap] = useState<Record<string, boolean>>({});
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [showSearch, setShowSearch] = useState(false);
  
  // Modal states
  const [selectedOpportunity, setSelectedOpportunity] = useState<ExplorePost | null>(null);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const searchInputRef = useRef<TextInput>(null);
  
  // Animated value for scroll
  const scrollY = useRef(new Animated.Value(0)).current;

  // ============================================================
  // FETCH DATA - FROM CATALOG WITH USER INFO INCLUDING COVER
  // ============================================================
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: catalogPosts, error: catalogError } = await supabase
        .from('catalog')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(100);

      if (catalogError) {
        console.error('❌ Error fetching catalog posts:', catalogError);
        setIsLoading(false);
        return;
      }

      if (!catalogPosts || catalogPosts.length === 0) {
        setItems([]);
        setFilteredItems([]);
        setIsLoading(false);
        return;
      }

      console.log(`✅ Found ${catalogPosts.length} posts in catalog`);

      // Get user info including cover_url
      const userIds = catalogPosts
        .map(post => post.user_id)
        .filter((id): id is string => id !== null && id !== undefined && id !== '');

      let userMap: Record<string, { 
        full_name: string | null; 
        avatar_url: string | null;
        cover_url: string | null;
      }> = {};

      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, full_name, avatar_url, cover_url')
          .in('id', userIds);

        if (usersError) {
          console.error('❌ Error fetching users:', usersError);
        } else if (users) {
          users.forEach((user: any) => {
            userMap[user.id] = {
              full_name: user.full_name,
              avatar_url: user.avatar_url,
              cover_url: user.cover_url,
            };
          });
          console.log(`👤 Found ${Object.keys(userMap).length} users`);
        }
      }

      // Build ExplorePost objects
      const posts: ExplorePost[] = catalogPosts.map((post: any) => {
        const userInfo = post.user_id ? userMap[post.user_id] : null;
        const images = post.images || [];
        
        const videoUrl = post.video || null;
        const videoThumbnail = post.video_thumbnail || null;
        
        // ✅ FIX: Get price from specifications if price column is null
        let price = post.price || null;
        if (!price && post.specifications && typeof post.specifications === 'object') {
          const specPrice = post.specifications.price || post.specifications.regular_price || null;
          if (specPrice) {
            price = typeof specPrice === 'number' ? specPrice : parseFloat(String(specPrice));
          }
        }
        
        const finalThumbnail = videoThumbnail || (images.length > 0 ? images[0] : null);

        return {
          id: post.id,
          user_id: post.user_id || '',
          name: post.name || 'Untitled',
          description: post.description || null,
          price: price,
          currency: 'UGX',
          images: images,
          video: videoUrl,
          video_thumbnail: finalThumbnail,
          video_duration: post.video_duration || null,
          video_size: post.video_size || null,
          hashtags: post.tags || [],
          location: post.location || null,
          category: post.category || null,
          status: post.status || 'active',
          like_count: post.like_count || 0,
          view_count: post.view_count || 0,
          share_count: post.share_count || 0,
          comment_count: post.comment_count || 0,
          created_at: post.created_at || new Date().toISOString(),
          updated_at: post.updated_at || new Date().toISOString(),
          user_full_name: userInfo?.full_name || 'User',
          user_avatar: userInfo?.avatar_url || null,
          user_cover_url: userInfo?.cover_url || null,
          detected_category: post.detected_category || null,
          detected_intent: post.detected_intent || null,
          detected_tags: post.detected_tags || [],
          userId: post.user_id || '',
          userFullName: userInfo?.full_name || 'User',
          userAvatar: userInfo?.avatar_url || null,
          imageUrl: images[0] || videoThumbnail || userInfo?.cover_url || '',
          catalogImages: images,
        };
      });

      // Shuffle for variety
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

  // ============================================================
  // FILTERS AND SORTING
  // ============================================================
  const applyFilters = useCallback(() => {
    let result = [...items];

    if (selectedFilter !== 'all') {
      if (selectedFilter === 'products') {
        result = result.filter(item => 
          item.detected_intent === 'sell' || 
          item.detected_category?.toLowerCase().includes('product')
        );
      } else if (selectedFilter === 'services') {
        result = result.filter(item => 
          item.detected_intent === 'service' || 
          item.detected_category?.toLowerCase().includes('service')
        );
      } else {
        result = result.filter(item => 
          item.category?.toLowerCase().replace(/\s+/g, '_') === selectedFilter ||
          item.category?.toLowerCase() === selectedFilter ||
          item.detected_category?.toLowerCase().replace(/\s+/g, '_') === selectedFilter ||
          item.detected_category?.toLowerCase() === selectedFilter
        );
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(item =>
        item.name?.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        item.user_full_name?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.hashtags.some(tag => tag.toLowerCase().includes(query))
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

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleItemPress = useCallback((item: ExplorePost) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedItem(item);
    setViewMode('fullscreen');
  }, []);

  const handleBackToGrid = useCallback(() => {
    setViewMode('grid');
    setSelectedItem(null);
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

  // ============================================================
  // FULLSCREEN RENDER
  // ============================================================
  const renderFullScreenItem = useCallback((item: ExplorePost) => {
    if (!item) return null;

    const isSaved = savedItemsMap[item.id] || false;
    
    const mediaItems = [];
    let thumbnail = item.video_thumbnail || item.images?.[0] || item.user_cover_url || item.user_avatar || undefined;
    
    if (item.video) {
      mediaItems.push({ 
        type: 'video' as const, 
        url: item.video,
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

    const displayName = item.user_full_name || 'User';

    const cardWidth = isDesktop ? 420 : width;
    const cardHeight = isDesktop ? height : height;

    const opportunity: Opportunity = {
      id: item.id,
      title: item.name || 'Untitled',
      price: item.price || 0,
      currency: item.currency || 'UGX',
      imageUrl: item.images?.[0] || item.video_thumbnail || item.user_cover_url || '',
      catalogImages: item.images || [],
      description: item.description || '',
      rating: null,
      reviewCount: 0,
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
          onShowMore={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedOpportunity(item);
            setShowAIModal(true);
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
              userId: item.user_id,
              userName: item.user_full_name || 'User',
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
              navigation.navigate('UserProfile' as any, {
                userId: item.user_id,
                userName: item.user_full_name || 'User',
              });
            }}
            onReviewsPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowReviewsModal(true);
            }}
            onDirectionsPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowDirectionsModal(true);
            }}
            onSharePress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            onAIPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setSelectedOpportunity(item);
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
            shareCount={0}
            reviewCount={0}
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

  // ============================================================
  // RENDER SORT MODAL
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
  // RENDER GRID ITEM
  // ============================================================
  const renderGridItem: ListRenderItem<ExplorePost> = useCallback(({ item }) => (
    <GridResultCard item={item} onPress={handleItemPress} />
  ), [handleItemPress]);

  // ============================================================
  // LIST HEADER - Filters only (search is separate)
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
            const count = filter.key === 'all' ? items.length :
                         filter.key === 'products' ? items.filter(i => 
                           i.detected_intent === 'sell' || 
                           i.detected_category?.toLowerCase().includes('product')
                         ).length :
                         filter.key === 'services' ? items.filter(i => 
                           i.detected_intent === 'service' || 
                           i.detected_category?.toLowerCase().includes('service')
                         ).length :
                         items.filter(i => 
                           i.category?.toLowerCase().replace(/\s+/g, '_') === filter.key || 
                           i.category?.toLowerCase() === filter.key ||
                           i.detected_category?.toLowerCase().replace(/\s+/g, '_') === filter.key ||
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

            <ReviewsBottomSheet
              visible={showReviewsModal}
              productId={selectedOpportunity?.id || ''}
              productTitle={selectedOpportunity?.name || ''}
              onClose={handleCloseReviews}
            />

            <AIBottomSheet
              visible={showAIModal}
              opportunity={selectedOpportunity as any}
              contextHint={`Explore: ${selectedOpportunity?.name}`}
              onClose={handleCloseAI}
              isDesktopView={isDesktop}
            />

            <DirectionsBottomSheet
              visible={showDirectionsModal}
              opportunity={selectedOpportunity as any}
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
  const numColumns = isDesktop ? 4 : 3;
  const gridKey = isDesktop ? 'desktop-grid' : 'mobile-grid';

  return (
    <SafeAreaView style={[styles.container, isDesktop && styles.containerDesktop]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      {/* Header with Title and Search Icon */}
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Explore</Text>
          {!isDesktop && (
            <TouchableOpacity onPress={toggleSearch} style={styles.searchIconButton}>
              <Ionicons name={showSearch ? 'close' : 'search'} size={22} color="#FFFFFF" />
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

      {/* Search Bar - Only visible when showSearch is true */}
      {showSearch && (
        <View style={[styles.searchContainer, isDesktop && styles.searchContainerDesktop]}>
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
            <Text style={styles.emptySubtext}>Try adjusting your filters or search terms</Text>
          </View>
        }
        stickyHeaderIndices={[0]}
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
  },
  loadingText: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 12,
  },

  // ============================================================
  // HEADER - With Search Icon
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchIconButton: {
    padding: 4,
  },
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

  // ============================================================
  // SEARCH BAR - Toggleable
  // ============================================================
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0D0D1A',
    gap: 10,
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

  // ============================================================
  // FILTERS - Sticky
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
  // GRID STYLES
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
  
  // ✅ PRICE BADGE - Top Left
  priceBadgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  priceBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
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
  // MODAL STYLES
  // ============================================================
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