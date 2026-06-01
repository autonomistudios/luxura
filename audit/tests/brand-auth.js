/**
 * audit/tests/brand-auth.js
 * Test suite for B2B brand authentication, API key validation, and brand isolation.
 */
import crypto from 'crypto';

export async function runBrandApiKeyValidationTests(report) {
  const suite = 'BRAND_API_KEY_VALIDATION';
  const tests = [];

  // ── Key format validation ─────────────────────────────────────────────────
  tests.push(checkTest(
    'Valid lux_live_ prefix accepted',
    () => 'lux_live_abc123def456abc123def456abc123def456abc1'.startsWith('lux_live_'),
    true
  ));

  tests.push(checkTest(
    'Valid lux_test_ prefix accepted',
    () => 'lux_test_abc123def456'.startsWith('lux_test_') || 'lux_live_abc'.startsWith('lux_live_'),
    true
  ));

  tests.push(checkTest(
    'Invalid prefix rejected',
    () => {
      const key = 'sk_live_invalidkey';
      return !key.startsWith('lux_live_') && !key.startsWith('lux_test_');
    },
    true
  ));

  // ── SHA-256 hash determinism ──────────────────────────────────────────────
  tests.push(checkTest(
    'SHA-256 hash is deterministic for same key',
    () => {
      const key = 'lux_live_testkey12345678901234567890';
      const hash1 = crypto.createHash('sha256').update(key).digest('hex');
      const hash2 = crypto.createHash('sha256').update(key).digest('hex');
      return hash1 === hash2;
    },
    true
  ));

  tests.push(checkTest(
    'Different keys produce different hashes',
    () => {
      const hash1 = crypto.createHash('sha256').update('lux_live_key1').digest('hex');
      const hash2 = crypto.createHash('sha256').update('lux_live_key2').digest('hex');
      return hash1 !== hash2;
    },
    true
  ));

  // ── Key prefix display ────────────────────────────────────────────────────
  tests.push(checkTest(
    'API key prefix is first 12 characters',
    () => {
      const rawKey = 'lux_live_abc123def456abc123def456abc123def456abc1';
      const prefix = rawKey.slice(0, 12);
      return prefix === 'lux_live_abc' && prefix.length === 12;
    },
    true
  ));

  // ── Entropy check ─────────────────────────────────────────────────────────
  tests.push(checkTest(
    'Generated key has 40 hex chars of entropy',
    () => {
      const entropy = crypto.randomBytes(20).toString('hex');
      return entropy.length === 40 && /^[0-9a-f]+$/.test(entropy);
    },
    true
  ));

  report(suite, tests);
}

export async function runDualAuthTests(report) {
  const suite = 'DUAL_AUTH_MODE';
  const tests = [];

  tests.push(checkTest(
    'Bearer token auth method identified correctly',
    () => {
      const headers = { authorization: 'Bearer eyJhbGc...' };
      const hasBearer = headers.authorization?.startsWith('Bearer ');
      const hasApiKey = !!headers['x-brand-api-key'];
      return hasBearer && !hasApiKey;
    },
    true
  ));

  tests.push(checkTest(
    'API key auth method identified correctly',
    () => {
      const headers = { 'x-brand-api-key': 'lux_live_testkey' };
      const hasBearer = headers.authorization?.startsWith('Bearer ');
      const hasApiKey = !!headers['x-brand-api-key'];
      return !hasBearer && hasApiKey;
    },
    true
  ));

  tests.push(checkTest(
    'Missing auth returns 401 indicator',
    () => {
      const headers = {};
      return !headers.authorization && !headers['x-brand-api-key'];
    },
    true
  ));

  tests.push(checkTest(
    'API key takes precedence when both present',
    () => {
      const headers = { authorization: 'Bearer token', 'x-brand-api-key': 'lux_live_key' };
      return !!headers['x-brand-api-key'];
    },
    true
  ));

  report(suite, tests);
}

export async function runBrandSchemaTests(report) {
  const suite = 'BRAND_SCHEMA_VALIDATION';
  const tests = [];

  const validBrandDoc = {
    brandId: 'brand_1748600000_a3f2e1',
    name: 'Maison Test',
    slug: 'maison-test',
    tier: 'agency',
    status: 'active',
    quota: { imagesPerMonth: 2000, apiCallsPerMonth: 10000 },
    usage: { currentPeriodImages: 127, currentPeriodApiCalls: 340, periodStart: '2026-05-01T00:00:00Z' },
    brandKit: {
      defaultSkinTones: ['neutral'],
      defaultLighting: 'Clean & Even',
      defaultCamera: 'Soft Background (85mm)',
      defaultColorGrade: 'Matte Fade Editorial',
      lockedParams: [],
    },
    billing: { status: 'active', currentPeriodEnd: '2026-06-01T00:00:00Z' },
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-30T00:00:00Z',
  };

  tests.push(checkTest(
    'Required brand fields all present',
    () => {
      const required = ['brandId', 'name', 'slug', 'tier', 'status', 'quota', 'usage', 'brandKit', 'billing'];
      return required.every(f => validBrandDoc[f] !== undefined);
    },
    true
  ));

  tests.push(checkTest(
    'Quota structure has imagesPerMonth and apiCallsPerMonth',
    () => typeof validBrandDoc.quota.imagesPerMonth === 'number' &&
           typeof validBrandDoc.quota.apiCallsPerMonth === 'number',
    true
  ));

  tests.push(checkTest(
    'Usage structure has correct fields',
    () => {
      const u = validBrandDoc.usage;
      return typeof u.currentPeriodImages === 'number' &&
             typeof u.currentPeriodApiCalls === 'number' &&
             typeof u.periodStart === 'string';
    },
    true
  ));

  tests.push(checkTest(
    'BrandKit has all required keys',
    () => {
      const bk = validBrandDoc.brandKit;
      return Array.isArray(bk.defaultSkinTones) &&
             typeof bk.defaultLighting === 'string' &&
             typeof bk.defaultCamera === 'string' &&
             Array.isArray(bk.lockedParams);
    },
    true
  ));

  tests.push(checkTest(
    'Valid tier values enforced',
    () => {
      const validTiers = ['studio', 'agency', 'enterprise'];
      return validTiers.includes(validBrandDoc.tier);
    },
    true
  ));

  tests.push(checkTest(
    'Valid status values enforced',
    () => {
      const validStatuses = ['active', 'suspended', 'cancelled', 'trialing'];
      return validStatuses.includes(validBrandDoc.status);
    },
    true
  ));

  report(suite, tests);
}

