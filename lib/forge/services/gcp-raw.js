/**
 * lib/forge/services/gcp-raw.js
 * Level 5 Enterprise raw REST integrations for Google Cloud / Firebase.
 * Bypasses firebase-admin entirely for zero-latency Serverless/Edge operation.
 */
import { GoogleAuth } from 'google-auth-library';
import { FORGE_CREDIT_COST, ADMIN_EMAILS, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from '../constants.js';

let _authClient = null;
let _tokenCache = { token: null, expiresAt: 0 };
let _projectId = null;

// ─── Direct Google Cloud Bearer Auth ───────────────────────────────────────
export async function getGcpAccessToken() {
  if (Date.now() < _tokenCache.expiresAt && _tokenCache.token) {
    return { token: _tokenCache.token, projectId: _projectId };
  }

  if (!_authClient) {
    const saVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!saVar) throw new Error('FIREBASE_SERVICE_ACCOUNT env var not configured');
    const serviceAccount = JSON.parse(Buffer.from(saVar, 'base64').toString('utf8'));
    _authClient = new GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    _projectId = serviceAccount.project_id;
  }

  const client = await _authClient.getClient();
  const res = await client.getAccessToken();
  _tokenCache = { token: res.token, expiresAt: Date.now() + 50 * 60 * 1000 };
  return { token: res.token, projectId: _projectId };
}

// ─── In-Memory DDoS / Abuse Rate Limiter ──────────────────────────────────
const _rateWindows = new Map();
export function checkRateLimit(uid) {
  const now    = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const times  = (_rateWindows.get(uid) || []).filter(t => t > cutoff);
  if (times.length >= RATE_LIMIT_MAX) return false;
  times.push(now);
  _rateWindows.set(uid, times);
  return true;
}

// ─── Firebase ID Token Verification via pure REST ─────────────────────────
export async function verifyIdTokenREST(idToken) {
  const apiKey = process.env.FIREBASE_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('Missing API Key for Firebase Identity REST');

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  
  if (!res.ok) throw new Error('UNAUTHORIZED: Invalid or expired token.');
  const data = await res.json();
  if (!data.users || data.users.length === 0) throw new Error('UNAUTHORIZED: No user found.');
  return data.users[0].localId;
}

// ─── Generic Credit & Free Run Deduction via REST Transaction ──────────────
export async function deductCreditsREST(uid, cost, fieldName = 'imageCredits') {
  const { token, projectId } = await getGcpAccessToken();
  const dbUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  
  let res = await fetch(`${dbUrl}:beginTransaction`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ options: {} })
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => res.status);
    throw new Error(`Firestore REST beginTransaction failed: ${errText}`);
  }
  const { transaction } = await res.json();

  res = await fetch(`${dbUrl}/users/${uid}?transaction=${transaction}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Firestore REST fetch failed');

  const doc = await res.json();
  const fields = doc.fields || {};
  const rawCredits = fields[fieldName];
  const currentCredits = rawCredits
    ? parseInt(rawCredits.integerValue ?? rawCredits.doubleValue ?? '0', 10)
    : 0;
  const email = fields.email?.stringValue || '';

  const cancelTx = () => fetch(`${dbUrl}:rollback`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction })
  }).catch(() => {});

  if (ADMIN_EMAILS.has(email)) {
    cancelTx();
    return true; 
  }

  // Handle Free taste-test complimentary run for forge runs only
  if (fieldName === 'imageCredits' && fields.tier?.stringValue === 'free' && fields.freeRunUsed?.booleanValue === false) {
    res = await fetch(`${dbUrl}:commit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transaction,
        writes: [{
          update: {
            name: doc.name || `projects/${projectId}/databases/(default)/documents/users/${uid}`,
            fields: {
               ...fields,
               freeRunUsed: { booleanValue: true }
            }
          }
        }]
      })
    });
    if (!res.ok) throw new Error('Firestore REST commit failed for free run update');
    return true;
  }

  if (currentCredits < cost) {
    cancelTx();
    return false;
  }

  res = await fetch(`${dbUrl}:commit`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transaction,
      writes: [{
        update: {
          name: doc.name || `projects/${projectId}/databases/(default)/documents/users/${uid}`,
          fields: {
             ...fields,
             [fieldName]: { integerValue: String(currentCredits - cost) }
          }
        }
      }]
    })
  });
  
  if (!res.ok) throw new Error('Firestore REST commit failed');
  return true;
}

// ─── Atomic Credit Deduction via Firestore v1 REST Transaction ──────────
export async function deductForgeCreditsREST(uid) {
  return deductCreditsREST(uid, FORGE_CREDIT_COST, 'imageCredits');
}

// ─── Video Credit Deduction ───────────────────────────────────────────────
export async function deductVideoCreditREST(uid, cost = 1) {
  return deductCreditsREST(uid, cost, 'videoCredits');
}

