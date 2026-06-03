/**
 * api/forge-iterate.js — Phase 2 Iterative Refinement Endpoint
 *
 * Accepts a single Master Image + Adjustment Prompt + Iteration Type.
 * Returns 3 refined variants via SSE stream.
 * Costs 2 image credits per run.
 */

import { verifyIdTokenREST, checkRateLimit, deductCreditsREST } from '../lib/forge/services/gcp-raw.js';
import { createGenAI }                 from '../lib/forge/services/gemini-client.js';
import { runAgentIterator }            from '../lib/forge/agents/agent-iterator.js';
import { PXL_MODEL, TEXT_MODEL }       from '../lib/forge/constants.js';

const ITERATE_CREDIT_COST = 2; // cheaper than a full 6-grid forge run

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ── Auth gate ────────────────────────────────────────────────────────────────
  const authHeader = req.headers['authorization'] || '';
  const idToken    = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!idToken) return res.status(401).json({ error: 'UNAUTHORIZED: No token provided.' });

  let uid;
  try {
    uid = await verifyIdTokenREST(idToken);
  } catch {
    return res.status(401).json({ error: 'UNAUTHORIZED: Invalid or expired token.' });
  }

  // Defense-in-depth: if the caller is a brand member, they must hold forge rights
  // to refine (viewers are export-only). Non-members (consumer fallback) pass — the
  // credit deduction below still gates them.
  try {
    const { resolveBrandContext } = await import('../lib/forge/services/brand-auth.js');
    const { requireCapability }   = await import('../lib/forge/permissions.js');
    let bctx = null;
    try { bctx = await resolveBrandContext(req); } catch { bctx = null; }
    if (bctx) requireCapability(bctx, 'forge');
  } catch (err) {
    return res.status(err.statusCode || 403).json({ error: err.message || 'FORBIDDEN' });
  }

  if (!checkRateLimit(uid)) {
    return res.status(429).json({ error: 'RATE_LIMITED: Too many requests. Wait 60 seconds.' });
  }

  let creditDeducted = false;
  try { creditDeducted = await deductCreditsREST(uid, ITERATE_CREDIT_COST, 'imageCredits'); }
  catch (err) {
    console.error('[ITERATE CREDITS ERROR]', err);
    return res.status(500).json({ error: `Credit system error. Please try again. Details: ${err.message}` });
  }
  if (!creditDeducted) return res.status(402).json({ error: 'INSUFFICIENT_CREDITS: Upgrade your plan to continue.' });

  // ── SSE setup ────────────────────────────────────────────────────────────────
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    if (typeof res.flush === 'function') res.flush();
  };

  try {
    const { masterImage, adjustmentPrompt, iterationType = 'feature_enhance' } = req.body;

    if (!masterImage)       throw new Error('MASTER_MISSING: masterImage is required.');
    if (!adjustmentPrompt)  throw new Error('PROMPT_MISSING: adjustmentPrompt is required.');

    // Parse master image
    let masterImageData, masterMimeType = 'image/jpeg';
    if (masterImage.includes(',')) {
      const [header, data] = masterImage.split(',');
      masterImageData = data.trim().replace(/\s/g, '');
      const m = header.match(/^data:(image\/\w+);/);
      if (m) masterMimeType = m[1];
    } else {
      masterImageData = masterImage.trim().replace(/\s/g, '');
    }

    const genAI = createGenAI();

    await runAgentIterator({
      genAI,
      PXL_MODEL,
      TEXT_MODEL,
      masterImageData,
      masterMimeType,
      adjustmentPrompt,
      iterationType,
      onProgress: (slot, imageDataUrl) => {
        send({ type: 'image', slot, image: imageDataUrl });
      },
    });

    send({ type: 'done' });
    res.end();
  } catch (err) {
    console.error('[FORGE-ITERATE] Fatal error:', err.message);
    send({ type: 'error', error: err.message });
    res.end();
  }
}
