export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const key = process.env.SYNC_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Missing SYNC_API_KEY environment variable' });
  }

  try {
    const response = await fetch(
      `https://room.luigitonno.at/api/sync?key=${encodeURIComponent(key)}`
    );
    return res.status(200).json({ success: true, upstreamStatus: response.status });
  } catch (error) {
    return res.status(500).json({ error: 'Sync request failed', message: error.message });
  }
}
