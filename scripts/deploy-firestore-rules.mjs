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

async function main() {
  loadEnv();

  const saVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saVar) throw new Error('FIREBASE_SERVICE_ACCOUNT env var not configured (.env)');

  const serviceAccount = JSON.parse(Buffer.from(saVar, 'base64').toString('utf8'));
  const projectId = serviceAccount.project_id;
  if (!projectId) throw new Error('Service account JSON has no project_id');

  // Normalize double-escaped PEM newlines (\\n → \n) so the signer accepts the key.
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  // Preflight: fail fast with an actionable message if the private key is corrupt,
  // rather than surfacing the cryptic OpenSSL "DECODER routines::unsupported".
  try {
    createPrivateKey({ key: serviceAccount.private_key, format: 'pem' });
  } catch {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT private_key is corrupt or truncated and cannot be parsed.\n' +
      '   Re-copy the full service-account credential (base64-encoded JSON) into .env,\n' +
      '   e.g. from the Vercel project env (vercel env pull) or the original key file.',
    );
  }

  const rulesSource = readFileSync(join(ROOT, 'firestore.rules'), 'utf8');

  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error('Failed to mint access token from service account');

  const api = `https://firebaserules.googleapis.com/v1/projects/${projectId}`;
  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

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
