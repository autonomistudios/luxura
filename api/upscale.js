/**
 * api/upscale.js — Dual-Mode AI Upscale via Replicate REST API
 *
 * mode: 'standard' → Real-ESRGAN 4× (~30s, 5 credits) — clean detail, fast
 * mode: 'print'    → Clarity Upscaler (~3min, 15 credits) — SD-enhanced skin/fabric, 300 DPI print
 */

import { verifyIdTokenREST, checkRateLimit, deductCreditsREST } from '../lib/forge/services/gcp-raw.js';

const MODELS = {
  standard: {
    version: 'f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
    credits: 5,
    label: 'Real-ESRGAN 4×',
    timeout: 90_000,
    buildInput: (imageInput, scale) => ({
      image: imageInput,
      scale,
      face_enhance: false,
    }),
  },
  print: {
    version: '19be8ece7e020ef596b29a704ddb21718a1a6f5f4e90f8e99e3e5b43cadc85d0',
    credits: 15,
    label: 'Clarity Upscaler (Print Master)',
    timeout: 240_000,
    buildInput: (imageInput, scale) => ({
      image: imageInput,
      upscale_factor: scale,
      prompt: 'high fashion editorial photography, ultra detailed skin texture, sharp fabric weave, professional studio lighting',
      negative_prompt: 'blurry, artifacts, noise, plastic skin, over-smoothed',
      creativity: 0.35,
      resemblance: 0.9,
      dynamic: 6,
    }),
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const authHeader = req.headers['authorization'] || '';
  const idToken    = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!idToken) return res.status(401).json({ error: 'UNAUTHORIZED' });

  let uid;
  try {
    uid = await verifyIdTokenREST(idToken);
  } catch {
    return res.status(401).json({ error: 'UNAUTHORIZED: Invalid token.' });
  }

  if (!checkRateLimit(uid)) return res.status(429).json({ error: 'RATE_LIMITED: Wait 60 seconds.' });

  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) return res.status(500).json({ error: 'Upscale service not configured.' });

  const { image, scale = 4, mode = 'standard' } = req.body;
  if (!image) return res.status(400).json({ error: 'image is required' });

  const modelConfig = MODELS[mode] || MODELS.standard;

  let credited = false;
  try { credited = await deductCreditsREST(uid, modelConfig.credits, 'imageCredits'); }
  catch (err) {
    console.error('[UPSCALE CREDITS ERROR]', err);
    return res.status(500).json({ error: `Credit system error. Details: ${err.message}` });
  }
  if (!credited) {
    return res.status(402).json({
      error: `INSUFFICIENT_CREDITS: Need ${modelConfig.credits} credits for ${modelConfig.label}.`
    });
  }

  try {
    const imageInput = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;

    const startRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: modelConfig.version,
        input: modelConfig.buildInput(imageInput, scale),
      }),
    });

    if (!startRes.ok) throw new Error(`Replicate start failed: ${await startRes.text()}`);

    const prediction = await startRes.json();
    const pollUrl = prediction.urls?.get;
    if (!pollUrl) throw new Error('No poll URL from Replicate');

    const deadline = Date.now() + modelConfig.timeout;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 3000));

      const pollRes = await fetch(pollUrl, {
        headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` },
      });
      const result = await pollRes.json();

      if (result.status === 'succeeded') {
        const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
        return res.status(200).json({ url: outputUrl, scale, mode, label: modelConfig.label });
      }

      if (result.status === 'failed' || result.status === 'canceled') {
        throw new Error(`Replicate prediction ${result.status}: ${result.error || 'unknown'}`);
      }
    }

    throw new Error(`Upscale timed out (${modelConfig.label})`);
  } catch (err) {
    console.error('[UPSCALE]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
