// GalleryScene.tsx

import React from 'react';
import { 
  View, 
  StyleSheet, 
  Image, 
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Scene } from '../types/Scene';

interface Props {
  scene: Scene;
  width?: number;
  height?: number;
}

export function GalleryScene({ scene, width, height }: Props) {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  
  const containerWidth = width || screenWidth;
  const containerHeight = height || screenHeight;

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
});