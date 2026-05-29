/**
 * lib/forge/services/vertex-vto.js
 * Vertex AI Virtual Try-On — enterprise primary VTO path.
 *
 * Architecture:
 *   • Auth      — google-auth-library GoogleAuth, scoped to cloud-platform
 *                 Reads service account JSON from FIREBASE_SERVICE_ACCOUNT (base64 env var)
 *                 No separate credential file required — reuses existing infra
 *   • Model     — virtual-try-on-001 via Vertex AI predict REST endpoint
 *   • Payload   — instances[] with personImage + productImages as base64 objects
 *   • Guardrail 1 — sharp pre-compresses both images to strictly < 10 MB before send
 *   • Guardrail 2 — facial similarity check placeholder (compares input face to VTO output)
 *                   Triggers automatic retry if similarity falls below FACE_MATCH_THRESHOLD
 *
 * Env vars required:
 *   FIREBASE_SERVICE_ACCOUNT  — base64-encoded service account JSON
 *   GOOGLE_CLOUD_PROJECT      — GCP project ID with Vertex AI API enabled
 *   GOOGLE_CLOUD_LOCATION     — (optional) defaults to 'us-central1'
 *
 * IAM: service account must have the "Vertex AI User" role on the project.
 */

import { GoogleAuth }  from 'google-auth-library';
import sharp            from 'sharp';
import {
  VERTEX_PROJECT,
  VERTEX_LOCATION,
} from '../constants.js';

// ─── Configuration ────────────────────────────────────────────────────────────
const VERTEX_VTO_MODEL      = 'virtual-try-on-001';
const MAX_IMAGE_BYTES       = 9.5 * 1024 * 1024; // 9.5 MB hard ceiling (API limit: 10 MB)
const FACE_MATCH_THRESHOLD  = 0.95;               // 95% similarity required to accept output
const VTO_MAX_RETRIES       = 2;                  // max Vertex AI attempts before throwing

// ─── Auth: google-auth-library ───────────────────────────────────────────────
// Lazily instantiated per process. GoogleAuth caches tokens internally and
// refreshes them before expiry — no manual token management required.
let _auth;

function getGoogleAuth() {
  if (_auth) return _auth;

  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT env var not configured');

  // Decode base64 service account JSON (same encoding as firebase-admin.js)
  const credentials = JSON.parse(Buffer.from(sa, 'base64').toString('utf8'));

  _auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  return _auth;
}

/**
 * getVertexAccessToken
 * Returns a short-lived OAuth2 bearer token for Vertex AI REST calls.
 * google-auth-library handles caching and refresh automatically.
 * @returns {Promise<string>}
 */
export async function getVertexAccessToken() {
  const client = await getGoogleAuth().getClient();
  const token  = await client.getAccessToken();
  if (!token?.token) throw new Error('Vertex AI: failed to obtain access token');
  return token.token;
}

// ─── Guardrail 1: Image compression ─────────────────────────────────────────
/**
 * compressToLimit
 * Uses sharp to ensure a base64-encoded image is strictly under MAX_IMAGE_BYTES.
 * Strategy: convert to JPEG, then progressively reduce quality (90 → 75 → 60 → 45)
 * until the byte count is within budget. Returns the compressed base64 string.
 *
 * @param {string} base64Input  — raw base64 (no data: prefix)
 * @param {string} label        — log label ('personImage' | 'productImage')
 * @returns {Promise<string>}   — compressed base64 string
 */
async function compressToLimit(base64Input, label) {
  const inputBuffer = Buffer.from(base64Input, 'base64');
  const inputBytes  = inputBuffer.length;

  // Already within budget — return as-is
  if (inputBytes <= MAX_IMAGE_BYTES) {
    console.log(`[FORGE] Vertex VTO: ${label} ${(inputBytes / 1024 / 1024).toFixed(2)} MB — within limit, no compression needed`);
    return base64Input;
  }

  console.log(`[FORGE] Vertex VTO: ${label} ${(inputBytes / 1024 / 1024).toFixed(2)} MB — compressing...`);

  // Progressive quality reduction until under budget
  const qualitySteps = [90, 75, 60, 45];
  for (const quality of qualitySteps) {
    const compressed = await sharp(inputBuffer)
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    const compressedMB = (compressed.length / 1024 / 1024).toFixed(2);
    console.log(`[FORGE] Vertex VTO: ${label} compressed to ${compressedMB} MB at quality=${quality}`);

    if (compressed.length <= MAX_IMAGE_BYTES) {
      return compressed.toString('base64');
    }
  }

  // Final fallback: resize to 1200px wide and compress at quality 40
  console.warn(`[FORGE] Vertex VTO: ${label} still over limit after quality reduction — resizing to 1200px wide`);
  const resized = await sharp(inputBuffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 40, mozjpeg: true })
    .toBuffer();

  const finalMB = (resized.length / 1024 / 1024).toFixed(2);
  console.log(`[FORGE] Vertex VTO: ${label} final size after resize: ${finalMB} MB`);

  if (resized.length > MAX_IMAGE_BYTES) {
    throw new Error(
      `Vertex VTO: ${label} cannot be compressed below 10 MB ` +
      `(${finalMB} MB after max compression). Image may be corrupt or invalid.`
    );
  }

  return resized.toString('base64');
}

