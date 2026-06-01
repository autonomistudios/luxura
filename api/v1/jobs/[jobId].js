/**
 * api/v1/jobs/[jobId].js
 * GET /api/v1/jobs/:jobId — poll async job status
 */
import { resolveBrandContext } from '../../../lib/forge/services/brand-auth.js';
import { getGcpAccessToken, parseFirestoreFields } from '../../../lib/forge/services/gcp-raw.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  let ctx;
  try { ctx = await resolveBrandContext(req); }
  catch (err) { return res.status(err.statusCode || 401).json({ error: err.message }); }

  const { brandId } = ctx;
  const jobId = req.query.jobId;
  if (!jobId) return res.status(400).json({ error: 'jobId is required' });

  const { token, projectId } = await getGcpAccessToken();
  const docRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/brands/${brandId}/jobs/${jobId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!docRes.ok) return res.status(404).json({ error: 'Job not found' });

  const doc  = await docRes.json();
  const job  = parseFirestoreFields(doc.fields || {});

  // Security: only return jobs belonging to this brand
  if (job.brandId && job.brandId !== brandId) {
    return res.status(403).json({ error: 'Job does not belong to this brand' });
  }

  return res.status(200).json({
    jobId:       job.jobId,
    status:      job.status,
    skuId:       job.skuId       || null,
    batchId:     job.batchId     || null,
    results:     job.results     || null,
    error:       job.error       || null,
    createdAt:   job.createdAt   || null,
    startedAt:   job.startedAt   || null,
    completedAt: job.completedAt || null,
  });
}
