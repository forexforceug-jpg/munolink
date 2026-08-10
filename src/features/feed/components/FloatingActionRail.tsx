import React, { memo, useRef, useEffect, useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Image,
  Animated,
  Easing,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Opportunity } from '../../../services/feed.service';
import { useBreakpoint } from '../../../hooks/useBreakpoint';

// Logo import with fallback
let munoLogo;
try {
  munoLogo = require('../../../assets/muno.png');
} catch {
  try {
    munoLogo = require('../../../../assets/muno.png');
  } catch {
    try {
      munoLogo = require('../../../public/muno.png');
    } catch {
      console.warn('⚠️ muno.png not found - using text fallback');
      munoLogo = null;
    }
  }
}

interface FloatingActionRailProps {
  opportunity: Opportunity;
  onShopPress: (shopId: string) => void;
  onReviewsPress: (productId: string) => void;
  onDirectionsPress: (shopName: string, area: string) => void;
  onSharePress: (opportunity: Opportunity) => void;
  onAIPress: (opportunity: Opportunity) => void;
  onSavePress?: (opportunity: Opportunity) => void;  // NEW: Save/Wishlist
  // Optional data overrides for demo/display
  reviewCount?: number;
  distance?: number; // in km
  shareCount?: number;
  savedCount?: number;
  isSaved?: boolean;
}

const ICONS = {
  reviews: 'chatbubble-ellipses',
  directions: 'map',
  share: 'share-social',
  save: 'bookmark',        // NEW
  saveOutline: 'bookmark',  // NEW
};

const DESKTOP_POSITION = {
  BUTTON_SIZE: 48,
  SHOP_BUTTON_SIZE: 56,
  GAP: 32,
  AI_GAP: -2,
  ICON_SIZE: 22,  // Slightly smaller to make room for values
  VALUE_FONT_SIZE: 9,
};

const MOBILE_POSITION = {
  BUTTON_SIZE: 44,
  SHOP_BUTTON_SIZE: 48,
  GAP: 8,
  AI_GAP: 15,
  ICON_SIZE: 20,
  VALUE_FONT_SIZE: 7,
};

