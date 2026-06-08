/**
 * scripts/generate-prop-covers.mjs
 * ───────────────────────────────────────────────────────────────────────────
 * Generates the hero cover image for every Creative Prop at PRO grade
 * (Nano Banana Pro / gemini-3-pro-image) and writes each as a committed file to
 * public/assets/props/<propId>.jpg — the permanent, CDN-served, in-repo source
 * of truth for prop covers (see public/assets/props/README.md).
 *
 * Creative direction lives in PROP_SHOOTS below — bespoke, diversely-cast model +
 * wardrobe + scene per prop (the studio's original IP). Props without a bespoke
 * shoot fall back to their primary scene text + rotated diverse casting.
 *
 * Generation runs through the DEPLOYED endpoint (/api/generate-prop-cover, fullRes),
 * so NO local credentials are needed — the server holds GOOGLE_API_KEY. This
 * deliberately avoids the legacy Firebase-Admin path (the local service-account
 * key is corrupt) and the Firestore 1MB limit; fullRes returns 1280px q88.
 *
 * USAGE:
 *   node scripts/generate-prop-covers.mjs              # only missing covers
 *   node scripts/generate-prop-covers.mjs --force      # regenerate all
 *   node scripts/generate-prop-covers.mjs --only=glass-tower,paris-night
 *   ENDPOINT=https://<deployment>/api/generate-prop-cover node scripts/generate-prop-covers.mjs
 */
import esbuild from 'esbuild';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'public/assets/props');
const ENDPOINT = process.env.ENDPOINT || 'https://luxaurastudio.vercel.app/api/generate-prop-cover';
const MODEL = 'gemini-3-pro-image';          // Nano Banana Pro — the best image model
const CONCURRENCY = 3;
const MAX_ATTEMPTS = 4;

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const ONLY = (args.find(a => a.startsWith('--only=')) || '').replace('--only=', '').split(',').filter(Boolean);

