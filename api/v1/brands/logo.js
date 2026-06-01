/**
 * api/v1/brands/logo.js
 * POST   /api/v1/brands/logo — upload brand logo
 * DELETE /api/v1/brands/logo — remove brand logo
 */
import { resolveBrandContext, requireRole } from '../../../lib/forge/services/brand-auth.js';
import { updateBrandLogo } from '../../../lib/forge/services/brand-service.js';
import { uploadStorageREST, deleteStorageREST } from '../../../lib/forge/services/gcp-raw.js';

export default async function handler(req, res) {
  let ctx;
  try { ctx = await resolveBrandContext(req); }
  catch (err) { return res.status(err.statusCode || 401).json({ error: err.message }); }

  try { requireRole(ctx, 'admin'); }
  catch (err) { return res.status(403).json({ error: err.message }); }

  const { brandId } = ctx;
  const bucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET;

  if (req.method === 'POST') {
    const { logoBase64, mimeType = 'image/png' } = req.body || {};
    if (!logoBase64) return res.status(400).json({ error: 'logoBase64 is required' });

    // Validate mime type
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowed.includes(mimeType)) return res.status(400).json({ error: 'Invalid file type. Allowed: PNG, JPG, SVG, WebP' });

    const clean  = logoBase64.includes(',') ? logoBase64.split(',')[1] : logoBase64;
    const buffer = Buffer.from(clean, 'base64');

    if (buffer.length > 2 * 1024 * 1024) return res.status(400).json({ error: 'Logo must be under 2MB' });

    const ext  = mimeType.includes('svg') ? 'svg' : mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    const path = `brands/${brandId}/logo.${ext}`;

    const logoUrl = await uploadStorageREST(bucket, path, buffer, mimeType);
    await updateBrandLogo(brandId, logoUrl);

    console.log(`[LOGO] Uploaded for brand ${brandId}: ${logoUrl}`);
    return res.status(200).json({ logoUrl });
  }

  if (req.method === 'DELETE') {
    // Try all possible extensions
    for (const ext of ['png', 'jpg', 'jpeg', 'svg', 'webp']) {
      await deleteStorageREST(bucket, `brands/${brandId}/logo.${ext}`).catch(() => {});
    }
    await updateBrandLogo(brandId, null);
    return res.status(200).json({ removed: true });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
