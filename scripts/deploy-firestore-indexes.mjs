#!/usr/bin/env node
/**
 * scripts/deploy-firestore-indexes.mjs
 * ----------------------------------------------------------------------------
 * Applies firestore.indexes.json to the live database via the Firestore Admin
 * REST API — no firebase-tools required. Mirrors deploy-firestore-rules.mjs.
 *
 *   node scripts/deploy-firestore-indexes.mjs
 *
 * Handles both:
 *   • fieldOverrides → PATCH collectionGroups/{cg}/fields/{field}
 *   • composite indexes → POST collectionGroups/{cg}/indexes
 *
 * Token resolution (same chain as the rules deploy):
 *   1. GOOGLE_ACCESS_TOKEN env
 *   2. valid FIREBASE_SERVICE_ACCOUNT  (needs datastore.indexes.create perm)
 *   3. gcloud auth print-access-token   (operator login — usually has perms)
 *
 * NOTE: index admin requires datastore.indexes.* permission. The firebase
 * admin SDK service account often lacks it; the gcloud owner login does. When
 * using a user token, X-Goog-User-Project is sent automatically.
 * ----------------------------------------------------------------------------
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createPrivateKey } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { GoogleAuth } from 'google-auth-library';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      if (process.env[m[1]] === undefined) process.env[m[1]] = val;
    }
  } catch {}
}

function parseSA() {
  const v = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!v) return null;
  try {
    const sa = JSON.parse(Buffer.from(v, 'base64').toString('utf8'));
    if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
    return sa;
  } catch { return null; }
}

function saKeyValid(sa) {
  if (!sa?.private_key) return false;
  try { createPrivateKey({ key: sa.private_key, format: 'pem' }); return true; } catch { return false; }
}

async function acquireToken(sa) {
  if (process.env.GOOGLE_ACCESS_TOKEN) return { token: process.env.GOOGLE_ACCESS_TOKEN.trim(), source: 'GOOGLE_ACCESS_TOKEN' };
  if (saKeyValid(sa)) {
    const auth = new GoogleAuth({ credentials: sa, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    const { token } = await client.getAccessToken();
    if (token) return { token, source: 'service-account' };
  }
  try {
    const cmd = process.platform === 'win32' ? 'gcloud.cmd' : 'gcloud';
    const out = execFileSync(cmd, ['auth', 'print-access-token'], { encoding: 'utf8' }).trim();
    if (out && out.length > 40 && !/error/i.test(out)) return { token: out, source: 'gcloud' };
  } catch {}
  return { token: null, source: null };
}

async function main() {
  loadEnv();
  const sa = parseSA();
  const projectId = process.env.GCP_PROJECT_ID || sa?.project_id || process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Cannot determine project id');

  const { token, source } = await acquireToken(sa);
  if (!token) throw new Error('No usable Google credential. Restore FIREBASE_SERVICE_ACCOUNT or run `gcloud auth login`.');

  const cfg = JSON.parse(readFileSync(join(ROOT, 'firestore.indexes.json'), 'utf8'));
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(source === 'service-account' ? {} : { 'X-Goog-User-Project': projectId }),
  };
  const apiBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)`;
  console.log(`[indexes] project: ${projectId} | auth via: ${source}`);

  // ── Field overrides (single-field / collection-group indexes) ──────────────
  for (const fo of (cfg.fieldOverrides || [])) {
    const url = `${apiBase}/collectionGroups/${fo.collectionGroup}/fields/${fo.fieldPath}?updateMask=indexConfig`;
    const body = { indexConfig: { indexes: (fo.indexes || []).map(i => ({
      queryScope: i.queryScope || 'COLLECTION',
      fields: [{ fieldPath: fo.fieldPath, order: i.order || 'ASCENDING' }],
    })) } };
    const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
    if (res.ok) {
      console.log(`[indexes] ✓ field override applied: ${fo.collectionGroup}.${fo.fieldPath}`);
    } else {
      const t = await res.text().catch(() => '');
      console.error(`[indexes] ✗ field override ${fo.collectionGroup}.${fo.fieldPath} (${res.status}): ${t.slice(0, 200)}`);
    }
  }

  // ── Composite indexes ──────────────────────────────────────────────────────
  for (const idx of (cfg.indexes || [])) {
    const url = `${apiBase}/collectionGroups/${idx.collectionGroup}/indexes`;
    const body = {
      queryScope: idx.queryScope || 'COLLECTION',
      fields: (idx.fields || []).map(f => ({
        fieldPath: f.fieldPath,
        ...(f.order ? { order: f.order } : {}),
        ...(f.arrayConfig ? { arrayConfig: f.arrayConfig } : {}),
      })),
    };
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (res.ok || res.status === 409) {
      console.log(`[indexes] ✓ composite index: ${idx.collectionGroup} [${(idx.fields || []).map(f => f.fieldPath).join(', ')}]${res.status === 409 ? ' (already exists)' : ''}`);
    } else {
      const t = await res.text().catch(() => '');
      console.error(`[indexes] ✗ composite index ${idx.collectionGroup} (${res.status}): ${t.slice(0, 200)}`);
    }
  }

  console.log('\n✅ Firestore indexes applied. (Builds run in the background — allow a few minutes.)');
}

main().catch((err) => { console.error(`\n❌ Index deploy failed: ${err.message}`); process.exitCode = 1; });
