// src/features/opportunity/renderer/SceneRenderer.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
  Dimensions,
  PanResponder,
  Platform,
} from 'react-native';
import { Scene } from '../types/Scene';
import { HeroScene } from '../scenes/HeroScene';
import { DetailsScene } from '../scenes/DetailsScene';
import { TrustScene } from '../scenes/TrustScene';
import { GalleryScene } from '../scenes/GalleryScene';
import { ActionScene } from '../scenes/ActionScene';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

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
  type: 'scene_view' | 'scene_navigation' | 'opportunity_open' | 'opportunity_close' | 'gallery_interaction' | 'action_trigger';
  sceneIndex?: number;
  sceneType?: string;
  timeSpent?: number;
  source?: NavigationSource;
  action?: string;
}

interface Props {
  scenes: Scene[];
  onSceneChange?: (index: number, source?: NavigationSource) => void;
  onPrimaryAction?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onShowMore?: () => void;
  onBehavioralEvent?: (event: BehavioralEvent) => void;
  width?: number;
  height?: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  resetKey?: string | number;
  isDesktop?: boolean;
  title?: string;
  price?: number;
  shopName?: string;
  rating?: number | null;
  area?: string | null;
  inStock?: boolean;
  currency?: string;
  type?: 'product' | 'service' | 'event';
  providerName?: string;  // ✅ Provider name for services
  providerId?: string;
  providerType?: 'individual' | 'institution';
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function SceneRenderer({ 
  scenes, 
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
  title = 'Product',
  price = 0,
  shopName = 'Shop',
  rating = null,
  area = null,
  inStock = true,
  currency = 'UGX',
  type = 'product',
  providerName = '',  // ✅ Provider name prop
  providerId = '',
  providerType = 'individual',
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progressAnim] = useState(new Animated.Value(0));
  const [isDragging, setIsDragging] = useState(false);
  
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sceneStartTimeRef = useRef<number>(Date.now());
  const opportunityOpenTimeRef = useRef<number>(Date.now());
  const isFirstSceneViewRef = useRef<boolean>(true);
  
  const flatListRef = useRef<any>(null);

  // Safe check for empty scenes
  if (!scenes || scenes.length === 0) {
    return (
      <View style={[styles.container, { width, height, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#FFFFFF' }}>No scenes available</Text>
      </View>
    );
  }

  const currentScene = scenes[currentIndex] || scenes[0];
  const bottomPosition = isDesktop ? 30 : 100;

  // ✅ Check if this is a service
  const isService = type === 'service' || type === 'event';
  
  // ✅ Determine the display name with proper fallbacks
  let displayName = shopName || 'Shop';
  
  if (isService) {
    // For services: use providerName if available, then shopName, then fallback
    displayName = providerName || shopName || 'Service Provider';
  } else {
    // For products: use shopName
    displayName = shopName || 'Shop';
  }
  
  // ✅ Availability text - different for products vs services
  const availabilityText = isService 
    ? (inStock ? 'Available' : 'Unavailable')
    : (inStock ? 'In Stock' : 'Check Availability');
  
  const availabilityStyle = isService
    ? (inStock ? styles.available : styles.unavailable)
    : (inStock ? styles.inStock : styles.outOfStock);

  // ✅ Debug log to verify provider name is passed
  if (__DEV__ && isService) {
    console.log(`📱 Service: "${title}" - Provider: "${providerName || 'undefined'}" - Display: "${displayName}"`);
  }

  // ============================================================
  // BEHAVIORAL EVENT EMITTER
  // ============================================================
  
  const emitBehavioralEvent = useCallback((event: BehavioralEvent) => {
    if (onBehavioralEvent) {
      onBehavioralEvent(event);
    }
    if (__DEV__) {
      console.log('📊 Behavioral Event:', event);
    }
  }, [onBehavioralEvent]);

  // ============================================================
  // SCENE VIEW TRACKING
  // ============================================================
  
  const trackSceneView = useCallback((index: number, source: NavigationSource = 'autoplay') => {
    const scene = scenes[index];
    if (!scene) return;
    
    const timeSpent = Date.now() - sceneStartTimeRef.current;
    const event: BehavioralEvent = {
      type: 'scene_view',
      sceneIndex: index,
      sceneType: scene.type || 'unknown',
      timeSpent: timeSpent,
      source: source,
    };
    
    emitBehavioralEvent(event);
    sceneStartTimeRef.current = Date.now();
  }, [scenes, emitBehavioralEvent]);

  // ============================================================
  // OPPORTUNITY OPEN/CLOSE TRACKING
  // ============================================================
  
  useEffect(() => {
    const openEvent: BehavioralEvent = {
      type: 'opportunity_open',
      sceneIndex: 0,
      sceneType: scenes[0]?.type || 'unknown',
      source: 'tap',
    };
    emitBehavioralEvent(openEvent);
    opportunityOpenTimeRef.current = Date.now();
    sceneStartTimeRef.current = Date.now();
    isFirstSceneViewRef.current = true;
    
    return () => {
      const totalTimeSpent = Date.now() - opportunityOpenTimeRef.current;
      const closeEvent: BehavioralEvent = {
        type: 'opportunity_close',
        timeSpent: totalTimeSpent,
      };
      emitBehavioralEvent(closeEvent);
      
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    };
  }, []);

  // ============================================================
  // NAVIGATION FUNCTIONS
  // ============================================================
  
  const goToNextScene = useCallback((source: NavigationSource = 'autoplay') => {
    if (scenes.length === 0) return;
    trackSceneView(currentIndex, source);
    const nextIndex = (currentIndex + 1) % scenes.length;
    setCurrentIndex(nextIndex);
    onSceneChange?.(nextIndex, source);
    progressAnim.setValue(0);
  }, [currentIndex, scenes.length, onSceneChange, trackSceneView, progressAnim]);

  const goToPreviousScene = useCallback((source: NavigationSource = 'tap') => {
    if (scenes.length === 0) return;
    trackSceneView(currentIndex, source);
    const prevIndex = (currentIndex - 1 + scenes.length) % scenes.length;
    setCurrentIndex(prevIndex);
    onSceneChange?.(prevIndex, source);
    progressAnim.setValue(0);
  }, [currentIndex, scenes.length, onSceneChange, trackSceneView, progressAnim]);

  const goToScene = useCallback((index: number, source: NavigationSource = 'tap') => {
    if (scenes.length === 0) return;
    if (index === currentIndex) return;
    trackSceneView(currentIndex, source);
    setCurrentIndex(index);
    onSceneChange?.(index, source);
    progressAnim.setValue(0);
  }, [currentIndex, scenes.length, onSceneChange, trackSceneView, progressAnim]);

  // ============================================================
  // TAP NAVIGATION
  // ============================================================
  
  const handleTap = useCallback((event: any) => {
    if (scenes.length <= 1) return;
    const tapX = event.nativeEvent.locationX;
    const containerWidth = width || screenWidth;
    const tapThreshold = containerWidth * 0.3;
    if (tapX < tapThreshold) {
      if (currentIndex > 0) {
        goToPreviousScene('tap');
      }
    } else if (tapX > containerWidth - tapThreshold) {
      if (currentIndex < scenes.length - 1) {
        goToNextScene('tap');
      }
    }
  }, [currentIndex, scenes.length, width, goToPreviousScene, goToNextScene]);

  // ============================================================
  // AUTOPLAY LOGIC
  // ============================================================
  
  const startAutoplay = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
    if (autoPlay && scenes.length > 1 && !isDragging) {
      autoPlayTimerRef.current = setTimeout(() => {
        goToNextScene('autoplay');
      }, autoPlayInterval);
    }
  }, [autoPlay, scenes.length, isDragging, autoPlayInterval, goToNextScene]);

  const stopAutoplay = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
  }, []);

