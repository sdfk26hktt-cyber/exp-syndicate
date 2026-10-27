/**
 * Serverless API endpoint to resolve media shortlinks & redirects (such as canva.link)
 * so they can be converted into iframe-embeddable URLs on the client.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let targetUrl = '';
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      targetUrl = body.url || '';
    } catch (_err) {
      targetUrl = '';
    }
  } else {
    targetUrl = req.query?.url || '';
  }

  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  targetUrl = targetUrl.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://${targetUrl}`;
  }

  try {
    new URL(targetUrl);
  } catch (_err) {
    return res.status(400).json({ error: 'Invalid URL provided' });
  }

  try {
    // Try HEAD request first for speed
    const headRes = await fetch(targetUrl, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const finalUrl = headRes.url || targetUrl;
    return res.status(200).json({
      originalUrl: targetUrl,
      resolvedUrl: finalUrl
    });
  } catch (headErr) {
    // If HEAD fails (some servers reject HEAD), fallback to GET
    try {
      const getRes = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      return res.status(200).json({
        originalUrl: targetUrl,
        resolvedUrl: getRes.url || targetUrl
      });
    } catch (getErr) {
      console.error('Error resolving media URL:', getErr);
      return res.status(500).json({
        error: 'Failed to resolve URL redirect',
        details: getErr.message
      });
    }
  }
}
