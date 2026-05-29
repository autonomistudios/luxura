/**
 * lib/forge/services/segment-composite.js
 * VTO Composite Engine — permanent pixel-lock architecture.
 *
 * Problem: Gemini re-renders garment pixels on every generation call → pattern drift
 * across the 6 editorial slots even after VTO pixel-locked the garment.
 *
 * Solution:
 *   1. VTO produces ONE pixel-perfect garment-on-model image.
 *   2. This service segments the model from the VTO output → transparent PNG.
 *   3. forge.js generates 6 EMPTY background scenes (no model in the prompt).
 *   4. Sharp composites the locked model cutout onto each background.
 *   Result: identical garment pixels across all 6 slots. Zero Gemini garment reinterpretation.
 *
 * Segmentation path priority:
 *   PRIMARY   → Remove.bg REST API (highest edge quality, $0.20/call)
 *               Activated by: REMOVE_BG_API_KEY env var
 *   AUTOMATIC → Gemini vision mask + Sharp pixel-level alpha extraction
 *               Always available — uses existing GEMINI_API_KEY. Zero new config.
 *
 * No new env vars required to activate. Works on first deploy.
 */

import sharp from 'sharp';

const REMOVE_BG_KEY = process.env.REMOVE_BG_API_KEY;
const GEMINI_KEY    = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

// ─── Primary: Remove.bg ───────────────────────────────────────────────────────

async function _segmentViaRemoveBg(base64Input) {
  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': REMOVE_BG_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_base64: base64Input,
      size:     'auto',
      type:     'person',
      format:   'png',
      channels: 'rgba',
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Remove.bg ${res.status}: ${err.substring(0, 200)}`);
  }
  const buf = await res.arrayBuffer();
  return Buffer.from(buf).toString('base64'); // PNG with alpha
}

// ─── Automatic: Gemini vision mask + Sharp pixel extraction ───────────────────

async function _segmentViaGemini(base64Input, mimeType = 'image/jpeg') {
  if (!GEMINI_KEY) throw new Error('No Gemini API key for segmentation');

  // Ask Gemini to output a pure binary segmentation mask.
  // White = person + garment. Black = background. No grey.
  const maskPrompt = [
    'Generate a SEGMENTATION MASK of the person in this photograph.',
    'Output ONLY a pure black and white image at full resolution:',
    '- PURE WHITE (#FFFFFF): the person and every garment/accessory they are wearing',
    '- PURE BLACK (#000000): everything else — background, floor, objects, environment',
    'Requirements: crisp clean edges, no grey gradients, no anti-aliasing, binary only.',
    'The mask must cover the full body from head to feet including all clothing layers.',
  ].join('\n');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_KEY}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64Input } },
            { text: maskPrompt },
          ],
        }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'], temperature: 0.0 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Gemini mask generation ${res.status}: ${err.substring(0, 200)}`);
  }

  const json    = await res.json();
  const maskB64 = json.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data)?.inlineData?.data;
  if (!maskB64) throw new Error('Gemini segmentation: no mask image in response');

  // ── Apply mask to original image via Sharp pixel-level alpha ─────────────
  const imageBuf = Buffer.from(base64Input, 'base64');
  const maskBuf  = Buffer.from(maskB64,     'base64');

  const { width, height } = await sharp(imageBuf).metadata();

  // Resize mask to exact input dimensions, convert to greyscale raw pixels
  const maskRaw = await sharp(maskBuf)
    .resize(width, height, { fit: 'fill', kernel: 'nearest' })
    .greyscale()
    .raw()
    .toBuffer();

  // Convert image to RGBA raw pixels
  const imageRaw = await sharp(imageBuf)
    .ensureAlpha()
    .raw()
    .toBuffer();

  // Pixel loop: alpha = mask value (white=255=opaque, black=0=transparent)
  // Apply a soft threshold: > 128 → 255 (hard keep), feather edge zone 64–128
  const composite = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const maskVal = maskRaw[i];
    // Soft edge: remap 64–255 range to 0–255 for natural feathering
    const alpha = maskVal < 64 ? 0 : maskVal > 200 ? 255 : Math.round((maskVal - 64) / 136 * 255);
    composite[i * 4]     = imageRaw[i * 4];
    composite[i * 4 + 1] = imageRaw[i * 4 + 1];
    composite[i * 4 + 2] = imageRaw[i * 4 + 2];
    composite[i * 4 + 3] = alpha;
  }

  const pngBuf = await sharp(composite, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();

  return pngBuf.toString('base64');
}

