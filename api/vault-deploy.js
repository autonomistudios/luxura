import { verifyIdTokenREST, setFirestoreREST, uploadStorageREST } from '../lib/forge/services/gcp-raw.js';

const BUCKET_NAME =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.VITE_FIREBASE_STORAGE_BUCKET ||
  'autonomi-studios-prod.firebasestorage.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split('Bearer ')[1];
    let uid;
    try {
      uid = await verifyIdTokenREST(token);
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { item } = req.body;
    if (!item || !item.id || !item.image) {
      return res.status(400).json({ error: 'Missing vault item payload' });
    }

    let imageUrl = item.image;

    if (imageUrl.startsWith('data:')) {
      const match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!match) throw new Error('Invalid base64 image format');
      const ext = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      
      const filePath = `vaults/${uid}/${item.id}.${ext}`;
      imageUrl = await uploadStorageREST(BUCKET_NAME, filePath, buffer, `image/${ext}`);
    }

    const storagePath = imageUrl.startsWith('https://firebasestorage') && item.image?.startsWith('data:')
      ? `vaults/${uid}/${item.id}.${item.image.match(/^data:image\/(\w+);/)?.[1] || 'png'}`
      : (item.storagePath || null);

    const finalItem = {
      ...item,
      image: imageUrl,
      storagePath: storagePath || null,
      createdAt: item.createdAt || Date.now(),
    };

    await setFirestoreREST(`users/${uid}/vault`, item.id, finalItem);

    return res.status(200).json({ success: true, item: finalItem });

  } catch (err) {
    console.error('[VAULT DEPLOY ERROR]', err);
    return res.status(500).json({ error: err.message || 'Server error bypassing rules' });
  }
}
