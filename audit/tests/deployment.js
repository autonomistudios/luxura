/**
 * audit/tests/deployment.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Deployment correctness tests — three categories:
 *
 *   1. VERCEL CONFIG (static)   — vercel.json rewrite/header rules can't
 *                                 swallow API routes or block required headers.
 *                                 Runs without --live. Catches the exact class
 *                                 of bug that caused brands/auth to return 401
 *                                 (catch-all rewrite intercepted /api/v1/ paths).
 *
 *   2. ENV VAR PREFLIGHT (static) — all required env vars present in .env /
 *                                   current process, SA key private_key parses.
 *                                   Catches the corrupt-key class of bug before
 *                                   it reaches production.
 *
 *   3. API SMOKE TESTS (live)   — every real endpoint returns the right HTTP
 *                                 status (not HTML, not wrong-status from a
 *                                 routing failure). Runs only with --live.
 *                                 Catches deployment config failures that only
 *                                 manifest against a running environment.
 *
 * Usage:
 *   node audit/index.js              — runs 1 + 2 (static)
 *   node audit/index.js --live       — runs 1 + 2 + 3
 *   AUDIT_URL=https://... node audit/index.js --live
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createPrivateKey } from 'node:crypto';

const ROOT    = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BASE_URL = process.env.AUDIT_URL || 'https://luxaurastudio.vercel.app';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function assert(condition, label, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS  ${label}`);
    return { pass: true, label };
  }
  console.error(`  ❌ FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  return { pass: false, label, detail };
}

function warn(label, detail = '') {
  console.warn(`  ⚠️  WARN  ${label}${detail ? ` — ${detail}` : ''}`);
  return { pass: null, label, detail };
}

async function httpGet(path, headers = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const r = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Accept': 'application/json', ...headers },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const ct = r.headers.get('content-type') || '';
    let json = null;
    try { if (ct.includes('json')) json = await r.json(); } catch {}
    return { status: r.status, json, contentType: ct, ok: r.ok };
  } catch (err) {
    clearTimeout(timeout);
    return { status: 0, json: null, error: err.message };
  }
}

async function httpPost(path, body = {}, headers = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const r = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const ct = r.headers.get('content-type') || '';
    let json = null;
    try { if (ct.includes('json')) json = await r.json(); } catch {}
    return { status: r.status, json, contentType: ct, ok: r.ok };
  } catch (err) {
    clearTimeout(timeout);
    return { status: 0, json: null, error: err.message };
  }
}

function isHtml(res) {
  return res.contentType?.includes('text/html') || false;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1: VERCEL CONFIG (static)
// ─────────────────────────────────────────────────────────────────────────────
export async function runVercelConfigTests() {
  const results = [];
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  DEPLOYMENT: VERCEL CONFIG');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const vPath = join(ROOT, 'vercel.json');
  let v;
  try {
    v = JSON.parse(readFileSync(vPath, 'utf8'));
  } catch {
    results.push(assert(false, 'vercel.json is present and valid JSON'));
    return results;
  }
  results.push(assert(true, 'vercel.json is present and valid JSON'));

  // ── Rewrite safety ─────────────────────────────────────────────────────────
  const rewrites = v.rewrites || [];

  // The exact bug we fixed: catch-all /(.*) rewrite intercepting /api/v1/ routes.
  // Any rewrite whose source matches /api/v1/brands/auth is a routing failure.
  function rewriteWouldMatchApiV1(source) {
    // Patterns known to swallow API routes: /(.*), /(.+), no exclusion
    if (source === '/(.*)' || source === '/(.+)') return true;
    // Pattern that correctly excludes API: /((?!api/).*)
    if (/\(\?!api/.test(source)) return false;
    // Any other catch-all without api exclusion is suspect
    if (/^\/(\..*|\(\..*\))$/.test(source) && !/api/.test(source)) return true;
    return false;
  }

  const dangerousRewrites = rewrites.filter(r => rewriteWouldMatchApiV1(r.source));
  results.push(assert(
    dangerousRewrites.length === 0,
    'No catch-all rewrite intercepts /api/ routes (prevents brands/auth 401 class of bug)',
    dangerousRewrites.length > 0
      ? `Dangerous: ${dangerousRewrites.map(r => r.source).join(', ')} — must exclude /api/`
      : '',
  ));

  // SPA rewrite exists (app still routes correctly for React Router)
  const spaRewrite = rewrites.find(r => r.destination === '/index.html');
  results.push(assert(!!spaRewrite, 'SPA catch-all rewrite to /index.html exists'));

  // /api/ routes should NOT have a rewrite pointing to index.html
  const apiToHtml = rewrites.filter(r =>
    r.destination === '/index.html' && (r.source === '/api/(.*)' || r.source === '/api/(.+)')
  );
  results.push(assert(
    apiToHtml.length === 0,
    'No rewrite sends /api/* to index.html',
    apiToHtml.length ? `Found: ${JSON.stringify(apiToHtml)}` : '',
  ));

  // ── Critical functions declared ────────────────────────────────────────────
  const fns = v.functions || {};
  const criticalFunctions = [
    'api/forge.js',
    'api/brands/onboard.js',
    'api/v1/brands/auth.js',
    'api/v1/skus/enroll.js',
  ];
  for (const fn of criticalFunctions) {
    results.push(assert(fn in fns, `Function declared in vercel.json: ${fn}`));
  }

  // ── forge.js timeout is sufficient (≥ 120s) ────────────────────────────────
  const forgeTimeout = fns['api/forge.js']?.maxDuration ?? 0;
  results.push(assert(
    forgeTimeout >= 120,
    `forge.js maxDuration ≥ 120s (got ${forgeTimeout}s)`,
    forgeTimeout < 120 ? 'Too short — 6-slot generation can take 90–180s' : '',
  ));

  // ── Cron expressions are valid ─────────────────────────────────────────────
  const crons = v.crons || [];
  for (const cron of crons) {
    const parts = (cron.schedule || '').trim().split(/\s+/);
    results.push(assert(
      parts.length === 5,
      `Cron schedule is valid 5-part cron: ${cron.path} (${cron.schedule})`,
      parts.length !== 5 ? `Got ${parts.length} parts` : '',
    ));
  }

  // ── Security headers present ───────────────────────────────────────────────
  const headers = (v.headers || []).flatMap(h => h.headers || []).map(h => h.key);
  results.push(assert(
    headers.includes('X-Frame-Options'),
    'Security header X-Frame-Options is set',
  ));
  results.push(assert(
    headers.includes('X-Content-Type-Options'),
    'Security header X-Content-Type-Options is set',
  ));

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2: ENV VAR PREFLIGHT (static)
// ─────────────────────────────────────────────────────────────────────────────
export async function runEnvPreflightTests() {
  const results = [];
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  DEPLOYMENT: ENV VAR PREFLIGHT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Load .env if present (server-side vars, not VITE_ ones)
  const envPath = join(ROOT, '.env');
  const envVars = { ...process.env };
  if (existsSync(envPath)) {
    try {
      const raw = readFileSync(envPath, 'utf8');
      for (const line of raw.split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        let val = m[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
        if (!(m[1] in envVars)) envVars[m[1]] = val;
      }
    } catch { /* .env optional */ }
  }

  function has(key) { return !!envVars[key]; }

  // ── Required server-side vars ──────────────────────────────────────────────
  const required = [
    ['FIREBASE_SERVICE_ACCOUNT',  'Service account for Firestore + Storage (base64 JSON)'],
    ['VITE_FIREBASE_API_KEY',     'Firebase client API key (token verification fallback)'],
    ['VITE_FIREBASE_PROJECT_ID',  'Firebase project id'],
    ['VITE_FIREBASE_AUTH_DOMAIN', 'Firebase auth domain'],
    ['GOOGLE_API_KEY',            'Gemini / Vertex AI API key'],
    ['CRON_SECRET',               'Guards cron endpoints from unauthenticated callers'],
  ];

  for (const [key, desc] of required) {
    results.push(assert(has(key), `Env var present: ${key}`, desc));
  }

  // ── Optional but important ─────────────────────────────────────────────────
  const optional = [
    ['FIREBASE_API_KEY',      'Server-side token verification key (fallbacks to VITE_ if absent)'],
    ['FASHN_API_KEY',         'FASHN.ai VTO integration'],
    ['WEBHOOK_SECRET',        'Stripe / webhook signature verification'],
  ];
  for (const [key, desc] of optional) {
    if (!has(key)) {
      results.push(warn(`Env var absent (optional): ${key}`, desc));
    } else {
      results.push(assert(true, `Env var present (optional): ${key}`));
    }
  }

  // ── FIREBASE_SERVICE_ACCOUNT: base64, valid JSON, key parses ──────────────
  const saVar = envVars['FIREBASE_SERVICE_ACCOUNT'];
  if (saVar) {
    let sa = null;
    try {
      sa = JSON.parse(Buffer.from(saVar, 'base64').toString('utf8'));
      results.push(assert(true, 'FIREBASE_SERVICE_ACCOUNT decodes to valid JSON'));
    } catch {
      results.push(assert(false, 'FIREBASE_SERVICE_ACCOUNT decodes to valid JSON',
        'base64 decode or JSON.parse failed — re-run: node scripts/set-sa-key.mjs <key.json>'));
    }

    if (sa) {
      results.push(assert(
        sa.type === 'service_account',
        'SA JSON type === "service_account"',
      ));
      results.push(assert(!!sa.project_id, 'SA JSON has project_id'));
      results.push(assert(!!sa.client_email, 'SA JSON has client_email'));

      // The key that corrupted production: validate private_key actually parses
      const pk = sa.private_key ? sa.private_key.replace(/\\n/g, '\n') : null;
      if (pk) {
        try {
          createPrivateKey({ key: pk, format: 'pem' });
          results.push(assert(true, 'SA private_key parses as valid PEM (no corruption)'));
        } catch {
          results.push(assert(false, 'SA private_key parses as valid PEM (no corruption)',
            'Key is corrupt — run: node scripts/set-sa-key.mjs <fresh-key.json>'));
        }
      } else {
        results.push(assert(false, 'SA JSON has private_key field'));
      }
    }
  }

  // ── VITE_ vars are not accidentally used server-side as primary ────────────
  // VITE_ vars are bundled into the client build — they should NOT be the sole
  // token-verification key if FIREBASE_API_KEY is absent, because the Vite
  // bundler may strip or transform them. Warn if FIREBASE_API_KEY is absent.
  if (!has('FIREBASE_API_KEY') && has('VITE_FIREBASE_API_KEY')) {
    results.push(warn(
      'FIREBASE_API_KEY absent — server falls back to VITE_FIREBASE_API_KEY',
      'Works but fragile. Set FIREBASE_API_KEY to the same value for clarity.',
    ));
  }

  // ── Project id consistency ─────────────────────────────────────────────────
  const saProjectId = (() => {
    try {
      return JSON.parse(Buffer.from(saVar || '', 'base64').toString('utf8'))?.project_id;
    } catch { return null; }
  })();
  const viteProjectId = envVars['VITE_FIREBASE_PROJECT_ID'];
  if (saProjectId && viteProjectId) {
    results.push(assert(
      saProjectId === viteProjectId,
      `SA project_id matches VITE_FIREBASE_PROJECT_ID (both: ${saProjectId})`,
      saProjectId !== viteProjectId
        ? `SA says "${saProjectId}", VITE says "${viteProjectId}" — credential mismatch`
        : '',
    ));
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3: API SMOKE TESTS (live only)
// Hits every real endpoint and asserts:
//   • Correct HTTP status (not HTML, not routing-failure 401/404)
//   • JSON response (not index.html served by catch-all rewrite)
//   • No server crash (not 500)
// Auth-required endpoints are tested for correct 401 rejection (no token),
// proving they ARE reachable (not swallowed by a rewrite returning HTML).
// ─────────────────────────────────────────────────────────────────────────────
export async function runApiSmokeTests() {
  const results = [];
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  DEPLOYMENT: API SMOKE TESTS (live → ${BASE_URL})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Helper: assert endpoint is reachable (not swallowed by rewrite).
  // An auth-required endpoint with no token must return 401 JSON, NOT:
  //   - 200 + HTML (rewrite served index.html)
  //   - 404 (function not deployed / path wrong)
  //   - 0   (timeout / network error)
  function checkReachable(res, label) {
    const notHtml  = assert(!isHtml(res),    `${label}: response is JSON (not HTML from rewrite)`,
      isHtml(res) ? 'Got HTML — rewrite is intercepting the API path' : '');
    const not404   = assert(res.status !== 404, `${label}: not 404 (function deployed)`,
      res.status === 404 ? 'Function not found — check vercel.json functions config' : '');
    const notTimeout = assert(res.status !== 0, `${label}: endpoint reachable (no timeout)`,
      res.status === 0 ? `Network error: ${res.error}` : '');
    return [notHtml, not404, notTimeout];
  }

  // ── Portal API surface ─────────────────────────────────────────────────────

  // brands/auth — THE endpoint that caused the loop. Must return 401 JSON, not HTML.
  const brandsAuth = await httpGet('/api/v1/brands/auth');
  results.push(...checkReachable(brandsAuth, 'GET /api/v1/brands/auth'));
  results.push(assert(brandsAuth.status === 401,
    'GET /api/v1/brands/auth: no-token → 401 (not 200/HTML from rewrite)',
    `got ${brandsAuth.status}${isHtml(brandsAuth) ? ' (HTML — rewrite is swallowing this route!)' : ''}`));

  // brands/onboard — POST with no body, should 401 (no token)
  const onboard = await httpPost('/api/brands/onboard', {});
  results.push(...checkReachable(onboard, 'POST /api/brands/onboard'));
  results.push(assert(onboard.status === 401,
    'POST /api/brands/onboard: no-token → 401',
    `got ${onboard.status}`));

  // SKU list — auth required
  const skuList = await httpGet('/api/v1/skus');
  results.push(...checkReachable(skuList, 'GET /api/v1/skus'));
  results.push(assert(skuList.status === 401 || skuList.status === 403,
    'GET /api/v1/skus: no-token → 401/403',
    `got ${skuList.status}`));

  // SKU enroll — auth required
  const skuEnroll = await httpPost('/api/v1/skus/enroll', {});
  results.push(...checkReachable(skuEnroll, 'POST /api/v1/skus/enroll'));
  results.push(assert(skuEnroll.status === 401 || skuEnroll.status === 403,
    'POST /api/v1/skus/enroll: no-token → 401/403',
    `got ${skuEnroll.status}`));

  // Forge — auth required
  const forge = await httpPost('/api/forge', {});
  results.push(...checkReachable(forge, 'POST /api/forge'));
  results.push(assert(forge.status === 401,
    'POST /api/forge: no-token → 401',
    `got ${forge.status}`));

  // Forge iterate — auth required
  const forgeIter = await httpPost('/api/forge-iterate', {});
  results.push(...checkReachable(forgeIter, 'POST /api/forge-iterate'));
  results.push(assert(forgeIter.status === 401,
    'POST /api/forge-iterate: no-token → 401',
    `got ${forgeIter.status}`));

  // Vault deploy — auth required
  const vaultDeploy = await httpPost('/api/vault-deploy', {});
  results.push(...checkReachable(vaultDeploy, 'POST /api/vault-deploy'));
  results.push(assert(vaultDeploy.status === 401 || vaultDeploy.status === 400,
    'POST /api/vault-deploy: no-token → 4xx',
    `got ${vaultDeploy.status}`));

  // Team — auth required
  const team = await httpGet('/api/v1/team');
  results.push(...checkReachable(team, 'GET /api/v1/team'));
  results.push(assert(team.status === 401 || team.status === 403,
    'GET /api/v1/team: no-token → 401/403',
    `got ${team.status}`));

  // Usage — auth required
  const usage = await httpGet('/api/v1/usage');
  results.push(...checkReachable(usage, 'GET /api/v1/usage'));
  results.push(assert(usage.status === 401 || usage.status === 403,
    'GET /api/v1/usage: no-token → 401/403',
    `got ${usage.status}`));

  // API key issue — owner only
  const apiKey = await httpPost('/api/v1/api-key/issue', {});
  results.push(...checkReachable(apiKey, 'POST /api/v1/api-key/issue'));
  results.push(assert(apiKey.status === 401 || apiKey.status === 403,
    'POST /api/v1/api-key/issue: no-token → 401/403',
    `got ${apiKey.status}`));

  // Docs — public, should 200
  const docs = await httpGet('/api/v1/docs');
  results.push(...checkReachable(docs, 'GET /api/v1/docs'));
  results.push(assert(docs.status === 200,
    'GET /api/v1/docs: public → 200',
    `got ${docs.status}`));

  // ── SPA routing still works ────────────────────────────────────────────────
  // Non-API route should serve index.html (SPA), not 404
  const spa = await httpGet('/portal/skus');
  results.push(assert(
    spa.status === 200 && isHtml(spa),
    'GET /portal/skus: SPA route → 200 HTML (React Router handles it)',
    spa.status !== 200 ? `got ${spa.status}` : '',
  ));

  // Root — 200 HTML
  const root = await httpGet('/');
  results.push(assert(
    root.status === 200 && isHtml(root),
    'GET /: root → 200 HTML',
    root.status !== 200 ? `got ${root.status}` : '',
  ));

  // ── Method enforcement ─────────────────────────────────────────────────────
  const forgeGet = await httpGet('/api/forge');
  results.push(assert(forgeGet.status === 405,
    'GET /api/forge → 405 Method Not Allowed (not 404/HTML)',
    `got ${forgeGet.status}`));

  return results;
}