// ─── Guardrail 2: Facial similarity check (placeholder) ──────────────────────
/**
 * checkFacialSimilarity
 * Compares the input person's face to the face in the VTO output image.
 * Returns a similarity score between 0.0 and 1.0.
 *
 * CURRENT STATUS: Placeholder implementation — returns 1.0 (always passes).
 * Production implementation should:
 *   1. Detect face bounding box in both images (e.g. using Cloud Vision API or MediaPipe)
 *   2. Extract facial embeddings from both crops
 *   3. Compute cosine similarity between embedding vectors
 *   4. Return the similarity score
 *
 * When this returns < FACE_MATCH_THRESHOLD, vertexImagen3VTO will retry automatically.
 *
 * @param {string} personBase64  — base64 of the original person image
 * @param {string} outputBase64  — base64 of the VTO output image
 * @returns {Promise<number>}    — similarity score (0.0–1.0)
 */
async function checkFacialSimilarity(personBase64, outputBase64) {
  // TODO: Implement real facial embedding comparison.
  // Suggested libraries: @google-cloud/vision (FaceAnnotation landmarks),
  // mediapipe (FaceMesh), or a dedicated face-verification API.
  //
  // Example pseudocode for production:
  //   const [personEmbedding, outputEmbedding] = await Promise.all([
  //     extractFaceEmbedding(personBase64),
  //     extractFaceEmbedding(outputBase64),
  //   ]);
  //   return cosineSimilarity(personEmbedding, outputEmbedding);

  void personBase64; // suppress unused warning until implementation is wired
  void outputBase64;

  console.log('[FORGE] Vertex VTO: facial similarity check — placeholder (returning 1.0)');
  return 1.0;
}

// ─── Core VTO call ────────────────────────────────────────────────────────────
/**
 * _callVertexVTO
 * Single attempt at the Vertex AI virtual-try-on-001 predict endpoint.
 * Compresses images, builds the REST payload, executes the call, and validates response.
 *
 * @param {string} personBase64   — base64 person image (no data: prefix)
 * @param {string} garmentBase64  — base64 garment image (no data: prefix)
 * @param {string|null} garmentDNA — text DNA from Agent 01 (logged, not in payload)
 * @returns {Promise<{ data: string, mimeType: string, outputBase64: string }>}
 */
