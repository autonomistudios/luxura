#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║   LUXAURA CREATION STUDIO 2 — SOVEREIGN AUDIT SYSTEM v1.0                  ║
 * ║                                                                              ║
 * ║   4th-party adversarial audit with full system access.                      ║
 * ║   Covers: Security ∙ Prompt Architecture ∙ Pipeline Logic ∙                ║
 * ║           Bug Regressions ∙ Configuration ∙ Infrastructure                  ║
 * ║                                                                              ║
 * ║   Usage:                                                                     ║
 * ║     node audit/index.js              — full audit (local + static)           ║
 * ║     node audit/index.js --live       — includes live API endpoint tests      ║
 * ║     node audit/index.js --suite NAME — run a single suite                   ║
 * ║                                                                              ║
 * ║   Environment:                                                               ║
 * ║     AUDIT_URL=https://luxaurastudio.vercel.app (default)                    ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';

// ─── Audit suite imports ──────────────────────────────────────────────────────
import {
  runClassifierTests,
  runPhotoEditTests,
  runVTOBackgroundReplaceTests,
  runVTOEditorialTests,
  runInpaintingTests,
  runTwoImageTests,
  runAiGenerateTests,
  runTemperatureTests,
  runFailureClassifierTests,
  runPreFlightTests,
  runMutationTests,
  runAnchorCoverageTests,
  runOutfitPartsTests,
} from './tests/prompt.js';

import {
  runAnchorDeduplicationTests,
  runGarmentModeTests,
  runMissionTypeTests,
  runSlotPermutationTests,
  runDnaPromptCoverageTests,
  runConsistencyAuditParserTests,
  runVTORoutingTests,
  runPhotographyConfigTests,
  runBackgroundResolutionTests,
  runRetryLogicTests,
  runSelfHealTests,
} from './tests/pipeline.js';

import {
  runAuthTests,
  runInjectionTests,
  runPayloadTests,
  runRateLimitLogicTests,
  runCreditLogicTests,
  runFirestoreRulesReview,
  runSSEHeaderTests,
  runPrivilegeEscalationTests,
} from './tests/security.js';

import {
  runDirectorBriefCountTest,
  runFashnCategoryBugTest,
  runVTOTemperatureTest,
  runMissingImageErrorTest,
  runGenderEdgeCaseTests,
  runHeartbeatExitTests,
  runTimeoutBudgetTests,
  runPromptOrderTest,
  runVtoRoutingAudit,
  runOutfitRecallSourceTests,
} from './tests/bugs.js';

// ─── B2B Test Suites ──────────────────────────────────────────────────────────
import {
  runBrandApiKeyValidationTests,
  runDualAuthTests,
  runBrandSchemaTests,
  runQuotaAtomicityTests,
  runBrandMemberIsolationTests,
} from './tests/brand-auth.js';

import {
  runSkuEnrollmentSchemaTests,
  runSkuRecallTests,
  runSkuApiTests,
  runDnaInjectionTests,
  runOutfitCombinationTests,
} from './tests/sku.js';

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const LIVE_MODE     = args.includes('--live');
const SUITE_FILTER  = args.find(a => a.startsWith('--suite='))?.split('=')?.[1];

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT RUNNER
// ─────────────────────────────────────────────────────────────────────────────
const allResults = [];
const suiteSummaries = [];

