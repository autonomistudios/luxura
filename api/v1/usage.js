/**
 * api/v1/usage.js
 * GET /api/v1/usage — brand usage stats for current period
 */
import { resolveBrandContext } from '../../lib/forge/services/brand-auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  let ctx;
  try { ctx = await resolveBrandContext(req); }
  catch (err) { return res.status(err.statusCode || 401).json({ error: err.message }); }

  const { brand } = ctx;
  if (!brand) return res.status(404).json({ error: 'Brand not found' });

  const images   = brand.usage?.currentPeriodImages   || 0;
  const apiCalls = brand.usage?.currentPeriodApiCalls  || 0;
  const maxImg   = brand.quota?.imagesPerMonth         || 0;
  const maxApi   = brand.quota?.apiCallsPerMonth        || 0;

  return res.status(200).json({
    currentPeriodImages:   images,
    currentPeriodApiCalls: apiCalls,
    imagesPerMonth:        maxImg,
    apiCallsPerMonth:      maxApi,
    periodStart:           brand.usage?.periodStart || null,
    percentUsedImages:     maxImg > 0 ? Math.round((images / maxImg) * 100) : 0,
    percentUsedApiCalls:   maxApi > 0 ? Math.round((apiCalls / maxApi) * 100) : 0,
    imagesRemaining:       Math.max(0, maxImg - images),
  });
}
