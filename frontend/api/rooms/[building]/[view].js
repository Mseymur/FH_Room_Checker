const ALLOWED_VIEWS = new Set(['now', 'schedule']);
const BUILDING_PATTERN = /^[A-Za-z0-9]+$/;

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const backendBaseUrl = (process.env.BACKEND_API_URL || '').replace(/\/+$/, '');
  const internalSecret = process.env.INTERNAL_API_SECRET || '';
  const { building, view } = req.query;

  if (!backendBaseUrl || !internalSecret) {
    return res.status(500).json({ error: 'Proxy is not configured' });
  }

  if (typeof building !== 'string' || !BUILDING_PATTERN.test(building)) {
    return res.status(400).json({ error: 'Invalid building code' });
  }

  if (typeof view !== 'string' || !ALLOWED_VIEWS.has(view)) {
    return res.status(404).json({ error: 'Not Found' });
  }

  const upstreamUrl = new URL(`${backendBaseUrl}/rooms/${building}/${view}`);

  for (const [key, value] of Object.entries(req.query)) {
    if (key === 'building' || key === 'view' || value == null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        upstreamUrl.searchParams.append(key, item);
      }
      continue;
    }

    upstreamUrl.searchParams.set(key, value);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Internal-Api-Secret': internalSecret,
      },
    });

    const body = await upstream.text();
    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';

    res.status(upstream.status);
    res.setHeader('Content-Type', contentType);

    const rateLimitRemaining = upstream.headers.get('x-ratelimit-remaining');
    if (rateLimitRemaining) {
      res.setHeader('X-RateLimit-Remaining', rateLimitRemaining);
    }

    return res.send(body);
  } catch (error) {
    console.error('[rooms proxy] upstream request failed', error);
    return res.status(502).json({ error: 'Upstream request failed' });
  }
};
