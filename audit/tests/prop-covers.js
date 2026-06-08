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
