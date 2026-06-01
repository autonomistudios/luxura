/**
 * lib/forge/services/brand-service.js
 * Brand workspace CRUD and quota management.
 * All mutations use raw Firestore REST — no firebase-admin dependency.
 */
import crypto from 'crypto';
import {
  getGcpAccessToken,
  setFirestoreREST,
  updateFirestoreREST,
  deleteFirestoreREST,
  parseFirestoreFields,
  toFirestoreFields,
} from './gcp-raw.js';
import { BRAND_TIERS, ADMIN_EMAILS } from '../constants.js';

// ─── Brand CRUD ───────────────────────────────────────────────────────────────

export async function createBrand({ name, slug, ownerUid, ownerEmail, tier = 'studio' }) {
  const brandId = `brand_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const tierConfig = BRAND_TIERS[tier] || BRAND_TIERS.studio;
  const now = new Date().toISOString();

  const brandDoc = {
    brandId,
    name,
    slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    tier,
    status: 'active',
    apiKeyHash: null,
    apiKeyPrefix: null,
    apiKeyIssuedAt: null,
    logoUrl: null,
    quota: { imagesPerMonth: tierConfig.imagesPerMonth, apiCallsPerMonth: tierConfig.apiCallsPerMonth },
    usage: { currentPeriodImages: 0, currentPeriodApiCalls: 0, periodStart: now },
    brandKit: {
      defaultSkinTones: [],
      defaultLighting: 'Clean & Even',
      defaultCamera: 'Soft Background (85mm)',
      defaultColorGrade: 'Matte Fade Editorial',
      lockedParams: [],
    },
    billing: {
      stripeCustomerId: null,
      subscriptionId: null,
      status: 'trialing',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      trialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    webhookUrl: null,
    createdAt: now,
    updatedAt: now,
  };

  await setFirestoreREST('brands', brandId, brandDoc);

  // Add owner as first member
  await setFirestoreREST(`brands/${brandId}/members`, ownerUid, {
    uid: ownerUid,
    email: ownerEmail,
    role: 'owner',
    joinedAt: now,
  });

  return { brandId, brand: brandDoc };
}

export async function getBrand(brandId) {
  const { token, projectId } = await getGcpAccessToken();
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/brands/${brandId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return null;
  const doc = await res.json();
  if (!doc.fields) return null;
  return parseFirestoreFields(doc.fields);
}

export async function getBrandBySlug(slug) {
  const { token, projectId } = await getGcpAccessToken();
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'brands' }],
          where: { fieldFilter: { field: { fieldPath: 'slug' }, op: 'EQUAL', value: { stringValue: slug } } },
          limit: { value: 1 },
        },
      }),
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data && data[0] && data[0].document) return parseFirestoreFields(data[0].document.fields || {});
  return null;
}

export async function updateBrand(brandId, updates) {
  await updateFirestoreREST('brands', brandId, { ...updates, updatedAt: new Date().toISOString() });
}

export async function updateBrandKit(brandId, brandKit) {
  await updateBrand(brandId, { brandKit });
}

export async function updateBrandLogo(brandId, logoUrl) {
  await updateBrand(brandId, { logoUrl });
}

// ─── Brand Members ────────────────────────────────────────────────────────────

export async function getBrandMember(brandId, uid) {
  const { token, projectId } = await getGcpAccessToken();
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/brands/${brandId}/members/${uid}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return null;
  const doc = await res.json();
  return doc.fields ? parseFirestoreFields(doc.fields) : null;
}

export async function listBrandMembers(brandId) {
  const { token, projectId } = await getGcpAccessToken();
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/brands/${brandId}/members`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.documents || []).map(doc => parseFirestoreFields(doc.fields || {}));
}

export async function addBrandMember(brandId, uid, email, role = 'editor') {
  await setFirestoreREST(`brands/${brandId}/members`, uid, {
    uid,
    email,
    role,
    joinedAt: new Date().toISOString(),
  });
}

export async function updateBrandMemberRole(brandId, uid, role) {
  await updateFirestoreREST(`brands/${brandId}/members`, uid, { role });
}

export async function removeBrandMember(brandId, uid) {
  await deleteFirestoreREST(`brands/${brandId}/members/${uid}`);
}

