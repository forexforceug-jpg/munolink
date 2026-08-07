import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Scene } from '../types/Scene';

interface Props {
  scene: Scene;
  width?: number;
  height?: number;
}

export function TrustScene({ scene, width, height }: Props) {
  const data = scene.data || {};
  const signals = data.signals || [];

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Background Image */}
      {scene.image && (
        <Image source={{ uri: scene.image }} style={styles.backgroundImage} resizeMode="cover" />
      )}
      <View style={styles.overlay}>
        <Text style={styles.title}>{scene.title}</Text>
        <Text style={styles.content}>{scene.content}</Text>
        
        {data.topReview && (
          <View style={styles.reviewBox}>
            <View style={styles.reviewHeader}>
              <Ionicons name="star" size={16} color="#F1C40F" />
              <Text style={styles.reviewRating}>{data.rating?.toFixed(1) || '4.5'}</Text>
              <Text style={styles.reviewCount}>({data.reviewCount || 0} reviews)</Text>
            </View>
            <Text style={styles.reviewText}>"{data.topReview}"</Text>
          </View>
        )}

        {signals.length > 0 && (
          <View style={styles.signalsContainer}>
            {signals.map((signal: string, index: number) => (
              <View key={index} style={styles.signalItem}>
                <Text style={styles.signalText}>{signal}</Text>
              </View>
            ))}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  reviewBox: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4A7DFF',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  reviewRating: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewCount: {
    color: '#8A8AAE',
    fontSize: 13,
  },
  reviewText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontStyle: 'italic',
  },
  signalsContainer: {
    gap: 8,
  },
  signalItem: {
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(74, 125, 255, 0.2)',
  },
  signalText: {
    color: '#4A7DFF',
    fontSize: 13,
  },
});