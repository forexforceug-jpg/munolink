import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { Scene } from '../types/Scene';

interface Props {
  scene: Scene;
  width?: number;
  height?: number;
}

export function GalleryScene({ scene, width, height }: Props) {
  const data = scene.data || {};
  const images = data.images || [];
  const hasImages = images.length > 0;

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Background Image */}
      {scene.image && (
        <Image source={{ uri: scene.image }} style={styles.backgroundImage} resizeMode="cover" />
      )}
      <View style={styles.overlay}>
        <Text style={styles.title}>{scene.title}</Text>
        <Text style={styles.content}>{scene.content}</Text>
        
        {hasImages && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.galleryScroll}
            contentContainerStyle={styles.galleryContent}
          >
            {images.map((image: string, index: number) => (
              <View key={index} style={styles.galleryItem}>
                <Image source={{ uri: image }} style={styles.galleryImage} resizeMode="cover" />
              </View>
            ))}
          </ScrollView>
        )}
        
        {!hasImages && (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No additional images available</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: 'transparent',
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  content: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 16,
  },
  galleryScroll: {
    flexGrow: 0,
  },
  galleryContent: {
    gap: 12,
  },
  galleryItem: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
  placeholderText: {
    color: '#8A8AAE',
    fontSize: 14,
  },
});