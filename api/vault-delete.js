import { verifyIdTokenREST, deleteFirestoreREST, deleteStorageREST, getGcpAccessToken } from '../lib/forge/services/gcp-raw.js';

const BUCKET_NAME =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.VITE_FIREBASE_STORAGE_BUCKET ||
  'autonomi-studios-prod.firebasestorage.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const authHeader = req.headers.authorization || '';
  const idToken    = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!idToken) return res.status(401).json({ error: 'UNAUTHORIZED: No token provided.' });

  let uid;
  try {
    uid = await verifyIdTokenREST(idToken);
  } catch {
    return res.status(401).json({ error: 'UNAUTHORIZED: Invalid or expired token.' });
  }

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Missing item id.' });

  try {
    const { token, projectId } = await getGcpAccessToken();
    const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/vault/${id}`;
    
    // Fetch doc to get storagePath
    let storagePath = null;
    const docRes = await fetch(docUrl, { headers: { 'Authorization': `Bearer ${token}` } });
    if (docRes.ok) {
       const docData = await docRes.json();
       storagePath = docData.fields?.storagePath?.stringValue;
    }

    if (storagePath) {
      try {
        await deleteStorageREST(BUCKET_NAME, storagePath);
      } catch (e) {
        console.warn(`[VAULT DELETE] Storage file not found (already deleted?): ${storagePath}`);
      }
    } else {
      const exts = ['png', 'jpg', 'jpeg', 'webp'];
      for (const ext of exts) {
        try {
          await deleteStorageREST(BUCKET_NAME, `vaults/${uid}/${id}.${ext}`);
          break;
        } catch { } // try next
      }
    }

    await deleteFirestoreREST(`users/${uid}/vault/${id}`);
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('[VAULT DELETE ERROR]', err?.message);
    return res.status(500).json({ error: err?.message || 'Delete failed.' });
  }
}
