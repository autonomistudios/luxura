/**
 * api/v1/api-key/revoke.js
 * POST /api/v1/api-key/revoke — revoke current API key (owner only)
 */
import { resolveBrandContext, requireRole, revokeBrandApiKey } from '../../../lib/forge/services/brand-auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  let ctx;
  try { ctx = await resolveBrandContext(req); }
  catch (err) { return res.status(err.statusCode || 401).json({ error: err.message }); }

  try { requireRole(ctx, 'owner'); }
  catch (err) { return res.status(403).json({ error: err.message }); }

  await revokeBrandApiKey(ctx.brandId);
  console.log(`[API KEY] Revoked key for brand ${ctx.brandId}`);
  return res.status(200).json({ revoked: true });
}
