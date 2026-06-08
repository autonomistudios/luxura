/**
 * audit/tests/prop-covers.js
 * Enforces completeness of the prop-cover system: every Creative Prop must have a
 * committed hero cover at public/assets/props/<id>.jpg (the permanent, in-repo,
 * CDN-served source of truth — see public/assets/props/README.md).
 * Regenerate with: node scripts/generate-prop-covers.mjs
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { SHOWCASE } from '../../scripts/generate-showcase.mjs';
import { DRESS_SET } from '../../scripts/generate-dress-set.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

export function runPropCoverTests() {
  const results = [];

  const src = readFileSync(resolve(ROOT, 'src/lib/creativeProps.ts'), 'utf8');
  const ids = [...src.matchAll(/^ {4}id: '([^']+)'/gm)].map(m => m[1]);

  results.push({
    pass: ids.length >= 99,
    label: `creativeProps.ts exposes ${ids.length} prop ids (≥99 expected)`,
    detail: ids.length < 99 ? `only ${ids.length} found` : null,
  });

  const missing = [];
  const tiny = [];
  for (const id of ids) {
    const p = resolve(ROOT, `public/assets/props/${id}.jpg`);
    if (!existsSync(p)) { missing.push(id); continue; }
    if (statSync(p).size < 8 * 1024) tiny.push(id); // <8KB ⇒ likely a broken/placeholder render
  }

  results.push({
    pass: missing.length === 0,
    label: `Every prop has a committed Pro cover — ${ids.length - missing.length}/${ids.length}`,
    detail: missing.length ? `missing: ${missing.join(', ')}` : null,
  });

  results.push({
    pass: tiny.length === 0,
    label: `All cover files are substantive (≥8KB)`,
    detail: tiny.length ? `suspiciously small: ${tiny.join(', ')}` : null,
  });

  return results;
}

/**
 * Showcase completeness: every entry in the SHOWCASE statement collection must
 * have a committed image at public/assets/showcase/<id>.jpg.
 * Regenerate with: node scripts/generate-showcase.mjs
 */
export function runShowcaseTests() {
  const results = [];
  const missing = [];
  for (const item of SHOWCASE) {
    const p = resolve(ROOT, `public/assets/showcase/${item.id}.jpg`);
    if (!existsSync(p) || statSync(p).size < 8 * 1024) missing.push(item.id);
  }
  results.push({
    pass: SHOWCASE.length >= 6,
    label: `Showcase defines ${SHOWCASE.length} statement images (≥6 expected)`,
    detail: SHOWCASE.length < 6 ? `only ${SHOWCASE.length}` : null,
  });
  results.push({
    pass: missing.length === 0,
    label: `Every statement image is committed — ${SHOWCASE.length - missing.length}/${SHOWCASE.length}`,
    detail: missing.length ? `missing/tiny: ${missing.join(', ')}` : null,
  });
  return results;
}

/**
 * Dress-set completeness: every garment-locked variation must have a committed
 * image at public/assets/dress-set/<id>.jpg.
 * Regenerate with: node scripts/generate-dress-set.mjs
 */
export function runDressSetTests() {
  const results = [];
  const missing = [];
  for (const item of DRESS_SET) {
    const p = resolve(ROOT, `public/assets/dress-set/${item.id}.jpg`);
    if (!existsSync(p) || statSync(p).size < 8 * 1024) missing.push(item.id);
  }
  results.push({
    pass: DRESS_SET.length >= 11,
    label: `Dress set defines ${DRESS_SET.length} garment-locked variations (≥11 expected)`,
    detail: DRESS_SET.length < 11 ? `only ${DRESS_SET.length}` : null,
  });
  results.push({
    pass: missing.length === 0,
    label: `Every dress-set image is committed — ${DRESS_SET.length - missing.length}/${DRESS_SET.length}`,
    detail: missing.length ? `missing/tiny: ${missing.join(', ')}` : null,
  });
  return results;
}
