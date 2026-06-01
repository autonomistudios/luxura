/**
 * api/agents/quality-audit-agent.js
 * Post-generation fidelity scoring service.
 * Extracted from forge.js garment audit block (lines 804-829) into a reusable module.
 */
import { createGenAI, withGeminiBackoff } from '../../lib/forge/services/gemini-client.js';
import { TEXT_MODEL } from '../../lib/forge/constants.js';

/**
 * Scores how faithfully a generated image reproduces the SKU reference.
 * Returns { fidelityScore: 0-100, auditNotes: string }
 */
export async function auditGeneratedImage(generatedImageBase64, skuReferenceImageBase64, anchorType) {
  try {
    const genAI = createGenAI();
    const model = genAI.getGenerativeModel({ model: TEXT_MODEL });

    const result = await withGeminiBackoff(() => model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          {
            text: `You are a garment fidelity auditor for a luxury fashion AI platform.

Compare:
- Image 1: AI-generated fashion editorial output
- Image 2: Source SKU reference (${anchorType})

Score fidelity 0-100 based on:
- Pattern/print accuracy (does the exact fabric pattern match?)
- Color accuracy (do colors match under different lighting?)
- Silhouette preservation (same cut and shape?)
- Detail retention (buttons, stitching, hardware, embellishments preserved?)
- Statement element accuracy (any 3D elements like feathers, appliqués, crystals — correct position and scale?)

Respond ONLY with JSON: { "score": <0-100>, "notes": "<one sentence>", "pass": <true if score >= 65> }`,
          },
          { inlineData: { mimeType: 'image/jpeg', data: generatedImageBase64 } },
          { inlineData: { mimeType: 'image/png',  data: skuReferenceImageBase64 } },
        ],
      }],
    }));

    const text  = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { fidelityScore: 50, auditNotes: 'Could not parse audit response', pass: true };

    const parsed = JSON.parse(match[0]);
    return {
      fidelityScore: Math.max(0, Math.min(100, parseInt(parsed.score || '50', 10))),
      auditNotes:    parsed.notes || '',
      pass:          parsed.pass !== false,
    };
  } catch (err) {
    console.warn(`[QUALITY AUDIT] Scoring failed (non-fatal): ${err.message}`);
    return { fidelityScore: null, auditNotes: 'Audit unavailable', pass: true };
  }
}

// HTTP handler for direct invocation
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { generatedImageBase64, skuReferenceImageBase64, anchorType } = req.body || {};
  if (!generatedImageBase64 || !skuReferenceImageBase64) {
    return res.status(400).json({ error: 'generatedImageBase64 and skuReferenceImageBase64 are required' });
  }

  const result = await auditGeneratedImage(generatedImageBase64, skuReferenceImageBase64, anchorType || 'FULL_OUTFIT');
  return res.status(200).json(result);
}
