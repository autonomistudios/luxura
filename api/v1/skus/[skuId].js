/**
 * api/v1/skus/[skuId].js
 * Get or archive a single SKU.
 */
import { resolveBrandContext, requireRole } from '../../../lib/forge/services/brand-auth.js';
import { getSku, archiveSku } from '../../../lib/forge/services/sku-service.js';

export default async function handler(req, res) {
  let ctx;
  try {
    ctx = await resolveBrandContext(req);
  } catch (err) {
    return res.status(err.statusCode || 401).json({ error: err.message });
  }

  const { brandId } = ctx;
  const skuId = req.query.skuId;
  if (!skuId) return res.status(400).json({ error: 'skuId is required' });

  if (req.method === 'GET') {
    const sku = await getSku(brandId, skuId);
    if (!sku) return res.status(404).json({ error: 'SKU not found' });
    return res.status(200).json({ sku });
  }

  if (req.method === 'DELETE') {
    try {
      requireRole(ctx, 'admin');
    } catch (err) {
      return res.status(403).json({ error: err.message });
    }
    const sku = await getSku(brandId, skuId);
    if (!sku) return res.status(404).json({ error: 'SKU not found' });
    await archiveSku(brandId, skuId);
    return res.status(200).json({ archived: true, skuId });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
