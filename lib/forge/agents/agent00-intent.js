/**
 * lib/forge/agents/agent00-intent.js  —  Session Intelligence Agent v1.0
 *
 * Intent Parser + Conflict Resolver.
 * Runs after Agent 01 (DNA extraction), before Agent 02 (Director briefs).
 *
 * Single Gemini 2.5 Flash text call (~$0.0003/run) that reads the full
 * selection context, detects conflicts, and emits a structured GenerationIntent
 * that replaces raw config-map lookups in the prompt builders.
 *
 * SWAPPABLE: controlled by USE_INTENT_AGENT in lib/forge/constants.js.
 * GRACEFUL DEGRADATION: any failure returns null → forge.js falls back to
 * original raw ctx fields with zero pipeline disruption.
 *
 * ── GenerationIntent schema ──────────────────────────────────────────────────
 * {
 *   enrichedShotTypeDesc : string  — anchor-aware, unambiguous framing directive
 *   enrichedPoseDesc     : string  — anchor-context-aware body/head orientation
 *   forbiddenFraming     : string[] — framings the image model must explicitly NOT use
 *   cameraAngle          : string  — exact camera position relative to subject
 *   subjectFocus         : string  — what the lens prioritises
 *   moodTarget           : string  — editorial/emotional tone
 *   anchorPriority       : string[] — anchor names in descending priority
 *   warningFlags         : string[] — detected conflicts + auto-corrections applied
 *   confidence           : { shotType, anchor, mood } → 'HIGH' | 'MEDIUM' | 'LOW'
 * }
 */

// ── Anchor label map (mirrors constants.js — kept local to avoid circular import) ──
const ANCHOR_LABEL_MAP = {
  HAIR: 'Natural Hair', BARBER: 'Barbershop Cut', MAKEUP: 'Makeup Look',
  NAILS: 'Nail Art', EARRINGS: 'Earrings', NECKLACE: 'Necklace',
  RING: 'Ring', BRACELET: 'Bracelet', WATCH: 'Watch', BELT: 'Belt',
  SHIRT: 'Shirt/Top', PANTS: 'Pants/Trousers', SHORTS: 'Shorts',
  SWIMWEAR: 'Swimwear', HAT: 'Hat', FULL_OUTFIT: 'Full Outfit',
  SHOES: 'Shoes/Footwear', DRESS: 'Dress/Gown',
};

const BEAUTY_PRECISION_SET = new Set(['HAIR', 'BARBER', 'MAKEUP', 'NAILS']);
const DETAIL_ACCESSORY_SET = new Set(['EARRINGS', 'NECKLACE', 'RING', 'BRACELET', 'WATCH', 'BELT']);
const CLOTHING_SET         = new Set(['SHIRT', 'PANTS', 'SHORTS', 'SWIMWEAR', 'HAT', 'FULL_OUTFIT', 'SHOES', 'DRESS']);

