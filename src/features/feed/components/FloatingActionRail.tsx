import React, { memo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Opportunity } from '../../../services/feed.service';
import { useBreakpoint } from '../../../hooks/useBreakpoint';

interface FloatingActionRailProps {
  opportunity: Opportunity;
  onShopPress: (shopId: string) => void;
  onReviewsPress: (productId: string) => void;
  onDirectionsPress: (shopName: string, area: string) => void;
  onSharePress: (opportunity: Opportunity) => void;
  onAIPress: (opportunity: Opportunity) => void;
}

// ============================================================
// 🎨 ICONS
// ============================================================
const ICONS = {
  reviews: 'chatbubble-ellipses',
  directions: 'map',
  share: 'share-social',
};

// ============================================================
// 📏 POSITIONING
// ============================================================
const DESKTOP_POSITION = {
  BUTTON_SIZE: 48,
  SHOP_BUTTON_SIZE: 56,
  GAP: 32,
  AI_GAP: 40,
  ICON_SIZE: 26,
};

const FloatingActionRailComponent: React.FC<FloatingActionRailProps> = ({
  opportunity,
  onShopPress,
  onReviewsPress,
  onDirectionsPress,
  onSharePress,
  onAIPress,
}) => {
  const { isDesktop } = useBreakpoint();

  const handlePress = (action: string, callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    callback();
  };

  const buttonSize = isDesktop ? DESKTOP_POSITION.BUTTON_SIZE : 44;
  const shopButtonSize = isDesktop ? DESKTOP_POSITION.SHOP_BUTTON_SIZE : 48;
  const iconSize = isDesktop ? DESKTOP_POSITION.ICON_SIZE : 30;
  const gap = isDesktop ? DESKTOP_POSITION.GAP : 8;
  const aiGap = isDesktop ? DESKTOP_POSITION.AI_GAP : 15;

  // Get first letter of shop name for the shop button
  const shopLetter = opportunity.shopName?.charAt(0).toUpperCase() || 'S';

  // Try to load logo - try multiple paths
  let logoSrc;
  try {
    // Try src/assets first (most common)
    logoSrc = require('../../../assets/muno.png');
  } catch (e) {
    try {
      // Try root assets
      logoSrc = require('../../../../assets/muno.png');
    } catch (e2) {
      // Fallback: use a text-based logo
      logoSrc = null;
    }
  }

  return (
    <View style={[styles.container, { gap: gap }]}>
      {/* ============================================================
          SHOP BUTTON - Shop Letter in Circle
          ============================================================ */}
      <TouchableOpacity
        style={[
          styles.shopButton,
          { 
            width: shopButtonSize, 
            height: shopButtonSize,
            borderRadius: shopButtonSize / 2,
          }
        ]}
        onPress={() => handlePress('Shop', () => onShopPress(opportunity.shopId))}
        activeOpacity={0.8}
      >
        <View style={styles.shopLetterContainer}>
          <Text style={[styles.shopLetter, { fontSize: shopButtonSize * 0.45 }]}>
            {shopLetter}
          </Text>
        </View>
        <Text style={[styles.actionLabel, { fontSize: isDesktop ? 10 : 7 }]}>
          Shop
        </Text>
      </TouchableOpacity>

      {/* ============================================================
          REVIEWS BUTTON
          ============================================================ */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }
        ]}
        onPress={() => handlePress('Reviews', () => onReviewsPress(opportunity.id))}
        activeOpacity={0.7}
      >
        <Ionicons name={ICONS.reviews as any} size={iconSize} color="#FFFFFF" />
        <Text style={[styles.actionLabel, { fontSize: isDesktop ? 10 : 7 }]}>
          Reviews
        </Text>
        {opportunity.rating && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{opportunity.rating.toFixed(1)}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* ============================================================
          DIRECTIONS BUTTON
          ============================================================ */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }
        ]}
        onPress={() => handlePress('Directions', () => onDirectionsPress(opportunity.shopName, opportunity.area || ''))}
        activeOpacity={0.7}
      >
        <Ionicons name={ICONS.directions as any} size={iconSize} color="#FFFFFF" />
        <Text style={[styles.actionLabel, { fontSize: isDesktop ? 10 : 7 }]}>
          Directions
        </Text>
      </TouchableOpacity>

      {/* ============================================================
          SHARE BUTTON
          ============================================================ */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }
        ]}
        onPress={() => handlePress('Share', () => onSharePress(opportunity))}
        activeOpacity={0.7}
      >
        <Ionicons name={ICONS.share as any} size={iconSize} color="#FFFFFF" />
        <Text style={[styles.actionLabel, { fontSize: isDesktop ? 10 : 7 }]}>
          Share
        </Text>
      </TouchableOpacity>

      {/* ============================================================
          MUNO AI BUTTON - Using logo.png (with fallback)
          ============================================================ */}
      <View style={{ marginTop: aiGap }}>
        <TouchableOpacity
          style={[
            styles.aiButton,
            { 
              width: shopButtonSize, 
              height: shopButtonSize,
              borderRadius: shopButtonSize / 2,
            }
          ]}
          onPress={() => handlePress('AI', () => onAIPress(opportunity))}
          activeOpacity={0.8}
        >
          <View style={styles.aiGlow}>
            {logoSrc ? (
              <Image
                source={logoSrc}
                style={[styles.aiLogo, { width: shopButtonSize * 0.6, height: shopButtonSize * 0.6 }]}
                resizeMode="contain"
              />
            ) : (
              // Fallback: "M" text if logo not found
              <Text style={[styles.aiFallbackText, { fontSize: shopButtonSize * 0.4 }]}>
                M
              </Text>
            )}
          </View>
          {/* Pulse Animation Ring */}
          <View style={[styles.aiPulse, { 
            width: shopButtonSize + 6, 
            height: shopButtonSize + 6, 
            borderRadius: (shopButtonSize + 6) / 2 
          }]} />
          <Text style={[styles.aiLabel, { fontSize: isDesktop ? 10 : 7 }]}>
            Muno AI
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const FloatingActionRail = memo(FloatingActionRailComponent);

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    zIndex: 9999,
  },

  // --- Shop Button ---
  shopButton: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  shopLetterContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },
  shopLetter: {
    color: '#4A7DFF',
    fontWeight: '700',
    textShadowColor: 'rgba(74, 125, 255, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // --- Regular Action Buttons ---
  actionButton: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    elevation: 2,
  },
  actionLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // --- Badge ---
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
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

  // --- Muno AI Button ---
  aiButton: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2.5,
    borderColor: '#4A7DFF',
    shadowColor: '#4A7DFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  aiGlow: {
    backgroundColor: 'rgba(74, 125, 255, 0.06)',
    borderRadius: 999,
    padding: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiLogo: {
    borderRadius: 8,
  },
  aiFallbackText: {
    color: '#4A7DFF',
    fontWeight: 'bold',
  },
  aiPulse: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#4A7DFF',
    opacity: 0.12,
  },
  aiLabel: {
    color: '#4A7DFF',
    fontWeight: '600',
    marginTop: 3,
    textShadowColor: 'rgba(74, 125, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});