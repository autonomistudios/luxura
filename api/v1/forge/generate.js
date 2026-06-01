/**
 * api/v1/forge/generate.js
 * POST /api/v1/forge/generate — brand API forge adapter
 * Thin wrapper: injects brand context + skuId into existing forge.js pipeline
 */
import { resolveBrandContext } from '../../../lib/forge/services/brand-auth.js';
import { checkBrandQuota, recordBrandUsage } from '../../../lib/forge/services/brand-service.js';
import { BRAND_QUOTA_COST_STANDARD, BRAND_QUOTA_COST_VTO } from '../../../lib/forge/constants.js';
import forgeHandler from '../../forge.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  let ctx;
  try { ctx = await resolveBrandContext(req); }
  catch (err) { return res.status(err.statusCode || 401).json({ error: err.message }); }

  const { brandId } = ctx;
  const isVTO = !!(req.body?.skuId || req.body?.config?.garmentImage);
  const cost  = isVTO ? BRAND_QUOTA_COST_VTO : BRAND_QUOTA_COST_STANDARD;

  // For async mode, create a job and return jobId
  if (req.body?.async === true) {
    const crypto = (await import('crypto')).default;
    const jobId  = `job_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const { setFirestoreREST } = await import('../../../lib/forge/services/gcp-raw.js');

    await setFirestoreREST(`brands/${brandId}/jobs`, jobId, {
      jobId, brandId,
      skuId:      req.body?.skuId || null,
      status:     'queued',
      config:     req.body?.config || {},
      webhookUrl: req.body?.webhookUrl || null,
      results:    null,
      error:      null,
      createdAt:  new Date().toISOString(),
      startedAt:  null,
      completedAt: null,
    });

    return res.status(200).json({ jobId, status: 'queued', brandId });
  }

  // Synchronous SSE stream — inject brand context into req.body and delegate to forge.js
  req.body = {
    ...req.body,
    brandId,
    // forge.js reads X-Brand-API-Key header for quota handling
  };

  // Pass through to the main forge handler (SSE streaming)
  return forgeHandler(req, res);
}