// ── Deterministic pre-rules (zero LLM cost) ───────────────────────────────────
// Applied before and after the LLM call to guarantee critical constraints
// even if the LLM response is partial or malformed.
function applyDeterministicRules(intent, anchors, shotTypeDesc) {
  const hasBeautyAnchor = anchors.some(a => BEAUTY_PRECISION_SET.has(a));
  const beautyAnchors   = anchors.filter(a => BEAUTY_PRECISION_SET.has(a));

  // Rule 1: Beauty anchor always forces close-up — non-negotiable
  if (hasBeautyAnchor) {
    const anchorLabel = beautyAnchors.map(a => ANCHOR_LABEL_MAP[a] || a).join(' + ');
    const isHairOrBarber = beautyAnchors.some(a => a === 'HAIR' || a === 'BARBER');
    const closeupSpec = isHairOrBarber
      ? `CLOSE-UP BEAUTY SHOT — frame from collarbone up. Crown of head fully in frame. Nape of neck visible. Camera facing FRONT or 3/4 profile. NEVER photograph from behind. NEVER show back of head as primary composition. Focus: hair architecture, color, texture, and styling detail.`
      : `CLOSE-UP BEAUTY SHOT — frame from collarbone up or tighter. Camera facing subject directly or 3/4 angle. Focus: ${anchorLabel}. No body below shoulders.`;

    // Only override if user didn't explicitly pick a wider shot
    const userPickedWide = shotTypeDesc && (
      /full.?body|full.?length|head.?to.?feet|waist.?down/i.test(shotTypeDesc)
    );
    if (!userPickedWide) {
      intent.enrichedShotTypeDesc = closeupSpec;
      if (!intent.forbiddenFraming) intent.forbiddenFraming = [];
      intent.forbiddenFraming.push(
        'full body shot',
        'waist-length shot',
        'back of head',
        'rear angle',
        'photographed from behind',
        'three-quarter rear',
      );
      if (isHairOrBarber) {
        intent.forbiddenFraming.push(
          'back of head as primary subject',
          'nape-only shot with no front visible',
          'rear-facing model',
        );
        intent.cameraAngle = 'Front-facing or 3/4 side profile. Camera positioned at eye level or slightly above. NEVER rear angle.';
      }
      if (!intent.warningFlags) intent.warningFlags = [];
      if (hasBeautyAnchor && (!shotTypeDesc || !/close.?up|beauty|portrait|head.?shot/i.test(shotTypeDesc))) {
        intent.warningFlags.push(`AUTO-CORRECTION: ${anchorLabel} anchor detected → forced close-up beauty framing. Full-body default suppressed.`);
      }
    }
  }

  // Rule 2: If user explicitly selected shot type, hard-lock it (never soften)
  if (shotTypeDesc && intent.enrichedShotTypeDesc && !intent.enrichedShotTypeDesc.includes(shotTypeDesc.substring(0, 30))) {
    intent.enrichedShotTypeDesc = `${intent.enrichedShotTypeDesc} USER SELECTION [ABSOLUTE LOCK]: ${shotTypeDesc}`;
  }

  // Rule 2b: Multi-anchor conflict — BEAUTY vs CLOTHING/FOOTWEAR
  // Only fires when the user did NOT explicitly select a wide/full-body shot.
  // If the user picked Full Body, their selection is an absolute override — show both anchors,
  // HAIR as the editorial hero with clothing/footwear visible at their natural position.
  // If no shot type is selected (or user picked close-up/portrait), BEAUTY wins and the
  // clothing/footwear anchor is suppressed from the frame — rendering both causes hallucination.
  const userExplicitlyPickedWide = shotTypeDesc && /full.?body|full.?length|head.?to.?feet|waist.?down/i.test(shotTypeDesc);
  if (hasBeautyAnchor && !userExplicitlyPickedWide) {
    const conflictingClothing = anchors.filter(a => CLOTHING_SET.has(a));
    if (conflictingClothing.length > 0) {
      const conflictLabels = conflictingClothing.map(a => ANCHOR_LABEL_MAP[a] || a).join(', ');
      const beautyLabel    = beautyAnchors.map(a => ANCHOR_LABEL_MAP[a] || a).join(' + ');
      if (!intent.forbiddenFraming) intent.forbiddenFraming = [];
      conflictingClothing.forEach(a => {
        const label = ANCHOR_LABEL_MAP[a] || a;
        intent.forbiddenFraming.push(
          `${label} visible in frame`,
          `showing ${label.toLowerCase()} in composition`,
        );
      });
      // Shoes/boots cause the worst hallucination — add explicit suppression
      if (conflictingClothing.some(a => a === 'SHOES')) {
        intent.forbiddenFraming.push(
          'boots in frame', 'shoes in frame', 'feet visible', 'legs visible',
          'lower body visible', 'waist-down visible',
        );
      }
      if (!intent.warningFlags) intent.warningFlags = [];
      intent.warningFlags.push(
        `ANCHOR CONFLICT RESOLVED: ${beautyLabel} (beauty precision) + ${conflictLabels} (clothing/footwear) cannot coexist in a close-up composition. BEAUTY WINS. The ${conflictLabels} anchor has been suppressed from this frame. Do NOT attempt to render both — clothing/footwear outside the beauty crop zone causes hairstyle and facial feature hallucination. NOTE: user may select Full Body shot type to override this and show both anchors.`,
      );
    }
  } else if (hasBeautyAnchor && userExplicitlyPickedWide) {
    // User explicitly chose Full Body with a beauty anchor — honour the selection.
    // Direct the model to treat the beauty anchor as the compositional hero within the full frame.
    const beautyLabel = beautyAnchors.map(a => ANCHOR_LABEL_MAP[a] || a).join(' + ');
    const clothingPresent = anchors.filter(a => CLOTHING_SET.has(a)).map(a => ANCHOR_LABEL_MAP[a] || a).join(', ');
    if (!intent.warningFlags) intent.warningFlags = [];
    intent.warningFlags.push(
      `FULL BODY OVERRIDE: User explicitly selected full-body shot with ${beautyLabel} anchor. Both beauty and clothing anchors (${clothingPresent || 'none'}) should appear. ${beautyLabel} is the HERO element — it must be rendered with full precision and detail even within the wider frame. Do NOT hallucinate hair/beauty features to compensate for distance.`,
    );
    // Enrich the shot type to guide the model on how to handle beauty detail at full-body distance
    if (intent.enrichedShotTypeDesc) {
      intent.enrichedShotTypeDesc = `${intent.enrichedShotTypeDesc} BEAUTY ANCHOR NOTE: ${beautyLabel} must be rendered with full detail and precision at this distance. Do not blur, simplify, or hallucinate the ${beautyLabel.toLowerCase()} — it is the editorial hero of this full-body composition.`;
    }
  }

  // Rule 3: Accessory anchors (jewelry) → force portrait/close-up on jewelry zone
  const hasAccessoryAnchor = anchors.some(a => DETAIL_ACCESSORY_SET.has(a));
  if (hasAccessoryAnchor && !hasBeautyAnchor) {
    const accAnchors = anchors.filter(a => DETAIL_ACCESSORY_SET.has(a));
    const accLabel = accAnchors.map(a => ANCHOR_LABEL_MAP[a] || a).join(' + ');
    if (!intent.enrichedShotTypeDesc || /full.?body/i.test(intent.enrichedShotTypeDesc)) {
      intent.enrichedShotTypeDesc = `PORTRAIT OR EDITORIAL CLOSE-UP — frame to show ${accLabel} prominently. The accessory must be fully visible and sharp. Camera angle should reveal the accessory, not obscure it.`;
    }
  }

  return intent;
}

