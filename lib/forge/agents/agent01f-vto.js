/**
 * lib/forge/agents/agent01f-vto.js
 * AGENT 01f — VTO Orchestrator
 *
 * Decides which Virtual Try-On path to execute and returns a locked try-on image.
 * Acts as the brain between the two VTO engines — it does NOT implement the
 * try-on logic itself; it delegates entirely to the services layer.
 *
 * VTO path priority:
 *   PRIMARY   → Vertex AI virtual-try-on-001 (pixel-locks identity + garment pattern)
 *   FALLBACK  → Fashn.ai tryon-max (identity-safe, excellent body physics)
 *   ABORT     → returns null (upstream caller falls back to inpainting / two-image mode)
 *
 * Two execution modes:
 *   runAgent01fVTO       — real-person keep mode (uploads model photo + garment image)
 *   runAgent01fAiVTO     — AI character mode (AI-generated character ref + garment image)
 *
 * Vault logging: every successful VTO result is fire-and-forget persisted to Firestore
 * via vault-service.js so high-value assets are anchored to the designer's account.
 *
 * Imports: services only. No @google/genai or google-auth-library here.
 */

import { vertexImagen3VTO } from '../services/vertex-vto.js';
import { fashnTryOn }        from '../services/fashn-tryon.js';
import { saveVtoRecord }     from '../services/vault-service.js';
import { VERTEX_PROJECT, FASHN_API_KEY } from '../constants.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * _primaryGarmentSpec
 * Picks the most specific garment DNA available from the dnaMap for Vertex DNA reinforcement.
 * Priority: FULL_OUTFIT → DRESS → SHIRT → SWIMWEAR → ''
 * @param {Object} dnaMap
 * @returns {string}
 */
function _primaryGarmentSpec(dnaMap) {
  return (
    dnaMap['FULL_OUTFIT'] ||
    dnaMap['DRESS']       ||
    dnaMap['SHIRT']       ||
    dnaMap['SWIMWEAR']    ||
    ''
  );
}

// ─── Mode A: Real-person keep mode ────────────────────────────────────────────

/**
 * runAgent01fVTO
 * Applies a garment to a real uploaded person photo.
 * Used when config.strategy === 'keep' AND a garment image is provided.
 *
 * @param {Object} ctx
 * @param {string}      ctx.rawImageData      — base64 person photo (no data: prefix)
 * @param {string}      ctx.rawMimeType        — MIME type of person photo
 * @param {string}      ctx.garmentImageData   — base64 garment photo (no data: prefix)
 * @param {string}      ctx.garmentMimeType    — MIME type of garment photo
 * @param {string}      ctx.anchor             — primary garment anchor ID (e.g. 'FULL_OUTFIT')
 * @param {Object}      ctx.dnaMap             — anchor → extracted text schematic
 * @param {boolean}     ctx.isAiGenerated      — true = new AI model; false = keep identity
 * @param {string}      ctx.skinToneDesc       — resolved skin tone description
 * @param {string|null} ctx.designerUid        — Firebase Auth UID for vault logging (optional)
 * @returns {Promise<{ data: string, mimeType: string } | null>}
 */
export async function runAgent01fVTO({
  rawImageData,
  rawMimeType,
  garmentImageData,
  garmentMimeType,
  anchor,
  dnaMap,
  isAiGenerated,
  skinToneDesc,
  designerUid = null,
}) {
  const garmentSpec    = _primaryGarmentSpec(dnaMap);
  const forcedSkinTone = isAiGenerated ? skinToneDesc : null;

  // ── PRIMARY: Vertex AI virtual-try-on-001 ────────────────────────────────
  if (VERTEX_PROJECT) {
    try {
      console.log('[FORGE] AGENT 01f: Vertex AI VTO starting — subject-lock path...');
      const result = await vertexImagen3VTO(
        rawImageData,
        garmentImageData,
        garmentSpec,
        forcedSkinTone
      );
      console.log('[FORGE] AGENT 01f: Vertex AI VTO complete — face + pattern pixel-locked.');
      _logToVault({ designerUid, rawImageData, rawMimeType, garmentImageData, garmentMimeType,
        result, pipeline: 'VERTEX_VTO', similarityScore: 1.0, status: 'APPROVED' });
      return result;
    } catch (err) {
      console.warn(
        `[FORGE] AGENT 01f (Vertex AI) failed — falling back to Fashn.ai: ${err?.message}`
      );
    }
  }

  // ── FALLBACK: Fashn.ai tryon-max ─────────────────────────────────────────
  if (FASHN_API_KEY) {
    try {
      console.log('[FORGE] AGENT 01f: Fashn.ai VTO starting — identity-safe fallback path...');
      const result = await fashnTryOn(
        rawImageData,
        rawMimeType,
        garmentImageData,
        garmentMimeType,
        anchor
      );
      console.log('[FORGE] AGENT 01f: Fashn.ai VTO complete — face preserved.');
      _logToVault({ designerUid, rawImageData, rawMimeType, garmentImageData, garmentMimeType,
        result, pipeline: 'FASHN_FALLBACK', similarityScore: null, status: 'APPROVED' });
      return result;
    } catch (err) {
      console.warn(
        `[FORGE] AGENT 01f (Fashn.ai) failed — falling back to inpaint/two-image: ${err?.message}`
      );
    }
  }

  // ── ABORT: both engines failed ────────────────────────────────────────────
  console.warn('[FORGE] AGENT 01f: All VTO paths exhausted — returning null. Upstream will use inpainting/two-image fallback.');
  return null;
}

