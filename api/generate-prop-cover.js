import { setFirestoreREST, getGcpAccessToken, verifyIdTokenREST } from '../lib/forge/services/gcp-raw.js';
import { createGenAI, withGeminiBackoff } from '../lib/forge/services/gemini-client.js';
import { PXL_MODEL }                      from '../lib/forge/constants.js';
import sharp                              from 'sharp';

const COVER_HEAD = `You are a world-class fashion photographer creating a single hero image for LUXAURA, a luxury fashion house. Shoot one hyperrealistic, couture-grade editorial fashion photograph from the brief below. It must stop the scroll.

THE STANDARD (most important):
Unforgettable, not merely pretty. The model commands the frame with magnetic presence, attitude, and intention. Bring energy and life: movement in fabric and hair, a decisive gesture, wind, stride, or a charged stillness. Styling is couture-level and bold. Light is decisive and sculptural. Color is rich and intentional — it pops without ever looking processed.`;

const BRANDING_LUXAURA = `BRANDING — STRICT (NO third-party IP):
The ONLY brand name or text permitted anywhere is the wordmark "LUXAURA", optionally as a single elegant masthead at top in a refined high-fashion serif, spelled EXACTLY L-U-X-A-U-R-A. If it cannot be rendered with perfect spelling, render NO text. NEVER render any real magazine name (Vogue, Elle, Harper's, Bazaar, W, CR, etc.), any photographer name or credit, any other brand, any logo, or any cover line.`;

const BRANDING_CLEAN = `BRANDING — STRICT:
Render NO text of any kind anywhere in the image — no masthead, no words, no captions, no brand names, no logos, no watermarks, no signatures. A completely clean photograph with zero typography.`;

const COVER_BODY = `ANATOMY & PROPORTION (critical — no distortion):
Correct, natural human anatomy. A tall, elegant, long-limbed fashion-model figure — NEVER short, squat, or stubby; never unnaturally elongated. Exactly two arms and two hands, five fingers each, naturally placed — no misplaced, duplicated, fused, floating, or malformed limbs or hands. Natural skin texture with visible pores and subsurface scattering; no airbrushed, waxy, or plastic skin. Reproduce the specified skin tone EXACTLY — rich, true, luminous; never lightened. Real catchlights and iris detail in the eyes.

PHOTOGRAPHIC AUTHENTICITY (critical):
Indistinguishable from a real photograph shot on a medium-format camera (Phase One, 85mm, f/2.0, ISO 200). Tack-sharp focus, natural optical bokeh, light physically correct on every surface. Genuine analog film grain at 3–5%. ABSOLUTELY NOT CGI, NOT a 3D render, NOT digital painting, NOT illustration, NOT cartoon or stylized, NOT an "AI look" — a genuine film photograph.

FRAMING & COMPOSITION:
4:5 portrait, full-bleed. Frame the figure intentionally and completely — do not awkwardly crop the body or limbs at the frame edges. No watermarks, no HDR look, no cheap lens flare.`;

const GARMENT_LOCK = `GARMENT LOCK (HIGHEST PRIORITY):
A reference image of the exact garment is attached. Feature THAT garment and reproduce it with 100% fidelity — identical color, fabric, neckline, straps, bodice, waistline, drape, silhouette, length, and every construction detail. It must read as the same physical piece of clothing in every image. Use the reference for the GARMENT ONLY — completely ignore the original model, face, pose, lighting, and background from the reference. Present the garment FULLY and CLEARLY LIT, in complete display — never in silhouette, never lost in shadow, never obscured. Only the model, pose, scene, and lighting change between images.`;

function buildCoverSystem({ clean, hasRef }) {
  return [
    COVER_HEAD,
    clean ? BRANDING_CLEAN : BRANDING_LUXAURA,
    COVER_BODY,
    hasRef ? GARMENT_LOCK : '',
  ].filter(Boolean).join('\n\n');
}


// Read a cached cover's data-URL from Firestore (server-side, SA auth). Null if absent.
async function getFirestoreCoverUrl(collection, id) {
  try {
    const { token, projectId } = await getGcpAccessToken();
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${encodeURIComponent(id)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!r.ok) return null;
    const doc = await r.json();
    return doc?.fields?.coverUrl?.stringValue || null;
  } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // AUTH — this endpoint spends real money on the Pro image model. Require an authenticated
  // portal user; cover-generation scripts may pass CRON_SECRET instead. Prevents anonymous
  // cost-abuse / DoS of the generator.
  const cronOk = !!process.env.CRON_SECRET && req.headers['x-cron-secret'] === process.env.CRON_SECRET;
  if (!cronOk) {
    const authHeader = req.headers['authorization'] || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });
    try { await verifyIdTokenREST(idToken); }
    catch { return res.status(401).json({ error: 'Unauthorized' }); }
  }

  const { propId, userPrompt, model: requestedModel, clean, refImage, refMime, sceneIndex } = req.body ?? {};
  if (!propId || !userPrompt) {
    return res.status(400).json({ error: 'propId and userPrompt required' });
  }

  // Lazy per-scene cache: scene images live in `prop-scene-covers/<propId>__<idx>`.
  const isScene   = Number.isInteger(sceneIndex) && sceneIndex >= 0;
  const sceneDocId = isScene ? `${propId}__${sceneIndex}` : null;

  // Optional model override for A/B quality comparison; default = production Pro.
  const ALLOWED_MODELS = new Set(['gemini-3-pro-image', 'gemini-2.5-flash-image', 'gemini-3.1-flash-image']);
  const chosenModel = ALLOWED_MODELS.has(requestedModel) ? requestedModel : PXL_MODEL;

  // Optional garment-lock reference image (data URL or raw base64) for consistent-SKU sets.
  const hasRef = typeof refImage === 'string' && refImage.length > 50;

  try {
    // Scene cache hit → return immediately, zero generation cost.
    if (isScene) {
      const cached = await getFirestoreCoverUrl('prop-scene-covers', sceneDocId);
      if (cached) {
        console.log(`[PROP COVER] Scene cache hit: ${sceneDocId}`);
        return res.status(200).json({ coverUrl: cached, model: chosenModel, cached: true });
      }
    }

    const genAI = createGenAI();
    const model  = genAI.getGenerativeModel({ model: chosenModel });
    console.log(`[PROP COVER] Generating ${propId} | model=${chosenModel} | clean=${clean === true} | ref=${hasRef}`);
    const prompt = `${buildCoverSystem({ clean: clean === true, hasRef })}\n\n${userPrompt}`;

    const parts = [];
    if (hasRef) {
      const data = refImage.includes(',') ? refImage.split(',')[1] : refImage;
      parts.push({ inlineData: { mimeType: refMime || 'image/jpeg', data: data.replace(/\s/g, '') } });
    }
    parts.push({ text: prompt });

    const result = await withGeminiBackoff(() =>
      model.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig: { responseModalities: ['IMAGE'], temperature: hasRef ? 0.85 : 1.0 },
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

    if (isScene) {
      await setFirestoreREST('prop-scene-covers', sceneDocId, {
        coverUrl, propId, sceneIndex, generatedAt: new Date().toISOString(),
      });
    } else if (!fullRes) {
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
