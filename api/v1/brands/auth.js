/**
 * api/v1/brands/auth.js
 * Validates a Firebase session and returns the brand context for the portal.
 * Called on every portal page load to hydrate AuthContext.
 */
import { resolveBrandContext } from '../../../lib/forge/services/brand-auth.js';
import { getBrand, listBrandMembers } from '../../../lib/forge/services/brand-service.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let ctx;
  try {
    ctx = await resolveBrandContext(req);
  } catch (err) {
    return res.status(err.statusCode || 401).json({ error: err.message });
  }

  const { brandId, uid, role, brand } = ctx;

  // Return enriched brand context for portal hydration
  return res.status(200).json({
    brandId,
    uid,
    role,
    brand: {
      brandId:  brand.brandId,
      name:     brand.name,
      slug:     brand.slug,
      tier:     brand.tier,
      status:   brand.status,
      logoUrl:  brand.logoUrl || null,
      usage:    brand.usage   || { currentPeriodImages: 0, currentPeriodApiCalls: 0 },
      quota:    brand.quota   || { imagesPerMonth: 0, apiCallsPerMonth: 0 },
      brandKit: brand.brandKit || {},
      billing:  {
        status:           brand.billing?.status || 'trialing',
        currentPeriodEnd: brand.billing?.currentPeriodEnd || null,
        trialEnd:         brand.billing?.trialEnd || null,
      },
      apiKeyPrefix: brand.apiKeyPrefix || null,
      webhookUrl:   brand.webhookUrl || null,
    },
  });
}