// ─── Mode B: AI character mode ────────────────────────────────────────────────

/**
 * runAgent01fAiVTO
 * Applies a garment to an AI-generated character reference image.
 * Used when config.strategy !== 'keep' AND a garment image is provided (Garment Showcase mode).
 * The AI character ref is generated by Agent 01g upstream.
 *
 * @param {Object} ctx
 * @param {Object}      ctx.aiCharacterRef     — { data: base64, mimeType: string } from Agent 01g
 * @param {string}      ctx.garmentImageData   — base64 garment photo (no data: prefix)
 * @param {string}      ctx.garmentMimeType    — MIME type of garment photo
 * @param {string}      ctx.anchor             — primary garment anchor ID
 * @param {Object}      ctx.dnaMap             — anchor → extracted text schematic
 * @param {string}      ctx.skinToneDesc       — resolved skin tone description (passed to Vertex)
 * @param {string|null} ctx.designerUid        — Firebase Auth UID for vault logging (optional)
 * @returns {Promise<{ data: string, mimeType: string } | null>}
 */
export async function runAgent01fAiVTO({
  aiCharacterRef,
  garmentImageData,
  garmentMimeType,
  anchor,
  dnaMap,
  skinToneDesc,
  designerUid = null,
}) {
  if (!aiCharacterRef?.data) {
    console.warn('[FORGE] AGENT 01f-AI: No AI character reference — skipping VTO.');
    return null;
  }

  const garmentSpec = _primaryGarmentSpec(dnaMap);

  // ── PRIMARY: Vertex AI virtual-try-on-001 ────────────────────────────────
  if (VERTEX_PROJECT) {
    try {
      console.log('[FORGE] AGENT 01f-AI: Vertex AI garment lock starting...');
      const result = await vertexImagen3VTO(
        aiCharacterRef.data,
        garmentImageData,
        garmentSpec,
        skinToneDesc
      );
      console.log('[FORGE] AGENT 01f-AI: Vertex AI garment lock complete — VTO_EDITORIAL path active.');
      _logToVault({ designerUid,
        rawImageData: aiCharacterRef.data, rawMimeType: aiCharacterRef.mimeType,
        garmentImageData, garmentMimeType,
        result, pipeline: 'VERTEX_VTO', similarityScore: 1.0, status: 'APPROVED' });
      return result;
    } catch (err) {
      console.warn(
        `[FORGE] AGENT 01f-AI (Vertex AI) failed — falling back to Fashn.ai: ${err?.message}`
      );
    }
  }

  // ── FALLBACK: Fashn.ai tryon-max ─────────────────────────────────────────
  if (FASHN_API_KEY) {
    try {
      console.log('[FORGE] AGENT 01f-AI: Applying garment via Fashn.ai (fallback)...');
      const result = await fashnTryOn(
        aiCharacterRef.data,
        aiCharacterRef.mimeType,
        garmentImageData,
        garmentMimeType,
        anchor
      );
      console.log('[FORGE] AGENT 01f-AI: Fashn.ai garment lock complete — VTO_EDITORIAL path active for all 6 slots.');
      _logToVault({ designerUid,
        rawImageData: aiCharacterRef.data, rawMimeType: aiCharacterRef.mimeType,
        garmentImageData, garmentMimeType,
        result, pipeline: 'FASHN_FALLBACK', similarityScore: null, status: 'APPROVED' });
      return result;
    } catch (err) {
      console.warn(`[FORGE] AGENT 01f-AI (Fashn.ai) failed: ${err?.message}`);
    }
  }

  // ── ABORT ─────────────────────────────────────────────────────────────────
  console.warn('[FORGE] AGENT 01f-AI: All VTO paths exhausted — returning null.');
  return null;
}

// ─── Internal: fire-and-forget vault logging ──────────────────────────────────
/**
 * _logToVault
 * Persists a VTO result record. Silently swallows errors — vault logging must
 * never block or fail a generation run.
 */
function _logToVault({ designerUid, rawImageData, rawMimeType, garmentImageData,
  garmentMimeType, result, pipeline, similarityScore, status }) {
  if (!designerUid || !result?.data) return; // no uid = anonymous call, skip

  saveVtoRecord({
    designerUid,
    modelImageData:       rawImageData,
    modelMimeType:        rawMimeType      || 'image/jpeg',
    garmentImageData:     garmentImageData,
    garmentMimeType:      garmentMimeType  || 'image/jpeg',
    outputImageData:      result.data,
    outputMimeType:       result.mimeType  || 'image/png',
    facialSimilarityScore: similarityScore,
    pipeline,
    status,
  }).catch(err => {
    console.warn(`[VAULT] Failed to save VTO record — non-critical: ${err?.message}`);
  });
}
