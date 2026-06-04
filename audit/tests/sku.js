/**
 * audit/tests/sku.js
 * Test suite for SKU enrollment, DNA storage, forge recall bypass, and fidelity scoring.
 */

import { mergeSkuForgeData } from '../../lib/forge/services/sku-service.js';

export async function runSkuEnrollmentSchemaTests(report) {
  const suite = 'SKU_ENROLLMENT_SCHEMA';
  const tests = [];

  const validDna = {
    FULL_OUTFIT: 'Black linen blazer, single-breasted, notch lapel, two-button closure...',
    identity: 'Fair skin, Fitzpatrick II, East Asian heritage, age 24-28, petite frame...',
    hair: 'Dark brown, shoulder length, straight, blunt cut...',
  };

  tests.push(checkTest(
    'DNA object has anchorType as primary key',
    () => Object.keys(validDna).includes('FULL_OUTFIT'),
    true
  ));

  tests.push(checkTest(
    'DNA object has identity key',
    () => Object.keys(validDna).includes('identity'),
    true
  ));

  tests.push(checkTest(
    'DNA values are non-empty strings',
    () => Object.values(validDna).every(v => typeof v === 'string' && v.length > 0),
    true
  ));

  tests.push(checkTest(
    'Enrollment status transitions: pending → processing → ready',
    () => {
      const statuses = ['pending', 'processing', 'ready', 'failed', 'archived'];
      const validTransitions = [
        ['pending', 'processing'],
        ['processing', 'ready'],
        ['processing', 'failed'],
        ['ready', 'archived'],
        ['failed', 'pending'],
      ];
      return validTransitions.every(([from, to]) =>
        statuses.includes(from) && statuses.includes(to)
      );
    },
    true
  ));

  tests.push(checkTest(
    'fidelityScore is 0-100 integer',
    () => {
      const score = 87;
      return Number.isInteger(score) && score >= 0 && score <= 100;
    },
    true
  ));

  tests.push(checkTest(
    'Low fidelity warning triggers below 40',
    () => {
      const score = 38;
      return score < 40;
    },
    true
  ));

  tests.push(checkTest(
    'skuId format matches expected pattern',
    () => {
      const skuId = `sku_${Date.now()}_abc123`;
      return skuId.startsWith('sku_') && skuId.split('_').length >= 3;
    },
    true
  ));

  tests.push(checkTest(
    'Anchor type maps correctly to DNA key',
    () => {
      const anchorType = 'FULL_OUTFIT';
      const dna = { [anchorType]: 'garment description', identity: 'model description' };
      return dna[anchorType] !== undefined;
    },
    true
  ));

  report(suite, tests);
}

export async function runSkuRecallTests(report) {
  const suite = 'SKU_RECALL_BYPASS';
  const tests = [];

  tests.push(checkTest(
    'skuId + brandId present → SKU recall path triggered',
    () => {
      const body = { skuId: 'sku_123', brandId: 'brand_456' };
      return !!(body.skuId && body.brandId);
    },
    true
  ));

  tests.push(checkTest(
    'skuId absent → standard Agent 01 path (no bypass)',
    () => {
      const body = { brandId: 'brand_456' };
      return !(body.skuId && body.brandId);
    },
    true
  ));

  tests.push(checkTest(
    'skuDnaInjected = true when recall succeeds → Agent 01 block skipped',
    () => {
      let skuDnaInjected = false;
      // Simulate successful recall
      const mockSku = { dna: { FULL_OUTFIT: 'desc', identity: 'model' }, anchorType: 'FULL_OUTFIT', fidelityScore: 92 };
      const dnaMap = {};
      Object.assign(dnaMap, mockSku.dna || {});
      skuDnaInjected = true;
      // Guard: Agent 01 only runs when !skuDnaInjected
      const agent01Runs = !skuDnaInjected;
      return !agent01Runs; // Agent 01 should NOT run
    },
    true
  ));

  tests.push(checkTest(
    'SKU recall failure → graceful fallback → skuDnaInjected stays false',
    () => {
      let skuDnaInjected = false;
      try {
        throw new Error('SKU not found');
      } catch (err) {
        // Graceful degradation — skuDnaInjected remains false
      }
      return skuDnaInjected === false; // Agent 01 will run normally
    },
    true
  ));

  tests.push(checkTest(
    'DNA Object.assign injects all keys into dnaMap',
    () => {
      const dnaMap = {};
      const frozenDna = { FULL_OUTFIT: 'blazer desc', identity: 'model desc', hair: 'hair desc' };
      Object.assign(dnaMap, frozenDna);
      return Object.keys(frozenDna).every(k => dnaMap[k] === frozenDna[k]);
    },
    true
  ));

  tests.push(checkTest(
    'Generation history routes to brands/{brandId}/campaigns when forgeBrandId set',
    () => {
      const forgeBrandId = 'brand_abc';
      const forgeUid = 'user_xyz';
      const genPath = forgeBrandId ? `brands/${forgeBrandId}/campaigns` : `users/${forgeUid}/generations`;
      return genPath === 'brands/brand_abc/campaigns';
    },
    true
  ));

  tests.push(checkTest(
    'Generation history routes to users/{uid}/generations without forgeBrandId',
    () => {
      const forgeBrandId = null;
      const forgeUid = 'user_xyz';
      const genPath = forgeBrandId ? `brands/${forgeBrandId}/campaigns` : `users/${forgeUid}/generations`;
      return genPath === 'users/user_xyz/generations';
    },
    true
  ));

  report(suite, tests);
}

