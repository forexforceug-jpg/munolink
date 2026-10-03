// src/features/feed/FeedScreen.tsx

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import {
  SceneRenderer,
  BehavioralEvent,
} from '../opportunity/renderer/SceneRenderer';
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
  Platform,
  RefreshControl,
  Linking,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { FloatingActionRail } from './components/FloatingActionRail';
import { useFeedStore } from '../../store/feedStore';
import {
  feedService,
  Opportunity,
  calculateDistance,
} from '../../services/feed.service';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
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
import { useIsFocused } from '@react-navigation/native';
import { StyledAlert } from './components/StyledAlert';
import { sharePost } from '../../utils/share';
import { getTabBarHeight } from '../../navigation/TabNavigator';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// Link shown by the "Open in App" button on web.
const APP_DEEP_LINK =
  'https://expo.dev/accounts/forexforceug/projects/munolink/builds/affe04a9-726f-4d71-877f-c83907ba7414';

// Gap between the info panel's bottom edge and the tab bar's top edge.
const SCENE_INFO_GAP = 40;

// Fallback desktop rectangle dimensions used before the wrapper's
// onLayout fires. Matches DesktopLayout's fallback (9:16 portrait).
const DESKTOP_FEED_ASPECT = 9 / 16;
const DESKTOP_FALLBACK_MAX_HEIGHT = 900;

type FeedScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MainTabs'
>;

interface FeedScreenProps {
  navigation: FeedScreenNavigationProp;
  route?: {
    params?: {
      openPostId?: string;
    };
  };
}

const FEATURED_COUNT = 14;
const GUEST_PROMPT_THRESHOLD = 3;

const VIEWABILITY_CONFIG: ViewabilityConfig = {
  itemVisiblePercentThreshold: 50,
  minimumViewTime: 300,
};

const TikTokLoadingSkeleton: React.FC<{ label?: string }> = ({ label }) => {
  return (
    <View style={styles.tiktokLoaderContainer}>
      <ActivityIndicator size="large" color="#FFFFFF" />
      {label ? <Text style={styles.tiktokLoaderLabel}>{label}</Text> : null}
    </View>
  );
};

