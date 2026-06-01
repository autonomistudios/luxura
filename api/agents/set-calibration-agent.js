/**
 * api/agents/set-calibration-agent.js
 * Extracts atmospheric DNA from brand set reference images.
 * Called inline from /api/v1/sets/inject after creating the set record.
 */
import { createGenAI, withGeminiBackoff } from '../../lib/forge/services/gemini-client.js';
import { TEXT_MODEL } from '../../lib/forge/constants.js';
import { updateFirestoreREST } from '../../lib/forge/services/gcp-raw.js';
import { deliverWebhook, WEBHOOK_EVENTS } from '../../lib/forge/services/webhook-service.js';
import { brandLog, brandError } from '../../lib/forge/utils/brand-logger.js';

export async function calibrateSet(brandId, setId, referenceImages, setName) {
  brandLog(brandId, 'set-calibration', `Starting calibration for set ${setId} — ${referenceImages.length} images`);

  try {
    const genAI = createGenAI();
    const model = genAI.getGenerativeModel({ model: TEXT_MODEL });

    const imageParts = referenceImages.slice(0, 3).map(img => ({
      inlineData: { mimeType: 'image/jpeg', data: img.includes(',') ? img.split(',')[1] : img },
    }));

    const result = await withGeminiBackoff(() => model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          {
            text: `Analyze these ${imageParts.length} set/location reference images for a luxury fashion photography platform.

Extract calibration data for AI generation:
1. lightingSignature: Primary light source direction, quality (hard/soft/diffuse), color temperature (warm/neutral/cool), key shadows
2. atmosphereDNA: Overall mood, environmental materials, spatial depth, ceiling/floor/wall textures visible
3. sceneNotes: Key contextual details for directing AI generation within this environment
4. colorProfile: Dominant color palette — 3 to 5 hex color codes

Respond ONLY with valid JSON: { "lightingSignature": "...", "atmosphereDNA": "...", "sceneNotes": "...", "colorProfile": ["#xxx", "#xxx"] }`,
          },
          ...imageParts,
        ],
      }],
    }));

    const text  = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const match = text.match(/\{[\s\S]*\}/);
    const calibrationData = match ? JSON.parse(match[0]) : {
      lightingSignature: 'Natural diffuse light',
      atmosphereDNA:     'Studio environment',
      sceneNotes:        setName,
      colorProfile:      ['#FFFFFF', '#808080'],
    };

    await updateFirestoreREST(`brands/${brandId}/sets`, setId, {
      calibrationData,
      status:    'ready',
      updatedAt: new Date().toISOString(),
    });

    await deliverWebhook(brandId, {
      type: WEBHOOK_EVENTS.SET_CALIBRATED,
      data: { setId, name: setName, status: 'ready', calibrationData },
    }).catch(() => {});

    brandLog(brandId, 'set-calibration', `Set ${setId} calibrated successfully`);
    return calibrationData;

  } catch (err) {
    brandError(brandId, 'set-calibration', `Calibration failed for set ${setId}`, err);

    await updateFirestoreREST(`brands/${brandId}/sets`, setId, {
      status: 'failed', updatedAt: new Date().toISOString(),
    }).catch(() => {});

    throw err;
  }
}

// HTTP handler for direct invocation
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { brandId, setId, referenceImages, setName } = req.body || {};
  if (!brandId || !setId || !referenceImages?.length) {
    return res.status(400).json({ error: 'brandId, setId, and referenceImages are required' });
  }

  try {
    const result = await calibrateSet(brandId, setId, referenceImages, setName || 'Set');
    return res.status(200).json({ calibrated: true, calibrationData: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
