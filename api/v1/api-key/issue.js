/**
 * api/v1/api-key/issue.js
 * POST /api/v1/api-key/issue — generate new brand API key (owner only)
 * Returns rawKey ONCE — never stored in plaintext
 */
import { resolveBrandContext, requireRole, issueBrandApiKey } from '../../../lib/forge/services/brand-auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  let ctx;
  try { ctx = await resolveBrandContext(req); }
  catch (err) { return res.status(err.statusCode || 401).json({ error: err.message }); }

  try { requireRole(ctx, 'owner'); }
  catch (err) { return res.status(403).json({ error: err.message }); }

  const { brandId } = ctx;
  const { rawKey, prefix } = await issueBrandApiKey(brandId);

  console.log(`[API KEY] Issued new key for brand ${brandId} — prefix: ${prefix}`);
  return res.status(200).json({ rawKey, prefix, warning: 'Store this key securely. It will not be shown again.' });
}
