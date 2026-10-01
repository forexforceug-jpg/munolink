// src/utils/screenShell.tsx
//
// Universal responsive layout shell.
//
// ─ Reads safe-area insets on native.
// ─ Reads CSS env(safe-area-inset-*) on web (RN's lib doesn't).
// ─ Reads tab-bar height from ONE place so the shell and the tab bar
//   never disagree.
// ─ Provides the resolved content rectangle to children via context,
//   so components (like the feed's cards or the editor's overlay
//   layer) can position themselves without hardcoded offsets.

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBreakpoint } from '../hooks/useBreakpoint';

// ============================================================
// Tab-bar constants — the single source of truth
// ============================================================
export const BASE_TAB_HEIGHT = 60;

// Minimum bottom buffer to keep UI clear of browser chrome on web
// (Safari URL bar, Chrome gesture area, etc.).
const WEB_BOTTOM_BUFFER = 12;

// ============================================================
// Web-safe-area helpers
// ============================================================
let cachedWebSafeArea: {
  top: number;
  bottom: number;
  left: number;
  right: number;
} | null = null;

function readWebSafeArea() {
  if (cachedWebSafeArea) return cachedWebSafeArea;

  const fallback = { top: 0, bottom: 0, left: 0, right: 0 };

  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    cachedWebSafeArea = fallback;
    return fallback;
  }

  try {
    const probe = document.createElement('div');
    probe.style.position = 'fixed';
    probe.style.top = '0';
    probe.style.left = '0';
    probe.style.width = '0';
    probe.style.height = '0';
    probe.style.paddingTop = 'env(safe-area-inset-top, 0px)';
    probe.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
    probe.style.paddingLeft = 'env(safe-area-inset-left, 0px)';
    probe.style.paddingRight = 'env(safe-area-inset-right, 0px)';
    probe.style.pointerEvents = 'none';
    probe.style.visibility = 'hidden';
    document.body.appendChild(probe);

    const styles = window.getComputedStyle(probe);
    const top = parseFloat(styles.paddingTop) || 0;
    const bottom = parseFloat(styles.paddingBottom) || 0;
    const left = parseFloat(styles.paddingLeft) || 0;
    const right = parseFloat(styles.paddingRight) || 0;

    document.body.removeChild(probe);

    cachedWebSafeArea = { top, bottom, left, right };
    return cachedWebSafeArea;
  } catch {
    cachedWebSafeArea = fallback;
    return fallback;
  }
}

// ============================================================
// Context
// ============================================================
type ShellInsets = {
  /** Space to reserve at the top (status bar / notch / browser chrome). */
  top: number;
  /** Space to reserve at the bottom (home indicator / tab bar / browser). */
  bottom: number;
  left: number;
  right: number;
};

type ShellSize = {
  /** Width of the content area the shell provides. */
  width: number;
  /** Height of the content area the shell provides. */
  height: number;
};

type ScreenShellContextValue = {
  insets: ShellInsets;
  contentSize: ShellSize;
  /** Height of the tab bar (0 on desktop or if the shell is full-bleed). */
  tabBarHeight: number;
  isDesktop: boolean;
};

const ScreenShellContext = createContext<ScreenShellContextValue | null>(null);

export function useScreenShell(): ScreenShellContextValue {
  const ctx = useContext(ScreenShellContext);
  if (!ctx) {
    throw new Error(
      'useScreenShell() must be called from inside a <ScreenShell>.'
    );
  }
  return ctx;
}

// ============================================================
// ScreenShell
// ============================================================
interface ScreenShellProps {
  children: React.ReactNode;
  /**
   * Include the top safe area as padding. Turn off if your screen
   * already renders its own full-bleed header.
   * Default: true.
   */
  includeTopSafeArea?: boolean;

  /**
   * Include space at the bottom for the tab bar.
   * - true  → reserve exactly the tab bar height (feeds, explore, etc.)
   * - false → reserve only the device / browser safe-area inset
   * Default: true.
   */
  includeTabBar?: boolean;

