const ALLOWED_VIEWS = new Set(['now', 'schedule']);
const ALLOWED_BUILDINGS = new Set([
  'AP152',
  'AP147',
  'AP149',
  'AP154',
  'EA11',
  'EA9',
  'EA13',
  'ES30I',
  'ES7A',
  'ES7B',
]);
const BUILDING_PATTERN = /^[A-Za-z0-9]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}(:\d{2})?$/;

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0].split(',')[0].trim();
  }

  return '';
}

function setCacheHeaders(res, view) {
  if (view === 'schedule') {
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return;
  }

  res.setHeader('Cache-Control', 'public, s-maxage=20, stale-while-revalidate=40');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const backendBaseUrl = (process.env.BACKEND_API_URL || '').replace(/\/+$/, '');
  const internalSecret = process.env.INTERNAL_API_SECRET || '';
  const { building, view, date, time, ...unexpectedParams } = req.query;

  if (!backendBaseUrl || !internalSecret) {
    return res.status(500).json({ error: 'Proxy is not configured' });
  }

  if (typeof building !== 'string' || !BUILDING_PATTERN.test(building)) {
    return res.status(400).json({ error: 'Invalid building code' });
  }

  const normalizedBuilding = building.toUpperCase();
  if (!ALLOWED_BUILDINGS.has(normalizedBuilding)) {
    return res.status(404).json({ error: 'Building not supported' });
  }

  if (typeof view !== 'string' || !ALLOWED_VIEWS.has(view)) {
    return res.status(404).json({ error: 'Not Found' });
  }

  if (Object.keys(unexpectedParams).length > 0) {
    return res.status(400).json({ error: 'Unexpected query parameters' });
  }

  if (date != null && (typeof date !== 'string' || !DATE_PATTERN.test(date))) {
    return res.status(400).json({ error: 'Invalid date format' });
  }

  if (view === 'now' && time != null && (typeof time !== 'string' || !TIME_PATTERN.test(time))) {
    return res.status(400).json({ error: 'Invalid time format' });
  }

  if (view === 'schedule' && time != null) {
    return res.status(400).json({ error: 'Time is not supported for schedule requests' });
  }

  const upstreamUrl = new URL(`${backendBaseUrl}/rooms/${normalizedBuilding}/${view}`);

  if (date) {
    upstreamUrl.searchParams.set('date', date);
  }

  if (view === 'now' && time) {
    upstreamUrl.searchParams.set('time', time);
  }

  try {
    setCacheHeaders(res, view);

    const upstream = await fetch(upstreamUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Internal-Api-Secret': internalSecret,
        'X-Client-IP': getClientIp(req),
        'X-Forwarded-User-Agent': req.headers['user-agent'] || '',
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
