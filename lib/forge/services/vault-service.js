/**
 * lib/forge/services/vault-service.js
 * VTO Vault — persists Virtual Try-On records to Firestore via REST.
 * No firebase-admin dependency — uses gcp-raw.js GCP bearer auth.
 */

import { randomUUID } from 'crypto';
import { getGcpAccessToken } from './gcp-raw.js';

export async function saveVtoRecord({
  designerUid,
  modelImageData,
  modelMimeType,
  garmentImageData,
  garmentMimeType,
  outputImageData,
  outputMimeType,
  facialSimilarityScore,
  pipeline,
  status,
}) {
  const id = randomUUID();

  try {
    const { token, projectId } = await getGcpAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${designerUid}/vto_records/${id}`;

    const body = {
      fields: {
        id:           { stringValue: id },
        designer_uid: { stringValue: designerUid },
        model_image_url:   { stringValue: `data:${modelMimeType};base64,${modelImageData}` },
        garment_image_url: { stringValue: `data:${garmentMimeType};base64,${garmentImageData}` },
        generated_image_url: { stringValue: `data:${outputMimeType};base64,${outputImageData}` },
        status:    { stringValue: status   || 'APPROVED' },
        pipeline:  { stringValue: pipeline || 'VERTEX_VTO' },
        facial_similarity_score: { doubleValue: typeof facialSimilarityScore === 'number' ? facialSimilarityScore : 0 },
        created_at: { timestampValue: new Date().toISOString() },
      },
    };

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.warn(`[VAULT] Firestore write failed (${res.status}): ${txt}`);
    } else {
      console.log(`[VAULT] VTO record saved — id: ${id} | pipeline: ${pipeline} | status: ${status} | similarity: ${facialSimilarityScore?.toFixed(3) ?? 'n/a'}`);
    }
  } catch (err) {
    console.warn(`[VAULT] saveVtoRecord non-fatal error: ${err?.message}`);
  }

  return id;
}
