// src/features/feed/FeedScreen.tsx

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Alert } from 'react-native';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { SceneEngine, OpportunityFormatter, SceneRenderer } from '../opportunity';
import { GuestPromptCard } from './components/GuestPromptCard';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Share,
  useWindowDimensions,
  Image,
  StatusBar,
  Dimensions,
  FlatList,
  ViewabilityConfig,
  ViewToken,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { FloatingActionRail } from './components/FloatingActionRail';
import { useFeedStore } from '../../store/feedStore';
import { feedService, Opportunity as RawOpportunity } from '../../services/feed.service';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ReviewsBottomSheet } from './components/ReviewsBottomSheet';
import { AIBottomSheet } from './components/AIBottomSheet';
import { DirectionsBottomSheet } from './components/DirectionsBottomSheet';
import { SimpleDetailsModal } from './components/SimpleDetailsModal';
import * as Haptics from 'expo-haptics';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { recommendationService } from '../../services/recommendation.service';
import { mapItemType } from '../../utils/typeHelpers';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { locationService } from '../../services/location.service';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// --- Types ---
type FeedScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

interface FeedScreenProps {
  navigation: FeedScreenNavigationProp;
}

// --- Constants ---
const FEATURED_COUNT = 14;
const GUEST_PROMPT_THRESHOLD = 3;
const VIEWABILITY_CONFIG: ViewabilityConfig = {
  itemVisiblePercentThreshold: 50,
  minimumViewTime: 100,
};

