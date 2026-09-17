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

let munoLogo: any = null;
try {
  munoLogo = require('../../../assets/muno.png');
} catch (e) {
  try {
    munoLogo = require('../../../../assets/muno.png');
  } catch (e2) {
    console.warn('⚠️ muno.png not found - using text fallback');
    munoLogo = null;
  }
}

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<string, IconName> = {
  like: 'heart',
  likeOutline: 'heart-outline',
  reviews: 'chatbubble-ellipses',
  directions: 'location',
  share: 'share-social',
  save: 'bookmark',
  saveOutline: 'bookmark-outline',
};

interface FloatingActionRailProps {
  opportunity: Opportunity;
  onUserPress: () => void;
  /** ✅ Toggle like for this post. */
  onLikePress?: (opportunity: Opportunity) => void;
  onReviewsPress: (productId: string) => void;
  onDirectionsPress: (userName: string, area: string) => void;
  onSharePress: (opportunity: Opportunity) => void;
  onAIPress: (opportunity: Opportunity) => void;
  onSavePress?: (opportunity: Opportunity) => void;
  /** ✅ Initial liked state + count from the parent. */
  isLiked?: boolean;
  likeCount?: number;
  reviewCount?: number;
  shareCount?: number;
  savedCount?: number;
  isSaved?: boolean;
  distance?: number;
  userAvatar?: string | null;
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
  AI_GAP: 25,
  ICON_SIZE: 32,
  VALUE_FONT_SIZE: 11,
  LABEL_FONT_SIZE: 9,
};

