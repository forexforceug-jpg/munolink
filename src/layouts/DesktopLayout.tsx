// src/layouts/DesktopLayout.tsx

import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Sidebar } from '../components/Sidebar';
import { ContextPanel } from '../components/ContextPanel';
import { Opportunity } from '../services/feed.service';

// ----------------------------------------------------------------
// Desktop feed rectangle geometry
// ----------------------------------------------------------------
// Default aspect ratio used until the current post's media reports
// its natural dimensions.
const DEFAULT_FEED_ASPECT_RATIO = 9 / 16;

// Widths reserved by the surrounding chrome.
const SIDEBAR_WIDTH = 220;
const CONTEXT_PANEL_WIDTH = 360;

// Horizontal room reserved to the RIGHT of the rectangle for the
// rail + nav arrows. Rail column + arrows column sit side by side.
const RIGHT_RAIL_WIDTH = 168;

// Extra right-shift applied to the feed rectangle beyond the
// compensation for the gutter. Increase to push the rectangle
// further right; decrease (or use a negative value) to push left.
const FEED_RIGHT_SHIFT = 60;

// Clamp the feed rectangle so it stays usable on very short or
// very tall desktop windows.
const MAX_FEED_HEIGHT = 900;
const MIN_FEED_HEIGHT = 420;
const MIN_FEED_WIDTH = 320;
const MAX_FEED_WIDTH = 720;

// Fallback used until the first onLayout fires.
const FALLBACK_FEED_WIDTH = 420;
const FALLBACK_FEED_HEIGHT = FALLBACK_FEED_WIDTH / DEFAULT_FEED_ASPECT_RATIO;

interface Props {
  children: ReactNode;
  currentRoute?: string;
  onNavigate?: (route: string) => void;
  floatingActions?: ReactNode;
  hideContextPanel?: boolean;
  fullWidth?: boolean;
  desktopNavArrows?: ReactNode;
  // ✅ Rail rendered to the right of the rectangle, in the same
  // gutter as the nav arrows (desktop only).
  desktopActionRail?: ReactNode;
  // ✅ Aspect ratio of the *current* post's media (width / height).
  // When supplied, the rectangle sizes itself to this ratio
  // (no cropping), clamped between MIN/MAX. Falls back to 9:16.
  feedAspectRatio?: number;

  // Context Panel props
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

    // Fit the largest box of the *current* aspect ratio inside
    // availW × availH, so the media fills the box edge-to-edge.
    let h = availH;
    let w = h * effectiveAspect;
    if (w > availW) {
      w = availW;
      h = w / effectiveAspect;
    }

    // Clamp to sane desktop bounds.
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

  const showContextPanel = !hideContextPanel && !fullWidth;

  // ✅ Centering math + optional right shift:
  //
  // `centerGroup` = [ rectangle (W) ] [ gutter (G) ], total width W+G.
  // `feedContainer` centers the row, so its left edge would land at
  // (C − W − G) / 2 — putting the rectangle's center at C/2 − G/2,
  // i.e. shifted LEFT by G/2. Adding `marginLeft: G/2` moves the row
  // right by G/2, so the rectangle's center lands on C/2. The extra
  // FEED_RIGHT_SHIFT nudges it further right, past the screen center.
  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={styles.main}>
        <Sidebar currentRoute={currentRoute} onNavigate={onNavigate} />

        <View style={styles.feedContainer}>
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
  // Row: [ rectangle ] [ gutter ]. `feedContainer` centers the row;
  // the inline `marginLeft` compensates for the gutter and applies
  // the extra FEED_RIGHT_SHIFT.
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
  },
  feedWrapper: {
    borderRadius: 12,
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },
  feedWrapperFull: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
  },
  // Right gutter: rail on the LEFT track, nav arrows on the RIGHT
  // track. Both vertically centered against the rectangle.
  rightGutterColumn: {
    width: RIGHT_RAIL_WIDTH,
    marginLeft: 8,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  // Left track: the action rail.
  railSlot: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingRight: 12,
    paddingLeft: 0,
  },
  // Right track: nav arrows, sitting to the RIGHT of the rail.
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