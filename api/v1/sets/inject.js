/**
 * api/v1/sets/inject.js
 * POST /api/v1/sets/inject — upload custom set references for spatial calibration
 */
import { resolveBrandContext, requireRole } from '../../../lib/forge/services/brand-auth.js';
import { setFirestoreREST, uploadStorageREST, getGcpAccessToken } from '../../../lib/forge/services/gcp-raw.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  let ctx;
  try { ctx = await resolveBrandContext(req); }
  catch (err) { return res.status(err.statusCode || 401).json({ error: err.message }); }

  try { requireRole(ctx, 'editor'); }
  catch (err) { return res.status(403).json({ error: err.message }); }

  const { brandId } = ctx;
  const { name, description, referenceImages = [] } = req.body || {};

  if (!name) return res.status(400).json({ error: 'name is required' });
  if (!referenceImages.length) return res.status(400).json({ error: 'At least one reference image required' });

  const setId = `set_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const now   = new Date().toISOString();

  // Write pending set record
  await setFirestoreREST(`brands/${brandId}/sets`, setId, {
    setId, brandId, name, description: description || '', referenceImages: [],
    calibrationData: null, status: 'calibrating', createdAt: now, updatedAt: now,
  });

  // Upload reference images to Storage (fire-and-forget for large images)
  const bucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET;
  const uploadPromises = referenceImages.slice(0, 3).map(async (imgBase64, i) => {
    try {
      const clean  = imgBase64.includes(',') ? imgBase64.split(',')[1] : imgBase64;
      const buffer = Buffer.from(clean, 'base64');
      const path   = `brands/${brandId}/sets/${setId}/ref_${i}.jpg`;
      return await uploadStorageREST(bucket, path, buffer, 'image/jpeg');
    } catch (e) {
      console.warn(`[SET INJECT] Image ${i} upload failed: ${e.message}`);
      return null;
    }
  });

  // Trigger set calibration agent asynchronously
  const calibrateAsync = async () => {
    try {
      const { deliverWebhook, WEBHOOK_EVENTS } = await import('../../../lib/forge/services/webhook-service.js');
      const urls = (await Promise.all(uploadPromises)).filter(Boolean);

      // Import and run calibration inline (Vercel waitUntil pattern)
      const { createGenAI, withGeminiBackoff } = await import('../../../lib/forge/services/gemini-client.js');
      const { TEXT_MODEL } = await import('../../../lib/forge/constants.js');
      const { updateFirestoreREST } = await import('../../../lib/forge/services/gcp-raw.js');

      const genAI    = createGenAI();
      const model    = genAI.getGenerativeModel({ model: TEXT_MODEL });
      const imageParts = referenceImages.slice(0, 3).map(img => ({
        inlineData: { mimeType: 'image/jpeg', data: img.includes(',') ? img.split(',')[1] : img },
      }));

      const result = await withGeminiBackoff(() => model.generateContent({
        contents: [{
          role: 'user', parts: [
            { text: `Analyze these ${imageParts.length} set/location reference images. Extract:
1. lightingSignature: Primary light source direction, quality (hard/soft), color temperature (warm/cool/neutral)
2. atmosphereDNA: Overall mood, materials visible, environmental textures
3. sceneNotes: Key visual characteristics for AI generation context
4. colorProfile: Dominant color palette (3-5 hex codes)
Respond with JSON only: { "lightingSignature": "...", "atmosphereDNA": "...", "sceneNotes": "...", "colorProfile": ["#..."] }` },
            ...imageParts,
          ],
        }],
      }));

      const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const match = text.match(/\{[\s\S]*\}/);
      const calibrationData = match ? JSON.parse(match[0]) : {};

      await updateFirestoreREST(`brands/${brandId}/sets`, setId, {
        calibrationData, referenceImages: urls, status: 'ready', updatedAt: new Date().toISOString(),
      });

      await deliverWebhook(brandId, { type: WEBHOOK_EVENTS.SET_CALIBRATED, data: { setId, name, status: 'ready' } });
    } catch (err) {
      console.error(`[SET CALIBRATE] Failed for ${setId}: ${err.message}`);
      const { updateFirestoreREST } = await import('../../../lib/forge/services/gcp-raw.js');
      await updateFirestoreREST(`brands/${brandId}/sets`, setId, { status: 'failed', updatedAt: new Date().toISOString() }).catch(() => {});
    }
  };

  // Fire calibration without blocking response
  calibrateAsync().catch(() => {});

  return res.status(200).json({ setId, status: 'calibrating', name, message: 'Spatial calibration in progress. You will be notified via webhook when complete.' });
}
