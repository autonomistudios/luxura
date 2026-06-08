import { setFirestoreREST }               from '../lib/forge/services/gcp-raw.js';
import { createGenAI, withGeminiBackoff } from '../lib/forge/services/gemini-client.js';
import { PXL_MODEL }                      from '../lib/forge/constants.js';
import sharp                              from 'sharp';

const COVER_SYSTEM = `You are a world-class fashion photographer shooting THE COVER for Vogue Italia, W Magazine, CR Fashion Book, and the world's biggest luxury houses — published alongside Steven Meisel, Peter Lindbergh, Craig McDean, Mert & Marcus, and Viviane Sassen. Create a single hyperrealistic, magazine-cover-grade fashion photograph from the brief below. This image must stop the scroll.

THE COVER STANDARD (most important):
This is a hero image — it must be unforgettable, not merely pretty. The model commands the frame with magnetic presence, attitude, and intention — a face and stance you cannot look away from. Bring energy and life: movement in the fabric and hair, a decisive gesture, wind, stride, or a charged stillness that crackles. Styling is couture-level and bold — confident silhouettes, statement pieces, impeccable finish. Light is decisive and sculptural — it carves the figure, creates drama, and gives the frame depth. Color is intentional and rich — it pops off the page without ever looking processed. Compose like a cover: a powerful focal hierarchy, generous negative space, the subject owning the frame.

TECHNICAL SPECIFICATIONS:
Shot on Phase One IQ4 150MP medium format digital back, 85mm f/1.4 at f/2.0, ISO 200, 1/250s. Tack-sharp focus on subject. RAW-quality rendering. Zero digital noise. Natural optical bokeh. Light falls physically correctly on every surface.

SKIN & FACE REALISM (critical):
Natural skin texture with visible pores and micro-surface detail. Subsurface scattering present. No airbrushing, no skin smoothing, no beauty-retouch filters. Genuine human imperfection — fine lines, natural tone variation, real lip texture. Catchlights in the eyes, visible iris detail and depth. No over-smoothed features. No plastic or waxy skin. Reproduce the specified skin tone exactly — rich, true, and luminous; never lightened or neutralized.

PHOTOGRAPHIC AUTHENTICITY:
Indistinguishable from a real editorial photograph. Not CGI, not digital art, not an AI aesthetic. Genuine analog film grain at 3–5%. Natural lens characteristics. Fabric has real texture, weave, and drape. Hair has individual strands and movement.

COMPOSITION:
Full-bleed composition, 4:5 portrait orientation. No borders, no text, no watermarks, no overlays, no HDR look, no cheap lens flare, no cartoon or illustration, no soft-focus glamour filter.

STYLE REFERENCE:
Couture editorial at the level of Steven Meisel for Vogue Italia, Peter Lindbergh's lighting, Mert & Marcus's gloss and power, Craig McDean's color. Expensive, alive, magnetic — quiet luxury with real heat.`;


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { propId, userPrompt, model: requestedModel } = req.body ?? {};
  if (!propId || !userPrompt) {
    return res.status(400).json({ error: 'propId and userPrompt required' });
  }

  // Optional model override for A/B quality comparison; default = production Pro.
  const ALLOWED_MODELS = new Set(['gemini-3-pro-image', 'gemini-2.5-flash-image', 'gemini-3.1-flash-image']);
  const chosenModel = ALLOWED_MODELS.has(requestedModel) ? requestedModel : PXL_MODEL;

  try {
    const genAI = createGenAI();
    const model  = genAI.getGenerativeModel({ model: chosenModel });
    console.log(`[PROP COVER] Generating ${propId} with model=${chosenModel}`);
    const prompt = `${COVER_SYSTEM}\n\n${userPrompt}`;

    const result = await withGeminiBackoff(() =>
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'], temperature: 1.0 },
      })
    );

    const part = result.response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
    if (!part) return res.status(500).json({ error: 'Image generation returned no image' });

    const rawBuffer = Buffer.from(part.inlineData.data, 'base64');

    // fullRes → committed repo covers: 1280px q88, returned only (no Firestore write).
    // default → runtime custom covers: 800px q65, stored in Firestore (under 1MB limit).
    const fullRes = req.body?.fullRes === true;
    const compressed = await sharp(rawBuffer)
      .resize({ width: fullRes ? 1280 : 800, withoutEnlargement: true })
      .jpeg({ quality: fullRes ? 88 : 65, progressive: true })
      .toBuffer();

    const coverUrl = `data:image/jpeg;base64,${compressed.toString('base64')}`;

    if (!fullRes) {
      await setFirestoreREST('prop-covers', propId, {
        coverUrl,
        propId,
        generatedAt: new Date().toISOString(),
      });
    }

    console.log(`[PROP COVER] Generated ${propId} via ${chosenModel} (${compressed.length} bytes, ${fullRes ? 'fullRes/file' : 'firestore'})`);
    return res.status(200).json({ coverUrl, model: chosenModel });

  } catch (err) {
    console.error('[PROP COVER] Error:', err);
    return res.status(500).json({ error: err.message || 'Generation failed' });
  }
}
