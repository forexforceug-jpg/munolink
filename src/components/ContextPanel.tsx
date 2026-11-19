// src/components/ContextPanel.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Opportunity } from '../services/feed.service';
import { ReviewsBottomSheet } from '../features/feed/components/ReviewsBottomSheet';
import { AIBottomSheet } from '../features/feed/components/AIBottomSheet';
import { DirectionsBottomSheet } from '../features/feed/components/DirectionsBottomSheet';

interface Props {
  opportunity?: Opportunity | null;
  onReviewsPress?: (productId: string, productTitle?: string) => void;
  onShowMorePress?: (opportunity: Opportunity) => void;
  /**
   * ✅ Fired when the user taps a card in the Featured grid.
   * On desktop this should scroll the center feed to that post
   * (not open the details view in this panel).
   */
  onFeaturedItemPress?: (opportunity: Opportunity) => void;
  onSharePress?: (opportunity: Opportunity) => void;
  onAIPress?: (opportunity: Opportunity) => void;
  featuredOpportunities?: Opportunity[];
  activeView?: 'details' | 'reviews' | 'directions' | null;
  onViewChange?: (view: 'details' | 'reviews' | 'directions' | null) => void;
  selectedProductId?: string;
  selectedProductTitle?: string;
  selectedOpportunity?: Opportunity | null;
  onCloseReviews?: () => void;
  onCloseDetails?: () => void;
  // AI props
  aiViewActive?: boolean;
  onAIClose?: () => void;
  aiContextHint?: string;
  // Directions props
  directionsViewActive?: boolean;
  onDirectionsClose?: () => void;
}

const FeaturedItem = ({ item, onPress }: any) => (
  <TouchableOpacity style={styles.featuredItem} onPress={() => onPress?.(item)}>
    <Image source={{ uri: item.imageUrl }} style={styles.featuredImage} resizeMode="cover" />
    <View style={styles.featuredOverlay}>
      <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.featuredShop}>{item.shopName}</Text>
      <Text style={styles.featuredPrice}>UGX {item.price?.toLocaleString()}</Text>
    </View>
  </TouchableOpacity>
);

export function ContextPanel({
  opportunity,
  onReviewsPress,
  onShowMorePress,
  onFeaturedItemPress,
  onSharePress,
  onAIPress,
  featuredOpportunities = [],
  activeView: externalActiveView,
  onViewChange,
  selectedProductId = '',
  selectedProductTitle = '',
  selectedOpportunity = null,
  onCloseReviews,
  onCloseDetails,
  aiViewActive = false,
  onAIClose,
  aiContextHint = '',
  directionsViewActive = false,
  onDirectionsClose,
}: Props) {
  const [internalActiveView, setInternalActiveView] = useState<
    'details' | 'reviews' | 'directions' | null
  >(null);

  const activeView =
    externalActiveView !== undefined ? externalActiveView : internalActiveView;

  const setView = (
    view: 'details' | 'reviews' | 'directions' | null
  ) => {
    setInternalActiveView(view);
    if (onViewChange) onViewChange(view);
  };

  const PANEL_WIDTH = 340;

  // ============================================================
  // DIRECTIONS VIEW
  // ============================================================
  if (activeView === 'directions' && opportunity) {
    console.log('📍 Rendering Directions view in ContextPanel');
    return (
      <View style={[styles.container, { width: PANEL_WIDTH }]}>
        <DirectionsBottomSheet
          isDesktopView={true}
          opportunity={opportunity}
          onClose={() => {
            console.log('🔚 Directions Context Panel closing');
            setView(null);
            onDirectionsClose?.();
          }}
          panelWidth={PANEL_WIDTH}
        />
      </View>
    );
  }

  // ============================================================
  // AI VIEW
  // ============================================================
  if (aiViewActive && opportunity) {
    console.log('🎯 Rendering AI view in ContextPanel');
    return (
      <View style={[styles.container, { width: PANEL_WIDTH }]}>
        <AIBottomSheet
          isDesktopView={true}
          opportunity={opportunity}
          contextHint={aiContextHint}
          onClose={() => {
            console.log('🔚 AI Context Panel closing');
            onAIClose?.();
          }}
        />
      </View>
    );
  }

  // ============================================================
  // DEFAULT: Featured grid
  // ============================================================
  if (!opportunity || !activeView) {
    return (
      <View style={[styles.container, { width: PANEL_WIDTH }]}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="sparkles-outline" size={16} color="#AFC4FF" />
            <Text style={styles.headerTitle}>Featured businesses</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={featuredOpportunities}
          renderItem={({ item }) => (
            <FeaturedItem
              item={item}
              onPress={(selectedItem: Opportunity) => {
                // ✅ Tapping a Featured card opens the post in the
                // CENTER FEED — the parent handles the scroll.
                // Falls back to the old details-in-panel flow only
                // if the parent didn't provide a handler.
                if (onFeaturedItemPress) {
                  onFeaturedItemPress(selectedItem);
                } else {
                  setView('details');
                  onShowMorePress?.(selectedItem);
                }
              }}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyGrid}>
              <Text style={styles.emptyGridText}>No featured items</Text>
            </View>
          }
        />
      </View>
    );
  }

  // ============================================================
  // REVIEWS VIEW
  // ============================================================
  if (activeView === 'reviews') {
    const productId = opportunity?.id || selectedProductId;
    const productTitle = opportunity?.title || selectedProductTitle;

    return (
      <View style={[styles.container, { width: PANEL_WIDTH }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setView(null);
              onCloseReviews?.();
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={18} color="#4A7DFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>⭐ Reviews</Text>
          <View style={{ width: 30 }} />
        </View>

        <View style={styles.modalContainer}>
          <ReviewsBottomSheet
            visible={true}
            productId={productId}
            productTitle={productTitle}
            onClose={() => {
              setView(null);
              onCloseReviews?.();
            }}
            isDesktopView={true}
            panelWidth={PANEL_WIDTH}
          />
        </View>
      </View>
    );
  }

  // ============================================================
  // DETAILS VIEW
  // ============================================================
  if (activeView === 'details') {
    const displayOpportunity = opportunity || selectedOpportunity;

    return (
      <View style={[styles.container, { width: PANEL_WIDTH }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setView(null);
              onCloseDetails?.();
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={18} color="#4A7DFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📋 Details</Text>
          <View style={{ width: 30 }} />
        </View>
      </View>
    );
  }

  return null;
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#101113',
    borderLeftWidth: 1,
    borderLeftColor: '#252629',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#252629',
    minHeight: 58,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  viewAllText: {
    color: '#AFC4FF',
    fontSize: 12,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    color: '#4A7DFF',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  gridContent: {
    padding: 12,
    paddingBottom: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  featuredItem: {
    width: '48%',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#191A1D',
    borderWidth: 1,
    borderColor: '#2A2B2F',
  },
  featuredImage: {
    width: '100%',
    height: 116,
  },
  featuredOverlay: {
    padding: 9,
  },
  featuredTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  featuredShop: {
    color: '#A0A1A5',
    fontSize: 10,
    marginTop: 3,
  },
  featuredPrice: {
    color: '#AFC4FF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  emptyGrid: {
    padding: 30,
    alignItems: 'center',
  },
  emptyGridText: {
    color: '#A0A1A5',
    fontSize: 13,
  },
});