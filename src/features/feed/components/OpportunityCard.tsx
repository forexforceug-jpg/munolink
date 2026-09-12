// src/features/feed/components/OpportunityCard.tsx
// This file is deprecated - use SceneRenderer directly in FeedScreen
// If you need it, here's a simplified version

import React, { memo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Opportunity } from '../../../services/feed.service';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onUserPress: (userId: string) => void;
  onSharePress: (opportunity: Opportunity) => void;
  onSavePress: (opportunity: Opportunity) => void;
  cardWidth?: number;
  cardHeight?: number;
  isDesktop?: boolean;
}

const OpportunityCardComponent: React.FC<OpportunityCardProps> = ({
  opportunity,
  onUserPress,
  onSharePress,
  onSavePress,
  cardWidth = 400,
  cardHeight = 600,
  isDesktop = false,
}) => {
  const [imageLoading, setImageLoading] = React.useState(true);

  const imageUrl = opportunity.catalogImages?.[0] || opportunity.imageUrl || '';

  return (
    <View style={[styles.card, { width: cardWidth, height: cardHeight }]}>
      <View style={styles.imageContainer}>
        {imageLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4A7DFF" />
          </View>
        )}
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          resizeMode="cover"
        />
      </View>

      <View style={styles.infoPanel}>
        <Text style={styles.title} numberOfLines={1}>
          {opportunity.title}
        </Text>
        <Text style={styles.userName}>@{opportunity.userFullName || 'User'}</Text>
        {opportunity.price && opportunity.price > 0 && (
          <Text style={styles.price}>UGX {opportunity.price.toLocaleString()}</Text>
        )}
      </View>
    </View>
  );
};

export const OpportunityCard = memo(OpportunityCardComponent);

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: '#1F2F5F',
    overflow: 'hidden',
    borderRadius: 0,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1F2F5F',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(31, 47, 95, 0.88)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    color: '#4A7DFF',
    fontSize: 13,
    marginTop: 2,
  },
  price: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
});