async function runSuite(name, fn) {
  if (SUITE_FILTER && !name.toLowerCase().includes(SUITE_FILTER.toLowerCase())) return;

  const t0 = performance.now();
  let results = [];
  try {
    results = await fn();
  } catch (err) {
    console.error(`  💥 SUITE CRASHED: ${name}\n  ${err.message}\n${err.stack}`);
    results = [{ pass: false, label: `Suite ${name} crashed: ${err.message}` }];
  }
  const elapsed = (performance.now() - t0).toFixed(0);

  const pass    = results.filter(r => r.pass === true).length;
  const fail    = results.filter(r => r.pass === false).length;
  const warn    = results.filter(r => r.pass === null).length;
  const total   = pass + fail;

  suiteSummaries.push({ name, pass, fail, warn, total, elapsed });
  allResults.push(...results);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const globalStart = performance.now();

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   LUXAURA SOVEREIGN AUDIT SYSTEM v1.0                       ║');
  console.log(`║   Mode: ${LIVE_MODE ? 'LIVE + STATIC' : 'STATIC ONLY'} | ${new Date().toISOString()}  ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // ── SECTION 1: PROMPT ARCHITECTURE ────────────────────────────────────────
  console.log('\n\n▓▓▓ SECTION 1: PROMPT ARCHITECTURE ▓▓▓');
  await runSuite('Mode Classifier',             runClassifierTests);
  await runSuite('PHOTO_EDIT Builder',          runPhotoEditTests);
  await runSuite('VTO_BACKGROUND_REPLACE',      runVTOBackgroundReplaceTests);
  await runSuite('VTO_EDITORIAL Builder',       runVTOEditorialTests);
  await runSuite('INPAINTING Builder',          runInpaintingTests);
  await runSuite('TWO_IMAGE Builder',           runTwoImageTests);
  await runSuite('AI_GENERATE Builder',         runAiGenerateTests);
  await runSuite('Outfit Combination Parts',    runOutfitPartsTests);
  await runSuite('Temperature Calculator',      runTemperatureTests);
  await runSuite('Failure Classifier',          runFailureClassifierTests);
  await runSuite('Pre-Flight Validator',        runPreFlightTests);
  await runSuite('Mutation Retry Injection',    runMutationTests);
  await runSuite('Anchor Coverage (all types)', runAnchorCoverageTests);

  // ── SECTION 2: PIPELINE LOGIC ──────────────────────────────────────────────
  console.log('\n\n▓▓▓ SECTION 2: PIPELINE LOGIC ▓▓▓');
  await runSuite('Anchor Deduplication',        runAnchorDeduplicationTests);
  await runSuite('Garment Mode Detection',      runGarmentModeTests);
  await runSuite('Mission Type (Agent 00)',      runMissionTypeTests);
  await runSuite('Slot Permutation System',      runSlotPermutationTests);
  await runSuite('DNA Prompt Coverage',         runDnaPromptCoverageTests);
  await runSuite('Consistency Audit Parser',    runConsistencyAuditParserTests);
  await runSuite('VTO Pipeline Routing',        runVTORoutingTests);
  await runSuite('Photography Config',          runPhotographyConfigTests);
  await runSuite('Background Resolution',       runBackgroundResolutionTests);
  await runSuite('Pass 2 Retry Logic',          runRetryLogicTests);
  await runSuite('Self-Heal Guardian',          runSelfHealTests);

  // ── SECTION 3: SECURITY ────────────────────────────────────────────────────
  console.log('\n\n▓▓▓ SECTION 3: SECURITY ▓▓▓');
  await runSuite('Rate Limiter Logic',          runRateLimitLogicTests);
  await runSuite('Credit System Logic',         runCreditLogicTests);
  await runSuite('Firestore Rules Review',      runFirestoreRulesReview);
  await runSuite('SSE Headers',                 runSSEHeaderTests);
  await runSuite('Privilege Escalation',        runPrivilegeEscalationTests);

  if (LIVE_MODE) {
    console.log('\n  🌐 LIVE MODE: Sending requests to deployed API...');
    await runSuite('Auth Bypass (LIVE)',         runAuthTests);
    await runSuite('Input Injection (LIVE)',     runInjectionTests);
    await runSuite('Payload Abuse (LIVE)',       runPayloadTests);
  } else {
    console.log('\n  ⏭️  LIVE API tests skipped (run with --live to include)');
  }

  // ── SECTION 4: B2B BRAND PLATFORM ─────────────────────────────────────────
  console.log('\n\n▓▓▓ SECTION 4: B2B BRAND PLATFORM ▓▓▓');

  const b2bCollect = (suite, tests) => {
    tests.forEach(t => allResults.push({ pass: t.passed, label: `${suite}: ${t.name}`, detail: t.error || null }));
  };

  await runSuite('Brand API Key Validation',  () => { runBrandApiKeyValidationTests(b2bCollect); return []; });
  await runSuite('Dual Auth Mode',            () => { runDualAuthTests(b2bCollect); return []; });
  await runSuite('Brand Schema',              () => { runBrandSchemaTests(b2bCollect); return []; });
  await runSuite('Quota Atomicity',           () => { runQuotaAtomicityTests(b2bCollect); return []; });
  await runSuite('Brand Member Isolation',    () => { runBrandMemberIsolationTests(b2bCollect); return []; });
  await runSuite('SKU Enrollment Schema',     () => { runSkuEnrollmentSchemaTests(b2bCollect); return []; });
  await runSuite('SKU Recall Bypass',         () => { runSkuRecallTests(b2bCollect); return []; });
  await runSuite('SKU API Endpoints',         () => { runSkuApiTests(b2bCollect); return []; });
  await runSuite('DNA Injection Integrity',   () => { runDnaInjectionTests(b2bCollect); return []; });
  await runSuite('Outfit Combination Merge',  () => { runOutfitCombinationTests(b2bCollect); return []; });

  // ── SECTION 5: BUG REGRESSIONS & EDGE CASES ───────────────────────────────
  console.log('\n\n▓▓▓ SECTION 5: BUG REGRESSIONS & EDGE CASES ▓▓▓');
  await runSuite('Director Brief Count',        runDirectorBriefCountTest);
  await runSuite('Fashn.ai Category Bug',       runFashnCategoryBugTest);
  await runSuite('VTO Temperature Range',       runVTOTemperatureTest);
  await runSuite('Missing Image Error',         runMissingImageErrorTest);
  await runSuite('Gender Edge Cases',           runGenderEdgeCaseTests);
  await runSuite('Heartbeat Exit Paths',        runHeartbeatExitTests);
  await runSuite('Timeout Budget',              runTimeoutBudgetTests);
  await runSuite('Prompt Lock Order',           runPromptOrderTest);
  await runSuite('VTO Routing Split',           runVtoRoutingAudit);
  await runSuite('SKU Recall TDZ + Outfit',     runOutfitRecallSourceTests);

  // ── FINAL REPORT ───────────────────────────────────────────────────────────
  const totalElapsed = ((performance.now() - globalStart) / 1000).toFixed(1);
  const totalPass    = allResults.filter(r => r.pass === true).length;
  const totalFail    = allResults.filter(r => r.pass === false).length;
  const totalWarn    = allResults.filter(r => r.pass === null).length;
  const totalChecks  = totalPass + totalFail;

  console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   AUDIT COMPLETE — SUMMARY REPORT                           ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║   ✅ PASSED : ${String(totalPass).padEnd(5)} / ${totalChecks}${' '.repeat(Math.max(0, 37 - String(totalPass).length - String(totalChecks).length))}║`);
  console.log(`║   ❌ FAILED : ${String(totalFail).padEnd(5)}${' '.repeat(43)}║`);
  console.log(`║   ⚠️  NOTICES: ${String(totalWarn).padEnd(5)}${' '.repeat(43)}║`);
  console.log(`║   ⏱  ELAPSED: ${totalElapsed}s${' '.repeat(Math.max(0, 44 - totalElapsed.length))}║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // Per-suite table
  console.log('\n  SUITE BREAKDOWN:');
  console.log('  ' + '─'.repeat(70));
  suiteSummaries.forEach(s => {
    const pct    = s.total > 0 ? Math.round((s.pass / s.total) * 100) : 100;
    const bar    = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
    const status = s.fail > 0 ? '❌' : s.warn > 0 ? '⚠️ ' : '✅';
    const name   = s.name.padEnd(36);
    console.log(`  ${status} ${name} ${bar} ${pct}% (${s.pass}/${s.total}) [${s.elapsed}ms]${s.warn > 0 ? ` +${s.warn} notice` : ''}`);
  });

  // Failed tests detail
  const failures = allResults.filter(r => r.pass === false);
  if (failures.length > 0) {
    console.log('\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  FAILURES REQUIRING ACTION:');
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    failures.forEach((f, i) => {
      console.error(`\n  [${i + 1}] ${f.label}`);
      if (f.detail) console.error(`       Detail: ${f.detail}`);
    });
  }

  // Notices
  const notices = allResults.filter(r => r.pass === null);
  if (notices.length > 0) {
    console.log('\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ARCHITECTURAL NOTICES (action recommended):');
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    notices.forEach((n, i) => {
      console.warn(`\n  [N${i + 1}] ${n.label}`);
      if (n.detail) console.warn(`       Detail: ${n.detail}`);
    });
  }

  // Write JSON report
  const report = {
    timestamp:   new Date().toISOString(),
    mode:        LIVE_MODE ? 'LIVE+STATIC' : 'STATIC',
    elapsed:     totalElapsed,
    summary: { pass: totalPass, fail: totalFail, warn: totalWarn, total: totalChecks },
    suites:      suiteSummaries,
    failures:    failures,
    notices:     notices,
    allResults:  allResults,
  };

  const reportPath = new URL('./audit-report.json', import.meta.url);
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n  📄 Full JSON report written to: audit/audit-report.json`);

  // Exit code
  if (totalFail > 0) {
    console.log(`\n  🔴 AUDIT FAILED — ${totalFail} test(s) require immediate attention.\n`);
    gracefulExit(1);
  } else {
    console.log(`\n  🟢 AUDIT PASSED — All ${totalPass} checks passed${totalWarn > 0 ? `, ${totalWarn} notices to review` : ''}.\n`);
    gracefulExit(0);
  }
}

// Graceful exit — set the code and let libuv close open handles (stdout flush,
// undici keep-alive sockets from live mode) before exiting. An abrupt process.exit()
// while a handle is mid-close triggers a libuv assertion on Windows
// (`!(handle->flags & UV_HANDLE_CLOSING)`). The unref'd timer is a hard fallback:
// if all handles close first, the process exits cleanly on its own beforehand.
function gracefulExit(code) {
  process.exitCode = code;
  setTimeout(() => process.exit(code), 250).unref();
}

main().catch(err => {
  console.error('\n  💥 AUDIT SYSTEM CRASH:', err.message);
  console.error(err.stack);
  gracefulExit(2);
});
