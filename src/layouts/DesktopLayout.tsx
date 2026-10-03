// src/layouts/DesktopLayout.tsx

import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Sidebar, SidebarRouteKind } from '../components/Sidebar';
import { ContextPanel } from '../components/ContextPanel';
import { Opportunity } from '../services/feed.service';
import { navigationRef } from '../navigation/navigationRef';

const DEFAULT_FEED_ASPECT_RATIO = 9 / 16;
const SIDEBAR_WIDTH = 220;
const CONTEXT_PANEL_WIDTH = 360;
const RIGHT_RAIL_WIDTH = 168;
const FEED_RIGHT_SHIFT = 60;

const MAX_FEED_HEIGHT = 900;
const MIN_FEED_HEIGHT = 420;
const MIN_FEED_WIDTH = 320;
const MAX_FEED_WIDTH = 720;

const FALLBACK_FEED_WIDTH = 420;
const FALLBACK_FEED_HEIGHT = FALLBACK_FEED_WIDTH / DEFAULT_FEED_ASPECT_RATIO;

interface Props {
  children: ReactNode;
  currentRoute?: string;
  onNavigate?: (route: string, kind: SidebarRouteKind) => void;
  floatingActions?: ReactNode;
  hideContextPanel?: boolean;
  fullWidth?: boolean;
  desktopNavArrows?: ReactNode;
  desktopActionRail?: ReactNode;
  feedAspectRatio?: number;

  selectedOpportunity?: Opportunity | null;
  onReviewsPress?: (productId: string, productTitle?: string) => void;
  onShowMorePress?: (opportunity: Opportunity) => void;
  onSharePress?: (opportunity: Opportunity) => void;
  onAIPress?: (opportunity: Opportunity) => void;
  featuredOpportunities?: Opportunity[];
  contextPanelView?: 'details' | 'reviews' | 'directions' | null;
  onContextPanelViewChange?: (
    view: 'details' | 'reviews' | 'directions' | null
  ) => void;
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
  desktopActionRail,
  feedAspectRatio,
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
  const [viewport, setViewport] = React.useState({ width: 0, height: 0 });

  const handleLayout = React.useCallback((e: any) => {
    const { width, height } = e.nativeEvent.layout;
    setViewport((prev) =>
      prev.width === width && prev.height === height
        ? prev
        : { width, height }
    );
  }, []);

  const effectiveAspect =
    feedAspectRatio && isFinite(feedAspectRatio) && feedAspectRatio > 0
      ? feedAspectRatio
      : DEFAULT_FEED_ASPECT_RATIO;

  const { feedWidth, feedHeight } = React.useMemo(() => {
    if (fullWidth) return { feedWidth: 0, feedHeight: 0 };
    if (viewport.width === 0 || viewport.height === 0) {
      return {
        feedWidth: FALLBACK_FEED_WIDTH,
        feedHeight: FALLBACK_FEED_HEIGHT,
      };
    }

    const availW = Math.max(
      0,
      viewport.width -
        SIDEBAR_WIDTH -
        CONTEXT_PANEL_WIDTH -
        RIGHT_RAIL_WIDTH
    );
    const availH = Math.max(0, viewport.height);

    if (availW === 0 || availH === 0) {
      return {
        feedWidth: FALLBACK_FEED_WIDTH,
        feedHeight: FALLBACK_FEED_HEIGHT,
      };
    }

    let h = availH;
    let w = h * effectiveAspect;
    if (w > availW) {
      w = availW;
      h = w / effectiveAspect;
    }

    h = Math.max(MIN_FEED_HEIGHT, Math.min(MAX_FEED_HEIGHT, h));
    w = h * effectiveAspect;
    if (w < MIN_FEED_WIDTH) {
      w = MIN_FEED_WIDTH;
      h = w / effectiveAspect;
    }
    if (w > MAX_FEED_WIDTH) {
      w = MAX_FEED_WIDTH;
      h = w / effectiveAspect;
    }

    return { feedWidth: w, feedHeight: h };
  }, [viewport, fullWidth, effectiveAspect]);

  const handleSidebarNavigate = React.useCallback(
    (route: string, kind: SidebarRouteKind) => {
      if (onNavigate) {
        onNavigate(route, kind);
        return;
      }

      try {
        if (!navigationRef.isReady()) {
          if (__DEV__) {
            console.warn(
              '[Sidebar] navigationRef not ready for route:',
              route
            );
          }
          return;
        }

        if (kind === 'tab') {
          navigationRef.navigate('MainTabs' as any, {
            screen: route,
          } as any);
        } else {
          navigationRef.navigate(route as any);
        }
      } catch (err) {
        if (__DEV__) {
          console.warn('[Sidebar] navigate failed:', route, err);
        }
      }
    },
    [onNavigate]
  );

  const showContextPanel = !hideContextPanel && !fullWidth;

  // ✅ When we're in a "fill the remaining area" mode (fullWidth),
  // the feedContainer must stop shrink-to-fit centering and instead
  // stretch to fill everything to the right of the sidebar.
  const feedContainerFills =
    fullWidth || hideContextPanel || !showContextPanel;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={styles.main}>
        <Sidebar
          currentRoute={currentRoute}
          onNavigate={handleSidebarNavigate}
        />

        <View
          style={[
            styles.feedContainer,
            feedContainerFills && styles.feedContainerFill,
          ]}
        >
          <View
            style={[
              styles.centerGroup,
              fullWidth && styles.centerGroupFull,
              !fullWidth && {
                marginLeft: RIGHT_RAIL_WIDTH / 2 + FEED_RIGHT_SHIFT,
              },
            ]}
          >
            <View
              style={[
                styles.feedWrapper,
                fullWidth
                  ? styles.feedWrapperFull
                  : { width: feedWidth, height: feedHeight },
              ]}
            >
              {children}
            </View>

            {!fullWidth && (
              <View style={styles.rightGutterColumn} pointerEvents="box-none">
                {desktopActionRail && (
                  <View style={styles.railSlot} pointerEvents="box-none">
                    {desktopActionRail}
                  </View>
                )}

                {desktopNavArrows && (
                  <View style={styles.navArrowsSlot} pointerEvents="box-none">
                    {desktopNavArrows}
                  </View>
                )}
              </View>
            )}
          </View>

          {floatingActions && (
            <View style={styles.floatingActionsContainer}>
              {floatingActions}
            </View>
          )}
        </View>

        {showContextPanel && (
          <View style={{ width: CONTEXT_PANEL_WIDTH, flexShrink: 0 }}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  main: { flex: 1, flexDirection: 'row', backgroundColor: '#1A1A2E' },
  feedContainer: {
    flex: 1,
    backgroundColor: '#0D0D1A',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  // ✅ Used when there's no context panel (or we're in `fullWidth`
  // mode): stretch the content to fill the whole area to the right
  // of the sidebar instead of shrink-wrapping and centering.
  feedContainerFill: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  centerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centerGroupFull: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    width: '100%',
  },
  feedWrapper: {
    borderRadius: 12,
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },
  feedWrapperFull: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
  },
  rightGutterColumn: {
    width: RIGHT_RAIL_WIDTH,
    marginLeft: 8,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  railSlot: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingRight: 12,
    paddingLeft: 0,
  },
  navArrowsSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 0,
    paddingRight: 0,
  },
  floatingActionsContainer: {
    position: 'absolute',
    right: 90,
    top: '50%',
    transform: [{ translateY: -150 }],
    zIndex: 9999,
    pointerEvents: 'box-none',
    alignItems: 'center',
  },
});