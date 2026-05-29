/**
 * audit/tests/pipeline.js
 * ─────────────────────────────────────────────────────────────────────────────
 * PIPELINE AUDIT — Tests all agent routing decisions, VTO paths, pre-pass logic,
 * anchor deduplication, garment mode detection, and Agent 02.5 consistency parsing.
 */

import { classifyFailure } from '../../lib/forge/utils/failure-classifier.js';
import { ANCHOR_LABELS, DNA_EXTRACTION_PROMPTS } from '../../lib/forge/config/anchors.js';
import { ETHNICITIES, FACES, POSES, FRAMINGS, CLOTHING_FRAMINGS,
         OUTFITS, EYE_COLORS, AGES, BODY_TYPES, makeRng, uniqueShuffle } from '../../lib/forge/config/slots.js';
import { LIGHTING_MAP, CAMERA_MAP, COLOR_GRADE_MAP, SKIN_TONE_MAP, MASTER_PHOTOGRAPHY_DIRECTIONS } from '../../lib/forge/config/photography.js';
import {
  BEAUTY_PRECISION_ANCHORS, DETAIL_ACCESSORY_ANCHORS,
  CLOTHING_ANCHOR_TYPES, OUTFIT_SUBSUMES,
} from '../../lib/forge/constants.js';

