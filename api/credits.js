/**
 * LuxAura Credits — Live Balance Endpoint
 *
 * Returns the authenticated user's current credit balances directly from
 * Firestore. Used by the frontend to sync displayed balances after generation.
 */
import { verifyIdTokenREST, getGcpAccessToken } from '../lib/forge/services/gcp-raw.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const authHeader = req.headers['authorization'] || '';
  const idToken    = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!idToken) return res.status(401).json({ error: 'UNAUTHORIZED: No token provided.' });

  let uid;
  try {
    uid = await verifyIdTokenREST(idToken);
  } catch {
    return res.status(401).json({ error: 'UNAUTHORIZED: Invalid or expired token.' });
  }

  try {
    const { token, projectId } = await getGcpAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
    
    const dbRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!dbRes.ok) {
      if (dbRes.status === 404) return res.status(404).json({ error: 'User profile not found.' });
      throw new Error(await dbRes.text());
    }
    
    const data = await dbRes.json();
    const fields = data.fields || {};
    
    const imageCredits = fields.imageCredits?.integerValue ? parseInt(fields.imageCredits.integerValue, 10) : 0;
    const videoCredits = fields.videoCredits?.integerValue ? parseInt(fields.videoCredits.integerValue, 10) : 0;
    const tier = fields.tier?.stringValue || 'free';

    res.setHeader('Cache-Control', 'no-store');
    return res.json({ imageCredits, videoCredits, tier });
  } catch (err) {
    console.error('[Credits] Firestore REST read error:', err?.message);
    return res.status(500).json({ error: 'Failed to read credit balance.' });
  }
}
