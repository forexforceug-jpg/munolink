// src/features/opportunity/renderer/SceneRenderer.tsx

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Height of the app's floating tab bar. Kept in sync with TabNavigator.tsx.
export const BASE_TAB_HEIGHT = 60;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Real-world fallback for the system nav bar height when insets
// report 0 (non-edge-to-edge Android builds). 48dp on Android,
// 34pt on iOS home indicator.
const SYSTEM_NAV_FALLBACK = Platform.select({
  ios: 34,
  android: 48,
  default: 0,
}) as number;

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
  /** Optional translucent "Inbox" button rendered inline in the
   *  userRow, right after the username + time ago. */
  onInboxPress?: () => void;
  /** Show the Inbox button. Defaults to true when onInboxPress is set. */
  showInboxButton?: boolean;
  /**
   * ✅ Reports whether the CURRENTLY VISIBLE media item is still loading.
   *    true  = spinner should be shown by the parent.
   *    false = media is ready.
   */
  onMediaLoadStateChange?: (isLoading: boolean) => void;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  resetKey?: string | number;
  isDesktop?: boolean;
  bottomOffset?: number;
  title?: string;
  price?: number;
  /** ✅ Accepts any string / null / undefined so callers don't have to
   *  narrow before passing. Value is validated internally. */
  priceType?: PriceType | string | null;
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
  /** When false, all video playback is force-paused. */
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
// ✅ HELPER: Resolve the effective price type
//
//    Priority:
//      1. Explicit valid priceType from props
//      2. 'free' if price is 0 / undefined / null
//      3. 'fixed' as the safe default
//
//    Anything that isn't one of the 4 known values is ignored.
// ============================================================
function resolveEffectivePriceType(
  rawPriceType: PriceType | string | null | undefined,
  rawPrice: number | undefined
): PriceType {
  const valid: PriceType[] = ['fixed', 'negotiable', 'starting_from', 'free'];

  if (
    typeof rawPriceType === 'string' &&
    (valid as string[]).includes(rawPriceType)
  ) {
    // But if the caller says "fixed" and price is 0, treat as free.
    if (rawPriceType === 'fixed' && (!rawPrice || rawPrice <= 0)) {
      return 'free';
    }
    return rawPriceType as PriceType;
  }

  if (!rawPrice || rawPrice <= 0) return 'free';
  return 'fixed';
}

// ============================================================
// TIKTOK-STYLE BOTTOM VIDEO PROGRESS BAR
// ============================================================

interface VideoProgressBarProps {
  player: any;
  isPlaying: boolean;
  bottomOffset: number;
  accentColor?: string;
}

