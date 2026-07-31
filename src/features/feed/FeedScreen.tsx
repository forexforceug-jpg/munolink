import React, { useEffect, useState, useRef, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Alert } from 'react-native';
import { GuestPromptCard } from './components/GuestPromptCard';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Share,
  Linking,
  useWindowDimensions,
  Image,
  StatusBar,
  Dimensions,
  FlatList,
  Animated,
  ViewabilityConfig,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useFeedStore } from '../../store/feedStore';
import { feedService, Opportunity } from '../../services/feed.service';
import { StoryEngine, Story } from '../story/engine/StoryEngine';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ShopBottomSheet } from './components/ShopBottomSheet';
import { ReviewsBottomSheet } from './components/ReviewsBottomSheet';
import { AIBottomSheet } from './components/AIBottomSheet';
import { SimpleDetailsModal } from './components/SimpleDetailsModal';
import * as Haptics from 'expo-haptics';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// --- AI Headline Generator ---
const generateAIHeadline = (opportunity: Opportunity): string => {
  const headlines = [
    `🔥 Lowest ${opportunity.title} price near you today.`,
    `⭐ Top-rated ${opportunity.category || 'product'} in your area.`,
    `📦 ${opportunity.shopName} has ${opportunity.title} in stock now.`,
    `🚚 Free delivery on ${opportunity.title} today.`,
    `💎 Premium ${opportunity.title} at ${opportunity.shopName}.`,
    `🎯 Best deal on ${opportunity.title} near you.`,
  ];
  return headlines[Math.floor(Math.random() * headlines.length)];
};

// --- AI Hints for AI Button ---
const AI_HINTS = [
  "💡 Ask me if this phone is good for gaming.",
  "💡 Ask me if this price is fair.",
  "💡 Compare with similar products.",
  "💡 Ask me about warranty and delivery.",
  "💡 Is this the best deal near you?",
];

