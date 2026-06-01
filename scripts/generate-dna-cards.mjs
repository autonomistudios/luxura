/**
 * scripts/generate-dna-cards.mjs
 * Generate all 8 Visual DNA card background images using gemini-3-pro-image
 * Run: node scripts/generate-dna-cards.mjs
 * Output: public/assets/dna/*.jpg
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR   = path.join(__dirname, '..', 'public', 'assets', 'dna');
const API_KEY   = process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY;

if (!API_KEY) {
  console.error('❌  GOOGLE_API_KEY not set. Add it to your .env or pass as env var.');
  process.exit(1);
}

const MODEL = 'gemini-3-pro-image';
const API   = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// ─── The 8 DNA card image prompts ─────────────────────────────────────────────
const CARDS = [
  {
    filename: '01-high-fashion.jpg',
    label:    'High Fashion Editorial',
    prompt: `High-fashion editorial photograph. Stunning Black woman with deep ebony skin, Fitzpatrick VI, wearing a sculptural avant-garde architectural garment in stark white against a pure black studio backdrop. Single hard directional sidelight from the left creating deep cinematic shadow across half her form. The deep dark skin and the graphic garment create extreme tonal contrast. Vogue editorial aesthetic — the model IS the architecture. Shot on medium format. Cinematic, graphic, zero clutter. 3:4 portrait ratio.`,
  },
  {
    filename: '02-luxury-campaign.jpg',
    label:    'Luxury Brand Campaign',
    prompt: `Luxury fashion campaign photograph. Brown-skinned woman, warm medium-brown skin tone, Fitzpatrick IV, wearing an impeccably tailored ivory structured blazer and wide-leg trousers. She stands at the threshold of a grand Parisian salon — tall arched windows, pale grey plaster walls, herringbone parquet floor. Afternoon light streams warm gold through sheer curtains. Chanel/Dior aesthetic. Restrained palette of ivory, warm grey, gold. Heritage authority. Composed expression. Shot on large format film. 3:4 portrait ratio.`,
  },
  {
    filename: '03-street-style.jpg',
    label:    'Street Style Candid',
    prompt: `Street style fashion photograph. Brown-skinned woman, cinnamon brown skin, Fitzpatrick IV, wearing a directional fashion-forward outfit — oversized blazer, wide trousers, bold accessories. She is captured mid-stride on a wet cobblestone European street at golden hour — blurred city architecture and golden bokeh behind her. Natural movement, the clothing reacts to motion. The Sartorialist aesthetic — real fashion caught alive in the real world. 35mm grain, candid energy. 3:4 portrait ratio.`,
  },
  {
    filename: '04-avant-garde.jpg',
    label:    'Avant-Garde Couture',
    prompt: `Avant-garde couture fashion editorial. Woman with dark chocolate brown skin, Fitzpatrick V, wearing an enormous sculptural feathered couture gown in deep emerald green and midnight black. She stands at the center of an abandoned baroque hall — crumbling gilded walls, shafts of dramatic theatrical light piercing through broken windows, floor-level fog. The deep warm skin against jewel-toned couture creates a painting. Tim Walker fantasy aesthetic. Surreal, theatrical, fashion as mythology. 3:4 portrait ratio.`,
  },
  {
    filename: '05-beauty.jpg',
    label:    'Beauty Editorial',
    prompt: `Extreme close-up beauty editorial photograph. Deep brown-skinned woman, Fitzpatrick V, rich chocolate skin. The frame contains nothing but her face from chin to hairline. Graphic geometric black liner, gold and bronze eyeshadow architecture, luminous moisturised skin catching a single directional spotlight from the left. Pure black background. The deep brown skin under precise beauty light is its own luxury material — luminous, sculptural, extraordinary. Allure/W Magazine precision. Shot on medium format. 3:4 portrait ratio.`,
  },
  {
    filename: '06-lifestyle.jpg',
    label:    'Lifestyle Editorial',
    prompt: `Minimal lifestyle editorial photograph. Fair-skinned woman, porcelain skin, Fitzpatrick I, wearing simple quality cream linen wide-leg trousers and a light cotton shirt. She sits by an enormous window in a Scandinavian apartment — pale wood floors, white-washed walls, one simple plant, nothing else. Soft diffused morning light from the window. She is reading, completely unbothered. Kinfolk/COS aesthetic — the garment breathes with the space, the moment is complete. 3:4 portrait ratio.`,
  },
  {
    filename: '07-fine-art.jpg',
    label:    'Fine Art Portrait',
    prompt: `Fine art portrait photograph. Woman with warm tan skin, Fitzpatrick III, face turned three-quarters away. A single Rembrandt shaft of warm amber light illuminates her cheekbone, collarbone, and one side of her face from above-left. The rest falls into rich painterly shadow against a deep charcoal background. She is lost in thought — completely private. Annie Leibovitz/Gregory Crewdson psychological weight. One frame that contains an entire interior life. Shot on 8x10 large format. 3:4 portrait ratio.`,
  },
  {
    filename: '08-luxury-catalog.jpg',
    label:    'Luxury Catalog',
    prompt: `Luxury e-commerce catalog photograph. Brown-skinned woman, warm medium-brown skin, Fitzpatrick IV, wearing a perfectly constructed black structured blazer with sharp lapels and a single gold button. She stands on a seamless light grey studio backdrop. Controlled even studio lighting from both sides — the garment is completely legible, every seam, lapel, shoulder line, and button in sharp focus. The warm brown skin against the clean grey background creates elegant contrast. Net-a-Porter/SSENSE precision. The garment is the star. 3:4 portrait ratio.`,
  },
];

// ─── Generator ────────────────────────────────────────────────────────────────

async function withBackoff(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === retries - 1) throw err;
      const delay = [3000, 6000, 12000][i];
      console.log(`  ↻  Retry ${i + 1} in ${delay / 1000}s — ${err.message}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function generateCard(card, index) {
  const outPath = path.join(OUT_DIR, card.filename);

  console.log(`\n[${index + 1}/8] ${card.label}`);
  console.log(`  → Generating with gemini-3-pro-image...`);

  const response = await withBackoff(async () => {
    const res = await fetch(API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role:  'user',
          parts: [{ text: card.prompt }],
        }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          temperature: 0.85,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API ${res.status}: ${err.slice(0, 200)}`);
    }

    return res.json();
  });

  // Extract image from response
  const parts    = response?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));

  if (!imagePart) {
    console.log(`  ✗  No image returned for ${card.label}`);
    console.log(`     Response: ${JSON.stringify(response).slice(0, 300)}`);
    return false;
  }

  const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
  await writeFile(outPath, buffer);

  const kb = (buffer.length / 1024).toFixed(0);
  console.log(`  ✓  Saved ${card.filename} (${kb} KB)`);
  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  LUXAURA — Visual DNA Card Generation            ║');
  console.log('║  Model: gemini-3-pro-image                       ║');
  console.log(`║  Output: public/assets/dna/                      ║`);
  console.log('╚══════════════════════════════════════════════════╝');

  if (!existsSync(OUT_DIR)) {
    await mkdir(OUT_DIR, { recursive: true });
  }

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < CARDS.length; i++) {
    const ok = await generateCard(CARDS[i], i);
    if (ok) passed++;
    else failed++;
    // Stagger requests to avoid rate limits
    if (i < CARDS.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log(`║  Complete: ${passed}/8 generated${failed > 0 ? ` · ${failed} failed` : '        '}               ║`);
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  Next: update BrandOnboarding.tsx image paths    ║');
  console.log('║  All files → public/assets/dna/*.jpg             ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
