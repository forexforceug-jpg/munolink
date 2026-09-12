// src/features/feed/FeedScreen.tsx

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Alert, Modal as RNModal } from 'react-native';
import { supabase } from '../../lib/supabase';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { SceneRenderer, BehavioralEvent } from '../opportunity/renderer/SceneRenderer';
import { GuestPromptCard } from './components/GuestPromptCard';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { FloatingActionRail } from './components/FloatingActionRail';
import { useFeedStore } from '../../store/feedStore';
import { feedService, Opportunity } from '../../services/feed.service';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ReviewsBottomSheet } from './components/ReviewsBottomSheet';
import { AIBottomSheet } from './components/AIBottomSheet';
import { DirectionsBottomSheet } from './components/DirectionsBottomSheet';
import * as Haptics from 'expo-haptics';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { recommendationService } from '../../services/recommendation.service';
import { mapItemType } from '../../utils/typeHelpers';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { locationService, UserLocation } from '../../services/location.service';
import { LocationPicker } from './components/LocationPicker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

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
  minimumViewTime: 300,
};

// ============================================================
// 🎨 LOADING SKELETON COMPONENTS
// ============================================================

const useShimmer = () => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  return shimmer;
};

// Skeleton Card Component
const FeedSkeletonCard: React.FC<{ isDesktop?: boolean }> = ({ isDesktop = false }) => {
  const shimmer = useShimmer();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + shimmer.value * 0.4,
  }));

  const cardWidth = isDesktop ? 420 : screenWidth;
  const cardHeight = isDesktop ? screenHeight : screenHeight;

  return (
    <View style={[styles.skeletonCard, { width: cardWidth, height: cardHeight }]}>
      <View style={styles.skeletonBackground} />
      <Animated.View style={[styles.skeletonShimmerOverlay, animatedStyle]}>
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)',
            'rgba(255,255,255,0.05)',
            'rgba(255,255,255,0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.skeletonShimmerGradient}
        />
      </Animated.View>
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonImage}>
          <View style={styles.skeletonImageShimmer} />
        </View>
        <View style={styles.skeletonTitleContainer}>
          <View style={styles.skeletonTitle} />
          <View style={[styles.skeletonTitle, { width: '60%' }]} />
        </View>
        <View style={styles.skeletonPriceContainer}>
          <View style={[styles.skeletonPrice, { width: 120 }]} />
          <View style={[styles.skeletonRating, { width: 80 }]} />
        </View>
        <View style={styles.skeletonShopContainer}>
          <View style={styles.skeletonShopIcon} />
          <View style={[styles.skeletonShopName, { width: 100 }]} />
        </View>
        <View style={styles.skeletonActionContainer}>
          <View style={styles.skeletonActionButton} />
          <View style={styles.skeletonActionButton} />
          <View style={styles.skeletonActionButton} />
        </View>
      </View>
      <View style={[styles.skeletonRail, isDesktop && styles.skeletonRailDesktop]}>
        <View style={styles.skeletonRailButton} />
        <View style={styles.skeletonRailButton} />
        <View style={styles.skeletonRailButton} />
        <View style={styles.skeletonRailButton} />
        <View style={styles.skeletonRailButton} />
      </View>
      {isDesktop && (
        <View style={styles.skeletonNavArrows}>
          <View style={styles.skeletonNavArrow} />
          <View style={styles.skeletonNavArrow} />
        </View>
      )}
    </View>
  );
};

// Main Feed Skeleton
const FeedSkeleton: React.FC<{ count?: number; isDesktop?: boolean }> = ({
  count = 1,
  isDesktop = false,
}) => {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <FeedSkeletonCard key={`skeleton-${index}`} isDesktop={isDesktop} />
      ))}
    </View>
  );
};

// List Skeleton (with Top Bar)
const FeedListSkeleton: React.FC<{ isDesktop?: boolean }> = ({ isDesktop = false }) => {
  const shimmer = useShimmer();

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + shimmer.value * 0.4,
  }));

  if (isDesktop) {
    return <FeedSkeleton isDesktop={true} />;
  }

  return (
    <View style={styles.skeletonListContainer}>
      <View style={styles.skeletonTopBar}>
        <View style={styles.skeletonLogo} />
        <View style={styles.skeletonLocation} />
        <View style={styles.skeletonSearch} />
      </View>
      <Animated.View style={[styles.skeletonTopBarShimmer, animatedStyle]}>
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)',
            'rgba(255,255,255,0.05)',
            'rgba(255,255,255,0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.skeletonShimmerGradient}
        />
      </Animated.View>
      <FeedSkeletonCard isDesktop={false} />
    </View>
  );
};

