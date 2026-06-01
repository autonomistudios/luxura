/**
 * api/v1/forge/batch.js
 * POST /api/v1/forge/batch — queue multiple SKU forge jobs
 */
import { resolveBrandContext, requireRole } from '../../../lib/forge/services/brand-auth.js';
import { setFirestoreREST } from '../../../lib/forge/services/gcp-raw.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  let ctx;
  try { ctx = await resolveBrandContext(req); }
  catch (err) { return res.status(err.statusCode || 401).json({ error: err.message }); }

  try { requireRole(ctx, 'editor'); }
  catch (err) { return res.status(403).json({ error: err.message }); }

  const { brandId } = ctx;
  const { skuIds, config = {}, webhookUrl } = req.body || {};

  if (!skuIds?.length) return res.status(400).json({ error: 'skuIds array is required' });
  if (skuIds.length > 10) return res.status(400).json({ error: 'Maximum 10 SKUs per batch' });

  const batchId = `batch_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const now     = new Date().toISOString();

  // Create one job per SKU
  const jobs = await Promise.all(skuIds.map(async (skuId) => {
    const jobId = `job_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    await setFirestoreREST(`brands/${brandId}/jobs`, jobId, {
      jobId, brandId, batchId, skuId,
      status: 'queued',
      config: { ...config, skuId },
      webhookUrl: webhookUrl || null,
      results:    null, error: null,
      createdAt: now, startedAt: null, completedAt: null,
    });
    return { skuId, jobId, status: 'queued' };
  }));

  console.log(`[BATCH] Created ${jobs.length} jobs for brand ${brandId}, batchId=${batchId}`);
  return res.status(200).json({ batchId, brandId, jobs, total: jobs.length });
}
