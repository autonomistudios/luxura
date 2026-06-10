/**
 * api/forge.js — Sovereign Forge Entry Point v10.0 (Modular)
 *
 * Thin controller. All business logic lives in lib/forge/:
 *   config/     — pure data (photography, anchors, slots)
 *   services/   — Firebase Admin, Gemini client, Vertex VTO, Fashn.ai
 *   agents/     — Agent 01f (VTO), Agent 01g (AI character), Agent 02 (Director)
 *   utils/      — temperature, camera-resolver, failure-classifier, streaming
 *
 * This file owns:
 *   - HTTP/SSE handler lifecycle
 *   - Auth gate, rate limiting, credit deduction (via firebase-admin service)
 *   - Agent 00: deterministic intent classifier
 *   - Agent 01: DNA extraction (vision → text, inline — tightly coupled to request images)
 *   - Agent 01b–01e: keep+garment pre-pass (flat lay, garment render, identity ref, clothing mask)
 *   - Agent 01f/01g orchestration via imported agent functions
 *   - Agent 02.5: cross-slot consistency audit
 *   - Agent 03: image producer via PromptArchitect + pLimitStreaming
 */

import PromptArchitect     from '../lib/forge/agents/agent03-prompt-architect.js';

// ── Lib: services ──────────────────────────────────────────────────────────────
import { verifyIdTokenREST, checkRateLimit, deductCreditsREST, setFirestoreREST, updateFirestoreREST, uploadStorageREST } from '../lib/forge/services/gcp-raw.js';
import { loadAuraProfile, updateAuraProfile }              from '../lib/forge/services/aura-profile.js';
import { createGenAI, withGeminiBackoff }                  from '../lib/forge/services/gemini-client.js';

// ── Lib: agents ────────────────────────────────────────────────────────────────
import { runAgent01fVTO, runAgent01fAiVTO }  from '../lib/forge/agents/agent01f-vto.js';
import { runAgent01gAiCharacter }            from '../lib/forge/agents/agent01g-ai-character.js';
import { runAgent02Director }                from '../lib/forge/agents/agent02-director.js';
import { runAgent00Intent }                  from '../lib/forge/agents/agent00-intent.js';

// ── Lib: config ────────────────────────────────────────────────────────────────
import {
  PXL_MODEL, TEXT_MODEL, FORGE_CREDIT_COST, FORGE_CREDIT_COST_VTO,
  VERTEX_PROJECT, FASHN_API_KEY,
  BEAUTY_PRECISION_ANCHORS, DETAIL_ACCESSORY_ANCHORS,
  CLOTHING_ANCHOR_TYPES, OUTFIT_SUBSUMES,
  USE_INTENT_AGENT,
} from '../lib/forge/constants.js';

import {
  LIGHTING_MAP, CAMERA_MAP, COLOR_GRADE_MAP,
  CAMERA_FORMAT_MAP, SKIN_TONE_MAP, MASTER_PHOTOGRAPHY_DIRECTIONS,
  MODEL_ARCHETYPE_MAP, POSE_MAP, EXPRESSION_MAP, AGE_RANGE_MAP,
  SHOT_TYPE_MAP, ATMOSPHERE_MAP, STYLING_MAP, VARIATION_SEEDS, GENDER_MAP,
} from '../lib/forge/config/photography.js';

import { ANCHOR_LABELS, DNA_EXTRACTION_PROMPTS } from '../lib/forge/config/anchors.js';
import { ETHNICITIES, FACES, POSES, FRAMINGS, CLOTHING_FRAMINGS, OUTFITS, EYE_COLORS,
         AGES, BODY_TYPES, makeRng, uniqueShuffle }                   from '../lib/forge/config/slots.js';

// ── Lib: utils ─────────────────────────────────────────────────────────────────
import { calculateSlotTemperature }           from '../lib/forge/utils/temperature.js';
import { ANCHOR_CAMERA_CONFLICTS } from '../lib/forge/utils/camera-resolver.js';
import { FAILURE_MUTATIONS, classifyFailure } from '../lib/forge/utils/failure-classifier.js';
import { pLimitStreaming }                    from '../lib/forge/utils/streaming.js';
import { SAFETY_SETTINGS }                   from '../lib/forge/safety.js';

// ─── Isolation instructions — face-free anchor reference rendering ─────────────
// Kept here because they are only consumed by Agent 01b (inline pre-pass).
const ISOLATION_INSTRUCTIONS = {
  FULL_OUTFIT: `You are looking at a reference photograph containing a complete outfit. Your task: extract ONLY the clothing from this image and present it as a professional FLAT LAY on a clean white surface. [SURGICAL ISOLATION]: Identify the garment(s) precisely. [ABSOLUTE PROHIBITION]: Do NOT include any human body, skin, face, mannequins, stands, hangers, or studio shadows. [NO HALLUCINATIONS]: Do not add ribbons, lace, side pieces, fasteners, or any "creative" elements not present in the reference. The garments must be laid flat, perfectly arranged to show every cut, color, and detail. [CRITICAL]: Every repeating pattern, intricate print, floral motif, and micro-texture must be preserved with 100% fidelity. [STATEMENT ELEMENTS — HIGHEST PRIORITY]: Any 3D structural element (feathers, 3D floral appliqués, bows, ruffle clusters, fringe, tassels, sequin zones, sculptural pleating) MUST be reproduced exactly — in its correct position on the garment, at full scale, with exact color and texture. These elements define the garment's identity. A feather at center chest must appear at center chest, full size, exact color. Zero drift on statement embellishments.`,
  DRESS:       `You are looking at a reference photograph of a dress or gown. Your task: extract ONLY the dress from this image and present it as a professional FLAT LAY on a clean white surface. [SURGICAL ISOLATION]: If a model or mannequin is wearing the dress, you must surgically isolate the garment and discard the person/mannequin completely. [NO HALLUCINATIONS]: You are strictly forbidden from adding any new elements (ribbons, clips, side panels, etc.) that are not in the source. [CRITICAL]: The repeating pattern, fabric weave, and intricate prints of the dress must be reproduced with 100% pixel-perfect fidelity. [STATEMENT ELEMENTS — HIGHEST PRIORITY]: Any 3D structural element on the dress (feathers, 3D floral appliqués, bows, ruffle clusters, sequin embellishment zones, sculptural pleating, fringe) MUST be reproduced exactly — in its correct position on the dress (bodice/neckline/shoulder/hem), at full scale, with exact color and texture. A large feather at center bodice must appear at center bodice, full size, exact color. These define the dress — they are non-negotiable.`,
  SHIRT:       `Re-photograph ONLY the shirt/top from this reference image on a headless mannequin. The garment must be exactly as shown — same color, cut, fabric, and every detail. Head/face: not visible. Background: clean studio.`,
  PANTS:       `Re-photograph ONLY the pants/trousers from this reference image on a headless lower-body mannequin. Exactly as shown — same color, cut, and detail. Head and torso cropped. Background: clean studio.`,
  SHORTS:      `Re-photograph ONLY the shorts from this reference image on a headless lower-body mannequin. Exactly as shown. Background: clean studio.`,
  SWIMWEAR:    `Re-photograph ONLY the swimwear from this reference image on a headless mannequin. Exactly as shown — same style, color, and cut. Face not visible. Background: clean neutral.`,
  HAIR:        `Re-photograph ONLY the hairstyle from this reference image. Show an extreme tight crop from the crown of the head down to the base of the neck — NO body, NO shoulders, NO clothing visible below the hairline. Face completely turned away or cropped out. Only hair architecture, color, texture, layers, and styling visible. Background: clean neutral studio. CRITICAL: No clothing, swimwear, or any garment may appear in this image.`,
  BARBER:      `Re-photograph ONLY the haircut and fade from this reference image. Tight crop showing only the hair from crown to the base of the neck — NO shoulders, NO body, NO clothing below the hairline. Show the back and sides of the cut structure. No face visible. Background: clean studio. CRITICAL: No clothing or garments may appear.`,
  NAILS:       `Re-photograph ONLY the nail art from this reference image. Show only the hands from wrist to fingertip — no face, no body above the wrists. Reproduce the nail design, colors, and finish exactly as shown. Background: clean white.`,
  MAKEUP:      `Reproduce ONLY the makeup look from this reference image — same colors, technique, and application — on a completely anonymous, featureless, generic placeholder face. No recognizable identity or resemblance to the original person. The makeup must match exactly. Background: clean white.`,
  SHOES:       `Re-photograph ONLY the footwear from this reference image. Show the shoes exactly as they appear — same style, color, material — either on a foot (ankle only, nothing above) or as a standalone product shot. Background: clean white.`,
  EARRINGS:    `Re-photograph ONLY the earrings from this reference image. Macro close-up. No face visible — just the earrings against a neutral background or on an earlobe. Reproduce exactly.`,
  NECKLACE:    `Re-photograph ONLY the necklace from this reference image. Show it against a neutral backdrop or on a collarbone (face cropped). Reproduce exactly.`,
};
const defaultIsolation = (anc) =>
  `Re-photograph ONLY the ${ANCHOR_LABELS[anc] || anc} from this reference image, exactly as it appears — same color, texture, and detail — without showing the person's face or any identifying features. Background: clean studio.`;