// ─────────────────────────────────────────────────────────────────────────────

export async function runAgent00Intent({
  genAI,
  TEXT_MODEL,
  anchors,
  missionType,
  config,
  dnaMap,
  modelIdentityDNA,
  genderLabel,
  skinToneDesc,
  shotTypeDesc,
  poseDesc,
  atmosphereDesc,
  stylingDesc,
  userPromptText,
  hasClothingAnchor,
  auraProfile = null,   // Aura user profile — injected from Firestore
}) {
  const anchorDesc = anchors.map(a => ANCHOR_LABEL_MAP[a] || a).join(' + ');
  const hasBeauty  = anchors.some(a => BEAUTY_PRECISION_SET.has(a));

  // ── Build DNA preview for context (no full DNA — keep token cost low) ──────
  const anchorDnaPreview = anchors
    .filter(a => dnaMap?.[a])
    .map(a => `${a}: ${dnaMap[a].substring(0, 180)}`)
    .join('\n');

  // ── Aura profile context block ─────────────────────────────────────────
  const auraContext = auraProfile ? {
    profession:         auraProfile.profession         || null,
    creativeIdentity:   auraProfile.creativeIdentity   || null,
    businessFocus:      auraProfile.businessFocus      || null,
    styleSignature:     auraProfile.styleSignature     || null,
    primaryAnchor:      auraProfile.primaryAnchor      || null,
    anchorPriorityNote: auraProfile.anchorPriorityNote || null,
    preferredMoods:     auraProfile.preferredMoods     || [],
    avoidList:          auraProfile.avoidList          || [],
    totalGenerations:   auraProfile.totalGenerations   || 0,
    topAnchors:         auraProfile.topAnchors         || [],
  } : null;

  const intentRequest = {
    anchors,
    anchorDesc,
    missionType,
    gender:               genderLabel,
    skinTone:             skinToneDesc?.split('•')[0]?.trim() || skinToneDesc,
    hasBeautyAnchor:      hasBeauty,
    hasClothingAnchor,
    selectedShotType:     config?.shotType     || null,
    rawShotTypeDesc:      shotTypeDesc          || null,
    selectedPose:         config?.pose          || null,
    selectedCamera:       config?.camera        || null,
    selectedAtmosphere:   config?.atmosphere    || null,
    selectedStyling:      config?.styling       || null,
    userCustomDirection:  userPromptText         || null,
    locationPreset:       config?.locationPreset || null,
    anchorDnaPreview:     anchorDnaPreview       || null,
    modelIdentitySummary: modelIdentityDNA ? modelIdentityDNA.substring(0, 250) : null,
    auraUserProfile:    auraContext,
  };

  const profileLine = auraContext?.profession
    ? `You know this user. They are a ${auraContext.profession}${auraContext.businessFocus ? ` — their business focus is: ${auraContext.businessFocus}` : ''}. ${auraContext.anchorPriorityNote || ''} Honour their creative identity in every directive you write.`
    : `You do not yet have a profile for this user. Reason from their current selections only.`;

  const systemPrompt = `You are Aura — a personalised AI creative director for a luxury fashion editorial studio. You are the intelligence layer that sits between what the user selects and what the image model produces.

${profileLine}

YOUR ROLE: Read the user's full selection context (and their Aura profile if available), then output a structured JSON object that eliminates ALL ambiguity before the image model is called. You are their personal creative director — you understand what they're trying to achieve, what they sell, and how they like to shoot. Structure every directive with that knowledge.

MANDATORY RULES YOU MUST APPLY:
1. BEAUTY ANCHORS (HAIR, BARBER, MAKEUP, NAILS) → ALWAYS force close-up framing unless user explicitly selected full body. For HAIR/BARBER: camera must face front or 3/4 profile. NEVER rear angle. NEVER back of head.
2. IF THE USER IS A PROFESSIONAL (e.g. hairstylist) → their primary anchor IS the product they sell. Every composition must showcase that product with precision. This is not creative preference — it is commercial necessity.
3. USER SHOT TYPE SELECTION → treat as NON-NEGOTIABLE. Expand it with precise anchor-specific language.
4. forbiddenFraming → list EVERY framing variant the image model must not produce for this specific request.
5. enrichedShotTypeDesc → so specific that no image model could misinterpret it. Include: crop point, camera angle, what must be visible, what must NOT appear.
6. enrichedPoseDesc → orient the subject's body and face toward the anchor's visibility zone.
7. If the user has a styleSignature or avoidList in their profile → honour it in moodTarget and warningFlags.
8. MULTI-ANCHOR CONFLICT — BEAUTY vs CLOTHING/FOOTWEAR: Two scenarios — (A) User did NOT select Full Body: BEAUTY WINS. The clothing/footwear anchor CANNOT appear in a collarbone-up close-up. List conflicting items in forbiddenFraming. Attempting to render both causes hairstyle hallucination. (B) User DID explicitly select Full Body: honour the selection. Show both anchors. The beauty anchor (HAIR etc.) is the compositional HERO — render it with full precision at full-body distance. Do NOT hallucinate hair/beauty detail because the subject is further away.

OUTPUT: Valid JSON only. No markdown fences. No explanation outside the JSON.`;

  const userPrompt = `${systemPrompt}

USER SELECTION CONTEXT:
${JSON.stringify(intentRequest, null, 2)}

Respond with a single valid JSON object matching exactly this schema:
{
  "enrichedShotTypeDesc": "...",
  "enrichedPoseDesc": "...",
  "forbiddenFraming": ["..."],
  "cameraAngle": "...",
  "subjectFocus": "...",
  "moodTarget": "...",
  "anchorPriority": ["..."],
  "warningFlags": ["..."],
  "confidence": { "shotType": "HIGH|MEDIUM|LOW", "anchor": "HIGH|MEDIUM|LOW", "mood": "HIGH|MEDIUM|LOW" }
}`;

  try {
    const textModel = genAI.getGenerativeModel({ model: TEXT_MODEL });
    const result    = await textModel.generateContent({
      contents:         [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    });

    const raw    = result.response.text().trim();
    let   intent = JSON.parse(raw);

    // Apply deterministic post-rules to guarantee critical constraints
    intent = applyDeterministicRules(intent, anchors, shotTypeDesc);

    const flags = (intent.warningFlags || []).join(' | ') || 'none';
    console.log(`[INTENT] ✓ GenerationIntent resolved | shotType:${intent.confidence?.shotType} | anchor:${intent.confidence?.anchor} | flags: ${flags}`);
    if (intent.warningFlags?.length) {
      intent.warningFlags.forEach(w => console.warn(`[INTENT] ⚠  ${w}`));
    }

    return intent;

  } catch (err) {
    console.warn(`[INTENT] Agent 00 failed — falling back to raw config fields: ${err?.message}`);

    // Graceful degradation: run deterministic rules only (zero LLM cost, still catches the worst cases)
    const fallback = applyDeterministicRules(
      { enrichedShotTypeDesc: shotTypeDesc, enrichedPoseDesc: poseDesc, forbiddenFraming: [], warningFlags: [] },
      anchors,
      shotTypeDesc,
    );
    console.log(`[INTENT] Deterministic fallback applied — forbiddenFraming: [${(fallback.forbiddenFraming || []).join(', ')}]`);
    return fallback;
  }
}