const FloatingActionRailComponent: React.FC<FloatingActionRailProps> = ({
  opportunity,
  onShopPress,
  onReviewsPress,
  onDirectionsPress,
  onSharePress,
  onAIPress,
  onSavePress,
  reviewCount = 0,
  distance = 0,
  shareCount = 0,
  savedCount = 0,
  isSaved = false,
}) => {
  const { isDesktop } = useBreakpoint();
  const [saved, setSaved] = useState(isSaved);
  const [localSavedCount, setLocalSavedCount] = useState(savedCount);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handlePress = (action: string, callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    callback();
  };

  // Handle Save/Wishlist toggle
  const handleSavePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newSavedState = !saved;
    setSaved(newSavedState);
    setLocalSavedCount(prev => newSavedState ? prev + 1 : Math.max(0, prev - 1));
    
    if (onSavePress) {
      onSavePress(opportunity);
    }
  };

  const buttonSize = isDesktop ? DESKTOP_POSITION.BUTTON_SIZE : 44;
  const shopButtonSize = isDesktop ? DESKTOP_POSITION.SHOP_BUTTON_SIZE : 48;
  const iconSize = isDesktop ? DESKTOP_POSITION.ICON_SIZE : 20;
  const valueFontSize = isDesktop ? DESKTOP_POSITION.VALUE_FONT_SIZE : 7;
  const gap = isDesktop ? DESKTOP_POSITION.GAP : 8;
  const aiGap = isDesktop ? DESKTOP_POSITION.AI_GAP : 15;

  const shopLetter = opportunity.shopName?.charAt(0).toUpperCase() || 'S';
  
  // Hardcoded logo sizes
  const LOGO_SIZE_DESKTOP = 80;
  const LOGO_SIZE_MOBILE = 70;
  const logoSize = isDesktop ? LOGO_SIZE_DESKTOP : LOGO_SIZE_MOBILE;

  // Format distance
  const formattedDistance = distance > 0 ? `${distance.toFixed(1)}km` : '--';

  return (
    <View style={[styles.container, { gap }]}>
      {/* Shop Button */}
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
        <Text style={[styles.valueLabel, { fontSize: valueFontSize }]}>
          Shop
        </Text>
      </TouchableOpacity>

      {/* Reviews Button - Shows Rating */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }
        ]}
        onPress={() => handlePress('Reviews', () => onReviewsPress(opportunity.id))}
        activeOpacity={0.7}
      >
        <Ionicons name={ICONS.reviews as any} size={iconSize} color="#FFFFFF" />
        <Text style={[styles.valueLabel, { fontSize: valueFontSize }]}>
          {opportunity.rating ? opportunity.rating.toFixed(1) : '0.0'}
        </Text>
        {opportunity.rating && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{opportunity.rating.toFixed(1)}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Directions Button - Shows Distance */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }
        ]}
        onPress={() => handlePress('Directions', () => onDirectionsPress(opportunity.shopName, opportunity.area || ''))}
        activeOpacity={0.7}
      >
        <Ionicons name={ICONS.directions as any} size={iconSize} color="#FFFFFF" />
        <Text style={[styles.valueLabel, { fontSize: valueFontSize }]}>
          {formattedDistance}
        </Text>
      </TouchableOpacity>

      {/* Share Button - Shows Share Count */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }
        ]}
        onPress={() => handlePress('Share', () => onSharePress(opportunity))}
        activeOpacity={0.7}
      >
        <Ionicons name={ICONS.share as any} size={iconSize} color="#FFFFFF" />
        <Text style={[styles.valueLabel, { fontSize: valueFontSize }]}>
          {shareCount > 0 ? shareCount : ''}
        </Text>
      </TouchableOpacity>

      {/* NEW: Save/Wishlist Button - Shows Saved Count */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }
        ]}
        onPress={handleSavePress}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={(saved ? ICONS.save : ICONS.saveOutline) as any} 
          size={iconSize} 
          color={saved ? '#FF6B6B' : '#FFFFFF'} 
        />
        <Text style={[styles.valueLabel, { 
          fontSize: valueFontSize,
          color: saved ? '#FF6B6B' : 'rgba(255,255,255,0.6)'
        }]}>
          {localSavedCount > 0 ? localSavedCount : ''}
        </Text>
      </TouchableOpacity>

      {/* AI Button with Muno Logo */}
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
          <View style={[styles.aiGlow, { padding: 4 }]}>
            {munoLogo ? (
              <Image
                source={munoLogo}
                style={{ 
                  width: logoSize,
                  height: logoSize,
                }}
                resizeMode="contain"
              />
            ) : (
              <Text style={[styles.aiFallbackText, { fontSize: shopButtonSize * 0.4 }]}>
                M
              </Text>
            )}
          </View>
          <Animated.View 
            style={[
              styles.aiPulse,
              {
                width: shopButtonSize + 6,
                height: shopButtonSize + 6,
                borderRadius: (shopButtonSize + 6) / 2,
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.15],
                  outputRange: [0.12, 0.3],
                }),
              }
            ]} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const FloatingActionRail = memo(FloatingActionRailComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    zIndex: 9999,
  },

  shopButton: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      default: {
        boxShadow: '0px 2px 6px rgba(0,0,0,0.2)',
      },
    }),
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

  actionButton: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    elevation: 2,
  },

  valueLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

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

  aiButton: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2.5,
    borderColor: '#4A7DFF',
    ...Platform.select({
      ios: {
        shadowColor: '#4A7DFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
      },
      android: {
        elevation: 4,
        shadowColor: '#4A7DFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
      },
      default: {
        boxShadow: '0px 0px 14px rgba(74, 125, 255, 0.3)',
      },
    }),
  },

  aiGlow: {
    backgroundColor: 'rgba(74, 125, 255, 0.06)',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },

  aiPulse: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#4A7DFF',
    opacity: 0.12,
  },

  aiFallbackText: {
    color: '#4A7DFF',
    fontWeight: 'bold',
  },
});