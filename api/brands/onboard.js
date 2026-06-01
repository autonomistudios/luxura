/**
 * api/brands/onboard.js
 * Creates a brand workspace for a newly authenticated Google user.
 * Called once per brand — creates the brand document + owner membership.
 */
import { verifyIdTokenREST, parseFirestoreFields, getGcpAccessToken } from '../../lib/forge/services/gcp-raw.js';
import { createBrand, getBrandBySlug, getUserBrands } from '../../lib/forge/services/brand-service.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers['authorization'] || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!idToken) return res.status(401).json({ error: 'UNAUTHORIZED: Bearer token required' });

  let uid, email;
  try {
    uid = await verifyIdTokenREST(idToken);
    // Fetch user email from Firebase
    const apiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
    const userRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const userData = await userRes.json();
    email = userData.users?.[0]?.email || '';
  } catch (err) {
    return res.status(401).json({ error: `UNAUTHORIZED: ${err.message}` });
  }

  // ── Check if user already has a brand ────────────────────────────────────
  const existingBrands = await getUserBrands(uid);
  if (existingBrands.length > 0) {
    return res.status(409).json({
      error: 'CONFLICT: User already has a brand workspace',
      brandId: existingBrands[0].brandId,
    });
  }

  // ── Validate request ──────────────────────────────────────────────────────
  const { name, slug, tier = 'studio', brandKit } = req.body || {};
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Brand name must be at least 2 characters' });
  }

  const cleanSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!cleanSlug) return res.status(400).json({ error: 'Invalid brand slug' });

  // ── Check slug availability ───────────────────────────────────────────────
  const existing = await getBrandBySlug(cleanSlug);
  if (existing) {
    return res.status(409).json({ error: 'CONFLICT: Brand slug is already taken', slug: cleanSlug });
  }

  // ── Create brand ──────────────────────────────────────────────────────────
  const { brandId, brand } = await createBrand({
    name: name.trim(),
    slug: cleanSlug,
    ownerUid: uid,
    ownerEmail: email,
    tier,
  });

  // Apply brandKit preferences from onboarding if provided
  if (brandKit && typeof brandKit === 'object') {
    const { updateBrandKit } = await import('../../lib/forge/services/brand-service.js');
    await updateBrandKit(brandId, { ...brand.brandKit, ...brandKit }).catch(() => {});
  }

  // ── Migrate legacy consumer vault (best-effort, non-blocking) ─────────────
  migrateConsumerVault(uid, brandId).catch(err =>
    console.warn(`[ONBOARD] Vault migration non-fatal: ${err.message}`)
  );

  console.log(`[ONBOARD] Brand created: ${brandId} (${name}) for uid=${uid}`);
  return res.status(200).json({ brandId, brand: { ...brand, brandId } });
}

async function migrateConsumerVault(uid, brandId) {
  const { token, projectId } = await getGcpAccessToken();
  const dbUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  // Check if already migrated
  const userRes = await fetch(`${dbUrl}/users/${uid}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!userRes.ok) return;
  const userDoc = await userRes.json();
  const userFields = parseFirestoreFields(userDoc.fields || {});
  if (userFields.migratedToBrand) return;

  // Fetch old vault items
  const vaultRes = await fetch(`${dbUrl}/users/${uid}/vault?pageSize=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!vaultRes.ok) return;
  const vaultData = await vaultRes.json();
  const docs = vaultData.documents || [];

  // Copy to brand vault (fire-and-forget per item)
  await Promise.allSettled(
    docs.map(async doc => {
      const fields = parseFirestoreFields(doc.fields || {});
      const itemId = doc.name.split('/').pop();
      const newRes = await fetch(`${dbUrl}/brands/${brandId}/vault?documentId=${itemId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: doc.fields }),
      });
      return newRes.ok;
    })
  );

  // Mark user doc as migrated
  await fetch(
    `${dbUrl}/users/${uid}?updateMask.fieldPaths=migratedToBrand`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { migratedToBrand: { stringValue: brandId } } }),
    }
  );

  console.log(`[ONBOARD] Migrated ${docs.length} vault items for uid=${uid} → brand=${brandId}`);
}