export async function getUserBrands(uid) {
  const { token, projectId } = await getGcpAccessToken();
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'members', allDescendants: true }],
          where: { fieldFilter: { field: { fieldPath: 'uid' }, op: 'EQUAL', value: { stringValue: uid } } },
        },
      }),
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data || [])
    .filter(item => item.document)
    .map(item => {
      const fields = parseFirestoreFields(item.document.fields || {});
      const pathParts = item.document.name.split('/');
      const membersIdx = pathParts.indexOf('members');
      const brandId = membersIdx > 0 ? pathParts[membersIdx - 1] : null;
      return { brandId, role: fields.role, ...fields };
    });
}

// ─── Quota Management ─────────────────────────────────────────────────────────

/**
 * Atomically checks and increments brand image quota.
 * Mirrors deductCreditsREST() in gcp-raw.js exactly.
 */
export async function checkBrandQuota(brandId, cost = 1) {
  // Admin brands bypass quota
  const brand = await getBrand(brandId);
  if (!brand) return false;

  // Brands owned by admin emails bypass quota
  const members = await listBrandMembers(brandId);
  const ownerEmail = members.find(m => m.role === 'owner')?.email?.toLowerCase() || '';
  if (ADMIN_EMAILS.has(ownerEmail)) {
    console.log(`[QUOTA] Admin brand bypass for ${brandId}`);
    return true;
  }

  const { token, projectId } = await getGcpAccessToken();
  const dbUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  // Begin transaction
  let res = await fetch(`${dbUrl}:beginTransaction`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ options: {} }),
  });
  if (!res.ok) throw new Error(`beginTransaction failed: ${await res.text()}`);
  const { transaction } = await res.json();

  // Read brand doc in transaction
  res = await fetch(`${dbUrl}/brands/${brandId}?transaction=${transaction}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Brand doc fetch failed');

  const doc = await res.json();
  const fields = doc.fields || {};
  const usageFields = fields.usage?.mapValue?.fields || {};
  const quotaFields = fields.quota?.mapValue?.fields || {};

  const currentImages = parseInt(usageFields.currentPeriodImages?.integerValue || '0', 10);
  const maxImages = parseInt(quotaFields.imagesPerMonth?.integerValue || '0', 10);

  const cancelTx = () =>
    fetch(`${dbUrl}:rollback`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction }),
    }).catch(() => {});

  if (currentImages + cost > maxImages) {
    cancelTx();
    return false;
  }

  // Commit increment
  const newUsage = {
    ...usageFields,
    currentPeriodImages: { integerValue: String(currentImages + cost) },
    currentPeriodApiCalls: {
      integerValue: String(parseInt(usageFields.currentPeriodApiCalls?.integerValue || '0', 10) + 1),
    },
  };

  res = await fetch(`${dbUrl}:commit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transaction,
      writes: [{
        update: {
          name: doc.name,
          fields: { ...fields, usage: { mapValue: { fields: newUsage } } },
        },
      }],
    }),
  });

  if (!res.ok) throw new Error(`Quota commit failed: ${await res.text()}`);
  return true;
}

export async function recordBrandUsage(brandId, { imagesGenerated = 0, apiCallsMade = 0 } = {}) {
  const brand = await getBrand(brandId);
  if (!brand) return;
  const current = brand.usage || {};
  await updateFirestoreREST('brands', brandId, {
    usage: {
      currentPeriodImages: (current.currentPeriodImages || 0) + imagesGenerated,
      currentPeriodApiCalls: (current.currentPeriodApiCalls || 0) + apiCallsMade,
      periodStart: current.periodStart || new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  });
}

export async function resetMonthlyUsage(brandId) {
  await updateFirestoreREST('brands', brandId, {
    usage: {
      currentPeriodImages: 0,
      currentPeriodApiCalls: 0,
      periodStart: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  });
}

// ─── Quota Warning Check ──────────────────────────────────────────────────────

export async function checkQuotaWarningThreshold(brandId) {
  const brand = await getBrand(brandId);
  if (!brand) return null;
  const { usage, quota } = brand;
  if (!usage || !quota) return null;
  const pct = (usage.currentPeriodImages / quota.imagesPerMonth) * 100;
  if (pct >= 95) return { level: 'critical', percentUsed: pct };
  if (pct >= 80) return { level: 'warning', percentUsed: pct };
  return null;
}
