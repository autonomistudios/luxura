import { BEAUTY_PRECISION_ANCHORS, DETAIL_ACCESSORY_ANCHORS } from '../constants.js';
import { ANCHOR_CAMERA_CONFLICTS } from '../utils/camera-resolver.js';

export function runAgent00Classifier({ anchors, config, isKeepGarment, isAiGeneratedEarly, isGarmentMode }) {
  const selectedCameraKey = config?.camera || 'Soft Background (85mm)';
  const cameraConflicts   = anchors.filter(a => (ANCHOR_CAMERA_CONFLICTS[a] || []).includes(selectedCameraKey));

  let missionType;
  if (isKeepGarment)                                                missionType = 'KEEP_GARMENT_TRANSFER';
  else if (!isAiGeneratedEarly)                                     missionType = 'KEEP_ANCHOR_EDIT';
  else if (isGarmentMode)                                           missionType = 'AI_GARMENT_ANCHOR';
  else if (anchors.some(a => BEAUTY_PRECISION_ANCHORS.includes(a))) missionType = 'AI_BEAUTY_ANCHOR';
  else if (anchors.some(a => DETAIL_ACCESSORY_ANCHORS.includes(a))) missionType = 'AI_ACCESSORY_ANCHOR';
  else                                                              missionType = 'AI_STANDARD';

  return { missionType, cameraConflicts };
}
