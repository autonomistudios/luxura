/**
 * lib/forge/services/fashn-tryon.js
 * Fashn.ai Virtual Try-On — identity-preserving clothing transfer (fallback path).
 *
 * This is the secondary VTO engine. It runs when Vertex AI is unavailable or fails.
 * Fashn.ai (tryon-max) preserves the person's face and body with near-perfect fidelity
 * and handles body-region replacement (tops / bottoms / one-pieces) explicitly.
 *
 * Polling: polls /v1/status/{id} every 2 s for up to 120 s (60 attempts).
 * quality mode typically resolves in 12–17 s.
 *
 * Requires: FASHN_API_KEY env var — get key at https://fashn.ai
 */

import { FASHN_API_KEY } from '../constants.js';

// ─── Anchor → FASHN garment category ─────────────────────────────────────────
// Without an explicit category, FASHN auto-detects — and frequently misreads dresses
// as "tops", leaving the model's original lower body visible and creating chimera output.
// Explicit category forces a full body-region replacement.
function fashnCategoryFromAnchor(anchor) {
  if (!anchor) return null;
  const a = anchor.toUpperCase();
  if (a === 'SHIRT')                                            return 'tops';
  if (a === 'PANTS' || a === 'SHORTS')                          return 'bottoms';
  if (a === 'FULL_OUTFIT' || a === 'SWIMWEAR' || a === 'DRESS') return 'one-pieces';
  // HAT, accessories — let FASHN auto-detect (no body-region swap needed)
  return null;
}

/**
 * fashnTryOn
 * Submits a Fashn.ai tryon-max prediction and polls until completion.
 * Returns the VTO result as { data: base64String, mimeType: string }.
 *
 * @param {string} modelData     — base64 of the person image (no data: prefix)
 * @param {string} modelMime     — MIME type, e.g. 'image/jpeg'
 * @param {string} garmentData   — base64 of the garment image (no data: prefix)
 * @param {string} garmentMime   — MIME type of the garment image
 * @param {string} garmentAnchor — LuxAura anchor ID (e.g. 'FULL_OUTFIT', 'SHIRT')
 * @returns {Promise<{ data: string, mimeType: string }>}
 */
export async function fashnTryOn(modelData, modelMime, garmentData, garmentMime, garmentAnchor) {
  const category = fashnCategoryFromAnchor(garmentAnchor);
  console.log(
    `[FORGE] FASHN: category → ${category || 'auto'} (anchor: ${garmentAnchor || 'none'})`
  );

  // ── Build request payload ─────────────────────────────────────────────────
  // tryon-max confirmed (docs 2026-04): NO category param — auto-detects garment region.
  // category computed above for observability only.
  void category;

  // Prompt: enforce pattern/print fidelity and full-body garment application.
  // tryon-max accepts an optional `prompt` for styling guidance — used here to
  // lock pattern continuity across the transfer rather than letting the model
  // reinterpret prints, colors, or structural elements.
  const garmentLockPrompt =
    'Preserve every print, pattern repeat, color block, fabric texture, and structural ' +
    'detail of the garment EXACTLY as shown in the product image. Apply the complete outfit ' +
    'from neckline to hem — do not omit any piece. Zero pattern drift. Zero color shift.';

  const inputs = {
    model_image:     `data:${modelMime};base64,${modelData}`,
    product_image:   `data:${garmentMime};base64,${garmentData}`,
    aspect_ratio:    '3:4',       // vertical portrait — matches our 6-slot grid
    generation_mode: 'quality',   // highest fidelity (~20–45 s)
    resolution:      '2k',        // 2K output for pattern-level detail retention
    num_images:      2,           // 2 candidates — best selected by encoded detail density
    return_base64:   true,        // avoids CDN round-trip — returns data URI directly
    prompt:          garmentLockPrompt,
  };

  // ── Submit prediction ─────────────────────────────────────────────────────
  const runRes = await fetch('https://api.fashn.ai/v1/run', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${FASHN_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ model_name: 'tryon-max', inputs }),
  });

  const runBody = await runRes.json();
  if (!runRes.ok || runBody.error) {
    throw new Error(
      `Fashn.ai /v1/run ${runRes.status}: ` +
      (runBody.message || runBody.error || JSON.stringify(runBody))
    );
  }

  const { id } = runBody;
  if (!id) throw new Error('Fashn.ai /v1/run: no prediction id in response');
  console.log(`[FORGE] FASHN: prediction started — id: ${id}`);

  // ── Poll /v1/status/{id} ──────────────────────────────────────────────────
  // State machine: starting → in_queue → processing → completed | failed
  const startTime = Date.now();

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000));

    const pollRes = await fetch(`https://api.fashn.ai/v1/status/${id}`, {
      headers: { 'Authorization': `Bearer ${FASHN_API_KEY}` },
    });
    if (!pollRes.ok) {
      console.warn(`[FORGE] FASHN: poll HTTP ${pollRes.status} — retrying`);
      continue;
    }

    const { status, output, error: pollErr } = await pollRes.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[FORGE] FASHN: poll ${i + 1} — status: ${status} (${elapsed}s)`);

    if (status === 'completed' && output?.length > 0) {
      // Parse all candidates, pick the one with most encoded data (detail richness proxy)
      const candidates = [];
      for (const dataUri of output) {
        if (dataUri.startsWith('data:')) {
          const comma    = dataUri.indexOf(',');
          const mimeType = dataUri.slice(5, dataUri.indexOf(';')) || 'image/png';
          candidates.push({ data: dataUri.slice(comma + 1), mimeType });
        } else {
          try {
            const img = await fetch(dataUri);
            const buf = await img.arrayBuffer();
            candidates.push({ data: Buffer.from(buf).toString('base64'), mimeType: 'image/jpeg' });
          } catch { /* skip failed CDN fetch */ }
        }
      }
      if (candidates.length === 0) continue;

      const best = candidates.reduce((a, b) => b.data.length > a.data.length ? b : a);
      console.log(`[FORGE] FASHN: VTO complete in ${elapsed}s — best of ${candidates.length} candidate(s), ${(best.data.length / 1024).toFixed(0)} KB`);
      return best;
    }

    if (status === 'failed') {
      const msg = pollErr?.message || pollErr?.name || JSON.stringify(pollErr) || 'unknown';
      throw new Error(`Fashn.ai prediction failed: ${msg}`);
    }
    // starting | in_queue | processing — keep polling
  }

  throw new Error('Fashn.ai: 120 s timeout — prediction did not complete');
}
