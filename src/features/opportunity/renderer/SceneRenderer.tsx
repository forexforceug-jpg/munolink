// src/features/opportunity/renderer/SceneRenderer.tsx

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Platform,
  Image,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ============================================================
// TYPES
// ============================================================

export type NavigationSource = 'autoplay' | 'swipe' | 'tap' | 'arrow';

export interface SceneViewEvent {
  sceneIndex: number;
  sceneType: string;
  timeSpent: number;
  source?: NavigationSource;
}

export interface BehavioralEvent {
  type:
    | 'scene_view'
    | 'scene_navigation'
    | 'opportunity_open'
    | 'opportunity_close'
    | 'gallery_interaction'
    | 'action_trigger';
  sceneIndex?: number;
  sceneType?: string;
  timeSpent?: number;
  source?: NavigationSource;
  action?: string;
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

type PriceType = 'fixed' | 'negotiable' | 'starting_from' | 'free';

interface Props {
  media: MediaItem[];
  onSceneChange?: (index: number, source?: NavigationSource) => void;
  onBehavioralEvent?: (event: BehavioralEvent) => void;
  onPrimaryAction?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onShowMore?: () => void;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  resetKey?: string | number;
  isDesktop?: boolean;
  bottomOffset?: number;
  title?: string;
  price?: number;
  priceType?: PriceType;
  currency?: string;
  userName?: string;
  userAvatar?: string | null;
  description?: string | null;
  rating?: number | null;
  area?: string | null;
  inStock?: boolean;
  type?: 'product' | 'service' | 'event';
  providerName?: string;
  providerId?: string;
  providerType?: 'individual' | 'institution';
  createdAt?: string;
  /**
   * ✅ NEW: Whether this SceneRenderer is the currently visible feed item.
   * When false, all video playback is force-paused so nothing plays in the background.
   */
  isVisible?: boolean;
}

// ============================================================
// HELPER: Format time ago
// ============================================================
function formatTimeAgo(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  if (diff < 172800000) return 'Yesterday';
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

// ============================================================
// VIDEO ITEM COMPONENT (expo-video)
// ============================================================

interface VideoItemProps {
  url: string;
  width: number;
  height: number;
  isCurrent: boolean;
  /** ✅ Feed item is on screen */
  isVisible: boolean;
  autoPlay: boolean;
  onPlayingChange: (playing: boolean) => void;
}

const VideoItem = memo(
  function VideoItem({
    url,
    width,
    height,
    isCurrent,
    isVisible,
    autoPlay,
    onPlayingChange,
  }: VideoItemProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [videoAspect, setVideoAspect] = useState<number | null>(null);

    const player = useVideoPlayer(url, (p) => {
      p.loop = false;
      p.muted = false;
    });

    // Track playing state
    useEffect(() => {
      const sub = player.addListener('playingChange', (payload) => {
        setIsPlaying(payload.isPlaying);
        onPlayingChange(payload.isPlaying);
      });
      return () => sub.remove();
    }, [player, onPlayingChange]);

    // Track readiness + video dimensions
    useEffect(() => {
      const sub = player.addListener('statusChange', (payload) => {
        if ((payload as any).status === 'readyToPlay') {
          setIsReady(true);
        }
        const track = (player as any).videoTrack;
        if (track?.size?.width && track?.size?.height) {
          setVideoAspect(track.size.width / track.size.height);
        }
      });
      return () => sub.remove();
    }, [player]);

    // ✅ THE FIX: Pause when either not current (within carousel)
    // or not visible (feed item scrolled away)
    useEffect(() => {
      const shouldPlay = isCurrent && isVisible && autoPlay;
      if (shouldPlay) {
        player.play();
      } else {
        // Force pause — this is what stops background playback
        player.pause();
      }
    }, [isCurrent, isVisible, autoPlay, player]);

    const handlePress = useCallback(async () => {
      if (!isReady) return;
      try {
        if (isPlaying) {
          player.pause();
        } else {
          await player.play();
        }
      } catch (err) {
        console.warn('[SceneRenderer] Video play/pause failed:', err);
      }
    }, [isReady, isPlaying, player]);

    // Calculate dimensions maintaining aspect ratio
    const containerAspect = width / height;
    const effectiveAspect = videoAspect ?? containerAspect;
    let videoW = width;
    let videoH = height;
    if (effectiveAspect > containerAspect) {
      videoW = width;
      videoH = width / effectiveAspect;
    } else {
      videoH = height;
      videoW = height * effectiveAspect;
    }

    return (
      <View style={[styles.mediaItem, { width, height }]}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={handlePress}
          style={{ width, height, justifyContent: 'center', alignItems: 'center' }}
        >
          <VideoView
            player={player}
            style={{ width: videoW, height: videoH, backgroundColor: '#000' }}
            contentFit="contain"
            nativeControls={false}
            allowsPictureInPicture={false}
          />
          <View style={styles.videoControlsOverlay} pointerEvents="none">
            {!isPlaying ? (
              <View style={styles.videoPlayButton}>
                <Ionicons name="play-circle" size={60} color="rgba(255,255,255,0.8)" />
              </View>
            ) : (
              <View style={styles.videoPlayingIndicator}>
                <View style={styles.videoPlayingDot} />
                <Text style={styles.videoPlayingText}>Playing</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  },
  (prev, next) =>
    prev.url === next.url &&
    prev.isCurrent === next.isCurrent &&
    prev.isVisible === next.isVisible &&
    prev.autoPlay === next.autoPlay &&
    prev.width === next.width &&
    prev.height === next.height
);

// ============================================================
// MAIN COMPONENT
// ============================================================

export function SceneRenderer({
  media,
  onSceneChange,
  onPrimaryAction,
  onShare,
  onSave,
  onShowMore,
  onBehavioralEvent,
  width = screenWidth,
  height = 600,
  autoPlay = false,
  autoPlayInterval = 6000,
  resetKey,
  isDesktop = false,
  bottomOffset = 0,
  title = 'Product',
  price = 0,
  priceType = 'fixed',
  currency = 'UGX',
  userName = 'User',
  userAvatar = null,
  description = null,
  rating = null,
  area = null,
  inStock = true,
  type = 'product',
  providerName = '',
  providerId = '',
  providerType = 'individual',
  createdAt,
  isVisible = true,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progressAnim] = useState(new Animated.Value(0));
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sceneStartTimeRef = useRef<number>(Date.now());

  const safeMedia =
    media && media.length > 0
      ? media
      : [
          {
            type: 'image' as const,
            url: 'https://via.placeholder.com/400x400/1A1A2E/8A8AAE?text=No+Image',
          },
        ];
  const totalItems = safeMedia.length;

  const currentMedia = safeMedia[currentIndex];
  const currentIsVideo = currentMedia?.type === 'video';

  const getPriceBadge = () => {
    switch (priceType) {
      case 'negotiable':
        return { label: 'Negotiable', color: '#F1C40F' };
      case 'starting_from':
        return { label: 'Starting From', color: '#2ECC71' };
      case 'free':
        return { label: 'Free', color: '#2ECC71' };
      default:
        return { label: 'Fixed', color: '#4A7DFF' };
    }
  };

  const priceBadge = getPriceBadge();
  const timeAgo = formatTimeAgo(createdAt);

  const isService = type === 'service' || type === 'event';
  const displayName = userName || 'User';

  const availabilityText = isService
    ? inStock
      ? 'Available'
      : 'Unavailable'
    : inStock
    ? 'In Stock'
    : 'Check Availability';

  const availabilityStyle = isService
    ? inStock
      ? styles.available
      : styles.unavailable
    : inStock
    ? styles.inStock
    : styles.outOfStock;

  // ============================================================
  // BEHAVIORAL EVENT EMITTER (internal only — no open/close)
  // ============================================================

  const emitBehavioralEvent = useCallback(
    (event: BehavioralEvent) => {
      if (onBehavioralEvent) {
        onBehavioralEvent(event);
      }
      if (__DEV__) {
        console.log('📊 Behavioral Event:', event);
      }
    },
    [onBehavioralEvent]
  );

  const trackSceneView = useCallback(
    (index: number, source: NavigationSource = 'autoplay') => {
      const timeSpent = Date.now() - sceneStartTimeRef.current;
      emitBehavioralEvent({
        type: 'scene_view',
        sceneIndex: index,
        sceneType: 'media',
        timeSpent,
        source,
      });
      sceneStartTimeRef.current = Date.now();
    },
    [emitBehavioralEvent]
  );

  // ✅ NOTE: opportunity_open / opportunity_close tracking has been MOVED
  // to FeedScreen.onViewableItemsChanged. It no longer lives here because
  // FlatList's windowSize keeps multiple SceneRenderers mounted at once,
  // which caused dozens of duplicate open/close events.

  // ============================================================
  // NAVIGATION FUNCTIONS
  // ============================================================

  const goToNextMedia = useCallback(
    (source: NavigationSource = 'autoplay') => {
      if (totalItems <= 1) return;
      trackSceneView(currentIndex, source);
      const nextIndex = (currentIndex + 1) % totalItems;
      setCurrentIndex(nextIndex);
      onSceneChange?.(nextIndex, source);
      progressAnim.setValue(0);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    },
    [currentIndex, totalItems, onSceneChange, trackSceneView, progressAnim]
  );

  const goToPreviousMedia = useCallback(
    (source: NavigationSource = 'tap') => {
      if (totalItems <= 1) return;
      trackSceneView(currentIndex, source);
      const prevIndex = (currentIndex - 1 + totalItems) % totalItems;
      setCurrentIndex(prevIndex);
      onSceneChange?.(prevIndex, source);
      progressAnim.setValue(0);
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
    },
    [currentIndex, totalItems, onSceneChange, trackSceneView, progressAnim]
  );

  const goToMedia = useCallback(
    (index: number, source: NavigationSource = 'tap') => {
      if (totalItems <= 1) return;
      if (index === currentIndex) return;
      trackSceneView(currentIndex, source);
      setCurrentIndex(index);
      onSceneChange?.(index, source);
      progressAnim.setValue(0);
      flatListRef.current?.scrollToIndex({ index, animated: true });
    },
    [currentIndex, totalItems, onSceneChange, trackSceneView, progressAnim]
  );

  // ============================================================
  // AUTOPLAY LOGIC
  // ============================================================

  const startAutoplay = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    // Don't autoplay if current item is a video (let it finish naturally),
    // or if this SceneRenderer isn't the visible one.
    if (
      autoPlay &&
      isVisible &&
      totalItems > 1 &&
      !isDragging &&
      currentMedia?.type !== 'video'
    ) {
      autoPlayTimerRef.current = setTimeout(() => {
        goToNextMedia('autoplay');
      }, autoPlayInterval);
    }
  }, [
    autoPlay,
    isVisible,
    totalItems,
    isDragging,
    autoPlayInterval,
    goToNextMedia,
    currentMedia,
  ]);

  const stopAutoplay = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (autoPlay && isVisible && totalItems > 1) {
      startAutoplay();
    } else {
      stopAutoplay();
    }
    return () => {
      stopAutoplay();
    };
  }, [autoPlay, isVisible, totalItems, currentIndex, isDragging, startAutoplay, stopAutoplay]);

  useEffect(() => {
    setCurrentIndex(0);
    progressAnim.setValue(0);
    stopAutoplay();
    onSceneChange?.(0, 'tap');
    sceneStartTimeRef.current = Date.now();
    if (autoPlay && totalItems > 1) {
      startAutoplay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, totalItems]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: autoPlayInterval,
      useNativeDriver: false,
    }).start(() => {
      progressAnim.setValue(0);
    });
  }, [currentIndex, autoPlayInterval, progressAnim]);

  // ============================================================
  // PAN RESPONDER (SWIPE)
  // ============================================================

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => totalItems > 1,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return (
        Math.abs(gestureState.dx) > 10 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
      );
    },
    onPanResponderGrant: () => {
      setIsDragging(true);
      stopAutoplay();
    },
    onPanResponderRelease: (_, gestureState) => {
      setIsDragging(false);
      const threshold = 50;
      if (gestureState.dx < -threshold && currentIndex < totalItems - 1) {
        goToNextMedia('swipe');
      } else if (gestureState.dx > threshold && currentIndex > 0) {
        goToPreviousMedia('swipe');
      } else {
        startAutoplay();
      }
    },
    onPanResponderTerminate: () => {
      setIsDragging(false);
      startAutoplay();
    },
  });

  // ============================================================
  // RENDER MEDIA ITEM
  // ============================================================
  const renderMediaItem = useCallback(
    ({ item, index }: { item: MediaItem; index: number }) => {
      const isCurrent = index === currentIndex;

      if (item.type === 'video') {
        return (
          <VideoItem
            url={item.url}
            width={width}
            height={height}
            isCurrent={isCurrent}
            isVisible={isVisible}
            autoPlay={autoPlay}
            onPlayingChange={setIsVideoPlaying}
          />
        );
      }

      // Image
      return (
        <View style={[styles.mediaItem, { width, height }]}>
          <Image
            source={{ uri: item.url }}
            style={[styles.mediaImage, { width, height }]}
            resizeMode="contain"
          />
        </View>
      );
    },
    [width, height, currentIndex, isVisible, autoPlay]
  );

  // ============================================================
  // RENDER
  // ============================================================

  const bottomPosition = (isDesktop ? 20 : 110) + bottomOffset;

  const shouldShowSeeDetails = description && description.length > 100;
  const displayDescription = isExpanded
    ? description
    : description
    ? description.slice(0, 100) + (description.length > 100 ? '...' : '')
    : '';

  const displayPrice =
    price && price > 0 ? `${currency} ${price.toLocaleString()}` : 'Free';

  return (
    <View
      style={[styles.container, { width, height }]}
      {...panResponder.panHandlers}
    >
      <FlatList
        ref={flatListRef}
        data={safeMedia}
        renderItem={renderMediaItem}
        keyExtractor={(item, index) => `media-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          if (index !== currentIndex && index < totalItems) {
            setCurrentIndex(index);
            onSceneChange?.(index, 'swipe');
            progressAnim.setValue(0);
          }
        }}
        scrollEventThrottle={32}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        initialScrollIndex={0}
        style={styles.carousel}
        removeClippedSubviews={false}
      />

      {/*
        ✅ FIX: Only show tap-navigation overlay when the current media is NOT a video.
        Otherwise the full-screen tap zones intercept every press and the video's
        own TouchableOpacity never receives the tap → play button seems dead.
      */}
      {totalItems > 1 && !currentIsVideo && (
        <View style={styles.tapContainer} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.tapArea, styles.tapLeft]}
            onPress={() => {
              if (currentIndex > 0) {
                goToPreviousMedia('tap');
                stopAutoplay();
                startAutoplay();
              }
            }}
            activeOpacity={0.3}
          />
          <TouchableOpacity
            style={[styles.tapArea, styles.tapRight]}
            onPress={() => {
              if (currentIndex < totalItems - 1) {
                goToNextMedia('tap');
                stopAutoplay();
                startAutoplay();
              }
            }}
            activeOpacity={0.3}
          />
        </View>
      )}

      <View
        style={[
          styles.bottomContainer,
          {
            bottom: bottomPosition,
            paddingBottom: 16,
          },
        ]}
      >
        <View style={styles.dotsContainer}>
          {safeMedia.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={styles.dotWrapper}
              onPress={() => {
                goToMedia(index, 'tap');
                stopAutoplay();
                startAutoplay();
              }}
              activeOpacity={0.8}
            >
              {index === currentIndex ? (
                <Animated.View
                  style={[
                    styles.dot,
                    styles.dotActive,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [8, 24],
                      }),
                    },
                  ]}
                />
              ) : (
                <View style={[styles.dot, styles.dotInactive]} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoPanel}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{displayPrice}</Text>
            <View
              style={[
                styles.priceBadge,
                { backgroundColor: priceBadge.color + '20' },
              ]}
            >
              <Text style={[styles.priceBadgeText, { color: priceBadge.color }]}>
                {priceBadge.label}
              </Text>
            </View>
          </View>

          <View style={styles.userRow}>
            <Text style={styles.userName}>{displayName}</Text>
            {timeAgo && <Text style={styles.timeAgo}>• {timeAgo}</Text>}
          </View>

          {description && (
            <View style={styles.descriptionContainer}>
              <Text
                style={styles.description}
                numberOfLines={isExpanded ? undefined : 2}
              >
                {displayDescription}
              </Text>
              {shouldShowSeeDetails && (
                <TouchableOpacity
                  onPress={() => setIsExpanded(!isExpanded)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.seeMoreText}>
                    {isExpanded ? 'See Less' : 'See More'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      <View style={styles.sceneCounter}>
        <Text style={styles.sceneCounterText}>
          {currentIndex + 1} / {totalItems}
        </Text>
      </View>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#010102',
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  carousel: {
    flex: 1,
  },
  mediaItem: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#030305',
  },
  mediaImage: {
    backgroundColor: '#000000',
  },
  videoControlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayingIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  videoPlayingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2ECC71',
  },
  videoPlayingText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  tapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 10,
  },
  tapArea: {
    flex: 1,
    height: '100%',
  },
  tapLeft: {},
  tapRight: {},
  bottomContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 25,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dotWrapper: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  dot: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    width: 8,
  },
  infoPanel: {},
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  price: {
    color: '#4A7DFF',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  priceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  descriptionContainer: {
    marginTop: 4,
  },
  description: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  seeMoreText: {
    color: '#4A7DFF',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sceneCounter: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 15,
  },
  sceneCounterText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  inStock: {
    color: '#2ECC71',
  },
  outOfStock: {
    color: '#E74C3C',
  },
  available: {
    color: '#2ECC71',
  },
  unavailable: {
    color: '#E74C3C',
  },
});