// ============================================================
// MAIN FEED SCREEN COMPONENT
// ============================================================

export const FeedScreen = ({ navigation }: FeedScreenProps) => {
  const { height, width } = useWindowDimensions();
  const { isDesktop } = useBreakpoint();
  const { isAuthenticated, isGuest, user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const reviewsSheetRef = useRef<BottomSheetModal>(null);
  const aiSheetRef = useRef<BottomSheetModal>(null);
  // Location state with picker
  const [userLocation, setUserLocation] = useState<string>('Detecting...');
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<UserLocation | null>(null);
  const [selectedLocationLabel, setSelectedLocationLabel] = useState<string>('');

  // Track saved items per opportunity
  const [savedItemsMap, setSavedItemsMap] = useState<Record<string, boolean>>({});

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProductTitle, setSelectedProductTitle] = useState<string>('');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
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
  const trackedViewRef = useRef<string>('');

  // ✅ NEW: Track opportunity open time for accurate close event
  const oppOpenTimeRef = useRef<number>(Date.now());
  const lastOpenOpportunityIdRef = useRef<string | null>(null);

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

  // ✅ FIX: Use queryFn with proper signature - wrap in arrow function
  const { data, isLoading: queryLoading, error: queryError } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => feedService.getOpportunities(),
  });

  // ============================================================
  // LOCATION HANDLING
  // ============================================================

  useEffect(() => {
    const getLocation = async () => {
      try {
        setIsLocationLoading(true);
        const location = await locationService.getCurrentLocation();
        if (location) {
          const locationString = locationService.formatLocation(location);
          setUserLocation(locationString);
          setSelectedLocation(location);
          setSelectedLocationLabel(locationString);
        } else {
          const defaultLoc = 'Jinja, Uganda';
          setUserLocation(defaultLoc);
          setSelectedLocationLabel(defaultLoc);
        }
      } catch (error) {
        console.error('Error getting location:', error);
        setUserLocation('Jinja, Uganda');
        setSelectedLocationLabel('Jinja, Uganda');
      } finally {
        setIsLocationLoading(false);
      }
    };
    getLocation();
  }, []);

  const getLocationDisplay = useCallback(() => {
    if (isLocationLoading) {
      return 'Detecting...';
    }

    if (selectedLocation) {
      const details = locationService.getDetailedLocationDisplay(selectedLocation);
      return details.primary || userLocation;
    }

    return userLocation || 'Jinja, Uganda';
  }, [isLocationLoading, selectedLocation, userLocation]);

  const handleLocationSelect = useCallback(
    (location: UserLocation | null, label: string) => {
      console.log('📍 Location selected:', label);

      if (location) {
        setSelectedLocation(location);
        setSelectedLocationLabel(label);
        setUserLocation(label);

        if (data && data.length > 0) {
          setIsApplyingRecommendations(true);
          setHasAppliedRecommendations(false);

          const applyWithLocation = async () => {
            try {
              let result: Opportunity[] = [];

              if (user?.id) {
                result = await recommendationService.getPersonalizedRecommendations(
                  data,
                  user.id,
                  location
                );
              } else {
                result = recommendationService.getNewUserRecommendations(data, location);
              }

              setOpportunities(result);
              setHasAppliedRecommendations(true);
            } catch (error) {
              console.error('Error refreshing recommendations:', error);
              setOpportunities(data);
            } finally {
              setIsApplyingRecommendations(false);
            }
          };

          applyWithLocation();
        }
      } else {
        setUserLocation(label);
        setSelectedLocationLabel(label);
        setSelectedLocation(null);
      }
    },
    [data, user?.id, setOpportunities]
  );

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

  useEffect(() => {
    setHasAppliedRecommendations(false);
    trackedViewRef.current = '';
  }, [data]);

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
          let result: Opportunity[] = [];

          if (user?.id) {
            console.log('👤 Getting personalized recommendations for user:', user.id);
            result = await recommendationService.getPersonalizedRecommendations(data, user.id);

            if (result.length > 0) {
              for (const item of result.slice(0, 3)) {
                recommendationService
                  .trackInteraction(user.id, item.id, 'view', mapItemType(item.type))
                  .catch(() => {});
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
    async (opportunity: Opportunity) => {
      if (trackedViewRef.current === opportunity.id) return;

      if (user?.id) {
        try {
          trackedViewRef.current = opportunity.id;
          await recommendationService.trackInteraction(
            user.id,
            opportunity.id,
            'view',
            mapItemType(opportunity.type)
          );
        } catch (error) {
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

  // ============================================================
  // ✅ FIX: Viewable Items Handler — now owns opportunity_open/close tracking
  // ============================================================

  const viewabilityConfigRef = useRef(VIEWABILITY_CONFIG);

  const onViewableItemsChangedRef = useRef<
    | ((info: {
        viewableItems: ViewToken<Opportunity>[];
        changed: ViewToken<Opportunity>[];
      }) => void)
    | null
  >(null);

  useEffect(() => {
    onViewableItemsChangedRef.current = (info: {
      viewableItems: ViewToken<Opportunity>[];
      changed: ViewToken<Opportunity>[];
    }) => {
      const { viewableItems } = info;
      if (!viewableItems || viewableItems.length === 0) return;

      const firstItem = viewableItems[0];
      const index = firstItem.index;

      if (index === null || index === undefined) return;
      if (index === currentIndex) return;
      if (index < 0 || index >= uniqueOpportunities.length) return;

      const nextOpp = uniqueOpportunities[index];
      const prevOpp = uniqueOpportunities[currentIndex];

      // ✅ Emit opportunity_close for the one we're leaving
      if (prevOpp && lastOpenOpportunityIdRef.current === prevOpp.id) {
        const timeSpent = Date.now() - oppOpenTimeRef.current;
        const closeEvent: BehavioralEvent = {
          type: 'opportunity_close',
          timeSpent,
        };
        if (__DEV__) console.log('📊 Behavioral Event:', closeEvent);
      }

      // ✅ Emit opportunity_open for the one we're entering
      if (nextOpp) {
        oppOpenTimeRef.current = Date.now();
        lastOpenOpportunityIdRef.current = nextOpp.id;
        const openEvent: BehavioralEvent = {
          type: 'opportunity_open',
          sceneIndex: 0,
          sceneType: 'media',
          source: 'swipe',
        };
        if (__DEV__) console.log('📊 Behavioral Event:', openEvent);
      }

      setCurrentIndex(index);

      if (!isAuthenticated && isGuest) {
        setSwipeCount((prev) => prev + 1);
      }

      if (nextOpp) {
        trackOpportunityView(nextOpp);
      }
      setContextPanelView(null);
    };
  }, [
    currentIndex,
    uniqueOpportunities,
    isAuthenticated,
    isGuest,
    trackOpportunityView,
    setCurrentIndex,
  ]);

  const handleViewableItemsChanged = useCallback(
    (info: {
      viewableItems: ViewToken<Opportunity>[];
      changed: ViewToken<Opportunity>[];
    }) => {
      if (onViewableItemsChangedRef.current) {
        onViewableItemsChangedRef.current(info);
      }
    },
    []
  );

  // ✅ NEW: Fire initial opportunity_open once the feed first renders
  useEffect(() => {
    if (uniqueOpportunities.length > 0 && lastOpenOpportunityIdRef.current === null) {
      const firstOpp = uniqueOpportunities[currentIndex];
      if (firstOpp) {
        lastOpenOpportunityIdRef.current = firstOpp.id;
        oppOpenTimeRef.current = Date.now();
        if (__DEV__) {
          console.log('📊 Behavioral Event:', {
            type: 'opportunity_open',
            sceneIndex: 0,
            sceneType: 'media',
            source: 'tap',
          });
        }
      }
    }
  }, [uniqueOpportunities, currentIndex]);

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
    async (opportunity: Opportunity) => {
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
        const userDisplayName = opportunity.userFullName || 'User';
        const message = `🛍️ Check out ${opportunity.title}\n\n👤 ${userDisplayName}\n💰 UGX ${opportunity.price.toLocaleString()}\n📍 ${
          opportunity.area || 'Available nearby'
        }\n\nDownload Munolink to discover more!`;
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

  const handleDirectionsPress = useCallback((userName: string, area: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log(`📍 Directions to ${userName} in ${area}`);
    setShowDirectionsModal(true);
  }, []);

  const handleAIPress = useCallback(
    (opportunity: Opportunity) => {
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
    (opportunity: Opportunity) => {
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
    (opportunity: Opportunity, isLoved: boolean) => {
      if (!isAuthenticated) {
        Alert.alert('🔒 Join Munolink', 'Create a free account to save opportunities.', [
          { text: 'Continue Browsing', style: 'cancel' },
          { text: 'Join Now', onPress: () => navigation.navigate('Join') },
        ]);
        return;
      }
      if (user?.id && isLoved) {
        setSavedItemsMap((prev) => ({
          ...prev,
          [opportunity.id]: true,
        }));
        recommendationService
          .trackInteraction(user.id, opportunity.id, 'save', mapItemType(opportunity.type))
          .catch(() => {});
      }
    },
    [isAuthenticated, navigation, user?.id]
  );

  const handleSavePress = useCallback(
    (opportunity: Opportunity) => {
      if (!isAuthenticated) {
        Alert.alert('🔒 Join Munolink', 'Create a free account to save items.', [
          { text: 'Continue Browsing', style: 'cancel' },
          { text: 'Join Now', onPress: () => navigation.navigate('Join') },
        ]);
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const currentSaved = savedItemsMap[opportunity.id] || false;
      const newSaved = !currentSaved;

      setSavedItemsMap((prev) => ({
        ...prev,
        [opportunity.id]: newSaved,
      }));

      if (user?.id) {
        recommendationService
          .trackInteraction(
            user.id,
            opportunity.id,
            newSaved ? 'save' : 'unsave',
            mapItemType(opportunity.type)
          )
          .catch(() => {});
      }

      console.log(newSaved ? '🔖 Saved:' : '🔖 Unsaved:', opportunity.title);
    },
    [isAuthenticated, navigation, user?.id, savedItemsMap]
  );

  const handleFollowPress = useCallback(
    (opportunity: Opportunity) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.navigate('Inbox', {
        userId: opportunity.userId,
        userName: opportunity.userFullName || 'User',
      });
    },
    [navigation]
  );

  // ✅ FIX: Inbox Press - Opens direct chat with the user
  const handleInboxPress = useCallback(() => {
    if (!currentOpportunity) {
      console.warn('⚠️ No current opportunity');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!isAuthenticated) {
      Alert.alert('🔒 Join Munolink', 'Create a free account to message sellers and providers.', [
        { text: 'Continue Browsing', style: 'cancel' },
        { text: 'Join Now', onPress: () => navigation.navigate('Join') },
      ]);
      return;
    }

    const targetUserId = currentOpportunity.userId || '';
    const targetUserName = currentOpportunity.userFullName || 'User';

    console.log(`💬 Opening inbox with: ${targetUserName} (${targetUserId})`);

    navigation.navigate('Inbox', {
      userId: targetUserId,
      userName: targetUserName,
    });
  }, [currentOpportunity, isAuthenticated, navigation]);

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

  // --- Render Desktop Nav Arrows ---
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
          style={[
            styles.navArrow,
            currentIndex === uniqueOpportunities.length - 1 && styles.navArrowDisabled,
          ]}
          onPress={goToNext}
          disabled={currentIndex === uniqueOpportunities.length - 1}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-down"
            size={28}
            color={currentIndex === uniqueOpportunities.length - 1 ? '#555' : '#FFFFFF'}
          />
        </TouchableOpacity>
      </View>
    );
  }, [isDesktop, currentIndex, uniqueOpportunities.length, goToPrevious, goToNext]);

  // --- Render Action Button (Inbox button at bottom) ---
  const renderActionButton = useCallback(() => {
    if (!currentOpportunity) return null;

    return (
      <View style={styles.buttonWrapper}>
        <TouchableOpacity
          style={styles.inboxButton}
          onPress={handleInboxPress}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#4A7DFF', '#6B94FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.inboxButtonGradient}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
            <Text style={styles.inboxButtonText}>Inbox</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }, [currentOpportunity, handleInboxPress]);

  // ============================================================
  // RENDER ITEM
  // ============================================================
  const renderItem = useCallback(
    ({ item, index }: { item: Opportunity; index: number }) => {
      const isSaved = savedItemsMap[item.id] || false;

      // ✅ NEW: is this feed item the currently visible one?
      const isVisible = index === currentIndex;

      // ✅ Extract price from specifications if available
      let price = item.price || 0;
      let priceType: 'fixed' | 'negotiable' | 'starting_from' | 'free' = 'fixed';
      const specifications = (item as Opportunity & {
        specifications?: Record<string, unknown>;
      }).specifications;

      if (specifications) {
        const specPrice = specifications.price || specifications.regular_price || null;
        if (specPrice) {
          price = typeof specPrice === 'number' ? specPrice : parseFloat(String(specPrice));
        }
        if (
          specifications.price_type === 'fixed' ||
          specifications.price_type === 'negotiable' ||
          specifications.price_type === 'starting_from' ||
          specifications.price_type === 'free'
        ) {
          priceType = specifications.price_type;
        }
      }

      if (price === 0 || price === null || price === undefined) {
        price = 0;
        priceType = 'free';
      }

      const mediaItems = [];

      let videoThumbnail: string | undefined = undefined;

      if (item.catalogImages && item.catalogImages.length > 0) {
        videoThumbnail = item.catalogImages[0];
      } else if (item.imageUrl) {
        videoThumbnail = item.imageUrl;
      } else {
        const encodedTitle = encodeURIComponent(item.title || 'Video');
        videoThumbnail = `https://via.placeholder.com/400x400/1A2A4F/4A7DFF?text=${encodedTitle.substring(
          0,
          20
        )}`;
      }

      if (item.video) {
        mediaItems.push({
          type: 'video' as const,
          url: item.video,
          thumbnail: videoThumbnail,
        });
      }

      if (item.catalogImages && item.catalogImages.length > 0) {
        for (const img of item.catalogImages) {
          if (mediaItems.some((m) => m.url === img)) continue;
          mediaItems.push({ type: 'image' as const, url: img });
        }
      } else if (item.imageUrl && !item.video) {
        mediaItems.push({ type: 'image' as const, url: item.imageUrl });
      }

      if (mediaItems.length === 0) {
        const placeholderText = encodeURIComponent(item.title || 'Item');
        mediaItems.push({
          type: 'image' as const,
          url: `https://via.placeholder.com/400x400/1A2A4F/4A7DFF?text=${placeholderText.substring(
            0,
            20
          )}`,
        });
      }

      return (
        <View
          style={{
            height: isDesktop ? height : height,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <SceneRenderer
            media={mediaItems}
            title={item.title}
            price={price}
            priceType={priceType}
            currency={item.currency || 'UGX'}
            userName={item.userFullName || 'User'}
            userAvatar={item.userAvatar || null}
            description={item.description || null}
            rating={null}
            area={item.area || null}
            inStock={true}
            type={item.type || 'product'}
            createdAt={item.createdAt}
            isDesktop={isDesktop}
            width={isDesktop ? 420 : width}
            height={isDesktop ? height : height}
            onShowMore={() => handleShowMorePress(item)}
            onShare={() => handleSharePress(item)}
            onSave={() => handleSavePress(item)}
            onPrimaryAction={() => {
              navigation.navigate('Inbox', {
                userId: item.userId,
                userName: item.userFullName || 'User',
              });
            }}
            onSceneChange={(sceneIdx, source) => {
              if (__DEV__) console.log(`Scene changed to: ${sceneIdx}`, source);
            }}
            onBehavioralEvent={(event) => {
              // ✅ SceneRenderer now only emits scene_view.
              // opportunity_open / opportunity_close are handled by
              // onViewableItemsChanged above.
              if (__DEV__) console.log('📊 Behavioral Event:', event);
            }}
            autoPlay={false}
            autoPlayInterval={5000}
            resetKey={item.id}
            bottomOffset={0}
            isVisible={isVisible}
          />

          <View style={styles.actionRailWrapper}>
            <FloatingActionRail
              key={`rail-${item.id}`}
              opportunity={item}
              onUserPress={() => {
                navigation.navigate('UserProfile' as any, {
                  userId: item.userId,
                  userName: item.userFullName || 'User',
                });
              }}
              onReviewsPress={(productId) => handleReviewsPress(productId, item.title)}
              onDirectionsPress={(userName, area) => {
                console.log(`📍 Directions to ${userName} in ${area}`);
                setShowDirectionsModal(true);
              }}
              onSharePress={handleSharePress}
              onAIPress={handleAIPress}
              onSavePress={handleSavePress}
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
    },
    [
      isDesktop,
      height,
      width,
      currentIndex,
      navigation,
      savedItemsMap,
      handleShowMorePress,
      handleSharePress,
      handleSavePress,
      handleAIPress,
      handleReviewsPress,
    ]
  );

  // --- Loading States ---
  if (isLoading || queryLoading || isApplyingRecommendations) {
    if (isApplyingRecommendations) {
      return (
        <SafeAreaView style={[styles.centered, { height }]} edges={['top']}>
          <ActivityIndicator size="large" color="#4A7DFF" />
          <Text style={[styles.loadingText, { fontSize: width < 380 ? 14 : 16 }]}>
            Personalizing your feed...
          </Text>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={[styles.container, { height }]} edges={['top']}>
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />
          <FeedListSkeleton isDesktop={isDesktop} />
        </SafeAreaView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.centered, { height }]} edges={['top']}>
        <Text style={[styles.errorText, { fontSize: width < 380 ? 16 : 18 }]}>
          Error loading feed
        </Text>
        <Text style={[styles.errorSubtext, { fontSize: width < 380 ? 12 : 14 }]}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (uniqueOpportunities.length === 0) {
    return (
      <SafeAreaView style={[styles.centered, { height }]} edges={['top']}>
        <Text style={[styles.emptyText, { fontSize: width < 380 ? 16 : 18 }]}>
          No opportunities found
        </Text>
        <Text style={[styles.emptySubtext, { fontSize: width < 380 ? 12 : 14 }]}>
          Check back later for new deals!
        </Text>
      </SafeAreaView>
    );
  }

  // --- Main Render ---
  return (
    <ResponsiveLayout
      currentRoute="Feed"
      onNavigate={(route) => {
        (navigation as any).navigate(route);
      }}
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
                    <Image
                      source={require('../../../assets/logo.png')}
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.locationContainer}
                    onPress={() => setShowLocationPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location-outline" size={16} color="#4A7DFF" />
                    <Text style={[styles.locationText, { fontSize: 13 }]} numberOfLines={1}>
                      {getLocationDisplay()}
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
              viewabilityConfig={viewabilityConfigRef.current}
              onViewableItemsChanged={handleViewableItemsChanged}
              getItemLayout={(data, index) => ({
                length: height,
                offset: height * index,
                index,
              })}
              initialScrollIndex={currentIndex}
              removeClippedSubviews={true}
              maxToRenderPerBatch={isDesktop ? 3 : 2}
              windowSize={isDesktop ? 5 : 3}
              onScrollToIndexFailed={() => {}}
              scrollEventThrottle={32}
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
              opportunity={currentOpportunity}
              onClose={handleCloseDirections}
              isDesktopView={false}
            />

            <LocationPicker
              visible={showLocationPicker}
              onClose={() => setShowLocationPicker(false)}
              onSelectLocation={handleLocationSelect}
              currentLocationLabel={selectedLocationLabel || userLocation}
              isLocationLoading={isLocationLoading}
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

// ============================================================
// STYLES
// ============================================================

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
  inboxButton: {
    borderRadius: 20,
    overflow: 'hidden',
    width: 'auto',
    maxWidth: 200,
    shadowColor: '#4A7DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  inboxButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 8,
  },
  inboxButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  actionRailWrapper: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -150 }],
    zIndex: 50,
  },

  // ============================================================
  // SKELETON STYLES
  // ============================================================
  skeletonContainer: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  skeletonCard: {
    position: 'relative',
    backgroundColor: '#0D0D1A',
    overflow: 'hidden',
  },
skeletonBackground: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: '#1A1A2E',
},
skeletonShimmerOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
},
  skeletonShimmerGradient: {
    width: '100%',
    height: '100%',
  },
  skeletonContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  skeletonImage: {
    width: '100%',
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  skeletonImageShimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  skeletonTitleContainer: {
    gap: 8,
    marginBottom: 12,
  },
  skeletonTitle: {
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    width: '80%',
  },
  skeletonPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  skeletonPrice: {
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  skeletonRating: {
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  skeletonShopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  skeletonShopIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  skeletonShopName: {
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
  },
  skeletonActionContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  skeletonActionButton: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
  },
  skeletonRail: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -150 }],
    gap: 10,
    alignItems: 'center',
  },
  skeletonRailDesktop: {
    right: 24,
    gap: 16,
  },
  skeletonRailButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  skeletonNavArrows: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    gap: 12,
    alignItems: 'center',
  },
  skeletonNavArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  skeletonListContainer: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  skeletonTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    backgroundColor: 'rgba(13, 13, 26, 0.95)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  skeletonTopBarShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 21,
  },
  skeletonLogo: {
    width: 130,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 4,
  },
  skeletonLocation: {
    width: 120,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
  },
  skeletonSearch: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
  },
});