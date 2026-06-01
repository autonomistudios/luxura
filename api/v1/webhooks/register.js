/**
 * api/v1/webhooks/register.js
 * POST /api/v1/webhooks/register — save brand webhook URL
 */
import { resolveBrandContext, requireRole } from '../../../lib/forge/services/brand-auth.js';
import { updateBrand } from '../../../lib/forge/services/brand-service.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  let ctx;
  try { ctx = await resolveBrandContext(req); }
  catch (err) { return res.status(err.statusCode || 401).json({ error: err.message }); }

  try { requireRole(ctx, 'admin'); }
  catch (err) { return res.status(403).json({ error: err.message }); }

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url is required' });

  try { new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL' }); }
  if (!url.startsWith('https://')) return res.status(400).json({ error: 'Webhook URL must use HTTPS' });

  await updateBrand(ctx.brandId, { webhookUrl: url });
  return res.status(200).json({ registered: true, url });
}
