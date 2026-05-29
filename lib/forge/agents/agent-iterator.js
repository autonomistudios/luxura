/**
 * lib/forge/agents/agent-iterator.js
 * AGENT ITERATOR — Creative Director Refinement Engine
 *
 * Phase 2 of the LuxAura pipeline. A dedicated Creative Director agent that
 * takes a single Master Image + Adjustment Prompt and produces 3 refined variants.
 *
 * Uses the same directive architecture as Agent 02 + PromptArchitect:
 *   - DNA extraction pass: reads face, hair, skin, garment, lighting, color grade from master
 *   - MANDATORY OVERRIDES block: non-negotiable hard locks on identity
 *   - Creative delta injection: only the declared adjustment changes
 *   - 3 directorial variants: A (faithful), B (wider interpretation), C (cinematic push)
 */

import { SAFETY_SETTINGS } from '../safety.js';

// ─── Stage 1: DNA Extraction ──────────────────────────────────────────────────
const DNA_EXTRACTION_PROMPT = `You are a forensic visual analyst for a high-fashion AI studio.
Analyze this Master Image with absolute precision. Extract every visual element that MUST be preserved in any refinement.

Output a structured DNA report in this exact format:

SUBJECT IDENTITY:
- Face structure: [precise description of bone structure, jawline, eye shape, nose, lips]
- Skin tone: [Fitzpatrick scale + descriptive — e.g. "Fitzpatrick III, warm medium brown with golden undertones"]
- Age appearance: [approximate age range with visible markers]
- Gender presentation: [exact as shown]

HAIR DNA:
- Style: [length, cut architecture, layers]
- Color: [precise color with tonal description]
- Texture: [straight/wavy/coily/kinky + density]
- Styling: [exact styling detail — slicked, natural, pinned, etc.]

GARMENT & STYLING:
- Primary garment: [exact item, color, fabric, cut]
- Secondary items: [all other visible garments, accessories]
- Color palette: [dominant + accent colors as hex approximations]

TECHNICAL:
- Shot type: [exact framing — full body / three-quarter / waist-up / portrait / beauty close-up]
- Camera angle: [eye level / high angle / low angle / dutch tilt]
- Background: [environment, depth of field treatment, color]
- Lighting: [direction, quality, color temperature, shadow behavior]
- Color grade: [overall tonal mood — warm/cool/neutral, contrast level, saturation]
- Film aesthetic: [grain, sharpness, editorial style]

Output ONLY the structured report. No preamble.`;

// ─── Stage 2: Build Refinement Directives ────────────────────────────────────
function buildIteratorSystemInstruction(iterationType) {
  const deltaGuide = {
    composition_shift: `
PERMITTED CREATIVE DELTA — COMPOSITION ONLY:
You may change: camera framing, crop boundaries, subject position within frame, negative space distribution, camera angle.
You may NOT change: anything in the MASTER DNA LOCK above.`,

    pose_variant: `
PERMITTED CREATIVE DELTA — POSE & BODY LANGUAGE ONLY:
You may change: body stance, limb position, hand placement, shoulder orientation, weight distribution, subtle movement/motion blur.
You may NOT change: the subject's face direction more than 45°, garment, hair, lighting, background, or color grade.`,

    feature_enhance: `
PERMITTED CREATIVE DELTA — DETAIL ENHANCEMENT ONLY:
Apply the declared Adjustment Prompt with maximum fidelity. Enhance the specified element (skin quality, fabric texture, lighting refinement, accessory focus, etc.).
You may NOT change the overall composition, pose, garment, hair, or identity beyond the specified enhancement.`,
  };

  return `You are the LuxAura Creative Director — Refinement Specialist.

You operate in Phase 2 of a precision AI fashion pipeline. A Master Image has been analyzed and its full DNA extracted. You receive this DNA report as a hard lock. Your task: apply ONE precise creative delta while preserving every locked element.

PIPELINE AUTHORITY:
You have the same authority and standards as the full LuxAura Creative Director. Your output must be magazine-quality, editorial-grade, indistinguishable from a professional luxury fashion shoot.

${deltaGuide[iterationType] || deltaGuide.feature_enhance}

FAILURE CONDITIONS — any of these will be flagged and regenerated:
→ Face drift: subject looks different from master (bone structure, skin tone, eye shape)
→ Hair substitution: hairstyle, color, or texture changes
→ Garment swap: any clothing element changes color, cut, fabric, or styling
→ Lighting mood shift: the lighting quality and direction diverges from master
→ Color grade contamination: the image takes on a different tonal character
→ Shot type drift: framing changes beyond the declared delta scope

MANDATORY OUTPUT STANDARD:
- Ultra-sharp, high-resolution fashion editorial quality
- Clean, intentional negative space
- Professional studio or location lighting
- No AI artifacts, no plastic skin, no over-smoothed surfaces
- Fabric texture must be tactile and real — every weave, fold, sheen visible
- Skin must show natural texture — pores, expression lines, authentic depth`;
}