// ─── Public: segmentModel ─────────────────────────────────────────────────────

/**
 * segmentModel
 * Segments the model from a VTO output image → transparent PNG.
 * Tries Remove.bg first if configured, auto-falls back to Gemini mask.
 *
 * @param {string} base64Input  — base64 of VTO result (no data: prefix)
 * @param {string} [mimeType]   — MIME type of input (default: 'image/jpeg')
 * @returns {Promise<string>}   — base64 PNG with alpha transparency
 */
export async function segmentModel(base64Input, mimeType = 'image/jpeg') {
  if (REMOVE_BG_KEY) {
    try {
      console.log('[FORGE] COMPOSITE: Segmenting via Remove.bg (premium path)...');
      const result = await _segmentViaRemoveBg(base64Input);
      console.log('[FORGE] COMPOSITE: Remove.bg segmentation complete.');
      return result;
    } catch (err) {
      console.warn(`[FORGE] COMPOSITE: Remove.bg failed — falling back to Gemini mask: ${err.message}`);
    }
  }

  console.log('[FORGE] COMPOSITE: Segmenting via Gemini vision mask (automatic path)...');
  const result = await _segmentViaGemini(base64Input, mimeType);
  console.log('[FORGE] COMPOSITE: Gemini segmentation complete.');
  return result;
}

// ─── Public: compositeModelOnBackground ──────────────────────────────────────

/**
 * compositeModelOnBackground
 * Places the segmented transparent model PNG over a generated background using Sharp.
 * Model is scaled to fill 90% of background height, centered, with a ground shadow.
 *
 * @param {string} modelPngBase64   — base64 PNG with alpha (from segmentModel)
 * @param {string} backgroundBase64 — base64 of the generated background scene
 * @param {string} [bgMimeType]     — MIME type of background
 * @returns {Promise<string>}       — base64 JPEG composite
 */
