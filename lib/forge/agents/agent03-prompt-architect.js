/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  LuxAura Prompt Architect v2.0                                              ║
 * ║                                                                              ║
 * ║  Central intelligence layer for all Gemini + FASHN image generation calls.   ║
 * ║  Encodes every known behavioral constraint of gemini-3.1-flash-image-preview ║
 * ║  and routes each generation task to the optimal prompt + parameter set.      ║
 * ║                                                                              ║
 * ║  SELF-HEALING: Pre-flight validation catches constraint violations BEFORE     ║
 * ║  the API call — preventing wasted credits and predictable failure patterns.  ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * ── KNOWLEDGE BASE ─────────────────────────────────────────────────────────────
 *
 * K1 · DEEPFAKE FILTER
 *   Trigger:  safetySettings contains BLOCK_NONE for any harm category
 *   Effect:   Google's anti-deepfake system activates; intentionally randomizes
 *             faces in any identity-preserving context, making keep mode useless
 *   Fix:      Omit safetySettings entirely for ALL keep / identity-preservation
 *             modes. Only use safety settings in AI generation mode where there
 *             is no real person's identity at stake.
 *   Applies:  PHOTO_EDIT, VTO_EDITORIAL, INPAINTING, TWO_IMAGE
 *
 * K2 · FRAMING DETERMINES BEHAVIORAL MODE
 *   "Generate a new photo of this person" → creates NEW person (generation mode)
 *   "Edit this photo, change only the background" → preserves person (edit mode)
 *   Fix:      Keep mode MUST use PHOTO EDIT framing ("PHOTO EDIT — BACKGROUND
 *             REPLACEMENT ONLY"). Never "generate" or "create" framing in keep mode.
 *   Applies:  PHOTO_EDIT
 *
 * K3 · DNA BLOCKS IN PRESERVATION LOCKS ARE COUNTERPRODUCTIVE
 *   Trigger:  Detailed feature text inside keep-mode lock lines
 *             e.g. "HAIR [LOCK]: honey-brown balayage, 14-inch length..."
 *   Effect:   Gemini regenerates the feature from the text description rather
 *             than copying from the image — produces described hair, not real hair
 *   Fix:      In keep mode: "IDENTICAL to input" only — no DNA text blocks.
 *             DNA descriptions belong in AI mode only (no image to copy from).
 *   Applies:  PHOTO_EDIT, VTO_EDITORIAL, INPAINTING, TWO_IMAGE
 *
 * K4 · TEMPERATURE CALIBRATION BY TASK TYPE
 *   PHOTO_EDIT:    0.07–0.11  background edit — near-inpainting determinism
 *   INPAINTING:    0.05–0.09  fill grey zone — most constrained possible
 *   TWO_IMAGE:     0.12–0.18  two-ref composition — minimize identity blending
 *   VTO_EDITORIAL: 0.20–0.35  scene variation — identity + pattern locked by two-image reference (garment + VTO)
 *   AI_GENERATE:   0.72–1.20  full creative range with anchor precision floors
 *
 * K5 · RETRY INTELLIGENCE (failure-specific mutations)
 *   IMAGE_MISSING → +0.10 temp  model needs more freedom to produce output
 *   TIMEOUT       → -0.18 temp  reduce scene complexity to fit deadline
 *   SAFETY        → -0.22 temp  + editorial reframing to clear content filter
 *   DEFAULT       → -0.06 temp  conservative nudge on unknown failure
 *
 * K6 · ANCHOR REF IMAGE PREVENTS FACE BLEED IN AI MODE
 *   Passing a face-free anchor image (garment flat-lay, nail close-up) gives
 *   Gemini a visual reference without introducing any face data that could bleed
 *   into the generated subject. Never include a face in the anchor ref image.
 */

// ─── Safety settings ──────────────────────────────────────────────────────────
// Used ONLY in AI_GENERATE mode. For all keep/identity modes → OMIT (K1).
const SAFETY_FOR_AI_MODE = [
  { category: 'HARM_CATEGORY_HARASSMENT',       threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
];

// ─── Generation mode registry ─────────────────────────────────────────────────
// Each mode documents WHAT it does, WHY it uses the parameters it does, and
// WHAT anti-patterns to guard against.
export const MODES = {
  PHOTO_EDIT:             'PHOTO_EDIT',             // Keep, no garment — background replacement only
  VTO_BACKGROUND_REPLACE: 'VTO_BACKGROUND_REPLACE', // Keep garment, real person — background replace on VTO output only (max pattern fidelity)
  VTO_EDITORIAL:          'VTO_EDITORIAL',          // AI character + garment — Gemini adds scene variation on top of VTO output
  INPAINTING:             'INPAINTING',             // Keep garment — masked model, fill grey zone
  TWO_IMAGE:              'TWO_IMAGE',              // Keep garment — two-reference synthesis fallback
  AI_GENERATE:            'AI_GENERATE',            // AI model — director brief leads, full creativity
};

const MODE_METADATA = {
  [MODES.VTO_BACKGROUND_REPLACE]: {
    label:   'VTO Background Replace — Maximum Pattern Fidelity',
    summary: 'VTO output is the frozen source. Only background, lighting, and color grade change. Garment pattern preserved pixel-by-pixel.',
    rules:   ['MUST omit safetySettings (K1)', 'MUST use PHOTO EDIT framing on VTO image (K2)', 'NO DNA in garment lock — visual copy only (K3)', 'Garment is more frozen than in PHOTO_EDIT — zero tolerance for pattern drift'],
    // Background generation needs 0.18–0.33 to produce varied environments per slot.
    // Pattern fidelity is enforced by prompt language, not temperature.
    // 0.07 (inpainting range) was too low — produced 6 identical outputs.
    tempBase:   (seed) => 0.18 + ((seed % 6) * 0.03),  // 0.18 / 0.21 / 0.24 / 0.27 / 0.30 / 0.33
    tempFloor:  0.15,
    tempCeiling: 0.35,
    safetySettings: null,
  },
  [MODES.PHOTO_EDIT]: {
    label:   'Photo Edit — Background Replacement Only',
    summary: 'Source person is frozen; only background, lighting, and color grade change.',
    rules:   ['MUST use PHOTO EDIT framing (K2)', 'MUST omit safetySettings (K1)', 'NO DNA in locks (K3)'],
    tempBase:   (seed) => 0.07 + ((seed % 3) * 0.02),  // 0.07 / 0.09 / 0.11
    tempFloor:  0.05,
    tempCeiling: 0.15,
    safetySettings: null,  // ← CRITICAL: omit to prevent deepfake filter (K1)
  },
  [MODES.VTO_EDITORIAL]: {
    label:   'VTO Editorial — Scene Variation',
    summary: 'FASHN.ai base image locks identity + garment; Gemini adds scene, lighting, and atmosphere only.',
    rules:   ['MUST omit safetySettings (K1)', 'FASHN image is single source of truth — Gemini adds scene ONLY', 'Works for both keep-mode (real person) and AI-mode (generated character)'],
    tempBase:   (seed) => 0.20 + ((seed % 6) * 0.03),  // 0.20–0.35 — tightened to protect pattern fidelity
    tempFloor:  0.18,
    tempCeiling: 0.40,
    safetySettings: null,
  },
  [MODES.INPAINTING]: {
    label:   'Inpainting — Fill Grey Zone',
    summary: 'Clothing region replaced with #D8D8D8 grey; Gemini fills zone with garment DNA.',
    rules:   ['MUST omit safetySettings (K1)', 'Grey zone = ONLY modifiable region'],
    tempBase:   (seed) => 0.05 + ((seed % 3) * 0.02),  // 0.05 / 0.07 / 0.09
    tempFloor:  0.05,
    tempCeiling: 0.12,
    safetySettings: null,
  },
  [MODES.TWO_IMAGE]: {
    label:   'Two-Image Synthesis',
    summary: 'Source model photo + garment flat-lay. Two visual refs; text-based identity locks.',
    rules:   ['MUST omit safetySettings (K1)', 'Garment image must be face-free to prevent face bleed (K6)'],
    tempBase:   (seed) => 0.12 + ((seed % 3) * 0.03),  // 0.12 / 0.15 / 0.18
    tempFloor:  0.05,
    tempCeiling: 0.22,
    safetySettings: null,
  },
  [MODES.AI_GENERATE]: {
    label:   'AI Generation — Director Brief',
    summary: 'No real person. Director brief leads. Full creative range with anchor precision.',
    rules:   ['SAFE to use safetySettings in AI mode (no real identity to preserve)'],
    tempBase:   null,  // calculateSlotTemperature() handles per-anchor adaptive temp
    tempFloor:  0.30,
    tempCeiling: 1.25,
    safetySettings: SAFETY_FOR_AI_MODE,
  },
};

// ─── Mode Classifier ──────────────────────────────────────────────────────────
// Deterministic — zero LLM calls, zero heuristics. Pure function.
// Priority order matches the routing logic in forge.js.
export function classify(ctx) {
  const { isAiGenerated, isKeepGarment, fashnVTOImage, clothingMaskedModel } = ctx;

  if (!isAiGenerated && !isKeepGarment) return MODES.PHOTO_EDIT;
  if (fashnVTOImage && !isAiGenerated)   return MODES.VTO_BACKGROUND_REPLACE; // keep real person — frozen pixel edit, garment pixels untouched
  if (fashnVTOImage && isAiGenerated)    return MODES.VTO_EDITORIAL;          // AI character + garment — scene variation with dual-image garment lock
  if (isKeepGarment && clothingMaskedModel) return MODES.INPAINTING;
  if (isKeepGarment)                    return MODES.TWO_IMAGE;
  return MODES.AI_GENERATE;
}

// ─── Temperature Resolver ─────────────────────────────────────────────────────
function resolveTemperature(mode, ctx) {
  const { seed, mutation, calculateSlotTemperature, anchors, slotFraming } = ctx;
  const meta = MODE_METADATA[mode];

  let base;
  if (mode === MODES.AI_GENERATE && typeof calculateSlotTemperature === 'function') {
    base = calculateSlotTemperature(seed, anchors, true, slotFraming || '');
  } else if (meta.tempBase) {
    base = meta.tempBase(seed);
  } else {
    base = 1.00;
  }

  const floor  = meta.tempFloor  ?? 0.05;
  const final  = mutation ? Math.max(floor, base + mutation.tempDelta) : base;
  return { base: parseFloat(base.toFixed(4)), final: parseFloat(final.toFixed(4)), floor };
}

// ─── Prompt Builders ──────────────────────────────────────────────────────────
// One builder per mode. Each builds the optimal prompt for its behavioral context.

// PHOTO_EDIT: "PHOTO EDIT — BACKGROUND REPLACEMENT ONLY"
// K2: EDIT framing forces Gemini into photo-editor mode (preserves subject)
// K3: No DNA in locks — "IDENTICAL to input" is stronger than any text description
function buildPhotoEditPrompt(ctx) {
  const {
    salt, bgLock, isCustomEnv, slotScene, slotFrm,
    mutation, userDirection,
    skinToneDesc, modelIdentityDNA, modelHairDNA,
  } = ctx;

  return [
    `GENERATION_ID: ${salt}`,
    `\n\nPHOTO EDIT — BACKGROUND REPLACEMENT ONLY.`,
    `\nThis photograph shows a real ${ctx.genderLabel === 'male' ? 'man' : 'woman'}. The person in this photo is a single frozen unit. You may only change what is behind ${ctx.genderLabel === 'male' ? 'him' : 'her'}.`,
    `\n\nYOUR ONLY PERMITTED CHANGES:`,
    `\n• Replace the background/environment with: ${bgLock}`,
    isCustomEnv ? `\n  (Environment: "${bgLock}" — ground, sky, atmosphere, surroundings all reflect this location)` : '',
    `\n• Adjust lighting to match the new environment: ${slotScene.lighting}`,
    `\n• Apply color grade: ${slotScene.colorGrade}`,
    `\n• Camera: ${slotScene.camera}`,
    `\n• Framing: ${slotFrm}`,
    `\n• Style target: ${slotScene.name} — ${slotScene.publication}`,
    userDirection ? `\n• CLIENT SCENE DIRECTION — add these elements to the scene around the subject: "${userDirection}". Props and environment elements are permitted additions. The person herself remains frozen.` : '',
    `\n\nEVERYTHING ABOUT THE PERSON IS FROZEN. DO NOT CHANGE:`,
    `\n✗ FACE — identical to input. Every feature, proportion, and characteristic.`,
    modelIdentityDNA ? `\n  IDENTITY VERIFICATION: ${modelIdentityDNA.substring(0, 400)}. This profile is for VERIFICATION — the input image is the absolute source of truth. If the output face differs from the input, regenerate.` : '',
    `\n✗ SKIN — identical tone, depth, undertone, and warmth as the input.`,
    skinToneDesc ? `\n  SKIN TONE VERIFICATION: ${skinToneDesc}. Match the input image — if output skin differs from this tone, regenerate.` : '',
    `\n✗ HAIR — every strand frozen. Same color, length, texture, curl, and silhouette as input. Do not restyle, recolor, or rerender the hair.`,
    modelHairDNA ? `\n  HAIR VERIFICATION: ${modelHairDNA.substring(0, 300)}. This is for VERIFICATION — the input image is the ground truth. If output hair differs from input, regenerate.` : '',
    `\n✗ CLOTHING — every garment frozen. Same outfit, colors, fabric, cut, and fit as input. Do not change, swap, or replace any clothing.`,
    `\n✗ ACCESSORIES — frozen as input.`,
    `\n✗ MAKEUP — frozen as input.`,
    `\n✗ BODY PROPORTIONS — same build and pose as input.`,
    `\n\nGENDER [ABSOLUTE LOCK]: Identical gender to subject in input — do NOT change.`,
    `\nANATOMY [ABSOLUTE LOCK]: Exactly 2 arms. Exactly 2 hands. 5 fingers per hand. No phantom limb, no third arm. Count every limb — 3 arms = generation failure.`,
    `\nFULL BODY COMPOSITION: Do not crop or cut off any part of the subject's body at the frame edge. If the input shows a full-body shot, output must show a full-body shot.`,
    `\n\nSELF-AUDIT before rendering:`,
    `\n□ Background replaced with "${bgLock}"?`,
    userDirection ? `\n□ Client scene elements ("${userDirection.substring(0, 60)}...") present in the scene?` : '',
    `\n□ Face IDENTICAL to input — zero changes?`,
    `\n□ Hair IDENTICAL to input — not restyled or recolored?`,
    `\n□ Clothing IDENTICAL to input — not swapped or altered?`,
    `\n□ Skin tone identical?`,
    `\n□ Gender identical to input — not changed?`,
    `\nAll checks must pass. Any change to the person = GENERATION FAILURE.`,
    mutation?.suffix ?? '',
  ].join('');
}

// VTO_BACKGROUND_REPLACE: "PHOTO EDIT — SCENE REPLACEMENT ONLY. GARMENT PATTERN LOCK ACTIVE."
// The VTO output is a frozen pixel source. Gemini may ONLY change what is behind and around the model.
// Garment pattern, color, print, and all statement elements are treated as hardest-locked pixels.
// Scene variety per slot comes from slotScene (lighting, colorGrade, env, publication) + slotFrm (crop).
// Temperature: 0.07–0.11 — near-inpainting determinism. No DNA in locks (K3 — visual copy only).
function buildVTOBackgroundReplacePrompt(ctx) {
  const {
    salt, seed, bgLock, isCustomEnv, slotScene, slotDir,
    brief, mutation, userDirection, genderLabel,
  } = ctx;

  return [
    `GENERATION_ID: ${salt}`,
    `\n\nCOMPLETELY DISCARD the environment from the reference image. The new location overrides it entirely. NEW BACKGROUND [ABSOLUTE LOCK]: ${bgLock}.`,

    `\n\nPHOTO EDIT — SCENE REPLACEMENT ONLY. GARMENT PATTERN LOCK ACTIVE.`,
    `\nThis is a PHOTO EDIT operation — not a new generation. The model and every fiber of their clothing are a single frozen unit. You may only change what is BEHIND and AROUND the model.`,

    `\n\n━━ ABSOLUTE FREEZE — TOUCHING ANY OF THESE = GENERATION FAILURE ━━`,
    `\nGARMENT [HARDEST LOCK — ZERO TOLERANCE]: Every fiber, print color, pattern repeat, motif shape, color block, fabric weave, garment construction, and statement embellishment (feathers, appliqués, 3D florals, bows, ruffles, sequin zones) must remain PIXEL-IDENTICAL to the input. Do NOT simplify, reinterpret, ghost, fade, approximate, or redraw any part of the garment. The print is not an approximation — it is an absolute copy. Any pixel-level change to the garment fabric = generation failure.`,
    `\n[COLOR ISOLATION — CRITICAL]: The color grade, film aesthetic, and lighting adjustments apply ONLY to the background and ambient atmosphere. The garment fabric's base colors are forensically locked — they must NOT shift, desaturate, or be influenced by any LUT, color grade, or lighting filter. If the garment is red in the input, it must be the exact same red in the output.`,
    ctx.garmentImageData ? `\n[PATTERN SOURCE]: Image 1 is the ORIGINAL SOURCE GARMENT — use it as the absolute ground truth for every print, pattern repeat, motif, color block, and fabric weave. Image 2 is the VTO composition — use for body, pose, face, and garment fit. When any difference exists between the garment in Image 1 and Image 2, Image 1 is always correct.` : '',
    `\nFACE [LOCKED]: Every feature, proportion, and expression — identical to input. Zero changes.`,
    `\nSKIN TONE [LOCKED]: Identical depth, undertone, and warmth as input. Zero drift.`,
    ctx.skinToneDesc ? `\n  SKIN TONE VERIFICATION: ${ctx.skinToneDesc}. Match the input image — this is for verification only.` : '',
    `\nHAIR [LOCKED]: Every strand, color dimension, texture, length, and curl — identical to input. Do not recolor or restyle.`,
    ctx.modelHairDNA ? `\n  HAIR VERIFICATION: ${ctx.modelHairDNA.substring(0, 300)}. Match the input image — this is for verification only.` : '',
    `\nPOSE [LOCKED]: Model's body position, arm placement, and hand positions — frozen exactly as shown. Do NOT alter the pose.`,
    `\nANATOMY [ABSOLUTE LOCK]: Exactly 2 arms. Exactly 2 hands. 5 fingers per hand. No phantom limb, no third arm. Count every limb — 3 arms = generation failure.`,
    `\nFULL BODY VISIBLE [LOCKED]: The model's complete body must be fully visible from head to feet exactly as composed in the input. Do NOT crop, cut off, or reframe the model's body. Do NOT let the scene edge cut through legs, feet, or any body part. If the input shows a full-body shot, the output must show a full-body shot.`,
    `\nGARMENT FIT [LOCKED]: The drape, volume, and structural silhouette of the garment on the body — frozen. No reshaping.`,
    `\nACCESSORIES [LOCKED]: Every accessory visible in the input — unchanged.`,

    `\n\n━━ SLOT ${seed + 1} OF 6 — SCENE DIRECTION ━━`,
    brief ? `\nSCENE BRIEF (apply ONLY the location, background, and atmosphere — ignore any pose or garment direction): ${brief}` : '',
    `\n\n━━ YOUR ONLY PERMITTED CHANGES ━━`,
    `\nBACKGROUND/ENVIRONMENT: Replace everything visible behind and around the model with: ${bgLock}`,
    isCustomEnv
      ? `\n  This is a specific real-world location. The ground surface, sky, architecture, foliage, and atmosphere must fully reflect: "${bgLock}". Any studio backdrop or neutral grey remaining = failure.`
      : `\n  Replace the current background completely with ${bgLock}. Nothing from the original setting may remain.`,
    `\nLIGHTING: Adjust ambient, fill, and key light to match the new scene — ${slotScene.lighting}. Natural shadows and reflections on the model from the new light source are permitted, but must NOT alter garment colors or skin tone.`,
    `\nCOLOR GRADE: ${slotScene.colorGrade} — applies to SCENE ATMOSPHERE and BACKGROUND ONLY. Garment fabric colors are frozen and must not shift from any color grade or LUT.`,
    `\nPHOTOGRAPHY STYLE: ${slotScene.name} — ${slotScene.publication}. ${slotDir?.aesthetic || ''}`,
    `\nCOMPOSITION ATMOSPHERE: ${slotScene.composition} — apply to the scene and environment only. Do NOT reframe or crop the model.`,
    userDirection ? `\n\n━━ CLIENT DIRECTION — MANDATORY ━━\n"${userDirection}"\nApply this FULLY to the scene: background, environment, props, lighting atmosphere. The model's body and garment remain frozen — everything around them must reflect this direction.` : '',

    `\n\n━━ SELF-AUDIT — ALL 10 MUST PASS ━━`,
    `\n□ Garment pattern/print/colors pixel-identical to input? Zero ghosting? Zero approximation?`,
    `\n□ All statement embellishments (feathers, appliqués, 3D elements) present and unchanged?`,
    `\n□ Background fully replaced with "${bgLock}"? No original background visible?`,
    `\n□ Face identical to input — not redrawn?`,
    `\n□ Skin tone identical to input — not lightened, darkened, or shifted?`,
    `\n□ Hair identical to input — not restyled or recolored?`,
    `\n□ Pose identical to input — not altered?`,
    `\n□ EXACTLY 2 arms and 2 hands — no third arm, no phantom limb?`,
    `\n□ Full body visible head to feet — nothing cut off at frame edge?`,
    `\n□ Gender ${genderLabel === 'male' ? 'male' : 'female'} — unchanged?`,
    `\nAll 10 checks must pass. Third arm OR cropped body OR garment alteration = regenerate immediately.`,
    mutation?.suffix ?? '',
  ].join('');
}

// VTO_EDITORIAL: "FASHION EDITORIAL — GENERATE FROM MODEL + GARMENT REFERENCE"
// FASHN.ai output is the single source of truth for identity + garment fidelity.
// Gemini generates a fresh editorial with new pose/scene. Reference image provides locks.
//
// Fix (pattern ghosting): garment DNA lock moved BEFORE photography direction so Gemini
// reads it as a hard constraint, not a footnote. DNA expanded to 600 chars.
// Fix (location ignored): explicit "DISCARD REFERENCE BACKGROUND" instruction added at
// top — without it, the background baked into the VTO image acts as a visual anchor
// stronger than the text instruction.
function buildVTOEditorialPrompt(ctx) {
  const {
    salt, seed, bgLock, isCustomEnv, slotScene, slotDir, slotPose, slotFrm,
    anchors, mutation, userDirection,
  } = ctx;

  // K3: VTO_EDITORIAL is a reference mode — Gemini has the FASHN output image to copy from.
  // DNA text blocks in keep-mode locks cause Gemini to GENERATE from description, not copy visually.
  // hairLock is used in the HAIR lock line below.
  const hairLock = 'MATCH the reference image EXACTLY — it is the sole source of truth for every hair detail: color (every highlight, root depth, and base tone), curl pattern, texture, length, silhouette, and styling.';

  return [
    `GENERATION_ID: ${salt}`,
    `\n\nPHOTO EDIT — SCENE REPLACEMENT ONLY. GARMENT PATTERN LOCK ACTIVE.`,
    `\nCOMPLETELY DISCARD the environment from the reference image. The new location overrides it entirely. NEW BACKGROUND [ABSOLUTE LOCK]: ${bgLock}.`,
    `\nThis photograph shows a real ${ctx.genderLabel === 'male' ? 'man' : 'woman'}. The person in this photo is a single frozen unit. You may only change the scene around the subject.`,

    // ── GARMENT LOCK (before everything else — pattern fidelity is highest priority) ──
    `\n\n━━ GARMENT LOCK — READ THIS FIRST — HIGHEST PRIORITY ━━`,
    `\nThe garment is defined by TWO reference images: Image 1 (source garment, full pattern fidelity) and Image 2 (VTO output, garment on body). Together they are the SINGLE MOST IMPORTANT element.`,
    `\nYou must reproduce every stitch, print, color, and fabric texture with 100% pixel accuracy. When Image 1 and Image 2 show any difference in pattern detail, Image 1 is the ground truth — it is the uncompressed source.`,
    `\n[PATTERN MANDATE]: Every repeating motif, print, stripe, color block, fabric weave, and micro-texture from Image 1 MUST be reproduced exactly on the model in your output. Do NOT simplify, fade, ghost, or reinterpret the pattern. Ghosted or washed-out patterns = immediate generation failure.`,
    `\n[COLOR MANDATE]: The garment's colors must be reproduced at full saturation as they appear in Image 1 (the source garment). Do NOT allow color grade, lighting, or film aesthetic to alter the garment fabric's base colors.`,
    `\n[STATEMENT ELEMENTS — ABSOLUTE LOCK]: Any 3D embellishment on the garment (feathers, 3D floral appliqués, bows, ruffle clusters, sequin zones, fringe, tassels, sculptural pleating) is the HIGHEST PRIORITY lock. These elements define the garment. Reproduce each statement element at its EXACT position on the garment body (e.g. "large feather at center chest bodice"), at FULL SCALE, with EXACT color and texture as shown in Image 1. A garment missing its statement element is the wrong garment — regenerate.`,
    `\n[NO ADDITIONS]: Strictly forbidden from adding ribbons, side panels, lace, hardware, or any element not visible in the source garment. Any change = generation failure.`,

    // ── Pipeline context ──
    `\n\n━━ STAGE 1 — COMPLETE (VTO GARMENT LOCK) ━━`,
    `\nImage 1 (Pattern Reference Panel): the original garment — use for exact fabric pattern, print, and color.`,
    `\nImage 2 (VTO Composition Base): the virtual try-on output — use for face, skin tone, hair, body, and garment fit on the model.`,
    `\nWhen rendering the garment fabric in your output: apply the pattern from Image 1 to the body placement from Image 2. This two-source approach is intentional — it gives you both pixel-perfect pattern fidelity AND correct garment-on-body structure.`,
    `\n\n━━ STAGE 2 — YOUR TASK: CREATIVE DIRECTION ONLY ━━`,
    `\nRender the subject wearing the exact garment in the new scene below.`,
    `\nYour ONLY creative contribution: scene environment, lighting, atmosphere, composition, and pose.`,
    `\nThe identity and garment are already locked. Do NOT regenerate or reimagine them.`,

    // ── Photography direction ──
    `\n\n══ PHOTOGRAPHY DIRECTION — SLOT ${seed + 1} OF 6: ${slotScene.name.toUpperCase()} ══`,
    `\nStyle Vision: ${slotScene.env}`,
    `\nPublication Target: ${slotScene.publication}`,
    `\nPOSING ARCHETYPE: ${slotDir?.posing || 'natural, editorial stance'}`,
    `\nLIGHTING SETUP: ${slotScene.lighting}`,
    `\nCOLOR GRADE & FILM AESTHETIC [APPLIES TO SCENE ONLY — NOT TO GARMENT FABRIC]: ${slotScene.colorGrade}`,
    `\nCOMPOSITIONAL APPROACH: ${slotScene.composition}`,
    `\nCAMERA & LENS: ${slotScene.camera}`,
    `\nPOST-PROCESSING: ${slotScene.post}`,

    // ── Pose & framing ──
    `\n\n══ POSE & FRAMING — SLOT ${seed + 1} ══`,
    `\nPOSE: ${slotPose}`,
    `\nFRAMING: ${slotFrm}`,
    userDirection ? `\n\n══ CLIENT SCENE DIRECTION [MANDATORY — NON-NEGOTIABLE] ══\n"${userDirection}"\nEvery element of this directive must be visually present in the image. If it describes a prop, vehicle, or location, it must be prominent and clearly visible. This instruction overrides default pose and environment assumptions.` : '',

    // ── Identity locks ──
    `\n\n━━ IDENTITY LOCKS — LOCKED BY VTO — DO NOT OVERRIDE ━━`,
    `\nFACE [LOCKED]: Duplicate the exact face — bone structure, proportions, and every feature. Do NOT generate a new face.`,
    `\nSKIN TONE [LOCKED]: Identical depth, undertone, and warmth as the reference. Zero drift.`,
    `\nHAIR [LOCKED]: ${hairLock}`,
    `\nGENDER [ABSOLUTE LOCK]: Identical to reference. Any change in gender presentation = generation failure.`,
    `\nANATOMY [ABSOLUTE LOCK]: Exactly 2 arms. Exactly 2 hands. 5 fingers per hand. No phantom limb, no third arm. Count every limb — 3 arms = generation failure.`,
    `\nFULL BODY COMPOSITION: Show the model's complete body within the frame. Do not let scene edges crop through legs, feet, or any body part.`,

    `\n\nSELF-AUDIT: □ Garment pattern/colors 100% match Image 1 source? □ All statement elements (feathers/appliqués/bows/embellishments) present at correct position and full scale? □ Background is "${bgLock}" (NOT the reference location)? □ Face matches reference? □ Skin matches reference? □ Hair matches reference? □ Pose = "${slotPose}"? □ Gender matches? All 8 must pass. Missing statement element OR ghosted pattern OR original background = regenerate.`,
    mutation?.suffix ?? '',
  ].join('');
}

// INPAINTING: "PHOTO COMPLETION — CLOTHING INPAINTING"
// Clothing zones pre-replaced with #D8D8D8 grey. Gemini's only job: fill the grey.
function buildInpaintingPrompt(ctx) {
  const {
    salt, bgLock, isCustomEnv, lockedLighting, dnaMap, allDnaBlock,
    genderLabel, mutation,
  } = ctx;

  return [
    `GENERATION_ID: ${salt}`,
    `\n\nPHOTO COMPLETION — CLOTHING INPAINTING.`,
    `\nThis photograph shows a real person. The clothing areas have been replaced with solid LIGHT GREY as a visual placeholder zone.`,
    `\nYour ONLY task: fill in those light grey placeholder regions with the new garment described below. Do not touch anything else.`,
    `\n\n[CRITICAL]: Every repeating pattern, print, and micro-texture described in the DNA or visible in reference must be rendered with 100% fidelity. Do not simplify garments.`,
    `\n\n══ GARMENT TO FILL INTO THE GREY ZONE ══`,
    `\n${dnaMap?.['DRESS'] || dnaMap?.['FULL_OUTFIT'] || allDnaBlock || 'Reproduce a stylish fashion-forward garment matching the model\'s proportions.'}`,
    `\n\n══ SCENE ADJUSTMENTS ══`,
    `\nBACKGROUND: ${bgLock}`,
    isCustomEnv ? `\nAdjust background to: "${bgLock}".` : '',
    `\nLIGHTING: ${lockedLighting}`,
    `\n\n══ ABSOLUTE LOCKS — VIOLATION = GENERATION FAILURE ══`,
    `\nFACE [DO NOT TOUCH]: Every pixel of the face is completely frozen as shown in the input. Zero changes. Zero drift.`,
    `\nSKIN [DO NOT TOUCH]: Every area of visible skin is frozen — identical tone, depth, undertone, and warmth as the input.`,
    `\nHAIR [DO NOT TOUCH]: Every strand is frozen — identical color, curl pattern, texture, length, and silhouette as the input. Match the input exactly.`,
    `\nPOSE [DO NOT TOUCH]: Same pose as input. Minor adjustment for garment fit only.`,
    `\nGREY ZONE ONLY: You may ONLY modify the light grey placeholder regions. Replace grey with the garment. Nothing else changes.`,
    `\nGENDER [ABSOLUTE LOCK]: ${genderLabel === 'male' ? 'Male — zero female features.' : 'Female — zero male features.'}`,
    `\nANATOMY [ABSOLUTE LOCK]: Exactly 2 arms. Exactly 2 hands. 5 fingers per hand. No phantom limb, no third arm. Count every limb — 3 arms = generation failure.`,
    `\nFULL BODY COMPOSITION: Do not crop or cut off legs, feet, or any body part at the frame edge.`,
    `\n\nSELF-AUDIT: □ Face identical to input? □ Skin identical to input? □ Hair identical to input? □ Grey zone filled with correct garment including all statement embellishments? □ Exactly 2 arms visible? □ No body parts cropped? All must pass.`,
    `\nVIOLATING ANY LOCK = GENERATION FAILURE`,
    mutation?.suffix ?? '',
  ].join('');
}

// TWO_IMAGE: Two-reference synthesis — model photo + garment flat-lay
// Fallback when neither FASHN.ai VTO nor clothing-masked image is available.
function buildTwoImagePrompt(ctx) {
  const {
    salt, bgLock, isCustomEnv, lockedBgDesc, genderLabel,
    anchorDesc, userDirection, mutation,
  } = ctx;

  return [
    `GENERATION_ID: ${salt}`,
    `\n\nPHOTO EDIT — TWO-REFERENCE COMPOSITION. Place the subject from Image 1 wearing the exact garment shown in Image 2. Ensure the garment fits their body naturally. High fashion, photorealistic.`,

    `\n\n━━ ABSOLUTE IDENTITY LOCKS — THESE OVERRIDE EVERYTHING ━━`,
    `\nFACE [FROZEN — ZERO CHANGES]: 100% preserved from Image 1. Every feature, bone structure, and proportion — identical. Do NOT generate a new face.`,
    `\nSKIN TONE [ABSOLUTE LOCK]: Exact skin tone from Image 1. No lightening, darkening, or override.`,
    ctx.skinToneDesc ? `\n  SKIN TONE VERIFICATION: ${ctx.skinToneDesc}. Match Image 1 — if output skin differs, regenerate.` : '',
    `\nHAIR [FROZEN]: Exact same hair color, length, texture, and style as Image 1.`,
    ctx.modelHairDNA ? `\n  HAIR VERIFICATION: ${ctx.modelHairDNA.substring(0, 300)}. Match Image 1 — if output hair differs, regenerate.` : '',
    `\nGENDER [ABSOLUTE LOCK]: ${genderLabel === 'male' ? 'Male — zero female features.' : 'Female — zero male features.'}`,

    `\n\n━━ GARMENT LOCK — FROM IMAGE 2 ━━`,
    `\nReproduce the exact garment from Image 2 with 100% fidelity: every print, pattern, color, fabric texture, construction detail, and statement embellishment (feathers, apliqués, 3D florals, bows, ruffles, sequin zones, etc.) must be present exactly as shown.`,
    `\n[COLOR ISOLATION — CRITICAL]: The color grade and lighting adjustments apply ONLY to the background. The garment fabric's base colors are forensically locked — they must NOT shift, desaturate, or tint from any color grade or lighting filter.`,

    isCustomEnv
      ? `\n\nBACKGROUND [ABSOLUTE LOCK]: "${bgLock}" — every element of the surroundings reflects this environment.`
      : `\n\nBACKGROUND [ABSOLUTE LOCK]: ${lockedBgDesc || bgLock}.`,

    `\n\n━━ ANATOMY & COMPOSITION ━━`,
    `\nANATOMY [ABSOLUTE LOCK]: Exactly 2 arms. Exactly 2 hands. 5 fingers per hand. No phantom limb, no third arm. Count every limb — 3 arms = generation failure.`,
    `\nFULL BODY COMPOSITION: Show the model's complete body. Do not crop legs, feet, or any body part at the frame edge.`,

    userDirection ? `\n\n══ CLIENT SCENE DIRECTION [MANDATORY] ══\n"${userDirection}"\nEvery prop, vehicle, and scene element described here must be visually present.` : '',

    `\n\nSELF-AUDIT: □ Face from Image 1 preserved? □ Garment from Image 2 applied with full pattern fidelity? □ All statement embellishments present? □ Hair matches Image 1? □ Skin matches Image 1? □ Gender ${genderLabel === 'male' ? 'male' : 'female'}? □ Exactly 2 arms? □ No body parts cropped? All must pass.`,
    mutation ? `\n\n${mutation.suffix}` : '',
  ].join('');
}

// AI_GENERATE: Director brief leads; full creative range with anchor + identity locks
function buildAiGeneratePrompt(ctx) {
  const {
    salt, brief, anchorRefNote, anchorDesc, bgLock, isCustomEnv,
    modelIdentityDNA, modelHairDNA, dnaMap, skinToneDesc, skinToneExplicit, hasClothingAnchor, mutation,
    userDirection, verbatim,
    slotScene, slotPose, slotFrm,
    modelArchetypeDesc, poseDesc, expressionDesc, ageRangeDesc, ageRangeExplicit, shotTypeDesc, atmosphereDesc, stylingDesc,
  } = ctx;

  const hairSpec = modelHairDNA || dnaMap?.['HAIR'] || null;

  return [
    `GENERATION_ID: ${salt}`,
    `\n\n${brief || ''}`,
    anchorRefNote || '',
    `\n\n══ STRICT DOMAIN SEPARATION (ANTI-BLEED PROTOCOL) ══`,
    `\nThe following specifications are strictly isolated. You must NOT allow features from the Model Identity channel to influence the Garment Specification channel, and vice-versa. (e.g. skin tone must not tint the clothing, garment patterns must not appear on the face).`,

    `\n\n━━ CHANNEL A: MODEL IDENTITY & PHOTOGRAPHY ━━`,
    `\nMODEL ARCHETYPE [LOCKED]: ${modelArchetypeDesc || 'High Fashion — editorial proportions'}`,
    ageRangeExplicit
      ? `\nAGE [ABSOLUTE LOCK — CLIENT SELECTION]: ${ageRangeDesc}. The model presents as this exact age in ALL 6 images — identical apparent age in every plate. This OVERRIDES any age implied by the identity profile or reference image. A noticeably younger or older face in any image = generation failure.`
      : (ageRangeDesc ? `\nAGE PROFILE [LOCKED — IDENTICAL IN ALL 6 IMAGES]: ${ageRangeDesc}. The same apparent age in every plate.` : ''),
    `\nGENDER [ABSOLUTE LOCK]: Identical to reference subject — match the gender of the source image exactly.`,
    modelIdentityDNA ? `\nSUBJECT IDENTITY [ABSOLUTE LOCK]: The person in this image must precisely match this physical profile — face structure, ${skinToneExplicit ? '' : 'skin tone, '}hair style and color, makeup, body shape, weight, proportions, and all permanent features — ${modelIdentityDNA.substring(0, 500)}${skinToneExplicit ? '\n  SKIN-TONE OVERRIDE: IGNORE any skin tone implied or described in this profile. The client has explicitly selected the skin tone, locked separately below — use the client selection, never the profile tone.' : ''}` : '',
    hairSpec ? `\nHAIR [ABSOLUTE LOCK — REPRODUCE EXACTLY IN ALL 6 IMAGES]: Every detail of this hairstyle is non-negotiable. Silhouette, length, curl pattern, color (every highlight, lowlight, base tone, and root depth), texture, and styling must match this specification with zero deviation across all images. Hair schematic: ${hairSpec.substring(0, 450)}` : '',
    skinToneExplicit
      ? `\nSKIN TONE [ABSOLUTE LOCK — CLIENT SELECTION, OVERRIDES EVERYTHING]: ${skinToneDesc}. Reproduce this EXACT skin tone on every centimeter of visible skin, identically across ALL 6 images. This is the client's explicit selection — it OVERRIDES any skin tone in the identity profile, DNA, or any reference image. Do NOT lighten, darken, neutralise, or substitute it. Skin tone that drifts from this selection (or between slots) = generation failure.`
      : (modelIdentityDNA
          ? `\nSKIN TONE [ABSOLUTE LOCK]: Reproduce the subject's natural skin tone EXACTLY as stated in the Subject Identity profile above. Do NOT lighten, alter, neutralise, or override it.`
          : `\nSKIN TONE [ABSOLUTE LOCK]: ${skinToneDesc} — every centimeter of visible skin. No exceptions.`),
    `\nAI MODEL IDENTITY [CRITICAL]: Generate a completely fictional AI model. This person must NOT resemble, share facial features with, or be identifiable as: (a) any person visible in an uploaded reference photo, (b) a mannequin, dress form, or plastic form, (c) any real public figure. The AI model is a new fictional person — original face, natural human skin texture, and real human proportions. No mannequin-like features (plastic skin, featureless face, bald head unless specified).`,

    `\n\n━━ CHANNEL B: GARMENT SPECIFICATION (ISOLATED) ━━`,
    !hasClothingAnchor
      ? `\nCLOTHING [ABSOLUTE LOCK]: The ONLY clothing permitted is what is described in the scene brief above. Do NOT reproduce any garment from any reference image. If the reference image shows a swimsuit, bodysuit, or any garment — it is INVISIBLE to you. Use ONLY the outfit described in the brief.`
      : `\nGARMENT [LOCKED — REPRODUCE EXACTLY]: The anchored garment must be reproduced with 100% fidelity. Every repeating pattern, fabric weave, intricate print, micro-texture, and statement embellishment (feathers, 3D florals, apliqués, bows, ruffles, sequin zones) from the DNA schematic and reference image must be rendered with architectural precision. Statement elements must appear at their exact position on the garment at full scale. Do not simplify, ghost, or alter the print. Any deviation = generation failure.`,

    // CHANNEL C — in verbatim mode the brief is authoritative for all photography;
    // the structured locks are suppressed so they cannot conflict with the client's text.
    verbatim
      ? `\n\n━━ CHANNEL C: PHOTOGRAPHY DIRECTION (BRIEF-LED) ━━\nCamera, lighting, colour grade, composition, pose, expression, framing, atmosphere and styling are defined ENTIRELY by the creative brief at the top of this prompt. Apply the brief exactly as written. Do NOT impose any photographic or atmospheric choice the brief does not state.`
      : `\n\n━━ CHANNEL C: PHOTOGRAPHY DIRECTION (PRODUCTION LOCKED) ━━`,
    (!verbatim && slotScene) ? `\nCAMERA & OPTICS [LOCKED]: ${slotScene.camera || 'unspecified lens'}` : '',
    (!verbatim && slotScene) ? `\nLIGHTING SETUP [LOCKED]: ${slotScene.lighting || 'ambient light'}` : '',
    (!verbatim && slotScene) ? `\nCOLOR GRADE & FILM AESTHETIC [LOCKED]: ${slotScene.colorGrade || 'standard rendering'}` : '',
    (!verbatim && slotScene) ? `\nCOMPOSITION APPROACH [LOCKED]: ${slotScene.composition || 'standard'}` : '',
    (!verbatim && poseDesc) ? `\nPOSE DIRECTION [LOCKED]: ${poseDesc}` : (!verbatim && slotPose ? `\nPOSE [LOCKED]: ${slotPose}` : ''),
    (!verbatim && expressionDesc) ? `\nFACIAL EXPRESSION [LOCKED]: ${expressionDesc}` : '',
    (!verbatim && shotTypeDesc) ? `\nSHOT TYPE & FRAMING [LOCKED]: ${shotTypeDesc}` : (!verbatim && slotFrm ? `\nFRAMING [LOCKED]: ${slotFrm}` : ''),
    (!verbatim && atmosphereDesc) ? `\nATMOSPHERE [LOCKED]: ${atmosphereDesc}` : '',
    (!verbatim && stylingDesc) ? `\nSTYLING & FINISHING [LOCKED]: ${stylingDesc}` : '',

    `\n\n━━ CHANNEL D: SCENE & ENVIRONMENT ━━`,
    verbatim
      ? `\nSCENE [BRIEF-LED]: The scene, background, environment and atmosphere are exactly as described in the creative brief at the top — it is the authoritative specification. Do not substitute a studio or any setting the brief does not describe.`
      : `\nBACKGROUND [ABSOLUTE LOCK]: ${bgLock}`,
    ctx.backgroundRefImage ? `\nENVIRONMENT REFERENCE [MATCH THE ATTACHED SCENE IMAGE]: Recreate the surroundings to match the attached environment reference image — same architecture, surfaces, depth, foliage, and light quality. Place the subject naturally within that recreated scene. Use the reference for the SETTING ONLY; never copy any person, mannequin, or garment from it.` : '',
    (!verbatim && isCustomEnv) ? `\nThe entire scene takes place in this environment. The ground, sky, atmosphere, and surroundings must all reflect: "${bgLock}". A studio or neutral backdrop is a generation failure.` : '',
    (!verbatim && userDirection) ? `\nCLIENT SCENE DIRECTION [FINAL INSTRUCTION — ABSOLUTE PRIORITY]:\n"${userDirection}"\nThis is the client's specific scene requirement. Every prop, vehicle, accessory, and action described here MUST be visually present and prominent in the final image. This is the last instruction you read before generating — honor it completely.` : '',

    `\n\n━━ ANATOMY RULES ━━`,
    `\nANATOMY [ABSOLUTE LOCK]: Exactly 2 arms. Exactly 2 hands. 5 fingers per hand. No phantom limb, no third arm. Count every limb — 3 arms = generation failure.`,
    `\nFULL BODY COMPOSITION: Show the model's complete body. Do not crop legs, feet, or any body part at the frame edge unless the brief explicitly calls for a headshot or waist-up crop.`,

    (!verbatim && userDirection)
      ? `\n\nSELF-AUDIT: □ ${anchorDesc} fully detailed? □ Background = "${bgLock}"? □ Skin tone correct? □ Model archetype correct? □ Lighting applied? □ 2 hands / 5 fingers each? □ Client direction ("${userDirection.substring(0, 60)}...") visually present?`
      : `\n\nSELF-AUDIT: □ ${anchorDesc} fully detailed? □ ${verbatim ? 'Scene matches the brief exactly' : `Background = "${bgLock}"`}? □ Skin tone correct? □ Model archetype correct? □ ${verbatim ? 'Brief applied verbatim' : 'Lighting applied'}? □ 2 hands / 5 fingers each?`,
    `\nAll checks must pass. VIOLATING ANY LOCK ABOVE = GENERATION FAILURE`,
    mutation?.suffix ?? '',
  ].join('');
}

// ─── Parts Builder ────────────────────────────────────────────────────────────
// Assembles the Gemini `parts` array for each mode.
// Part order matters: Gemini interprets images in the order they appear.
function buildParts(mode, prompt, ctx) {
  const {
    rawImageData, rawMimeType,
    garmentImageData, garmentMimeType,
    anchorRefImage,
    fashnVTOImage,
    clothingMaskedModel,
    cleanGarmentRender, garmentCleanRef,
  } = ctx;

  switch (mode) {
    case MODES.AI_GENERATE: {
      const parts = [];
      // Multi-SKU outfit: one labeled, face-free reference image per garment, in
      // selection order, each preceded by a role label so Gemini treats them as
      // distinct independently-locked garments composed into a single look (K6).
      if (Array.isArray(ctx.anchorRefImages) && ctx.anchorRefImages.length > 1) {
        ctx.anchorRefImages.forEach((ref, i) => {
          const label = ref.label || ref.anchorType || `Garment ${i + 1}`;
          parts.push({ text: `━━ GARMENT REFERENCE ${i + 1} — ${label} (FACE-FREE) ━━\nThis image shows ONLY the ${label}. Reproduce it exactly — color, pattern, texture, construction, and finish. It is worn together with the other garment references as one coordinated outfit.\n\n` });
          parts.push({ inlineData: { mimeType: ref.mimeType, data: ref.data } });
        });
      } else if (anchorRefImage) {
        // Single anchor ref image (face-free)
        parts.push({ inlineData: { mimeType: anchorRefImage.mimeType, data: anchorRefImage.data } });
      }
      // Optional custom environment reference — scene/background source only.
      if (ctx.backgroundRefImage) {
        parts.push({ text: '\n\n━━ ENVIRONMENT REFERENCE (BACKGROUND ONLY) ━━\nThis image shows the target environment/location. Recreate this exact setting as the background and surroundings: architecture, surfaces, foliage, light quality, and atmosphere. Use it ONLY for the scene — do NOT copy any person, mannequin, garment, or product that may appear in it.\n\n' });
        parts.push({ inlineData: { mimeType: ctx.backgroundRefImage.mimeType, data: ctx.backgroundRefImage.data } });
      }
      parts.push({ text: prompt });
      return parts;
    }

    case MODES.VTO_BACKGROUND_REPLACE: {
      // Dual-image: source garment (pattern ground truth) + VTO output (frozen composition).
      // Sending the original garment gives Gemini pixel-perfect pattern reference alongside
      // the potentially compressed VTO output.
      const bgReplaceParts = [];
      if (garmentImageData && garmentMimeType) {
        bgReplaceParts.push({ text: '━━ IMAGE 1 — GARMENT PATTERN REFERENCE ━━\nThis is the ORIGINAL SOURCE GARMENT before it was applied to the model. Use it as the absolute ground truth for every print, pattern repeat, motif, color block, and fabric weave. Extract exact colors, exact pattern frequency, and exact texture from this image.\n\n' });
        bgReplaceParts.push({ inlineData: { mimeType: garmentMimeType, data: garmentImageData } });
        bgReplaceParts.push({ text: '\n\n━━ IMAGE 2 — VTO COMPOSITION BASE (FROZEN) ━━\nThis is the VTO output — the garment on the model. The model, pose, and garment fit are frozen. Only the background may change. Use Image 1 above for pattern/color accuracy.\n\n' });
      }
      bgReplaceParts.push({ inlineData: fashnVTOImage });
      bgReplaceParts.push({ text: prompt });
      return bgReplaceParts;
    }

    case MODES.VTO_EDITORIAL: {
      // Two-image pattern lock:
      //   Image 1 (garment source) — high-res fabric pattern reference. Role-labeled "PATTERN REFERENCE PANEL"
      //   Image 2 (VTO output)     — body, pose, identity, garment fit. Role-labeled "VTO COMPOSITION BASE"
      // Explicit role labels before each image prevent Gemini from blending or mirroring inputs.
      // Previous single-image path caused pattern ghosting on complex prints (florals, weaves)
      // because Gemini re-drew the pattern from its visual approximation of the VTO output alone.
      const parts = [];
      if (garmentImageData && garmentMimeType) {
        parts.push({ text: '━━ IMAGE 1 — PATTERN REFERENCE PANEL (GARMENT SOURCE) ━━\nThis is the ORIGINAL SOURCE GARMENT before it was applied to any model. Extract ONLY the fabric pattern, print motifs, exact color palette, weave structure, and micro-texture from this image. Every repeating motif, color block, print frequency, and fiber detail must be noted. Do NOT use the background, model pose, or scene from this image for anything. This panel exists solely so you have pixel-accurate knowledge of the garment fabric.\n\n' });
        parts.push({ inlineData: { mimeType: garmentMimeType, data: garmentImageData } });
        parts.push({ text: '\n\n━━ IMAGE 2 — VTO COMPOSITION BASE ━━\nThis is the Virtual Try-On output — the garment has already been applied to the model. Use Image 2 for: body structure, limb positions, garment silhouette and fit on the body, face identity, skin tone, and hair. When rendering the garment fabric in your output, use the pattern and color extracted from Image 1 — not the potentially compressed or approximated version visible in Image 2.\n\n' });
      }
      parts.push({ inlineData: fashnVTOImage });
      parts.push({ text: prompt });
      return parts;
    }

    case MODES.INPAINTING:
      // Masked model photo → text prompt to fill grey zone
      return [
        { inlineData: clothingMaskedModel },
        { text: prompt },
      ];

    case MODES.TWO_IMAGE: {
      // Text prompt → model photo → garment flat-lay (face-free)
      // Garment must be face-free to prevent identity bleed from second image (K6)
      const garmentImg = cleanGarmentRender
        || garmentCleanRef
        || { data: garmentImageData, mimeType: garmentMimeType };
      return [
        { text: prompt },
        { inlineData: { data: rawImageData, mimeType: rawMimeType } },
        { inlineData: garmentImg },
      ];
    }

    case MODES.PHOTO_EDIT:
    default:
      // Source model photo → text prompt with background replacement instructions
      return [
        { inlineData: { mimeType: rawMimeType, data: rawImageData } },
        { text: prompt },
      ];
  }
}

// ─── Pre-Flight Validator ─────────────────────────────────────────────────────
// Checks for known failure patterns BEFORE the API call.
// Returns array of warning objects { code, message, severity }.
// Severity: 'error' = will likely fail | 'warn' = may produce suboptimal results
function preFlightValidate(mode, prompt, tempInfo, safetySettings) {
  const warnings = [];

  // K2 check: generation framing in keep modes
  if ([MODES.PHOTO_EDIT, MODES.VTO_BACKGROUND_REPLACE, MODES.VTO_EDITORIAL, MODES.INPAINTING, MODES.TWO_IMAGE].includes(mode)) {
    if (/generate a new photo|create a new (photo|image)|new photograph of this person/i.test(prompt)) {
      warnings.push({
        code: 'K2_VIOLATION',
        severity: 'error',
        message: 'Keep mode contains generation framing — Gemini will create a new person instead of preserving the source. Fix: use "PHOTO EDIT" framing.',
      });
    }
  }

  // K3 check: DNA text in preservation locks (basic heuristic — checks ✗ lock lines)
  if ([MODES.PHOTO_EDIT].includes(mode)) {
    const lockMatches = prompt.match(/✗.+/g) || [];
    const hasDnaDetail = lockMatches.some(line =>
      /balayage|ombr[eé]|Pantone|coily|kinky|honey|chestnut|auburn|platinum|Level \d|inch|colour #|\/[0-9a-f]{6}/i.test(line)
    );
    if (hasDnaDetail) {
      warnings.push({
        code: 'K3_VIOLATION',
        severity: 'warn',
        message: 'DNA text blocks detected in keep-mode lock lines. Gemini will regenerate the feature from text. Remove detailed descriptions — "IDENTICAL to input" is more reliable.',
      });
    }
  }

  // K1 check: safety settings in keep modes (should never happen if architect is used correctly)
  if ([MODES.PHOTO_EDIT, MODES.VTO_BACKGROUND_REPLACE, MODES.VTO_EDITORIAL, MODES.INPAINTING, MODES.TWO_IMAGE].includes(mode)) {
    if (safetySettings !== null) {
      warnings.push({
        code: 'K1_VIOLATION',
        severity: 'error',
        message: 'safetySettings are set for a keep/identity-preservation mode. This will activate the deepfake filter and randomize the face. Remove safetySettings.',
      });
    }
  }

  // Temperature guard for VTO_BACKGROUND_REPLACE — tightest possible, garment pixel lock
  if (mode === MODES.VTO_BACKGROUND_REPLACE && tempInfo.final > 0.40) {
    warnings.push({
      code: 'TEMP_TOO_HIGH',
      severity: 'warn',
      message: `Temperature ${tempInfo.final.toFixed(3)} is above 0.40 for VTO_BACKGROUND_REPLACE mode. Background generation uses 0.18–0.33.`,
    });
  }

  // Temperature guard for PHOTO_EDIT
  if (mode === MODES.PHOTO_EDIT && tempInfo.final > 0.20) {
    warnings.push({
      code: 'TEMP_TOO_HIGH',
      severity: 'warn',
      message: `Temperature ${tempInfo.final.toFixed(3)} is above 0.20 for PHOTO_EDIT mode. Background-only edits need 0.07–0.15 for reliable identity preservation.`,
    });
  }

  // Temperature guard for INPAINTING
  if (mode === MODES.INPAINTING && tempInfo.final > 0.15) {
    warnings.push({
      code: 'TEMP_TOO_HIGH',
      severity: 'warn',
      message: `Temperature ${tempInfo.final.toFixed(3)} is above 0.15 for INPAINTING mode. Fill tasks need 0.05–0.12 for reliable results.`,
    });
  }

  // Short prompt guard
  if (prompt.length < 200 && mode !== MODES.AI_GENERATE) {
    warnings.push({
      code: 'THIN_PROMPT',
      severity: 'warn',
      message: `Prompt is only ${prompt.length} chars — may lack sufficient locks for identity preservation.`,
    });
  }

  return warnings;
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────
/**
 * build(ctx) → GenerationSpec
 *
 * The single entry point for all Gemini generation configuration.
 * Classifies the mode, builds the optimal prompt and parameters,
 * pre-flight validates, and returns a complete spec.
 *
 * @param {object} ctx - Generation context (see Knowledge Base field list)
 * @returns {{
 *   mode: string,
 *   prompt: string,
 *   parts: Array,
 *   apiConfig: object,   // { generationConfig, safetySettings? }
 *   tempInfo: object,    // { base, final, floor }
 *   log: string[],       // decision trace for debugging
 *   warnings: object[],  // pre-flight issues { code, severity, message }
 * }}
 */
export function build(ctx) {
  const log = [];

  // ── 1. Classify mode ──────────────────────────────────────────────────────
  const mode = classify(ctx);
  const meta = MODE_METADATA[mode];
  log.push(`[ARCHITECT] MODE: ${mode} — ${meta.label}`);
  log.push(`[ARCHITECT] CONTEXT: isAiGenerated=${ctx.isAiGenerated} | isKeepGarment=${ctx.isKeepGarment} | fashnVTO=${!!ctx.fashnVTOImage}${ctx.fashnVTOImage ? ` (${ctx.isAiGenerated ? 'AI+FASHN' : 'KEEP+FASHN'})` : ''} | maskedModel=${!!ctx.clothingMaskedModel} | anchorRef=${!!ctx.anchorRefImage}`);
  log.push(`[ARCHITECT] RULES: ${meta.rules.join(' | ')}`);

  // ── 2. Build prompt ───────────────────────────────────────────────────────
  let prompt;
  switch (mode) {
    case MODES.PHOTO_EDIT:             prompt = buildPhotoEditPrompt(ctx);             break;
    case MODES.VTO_BACKGROUND_REPLACE: prompt = buildVTOBackgroundReplacePrompt(ctx);  break;
    case MODES.VTO_EDITORIAL:          prompt = buildVTOEditorialPrompt(ctx);          break;
    case MODES.INPAINTING:             prompt = buildInpaintingPrompt(ctx);            break;
    case MODES.TWO_IMAGE:              prompt = buildTwoImagePrompt(ctx);              break;
    case MODES.AI_GENERATE:            prompt = buildAiGeneratePrompt(ctx);            break;
    default:                           prompt = buildAiGeneratePrompt(ctx);
  }
  log.push(`[ARCHITECT] PROMPT: ${prompt.length} chars`);

  // ── 3. Resolve temperature ────────────────────────────────────────────────
  const tempInfo = resolveTemperature(mode, ctx);
  log.push(`[ARCHITECT] TEMP: base=${tempInfo.base} → final=${tempInfo.final}${ctx.mutation ? ` (retry Δ=${ctx.mutation.tempDelta})` : ''}`);

  // ── 4. Resolve safety settings ────────────────────────────────────────────
  // K1: All keep/identity modes → null (omit). AI mode → SAFETY_FOR_AI_MODE.
  const safetySettings = meta.safetySettings;
  log.push(`[ARCHITECT] SAFETY: ${safetySettings ? 'APPLIED (AI mode — no real identity)' : 'OMITTED (K1 — prevent deepfake filter)'}`);

  // ── 5. Build parts array ──────────────────────────────────────────────────
  const parts = buildParts(mode, prompt, ctx);
  const partTypes = parts.map(p => p.text ? 'text' : 'image').join(', ');
  log.push(`[ARCHITECT] PARTS: ${parts.length} part(s) [${partTypes}]`);

  // ── 6. Assemble API config ────────────────────────────────────────────────
  const apiConfig = {
    generationConfig: {
      responseModalities: ['IMAGE'],
      temperature: tempInfo.final,
      imageConfig: {
        imageSize: '2K',  // Premier output: 2K resolution for print-ready editorial quality
      },
    },
    ...(safetySettings ? { safetySettings } : {}),
  };
  log.push(`[ARCHITECT] RESOLUTION: 2K (premier output)`);


  // ── 7. Pre-flight validation ──────────────────────────────────────────────
  const warnings = preFlightValidate(mode, prompt, tempInfo, safetySettings);
  if (warnings.length === 0) {
    log.push('[ARCHITECT] PRE-FLIGHT: ✓ All checks passed — ready for Gemini');
  } else {
    warnings.forEach(w => log.push(`[ARCHITECT] PRE-FLIGHT ${w.severity.toUpperCase()} [${w.code}]: ${w.message}`));
  }

  return { mode, prompt, parts, apiConfig, tempInfo, log, warnings };
}

export default { MODES, classify, build };