async function _callVertexVTO(personBase64, garmentBase64, garmentDNA) {
  if (!VERTEX_PROJECT) {
    throw new Error('GOOGLE_CLOUD_PROJECT env var not set — Vertex AI VTO unavailable');
  }

  // Guardrail 1: compress both images before sending
  const [compressedPerson, compressedGarment] = await Promise.all([
    compressToLimit(personBase64,  'personImage'),
    compressToLimit(garmentBase64, 'productImage'),
  ]);

  if (garmentDNA) {
    // DNA is logged here for observability — the virtual-try-on-001 endpoint
    // does not accept a prompt field, so DNA is used upstream by Agent 01f
    // to select the best garment reference image, not injected into the API call.
    console.log(`[FORGE] Vertex VTO: garmentDNA available (${garmentDNA.length} chars) — used for agent routing`);
  }

  // ── Construct Vertex AI predict endpoint ─────────────────────────────────
  const endpoint = [
    `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1`,
    `/projects/${VERTEX_PROJECT}`,
    `/locations/${VERTEX_LOCATION}`,
    `/publishers/google/models/${VERTEX_VTO_MODEL}:predict`,
  ].join('');

  // ── Build instances payload ───────────────────────────────────────────────
  // virtual-try-on-001 expects personImage and productImages (array) as base64 objects.
  const payload = {
    instances: [
      {
        personImage:   { bytesBase64Encoded: compressedPerson },
        productImages: [{ bytesBase64Encoded: compressedGarment }],
      },
    ],
    parameters: {
      sampleCount: 2, // 2 candidates — best selected by encoded detail density
    },
  };

  // ── Execute REST call ─────────────────────────────────────────────────────
  const accessToken = await getVertexAccessToken();
  const res = await fetch(endpoint, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(
      `Vertex AI VTO ${res.status} ${res.statusText}: ${errText.substring(0, 500)}`
    );
  }

  const result      = await res.json();
  const predictions = result.predictions?.filter(p => p?.bytesBase64Encoded) || [];

  if (predictions.length === 0) {
    throw new Error(
      'Vertex AI VTO: no image in response — ' +
      'verify IAM permissions (Vertex AI User role) and model availability in ' +
      VERTEX_LOCATION
    );
  }

  // Pick the candidate with the most encoded data — proxy for detail richness
  const best = predictions.reduce((a, b) =>
    (b.bytesBase64Encoded?.length || 0) > (a.bytesBase64Encoded?.length || 0) ? b : a
  );
  console.log(`[FORGE] Vertex VTO: selected best of ${predictions.length} candidate(s) — ${(best.bytesBase64Encoded.length / 1024).toFixed(0)} KB`);

  return {
    data:         best.bytesBase64Encoded,
    mimeType:     best.mimeType || 'image/png',
    outputBase64: prediction.bytesBase64Encoded, // alias for facial similarity check
  };
}

// ─── Public export ────────────────────────────────────────────────────────────
/**
 * vertexImagen3VTO
 * Primary entry point for the Vertex AI VTO pipeline.
 * Wraps _callVertexVTO with:
 *   - Image compression (Guardrail 1)
 *   - Facial similarity validation (Guardrail 2)
 *   - Automatic retry (up to VTO_MAX_RETRIES) if similarity check fails
 *
 * @param {string}      personBase64    — base64 of the person image (no data: prefix)
 * @param {string}      garmentBase64   — base64 of the garment image (no data: prefix)
 * @param {string|null} garmentDNA      — text schematic from Agent 01 (optional)
 * @param {string|null} forcedSkinTone  — reserved for future use (passed through for logging)
 * @returns {Promise<{ data: string, mimeType: string }>}
 */
export async function vertexImagen3VTO(
  personBase64,
  garmentBase64,
  garmentDNA     = null,
  forcedSkinTone = null
) {
  if (forcedSkinTone) {
    // Logged for observability — virtual-try-on-001 does not accept a prompt;
    // skin tone override is handled downstream by Agent 02 director briefs.
    console.log(`[FORGE] Vertex VTO: forcedSkinTone="${forcedSkinTone}" noted — applied via director brief`);
  }

  for (let attempt = 1; attempt <= VTO_MAX_RETRIES; attempt++) {
    console.log(`[FORGE] Vertex VTO: attempt ${attempt}/${VTO_MAX_RETRIES}...`);

    const result = await _callVertexVTO(personBase64, garmentBase64, garmentDNA);

    // ── Guardrail 2: facial similarity check ─────────────────────────────
    const similarity = await checkFacialSimilarity(personBase64, result.outputBase64);
    console.log(
      `[FORGE] Vertex VTO: facial similarity = ${(similarity * 100).toFixed(1)}% ` +
      `(threshold: ${(FACE_MATCH_THRESHOLD * 100).toFixed(0)}%)`
    );

    if (similarity >= FACE_MATCH_THRESHOLD) {
      console.log(`[FORGE] Vertex VTO: similarity check PASSED — returning result`);
      return { data: result.data, mimeType: result.mimeType };
    }

    console.warn(
      `[FORGE] Vertex VTO: similarity check FAILED (${(similarity * 100).toFixed(1)}% < ` +
      `${(FACE_MATCH_THRESHOLD * 100).toFixed(0)}%) — ` +
      (attempt < VTO_MAX_RETRIES ? 'retrying...' : 'max retries reached, returning best result')
    );

    // On final attempt, return the best result rather than throwing —
    // a slightly lower similarity is preferable to a total generation failure.
    if (attempt === VTO_MAX_RETRIES) {
      console.warn('[FORGE] Vertex VTO: returning result despite similarity check — best effort');
      return { data: result.data, mimeType: result.mimeType };
    }
  }
}
