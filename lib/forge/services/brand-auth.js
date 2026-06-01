/**
 * lib/forge/services/brand-auth.js
 * Dual-mode authentication middleware for all B2B API endpoints.
 * Accepts Firebase ID tokens (portal users) OR brand API keys (programmatic access).
 */
import crypto from 'crypto';
import { verifyIdTokenREST, getGcpAccessToken, parseFirestoreFields } from './gcp-raw.js';

// ─── Auth Error ───────────────────────────────────────────────────────────────
class AuthError extends Error {
  constructor(message, code, statusCode = 401) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ─── Core: Resolve Brand Context ─────────────────────────────────────────────
/**
 * Resolves brand context from either a Firebase Bearer token or a brand API key.
 * Returns { brandId, uid, role, authMethod, brand }
 */
export async function resolveBrandContext(req) {
  const apiKey = req.headers['x-brand-api-key'];
  const authHeader = req.headers['authorization'] || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!apiKey && !bearerToken) {
    throw new AuthError('UNAUTHORIZED: No authentication provided. Use Authorization: Bearer <token> or X-Brand-API-Key: <key>', 'UNAUTHORIZED');
  }

  if (apiKey) {
    return resolveApiKeyContext(apiKey);
  }

  return resolveFirebaseContext(bearerToken);
}

// ─── Firebase Token Path ──────────────────────────────────────────────────────
async function resolveFirebaseContext(idToken) {
  let uid;
  try {
    uid = await verifyIdTokenREST(idToken);
  } catch (err) {
    throw new AuthError(`UNAUTHORIZED: ${err.message}`, 'UNAUTHORIZED');
  }

  // Find this user's brand membership via collection group query
  const memberDoc = await queryBrandMemberByUid(uid);
  if (!memberDoc) {
    throw new AuthError('FORBIDDEN: User is not a member of any brand workspace. Please complete brand onboarding at /onboard', 'BRAND_NOT_FOUND', 403);
  }

  const { brandId, role } = memberDoc;
  const brand = await getBrandDocRaw(brandId);
  if (!brand) {
    throw new AuthError('FORBIDDEN: Brand workspace not found', 'BRAND_NOT_FOUND', 403);
  }

  return { brandId, uid, role, authMethod: 'firebase', brand };
}

// ─── API Key Path ─────────────────────────────────────────────────────────────
async function resolveApiKeyContext(rawKey) {
  if (!rawKey.startsWith('lux_live_') && !rawKey.startsWith('lux_test_')) {
    throw new AuthError('UNAUTHORIZED: Invalid API key format', 'UNAUTHORIZED');
  }

  const brandDoc = await validateBrandApiKey(rawKey);
  if (!brandDoc) {
    throw new AuthError('UNAUTHORIZED: Invalid or revoked API key', 'UNAUTHORIZED');
  }

  const fields = parseFirestoreFields(brandDoc.fields || {});
  const brandId = fields.brandId;

  return {
    brandId,
    uid: null,
    role: 'api',
    authMethod: 'apikey',
    brand: fields,
  };
}

// ─── API Key Validation ───────────────────────────────────────────────────────
export async function validateBrandApiKey(rawKey) {
  const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const { token, projectId } = await getGcpAccessToken();

  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'brands' }],
          where: {
            compositeFilter: {
              op: 'AND',
              filters: [
                { fieldFilter: { field: { fieldPath: 'apiKeyHash' }, op: 'EQUAL', value: { stringValue: hash } } },
                { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'active' } } },
              ],
            },
          },
          limit: { value: 1 },
        },
      }),
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  if (data && data[0] && data[0].document) return data[0].document;
  return null;
}

// ─── Issue Brand API Key ──────────────────────────────────────────────────────
export async function issueBrandApiKey(brandId) {
  const rawKey = `lux_live_${crypto.randomBytes(20).toString('hex')}`;
  const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const prefix = rawKey.slice(0, 12);

  const { token, projectId } = await getGcpAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/brands/${brandId}`;
  const updateMask = ['apiKeyHash', 'apiKeyPrefix', 'apiKeyIssuedAt'];
  const queryParams = updateMask.map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&');

  const res = await fetch(`${url}?${queryParams}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        apiKeyHash:     { stringValue: hash },
        apiKeyPrefix:   { stringValue: prefix },
        apiKeyIssuedAt: { timestampValue: new Date().toISOString() },
      },
    }),
  });

  if (!res.ok) throw new Error(`Failed to store API key: ${await res.text()}`);
  return { rawKey, prefix };
}

// ─── Revoke Brand API Key ─────────────────────────────────────────────────────
export async function revokeBrandApiKey(brandId) {
  const { token, projectId } = await getGcpAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/brands/${brandId}`;
  const updateMask = ['apiKeyHash', 'apiKeyPrefix', 'apiKeyIssuedAt'];
  const queryParams = updateMask.map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&');

  const res = await fetch(`${url}?${queryParams}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        apiKeyHash:     { nullValue: null },
        apiKeyPrefix:   { nullValue: null },
        apiKeyIssuedAt: { nullValue: null },
      },
    }),
  });

  if (!res.ok) throw new Error(`Failed to revoke API key: ${await res.text()}`);
}

// ─── Role Authorization Helper ────────────────────────────────────────────────
export function requireRole(ctx, minimumRole) {
  const hierarchy = { viewer: 0, editor: 1, admin: 2, owner: 3, api: 1 };
  const userLevel = hierarchy[ctx.role] ?? -1;
  const requiredLevel = hierarchy[minimumRole] ?? 0;
  if (userLevel < requiredLevel) {
    throw new AuthError(`FORBIDDEN: Role '${ctx.role}' cannot perform this action. Required: '${minimumRole}'`, 'FORBIDDEN', 403);
  }
}

// ─── Internal: Query brand membership by Firebase UID ────────────────────────
async function queryBrandMemberByUid(uid) {
  const { token, projectId } = await getGcpAccessToken();

  // Collection group query across all brands/{brandId}/members/{uid}
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'members', allDescendants: true }],
          where: {
            fieldFilter: { field: { fieldPath: 'uid' }, op: 'EQUAL', value: { stringValue: uid } },
          },
          limit: { value: 1 },
        },
      }),
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  if (!data || !data[0] || !data[0].document) return null;

  const doc = data[0].document;
  const fields = parseFirestoreFields(doc.fields || {});

  // Extract brandId from document path: .../brands/{brandId}/members/{uid}
  const pathParts = doc.name.split('/');
  const membersIdx = pathParts.indexOf('members');
  const brandId = membersIdx > 0 ? pathParts[membersIdx - 1] : null;

  return { brandId, role: fields.role || 'viewer', ...fields };
}

// ─── Internal: Get raw brand document ────────────────────────────────────────
async function getBrandDocRaw(brandId) {
  const { token, projectId } = await getGcpAccessToken();
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/brands/${brandId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return null;
  const doc = await res.json();
  return parseFirestoreFields(doc.fields || {});
}