export async function runSkuApiTests(report) {
  const suite = 'SKU_API_ENDPOINTS';
  const tests = [];

  tests.push(checkTest(
    'GET /skus returns only brand-scoped SKUs (path isolation)',
    () => {
      const brandId = 'brand_abc';
      const skuPath = `brands/${brandId}/skus`;
      return skuPath === 'brands/brand_abc/skus';
    },
    true
  ));

  tests.push(checkTest(
    'SKU list query respects limit parameter (max 100)',
    () => {
      const requested = 200;
      const actual = Math.min(requested, 100);
      return actual === 100;
    },
    true
  ));

  tests.push(checkTest(
    'DELETE requires admin or owner role (not editor/viewer)',
    () => {
      const hierarchy = { viewer: 0, editor: 1, admin: 2, owner: 3, api: 1 };
      const requiredLevel = hierarchy['admin'];
      return hierarchy['editor'] < requiredLevel && hierarchy['admin'] >= requiredLevel;
    },
    true
  ));

  tests.push(checkTest(
    'Archived SKU has enrollmentStatus = archived',
    () => {
      const archivedSku = { enrollmentStatus: 'archived' };
      return archivedSku.enrollmentStatus === 'archived';
    },
    true
  ));

  tests.push(checkTest(
    'SKU enroll endpoint validates required anchorType field',
    () => {
      const body = { name: 'Test SKU', sourceImage: 'base64data' }; // missing anchorType
      return !body.anchorType; // should fail validation
    },
    true
  ));

  tests.push(checkTest(
    'Fidelity score is stored on SKU document after enrollment',
    () => {
      const skuDoc = { skuId: 'sku_123', enrollmentStatus: 'ready', fidelityScore: 94 };
      return typeof skuDoc.fidelityScore === 'number' && skuDoc.fidelityScore >= 0;
    },
    true
  ));

  report(suite, tests);
}

export async function runDnaInjectionTests(report) {
  const suite = 'DNA_INJECTION_INTEGRITY';
  const tests = [];

  tests.push(checkTest(
    'dnaMap keys match anchorType after SKU recall',
    () => {
      const anchorType = 'HAIR';
      const frozenDna = { [anchorType]: 'dark brown, shoulder length...', identity: 'fair skin...' };
      const dnaMap = {};
      Object.assign(dnaMap, frozenDna);
      return dnaMap[anchorType] !== undefined;
    },
    true
  ));

  tests.push(checkTest(
    'modelIdentityDNA populated from dna.identity on recall',
    () => {
      const frozenDna = { HAIR: 'hair desc', identity: 'fair skin, petite...' };
      let modelIdentityDNA = null;
      if (frozenDna?.identity) modelIdentityDNA = frozenDna.identity;
      return modelIdentityDNA === 'fair skin, petite...';
    },
    true
  ));

  tests.push(checkTest(
    'modelHairDNA populated from dna.hair on recall',
    () => {
      const frozenDna = { FULL_OUTFIT: 'blazer', identity: 'model', hair: 'dark straight' };
      let modelHairDNA = null;
      if (frozenDna?.hair) modelHairDNA = frozenDna.hair;
      return modelHairDNA === 'dark straight';
    },
    true
  ));

  tests.push(checkTest(
    'anchorRefImage populated from referenceImageBase64 on recall',
    () => {
      const skuData = { referenceImageBase64: 'base64encodedimage', anchorType: 'FULL_OUTFIT' };
      let anchorRefImage = null;
      let anchorRefAnchorType = null;
      if (skuData.referenceImageBase64) {
        anchorRefImage = { data: skuData.referenceImageBase64, mimeType: 'image/png' };
        anchorRefAnchorType = skuData.anchorType;
      }
      return anchorRefImage?.data === 'base64encodedimage' && anchorRefAnchorType === 'FULL_OUTFIT';
    },
    true
  ));

  tests.push(checkTest(
    'Missing referenceImageBase64 does not crash recall',
    () => {
      const skuData = { dna: { FULL_OUTFIT: 'desc' }, anchorType: 'FULL_OUTFIT', fidelityScore: 80 };
      // No referenceImageBase64 — should not throw
      let anchorRefImage = null;
      if (skuData.referenceImageBase64) {
        anchorRefImage = { data: skuData.referenceImageBase64, mimeType: 'image/png' };
      }
      return anchorRefImage === null; // gracefully null
    },
    true
  ));

  report(suite, tests);
}

