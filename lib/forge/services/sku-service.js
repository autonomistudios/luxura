/**
 * lib/forge/services/sku-service.js
 * SKU catalog CRUD — garment DNA enrollment, storage, and forge recall.
 * The SKU is the consistency guarantee: DNA frozen once, recalled forever.
 */
import crypto from 'crypto';
import {
  getGcpAccessToken,
  setFirestoreREST,
  updateFirestoreREST,
  deleteFirestoreREST,
  parseFirestoreFields,
  uploadStorageREST,
} from './gcp-raw.js';

// ─── SKU CRUD ─────────────────────────────────────────────────────────────────

export async function createSku(brandId, { name, skuCode, category, season, anchorType }) {
  const skuId = `sku_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const now = new Date().toISOString();

  const skuDoc = {
    skuId,
    brandId,
    name,
    skuCode: skuCode || '',
    category: category || 'general',
    season: season || '',
    anchorType: anchorType || 'FULL_OUTFIT',
    sourceImages: [],
    dna: null,
    referenceImage: null,
    enrollmentStatus: 'pending',
    fidelityScore: null,
    createdAt: now,
    updatedAt: now,
  };

  await setFirestoreREST(`brands/${brandId}/skus`, skuId, skuDoc);
  return { skuId, sku: skuDoc };
}

export async function getSku(brandId, skuId) {
  const { token, projectId } = await getGcpAccessToken();
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/brands/${brandId}/skus/${skuId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return null;
  const doc = await res.json();
  return doc.fields ? parseFirestoreFields(doc.fields) : null;
}

export async function listSkus(brandId, { status, limit = 50, offset = 0 } = {}) {
  const { token, projectId } = await getGcpAccessToken();

  const query = {
    structuredQuery: {
      from: [{ collectionId: 'skus' }],
      orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
      limit: { value: limit },
      offset: offset,
    },
  };

  if (status) {
    query.structuredQuery.where = {
      fieldFilter: { field: { fieldPath: 'enrollmentStatus' }, op: 'EQUAL', value: { stringValue: status } },
    };
  }

  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/brands/${brandId}:runQuery`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    }
  );

  if (!res.ok) return [];
  const data = await res.json();
  return (data || [])
    .filter(item => item.document)
    .map(item => parseFirestoreFields(item.document.fields || {}));
}

export async function updateSkuEnrollment(brandId, skuId, { dna, referenceImage, referenceImageB64, fidelityScore, enrollmentStatus }) {
  const patch = {
    dna: dna || null,
    referenceImage: referenceImage || null,
    fidelityScore: fidelityScore ?? null,
    enrollmentStatus,
    updatedAt: new Date().toISOString(),
  };
  // Inline original-photo reference (compressed base64). The forge garment lock reads
  // this DIRECTLY at recall — no Storage re-fetch that can silently fail, and it locks
  // to the real photo rather than an AI re-render (maximum fidelity).
  if (referenceImageB64 !== undefined) patch.referenceImageB64 = referenceImageB64 || null;
  await updateFirestoreREST(`brands/${brandId}/skus`, skuId, patch);
}

export async function archiveSku(brandId, skuId) {
  await updateFirestoreREST(`brands/${brandId}/skus`, skuId, {
    enrollmentStatus: 'archived',
    updatedAt: new Date().toISOString(),
  });
}

export async function updateSkuStatus(brandId, skuId, status) {
  await updateFirestoreREST(`brands/${brandId}/skus`, skuId, {
    enrollmentStatus: status,
    updatedAt: new Date().toISOString(),
  });
}

// ─── SKU Source Image Upload ──────────────────────────────────────────────────

export async function uploadSkuSourceImage(brandId, skuId, imageBuffer, mimeType, index = 0) {
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const bucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET;
  const filePath = `brands/${brandId}/skus/${skuId}/source_${index}.${ext}`;
  return uploadStorageREST(bucket, filePath, imageBuffer, mimeType);
}

export async function uploadSkuReferenceImage(brandId, skuId, imageBuffer, mimeType = 'image/png') {
  const bucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET;
  const filePath = `brands/${brandId}/skus/${skuId}/reference.png`;
  return uploadStorageREST(bucket, filePath, imageBuffer, mimeType);
}

// ─── SKU Forge Recall ─────────────────────────────────────────────────────────
/**
 * Loads a SKU for direct injection into the forge pipeline.
 * Fetches the reference image bytes from Storage for inline base64 injection.
 * Returns { dna, referenceImageBase64, anchorType, fidelityScore }
 */
export async function loadSkuForForge(brandId, skuId) {
  const sku = await getSku(brandId, skuId);
  if (!sku) throw new Error(`SKU not found: ${skuId}`);
  if (sku.enrollmentStatus !== 'ready') {
    throw new Error(`SKU ${skuId} is not ready for generation (status: ${sku.enrollmentStatus})`);
  }
  if (!sku.dna) throw new Error(`SKU ${skuId} has no frozen DNA`);

  // Prefer the inline original-photo reference (no fetch — cannot silently fail).
  let referenceImageBase64 = sku.referenceImageB64 || null;
  let referenceImageMimeType = referenceImageBase64 ? 'image/jpeg' : 'image/png';

  if (!referenceImageBase64 && sku.referenceImage) {
    try {
      const { token } = await getGcpAccessToken();
      const res = await fetch(sku.referenceImage, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        referenceImageBase64 = Buffer.from(buffer).toString('base64');
      } else {
        console.warn(`[SKU] Reference image fetch ${res.status} for ${skuId} — garment lock degraded to text-only`);
      }
    } catch (err) {
      console.warn(`[SKU] Reference image fetch failed for ${skuId}: ${err.message}`);
    }
  }

  if (!referenceImageBase64) {
    console.warn(`[SKU] ⚠ No reference image for ${skuId} — garment consistency will degrade to text-only DNA`);
  }

  return {
    dna: sku.dna,
    referenceImageBase64,
    referenceImageMimeType,
    anchorType: sku.anchorType,
    fidelityScore: sku.fidelityScore,
    skuName: sku.name,
    skuCode: sku.skuCode,
  };
}

