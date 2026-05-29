/**
 * lib/forge/agents/agent01g-ai-character.js
 * AGENT 01g — AI Character Engine
 *
 * Generates a neutral full-body AI character reference photograph using Gemini.
 * This character is then handed off to Agent 01f-AI to have the user's garment
 * applied via the VTO pipeline (Vertex AI → Fashn.ai fallback).
 *
 * The generated character is:
 *   - A clean, full-body studio shot with placeholder garments (white tee, grey trousers)
 *   - Built from the slot's assigned ethnicity, age, body type, face, and skin tone
 *   - Augmented with HAIR and accessory DNA from the source upload if present
 *   - Posed neutrally to give the VTO engine the best possible input frame
 *
 * Context isolation: no @google/genai imported here.
 * The Gemini model instance (PXL model) is passed in from the handler.
 *
 * Imports: services (gemini backoff), config (constants, safety, anchors).
 */

import { withGeminiBackoff } from '../services/gemini-client.js';
import { SAFETY_SETTINGS }   from '../safety.js';
import { ANCHOR_LABELS }     from '../config/anchors.js';

// Clothing anchor IDs — used to filter out clothing from accessory DNA injection
const CLOTHING_SET = new Set(['SHIRT', 'PANTS', 'SHORTS', 'SWIMWEAR', 'FULL_OUTFIT', 'HAT']);

// Timeout for the Gemini image generation call (35 s — generous for PXL model)
const AGENT_01g_TIMEOUT_MS = 35_000;

/**
 * runAgent01gAiCharacter
 * Generates a neutral full-body AI character reference for the Garment Showcase pipeline.
 *
 * @param {Object}  ctx
 * @param {Object}  ctx.genAI          — GoogleGenerativeAI instance (PXL_MODEL)
 * @param {string}  ctx.PXL_MODEL      — image generation model name
 * @param {string}  ctx.genderLabel    — 'female' | 'male'
 * @param {string}  ctx.skinToneDesc   — resolved skin tone description
 * @param {string}  ctx.charEthnicity  — slot ethnicity (e.g. 'South Asian (Indian/Sri Lankan)')
 * @param {string}  ctx.charFace       — slot face descriptor
 * @param {string}  ctx.charBodyType   — slot body type descriptor
 * @param {string}  ctx.charAge        — slot age descriptor (e.g. '24 years old')
 * @param {string[]} ctx.anchors       — active anchor IDs
 * @param {Object}  ctx.dnaMap         — anchor → extracted text schematic
 * @returns {Promise<{ data: string, mimeType: string } | null>}
 */
export async function runAgent01gAiCharacter({
  genAI,
  PXL_MODEL,
  genderLabel,
  skinToneDesc,
  charEthnicity,
  charFace,
  charBodyType,
  charAge,
  anchors,
  dnaMap,
}) {
  const fashnCharModel = genAI.getGenerativeModel({ model: PXL_MODEL });

  // ── Build optional anchor injections ────────────────────────────────────
  // Hair DNA is injected verbatim — the VTO model needs the correct hair
  // on the character before the garment is applied.
  const charHairSpec = dnaMap?.['HAIR']
    ? `\nHAIR [MANDATORY — REPRODUCE EXACTLY]: ${dnaMap['HAIR'].substring(0, 450)}`
    : '';

  // Non-clothing, non-hair accessory specs are included so earrings/jewelry/watches
  // appear on the character and survive through the VTO pipeline.
  const charAccessorySpecs = (anchors || [])
    .filter(anc => anc !== 'HAIR' && !CLOTHING_SET.has(anc))
    .map(anc => {
      const label = (ANCHOR_LABELS?.[anc] || anc).toUpperCase();
      return dnaMap?.[anc]
        ? `\n${label} [MANDATORY]: ${dnaMap[anc].substring(0, 300)}`
        : null;
    })
    .filter(Boolean)
    .join('');

  // ── Build character prompt ───────────────────────────────────────────────
  const charPrompt = `Generate a professional full-body CHARACTER REFERENCE PHOTOGRAPH for a ${genderLabel} fashion model.

SUBJECT: ${charAge} ${genderLabel}. ${charEthnicity} heritage. ${charFace}. ${charBodyType} build. ${skinToneDesc} skin tone.${charHairSpec}${charAccessorySpecs}

REQUIREMENTS:
• Neutral standing pose — body facing directly at camera, arms relaxed at sides, chin level
• Plain clean white seamless studio background, soft even front lighting
• Wearing: plain white crew-neck t-shirt and light grey straight-leg trousers — PLACEHOLDER GARMENTS ONLY (will be replaced by virtual try-on system)
• Full body completely visible from crown to feet — do not crop any part of the body
• Face forward, expression neutral and professional, eyes open
• Photorealistic — sharp focus, studio quality, no stylisation or illustration

CRITICAL FOR VTO PROCESSING: Full body in frame is mandatory. Placeholder garments must be plain and featureless — no prints, logos, textures, or design details. Clean neutral studio shot only.`;

  // ── Execute with timeout ─────────────────────────────────────────────────
  console.log(`[FORGE] AGENT 01g: Generating AI character — ${charEthnicity}, ${charAge}...`);

  const timeoutSignal = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`AGENT_01g_TIMEOUT: ${AGENT_01g_TIMEOUT_MS / 1000}s exceeded`)),
      AGENT_01g_TIMEOUT_MS
    )
  );

  try {
    const result = await Promise.race([
      withGeminiBackoff(() =>
        fashnCharModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: charPrompt }] }],
          generationConfig: { responseModalities: ['IMAGE'], temperature: 0.30 },
          safetySettings: SAFETY_SETTINGS,
        })
      ),
      timeoutSignal,
    ]);

    const part = result.response?.candidates?.[0]?.content?.parts
      ?.find(p => p.inlineData?.data);

    if (!part) throw new Error('no image returned in response');

    const aiCharacterRef = {
      data:     part.inlineData.data,
      mimeType: part.inlineData.mimeType || 'image/png',
    };

    console.log('[FORGE] AGENT 01g: AI character reference ready.');
    return aiCharacterRef;

  } catch (err) {
    console.warn(`[FORGE] AGENT 01g failed: ${err?.message}`);
    return null;
  }
}
