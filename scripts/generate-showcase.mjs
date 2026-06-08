/**
 * scripts/generate-showcase.mjs
 * ───────────────────────────────────────────────────────────────────────────
 * Generates the LuxAura STATEMENT COLLECTION — 6 production-ready hero images
 * to showcase the studio's work: one garment-only product hero + five wildly
 * different editorial statements (different locations, casting, light, mood, pose),
 * all drawn from the curated background world.
 *
 * Output: public/assets/showcase/<id>.jpg (committed, CDN-served). Generation runs
 * at PRO grade (gemini-3-pro-image) through the deployed /api/generate-prop-cover
 * fullRes endpoint — no local credentials needed. The endpoint prepends the
 * LUXAURA master art-direction system prompt (no third-party IP).
 *
 * USAGE:
 *   node scripts/generate-showcase.mjs            # only missing
 *   node scripts/generate-showcase.mjs --force    # regenerate all
 *   node scripts/generate-showcase.mjs --only=the-garment
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'public/assets/showcase');
const ENDPOINT = process.env.ENDPOINT || 'https://luxaurastudio.vercel.app/api/generate-prop-cover';
const MODEL = 'gemini-3-pro-image';
const CONCURRENCY = 3;
const MAX_ATTEMPTS = 4;

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const ONLY = (args.find(a => a.startsWith('--only=')) || '').replace('--only=', '').split(',').filter(Boolean);

export const SHOWCASE = [
  {
    id: 'the-garment',
    prompt:
      'PRODUCT HERO — GARMENT ONLY. NO model, NO person, NO body, NO head, NO hands. ' +
      'A single signature LuxAura couture gown presented entirely alone: a floor-length sculptural gown in deep emerald ' +
      'silk-velvet with an architecturally draped one-shoulder bodice flowing into a long liquid train, shown on a ' +
      'completely invisible ghost-mannequin so the gown floats and holds its worn shape in mid-air. Seamless graphite-grey ' +
      'studio sweep; one dramatic raking spotlight reveals every fold, the deep pile and sheen of the velvet, with a soft ' +
      'gradient shadow pooling beneath the hem. Museum-grade luxury product still life, tack-sharp, medium-format clarity.',
  },
  {
    id: 'statement-sahara',
    prompt:
      'A deep-ebony fashion model with a magnificent wind-caught natural afro and a regal, commanding posture, wearing a ' +
      'monumental flowing gown in burnt-sienna, amber and gold with fine geometric embroidery, standing at the crest of a ' +
      'Saharan dune at golden hour. The desert wind lifts the fabric into a sail; her long shadow trails into deep ochre; ' +
      'the sky is enormous behind her. Warm, monumental, commanding. Shot slightly below eye level for power.',
  },
  {
    id: 'statement-tokyo-neon',
    prompt:
      'An East Asian fashion model with a sleek jet-black blunt bob, wearing a razor-sharp liquid-black couture suit with ' +
      'architectural shoulders, holding a charged stillness on a rain-wet Tokyo street at midnight drenched in pink and ' +
      'cyan neon that pools in long reflections across the black asphalt. Cool, electric, cinematic. The city blurs behind ' +
      'her; she is the only still thing in the frame.',
  },
  {
    id: 'statement-mirror',
    prompt:
      'A striking mixed-race fashion model with a sculpted short cut, wearing an iridescent sculptural avant-garde gown that ' +
      'shifts from silver to prism, caught mid-movement inside an infinity-mirror chamber so her form multiplies into ' +
      'glittering reflections in every direction, the fabric flaring with the motion. Daring, futuristic, high-gloss; a dark ' +
      'chamber alive with brilliant specular highlights.',
  },
  {
    id: 'statement-aegean',
    prompt:
      'A Scandinavian fashion model with platinum waves lifting in the breeze, wearing a fluid floor-length crimson silk ' +
      'gown cut on the bias, on a whitewashed Santorini terrace at golden hour — blue-domed church and the caldera sea ' +
      'behind, lime-washed walls glowing warm, the silk drifting in the wind. Serene, luminous, expensive, airy; a quiet ' +
      'and powerful stillness.',
  },
  {
    id: 'statement-the-face',
    prompt:
      'An extreme beauty portrait, crown to collarbone, of a Nigerian fashion model with rich deep-brown luminous skin and a ' +
      'sculptural short natural cut, wearing bold geometric 18-karat gold earrings. Butterfly lighting from directly above ' +
      'carves perfect symmetry; her eyes burn directly into the lens with quiet intensity. The skin is the event — every ' +
      'plane dewy and alive, subsurface warmth at the high points. The architecture of a human face at maximum resolution.',
  },
];

async function generateOne(item) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propId: `showcase-${item.id}`, userPrompt: item.prompt, model: MODEL, fullRes: true }),
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
  mkdirSync(OUT_DIR, { recursive: true });
  let targets = SHOWCASE;
  if (ONLY.length) targets = targets.filter(s => ONLY.includes(s.id));
  if (!FORCE) targets = targets.filter(s => !existsSync(resolve(OUT_DIR, `${s.id}.jpg`)));

  console.log(`Showcase: ${SHOWCASE.length} total | to generate: ${targets.length} | model: ${MODEL}\n`);
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

// Only run when invoked directly (so the test can import SHOWCASE without generating).
if (process.argv[1] && process.argv[1].endsWith('generate-showcase.mjs')) {
  run().catch(e => { console.error(e); process.exit(1); });
}