// --- Main FeedScreen Component ---
export const FeedScreen = ({ navigation }: FeedScreenProps) => {
  const { height, width } = useWindowDimensions();
  const { isDesktop } = useBreakpoint();
  const { isAuthenticated, isGuest, user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const reviewsSheetRef = useRef<BottomSheetModal>(null);
  const aiSheetRef = useRef<BottomSheetModal>(null);

  // Location state
  const [userLocation, setUserLocation] = useState<string>('Detecting...');
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProductTitle, setSelectedProductTitle] = useState<string>('');
  const [selectedOpportunity, setSelectedOpportunity] = useState<RawOpportunity | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [aiViewActive, setAiViewActive] = useState(false);
  const [aiContextHint, setAiContextHint] = useState<string>('');
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [swipeCount, setSwipeCount] = useState(0);
  const [contextPanelView, setContextPanelView] = useState<'details' | 'reviews' | 'directions' | null>(null);
  const [isApplyingRecommendations, setIsApplyingRecommendations] = useState(false);
  const [hasAppliedRecommendations, setHasAppliedRecommendations] = useState(false);

  const {
    opportunities,
    currentIndex,
    isLoading,
    error,
    setOpportunities,
    setCurrentIndex,
    setLoading,
    setError,
  } = useFeedStore();

  const { data, isLoading: queryLoading, error: queryError } = useQuery({
    queryKey: ['opportunities'],
    queryFn: feedService.getOpportunities,
  });

  // --- Get Real Location ---
  useEffect(() => {
    const getLocation = async () => {
      try {
        setIsLocationLoading(true);
        const location = await locationService.getCurrentLocation();
        if (location) {
          const locationString = locationService.formatLocation(location);
          setUserLocation(locationString);
        } else {
          setUserLocation('Jinja, Uganda');
        }
      } catch (error) {
        console.error('Error getting location:', error);
        setUserLocation('Jinja, Uganda');
      } finally {
        setIsLocationLoading(false);
      }
    };
    getLocation();
  }, []);

  // --- Memoized Values ---
  const uniqueOpportunities = useMemo(() => {
    if (!opportunities || opportunities.length === 0) return [];
    const map = new Map();
    opportunities.forEach((item) => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }, [opportunities]);

  const currentOpportunity = useMemo(() => {
    if (!uniqueOpportunities || uniqueOpportunities.length === 0) return null;
    if (currentIndex < 0 || currentIndex >= uniqueOpportunities.length) return null;
    return uniqueOpportunities[currentIndex] || null;
  }, [uniqueOpportunities, currentIndex]);

  const featuredOpportunities = useMemo(() => {
    return uniqueOpportunities.slice(0, FEATURED_COUNT);
  }, [uniqueOpportunities]);

  // --- Effects ---
  useEffect(() => {
    if (queryError) {
      setError(queryError.message);
    }
    setLoading(queryLoading);
  }, [queryError, queryLoading, setError, setLoading]);

  // Reset recommendation flag when data changes
  useEffect(() => {
    setHasAppliedRecommendations(false);
  }, [data]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setHasAppliedRecommendations(false);
    };
  }, []);

  // --- Recommendation Engine ---
  useEffect(() => {
    if (data && data.length > 0 && !isApplyingRecommendations && !hasAppliedRecommendations) {
      const applyRecommendations = async () => {
        setIsApplyingRecommendations(true);
        try {
          let result: RawOpportunity[] = [];

          if (user?.id) {
            console.log('👤 Getting personalized recommendations for user:', user.id);
            result = await recommendationService.getPersonalizedRecommendations(data, user.id);

            if (result.length > 0) {
              for (const item of result.slice(0, 3)) {
                await recommendationService.trackInteraction(
                  user.id,
                  item.id,
                  'view',
                  mapItemType(item.type)
                );
              }
            }
          } else {
            console.log('👤 Getting new user recommendations for guest');
            result = recommendationService.getNewUserRecommendations(data);
          }

          console.log(`✅ Set ${result.length} personalized opportunities`);
          setOpportunities(result);
          setHasAppliedRecommendations(true);
        } catch (error) {
          console.error('❌ Error applying recommendations:', error);
          setOpportunities(data);
        } finally {
          setIsApplyingRecommendations(false);
        }
      };

      applyRecommendations();
    }
  }, [data, user?.id, isApplyingRecommendations, hasAppliedRecommendations, setOpportunities]);

  // --- Track View ---
  const trackOpportunityView = useCallback(
    async (opportunity: RawOpportunity) => {
      if (user?.id) {
        try {
          await recommendationService.trackInteraction(
            user.id,
            opportunity.id,
            'view',
            mapItemType(opportunity.type)
          );
        } catch (error) {
          // Silently fail - don't break the UI
          if (__DEV__) {
            console.log('⚠️ Tracking view failed:', error);
          }
        }
      }
    },
    [user?.id]
  );

  // --- Monitor Swipe Count ---
  useEffect(() => {
    if (swipeCount >= GUEST_PROMPT_THRESHOLD && !isAuthenticated && isGuest) {
      setShowGuestPrompt(true);
    }
  }, [swipeCount, isAuthenticated, isGuest]);

  // --- Viewable Items Handler ---
  const viewableItemsChangedRef = useRef<((info: { viewableItems: ViewToken<RawOpportunity>[]; changed: ViewToken<RawOpportunity>[] }) => void) | null>(null);

  useEffect(() => {
    viewableItemsChangedRef.current = (info: { viewableItems: ViewToken<RawOpportunity>[]; changed: ViewToken<RawOpportunity>[] }) => {
      const { viewableItems } = info;
      if (!viewableItems || viewableItems.length === 0) return;

      const firstItem = viewableItems[0];
      const index = firstItem.index;
      
      if (index === null || index === undefined) return;
      if (index === currentIndex || index < 0 || index >= uniqueOpportunities.length) return;

      setCurrentIndex(index);

      if (!isAuthenticated && isGuest) {
        setSwipeCount((prev) => prev + 1);
      }

      const item = uniqueOpportunities[index];
      if (item) {
        trackOpportunityView(item);
      }
      setContextPanelView(null);
    };
  }, [currentIndex, uniqueOpportunities, isAuthenticated, isGuest, trackOpportunityView, setCurrentIndex]);

  const handleViewableItemsChanged = useCallback(
    (info: { viewableItems: ViewToken<RawOpportunity>[]; changed: ViewToken<RawOpportunity>[] }) => {
      if (viewableItemsChangedRef.current) {
        viewableItemsChangedRef.current(info);
      }
    },
    []
  );

  // --- Action Handlers ---
  const handleReviewsPress = useCallback(
    (productId: string, productTitle?: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedProductId(productId);
      setSelectedProductTitle(productTitle || '');

      if (isDesktop) {
        setContextPanelView('reviews');
      } else {
        setShowReviewsModal(true);
      }
    },
    [isDesktop]
  );

  const handleSharePress = useCallback(
    async (opportunity: RawOpportunity) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        if (user?.id) {
          await recommendationService.trackInteraction(
            user.id,
            opportunity.id,
            'share',
            mapItemType(opportunity.type)
          );
        }
        const message = `🛍️ Check out ${opportunity.title}\n\n🏪 ${opportunity.shopName}\n💰 UGX ${opportunity.price.toLocaleString()}\n📍 ${opportunity.area || 'Available nearby'}\n\nDownload Munolink to discover more!`;
        await Share.share({
          message: message,
          title: opportunity.title,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    },
    [user?.id]
  );

  const handleDirectionsPress = useCallback(
    (shopName: string, area: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log(`📍 Directions to ${shopName} in ${area}`);

      const currentOpportunity = uniqueOpportunities[currentIndex];

      if (isDesktop) {
        setContextPanelView('directions');
        setSelectedOpportunity(currentOpportunity);
      } else {
        setSelectedOpportunity(currentOpportunity);
        setShowDirectionsModal(true);
      }
    },
    [isDesktop, uniqueOpportunities, currentIndex]
  );

  const handleAIPress = useCallback(
    (opportunity: RawOpportunity) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      console.log('🤖 AI Pressed for opportunity:', opportunity.title);
      setSelectedOpportunity(opportunity);
      setAiContextHint('');

      if (isDesktop) {
        console.log('🖥️ Desktop - Showing AI in context panel');
        setAiViewActive(true);
      } else {
        console.log('📱 Mobile - Showing AI modal');
        setShowAIModal(true);
      }
    },
    [isDesktop]
  );

  const handleCloseAI = useCallback(() => {
    console.log('🔚 Closing AI');
    setShowAIModal(false);
    setAiViewActive(false);
    setSelectedOpportunity(null);
    setAiContextHint('');
  }, []);

  const handleCloseDirections = useCallback(() => {
    console.log('🔚 Closing Directions');
    setShowDirectionsModal(false);
    setSelectedOpportunity(null);
  }, []);

  const handleShowMorePress = useCallback(
    (opportunity: RawOpportunity) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedOpportunity(opportunity);

      if (isDesktop) {
        setContextPanelView('details');
      } else {
        setShowDetailsModal(true);
      }
    },
    [isDesktop]
  );

  const handleLovePress = useCallback(
    (opportunity: RawOpportunity, isLoved: boolean) => {
      if (!isAuthenticated) {
        Alert.alert(
          'Join Munolink',
          'Create a free account to save opportunities.',
          [
            { text: 'Continue Browsing', style: 'cancel' },
            { text: 'Join Now', onPress: () => navigation.navigate('Join') },
          ]
        );
        return;
      }
      if (user?.id && isLoved) {
        recommendationService.trackInteraction(
          user.id,
          opportunity.id,
          'save',
          mapItemType(opportunity.type)
        );
      }
      console.log(isLoved ? '❤️ Added to wishlist:' : '❤️ Removed from wishlist:', opportunity.title);
    },
    [isAuthenticated, navigation, user?.id]
  );

  const handleSavePress = useCallback(
    (opportunity: RawOpportunity) => {
      if (!isAuthenticated) {
        Alert.alert(
          'Join Munolink',
          'Create a free account to save items.',
          [
            { text: 'Continue Browsing', style: 'cancel' },
            { text: 'Join Now', onPress: () => navigation.navigate('Join') },
          ]
        );
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (user?.id) {
        recommendationService.trackInteraction(
          user.id,
          opportunity.id,
          'save',
          mapItemType(opportunity.type)
        );
      }
      console.log('🔖 Saved:', opportunity.title);
    },
    [isAuthenticated, navigation, user?.id]
  );

  const handleFollowPress = useCallback(
    (opportunity: RawOpportunity) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.navigate('ShopProfile', {
        shopId: opportunity.shopId,
        shopName: opportunity.shopName,
      });
    },
    [navigation]
  );

  // --- Add to Cart / Book Handler ---
  const handleAddToCart = useCallback(() => {
    if (!currentOpportunity) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!isAuthenticated) {
      Alert.alert(
        'Join Munolink',
        'Create a free account to make purchases.',
        [
          { text: 'Continue Browsing', style: 'cancel' },
          { text: 'Join Now', onPress: () => navigation.navigate('Join') },
        ]
      );
      return;
    }

    const isService = currentOpportunity.type === 'service' || currentOpportunity.type === 'event';

    if (isService) {
      if (user?.id) {
        recommendationService.trackInteraction(
          user.id,
          currentOpportunity.id,
          'booking',
          mapItemType(currentOpportunity.type)
        );
      }
      Alert.alert(
        '📅 Booking Request',
        `Would you like to book "${currentOpportunity.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Book Now',
            onPress: () => {
              console.log('📅 Booking:', currentOpportunity.title);
            },
          },
        ]
      );
    } else {
      if (user?.id) {
        recommendationService.trackInteraction(
          user.id,
          currentOpportunity.id,
          'purchase',
          mapItemType(currentOpportunity.type)
        );
      }
      Alert.alert(
        '🛒 Added to Cart',
        `${currentOpportunity.title} has been added to your cart!`,
        [
          { text: 'Continue Shopping', style: 'cancel' },
          {
            text: 'View Cart',
            onPress: () => {
              console.log('🛒 View Cart');
            },
          },
        ]
      );
    }
  }, [currentOpportunity, isAuthenticated, user?.id, navigation]);

  // --- Navigation Helpers ---
  const scrollToIndex = useCallback(
    (index: number) => {
      if (flatListRef.current && index >= 0 && index < uniqueOpportunities.length) {
        flatListRef.current.scrollToIndex({
          index: index,
          animated: true,
        });
        setCurrentIndex(index);
        setContextPanelView(null);
      }
    },
    [uniqueOpportunities.length, setCurrentIndex]
  );

  const goToNext = useCallback(() => {
    if (currentIndex < uniqueOpportunities.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  }, [currentIndex, uniqueOpportunities.length, scrollToIndex]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  }, [currentIndex, scrollToIndex]);

  // --- Render Functions ---
  const renderDesktopNavArrows = useCallback(() => {
    if (!isDesktop) return null;

    return (
      <View style={{ alignItems: 'center', gap: 8 }}>
        <TouchableOpacity
          style={[styles.navArrow, currentIndex === 0 && styles.navArrowDisabled]}
          onPress={goToPrevious}
          disabled={currentIndex === 0}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-up" size={28} color={currentIndex === 0 ? '#555' : '#FFFFFF'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navArrow, currentIndex === uniqueOpportunities.length - 1 && styles.navArrowDisabled]}
          onPress={goToNext}
          disabled={currentIndex === uniqueOpportunities.length - 1}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-down" size={28} color={currentIndex === uniqueOpportunities.length - 1 ? '#555' : '#FFFFFF'} />
        </TouchableOpacity>
      </View>
    );
  }, [isDesktop, currentIndex, uniqueOpportunities.length, goToPrevious, goToNext]);

  const renderItem = useCallback(
    ({ item }: { item: RawOpportunity }) => {
      const cardWidth = isDesktop ? 420 : width;
      const cardHeight = isDesktop ? height : height;

      const normalizedOpportunity = OpportunityFormatter.format(item);
      const engine = new SceneEngine(normalizedOpportunity);
      const scenes = engine.compose();

      return (
        <View
          style={{
            height: isDesktop ? height : height,
            paddingVertical: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SceneRenderer
            key={item.id}
            scenes={scenes}
            title={item.title}
            price={item.price}
            shopName={item.shopName}
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
              handleSharePress(item);
            }}
            onSave={() => {
              handleSavePress(item);
            }}
            onShowMore={() => {
              handleShowMorePress(item);
            }}
            onSceneChange={(index) => {
              console.log('Scene changed to:', index);
            }}
            width={cardWidth}
            height={cardHeight}
            autoPlay={false}
            autoPlayInterval={9000}
            resetKey={item.id}
          />
        </View>
      );
    },
    [
      isDesktop,
      width,
      height,
      navigation,
      handleSharePress,
      handleSavePress,
      handleShowMorePress,
    ]
  );

  const renderFloatingActions = useCallback(() => {
    const currentOpportunity = uniqueOpportunities[currentIndex];
    if (!currentOpportunity) return null;

    return (
      <FloatingActionRail
        opportunity={currentOpportunity}
        onShopPress={(shopId) => {
          navigation.navigate('ShopProfile', {
            shopId,
            shopName: currentOpportunity.shopName,
          });
        }}
        onReviewsPress={(productId) => handleReviewsPress(productId, currentOpportunity.title)}
        onDirectionsPress={handleDirectionsPress}
        onSharePress={handleSharePress}
        onAIPress={handleAIPress}
        onSavePress={handleSavePress}
      />
    );
  }, [
    uniqueOpportunities,
    currentIndex,
    navigation,
    handleReviewsPress,
    handleSharePress,
    handleSavePress,
    handleAIPress,
    handleDirectionsPress,
  ]);

  const renderActionButton = useCallback(() => {
    if (!currentOpportunity) return null;

    const isService = currentOpportunity.type === 'service' || currentOpportunity.type === 'event';
    const buttonLabel = isService ? 'Book' : 'Add to Cart';
    const iconName = isService ? 'calendar-outline' : 'cart-outline';

    return (
      <View style={styles.buttonWrapper}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleAddToCart}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={isService ? ['#6C5CE7', '#A855F7'] : ['#4A7DFF', '#6C5CE7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButtonGradient}
          >
            <Ionicons name={iconName} size={14} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>{buttonLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }, [currentOpportunity, handleAddToCart]);

  // --- Loading States ---
  if (isLoading || queryLoading || isApplyingRecommendations) {
    return (
      <View style={[styles.centered, { height }]}>
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={[styles.loadingText, { fontSize: width < 380 ? 14 : 16 }]}>
          {isApplyingRecommendations ? 'Personalizing your feed...' : 'Loading opportunities...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { height }]}>
        <Text style={[styles.errorText, { fontSize: width < 380 ? 16 : 18 }]}>Error loading feed</Text>
        <Text style={[styles.errorSubtext, { fontSize: width < 380 ? 12 : 14 }]}>{error}</Text>
      </View>
    );
  }

  if (uniqueOpportunities.length === 0) {
    return (
      <View style={[styles.centered, { height }]}>
        <Text style={[styles.emptyText, { fontSize: width < 380 ? 16 : 18 }]}>No opportunities found</Text>
        <Text style={[styles.emptySubtext, { fontSize: width < 380 ? 12 : 14 }]}>
          Check back later for new deals!
        </Text>
      </View>
    );
  }

  // --- Main Render ---
  return (
    <ResponsiveLayout
      currentRoute="Feed"
      onNavigate={(route) => {
        (navigation as any).navigate(route);
      }}
      floatingActions={renderFloatingActions()}
      desktopNavArrows={renderDesktopNavArrows()}
      selectedOpportunity={uniqueOpportunities[currentIndex] || null}
      onReviewsPress={handleReviewsPress}
      onShowMorePress={handleShowMorePress}
      onSharePress={handleSharePress}
      onAIPress={handleAIPress}
      featuredOpportunities={featuredOpportunities}
      contextPanelView={contextPanelView}
      onContextPanelViewChange={setContextPanelView}
      selectedProductId={selectedProductId}
      selectedProductTitle={selectedProductTitle}
      selectedOpportunityForModal={selectedOpportunity}
      aiViewActive={aiViewActive}
      onAIClose={handleCloseAI}
      aiContextHint={aiContextHint}
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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <SafeAreaView style={[styles.container, { height }]}>
            <StatusBar barStyle="light-content" />

            {!isDesktop && (
              <LinearGradient
                colors={[
                  'rgba(31, 47, 95, 0.92)',
                  'rgba(31, 47, 95, 0.7)',
                  'rgba(31, 47, 95, 0.4)',
                  'rgba(31, 47, 95, 0)',
                ]}
                locations={[0, 0.25, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[styles.topBarGradient, { paddingTop: 20 }]}
              >
                <View style={styles.topBarContent}>
                  <TouchableOpacity style={styles.logoContainer}>
                    <Image source={require('../../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.locationContainer}>
                    <Ionicons name="location-outline" size={16} color="#4A7DFF" />
                    <Text style={[styles.locationText, { fontSize: 13 }]}>
                      {isLocationLoading ? 'Detecting...' : userLocation}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#4A7DFF" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.searchContainer} 
                    onPress={() => {
                      (navigation as any).navigate('Search');
                    }}
                  >
                    <Ionicons name="search-outline" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            )}

            <FlatList
              ref={flatListRef}
              data={uniqueOpportunities}
              renderItem={renderItem}
              keyExtractor={(item, index) => `item-${item.id}-${index}`}
              pagingEnabled={!isDesktop}
              showsVerticalScrollIndicator={false}
              snapToInterval={isDesktop ? undefined : height}
              snapToAlignment="start"
              decelerationRate="fast"
              viewabilityConfig={VIEWABILITY_CONFIG}
              onViewableItemsChanged={handleViewableItemsChanged}
              getItemLayout={(data, index) => ({
                length: height,
                offset: height * index,
                index,
              })}
              initialScrollIndex={currentIndex}
              removeClippedSubviews={true}
              maxToRenderPerBatch={isDesktop ? 3 : 1}
              windowSize={isDesktop ? 5 : 2}
              onScrollToIndexFailed={() => {}}
              scrollEventThrottle={16}
              style={{ flex: 1, backgroundColor: '#0D0D1A' }}
            />

            {renderActionButton()}

            <ReviewsBottomSheet
              visible={showReviewsModal}
              productId={selectedProductId}
              productTitle={selectedProductTitle}
              onClose={() => {
                setShowReviewsModal(false);
                setSelectedProductId('');
                setSelectedProductTitle('');
              }}
            />

            <AIBottomSheet
              visible={showAIModal}
              opportunity={selectedOpportunity}
              contextHint={aiContextHint}
              onClose={() => {
                setShowAIModal(false);
                setSelectedOpportunity(null);
                setAiContextHint('');
              }}
              isDesktopView={false}
            />

            <DirectionsBottomSheet
              visible={showDirectionsModal}
              opportunity={selectedOpportunity}
              onClose={handleCloseDirections}
              isDesktopView={false}
            />

            <SimpleDetailsModal
              visible={showDetailsModal}
              opportunity={selectedOpportunity}
              onClose={() => {
                setShowDetailsModal(false);
                setSelectedOpportunity(null);
              }}
            />

            {showGuestPrompt && (
              <View style={styles.guestPromptOverlay}>
                <GuestPromptCard
                  onJoinPress={() => {
                    setShowGuestPrompt(false);
                    navigation.navigate('Join');
                  }}
                  onContinuePress={() => {
                    setShowGuestPrompt(false);
                  }}
                />
              </View>
            )}
          </SafeAreaView>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </ResponsiveLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070f',
  },
  centered: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  topBarGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  logoContainer: {
    flex: 1,
  },
  logoImage: {
    width: 130,
    height: 70,
    resizeMode: 'contain',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    maxWidth: 180,
  },
  locationText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 13,
    maxWidth: 100,
  },
  searchContainer: {
    padding: 6,
    borderRadius: 20,
  },
  guestPromptOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
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
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#E74C3C',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorSubtext: {
    color: '#8A8AAE',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
  },
  emptyText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptySubtext: {
    color: '#8A8AAE',
    marginTop: 8,
    fontSize: 14,
  },
  buttonWrapper: {
    position: 'absolute',
    bottom: 220,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    paddingHorizontal: 24,
  },
  actionButton: {
    borderRadius: 20,
    overflow: 'hidden',
    width: 'auto',
    maxWidth: 160,
    shadowColor: '#4A7DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});