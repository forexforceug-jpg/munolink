// src/features/feed/components/FloatingActionRail.tsx

import React, { memo, useRef, useEffect, useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Opportunity } from '../../../services/feed.service';
import { useBreakpoint } from '../../../hooks/useBreakpoint';

// ✅ Fixed: Handle image import properly for React Native
let munoLogo: any = null;
try {
  // Try different possible paths
  const logoPath = '../../../assets/muno.png';
  munoLogo = require(logoPath);
} catch (e) {
  try {
    munoLogo = require('../../../../assets/muno.png');
  } catch (e2) {
    console.warn('⚠️ muno.png not found - using text fallback');
    munoLogo = null;
  }
}

// ✅ Type-safe icon mapping
type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<string, IconName> = {
  reviews: 'chatbubble-ellipses',
  directions: 'map',
  share: 'share-social',
  save: 'bookmark',
  saveOutline: 'bookmark-outline',
};

interface FloatingActionRailProps {
  opportunity: Opportunity;
  onShopPress: (shopId: string) => void;
  onReviewsPress: (productId: string) => void;
  onDirectionsPress: (shopName: string, area: string) => void;
  onSharePress: (opportunity: Opportunity) => void;
  onAIPress: (opportunity: Opportunity) => void;
  onSavePress?: (opportunity: Opportunity) => void;
  reviewCount?: number;
  distance?: number;
  shareCount?: number;
  savedCount?: number;
  isSaved?: boolean;
}

const DESKTOP_POSITION = {
  BUTTON_SIZE: 56,
  SHOP_BUTTON_SIZE: 54,
  GAP: 24,
  AI_GAP: -14,
  ICON_SIZE: 32,
  VALUE_FONT_SIZE: 12,
  LABEL_FONT_SIZE: 10,
};

const MOBILE_POSITION = {
  BUTTON_SIZE: 58,
  SHOP_BUTTON_SIZE: 52,
  GAP: 7,
  AI_GAP: 45,
  ICON_SIZE: 32,
  VALUE_FONT_SIZE: 11,
  LABEL_FONT_SIZE: 9,
};

// ✅ Logo fallback component
const LogoFallback = ({ size }: { size: number }) => (
  <View style={[styles.fallbackLogo, { width: size, height: size }]}>
    <Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>M</Text>
  </View>
);

