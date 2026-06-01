/**
 * api/v1/webhooks/test.js
 * POST /api/v1/webhooks/test — fire a test delivery to the registered webhook
 */
import { resolveBrandContext, requireRole } from '../../../lib/forge/services/brand-auth.js';
import { testWebhookDelivery } from '../../../lib/forge/services/webhook-service.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  let ctx;
  try { ctx = await resolveBrandContext(req); }
  catch (err) { return res.status(err.statusCode || 401).json({ error: err.message }); }

  try { requireRole(ctx, 'admin'); }
  catch (err) { return res.status(403).json({ error: err.message }); }

  const result = await testWebhookDelivery(ctx.brandId, req.body?.url);
  return res.status(200).json(result);
}