// ─── Stage 3: Variant Modifiers ───────────────────────────────────────────────
const VARIANT_BRIEFS = [
  `VARIANT A — FAITHFUL EXECUTION:
Apply the Adjustment Prompt with maximum precision and restraint. Stay as close as possible to the Master DNA while cleanly applying the declared delta. This is the safe, high-fidelity interpretation.`,

  `VARIANT B — EDITORIAL PUSH:
Apply the Adjustment Prompt with a slightly wider creative interpretation. Push the declared delta further — more dramatic framing, more expressive pose, or more enhanced detail. Maintain all DNA locks. Elevate the editorial tension.`,

  `VARIANT C — CINEMATIC PINNACLE:
Apply the Adjustment Prompt with the most cinematic, high-fashion execution possible within the delta scope. Ask: "What would a top-tier fashion photographer do with this direction?" Maximum drama, impeccable craft, all DNA locks honored.`,
];

// ─── Main Export ──────────────────────────────────────────────────────────────
/**
 * runAgentIterator
 * 3-stage pipeline: DNA extraction → directive build → 3-variant parallel generation.
 *
 * @param {Object} ctx
 * @param {Object}   ctx.genAI            — GoogleGenerativeAI instance
 * @param {string}   ctx.PXL_MODEL        — image generation model
 * @param {string}   ctx.TEXT_MODEL       — text reasoning model
 * @param {string}   ctx.masterImageData  — base64 master (no data: prefix)
 * @param {string}   ctx.masterMimeType   — mime type
 * @param {string}   ctx.adjustmentPrompt — user's creative direction
 * @param {string}   ctx.iterationType    — 'composition_shift' | 'pose_variant' | 'feature_enhance'
 * @param {Function} ctx.onProgress       — callback(slot, dataUrl)
 * @returns {Promise<string[]>}
 */
export async function runAgentIterator(ctx) {
  const {
    genAI,
    PXL_MODEL,
    TEXT_MODEL,
    masterImageData,
    masterMimeType,
    adjustmentPrompt,
    iterationType = 'feature_enhance',
    onProgress,
  } = ctx;

  const masterPart = { inlineData: { mimeType: masterMimeType, data: masterImageData } };

  // ── Stage 1: Extract DNA from master image ─────────────────────────────────
  console.log('[ITERATOR] Stage 1 — DNA extraction...');
  const dnaModel = genAI.getGenerativeModel({
    model: TEXT_MODEL,
    safetySettings: null,
  });

  const dnaResponse = await dnaModel.generateContent({
    contents: [{
      role: 'user',
      parts: [masterPart, { text: DNA_EXTRACTION_PROMPT }]
    }]
  });
  const masterDNA = dnaResponse.response.text().trim();
  console.log(`[ITERATOR] DNA extracted (${masterDNA.length} chars)`);

  // ── Stage 2: Build unified refinement directive ────────────────────────────
  console.log('[ITERATOR] Stage 2 — Directive synthesis...');
  const directiveModel = genAI.getGenerativeModel({
    model: TEXT_MODEL,
    safetySettings: null,
    systemInstruction: buildIteratorSystemInstruction(iterationType),
  });

  const directiveResponse = await directiveModel.generateContent({
    contents: [{
      role: 'user',
      parts: [
        masterPart,
        {
          text: `MASTER DNA LOCK:
${masterDNA}

ADJUSTMENT PROMPT (the ONLY thing that changes):
"${adjustmentPrompt}"

Task: Write a single, complete, ultra-precise image generation directive for Gemini.
The directive must:
1. State every locked DNA element as absolute, non-negotiable hard locks (same language as MANDATORY OVERRIDES in luxury fashion AI pipelines)
2. State the exact creative delta from the Adjustment Prompt as the only permitted change
3. Be written as a direct, imperative image generation command — not a description
4. Be ready to receive a variant modifier appended to it

Output ONLY the directive. No labels, no preamble, no commentary.`
        }
      ]
    }]
  });

  const coreDirective = directiveResponse.response.text().trim();
  console.log(`[ITERATOR] Core directive built (${coreDirective.length} chars)`);

  // ── Stage 3: Generate 3 variants in parallel ───────────────────────────────
  console.log('[ITERATOR] Stage 3 — Generating 3 variants...');
  const imageModel = genAI.getGenerativeModel({
    model: PXL_MODEL,
    safetySettings: null,
    systemInstruction: buildIteratorSystemInstruction(iterationType),
  });

  const results = new Array(3).fill(null);

  await Promise.all(VARIANT_BRIEFS.map(async (variantBrief, i) => {
    try {
      const response = await imageModel.generateContent({
        contents: [{
          role: 'user',
          parts: [
            masterPart,
            {
              text: `MASTER DNA LOCK:
${masterDNA}

CORE DIRECTIVE:
${coreDirective}

${variantBrief}`
            }
          ]
        }]
      });

      const candidate = response.response.candidates?.[0];
      const imgPart = candidate?.content?.parts?.find(p => p.inlineData?.mimeType?.startsWith('image/'));

      if (imgPart?.inlineData) {
        const dataUrl = `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;
        results[i] = dataUrl;
        if (onProgress) onProgress(i, dataUrl);
        console.log(`[ITERATOR] Slot ${i} (${['Faithful', 'Editorial', 'Cinematic'][i]}) complete`);
      } else {
        console.warn(`[ITERATOR] Slot ${i} — no image in response`);
      }
    } catch (err) {
      console.error(`[ITERATOR] Slot ${i} failed:`, err.message);
    }
  }));

  return results.filter(Boolean);
}