// ── Bespoke per-prop creative direction (studio IP) ──────────────────────────
// Each entry: { id, model (casting + wardrobe), scene (location + light + direction) }.
const PROP_SHOOTS = [
  {
    id: 'glass-tower',
    model: 'A tall East Asian woman in her late 20s with a sleek jet-black blunt bob cut sharply at the jaw. She wears a structured geometric black tailored suit with exaggerated wide lapels and razor-sharp shoulders — the jacket cinched with a single architectural silver clasp. Sheer black turtleneck underneath. Long silver rectangular earrings catch the light. Black high-heel mules, polished like mirrors.',
    scene: 'She stands mid-lean against floor-to-ceiling glass fifty floors above a city at night, one arm extending into the metal window frame — body language unbothered, gaze cast slightly downward with quiet authority. LED light from the city below pulses white and cold across every surface. The city dissolves into orange and black geometry far below. Analog film grain softens the electric edges; her reflection in the glass doubles the portrait into something architectural.',
  },
  {
    id: 'lime-wall',
    model: 'A Colombian woman in her early 30s with voluminous natural coils styled into a high round crown. She wears a structured cobalt-blue double-breasted blazer-dress with gold buttons, the hemline hitting mid-thigh. A chunky gold chain necklace with oversized links. Bold red sculptural lip. Pointed cobalt leather pumps. Large geometric gold hoop earrings.',
    scene: 'She stands square against a vivid lime-green tiled wall — white grout lines forming a precise grid. Posture deliberate, look fearless, the cobalt and lime creating pure editorial color logic. Even studio lighting leaves no shadow hiding place. The image does not need to explain itself.',
  },
  {
    id: 'paris-night',
    model: 'A French-Algerian woman in her mid-20s with chestnut waves loose past her shoulders. She wears a floor-length camel cashmere wool coat — dramatically oversized, collarless, open over a simple black turtleneck and slim black trousers. Deep burgundy leather gloves to the elbow. Heeled ankle boots in black suede. A silk scarf loosely knotted at the neck in ochre and black. No visible jewelry except one gold signet ring.',
    scene: 'A narrow Haussmann lane at 11pm, cobblestones holding the memory of rain. Amber café light spills through an arched doorway and catches one edge of the subject mid-stride. She walks — does not pose — caught at the exact stride where one leg extends forward, heel striking stone. Her gaze passes over the right shoulder into some private distance. Available light only: warm café glow, deep blue sky above the buildings. Grain. The full quiet of European midnight.',
  },
  {
    id: 'milan-district',
    model: 'An Italian woman in her late 30s with glossy dark hair pulled back in a sleek architectural chignon. She wears a perfectly tailored charcoal double-breasted suit with chalk pinstripes — the jacket fitted at the waist, trousers with a sharp crease. Silk ivory blouse with a subtle sheen. Amber tortoiseshell oversized sunglasses. Point-toe heels in cognac leather. A minimal gold watch on the left wrist. Stacked thin gold rings.',
    scene: 'Via Montenapoleone at the golden hour — luxury boutique windows glowing amber, Italian stone pavement catching sunset in warm copper. She stands at a slight angle, one shoulder toward the lens. Her gaze is sideways and downward — distracted or pretending to be. Boutique windows gild her left side in warmth while the right falls into cool shadow. Vintage analog warmth through every tone.',
  },
  {
    id: 'seoul-arcade',
    model: 'A Korean woman in her mid-20s with a precise geometric bowl cut — glossy black, blunt at the temples. She wears an oversized architectural white coat, structured with rigid pleats at the shoulders, falling to the calf. Underneath: a white silk turtleneck tucked into white wide-leg trousers. Silver angular cuff on one wrist. Pointed white leather ankle boots. A single silver ear cuff replacing conventional earrings.',
    scene: 'Seoul luxury arcade — floor-to-ceiling polished marble, soaring glass atrium diffusing cool white light from above. She stands dead-center in the widest section of the corridor, arms at her sides, perfectly still. Her reflection in the marble floor is as sharp as the figure above it. The light is institutional and beautiful: overhead, clean, unsparing. Quiet. Modern. Massive.',
  },
  {
    id: 'amalfi-power',
    model: 'A Brazilian woman in her early 30s with long, thick wavy dark hair loose and wind-touched. Sun-kissed bronze skin. She wears a flowing deep terracotta silk dress — cut on the bias, one shoulder bare, the fabric moving in the Mediterranean wind. Wide gold cuff bracelets on both wrists. Flat gold sandals laced to the knee. An amber and gold statement ring. Sunglasses pushed up into her hair.',
    scene: 'A cliffside path above the Mediterranean — the sun a burning coin above the water, casting one long shadow. She stands square to the camera: shoulders back, chin level, one hand brushing the ancient stone wall for presence. The sea behind her is deep teal dissolving into black at the edges. Her skin reads like warm amber under golden gods-light. The image is simple, massive, and commanding.',
  },
  {
    id: 'dust-and-gold',
    model: 'An Ethiopian woman in her late 20s with a full natural afro, wind-caught and magnificent. Her skin is deep ebony. She wears a floor-length gown in layered burnt sienna, deep amber, and gold — embroidered with geometric Habesha patterns at the neckline and hem. A dramatic statement gold collar necklace. Barefoot in the sand. Thin gold bangles on both wrists.',
    scene: 'Saharan dune crest at the last light before dark — she stands at the apex of an arcing ridgeline, the desert breeze moving through her. Her skin absorbs the amber raking light the same way the sand does; she and the landscape are one color system. Arms loose at her sides, head tilted slightly back — the posture of someone who owns the horizon. Long shadow trailing into deep ochre. Shot from below eye-level, the sky enormous above.',
  },
  {
    id: 'scottish-storm',
    model: 'An Irish-Scottish woman in her early 30s with copper-red curls whipping in the wind. She wears a dramatic forest-green heavyweight wool cape — floor-length, storm-tossed, the fabric billowing. A black ribbed turtleneck sweater underneath tucked into slim black trousers. Knee-high dark cognac leather boots with a stacked heel. A tartan scarf used as a belt, knotted at the hip. Minimal gold Celtic knot earrings.',
    scene: 'Scottish highland moorland at dusk — infinite purple heather under a brooding pewter sky, storm light breaking through in one shaft that catches her and nothing else. Her stance is wide and grounded, gaze level and direct into the lens. The wind actively bends the heather. The sky is theatrical: anvil clouds, a single break in grey. Bleach bypass processing desaturates everything except her skin, which reads warm and alive against the cold landscape.',
  },
  {
    id: 'above-clouds',
    model: 'A Scandinavian woman in her late 20s with platinum blonde hair in loose thick braids draped over one shoulder. She wears layered ivory and white linen — a wide-leg trouser suit in raw natural linen, an oversized shirt underneath with the collar open and windswept. A sheer white silk duster over everything, lifting in the high-altitude wind. Minimal silver jewelry — a delicate ring, tiny stud earrings. White canvas sneakers.',
    scene: 'Swiss alpine meadow above the cloud line — wildflowers at her feet, the cloud sea below glowing white and formless, jagged snow peaks emerging into pure blue above. She faces away from the lens, arms open slightly at her sides. One small warm shape in an infinite cold blue-and-white world. The scale of the environment dwarfs the figure. Wind moves through her. Shot wide at 24mm, the cloud sea filling the lower third.',
  },
  {
    id: 'tokyo-platform',
    model: 'A Japanese woman in her mid-20s with sleek straight black hair blunt-cut at the collarbone. She wears a sharply tailored navy coat with precise red topstitching at every seam — architectural and precise. Black wide-leg trousers, white platform sneakers with a thick sole. A structured mini crossbody bag in black patent leather. Thin gold chain layered necklaces. Red frame geometric glasses.',
    scene: 'A Tokyo subway platform just as the train blurs past — she stands completely still on the yellow safety line. The train becomes a streak of green-gold light, motion blur erasing everything except her stillness. She looks slightly off-camera — the kind of expression that exists for no audience. Cool fluorescent overhead light cuts down hard; the tiled floor throws a faint reflection. 35mm grain, the specific fluorescent color cast of underground infrastructure.',
  },
  {
    id: 'brooklyn-gold',
    model: 'A Black American woman in her late 20s with voluminous coily natural hair pinned into a high puff with a few loose spirals escaping. She wears a vintage-washed denim jacket over a champagne satin slip dress that hits just above the knee. Chunky oversized gold hoop earrings. White vintage sneakers. A thin gold chain at the ankle. One stack of thin gold rings on the right hand.',
    scene: 'DUMBO Brooklyn at golden hour — the Manhattan Bridge stone arch framing a shaft of amber light on cobblestone. She is mid-stride through the arch, one foot slightly raised, motion caught between steps. The light from behind the arch creates a warm halo. She is not performing for the camera. Film grain, warm Portra tones, the specific amber of late summer New York. The city is proof she belongs in it.',
  },
  {
    id: 'shibuya-midnight',
    model: 'A mixed-race (Japanese and Black) woman in her early 20s with her hair in two high space buns, edge-laid to perfection. She wears an iridescent vinyl jacket — shifting between pink, purple, and silver under neon light — over a cropped black mesh top. High-waist black vinyl trousers. Platform chunky boots in white. Bold graphic eyeliner, holographic lip. Multiple ear piercings with an eclectic mix of gold and silver studs.',
    scene: 'Shibuya pedestrian crossing at midnight after rain — neon from every direction, the wet pavement mirroring chaos of light in abstract color pools. She walks alone through the crossing, her look a canvas for every reflected neon. Her posture is perfect; her pace is unhurried. Around her, blurred figures move in every direction. She is the only still thing. Cross-process color makes neons burn unnaturally vivid — cyan, magenta, orange.',
  },
  {
    id: 'close-study',
    model: 'A Nigerian woman in her late 20s with a close-cropped natural TWA (teeny weeny afro) styled to a precise shape at the edges. Her skin is rich deep brown with luminous hydrated texture. She wears a sculptural off-shoulder draped top in deep burgundy — barely visible at the frame edge. Large geometric 18-karat gold earrings that catch the butterfly light. A single thin gold nose ring. No other accessories — the face is everything.',
    scene: 'A beauty study from crown to collarbone — face turned at a precise 45-degree angle, the near eye burning directly into the lens with absolute quiet intensity. Butterfly lighting from directly above creates perfect symmetry: shadow beneath the nose exact, cheekbones sculpted. Her skin is the event: every plane catching the overhead light differently, dewy and alive, subsurface warmth visible at the high points. Lips pressed together in quiet intention. The architecture of a human face rendered at maximum resolution.',
  },
  {
    id: 'wet-light',
    model: 'A Haitian-American woman in her early 30s with long box braids — dark at the root, dip-dyed deep auburn at the ends — worn loose down her back, water-kissed and catching the sun. Her skin is warm deep bronze. She wears a minimal white linen cover-up wrap, almost transparent where damp, knotted at one hip. A single carved turquoise stone pendant necklace. Thin gold anklets on both ankles. No shoes.',
    scene: 'She leans forward, arms resting along her legs, gaze cutting directly into the lens — no performance, just presence. The moisture on her skin catches directional late-afternoon sun and turns it into something between bronze and fire. The light bleaches and sculpts every edge. Warm natural sun, low and raking, models every shadow. Subtle analog film grain and warm amber undertones — the whole image feels like a memory of heat.',
  },
  {
    id: 'brutalist-power',
    model: 'A German woman in her late 30s with a severe blunt bob dyed platinum white — so pale it reads architectural against the concrete. She wears a deconstructed charcoal wool blazer — one lapel missing, one sleeve cut away at the shoulder, asymmetric hemline, raw edges intentional. Black ribbed bodysuit underneath. Wide-leg black wool trousers with architectural pleats. Black leather combat boots to the knee. A single oversized square signet ring. No other jewelry.',
    scene: 'East Berlin brutalist concrete courtyard at noon — raw poured concrete casting hard geometric shadows. She is positioned exactly where two shadow planes intersect. Her silhouette rhymes with the angular architecture. One arm extends sharply away from the body, creating a third geometric line. Head turned in sharp profile. The concrete is the co-star: its raw texture, aggressive geometry, its refusal to be beautiful. High-contrast black and white. The image is a diagram of power rendered in shadow.',
  },
  {
    id: 'morocco-dream',
    model: 'A Moroccan woman in her late 20s with long thick dark waves worn loose, cascading to her waist. Her skin is warm olive. She wears an embroidered deep jewel-toned kaftan — richly layered in emerald, sapphire, and gold thread work at the neckline and wide sleeves, the fabric pooling slightly on the tile floor. An ornate gold and emerald headpiece resting across her forehead. Gold chandelier earrings. Stacked hammered gold bracelets. Pointed gold babouche slippers visible at the hem.',
    scene: 'Marrakech riad central courtyard at the amber hour — intricate zellige tile floor, afternoon light filtering through a carved stucco oculus and landing in a warm pool on the tile. She stands at the center of the light pool, arms slightly open at the sides in a gesture between welcome and command. Her gaze cast slightly upward toward the oculus. The carved stucco walls frame her like an illuminated manuscript. Vintage warm film tones; the image feels genuinely ancient.',
  },
  {
    id: 'marble-palazzo',
    model: 'A Greek-Italian woman in her mid-30s with dark hair elaborately pinned up in a Baroque-inspired updo with a few perfect tendrils escaping at the temples. She wears an ivory draped column gown in the finest silk crepe — utterly minimal, held by a single gold clasp at one shoulder. Long single-strand pearl necklace looped twice. Diamond stud earrings. White satin mules. A gold leaf hair pin visible in the updo. The simplicity is expensive.',
    scene: 'Venetian palazzo entrance hall, mid-afternoon: light shafts cut down through frescoed ceilings and land in specific pools on the marble floor. She stands in one such pool — entirely still, chin down, eyes closed. One hand raised to touch the carved stone doorframe. The marble floor throws a faint mirror image below her. Quiet. Monumental. The image feels archival.',
  },
  {
    id: 'kyoto-silence',
    model: 'A Japanese woman in her early 30s with lustrous dark hair styled in a loose, modern interpretation of traditional Japanese upswept kanzashi style — several loose strands falling forward. Her skin is porcelain pale. She wears a silk wrap garment in dusty pale celadon green — cut in a hybrid between a contemporary wrap dress and a kimono, with wide sleeves and a deep-fold collar. A single carved jade hair pin. Thin gold ring on one finger. White tabi socks with wooden geta sandals.',
    scene: 'Kyoto Arashiyama bamboo grove at dawn — pale green light filtering through vertical stalks, the path curving into cool silence ahead. She stands at the exact point where the path bends, facing away from the lens, head slightly bowed, one hand resting at her side. The bamboo is a thousand vertical lines; she is one still vertical among them. The light is the strange pale green specific to this place. Everything whispers. Nothing moves.',
  },
  {
    id: 'maldives-blue',
    model: 'A Jamaican woman in her late 20s with very long box braids in natural black and honey-gold — worn loose, some falling forward over a shoulder. Her skin is deep warm brown. She wears a fluid resort coverup in white — a semi-sheer cotton with crochet cutwork at the hem, worn over a minimal white swimsuit. A natural woven straw hat with a wide brim. Gold shell and pearl jewelry — earrings, anklet, stacked bracelets. Bare feet.',
    scene: 'Maldivian overwater bungalow deck, late morning — the lagoon beneath translucent turquoise, coral visible on the sand floor below, the horizon an unbroken blue line. She sits on the edge of the deck, legs hanging over the water, the ocean breeze moving through her. Posture open and relaxed — leaning back on her palms, face turned toward the horizon. The water below reads like a window to another world. Accurate color: the lagoon the almost-unbelievable color it actually is.',
  },
  {
    id: 'beverly-gold',
    model: 'A Venezuelan-American woman in her mid-30s with warm dark hair highlighted in honey-blonde — worn in loose beachy waves past the shoulder, sun-bleached at the ends. Her skin is warm golden tan. She wears a white linen wide-leg resort suit — the blazer unbuttoned over a white silk bandeau top, trousers with a relaxed fit and a gentle flare. Gold link chain belt. Flat strappy gold sandals. Oversized tortoiseshell sunglasses. Diamond tennis bracelet on one wrist.',
    scene: 'Beverly Hills pool house, late afternoon — white linen curtains drifting in the warm breeze off the pool, brilliant blue water outside casting shifting light patterns on the ceiling. She reclines on a daybed in the open pool house, one arm overhead, the aqueous light playing across her. Her expression is unguarded — genuinely at ease. The pool beyond glows electric blue through gauze curtains. Warm Portra tones, sun-saturated, slightly golden, the kind of California afternoon that lasts forever.',
  },
];

