// api/s.js
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  const postId = req.query.id;

  if (!postId) {
    res.status(404).send('Not found');
    return;
  }

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };

  // Get the post
  const postRes = await fetch(
    `${SUPABASE_URL}/rest/v1/catalog?select=id,name,description,images,video_thumbnail,price,price_type,user_id&id=eq.${postId}`,
    { headers }
  );
  const posts = await postRes.json();
  const post = posts[0];

  if (!post) {
    res.status(404).send('Post not found');
    return;
  }

  // Get the seller's name
  let sellerName = 'Munolink';
  if (post.user_id) {
    const userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?select=full_name&id=eq.${post.user_id}`,
      { headers }
    );
    const users = await userRes.json();
    if (users[0]?.full_name) sellerName = users[0].full_name;
  }

  const image = post.images?.[0] || post.video_thumbnail || '';
  const price =
    post.price > 0
      ? `UGX ${post.price.toLocaleString()}`
      : post.price_type === 'free'
      ? 'Free'
      : post.price_type === 'showcase'
      ? 'Showcase'
      : 'Contact for price';

  const title = post.name || 'Munolink Post';
  const description = post.description || `${price} - from ${sellerName}`;

  // Send back an HTML page with OG tags
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title} | Munolink</title>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
</head>
<body style="background:#0D0D1A;color:white;font-family:sans-serif;text-align:center;padding:40px;">
  <img src="${image}" style="max-width:100%;border-radius:12px;" />
  <h1>${title}</h1>
  <p>${description}</p>
  <a href="munolink://post/${post.id}" style="display:inline-block;padding:12px 24px;background:#4A7DFF;color:white;text-decoration:none;border-radius:12px;">Open in Munolink</a>
</body>
</html>
  `);
}