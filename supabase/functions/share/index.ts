// @ts-nocheck
// supabase/functions/share/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const APP_SCHEME = 'munolink://';       // your deep-link scheme
const FALLBACK_IMAGE = 'https://<your-domain>/fallback-og.jpg';

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const postId = url.searchParams.get('postId');

    if (!postId) {
      return htmlResponse(buildHtml({
        title: 'Munolink',
        description: 'Discover opportunities near you',
        image: FALLBACK_IMAGE,
        targetUrl: 'https://<your-domain>',
      }));
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: post } = await supabase
      .from('catalog')
      .select(
        'id, name, description, images, video_thumbnail, price, currency, user_id, users:user_id (full_name, avatar_url)'
      )
      .eq('id', postId)
      .maybeSingle();

    if (!post) {
      return htmlResponse(
        buildHtml({
          title: 'Post not found',
          description: 'This post may have been removed',
          image: FALLBACK_IMAGE,
          targetUrl: 'https://<your-domain>',
        }),
        404
      );
    }

    const image =
      (post.images && post.images[0]) ||
      post.video_thumbnail ||
      FALLBACK_IMAGE;

    const sellerName =
      (post as any)?.users?.full_name || 'a seller on Munolink';

    const priceStr =
      post.price != null && post.price > 0
        ? `${post.currency || 'UGX'} ${Number(post.price).toLocaleString()}`
        : 'Free';

    const title = post.name || 'Munolink Post';
    const description = post.description
      ? post.description.slice(0, 140)
      : `${priceStr} · from ${sellerName}`;

    // Deep link back into the app; falls back to web if not installed.
    const targetUrl = `${APP_SCHEME}post/${post.id}`;

    return htmlResponse(
      buildHtml({ title, description, image, targetUrl })
    );
  } catch (err) {
    console.error('share function error:', err);
    return htmlResponse(
      buildHtml({
        title: 'Munolink',
        description: 'Discover opportunities near you',
        image: FALLBACK_IMAGE,
        targetUrl: 'https://<your-domain>',
      }),
      500
    );
  }
});

function htmlResponse(html: string, status = 200) {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Let WhatsApp/CDN caches refresh
      'Cache-Control': 'public, max-age=300',
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
  <title>${t} · Munolink</title>

  <!-- Open Graph (WhatsApp, Facebook, Slack, LinkedIn) -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Munolink" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:image" content="${i}" />
  <meta property="og:image:secure_url" content="${i}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${t}" />
  <meta name="twitter:description" content="${d}" />
  <meta name="twitter:image" content="${i}" />

  <!-- Minimal dark preview when a human opens it -->
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0D0D1A" />

  <style>
    html, body { margin: 0; padding: 0; background: #0D0D1A; color: #fff;
                 font-family: -apple-system, system-ui, Roboto, sans-serif; }
    .wrap { min-height: 100vh; display: flex; flex-direction: column;
            align-items: center; justify-content: center; padding: 24px;
            text-align: center; }
    img { max-width: 100%; border-radius: 12px; margin-bottom: 16px; }
    h1 { font-size: 20px; margin: 0 0 8px; }
    p  { color: #8A8AAE; margin: 0 0 24px; max-width: 380px; }
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

  <!-- Redirect real human visitors into the app after a moment -->
  <script>
    setTimeout(function () {
      window.location.href = ${JSON.stringify(opts.targetUrl)};
    }, 1200);
  </script>
</body>
</html>`;
}