const SHOOT_BY_ID = new Map(PROP_SHOOTS.map(s => [s.id, s]));

// Diverse casting rotated across props lacking a bespoke shoot — real range.
const CASTING = [
  'a deep-ebony East African model with a sculptural short afro and a regal neck',
  'a Black American model with voluminous natural curls and striking bone structure',
  'an East Asian model with a sleek jet-black blunt bob',
  'a South Asian model with long glossy black hair and deep brown skin',
  'a Latina model with warm bronze skin and tousled dark waves',
  'a Scandinavian model with platinum hair and pale luminous skin',
  'a Mediterranean model with olive skin and thick dark waves',
  'a Middle Eastern model with kohl-deep eyes and long dark hair',
  'a mixed-race model with freckled tan skin and copper curls',
  'a Southeast Asian model with golden skin and a sharp chic crop',
  'a fair-skinned redhead model with porcelain skin',
  'a rich-mahogany West African model with braided hair and fierce presence',
];

// Per-category couture styling so engine-built covers still pop with intent.
const CATEGORY_STYLING = {
  editorial:     'a bold architectural couture look — razor tailoring or a dramatic statement piece, confident color, impeccable finish',
  campaign:      'a monumental flowing gown or powerful tailored look that moves with the wind and the landscape',
  street:        'directional street-luxe — statement outerwear, bold accessories, real attitude',
  beauty:        'minimal but striking styling — the face, the skin, and one bold accessory are the entire story',
  'avant-garde': 'experimental sculptural couture — an unconventional, daring silhouette',
  'fine-art':    'a sculptural couture gown or flawless tailoring with the gravity of a masterpiece',
  lifestyle:     'elevated resort luxe — effortless, expensive, sun-warmed, enviable',
};