// --- Individual Card Component ---
const OpportunityCard = ({
  item,
  width,
  height,
  onReviewsPress,
  onSharePress,
  onAIPress,
  onShowMorePress,
  onLovePress,
  onSavePress,
  onFollowPress,
  onAIPressWithContext,
  isAuthenticated,
  navigation,
}: any) => {
  const [story, setStory] = useState<Story | null>(null);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isLoved, setIsLoved] = useState(false);
  const [aiHint, setAiHint] = useState('');
  const [progressAnim] = useState(new Animated.Value(0));
  const [autoPlayTimer, setAutoPlayTimer] = useState<any>(null);
  const isSmallDevice = width < 380 || height < 700;
  const isMediumDevice = width < 420 || height < 800;

  const progressTop = isSmallDevice ? 90 : isMediumDevice ? 75 : 80;
  const bottomOffset = height * 0.09;

  const aiHeadline = generateAIHeadline(item);

  useEffect(() => {
    const engine = new StoryEngine(item);
    engine.generateStory(item).then(setStory);
    setAiHint(AI_HINTS[Math.floor(Math.random() * AI_HINTS.length)]);
  }, [item]);

  useEffect(() => {
    if (story && story.totalCards > 1) {
      const timer = setTimeout(() => {
        if (sceneIndex < story.totalCards - 1) {
          setSceneIndex(sceneIndex + 1);
        } else {
          setSceneIndex(0);
        }
      }, 3000);
      setAutoPlayTimer(timer);
      return () => clearTimeout(timer);
    }
  }, [sceneIndex, story]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(() => {
      progressAnim.setValue(0);
    });
  }, [sceneIndex]);

  if (!story) {
    return (
      <View style={[styles.cardContainer, { height, width }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4A7DFF" />
        </View>
      </View>
    );
  }

  const handleLovePress = () => {
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoved(!isLoved);
    onLovePress?.(item, !isLoved);
  };

  const handleSeeMorePress = () => {
    if (onShowMorePress) {
      onShowMorePress(item);
    }
  };

  const handleAIPressWithHint = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (onAIPressWithContext) {
      onAIPressWithContext(item, aiHint);
    } else if (onAIPress) {
      onAIPress(item);
    }
  };

  const handleSaveAction = () => {
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
    onSavePress?.(item);
  };

  return (
    <View style={[styles.cardContainer, { height, width }]}>
      {/* Background Image */}
      <View style={[styles.backgroundLayer, { width, height }]}>
        <Image source={{ uri: item.imageUrl }} style={styles.backgroundImage} resizeMode="cover" />
        <LinearGradient
          colors={[
            'rgba(31, 47, 95, 0)',
            'rgba(31, 47, 95, 0.05)',
            'rgba(31, 47, 95, 0.15)',
            'rgba(31, 47, 95, 0.3)',
            'rgba(31, 47, 95, 0.5)',
            'rgba(31, 47, 95, 0.7)',
            'rgba(31, 47, 95, 0.85)',
          ]}
          locations={[0, 0.1, 0.2, 0.35, 0.5, 0.7, 1]}
          start={{ x: 0, y: 0.1 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradientOverlay}
        />
      </View>

      {/* Progress Bars */}
      <View style={[styles.progressContainer, { top: progressTop }]}>
        {Array.from({ length: story.totalCards }).map((_, i) => {
          const isActive = i === sceneIndex;
          const isPast = i < sceneIndex;
          return (
            <View key={i} style={[styles.progressBarWrapper, { flex: 1, marginHorizontal: 2 }]}>
              {isActive ? (
                <Animated.View
                  style={[
                    styles.progressBarActive,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              ) : isPast ? (
                <View style={[styles.progressBar, styles.progressBarCompleted]} />
              ) : (
                <View style={styles.progressBar} />
              )}
            </View>
          );
        })}
      </View>

      {/* AI Headline */}
      <View style={styles.aiHeadlineContainer}>
        <Text style={styles.aiHeadlineText}>{aiHeadline}</Text>
      </View>

      {/* Bottom Left Info */}
      <View style={[styles.infoContainer, { bottom: bottomOffset }]}>
        <Text style={[styles.productTitle, { fontSize: isSmallDevice ? 22 : isMediumDevice ? 24 : 26 }]}>
          {item.title}
        </Text>

        <Text style={[styles.productPrice, { fontSize: isSmallDevice ? 18 : isMediumDevice ? 20 : 22 }]}>
          UGX {item.price?.toLocaleString()}
        </Text>

        <View style={styles.providerRow}>
          <Text style={styles.providerRating}>★ {item.rating?.toFixed(1) || 'New'}</Text>
          <Text style={styles.providerDivider}>•</Text>
          <Text style={styles.providerName}>{item.shopName}</Text>
          {item.rating && item.rating > 4.0 && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
          <Text style={styles.providerDivider}>•</Text>
          <Text style={styles.providerDistance}>{item.area || '0.6 km'}</Text>
          <Text style={styles.providerDivider}>•</Text>
          <Text style={styles.providerAvailability}>
            {item.inStock ? 'Open Now' : 'Check Availability'}
          </Text>
        </View>

        <TouchableOpacity onPress={handleSeeMorePress} activeOpacity={0.7}>
          <Text style={[styles.seeMoreText, { fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16 }]}>
            See more ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* Right Action Rail */}
      <View style={[styles.actionRail, { right: 12, bottom: height * 0.2 }]}>
        <TouchableOpacity style={styles.followContainer} onPress={() => onFollowPress?.(item)}>
          <View
            style={[
              styles.followAvatar,
              {
                width: isSmallDevice ? 44 : 48,
                height: isSmallDevice ? 44 : 48,
                borderRadius: isSmallDevice ? 22 : 24,
              },
            ]}
          >
            <Text style={[styles.followAvatarText, { fontSize: isSmallDevice ? 16 : 18 }]}>
              {item.shopName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.followButton}>
            <Text style={[styles.followButtonText, { fontSize: isSmallDevice ? 8 : 9 }]}>Shop</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              width: isSmallDevice ? 44 : 48,
              height: isSmallDevice ? 44 : 48,
              borderRadius: isSmallDevice ? 22 : 24,
            },
          ]}
          onPress={handleLovePress}
        >
          <Text style={[styles.actionIcon, { fontSize: isSmallDevice ? 20 : 22 }]}>
            {isLoved ? '❤️' : '♡'}
          </Text>
          <Text style={[styles.actionLabel, { fontSize: isSmallDevice ? 8 : 9 }]}>
            {isLoved ? 'Loved' : 'Love'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              width: isSmallDevice ? 44 : 48,
              height: isSmallDevice ? 44 : 48,
              borderRadius: isSmallDevice ? 22 : 24,
            },
          ]}
          onPress={() => onSharePress?.(item)}
        >
          <Text style={[styles.actionIcon, { fontSize: isSmallDevice ? 20 : 22 }]}>↗</Text>
          <Text style={[styles.actionLabel, { fontSize: isSmallDevice ? 8 : 9 }]}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.aiButton,
            {
              width: isSmallDevice ? 56 : 62,
              height: isSmallDevice ? 56 : 62,
              borderRadius: isSmallDevice ? 28 : 31,
              marginTop: 4,
            },
          ]}
          onPress={handleAIPressWithHint}
        >
          <View style={styles.aiContainer}>
            <Ionicons name="chatbubble-ellipses" size={isSmallDevice ? 24 : 28} color="#4A7DFF" />
            <View
              style={[
                styles.aiPulse,
                {
                  width: isSmallDevice ? 48 : 54,
                  height: isSmallDevice ? 48 : 54,
                  borderRadius: isSmallDevice ? 24 : 27,
                },
              ]}
            />
          </View>
          <Text style={[styles.aiLabel, { fontSize: isSmallDevice ? 7 : 8 }]}>Ask AI</Text>
          {aiHint && (
            <View style={styles.aiHintBadge}>
              <Text style={styles.aiHintText} numberOfLines={1}>
                {aiHint}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Main FeedScreen Component ---
export const FeedScreen = ({ navigation }: any) => {
  const { height, width } = useWindowDimensions();
  const { isAuthenticated, isGuest } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const shopSheetRef = useRef<BottomSheetModal>(null);
  const reviewsSheetRef = useRef<BottomSheetModal>(null);
  const aiSheetRef = useRef<BottomSheetModal>(null);

  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProductTitle, setSelectedProductTitle] = useState<string>('');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [aiContextHint, setAiContextHint] = useState<string>('');
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [swipeCount, setSwipeCount] = useState(0);

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

  useEffect(() => {
    if (data && data.length > 0) {
      setOpportunities(data);
    }
  }, [data]);

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

  // FIX: Use a ref to keep the same function reference
  const onViewableItemsChangedRef = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const index = viewableItems[0].index;
      // Only update if index changed and valid
      if (index !== currentIndex && index >= 0 && index < opportunities.length) {
        console.log('📊 Viewable index:', index, 'currentIndex:', currentIndex);
        setCurrentIndex(index);
        if (!isAuthenticated && isGuest) {
          const newCount = swipeCount + 1;
          setSwipeCount(newCount);
          console.log('📊 Swipe count updated to:', newCount);
        }
      }
    }
  });

  // Update the ref callback when dependencies change
  useEffect(() => {
    onViewableItemsChangedRef.current = ({ viewableItems }: any) => {
      if (viewableItems && viewableItems.length > 0) {
        const index = viewableItems[0].index;
        if (index !== currentIndex && index >= 0 && index < opportunities.length) {
          console.log('📊 Viewable index:', index, 'currentIndex:', currentIndex);
          setCurrentIndex(index);
          if (!isAuthenticated && isGuest) {
            const newCount = swipeCount + 1;
            setSwipeCount(newCount);
            console.log('📊 Swipe count updated to:', newCount);
          }
        }
      }
    };
  }, [currentIndex, opportunities.length, isAuthenticated, isGuest, swipeCount]);

  // Stable callback that calls the ref
  const handleViewableItemsChanged = useCallback((info: any) => {
    onViewableItemsChangedRef.current(info);
  }, []);

  // Viewability configuration - stable reference
  const viewabilityConfig: ViewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  };

  // --- Action Handlers ---
  const handleReviewsPress = useCallback((productId: string, productTitle?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProductId(productId);
    setSelectedProductTitle(productTitle || '');
    setShowReviewsModal(true);
  }, []);

  const handleSharePress = useCallback(async (opportunity: Opportunity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const message = `🛍️ Check out ${opportunity.title}\n\n🏪 ${opportunity.shopName}\n💰 UGX ${opportunity.price.toLocaleString()}\n📍 ${opportunity.area || 'Available nearby'}\n\nDownload Munolink to discover more!`;
      await Share.share({
        message: message,
        title: opportunity.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, []);

  const handleAIPress = useCallback((opportunity: Opportunity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedOpportunity(opportunity);
    setAiContextHint('');
    setTimeout(() => {
      aiSheetRef.current?.present();
    }, 100);
  }, []);

  const handleAIPressWithContext = useCallback((opportunity: Opportunity, hint: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedOpportunity(opportunity);
    setAiContextHint(hint);
    setTimeout(() => {
      aiSheetRef.current?.present();
    }, 100);
  }, []);

  const handleShowMorePress = useCallback((opportunity: Opportunity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedOpportunity(opportunity);
    setShowDetailsModal(true);
  }, []);

  const handleLovePress = useCallback(
    (opportunity: Opportunity, isLoved: boolean) => {
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
      console.log(isLoved ? '❤️ Added to wishlist:' : '❤️ Removed from wishlist:', opportunity.title);
    },
    [isAuthenticated, navigation]
  );

  const handleSavePress = useCallback((opportunity: Opportunity) => {
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
    console.log('🔖 Saved:', opportunity.title);
  }, [isAuthenticated, navigation]);

  const handleFollowPress = useCallback((opportunity: Opportunity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('ShopProfile', {
      shopId: opportunity.shopId,
      shopName: opportunity.shopName,
    });
  }, [navigation]);

  // --- Render Item ---
  const renderItem = useCallback(
    ({ item }: { item: Opportunity }) => (
      <OpportunityCard
        item={item}
        width={width}
        height={height}
        onReviewsPress={handleReviewsPress}
        onSharePress={handleSharePress}
        onAIPress={handleAIPress}
        onAIPressWithContext={handleAIPressWithContext}
        onShowMorePress={handleShowMorePress}
        onLovePress={handleLovePress}
        onSavePress={handleSavePress}
        onFollowPress={handleFollowPress}
        isAuthenticated={isAuthenticated}
        navigation={navigation}
      />
    ),
    [
      width,
      height,
      handleReviewsPress,
      handleSharePress,
      handleAIPress,
      handleAIPressWithContext,
      handleShowMorePress,
      handleLovePress,
      handleSavePress,
      handleFollowPress,
      isAuthenticated,
      navigation,
    ]
  );

  if (isLoading) {
    return (
      <View style={[styles.centered, { height }]}>
        <ActivityIndicator size="large" color="#4A7DFF" />
        <Text style={[styles.loadingText, { fontSize: width < 380 ? 14 : 16 }]}>
          Loading opportunities...
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

  if (opportunities.length === 0) {
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaView style={[styles.container, { height }]}>
          <StatusBar barStyle="light-content" />

          {/* Top Navigation Bar */}
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
            style={[styles.topBarGradient, { paddingTop: 45 }]}
          >
            <View style={styles.topBarContent}>
              <TouchableOpacity style={styles.logoContainer}>
                <Text style={[styles.logo, { fontSize: 20 }]}>Munolink</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.locationContainer}>
                <Ionicons name="location-outline" size={16} color="#4A7DFF" />
                <Text style={[styles.locationText, { fontSize: 13 }]}>Jinja, Uganda</Text>
                <Ionicons name="chevron-down" size={14} color="#4A7DFF" />
              </TouchableOpacity>

              {/* TEST: Manual trigger button - tap to test guest prompt */}
              <TouchableOpacity 
                style={styles.debugTrigger}
                onPress={() => {
                  console.log('🎯 MANUAL TRIGGER PRESSED!');
                  setShowGuestPrompt(true);
                }}
              >
                <Text style={styles.debugTriggerText}>🔔</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.searchContainer} onPress={() => navigation.navigate('Search')}>
                <Ionicons name="search-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Vertical FlatList for Products */}
          <FlatList
            ref={flatListRef}
            data={opportunities}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            snapToInterval={height}
            decelerationRate="fast"
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={handleViewableItemsChanged}
            getItemLayout={(data, index) => ({
              length: height,
              offset: height * index,
              index,
            })}
            initialScrollIndex={currentIndex}
          />

          {/* Reviews Modal */}
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

          {selectedOpportunity && (
            <AIBottomSheet
              bottomSheetRef={aiSheetRef}
              opportunity={selectedOpportunity}
              contextHint={aiContextHint}
              onClose={() => {
                aiSheetRef.current?.dismiss();
                setAiContextHint('');
              }}
            />
          )}

          {/* Simple Details Modal */}
          <SimpleDetailsModal
            visible={showDetailsModal}
            opportunity={selectedOpportunity}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedOpportunity(null);
            }}
          />

          {/* Guest Prompt Overlay */}
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
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2F5F',
  },
  centered: {
    flex: 1,
    backgroundColor: '#1F2F5F',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    position: 'relative',
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
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
  logo: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  },
  searchContainer: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  debugTrigger: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 200, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 0, 0.3)',
  },
  debugTriggerText: {
    fontSize: 18,
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
  progressContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
    gap: 4,
  },
  progressBarWrapper: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  progressBarCompleted: {
    backgroundColor: '#4A7DFF',
  },
  progressBarActive: {
    height: 3,
    backgroundColor: '#4A7DFF',
    borderRadius: 2,
  },
  aiHeadlineContainer: {
    position: 'absolute',
    top: 115,
    left: 16,
    right: 16,
    zIndex: 12,
  },
  aiHeadlineText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  infoContainer: {
    position: 'absolute',
    left: 16,
    right: 80,
    zIndex: 10,
  },
  productTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  productPrice: {
    color: '#4A7DFF',
    fontWeight: '600',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  providerRating: {
    color: '#F1C40F',
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  providerDivider: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },
  providerName: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  verifiedBadge: {
    backgroundColor: '#4A7DFF',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  providerDistance: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  providerAvailability: {
    color: '#2ECC71',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  seeMoreText: {
    color: '#4A7DFF',
    marginTop: 4,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionRail: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 30,
    gap: 6,
  },
  followContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  followAvatar: {
    backgroundColor: 'rgba(74, 125, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4A7DFF',
  },
  followAvatarText: {
    color: '#4A7DFF',
    fontWeight: 'bold',
  },
  followButton: {
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  followButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: 'rgba(31, 47, 95, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 2,
    position: 'relative',
  },
  actionIcon: {},
  actionLabel: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
    fontSize: 8,
  },
  aiButton: {
    backgroundColor: 'rgba(74, 125, 255, 0.25)',
    borderColor: '#4A7DFF',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A7DFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 2,
    position: 'relative',
  },
  aiContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiPulse: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#4A7DFF',
    opacity: 0.3,
  },
  aiLabel: {
    color: '#4A7DFF',
    fontWeight: '600',
    marginTop: 1,
  },
  aiHintBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 100,
  },
  aiHintText: {
    color: '#1F2F5F',
    fontSize: 7,
    fontWeight: '500',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
  },
  errorText: {
    color: '#E74C3C',
    fontWeight: 'bold',
  },
  errorSubtext: {
    color: '#8A8AAE',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: '#8A8AAE',
    marginTop: 8,
  },
});