/**
 * Normalize any image input into { data: <base64>, mimeType }.
 * Accepts a data-URL, a raw base64 string, OR an http(s) URL (e.g. a Firebase
 * Storage SKU reference). URLs are fetched and base64-encoded because Gemini's
 * inlineData.data requires raw base64 bytes — passing a URL yields a 400
 * "Base64 decoding failed", which silently degraded SKU generation to text-only
 * (the root cause of garment drift). Returns { data: null } on absence/failure.
 */
async function resolveImageInput(input, fallbackMime = 'image/jpeg') {
  if (!input || typeof input !== 'string') return { data: null, mimeType: fallbackMime };
  const s = input.trim();
  if (/^https?:\/\//i.test(s)) {
    try {
      const resp = await fetch(s);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const buf = Buffer.from(await resp.arrayBuffer());
      const mimeType = (resp.headers.get('content-type') || fallbackMime).split(';')[0].trim();
      return { data: buf.toString('base64'), mimeType };
    } catch (err) {
      console.warn(`[FORGE] Image fetch failed for ${s.slice(0, 90)} — ${err.message}`);
      return { data: null, mimeType: fallbackMime };
    }
  }
  if (/^data:/i.test(s) && s.includes(',')) {
    const [header, data] = s.split(',');
    const mimeMatch = header.match(/^data:(image\/[\w+.-]+);/i);
    return { data: data.trim().replace(/\s/g, ''), mimeType: mimeMatch ? mimeMatch[1] : fallbackMime };
  }
  return { data: s.replace(/\s/g, ''), mimeType: fallbackMime };
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ── Auth gate — supports Firebase Bearer token OR brand API key ──────────
  const apiKey     = req.headers['x-brand-api-key'];
  const authHeader = req.headers['authorization'] || '';
  const idToken    = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!apiKey && !idToken) return res.status(401).json({ error: 'UNAUTHORIZED: No token provided.' });

  let forgeUid, forgeDisplayName, forgeBrandId = null;
  let creditDeducted = false;

  if (apiKey) {
    // ── Brand API key path — quota replaces per-user credits ──────────────
    try {
      const { validateBrandApiKey } = await import('../lib/forge/services/brand-auth.js');
      const { checkBrandQuota }     = await import('../lib/forge/services/brand-service.js');
      const { BRAND_QUOTA_COST_STANDARD, BRAND_QUOTA_COST_VTO } = await import('../lib/forge/constants.js');

      const brandDoc = await validateBrandApiKey(apiKey);
      if (!brandDoc) return res.status(401).json({ error: 'UNAUTHORIZED: Invalid or revoked API key.' });

      const { parseFirestoreFields } = await import('../lib/forge/services/gcp-raw.js');
      const brand = parseFirestoreFields(brandDoc.fields || {});
      forgeBrandId = brand.brandId;
      forgeUid     = `api_${forgeBrandId}`;
      forgeDisplayName = brand.name || 'Brand API';

      const isVto  = req.body?.config?.garmentImage || req.body?.skuId;
      const cost   = isVto ? BRAND_QUOTA_COST_VTO : BRAND_QUOTA_COST_STANDARD;
      const quotaOk = await checkBrandQuota(forgeBrandId, cost);
      if (!quotaOk) return res.status(402).json({ error: 'QUOTA_EXCEEDED: Monthly image quota reached.' });
      creditDeducted = true;
    } catch (err) {
      console.error('[FORGE API KEY ERROR]', err);
      return res.status(500).json({ error: `Auth error: ${err.message}` });
    }
  } else {
    // ── Firebase token path — existing consumer/portal logic unchanged ─────
    try {
      forgeUid = await verifyIdTokenREST(idToken);
      const payloadBase64 = idToken.split('.')[1];
      const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
      forgeDisplayName = decoded.name || decoded.email?.split('@')[0] || null;
    } catch {
      return res.status(401).json({ error: 'UNAUTHORIZED: Invalid or expired token.' });
    }

    // ── Brand-scoped portal forge: enforce membership + forge capability ───
    // When a brandId is supplied (portal generation against enrolled SKUs), the
    // caller MUST be a member of that exact brand with forge rights. This closes
    // two gaps: (1) viewers self-forging, and (2) tenant isolation — without it
    // any authenticated user could pass another brand's brandId/skuId and both
    // read that brand's SKU DNA and write campaigns into it.
    if (req.body?.brandId) {
      try {
        const { resolveBrandContext } = await import('../lib/forge/services/brand-auth.js');
        const { requireCapability }   = await import('../lib/forge/permissions.js');
        const bctx = await resolveBrandContext(req);
        if (bctx.brandId !== req.body.brandId) {
          return res.status(403).json({ error: 'FORBIDDEN: You are not a member of the requested brand workspace.' });
        }
        requireCapability(bctx, 'forge');
        // Membership verified — downstream reads req.body.brandId safely. We do NOT
        // repurpose forgeBrandId here, to preserve the existing generation-record
        // storage path (users/{uid}/generations) and avoid campaign-schema drift.
      } catch (err) {
        return res.status(err.statusCode || 403).json({ error: err.message || 'FORBIDDEN' });
      }
    }

    if (!checkRateLimit(forgeUid)) {
      return res.status(429).json({ error: 'RATE_LIMITED: Too many forge runs. Wait 60 seconds and try again.' });
    }
    try { creditDeducted = await deductCreditsREST(forgeUid, FORGE_CREDIT_COST, 'imageCredits'); }
    catch (err) {
      console.error('[FORGE CREDITS ERROR]', err);
      return res.status(500).json({ error: `Credit system error. Please try again. Details: ${err.message}` });
    }
    if (!creditDeducted) { return res.status(402).json({ error: 'INSUFFICIENT_CREDITS: Upgrade your plan to continue.' }); }
  }

  try {
    const { config }  = req.body;
    const entropy     = Math.random().toString(36).substring(7);
    const genAI       = createGenAI();

    // ── Load Aura profile (non-blocking — 3s timeout, graceful fallback) ──
    const auraProfile = await loadAuraProfile(null, forgeUid, forgeDisplayName);

    // ── Anchor normalisation ───────────────────────────────────────────────
    const anchorsRaw = config?.anchors || [config?.anchor || 'HAIR'];
    let anchors = (Array.isArray(anchorsRaw) ? anchorsRaw : [anchorsRaw]).map(a => String(a).toUpperCase());

    if (anchors.includes('FULL_OUTFIT')) {
      anchors = anchors.filter(a => a === 'FULL_OUTFIT' || !OUTFIT_SUBSUMES.includes(a));
      console.log(`[FORGE] Deduplication: FULL_OUTFIT present — removed redundant sub-anchors. Final: ${anchors.join(', ')}`);
    }

    const anchor         = anchors[0];
    const anchorDesc     = anchors.map(a => ANCHOR_LABELS[a] || a).join(' + ');
    const userPromptText = (config?.userPrompt || '').trim();
    // Creative-control mode: 'verbatim' uses the client prompt as-is (DNA still
    // locked); 'assisted' (default) lets the Director Agent compose the briefs.
    const promptMode = config?.promptMode === 'verbatim' ? 'verbatim' : 'assisted';
    console.log(`[FORGE] userPromptText="${userPromptText}" | mode=${promptMode} | locationPreset="${config?.locationPreset || ''}" | anchors=${JSON.stringify(anchors)}`);

    const hasClothingAnchor = anchors.some(a => CLOTHING_ANCHOR_TYPES.includes(a));

    // ── Gender ─────────────────────────────────────────────────────────────
    const subjectGender = (config?.gender || 'female').toLowerCase();
    const genderLabel   = subjectGender === 'male' ? 'male' : 'female';

    // ── Source image ───────────────────────────────────────────────────────
    let rawImageData = null;
    let rawMimeType  = 'image/jpeg';
    const sourceImage = config?.sourceImage;

    if (sourceImage) {
      const resolved = await resolveImageInput(sourceImage, rawMimeType);
      rawImageData = resolved.data;
      rawMimeType  = resolved.mimeType;
      console.log(`[FORGE] Source image: ${rawImageData ? (rawImageData.length / 1024 / 1024).toFixed(2) + 'MB base64 (' + rawMimeType + ')' : 'UNRESOLVED'}`);
    }
    if (!rawImageData) throw new Error('DNA_IMAGE_MISSING: source image could not be resolved (URL fetch failed or empty).');

    // ── Garment image ──────────────────────────────────────────────────────
    let garmentImageData = null;
    let garmentMimeType  = 'image/jpeg';
    const garmentImageRaw = config?.garmentImage;

    if (garmentImageRaw) {
      const resolved  = await resolveImageInput(garmentImageRaw, garmentMimeType);
      garmentImageData = resolved.data;
      garmentMimeType  = resolved.mimeType;
      console.log(`[FORGE] Garment Studio mode — garment image ${garmentImageData ? 'resolved (' + garmentMimeType + ')' : 'UNRESOLVED'}`);
      if (garmentImageData) anchors = ['FULL_OUTFIT'];
    }

    // ── Custom background / environment reference image ────────────────────
    // Brand uploads a photo of a real environment (store, set, location) and the
    // model is composited into a recreation of that scene. Face-free placement is
    // not required — this image is used ONLY for the surroundings, never identity.
    let backgroundRefImage = null;
    const backgroundImageRaw = config?.backgroundImage;
    if (backgroundImageRaw) {
      let bgData = backgroundImageRaw;
      let bgMime = 'image/jpeg';
      if (backgroundImageRaw.includes(',')) {
        const [header, data] = backgroundImageRaw.split(',');
        bgData = data.trim().replace(/\s/g, '');
        const m = header.match(/^data:(image\/\w+);/);
        if (m) bgMime = m[1];
      } else {
        bgData = backgroundImageRaw.trim().replace(/\s/g, '');
      }
      backgroundRefImage = { data: bgData, mimeType: bgMime };
      console.log(`[FORGE] CUSTOM BACKGROUND: environment reference image received (${(backgroundImageRaw.length / 1024 / 1024).toFixed(2)}MB)`);
    }

    // ── Additional multi-angle reference images ────────────────────────────
    const additionalModelImages = (req.body?.additionalModelImages || [])
      .map(img => ((typeof img === 'string' ? img : '').split(',')[1] || img).trim().replace(/\s/g, ''))
      .filter(Boolean);
    const additionalGarmentImages = (req.body?.additionalGarmentImages || [])
      .map(img => ((typeof img === 'string' ? img : '').split(',')[1] || img).trim().replace(/\s/g, ''))
      .filter(Boolean);

    const isGarmentMode      = !!garmentImageData;
    const isKeepGarment      = isGarmentMode && config?.strategy === 'keep';
    const isAiGeneratedEarly = config?.strategy !== 'keep';

    // =========================================================
    // AGENT 00: INTENT CLASSIFIER (deterministic — no LLM call)
    // =========================================================
    const selectedCameraKey = config?.camera || 'Soft Background (85mm)';
    const cameraConflicts   = anchors.filter(a => (ANCHOR_CAMERA_CONFLICTS[a] || []).includes(selectedCameraKey));

    let missionType;
    if (isKeepGarment)                                                missionType = 'KEEP_GARMENT_TRANSFER';
    else if (!isAiGeneratedEarly)                                     missionType = 'KEEP_ANCHOR_EDIT';
    else if (isGarmentMode)                                           missionType = 'AI_GARMENT_ANCHOR';
    else if (anchors.some(a => BEAUTY_PRECISION_ANCHORS.includes(a))) missionType = 'AI_BEAUTY_ANCHOR';
    else if (anchors.some(a => DETAIL_ACCESSORY_ANCHORS.includes(a))) missionType = 'AI_ACCESSORY_ANCHOR';
    else                                                               missionType = 'AI_STANDARD';

    console.log(`[FORGE] AGENT 00: MISSION_TYPE=${missionType} | IDENTITY=${isAiGeneratedEarly ? 'GENERATE' : 'CLONE'} | CAMERA_CONFLICTS=${cameraConflicts.length > 0 ? cameraConflicts.join(',') : 'none'}`);

    // ── SSE: flush headers immediately ────────────────────────────────────
    const genId   = `${Date.now()}-${entropy}`;
    const genPath = forgeBrandId
      ? `brands/${forgeBrandId}/campaigns`
      : `users/${forgeUid}/generations`;
    setFirestoreREST(genPath, genId, {
      status: 'started',
      startedAt: new Date().toISOString(),
    }).catch(() => {});
    res.setHeader('Content-Type',      'text/event-stream');
    res.setHeader('Cache-Control',     'no-cache');
    res.setHeader('Connection',        'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Heartbeat — write SSE comment every 15 s to prevent Vercel proxy from
    // dropping the connection during long silent periods (pre-pass, Agent 02.5 audit).
    // Agent 02.5 consistency audit alone can take 60–90 s with no stream output.
    const heartbeat = setInterval(() => {
      try { res.write(': heartbeat\n\n'); } catch { /* client gone */ }
    }, 15_000);

    // =========================================================
    // SKU RECALL — bypass Agent 01 + 01b when frozen DNA exists
    // Brand API path: req.body.skuId + req.body.brandId injected
    // Consumer path: skuId absent → normal Agent 01 pipeline
    // =========================================================
    const dnaMap = {};
    let modelIdentityDNA = null;
    let modelHairDNA     = null;
    let skuDnaInjected   = false;

    // Anchor reference images — declared here (not in the pre-pass block below) so
    // the SKU-recall path can assign them. Previously declared with `let` further
    // down, which put these in the temporal dead zone for the recall block: any SKU
    // with a reference image threw a swallowed ReferenceError, silently aborting
    // recall and discarding the frozen DNA. anchorRefImages[] carries the per-SKU
    // labeled references used by multi-SKU outfit combination.
    let anchorRefImage      = null;
    let anchorRefAnchorType = null;
    let anchorRefImages     = [];

    // Accept either a single skuId (legacy/consumer) or skuIds[] (outfit combination).
    const skuId      = req.body?.skuId || null;
    const skuIdsRaw  = req.body?.skuIds;
    const skuIds     = Array.isArray(skuIdsRaw) ? skuIdsRaw.filter(Boolean) : (skuId ? [skuId] : []);
    const bodyBrand  = req.body?.brandId || forgeBrandId || null;

    if (skuIds.length === 1 && bodyBrand) {
      try {
        const { loadSkuForForge } = await import('../lib/forge/services/sku-service.js');
        const skuData = await loadSkuForForge(bodyBrand, skuIds[0]);

        // Inject frozen DNA map — mirrors in-memory dnaMap structure exactly
        Object.assign(dnaMap, skuData.dna || {});
        if (skuData.dna?.identity)  modelIdentityDNA = skuData.dna.identity;
        if (skuData.dna?.hair)      modelHairDNA     = skuData.dna.hair;

        // Override anchor ref image with pre-rendered isolation from enrollment
        if (skuData.referenceImageBase64) {
          anchorRefImage      = { data: skuData.referenceImageBase64, mimeType: skuData.referenceImageMimeType || 'image/png' };
          anchorRefAnchorType = skuData.anchorType;
        }

        skuDnaInjected = true;
        console.log(`[FORGE] SKU RECALL: skuId=${skuIds[0]} | anchor=${skuData.anchorType} | fidelity=${skuData.fidelityScore} | Agent 01+01b BYPASSED`);
      } catch (err) {
        // Graceful degradation — if SKU load fails, full Agent 01 pipeline runs normally
        console.warn(`[FORGE] SKU recall failed (${err.message}) — falling back to full Agent 01 pipeline`);
      }
    } else if (skuIds.length > 1 && bodyBrand) {
      // ── MULTI-SKU OUTFIT COMBINATION ──────────────────────────────────────
      // Merge N enrolled garments (e.g. SHIRT + PANTS + SHOES) into one look.
      // Each SKU contributes its anchor-keyed frozen DNA and a labeled, face-free
      // reference image. anchors becomes the union of all SKU anchor types.
      try {
        const { loadSkusForForge } = await import('../lib/forge/services/sku-service.js');
        const merged = await loadSkusForForge(bodyBrand, skuIds);

        Object.assign(dnaMap, merged.dnaMap || {});
        if (merged.identity) modelIdentityDNA = merged.identity;
        if (merged.hair)     modelHairDNA     = merged.hair;

        // Union the SKU anchor types into the active anchors list, then re-apply
        // FULL_OUTFIT subsumption so a full-look SKU absorbs redundant sub-anchors.
        for (const anc of merged.anchorTypes) {
          if (!anchors.includes(anc)) anchors.push(anc);
        }
        if (anchors.includes('FULL_OUTFIT')) {
          anchors = anchors.filter(a => a === 'FULL_OUTFIT' || !OUTFIT_SUBSUMES.includes(a));
        }

        // Labeled per-SKU references for the multi-image AI_GENERATE parts array.
        anchorRefImages = merged.anchorRefs.map(ref => ({
          data: ref.data,
          mimeType: ref.mimeType,
          anchorType: ref.anchorType,
          label: ANCHOR_LABELS[ref.anchorType] || ref.anchorType,
          skuName: ref.skuName,
        }));
        if (anchorRefImages.length) {
          anchorRefImage      = anchorRefImages[0];          // primary (back-compat)
          anchorRefAnchorType = anchorRefImages[0].anchorType;
        }

        skuDnaInjected = true;
        const failedNote = merged.failed?.length ? ` | skipped ${merged.failed.length}` : '';
        console.log(`[FORGE] OUTFIT RECALL: ${merged.skuIds.length} SKUs | anchors=${anchors.join('+')} | refs=${anchorRefImages.length}${failedNote} | Agent 01+01b BYPASSED`);
      } catch (err) {
        console.warn(`[FORGE] Outfit recall failed (${err.message}) — falling back to full Agent 01 pipeline`);
      }
    }

    // =========================================================
    // AGENT 01: FORENSIC SCANNER — DNA EXTRACTION
    // Skipped when skuDnaInjected === true (SKU recall path)
    // Runs in parallel for all anchors + identity + hair.
    // =========================================================

    if (!skuDnaInjected) try {
      console.log(`[FORGE] AGENT 01: Extracting DNA for anchors: ${anchors.join(', ')}...`);
      const textModel = genAI.getGenerativeModel({ model: TEXT_MODEL });

      const identityTask = config?.strategy === 'keep' ? async () => {
        try {
          const identityPrompt = `FORENSIC MODEL IDENTITY ANALYST — Extract ONLY the permanent physical characteristics of the person in this image. Ignore everything they are wearing.

EXTRACT ONLY:
1. SKIN TONE: Fitzpatrick scale (I–VI), undertone (warm/cool/neutral), precise descriptor.
2. ETHNICITY/HERITAGE: Based on bone structure and facial features only.
3. AGE: Estimated range.
4. BODY TYPE: Frame, build, proportions.
5. FACE STRUCTURE: Cheekbones, nose shape, lip fullness, eye shape, jaw angle, brow.
6. EYE COLOR & SHAPE: Precise iris color and eye shape.
7. DISTINGUISHING FEATURES: Birthmarks, freckles, dimples, or permanent visible traits.

ABSOLUTELY FORBIDDEN — Do NOT mention, reference, or describe:
- Any clothing, swimwear, garments, or fabrics of any kind
- Any accessories, jewelry, or wearable items
- Hair (extracted separately)
- Makeup (extracted separately)
- The background or setting

OUTPUT: Physical identity profile only. Clothing is invisible to you.`;
          const extraParts = additionalModelImages.slice(0, 2)
            .map(d => ({ inlineData: { mimeType: 'image/jpeg', data: d } }));
          const scan = await textModel.generateContent({
            contents: [{ role: 'user', parts: [
              { inlineData: { mimeType: rawMimeType, data: rawImageData } },
              ...extraParts,
              { text: identityPrompt },
            ]}],
            safetySettings: isAiGeneratedEarly ? SAFETY_SETTINGS : null,
          });
          modelIdentityDNA = scan.response.text() || null;
          console.log(`[FORGE] MODEL IDENTITY extracted (${modelIdentityDNA?.length || 0} chars)`);
        } catch (err) {
          console.warn('[FORGE] MODEL IDENTITY extraction failed — slot fallback:', err?.message);
        }
      } : () => Promise.resolve();

      // Extract hair DNA whenever: keep mode, HAIR anchor, OR any source image is present (locks hair consistency across all 6 slots)
      const shouldExtractHairDNA = isKeepGarment || config?.strategy === 'keep' || anchors.includes('HAIR') || !!config?.sourceImage;
      const hairTask = shouldExtractHairDNA ? async () => {
        try {
          const hairPrompt = DNA_EXTRACTION_PROMPTS.HAIR + `\n\nPRECISION REQUIREMENT: This schematic will be used as the SOLE hair reference by an image generator that will NOT see the original photo. Be exhaustive — capture every detail of color, length, curl pattern, texture, styling, and silhouette.`;
          const scan = await textModel.generateContent({
            contents: [{ role: 'user', parts: [
              { inlineData: { mimeType: rawMimeType, data: rawImageData } },
              { text: hairPrompt },
            ]}],
            safetySettings: isAiGeneratedEarly ? SAFETY_SETTINGS : null,
          });
          modelHairDNA = scan.response.text() || null;
          console.log(`[FORGE] MODEL HAIR DNA extracted (${modelHairDNA?.length || 0} chars)`);
        } catch (err) {
          console.warn('[FORGE] MODEL HAIR DNA extraction failed:', err?.message);
        }
      } : () => Promise.resolve();

      const anchorTasks = anchors.map(async (anc) => {
        try {
          const basePrompt = DNA_EXTRACTION_PROMPTS[anc] || DNA_EXTRACTION_PROMPTS.HAIR;
          const extractionPrompt = basePrompt + `

PRECISION REQUIREMENT: This schematic will be used as the SOLE reference by an image generator that will NOT see the original photo. Your description must be precise enough that a skilled artist could recreate the ${ANCHOR_LABELS[anc] || anc} without seeing the image.
- Use specific color terminology
- Use measurements where applicable
- Name specific techniques
- Describe placement with anatomical precision
- Describe visible texture, finish, and surface quality in tactile terms
Be exhaustive. Every observable detail must be captured.`;
          const useGarmentImage = isGarmentMode && anc === 'FULL_OUTFIT' && garmentImageData;
          const dnaImageData    = useGarmentImage ? garmentImageData : rawImageData;
          const dnaMimeType     = useGarmentImage ? garmentMimeType  : rawMimeType;
          const extraParts      = (useGarmentImage ? additionalGarmentImages : additionalModelImages)
            .slice(0, 2)
            .map(d => ({ inlineData: { mimeType: 'image/jpeg', data: d } }));
          const scan = await textModel.generateContent({
            contents: [{ role: 'user', parts: [
              { inlineData: { mimeType: dnaMimeType, data: dnaImageData } },
              ...extraParts,
              { text: extractionPrompt },
            ]}],
            safetySettings: isAiGeneratedEarly ? SAFETY_SETTINGS : null,
          });
          dnaMap[anc] = scan.response.text() || `${ANCHOR_LABELS[anc] || anc} extracted from source.`;
        } catch (err) {
          console.warn(`[FORGE] DNA extraction fallback for ${anc}:`, err?.message);
          dnaMap[anc] = `Preserve the exact ${ANCHOR_LABELS[anc] || anc} from the source reference with 100% fidelity.`;
        }
      });

      await Promise.all([identityTask(), hairTask(), ...anchorTasks]);
      console.log(`[FORGE] DNA extraction complete. Keys: ${Object.keys(dnaMap).join(', ')}`);
    } catch (err) {
      console.warn('[FORGE] DNA batch extraction error:', err?.message);
      anchors.forEach(anc => {
        dnaMap[anc] = `Preserve the exact ${ANCHOR_LABELS[anc] || anc} from the source reference with 100% fidelity.`;
      });
    }

    // ── Director console lock values ───────────────────────────────────────
    const isAiGenerated  = config?.strategy !== 'keep';
    const lockedSkinTone = config?.skinTone  || 'neutral';
    const skinToneDesc   = SKIN_TONE_MAP[lockedSkinTone] || lockedSkinTone;
    // True when the client EXPLICITLY chose a skin tone (not the neutral default). When set,
    // the selection is authoritative and overrides any tone implied by a SKU's identity DNA —
    // otherwise a recalled garment's original model tone silently wins and the picker is dead.
    const skinToneExplicit = !!config?.skinTone && config.skinTone !== 'neutral';
    const lockedLighting = LIGHTING_MAP[config?.lighting] || LIGHTING_MAP['Clean & Even'];
    const lockedBgRaw    = config?.background || 'studio-grey';
    const lockedBgDesc   = {
      'studio-grey':     'clean medium grey seamless studio backdrop',
      'Studio-Grey':     'clean medium grey seamless studio backdrop',
      'pitch-black':     'pure black void background, high-contrast dark studio',
      'Pitch-Black':     'pure black void background, high-contrast dark studio',
      'editorial-white': 'bright clean white seamless backdrop, high-key editorial',
      'Editorial-White': 'bright clean white seamless backdrop, high-key editorial',
    }[lockedBgRaw] || (
      backgroundRefImage
        ? `the exact environment shown in the attached environment reference image${userPromptText ? ` (${userPromptText})` : ''}`
        : (lockedBgRaw === 'custom-bg' && userPromptText ? `environmental setting: ${userPromptText}` : 'clean grey seamless studio backdrop')
    );
    const lockedCamera       = CAMERA_FORMAT_MAP[config?.cameraFormat] || CAMERA_MAP[config?.camera] || CAMERA_MAP['Soft Background (85mm)'];
    const lockedColorGrade   = COLOR_GRADE_MAP[config?.colorGrade] || null;
    const modelArchetypeDesc = MODEL_ARCHETYPE_MAP[config?.modelArchetype] || MODEL_ARCHETYPE_MAP['High Fashion'];
    let   poseDesc           = POSE_MAP[config?.pose] || null;
    const expressionDesc     = EXPRESSION_MAP[config?.expression] || null;
    const ageRangeDesc       = AGE_RANGE_MAP[config?.ageRange] || AGE_RANGE_MAP['Prime Editorial (25–35)'];
    let shotTypeDesc         = SHOT_TYPE_MAP[config?.shotType] || SHOT_TYPE_MAP['Full Body'];
    let atmosphereDesc       = ATMOSPHERE_MAP[config?.atmosphere] || null;
    let stylingDesc          = STYLING_MAP[config?.styling] || null;
    const genderDesc         = GENDER_MAP[config?.gender] || null;
    const variationSeed      = VARIATION_SEEDS[Math.floor(Math.random() * VARIATION_SEEDS.length)];

    // =========================================================
    // AGENT 00-INTENT: SESSION INTELLIGENCE AGENT
    // Runs after DNA extraction, before Director briefs.
    // Enriches shot type, pose, and framing with anchor-aware precision.
    // Flip USE_INTENT_AGENT=false in constants.js for instant rollback.
    // =========================================================
    let intentData = null;
    if (USE_INTENT_AGENT) {
      intentData = await runAgent00Intent({
        genAI, TEXT_MODEL,
        anchors, missionType, config,
        dnaMap, modelIdentityDNA,
        genderLabel, skinToneDesc,
        shotTypeDesc, poseDesc: poseDesc ?? null,
        atmosphereDesc, stylingDesc,
        userPromptText, hasClothingAnchor,
        auraProfile,
      });
      if (intentData) {
        if (intentData.enrichedShotTypeDesc) shotTypeDesc = intentData.enrichedShotTypeDesc;
        if (intentData.enrichedPoseDesc && !poseDesc)    poseDesc     = intentData.enrichedPoseDesc;
        if (intentData.moodTarget && !atmosphereDesc)    atmosphereDesc = intentData.moodTarget;
      }
    }

    // ── Slot permutations ──────────────────────────────────────────────────
    const entropyNum = parseInt(entropy, 36) || Date.now();
    const rng = makeRng(entropyNum);
    const slots = {
      ethnicities: uniqueShuffle(ETHNICITIES, rng).slice(0, 6),
      faces:       uniqueShuffle(FACES,       makeRng(entropyNum + 1)).slice(0, 6),
      poses:       uniqueShuffle(POSES,       makeRng(entropyNum + 2)).slice(0, 6),
      outfits:     uniqueShuffle(OUTFITS,     makeRng(entropyNum + 3)).slice(0, 6),
      eyes:        uniqueShuffle([...EYE_COLORS, ...EYE_COLORS], makeRng(entropyNum + 4)).slice(0, 6),
      framings:    uniqueShuffle(hasClothingAnchor ? CLOTHING_FRAMINGS : FRAMINGS, makeRng(entropyNum + 5)).slice(0, 6),
      ages:        uniqueShuffle(AGES,        makeRng(entropyNum + 6)).slice(0, 6),
      bodyTypes:   uniqueShuffle(BODY_TYPES,  makeRng(entropyNum + 7)).slice(0, 6),
    };

    // =========================================================
    // AGENTS 01b–01g: PRE-PASS (VTO, anchor refs, pre-renders)
    // =========================================================
    // anchorRefImage / anchorRefAnchorType / anchorRefImages are declared above
    // (SKU-recall block) so recall can populate them. Only the pre-pass-local
    // refs are declared here.
    let garmentCleanRef     = null;
    let cleanGarmentRender  = null;
    let modelIdentityRef    = null;
    let clothingMaskedModel = null;
    let fashnVTOImage       = null;

    if (isGarmentMode && isAiGenerated) {
      // AI + garment mode: garment image is anchor ref directly
      anchorRefImage      = { data: garmentImageData, mimeType: garmentMimeType };
      anchorRefAnchorType = 'FULL_OUTFIT';
      console.log('[FORGE] GARMENT STUDIO (AI mode): garment image set as anchor ref — Agent 01b skipped.');
    }

    const anchorRefPromise = isKeepGarment
      // ─── THREE-STAGE PRE-PASS (keep + garment) ───────────────────────────
      ? (async () => {
          const pxlModel = genAI.getGenerativeModel({ model: PXL_MODEL });

          // Agent 01b: flat lay from garment image
          const p01b = (async () => {
            try {
              console.log('[FORGE] AGENT 01b: Generating flat lay from garment image...');
              const to = new Promise((_, rej) => setTimeout(() => rej(new Error('AGENT_01b_TIMEOUT: 25s')), 25000));
              const r  = await Promise.race([
                pxlModel.generateContent({
                  contents: [{ role: 'user', parts: [
                    { inlineData: { mimeType: garmentMimeType, data: garmentImageData } },
                    { text: ISOLATION_INSTRUCTIONS.FULL_OUTFIT },
                  ]}],
                  generationConfig: { responseModalities: ['IMAGE'], temperature: 0.1 },
                  safetySettings: null,
                }),
                to,
              ]);
              const part = r.response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
              if (!part) throw new Error('no image returned');
              garmentCleanRef = { data: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
              console.log('[FORGE] AGENT 01b: Flat lay ready.');
            } catch (err) { console.warn(`[FORGE] AGENT 01b failed: ${err?.message}`); }
          })();

          // Agent 01c: AI garment render from DNA + garment image
          const p01c = (async () => {
            try {
              console.log('[FORGE] AGENT 01c: Generating AI garment render from DNA + image...');
              const garmentDNA = dnaMap['DRESS'] || dnaMap['FULL_OUTFIT'] || '';
              const prompt = `You are a professional fashion photography studio AI. Generate a pristine studio FLAT LAY photograph of exactly these garments.\n\nGARMENT SPECIFICATION:\n${garmentDNA}\n\nMANDATORY REQUIREMENTS:\n- Clean white seamless background\n- All garments arranged perfectly flat, showing every cut, color, fabric, pattern, and design detail\n- [CRITICAL]: Every repeating pattern, intricate print, and fabric micro-texture must be rendered with 100% fidelity\n- ABSOLUTE PROHIBITION: No human body. No skin. No mannequin. No hands. No arms. No body parts.\n- Every color, pattern, fabric texture, and hardware detail must match the specification exactly\n- Professional overhead studio lighting, sharp and crisp\n- ONLY clothing items on white — nothing else whatsoever`;
              const to = new Promise((_, rej) => setTimeout(() => rej(new Error('AGENT_01c_TIMEOUT: 30s')), 30000));
              const r  = await Promise.race([
                pxlModel.generateContent({
                  contents: [{ role: 'user', parts: [
                    { inlineData: { mimeType: garmentMimeType, data: garmentImageData } },
                    { text: '\n' + prompt },
                  ]}],
                  generationConfig: { responseModalities: ['IMAGE'], temperature: 0.1 },
                  safetySettings: null,
                }),
                to,
              ]);
              const part = r.response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
              if (!part) throw new Error('no image returned');
              cleanGarmentRender = { data: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
              console.log('[FORGE] AGENT 01c: Clean garment render ready.');
            } catch (err) { console.warn(`[FORGE] AGENT 01c failed: ${err?.message}`); }
          })();

          // Agent 01d: model identity character reference sheet
          const p01d = (async () => {
            try {
              console.log('[FORGE] AGENT 01d: Generating model identity reference sheet...');
              const idBlocks = [
                modelIdentityDNA ? `PHYSICAL IDENTITY:\n${modelIdentityDNA}` : '',
                modelHairDNA     ? `HAIR:\n${modelHairDNA}` : '',
              ].filter(Boolean).join('\n\n');
              const prompt = `You are a character reference artist. Generate a full-body CHARACTER REFERENCE SHEET of the exact person shown in the source photograph.\n\n${idBlocks}\n\nMANDATORY REQUIREMENTS:\n- IDENTICAL to the source photograph — same face, exact skin tone, same hair\n- Neutral standing pose, facing camera directly\n- Plain clean white background\n- Wears ONLY a simple white fitted t-shirt and light grey sweatpants (placeholder garments)\n- Face clearly visible, expression neutral\n- Full body visible from head to toe\n- Professional studio lighting\n- SKIN TONE IS NON-NEGOTIABLE: reproduce exact skin depth, undertone, and warmth from source photo`;
              const to = new Promise((_, rej) => setTimeout(() => rej(new Error('AGENT_01d_TIMEOUT: 30s')), 30000));
              const r  = await Promise.race([
                pxlModel.generateContent({
                  contents: [{ role: 'user', parts: [
                    { text: 'Source person — use this as your identity reference:\n' },
                    { inlineData: { mimeType: rawMimeType, data: rawImageData } },
                    { text: '\n\n' + prompt },
                  ]}],
                  generationConfig: { responseModalities: ['IMAGE'], temperature: 0.1 },
                  safetySettings: null,
                }),
                to,
              ]);
              const part = r.response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
              if (!part) throw new Error('no image returned');
              modelIdentityRef = { data: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
              console.log('[FORGE] AGENT 01d: Model identity reference ready.');
            } catch (err) { console.warn(`[FORGE] AGENT 01d failed — will use original model photo: ${err?.message}`); }
          })();

          // Agent 01e: clothing masker (inpainting target)
          const p01e = (async () => {
            try {
              console.log('[FORGE] AGENT 01e: Generating clothing mask (inpainting target)...');
              const maskPrompt = `PHOTO EDITING TASK — CLOTHING MASKING.\n\nYou are a precision photo editor. Your ONLY task: replace ALL clothing and fabric items in this photograph with solid flat LIGHT GREY (#D8D8D8).\n\nREPLACE WITH #D8D8D8 GREY:\n- Every clothing item: shirt, pants, dress, jacket, coat, skirt, top, bodysuit, jumpsuit\n- Footwear: shoes, boots, sandals, heels\n- Wearable accessories: belt, bag, purse\n\nDO NOT TOUCH — FREEZE THESE EXACTLY AS SHOWN:\n- The person's FACE — every single feature, expression, and skin tone preserved pixel-perfect\n- All SKIN — same exact tone, depth, undertone, and warmth as the original\n- The HAIR — identical color, curl pattern, texture, length, silhouette\n- The BACKGROUND — identical to the input\n\nOUTPUT: The exact same photograph with ONLY the clothing/fabric areas replaced by flat solid #D8D8D8 grey.`;
              const to = new Promise((_, rej) => setTimeout(() => rej(new Error('AGENT_01e_TIMEOUT: 30s')), 30000));
              const r  = await Promise.race([
                withGeminiBackoff(() => pxlModel.generateContent({
                  contents: [{ role: 'user', parts: [
                    { inlineData: { mimeType: rawMimeType, data: rawImageData } },
                    { text: '\n' + maskPrompt },
                  ]}],
                  generationConfig: { responseModalities: ['IMAGE'], temperature: 0.05 },
                  safetySettings: null,
                })),
                to,
              ]);
              const part = r.response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
              if (!part) throw new Error('no image returned');
              clothingMaskedModel = { data: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
              console.log('[FORGE] AGENT 01e: Clothing mask ready — inpainting mode enabled.');
            } catch (err) { console.warn(`[FORGE] AGENT 01e failed — two-image fallback: ${err?.message}`); }
          })();

          // Agent 01f: VTO (keep mode — real person + garment)
          const p01f = (async () => {
            fashnVTOImage = await runAgent01fVTO({
              rawImageData,
              rawMimeType,
              garmentImageData,
              garmentMimeType,
              anchor,
              dnaMap,
              isAiGenerated,
              skinToneDesc,
              designerUid: forgeUid,
            });
          })();

          await Promise.all([p01b, p01c, p01d, p01e, p01f]);
          console.log(`[FORGE] PRE-PASS complete — 01b:${garmentCleanRef ? '✓' : '✗'} | 01c:${cleanGarmentRender ? '✓' : '✗'} | 01d:${modelIdentityRef ? '✓' : '✗'} | 01e:${clothingMaskedModel ? '✓' : '✗'} | 01f(VTO):${fashnVTOImage ? `✓ PRIMARY (${VERTEX_PROJECT ? 'VertexAI' : 'Fashn.ai'})` : '✗ → inpaint/two-image fallback'}`);
        })()

      // ─── AI mode, non-garment: face-free anchor isolation ───────────────
      : (!isGarmentMode && isAiGenerated) ? (async () => {
          try {
            const pxlModel = genAI.getGenerativeModel({ model: PXL_MODEL });
            const VISUAL_PRIORITY = ['FULL_OUTFIT','SHIRT','PANTS','SHORTS','SWIMWEAR','SHOES','NAILS','MAKEUP','HAIR','BARBER'];
            const primaryAnc = VISUAL_PRIORITY.find(a => anchors.includes(a)) || anchors[0];
            anchorRefAnchorType = primaryAnc;
            const isolationInstruction = ISOLATION_INSTRUCTIONS[primaryAnc] || defaultIsolation(primaryAnc);
            console.log(`[FORGE] AGENT 01b: Isolating ${primaryAnc} from source image...`);
            const to = new Promise((_, rej) => setTimeout(() => rej(new Error('AGENT_01b_TIMEOUT: 25s exceeded')), 25000));
            const r  = await Promise.race([
              withGeminiBackoff(() => pxlModel.generateContent({
                contents: [{ role: 'user', parts: [
                  { inlineData: { mimeType: rawMimeType, data: rawImageData } },
                  { text: isolationInstruction },
                ]}],
                generationConfig: { responseModalities: ['IMAGE'], temperature: 0.1 },
                safetySettings: isAiGenerated ? SAFETY_SETTINGS : null,
              })),
              to,
            ]);
            const part = r.response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
            if (!part) throw new Error('no image returned');
            anchorRefImage = { data: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
            console.log(`[FORGE] AGENT 01b: Isolation complete — ${primaryAnc} reference image ready.`);
          } catch (err) {
            console.warn(`[FORGE] AGENT 01b: Isolation failed, falling back to text-only: ${err?.message}`);
            anchorRefImage = null;
          }
        })()

      // ─── AI + garment (FASHN pipeline): Garment Showcase mode ───────────
      : (isGarmentMode && (FASHN_API_KEY || VERTEX_PROJECT)) ? (async () => {
          // Agent 01g: generate neutral AI character
          const aiCharacterRef = await runAgent01gAiCharacter({
            genAI,
            PXL_MODEL,
            genderLabel,
            skinToneDesc,
            charEthnicity: slots.ethnicities[0],
            charFace:      slots.faces[0],
            charBodyType:  slots.bodyTypes[0],
            charAge:       slots.ages[0],
            anchors,
            dnaMap,
          });

          // Agent 01f-AI: apply garment to AI character
          if (aiCharacterRef) {
            fashnVTOImage = await runAgent01fAiVTO({
              aiCharacterRef,
              garmentImageData,
              garmentMimeType,
              anchor,
              dnaMap,
              skinToneDesc,
              designerUid: forgeUid,
            });
          }

          // Fallback: if pipeline failed, keep garment image as anchor ref
          if (!fashnVTOImage) {
            anchorRefImage      = { data: garmentImageData, mimeType: garmentMimeType };
            anchorRefAnchorType = 'FULL_OUTFIT';
            console.log('[FORGE] AI+FASHN: pipeline failed — garment anchor ref active (AI_GENERATE fallback).');
          }
          console.log(`[FORGE] AI+FASHN PRE-PASS: 01g:${aiCharacterRef ? '✓' : '✗'} | 01f-AI:${fashnVTOImage ? '✓ VTO_EDITORIAL' : '✗ AI_GENERATE fallback'}`);
        })()

      : Promise.resolve(); // keep non-garment (PHOTO_EDIT) — no garment pre-pass needed

    // =========================================================
    // AGENT 02: CREATIVE DIRECTOR — 6 integrated scene briefs
    // =========================================================
    let directorBriefs;
    if (promptMode === 'verbatim' && userPromptText) {
      // VERBATIM — full creative control. The client's composed prompt becomes the
      // brief for all 6 plates, used exactly as written. The garment/DNA reference
      // image is still attached and locked downstream; only the scene text is the
      // user's. Director rewrite AND the consistency audit are skipped so nothing
      // alters the text. Per-plate variety comes from the temperature ladder.
      console.log('[FORGE] AGENT 02: VERBATIM mode — client prompt used as-is on all 6 slots (Director bypassed)');
      directorBriefs = Array.from({ length: 6 }, () => userPromptText);
      await anchorRefPromise;
    } else {
      console.log('[FORGE] AGENT 02: Director writing 6 integrated scene briefs...');
      directorBriefs = await runAgent02Director({
        genAI,
        TEXT_MODEL,
        config,
        anchors,
        anchorDesc,
        dnaMap,
        modelIdentityDNA,
        isAiGenerated,
        hasClothingAnchor,
        genderLabel,
        skinToneDesc,
        lockedLighting,
        lockedBgRaw,
        lockedBgDesc,
        lockedCamera,
        lockedColorGrade,
        atmosphereDesc,
        userPromptText,
        slots,
      });
    }

    // Wait for pre-pass to finish before proceeding
    await anchorRefPromise;
    console.log(`[FORGE] AGENT 02 complete — ${directorBriefs.length} brief(s) ready | fashnVTO: ${fashnVTOImage ? '✓ LOCKED' : 'none'} | anchorRef: ${anchorRefImage ? 'ready' : 'none'} | cleanGarmentRender: ${cleanGarmentRender ? '✓' : isKeepGarment ? '✗ fallback' : 'n/a'} | modelIdentityRef: ${modelIdentityRef ? '✓' : isKeepGarment ? '✗ fallback→original' : 'n/a'}`);

    // VTO_EDITORIAL path active — garment reference + VTO dual-image passed per slot.
    // No segmentation needed. Pose, drape, and lighting are dynamically generated.

    // =========================================================
    // AGENT 02.5: CROSS-SLOT CONSISTENCY AUDIT
    // =========================================================
    if (promptMode !== 'verbatim' && directorBriefs && directorBriefs.length >= 6) {
      try {
        console.log('[FORGE] AGENT 02.5: Cross-slot consistency audit...');
        const consistencyModel   = genAI.getGenerativeModel({ model: TEXT_MODEL });
        const bgLockForAudit     = config?.locationPreset
          ? config.locationPreset
          : (lockedBgRaw === 'custom-bg' && userPromptText) ? userPromptText : lockedBgDesc;
        const skinLockForAudit   = skinToneExplicit
          ? `render this exact client-selected skin tone in every slot — ${skinToneDesc} — overriding any tone implied by the identity profile; no lightening, darkening, or substitution`
          : (modelIdentityDNA
              ? 'match the extracted model identity skin tone — no lightening, darkening, or override'
              : skinToneDesc);
        const briefsBlock        = directorBriefs.map((b, i) => `SLOT ${i + 1}:\n${b}`).join('\n\n---\n\n');
        const clientDirectionLine = userPromptText
          ? `5. CLIENT SCENE DIRECTION: Every corrected brief MUST include this client directive verbatim or as a direct visual description: "${userPromptText}". Do NOT remove or omit it when correcting any slot.`
          : '';

        const consistencyTask = `You are a CONSISTENCY AUDITOR for a luxury fashion shoot. Review the image generation prompt for compliance.

INVARIANTS — every slot must comply:
1. GENDER: ${genderLabel === 'male' ? 'MALE only. Zero female pronouns (she/her/hers/woman/feminine). Any female reference = violation.' : 'FEMALE only. Zero male pronouns (he/him/his/man/masculine). Any male reference = violation.'}
2. BACKGROUND: Must describe exactly this environment: "${bgLockForAudit}". Any other background = violation.
3. SKIN TONE: Must ${skinLockForAudit}.
4. ANCHOR PRESENCE: The ${anchorDesc} must be described.
${clientDirectionLine}
5. GARMENT ARCHITECTURE: Every slot must feature the EXACT same garment structure. No ribbons, lace, or accessories added to one slot that aren't in all others.
6. PATTERN CONTINUITY: Repeating patterns and prints must match across all slots.
7. IDENTITY: All slots must describe the SAME physical identity and bone structure. Distinct poses, but same person.

POSE PRESERVATION: Each slot intentionally has a DIFFERENT pose, crop, and composition. Do NOT standardize poses. Preserve the unique framing of each slot exactly as written.

REVIEW THESE 6 PROMPTS:
${briefsBlock}

OUTPUT FORMAT:
SLOT 1: PASS
or
SLOT 1: CORRECTED
[full corrected prompt here]

Rules: ONLY correct slots that actually violate an invariant above. Do not rewrite passing slots. Do not homogenize poses. Output all 6 results.`;

        const consistencyResult = await consistencyModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: consistencyTask }] }],
          generationConfig: { temperature: 0.1 },
          safetySettings: isAiGenerated ? SAFETY_SETTINGS : null,
        });
        const consistencyOutput = consistencyResult.response.text() || '';

        const slotPattern = /SLOT\s+(\d+)\s*:\s*(PASS|CORRECTED)\s*([\s\S]*?)(?=SLOT\s+\d+\s*:|$)/gi;
        let match;
        let correctionCount = 0;
        while ((match = slotPattern.exec(consistencyOutput)) !== null) {
          const slotNum    = parseInt(match[1], 10) - 1;
          const verdict    = match[2].toUpperCase().trim();
          const correction = match[3].trim();
          if (verdict === 'CORRECTED' && correction.length > 80 && slotNum >= 0 && slotNum < 6) {
            directorBriefs[slotNum] = correction;
            correctionCount++;
          }
        }
        console.log(`[FORGE] AGENT 02.5: Consistency audit complete — ${correctionCount}/6 slot(s) corrected.`);
      } catch (err) {
        console.warn('[FORGE] AGENT 02.5: Audit failed — proceeding with original briefs:', err?.message);
      }
    }

    // =========================================================
    // AGENT 03: IMAGE PRODUCER
    // Executes each Director brief as a text-to-image call via PromptArchitect.
    // Source image is NEVER sent here — zero face bleed possible.
    // =========================================================
    const DIRECTION_SETS = {
      'full-spread':  [0, 1, 2, 3, 4, 5, 6, 7, 8],
      'high-fashion': [0, 3, 1, 6, 4, 0, 3, 1, 6],
      'commercial':   [8, 5, 2, 7, 1, 8, 5, 2, 7],
    };

    const callGenerate = async (seed, mutation = null) => {
      const salt = `${entropy}_v${seed + 1}_${Math.random().toString(36).substring(5)}`;

      const userPickedLighting = config?.lighting && config.lighting !== 'Clean & Even';
      const specificStyle = config?.photoDirection && !['full-spread','high-fashion','commercial'].includes(config.photoDirection)
        ? MASTER_PHOTOGRAPHY_DIRECTIONS.find(d => d.id === config.photoDirection)
        : null;
      const dirSet  = DIRECTION_SETS[config?.photoDirection] || DIRECTION_SETS['full-spread'];
      const slotDir = specificStyle || MASTER_PHOTOGRAPHY_DIRECTIONS[dirSet[seed % dirSet.length]];
      const slotScene = {
        lighting:    userPickedLighting ? lockedLighting : slotDir.lighting,
        env:         slotDir.aesthetic,
        colorGrade:  lockedColorGrade || slotDir.color_grade,
        composition: slotDir.composition,
        camera:      config?.cameraFormat ? lockedCamera : slotDir.camera_note,
        post:        slotDir.post,
        name:        slotDir.name,
        publication: slotDir.publication,
      };

      const bgLock = config?.locationPreset
        ? config.locationPreset
        : (lockedBgRaw === 'custom-bg' && userPromptText) ? userPromptText : lockedBgDesc;
      const isCustomEnv = !!(config?.locationPreset) || !!backgroundRefImage || (lockedBgRaw === 'custom-bg' && !!userPromptText);

      const anchorRefLabel = anchorRefAnchorType ? (ANCHOR_LABELS[anchorRefAnchorType] || anchorRefAnchorType) : anchorDesc;
      // Multi-SKU outfit: enumerate every garment reference so the model knows each
      // attached image is a distinct, independently-locked garment in one look.
      const anchorRefNote = anchorRefImages.length > 1
        ? `\n\nOUTFIT VISUAL REFERENCES — ${anchorRefImages.length} GARMENTS COMPOSED INTO ONE LOOK:\n` +
          anchorRefImages.map((ref, i) =>
            `• Image ${i + 1} = ${ref.label}: reproduce this exact ${ref.label} — every detail of color, texture, structure, and finish — worn together with the other garments below.`
          ).join('\n') +
          `\nThe subject wears ALL of these garments simultaneously as a single coordinated outfit. Each garment is independently locked: do not blend, swap, merge, or omit any of them. All other model attributes come from the scene brief above.`
        : anchorRefImage
          ? `\n\nANCHOR VISUAL REFERENCE: The attached image shows ONLY the ${anchorRefLabel} as a face-free visual style reference. Reproduce the ${anchorRefLabel} exactly as shown — every detail of color, texture, structure, and finish. All other model attributes come from the scene brief above.`
          : '';

      const spec = PromptArchitect.build({
        seed, salt, mutation,
        isAiGenerated, isKeepGarment,
        fashnVTOImage, clothingMaskedModel,
        rawImageData, rawMimeType,
        garmentImageData, garmentMimeType,
        anchorRefImage, anchorRefAnchorType, anchorRefImages,
        backgroundRefImage,
        cleanGarmentRender, garmentCleanRef,
        dnaMap, allDnaBlock: anchors.map(anc =>
          `${anc.toUpperCase()} — ${(ANCHOR_LABELS[anc] || anc).toUpperCase()}:\n${dnaMap[anc] || ''}`
        ).join('\n\n---\n\n'),
        modelIdentityDNA, modelHairDNA,
        anchors, anchorDesc, anchorLabels: ANCHOR_LABELS, hasClothingAnchor,
        bgLock, isCustomEnv, lockedBgDesc,
        slotScene, slotDir,
        slotPose:    poseDesc || slots.poses[seed] || 'standing upright, direct gaze, confident posture',
        slotFrm:     shotTypeDesc || slots.framings[seed] || 'FULL BODY: Head to feet fully in frame.',
        slotFraming: shotTypeDesc || slots.framings[seed] || '',
        brief:       directorBriefs[seed],
        anchorRefNote,
        skinToneDesc, skinToneExplicit, lockedLighting,
        modelArchetypeDesc, poseDesc, expressionDesc,
        ageRangeDesc, shotTypeDesc, atmosphereDesc,
        stylingDesc, genderDesc, variationSeed,
        calculateSlotTemperature,
        userDirection: userPromptText || '',
        verbatim:      promptMode === 'verbatim',
      });

      spec.log.forEach(line => console.log(line));
      spec.warnings.filter(w => w.severity === 'warn').forEach(w =>
        console.warn(`[FORGE] Slot ${seed + 1} PRE-FLIGHT WARN [${w.code}]: ${w.message}`)
      );
      console.log(`[FORGE] Slot ${seed + 1} | MODE: ${spec.mode} | TEMP: ${spec.tempInfo.final.toFixed(3)}${mutation ? ` (retry Δ=${mutation.tempDelta})` : ''}`);

      // ── VTO_EDITORIAL path: dual-reference (garment + VTO) sent via spec.parts ──
      const genModel = genAI.getGenerativeModel({ model: PXL_MODEL });
      const result   = await withGeminiBackoff(() => genModel.generateContent({
        contents: [{ role: 'user', parts: spec.parts }],
        ...spec.apiConfig,
      }));

      const part = result.response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
      if (!part) throw new Error('IMAGE_MISSING');

      // ── Visual garment audit — VTO_EDITORIAL mode only ────────────────────
      // Compare generated garment pixels against the VTO reference via Gemini vision.
      // Slots scoring below 65/100 pattern fidelity throw GARMENT_DRIFT → Pass 2 retry
      // with stronger pattern lock instruction and lower temperature.
      // Uses TEXT_MODEL (vision-capable, fast) — not image generation model.
      if (fashnVTOImage && spec.mode === 'VTO_EDITORIAL') {
        try {
          const vtoRef = fashnVTOImage.includes(',') ? fashnVTOImage.split(',')[1] : fashnVTOImage;
          const auditModel = genAI.getGenerativeModel({ model: TEXT_MODEL });
          const auditResult = await auditModel.generateContent({
            contents: [{
              role: 'user',
              parts: [
                { inlineData: { mimeType: 'image/jpeg', data: vtoRef } },
                { inlineData: { mimeType: part.inlineData.mimeType || 'image/png', data: part.inlineData.data } },
                { text: 'Image 1 is the garment reference (VTO output). Image 2 is a newly generated editorial image. Compare ONLY the garment/clothing pattern: prints, motifs, color blocks, fabric texture. How accurately does Image 2 reproduce the garment from Image 1? Reply with ONLY a number 0-100. 100 = pixel-perfect match. 0 = completely different garment.' },
              ],
            }],
            generationConfig: { temperature: 0.0, maxOutputTokens: 8 },
          });
          const scoreRaw = auditResult.response.text().trim().replace(/[^\d]/g, '');
          const score    = parseInt(scoreRaw, 10);
          console.log(`[FORGE] GARMENT AUDIT: Slot ${seed + 1} → ${isNaN(score) ? 'unscored' : `${score}/100`}`);
          if (!isNaN(score) && score < 65) {
            throw new Error(`GARMENT_DRIFT: Slot ${seed + 1} pattern fidelity ${score}/100 — below threshold. Retrying with pattern lock.`);
          }
        } catch (auditErr) {
          if (auditErr.message.startsWith('GARMENT_DRIFT')) throw auditErr;
          console.warn(`[FORGE] GARMENT AUDIT: Slot ${seed + 1} audit failed (non-critical) — ${auditErr.message}`);
        }
      }

      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    };

    // ── Firestore: write generation history record ─────────────────────────
    console.log(`[FORGE] v10.0 — Modular | Mission: ${missionType} | UID: ${forgeUid} | Anchor: ${anchor} | Strategy: ${config?.strategy} | Skin: ${lockedSkinTone} | Batch: ${entropy} | FASHN: ${fashnVTOImage ? 'LOCKED' : 'none'}`);
    setFirestoreREST(`users/${forgeUid}/generations`, genId, {
      id: genId,
      status: 'processing',
      missionType,
      anchors: anchors.join(','),
      strategy: config?.strategy || 'change',
      creditsUsed: fashnVTOImage ? FORGE_CREDIT_COST_VTO : FORGE_CREDIT_COST,
      startedAt: new Date().toISOString(),
      imagesDelivered: 0,
    }).catch((e) => console.error('[FORGE] Firestore write failed:', e.message));

    // ── SSE helper ─────────────────────────────────────────────────────────
    // Generated images are 2K base64 (multi-MB each). Streaming six over SSE
    // exceeds Vercel's serverless response cap — the stream is severed after
    // ~2 images (the "only 2 of 6 rendered" bug). So upload each finished image
    // to public Storage and stream its small URL instead. The internal
    // masterGrid keeps the original data-URL so the vault/history contract is
    // unchanged. Uploads are awaited (below) before the 'done' signal.
    const liveBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET;
    const streamPromises = [];
    const streamSlot = (slotIndex, image) => {
      const p = (async () => {
        let payload = image;
        try {
          const m = /^data:(image\/[\w+.-]+);base64,(.+)$/s.exec(image);
          if (m && liveBucket) {
            const mime = m[1];
            const ext  = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
            const buf  = Buffer.from(m[2], 'base64');
            const path = `forge-live/${forgeUid}/${entropy}/slot_${slotIndex}_${Date.now()}.${ext}`;
            payload = await uploadStorageREST(liveBucket, path, buf, mime);
          }
        } catch (err) {
          console.warn(`[FORGE] Slot ${slotIndex + 1} upload failed (${err.message}) — streaming inline base64`);
          payload = image; // fall back to inline data-URL
        }
        try { res.write(`data: ${JSON.stringify({ type: 'image', slot: slotIndex, image: payload })}\n\n`); }
        catch { /* client disconnected */ }
      })();
      streamPromises.push(p);
    };

    // ── Pass 1: 3 concurrent workers, stream each success immediately ──────
    const slotCall = (i) => () => new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`SLOT_${i + 1}_TIMEOUT`)), 55000);
      callGenerate(i)
        .then(v => { clearTimeout(timer); resolve(v); })
        .catch(e => { clearTimeout(timer); reject(e); });
    });

    const results = await pLimitStreaming(
      Array.from({ length: 6 }, (_, i) => slotCall(i)),
      3,
      (i, result) => { if (result.status === 'fulfilled') streamSlot(i, result.value); }
    );

    // ── Pass 2: smart mutation retry for any failures ──────────────────────
    const failedIndices = results.map((r, i) => r.status === 'rejected' ? i : -1).filter(i => i !== -1);
    if (failedIndices.length > 0) {
      const anyRateLimit = failedIndices.some(i => {
        const msg = String(results[i]?.reason?.message || results[i]?.reason || '');
        return msg.includes('429') || msg.includes('Too Many Requests') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
      });
      const pass2Delay = anyRateLimit ? 12000 : 2000;
      console.log(`[FORGE] Pass 2 — smart retry for ${failedIndices.length} slot(s): [${failedIndices.map(i => i + 1).join(', ')}] — delay: ${pass2Delay}ms${anyRateLimit ? ' (rate-limit cooldown)' : ''}`);
      await new Promise(r => setTimeout(r, pass2Delay));

      const mutatedSlotCall = (i) => {
        const failReason = results[i]?.reason?.message || String(results[i]?.reason || '');
        const failClass  = classifyFailure(failReason);
        const mutation   = FAILURE_MUTATIONS[failClass] || FAILURE_MUTATIONS.DEFAULT;
        console.log(`[FORGE] Pass 2 slot ${i + 1}: classified as "${failClass}" — tempDelta=${mutation.tempDelta}`);
        return () => new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error(`SLOT_${i + 1}_TIMEOUT`)), 55000);
          callGenerate(i, mutation)
            .then(v => { clearTimeout(timer); resolve(v); })
            .catch(e => { clearTimeout(timer); reject(e); });
        });
      };

      await pLimitStreaming(
        failedIndices.map(mutatedSlotCall),
        3,
        (j, result) => {
          const origIdx      = failedIndices[j];
          results[origIdx]   = result;
          if (result.status === 'fulfilled') streamSlot(origIdx, result.value);
        }
      );
    }

    // ── Finalise ───────────────────────────────────────────────────────────
    const masterGrid = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failCount  = results.filter(r => r.status === 'rejected').length;

    if (masterGrid.length === 0) {
      const firstError = results.find(r => r.status === 'rejected')?.reason;
      const msg = firstError?.message || 'Forge cluster: all 6 attempts failed.';
      updateFirestoreREST(`users/${forgeUid}/generations`, genId, { status: 'failed', completedAt: new Date().toISOString() }).catch(() => {});
      clearInterval(heartbeat);
      try { res.write(`data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`); res.end(); } catch {}
      return;
    }

    if (failCount > 0) {
      const reasons = results
        .filter(r => r.status === 'rejected')
        .map((r, i) => `slot ${i + 1}: ${r.reason?.message || r.reason}`)
        .join('; ');
      console.warn(`[FORGE] ${failCount}/6 still failed after retry: ${reasons}`);
    }

    updateFirestoreREST(`users/${forgeUid}/generations`, genId, {
      status: 'complete',
      imagesDelivered: masterGrid.length,
      completedAt: new Date().toISOString(),
    }).catch(() => {});

    console.log(`[FORGE] Complete — ${masterGrid.length}/6 images produced.`);

    // ── Aura profile update (fire-and-forget — never blocks response) ──────
    updateAuraProfile(null, forgeUid, {
      anchors,
      shotType:      config?.shotType   || null,
      mood:          config?.atmosphere || null,
      lighting:      config?.lighting   || null,
      imagesProduced: masterGrid.length,
    }).catch(() => {});

    // Ensure every per-slot image upload has flushed to the client before 'done'
    await Promise.allSettled(streamPromises);

    clearInterval(heartbeat);
    try {
      res.write(`data: ${JSON.stringify({ type: 'done', count: masterGrid.length })}\n\n`);
      res.end();
    } catch { /* client disconnected before done signal */ }

  } catch (error) {
    console.error('FORGE_FATAL:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message });
    }
    clearInterval(heartbeat);
    try { res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`); res.end(); } catch {}
  }
}
