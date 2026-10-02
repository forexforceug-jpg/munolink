// src/hooks/useDeepLinks.ts
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { navigationRef } from '../navigation/navigationRef';

/**
 * Parse an incoming URL and route the app to the right screen.
 *
 * Supported shapes:
 *   https://www.munolink.com/s/<postId>
 *   https://www.munolink.com/post/<postId>          (legacy)
 *   munolink://s/<postId>
 *   munolink://post/<postId>
 *
 * Anything else is ignored.
 */
function handleUrl(url: string | null) {
  if (!url) return;

  // If the navigator isn't mounted yet (very first launch),
  // retry shortly so we don't drop the link.
  if (!navigationRef.isReady()) {
    setTimeout(() => handleUrl(url), 300);
    return;
  }

  try {
    const parsed = Linking.parse(url);
    const path = (parsed.path || '').replace(/^\/+/, '');
    const segments = path.split('/').filter(Boolean);

    // Match /s/<id> or /post/<id>
    if (
      (segments[0] === 's' || segments[0] === 'post') &&
      segments[1]
    ) {
      const postId = segments[1];

      // Route into MainTabs → Discover (Feed) with openPostId set.
      // FeedScreen reads `route.params.openPostId` and scrolls to it.
      navigationRef.navigate('MainTabs', {
        screen: 'Discover',
        params: { openPostId: postId },
      } as any);

      return;
    }

    if (__DEV__) {
      console.log('🔗 Unhandled deep link:', url);
    }
  } catch (err) {
    if (__DEV__) console.warn('Deep link parse failed:', err);
  }
}

/**
 * Handles:
 *   - cold start (app was opened from a link while closed)
 *   - warm start (app was already running and received a link)
 *   - web navigation: reads window.location and listens to popstate
 */
export function useDeepLinks() {
  useEffect(() => {
    // Native cold + warm start
    if (Platform.OS !== 'web') {
      Linking.getInitialURL().then(handleUrl).catch(() => {});

      const sub = Linking.addEventListener('url', (event) => {
        handleUrl(event.url);
      });

      return () => sub.remove();
    }

    // Web: handle initial URL and back/forward navigation
    if (typeof window === 'undefined') return;

    const tryHandleWeb = () => {
      if (!navigationRef.isReady()) {
        setTimeout(tryHandleWeb, 200);
        return;
      }
      handleUrl(window.location.href);
    };

    tryHandleWeb();

    const onPop = () => handleUrl(window.location.href);
    window.addEventListener('popstate', onPop);

    return () => {
      window.removeEventListener('popstate', onPop);
    };
  }, []);
}