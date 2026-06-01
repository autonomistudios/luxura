/**
 * api/v1/skus/index.js
 * List all SKUs for a brand workspace.
 */
import { resolveBrandContext } from '../../../lib/forge/services/brand-auth.js';
import { listSkus } from '../../../lib/forge/services/sku-service.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  let ctx;
  try {
    ctx = await resolveBrandContext(req);
  } catch (err) {
    return res.status(err.statusCode || 401).json({ error: err.message });
  }

  const { brandId } = ctx;
  const { status, limit = '50', offset = '0' } = req.query;

  const skus = await listSkus(brandId, {
    status: status || undefined,
    limit: Math.min(parseInt(limit, 10) || 50, 100),
    offset: parseInt(offset, 10) || 0,
  });

  return res.status(200).json({ skus, total: skus.length });
}