const LogoFallback = ({ size }: { size: number }) => (
  <View style={[styles.fallbackLogo, { width: size, height: size }]}>
    <Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>M</Text>
  </View>
);

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
  onUserPress,
  onLikePress,
  onReviewsPress,
  onDirectionsPress,
  onSharePress,
  onAIPress,
  onSavePress,
  isLiked = false,
  likeCount = 0,
  reviewCount = 0,
  shareCount = 0,
  savedCount = 0,
  isSaved = false,
  distance = 0,
  userAvatar = null,
}) => {
  const { isDesktop } = useBreakpoint();

  const [currentOpportunityId, setCurrentOpportunityId] = useState(
    opportunity.id
  );

  // ✅ Optimistic like state
  const [isLikedState, setIsLikedState] = useState(isLiked);
  const [likeCountState, setLikeCountState] = useState(likeCount);

  const [isSavedState, setIsSavedState] = useState(isSaved);
  const [saveCount, setSaveCount] = useState(savedCount);

  const hasInteractedLikeRef = useRef(false);
  const hasInteractedSaveRef = useRef(false);

  // Reset state when opportunity changes
  useEffect(() => {
    if (opportunity.id !== currentOpportunityId) {
      setCurrentOpportunityId(opportunity.id);

      setIsLikedState(isLiked);
      setLikeCountState(likeCount);
      hasInteractedLikeRef.current = false;

      setIsSavedState(isSaved);
      setSaveCount(savedCount);
      hasInteractedSaveRef.current = false;
    } else {
      if (!hasInteractedLikeRef.current) {
        setIsLikedState(isLiked);
        setLikeCountState(likeCount);
      }
      if (!hasInteractedSaveRef.current) {
        setIsSavedState(isSaved);
        setSaveCount(savedCount);
      }
    }
  }, [opportunity.id, isLiked, likeCount, isSaved, savedCount]);

  const triggerHaptic = useCallback(
    async (style: 'light' | 'medium' | 'heavy') => {
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
    },
    []
  );

  const handlePress = useCallback(
    (action: string, callback: () => void) => {
      triggerHaptic('light');
      if (callback && typeof callback === 'function') {
        callback();
      }
    },
    [triggerHaptic]
  );

  // ✅ Like toggle — optimistic
  const handleLikePress = useCallback(() => {
    hasInteractedLikeRef.current = true;
    triggerHaptic('medium');

    const newLiked = !isLikedState;
    const newCount = newLiked
      ? likeCountState + 1
      : Math.max(0, likeCountState - 1);

    setIsLikedState(newLiked);
    setLikeCountState(newCount);

    if (onLikePress) {
      onLikePress(opportunity);
    }
  }, [
    isLikedState,
    likeCountState,
    triggerHaptic,
    onLikePress,
    opportunity,
  ]);

  const handleSavePress = useCallback(() => {
    hasInteractedSaveRef.current = true;
    triggerHaptic('medium');

    const newSaved = !isSavedState;
    const newCount = newSaved ? saveCount + 1 : Math.max(0, saveCount - 1);

    setIsSavedState(newSaved);
    setSaveCount(newCount);

    if (onSavePress) {
      onSavePress(opportunity);
    }
  }, [isSavedState, saveCount, triggerHaptic, onSavePress, opportunity]);

  const handleSharePress = useCallback(async () => {
    try {
      triggerHaptic('light');

      if (onSharePress) {
        onSharePress(opportunity);
      }

      const title = opportunity.title || 'Check this out on Munolink';
      const price = opportunity.price
        ? `UGX ${opportunity.price.toLocaleString()}`
        : '';
      const user = opportunity.userFullName
        ? `from ${opportunity.userFullName}`
        : '';
      const distanceText = opportunity.distance
        ? `${opportunity.distance.toFixed(1)}km away`
        : '';

      let message = `🛍️ ${title}`;
      if (price) message += `\n💰 ${price}`;
      if (user) message += `\n👤 ${user}`;
      if (distanceText) message += `\n📍 ${distanceText}`;
      message += `\n\n📱 Check it out on Munolink: https://munolink.com/post/${opportunity.id}`;

      await Share.share({ message });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [opportunity, triggerHaptic, onSharePress]);

  if (!opportunity) {
    console.warn('FloatingActionRail: No opportunity provided');
    return null;
  }

  const buttonSize = isDesktop
    ? DESKTOP_POSITION.BUTTON_SIZE
    : MOBILE_POSITION.BUTTON_SIZE;
  const shopButtonSize = isDesktop
    ? DESKTOP_POSITION.SHOP_BUTTON_SIZE
    : MOBILE_POSITION.SHOP_BUTTON_SIZE;
  const iconSize = isDesktop
    ? DESKTOP_POSITION.ICON_SIZE
    : MOBILE_POSITION.ICON_SIZE;
  const valueFontSize = isDesktop
    ? DESKTOP_POSITION.VALUE_FONT_SIZE
    : MOBILE_POSITION.VALUE_FONT_SIZE;
  const labelFontSize = isDesktop
    ? DESKTOP_POSITION.LABEL_FONT_SIZE
    : MOBILE_POSITION.LABEL_FONT_SIZE;
  const gap = isDesktop ? DESKTOP_POSITION.GAP : MOBILE_POSITION.GAP;
  const aiGap = isDesktop ? DESKTOP_POSITION.AI_GAP : MOBILE_POSITION.AI_GAP;

  const userLetter = opportunity.userFullName?.charAt(0).toUpperCase() || 'U';

  const logoSize = isDesktop ? 80 : 70;

  // ---- Distance ----
  const effectiveDistance =
    typeof opportunity.distance === 'number' && opportunity.distance > 0
      ? opportunity.distance
      : typeof distance === 'number' && distance > 0
      ? distance
      : 0;

  let distanceDisplay = '—';
  if (effectiveDistance > 0) {
    if (effectiveDistance < 1) {
      distanceDisplay = `${Math.round(effectiveDistance * 1000)}m`;
    } else if (effectiveDistance < 10) {
      distanceDisplay = `${effectiveDistance.toFixed(1)}km`;
    } else {
      distanceDisplay = `${Math.round(effectiveDistance)}km`;
    }
  }

  // ---- Review count ----
  const displayReviewCount =
    typeof opportunity.commentCount === 'number' &&
    opportunity.commentCount >= 0
      ? opportunity.commentCount
      : reviewCount || 0;

  // ---- Share count ----
  const displayShareCount =
    typeof opportunity.shareCount === 'number'
      ? opportunity.shareCount
      : shareCount || 0;

  // ---- Save count ----
  const displaySaveCount = hasInteractedSaveRef.current
    ? saveCount
    : typeof opportunity.saveCount === 'number'
    ? opportunity.saveCount
    : saveCount || 0;

  // ---- Like count ----
  const displayLikeCount = hasInteractedLikeRef.current
    ? likeCountState
    : typeof opportunity.likeCount === 'number'
    ? opportunity.likeCount
    : likeCountState || 0;

  const avatarUrl = userAvatar || opportunity.userAvatar || null;
  const hasValidAvatar = avatarUrl && avatarUrl.startsWith('http');

  return (
    <View style={[styles.container, { gap }]}>
      {/* User Button */}
      <TouchableOpacity
        style={[
          styles.userButton,
          {
            width: shopButtonSize,
            height: shopButtonSize,
            borderRadius: shopButtonSize / 2,
          },
        ]}
        onPress={() => handlePress('User', onUserPress)}
        activeOpacity={0.8}
      >
        <View style={styles.userLetterContainer}>
          {hasValidAvatar ? (
            <Image
              source={{ uri: avatarUrl }}
              style={[
                styles.userAvatar,
                { width: shopButtonSize * 0.7, height: shopButtonSize * 0.7 },
              ]}
              resizeMode="cover"
            />
          ) : (
            <Text
              style={[styles.userLetter, { fontSize: shopButtonSize * 0.5 }]}
            >
              {userLetter}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* ✅ LIKE BUTTON — above Reviews */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
          },
        ]}
        onPress={handleLikePress}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isLikedState ? ICONS.like : ICONS.like}
          size={iconSize}
          color={isLikedState ? '#FF4D6D' : '#FFFFFF'}
        />
        <Text
          style={[
            styles.valueText,
            {
              fontSize: valueFontSize,
              color: isLikedState ? '#FF4D6D' : 'rgba(255,255,255,0.9)',
            },
          ]}
        >
          {displayLikeCount}
        </Text>
      </TouchableOpacity>

      {/* Reviews */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
          },
        ]}
        onPress={() =>
          handlePress('Reviews', () => onReviewsPress(opportunity.id))
        }
        activeOpacity={0.7}
      >
        <Ionicons name={ICONS.reviews} size={iconSize} color="#FFFFFF" />
        <Text style={[styles.valueText, { fontSize: valueFontSize }]}>
          {displayReviewCount}
        </Text>
      </TouchableOpacity>

      {/* Directions */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
          },
        ]}
        onPress={() =>
          handlePress('Directions', () =>
            onDirectionsPress(
              opportunity.userFullName || 'User',
              opportunity.area || ''
            )
          )
        }
        activeOpacity={0.7}
      >
        <Ionicons name={ICONS.directions} size={iconSize} color="#FFFFFF" />
        <Text style={[styles.valueText, { fontSize: valueFontSize }]}>
          {distanceDisplay}
        </Text>
      </TouchableOpacity>

      {/* Share */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
          },
        ]}
        onPress={handleSharePress}
        activeOpacity={0.7}
      >
        <Ionicons name={ICONS.share} size={iconSize} color="#FFFFFF" />
        <Text style={[styles.valueText, { fontSize: valueFontSize }]}>
          {displayShareCount}
        </Text>
      </TouchableOpacity>

      {/* Save */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
          },
        ]}
        onPress={handleSavePress}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isSavedState ? ICONS.save : ICONS.saveOutline}
          size={iconSize}
          color={isSavedState ? '#FF6B6B' : '#FFFFFF'}
        />
        <Text
          style={[
            styles.valueText,
            {
              fontSize: valueFontSize,
              color: isSavedState ? '#FF6B6B' : 'rgba(255,255,255,0.8)',
            },
          ]}
        >
          {displaySaveCount}
        </Text>
      </TouchableOpacity>

      {/* AI */}
      <View style={[styles.aiWrapper, { marginTop: aiGap }]}>
        <TouchableOpacity
          style={[
            styles.aiButton,
            {
              width: shopButtonSize,
              height: shopButtonSize,
              borderRadius: shopButtonSize / 2,
            },
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

        <Text
          style={[
            styles.labelText,
            {
              fontSize: labelFontSize,
              marginTop: 3,
              color: '#4A7DFF',
              textAlign: 'center',
            },
          ]}
        >
          AI
        </Text>
      </View>
    </View>
  );
};