// ─── Fire-and-Forget Background Audit Log ─────────────────────────────────
export async function writeGenerationHistoryREST(uid, genId, payload) {
  try {
    const { token, projectId } = await getGcpAccessToken();
    const dbUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
    
    const fields = {};
    for (const [key, val] of Object.entries(payload)) {
      if (typeof val === 'string') fields[key] = { stringValue: val };
      else if (typeof val === 'number') fields[key] = { integerValue: String(val) };
      else if (Array.isArray(val)) fields[key] = { arrayValue: { values: val.map(v => ({ stringValue: v })) } };
    }
    fields.startedAt = { timestampValue: new Date().toISOString() };
    
    const res = await fetch(`${dbUrl}/users/${uid}/generations?documentId=${genId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });

    if (!res.ok) console.warn('[FORGE REST] Audit log skip — ', await res.text());
  } catch (err) {
    console.error('[FORGE REST] Error logging event:', err.message);
  }
}

// ─── Lightweight Firestore REST Abstractions ──────────────────────────────
export async function queryFirestoreREST(collection, fieldPath, op, value) {
  const { token, projectId } = await getGcpAccessToken();
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: { fieldFilter: { field: { fieldPath }, op, value: { stringValue: value } } },
        limit: { value: 1 }
      }
    })
  });
  const data = await res.json();
  if (data && data[0] && data[0].document) return data[0].document;
  return null;
}

export async function updateFirestoreREST(collection, docId, updates) {
  const { token, projectId } = await getGcpAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`;
  
  const fields = toFirestoreFields(updates);
  const updateMask = Object.keys(updates);

  const queryParams = updateMask.map(m => `updateMask.fieldPaths=${encodeURIComponent(m)}`).join('&');
  const res = await fetch(`${url}?${queryParams}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });
  if (!res.ok) throw new Error(`[Firestore PATCH Error]: ${await res.text()}`);
}

export async function setFirestoreREST(collectionPath, docId, data) {
  const { token, projectId } = await getGcpAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}?documentId=${docId}`;
  
  const fields = toFirestoreFields(data);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });
  if (!res.ok && res.status !== 409) {
    // If 409 exists, we should PATCH instead, but for vault deploy this acts as create
    const patchRes = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}/${docId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    if (!patchRes.ok) throw new Error(`[Firestore SET Error]: ${await patchRes.text()}`);
  }
}

export async function deleteFirestoreREST(docPath) {
  const { token, projectId } = await getGcpAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${docPath}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok && res.status !== 404) throw new Error(`[Firestore DELETE Error]: ${await res.text()}`);
}

export async function uploadStorageREST(bucketName, filePath, buffer, contentType) {
  const { token } = await getGcpAccessToken();
  // Cloud Storage JSON API — works directly with service account bearer tokens
  const encodedPath = encodeURIComponent(filePath);
  const url = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodedPath}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': contentType },
    body: buffer,
  });
  if (!res.ok) throw new Error(`Storage upload failed (${res.status}): ${await res.text()}`);
  // Make the object publicly readable so a plain URL works without a signed token
  const aclUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodedPath}/acl`;
  await fetch(aclUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ entity: 'allUsers', role: 'READER' }),
  }).catch(() => {}); // non-fatal — URL still works via authenticated fetch
  return `https://storage.googleapis.com/download/storage/v1/b/${bucketName}/o/${encodedPath}?alt=media`;
}

export async function deleteStorageREST(bucketName, filePath) {
  const { token } = await getGcpAccessToken();
  const url = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(filePath)}`;
  const res = await fetch(url, {
     method: 'DELETE',
     headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok && res.status !== 404) throw new Error(await res.text());
  return true;
}

export function parseFirestoreFields(fields) {
  const result = {};
  if (!fields) return result;
  for (const [key, value] of Object.entries(fields)) {
    result[key] = parseFirestoreValue(value);
  }
  return result;
}

function parseFirestoreValue(value) {
  if (!value) return null;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return parseInt(value.integerValue, 10);
  if (value.doubleValue !== undefined) return parseFloat(value.doubleValue);
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.nullValue !== undefined) return null;
  if (value.arrayValue !== undefined) {
    const values = value.arrayValue.values || [];
    return values.map(v => parseFirestoreValue(v));
  }
  if (value.mapValue !== undefined) {
    return parseFirestoreFields(value.mapValue.fields || {});
  }
  if (value.timestampValue !== undefined) return value.timestampValue;
  return value; // fallback
}

export function toFirestoreFields(obj) {
  const fields = {};
  if (!obj) return fields;
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

function toFirestoreValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return { integerValue: String(v) };
    return { doubleValue: v };
  }
  if (typeof v === 'boolean') return { booleanValue: v };
  if (Array.isArray(v)) {
    return { arrayValue: { values: v.map(item => toFirestoreValue(item)) } };
  }
  if (typeof v === 'object') {
    if (v instanceof Date) return { timestampValue: v.toISOString() };
    return { mapValue: { fields: toFirestoreFields(v) } };
  }
  return { stringValue: String(v) }; // fallback
}
