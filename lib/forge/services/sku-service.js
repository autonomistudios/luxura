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

export async function updateSkuEnrollment(brandId, skuId, { dna, referenceImage, fidelityScore, enrollmentStatus }) {
  await updateFirestoreREST(`brands/${brandId}/skus`, skuId, {
    dna: dna || null,
    referenceImage: referenceImage || null,
    fidelityScore: fidelityScore ?? null,
    enrollmentStatus,
    updatedAt: new Date().toISOString(),
  });
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

  let referenceImageBase64 = null;
  if (sku.referenceImage) {
    try {
      const { token } = await getGcpAccessToken();
      const res = await fetch(sku.referenceImage, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        referenceImageBase64 = Buffer.from(buffer).toString('base64');
      }
    } catch (err) {
      console.warn(`[SKU] Reference image fetch failed for ${skuId}: ${err.message}`);
    }
  }

  return {
    dna: sku.dna,
    referenceImageBase64,
    anchorType: sku.anchorType,
    fidelityScore: sku.fidelityScore,
    skuName: sku.name,
    skuCode: sku.skuCode,
  };
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
