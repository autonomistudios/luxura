/**
 * scripts/generate-dress-set.mjs
 * ───────────────────────────────────────────────────────────────────────────
 * Consistent-SKU dress set: takes ONE garment (the red Aegean gown) and renders it
 * on a real mannequin + 5 totally different models / scenes / poses, with the dress
 * GARMENT-LOCKED to the reference image so it stays identical across all 6.
 * No branding/text. Dress always on full display — never silhouette or shadow.
 *
 * Output: public/assets/dress-set/<id>.jpg
 * Generation: PRO (gemini-3-pro-image) via the deployed /api/generate-prop-cover
 * fullRes endpoint with { clean:true, refImage } — the garment-lock path.
 *
 * USAGE:
 *   node scripts/generate-dress-set.mjs            # only missing
 *   node scripts/generate-dress-set.mjs --force
 *   node scripts/generate-dress-set.mjs --only=dress-mannequin
 *   SOURCE=path/to/dress.jpg node scripts/generate-dress-set.mjs --force
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'public/assets/dress-set');
const SOURCE = process.env.SOURCE || resolve(ROOT, 'public/assets/showcase/statement-aegean.jpg');
const ENDPOINT = process.env.ENDPOINT || 'https://luxaurastudio.vercel.app/api/generate-prop-cover';
const MODEL = 'gemini-3-pro-image';
const CONCURRENCY = 2;
const MAX_ATTEMPTS = 4;

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const ONLY = (args.find(a => a.startsWith('--only=')) || '').replace('--only=', '').split(',').filter(Boolean);

const DRESS = 'the exact red gown from the attached reference image (crimson/scarlet bias-cut silk, slim shoulder straps, fitted bodice, long full flowing skirt)';

export const DRESS_SET = [
  {
    id: 'dress-mannequin',
    prompt:
      `Present ${DRESS} on a realistic professional dress-form mannequin — a visible matte pale-grey tailor's mannequin — ` +
      'centered in a clean, bright, seamless white studio, photographed straight-on. The ENTIRE dress is on full display, ' +
      'evenly and brightly lit, every detail of the crimson silk and its drape clearly visible. NO human model, no face, no head — ' +
      'just the dress on the mannequin. Crisp editorial product shot.',
  },
  {
    id: 'dress-rooftop',
    prompt:
      `A tall dark-skinned Black fashion model with a sleek low chignon, wearing ${DRESS}, standing confidently on a city rooftop ` +
      'terrace at golden hour with a glowing skyline behind her. FRONT-LIT so the crimson gown is fully illuminated and on complete ' +
      'display. Elegant upright pose, chin level, one hand relaxed at her side.',
  },
  {
    id: 'dress-marble',
    prompt:
      `An East Asian fashion model with a sleek center-part bob, wearing ${DRESS}, standing in a bright white marble gallery under ` +
      'soft even daylight, a graceful contrapposto pose with a hand on the hip. The crimson gown fully lit and on complete display ' +
      'against the pale marble.',
  },
  {
    id: 'dress-greenhouse',
    prompt:
      `A Latina fashion model with long dark wavy hair, wearing ${DRESS}, mid a gentle twirl inside a sunlit botanical greenhouse ` +
      'full of lush green foliage, the skirt flaring to reveal the full gown. Bright dappled daylight; the crimson dress on full, ' +
      'vivid display.',
  },
  {
    id: 'dress-staircase',
    prompt:
      `A Middle Eastern fashion model with long glossy dark hair, wearing ${DRESS}, posed elegantly on a grand marble staircase in ` +
      'an opulent warm-lit interior — seated on a step with the skirt arranged to display the entire gown. Bright, warm, flattering ' +
      'light; the crimson dress fully visible.',
  },
  {
    id: 'dress-desert',
    prompt:
      `A South Asian fashion model with long dark hair, wearing ${DRESS}, standing on open golden desert dunes at golden hour. ` +
      'IMPORTANT: FRONT-LIT, not backlit — the crimson gown must be fully illuminated and on complete display, absolutely NO ' +
      'silhouette. A strong, elegant stance; soft warm light across the front of the dress.',
  },
  {
    id: 'dress-studio-ebony',
    prompt:
      `A very dark, deep-ebony-skinned high-fashion model with a sculptural short afro and striking cheekbones, wearing ${DRESS}, ` +
      'in a high-fashion studio against a rich emerald-green seamless backdrop. A powerful sculptural editorial pose — one arm ' +
      'raised, chin lifted. Decisive, dramatic studio light fully illuminates the crimson gown on complete display. Bold, couture, ' +
      'magazine-grade. Reproduce the deep-ebony skin tone exactly — rich and luminous, never lightened.',
  },
  {
    id: 'dress-salon-ebony',
    prompt:
      `A very dark, deep-ebony-skinned high-fashion model with an elegant elongated neck and sleek slicked-back hair, wearing ${DRESS}, ` +
      'standing in an opulent Parisian grand salon with gilded mirrors and a crystal chandelier, warm even light. A regal, statuesque ' +
      'high-fashion pose. The crimson gown fully lit and on complete display. Reproduce the deep-ebony skin tone exactly — rich and luminous.',
  },
  {
    id: 'dress-brutalist',
    prompt:
      `A medium-brown-skinned high-fashion model with a sleek high bun and sharp brows, wearing ${DRESS}, posed against raw geometric ` +
      'brutalist concrete architecture under bright, even daylight. An angular, confident high-fashion editorial pose. The crimson gown ' +
      'fully visible and on complete display against the grey concrete.',
  },
  {
    id: 'dress-villa',
    prompt:
      `A warm caramel-brown-skinned high-fashion model with long natural curls, wearing ${DRESS}, on a sun-drenched Mediterranean villa ` +
      'terrace at golden hour with cypress trees and the sea behind. FRONT-LIT — the crimson gown glowing and on full display, no ' +
      'silhouette. A relaxed yet powerful high-fashion stance.',
  },
  {
    id: 'dress-gallery',
    prompt:
      `A rich mahogany-brown-skinned high-fashion model with a dramatic sculptural updo, wearing ${DRESS}, in a vast minimalist white ` +
      'modern-art gallery with a single bold abstract canvas behind her, clean bright museum light. An avant-garde high-fashion pose. ' +
      'The crimson gown fully lit and on complete display.',
  },
];

// Lazy so importing DRESS_SET (e.g. from the audit test) never reads the file.
let _refImage = null;
const getRefImage = () => (_refImage ??= `data:image/jpeg;base64,${readFileSync(SOURCE).toString('base64')}`);

async function generateOne(item) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propId: `dress-${item.id}`, userPrompt: item.prompt, model: MODEL,
          fullRes: true, clean: true, refImage: getRefImage(), refMime: 'image/jpeg',
        }),
      });
      let data;
      try { data = await res.json(); } catch { throw new Error(`non-JSON (HTTP ${res.status})`); }
      if (!res.ok || !data.coverUrl) throw new Error(data.error || `HTTP ${res.status}`);
      const buf = Buffer.from(data.coverUrl.split(',')[1], 'base64');
      writeFileSync(resolve(OUT_DIR, `${item.id}.jpg`), buf);
      return { id: item.id, kb: Math.round(buf.length / 1024), attempt };
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) return { id: item.id, error: err.message };
      await new Promise(r => setTimeout(r, attempt * 2500));
    }
  }
}

async function run() {
  if (!existsSync(SOURCE)) { console.error(`Source dress image not found: ${SOURCE}`); process.exit(1); }
  mkdirSync(OUT_DIR, { recursive: true });
  let targets = DRESS_SET;
  if (ONLY.length) targets = targets.filter(s => ONLY.includes(s.id));
  if (!FORCE) targets = targets.filter(s => !existsSync(resolve(OUT_DIR, `${s.id}.jpg`)));

  console.log(`Dress set: ${DRESS_SET.length} | to generate: ${targets.length} | source: ${SOURCE}\n`);
  if (!targets.length) { console.log('All present. Use --force to regenerate.'); return; }

  const results = [];
  let cursor = 0;
  async function worker() {
    while (cursor < targets.length) {
      const item = targets[cursor++];
      process.stdout.write(`  → ${item.id} … `);
      const r = await generateOne(item);
      results.push(r);
      console.log(r.error ? `FAIL: ${r.error}` : `ok (${r.kb}KB, try ${r.attempt})`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));

  const failed = results.filter(r => r.error);
  console.log(`\nDone. ${results.length - failed.length} ok, ${failed.length} failed.`);
  if (failed.length) { failed.forEach(f => console.log(`  FAILED ${f.id}: ${f.error}`)); process.exit(1); }
}

if (process.argv[1] && process.argv[1].endsWith('generate-dress-set.mjs')) {
  run().catch(e => { console.error(e); process.exit(1); });
}
