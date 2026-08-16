// GalleryScene.tsx

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Scene } from '../types/Scene';

interface Props {
  scene: Scene;
  width?: number;
  height?: number;
  onAddToCart?: (scene: Scene) => void;
}

export function GalleryScene({ scene, width, height, onAddToCart }: Props) {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  
  const containerWidth = width || screenWidth;
  const containerHeight = height || screenHeight;

  const handleAddToCart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onAddToCart) {
      onAddToCart(scene);
    }
  };

  return (
    <View style={[styles.container, { width: containerWidth, height: containerHeight }]}>
      {/* Background Image */}
      {scene.image && (
        <Image 
          source={{ uri: scene.image }} 
          style={styles.backgroundImage} 
          resizeMode="contain"
        />
      )}

      {/* Gradient Overlay for better button visibility */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
        style={styles.gradientOverlay}
      />

      {/* Compact Add to Cart Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#4A7DFF', '#6C5CE7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <View style={styles.buttonContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.buttonText}>Add to Cart</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
   container: {
    position: 'relative',
    backgroundColor: '#000000',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  addToCartButton: {
    width: 'auto',
    maxWidth: 200, // ⬇️ Reduced to fit content
    borderRadius: 10, // ⬇️ Smaller radius
    overflow: 'hidden',
    shadowColor: '#4A7DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientButton: {
    paddingVertical: 10, // ⬇️ Reduced
    paddingHorizontal: 20, // ⬇️ Reduced
    borderRadius: 10,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14, // ⬇️ Smaller font
    fontWeight: '600',
    letterSpacing: 0.3,
  },
   iconContainer: {
    width: 10,
    height: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});