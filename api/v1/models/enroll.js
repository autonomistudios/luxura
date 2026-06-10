import crypto from 'crypto';
import sharp from 'sharp';
import { resolveBrandContext } from '../../../lib/forge/services/brand-auth.js';
import { setFirestoreREST } from '../../../lib/forge/services/gcp-raw.js';

/**
 * Enroll a reusable MODEL — a locked identity that can be injected into any wardrobe SKU.
 *
 * Stored in the SAME brands/{brandId}/skus collection as garments (so it inherits the
 * existing read rules — no Firestore-rules deploy needed) but tagged assetType:'model'.
 * The garment pickers filter these out; the campaign "inject model" picker filters them in.
 *
 * Identity is anchored by the PHOTO (referenceImageB64) — the strongest lock (K3). A minimal
 * dna.identity is stored so loadSkuForForge accepts it on recall.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  let ctx;
  try {
    ctx = await resolveBrandContext(req);
  } catch (err) {
    return res.status(err.statusCode || 401).json({ error: err.message || 'Unauthorized' });
  }
  const { brandId } = ctx;

  try {
    const { name, image } = req.body ?? {};
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Model photo required' });
    }

    const b64 = image.includes(',') ? image.split(',')[1] : image;
    const buf = Buffer.from(b64.replace(/\s/g, ''), 'base64');
    // Compact identity reference stored inline for forge recall (no Storage round-trip).
    const compressed = await sharp(buf)
      .resize({ width: 768, withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();
    const referenceImageB64 = compressed.toString('base64');

    const skuId = `model_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now   = new Date().toISOString();
    const cleanName = (typeof name === 'string' && name.trim() ? name.trim() : 'Model').slice(0, 60);

    const doc = {
      skuId,
      brandId,
      name:             cleanName,
      skuCode:          '',
      category:         'model',
      season:           '',
      assetType:        'model',
      anchorType:       'MODEL',
      sourceImages:     [],
      dna:              { identity: `Enrolled model: ${cleanName}` },
      referenceImageB64,
      referenceImage:   null,
      enrollmentStatus: 'ready',
      fidelityScore:    null,
      createdAt:        now,
      updatedAt:        now,
    };

    await setFirestoreREST(`brands/${brandId}/skus`, skuId, doc);

    // Return without the heavy base64 — the client just needs the catalogue record.
    const { referenceImageB64: _omit, ...model } = doc;
    return res.status(200).json({ success: true, model });

  } catch (err) {
    console.error('[MODEL ENROLL]', err);
    return res.status(500).json({ error: err.message || 'Model enrollment failed' });
  }
}
