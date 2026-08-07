import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
  Dimensions,
  PanResponder,
} from 'react-native';
import { Scene } from '../types/Scene';
import { HeroScene } from '../scenes/HeroScene';
import { DetailsScene } from '../scenes/DetailsScene';
import { TrustScene } from '../scenes/TrustScene';
import { GalleryScene } from '../scenes/GalleryScene';
import { ActionScene } from '../scenes/ActionScene';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  scenes: Scene[];
  onSceneChange?: (index: number) => void;
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
  title?: string;
  price?: number;
  shopName?: string;
  rating?: number | null;
  area?: string | null;
  inStock?: boolean;
  currency?: string;
}

export function SceneRenderer({ 
  scenes, 
  onSceneChange, 
  onPrimaryAction,
  onShare,
  onSave,
  onShowMore,
  width = screenWidth, 
  height = 600,
  autoPlay = true,
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
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progressAnim] = useState(new Animated.Value(0));
  const [autoPlayTimer, setAutoPlayTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const flatListRef = useRef<any>(null);

  const currentScene = scenes[currentIndex] || scenes[0];

  // ✅ Mobile: higher position to avoid bottom nav bar
  const bottomPosition = isDesktop ? 30 : 100;

  useEffect(() => {
    setCurrentIndex(0);
    progressAnim.setValue(0);
    if (autoPlayTimer) {
      clearTimeout(autoPlayTimer);
      setAutoPlayTimer(null);
    }
    onSceneChange?.(0);
  }, [scenes, resetKey]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
    },
    onPanResponderGrant: () => {
      setIsDragging(true);
      if (autoPlayTimer) {
        clearTimeout(autoPlayTimer);
        setAutoPlayTimer(null);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      setIsDragging(false);
      const threshold = 50;
      
      if (gestureState.dx < -threshold && currentIndex < scenes.length - 1) {
        goToNextScene();
      } else if (gestureState.dx > threshold && currentIndex > 0) {
        goToPreviousScene();
      } else {
        resumeAutoPlay();
      }
    },
    onPanResponderTerminate: () => {
      setIsDragging(false);
      resumeAutoPlay();
    },
  });

  const goToNextScene = useCallback(() => {
    const nextIndex = (currentIndex + 1) % scenes.length;
    setCurrentIndex(nextIndex);
    onSceneChange?.(nextIndex);
  }, [currentIndex, scenes.length, onSceneChange]);

  const goToPreviousScene = useCallback(() => {
    const prevIndex = (currentIndex - 1 + scenes.length) % scenes.length;
    setCurrentIndex(prevIndex);
    onSceneChange?.(prevIndex);
  }, [currentIndex, scenes.length, onSceneChange]);

  const goToScene = useCallback((index: number) => {
    setCurrentIndex(index);
    onSceneChange?.(index);
  }, [onSceneChange]);

  const resumeAutoPlay = useCallback(() => {
    if (autoPlay && scenes.length > 1 && !autoPlayTimer) {
      const timer = setTimeout(() => {
        goToNextScene();
      }, autoPlayInterval);
      setAutoPlayTimer(timer);
    }
  }, [autoPlay, scenes.length, autoPlayInterval, goToNextScene, autoPlayTimer]);

  useEffect(() => {
    if (autoPlayTimer) {
      clearTimeout(autoPlayTimer);
      setAutoPlayTimer(null);
    }

    if (autoPlay && scenes.length > 1) {
      const timer = setTimeout(() => {
        if (!isDragging) {
          goToNextScene();
        }
      }, autoPlayInterval);
      setAutoPlayTimer(timer);
    }

    return () => {
      if (autoPlayTimer) {
        clearTimeout(autoPlayTimer);
        setAutoPlayTimer(null);
      }
    };
  }, [currentIndex, autoPlay, scenes.length, autoPlayInterval, goToNextScene, isDragging]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: autoPlayInterval,
      useNativeDriver: false,
    }).start(() => {
      progressAnim.setValue(0);
    });
  }, [currentIndex, autoPlayInterval]);

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
            onPrimaryAction={onPrimaryAction}
            onShare={onShare}
            onSave={onSave}
            width={width} 
            height={height} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <View 
      style={[styles.container, { width, height }]}
      {...panResponder.panHandlers}
    >
      <View style={styles.sceneWrapper}>
        {renderScene()}
      </View>

      <View style={[styles.bottomContainer, { bottom: bottomPosition }]}>
        <View style={styles.dotsContainer}>
          {scenes.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={styles.dotWrapper}
              onPress={() => {
                goToScene(index);
                if (autoPlayTimer) {
                  clearTimeout(autoPlayTimer);
                  setAutoPlayTimer(null);
                  resumeAutoPlay();
                }
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
            <Text style={styles.shopName}>{shopName}</Text>
            
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
            <Text style={[styles.availability, inStock ? styles.inStock : styles.outOfStock]}>
              {inStock ? 'In Stock' : 'Check Availability'}
            </Text>
          </View>

          <TouchableOpacity onPress={onShowMore} activeOpacity={0.7}>
            <Text style={styles.seeMoreText}>See more ›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.navigationArrows}>
        <TouchableOpacity
          style={[styles.arrowButton, styles.leftArrow]}
          onPress={goToPreviousScene}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.arrowButton, styles.rightArrow]}
          onPress={goToNextScene}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={28} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      <View style={styles.sceneCounter}>
        <Text style={styles.sceneCounterText}>
          {currentIndex + 1} / {scenes.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2F5F',
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  sceneWrapper: {
    flex: 1,
  },
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
  seeMoreText: {
    color: '#FFFFFF',
    marginTop: 6,
    fontWeight: '600',
    fontSize: 13,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  navigationArrows: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    zIndex: 15,
    pointerEvents: 'box-none',
  },
  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'auto',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  leftArrow: {
    marginRight: 'auto',
  },
  rightArrow: {
    marginLeft: 'auto',
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