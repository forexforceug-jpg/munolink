// src/features/feed/components/FloatingActionRail.tsx

import React, { memo, useRef, useEffect, useState, useCallback } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Image,
  Platform,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';


import * as Haptics from 'expo-haptics';
import { Opportunity } from '../../../services/feed.service';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { locationService } from '../../../services/location.service';

// ✅ Fixed: Handle image import properly for React Native
let munoLogo: any = null;
try {
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
  directions: 'location',
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
  shopLogo?: string | null;
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
  shopLogo = null,
}) => {
  const { isDesktop } = useBreakpoint();
  
  // ✅ Store the opportunity ID to track changes
  const [currentOpportunityId, setCurrentOpportunityId] = useState(opportunity.id);
  
  // ✅ Save state - track both saved status and count
  const [isSavedState, setIsSavedState] = useState(isSaved);
  const [saveCount, setSaveCount] = useState(savedCount);
  
  // ✅ Track if user has interacted with THIS specific opportunity
  const hasInteractedRef = useRef(false);
  
  // ✅ Calculate distance from GPS
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

  const [logoError, setLogoError] = useState(false);

  // ✅ CRITICAL FIX: Reset state when opportunity changes
  useEffect(() => {
    if (opportunity.id !== currentOpportunityId) {
      // Opportunity changed - reset everything
      console.log(`🔄 Opportunity changed to ${opportunity.id}`);
      setCurrentOpportunityId(opportunity.id);
      setIsSavedState(isSaved);
      setSaveCount(savedCount);
      hasInteractedRef.current = false;
      setLogoError(false);
      setCalculatedDistance(null);
      
      // Recalculate distance for new opportunity
      const lat = opportunity.shopLatitude || opportunity.latitude;
      const lng = opportunity.shopLongitude || opportunity.longitude;
      if (lat && lng) {
        calculateDistance(lat, lng);
      }
    } else {
      // Same opportunity - update from props ONLY if user hasn't interacted
      if (!hasInteractedRef.current) {
        const propsChanged = isSavedState !== isSaved || saveCount !== savedCount;
        if (propsChanged) {
          console.log(`📝 Updating from props: isSaved=${isSaved}, savedCount=${savedCount}`);
          setIsSavedState(isSaved);
          setSaveCount(savedCount);
        }
      }
    }
  }, [opportunity.id, isSaved, savedCount]);

  // ✅ Calculate distance function
  const calculateDistance = useCallback(async (lat: number, lng: number) => {
    setIsCalculatingDistance(true);
    try {
      const userLocation = locationService.getCachedLocation();
      if (userLocation) {
        const dist = locationService.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          lat,
          lng
        );
        setCalculatedDistance(dist);
      } else {
        const currentLocation = await locationService.getCurrentLocation();
        if (currentLocation) {
          const dist = locationService.calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            lat,
            lng
          );
          setCalculatedDistance(dist);
        }
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
      setCalculatedDistance(null);
    } finally {
      setIsCalculatingDistance(false);
    }
  }, []);

  // ✅ Initial distance calculation
  useEffect(() => {
    const lat = opportunity.shopLatitude || opportunity.latitude;
    const lng = opportunity.shopLongitude || opportunity.longitude;
    if (lat && lng) {
      calculateDistance(lat, lng);
    }
  }, [opportunity.shopLatitude, opportunity.shopLongitude, opportunity.latitude, opportunity.longitude]);

  const triggerHaptic = useCallback(async (style: 'light' | 'medium' | 'heavy') => {
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
      // Silently fail
    }
  }, []);

  const handlePress = useCallback((action: string, callback: () => void) => {
    triggerHaptic('light');
    if (callback && typeof callback === 'function') {
      callback();
    }
  }, [triggerHaptic]);

  // ✅ FIXED: Save button handler with proper count management
  const handleSavePress = useCallback(() => {
    // Mark that user has interacted with this opportunity
    hasInteractedRef.current = true;
    triggerHaptic('medium');
    
    // Toggle save state
    const newSaved = !isSavedState;
    const newCount = newSaved ? saveCount + 1 : Math.max(0, saveCount - 1);
    
    console.log(`💾 Save toggled: ${isSavedState} -> ${newSaved}, count: ${saveCount} -> ${newCount}`);
    
    // Update local state immediately (optimistic update)
    setIsSavedState(newSaved);
    setSaveCount(newCount);
    
    // Call parent callback
    if (onSavePress) {
      onSavePress(opportunity);
    }
  }, [isSavedState, saveCount, triggerHaptic, onSavePress, opportunity]);

  // ============================================================
  // ✅ SHARE FUNCTION WITH IMAGE
  // ============================================================
  
  const handleSharePress = useCallback(async () => {
    try {
      triggerHaptic('light');
      
      // Get the first image from the opportunity
      const imageUrl = opportunity.imageUrl || 
                       opportunity.catalogImages?.[0] || 
                       opportunity.shopLogo || 
                       null;
      
      // Build the share message
      const title = opportunity.title || 'Check this out on Munolink';
      const price = opportunity.price ? `UGX ${opportunity.price.toLocaleString()}` : '';
      const shop = opportunity.shopName ? `from ${opportunity.shopName}` : '';
      const rating = opportunity.rating ? `⭐ ${opportunity.rating.toFixed(1)}` : '';
      const area = opportunity.area ? `📍 ${opportunity.area}` : '';
      
      let message = `🛍️ ${title}`;
      if (price) message += `\n💰 ${price}`;
      if (shop) message += `\n🏪 ${shop}`;
      if (rating) message += `\n${rating}`;
      if (area) message += `\n${area}`;
      message += `\n\n📱 Check it out on Munolink: https://munolink.com/item/${opportunity.id}`;
      
      // If there's an image, share with image URL
      if (imageUrl) {
        // On mobile, we can share with image
        try {
          // For iOS/Android, try to share with image
          await Share.share({
            message: message,
            url: imageUrl, // Some platforms support URL
          });
        } catch (shareError) {
          // Fallback: share without image
          console.warn('Image share failed, sharing text only:', shareError);
          await Share.share({
            message: message,
          });
        }
      } else {
        // Share text only
        await Share.share({
          message: message,
        });
      }
      
      // Call the parent callback if provided
      if (onSharePress) {
        onSharePress(opportunity);
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [opportunity, triggerHaptic, onSharePress]);

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

  // ✅ Display values with proper logic
  const displayRating = opportunity.rating ? opportunity.rating.toFixed(1) : '0.0';
  const displayReviewCount = reviewCount > 0 ? `(${reviewCount})` : null;
  
  // ✅ Distance display logic
  let distanceDisplay = '0km';
  if (isCalculatingDistance) {
    distanceDisplay = '...';
  } else if (calculatedDistance !== null) {
    if (calculatedDistance < 1) {
      distanceDisplay = `${Math.round(calculatedDistance * 1000)}m`;
    } else if (calculatedDistance < 10) {
      distanceDisplay = `${calculatedDistance.toFixed(1)}km`;
    } else {
      distanceDisplay = `${Math.round(calculatedDistance)}km`;
    }
  }
  
  const displayShareCount = shareCount > 0 ? shareCount : 0;
  const displaySavedCount = saveCount;

  // ✅ SHOP LOGO - Use the real logo from the database
  const shopLogoUrl = shopLogo || opportunity.shopLogo || null;
  
  // ✅ Check if we have a valid logo URL
  const hasValidLogo = shopLogoUrl && shopLogoUrl.startsWith('http');
  
  // ✅ Log the logo URL for debugging
  console.log(`🏪 Shop logo for ${opportunity.shopName}:`, shopLogoUrl);

  return (
    <View style={[styles.container, { gap }]}>
      {/* Shop Button - With Real Logo from Database */}
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
          {hasValidLogo ? (
            <Image
              source={{ uri: shopLogoUrl }}
              style={[
                styles.shopLogo,
                { width: shopButtonSize * 0.7, height: shopButtonSize * 0.7 }
              ]}
              resizeMode="cover"
              onError={() => setLogoError(true)}
            />
          ) : (
            <Text style={[styles.shopLetter, { fontSize: shopButtonSize * 0.5 }]}>
              {shopLetter}
            </Text>
          )}
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
      >
        <Ionicons name={ICONS.reviews} size={iconSize} color="#FFFFFF" />
        <Text style={[styles.valueText, { fontSize: valueFontSize }]}>
          {displayRating}
        </Text>
        {displayReviewCount && (
          <Text style={[styles.valueSubText, { fontSize: valueFontSize - 2 }]}>
            {displayReviewCount}
          </Text>
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
      >
        <Ionicons name={ICONS.directions} size={iconSize} color="#FFFFFF" />  
        <Text style={[styles.valueText, { fontSize: valueFontSize }]}>
          {distanceDisplay}
        </Text>
      </TouchableOpacity>

      {/* Share Button - Uses the new handleSharePress */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }
        ]}
        onPress={handleSharePress}
        activeOpacity={0.7}
      >
        <Ionicons name={ICONS.share} size={iconSize} color="#FFFFFF" />
        <Text style={[styles.valueText, { fontSize: valueFontSize }]}>
          {displayShareCount}
        </Text>
      </TouchableOpacity>

      {/* ✅ Save/Wishlist Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }
        ]}
        onPress={handleSavePress}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={isSavedState ? ICONS.save : ICONS.saveOutline} 
          size={iconSize} 
          color={isSavedState ? '#FF6B6B' : '#FFFFFF'} 
        />
        <Text style={[styles.valueText, { 
          fontSize: valueFontSize,
          color: isSavedState ? '#FF6B6B' : 'rgba(255,255,255,0.8)'
        }]}>
          {displaySavedCount}
        </Text>
      </TouchableOpacity>

      {/* AI Button - Using LogoImage component with fallback */}
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

// ✅ Custom comparison function for memo
export const FloatingActionRail = memo(FloatingActionRailComponent, (prevProps, nextProps) => {
  // Only re-render if the opportunity ID changes or if the save state changes
  const opportunityChanged = prevProps.opportunity.id !== nextProps.opportunity.id;
  const saveStateChanged = prevProps.isSaved !== nextProps.isSaved || 
                          prevProps.savedCount !== nextProps.savedCount;
  const otherPropsChanged = prevProps.shareCount !== nextProps.shareCount ||
                           prevProps.reviewCount !== nextProps.reviewCount ||
                           prevProps.distance !== nextProps.distance ||
                           prevProps.shopLogo !== nextProps.shopLogo;
  
  // Don't re-render if only the opportunity object reference changed but ID is the same
  if (!opportunityChanged && !saveStateChanged && !otherPropsChanged) {
    return true; // Prevent re-render
  }
  
  return false; // Allow re-render
});

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
  },

  shopLetterContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },

  shopLogo: {
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

  valueSubText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '400',
    marginTop: -1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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