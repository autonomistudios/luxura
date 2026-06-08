import { setFirestoreREST }               from '../lib/forge/services/gcp-raw.js';
import { createGenAI, withGeminiBackoff } from '../lib/forge/services/gemini-client.js';
import { PXL_MODEL }                      from '../lib/forge/constants.js';
import sharp                              from 'sharp';

const COVER_SYSTEM = `You are a world-class fashion photographer shooting for Vogue Italia, Harper's BAZAAR, W Magazine, and major luxury campaigns. Your work is published alongside Steven Meisel, Peter Lindbergh, Craig McDean, and Viviane Sassen. Create a single hyperrealistic, magazine-quality fashion photograph based on the scene description.

TECHNICAL SPECIFICATIONS:
Shot on Phase One IQ4 150MP medium format digital back, 85mm f/1.4 at f/2.0, ISO 200, 1/250s shutter. Tack sharp focus on subject. RAW file quality rendering. Zero digital noise. Natural optical bokeh. Light falls physically correctly on all surfaces.

SKIN & FACE REALISM (critical):
Natural skin texture with visible pores and micro-surface detail. Subsurface scattering present. No airbrushing, no skin smoothing, no beauty retouching filters. Genuine human imperfections — fine lines, natural tone variation, real lip texture. Sharp teeth with natural enamel variation and slight translucency at edges. Catchlights in eyes, visible iris detail and depth. No over-smoothed features. No plastic or waxy skin appearance.

PHOTOGRAPHIC AUTHENTICITY:
Indistinguishable from a real editorial photograph. Not CGI. Not digital art. Not AI-generated aesthetic. Genuine analog film grain at 3-5%. Photojournalistic realism. Natural lens characteristics. Fabric has real texture, weave, and drape. Hair has individual strands and movement.

COMPOSITION:
Full-bleed photographic composition. 4:5 portrait orientation. No borders, no text, no watermarks, no overlays, no vignette, no HDR tone mapping, no lens flare. No cartoon, no illustration, no soft-focus glamour filter. Natural color science — no oversaturated or hyper-processed look.

STYLE REFERENCE:
Editorial fashion photography at the level of Steven Meisel for Vogue Italia, Peter Lindbergh's lighting philosophy, Craig McDean color palette. Quiet luxury aesthetic — expensive, understated, real.`;


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

    // Compress to JPEG 800px wide at quality 65 — stays well under Firestore 1MB limit
    const compressed = await sharp(rawBuffer)
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 65, progressive: true })
      .toBuffer();

    const coverUrl = `data:image/jpeg;base64,${compressed.toString('base64')}`;

    await setFirestoreREST('prop-covers', propId, {
      coverUrl,
      propId,
      generatedAt: new Date().toISOString(),
    });

    console.log(`[PROP COVER] Generated and stored: ${propId} via ${chosenModel} (${compressed.length} bytes)`);
    return res.status(200).json({ coverUrl, model: chosenModel });

  } catch (err) {
    console.error('[PROP COVER] Error:', err);
    return res.status(500).json({ error: err.message || 'Generation failed' });
  }
}