  /**
   * Background colour for the shell. Defaults to transparent so the
   * caller's own backgrounds show through.
   */
  backgroundColor?: string;

  /**
   * If true, the shell fills the whole screen and the content area
   * equals the inner region (minus insets and tab bar). If false, the
   * shell fills whatever space its parent gives it.
   * Default: true.
   */
  fullScreen?: boolean;

  style?: any;
}

export const ScreenShell: React.FC<ScreenShellProps> = ({
  children,
  includeTopSafeArea = true,
  includeTabBar = true,
  backgroundColor,
  fullScreen = true,
  style,
}) => {
  const nativeInsets = useSafeAreaInsets();
  const { isDesktop } = useBreakpoint();
  const windowDims = Dimensions.get('window');

  // On web we supplement the native insets with the CSS env() values.
  const webSafe = useMemo(() => readWebSafeArea(), []);
  const insets = useMemo<ShellInsets>(
    () => ({
      top: Math.max(nativeInsets.top || 0, webSafe.top),
      bottom: Math.max(nativeInsets.bottom || 0, webSafe.bottom),
      left: Math.max(nativeInsets.left || 0, webSafe.left),
      right: Math.max(nativeInsets.right || 0, webSafe.right),
    }),
    [nativeInsets, webSafe]
  );

  // The tab bar occupies BASE_TAB_HEIGHT plus the bottom inset plus,
  // on web, an extra buffer to clear browser chrome.
  const tabBarHeight = useMemo(() => {
    if (isDesktop || !includeTabBar) return 0;
    const buffer = Platform.OS === 'web' ? WEB_BOTTOM_BUFFER : 0;
    return BASE_TAB_HEIGHT + insets.bottom + buffer;
  }, [isDesktop, includeTabBar, insets.bottom]);

  // ---- Track our own layout so children can size themselves ----
  const [layout, setLayout] = useState<ShellSize>({
    width: windowDims.width,
    height: windowDims.height,
  });

  const contentSize = useMemo<ShellSize>(() => {
    const paddingTop = includeTopSafeArea ? insets.top : 0;
    const paddingBottom = tabBarHeight;
    const paddingLeft = insets.left;
    const paddingRight = insets.right;

    return {
      width: Math.max(0, layout.width - paddingLeft - paddingRight),
      height: Math.max(0, layout.height - paddingTop - paddingBottom),
    };
  }, [
    layout.width,
    layout.height,
    insets.top,
    insets.left,
    insets.right,
    tabBarHeight,
    includeTopSafeArea,
  ]);

  const contextValue = useMemo<ScreenShellContextValue>(
    () => ({
      insets,
      contentSize,
      tabBarHeight,
      isDesktop,
    }),
    [insets, contentSize, tabBarHeight, isDesktop]
  );

  return (
    <ScreenShellContext.Provider value={contextValue}>
      <View
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setLayout({ width, height });
        }}
        style={[
          fullScreen && styles.fullScreen,
          backgroundColor ? { backgroundColor } : null,
          {
            paddingTop: includeTopSafeArea ? insets.top : 0,
            paddingBottom: tabBarHeight,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
          style,
        ]}
      >
        {children}
      </View>
    </ScreenShellContext.Provider>
  );
};

// ============================================================
// Styles
// ============================================================
const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
});

// ============================================================
// Convenience: a hook that just gives you the current tab bar height
// (useful outside the shell, e.g. in the TabNavigator itself)
// ============================================================
export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useBreakpoint();
  const webSafe = useMemo(() => readWebSafeArea(), []);

  return useMemo(() => {
    if (isDesktop) return 0;
    const bottom = Math.max(insets.bottom || 0, webSafe.bottom);
    const buffer = Platform.OS === 'web' ? WEB_BOTTOM_BUFFER : 0;
    return BASE_TAB_HEIGHT + bottom + buffer;
  }, [isDesktop, insets.bottom, webSafe.bottom]);
}