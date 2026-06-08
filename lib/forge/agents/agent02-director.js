/**
 * lib/forge/agents/agent02-director.js
 * AGENT 02 — Creative Director + Self-Heal Guardian
 *
 * Writes 6 complete, integrated scene briefs — one per editorial slot.
 * Each brief is a ~250-word image generation prompt built around the anchor DNA
 * as the creative hero. No source image is used here — pure text in, text out.
 *
 * Also contains the Self-Heal Guardian (Layer 2 of client direction redundancy):
 * After all 6 briefs are written, each is scanned for the user's custom direction
 * keywords. Any brief that omits them receives an injection before Agent 02.5 audits.
 *
 * Four-layer client direction redundancy:
 *   Layer 1 → directorTask instructs the model to include it
 *   Layer 2 → Self-heal injects it if still missing (this file)
 *   Layer 3 → Agent 02.5 protects it during consistency corrections
 *   Layer 4 → Agent 03 has it as a FINAL INSTRUCTION
 *
 * Context isolation: no @google/genai imported here.
 * The Gemini model instance (TEXT_MODEL) is passed in from the handler.
 *
 * Imports: config (photography, anchors), utils (camera-resolver), safety.
 */

import { SAFETY_SETTINGS }           from '../safety.js';
import { ANCHOR_LABELS, ANCHOR_ENFORCEMENT } from '../config/anchors.js';
import { MASTER_PHOTOGRAPHY_DIRECTIONS }     from '../config/photography.js';
import { resolveSlotCamera }                 from '../utils/camera-resolver.js';

// ─── Photography direction index sets ─────────────────────────────────────────
// Maps a photoDirection preset name to an ordered index sequence into MASTER_PHOTOGRAPHY_DIRECTIONS.
// Each slot picks from this sequence to produce a full editorial spread.
const DIRECTION_SETS = {
  'full-spread':  [0, 1, 2, 3, 4, 5, 6, 7, 8],
  'high-fashion': [0, 3, 1, 6, 4, 0, 3, 1, 6],
  'commercial':   [8, 5, 2, 7, 1, 8, 5, 2, 7],
};

/**
 * resolveSlotDirection
 * Returns the photography direction object for a given slot index and config.
 * If the user selected a specific style ID (not a preset), all slots share that direction.
 *
 * @param {number} slotIndex
 * @param {Object} config
 * @returns {Object} — direction from MASTER_PHOTOGRAPHY_DIRECTIONS
 */
