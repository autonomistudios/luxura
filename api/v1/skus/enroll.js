/**
 * api/v1/skus/enroll.js
 * SKU enrollment endpoint — runs Agent 01 DNA extraction + Agent 01b anchor isolation,
 * then freezes the result permanently as a reusable SKU in the brand's catalog.
 */
import { resolveBrandContext, requireRole } from '../../../lib/forge/services/brand-auth.js';
import {
  createSku,
  updateSkuEnrollment,
  uploadSkuSourceImage,
  uploadSkuReferenceImage,
  calculateFidelityScore,
} from '../../../lib/forge/services/sku-service.js';
import { deliverWebhook, WEBHOOK_EVENTS } from '../../../lib/forge/services/webhook-service.js';
import { createGenAI, withGeminiBackoff }  from '../../../lib/forge/services/gemini-client.js';
import { DNA_EXTRACTION_PROMPTS }         from '../../../lib/forge/config/anchors.js';
import { TEXT_MODEL, PXL_MODEL }          from '../../../lib/forge/constants.js';
import { SAFETY_SETTINGS }               from '../../../lib/forge/safety.js';

const ISOLATION_INSTRUCTIONS = {
  FULL_OUTFIT: `Extract ONLY the clothing from this image as a professional FLAT LAY on a clean white surface. ABSOLUTE PROHIBITION: Do NOT include any human body, skin, face, mannequins, or stands. Every repeating pattern, intricate print, and micro-texture must be preserved with 100% fidelity. Statement elements (3D appliqués, feathers, bows, crystals) MUST be reproduced exactly in their correct position at full scale.`,
  DRESS:       `Extract ONLY the dress from this image as a professional FLAT LAY on a clean white surface. Surgically isolate the garment and discard any person/mannequin. Do NOT add any new elements not present in the source. Preserve all patterns, fabric weave, and intricate prints with pixel-perfect fidelity. Preserve all 3D structural elements exactly.`,
  SHIRT:       `Re-photograph ONLY the shirt/top from this reference on a headless mannequin. Same color, cut, fabric, and detail. Background: clean studio.`,
  PANTS:       `Re-photograph ONLY the pants from this reference on a headless lower-body mannequin. Same color, cut, and detail. Background: clean studio.`,
  SHORTS:      `Re-photograph ONLY the shorts from this reference on a headless lower-body mannequin. Background: clean studio.`,
  SWIMWEAR:    `Re-photograph ONLY the swimwear from this reference on a headless mannequin. Same style, color, and cut. Background: clean neutral.`,
  HAIR:        `Re-photograph ONLY the hairstyle. Extreme tight crop from crown to base of neck — NO body, NO shoulders, NO clothing. Face turned away or cropped out. Background: clean neutral.`,
  BARBER:      `Re-photograph ONLY the haircut and fade. Tight crop showing crown to base of neck, back and sides. No face, no shoulders. Background: clean studio.`,
  NAILS:       `Re-photograph ONLY the nail art. Show only wrist to fingertip — no face, no body above wrists. Reproduce nail design, colors, and finish exactly.`,
  MAKEUP:      `Reproduce ONLY the makeup look on a completely anonymous, featureless, generic placeholder face. No recognizable identity. Makeup must match exactly.`,
  SHOES:       `Re-photograph ONLY the footwear exactly as it appears. Same style, color, material — standalone product shot or on ankle only. Background: clean white.`,
  EARRINGS:    `Macro close-up of ONLY the earrings against neutral background or on earlobe. No face visible. Reproduce exactly.`,
  NECKLACE:    `Show ONLY the necklace against neutral backdrop or on collarbone (face cropped). Reproduce exactly.`,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // ── Auth ──────────────────────────────────────────────────────────────────
  let ctx;
  try {
    ctx = await resolveBrandContext(req);
    requireRole(ctx, 'editor');
  } catch (err) {
    return res.status(err.statusCode || 401).json({ error: err.message });
  }
  const { brandId } = ctx;

  // ── Validate request body ─────────────────────────────────────────────────
  const { name, skuCode, category, season, anchorType, sourceImage, additionalImages = [], webhookUrl } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  if (!sourceImage) return res.status(400).json({ error: 'sourceImage (base64 data URI) is required' });
  if (!anchorType) return res.status(400).json({ error: 'anchorType is required' });

  // ── Parse source image ────────────────────────────────────────────────────
  let sourceBase64, sourceMimeType = 'image/jpeg';
  if (sourceImage.includes(',')) {
    const [header, data] = sourceImage.split(',');
    sourceBase64 = data.trim().replace(/\s/g, '');
    const mimeMatch = header.match(/^data:(image\/\w+);/);
    sourceMimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  } else {
    sourceBase64 = sourceImage.trim().replace(/\s/g, '');
  }

  // ── Create pending SKU record ─────────────────────────────────────────────
  const { skuId } = await createSku(brandId, { name, skuCode, category, season, anchorType });
  console.log(`[SKU ENROLL] Starting enrollment: brandId=${brandId} skuId=${skuId} anchor=${anchorType}`);

  try {
    // ── Upload source image to Storage ────────────────────────────────────
    const sourceBuffer = Buffer.from(sourceBase64, 'base64');
    const sourceStorageUrl = await uploadSkuSourceImage(brandId, skuId, sourceBuffer, sourceMimeType, 0);
    console.log(`[SKU ENROLL] Source image uploaded: ${sourceStorageUrl}`);

    // ── Agent 01: DNA Extraction ──────────────────────────────────────────
    const genAI = createGenAI();
    const textModel = genAI.getGenerativeModel({ model: TEXT_MODEL });

    const sourceImagePart = { inlineData: { mimeType: sourceMimeType, data: sourceBase64 } };

    // Build additional image parts (up to 2 extra angles)
    const additionalParts = (additionalImages || []).slice(0, 2).map(img => {
      const clean = img.includes(',') ? img.split(',')[1] : img;
      return { inlineData: { mimeType: 'image/jpeg', data: clean.trim().replace(/\s/g, '') } };
    });
    const allImageParts = [sourceImagePart, ...additionalParts];

    const dnaPrompt = DNA_EXTRACTION_PROMPTS[anchorType] ||
      `Analyze this garment image and provide a comprehensive technical description of the ${anchorType}. Describe: color, material, texture, cut/silhouette, details, pattern/print, any distinctive features. Be precise and technical.`;

    console.log(`[SKU ENROLL] Agent 01: Extracting ${anchorType} DNA...`);

    // Run DNA extraction in parallel: anchor DNA + identity DNA
    const [anchorDnaResult, identityDnaResult] = await Promise.all([
      withGeminiBackoff(() => textModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: dnaPrompt }, ...allImageParts] }],
      })).then(r => r.response.candidates?.[0]?.content?.parts?.[0]?.text || '').catch(e => {
        console.warn(`[SKU ENROLL] Anchor DNA extraction failed: ${e.message}`);
        return '';
      }),

      withGeminiBackoff(() => textModel.generateContent({
        contents: [{
          role: 'user', parts: [
            { text: `Describe the subject's physical characteristics if a person is present (skin tone, body type, age range). If no person, respond with "no person". Be brief.` },
            sourceImagePart,
          ],
        }],
      })).then(r => r.response.candidates?.[0]?.content?.parts?.[0]?.text || '').catch(() => ''),
    ]);

    const dna = {
      [anchorType]: anchorDnaResult,
      identity:     identityDnaResult,
    };

    // Add hair DNA for clothing anchors (needed for complete forge injection)
    if (['FULL_OUTFIT', 'DRESS', 'SHIRT', 'PANTS', 'SWIMWEAR'].includes(anchorType)) {
      const hairDna = await withGeminiBackoff(() => textModel.generateContent({
        contents: [{
          role: 'user', parts: [
            { text: 'If hair is visible, describe it: color, length, texture, styling. If no hair visible, respond "not visible".' },
            sourceImagePart,
          ],
        }],
      })).then(r => r.response.candidates?.[0]?.content?.parts?.[0]?.text || '').catch(() => '');
      dna.hair = hairDna;
    }

    console.log(`[SKU ENROLL] Agent 01: DNA extracted. Anchor text length: ${anchorDnaResult.length} chars.`);

    // ── Agent 01b: Anchor Isolation (Reference Render) ────────────────────
    console.log(`[SKU ENROLL] Agent 01b: Generating anchor isolation render...`);
    const isolationPrompt = ISOLATION_INSTRUCTIONS[anchorType] ||
      `Re-photograph ONLY the ${anchorType} from this reference image exactly as it appears — same color, texture, and detail — without showing the person's face or any identifying features. Background: clean studio.`;

    const pxlModel = genAI.getGenerativeModel({
      model: PXL_MODEL,
      generationConfig: { responseModalities: ['IMAGE'], temperature: 0.05 },
    });

    let referenceImageBase64 = null;
    let referenceImageMimeType = 'image/png';

    try {
      const isolationResult = await withGeminiBackoff(() => pxlModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: isolationPrompt }, sourceImagePart] }],
      }));

      const parts = isolationResult.response.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
      if (imagePart) {
        referenceImageBase64 = imagePart.inlineData.data;
        referenceImageMimeType = imagePart.inlineData.mimeType;
      }
    } catch (err) {
      console.warn(`[SKU ENROLL] Agent 01b isolation failed (non-fatal): ${err.message}`);
    }

    // ── Upload reference image to Storage ─────────────────────────────────
    let referenceImageUrl = null;
    if (referenceImageBase64) {
      const refBuffer = Buffer.from(referenceImageBase64, 'base64');
      referenceImageUrl = await uploadSkuReferenceImage(brandId, skuId, refBuffer, referenceImageMimeType);
      console.log(`[SKU ENROLL] Reference render uploaded: ${referenceImageUrl}`);
    }

    // ── Calculate Fidelity Score ──────────────────────────────────────────
    let fidelityScore = 50;
    if (referenceImageBase64) {
      fidelityScore = await calculateFidelityScore(sourceBase64, referenceImageBase64, anchorType);
    }
    console.log(`[SKU ENROLL] Fidelity score: ${fidelityScore}/100`);

    // ── Freeze DNA → SKU record ───────────────────────────────────────────
    await updateSkuEnrollment(brandId, skuId, {
      dna,
      referenceImage: referenceImageUrl,
      fidelityScore,
      enrollmentStatus: 'ready',
    });

    // ── Deliver webhook ───────────────────────────────────────────────────
    await deliverWebhook(brandId, {
      type: WEBHOOK_EVENTS.SKU_ENROLLED,
      data: { skuId, name, anchorType, fidelityScore, status: 'ready', referenceImageUrl },
    }).catch(() => {});

    console.log(`[SKU ENROLL] Complete: skuId=${skuId} fidelity=${fidelityScore} status=ready`);

    return res.status(200).json({
      skuId,
      status:          'ready',
      fidelityScore,
      referenceImageUrl,
      dnaKeys:         Object.keys(dna),
      lowFidelityWarning: fidelityScore < 40,
    });

  } catch (err) {
    console.error(`[SKU ENROLL] Fatal error for skuId=${skuId}: ${err.message}`);
    await updateSkuEnrollment(brandId, skuId, {
      enrollmentStatus: 'failed',
      dna: null,
      referenceImage: null,
      fidelityScore: null,
    }).catch(() => {});

    await deliverWebhook(brandId, {
      type: WEBHOOK_EVENTS.SKU_FAILED,
      data: { skuId, error: err.message },
    }).catch(() => {});

    return res.status(500).json({ error: `Enrollment failed: ${err.message}`, skuId });
  }
}
