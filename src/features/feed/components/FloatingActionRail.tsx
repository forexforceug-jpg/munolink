import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Opportunity } from '../../../services/feed.service';

interface FloatingActionRailProps {
  opportunity: Opportunity;
  onShopPress: (shopId: string) => void;
  onReviewsPress: (productId: string) => void;
  onDirectionsPress: (shopName: string, area: string) => void;
  onSharePress: (opportunity: Opportunity) => void;
  onAIPress: (opportunity: Opportunity) => void;
}

export const FloatingActionRail: React.FC<FloatingActionRailProps> = ({
  opportunity,
  onShopPress,
  onReviewsPress,
  onDirectionsPress,
  onSharePress,
  onAIPress,
}) => {
  const { width, height } = useWindowDimensions();
  
  const handlePress = (action: string, callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    callback();
  };

  // Responsive sizing based on screen dimensions
  const isSmallDevice = width < 380 || height < 700;
  const isMediumDevice = width < 420 || height < 800;
  
  const buttonSize = isSmallDevice ? 40 : isMediumDevice ? 46 : 52;
  const iconSize = isSmallDevice ? 16 : isMediumDevice ? 19 : 22;
  const labelSize = isSmallDevice ? 7 : isMediumDevice ? 7 : 8;
  const bottomOffset = height * 0.2;
  const buttonMargin = isSmallDevice ? 4 : 6;

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      {/* Shop Button */}
      <TouchableOpacity
        style={[styles.actionButton, { 
          width: buttonSize, 
          height: buttonSize, 
          borderRadius: buttonSize / 2,
          marginBottom: buttonMargin
        }]}
        onPress={() => handlePress('Shop', () => onShopPress(opportunity.shopId))}
        activeOpacity={0.7}
      >
        <Text style={[styles.actionIcon, { fontSize: iconSize }]}>🏪</Text>
        <Text style={[styles.actionLabel, { fontSize: labelSize }]}>Shop</Text>
      </TouchableOpacity>

      {/* Reviews Button */}
      <TouchableOpacity
        style={[styles.actionButton, { 
          width: buttonSize, 
          height: buttonSize, 
          borderRadius: buttonSize / 2,
          marginBottom: buttonMargin
        }]}
        onPress={() => handlePress('Reviews', () => onReviewsPress(opportunity.id))}
        activeOpacity={0.7}
      >
        <Text style={[styles.actionIcon, { fontSize: iconSize }]}>⭐</Text>
        <Text style={[styles.actionLabel, { fontSize: labelSize }]}>Reviews</Text>
        {opportunity.rating && (
          <View style={[styles.badge, { top: -3, right: -3 }]}>
            <Text style={[styles.badgeText, { fontSize: isSmallDevice ? 7 : 8 }]}>
              {opportunity.rating.toFixed(1)}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Directions Button */}
      <TouchableOpacity
        style={[styles.actionButton, { 
          width: buttonSize, 
          height: buttonSize, 
          borderRadius: buttonSize / 2,
          marginBottom: buttonMargin
        }]}
        onPress={() => handlePress('Directions', () => onDirectionsPress(opportunity.shopName, opportunity.area || ''))}
        activeOpacity={0.7}
      >
        <Text style={[styles.actionIcon, { fontSize: iconSize }]}>🧭</Text>
        <Text style={[styles.actionLabel, { fontSize: labelSize }]}>Directions</Text>
      </TouchableOpacity>

      {/* Share Button */}
      <TouchableOpacity
        style={[styles.actionButton, { 
          width: buttonSize, 
          height: buttonSize, 
          borderRadius: buttonSize / 2,
          marginBottom: buttonMargin
        }]}
        onPress={() => handlePress('Share', () => onSharePress(opportunity))}
        activeOpacity={0.7}
      >
        <Text style={[styles.actionIcon, { fontSize: iconSize }]}>📤</Text>
        <Text style={[styles.actionLabel, { fontSize: labelSize }]}>Share</Text>
      </TouchableOpacity>

      {/* AI Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          styles.aiButton,
          { 
            width: buttonSize, 
            height: buttonSize, 
            borderRadius: buttonSize / 2,
            marginBottom: buttonMargin
          }
        ]}
        onPress={() => handlePress('AI', () => onAIPress(opportunity))}
        activeOpacity={0.7}
      >
        <View style={styles.aiContainer}>
          <Text style={[styles.aiIcon, { fontSize: iconSize + 2 }]}>🤖</Text>
          <View style={[styles.aiPulse, { 
            width: buttonSize - 8, 
            height: buttonSize - 8, 
            borderRadius: (buttonSize - 8) / 2 
          }]} />
        </View>
        <Text style={[styles.aiLabel, { fontSize: labelSize }]}>Ask AI</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 12,
    alignItems: 'center',
    zIndex: 999,
  },
  actionButton: {
    backgroundColor: 'rgba(31, 47, 95, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  actionIcon: {
    // fontSize set dynamically
  },
  actionLabel: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
  },
  badge: {
    position: 'absolute',
    backgroundColor: '#F1C40F',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  badgeText: {
    color: '#1F2F5F',
    fontWeight: 'bold',
  },
  aiButton: {
    backgroundColor: 'rgba(74, 125, 255, 0.25)',
    borderColor: '#4A7DFF',
    borderWidth: 2,
  },
  aiContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiIcon: {
    // fontSize set dynamically
  },
  aiPulse: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#4A7DFF',
    opacity: 0.3,
  },
  aiLabel: {
    color: '#4A7DFF',
    fontWeight: '600',
    marginTop: 1,
  },
});