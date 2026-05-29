/**
 * lib/forge/utils/temperature.js
 * Adaptive temperature calculator for Gemini generation slots.
 *
 * Calculates optimal generation temperature per slot based on anchor precision
 * requirements, framing type, strategy, and slot position within the 9-grid.
 * Prevents identical outputs while keeping fidelity tight where anchors demand it.
 */

import {
  BEAUTY_PRECISION_ANCHORS,
  DETAIL_ACCESSORY_ANCHORS,
} from '../constants.js';

/**
 * calculateSlotTemperature
 * @param {number}   slotIndex   — 0-based slot index within the 9-grid
 * @param {string[]} anchorList  — active anchor IDs (e.g. ['HAIR', 'MAKEUP'])
 * @param {boolean}  isAiGen     — true = AI_GENERATE mode; false = KEEP/CLONE mode
 * @param {string}   framing     — framing label for this slot (used to detect detail crops)
 * @returns {number} temperature between 0.40 and 1.20
 */
export function calculateSlotTemperature(slotIndex, anchorList, isAiGen, framing) {
  const isDetailFraming = framing && (
    framing.includes('DETAIL') || framing.includes('CLOSE') ||
    framing.includes('MACRO')  || framing.includes('HEADSHOT')
  );
  const hasPrecisionAnchor = anchorList.some(a => BEAUTY_PRECISION_ANCHORS.includes(a));
  const hasDetailAnchor    = anchorList.some(a => DETAIL_ACCESSORY_ANCHORS.includes(a));

  if (!isAiGen) {
    // Keep mode: identity preservation > creative freedom
    let base = 0.62;
    if (isDetailFraming)                       base = 0.50;
    if (anchorList.includes('FULL_OUTFIT'))     base = 0.55; // garment keep: tightest precision
    // Micro-variation per slot to prevent identical compositions (±0.02 max)
    const microVariance = ((slotIndex % 5) - 2) * 0.008;
    return Math.max(0.40, Math.min(0.72, base + microVariance));
  }

  // AI mode: creativity with precision floors where anchors require it
  let base = 1.05;
  if (hasPrecisionAnchor) base = 0.92;  // beauty anchors demand color/texture accuracy
  if (hasDetailAnchor)    base = 1.00;  // accessories: creative but precise
  if (isDetailFraming)    base -= 0.12; // close-up framing: tighten for surface detail
  // Progressive slot bias: slots 1-3 are anchor-conservative; 7-9 explore further
  const slotBias = slotIndex < 3 ? -0.05 : slotIndex > 6 ? +0.08 : 0;
  return Math.max(0.72, Math.min(1.20, base + slotBias));
}
