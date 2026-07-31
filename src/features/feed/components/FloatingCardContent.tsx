import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, useWindowDimensions } from 'react-native';
import { Opportunity } from '../../../services/feed.service';

interface FloatingCardContentProps {
  opportunity: Opportunity;
  onShowMorePress: () => void;
  sceneType: string;
  sceneContent: any;
}

export const FloatingCardContent: React.FC<FloatingCardContentProps> = ({
  opportunity,
  onShowMorePress,
  sceneType,
  sceneContent,
}) => {
  const { width, height } = useWindowDimensions();
  
  // Responsive sizing based on screen dimensions
  const isSmallDevice = width < 380 || height < 700;
  const isMediumDevice = width < 420 || height < 800;
  
  const titleSize = isSmallDevice ? 16 : isMediumDevice ? 18 : 20;
  const subtitleSize = isSmallDevice ? 12 : isMediumDevice ? 13 : 14;
  const priceSize = isSmallDevice ? 14 : isMediumDevice ? 16 : 18;
  const sectionTitleSize = isSmallDevice ? 18 : isMediumDevice ? 20 : 22;
  const specLabelSize = isSmallDevice ? 12 : isMediumDevice ? 14 : 16;
  const specValueSize = isSmallDevice ? 12 : isMediumDevice ? 14 : 16;
  const benefitSize = isSmallDevice ? 14 : isMediumDevice ? 16 : 18;
  const aiTextSize = isSmallDevice ? 13 : isMediumDevice ? 15 : 17;
  const overlayBottom = height < 700 ? 50 : height < 800 ? 60 : 80;
  const overlayPadding = isSmallDevice ? 10 : isMediumDevice ? 12 : 14;
  const overlayLeftRight = isSmallDevice ? 12 : isMediumDevice ? 14 : 16;
  const scenePadding = isSmallDevice ? 16 : isMediumDevice ? 20 : 24;
  const specPadding = isSmallDevice ? 12 : isMediumDevice ? 20 : 24;

  // Render different scene types
  const renderSceneContent = () => {
    switch (sceneType) {
      case 'cover':
        return (
          <View style={styles.sceneContainer}>
            {opportunity.imageUrl && (
              <Image 
                source={{ uri: opportunity.imageUrl }} 
                style={styles.coverImage}
                resizeMode="cover"
              />
            )}
            <View style={[styles.overlay, { 
              bottom: overlayBottom, 
              padding: overlayPadding,
              left: overlayLeftRight,
              right: overlayLeftRight + 60
            }]}>
              <Text style={[styles.coverTitle, { fontSize: titleSize }]} numberOfLines={2}>
                {opportunity.title}
              </Text>
              <Text style={[styles.coverSubtitle, { fontSize: subtitleSize }]}>
                {opportunity.shopName}
              </Text>
              <Text style={[styles.coverPrice, { fontSize: priceSize }]}>
                UGX {opportunity.price?.toLocaleString()}
              </Text>
              {opportunity.area && (
                <Text style={[styles.coverDistance, { fontSize: subtitleSize - 1 }]}>
                  📍 {opportunity.area}
                </Text>
              )}
              <TouchableOpacity style={styles.showMoreButton} onPress={onShowMorePress}>
                <Text style={[styles.showMoreText, { fontSize: subtitleSize }]}>
                  Show More...
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'specs':
        return (
          <View style={[styles.sceneContainer, styles.specScene, { paddingHorizontal: specPadding }]}>
            <Text style={[styles.sectionTitle, { fontSize: sectionTitleSize }]}>
              Specifications
            </Text>
            {sceneContent && sceneContent.map((spec: any, i: number) => (
              <View key={i} style={[styles.specRow, { paddingVertical: isSmallDevice ? 5 : 7 }]}>
                <Text style={[styles.specLabel, { fontSize: specLabelSize }]}>
                  ✓ {spec.label}
                </Text>
                <Text style={[styles.specValue, { fontSize: specValueSize }]}>
                  {spec.value}
                </Text>
              </View>
            ))}
          </View>
        );

      case 'seller':
        return (
          <View style={[styles.sceneContainer, styles.sellerScene, { paddingHorizontal: specPadding }]}>
            <Text style={[styles.sectionTitle, { fontSize: sectionTitleSize }]}>
              Seller
            </Text>
            <Text style={[styles.sellerName, { fontSize: isSmallDevice ? 18 : isMediumDevice ? 20 : 22 }]}>
              {opportunity.shopName}
            </Text>
            {opportunity.rating && (
              <Text style={[styles.sellerRating, { fontSize: isSmallDevice ? 14 : isMediumDevice ? 15 : 16 }]}>
                ⭐ {opportunity.rating.toFixed(1)} ★
              </Text>
            )}
            {opportunity.area && (
              <Text style={[styles.sellerArea, { fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14 }]}>
                📍 {opportunity.area}
              </Text>
            )}
            {sceneContent?.trust && sceneContent.trust.map((signal: string, i: number) => (
              <Text key={i} style={[styles.trustSignal, { fontSize: isSmallDevice ? 12 : isMediumDevice ? 13 : 14 }]}>
                {signal}
              </Text>
            ))}
          </View>
        );

      case 'benefits':
        return (
          <View style={[styles.sceneContainer, styles.benefitsScene, { paddingHorizontal: specPadding }]}>
            <Text style={[styles.sectionTitle, { fontSize: sectionTitleSize }]}>
              Why Buy Here
            </Text>
            {sceneContent && sceneContent.map((benefit: string, i: number) => (
              <Text key={i} style={[styles.benefitItem, { fontSize: benefitSize, marginVertical: isSmallDevice ? 3 : 5 }]}>
                {benefit}
              </Text>
            ))}
          </View>
        );

      case 'ai_summary':
        return (
          <View style={[styles.sceneContainer, styles.aiScene, { paddingHorizontal: specPadding }]}>
            <Text style={[styles.aiTitle, { fontSize: isSmallDevice ? 18 : isMediumDevice ? 20 : 22 }]}>
              🤖 AI Analysis
            </Text>
            <Text style={[styles.aiText, { fontSize: aiTextSize, lineHeight: isSmallDevice ? 18 : isMediumDevice ? 20 : 22 }]}>
              {sceneContent}
            </Text>
          </View>
        );

      default:
        return (
          <View style={[styles.sceneContainer, styles.customScene, { paddingHorizontal: specPadding }]}>
            {sceneContent?.title && 
              <Text style={[styles.sectionTitle, { fontSize: sectionTitleSize }]}>
                {sceneContent.title}
              </Text>
            }
            <Text style={[styles.customContent, { fontSize: isSmallDevice ? 13 : isMediumDevice ? 15 : 17 }]}>
              {sceneContent?.content || ''}
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { width, height }]}>
      {renderSceneContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  sceneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    backgroundColor: 'rgba(31, 47, 95, 0.88)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  coverTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  coverSubtitle: {
    color: '#4A7DFF',
    marginTop: 2,
  },
  coverPrice: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 4,
  },
  coverDistance: {
    color: '#8A8AAE',
    marginTop: 2,
  },
  showMoreButton: {
    marginTop: 6,
    paddingVertical: 4,
  },
  showMoreText: {
    color: '#4A7DFF',
    fontWeight: '500',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 14,
    textAlign: 'center',
  },
  specScene: {
    backgroundColor: '#1A2A4F',
    justifyContent: 'center',
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    width: '100%',
  },
  specLabel: {
    color: '#8A8AAE',
    flex: 1,
  },
  specValue: {
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  sellerScene: {
    backgroundColor: '#1F2F5F',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  sellerName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sellerRating: {
    color: '#F1C40F',
    marginTop: 6,
  },
  sellerArea: {
    color: '#8A8AAE',
    marginTop: 6,
  },
  trustSignal: {
    color: '#4A7DFF',
    marginTop: 6,
  },
  benefitsScene: {
    backgroundColor: '#1A2A4F',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  benefitItem: {
    color: '#FFFFFF',
  },
  aiScene: {
    backgroundColor: '#0F1A33',
    justifyContent: 'center',
  },
  aiTitle: {
    color: '#4A7DFF',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  aiText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  customScene: {
    backgroundColor: '#1A2A4F',
    justifyContent: 'center',
  },
  customContent: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
});