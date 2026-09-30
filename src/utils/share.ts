// src/utils/share.ts
import { Share, Platform } from 'react-native';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://ffbjvrwkvnwocuyapajo.supabase.co';

/**
 * Public URL that serves OG meta tags for a given catalog post.
 * WhatsApp/Facebook scrape this URL to build the preview card.
 */
export function getShareUrl(postId: string): string {
  return `${SUPABASE_URL}/functions/v1/share?postId=${encodeURIComponent(
    postId
  )}`;
}

export interface SharePostInfo {
  id: string;
  title?: string | null;
  price?: number | null;
  currency?: string | null;
  sellerName?: string | null;
}

export async function sharePost(info: SharePostInfo): Promise<void> {
  const url = getShareUrl(info.id);

  const priceStr =
    info.price != null && info.price > 0
      ? `${info.currency || 'UGX'} ${Number(info.price).toLocaleString()}`
      : 'Free';

  const lines = [
    `🛍️ ${info.title || 'Check this out on Munolink'}`,
    info.sellerName ? `👤 ${info.sellerName}` : null,
    `💰 ${priceStr}`,
    '',
    url,
  ].filter((x): x is string => x !== null);

  const message = lines.join('\n');

  if (Platform.OS === 'ios') {
    await Share.share({ message, url });
  } else {
    await Share.share({
      message,
      title: info.title || 'Munolink',
    });
  }
}