import { setFirestoreREST }               from '../lib/forge/services/gcp-raw.js';
import { createGenAI, withGeminiBackoff } from '../lib/forge/services/gemini-client.js';
import { PXL_MODEL }                      from '../lib/forge/constants.js';
import sharp                              from 'sharp';

const COVER_SYSTEM = `You are a world-class fashion photographer creating a single hero cover image for LUXAURA, a luxury fashion house. Shoot one hyperrealistic, couture-grade editorial fashion photograph from the brief below. It must stop the scroll.

THE COVER STANDARD (most important):
Unforgettable, not merely pretty. The model commands the frame with magnetic presence, attitude, and intention — a face and stance you cannot look away from. Bring energy and life: movement in fabric and hair, a decisive gesture, wind, stride, or a charged stillness that crackles. Styling is couture-level and bold — confident silhouettes, statement pieces, impeccable finish. Light is decisive and sculptural. Color is rich and intentional — it pops without ever looking processed. Compose like a high-fashion magazine cover: powerful focal hierarchy, the subject owning the frame.

BRANDING — STRICT (NO third-party IP):
The ONLY brand name or text permitted anywhere in the image is the wordmark "LUXAURA". You may render a single elegant "LUXAURA" masthead at the top in a refined high-fashion serif, spelled EXACTLY L-U-X-A-U-R-A. If it cannot be rendered with perfect spelling, render NO text at all. NEVER render any real magazine name (never "Vogue", "Elle", "Harper's", "Bazaar", "W", "CR", etc.), any photographer name or credit, any other brand, any logo, or any cover line. When in doubt, no text.

ANATOMY & PROPORTION (critical — no distortion):
Correct, natural human anatomy. A tall, elegant, long-limbed fashion-model figure — NEVER short, squat, or stubby; never unnaturally elongated. Exactly two arms and two hands, five fingers each, in natural, correctly-placed positions — no misplaced, duplicated, fused, floating, or malformed limbs or hands. Natural skin texture with visible pores and subsurface scattering; no airbrushed, waxy, or plastic skin. Reproduce the specified skin tone EXACTLY — rich, true, luminous; never lightened. Real catchlights and iris detail in the eyes.

PHOTOGRAPHIC AUTHENTICITY (critical):
Indistinguishable from a real photograph shot on a medium-format camera (Phase One, 85mm, f/2.0, ISO 200). Tack-sharp focus, natural optical bokeh, light physically correct on every surface. Genuine analog film grain at 3–5%. ABSOLUTELY NOT CGI, NOT a 3D render, NOT digital painting, NOT illustration, NOT cartoon or stylized, NOT an "AI look" — even for vintage or period palettes, the result must read as a genuine film photograph.

FRAMING & COMPOSITION:
4:5 portrait, full-bleed. Frame the figure intentionally and completely — do not awkwardly crop the body or limbs at the frame edges. If a reflection (water, mirror, glass) appears, the subject's actual body above the reflection must remain whole and uncropped. No watermarks, no HDR look, no cheap lens flare.`;


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
