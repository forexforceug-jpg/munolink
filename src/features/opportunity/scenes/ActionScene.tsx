import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Scene } from '../types/Scene';

interface Props {
  scene: Scene;
  onPrimaryAction?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  width?: number;
  height?: number;
}

export function ActionScene({ 
  scene, 
  onPrimaryAction, 
  onShare, 
  onSave, 
  width, 
  height 
}: Props) {
  const data = scene.data || {};
  const { primaryAction, secondaryActions, price, currency, shopName, area } = data;

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onShare) {
      onShare();
    } else {
      try {
        await Share.share({
          message: `Check out ${scene.title} at ${shopName || 'Munolink'}`,
          title: scene.title,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const getPrimaryLabel = () => {
    switch (primaryAction) {
      case 'buy': return 'Buy Now';
      case 'book': return 'Book Now';
      case 'contact': return 'Contact Seller';
      case 'view': return 'View Details';
      default: return 'View at Shop';
    }
  };

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Background Image */}
      {scene.image && (
        <Image source={{ uri: scene.image }} style={styles.backgroundImage} resizeMode="cover" />
      )}
      <View style={styles.overlay}>
        <Text style={styles.title}>{scene.title}</Text>
        <Text style={styles.content}>{scene.content}</Text>
        
        {price !== undefined && (
          <Text style={styles.price}>
            {currency || 'UGX'} {price.toLocaleString()}
          </Text>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={onPrimaryAction}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>{getPrimaryLabel()}</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            {secondaryActions?.includes('share') && (
              <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={22} color="#4A7DFF" />
                <Text style={styles.secondaryLabel}>Share</Text>
              </TouchableOpacity>
            )}
            {secondaryActions?.includes('save') && (
              <TouchableOpacity style={styles.secondaryButton} onPress={onSave}>
                <Ionicons name="bookmark-outline" size={22} color="#4A7DFF" />
                <Text style={styles.secondaryLabel}>Save</Text>
              </TouchableOpacity>
            )}
            {secondaryActions?.includes('compare') && (
              <TouchableOpacity style={styles.secondaryButton}>
                <Ionicons name="git-compare-outline" size={22} color="#4A7DFF" />
                <Text style={styles.secondaryLabel}>Compare</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
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
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  content: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  price: {
    color: '#4A7DFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  actionsContainer: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#4A7DFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 16,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  secondaryLabel: {
    color: '#4A7DFF',
    fontSize: 11,
    fontWeight: '500',
  },
});