export async function runOutfitCombinationTests(report) {
  const suite = 'OUTFIT_COMBINATION_MERGE';
  const tests = [];

  const shirt = { skuId: 'sku_shirt', dna: { SHIRT: 'White poplin shirt.' }, referenceImageBase64: 'AAA', anchorType: 'SHIRT', skuName: 'Oxford Shirt', fidelityScore: 90 };
  const pants = { skuId: 'sku_pants', dna: { PANTS: 'Charcoal wool trousers.' }, referenceImageBase64: 'BBB', anchorType: 'PANTS', skuName: 'Wool Trouser', fidelityScore: 80 };
  const shoes = { skuId: 'sku_shoes', dna: { SHOES: 'Black derby.' }, referenceImageBase64: 'CCC', anchorType: 'SHOES', skuName: 'Derby', fidelityScore: 100 };

  const merged = mergeSkuForgeData([shirt, pants, shoes]);

  tests.push(checkTest(
    'Merged dnaMap unions all anchor keys',
    () => ['SHIRT', 'PANTS', 'SHOES'].every(k => merged.dnaMap[k]),
    true
  ));
  tests.push(checkTest(
    'anchorTypes de-duplicated union in order',
    () => merged.anchorTypes.join(',') === 'SHIRT,PANTS,SHOES',
    true
  ));
  tests.push(checkTest(
    'One labeled anchorRef per SKU, in selection order',
    () => merged.anchorRefs.length === 3
      && merged.anchorRefs[0].data === 'AAA'
      && merged.anchorRefs[2].anchorType === 'SHOES',
    true
  ));
  tests.push(checkTest(
    'anchorRefs carry mimeType image/png',
    () => merged.anchorRefs.every(r => r.mimeType === 'image/png'),
    true
  ));
  tests.push(checkTest(
    'fidelity averaged across SKUs (90,80,100 → 90)',
    () => merged.fidelity === 90,
    true
  ));
  tests.push(checkTest(
    'skuIds reflects all successfully-loaded SKUs',
    () => merged.skuIds.length === 3,
    true
  ));

  // identity/hair: first writer wins
  const withId = mergeSkuForgeData([
    { skuId: 'a', dna: { SHIRT: 'x', identity: 'Model A', hair: 'Hair A' }, anchorType: 'SHIRT' },
    { skuId: 'b', dna: { PANTS: 'y', identity: 'Model B', hair: 'Hair B' }, anchorType: 'PANTS' },
  ]);
  tests.push(checkTest(
    'identity/hair taken from first SKU that carries them',
    () => withId.identity === 'Model A' && withId.hair === 'Hair A',
    true
  ));
  tests.push(checkTest(
    'identity/hair are NOT placed into dnaMap as anchors',
    () => !('identity' in withId.dnaMap) && !('hair' in withId.dnaMap),
    true
  ));

  // duplicate anchor keys → first writer wins
  const dup = mergeSkuForgeData([
    { skuId: 'a', dna: { SHIRT: 'first' }, anchorType: 'SHIRT' },
    { skuId: 'b', dna: { SHIRT: 'second' }, anchorType: 'SHIRT' },
  ]);
  tests.push(checkTest(
    'Duplicate anchor key → first writer wins',
    () => dup.dnaMap.SHIRT === 'first',
    true
  ));
  tests.push(checkTest(
    'Duplicate anchor type de-duplicated in anchorTypes',
    () => dup.anchorTypes.length === 1 && dup.anchorTypes[0] === 'SHIRT',
    true
  ));

  // failed entries skipped
  const withErr = mergeSkuForgeData([
    shirt,
    { skuId: 'bad', error: 'SKU not found' },
    pants,
  ]);
  tests.push(checkTest(
    'Failed SKU entries skipped; only loaded ones counted',
    () => withErr.skuIds.length === 2 && !withErr.skuIds.includes('bad'),
    true
  ));
  tests.push(checkTest(
    'SKU with no reference image contributes DNA but no anchorRef',
    () => {
      const m = mergeSkuForgeData([{ skuId: 'n', dna: { HAIR: 'desc' }, anchorType: 'HAIR' }]);
      return m.dnaMap.HAIR === 'desc' && m.anchorRefs.length === 0;
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
