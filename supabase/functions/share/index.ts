// @ts-nocheck
// supabase/functions/share/index.ts
//
// Public OG-tag endpoint for Munolink post sharing.
//
// Usage:
//   GET /functions/v1/share?postId=<catalog-post-uuid>
//
// Deploy with:
//   supabase functions deploy share --no-verify-jwt
//
// Why --no-verify-jwt:
//   WhatsApp / Facebook / Slack / Telegram crawlers do NOT send an
//   Authorization header. Without the flag, the gateway rejects them
//   with "unauthorized-no-auth-header" before this code ever runs.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================
// CONFIG
// ============================================================
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Deep link scheme that the app registers in app.json.
const APP_SCHEME = 'munolink://';

// Used when a post has no image, or when the post can't be found.
const FALLBACK_IMAGE =
  'https://placehold.co/1200x630/1A1A2E/4A7DFF/png?text=Munolink';

// Where a real user should be sent if the deep link fails.
// Replace with your real marketing/landing page if you have one.
const WEB_FALLBACK_URL = 'https://munolink.app';

// ============================================================
// SERVER
// ============================================================
serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const postId = url.searchParams.get('postId');

    // ---------- No postId: show generic Munolink card ----------
    if (!postId) {
      return htmlResponse(
        buildHtml({
          title: 'Munolink',
          description: 'Discover opportunities near you',
          image: FALLBACK_IMAGE,
          targetUrl: WEB_FALLBACK_URL,
        })
      );
    }

    // ---------- Service role: bypasses RLS so any post can be shared ----------
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ---------- Query 1: the post itself ----------
    // ✅ Do NOT select `currency` — the column does not exist on catalog.
    //    Currency is always UGX in this app, so we hardcode it below.
    // ✅ No embedded `users:user_id (...)` join — the FK exists but
    //    PostgREST sometimes returns null for the whole row when the
    //    embed can't be resolved, causing a false "Post not found".
    const { data: post, error: postError } = await supabase
      .from('catalog')
      .select(
        'id, name, description, images, video_thumbnail, price, price_type, user_id'
      )
      .eq('id', postId)
      .maybeSingle();

    console.log('catalog query:', {
      postId,
      postError: postError?.message ?? null,
      found: !!post,
    });

    if (postError) {
      // Something genuinely broke — surface a minimal error page.
      return htmlResponse(
        buildHtml({
          title: 'Unable to load post',
          description: 'Please try again in a moment.',
          image: FALLBACK_IMAGE,
          targetUrl: WEB_FALLBACK_URL,
        }),
        500
      );
    }

    if (!post) {
      return htmlResponse(
        buildHtml({
          title: 'Post not found',
          description: 'This post may have been removed',
          image: FALLBACK_IMAGE,
          targetUrl: WEB_FALLBACK_URL,
        }),
        404
      );
    }

    // ---------- Query 2: the seller (separate request, safe) ----------
    let sellerName = 'a seller on Munolink';
    if (post.user_id) {
      const { data: seller } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', post.user_id)
        .maybeSingle();
      if (seller?.full_name) sellerName = seller.full_name;
    }

    // ---------- Build the OG image URL ----------
    const rawImage =
      (Array.isArray(post.images) && post.images[0]) ||
      post.video_thumbnail ||
      FALLBACK_IMAGE;

    const image = transformToOgImage(rawImage);

    // ---------- Build the price line ----------
    // Currency is not a column on catalog; the app is UGX-only.
    const priceStr =
      post.price != null && post.price > 0
        ? `UGX ${Number(post.price).toLocaleString()}`
        : post.price_type === 'showcase'
        ? 'Showcase'
        : post.price_type === 'free'
        ? 'Free'
        : 'Contact for price';

    // ---------- Title + description ----------
    const title = post.name || 'Munolink Post';
    const description = post.description
      ? String(post.description).slice(0, 140)
      : `${priceStr} · from ${sellerName}`;

    // ---------- Deep link back into the app ----------
    const targetUrl = `${APP_SCHEME}post/${post.id}`;

    return htmlResponse(buildHtml({ title, description, image, targetUrl }));
  } catch (err) {
    console.error('share fn error:', err);
    return htmlResponse(
      buildHtml({
        title: 'Munolink',
        description: 'Discover opportunities near you',
        image: FALLBACK_IMAGE,
        targetUrl: WEB_FALLBACK_URL,
      }),
      500
    );
  }
});

// ============================================================
// HELPERS
// ============================================================

/**
 * Convert a Supabase storage public URL into a 1200×630 JPEG
 * suitable for WhatsApp / Facebook OG previews.
 *
 * If image transformation isn't enabled on the project, the raw
 * URL is returned unchanged — WhatsApp may still accept it if the
 * file is small enough, but the transformed URL is the reliable path.
 */
function transformToOgImage(rawUrl: string): string {
  if (!rawUrl) return FALLBACK_IMAGE;

  const marker = '/storage/v1/object/public/';
  if (rawUrl.indexOf(marker) === -1) return rawUrl;

  return (
    rawUrl.replace(marker, '/storage/v1/render/image/public/') +
    '?width=1200&height=630&resize=cover&quality=80&format=jpeg'
  );
}

function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildHtml(opts: {
  title: string;
  description: string;
  image: string;
  targetUrl: string;
}): string {
  const t = escapeHtml(opts.title);
  const d = escapeHtml(opts.description);
  const i = escapeHtml(opts.image);
  const u = escapeHtml(opts.targetUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${t} | Munolink</title>

  <!-- Open Graph (WhatsApp, Facebook, Slack, LinkedIn, Telegram) -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Munolink" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:image" content="${i}" />
  <meta property="og:image:secure_url" content="${i}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/jpeg" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${t}" />
  <meta name="twitter:description" content="${d}" />
  <meta name="twitter:image" content="${i}" />

  <!-- Mobile / theming -->
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0D0D1A" />

  <style>
    html, body { margin: 0; padding: 0; background: #0D0D1A; color: #fff;
                 font-family: -apple-system, system-ui, Roboto, sans-serif; }
    .wrap { min-height: 100vh; display: flex; flex-direction: column;
            align-items: center; justify-content: center; padding: 24px;
            text-align: center; }
    img { max-width: 100%; border-radius: 12px; margin-bottom: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
    h1 { font-size: 20px; margin: 0 0 8px; }
    p  { color: #8A8AAE; margin: 0 0 24px; max-width: 380px;
         line-height: 1.5; }
    a.btn { display: inline-block; padding: 12px 20px; border-radius: 12px;
            background: #4A7DFF; color: #fff; text-decoration: none;
            font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrap">
    <img src="${i}" alt="" />
    <h1>${t}</h1>
    <p>${d}</p>
    <a class="btn" href="${u}">Open in Munolink</a>
  </div>

  <!-- Try the deep link for human visitors, then fall back to web -->
  <script>
    (function () {
      var deepLink = ${JSON.stringify(opts.targetUrl)};
      var webFallback = ${JSON.stringify(WEB_FALLBACK_URL)};
      setTimeout(function () {
        try {
          window.location.href = deepLink;
          // If the app isn't installed, browsers just do nothing on a
          // custom scheme — leave the page as-is so the user still sees
          // the "Open in Munolink" button.
        } catch (e) {
          window.location.href = webFallback;
        }
      }, 1200);
    })();
  </script>
</body>
</html>`;
}