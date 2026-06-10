import { setFirestoreREST, uploadStorageREST, getGcpAccessToken } from '../lib/forge/services/gcp-raw.js';
import { resolveBrandContext } from '../lib/forge/services/brand-auth.js';

const BUCKET_NAME =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.VITE_FIREBASE_STORAGE_BUCKET ||
  'autonomi-studios-prod.firebasestorage.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // Resolve uid + brandId server-side from the session — never trust a client-supplied brandId.
  let ctx;
  try {
    ctx = await resolveBrandContext(req);
  } catch (err) {
    return res.status(err.statusCode || 401).json({ error: err.message || 'Unauthorized' });
  }
  const { uid, brandId } = ctx;

  try {
    const { item } = req.body ?? {};
    if (!item || !item.id || !item.image) {
      return res.status(400).json({ error: 'Missing vault item payload' });
    }

    // Persist the image to a permanent, brand-scoped location. The forge streams ephemeral
    // `forge-live/…` URLs; storing those in the vault would rot once they're cleaned up. So
    // re-host EVERY image (data-URL or live Storage URL) under brands/{brandId}/vault — the
    // saved campaign becomes permanent and self-contained.
    let buffer;
    let contentType = 'image/jpeg';

    if (item.image.startsWith('data:')) {
      const match = item.image.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
      if (!match) throw new Error('Invalid base64 image format');
      contentType = match[1];
      buffer = Buffer.from(match[2], 'base64');
    } else {
      // Remote Storage URL (e.g. forge-live) — fetch the bytes server-side (SA auth, no CORS).
      const { token } = await getGcpAccessToken();
      const r = await fetch(item.image, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error(`Could not fetch source image (${r.status})`);
      contentType = r.headers.get('content-type') || 'image/jpeg';
      buffer = Buffer.from(await r.arrayBuffer());
    }

    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const storagePath = `brands/${brandId}/vault/${item.id}.${ext}`;
    const imageUrl = await uploadStorageREST(BUCKET_NAME, storagePath, buffer, contentType);

    const finalItem = {
      ...item,
      image:       imageUrl,
      storagePath,
      brandId,
      uid,
      createdAt:   item.createdAt || Date.now(),
    };

    // Write to the SAME collection the portal reads from (brands/{brandId}/vault) — this was
    // the bug: writes went to users/{uid}/vault, so saves never appeared in the Asset Vault.
    await setFirestoreREST(`brands/${brandId}/vault`, item.id, finalItem);

    return res.status(200).json({ success: true, item: finalItem });

  } catch (err) {
    console.error('[VAULT DEPLOY ERROR]', err);
    return res.status(500).json({ error: err.message || 'Vault save failed' });
  }
}