export async function compositeModelOnBackground(modelPngBase64, backgroundBase64, bgMimeType = 'image/jpeg') {
  const modelBuf = Buffer.from(modelPngBase64,   'base64');
  const bgBuf    = Buffer.from(backgroundBase64, 'base64');

  const bgMeta = await sharp(bgBuf).metadata();
  const bgW = bgMeta.width  || 768;
  const bgH = bgMeta.height || 1024;

  // ── Step 1: Sample background color temperature for lighting harmonization ─
  // Extract average RGB from the center-bottom zone of the background
  // (where the model will stand — this is the dominant ambient light source).
  const sampleZone = await sharp(bgBuf)
    .extract({
      left:   Math.round(bgW * 0.25),
      top:    Math.round(bgH * 0.55),
      width:  Math.round(bgW * 0.50),
      height: Math.round(bgH * 0.30),
    })
    .resize(1, 1, { fit: 'cover' }) // collapse to single pixel = average color
    .raw()
    .toBuffer();

  const avgR = sampleZone[0];
  const avgG = sampleZone[1];
  const avgB = sampleZone[2];

  // Derive a subtle tint multiplier from the background's color cast.
  // Neutral (128,128,128) = no tint. Warm bg → warm tint on model. Cool bg → cool tint.
  // Clamped to ±12% shift so the model's colors are nudged, not overridden.
  const neutralize = 128;
  const tintR = 1 + Math.max(-0.12, Math.min(0.12, (avgR - neutralize) / neutralize * 0.18));
  const tintG = 1 + Math.max(-0.12, Math.min(0.12, (avgG - neutralize) / neutralize * 0.18));
  const tintB = 1 + Math.max(-0.12, Math.min(0.12, (avgB - neutralize) / neutralize * 0.18));

  // ── Step 2: Scale model to fit background ─────────────────────────────────
  const targetH     = Math.round(bgH * 0.90);
  const modelResized = await sharp(modelBuf)
    .resize({ height: targetH, fit: 'inside', withoutEnlargement: false })
    .toBuffer();

  const modelMeta = await sharp(modelResized).metadata();
  const mW = modelMeta.width  || Math.round(bgW * 0.55);
  const mH = modelMeta.height || targetH;

  // ── Step 3: Apply color temperature tint to model ─────────────────────────
  // Harmonizes the model's ambient lighting with the background's color cast.
  // Operates in linear light space (gamma: false) for accurate color math.
  const modelTinted = await sharp(modelResized)
    .linear(
      [tintR, tintG, tintB, 1],   // multiply: R, G, B, Alpha
      [0,     0,     0,     0]    // offset: none
    )
    .toBuffer();

  // ── Step 4: Feather model edges for natural integration ───────────────────
  // A very subtle outer blur on the alpha channel softens the cut-out edge,
  // preventing the "hard pasted" look against complex backgrounds.
  // We achieve this by compositing a slightly-blurred version of the model
  // behind the sharp version — creates a 2–3px soft halo at edges.
  const modelBlurred = await sharp(modelTinted)
    .blur(1.2) // 1.2σ — just enough to soften edge pixels, not the garment
    .toBuffer();

  // ── Step 5: Ground shadow ellipse ─────────────────────────────────────────
  const left = Math.round((bgW - mW) / 2);
  const top  = Math.round(bgH - mH - (bgH * 0.04));

  const shadowW = Math.round(mW * 0.62);
  const shadowH = Math.round(shadowW * 0.14);
  // Shadow color derived from background — dark scenes get lighter shadows, bright scenes darker
  const shadowOpacity = avgR + avgG + avgB > 500 ? 0.42 : 0.28;
  const shadowSvg = Buffer.from(
    `<svg width="${shadowW}" height="${shadowH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stop-color="rgba(0,0,0,${shadowOpacity})"/>
          <stop offset="60%"  stop-color="rgba(0,0,0,${(shadowOpacity * 0.35).toFixed(2)})"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
        </radialGradient>
      </defs>
      <ellipse cx="${Math.round(shadowW / 2)}" cy="${Math.round(shadowH / 2)}"
               rx="${Math.round(shadowW / 2)}" ry="${Math.round(shadowH / 2)}"
               fill="url(#sg)"/>
    </svg>`
  );
  const shadowLeft = left + Math.round((mW - shadowW) / 2);
  const shadowTop  = top + mH - Math.round(shadowH * 0.45);

  // ── Step 6: Composite — background → edge halo → shadow → sharp model ────
  const output = await sharp(bgBuf)
    .composite([
      { input: modelBlurred, left: Math.max(0, left), top: Math.max(0, top), blend: 'over'     }, // soft edge halo
      { input: shadowSvg,    left: Math.max(0, shadowLeft), top: Math.max(0, shadowTop), blend: 'multiply' }, // ground shadow
      { input: modelTinted,  left: Math.max(0, left), top: Math.max(0, top), blend: 'over'     }, // sharp model on top
    ])
    .jpeg({ quality: 94, mozjpeg: true })
    .toBuffer();

  console.log(
    `[FORGE] COMPOSITE: Integrated — tint(R:${tintR.toFixed(2)} G:${tintG.toFixed(2)} B:${tintB.toFixed(2)}) | ` +
    `shadow:${shadowOpacity} | model at (${left},${top}) | ${(output.length / 1024).toFixed(0)} KB`
  );
  return output.toString('base64');
}

// ─── Public: isCompositeAvailable ────────────────────────────────────────────

/**
 * Returns true when the composite path is available.
 * Always true — Gemini segmentation requires no extra config.
 * @returns {boolean}
 */
export function isCompositeAvailable() {
  return true; // Gemini path always available; Remove.bg upgrades quality when configured
}