// ─── Multi-SKU Outfit Combination ───────────────────────────────────────────
/**
 * Pure reducer — merges N loaded SKU records (the resolved shape of
 * loadSkuForForge, each tagged with its skuId) into a single forge payload.
 *
 * Composition rules:
 *   • dnaMap        — union of every SKU's anchor-keyed DNA. Each garment SKU
 *                     contributes DNA under its own anchor type (SHIRT, PANTS,
 *                     SHOES…), so keys do not collide across distinct garments.
 *   • anchorRefs    — one labeled, face-free reference image per SKU, preserving
 *                     selection order so part ordering downstream is stable.
 *   • anchorTypes   — de-duplicated union of every SKU's anchor type.
 *   • identity/hair — taken from the first SKU that carries them (garment SKUs
 *                     normally carry neither; the AI model supplies identity).
 *
 * No I/O — kept pure so it can be unit-tested without Firestore/Storage.
 *
 * @param {Array<{ skuId, dna, referenceImageBase64, anchorType, skuName, fidelityScore }>} loaded
 * @returns {{ dnaMap, anchorRefs, anchorTypes, identity, hair, skuIds, fidelity }}
 */
export function mergeSkuForgeData(loaded) {
  const dnaMap = {};
  const anchorRefs = [];
  const anchorTypes = [];
  const fidelity = [];
  let identity = null;
  let hair = null;

  for (const s of loaded) {
    if (!s || s.error) continue;
    if (s.dna && typeof s.dna === 'object') {
      for (const [k, v] of Object.entries(s.dna)) {
        if (k === 'identity') { if (!identity) identity = v; continue; }
        if (k === 'hair')     { if (!hair) hair = v; continue; }
        if (!(k in dnaMap)) dnaMap[k] = v;  // first writer wins per anchor key
      }
    }
    const anc = (s.anchorType || 'FULL_OUTFIT').toUpperCase();
    if (!anchorTypes.includes(anc)) anchorTypes.push(anc);
    if (s.referenceImageBase64) {
      anchorRefs.push({
        anchorType: anc,
        data: s.referenceImageBase64,
        mimeType: 'image/png',
        skuName: s.skuName || null,
      });
    }
    if (typeof s.fidelityScore === 'number') fidelity.push(s.fidelityScore);
  }

  return {
    dnaMap,
    anchorRefs,
    anchorTypes,
    identity,
    hair,
    skuIds: loaded.filter(s => s && !s.error).map(s => s.skuId),
    fidelity: fidelity.length ? Math.round(fidelity.reduce((a, b) => a + b, 0) / fidelity.length) : null,
  };
}

/**
 * Loads multiple SKUs in parallel and merges them into one forge payload.
 * Individual SKU failures are isolated — a bad SKU is skipped, not fatal,
 * as long as at least one SKU loads successfully.
 *
 * @returns merged payload from mergeSkuForgeData, plus `failed` diagnostics.
 */
export async function loadSkusForForge(brandId, skuIds) {
  const unique = [...new Set((skuIds || []).filter(Boolean))];
  if (unique.length === 0) throw new Error('No SKU ids provided');

  const loaded = await Promise.all(unique.map(async (skuId) => {
    try {
      const data = await loadSkuForForge(brandId, skuId);
      return { skuId, ...data };
    } catch (err) {
      console.warn(`[SKU] loadSkusForForge: skipping ${skuId} — ${err.message}`);
      return { skuId, error: err.message };
    }
  }));

  const merged = mergeSkuForgeData(loaded);
  if (merged.skuIds.length === 0) {
    throw new Error('No SKUs could be loaded for outfit combination');
  }
  merged.failed = loaded.filter(s => s.error).map(s => ({ skuId: s.skuId, error: s.error }));
  return merged;
}

// ─── Fidelity Score Calculator ────────────────────────────────────────────────
/**
 * Uses TEXT_MODEL to compare the source garment image against the reference render.
 * Returns a 0-100 score indicating how faithfully the DNA was captured.
 */
export async function calculateFidelityScore(sourceBase64, referenceBase64, anchorType) {
  try {
    const { createGenAI } = await import('./gemini-client.js');
    const { TEXT_MODEL } = await import('../constants.js');
    const { withGeminiBackoff } = await import('./gemini-client.js');

    const genAI = createGenAI();
    const model = genAI.getGenerativeModel({ model: TEXT_MODEL });

    const prompt = `You are a garment fidelity auditor.

Compare Image 1 (original garment) with Image 2 (extracted reference render for anchor type: ${anchorType}).

Score the fidelity from 0 to 100 based on:
- Pattern accuracy (does the print/texture/color match?)
- Silhouette preservation (does the shape/cut match?)
- Detail retention (are embellishments, stitching, hardware preserved?)
- Color fidelity (do colors match under the reference lighting?)

Respond with ONLY a JSON object: { "score": <integer 0-100>, "notes": "<one sentence summary>" }`;

    const result = await withGeminiBackoff(() =>
      model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'image/jpeg', data: sourceBase64 } },
            { inlineData: { mimeType: 'image/png', data: referenceBase64 } },
          ],
        }],
      })
    );

    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return Math.max(0, Math.min(100, parseInt(parsed.score || '50', 10)));
    }
    return 50;
  } catch (err) {
    console.warn(`[SKU] Fidelity score calculation failed: ${err.message}`);
    return 50;
  }
}