function VideoProgressBar({
  player,
  isPlaying,
  bottomOffset,
  accentColor = '#A8C5FF',
}: VideoProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!player) return;

    const updateProgress = () => {
      try {
        const current = player.currentTime ?? 0;
        const duration = player.duration ?? 0;
        if (duration > 0) {
          setProgress(Math.max(0, Math.min(1, current / duration)));
        } else {
          setProgress(0);
        }
      } catch {
        setProgress(0);
      }
    };

    const subs: any[] = [];

    try {
      subs.push(player.addListener('timeUpdate', updateProgress));
    } catch {}
    try {
      subs.push(
        player.addListener('playingChange', () => setTimeout(updateProgress, 60))
      );
    } catch {}
    try {
      subs.push(
        player.addListener('statusChange', () => setTimeout(updateProgress, 60))
      );
    } catch {}

    const poll = setInterval(updateProgress, 250);
    updateProgress();

    return () => {
      subs.forEach((s) => {
        try {
          s?.remove?.();
        } catch {}
      });
      clearInterval(poll);
    };
  }, [player]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  if (!isPlaying && progress === 0) return null;

  const safeBottom = Math.max(bottomOffset, SYSTEM_NAV_FALLBACK);

  return (
    <View
      style={[styles.videoProgressBarContainer, { bottom: safeBottom }]}
      pointerEvents="none"
    >
      <View style={styles.videoProgressBarTrack} />
      <Animated.View
        style={[
          styles.videoProgressBarFill,
          {
            backgroundColor: accentColor,
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      >
        <View style={styles.videoProgressBarHead} />
      </Animated.View>
    </View>
  );
}

// ============================================================
// VIDEO ITEM COMPONENT (expo-video)
// ============================================================

interface VideoItemProps {
  url: string;
  width: number;
  height: number;
  isCurrent: boolean;
  isVisible: boolean;
  autoPlay: boolean;
  bottomOffset: number;
  onPlayingChange: (playing: boolean) => void;
  onReadyChange: (isLoading: boolean) => void;
}

const VideoItem = memo(
  function VideoItem({
    url,
    width,
    height,
    isCurrent,
    isVisible,
    autoPlay,
    bottomOffset,
    onPlayingChange,
    onReadyChange,
  }: VideoItemProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [hasEnded, setHasEnded] = useState(false);
    const [videoAspect, setVideoAspect] = useState<number | null>(null);

    const player = useVideoPlayer(url || '', (p) => {
      p.loop = false;
      p.muted = false;
    });

    useEffect(() => {
      onReadyChange(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url]);

    useEffect(() => {
      if (!player) return;

      const playingSub = player.addListener('playingChange', (payload) => {
        const playing = !!payload.isPlaying;
        setIsPlaying(playing);
        onPlayingChange(playing);
      });

      const statusSub = player.addListener('statusChange', (payload: any) => {
        const status = payload?.status;

        if (status === 'readyToPlay') {
          onReadyChange(false);

          try {
            if (!player.playing && (player.currentTime ?? 0) > 0) {
              const current = player.currentTime ?? 0;
              const duration = player.duration ?? 0;
              if (duration > 0 && current >= duration - 0.25) {
                setHasEnded(true);
              }
            }
          } catch {}
        }

        if (payload?.error) {
          onReadyChange(false);
          console.warn('[VideoItem] player error:', payload.error);
        }
      });

      let endSub: any = null;
      try {
        endSub = player.addListener('playToEnd', () => {
          setHasEnded(true);
          setIsPlaying(false);
          onPlayingChange(false);
        });
      } catch {}

      return () => {
        playingSub.remove();
        statusSub.remove();
        endSub?.remove?.();
      };
    }, [player, onPlayingChange, onReadyChange]);

    useEffect(() => {
      if (!player) return;

      const iv = setInterval(() => {
        try {
          const track = (player as any).videoTrack;
          if (track?.size?.width && track?.size?.height) {
            setVideoAspect(track.size.width / track.size.height);
            clearInterval(iv);
          }
        } catch {}
      }, 250);

      return () => clearInterval(iv);
    }, [player]);

    useEffect(() => {
      if (!player) return;

      const shouldPlay = isCurrent && isVisible && autoPlay;

      const applyPlayState = () => {
        try {
          if (shouldPlay) {
            setHasEnded(false);
            player.play();
          } else {
            player.pause();
            try {
              player.currentTime = 0;
            } catch {}
            setHasEnded(false);
            setIsPlaying(false);
            onPlayingChange(false);
          }
        } catch (err) {
          console.warn('[VideoItem] play/pause failed:', err);
        }
      };

      applyPlayState();
    }, [isCurrent, isVisible, autoPlay, player, onPlayingChange]);

    const handleToggle = useCallback(
      (e?: any) => {
        if (e && typeof e.stopPropagation === 'function') {
          e.stopPropagation();
        }
        if (!player) return;

        try {
          if (isPlaying) {
            player.pause();
          } else {
            if (hasEnded) {
              try {
                player.currentTime = 0;
              } catch {}
              setHasEnded(false);
            }
            player.play();
          }
        } catch (err) {
          console.warn('[VideoItem] toggle failed:', err);
        }
      },
      [isPlaying, hasEnded, player]
    );

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

    const showReplayButton = hasEnded && !isPlaying;
    const showPlayingPill = isPlaying;

    return (
      <View style={[styles.mediaItem, { width, height }]}>
        <View
          style={{
            width,
            height,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          pointerEvents="box-none"
        >
          <VideoView
            player={player}
            style={{ width: videoW, height: videoH, backgroundColor: '#000' }}
            contentFit="contain"
            nativeControls={false}
            allowsPictureInPicture={false}
          />
        </View>

        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleToggle}
        />

        {showReplayButton && (
          <View style={styles.videoControlsOverlay} pointerEvents="none">
            <View style={styles.videoPlayButton}>
              <Ionicons
                name="refresh-circle"
                size={72}
                color="rgba(255,255,255,0.92)"
              />
            </View>
          </View>
        )}

        {showPlayingPill && (
          <View style={styles.videoPlayingIndicator} pointerEvents="none">
            <View style={styles.videoPlayingDot} />
            <Text style={styles.videoPlayingText}>Playing</Text>
          </View>
        )}

        <VideoProgressBar
          player={player}
          isPlaying={isPlaying}
          bottomOffset={bottomOffset}
          accentColor="#A8C5FF"
        />
      </View>
    );
  },
  (prev, next) =>
    prev.url === next.url &&
    prev.isCurrent === next.isCurrent &&
    prev.isVisible === next.isVisible &&
    prev.autoPlay === next.autoPlay &&
    prev.width === next.width &&
    prev.height === next.height &&
    prev.bottomOffset === next.bottomOffset
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
  onInboxPress,
  showInboxButton = true,
  onMediaLoadStateChange,
  width = screenWidth,
  height = 600,
  autoPlay = true,
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
  const insets = useSafeAreaInsets();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progressAnim] = useState(new Animated.Value(0));
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const [mediaLoadingMap, setMediaLoadingMap] = useState<
    Record<number, boolean>
  >({});

  const flatListRef = useRef<FlatList<MediaItem>>(null);
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sceneStartTimeRef = useRef<number>(Date.now());
  const lastReportedIndexRef = useRef(0);

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

  // ============================================================
  // ✅ Resolve the effective price type
  //
  //    1. Use the explicit prop if it's one of the four known values.
  //    2. If the prop says 'fixed' but price is 0/undefined → 'free'.
  //    3. If the prop is invalid and price is 0 → 'free'.
  //    4. Otherwise 'fixed'.
  // ============================================================
  const effectivePriceType = resolveEffectivePriceType(priceType, price);

  const getPriceBadge = (): { label: string; color: string } => {
    switch (effectivePriceType) {
      case 'negotiable':
        return { label: 'Negotiable', color: '#F1C40F' };
      case 'starting_from':
        return { label: 'Starting From', color: '#2ECC71' };
      case 'free':
        return { label: 'Free', color: '#2ECC71' };
      case 'fixed':
      default:
        return { label: 'Fixed', color: '#4A7DFF' };
    }
  };

  const priceBadge = getPriceBadge();
  const timeAgo = formatTimeAgo(createdAt);
  const displayName = userName || 'User';

  // ============================================================
  // SINGLE SOURCE OF TRUTH for bottom clearance
  // ============================================================
  const progressBarBottomOffset =
    Math.max(insets.bottom, SYSTEM_NAV_FALLBACK) +
    (isDesktop ? 0 : BASE_TAB_HEIGHT) +
    6;

  const PROGRESS_BAR_HEIGHT = 5;
  const INFO_PANEL_GAP = 10;
  const infoPanelBottomOffset =
    progressBarBottomOffset + PROGRESS_BAR_HEIGHT + INFO_PANEL_GAP;

  // ============================================================
  // IMAGE PREFETCH
  // ============================================================
  useEffect(() => {
    const cancelledFlags: { [idx: number]: boolean } = {};

    safeMedia.forEach((item, idx) => {
      if (item.type !== 'image') return;

      setMediaLoadingMap((prev) =>
        prev[idx] === undefined ? { ...prev, [idx]: true } : prev
      );

      cancelledFlags[idx] = false;

      Image.prefetch(item.url)
        .then(() => {
          if (!cancelledFlags[idx]) {
            setMediaLoadingMap((prev) => ({ ...prev, [idx]: false }));
          }
        })
        .catch(() => {
          if (!cancelledFlags[idx]) {
            setMediaLoadingMap((prev) => ({ ...prev, [idx]: false }));
          }
        });
    });

    return () => {
      Object.keys(cancelledFlags).forEach((k) => {
        cancelledFlags[Number(k)] = true;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeMedia]);

  useEffect(() => {
    if (!onMediaLoadStateChange) return;
    const isLoading = mediaLoadingMap[currentIndex] === true;
    onMediaLoadStateChange(isLoading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, mediaLoadingMap, onMediaLoadStateChange]);

  const handleVideoReady = useCallback(
    (index: number, isLoading: boolean) => {
      setMediaLoadingMap((prev) => {
        if (prev[index] === isLoading) return prev;
        return { ...prev, [index]: isLoading };
      });
    },
    []
  );

  // ============================================================
  // BEHAVIORAL EVENT EMITTER
  // ============================================================

  const emitBehavioralEvent = useCallback(
    (event: BehavioralEvent) => {
      if (onBehavioralEvent) onBehavioralEvent(event);
      if (__DEV__) console.log('📊 Behavioral Event:', event);
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

  // ============================================================
  // NAVIGATION FUNCTIONS
  // ============================================================

  const goToNextMedia = useCallback(
    (source: NavigationSource = 'autoplay') => {
      if (totalItems <= 1) return;
      trackSceneView(currentIndex, source);
      const nextIndex = (currentIndex + 1) % totalItems;
      setCurrentIndex(nextIndex);
      lastReportedIndexRef.current = nextIndex;
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
      lastReportedIndexRef.current = prevIndex;
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
      lastReportedIndexRef.current = index;
      onSceneChange?.(index, source);
      progressAnim.setValue(0);
      flatListRef.current?.scrollToIndex({ index, animated: true });
    },
    [currentIndex, totalItems, onSceneChange, trackSceneView, progressAnim]
  );

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / width);

      if (newIndex < 0 || newIndex >= totalItems) return;
      if (newIndex === lastReportedIndexRef.current) return;

      trackSceneView(lastReportedIndexRef.current, 'swipe');
      lastReportedIndexRef.current = newIndex;
      setCurrentIndex(newIndex);
      onSceneChange?.(newIndex, 'swipe');
      progressAnim.setValue(0);
      sceneStartTimeRef.current = Date.now();
    },
    [width, totalItems, onSceneChange, trackSceneView, progressAnim]
  );

  // ============================================================
  // AUTOPLAY
  // ============================================================

  const startAutoplay = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    if (
      autoPlay &&
      isVisible &&
      totalItems > 1 &&
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
    return () => stopAutoplay();
  }, [
    autoPlay,
    isVisible,
    totalItems,
    currentIndex,
    startAutoplay,
    stopAutoplay,
  ]);

  useEffect(() => {
    setCurrentIndex(0);
    lastReportedIndexRef.current = 0;
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
    }).start(() => progressAnim.setValue(0));
  }, [currentIndex, autoPlayInterval, progressAnim]);

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
            bottomOffset={progressBarBottomOffset}
            onPlayingChange={setIsVideoPlaying}
            onReadyChange={(isLoading) =>
              handleVideoReady(index, isLoading)
            }
          />
        );
      }

      return (
        <View style={[styles.mediaItem, { width, height }]}>
          <Image
            source={{ uri: item.url }}
            style={[styles.mediaImage, { width, height }]}
            resizeMode="contain"
            onLoad={() =>
              setMediaLoadingMap((prev) =>
                prev[index] === false ? prev : { ...prev, [index]: false }
              )
            }
            onError={() =>
              setMediaLoadingMap((prev) =>
                prev[index] === false ? prev : { ...prev, [index]: false }
              )
            }
          />
        </View>
      );
    },
    [
      width,
      height,
      currentIndex,
      isVisible,
      autoPlay,
      progressBarBottomOffset,
      handleVideoReady,
    ]
  );

  // ============================================================
  // RENDER
  // ============================================================

  const shouldShowSeeDetails = description && description.length > 100;
  const displayDescription = isExpanded
    ? description
    : description
    ? description.slice(0, 100) + (description.length > 100 ? '...' : '')
    : '';

  // ============================================================
  // ✅ Price display — respects the effective price type
  // ============================================================
  const displayPrice =
    effectivePriceType === 'free'
      ? 'Free'
      : effectivePriceType === 'starting_from'
      ? `From ${currency} ${(price || 0).toLocaleString()}`
      : `${currency} ${(price || 0).toLocaleString()}`;

  const showInbox = !!onInboxPress && showInboxButton;

  return (
    <View style={[styles.container, { width, height }]}>
      <FlatList
        ref={flatListRef}
        data={safeMedia}
        renderItem={renderMediaItem}
        keyExtractor={(item, index) => `media-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        initialScrollIndex={0}
        style={styles.carousel}
        removeClippedSubviews={false}
        decelerationRate="fast"
        directionalLockEnabled
        {...(Platform.OS === 'web' ? { pagingEnabled: true } : {})}
      />

      {totalItems > 1 && !currentIsVideo && (
        <View style={styles.tapContainer} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.tapArea}
            onPress={() => {
              if (currentIndex > 0) {
                goToPreviousMedia('tap');
              }
            }}
            activeOpacity={0.3}
          />
          <TouchableOpacity
            style={styles.tapArea}
            onPress={() => {
              if (currentIndex < totalItems - 1) {
                goToNextMedia('tap');
              }
            }}
            activeOpacity={0.3}
          />
        </View>
      )}

      <LinearGradient
        colors={[
          'rgba(0,0,0,0)',
          'rgba(0,0,0,0.35)',
          'rgba(0,0,0,0.75)',
          'rgba(0,0,0,0.92)',
        ]}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.infoScrim, { height: Math.max(260, height * 0.55) }]}
        pointerEvents="none"
      />

      <View
        style={[
          styles.bottomContainer,
          { bottom: infoPanelBottomOffset },
        ]}
      >
        <View style={styles.dotsContainer}>
          {safeMedia.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={styles.dotWrapper}
              onPress={() => {
                goToMedia(index, 'tap');
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
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
            {timeAgo && <Text style={styles.timeAgo}>• {timeAgo}</Text>}

            {showInbox && (
              <TouchableOpacity
                style={styles.inlineInboxButton}
                onPress={() => {
                  onInboxPress?.();
                  onPrimaryAction?.();
                }}
                activeOpacity={0.75}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={12}
                  color="#FFFFFF"
                />
                <Text style={styles.inlineInboxText}>Inbox</Text>
              </TouchableOpacity>
            )}
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
  carousel: { flex: 1 },
  mediaItem: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#030305',
  },
  mediaImage: { backgroundColor: '#000000' },
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

  videoProgressBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 5,
    zIndex: 30,
  },
  videoProgressBarTrack: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 3,
  },
  videoProgressBarFill: {
    height: '100%',
    borderRadius: 3,
    shadowColor: '#A8C5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  videoProgressBarHead: {
    position: 'absolute',
    right: 0,
    top: -1,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 8,
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
  tapArea: { flex: 1, height: '100%' },

  infoScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  bottomContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 25,
    paddingHorizontal: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dotWrapper: { paddingHorizontal: 4, paddingVertical: 6 },
  dot: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: { backgroundColor: '#FFFFFF' },
  dotInactive: { width: 8 },
  infoPanel: { alignSelf: 'stretch' },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    maxWidth: '88%',
    textShadowColor: 'rgba(0,0,0,0.85)',
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
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  priceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    maxWidth: '92%',
    flexWrap: 'nowrap',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    flexShrink: 1,
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginLeft: 4,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flexShrink: 0,
  },
  inlineInboxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginLeft: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    flexShrink: 0,
  },
  inlineInboxText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  descriptionContainer: {
    marginTop: 6,
    maxWidth: '85%',
    alignSelf: 'flex-start',
    paddingRight: 8,
  },
  description: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  seeMoreText: {
    color: '#4A7DFF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  sceneCounter: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 15,
  },
  sceneCounterText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  inStock: { color: '#2ECC71' },
  outOfStock: { color: '#E74C3C' },
  available: { color: '#2ECC71' },
  unavailable: { color: '#E74C3C' },
});