/**
 * lib/forge/utils/camera-resolver.js
 * Camera–anchor conflict detection and resolution.
 *
 * When the user's selected camera physically cannot show the anchored feature,
 * auto-override the camera for that slot. Logged but never surfaced to the user.
 */

import { CAMERA_MAP } from '../config/photography.js';

// ─── CONFLICT TABLE ───────────────────────────────────────────────────────────
// anchor → cameras that conflict with it (cannot show the anchor adequately)
export const ANCHOR_CAMERA_CONFLICTS = {
  SHOES:       ['Ultra Close-Up (Macro)', 'Fashion Zoom (135mm)'],
  FULL_OUTFIT: ['Ultra Close-Up (Macro)', 'Fashion Zoom (135mm)'],
  SHIRT:       ['Ultra Close-Up (Macro)'],
  PANTS:       ['Ultra Close-Up (Macro)', 'Fashion Zoom (135mm)'],
  SHORTS:      ['Ultra Close-Up (Macro)', 'Fashion Zoom (135mm)'],
  NAILS:       ['Editorial Wide (24mm)', 'Street Style (35mm)'],
  EARRINGS:    ['Editorial Wide (24mm)', 'Street Style (35mm)'],
  RING:        ['Editorial Wide (24mm)', 'Street Style (35mm)'],
  BRACELET:    ['Editorial Wide (24mm)', 'Street Style (35mm)'],
  WATCH:       ['Editorial Wide (24mm)', 'Street Style (35mm)'],
};

/**
 * resolveSlotCamera
 * Returns the correct camera description for a slot, auto-correcting conflicts.
 *
 * @param {string}   selectedCameraKey — camera label chosen by the user
 * @param {string[]} anchorList        — active anchor IDs
 * @returns {{ desc: string, overridden: boolean }}
 */
export function resolveSlotCamera(selectedCameraKey, anchorList) {
  const conflictingFor = anchorList.filter(
    a => (ANCHOR_CAMERA_CONFLICTS[a] || []).includes(selectedCameraKey)
  );

  if (conflictingFor.length === 0) {
    return {
      desc:       CAMERA_MAP[selectedCameraKey] || CAMERA_MAP['Soft Background (85mm)'],
      overridden: false,
    };
  }

  // Wide-angle can't capture detail anchors — step up to 85mm portrait.
  // Macro/telephoto can't show full-body anchors — step down to 35mm.
  const isTooWide   = ['Editorial Wide (24mm)', 'Street Style (35mm)'].includes(selectedCameraKey);
  const replacement = isTooWide
    ? CAMERA_MAP['Soft Background (85mm)']
    : CAMERA_MAP['Street Style (35mm)'];

  console.log(
    `[FORGE] CAMERA-ANCHOR CONFLICT: "${selectedCameraKey}" conflicts with ` +
    `[${conflictingFor.join(', ')}] — auto-override to portrait camera.`
  );

  return { desc: replacement, overridden: true };
}
