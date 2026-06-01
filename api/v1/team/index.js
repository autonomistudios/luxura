/**
 * api/v1/team/index.js
 * GET  /api/v1/team — list brand members
 * POST /api/v1/team — invite new member
 */
import { resolveBrandContext, requireRole } from '../../../lib/forge/services/brand-auth.js';
import { listBrandMembers, addBrandMember } from '../../../lib/forge/services/brand-service.js';

export default async function handler(req, res) {
  let ctx;
  try { ctx = await resolveBrandContext(req); }
  catch (err) { return res.status(err.statusCode || 401).json({ error: err.message }); }
  const { brandId } = ctx;

  if (req.method === 'GET') {
    const members = await listBrandMembers(brandId);
    return res.status(200).json({ members, total: members.length });
  }

  if (req.method === 'POST') {
    try { requireRole(ctx, 'admin'); }
    catch (err) { return res.status(403).json({ error: err.message }); }

    const { email, role = 'editor' } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email is required' });

    const validRoles = ['editor', 'admin', 'viewer'];
    if (!validRoles.includes(role)) return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });

    const uid = `invited_${Date.now()}`;
    await addBrandMember(brandId, uid, email, role);
    return res.status(200).json({ invited: true, email, role });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
