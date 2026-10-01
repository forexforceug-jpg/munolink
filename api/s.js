// api/s.js
// Serves an OG-tagged HTML page for crawlers (WhatsApp, Facebook, etc.),
// AND redirects real browsers straight to the web app at /?post=<id>.

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const FALLBACK_IMAGE =
  'https://placehold.co/1200x630/1A1A2E/4A7DFF/png?text=Munolink';
const WEB_APP_BASE = 'https://www.munolink.com'; // web app root
const APP_SCHEME = 'munolink://';

export default async function handler(req, res) {
  const postId = req.query?.id || extractPostId(req.url);

  if (!postId) {
    return redirectTo(res, WEB_APP_BASE);
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return redirectTo(res, WEB_APP_BASE);
  }

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };

  // Fetch the post
  let post = null;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/catalog?select=id,name,description,images,video_thumbnail,price,price_type,user_id&id=eq.${encodeURIComponent(
        postId
      )}`,
      { headers }
    );
    if (r.ok) {
      const rows = await r.json();
      post = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    }
  } catch (e) {
    console.error('catalog fetch error:', e);
  }

  if (!post) {
    return redirectTo(res, WEB_APP_BASE);
  }

  // Fetch the seller
  let sellerName = 'a seller on Munolink';
  if (post.user_id) {
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/users?select=full_name&id=eq.${encodeURIComponent(
          post.user_id
        )}`,
        { headers }
      );
      if (r.ok) {
        const users = await r.json();
        if (Array.isArray(users) && users[0]?.full_name) {
          sellerName = users[0].full_name;
        }
      }
    } catch (e) {
      console.error('user fetch error:', e);
    }
  }

  const rawImage =
    (Array.isArray(post.images) && post.images[0]) ||
    post.video_thumbnail ||
    FALLBACK_IMAGE;

  const priceStr =
    post.price != null && post.price > 0
      ? `UGX ${Number(post.price).toLocaleString()}`
      : post.price_type === 'showcase'
      ? 'Showcase'
      : post.price_type === 'free'
      ? 'Free'
      : 'Contact for price';

  const title = post.name || 'Munolink Post';
  const description = post.description
    ? String(post.description).slice(0, 140)
    : `${priceStr} - from ${sellerName}`;

  // Where real users should end up
  const webAppUrl = `${WEB_APP_BASE}/?post=${encodeURIComponent(post.id)}`;

  const html = buildHtml({
    title,
    description,
    image: rawImage,
    webAppUrl,
  });

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Short cache so crawlers don't hammer the endpoint, but fresh enough.
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.end(html);
}

function extractPostId(rawUrl) {
  try {
    const u = new URL(rawUrl, 'https://www.munolink.com');
    const m = u.pathname.match(/\/s\/([a-f0-9-]+)/i);
    if (m) return m[1];
    return u.searchParams.get('id') || null;
  } catch {
    return null;
  }
}

function redirectTo(res, url) {
  res.statusCode = 302;
  res.setHeader('Location', url);
  res.end();
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildHtml(o) {
  const t = esc(o.title);
  const d = esc(o.description);
  const i = esc(o.image);
  const web = esc(o.webAppUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${t} | Munolink</title>

  <!-- Open Graph for WhatsApp / Facebook / Twitter / Slack -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Munolink" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:image" content="${i}" />
  <meta property="og:image:secure_url" content="${i}" />
  <meta property="og:image:type" content="image/jpeg" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${t}" />
  <meta name="twitter:description" content="${d}" />
  <meta name="twitter:image" content="${i}" />

  <!-- ✅ Redirect real users straight to the web app -->
  <meta http-equiv="refresh" content="0; url=${web}" />

  <script>
    // Two-pronged redirect: meta refresh for crawlers that don't run JS,
    // and window.location for real browsers.
    window.location.replace(${JSON.stringify(o.webAppUrl)});
  </script>

  <style>
    html,body{margin:0;padding:0;background:#0D0D1A;color:#fff;font-family:-apple-system,system-ui,Roboto,sans-serif;}
    .wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;}
    p{color:#8A8AAE;font-size:14px;}
  </style>
</head>
<body>
  <div class="wrap">
    <p>Opening Munolink…</p>
  </div>
</body>
</html>`;
}