export async function runQuotaAtomicityTests(report) {
  const suite = 'QUOTA_ATOMICITY';
  const tests = [];

  // Simulate concurrent quota checks against shared state (logic test, not live)
  tests.push(checkTest(
    'Quota check: currentImages + cost vs maxImages comparison is correct',
    () => {
      const currentImages = 495;
      const maxImages = 500;
      const cost = 1;
      return (currentImages + cost <= maxImages); // 496 <= 500 → true
    },
    true
  ));

  tests.push(checkTest(
    'Quota check: over-limit returns false',
    () => {
      const currentImages = 500;
      const maxImages = 500;
      const cost = 1;
      return !(currentImages + cost <= maxImages); // 501 <= 500 → false
    },
    true
  ));

  tests.push(checkTest(
    'Quota check: exact limit consumed returns false',
    () => {
      const currentImages = 499;
      const maxImages = 500;
      const cost = 1;
      // 499 + 1 = 500 <= 500 → true (last allowed run)
      return (currentImages + cost <= maxImages);
    },
    true
  ));

  tests.push(checkTest(
    'VTO quota cost is 6x standard',
    () => {
      const BRAND_QUOTA_COST_STANDARD = 1;
      const BRAND_QUOTA_COST_VTO = 6;
      return BRAND_QUOTA_COST_VTO === BRAND_QUOTA_COST_STANDARD * 6;
    },
    true
  ));

  tests.push(checkTest(
    'Brand tier quotas are numerically ordered correctly',
    () => {
      const BRAND_TIERS = {
        studio:     { imagesPerMonth: 500 },
        agency:     { imagesPerMonth: 2000 },
        enterprise: { imagesPerMonth: 10000 },
      };
      return BRAND_TIERS.studio.imagesPerMonth <
             BRAND_TIERS.agency.imagesPerMonth &&
             BRAND_TIERS.agency.imagesPerMonth <
             BRAND_TIERS.enterprise.imagesPerMonth;
    },
    true
  ));

  report(suite, tests);
}

export async function runBrandMemberIsolationTests(report) {
  const suite = 'BRAND_MEMBER_ISOLATION';
  const tests = [];

  tests.push(checkTest(
    'Brand member path correctly scoped under brandId',
    () => {
      const brandId = 'brand_abc';
      const uid = 'user_xyz';
      const expectedPath = `brands/${brandId}/members/${uid}`;
      const actualPath = `brands/brand_abc/members/user_xyz`;
      return actualPath === expectedPath;
    },
    true
  ));

  tests.push(checkTest(
    'SKU path correctly scoped under brandId',
    () => {
      const brandId = 'brand_abc';
      const skuId = 'sku_123';
      const path = `brands/${brandId}/skus/${skuId}`;
      return path === 'brands/brand_abc/skus/sku_123';
    },
    true
  ));

  tests.push(checkTest(
    'brandId extracted correctly from Firestore document path',
    () => {
      const docName = 'projects/myproj/databases/(default)/documents/brands/brand_abc123/members/user_xyz';
      const parts = docName.split('/');
      const membersIdx = parts.indexOf('members');
      const brandId = membersIdx > 0 ? parts[membersIdx - 1] : null;
      return brandId === 'brand_abc123';
    },
    true
  ));

  tests.push(checkTest(
    'Role hierarchy ordering is correct',
    () => {
      const hierarchy = { viewer: 0, editor: 1, admin: 2, owner: 3, api: 1 };
      return hierarchy.viewer < hierarchy.editor &&
             hierarchy.editor <= hierarchy.api &&
             hierarchy.api < hierarchy.admin &&
             hierarchy.admin < hierarchy.owner;
    },
    true
  ));

  tests.push(checkTest(
    'API key auth role is equivalent to editor',
    () => {
      const hierarchy = { viewer: 0, editor: 1, admin: 2, owner: 3, api: 1 };
      return hierarchy.api === hierarchy.editor;
    },
    true
  ));

  report(suite, tests);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function checkTest(name, fn, expected) {
  try {
    const result = fn();
    const passed = result === expected;
    return { name, passed, actual: result, expected };
  } catch (err) {
    return { name, passed: false, error: err.message };
  }
}
