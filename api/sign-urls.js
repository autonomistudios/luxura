import { resolveBrandContext } from '../lib/forge/services/brand-auth.js';
import { getSignedReadUrl, signedUrlFromRef, uploadStorageREST, deleteStorageREST } from '../lib/forge/services/gcp-raw.js';

const BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.VITE_FIREBASE_STORAGE_BUCKET ||
  'autonomi-studios-prod.firebasestorage.app';

/**
 * Signed-URL service for private brand assets.
 *
 *  • GET  — self-contained signing self-test. Round-trips a throwaway object through
 *           sign → fetch → delete and reports whether the V4 signature validated. Reveals
 *           no data; used to prove signing works in prod BEFORE objects are flipped private.
 *  • POST — batch-sign this brand's object paths (auth required, strictly brand-scoped).
 */
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const testPath = `__signtest__/${Date.now()}_${Math.random().toString(36).slice(2)}.txt`;
    try {
      await uploadStorageREST(BUCKET, testPath, Buffer.from('signing-test'), 'text/plain');
      const url  = getSignedReadUrl(BUCKET, testPath, 300);
      const r    = await fetch(url);
      const body = r.ok ? await r.text() : null;
      deleteStorageREST(BUCKET, testPath).catch(() => {});
      return res.status(200).json({ signingWorks: r.ok && body === 'signing-test', httpStatus: r.status });
    } catch (err) {
      deleteStorageREST(BUCKET, testPath).catch(() => {});
      return res.status(500).json({ signingWorks: false, error: err.message });
    }
  }

  if (req.method === 'POST') {
    let ctx;
    try {
      ctx = await resolveBrandContext(req);
    } catch (err) {
      return res.status(err.statusCode || 401).json({ error: err.message || 'Unauthorized' });
    }
    const { brandId } = ctx;

    const { paths } = req.body ?? {};
    if (!Array.isArray(paths)) return res.status(400).json({ error: 'paths[] required' });

    const signed = {};
    for (const p of paths) {
      if (typeof p !== 'string' || !p) continue;
      // Strictly brand-scoped — only sign objects under this brand's namespace.
      signed[p] = p.includes(`brands/${brandId}/`) ? signedUrlFromRef(BUCKET, p, 3600) : null;
    }
    return res.status(200).json({ signed });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
