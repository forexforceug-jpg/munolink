import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Scene } from '../engine/StoryEngine';
import { Opportunity } from '../../../services/feed.service';

const { width } = Dimensions.get('window');

interface StoryCardProps {
  scene: Scene;
  index: number;
  total: number;
  opportunity: Opportunity;
  onShowMorePress: () => void;
  cardHeight: number;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  scene,
  index,
  total,
  opportunity,
  onShowMorePress,
  cardHeight,
}) => {
  return (
    <View style={[styles.card, { width, height: cardHeight }]}>
      {/* Progress dots */}
      <View style={styles.progressContainer}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i === index ? styles.progressDotActive : styles.progressDotInactive,
            ]}
          />
        ))}
      </View>

      {/* Content based on scene type */}
      {scene.type === 'cover' && (
        <CoverScene content={scene.content} onShowMorePress={onShowMorePress} cardHeight={cardHeight} />
      )}
      {scene.type === 'specs' && (
        <SpecScene content={scene.content} />
      )}
      {scene.type === 'seller' && (
        <SellerScene content={scene.content} />
      )}
      {scene.type === 'benefits' && (
        <BenefitsScene content={scene.content} />
      )}
      {scene.type === 'ai_summary' && (
        <AISummaryScene content={scene.content} />
      )}
      {scene.type === 'custom' && (
        <CustomScene content={scene.content} title={scene.title} />
      )}
    </View>
  );
};

// Cover Scene
const CoverScene = ({ content, onShowMorePress, cardHeight }: any) => {
  const overlayBottom = cardHeight < 700 ? 60 : 80;
  
  return (
    <View style={styles.scene}>
      {content.image && (
        <Image 
          source={{ uri: content.image }} 
          style={styles.coverImage}
          resizeMode="cover"
        />
      )}
      <View style={[styles.overlay, { bottom: overlayBottom }]}>
        <Text style={styles.coverTitle} numberOfLines={2}>{content.title}</Text>
        <Text style={styles.coverSubtitle}>{content.shop}</Text>
        <Text style={styles.coverPrice}>UGX {content.price?.toLocaleString()}</Text>
        {content.distance && (
          <Text style={styles.coverDistance}>📍 {content.distance}</Text>
        )}
        <TouchableOpacity style={styles.showMoreButton} onPress={onShowMorePress}>
          <Text style={styles.showMoreText}>Show More...</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Spec Scene
const SpecScene = ({ content }: any) => (
  <View style={[styles.scene, styles.specScene]}>
    <Text style={styles.sectionTitle}>Specifications</Text>
    {content.map((spec: any, i: number) => (
      <View key={i} style={styles.specRow}>
        <Text style={styles.specLabel}>✓ {spec.label}</Text>
        <Text style={styles.specValue}>{spec.value}</Text>
      </View>
    ))}
  </View>
);

// Seller Scene
const SellerScene = ({ content }: any) => (
  <View style={[styles.scene, styles.sellerScene]}>
    <Text style={styles.sectionTitle}>Seller</Text>
    <Text style={styles.sellerName}>{content.name}</Text>
    {content.rating && (
      <Text style={styles.sellerRating}>⭐ {content.rating.toFixed(1)} ★</Text>
    )}
    {content.area && (
      <Text style={styles.sellerArea}>📍 {content.area}</Text>
    )}
    {content.trust && content.trust.map((signal: string, i: number) => (
      <Text key={i} style={styles.trustSignal}>{signal}</Text>
    ))}
  </View>
);

// Benefits Scene
const BenefitsScene = ({ content }: any) => (
  <View style={[styles.scene, styles.benefitsScene]}>
    <Text style={styles.sectionTitle}>Why Buy Here</Text>
    {content.map((benefit: string, i: number) => (
      <Text key={i} style={styles.benefitItem}>{benefit}</Text>
    ))}
  </View>
);

// AI Summary Scene
const AISummaryScene = ({ content }: any) => (
  <View style={[styles.scene, styles.aiScene]}>
    <Text style={styles.aiTitle}>🤖 AI Analysis</Text>
    <Text style={styles.aiText}>{content}</Text>
  </View>
);

// Custom Scene
const CustomScene = ({ content, title }: any) => (
  <View style={[styles.scene, styles.customScene]}>
    {title && <Text style={styles.sectionTitle}>{title}</Text>}
    <Text style={styles.customContent}>{content}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F2F5F',
    position: 'relative',
  },
  progressContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    gap: 6,
  },
  progressDot: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: '#4A7DFF',
  },
  progressDotInactive: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  scene: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    left: 16,
    right: 80,
    backgroundColor: 'rgba(31, 47, 95, 0.88)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  coverTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  coverSubtitle: {
    color: '#4A7DFF',
    fontSize: 13,
    marginTop: 2,
  },
  coverPrice: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  coverDistance: {
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
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  specScene: {
    backgroundColor: '#1A2A4F',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    width: '100%',
  },
  specLabel: {
    color: '#8A8AAE',
    fontSize: 14,
    flex: 1,
  },
  specValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  sellerScene: {
    backgroundColor: '#1F2F5F',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 32,
  },
  sellerName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  sellerRating: {
    color: '#F1C40F',
    fontSize: 16,
    marginTop: 6,
  },
  sellerArea: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 6,
  },
  trustSignal: {
    color: '#4A7DFF',
    fontSize: 14,
    marginTop: 6,
  },
  benefitsScene: {
    backgroundColor: '#1A2A4F',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 32,
  },
  benefitItem: {
    color: '#FFFFFF',
    fontSize: 16,
    marginVertical: 5,
  },
  aiScene: {
    backgroundColor: '#0F1A33',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  aiTitle: {
    color: '#4A7DFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  aiText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  customScene: {
    backgroundColor: '#1A2A4F',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  customContent: {
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'center',
  },
});