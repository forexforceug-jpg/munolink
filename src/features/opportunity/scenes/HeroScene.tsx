// HeroScene.tsx

import React from 'react';
import { 
  View, 
  Image, 
  StyleSheet, 
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Scene } from '../types/Scene';

interface Props {
  scene: Scene;
  width?: number;
  height?: number;
}

export function HeroScene({ scene, width, height }: Props) {
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
          style={styles.image} 
          resizeMode="contain" 
        />
      )}

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#000000',
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
});