// ✅ Logo component with error handling
const LogoImage = ({ size }: { size: number }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !munoLogo) {
    return <LogoFallback size={size} />;
  }

  return (
    <Image
      source={munoLogo}
      style={{ width: size, height: size }}
      resizeMode="contain"
      onError={() => setHasError(true)}
    />
  );
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
  
  // ✅ Track user interaction to prevent race condition
  const hasInteractedRef = useRef(false);
  
  // ✅ Use object state for save to avoid race conditions
  const [saveState, setSaveState] = useState({
    saved: isSaved,
    count: savedCount,
  });

  // ✅ Only sync props if user hasn't interacted
  useEffect(() => {
    if (!hasInteractedRef.current) {
      setSaveState({
        saved: isSaved,
        count: savedCount,
      });
    }
  }, [isSaved, savedCount, opportunity.id]);

  // ✅ Safe haptics with error handling
  const triggerHaptic = async (style: 'light' | 'medium' | 'heavy') => {
    try {
      if (Platform.OS !== 'web') {
        const styleMap = {
          light: Haptics.ImpactFeedbackStyle.Light,
          medium: Haptics.ImpactFeedbackStyle.Medium,
          heavy: Haptics.ImpactFeedbackStyle.Heavy,
        };
        await Haptics.impactAsync(styleMap[style]);
      }
    } catch (error) {
      // Silently fail - haptics are optional
      console.warn('Haptics not supported on this device');
    }
  };

  // ✅ Safe callback handler
  const handlePress = (action: string, callback: () => void) => {
    triggerHaptic('light');
    if (callback && typeof callback === 'function') {
      callback();
    }
  };

  // ✅ Save handler with interaction tracking
  const handleSavePress = () => {
    hasInteractedRef.current = true;
    triggerHaptic('medium');
    
    const newSaved = !saveState.saved;
    setSaveState(prev => ({
      saved: newSaved,
      count: newSaved ? prev.count + 1 : Math.max(0, prev.count - 1),
    }));
    
    if (onSavePress) {
      onSavePress(opportunity);
    }
  };

  // ✅ Defensive check
  if (!opportunity) {
    console.warn('FloatingActionRail: No opportunity provided');
    return null;
  }

  const buttonSize = isDesktop ? DESKTOP_POSITION.BUTTON_SIZE : MOBILE_POSITION.BUTTON_SIZE;
  const shopButtonSize = isDesktop ? DESKTOP_POSITION.SHOP_BUTTON_SIZE : MOBILE_POSITION.SHOP_BUTTON_SIZE;
  const iconSize = isDesktop ? DESKTOP_POSITION.ICON_SIZE : MOBILE_POSITION.ICON_SIZE;
  const valueFontSize = isDesktop ? DESKTOP_POSITION.VALUE_FONT_SIZE : MOBILE_POSITION.VALUE_FONT_SIZE;
  const labelFontSize = isDesktop ? DESKTOP_POSITION.LABEL_FONT_SIZE : MOBILE_POSITION.LABEL_FONT_SIZE;
  const gap = isDesktop ? DESKTOP_POSITION.GAP : MOBILE_POSITION.GAP;
  const aiGap = isDesktop ? DESKTOP_POSITION.AI_GAP : MOBILE_POSITION.AI_GAP;

  const shopLetter = opportunity.shopName?.charAt(0).toUpperCase() || 'S';
  
  const LOGO_SIZE_DESKTOP = 80;
  const LOGO_SIZE_MOBILE = 70;
  const logoSize = isDesktop ? LOGO_SIZE_DESKTOP : LOGO_SIZE_MOBILE;

  const formattedDistance = distance > 0 ? `${distance.toFixed(1)}km` : '0km';
  const rating = opportunity.rating ? opportunity.rating.toFixed(1) : '0.0';
  const displayShareCount = shareCount > 0 ? shareCount : 0;
  const displaySavedCount = saveState.count > 0 ? saveState.count : 0;

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
        accessibilityLabel={`Shop ${opportunity.shopName}`}
        accessibilityRole="button"
        accessibilityHint="Opens shop profile"
      >
        <View style={styles.shopLetterContainer}>
          <Text style={[styles.shopLetter, { fontSize: shopButtonSize * 0.5 }]}>
            {shopLetter}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Reviews Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }
        ]}
        onPress={() => handlePress('Reviews', () => onReviewsPress(opportunity.id))}
        activeOpacity={0.7}
        accessibilityLabel={`Reviews for ${opportunity.title}`}
        accessibilityRole="button"
        accessibilityHint="Opens reviews modal"
      >
        <Ionicons name={ICONS.reviews} size={iconSize} color="#FFFFFF" />
        <Text style={[styles.valueText, { fontSize: valueFontSize }]}>
          {rating}
        </Text>
        {opportunity.rating && opportunity.rating > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{rating}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Directions Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }
        ]}
        onPress={() => handlePress('Directions', () => onDirectionsPress(opportunity.shopName, opportunity.area || ''))}
        activeOpacity={0.7}
        accessibilityLabel={`Directions to ${opportunity.shopName}`}
        accessibilityRole="button"
        accessibilityHint="Opens directions"
      >
        <Ionicons name={ICONS.directions} size={iconSize} color="#FFFFFF" />
        <Text style={[styles.valueText, { fontSize: valueFontSize }]}>
          {formattedDistance}
        </Text>
      </TouchableOpacity>

      {/* Share Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }
        ]}
        onPress={() => handlePress('Share', () => onSharePress(opportunity))}
        activeOpacity={0.7}
        accessibilityLabel={`Share ${opportunity.title}`}
        accessibilityRole="button"
        accessibilityHint="Shares this opportunity"
      >
        <Ionicons name={ICONS.share} size={iconSize} color="#FFFFFF" />
        <Text style={[styles.valueText, { fontSize: valueFontSize }]}>
          {displayShareCount}
        </Text>
      </TouchableOpacity>

      {/* Save/Wishlist Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }
        ]}
        onPress={handleSavePress}
        activeOpacity={0.7}
        accessibilityLabel={saveState.saved ? 'Remove from saved' : 'Save this item'}
        accessibilityRole="button"
        accessibilityHint={saveState.saved ? 'Removes from wishlist' : 'Adds to wishlist'}
      >
        <Ionicons 
          name={(saveState.saved ? ICONS.save : ICONS.saveOutline)} 
          size={iconSize} 
          color={saveState.saved ? '#FF6B6B' : '#FFFFFF'} 
        />
        <Text style={[styles.valueText, { 
          fontSize: valueFontSize,
          color: saveState.saved ? '#FF6B6B' : 'rgba(255,255,255,0.8)'
        }]}>
          {displaySavedCount}
        </Text>
      </TouchableOpacity>

      {/* AI Button */}
      <View style={[styles.aiWrapper, { marginTop: aiGap }]}>
        <TouchableOpacity
          style={[
            styles.aiButton,
            { 
              width: shopButtonSize, 
              height: shopButtonSize,
              borderRadius: shopButtonSize / 2,
            }
          ]}
          onPress={() => {
            triggerHaptic('heavy');
            onAIPress(opportunity);
          }}
          activeOpacity={0.8}
          accessibilityLabel={`AI assistant for ${opportunity.title}`}
          accessibilityRole="button"
          accessibilityHint="Opens AI assistant"
        >
          <View style={styles.aiGlowContainer}>
            <View style={styles.aiGlow}>
              <LogoImage size={logoSize} />
            </View>
          </View>
        </TouchableOpacity>
        
        <Text style={[styles.labelText, { 
          fontSize: labelFontSize,
          marginTop: 3,
          color: '#4A7DFF',
          textAlign: 'center',
        }]}>
          AI
        </Text>
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

  aiWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },

  valueText: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginTop: 3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },

  labelText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
  },

  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F1C40F',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  badgeText: {
    color: '#1F2F5F',
    fontSize: 9,
    fontWeight: 'bold',
  },

  aiButton: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2.5,
    borderColor: '#4A7DFF',
    zIndex: 2,
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

  aiGlowContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    overflow: 'hidden',
  },

  aiGlow: {
    width: '80%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    overflow: 'hidden',
  },

  // ✅ Logo fallback styles
  fallbackLogo: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
    borderRadius: 999,
  },

  fallbackText: {
    color: '#4A7DFF',
    fontWeight: 'bold',
  },
});