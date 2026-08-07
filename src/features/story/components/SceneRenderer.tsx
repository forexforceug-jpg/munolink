import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Scene } from '../engine/SceneEngine';

interface Props {
  scenes: Scene[];
  onSceneChange?: (index: number) => void;
  onCTAPress?: () => void;
}

export function SceneRenderer({ scenes, onSceneChange, onCTAPress }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progressAnim] = useState(new Animated.Value(0));
const [autoPlayTimer, setAutoPlayTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const currentScene = scenes[currentIndex] || scenes[0];

  useEffect(() => {
    // Auto-play timer
    const timer = setTimeout(() => {
      if (currentIndex < scenes.length - 1) {
        setCurrentIndex(currentIndex + 1);
        onSceneChange?.(currentIndex + 1);
      } else {
        setCurrentIndex(0);
        onSceneChange?.(0);
      }
    }, 3000);

    setAutoPlayTimer(timer);
    return () => clearTimeout(timer);
  }, [currentIndex, scenes.length]);

  useEffect(() => {
    // Animate progress
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(() => {
      progressAnim.setValue(0);
    });
  }, [currentIndex]);

  const renderSceneContent = () => {
    switch (currentScene.type) {
      case 'hero':
        return (
          <View style={styles.sceneContent}>
            {currentScene.image && (
              <Image source={{ uri: currentScene.image }} style={styles.heroImage} resizeMode="cover" />
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.gradientOverlay}
            />
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>{currentScene.title}</Text>
              <Text style={styles.heroContent}>{currentScene.content}</Text>
              {currentScene.data?.price && (
                <Text style={styles.heroPrice}>UGX {currentScene.data.price.toLocaleString()}</Text>
              )}
              <View style={styles.heroMeta}>
                <Text style={styles.heroShop}>{currentScene.data?.shopName}</Text>
                <View style={styles.heroRating}>
                  <Ionicons name="star" size={16} color="#F1C40F" />
                  <Text style={styles.heroRatingText}>{currentScene.data?.rating?.toFixed(1) || 'New'}</Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 'details':
        return (
          <View style={styles.sceneContent}>
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>{currentScene.title}</Text>
              <Text style={styles.detailsContent}>{currentScene.content}</Text>
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>{currentScene.data?.category || 'General'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Availability</Text>
                  <Text style={[styles.detailValue, currentScene.data?.inStock ? styles.inStock : styles.outOfStock]}>
                    {currentScene.data?.inStock ? 'In Stock' : 'Check Availability'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );

      case 'reviews':
        return (
          <View style={styles.sceneContent}>
            <View style={styles.reviewsContainer}>
              <Text style={styles.reviewsTitle}>{currentScene.title}</Text>
              <View style={styles.reviewsSummary}>
                <View style={styles.reviewsScore}>
                  <Ionicons name="star" size={32} color="#F1C40F" />
                  <Text style={styles.reviewsScoreText}>{currentScene.data?.rating?.toFixed(1) || '4.5'}</Text>
                </View>
                <Text style={styles.reviewsCount}>{currentScene.data?.reviewCount || 0} reviews</Text>
              </View>
              <Text style={styles.reviewsContent}>{currentScene.content}</Text>
              {currentScene.data?.topReview && (
                <View style={styles.topReview}>
                  <Text style={styles.topReviewText}>"{currentScene.data.topReview}"</Text>
                </View>
              )}
            </View>
          </View>
        );

      case 'location':
        return (
          <View style={styles.sceneContent}>
            <View style={styles.locationContainer}>
              <Text style={styles.locationTitle}>{currentScene.title}</Text>
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={24} color="#4A7DFF" />
                <Text style={styles.locationText}>{currentScene.data?.area || 'Near you'}</Text>
              </View>
              <View style={styles.locationInfo}>
                <Ionicons name="navigate" size={24} color="#4A7DFF" />
                <Text style={styles.locationText}>{currentScene.data?.distance || '0.6 km'}</Text>
              </View>
              <View style={[styles.locationInfo, styles.locationStatus]}>
                <View style={[styles.statusDot, currentScene.data?.inStock ? styles.inStockDot : styles.outOfStockDot]} />
                <Text style={[styles.locationText, currentScene.data?.inStock ? styles.inStock : styles.outOfStock]}>
                  {currentScene.data?.inStock ? 'Available Now' : 'Check Availability'}
                </Text>
              </View>
            </View>
          </View>
        );

      case 'cta':
        return (
          <View style={styles.sceneContent}>
            <View style={styles.ctaContainer}>
              <Text style={styles.ctaTitle}>{currentScene.title}</Text>
              <Text style={styles.ctaContent}>{currentScene.content}</Text>
              <TouchableOpacity style={styles.ctaButton} onPress={onCTAPress}>
                <Text style={styles.ctaButtonText}>View at {currentScene.data?.shopName}</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Bars */}
      <View style={styles.progressContainer}>
        {scenes.map((_, index) => (
          <View key={index} style={styles.progressBarWrapper}>
            {index === currentIndex ? (
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
            ) : index < currentIndex ? (
              <View style={[styles.progressBar, styles.progressBarCompleted]} />
            ) : (
              <View style={styles.progressBar} />
            )}
          </View>
        ))}
      </View>

      {/* Scene Content */}
      <View style={styles.sceneWrapper}>
        {renderSceneContent()}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2F5F',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  progressContainer: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 4,
    zIndex: 10,
  },
  progressBarWrapper: {
    flex: 1,
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
  sceneWrapper: {
    flex: 1,
  },
  sceneContent: {
    flex: 1,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  heroTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroContent: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroPrice: {
    color: '#4A7DFF',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  heroShop: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  heroRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroRatingText: {
    color: '#F1C40F',
    fontSize: 13,
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#1F2F5F',
  },
  detailsTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailsContent: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    borderRadius: 8,
  },
  detailLabel: {
    color: '#8A8AAE',
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  inStock: {
    color: '#2ECC71',
  },
  outOfStock: {
    color: '#E74C3C',
  },
  reviewsContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#1F2F5F',
  },
  reviewsTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  reviewsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  reviewsScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewsScoreText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  reviewsCount: {
    color: '#8A8AAE',
    fontSize: 14,
  },
  reviewsContent: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 16,
  },
  topReview: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4A7DFF',
  },
  topReviewText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontStyle: 'italic',
  },
  locationContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#1F2F5F',
  },
  locationTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  locationStatus: {
    marginTop: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  inStockDot: {
    backgroundColor: '#2ECC71',
  },
  outOfStockDot: {
    backgroundColor: '#E74C3C',
  },
  ctaContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'linear-gradient(135deg, #1F2F5F 0%, #4A7DFF 100%)',
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaContent: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonText: {
    color: '#1F2F5F',
    fontSize: 16,
    fontWeight: '600',
  },
  sceneCounter: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sceneCounterText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
});