  // ============================================================
  // EFFECTS
  // ============================================================
  
  useEffect(() => {
    if (autoPlay && scenes.length > 1) {
      startAutoplay();
    } else {
      stopAutoplay();
    }
    return () => {
      stopAutoplay();
    };
  }, [autoPlay, scenes.length, currentIndex, isDragging, startAutoplay, stopAutoplay]);

  useEffect(() => {
    setCurrentIndex(0);
    progressAnim.setValue(0);
    stopAutoplay();
    onSceneChange?.(0, 'tap');
    sceneStartTimeRef.current = Date.now();
    isFirstSceneViewRef.current = true;
    if (autoPlay && scenes.length > 1) {
      startAutoplay();
    }
  }, [resetKey, scenes]);

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
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
    },
    onPanResponderGrant: () => {
      setIsDragging(true);
      stopAutoplay();
    },
    onPanResponderRelease: (_, gestureState) => {
      setIsDragging(false);
      const threshold = 50;
      if (gestureState.dx < -threshold && currentIndex < scenes.length - 1) {
        goToNextScene('swipe');
      } else if (gestureState.dx > threshold && currentIndex > 0) {
        goToPreviousScene('swipe');
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
  // RENDER SCENE
  // ============================================================
  
  const renderScene = () => {
    if (!currentScene) return null;
    
    switch (currentScene.type) {
      case 'hero':
        return <HeroScene scene={currentScene} width={width} height={height} />;
      case 'details':
        return <DetailsScene scene={currentScene} width={width} height={height} />;
      case 'trust':
        return <TrustScene scene={currentScene} width={width} height={height} />;
      case 'gallery':
        return <GalleryScene scene={currentScene} width={width} height={height} />;
      case 'action':
        return (
          <ActionScene 
            scene={currentScene} 
            onPrimaryAction={() => {
              const actionEvent: BehavioralEvent = {
                type: 'action_trigger',
                action: 'primary',
                sceneIndex: currentIndex,
                sceneType: currentScene.type,
              };
              emitBehavioralEvent(actionEvent);
              onPrimaryAction?.();
            }}
            onShare={() => {
              const actionEvent: BehavioralEvent = {
                type: 'action_trigger',
                action: 'share',
                sceneIndex: currentIndex,
                sceneType: currentScene.type,
              };
              emitBehavioralEvent(actionEvent);
              onShare?.();
            }}
            onSave={() => {
              const actionEvent: BehavioralEvent = {
                type: 'action_trigger',
                action: 'save',
                sceneIndex: currentIndex,
                sceneType: currentScene.type,
              };
              emitBehavioralEvent(actionEvent);
              onSave?.();
            }}
            width={width} 
            height={height} 
          />
        );
      default:
        return null;
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  
  const showNavArrows = isDesktop && Platform.OS === 'web';

  return (
    <View 
      style={[styles.container, { width, height }]}
      {...panResponder.panHandlers}
    >
      {scenes.length > 1 && (
        <View style={styles.tapContainer}>
          <TouchableOpacity 
            style={[styles.tapArea, styles.tapLeft]}
            onPress={() => {
              if (currentIndex > 0) {
                goToPreviousScene('tap');
              }
            }}
            activeOpacity={0.3}
            accessible={false}
          />
          <TouchableOpacity 
            style={[styles.tapArea, styles.tapRight]}
            onPress={() => {
              if (currentIndex < scenes.length - 1) {
                goToNextScene('tap');
              }
            }}
            activeOpacity={0.3}
            accessible={false}
          />
        </View>
      )}

      <View style={styles.sceneWrapper}>
        {renderScene()}
      </View>

      {/* Bottom Container - Dots + Info */}
      <View style={[styles.bottomContainer, { bottom: bottomPosition }]}>
        <View style={styles.dotsContainer}>
          {scenes.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={styles.dotWrapper}
              onPress={() => {
                goToScene(index, 'tap');
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

          <Text style={styles.price}>
            {currency} {price.toLocaleString()}
          </Text>

          <View style={styles.metaRow}>
            {/* ✅ Show provider name for services, shop name for products */}
            <Text style={styles.shopName}>{displayName}</Text>
            
            {rating !== null && rating !== undefined && rating > 0 && (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.rating}>⭐ {rating.toFixed(1)}</Text>
              </>
            )}
            
            {area && (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.distance}>📍 {area}</Text>
              </>
            )}
            
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={[styles.availability, availabilityStyle]}>
              {availabilityText}
            </Text>
          </View>

          <TouchableOpacity 
            onPress={() => {
              const showMoreEvent: BehavioralEvent = {
                type: 'action_trigger',
                action: 'show_more',
                sceneIndex: currentIndex,
                sceneType: currentScene.type,
              };
              emitBehavioralEvent(showMoreEvent);
              onShowMore?.();
            }} 
            activeOpacity={0.7}
          >
            <Text style={styles.seeMoreText}>See Details ›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scene Counter */}
      <View style={styles.sceneCounter}>
        <Text style={styles.sceneCounterText}>
          {currentIndex + 1} / {scenes.length}
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
  sceneWrapper: {
    flex: 1,
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
    paddingBottom: 0,
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
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  price: {
    color: '#4A7DFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  shopName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dotSeparator: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginHorizontal: 4,
  },
  rating: {
    color: '#F1C40F',
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  distance: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  availability: {
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
  seeMoreText: {
    color: '#FFFFFF',
    marginTop: 6,
    fontWeight: '600',
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
});