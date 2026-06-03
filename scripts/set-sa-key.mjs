#!/usr/bin/env node
/**
 * scripts/set-sa-key.mjs
 * ----------------------------------------------------------------------------
 * Safely set FIREBASE_SERVICE_ACCOUNT in .env from a downloaded service-account
 * JSON file. Validates the private key parses (so you never store a corrupt key
 * again), base64-encodes the JSON, and updates .env in place — no manual copy,
 * paste, or base64 step.
 *
 *   node scripts/set-sa-key.mjs "C:\\path\\to\\downloaded-key.json"
 * ----------------------------------------------------------------------------
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createPrivateKey } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = join(ROOT, '.env');

function main() {
  const keyPath = process.argv[2];
  if (!keyPath) throw new Error('Usage: node scripts/set-sa-key.mjs <path-to-service-account.json>');
  if (!existsSync(keyPath)) throw new Error(`File not found: ${keyPath}`);

  const raw = readFileSync(keyPath, 'utf8');
  const sa = JSON.parse(raw); // throws if not valid JSON

  if (sa.type !== 'service_account') throw new Error('Not a service-account JSON (missing "type": "service_account")');
  if (!sa.project_id) throw new Error('JSON has no project_id');
  if (!sa.private_key) throw new Error('JSON has no private_key');

  // Validate the key actually parses — guarantees we never store a corrupt one.
  createPrivateKey({ key: sa.private_key.replace(/\\n/g, '\n'), format: 'pem' });

  const b64 = Buffer.from(JSON.stringify(sa)).toString('base64');

  let env = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, 'utf8') : '';
  const line = `FIREBASE_SERVICE_ACCOUNT=${b64}`;
  if (/^FIREBASE_SERVICE_ACCOUNT=.*$/m.test(env)) {
    env = env.replace(/^FIREBASE_SERVICE_ACCOUNT=.*$/m, line);
  } else {
    env = env.replace(/\s*$/, '') + `\n${line}\n`;
  }
  writeFileSync(ENV_PATH, env, 'utf8');

  console.log(`✅ FIREBASE_SERVICE_ACCOUNT updated in .env`);
  console.log(`   project: ${sa.project_id}`);
  console.log(`   client : ${sa.client_email}`);
  console.log(`   key parses cleanly — deploy with: node scripts/deploy-firestore-rules.mjs`);
}

try { main(); }
catch (err) { console.error(`❌ ${err.message}`); process.exitCode = 1; }