const ItemMediaLoadingSpinner: React.FC = () => {
  return (
    <View style={styles.itemMediaSpinnerOverlay} pointerEvents="none">
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
};

export const FeedScreen = ({ navigation, route }: FeedScreenProps) => {
  const { height, width } = useWindowDimensions();
  const { isDesktop } = useBreakpoint();
  const { isAuthenticated, isGuest, user } = useAuth();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  // The tab bar's rendered height, from TabNavigator's single source of truth.
  const tabBarHeight = getTabBarHeight(insets);

  // Native-only clamp (desktop has no tab bar).
  const computedMaxVisible = Math.max(0, height - tabBarHeight);

  const [measuredVisibleHeight, setMeasuredVisibleHeight] = useState<
    number | null
  >(null);

  const visibleHeight =
    measuredVisibleHeight != null
      ? Math.min(measuredVisibleHeight, computedMaxVisible)
      : computedMaxVisible;

  // ✅ Desktop: measure the feed rectangle from DesktopLayout's
  // wrapper, so item frames exactly match it.
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
    : visibleHeight;

  const itemWidth = isDesktop
    ? desktopItemWidth ?? desktopFallbackWidth
    : width;

  const flatListRef = useRef<FlatList>(null);
  const reviewsSheetRef = useRef<BottomSheetModal>(null);
  const aiSheetRef = useRef<BottomSheetModal>(null);

  // ============================================================
  // ✅ TIKTOK-STYLE FEED FILTER
  // ============================================================
  const [activeFeed, setActiveFeed] = useState<'forYou' | 'following'>(
    'forYou'
  );
  const [followingOpportunities, setFollowingOpportunities] = useState<
    Opportunity[]
  >([]);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);

  const [userLocation, setUserLocation] = useState<string>('Detecting...');
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<UserLocation | null>(
    null
  );
  const [selectedLocationLabel, setSelectedLocationLabel] =
    useState<string>('');

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

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProductTitle, setSelectedProductTitle] = useState<string>('');
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [aiViewActive, setAiViewActive] = useState(false);
  const [aiContextHint, setAiContextHint] = useState<string>('');
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [swipeCount, setSwipeCount] = useState(0);
  const [contextPanelView, setContextPanelView] = useState<
    'details' | 'reviews' | 'directions' | null
  >(null);

  const [refreshing, setRefreshing] = useState(false);
  const [feedVersion, setFeedVersion] = useState(0);

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

  const recommendationsRunningRef = useRef(false);
  const recommendationsAppliedForRef = useRef<unknown>(null);

  const trackedViewRef = useRef<string>('');

  const oppOpenTimeRef = useRef<number>(Date.now());
  const lastOpenOpportunityIdRef = useRef<string | null>(null);

  const hasFetchedOnceRef = useRef(false);

  const pendingOpenPostIdRef = useRef<string | null>(null);
  const lastHandledPostIdRef = useRef<string | null>(null);

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

  // ============================================================
  // QUERY
  // ============================================================
  const {
    data,
    isLoading: queryLoading,
    isFetching: queryFetching,
    error: queryError,
    status: queryStatus,
  } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      let userCoords: { latitude: number; longitude: number } | undefined;
      try {
        const loc = await locationService.getCurrentLocation();
        if (loc?.latitude != null && loc?.longitude != null) {
          userCoords = { latitude: loc.latitude, longitude: loc.longitude };
        }
      } catch (err) {
        console.log('⚠️ Could not get location for distances:', err);
      }
      return feedService.getOpportunities(userCoords);
    },
  });

  useEffect(() => {
    if (queryStatus === 'success' || queryStatus === 'error') {
      hasFetchedOnceRef.current = true;
    }
  }, [queryStatus]);

  // ============================================================
  // LOCATION HANDLING (state only — no UI trigger)
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

  const handleLocationSelect = useCallback(
    (location: UserLocation | null, label: string) => {
      console.log('📍 Location selected:', label);

      if (location) {
        setSelectedLocation(location);
        setSelectedLocationLabel(label);
        setUserLocation(label);

        if (data && data.length > 0) {
          (async () => {
            try {
              let result: Opportunity[] = [];

              if (user?.id) {
                result =
                  await recommendationService.getPersonalizedRecommendations(
                    data,
                    user.id,
                    location
                  );
              } else {
                result = recommendationService.getNewUserRecommendations(
                  data,
                  location
                );
              }

              const withDistances = result.map((opp) => {
                if (
                  opp.userLatitude != null &&
                  opp.userLongitude != null
                ) {
                  return {
                    ...opp,
                    distance: calculateDistance(
                      location.latitude,
                      location.longitude,
                      opp.userLatitude,
                      opp.userLongitude
                    ),
                  };
                }
                return opp;
              });

              setOpportunities(withDistances);
            } catch (error) {
              console.error('Error refreshing recommendations:', error);
            }
          })();
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
    const map = new Map<string, Opportunity>();
    opportunities.forEach((item) => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }, [opportunities]);

  // ============================================================
  // ✅ ACTIVE FEED ITEMS
  // ============================================================
  const activeFeedItems = useMemo(() => {
    return activeFeed === 'following'
      ? followingOpportunities
      : uniqueOpportunities;
  }, [activeFeed, followingOpportunities, uniqueOpportunities]);

  const currentOpportunity = useMemo(() => {
    if (!activeFeedItems || activeFeedItems.length === 0) return null;
    if (currentIndex < 0 || currentIndex >= activeFeedItems.length)
      return null;
    return activeFeedItems[currentIndex] || null;
  }, [activeFeedItems, currentIndex]);

  const featuredOpportunities = useMemo(() => {
    return uniqueOpportunities.slice(0, FEATURED_COUNT);
  }, [uniqueOpportunities]);

  useEffect(() => {
    if (queryError) {
      setError(queryError.message);
    }
    setLoading(queryLoading);
  }, [queryError, queryLoading, setError, setLoading]);

  // ============================================================
  // ✅ FETCH — Following feed
  // ============================================================
  const loadFollowingFeed = useCallback(async () => {
    if (!user?.id) {
      setFollowingOpportunities([]);
      return;
    }

    setIsLoadingFollowing(true);
    try {
      const { data: followRows, error: followError } = await (
        supabase as any
      )
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followError) throw followError;

      const followedIds: string[] = (followRows || [])
        .map((r: any) => r.following_id)
        .filter(Boolean);

      if (followedIds.length === 0) {
        setFollowingOpportunities([]);
        return;
      }

      let userCoords: { latitude: number; longitude: number } | undefined;
      try {
        const loc = await locationService.getCurrentLocation();
        if (loc?.latitude != null && loc?.longitude != null) {
          userCoords = { latitude: loc.latitude, longitude: loc.longitude };
        }
      } catch {
        /* ignore */
      }

      let raw: Opportunity[] = [];
      const svc: any = feedService as any;
      if (typeof svc.getOpportunitiesByUserIds === 'function') {
        raw = await svc.getOpportunitiesByUserIds(followedIds, userCoords);
      } else {
        const all = await feedService.getOpportunities(userCoords);
        raw = all.filter((o) => followedIds.includes(o.userId));
      }

      setFollowingOpportunities(raw || []);
    } catch (err) {
      if (__DEV__) console.error('❌ Failed to load Following feed:', err);
      setFollowingOpportunities([]);
    } finally {
      setIsLoadingFollowing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeFeed === 'following') {
      loadFollowingFeed();
    }
  }, [activeFeed, loadFollowingFeed]);

  // ============================================================
  // ✅ TAB SWITCH RESET
  // ============================================================
  useEffect(() => {
    setCurrentIndex(0);
    setContextPanelView(null);
    setFeedVersion((v) => v + 1);
    requestAnimationFrame(() => {
      try {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      } catch {
        /* noop */
      }
    });
  }, [activeFeed, setCurrentIndex]);

  // ============================================================
  // DEEP LINK — CAPTURE
  // ============================================================
  useEffect(() => {
    const openPostId = route?.params?.openPostId;
    if (openPostId) {
      pendingOpenPostIdRef.current = openPostId;
      setActiveFeed('forYou');
      if (__DEV__) console.log('📌 Pending deep-linked post:', openPostId);
    }
  }, [route?.params?.openPostId]);

  // ============================================================
  // ✅ DEEP LINK — FALLBACK FETCH
  // ============================================================
  useEffect(() => {
    const openPostId = pendingOpenPostIdRef.current;

    if (!openPostId) return;
    if (uniqueOpportunities.some((o) => o.id === openPostId)) return;

    let cancelled = false;

    (async () => {
      if (__DEV__) {
        console.log('🟣 [DeepLink] Fetching post by id:', openPostId);
      }

      let userCoords: { latitude: number; longitude: number } | undefined;
      try {
        const loc = await locationService.getCurrentLocation();
        if (loc?.latitude != null && loc?.longitude != null) {
          userCoords = { latitude: loc.latitude, longitude: loc.longitude };
        }
      } catch {
        /* ignore */
      }

      const single = await feedService.getOpportunityById(
        openPostId,
        userCoords
      );

      if (cancelled) return;

      if (!single) {
        if (__DEV__) {
          console.warn('🟣 [DeepLink] Post not found in DB:', openPostId);
        }
        pendingOpenPostIdRef.current = null;
        lastHandledPostIdRef.current = openPostId;
        return;
      }

      if (__DEV__) {
        console.log('🟣 [DeepLink] Injected post into feed:', single.title);
      }

      setCurrentIndex(0);
      setOpportunities([single, ...opportunities]);
      setFeedVersion((v) => v + 1);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    uniqueOpportunities,
    opportunities,
    setCurrentIndex,
    setOpportunities,
  ]);

  // ============================================================
  // ✅ DEEP LINK — SCROLL TO POST
  // ============================================================
  useEffect(() => {
    const openPostId = pendingOpenPostIdRef.current;
    if (!openPostId) return;
    if (uniqueOpportunities.length === 0) return;
    if (lastHandledPostIdRef.current === openPostId) return;

    const index = uniqueOpportunities.findIndex((o) => o.id === openPostId);
    if (index === -1) {
      if (__DEV__) {
        console.log('⚠️ Deep-linked post not in feed yet:', openPostId);
      }
      return;
    }

    if (__DEV__) {
      console.log(
        '✅ Scrolling to deep-linked post:',
        openPostId,
        'index:',
        index
      );
    }

    let cancelled = false;
    let attempts = 0;

    const tryScroll = () => {
      if (cancelled) return;
      attempts++;

      try {
        flatListRef.current?.scrollToIndex({ index, animated: false });
        setCurrentIndex(index);

        lastHandledPostIdRef.current = openPostId;
        pendingOpenPostIdRef.current = null;

        try {
          navigation.setParams({ openPostId: undefined } as any);
        } catch {
          /* noop */
        }

        if (__DEV__) console.log('🎯 Scrolled to post on attempt', attempts);
      } catch (err) {
        if (attempts < 20) {
          setTimeout(tryScroll, 150);
        } else if (__DEV__) {
          console.warn(
            '❌ Gave up scrolling to post after',
            attempts,
            'attempts:',
            err
          );
        }
      }
    };

    const timer = setTimeout(tryScroll, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [uniqueOpportunities, navigation, setCurrentIndex]);

  const handleScrollToIndexFailed = useCallback(
    (info: {
      index: number;
      highestMeasuredFrameIndex: number;
      averageItemLength: number;
    }) => {
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: info.index,
            animated: false,
            viewPosition: 0,
          });
        } catch (err) {
          /* noop */
        }
      }, 200);
    },
    []
  );

  // ============================================================
  // PREFETCH LIKES
  // ============================================================
  useEffect(() => {
    if (!user?.id) return;
    const postIds = activeFeedItems.map((o) => o.id);
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
  }, [user?.id, activeFeedItems]);

  // ============================================================
  // INITIALISE loadingItemsMap
  // ============================================================
  useEffect(() => {
    if (activeFeedItems.length === 0) return;

    setLoadingItemsMap((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const opp of activeFeedItems) {
        if (next[opp.id] === undefined) {
          next[opp.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [activeFeedItems]);

  const handleMediaLoadStateChange = useCallback(
    (opportunityId: string, isLoading: boolean) => {
      setLoadingItemsMap((prev) => {
        if (prev[opportunityId] === isLoading) return prev;
        return { ...prev, [opportunityId]: isLoading };
      });
    },
    []
  );

  // ============================================================
  // PULL-TO-REFRESH
  // ============================================================
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);

    try {
      if (activeFeed === 'following') {
        await loadFollowingFeed();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      let userCoords: { latitude: number; longitude: number } | undefined;
      try {
        const loc = await locationService.getCurrentLocation();
        if (loc?.latitude != null && loc?.longitude != null) {
          userCoords = { latitude: loc.latitude, longitude: loc.longitude };
        }
      } catch (err) {
        if (__DEV__) console.log('⚠️ Refresh: no location, using fallback');
      }

      const freshRaw = await feedService.getOpportunities(userCoords);

      if (!freshRaw || freshRaw.length === 0) {
        if (__DEV__)
          console.log('ℹ️ Refresh returned no data — keeping existing');
        return;
      }

      let result: Opportunity[] = freshRaw;
      try {
        if (user?.id) {
          const personalized =
            await recommendationService.getPersonalizedRecommendations(
              freshRaw,
              user.id
            );
          if (personalized && personalized.length > 0) {
            result = personalized;
          }
        } else {
          const anon =
            recommendationService.getNewUserRecommendations(freshRaw);
          if (anon && anon.length > 0) result = anon;
        }
      } catch (err) {
        if (__DEV__) console.warn('⚠️ Refresh recommender failed:', err);
      }

      if (userCoords) {
        result = result.map((opp) => {
          if (opp.userLatitude != null && opp.userLongitude != null) {
            return {
              ...opp,
              distance: calculateDistance(
                userCoords!.latitude,
                userCoords!.longitude,
                opp.userLatitude,
                opp.userLongitude
              ),
            };
          }
          return opp;
        });
      }

      setOpportunities(result);
      setCurrentIndex(0);
      setContextPanelView(null);

      lastOpenOpportunityIdRef.current = null;
      trackedViewRef.current = '';

      setFeedVersion((v) => v + 1);

      requestAnimationFrame(() => {
        try {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        } catch {
          /* noop */
        }
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      if (__DEV__) console.error('❌ Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [
    refreshing,
    activeFeed,
    loadFollowingFeed,
    user?.id,
    setOpportunities,
    setCurrentIndex,
  ]);

  // ============================================================
  // SILENT RECOMMENDATION PASS
  // ============================================================
  useEffect(() => {
    if (!data || data.length === 0) return;

    if (recommendationsAppliedForRef.current === data) return;
    if (recommendationsRunningRef.current) return;

    recommendationsAppliedForRef.current = data;
    recommendationsRunningRef.current = true;

    (async () => {
      try {
        let result: Opportunity[] = [];

        if (user?.id) {
          result = await recommendationService.getPersonalizedRecommendations(
            data,
            user.id
          );

          if (result.length > 0) {
            for (const item of result.slice(0, 3)) {
              recommendationService
                .trackInteraction(
                  user.id,
                  item.id,
                  'view',
                  mapItemType(item.type)
                )
                .catch(() => {});
            }
          }
        } else {
          result = recommendationService.getNewUserRecommendations(data);
        }

        if (result && result.length > 0) {
          setOpportunities(result);
        }
      } catch (error) {
        console.error('❌ Error applying recommendations:', error);
      } finally {
        recommendationsRunningRef.current = false;
      }
    })();
  }, [data, user?.id, setOpportunities]);

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

  useEffect(() => {
    if (swipeCount >= GUEST_PROMPT_THRESHOLD && !isAuthenticated && isGuest) {
      setShowGuestPrompt(true);
    }
  }, [swipeCount, isAuthenticated, isGuest]);

  // ============================================================
  // STABLE VIEWABILITY HANDLER
  // ============================================================
  const onViewableItemsChangedRef = useRef<
    | ((info: {
        viewableItems: ViewToken<Opportunity>[];
        changed: ViewToken<Opportunity>[];
      }) => void)
    | null
  >(null);

  onViewableItemsChangedRef.current = (info) => {
    const { viewableItems } = info;
    if (!viewableItems || viewableItems.length === 0) return;

    const firstItem = viewableItems[0];
    const index = firstItem.index;

    if (index === null || index === undefined) return;
    if (index === currentIndex) return;
    if (index < 0 || index >= activeFeedItems.length) return;

    const nextOpp = activeFeedItems[index];
    const prevOpp = activeFeedItems[currentIndex];

    if (prevOpp && lastOpenOpportunityIdRef.current === prevOpp.id) {
      const timeSpent = Date.now() - oppOpenTimeRef.current;
      const closeEvent: BehavioralEvent = {
        type: 'opportunity_close',
        timeSpent,
      };
      if (__DEV__) console.log('📊 Behavioral Event:', closeEvent);
    }

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

  const handleViewableItemsChanged = useRef(
    (info: {
      viewableItems: ViewToken<Opportunity>[];
      changed: ViewToken<Opportunity>[];
    }) => {
      onViewableItemsChangedRef.current?.(info);
    }
  ).current;

  useEffect(() => {
    if (
      activeFeedItems.length > 0 &&
      lastOpenOpportunityIdRef.current === null
    ) {
      const firstOpp = activeFeedItems[currentIndex];
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
  }, [activeFeedItems, currentIndex]);

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
      } catch (error) {
        console.error('Error tracking share:', error);
      }

      try {
        await sharePost({
          id: opportunity.id,
          title: opportunity.title,
          price: opportunity.price,
          currency: opportunity.currency,
          sellerName: opportunity.userFullName,
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    },
    [user?.id]
  );

  const handleDirectionsPress = useCallback(
    (userName: string, area: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowDirectionsModal(true);
    },
    []
  );

  const handleAIPress = useCallback(
    (opportunity: Opportunity) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setSelectedOpportunity(opportunity);
      setAiContextHint('');

      if (isDesktop) {
        setAiViewActive(true);
      } else {
        setShowAIModal(true);
      }
    },
    [isDesktop]
  );

  const handleCloseAI = useCallback(() => {
    setShowAIModal(false);
    setAiViewActive(false);
    setSelectedOpportunity(null);
    setAiContextHint('');
  }, []);

  const handleCloseDirections = useCallback(() => {
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
        showStyledAlert({
          title: '🔒 Join Munolink',
          message: 'Create a free account to save opportunities.',
          icon: 'lock-closed',
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
      if (user?.id && isLoved) {
        setSavedItemsMap((prev) => ({
          ...prev,
          [opportunity.id]: true,
        }));
        recommendationService
          .trackInteraction(
            user.id,
            opportunity.id,
            'save',
            mapItemType(opportunity.type)
          )
          .catch(() => {});
      }
    },
    [isAuthenticated, navigation, user?.id, showStyledAlert, hideStyledAlert]
  );

  const handleSavePress = useCallback(
    async (opportunity: Opportunity) => {
      if (!isAuthenticated || !user?.id) {
        showStyledAlert({
          title: '🔒 Join Munolink',
          message: 'Create a free account to save items.',
          icon: 'lock-closed',
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

      const currentlySaved = savedItemsMap[opportunity.id] || false;
      const nextSaved = !currentlySaved;

      setSavedItemsMap((prev) => ({
        ...prev,
        [opportunity.id]: nextSaved,
      }));

      try {
        if (nextSaved) {
          const { error } = await (supabase as any)
            .from('saves')
            .insert({ user_id: user.id, post_id: opportunity.id });

          if (error && (error as any).code !== '23505') throw error;
        } else {
          const { error } = await (supabase as any)
            .from('saves')
            .delete()
            .eq('user_id', user.id)
            .eq('post_id', opportunity.id);

          if (error) throw error;
        }

        recommendationService
          .trackInteraction(
            user.id,
            opportunity.id,
            nextSaved ? 'save' : 'unsave',
            mapItemType(opportunity.type)
          )
          .catch(() => {});
      } catch (err) {
        console.error('Save toggle failed:', err);
        setSavedItemsMap((prev) => ({
          ...prev,
          [opportunity.id]: currentlySaved,
        }));
      }
    },
    [
      isAuthenticated,
      navigation,
      user?.id,
      savedItemsMap,
      showStyledAlert,
      hideStyledAlert,
    ]
  );

  const handleLikePress = useCallback(
    async (opportunity: Opportunity) => {
      if (!isAuthenticated || !user?.id) {
        showStyledAlert({
          title: '🔒 Join Munolink',
          message: 'Create a free account to like posts.',
          icon: 'lock-closed',
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
      isAuthenticated,
      user?.id,
      likedItemsMap,
      navigation,
      showStyledAlert,
      hideStyledAlert,
    ]
  );

  const handleInboxPress = useCallback(() => {
    if (!currentOpportunity) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!isAuthenticated) {
      showStyledAlert({
        title: '🔒 Join Munolink',
        message: 'Create a free account to message sellers and providers.',
        icon: 'lock-closed',
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

    const targetUserId = currentOpportunity.userId || '';
    const targetUserName = currentOpportunity.userFullName || 'User';

    navigation.navigate('Inbox', {
      userId: targetUserId,
      userName: targetUserName,
    });
  }, [
    currentOpportunity,
    isAuthenticated,
    navigation,
    showStyledAlert,
    hideStyledAlert,
  ]);

  const scrollToIndex = useCallback(
    (index: number) => {
      if (
        flatListRef.current &&
        index >= 0 &&
        index < activeFeedItems.length
      ) {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
        });
        setCurrentIndex(index);
        setContextPanelView(null);
      }
    },
    [activeFeedItems.length, setCurrentIndex]
  );

  const goToNext = useCallback(() => {
    if (currentIndex < activeFeedItems.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  }, [currentIndex, activeFeedItems.length, scrollToIndex]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  }, [currentIndex, scrollToIndex]);

  const renderDesktopNavArrows = useCallback(() => {
    if (!isDesktop) return null;

    return (
      <View style={{ alignItems: 'center', gap: 8 }}>
        <TouchableOpacity
          style={[
            styles.navArrow,
            currentIndex === 0 && styles.navArrowDisabled,
          ]}
          onPress={goToPrevious}
          disabled={currentIndex === 0}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-up"
            size={28}
            color={currentIndex === 0 ? '#555' : '#FFFFFF'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navArrow,
            currentIndex === activeFeedItems.length - 1 &&
              styles.navArrowDisabled,
          ]}
          onPress={goToNext}
          disabled={currentIndex === activeFeedItems.length - 1}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-down"
            size={28}
            color={
              currentIndex === activeFeedItems.length - 1
                ? '#555'
                : '#FFFFFF'
            }
          />
        </TouchableOpacity>
      </View>
    );
  }, [
    isDesktop,
    currentIndex,
    activeFeedItems.length,
    goToPrevious,
    goToNext,
  ]);

  // ✅ Single rail for desktop — rendered inside DesktopLayout's
  // right gutter so it can never be clipped by the feed rectangle.
  const renderDesktopActionRail = useCallback(() => {
    if (!isDesktop) return null;
    const opp = activeFeedItems[currentIndex];
    if (!opp) return null;

    return (
      <FloatingActionRail
        key={`desktop-rail-${opp.id}`}
        opportunity={opp}
        bottomInset={0}
        rightShift={0}
        isLiked={likedItemsMap[opp.id] || false}
        likeCount={likeCountMap[opp.id] ?? opp.likeCount ?? 0}
        onLikePress={handleLikePress}
        onUserPress={() => {
          navigation.navigate('UserProfile' as any, {
            userId: opp.userId,
            userName: opp.userFullName || 'User',
          });
        }}
        onReviewsPress={(productId) =>
          handleReviewsPress(productId, opp.title)
        }
        onDirectionsPress={() => {
          setShowDirectionsModal(true);
        }}
        onSharePress={handleSharePress}
        onAIPress={handleAIPress}
        onSavePress={handleSavePress}
        isSaved={savedItemsMap[opp.id] || false}
        savedCount={savedItemsMap[opp.id] ? 1 : opp.saveCount || 0}
        shareCount={opp.shareCount || 0}
        reviewCount={opp.commentCount || 0}
        distance={opp.distance || 0}
        userAvatar={opp.userAvatar || null}
      />
    );
  }, [
    isDesktop,
    activeFeedItems,
    currentIndex,
    likedItemsMap,
    likeCountMap,
    savedItemsMap,
    handleLikePress,
    handleReviewsPress,
    handleSharePress,
    handleAIPress,
    handleSavePress,
    navigation,
  ]);

  const renderItem = useCallback(
    ({ item, index }: { item: Opportunity; index: number }) => {
      const isSaved = savedItemsMap[item.id] || false;
      const isLiked = likedItemsMap[item.id] || false;
      const isVisible = isFocused && index === currentIndex;
      const isItemLoading = loadingItemsMap[item.id] === true;
      const specs = (item as any).specifications || {};

      let price = item.price || 0;
      let priceType:
        | 'fixed'
        | 'negotiable'
        | 'starting_from'
        | 'free'
        | 'showcase' = 'fixed';
      const specifications = (
        item as Opportunity & {
          specifications?: Record<string, unknown>;
        }
      ).specifications;

      if (specifications) {
        const specPrice =
          specifications.price || specifications.regular_price || null;
        if (specPrice) {
          price =
            typeof specPrice === 'number'
              ? specPrice
              : parseFloat(String(specPrice));
        }
        if (
          specifications.price_type === 'fixed' ||
          specifications.price_type === 'negotiable' ||
          specifications.price_type === 'starting_from' ||
          specifications.price_type === 'free' ||
          specifications.price_type === 'showcase'
        ) {
          priceType = specifications.price_type as any;
        }
      }

      if (
        (price === 0 || price === null || price === undefined) &&
        priceType !== 'free' &&
        priceType !== 'showcase'
      ) {
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

      const frameWidth = isDesktop ? itemWidth : width;
      const frameHeight = isDesktop ? itemHeight : visibleHeight;

      return (
        <View
          style={{
            height: frameHeight,
            width: frameWidth,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <SceneRenderer
            media={mediaItems}
            title={item.title}
            price={price}
            filter={specs.filter ?? null}
            textOverlays={specs.text_overlays ?? null}
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
            width={frameWidth}
            height={frameHeight}
            onShowMore={() => handleShowMorePress(item)}
            onShare={() => handleSharePress(item)}
            onSave={() => handleSavePress(item)}
            onPrimaryAction={() => {
              navigation.navigate('Inbox', {
                userId: item.userId,
                userName: item.userFullName || 'User',
              });
            }}
            onInboxPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (!isAuthenticated) {
                showStyledAlert({
                  title: '🔒 Join Munolink',
                  message:
                    'Create a free account to message sellers and providers.',
                  icon: 'lock-closed',
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
                userId: item.userId || '',
                userName: item.userFullName || 'User',
              });
            }}
            showInboxButton={true}
            onMediaLoadStateChange={(isLoading) =>
              handleMediaLoadStateChange(item.id, isLoading)
            }
            onSceneChange={(sceneIdx, source) => {
              if (__DEV__)
                console.log(`Scene changed to: ${sceneIdx}`, source);
            }}
            onBehavioralEvent={(event) => {
              if (__DEV__) console.log('📊 Behavioral Event:', event);
            }}
            autoPlay={true}
            autoPlayInterval={5000}
            resetKey={item.id}
            useExplicitBottomOffset={isDesktop ? false : true}
            bottomOffset={isDesktop ? 0 : SCENE_INFO_GAP}
            isVisible={isVisible}
          />

          {isItemLoading && isVisible && <ItemMediaLoadingSpinner />}

          {/* ✅ Mobile only: per-item rail. Desktop uses the
              layout-level rail rendered in the right gutter. */}
          {!isDesktop && (
            <View
              style={[
                styles.actionRailWrapper,
                styles.actionRailWrapperMobile,
              ]}
              pointerEvents="box-none"
            >
              <FloatingActionRail
                key={`rail-${item.id}`}
                opportunity={item}
                bottomInset={0}
                rightShift={0}
                isLiked={isLiked}
                likeCount={likeCountMap[item.id] ?? item.likeCount ?? 0}
                onLikePress={handleLikePress}
                onUserPress={() => {
                  navigation.navigate('UserProfile' as any, {
                    userId: item.userId,
                    userName: item.userFullName || 'User',
                  });
                }}
                onReviewsPress={(productId) =>
                  handleReviewsPress(productId, item.title)
                }
                onDirectionsPress={(userName, area) => {
                  setShowDirectionsModal(true);
                }}
                onSharePress={handleSharePress}
                onAIPress={handleAIPress}
                onSavePress={handleSavePress}
                isSaved={isSaved}
                savedCount={
                  savedItemsMap[item.id] ? 1 : item.saveCount || 0
                }
                shareCount={item.shareCount || 0}
                reviewCount={item.commentCount || 0}
                distance={item.distance || 0}
                userAvatar={item.userAvatar || null}
              />
            </View>
          )}
        </View>
      );
    },
    [
      isDesktop,
      width,
      visibleHeight,
      itemWidth,
      itemHeight,
      currentIndex,
      isFocused,
      isAuthenticated,
      navigation,
      savedItemsMap,
      likedItemsMap,
      likeCountMap,
      loadingItemsMap,
      handleShowMorePress,
      handleSharePress,
      handleSavePress,
      handleLikePress,
      handleAIPress,
      handleReviewsPress,
      handleMediaLoadStateChange,
      showStyledAlert,
      hideStyledAlert,
    ]
  );

  // ============================================================
  // Loading / error / empty states
  // ============================================================
  const isInitialLoading = !hasFetchedOnceRef.current && queryLoading;

  if (
    activeFeed === 'forYou' &&
    (isInitialLoading || (isLoading && uniqueOpportunities.length === 0))
  ) {
    return (
      <View
        style={[
          styles.container,
          { height: isDesktop ? itemHeight : visibleHeight },
        ]}
      >
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <TikTokLoadingSkeleton />
      </View>
    );
  }

  if (error && activeFeed === 'forYou') {
    return (
      <SafeAreaView
        style={[
          styles.centered,
          { height: isDesktop ? itemHeight : visibleHeight },
        ]}
        edges={['top']}
      >
        <Text
          style={[styles.errorText, { fontSize: width < 380 ? 16 : 18 }]}
        >
          Error loading feed
        </Text>
        <Text
          style={[
            styles.errorSubtext,
            { fontSize: width < 380 ? 12 : 14 },
          ]}
        >
          {error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <ResponsiveLayout
      currentRoute="Feed"
      onNavigate={(route) => {
        (navigation as any).navigate(route);
      }}
      desktopNavArrows={renderDesktopNavArrows()}
      desktopActionRail={renderDesktopActionRail()}
      selectedOpportunity={activeFeedItems[currentIndex] || null}
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
          <SafeAreaView
            style={[
              styles.container,
              Platform.OS === 'web' ? styles.containerWeb : { flex: 1 },
            ]}
            edges={['top']}
            onLayout={(e) => {
              if (isDesktop) return; // desktop uses its own measurement
              const h = e.nativeEvent.layout.height;
              if (h && Math.abs(h - (measuredVisibleHeight ?? 0)) > 1) {
                setMeasuredVisibleHeight(h);
              }
            }}
          >
            <StatusBar barStyle="light-content" />

            {!isDesktop && (
              <LinearGradient
                colors={[
                  'rgba(0, 0, 0, 0.92)',
                  'rgba(0, 0, 0, 0.7)',
                  'rgba(0, 0, 0, 0.4)',
                  'rgba(0, 0, 0, 0)',
                ]}
                locations={[0, 0.25, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[
                  styles.topBarGradient,
                  {
                    paddingTop:
                      Platform.OS === 'web'
                        ? ('calc(env(safe-area-inset-top, 0px) + 12px)' as any)
                        : insets.top + 12,
                  },
                ]}
              >
                <View style={styles.topBarContent}>
                  <TouchableOpacity style={styles.logoContainer}>
                    <Image
                      source={require('../../../assets/favicon.png')}
                      style={styles.logoImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>

                  {Platform.OS === 'web' && (
                    <TouchableOpacity
                      style={styles.openInAppButton}
                      onPress={() => {
                        try {
                          Linking.openURL(APP_DEEP_LINK);
                        } catch (err) {
                          if (__DEV__)
                            console.log('Open in App failed:', err);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={require('../../../assets/favicon.png')}
                        style={styles.openInAppIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.openInAppText} numberOfLines={1}>
                        Open in App
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.searchContainer}
                    onPress={() => {
                      (navigation as any).navigate('Search');
                    }}
                  >
                    <Ionicons
                      name="search-outline"
                      size={24}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.feedTabsRow}>
                  <TouchableOpacity
                    style={styles.feedTab}
                    onPress={() => setActiveFeed('following')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.feedTabLabel,
                        activeFeed === 'following' &&
                          styles.feedTabLabelActive,
                      ]}
                    >
                      Following
                    </Text>
                    {activeFeed === 'following' && (
                      <View style={styles.feedTabUnderline} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.feedTab}
                    onPress={() => setActiveFeed('forYou')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.feedTabLabel,
                        activeFeed === 'forYou' &&
                          styles.feedTabLabelActive,
                      ]}
                    >
                      For You
                    </Text>
                    {activeFeed === 'forYou' && (
                      <View style={styles.feedTabUnderline} />
                    )}
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            )}

            {activeFeed === 'following' &&
            followingOpportunities.length === 0 ? (
              <View style={styles.followingEmptyContainer}>
                {isLoadingFollowing ? (
                  <>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.followingEmptySubtext}>
                      Loading Following feed…
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name="people-outline"
                      size={56}
                      color="#8A8AAE"
                    />
                    <Text style={styles.followingEmptyTitle}>
                      No posts yet
                    </Text>
                    <Text style={styles.followingEmptySubtext}>
                      Follow people to see their posts here
                    </Text>
                    <TouchableOpacity
                      style={styles.followingEmptyButton}
                      onPress={() => setActiveFeed('forYou')}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.followingEmptyButtonText}>
                        Back to For You
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : (
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
                  key={`feed-${activeFeed}-${feedVersion}`}
                  ref={flatListRef}
                  data={activeFeedItems}
                  renderItem={renderItem}
                  keyExtractor={(item, index) => `item-${item.id}-${index}`}
                  pagingEnabled={!isDesktop}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={isDesktop ? undefined : visibleHeight}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  viewabilityConfig={VIEWABILITY_CONFIG}
                  onViewableItemsChanged={handleViewableItemsChanged}
                  getItemLayout={(data, index) => {
                    const h = isDesktop ? itemHeight : visibleHeight;
                    return {
                      length: h,
                      offset: h * index,
                      index,
                    };
                  }}
                  initialScrollIndex={currentIndex}
                  removeClippedSubviews={false}
                  maxToRenderPerBatch={isDesktop ? 3 : 2}
                  windowSize={isDesktop ? 5 : 3}
                  onScrollToIndexFailed={handleScrollToIndexFailed}
                  scrollEventThrottle={32}
                  {...(Platform.OS !== 'web'
                    ? { overScrollMode: 'always' }
                    : {})}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={handleRefresh}
                      tintColor="#4A7DFF"
                      colors={['#4A7DFF']}
                      progressBackgroundColor="#1A2A4F"
                      progressViewOffset={
                        Platform.OS === 'web' ? 0 : insets.top + 100
                      }
                    />
                  }
                  contentContainerStyle={{ paddingBottom: 0 }}
                  style={styles.flatList}
                />
              </View>
            )}

            {Platform.OS === 'web' &&
              currentIndex === 0 &&
              !isDesktop && (
                <TouchableOpacity
                  style={styles.webRefreshButton}
                  onPress={handleRefresh}
                  disabled={refreshing}
                  activeOpacity={0.7}
                  accessibilityLabel="Refresh feed"
                >
                  {refreshing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="refresh" size={22} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              )}

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
  containerWeb: {
    flex: 1,
    backgroundColor: '#05070f',
    height: '100vh' as any,
    maxHeight: '100vh' as any,
    overflow: 'hidden',
    position: 'relative' as any,
  },
  flatList: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  centered: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tiktokLoaderContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tiktokLoaderLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  itemMediaSpinnerOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  topBarGradient: {
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
      },
      default: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
      },
    }),
    zIndex: 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  logoContainer: {
    flexShrink: 0,
  },
  logoImage: {
    width: 53,
    height: 33,
  },

  openInAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    maxWidth: 180,
    justifyContent: 'center',
  },
  openInAppIcon: {
    width: 16,
    height: 16,
    tintColor: '#FFFFFF',
  },
  openInAppText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  searchContainer: {
    padding: 6,
    borderRadius: 20,
    flexShrink: 0,
  },

  feedTabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 8,
  },
  feedTab: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  feedTabLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  feedTabLabelActive: {
    color: '#FFFFFF',
  },
  feedTabUnderline: {
    marginTop: 5,
    width: 24,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },

  followingEmptyContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  followingEmptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  followingEmptySubtext: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  followingEmptyButton: {
    marginTop: 24,
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  followingEmptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  actionRailWrapper: {
    position: 'absolute',
    zIndex: 50,
  },
  // ✅ Native only — the desktop path renders the rail in
  // DesktopLayout's right gutter instead.
  actionRailWrapperMobile: {
    right: 16,
    top: '50%',
    transform: [{ translateY: -150 }],
  },
  webRefreshButton: {
    position: 'absolute',
    bottom: 90,
    left: '50%',
    marginLeft: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(74, 125, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
    shadowColor: '#4A7DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});