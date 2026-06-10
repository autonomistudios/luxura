import { getGcpAccessToken } from '../lib/forge/services/gcp-raw.js';

/**
 * Server-side download proxy.
 *
 * The browser cannot blob-fetch our Cloud Storage objects directly:
 * storage.googleapis.com sends no CORS headers, so client-side `fetch(url).blob()`
 * is blocked and "Download" silently degrades to opening the image in a new tab.
 *
 * This endpoint fetches the object server-side (service-account authenticated, no
 * CORS in play) and streams it back same-origin with `Content-Disposition: attachment`,
 * so the browser saves it as a real file. Reused by single-plate download, the
 * Download-All ZIP, and the lightbox.
 *
 * SSRF guard: only proxies objects from our own Cloud Storage hosts + bucket.
 */
const ALLOWED_HOSTS = new Set(['storage.googleapis.com', 'firebasestorage.googleapis.com']);

export default async function handler(req, res) {
  const { u, n } = req.query ?? {};
  if (!u || typeof u !== 'string') {
    return res.status(400).json({ error: 'Missing url param (u)' });
  }

  let target;
  try { target = new URL(u); } catch { return res.status(400).json({ error: 'Invalid url' }); }

  const bucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || '';
  const ours = ALLOWED_HOSTS.has(target.hostname) && (!bucket || target.pathname.includes(`/b/${bucket}/`) || target.pathname.includes(bucket));
  if (!ours) {
    return res.status(403).json({ error: 'Forbidden: only this project\'s storage objects may be proxied' });
  }

  try {
    const { token } = await getGcpAccessToken();
    const upstream = await fetch(target.toString(), { headers: { Authorization: `Bearer ${token}` } });
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Upstream responded ${upstream.status}` });
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const buf = Buffer.from(await upstream.arrayBuffer());

    const filename = (typeof n === 'string' && n ? n : 'download')
      .replace(/[^a-z0-9._-]+/gi, '-')   // header-injection / path safety
      .slice(0, 120);

    res.status(200);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.end(buf);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Download proxy failed' });
  }
}