function resolveSlotDirection(slotIndex, config) {
  const PRESET_KEYS = ['full-spread', 'high-fashion', 'commercial'];
  const specificStyle = config?.photoDirection && !PRESET_KEYS.includes(config.photoDirection)
    ? MASTER_PHOTOGRAPHY_DIRECTIONS.find(d => d.id === config.photoDirection)
    : null;

  if (specificStyle) return specificStyle;

  const dirSet = DIRECTION_SETS[config?.photoDirection] || DIRECTION_SETS['full-spread'];
  return MASTER_PHOTOGRAPHY_DIRECTIONS[dirSet[slotIndex % dirSet.length]];
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * runAgent02Director
 * Generates 6 editorial scene briefs and applies the Self-Heal Guardian pass.
 *
 * @param {Object} ctx
 * @param {Object}   ctx.genAI             — GoogleGenerativeAI instance
 * @param {string}   ctx.TEXT_MODEL        — text reasoning model name
 * @param {Object}   ctx.config            — full forge config from the request body
 * @param {string[]} ctx.anchors           — active anchor IDs
 * @param {string}   ctx.anchorDesc        — human-readable anchor label(s)
 * @param {Object}   ctx.dnaMap            — anchor → extracted text schematic
 * @param {string|null} ctx.modelIdentityDNA — extracted physical profile of source subject
 * @param {boolean}  ctx.isAiGenerated     — true = new AI character; false = keep identity
 * @param {boolean}  ctx.hasClothingAnchor — true = at least one clothing anchor is active
 * @param {string}   ctx.genderLabel       — 'female' | 'male'
 * @param {string}   ctx.skinToneDesc      — resolved skin tone description
 * @param {string}   ctx.lockedLighting    — resolved lighting instruction
 * @param {string}   ctx.lockedBgRaw       — raw background key from config
 * @param {string}   ctx.lockedBgDesc      — resolved background description
 * @param {string}   ctx.lockedCamera      — resolved camera/lens description
 * @param {string|null} ctx.lockedColorGrade — resolved color grade instruction (or null)
 * @param {string}   ctx.userPromptText    — user's custom scene direction (may be empty)
 * @param {Object}   ctx.slots             — pre-generated per-slot permutation data
 * @returns {Promise<string[]>} — array of 6 brief strings
 */
export async function runAgent02Director({
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
}) {
  const directorModel = genAI.getGenerativeModel({ model: TEXT_MODEL });
  const selectedCameraKey = config?.camera || 'Soft Background (85mm)';

  // ── Build shared DNA block (same across all 6 slots) ───────────────────
  const allDnaBlock = anchors
    .map(anc =>
      `${anc.toUpperCase()} — ${(ANCHOR_LABELS[anc] || anc).toUpperCase()}:\n${dnaMap[anc] || ''}`
    )
    .join('\n\n---\n\n');

  const anchorFidelityBlock = anchors
    .map(anc =>
      `• ${ANCHOR_ENFORCEMENT[anc] || `Reproduce the ${ANCHOR_LABELS[anc] || anc} with 100% visual precision.`}`
    )
    .join('\n');

  // ── Per-slot brief generation ───────────────────────────────────────────
  const rawBriefs = await Promise.all(
    Array.from({ length: 6 }, async (_, i) => {
      // Stagger simultaneous quota hits — 350 ms apart after slot 0
      if (i > 0) await new Promise(r => setTimeout(r, i * 350));

      // ── Slot-specific permutation values ──────────────────────────────
      const eth      = slots.ethnicities[i];
      const face     = slots.faces[i];
      const pose     = slots.poses[i];
      const eyeColor = slots.eyes[i];
      const age      = slots.ages[i];
      const bodyType = slots.bodyTypes[i];
      const framing  = slots.framings[i];
      const fit      = slots.outfits[i];

      // ── Photography direction for this slot ────────────────────────────
      const dir = resolveSlotDirection(i, config);
      const slotLighting = (config?.lighting && config.lighting !== 'Clean & Even')
        ? lockedLighting
        : dir.lighting;

      // ── Camera conflict resolution ─────────────────────────────────────
      const { desc: slotCamera, overridden: slotCameraOverridden } =
        resolveSlotCamera(selectedCameraKey, anchors);
      if (slotCameraOverridden && i === 0) {
        console.log('[FORGE] AGENT 02: Camera-anchor conflict resolved for all slots — using portrait camera instead.');
      }

      // ── Outfit / styling standard ──────────────────────────────────────
      const outfitStandard = hasClothingAnchor
        ? 'Complementary styling — the anchored garment is the visual priority. All other clothing serves it.'
        : !isAiGenerated
          ? 'Preserve ALL clothing from the source reference image exactly as it appears. Do NOT replace, alter, or add any garment.'
          : fit;

      // ── Background resolution ──────────────────────────────────────────
      const bgLine = config?.locationPreset
        ? config.locationPreset
        : (lockedBgRaw === 'custom-bg' && userPromptText)
          ? `Environmental setting: ${userPromptText}`
          : lockedBgDesc;

      const creativeNote = userPromptText || '';

      // ── Gender block ───────────────────────────────────────────────────
      const genderLockLine = genderLabel === 'male'
        ? 'GENDER [ABSOLUTE LOCK]: This is a MAN. Male. He. Him. Any female presentation is a generation failure.'
        : 'GENDER [ABSOLUTE LOCK]: This is a WOMAN. Female. She. Her. Any male presentation is a generation failure.';

      // ── Identity block — extracted vs. generated ───────────────────────
      const identityBlock = modelIdentityDNA
        ? `The same ${genderLabel} appears in all 6 images of this series. These physical facts are NON-NEGOTIABLE:\n${modelIdentityDNA}\n• SKIN TONE: Reproduce the exact skin tone described in the identity profile above. Do NOT alter, lighten, darken, or override it under any circumstances.`
        : `These are the definitive facts about the model for this image:
• Heritage: ${eth}
• Age: ${age}
• Build: ${bodyType}
• Face: ${face}
• Eyes: ${eyeColor}
• SKIN TONE [MANDATORY OVERRIDE]: ${skinToneDesc} — Regardless of heritage, this model's skin is ${skinToneDesc}. State this explicitly in your brief.`;

      // ── Client direction line ──────────────────────────────────────────
      const clientDirectiveLine = creativeNote
        ? `• CLIENT SCENE DIRECTION [MANDATORY — MUST BE VISUALLY PRESENT IN THE IMAGE]: "${creativeNote}"
  This is a non-negotiable client directive. Every element described here must appear in the image exactly as specified. This takes priority over any default styling assumptions. Build the scene around this direction — if it describes a prop, vehicle, or object, it must be prominent and clearly visible.`
        : '';

      // ── Self-audit checklist ───────────────────────────────────────────
      const selfAuditLine = [
        `(a) the ${anchorDesc} is described with full DNA detail`,
        `(b) the exact background "${bgLine}" is specified`,
        `(c) the model's skin tone is stated`,
        `(d) the subject's identity matches the Identity Profile above`,
        creativeNote ? `(e) the client scene direction "${creativeNote.substring(0, 60)}..." is present and specific` : '',
      ].filter(Boolean).join(', ');

      // ── Compose the director task prompt ──────────────────────────────
      const directorTask = `You are a luxury editorial creative director. Write a single complete image generation prompt (~250 words) for image ${i + 1} of a 6-image portfolio series.

═══ CREATIVE HERO — ${anchorDesc.toUpperCase()} ═══
The following feature(s) are the hero of this image. Reproduce them with exact visual fidelity:

${allDnaBlock}

FIDELITY STANDARDS (non-negotiable):
${anchorFidelityBlock}

═══ SUBJECT IDENTITY — LOCKED FOR ALL 6 IMAGES ═══
${genderLockLine}
${identityBlock}

═══ PHOTOGRAPHY DIRECTION — IMAGE ${i + 1} ═══
Style Category: ${dir.name} | Published In: ${dir.publication}
Creative Vision: ${dir.aesthetic}

POSING ARCHETYPE: ${dir.posing}
• Framing/Crop: ${framing}${framing.includes('DETAIL') && anchors.length > 1 ? ` — detail focus: ${hasClothingAnchor ? anchorDesc.replace('hairstyle', '').trim() || anchorDesc : anchorDesc}` : ''}
• Styling: ${outfitStandard}
LIGHTING SETUP: ${slotLighting}
COLOR GRADE & FILM AESTHETIC: ${lockedColorGrade || dir.color_grade}
COMPOSITIONAL APPROACH: ${dir.composition}
CAMERA & LENS: ${slotCamera} — ${dir.camera_note}
POST-PROCESSING STANDARD: ${dir.post}
• BACKGROUND/ENVIRONMENT [LOCKED — NON-NEGOTIABLE]: ${bgLine}
${atmosphereDesc ? `• ATMOSPHERE [LOCKED — WEAVE THROUGHOUT]: ${atmosphereDesc}` : ''}
${clientDirectiveLine}

═══ YOUR TASK ═══
Write a single unified image generation prompt (no headers, no bullets, flowing prose):
1. Open with the subject's physical identity as definitive fact — use the Subject Identity block above as the ground truth
2. Integrate the anchor feature (${anchorDesc}) as its own detailed passage, using every detail from the DNA above
3. Describe the pose, composition, and framing as they will appear in the final image
4. ENVIRONMENT IS MANDATORY: Describe the background/location (${bgLine}) in vivid, specific detail — what the space looks like, the ground, the atmosphere, the lighting interaction with the environment. This cannot be omitted or softened.
${atmosphereDesc ? `4c. ATMOSPHERE IS MANDATORY: The entire scene must embody "${atmosphereDesc}" — describe its physical effect on the environment and the subject (e.g. wet reflective ground, mist or droplets in the air, diffused light, damp fabric and hair, the mood and color it casts). Weave it through the whole image; never mention it only in passing.` : ''}
${creativeNote ? `4b. CLIENT DIRECTION IS MANDATORY: The scene must include every element from the client directive: "${creativeNote}". Describe it in detail within the prompt as if it were always part of the image concept.` : ''}
5. Close with: photographic quality targeting ${dir.publication} standard — ${dir.post} — ultra-realistic skin with visible pore detail and subsurface light scattering, no plastic or CG skin, analog photography quality that would pass as shot on film
6. Do NOT write "anchor", "DNA", "source image", "reference", slot numbers, or any meta-language
7. Visual consistency across the series — the same person appears in every image
8. CLOTHING ISOLATION RULE: The only garments that may appear are (a) the anchored garment(s) listed in the Creative Hero block, (b) the outfit defined in Shot Direction, or (c) any garments explicitly mentioned in the Client Scene Direction above. Do NOT reproduce any other garment from any reference image.
9. SELF-AUDIT before finalizing your prompt — confirm all checkpoints pass: ${selfAuditLine}. If any checkpoint fails, revise the prompt before outputting.`;

      // ── Execute with one automatic retry ──────────────────────────────
      const runDirector = async () => {
        const result = await directorModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: directorTask }] }],
          generationConfig: { temperature: 0.65, topP: 0.95 },
          safetySettings: SAFETY_SETTINGS,
        });
        const brief = result.response.text() || '';
        if (brief.trim().length < 80) {
          throw new Error(`brief too short (${brief.length} chars) — likely malformed`);
        }
        return brief;
      };

      try {
        let brief;
        try {
          brief = await runDirector();
        } catch (firstErr) {
          console.warn(`[FORGE] Director slot ${i + 1} retry after error:`, firstErr?.message);
          await new Promise(r => setTimeout(r, 1500));
          brief = await runDirector();
        }
        console.log(`[FORGE] Director: brief ${i + 1}/6 written (${brief.length} chars)`);
        return brief;
      } catch (err) {
        // Hard fallback — build a minimal brief from slot data so generation can proceed
        console.warn(`[FORGE] Director fallback slot ${i + 1}:`, err?.message);
        return [
          `A ${age} ${eth} model, ${bodyType}, with ${face} and ${eyeColor} eyes.`,
          `Skin tone: ${skinToneDesc} (mandatory).`,
          allDnaBlock,
          `Pose: ${pose}.`,
          framing,
          slotLighting,
          bgLine,
          lockedCamera,
          outfitStandard,
          creativeNote ? `CLIENT SCENE DIRECTION [MANDATORY]: ${creativeNote}.` : '',
          'Ultra-realistic Vogue editorial photography, natural skin with pore detail, no CG.',
        ].filter(Boolean).join(' ');
      }
    })
  );

  // ── Self-Heal Guardian (Layer 2) ─────────────────────────────────────────
  // Scan each brief for the user's custom direction keywords.
  // Inject the directive directly into any brief that missed it.
  let briefs = rawBriefs;

  if (userPromptText && isAiGenerated) {
    const healKeywords = userPromptText
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 4) // >4 excludes common stopwords (with, from, that, this, then)
      .slice(0, 5);

    briefs = rawBriefs.map((brief, i) => {
      console.log(`[FORGE] Brief ${i + 1}/6: ${brief.substring(0, 150).replace(/\n/g, ' ')}...`);
      const briefLower         = brief.toLowerCase();
      const hasClientDirection = healKeywords.some(kw => briefLower.includes(kw));

      if (!hasClientDirection) {
        console.log(
          `[FORGE] SELF-HEAL: Brief ${i + 1} missing client direction ` +
          `("${userPromptText.substring(0, 60)}") — injecting`
        );
        return (
          brief +
          `\n\nCLIENT DIRECTIVE [NON-NEGOTIABLE — MUST BE VISUALLY PRESENT IN THE FINAL IMAGE]: ` +
          `"${userPromptText}". This is the client's scene requirement. Every element described ` +
          `here must appear clearly and prominently in the image. Build the scene around this directive.`
        );
      }
      return brief;
    });

    const healCount = briefs.filter(b => b.includes('CLIENT DIRECTIVE [NON-NEGOTIABLE')).length;
    if (healCount > 0) {
      console.log(`[FORGE] SELF-HEAL: Injected client direction into ${healCount} brief(s).`);
    }
  } else if (isAiGenerated) {
    // No user direction — log previews for Vercel observability only
    rawBriefs.forEach((brief, i) => {
      console.log(`[FORGE] Brief ${i + 1}/6: ${brief.substring(0, 150).replace(/\n/g, ' ')}...`);
    });
  }

  console.log(`[FORGE] AGENT 02 complete — ${briefs.length} brief(s) ready`);
  return briefs;
}
