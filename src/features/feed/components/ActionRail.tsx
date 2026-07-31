import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Opportunity } from '../../../services/feed.service';

interface ActionRailProps {
  opportunity: Opportunity;
  onShopPress: (shopId: string) => void;
  onReviewsPress: (productId: string) => void;
  onDirectionsPress: (shopName: string, area: string) => void;
  onSharePress: (opportunity: Opportunity) => void;
  onAIPress: (opportunity: Opportunity) => void;
  cardHeight: number;
}

export const ActionRail: React.FC<ActionRailProps> = ({
  opportunity,
  onShopPress,
  onReviewsPress,
  onDirectionsPress,
  onSharePress,
  onAIPress,
  cardHeight,
}) => {
  const handlePress = (action: string, callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    callback();
  };

  // Responsive sizing based on card height
  const buttonSize = cardHeight < 700 ? 40 : 48;
  const iconSize = cardHeight < 700 ? 16 : 20;
  const fontSize = cardHeight < 700 ? 7 : 8;
  const bottomOffset = cardHeight * 0.2;

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      <TouchableOpacity
        style={[styles.actionButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
        onPress={() => handlePress('Shop', () => onShopPress(opportunity.shopId))}
        activeOpacity={0.7}
      >
        <Text style={[styles.actionIcon, { fontSize: iconSize }]}>🏪</Text>
        <Text style={[styles.actionLabel, { fontSize: fontSize }]}>Shop</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
        onPress={() => handlePress('Reviews', () => onReviewsPress(opportunity.id))}
        activeOpacity={0.7}
      >
        <Text style={[styles.actionIcon, { fontSize: iconSize }]}>⭐</Text>
        <Text style={[styles.actionLabel, { fontSize: fontSize }]}>Reviews</Text>
        {opportunity.rating && (
          <View style={[styles.badge, { top: -3, right: -3 }]}>
            <Text style={styles.badgeText}>{opportunity.rating.toFixed(1)}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
        onPress={() => handlePress('Directions', () => onDirectionsPress(opportunity.shopName, opportunity.area || ''))}
        activeOpacity={0.7}
      >
        <Text style={[styles.actionIcon, { fontSize: iconSize }]}>🧭</Text>
        <Text style={[styles.actionLabel, { fontSize: fontSize }]}>Directions</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
        onPress={() => handlePress('Share', () => onSharePress(opportunity))}
        activeOpacity={0.7}
      >
        <Text style={[styles.actionIcon, { fontSize: iconSize }]}>📤</Text>
        <Text style={[styles.actionLabel, { fontSize: fontSize }]}>Share</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.actionButton, 
          styles.aiButton, 
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }
        ]}
        onPress={() => handlePress('AI', () => onAIPress(opportunity))}
        activeOpacity={0.7}
      >
        <View style={styles.aiContainer}>
          <Text style={[styles.aiIcon, { fontSize: iconSize + 2 }]}>🤖</Text>
          <View style={[styles.aiPulse, { width: buttonSize - 8, height: buttonSize - 8, borderRadius: (buttonSize - 8) / 2 }]} />
        </View>
        <Text style={[styles.aiLabel, { fontSize: fontSize }]}>Ask AI</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 10,
    alignItems: 'center',
    zIndex: 999,
  },
  actionButton: {
    backgroundColor: 'rgba(31, 47, 95, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 6,
    position: 'relative',
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
    fontSize: 8,
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