export const FloatingActionRail = memo(
  FloatingActionRailComponent,
  (prevProps, nextProps) => {
    const opportunityChanged =
      prevProps.opportunity.id !== nextProps.opportunity.id;

    const likeStateChanged =
      prevProps.isLiked !== nextProps.isLiked ||
      prevProps.likeCount !== nextProps.likeCount;

    const saveStateChanged =
      prevProps.isSaved !== nextProps.isSaved ||
      prevProps.savedCount !== nextProps.savedCount;

    const otherPropsChanged =
      prevProps.shareCount !== nextProps.shareCount ||
      prevProps.reviewCount !== nextProps.reviewCount ||
      prevProps.distance !== nextProps.distance ||
      prevProps.userAvatar !== nextProps.userAvatar;

    const opportunityDataChanged =
      prevProps.opportunity.distance !== nextProps.opportunity.distance ||
      prevProps.opportunity.commentCount !==
        nextProps.opportunity.commentCount ||
      prevProps.opportunity.saveCount !== nextProps.opportunity.saveCount ||
      prevProps.opportunity.shareCount !== nextProps.opportunity.shareCount ||
      prevProps.opportunity.likeCount !== nextProps.opportunity.likeCount ||
      prevProps.opportunity.userAvatar !== nextProps.opportunity.userAvatar;

    if (
      !opportunityChanged &&
      !likeStateChanged &&
      !saveStateChanged &&
      !otherPropsChanged &&
      !opportunityDataChanged
    ) {
      return true;
    }
    return false;
  }
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    zIndex: 9999,
  },
  userButton: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  userLetterContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },
  userAvatar: {
    borderRadius: 999,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
  },
  userLetter: {
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