async function loadProps() {
  const built = await esbuild.build({
    entryPoints: [resolve(ROOT, 'src/lib/creativeProps.ts')],
    bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'silent',
  });
  const mod = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
  return mod.CREATIVE_PROPS;
}

function buildPrompt(prop, index) {
  const c = prop.config;
  const photo = [c.cameraFormat || c.camera, c.lighting, c.colorGrade].filter(Boolean).join(' · ');
  const shoot = SHOOT_BY_ID.get(prop.id);

  // Bespoke shoots carry their own couture wardrobe; engine props get diverse
  // casting + a per-category bold styling direction.
  const casting = shoot
    ? shoot.model
    : `${CASTING[index % CASTING.length]}, styled in ${CATEGORY_STYLING[prop.category] || 'a bold, confident couture look'}`;
  const scene = shoot ? shoot.scene : c.userPrompts[0];

  return [
    `CASTING & STYLING:\n${casting}`,
    `\n\nSCENE & DIRECTION:\n${scene}`,
    photo ? `\n\nPHOTOGRAPHY: ${photo}.` : '',
    `\n\nThis is the HERO COVER for "${prop.name}". Make it hot — magnetic energy and attitude, couture drama, ` +
    `movement in fabric and hair, decisive sculptural light, and color that pops off the page. Render every garment's ` +
    `material and texture at full fidelity; reproduce the model's skin tone exactly — rich, true, luminous. ` +
    `The single most striking frame this scene could ever produce.`,
  ].join('');
}

