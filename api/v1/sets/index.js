/**
 * api/v1/sets/index.js
 * GET /api/v1/sets — list brand's injected sets
 */
import { resolveBrandContext } from '../../../lib/forge/services/brand-auth.js';
import { getGcpAccessToken, parseFirestoreFields } from '../../../lib/forge/services/gcp-raw.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  let ctx;
  try { ctx = await resolveBrandContext(req); }
  catch (err) { return res.status(err.statusCode || 401).json({ error: err.message }); }

  const { brandId } = ctx;
  const { token, projectId } = await getGcpAccessToken();

  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/brands/${brandId}/sets?pageSize=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) return res.status(200).json({ sets: [] });

  const data = await response.json();
  const sets = (data.documents || []).map(doc => parseFirestoreFields(doc.fields || {}));

  return res.status(200).json({ sets, total: sets.length });
}
