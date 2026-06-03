#!/usr/bin/env node
/**
 * scripts/deploy-firestore-rules.mjs
 * ----------------------------------------------------------------------------
 * Level 5 Enterprise — deploy firestore.rules via the Firebase Rules REST API
 * using the FIREBASE_SERVICE_ACCOUNT credential already provisioned in .env.
 *
 * No firebase-tools CLI, no interactive browser login. Mirrors the raw-REST
 * service-account auth pattern used throughout lib/forge/services/gcp-raw.js.
 *
 *   node scripts/deploy-firestore-rules.mjs
 *
 * The service account must hold roles/firebaserules.admin (or Editor/Owner).
 * Flow:
 *   1. Mint a cloud-platform access token from the SA.
 *   2. Create a new ruleset from firestore.rules.
 *   3. Point the cloud.firestore release at the new ruleset (PATCH, else POST).
 * ----------------------------------------------------------------------------
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createPrivateKey } from 'node:crypto';
import { GoogleAuth } from 'google-auth-library';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Minimal .env loader (dotenv is not a dependency) ───────────────────────
function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    // .env optional if the var is already exported in the environment
  }
}

// Parse the service-account JSON (project_id is readable even if the key is bad).
function parseServiceAccount() {
  const saVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saVar) return null;
  try {
    const sa = JSON.parse(Buffer.from(saVar, 'base64').toString('utf8'));
    if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
    return sa;
  } catch { return null; }
}

function saKeyIsValid(sa) {
  if (!sa?.private_key) return false;
  try { createPrivateKey({ key: sa.private_key, format: 'pem' }); return true; }
  catch { return false; }
}

// Acquire a cloud-platform access token via the best available method:
//   1. valid FIREBASE_SERVICE_ACCOUNT  → service-account JWT (preferred, no human)
//   2. gcloud auth print-access-token  → the operator's own login (one-time browser)
//   3. GOOGLE_ACCESS_TOKEN env         → explicitly supplied token
// Returns { token, source }.
async function acquireToken(sa) {
  if (process.env.GOOGLE_ACCESS_TOKEN) {
    return { token: process.env.GOOGLE_ACCESS_TOKEN.trim(), source: 'GOOGLE_ACCESS_TOKEN' };
  }
  if (saKeyIsValid(sa)) {
    const auth = new GoogleAuth({ credentials: sa, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    const { token } = await client.getAccessToken();
    if (token) return { token, source: 'service-account' };
  }
  // gcloud fallback — uses the operator's existing `gcloud auth login` session.
  try {
    const { execFileSync } = await import('node:child_process');
    const cmd = process.platform === 'win32' ? 'gcloud.cmd' : 'gcloud';
    const out = execFileSync(cmd, ['auth', 'print-access-token'], { encoding: 'utf8' }).trim();
    if (out && out.length > 40 && !/error/i.test(out)) return { token: out, source: 'gcloud' };
  } catch { /* gcloud absent or not logged in */ }
  return { token: null, source: null };
}

async function main() {
  loadEnv();

  const sa = parseServiceAccount();
  const projectId =
    process.env.GCP_PROJECT_ID ||
    sa?.project_id ||
    process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Cannot determine project id (set GCP_PROJECT_ID or VITE_FIREBASE_PROJECT_ID in .env)');

  const { token, source } = await acquireToken(sa);
  if (!token) {
    throw new Error(
      'No usable Google credential found. Pick ONE:\n' +
      '   • Restore a valid FIREBASE_SERVICE_ACCOUNT (base64 JSON) in .env, OR\n' +
      '   • Run `gcloud auth login` (one browser step) — this script will then use it, OR\n' +
      '   • Set GOOGLE_ACCESS_TOKEN to a cloud-platform token.\n' +
      `   (The local FIREBASE_SERVICE_ACCOUNT private_key is ${sa ? 'corrupt/unparseable' : 'absent'}.)`,
    );
  }

  const rulesSource = readFileSync(join(ROOT, 'firestore.rules'), 'utf8');
  console.log(`[rules] auth via: ${source}`);

  const api = `https://firebaserules.googleapis.com/v1/projects/${projectId}`;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    // X-Goog-User-Project sets the quota/billing project — required ONLY for user
    // tokens (gcloud/ADC), which carry no project. A service-account token already
    // has its project; adding the header forces an extra serviceusage.use check the
    // SA may not hold, so we omit it in that case.
    ...(source === 'service-account' ? {} : { 'X-Goog-User-Project': projectId }),
  };

  console.log(`[rules] project: ${projectId}`);
  console.log(`[rules] source : firestore.rules (${rulesSource.length} bytes)`);

  // 1. Create ruleset
  const createRes = await fetch(`${api}/rulesets`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      source: { files: [{ name: 'firestore.rules', content: rulesSource }] },
    }),
  });
  if (!createRes.ok) {
    const detail = await createRes.text().catch(() => '');
    throw new Error(`Ruleset create failed (${createRes.status}): ${detail}`);
  }
  const ruleset = await createRes.json();
  const rulesetName = ruleset.name; // projects/{projectId}/rulesets/{uuid}
  console.log(`[rules] ruleset created: ${rulesetName}`);

  // 2. Point the cloud.firestore release at the new ruleset.
  const releaseName = `projects/${projectId}/releases/cloud.firestore`;
  const patchRes = await fetch(`${api}/releases/cloud.firestore`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ release: { name: releaseName, rulesetName } }),
  });

  if (patchRes.ok) {
    console.log(`[rules] release updated: ${releaseName} → ${rulesetName}`);
  } else if (patchRes.status === 404) {
    // No existing release — create it.
    const postRes = await fetch(`${api}/releases`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: releaseName, rulesetName }),
    });
    if (!postRes.ok) {
      const detail = await postRes.text().catch(() => '');
      throw new Error(`Release create failed (${postRes.status}): ${detail}`);
    }
    console.log(`[rules] release created: ${releaseName} → ${rulesetName}`);
  } else {
    const detail = await patchRes.text().catch(() => '');
    throw new Error(`Release update failed (${patchRes.status}): ${detail}`);
  }

  console.log('\n✅ Firestore rules deployed to production.');
}

main().catch((err) => {
  console.error(`\n❌ Deploy failed: ${err.message}`);
  process.exitCode = 1;
});