async function generateOne(prop, index) {
  const userPrompt = buildPrompt(prop, index);
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propId: prop.id, userPrompt, model: MODEL, fullRes: true }),
      });
      let data;
      try { data = await res.json(); } catch { throw new Error(`non-JSON (HTTP ${res.status} — likely timeout)`); }
      if (!res.ok || !data.coverUrl) throw new Error(data.error || `HTTP ${res.status}`);
      const buf = Buffer.from(data.coverUrl.split(',')[1], 'base64');
      writeFileSync(resolve(OUT_DIR, `${prop.id}.jpg`), buf);
      return { id: prop.id, kb: Math.round(buf.length / 1024), attempt, bespoke: SHOOT_BY_ID.has(prop.id) };
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) return { id: prop.id, error: err.message };
      await new Promise(r => setTimeout(r, attempt * 2500)); // 2.5s, 5s, 7.5s
    }
  }
}

async function run() {
  mkdirSync(OUT_DIR, { recursive: true });
  const all = await loadProps();
  let targets = all.map((p, i) => ({ p, i }));
  if (ONLY.length) targets = targets.filter(({ p }) => ONLY.includes(p.id));
  if (!FORCE) targets = targets.filter(({ p }) => !existsSync(resolve(OUT_DIR, `${p.id}.jpg`)));

  const noShoot = all.filter(p => !SHOOT_BY_ID.has(p.id)).map(p => p.id);
  console.log(`Props: ${all.length} | bespoke shoots: ${PROP_SHOOTS.length} | fallback (scene-based): ${noShoot.length}${noShoot.length ? ` [${noShoot.join(', ')}]` : ''}`);
  console.log(`To generate: ${targets.length} | model: ${MODEL} | endpoint: ${ENDPOINT}\n`);
  if (!targets.length) { console.log('All covers present. Use --force to regenerate.'); return; }

  const results = [];
  let cursor = 0;
  async function worker() {
    while (cursor < targets.length) {
      const { p, i } = targets[cursor++];
      process.stdout.write(`  → ${p.id} … `);
      const r = await generateOne(p, i);
      results.push(r);
      console.log(r.error ? `FAIL: ${r.error}` : `ok (${r.kb}KB, try ${r.attempt}${r.bespoke ? '' : ', scene-fallback'})`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));

  const failed = results.filter(r => r.error);
  console.log(`\nDone. ${results.length - failed.length} ok, ${failed.length} failed.`);
  if (failed.length) { failed.forEach(f => console.log(`  FAILED ${f.id}: ${f.error}`)); process.exit(1); }
}

run().catch(e => { console.error(e); process.exit(1); });
