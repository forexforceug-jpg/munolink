// src/layouts/DesktopLayout.tsx

import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Sidebar } from '../components/Sidebar';
import { ContextPanel } from '../components/ContextPanel';
import { Opportunity } from '../services/feed.service';

interface Props {
  children: ReactNode;
  currentRoute?: string;
  onNavigate?: (route: string) => void;
  floatingActions?: ReactNode;
  hideContextPanel?: boolean;
  fullWidth?: boolean;
  desktopNavArrows?: ReactNode;
  // Context Panel props
  selectedOpportunity?: Opportunity | null;
  onReviewsPress?: (productId: string, productTitle?: string) => void;
  onShowMorePress?: (opportunity: Opportunity) => void;
  onSharePress?: (opportunity: Opportunity) => void;
  onAIPress?: (opportunity: Opportunity) => void;
  featuredOpportunities?: Opportunity[];
  contextPanelView?: 'details' | 'reviews' | 'directions' | null;
  onContextPanelViewChange?: (view: 'details' | 'reviews' | 'directions' | null) => void;
  selectedProductId?: string;
  selectedProductTitle?: string;
  selectedOpportunityForModal?: Opportunity | null;
  onCloseReviews?: () => void;
  onCloseDetails?: () => void;
  aiViewActive?: boolean;
  onAIClose?: () => void;
  aiContextHint?: string;
  directionsViewActive?: boolean;
  onDirectionsClose?: () => void;
}

export function DesktopLayout({ 
  children, 
  currentRoute, 
  onNavigate,
  floatingActions,
  hideContextPanel = false,
  fullWidth = false,
  desktopNavArrows,
  selectedOpportunity,
  onReviewsPress,
  onShowMorePress,
  onSharePress,
  onAIPress,
  featuredOpportunities = [],
  contextPanelView,
  onContextPanelViewChange,
  selectedProductId = '',
  selectedProductTitle = '',
  selectedOpportunityForModal = null,
  onCloseReviews,
  onCloseDetails,
  aiViewActive = false,
  onAIClose,
  aiContextHint = '',
  directionsViewActive = false,
  onDirectionsClose,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <Sidebar currentRoute={currentRoute} onNavigate={onNavigate} />
        
        <View style={[styles.feedContainer, fullWidth && styles.feedContainerFull]}>
          <View style={[styles.feedWrapper, fullWidth && styles.feedWrapperFull]}>
            {children}
          </View>
          {floatingActions && (
            <View style={styles.floatingActionsContainer}>
              {floatingActions}
            </View>
          )}
        </View>
        
        {!hideContextPanel && (
          <View style={{ width: 360, flexShrink: 0 }}>
            <ContextPanel 
              opportunity={selectedOpportunity || undefined}
              onReviewsPress={onReviewsPress}
              onShowMorePress={onShowMorePress}
              onSharePress={onSharePress}
              onAIPress={onAIPress}
              featuredOpportunities={featuredOpportunities}
              activeView={contextPanelView}
              onViewChange={onContextPanelViewChange}
              selectedProductId={selectedProductId}
              selectedProductTitle={selectedProductTitle}
              selectedOpportunity={selectedOpportunityForModal}
              onCloseReviews={onCloseReviews}
              onCloseDetails={onCloseDetails}
              aiViewActive={aiViewActive}
              onAIClose={onAIClose}
              aiContextHint={aiContextHint}
              directionsViewActive={directionsViewActive}
              onDirectionsClose={onDirectionsClose}
            />
          </View>
        )}
      </View>
      
      {desktopNavArrows && (
        <View style={styles.desktopNavArrowsContainer}>
          {desktopNavArrows}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
  },
  feedContainer: {
    flex: 1,
    backgroundColor: '#0D0D1A',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  feedContainerFull: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  feedWrapper: {
    width: '90%',
    maxWidth: 480,
    height: '100%',
    justifyContent: 'center',
  },
  feedWrapperFull: {
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    justifyContent: 'flex-start',
  },
  floatingActionsContainer: {
    position: 'absolute',
    right: 60,
    top: '50%',
    transform: [{ translateY: -150 }],
    zIndex: 9999,
    pointerEvents: 'box-none',
    alignItems: 'center',
  },
  desktopNavArrowsContainer: {
    position: 'absolute',
    right: 362,
    top: '50%',
    transform: [{ translateY: -44 }],
    zIndex: 9999,
    pointerEvents: 'box-none',
    alignItems: 'center',
    gap: 8,
  },
});