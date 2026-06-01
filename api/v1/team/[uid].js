/**
 * api/v1/team/[uid].js
 * PATCH  /api/v1/team/:uid — change role
 * DELETE /api/v1/team/:uid — remove member
 */
import { resolveBrandContext, requireRole } from '../../../lib/forge/services/brand-auth.js';
import { updateBrandMemberRole, removeBrandMember, getBrandMember } from '../../../lib/forge/services/brand-service.js';

export default async function handler(req, res) {
  let ctx;
  try { ctx = await resolveBrandContext(req); }
  catch (err) { return res.status(err.statusCode || 401).json({ error: err.message }); }

  const { brandId } = ctx;
  const uid = req.query.uid;
  if (!uid) return res.status(400).json({ error: 'uid is required' });

  try { requireRole(ctx, 'admin'); }
  catch (err) { return res.status(403).json({ error: err.message }); }

  const member = await getBrandMember(brandId, uid);
  if (!member) return res.status(404).json({ error: 'Member not found' });
  if (member.role === 'owner') return res.status(403).json({ error: 'Cannot modify owner' });

  if (req.method === 'PATCH') {
    const { role } = req.body || {};
    const validRoles = ['editor', 'admin', 'viewer'];
    if (!role || !validRoles.includes(role)) return res.status(400).json({ error: `Invalid role` });
    await updateBrandMemberRole(brandId, uid, role);
    return res.status(200).json({ updated: true, uid, role });
  }

  if (req.method === 'DELETE') {
    await removeBrandMember(brandId, uid);
    return res.status(200).json({ removed: true, uid });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
