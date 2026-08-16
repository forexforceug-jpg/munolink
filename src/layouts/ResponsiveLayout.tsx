// src/layouts/ResponsiveLayout.tsx

import React, { ReactNode } from 'react';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { MobileLayout } from './MobileLayout';
import { DesktopLayout } from './DesktopLayout';
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
  // Modal props for Context Panel
  selectedProductId?: string;
  selectedProductTitle?: string;
  selectedOpportunityForModal?: Opportunity | null;
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

export function ResponsiveLayout({ 
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
  const { isDesktop } = useBreakpoint();

  if (isDesktop) {
    return (
      <DesktopLayout 
        currentRoute={currentRoute} 
        onNavigate={onNavigate}
        floatingActions={floatingActions}
        hideContextPanel={hideContextPanel}
        fullWidth={fullWidth}
        desktopNavArrows={desktopNavArrows}
        selectedOpportunity={selectedOpportunity}
        onReviewsPress={onReviewsPress}
        onShowMorePress={onShowMorePress}
        onSharePress={onSharePress}
        onAIPress={onAIPress}
        featuredOpportunities={featuredOpportunities}
        contextPanelView={contextPanelView}
        onContextPanelViewChange={onContextPanelViewChange}
        selectedProductId={selectedProductId}
        selectedProductTitle={selectedProductTitle}
        selectedOpportunityForModal={selectedOpportunityForModal}
        onCloseReviews={onCloseReviews}
        onCloseDetails={onCloseDetails}
        aiViewActive={aiViewActive}
        onAIClose={onAIClose}
        aiContextHint={aiContextHint}
        directionsViewActive={directionsViewActive}
        onDirectionsClose={onDirectionsClose}
      >
        {children}
      </DesktopLayout>
    );
  }

  return (
    <MobileLayout floatingActions={floatingActions}>
      {children}
    </MobileLayout>
  );
}