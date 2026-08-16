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
  Animated,
  ViewabilityConfig,
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

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// --- Main FeedScreen Component ---
export const FeedScreen = ({ navigation }: any) => {
  const { height, width } = useWindowDimensions();
  const { isDesktop } = useBreakpoint();
  const { isAuthenticated, isGuest, user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const reviewsSheetRef = useRef<BottomSheetModal>(null);
  const aiSheetRef = useRef<BottomSheetModal>(null);

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

  const uniqueOpportunities = useMemo(() => {
    if (!opportunities || opportunities.length === 0) return [];
    const seen = new Set();
    return opportunities.filter((item) => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }, [opportunities]);

  const featuredOpportunities = useMemo(() => {
    return uniqueOpportunities.slice(0, 14);
  }, [uniqueOpportunities]);

  // === RECOMMENDATION ENGINE ===
  useEffect(() => {
    if (data && data.length > 0 && !isApplyingRecommendations) {
      const applyRecommendations = async () => {
        setIsApplyingRecommendations(true);
        try {
          let result: RawOpportunity[] = [];
          
          if (user?.id) {
            console.log('👤 Getting personalized recommendations for user:', user.id);
            result = await recommendationService.getPersonalizedRecommendations(data, user.id);
            
            if (result.length > 0) {
              for (const item of result.slice(0, 3)) {
                await recommendationService.trackInteraction(user.id, item.id, 'view');
              }
            }
          } else {
            console.log('👤 Getting new user recommendations for guest');
            result = recommendationService.getNewUserRecommendations(data);
          }
          
          console.log(`✅ Set ${result.length} personalized opportunities`);
          setOpportunities(result);
        } catch (error) {
          console.error('❌ Error applying recommendations:', error);
          setOpportunities(data);
        } finally {
          setIsApplyingRecommendations(false);
        }
      };
      
      applyRecommendations();
    }
  }, [data, user?.id]);

  // Track when user views an opportunity (for learning)
  const trackOpportunityView = useCallback(async (opportunity: RawOpportunity) => {
    if (user?.id) {
      try {
        await recommendationService.trackInteraction(user.id, opportunity.id, 'view');
      } catch (error) {
        // Silently fail
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (queryError) {
      setError(queryError.message);
    }
    setLoading(queryLoading);
  }, [queryError, queryLoading]);

  // Monitor swipe count
  useEffect(() => {
    console.log('📊 Swipe count:', swipeCount, 'isAuthenticated:', isAuthenticated, 'isGuest:', isGuest);
    if (swipeCount >= 3 && !isAuthenticated && isGuest) {
      console.log('🎯 SHOW GUEST PROMPT TRIGGERED!');
      setShowGuestPrompt(true);
    }
  }, [swipeCount, isAuthenticated, isGuest]);

  const viewableItemsChangedRef = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const index = viewableItems[0].index;
      if (index !== currentIndex && index >= 0 && index < uniqueOpportunities.length) {
        console.log('📊 Viewable index:', index, 'currentIndex:', currentIndex);
        setCurrentIndex(index);
        if (!isAuthenticated && isGuest) {
          setSwipeCount(prev => prev + 1);
        }
        const item = uniqueOpportunities[index];
        if (item) {
          trackOpportunityView(item);
        }
        setContextPanelView(null);
      }
    }
  });

  useEffect(() => {
    viewableItemsChangedRef.current = ({ viewableItems }: any) => {
      if (viewableItems && viewableItems.length > 0) {
        const index = viewableItems[0].index;
        if (index !== currentIndex && index >= 0 && index < uniqueOpportunities.length) {
          console.log('📊 Viewable index:', index, 'currentIndex:', currentIndex);
          setCurrentIndex(index);
          if (!isAuthenticated && isGuest) {
            setSwipeCount(prev => prev + 1);
          }
          const item = uniqueOpportunities[index];
          if (item) {
            trackOpportunityView(item);
          }
          setContextPanelView(null);
        }
      }
    };
  }, [currentIndex, uniqueOpportunities.length, isAuthenticated, isGuest]);

  const handleViewableItemsChanged = useCallback((info: any) => {
    viewableItemsChangedRef.current(info);
  }, []);

  const viewabilityConfig: ViewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  };

  // --- Action Handlers ---
  const handleReviewsPress = useCallback((productId: string, productTitle?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProductId(productId);
    setSelectedProductTitle(productTitle || '');
    
    if (isDesktop) {
      setContextPanelView('reviews');
    } else {
      setShowReviewsModal(true);
    }
  }, [isDesktop]);

  const handleSharePress = useCallback(async (opportunity: RawOpportunity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (user?.id) {
        await recommendationService.trackInteraction(user.id, opportunity.id, 'share');
      }
      const message = `🛍️ Check out ${opportunity.title}\n\n🏪 ${opportunity.shopName}\n💰 UGX ${opportunity.price.toLocaleString()}\n📍 ${opportunity.area || 'Available nearby'}\n\nDownload Munolink to discover more!`;
      await Share.share({
        message: message,
        title: opportunity.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [user?.id]);

  // --- Directions Handler ---
  const handleDirectionsPress = useCallback((shopName: string, area: string) => {
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
  }, [isDesktop, uniqueOpportunities, currentIndex]);

  // --- AI Handler ---
  const handleAIPress = useCallback((opportunity: RawOpportunity) => {
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
  }, [isDesktop]);

  // --- Close AI ---
  const handleCloseAI = useCallback(() => {
    console.log('🔚 Closing AI');
    setShowAIModal(false);
    setAiViewActive(false);
    setSelectedOpportunity(null);
    setAiContextHint('');
  }, []);

  // --- Close Directions ---
  const handleCloseDirections = useCallback(() => {
    console.log('🔚 Closing Directions');
    setShowDirectionsModal(false);
    setSelectedOpportunity(null);
  }, []);

  const handleShowMorePress = useCallback((opportunity: RawOpportunity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedOpportunity(opportunity);
    
    if (isDesktop) {
      setContextPanelView('details');
    } else {
      setShowDetailsModal(true);
    }
  }, [isDesktop]);

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
        recommendationService.trackInteraction(user.id, opportunity.id, 'save');
      }
      console.log(isLoved ? '❤️ Added to wishlist:' : '❤️ Removed from wishlist:', opportunity.title);
    },
    [isAuthenticated, navigation, user?.id]
  );

  const handleSavePress = useCallback((opportunity: RawOpportunity) => {
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
      recommendationService.trackInteraction(user.id, opportunity.id, 'save');
    }
    console.log('🔖 Saved:', opportunity.title);
  }, [isAuthenticated, navigation, user?.id]);

  const handleFollowPress = useCallback((opportunity: RawOpportunity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('ShopProfile', {
      shopId: opportunity.shopId,
      shopName: opportunity.shopName,
    });
  }, [navigation]);

  // --- Navigate Up/Down ---
  const scrollToIndex = (index: number) => {
    if (flatListRef.current && index >= 0 && index < uniqueOpportunities.length) {
      flatListRef.current.scrollToIndex({
        index: index,
        animated: true,
      });
      setCurrentIndex(index);
      setContextPanelView(null);
    }
  };

  const goToNext = () => {
    if (currentIndex < uniqueOpportunities.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  };

  // --- Render Desktop Nav Arrows ---
  const renderDesktopNavArrows = () => {
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
  };

  // --- Render Item ---
  const renderItem = useCallback(
    ({ item }: { item: RawOpportunity }) => {
      const cardWidth = isDesktop ? 420 : width;
      const cardHeight = isDesktop ? height : height;

      const normalizedOpportunity = OpportunityFormatter.format(item);
      const engine = new SceneEngine(normalizedOpportunity);
      const scenes = engine.compose();

      return (
        <View style={{
          height: isDesktop ? height : height,
          paddingVertical: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
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
    [isDesktop, width, height, navigation, handleSharePress, handleSavePress, handleShowMorePress]
  );

  // --- Render Floating Actions ---
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
  }, [uniqueOpportunities, currentIndex, navigation, handleReviewsPress, handleSharePress, handleSavePress, handleAIPress, handleDirectionsPress]);

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
        <Text style={[styles.errorText, { fontSize: width < 380 ? 16 : 18 }]}>
          Error loading feed
        </Text>
        <Text style={[styles.errorSubtext, { fontSize: width < 380 ? 12 : 14 }]}>
          {error}
        </Text>
      </View>
    );
  }

  if (uniqueOpportunities.length === 0) {
    return (
      <View style={[styles.centered, { height }]}>
        <Text style={[styles.emptyText, { fontSize: width < 380 ? 16 : 18 }]}>
          No opportunities found
        </Text>
        <Text style={[styles.emptySubtext, { fontSize: width < 380 ? 12 : 14 }]}>
          Check back later for new deals!
        </Text>
      </View>
    );
  }

  // --- Desktop ---
  if (isDesktop) {
    return (
      <ResponsiveLayout
        currentRoute="Feed"
        onNavigate={(route) => navigation.navigate(route)}
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

              <FlatList
                ref={flatListRef}
                data={uniqueOpportunities}
                renderItem={renderItem}
                keyExtractor={(item, index) => `desktop-${item.id}-${index}`}
                showsVerticalScrollIndicator={false}
                snapToInterval={height}
                snapToAlignment="start"
                decelerationRate="fast"
                viewabilityConfig={viewabilityConfig}
                onViewableItemsChanged={handleViewableItemsChanged}
                getItemLayout={(data, index) => ({
                  length: height,
                  offset: height * index,
                  index,
                })}
                initialScrollIndex={currentIndex}
                removeClippedSubviews={true}
                maxToRenderPerBatch={3}
                windowSize={5}
                onScrollToIndexFailed={() => {}}
                scrollEventThrottle={16}
                style={{ flex: 1, backgroundColor: '#0D0D1A' }}
                pagingEnabled={false}
                disableIntervalMomentum={false}
              />

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
  }

  // --- Mobile ---
  return (
    <ResponsiveLayout
      currentRoute="Feed"
      onNavigate={(route) => navigation.navigate(route)}
      floatingActions={renderFloatingActions()}
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
                    <Image 
                      source={require('../../../assets/logo.png')} 
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.locationContainer}>
                    <Ionicons name="location-outline" size={16} color="#4A7DFF" />
                    <Text style={[styles.locationText, { fontSize: 13 }]}>Jinja, Uganda</Text>
                    <Ionicons name="chevron-down" size={14} color="#4A7DFF" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.searchContainer} onPress={() => navigation.navigate('Search')}>
                    <Ionicons name="search-outline" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            )}

            <FlatList
              ref={flatListRef}
              data={uniqueOpportunities}
              renderItem={renderItem}
              keyExtractor={(item, index) => `mobile-${item.id}-${index}`}
              pagingEnabled={true}
              showsVerticalScrollIndicator={false}
              snapToInterval={height}
              snapToAlignment="start"
              decelerationRate="fast"
              viewabilityConfig={viewabilityConfig}
              onViewableItemsChanged={handleViewableItemsChanged}
              getItemLayout={(data, index) => ({
                length: height,
                offset: height * index,
                index,
              })}
              initialScrollIndex={currentIndex}
              removeClippedSubviews={true}
              maxToRenderPerBatch={1}
              windowSize={2}
              onScrollToIndexFailed={() => {}}
              scrollEventThrottle={16}
            />

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
    backgroundColor: '#1F2F5F',
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
  },
  locationText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 13,
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
});