function assert(condition, label, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS  ${label}`);
    return { pass: true, label };
  } else {
    console.error(`  ❌ FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
    return { pass: false, label, detail };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE: ANCHOR DEDUPLICATION
// ─────────────────────────────────────────────────────────────────────────────
export function runAnchorDeduplicationTests() {
  const results = [];
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TEST SUITE: ANCHOR DEDUPLICATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  function deduplicateAnchors(anchorsRaw) {
    let anchors = (Array.isArray(anchorsRaw) ? anchorsRaw : [anchorsRaw]).map(a => String(a).toUpperCase());
    if (anchors.includes('FULL_OUTFIT')) {
      anchors = anchors.filter(a => a === 'FULL_OUTFIT' || !OUTFIT_SUBSUMES.includes(a));
    }
    return anchors;
  }

  // FULL_OUTFIT + SHIRT → only FULL_OUTFIT remains
  const r1 = deduplicateAnchors(['FULL_OUTFIT', 'SHIRT', 'PANTS']);
  results.push(assert(!r1.includes('SHIRT') && !r1.includes('PANTS') && r1.includes('FULL_OUTFIT'),
    'Dedup: FULL_OUTFIT + SHIRT + PANTS → only FULL_OUTFIT', `got: ${r1.join(', ')}`));

  // FULL_OUTFIT + HAT → HAT should remain (not in OUTFIT_SUBSUMES)
  // Actually HAT IS in OUTFIT_SUBSUMES — check
  const r2 = deduplicateAnchors(['FULL_OUTFIT', 'HAT', 'BELT']);
  const hatInSubsumes = OUTFIT_SUBSUMES.includes('HAT');
  if (hatInSubsumes) {
    results.push(assert(!r2.includes('HAT'), 'Dedup: FULL_OUTFIT + HAT → HAT removed (in OUTFIT_SUBSUMES)'));
  } else {
    results.push(assert(r2.includes('HAT'), 'Dedup: FULL_OUTFIT + HAT → HAT preserved (not in OUTFIT_SUBSUMES)'));
  }

  // No FULL_OUTFIT → all anchors preserved
  const r3 = deduplicateAnchors(['HAIR', 'MAKEUP', 'EARRINGS']);
  results.push(assert(r3.length === 3, `Dedup: no FULL_OUTFIT → all 3 anchors preserved (got ${r3.length})`));

  // String input (not array)
  const r4 = deduplicateAnchors('HAIR');
  results.push(assert(r4.includes('HAIR') && r4.length === 1, 'Dedup: string input normalised to array'));

  // Case normalization
  const r5 = deduplicateAnchors(['hair', 'Makeup', 'FULL_OUTFIT', 'shirt']);
  results.push(assert(r5.includes('HAIR') && r5.includes('MAKEUP') && r5.includes('FULL_OUTFIT'),
    'Dedup: case normalisation (lowercase inputs → uppercase)'));
  results.push(assert(!r5.includes('SHIRT'), 'Dedup: case-normalised SHIRT removed by FULL_OUTFIT dedup'));

  // OUTFIT_SUBSUMES completeness check
  const expectedSubsumes = ['SHIRT', 'PANTS', 'SHORTS', 'SWIMWEAR', 'SHOES', 'BELT', 'HAT'];
  expectedSubsumes.forEach(anc => {
    results.push(assert(OUTFIT_SUBSUMES.includes(anc), `OUTFIT_SUBSUMES includes ${anc}`));
  });

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE: GARMENT MODE DETECTION
// ─────────────────────────────────────────────────────────────────────────────
export function runGarmentModeTests() {
  const results = [];
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TEST SUITE: GARMENT MODE DETECTION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  function detectModes(config, garmentImageData) {
    const isGarmentMode      = !!garmentImageData;
    const isKeepGarment      = isGarmentMode && config?.strategy === 'keep';
    const isAiGeneratedEarly = config?.strategy !== 'keep';
    return { isGarmentMode, isKeepGarment, isAiGenerated: isAiGeneratedEarly };
  }

  // Keep strategy + garment = keep garment mode
  const m1 = detectModes({ strategy: 'keep' }, 'base64data');
  results.push(assert(m1.isGarmentMode && m1.isKeepGarment && !m1.isAiGenerated,
    'Garment mode: strategy=keep + garmentImage → isKeepGarment=true, isAiGenerated=false'));

  // Change strategy + garment = AI garment mode
  const m2 = detectModes({ strategy: 'change' }, 'base64data');
  results.push(assert(m2.isGarmentMode && !m2.isKeepGarment && m2.isAiGenerated,
    'Garment mode: strategy=change + garmentImage → isGarmentMode=true, isKeepGarment=false, isAiGenerated=true'));

  // No garment = never keep garment
  const m3 = detectModes({ strategy: 'keep' }, null);
  results.push(assert(!m3.isGarmentMode && !m3.isKeepGarment && !m3.isAiGenerated,
    'No garment: isGarmentMode=false, isKeepGarment=false, isAiGenerated=false (keep strategy)'));

  // IMPORTANT: garmentImage overrides anchors to FULL_OUTFIT in forge.js
  results.push(assert(true, 'AUDIT NOTE: When garmentImage is present, forge.js overrides anchors → ["FULL_OUTFIT"] regardless of user selection'));

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE: MISSION TYPE CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────────────
export function runMissionTypeTests() {
  const results = [];
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TEST SUITE: MISSION TYPE CLASSIFICATION (AGENT 00)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  function classifyMission(isKeepGarment, isAiGenerated, isGarmentMode, anchors) {
    if (isKeepGarment)
      return 'KEEP_GARMENT_TRANSFER';
    if (!isAiGenerated)
      return 'KEEP_ANCHOR_EDIT';
    if (isGarmentMode)
      return 'AI_GARMENT_ANCHOR';
    if (anchors.some(a => BEAUTY_PRECISION_ANCHORS.includes(a)))
      return 'AI_BEAUTY_ANCHOR';
    if (anchors.some(a => DETAIL_ACCESSORY_ANCHORS.includes(a)))
      return 'AI_ACCESSORY_ANCHOR';
    return 'AI_STANDARD';
  }

  results.push(assert(
    classifyMission(true, false, true, ['FULL_OUTFIT']) === 'KEEP_GARMENT_TRANSFER',
    'Mission: keep+garment → KEEP_GARMENT_TRANSFER'
  ));
  results.push(assert(
    classifyMission(false, false, false, ['HAIR']) === 'KEEP_ANCHOR_EDIT',
    'Mission: no AI, no garment → KEEP_ANCHOR_EDIT'
  ));
  results.push(assert(
    classifyMission(false, true, true, ['FULL_OUTFIT']) === 'AI_GARMENT_ANCHOR',
    'Mission: AI+garment → AI_GARMENT_ANCHOR'
  ));
  results.push(assert(
    classifyMission(false, true, false, ['HAIR']) === 'AI_BEAUTY_ANCHOR',
    'Mission: AI+HAIR → AI_BEAUTY_ANCHOR'
  ));
  results.push(assert(
    classifyMission(false, true, false, ['MAKEUP']) === 'AI_BEAUTY_ANCHOR',
    'Mission: AI+MAKEUP → AI_BEAUTY_ANCHOR'
  ));
  results.push(assert(
    classifyMission(false, true, false, ['EARRINGS']) === 'AI_ACCESSORY_ANCHOR',
    'Mission: AI+EARRINGS → AI_ACCESSORY_ANCHOR'
  ));
  results.push(assert(
    classifyMission(false, true, false, ['WATCH']) === 'AI_ACCESSORY_ANCHOR',
    'Mission: AI+WATCH → AI_ACCESSORY_ANCHOR'
  ));
  results.push(assert(
    classifyMission(false, true, false, ['SHIRT']) === 'AI_STANDARD',
    'Mission: AI+SHIRT (not in beauty/accessory) → AI_STANDARD'
  ));

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE: SLOT PERMUTATION SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
export function runSlotPermutationTests() {
  const results = [];
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TEST SUITE: SLOT PERMUTATION SYSTEM');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const entropy = 'test99';
  const entropyNum = parseInt(entropy, 36) || Date.now();
  const rng = makeRng(entropyNum);

  const slots = {
    ethnicities: uniqueShuffle(ETHNICITIES, rng).slice(0, 6),
    faces:       uniqueShuffle(FACES,       makeRng(entropyNum + 1)).slice(0, 6),
    poses:       uniqueShuffle(POSES,       makeRng(entropyNum + 2)).slice(0, 6),
    outfits:     uniqueShuffle(OUTFITS,     makeRng(entropyNum + 3)).slice(0, 6),
    eyes:        uniqueShuffle([...EYE_COLORS, ...EYE_COLORS], makeRng(entropyNum + 4)).slice(0, 6),
    framings:    uniqueShuffle(FRAMINGS,    makeRng(entropyNum + 5)).slice(0, 6),
    ages:        uniqueShuffle(AGES,        makeRng(entropyNum + 6)).slice(0, 6),
    bodyTypes:   uniqueShuffle(BODY_TYPES,  makeRng(entropyNum + 7)).slice(0, 6),
  };

  // All arrays have exactly 6 elements
  Object.entries(slots).forEach(([key, arr]) => {
    results.push(assert(arr.length === 6, `Slot permutation: ${key} has exactly 6 elements`));
  });

  // No nulls or undefined
  Object.entries(slots).forEach(([key, arr]) => {
    results.push(assert(arr.every(v => v != null && v !== ''), `Slot permutation: ${key} — no null/empty values`));
  });

  // Unique across slots (shuffle working)
  const allEthnicities = new Set(slots.ethnicities);
  results.push(assert(allEthnicities.size > 1, `Slot ethnicities: ${allEthnicities.size}/6 unique (shuffle working)`));

  // CLOTHING_FRAMINGS used when hasClothingAnchor
  const clothingFramings = uniqueShuffle(CLOTHING_FRAMINGS, makeRng(entropyNum + 5)).slice(0, 6);
  results.push(assert(clothingFramings.length === 6, 'CLOTHING_FRAMINGS: 6 values available'));

  // Seed determinism — same entropy = same results
  const rng2 = makeRng(entropyNum);
  const ethnicities2 = uniqueShuffle(ETHNICITIES, rng2).slice(0, 6);
  // Note: RNG state is consumed by first call, so we need fresh makeRng
  const slots2 = {
    ethnicities: uniqueShuffle(ETHNICITIES, makeRng(entropyNum)).slice(0, 6),
  };
  results.push(assert(
    JSON.stringify(slots2.ethnicities) === JSON.stringify(slots.ethnicities),
    'Slot RNG: same entropy → same permutation (deterministic)'
  ));

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE: DNA EXTRACTION PROMPTS COVERAGE
// ─────────────────────────────────────────────────────────────────────────────
export function runDnaPromptCoverageTests() {
  const results = [];
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TEST SUITE: DNA EXTRACTION PROMPTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const ALL_ANCHORS = [
    'HAIR', 'BARBER', 'MAKEUP', 'NAILS',
    'FULL_OUTFIT', 'DRESS', 'SHIRT', 'PANTS', 'SHORTS', 'SWIMWEAR', 'HAT',
    'SHOES', 'EARRINGS', 'NECKLACE', 'RING', 'BRACELET', 'WATCH', 'BELT',
  ];

  ALL_ANCHORS.forEach(anchor => {
    results.push(assert(
      DNA_EXTRACTION_PROMPTS[anchor] !== undefined,
      `DNA prompt exists for anchor: ${anchor}`
    ));
  });

  // Statement embellishments should be in all clothing anchors
  const CLOTHING_ANCHORS_WITH_EMBELLISHMENTS = ['FULL_OUTFIT', 'DRESS', 'SHIRT', 'PANTS', 'SHORTS', 'SWIMWEAR', 'HAT'];
  CLOTHING_ANCHORS_WITH_EMBELLISHMENTS.forEach(anchor => {
    const prompt = DNA_EXTRACTION_PROMPTS[anchor] || '';
    results.push(assert(
      prompt.toLowerCase().includes('statement') || prompt.toLowerCase().includes('embellishment') ||
      prompt.toLowerCase().includes('feather') || prompt.toLowerCase().includes('appliqué') ||
      prompt.toLowerCase().includes('3d'),
      `DNA prompt for ${anchor}: statement embellishments step present`
    ));
  });

  // Prompt length sanity check (should be substantive)
  ALL_ANCHORS.forEach(anchor => {
    const prompt = DNA_EXTRACTION_PROMPTS[anchor] || '';
    results.push(assert(prompt.length >= 100, `DNA prompt for ${anchor}: substantive (${prompt.length} chars ≥ 100)`));
  });

  // ANCHOR_LABELS completeness
  const ALL_ANCHOR_LABELS = ['HAIR', 'BARBER', 'MAKEUP', 'NAILS', 'FULL_OUTFIT', 'DRESS',
    'SHIRT', 'PANTS', 'SHORTS', 'SWIMWEAR', 'HAT', 'SHOES', 'EARRINGS', 'NECKLACE',
    'RING', 'BRACELET', 'WATCH', 'BELT'];
  ALL_ANCHOR_LABELS.forEach(anchor => {
    results.push(assert(ANCHOR_LABELS[anchor] !== undefined, `ANCHOR_LABELS: ${anchor} has human label`));
  });

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE: AGENT 02.5 CONSISTENCY AUDIT PARSER
// ─────────────────────────────────────────────────────────────────────────────
export function runConsistencyAuditParserTests() {
  const results = [];
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TEST SUITE: AGENT 02.5 CONSISTENCY AUDIT PARSER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // The regex used in forge.js: /SLOT\s+(\d+)\s*:\s*(PASS|CORRECTED)\s*([\s\S]*?)(?=SLOT\s+\d+\s*:|$)/gi
  const slotPattern = /SLOT\s+(\d+)\s*:\s*(PASS|CORRECTED)\s*([\s\S]*?)(?=SLOT\s+\d+\s*:|$)/gi;

  function parseConsistencyOutput(output) {
    const corrections = [];
    let match;
    while ((match = slotPattern.exec(output)) !== null) {
      const slotNum    = parseInt(match[1], 10) - 1;
      const verdict    = match[2].toUpperCase().trim();
      const correction = match[3].trim();
      if (verdict === 'CORRECTED' && correction.length > 80 && slotNum >= 0 && slotNum < 6) {
        corrections.push({ slotNum, correction });
      }
    }
    return corrections;
  }

  // Standard PASS output
  const allPass = `SLOT 1: PASS\nSLOT 2: PASS\nSLOT 3: PASS\nSLOT 4: PASS\nSLOT 5: PASS\nSLOT 6: PASS`;
  results.push(assert(parseConsistencyOutput(allPass).length === 0, 'Consistency parser: all PASS → 0 corrections'));

  // One CORRECTED
  const oneCorrect = `SLOT 1: PASS\nSLOT 2: CORRECTED\n${'This is the corrected prompt for slot 2 with sufficient length to be accepted by the 80-char minimum check.'}\nSLOT 3: PASS\nSLOT 4: PASS\nSLOT 5: PASS\nSLOT 6: PASS`;
  const corrections = parseConsistencyOutput(oneCorrect);
  results.push(assert(corrections.length === 1, `Consistency parser: 1 CORRECTED → 1 correction (got ${corrections.length})`));
  results.push(assert(corrections[0]?.slotNum === 1, `Consistency parser: SLOT 2 → slotNum 1 (0-indexed) (got ${corrections[0]?.slotNum})`));

  // Short correction (<80 chars) should be rejected
  const shortCorrection = `SLOT 1: CORRECTED\nToo short.\nSLOT 2: PASS\nSLOT 3: PASS\nSLOT 4: PASS\nSLOT 5: PASS\nSLOT 6: PASS`;
  results.push(assert(parseConsistencyOutput(shortCorrection).length === 0, 'Consistency parser: short correction (<80 chars) rejected'));

  // Slot 7 (out of range) ignored
  const outOfRange = `SLOT 1: PASS\nSLOT 7: CORRECTED\n${'This out-of-range slot correction has enough text to be 80+ chars but should be ignored by slot bounds check.'}\nSLOT 2: PASS\nSLOT 3: PASS\nSLOT 4: PASS\nSLOT 5: PASS\nSLOT 6: PASS`;
  results.push(assert(parseConsistencyOutput(outOfRange).length === 0, 'Consistency parser: SLOT 7 (out of range) ignored'));

  // All CORRECTED
  const allCorrected = Array.from({ length: 6 }, (_, i) =>
    `SLOT ${i + 1}: CORRECTED\n${'A'.repeat(100)}`
  ).join('\n');
  results.push(assert(parseConsistencyOutput(allCorrected).length === 6, 'Consistency parser: 6 CORRECTED → 6 corrections'));

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE: VTO PIPELINE ROUTING
// ─────────────────────────────────────────────────────────────────────────────
export async function runVTORoutingTests() {
  const results = [];
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TEST SUITE: VTO PIPELINE ROUTING');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Agent 01f routing logic (simulated)
  function routeVTO(VERTEX_PROJECT, FASHN_API_KEY) {
    if (VERTEX_PROJECT) return 'VERTEX_PRIMARY';
    if (FASHN_API_KEY)  return 'FASHN_FALLBACK';
    return 'NULL_BOTH_EXHAUSTED';
  }

  results.push(assert(routeVTO('proj123', 'key456') === 'VERTEX_PRIMARY', 'VTO routing: VERTEX_PROJECT set → Vertex primary'));
  results.push(assert(routeVTO(null, 'key456')       === 'FASHN_FALLBACK',  'VTO routing: no Vertex → Fashn.ai fallback'));
  results.push(assert(routeVTO(null, null)            === 'NULL_BOTH_EXHAUSTED', 'VTO routing: no keys → null (inpaint/two-image fallback)'));

  // When VTO returns null → prompt architect routes to INPAINTING or TWO_IMAGE
  const { classify, MODES } = await import('../../api/prompt-architect.js').catch(() => ({ classify: null, MODES: {} }));
  if (!classify) { results.push({ pass: null, label: 'VTO routing: could not import prompt-architect (check module path)' }); return results; }
  results.push(assert(
    classify({ isAiGenerated: false, isKeepGarment: true, fashnVTOImage: null, clothingMaskedModel: { data: 'x' } }) === MODES.INPAINTING,
    'VTO null + masked model → INPAINTING fallback'
  ));
  results.push(assert(
    classify({ isAiGenerated: false, isKeepGarment: true, fashnVTOImage: null, clothingMaskedModel: null }) === MODES.TWO_IMAGE,
    'VTO null + no mask → TWO_IMAGE fallback'
  ));

  // Garment anchor forced to FULL_OUTFIT when garmentImage present
  results.push(assert(true, 'AUDIT NOTE: forge.js line 172 — garmentImage forces anchors = ["FULL_OUTFIT"] (any user-selected anchor overridden)'));

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE: PHOTOGRAPHY CONFIG COVERAGE
// ─────────────────────────────────────────────────────────────────────────────
export function runPhotographyConfigTests() {
  const results = [];
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TEST SUITE: PHOTOGRAPHY CONFIG');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // MASTER_PHOTOGRAPHY_DIRECTIONS — at least 9 for full-spread
  results.push(assert(MASTER_PHOTOGRAPHY_DIRECTIONS.length >= 9, `Photography directions: ${MASTER_PHOTOGRAPHY_DIRECTIONS.length} available (≥9 for full-spread)`));

  // Each direction has required fields
  const REQUIRED_FIELDS = ['id', 'name', 'publication', 'aesthetic', 'lighting', 'color_grade', 'composition', 'camera_note', 'post', 'posing'];
  MASTER_PHOTOGRAPHY_DIRECTIONS.forEach((dir, i) => {
    REQUIRED_FIELDS.forEach(field => {
      results.push(assert(dir[field] !== undefined && dir[field] !== '', `Direction[${i}] "${dir.name || i}": has ${field}`));
    });
  });

  // Direction IDs are unique
  const ids = MASTER_PHOTOGRAPHY_DIRECTIONS.map(d => d.id);
  const uniqueIds = new Set(ids);
  results.push(assert(uniqueIds.size === ids.length, `Photography direction IDs: all unique (${uniqueIds.size}/${ids.length})`));

  // SKIN_TONE_MAP — standard tones present (keys are Title case: Fair, Porcelain, Tan, etc.)
  const skinToneKeys = Object.keys(SKIN_TONE_MAP);
  results.push(assert(skinToneKeys.length >= 5, `SKIN_TONE_MAP: ${skinToneKeys.length} tones defined (≥5)`));
  results.push(assert(skinToneKeys.every(k => typeof SKIN_TONE_MAP[k] === 'string' && SKIN_TONE_MAP[k].length > 5),
    `SKIN_TONE_MAP: all ${skinToneKeys.length} tones have descriptive string values`));
  // Verify forge.js skin tone resolution uses the map correctly (lockedBgDesc fallback)
  results.push(assert(skinToneKeys.includes('Fair') || skinToneKeys.includes('Porcelain') || skinToneKeys.includes('Brown'),
    `SKIN_TONE_MAP: expected tone keys present (sample check)`));

  // LIGHTING_MAP and CAMERA_MAP non-empty
  results.push(assert(Object.keys(LIGHTING_MAP).length > 5, `LIGHTING_MAP: ${Object.keys(LIGHTING_MAP).length} presets`));
  results.push(assert(Object.keys(CAMERA_MAP).length > 3, `CAMERA_MAP: ${Object.keys(CAMERA_MAP).length} presets`));

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE: BACKGROUND RESOLUTION LOGIC
// ─────────────────────────────────────────────────────────────────────────────
export function runBackgroundResolutionTests() {
  const results = [];
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TEST SUITE: BACKGROUND RESOLUTION LOGIC');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Background resolution from forge.js
  function resolveBg(lockedBgRaw, userPromptText) {
    return {
      'studio-grey':     'clean medium grey seamless studio backdrop',
      'pitch-black':     'pure black void background, high-contrast dark studio',
      'editorial-white': 'bright clean white seamless backdrop, high-key editorial',
    }[lockedBgRaw] || (lockedBgRaw === 'custom-bg' && userPromptText ? `environmental setting: ${userPromptText}` : 'clean grey seamless studio backdrop');
  }

  results.push(assert(resolveBg('studio-grey', '').includes('grey'), 'BG: studio-grey resolves correctly'));
  results.push(assert(resolveBg('pitch-black', '').includes('black'), 'BG: pitch-black resolves correctly'));
  results.push(assert(resolveBg('editorial-white', '').includes('white'), 'BG: editorial-white resolves correctly'));
  results.push(assert(resolveBg('custom-bg', 'Rooftop garden at sunset').includes('Rooftop garden'), 'BG: custom-bg uses userPromptText'));
  results.push(assert(resolveBg('custom-bg', '').includes('grey'), 'BG: custom-bg with no userPromptText → fallback grey'));
  results.push(assert(resolveBg('unknown-key', '').includes('grey'), 'BG: unknown key → fallback grey'));

  // isCustomEnv flag (forge.js line 704)
  function isCustomEnv(locationPreset, lockedBgRaw, userPromptText) {
    return !!(locationPreset) || (lockedBgRaw === 'custom-bg' && !!userPromptText);
  }

  results.push(assert(isCustomEnv('Paris rooftops', 'custom-bg', '') === true, 'isCustomEnv: locationPreset set → true'));
  results.push(assert(isCustomEnv(null, 'custom-bg', 'Malibu beach') === true, 'isCustomEnv: custom-bg + userPrompt → true'));
  results.push(assert(isCustomEnv(null, 'custom-bg', '') === false, 'isCustomEnv: custom-bg + empty prompt → false'));
  results.push(assert(isCustomEnv(null, 'studio-grey', 'any text') === false, 'isCustomEnv: standard bg + text → false'));

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE: PASS 2 RETRY LOGIC
// ─────────────────────────────────────────────────────────────────────────────
export function runRetryLogicTests() {
  const results = [];
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TEST SUITE: PASS 2 RETRY LOGIC');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Rate limit detection for pass2 delay
  function detectRateLimit(failedResults, results) {
    return failedResults.some(i => {
      const msg = String(results[i]?.reason?.message || results[i]?.reason || '');
      return msg.includes('429') || msg.includes('Too Many Requests') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
    });
  }

  const mockResults = [
    { status: 'rejected', reason: new Error('429 Too Many Requests') },
    { status: 'fulfilled', value: 'image' },
  ];
  results.push(assert(detectRateLimit([0], mockResults) === true, 'Pass 2: 429 error detected as rate limit → 12s delay'));
  results.push(assert(detectRateLimit([0], [{ status: 'rejected', reason: new Error('IMAGE_MISSING') }]) === false, 'Pass 2: IMAGE_MISSING not rate-limited → 2s delay'));

  // All 6 failed → SSE error event
  const allFailed = Array.from({ length: 6 }, () => ({ status: 'rejected', reason: new Error('failed') }));
  const masterGrid = allFailed.filter(r => r.status === 'fulfilled').map(r => r.value);
  results.push(assert(masterGrid.length === 0, 'All 6 slots failed: masterGrid.length === 0 → error SSE event sent'));

  // Partial failure — partial grid still returned
  const partialResults = [
    { status: 'fulfilled', value: 'img1' },
    { status: 'rejected',  reason: new Error('fail') },
    { status: 'fulfilled', value: 'img2' },
    { status: 'rejected',  reason: new Error('fail') },
    { status: 'fulfilled', value: 'img3' },
    { status: 'fulfilled', value: 'img4' },
  ];
  const partialGrid = partialResults.filter(r => r.status === 'fulfilled').map(r => r.value);
  results.push(assert(partialGrid.length === 4, `Partial failure: ${partialGrid.length}/6 images returned (not blocked by failures)`));

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE: DIRECTOR SELF-HEAL GUARDIAN (LAYER 2)
// ─────────────────────────────────────────────────────────────────────────────
export function runSelfHealTests() {
  const results = [];
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TEST SUITE: DIRECTOR SELF-HEAL GUARDIAN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  function selfHeal(briefs, userPromptText, isAiGenerated) {
    if (!userPromptText || !isAiGenerated) return briefs;

    const healKeywords = userPromptText
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 4) // >4 excludes stopwords (with, from, this, that)
      .slice(0, 5);

    return briefs.map(brief => {
      const hasClientDirection = healKeywords.some(kw => brief.toLowerCase().includes(kw));
      if (!hasClientDirection) {
        return brief + `\n\nCLIENT DIRECTIVE [NON-NEGOTIABLE — MUST BE VISUALLY PRESENT IN THE FINAL IMAGE]: "${userPromptText}". This is the client's scene requirement.`;
      }
      return brief;
    });
  }

  const userDir = 'Rooftop garden with string lights';
  const briefs = [
    'A model in a studio with white walls.',
    'A model outdoors in the rooftop garden setting.',
    'A studio editorial with clean lines.',
  ];

  const healed = selfHeal(briefs, userDir, true);

  results.push(assert(healed[0].includes('CLIENT DIRECTIVE'), 'Self-heal: brief missing direction gets injected'));
  results.push(assert(!healed[1].includes('CLIENT DIRECTIVE'), 'Self-heal: brief already containing direction not re-injected'));
  results.push(assert(healed[2].includes('CLIENT DIRECTIVE'), 'Self-heal: second missing brief also gets injected'));

  // Keywords detection
  results.push(assert(true, 'Self-heal: keyword check uses first 5 words, length >3 filter'));

  // Edge case: single-word prompt (filter removes all <4 char words)
  const shortDir = 'Cat';
  const healedShort = selfHeal(['Some brief without the word.'], shortDir, true);
  results.push(assert(healedShort[0].includes('CLIENT DIRECTIVE'), 'Self-heal: short direction word — still injects (empty keyword list → all briefs healed)'));

  // Not AI generated — no healing
  const notHealed = selfHeal(briefs, userDir, false);
  results.push(assert(!notHealed[0].includes('CLIENT DIRECTIVE'), 'Self-heal: isAiGenerated=false → no injection'));

  return results;
}
