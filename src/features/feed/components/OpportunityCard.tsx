import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Opportunity } from '../../../services/feed.service';
import { ActionRail } from './ActionRail';

const { width, height } = Dimensions.get('window');

interface OpportunityCardProps {
  opportunity: Opportunity;
  onShopPress: (shopId: string) => void;
  onReviewsPress: (productId: string) => void;
  onDirectionsPress: (shopName: string, area: string) => void;
  onSharePress: (opportunity: Opportunity) => void;
  onAIPress: (opportunity: Opportunity) => void;
  cardHeight?: number; // Make optional with default
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  onShopPress,
  onReviewsPress,
  onDirectionsPress,
  onSharePress,
  onAIPress,
  cardHeight = height, // Default to screen height
}) => {
  const [imageLoading, setImageLoading] = useState(true);

  const formatPrice = (price: number) => {
    return `UGX ${price.toLocaleString()}`;
  };

  return (
    <View style={[styles.card, { width, height: cardHeight }]}>
      {/* Image */}
      <View style={styles.imageContainer}>
        {imageLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4A7DFF" />
          </View>
        )}
        <Image
          source={{ uri: opportunity.imageUrl }}
          style={styles.image}
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          resizeMode="cover"
        />
      </View>

      {/* Info Panel - Bottom */}
      <View style={[styles.infoPanel, { bottom: cardHeight < 700 ? 60 : 80 }]}>
        <Text style={styles.title} numberOfLines={1}>
          {opportunity.title}
        </Text>
        <View style={styles.shopRow}>
          <Text style={styles.shopName}>{opportunity.shopName}</Text>
          {opportunity.rating !== null && (
            <Text style={styles.rating}>⭐ {opportunity.rating.toFixed(1)}</Text>
          )}
        </View>
        <Text style={styles.price}>{formatPrice(opportunity.price)}</Text>
        {opportunity.area && (
          <Text style={styles.distance}>📍 {opportunity.area}</Text>
        )}
        <TouchableOpacity style={styles.showMoreButton}>
          <Text style={styles.showMoreText}>Show More...</Text>
        </TouchableOpacity>
      </View>

      {/* Action Rail */}
      <ActionRail
        opportunity={opportunity}
        onShopPress={onShopPress}
        onReviewsPress={onReviewsPress}
        onDirectionsPress={onDirectionsPress}
        onSharePress={onSharePress}
        onAIPress={onAIPress}
        cardHeight={cardHeight}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: '#1F2F5F',
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
    left: 16,
    right: 80,
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
  shopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  shopName: {
    color: '#4A7DFF',
    fontSize: 13,
  },
  rating: {
    color: '#F1C40F',
    fontSize: 13,
  },
  price: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  distance: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 2,
  },
  showMoreButton: {
    marginTop: 6,
    paddingVertical: 4,
  },
  showMoreText: {
    color: '#4A7DFF',
    fontSize: 13,
    fontWeight: '500',
  },
});