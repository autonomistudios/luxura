import { LOCATION_PRESETS } from "./locationPresets";
import type { LocationPreset } from "./locationPresets";

export type PropCategory =
  | 'editorial'
  | 'campaign'
  | 'street'
  | 'beauty'
  | 'avant-garde'
  | 'fine-art'
  | 'lifestyle'
  | 'cinematic';

export interface CreativePropConfig {
  photoDirection: string;
  locationPreset: LocationPreset | null;
  bg: string;
  lighting: string;
  camera: string;
  cameraFormat: string;
  colorGrade: string;
  userPrompts: string[];   // rotates on every selection — genuinely different scenes within the same mood world
}

export interface CreativeProp {
  id: string;
  name: string;
  tagline: string;
  category: PropCategory;
  mood: string[];
  config: CreativePropConfig;
}

const loc = (id: string): LocationPreset | null =>
  LOCATION_PRESETS.find(p => p.id === id) ?? null;

export const CREATIVE_PROPS: CreativeProp[] = [

  // ── EDITORIAL ──────────────────────────────────────────────────────────────

  {
    id: 'glass-tower',
    name: 'Glass Tower',
    tagline: 'Urban editorial. Fifty floors up. The city belongs to her.',
    category: 'editorial',
    mood: ['Urban', 'Night', 'NYC', 'LED'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('nyc-penthouse'),
      bg: 'custom-bg',
      lighting: 'Moody Cinema',
      camera: 'Street Style (35mm)',
      cameraFormat: 'Leica M · 35mm Film',
      colorGrade: 'Matte Fade Editorial',
      userPrompts: [
        // Scene 1 — penthouse glass wall
        'The subject stands mid-lean against floor-to-ceiling glass fifty floors up, one arm extending into the metal window frame — body language unbothered, self-contained, gaze cast slightly downward with quiet authority. Cool flickers of stark white LED pulse from below, catching every surface and detail. The city dissolves into orange and black geometry far below. Analog film grain softens the electric edges; the reflection in the glass doubles the portrait into something architectural.',
        // Scene 2 — elevator bank
        'A bank of polished steel elevator doors in a Midtown skyscraper lobby, midnight — every surface a dark mirror. She stands centered between two doors, arms at her sides, gaze straight ahead into her own infinite reflection. The lobby lighting is a single warm overhead beam; everything outside that beam is velvet black. The steel doors multiply her into a corridor of identical figures receding behind her.',
        // Scene 3 — rooftop edge
        'Rooftop of a glass tower at blue hour, the parapet wall at her back, the entire Manhattan skyline horizontal behind her at eye level. She sits on the concrete ledge, one knee drawn up, completely at ease with the fifty-story drop. The city lights are a smear of amber and white below the blue sky. Wind moves through her. The scale makes the skyline look like a backdrop someone painted behind her.',
        // Scene 4 — boardroom at night
        'Empty corner boardroom, forty-third floor, the glass walls meeting at a perfect ninety degrees — the city grid visible in both directions simultaneously. She stands at the corner, one hand resting on the glass, looking out at the intersection of two city vectors below. The room is unlit; the only light is the city itself coming through the glass in amber and grey.',
        // Scene 5 — stairwell shaft
        'The interior of a glass and steel spiral staircase inside a corporate tower — each floor a ring of light above and below, the shaft descending into dark. She stands on a mid-floor landing, one hand on the railing, looking upward. Shot from slightly below, the staircase spiraling away above her creates a tunnel of diminishing circles. Cool blue-white light from above; warm amber light from the city outside through the glass walls.',
        // Scene 6 — floor reflection
        'A polished black granite floor in a skyscraper lobby, the ceiling forty feet above — she lies on her back on the floor, one arm outstretched, looking directly up at the camera. The reflection in the granite is perfect: a second figure below, reaching toward the real one. The ceiling above is a grid of recessed LEDs stretching to every edge of the frame. The image reads like a fashion spread and an architecture photograph at the same time.',
      ],
    },
  },

  {
    id: 'lime-wall',
    name: 'Lime Wall',
    tagline: 'Three colors. Zero compromise. Pure editorial logic.',
    category: 'editorial',
    mood: ['Studio', 'Color Pop', 'Graphic', 'Sharp'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: null,
      bg: 'studio-grey',
      lighting: 'Clean & Even',
      camera: 'Natural Eye (50mm)',
      cameraFormat: 'Phase One 150MP · 80mm',
      colorGrade: 'Kodak Ektar 100',
      userPrompts: [
        // Scene 1 — lime tile wall
        'A single vivid lime-green tiled wall commands the entire frame, white grout lines forming a precise grid that curves softly at the edges like a smile. The subject stands square against it — posture deliberate, look precise, the styling anchoring the frame. Even studio lighting leaves no shadow hiding place — every detail rendered at full resolution, sharp and declarative. The subject and the wall exist in complete visual logic together. The image does not need to explain itself.',
        // Scene 2 — cobalt seamless
        'A saturated cobalt-blue seamless paper sweep fills the frame, floor curving into wall with no horizon line. The subject stands in profile, chin lifted, one hand resting at the hip — a single graphic gesture against the field of pure colour. Flat, even studio light renders the garment edge-sharp; the blue is so uniform it reads as a painted plane. No props, no shadow narrative — just colour, posture, and clothing as declarative form.',
        // Scene 3 — split colour field
        'A two-tone backdrop split exactly down the centre — lime on the left, hot magenta on the right — the seam falling along the spine. The subject straddles the divide, half lit in cool green, half in warm pink, gaze straight to lens. The composition is symmetrical to the millimetre. High-key lighting keeps both colour fields perfectly true. A graphic, art-directed image that treats the body as the axis of a colour study.',
        // Scene 4 — yellow cyclorama
        'A bright primrose-yellow cyclorama, infinite and shadowless, a single matching stool at centre. The subject sits, legs angled, one elbow on the knee, expression cool and unbothered. The yellow is relentless and joyful; the garment pops against it at full saturation. A clean beauty-dish wrap renders the figure evenly. The image is confident in its simplicity — one colour, one figure, one perfect pose.',
        // Scene 5 — colour panel grid
        'A wall of square acoustic panels in alternating lime, white, and charcoal forms a modular grid behind the subject. She stands slightly off-centre, the geometry framing her like a specimen. A second hard light throws a crisp, doubled shadow across the panels. The repetition of the grid against the single human figure is the entire tension of the frame. Sharp, modern, declarative.',
        // Scene 6 — white cove, gel rim
        'A pure white infinity cove, immaculate and seamless, lit so cleanly it reads as negative space. A single hard lime-gelled light rakes from camera-left, edging the subject in a thin electric-green rim and casting one long, precise shadow. The contrast of clinical white and one vivid accent is the whole image. The figure is rendered at full resolution, every fibre of the garment crisp.',
      ],
    },
  },

  {
    id: 'paris-night',
    name: 'Paris Night',
    tagline: 'Midnight cobblestones. One coat. The definitive walk.',
    category: 'editorial',
    mood: ['Paris', 'Midnight', 'Couture', 'Rain'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('paris-alley'),
      bg: 'custom-bg',
      lighting: 'Soft Natural',
      camera: 'Street Style (35mm)',
      cameraFormat: 'Leica M · 35mm Film',
      colorGrade: 'Fuji Pro 400H',
      userPrompts: [
        // Scene 1 — Haussmann lane
        'Narrow Haussmann lane at 11pm, the cobblestones still holding the memory of rain — amber café light spills through an arched doorway and catches one edge of the subject mid-stride. She walks — does not pose — caught at the exact stride where one leg extends forward, heel striking stone. Her gaze passes over the right shoulder of the frame into some private distance. Available light only: the café warm, the deep blue of the sky above the buildings, nothing else. Grain. The full quiet of European midnight.',
        // Scene 2 — Pont Alexandre III
        'The Pont Alexandre III at midnight, its gilded Art Nouveau lamps glowing in a receding line, the Seine black and rippling below. She stands at the balustrade, coat collar up, one gloved hand on the cold stone, looking downriver toward the lit dome of Les Invalides. The lamplight gilds her in pools of warm gold against the deep navy night. Reflections smear long on the wet bridge deck. 35mm grain, Parisian and cinematic.',
        // Scene 3 — Métro entrance
        'A Hector Guimard Métropolitain entrance after rain — the green wrought-iron arch and amber globe lamp slick and shining, the steps descending into warm underground light behind her. She pauses at the top of the stair, one hand on the curling iron rail, half-turned to the lens. The contrast of the green iron, amber glow, and midnight blue sky is the whole palette. Available light, soft grain, unmistakably Paris.',
        // Scene 4 — café terrace
        'A shuttered café terrace at 1am, rattan chairs stacked, one striped awning still dripping. She sits alone at the last marble bistro table, a single espresso cup before her, the wet pavement mirroring the café neon in long ribbons of red and gold. Her gaze is elsewhere, unhurried. Warm tungsten from inside the café rakes across her; the street beyond falls to blue. The intimacy of an empty city at night.',
        // Scene 5 — Haussmann courtyard
        'A private Haussmann courtyard at night — symmetrical stone façade, tall shuttered windows, a single one lit gold on the third floor. She stands at the centre of the cobbled cour, looking up toward the light, her coat falling in a clean vertical line. The space is hushed and architectural, the lone warm window the only event in a field of cool stone. Grain, restraint, quiet grandeur.',
        // Scene 6 — patisserie window
        'Outside a patisserie window just past midnight, the interior still warm-lit, gilded display cases glowing behind glass. She stands close to the window, reflected faintly in it, breath barely visible in the cold. The warm amber light from inside washes one side of her face; the dark wet street holds the rest. A small, human, cinematic moment — couture against the everyday tenderness of a Paris night.',
      ],
    },
  },

  {
    id: 'milan-district',
    name: 'Milan District',
    tagline: 'Via Montenapoleone at dusk. Gold stone. Perfect tailoring.',
    category: 'editorial',
    mood: ['Milan', 'Dusk', 'Italian', 'Tailored'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('milan-via'),
      bg: 'custom-bg',
      lighting: 'Sunset Side Glow',
      camera: 'Street Style (35mm)',
      cameraFormat: 'Contax 645 · 80mm Film',
      colorGrade: 'Vintage Warm',
      userPrompts: [
        // Scene 1 — Via Montenapoleone
        'Via Montenapoleone at the golden hour before close — luxury boutique windows glow amber behind her, the Italian stone pavement catching the last of the sunset in warm copper. She stands at a slight angle, one shoulder toward the lens, her look immaculate and intentional. Her gaze is sideways and downward — distracted, or pretending to be. The light from the boutique windows gilds her left side in warmth while the right falls into cool shadow. Vintage analog warmth through every tone; the image belongs to a different era and knows it.',
        // Scene 2 — Galleria Vittorio Emanuele
        'Beneath the glass-and-iron dome of the Galleria Vittorio Emanuele II at dusk — the mosaic floor stretching out in concentric patterns, the great cupola catching the last grey-gold light above. She stands at the central octagon, the four arms of the arcade receding around her, perfectly composed within the symmetry. Warm boutique light spills from the colonnade; the scale is operatic. Vintage warm tones, the architecture a 19th-century cathedral of commerce.',
        // Scene 3 — Brera cobblestones
        'A quiet Brera district lane at dusk, narrow and cobbled, ivy spilling over a warm-ochre wall, a single vintage Vespa leaned against it. She walks the centre of the lane toward the lens, unhurried, the shuttered windows glowing softly above. The last sun rakes down the street in long warm bars. The neighbourhood feels lived-in and effortless — Italian elegance without performance. Contax warmth, fine grain.',
        // Scene 4 — Duomo rooftop
        'The marble rooftop terrace of the Duomo at sunset — a forest of gothic spires and flying buttresses around her, the pink-white marble glowing in the low gold light. She stands among the pinnacles, the city of Milan hazing out below, the sky behind a wash of apricot and lavender. The intricate stone lacework frames her on every side. Monumental, warm, and impossibly elegant.',
        // Scene 5 — Via Manzoni tram
        'Via Manzoni in the blue-gold minutes after sunset — a vintage orange Milanese tram crossing the frame in soft motion blur behind her, its warm interior lights streaking. She stands on the pavement, still and sharp against the moving city, hand in coat pocket. The wet tram rails catch the last light. The contrast of her stillness and the gliding tram is the image. Cinematic, warm, alive.',
        // Scene 6 — boutique doorway
        'The threshold of a Montenapoleone boutique at closing — she stands half in the warm gilded interior, half on the cool stone street, one hand on the brass door handle. Behind her, softly lit mannequins and glass vitrines glow gold; before her, the blue dusk of the avenue. The doorway frames her precisely. Vintage warmth, the quiet authority of a house that needs no signage.',
      ],
    },
  },

  {
    id: 'seoul-arcade',
    name: 'Seoul Arcade',
    tagline: 'Polished marble. Glass atrium. Architecture as backdrop.',
    category: 'editorial',
    mood: ['Seoul', 'Architecture', 'White', 'Modern'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('seoul-arcade'),
      bg: 'custom-bg',
      lighting: 'Beauty Overhead',
      camera: 'Editorial Wide (24mm)',
      cameraFormat: 'Hasselblad H6D · 100mm',
      colorGrade: 'Nordic Matte',
      userPrompts: [
        // Scene 1 — marble arcade
        'Seoul luxury arcade, floor-to-ceiling polished marble, a soaring glass atrium diffusing cool white light from above in broad even sheets. The subject stands dead-center in the widest section of the corridor, arms at her sides, perfectly still — her presence commanding the architecture around her. The reflection in the marble floor is as sharp as the figure above it. Other shoppers are soft ghosts in the distance. The light is institutional and beautiful: overhead, clean, unsparing. Every surface, every edge rendered with clinical precision. Quiet. Modern. Massive.',
        // Scene 2 — glass escalator bank
        'A bank of glass escalators ascending through a white atrium, their steel undersides and clear balustrades catching cool diffused light. She stands on a descending step, hand on the moving rail, the criss-crossing diagonals of the escalators framing her in receding geometry. The palette is white, silver, and pale grey; the light is flat and architectural. A study in clean motion and modern Seoul scale.',
        // Scene 3 — minimalist atrium
        'A vast minimalist white atrium — seamless plaster walls, a single floating staircase, light pouring from a clerestory slot high above. She stands alone in the centre of the empty volume, dwarfed by negative space, her figure the only mark in a field of white. The Nordic-matte grade keeps everything cool and desaturated. Architectural emptiness as luxury; the garment the sole point of focus.',
        // Scene 4 — Dongdaemun Design Plaza
        'Inside the flowing white curves of Dongdaemun Design Plaza — Zaha Hadid\'s seamless parametric walls sweeping overhead, ribbon-like and futuristic, lit by recessed cove lighting. She stands where two curved planes converge, the architecture bending around her like liquid. The light is cool and even; the surfaces glow softly. Sci-fi elegance, every line of the building and the garment rendered razor-sharp.',
        // Scene 5 — beauty hall
        'A Seoul department-store beauty hall after hours — rows of backlit white counters glowing softly, mirrored columns multiplying the light, the floor a sheet of reflective pale stone. She stands in the central aisle, the symmetrical glow receding on both sides. The illumination is clean, clinical, and flattering; the whole space hums white and silver. Modern, polished, quietly opulent.',
        // Scene 6 — rooftop reflection pool
        'A rooftop infinity reflection pool at a Seoul tower at blue hour — a perfect sheet of still water mirroring the glass skyline and pale sky. She stands at the water\'s edge, the city towers doubled beneath her, the horizon a cool gradient of grey-blue. The light is soft and even; the reflection makes the composition symmetrical top to bottom. Calm, vast, architectural.',
      ],
    },
  },

  // ── CAMPAIGN ───────────────────────────────────────────────────────────────

  {
    id: 'amalfi-power',
    name: 'Amalfi Power',
    tagline: 'One image. One billboard. One million decisions made.',
    category: 'campaign',
    mood: ['Amalfi', 'Mediterranean', 'Power', 'Golden Hour'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('amalfi-path'),
      bg: 'custom-bg',
      lighting: 'Sunset Side Glow',
      camera: 'Soft Background (85mm)',
      cameraFormat: 'Phase One 150MP · 80mm',
      colorGrade: 'Cinematic Teal & Orange',
      userPrompts: [
        // Scene 1 — cliffside path
        'A cliffside path above the Mediterranean — the sun a burning coin above the water, casting one long shadow that anchors the subject to the earth. She stands square to the camera: shoulders back, chin level, one hand brushing the ancient stone wall. The sea behind her is not blue; it is deep teal dissolving into black at the edges. Her skin reads like warm amber under the gods-light. The image is simple, massive, and commanding.',
        // Scene 2 — lemon grove terrace
        'A terraced lemon grove on the Amalfi coast, the rows of silver-leafed trees stepping down the hillside toward the sea in perfect agricultural geometry. Late afternoon sun rakes across from the left, every lemon glowing. She stands at the end of a row with the sea visible between the trees behind her, arms loose, posture completely settled. The air has visible warmth. The image belongs to no particular decade.',
        // Scene 3 — ancient fishing dock
        'A centuries-old stone dock at the base of the Amalfi cliffs — the water so clear you can see every stone on the bottom through it. The dock is narrow, barely three feet wide, extending into the cove. She stands at the far end, the rock face rising behind her, the open sea ahead. Golden hour from the left cuts across the stone and water in long amber planes. Shot from low at water level, the horizon very close.',
        // Scene 4 — whitewashed village square
        'A whitewashed piazza in a cliffside village above the Amalfi coast — terracotta pots overflowing with bougainvillea, the sea visible through an archway at the far end of the square. She stands in the archway, framed perfectly by the arch, the sea blazing behind her. The sunlight through the archway halos her entirely. Everything in the square is in warm shade; she is the only element in direct light.',
        // Scene 5 — coastal road bend
        'The famous Amalfi coast road at a sharp cliff-edge bend — the sea dropping away hundreds of feet to the left, the rock face rising to the right, the road itself barely wide enough for two cars. She stands at the apex of the bend, the entire sweep of the coastline visible behind her in both directions — village clusters and headlands extending to the horizon. Shot at golden hour, the sea a deep blue-green, the cliffs orange.',
        // Scene 6 — boat at anchor
        'A wooden fishing boat anchored in a Positano cove at late afternoon — the hull weathered blue and white, the water beneath transparent turquoise. She sits at the bow, legs over the edge, feet above the water, looking back over her shoulder at the village stacked up the cliff behind her. The boat rocks gently; the light catches the water in shifting patterns across her. The village is a mosaic of terracotta, white, and deep green rising behind.',
      ],
    },
  },

  {
    id: 'dust-and-gold',
    name: 'Dust & Gold',
    tagline: 'Sahara at last light. She and the horizon are the same thing.',
    category: 'campaign',
    mood: ['Desert', 'Golden Hour', 'Sahara', 'Monumental'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('sahara-dune'),
      bg: 'custom-bg',
      lighting: 'Sunset Side Glow',
      camera: 'Editorial Wide (24mm)',
      cameraFormat: 'Canon 1DX · 85mm',
      colorGrade: 'Vintage Warm',
      userPrompts: [
        // Scene 1 — dune crest
        'Saharan dune crest at the last light before dark — the wind has sculpted the sand into a single arcing ridgeline that the subject stands at the apex of, as if she is the reason the line exists. The desert breeze moves through her, every gust visible in the way she holds herself against it. Her skin absorbs the amber raking light the same way the sand does; she and the landscape are one color system. Arms loose at her sides, head tilted slightly back — the posture of someone who owns the horizon. Long shadow trailing behind her into deep ochre. Shot from slight below-eye-level, the sky enormous above.',
        // Scene 2 — caravan path
        'A lone caravan path across an endless dune field at golden hour, a single line of footprints trailing to the horizon behind her. She walks away from the lens into the vastness, scarf and garment lifting in the wind, the only vertical in a world of soft curves. The low sun rakes the ripples of the sand into gold and shadow. Monumental scale, warm vintage tones, the solitude of the deep desert.',
        // Scene 3 — desert oasis
        'The edge of a desert oasis at dusk — a still pool ringed by date palms, the dunes glowing copper beyond. She stands at the water\'s edge, her reflection perfect in the glassy surface, the palms silhouetted against an apricot sky. The contrast of life and emptiness, water and sand, is the whole image. Warm raking light, fine grain, an oasis like a held breath.',
        // Scene 4 — mud-brick ksar
        'Against the towering mud-brick wall of an ancient ksar at golden hour — the earthen architecture glowing terracotta, its geometric crenellations casting hard shadows. She stands at the base, dwarfed by the timeworn wall, one hand resting on the warm clay. The ochre of the building and the amber of her skin are one palette. Vintage warmth; the image could be from any century.',
        // Scene 5 — sandstorm veil
        'The leading edge of a sandstorm at the horizon, a veil of amber dust diffusing the low sun into a soft burning disc. She stands her ground as the wind sweeps fine sand past her in luminous streaks, garment whipping, eyes calm. The atmosphere turns everything monochrome gold and hazy. Dramatic, elemental, the figure unbothered at the centre of the storm.',
        // Scene 6 — dune at blue hour
        'Atop a great dune at the blue hour after sunset — the western sky still bruised orange, the first stars appearing in the deepening indigo above. She sits at the crest, knees drawn up, looking out at the cooling desert. The sand holds the last warmth as a faint glow; the sky dominates. Quiet, vast, the day surrendering to night across an ocean of sand.',
      ],
    },
  },

  {
    id: 'scottish-storm',
    name: 'Scottish Storm',
    tagline: 'Purple moorland. Pewter sky. Power that needs no city.',
    category: 'campaign',
    mood: ['Scotland', 'Storm', 'Dramatic', 'Raw'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('scotland-moor'),
      bg: 'custom-bg',
      lighting: 'Deep Shadow',
      camera: 'Editorial Wide (24mm)',
      cameraFormat: 'Canon 1DX · 85mm',
      colorGrade: 'Bleach Bypass',
      userPrompts: [
        // Scene 1 — moorland shaft
        'Scottish highland moorland at dusk, infinite purple heather under a brooding pewter sky — storm light breaking through in one shaft that catches the subject and nothing else. Her stance is wide and grounded, both hands at her sides, gaze level and direct into the lens. The wind is actively bending the heather around her. The sky is theatrical: anvil clouds, a single break in the grey, the entire distance compressed into silver and violet. Bleach bypass processing desaturates everything except her skin, which reads warm and alive against the cold landscape. The image is adversarial and triumphant.',
        // Scene 2 — sea cliff
        'A black basalt sea cliff on the Scottish coast, the North Atlantic hurling white spray up the rock face behind her. She stands near the edge, coat snapping in the gale, utterly composed against the violence of the water. The sky and sea are gunmetal and slate; the spray hangs in suspended sheets. Bleach-bypass desaturation leaves only her skin warm. Raw, elemental, triumphant.',
        // Scene 3 — standing stone
        'A lone neolithic standing stone on a windswept moor under storm light — the monolith ancient and lichen-streaked, taller than the figure beside it. She rests one hand on the cold stone, gaze to the horizon, the heather rolling away in every direction. A single break in the anvil clouds throws a shaft across the scene. The pairing of human and millennia-old stone is the image. Desaturated, raw, mythic.',
        // Scene 4 — loch mirror
        'A highland loch at first light, the water a perfect pewter mirror, mist clinging to the far hills. She stands ankle-deep at the shore, the reflection doubling her against the still surface, mountains hazing behind. The palette is silver, slate, and muted violet; only her skin holds warmth. The stillness after the storm — vast, cold, and serene.',
        // Scene 5 — castle crag
        'A ruined Scottish castle silhouetted on a rocky crag against a turbulent dusk sky, the last storm light raking its broken walls. She stands on the heather slope below, the fortress looming behind, both rendered in high-contrast bleach-bypass grey. The wind drives cloud across the sky in streaks. Dramatic, historic, the figure small but unbowed against the ruin and the weather.',
        // Scene 6 — rain sweep
        'A heather hillside as a wall of rain sweeps across the glen, a single shaft of sun punching through behind her to light the falling water silver. She faces into the weather, hair and garment streaming, fully present in the storm. The distant hills dissolve into the downpour. Bleach-bypass strips the colour to slate and silver, her skin the only warmth. Cinematic, defiant, alive.',
      ],
    },
  },

  {
    id: 'above-clouds',
    name: 'Above the Clouds',
    tagline: 'Alpine meadow. Cloud sea below. The world made small.',
    category: 'campaign',
    mood: ['Swiss Alps', 'Elevated', 'Pure', 'White'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('swiss-alpine'),
      bg: 'custom-bg',
      lighting: 'Soft Natural',
      camera: 'Editorial Wide (24mm)',
      cameraFormat: 'Phase One 150MP · 80mm',
      colorGrade: 'Fuji Pro 400H',
      userPrompts: [
        // Scene 1 — meadow above clouds
        'Swiss alpine meadow above the cloud line — wildflowers at her feet, the cloud sea below glowing white and formless, jagged snow peaks emerging into pure blue above. She faces away from the lens, arms open slightly at her sides — one small warm shape in an infinite cold blue-and-white world. The scale of the environment dwarfs the figure entirely; the wind moves through her. Shot wide at 24mm, the whole landscape visible, the cloud sea filling the lower third. The light is the diffused brilliance of high altitude: clean, cool, and shadowless. Silence made visible.',
        // Scene 2 — glacier ridge
        'A glacier ridge at altitude, the ice glowing faint cerulean in the crevasses, snow peaks marching to the horizon under a flawless blue sky. She stands on a wind-scoured saddle of snow, garment crisp against the white, breath faintly visible. The light is blinding and shadowless, the air visibly thin and clean. Vast, cold, and serene — the human a single warm note in a world of ice.',
        // Scene 3 — chalet balcony
        'The timber balcony of an alpine chalet floating above a sea of cloud at dawn, the railing dusted with frost, snow peaks pink with first light beyond. She leans on the wooden rail in a soft layer, a cup of something warm in hand, looking out at the cloud ocean. The contrast of warm rustic wood and the infinite cold view is the image. Soft natural light, Fuji tones, quiet luxury.',
        // Scene 4 — snow saddle
        'A high snow saddle between two granite peaks, the wind lifting a fine veil of spindrift off the ridge behind her. She walks the crest toward the lens, small against the towering rock, the sky a deep high-altitude blue. The snow is sculpted into hard wind-ribs. Clean, shadowless brilliance; the scale monumental. A figure crossing the roof of the world.',
        // Scene 5 — alpine lake
        'A still alpine tarn at dawn mirroring the surrounding snow peaks and pale sky, the water glassy and ice-cold. She stands at the stony shore, the reflection perfect beneath her, the amphitheatre of mountains hazing in the cool morning light. The palette is white, granite-grey, and soft blue. The silence is total; the image splits cleanly between real and reflected worlds.',
        // Scene 6 — cable-car platform
        'A cable-car arrival platform perched on a peak above the clouds, steel cables sweeping down into the white below, the valley invisible beneath the cloud sea. She stands at the open edge of the platform, wind in her hair, the engineering and the void framing her. The light is high, cool, and clean. Modern alpine grandeur — human ingenuity at the threshold of the sky.',
      ],
    },
  },

  // ── STREET ─────────────────────────────────────────────────────────────────

  {
    id: 'tokyo-platform',
    name: 'Tokyo Platform',
    tagline: 'Still body. Blurred train. The city moves; she does not.',
    category: 'street',
    mood: ['Tokyo', 'Subway', 'Motion Blur', 'Cool'],
    config: {
      photoDirection: 'STREET_STYLE_CANDID',
      locationPreset: loc('tokyo-crossing'),
      bg: 'custom-bg',
      lighting: 'Deep Shadow',
      camera: 'Street Style (35mm)',
      cameraFormat: 'Leica M · 35mm Film',
      colorGrade: 'Nordic Matte',
      userPrompts: [
        // Scene 1 — platform, train blur
        'A Tokyo subway platform just as the train blurs past — the subject stands completely still, planted on the yellow safety line. The train becomes a streak of green-gold light behind her, motion blur erasing everything except her stillness. She looks slightly off-camera — not quite a pose, not quite candid — the kind of expression that exists for no audience. Cool fluorescent overhead light cuts down hard; the tiled floor throws a faint reflection of her silhouette. 35mm grain, real shadow, the specific fluorescent color cast of underground infrastructure.',
        // Scene 2 — inside the car
        'Inside a near-empty Tokyo train car at night — rows of empty seats, chrome handrails and ceiling straps receding, the black windows reflecting the cool interior light. She stands holding a strap, swaying slightly with the motion, gaze level and inward. The city lights streak past the windows in soft blur. Nordic-matte cool tones, fluorescent and precise. The specific solitude of late-night transit.',
        // Scene 3 — ticket concourse
        'A vast Tokyo station ticket concourse, ranks of automated gates glowing pale green, the polished floor stretching out under hard fluorescent banks. She stands amid the gates, the only still figure as soft-blurred commuters stream past on either side. The architecture is clean, grey, and infinite. Cool colour cast, sharp on her, motion everywhere else — order and flow rendered at scale.',
        // Scene 4 — escalator tube
        'A long tiled escalator tunnel descending into the Tokyo underground, banks of fluorescent strips running the ceiling to a vanishing point. She stands on a step mid-descent, hand on the rubber rail, framed by the converging lines of the tube. The light is clinical and even; the tile gleams faintly. Cool, geometric, the infrastructure itself the set. Nordic-matte restraint.',
        // Scene 5 — platform bench
        'A quiet Tokyo platform at midnight, a single illuminated vending machine glowing red-and-white against the tiled wall, a lone bench beside it. She sits at the end of the bench, the vending-machine light washing one side of her, the rest of the platform in cool shadow. The tracks are dark and empty. An image about waiting — still, cinematic, the city paused.',
        // Scene 6 — doors opening
        'The exact moment the train doors slide open — she stands framed dead-centre in the doorway, the car\'s cool interior light behind her, the platform\'s fluorescent glow ahead, caught between the two. A faint motion blur edges the doors. Her stance is poised, mid-step, neither in nor out. The threshold as composition — precise, modern, the geometry of the doorway holding her.',
      ],
    },
  },

  {
    id: 'brooklyn-gold',
    name: 'Brooklyn Gold',
    tagline: 'Steel cables. East River amber. Effortless on every bridge.',
    category: 'street',
    mood: ['Brooklyn', 'Golden Hour', 'Film', 'NYC'],
    config: {
      photoDirection: 'STREET_STYLE_CANDID',
      locationPreset: loc('dumbo-arch'),
      bg: 'custom-bg',
      lighting: 'Sunset Side Glow',
      camera: 'Street Style (35mm)',
      cameraFormat: 'Canon AE-1 · 50mm Film',
      colorGrade: 'Kodak Portra 400',
      userPrompts: [
        // Scene 1 — Manhattan Bridge arch
        'DUMBO Brooklyn at golden hour — the Manhattan Bridge stone arch perfectly framing a shaft of amber light on cobblestone. The subject is mid-stride through the arch, one foot slightly raised, the motion caught between steps. The light from behind the arch creates a warm halo around her; her shadow stretches long on the cobblestones ahead. She is not performing for the camera. Film grain, warm Portra tones, the specific amber of late summer New York. The city is proof she belongs in it.',
        // Scene 2 — Brooklyn Heights promenade
        'The Brooklyn Heights Promenade at golden hour, the full Lower Manhattan skyline glowing across the East River behind her, the water catching the low sun in copper. She leans on the railing in profile, looking at the towers, the warm light gilding her. Joggers and strollers blur softly past. Portra warmth, fine grain — the classic New York vista, effortless and unposed.',
        // Scene 3 — brownstone stoop
        'A tree-lined Brooklyn brownstone block in late-afternoon light — warm sandstone steps, wrought-iron rails, golden light filtering through the canopy. She sits on the stoop, elbows on knees, relaxed and at home, dappled light across her. A bicycle leans against the rail. The image is intimate and lived-in; warm Portra tones, the specific gold of a New York September.',
        // Scene 4 — Williamsburg waterfront
        'The Williamsburg waterfront at golden hour, the Manhattan skyline across the river, an East River ferry pulling in behind her. She stands on the boardwalk, wind off the water, the warm light flaring slightly off the river. The industrial-chic edge of Brooklyn frames the scene. Portra warmth, candid posture — she belongs to the city and barely notices it.',
        // Scene 5 — elevated platform
        'An elevated outdoor subway platform in Brooklyn at golden hour — the J train\'s steel structure and the borough rooftops spread below, warm light raking down the tracks. She stands at the platform edge, the city sprawling behind her, caught in an unguarded moment. The amber light and the rust-and-steel infrastructure are the palette. Film grain, real New York texture.',
        // Scene 6 — rooftop water towers
        'A Brooklyn rooftop at sunset, the iconic wooden water towers silhouetted against a burning orange sky, tar-paper and brick underfoot, the skyline beyond. She stands among the rooftop clutter, jacket open, the whole borough glowing below. The light is pure late-summer amber. Portra tones, grain, the romance of the New York rooftop at the day\'s end.',
      ],
    },
  },

  {
    id: 'shibuya-midnight',
    name: 'Shibuya Midnight',
    tagline: 'Every neon reflected in every puddle. She walks through it all.',
    category: 'street',
    mood: ['Tokyo', 'Neon', 'Rain', 'Midnight'],
    config: {
      photoDirection: 'STREET_STYLE_CANDID',
      locationPreset: loc('tokyo-crossing'),
      bg: 'custom-bg',
      lighting: 'Moody Cinema',
      camera: 'Street Style (35mm)',
      cameraFormat: 'Leica M · 35mm Film',
      colorGrade: 'Cross Process',
      userPrompts: [
        // Scene 1 — Shibuya crossing
        'Shibuya pedestrian crossing at midnight after rain — neon from every direction overhead, the wet pavement mirroring the chaos of light in abstract pools of color. She walks alone through the crossing, her posture perfect and pace unhurried. Around her, blurred figures move in every direction. She is the only still thing. Cross-process color makes the neons burn unnaturally vivid — cyan, magenta, orange.',
        // Scene 2 — convenience store doorway
        'The doorway of a 24-hour Tokyo convenience store at 2am — the interior fluorescent white pouring onto the wet pavement outside, the neon signs of the street behind reflected in the puddles. She stands in the open doorway, one shoulder against the frame, face half in the harsh white light and half in the neon-painted dark outside. The contrast between the clinical interior light and the vivid street color is the entire image.',
        // Scene 3 — Shinjuku underpass
        'The pedestrian underpass beneath Shinjuku station — tiled walls covered in commercial posters, a long corridor of overhead fluorescent strips receding to a vanishing point. At 11pm the underpass is in motion: salarymen, students, couples. She moves against the flow — the only person not in a hurry, the only person looking into the lens. The fluorescent strips create a strobe of light and shadow across her face as she moves through them.',
        // Scene 4 — Harajuku takeshita street
        'Takeshita Street in Harajuku at dusk — the narrow pedestrian street lined with pastel shopfronts, fairy lights strung overhead, the whole street glowing pink and gold. It is crowded. She is framed by the crowd without being consumed by it, standing slightly above eye level on a small step, looking down the street. The crowd below is soft motion; she is sharp and still. The pastel color palette is saturated to its limit.',
        // Scene 5 — Ginza at rain
        'Ginza at midnight in the rain — the wide boulevard reflecting every luxury logo and LED billboard in the wet black asphalt. She stands at a pedestrian crossing, the red light above her, umbrella closed and held at her side — making no attempt to avoid the rain. The entire street is a mirror: the Chanel logo, the Dior façade, the rows of streetlights, all doubled in the wet road. Her reflection stretches long and distorted below her.',
        // Scene 6 — Tokyo vending machine alley
        'A narrow Tokyo alley lined entirely with vending machines — their combined glow painting the concrete walls in shifting blocks of red, blue, and white. She leans against one machine, one foot up against it, the vending machine light from behind her casting her face into silhouette while illuminating the edges of her look. The alley behind her is a corridor of glowing panels receding into darkness. The scene is completely quiet — just her and the machines.',
      ],
    },
  },

  // ── BEAUTY ─────────────────────────────────────────────────────────────────

  {
    id: 'close-study',
    name: 'The Close Study',
    tagline: 'Face as landscape. Every pore a universe.',
    category: 'beauty',
    mood: ['Macro', 'Luminous', 'Intimate', 'Precise'],
    config: {
      photoDirection: 'BEAUTY_EDITORIAL',
      locationPreset: null,
      bg: 'studio-grey',
      lighting: 'Beauty Overhead',
      camera: 'Ultra Close-Up (Macro)',
      cameraFormat: 'Hasselblad H6D · 100mm',
      colorGrade: 'True Life Accurate',
      userPrompts: [
        // Scene 1 — butterfly lit 45-degree turn
        'A beauty study from crown to collarbone — the face turned at a precise 45-degree angle, the near eye burning directly into the lens with absolute quiet intensity. Butterfly lighting from directly above creates perfect symmetry: the shadow beneath the nose exact, the cheekbones sculpted. Her skin is the event: every plane catching the overhead light differently, dewy and alive, subsurface warmth visible at the high points. Just the architecture of a human face rendered at the highest possible resolution.',
        // Scene 2 — eyes closed, profile
        'Extreme close beauty study — pure profile, eyes closed, the lashes casting tiny precise shadows on the upper cheek. The lighting is a single strip source from behind, rimming the bridge of the nose and the cupid bow in a thin line of brilliance. The rest of the face is in deep luminous shadow. The image is entirely about light tracing the topography of a face. Shot at absolute maximum macro, the skin texture visible as a landscape.',
        // Scene 3 — direct stare, flat light
        'Full-face beauty study, dead-center, eyes burning directly into the lens with no expression — not neutral, but present. Flat frontal lighting that reveals rather than sculpts: every pore, every eyelash, the exact color of the iris mapped at full resolution. The background is absolute black. She is the only thing in the image; the frame is entirely her face. The image is clinical and intimate simultaneously.',
        // Scene 4 — three-quarter, Rembrandt
        'Three-quarter face, the classic Rembrandt triangle of light on the shadow cheek. One eye fully lit, one in shadow, the nose casting a long diagonal down the face. The light source is warm and directional — a single key at forty-five degrees. Her skin absorbs the light at the high points and recedes into warm shadow at the hollows. The image reads like a Dutch masterwork portrait, rendered in the highest modern resolution.',
        // Scene 5 — looking down, crown shot
        'Shot from directly above — the subject looking straight down, the camera at the crown of her head. Her face fills the frame from above: the perfect geometry of the part, the forehead, the arc of the brows, the bridge of the nose, and the closed lips. The lighting is soft and even from a large overhead source. The image is abstract and architectural — the face as geometry, shot from an angle a portrait painter would never attempt.',
        // Scene 6 — lips and jaw only
        'Extreme macro beauty fragment — cropped tightly to the lower face only: lips, jaw, and the line of the chin. The lips are the subject, rendered at maximum resolution, every surface detail visible. A rim light from behind outlines the jaw in a thin arc of brilliance. The crop removes the eyes entirely; without them, the lips become something between a landscape and an abstract shape. Shot on medium format, every micro-detail of the skin texture visible.',
      ],
    },
  },

  {
    id: 'wet-light',
    name: 'Wet Light',
    tagline: 'Bronze skin. White fabric. Directional sun. One of those images.',
    category: 'beauty',
    mood: ['Bronze', 'Water', 'Sun', 'Cinematic'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('santorini-edge'),
      bg: 'custom-bg',
      lighting: 'Sunset Side Glow',
      camera: 'Soft Background (85mm)',
      cameraFormat: 'Contax 645 · 80mm Film',
      colorGrade: 'Kodak Portra 400',
      userPrompts: [
        // Scene 1 — bronze lean
        'She leans forward, arms resting along her legs, gaze cutting directly into the lens — no performance, just presence. The moisture on her skin catches directional late-afternoon sun and turns it into something between bronze and fire. The light bleaches and sculpts every edge, the movement of the scene captured mid-breath. Warm natural sun, low and raking, models every shadow across her body. Subtle analog film grain and warm amber undertones — the whole image feels like a memory of heat.',
        // Scene 2 — Santorini terrace
        'A whitewashed Santorini terrace at golden hour — blue domes and the caldera sea beyond, the lime-washed walls glowing warm in the low sun. She stands against a curved white wall, the directional light carving a hard shadow beside her, skin luminous and bronze. The contrast of brilliant white architecture and warm skin is the image. Contax warmth, fine grain, the heat of the Aegean.',
        // Scene 3 — infinity pool edge
        'The vanishing edge of an infinity pool at sunset, the water spilling toward a sea horizon that matches it exactly. She stands waist-deep at the edge, arms resting on the stone lip, looking out, the low sun gilding the water and her wet skin. The whole frame is gradients of gold and blue. Cinematic, warm, the boundary between pool and sea erased.',
        // Scene 4 — sun-drenched wall
        'A bare sun-bleached plaster wall in raking late-afternoon light, a single hard-edged shadow falling across it. She stands close to the wall, half in the blazing light and half in shadow, the directional sun sculpting her cheekbone and collarbone in bronze and deep umber. Minimal, graphic, the play of hard light and warm skin the entire study. Portra warmth, grain.',
        // Scene 5 — water and droplets
        'An extreme warm-toned study — wet hair swept back, water droplets beading and catching the low sun like sparks across the skin. She tilts her face up into the light, eyes half-closed, mid-breath. The directional sun turns every droplet into a point of fire and every plane of skin to bronze. Shallow focus, Contax rendering, the sensual heat of late sun on water.',
        // Scene 6 — volcanic rock
        'Golden hour on dark volcanic rock at the sea\'s edge, the surf throwing fine spray that hangs glowing in the low sun. She stands on the black stone, the warm light and cool spray meeting on her skin, the sea blazing behind. The contrast of black rock, white spray, and bronze skin is elemental. Warm film tones, grain, the raw beauty of a volcanic coast.',
      ],
    },
  },

  // ── AVANT-GARDE ────────────────────────────────────────────────────────────

  {
    id: 'brutalist-power',
    name: 'Brutalist Power',
    tagline: 'Raw concrete. Hard shadow. Fashion as architecture.',
    category: 'avant-garde',
    mood: ['Brutalist', 'Berlin', 'B&W', 'Geometric'],
    config: {
      photoDirection: 'AVANT_GARDE_COUTURE',
      locationPreset: loc('berlin-brutalist'),
      bg: 'custom-bg',
      lighting: 'Deep Shadow',
      camera: 'Editorial Wide (24mm)',
      cameraFormat: 'Leica SL2 · 24mm Wide',
      colorGrade: 'High Contrast B&W',
      userPrompts: [
        // Scene 1 — concrete courtyard
        'East Berlin brutalist concrete courtyard at noon — raw poured concrete casting hard geometric shadows, the subject positioned exactly where two shadow planes intersect. Her silhouette rhymes with the angular architecture surrounding her. One arm extends sharply away from the body, creating a third geometric line in the composition. Head turned in sharp profile. The concrete is the co-star: its raw texture, its aggressive geometry, its refusal to be beautiful. High-contrast black and white removes every concession to warmth. The image is a diagram of power, rendered in shadow.',
        // Scene 2 — concrete stairwell
        'A brutalist concrete stairwell shot from below — raw board-marked flights zig-zagging upward, a hard slot of daylight slicing diagonally across the treads. She stands on a mid-landing, one hand on the blunt concrete rail, body aligned to the architecture\'s diagonals. The composition is all intersecting planes and shadow. High-contrast monochrome; brutal, geometric, severe.',
        // Scene 3 — pilotis colonnade
        'A long colonnade of raw concrete pilotis casting a rhythm of hard shadows across a bare plaza at noon. She stands between two columns, the repeating verticals and their shadows striping the frame. Her single still figure breaks the relentless rhythm of the architecture. Stark high-contrast black and white, every aggregate texture of the concrete visible. Monumental, cold, exact.',
        // Scene 4 — parking ramp
        'The spiralling ramp of a brutalist concrete parking structure, the curved walls and circular void rendered in hard noon light and deep shadow. She stands on the ramp\'s curve, the sweeping concrete band leading the eye around and past her. The geometry is dizzying and severe. High-contrast monochrome, the raw structure as pure abstract form.',
        // Scene 5 — light slot
        'A vast blank concrete wall pierced by a single narrow slot of light, a hard blade of sun cutting across the grey expanse. She stands within the slot of light against the immense dark wall, tiny and exact, her shadow thrown long. The composition is brutal minimalism — one figure, one wall, one shard of light. Severe black and white, the concrete monolithic.',
        // Scene 6 — brutalist rooftop
        'The rooftop of a brutalist housing block against a flat white sky — raw concrete parapets, ventilation stacks, hard geometric forms. She stands among the rooftop structures, the city haze beyond, the architecture\'s blunt geometry framing her. The light is hard and directionless. High-contrast monochrome strips it to pure form and shadow — austere, powerful, uncompromising.',
      ],
    },
  },

  {
    id: 'morocco-dream',
    name: 'Morocco Dream',
    tagline: 'Terracotta light. Carved stucco. An image from outside time.',
    category: 'avant-garde',
    mood: ['Morocco', 'Warm Light', 'Ancient', 'Geometric'],
    config: {
      photoDirection: 'AVANT_GARDE_COUTURE',
      locationPreset: loc('marrakech-riad'),
      bg: 'custom-bg',
      lighting: 'Sunset Side Glow',
      camera: 'Natural Eye (50mm)',
      cameraFormat: 'Canon AE-1 · 50mm Film',
      colorGrade: 'Vintage Warm',
      userPrompts: [
        // Scene 1 — riad courtyard
        'Marrakech riad central courtyard at the amber hour — intricate zellige tile floor, a lone orange tree at center, afternoon light filtering through a carved stucco oculus overhead and landing in a single warm pool on the tile. She stands at the center of the light pool, arms slightly open at the sides in a gesture between welcome and command. Her gaze is cast slightly upward toward the oculus. The carved stucco walls frame her like an illuminated manuscript. Vintage warm film tones; the image feels genuinely ancient.',
        // Scene 2 — tiled hammam
        'A Marrakech hammam interior — zellige walls in deep teal and amber, a domed ceiling pierced with star-shaped skylights that scatter coins of light through faint steam. She stands in the warm haze, the patterned light falling across her, the air thick and golden. The geometry of the tilework and the soft drift of steam are the image. Vintage warmth, grain, an atmosphere centuries deep.',
        // Scene 3 — carved cedar door
        'A monumental carved-cedar Moroccan door studded with brass, set into an ochre tadelakt wall at golden hour. She stands in the half-open doorway, one hand on the ancient wood, warm interior light glowing behind her, the amber street before. The intricate carving frames her like a portal between worlds. Vintage warm tones; the craftsmanship and age are palpable.',
        // Scene 4 — medina rooftop
        'A riad rooftop over the Marrakech medina at dusk — a sea of flat ochre rooftops, a single minaret rising against a violet-and-amber sky, the call to prayer about to sound. She stands at the low parapet, the ancient city sprawling below, the warm light fading. Potted palms and lanterns flank her. Vintage warmth, the romance of the old city at the day\'s close.',
        // Scene 5 — souk passage
        'A covered souk passage, slats of dusty light falling through the reed roof onto stacked rugs, brass lamps, and pyramids of spice. She moves through the narrow passage, the filtered light striping across her, the colour and texture of the market pressing close on both sides. Warm film tones; the air is thick with light and goods. Ancient, layered, alive.',
        // Scene 6 — courtyard fountain
        'A riad courtyard fountain at amber hour — a star-shaped basin of still water set in zellige tile, the carved arches reflected in its surface. She kneels at the fountain\'s edge, fingertips just touching the water, the reflection doubling her among the arches. The light is warm and low, the tilework glowing. Vintage tones, serene and timeless.',
      ],
    },
  },

  // ── FINE ART ───────────────────────────────────────────────────────────────

  {
    id: 'marble-palazzo',
    name: 'Marble & Glass',
    tagline: 'Venetian palazzo. 400 years of geometry. One figure.',
    category: 'fine-art',
    mood: ['Venice', 'Architecture', 'Monumental', 'Archival'],
    config: {
      photoDirection: 'AVANT_GARDE_COUTURE',
      locationPreset: loc('venice-palazzo'),
      bg: 'custom-bg',
      lighting: 'Soft Natural',
      camera: 'Natural Eye (50mm)',
      cameraFormat: '4x5 Large Format Film',
      colorGrade: 'Matte Fade Editorial',
      userPrompts: [
        // Scene 1 — entrance hall
        'Venetian palazzo entrance hall, mid-afternoon: light shafts cut down through frescoed ceilings and land in specific pools on the marble floor, each one an accident of geometry that took 400 years to arrange. She stands in one such pool — entirely still, chin down, eyes closed. One hand is raised to touch the carved stone doorframe; the gesture is exploratory rather than staged. The marble floor throws a faint mirror image below her. Quiet. Monumental. The image feels archival.',
        // Scene 2 — frescoed ballroom
        'A grand Venetian ballroom, frescoed ceiling soaring overhead, Murano-glass chandeliers hanging dark and unlit, tall windows draping the worn marble floor in soft afternoon light. She stands alone in the centre of the immense empty room, dwarfed by the gilt and fresco, perfectly still. Dust hangs in the light shafts. Large-format clarity, matte-fade tones — faded grandeur, archival and silent.',
        // Scene 3 — grand staircase
        'The grand marble staircase of a Venetian palazzo, worn smooth by four centuries, curving up beneath a frescoed vault. She stands on the lower flight, one hand on the cold stone balustrade, looking up into the soft light from a high window. The composition is all sweeping curve and aged marble. Quiet, monumental, the patina of age in every surface. Matte-fade, large-format detail.',
        // Scene 4 — canal window
        'A tall arched palazzo window thrown open onto the Grand Canal, the rippling water throwing shifting light across the marble sill and the faded silk walls. She stands at the window in profile, the canal and a passing gondola soft beyond, the water-light playing over her. The interior is dim and aged; the window a rectangle of luminous Venice. Archival stillness, matte tones.',
        // Scene 5 — palazzo study
        'A palazzo study lined with leather-bound volumes and gilt frames, a single shaft of afternoon light falling across a worn writing desk, dust motes suspended. She stands among the shelves, fingertips on a spine, the warm dim room enclosing her. The light is soft and directional; the air feels undisturbed for decades. Large-format detail, matte-fade — scholarly, archival, hushed.',
        // Scene 6 — canal loggia
        'A columned loggia of a Venetian palazzo opening onto the canal, stone arches framing the water and the façades opposite, soft reflected light bouncing up onto the vaulted ceiling. She stands between two columns at the loggia\'s edge, the canal glittering beyond, poised and still. The geometry of the arches and the shimmer of reflected water are the image. Monumental, matte, timeless.',
      ],
    },
  },

  {
    id: 'kyoto-silence',
    name: 'Kyoto Silence',
    tagline: 'Pale green light. Vertical stalks. Absolute stillness.',
    category: 'fine-art',
    mood: ['Kyoto', 'Zen', 'Green', 'Silence'],
    config: {
      photoDirection: 'BEAUTY_EDITORIAL',
      locationPreset: loc('kyoto-bamboo'),
      bg: 'custom-bg',
      lighting: 'Soft Natural',
      camera: 'Natural Eye (50mm)',
      cameraFormat: 'Contax 645 · 80mm Film',
      colorGrade: 'Fuji Pro 400H',
      userPrompts: [
        // Scene 1 — bamboo grove path bend
        'Kyoto Arashiyama bamboo grove at dawn — pale green light filtering through the vertical stalks, the path curving into cool silence ahead. She stands at the exact point where the path bends, facing away from the lens, head slightly bowed, one hand resting at her side. The bamboo is a thousand vertical lines; she is one still vertical among them. The light exists outside normal color temperature — the pale luminous green specific to this place.',
        // Scene 2 — moss garden kneeling
        'The moss garden of a Kyoto temple at early morning — the moss a saturated deep emerald, every surface covered, perfectly maintained. Stone lanterns half-buried in the green. She kneels at the edge of the path, one hand barely touching the moss surface as if listening to it. The light is flat and diffused through overcast — a grey sky that makes the green more vivid, not less. Total silence implied by every element.',
        // Scene 3 — torii gates corridor
        'The famous orange torii gate corridor of Fushimi Inari at 5am before the visitors arrive — hundreds of gates receding up the hillside, the path between them a tunnel of vermillion. She walks away from the lens deep into the corridor, the gates framing her in diminishing arches all the way to the vanishing point. First morning light comes through the gaps between the gates in thin diagonal strips. She is small within the scale of it.',
        // Scene 4 — zen rock garden
        'A Ryoanji-style karesansui rock garden at blue hour — the raked gravel glowing silver-grey, the fifteen stones casting short precise shadows. She sits on the wooden engawa veranda at the garden edge, legs folded, hands in her lap, looking out at the gravel. Her back is to the lens — a single human figure at the edge of an abstract stone landscape. The cedar walls of the temple frame the garden on two sides. Everything is still.',
        // Scene 5 — temple reflecting pool
        'A Kyoto temple reflecting pool at dawn — the water perfectly still, a mirror of grey sky and dark cedar and pine. The wooden bridge crossing it is ancient, the planks worn smooth. She stands at the center of the bridge, looking down at her own reflection in the still water below. Shot from the bank, the composition splits perfectly between the real figure on the bridge and the reflected figure in the water. Dawn light: barely there, cool and silver.',
        // Scene 6 — autumn maple
        'A Kyoto temple courtyard in peak autumn — the maple trees a burning orange-red, fallen leaves covering the stone path in a continuous carpet. She stands beneath one maple, the tree above her shedding leaves in slow motion. A single leaf is caught in descent at eye level beside her face. She looks up through the branches. The light through the autumn canopy is amber and dappled. Shot on Fuji 400H, the oranges and reds rich and slightly halating.',
      ],
    },
  },

  // ── LIFESTYLE ──────────────────────────────────────────────────────────────

  {
    id: 'maldives-blue',
    name: 'Maldives Blue',
    tagline: 'Turquoise lagoon. Overwater deck. The luxury of nothing at all.',
    category: 'lifestyle',
    mood: ['Maldives', 'Turquoise', 'Resort', 'Ease'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('maldives-deck'),
      bg: 'custom-bg',
      lighting: 'Soft Natural',
      camera: 'Soft Background (85mm)',
      cameraFormat: 'Sony A1 · 50mm',
      colorGrade: 'True Life Accurate',
      userPrompts: [
        // Scene 1 — overwater deck
        'Maldivian overwater bungalow deck, late morning — the lagoon beneath translucent turquoise, coral visible on the sand floor below, the horizon an unbroken blue line where sea meets sky. She sits on the edge of the deck, legs hanging over the water, the ocean breeze moving through her. Her posture is open and relaxed — leaning back on her palms, face turned toward the horizon. The water below is so clear it reads like a window to another world. Accurate color science: the lagoon exactly the color it is in real life, which is almost unbelievable.',
        // Scene 2 — sandbank
        'A pristine sandbank in the middle of the Maldivian lagoon at midday — a curl of white sand barely above the surface, surrounded by infinite gradients of turquoise and aquamarine. She stands ankle-deep at the sand\'s edge, the only figure in a vast field of blue, the water so clear it casts no boundary. Bright, true colour; the scale of empty sea and tiny sandbank is the luxury of nothing at all.',
        // Scene 3 — overwater hammock
        'A rope hammock strung over the Maldivian lagoon, the turquoise water visible through the netting beneath, a thatched villa behind. She reclines in the hammock above the water, one hand trailing toward the surface, completely at ease. The light is soft and bright; the water glows beneath her. True-to-life colour, the ultimate image of weightless rest above a clear sea.',
        // Scene 4 — villa interior
        'A Maldivian villa interior open entirely to the sea — polished teak, white linen, sliding walls folded back so the turquoise lagoon fills the far end of the room. She stands at the threshold between the cool shaded interior and the bright deck, sea breeze moving the curtains. The contrast of warm timber, white textile, and electric blue water is the palette. Accurate, serene, effortless luxury.',
        // Scene 5 — clear shallows
        'Standing in the glass-clear shallows of the lagoon, the white sand floor and ripples of light visible beneath the surface, a faint coral garden nearby. She stands thigh-deep, looking down at the impossibly clear water around her legs, the turquoise stretching to the horizon. The light dances on the sand bottom. True colour science — the water exactly as unbelievable as it is in life.',
        // Scene 6 — deck at sunset
        'The overwater deck at sunset — the lagoon turned molten gold and rose, the sky a soft gradient, the water mirror-still. She sits at the deck\'s edge once more, silhouetted against the warm horizon, the day cooling to gold. The earlier turquoise has gone amber and pink. Warm, accurate light; the same paradise at the opposite end of the day — calm, glowing, complete.',
      ],
    },
  },

  {
    id: 'beverly-gold',
    name: 'Beverly Gold',
    tagline: 'Brilliant blue pool. White linen. California afternoon forever.',
    category: 'lifestyle',
    mood: ['Beverly Hills', 'Pool', 'California', 'Warm'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('bh-pool-house'),
      bg: 'custom-bg',
      lighting: 'Soft Natural',
      camera: 'Soft Background (85mm)',
      cameraFormat: 'Sony A1 · 50mm',
      colorGrade: 'Kodak Portra 400',
      userPrompts: [
        // Scene 1 — pool house daybed
        'Beverly Hills pool house, late afternoon — white linen curtains drifting in the warm breeze off the pool, brilliant blue water outside casting shifting light patterns on the ceiling above. She reclines on a daybed in the open pool house, one arm overhead, the aqueous light playing across her. Her expression is unguarded — genuinely at ease. The pool beyond glows electric blue through the gauze curtains. Warm Portra tones make the whole image feel like a California memory: sun-saturated, slightly golden, the kind of afternoon that lasts forever.',
        // Scene 2 — poolside lounger
        'Poolside at a Beverly Hills estate, late afternoon — a single teak lounger at the edge of brilliant blue water, tall palms throwing soft shadows, the pool surface scattering coins of light. She sits on the lounger\'s edge, sunglasses in hand, golden light across her shoulders. The blue water and warm light are the whole mood. Portra warmth, sun-saturated California ease.',
        // Scene 3 — mid-century living room
        'A mid-century modern living room with floor-to-ceiling glass walls open to the pool and canyon beyond, walnut and travertine, low leather seating. She stands by the glass, the blue pool and golden hills framed behind her, warm afternoon light pooling on the stone floor. The architecture is clean and iconic. Portra tones; the relaxed opulence of the Hollywood Hills.',
        // Scene 4 — vintage car drive
        'A Beverly Hills driveway at golden hour — a vintage convertible parked under tall palms, a Spanish-revival façade behind, the light turning everything warm amber. She leans against the car, one arm along the door, unhurried and cool. The palms cast long shadows across the drive. Warm Portra grain, the timeless glamour of old Los Angeles.',
        // Scene 5 — canyon terrace
        'A hillside terrace overlooking the Los Angeles basin at golden hour, the city haze going gold below, bougainvillea spilling over a low wall. She stands at the terrace edge, the sprawling view behind her, warm light flaring softly. The scale of the city and the intimacy of the terrace meet in the frame. Portra warmth — the golden, hazy romance of an LA afternoon.',
        // Scene 6 — garden golden hour
        'A lush Beverly Hills garden at golden hour — bougainvillea and birds-of-paradise, a stone path, dappled light through the canopy. She walks the path toward the lens, the low sun flaring warm through the leaves, completely relaxed. The colour is rich and sun-soaked. Warm Portra tones, fine grain, the endless golden afternoon of Southern California.',
      ],
    },
  },

  // ── EDITORIAL (continued) ────────────────────────────────────────────────────

  {
    id: 'istanbul-bridge',
    name: 'Istanbul Bridge',
    tagline: 'Two continents. One city. The Bosphorus between.',
    category: 'editorial',
    mood: ['Istanbul', 'Bosphorus', 'Byzantine', 'Epic'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('istanbul-bridge'),
      bg: 'custom-bg',
      lighting: 'Golden Hour Directional',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Canon R3 · 35mm',
      colorGrade: 'Warm Film',
      userPrompts: [
        'Galata Bridge at golden hour — the Bosphorus a deep teal-copper below, the old city skyline of minarets and domes stacked against the amber sky behind her. She stands at the bridge rail, one forearm resting on the iron, looking southwest across the water toward Asia. Fishing lines from the bridge railings float at every angle around her; the city lives its life indifferent to her presence. The light is the warm amber of Ottoman late afternoons — low, raking, turning every stone surface into gold.',
        'Bosphorus ferry at dusk — the European and Asian shores simultaneously visible on either side, the ferry cutting the waterway between them. She stands at the bow, one hand on the white painted rail, the wind moving her coat. The sky is pink and gold behind the minarets receding on the European shore; ahead, the Asian side is blue in the gathering dusk. She is a figure suspended between two continents, and the image knows it.',
        'Istanbul Grand Bazaar interior, mid-afternoon — pale light filters through the high oculus windows in dusty diagonal beams, landing in pools on the worn stone floor below. She moves through the covered market, one of 4,000 shops pressing close on either side: lanterns, silk, copper, spice. Shot from slightly behind and above, her figure moving through the cross-beams of light, the vaulted painted ceilings curving sixty feet overhead. The scene has not essentially changed in five centuries.',
        'Hagia Sophia forecourt at blue hour — the impossible volume of the building behind her lit in warm floodlight amber, the sky above it a deep saturated blue. She stands at the base of one of the massive forecourt columns, one hand resting lightly on the ancient stone. The scale of the structure reduces her to exactly the right size: present, human, and dwarfed by history. The minarets rise on either side, the whole composition an accident of Islamic and Byzantine geometry.',
        'Istanbul rooftop terrace, Sultanahmet — the Blue Mosque\'s six minarets in perfect symmetry behind her against a sky just turning deep blue at dusk. She stands at the terrace rail in three-quarter profile, a small glass of tea in one hand, the steam from it catching the last light. The domes descend in perfect sequence behind her. The call to prayer is about to begin; the stillness before it is what the image captures.',
        'Karaköy neighborhood, steep cobbled street — the old Galata Tower rises directly at the end of the lane behind her, its medieval Genoese silhouette against a pale evening sky. She stands in the lane, one foot slightly elevated on the cobblestone slope, looking back over her shoulder. A cat occupies the step beside her door without apology. The lane smells of coffee from the gallery-café below; the tower has been there since 1348.',
      ],
    },
  },

  {
    id: 'havana-facade',
    name: 'Havana Façade',
    tagline: 'Colonial color. Caribbean heat. Beautiful decay.',
    category: 'editorial',
    mood: ['Havana', 'Color', 'Decay', 'Caribbean'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('havana-facade'),
      bg: 'custom-bg',
      lighting: 'Harsh Tropical Sun',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Leica M11 · 35mm',
      colorGrade: 'Faded Tropical',
      userPrompts: [
        'Havana Old City — a wall of peeling colonial facades in ochre, turquoise, and rose, the paint revealing layers of history beneath. She stands against the most beautiful of the walls, the texture and color so rich it competes with her. The shadow is deep and graphic.',
        'Havana Malecón seawall at sunset — the long promenade where the Caribbean meets the city. She sits on the seawall, legs dangling toward the water, the warm pink sky behind her. The old Havana skyline visible to her left.',
        'Havana classic American car interior — sitting in the back seat of a 1957 Chevy convertible, the city moving past through the open window in motion blur. The chrome and turquoise of the car interior frame her.',
        'Havana rooftop at night — the city spread below, old buildings lit warmly, the harbor visible in the distance. She stands at the rooftop parapet, the warm night wind in her hair.',
        'Havana market street — vivid color everywhere: fruit stalls, painted walls, clothing vendors. She stands in the middle of the street, the chaos of color perfectly composed around her.',
        'Havana Revolution Square at dawn — the vast empty plaza, the famous Che Guevara mural on the ministry wall. She stands alone in the enormous square, a tiny figure against the massive ideological backdrop.',
      ],
    },
  },

  {
    id: 'buenos-aires-editorial',
    name: 'Buenos Aires',
    tagline: 'European architecture. Latin soul. The most beautiful city.',
    category: 'editorial',
    mood: ['Buenos Aires', 'European', 'Elegant', 'Passionate'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('buenos-aires'),
      bg: 'custom-bg',
      lighting: 'Soft Afternoon',
      camera: 'Full Body (50mm)',
      cameraFormat: 'Nikon Z9 · 50mm',
      colorGrade: 'Warm European',
      userPrompts: [
        'Buenos Aires Recoleta at jacaranda season — the broad Haussmann boulevard under a full canopy of purple bloom, fallen flowers covering the pavement in a continuous violet carpet. She walks the sidewalk beneath the canopy, her footsteps displacing petals, the filtered light from above painting everything in a soft purple cast. The café terraces on either side are barely visible through the bloom. The light is diffuse and lavender, the most European afternoon in South America.',
        'El Ateneo Grand Splendid bookshop BA — a former Belle Époque theater converted to books, the stage turned café, the horseshoe of gilded boxes now holding volumes behind velvet ropes. She stands in the central aisle of the stalls, looking up at the painted ceiling dome far above. Warm gallery light from the boxes and the stage-café falls in tiers; the books on every level absorb and diffuse it. The scale is operatic, and the silence in it is conspicuous.',
        'La Boca neighborhood, caminito — the corrugated iron houses painted cobalt, saffron, crimson, and lime, the colors too saturated to be accidental. She stands with her back against a cobalt blue wall, arms loose at her sides, the street of vivid facades receding behind her in diminishing planes. The shadows between the buildings are deep and the colors glow in their contrast. This is the tango neighborhood and the image feels like the music looks.',
        'Buenos Aires rooftop at dusk — the city\'s eclectic skyline mixing Art Nouveau towers, Beaux-Arts cornices, and glass modern rising behind her in every direction. She leans forward on both forearms on the railing, looking directly down at the street below, her back to the camera and the skyline behind. The warm city lights are beginning to appear window by window in the buildings around her. The light is the specific gold of River Plate dusk.',
        'Puerto Madero promenade at evening — the old brick warehouses of the renovated port district warm in the last light, the red tower cranes visible at the dockside. She walks the dock-side promenade toward the lens, coat moving, the brick facades behind her and the river basin to one side. A footbridge arches over the water in the background. The atmosphere is distinctly European, the scale distinctly South American.',
        'Teatro Colón Buenos Aires, grand staircase — one of the world\'s great opera houses, its main stair a curve of white marble and gilded iron under a vaulted ceiling. She stands at the first landing, one hand on the railing, looking upward toward the upper levels. The theater is empty and she has it entirely. The cream and gold of the interior, the warm artificial light, the absolute silence of the house between performances — the image is about grandeur and solitude simultaneously.',
      ],
    },
  },

  {
    id: 'sydney-harbour',
    name: 'Sydney Harbour',
    tagline: 'Opera House sails. Harbour blue. The most beautiful city skyline.',
    category: 'editorial',
    mood: ['Sydney', 'Harbour', 'Coastal', 'Iconic'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('sydney-harbour'),
      bg: 'custom-bg',
      lighting: 'Bright Australian Sun',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Sony A1 · 35mm',
      colorGrade: 'Bright Natural',
      userPrompts: [
        'Sydney Opera House forecourt, mid-morning — the white shell sails rise behind her in perfect geometry against a saturated blue Sydney sky, the harbour beyond them the deep blue that exists only in this city. She stands on the forecourt steps, weight back on one heel, the Harbour Bridge visible to her left across the water. The light is the specific Sydney light: high-intensity, clean, and blue-white, throwing precise shadows from the sails across the forecourt stone. Every surface is sharp.',
        'Sydney Harbour Bridge south pylon lookout — the harbour spread below in every direction from 90 metres up, the Opera House on the right bank, the CBD glass towers behind it, the North Shore beyond. She stands at the stone parapet, elbows resting on the ledge, looking north across the water. The view is comprehensive and vertiginous. The bridge cables radiate outward from her in converging lines. Morning light, clean and cool.',
        'Bondi to Coogee clifftop path, afternoon — the track runs along sandstone cliffs above the Pacific, the ocean crashing far below in white surges against the rock platforms. She stands at one of the stone outlook points, one foot raised on the low wall, looking out at the horizon. The Pacific extends without interruption ahead. The light is the warm afternoon Sydney angle: golden, sharp-edged, the colour accurate and bold.',
        'Sydney Darling Harbour at blue hour — the convention centre and hotel towers reflected in the harbour water in long amber and white columns, the city fully lit against the darkening sky. She stands on the waterfront promenade, facing the water, her back to the lens, the entire illuminated skyline spread before her. The reflections in the water are as detailed as the buildings themselves.',
        'Sydney Harbour ferry approach — on the famous green-and-yellow ferry crossing toward Circular Quay, the Opera House shells and Harbour Bridge simultaneously visible in the approaching panorama. She stands at the bow rail, both hands on the white metal, the harbour wind in her face. Shot from below and to the side, her figure against the approaching skyline, the bridge arching above everything behind her.',
        'Palm Beach Sydney, empty morning — the narrow peninsula stretched between the Pacific and Pittwater, the lighthouse at its northern tip a white vertical in the distance. She walks the ocean beach at low tide, the sand hard and dark at the water\'s edge, her footprints the only marks on the beach. The lighthouse is small and precise at the far end of the frame. Morning light from the east, the Pacific a pale silver beside her.',
      ],
    },
  },

  {
    id: 'rome-piazza',
    name: 'Rome at Night',
    tagline: 'Travertine. Fountain light. The eternal city after midnight.',
    category: 'editorial',
    mood: ['Rome', 'Night', 'Eternal', 'Monumental'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('rome-piazza'),
      bg: 'custom-bg',
      lighting: 'Warm Night Uplighting',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Leica SL2 · 35mm',
      colorGrade: 'Warm Night',
      userPrompts: [
        'Trevi Fountain Rome at 2am — the piazza completely empty of tourists, the fountain lit from beneath in warm amber, the water sound filling the entire square. She stands at the fountain basin edge, one hand resting on the stone lip, the monumental Baroque facade rising behind her. The lit water throws moving amber light upward across the Neptune figure and across her face simultaneously. The marble reads as pure gold in this light; the silence of the city at this hour is complete.',
        'Pantheon portico at night — the sixteen ancient granite columns standing in the night, the city quiet around this surviving monument. She stands between two columns, her body one vertical line among the massive stone ones. Through the great bronze doors behind her, the interior is visible: the circular space, the oculus open to the sky above. The columns are lit from below; she stands in the warm spill of light, everything outside the portico dark.',
        'Via Condotti Rome at dawn — the most famous shopping street in Italy, utterly empty at six in the morning, every luxury shopfront dark and shuttered behind its steel grille. She walks the center of the street toward camera, the Spanish Steps and the Trinità dei Monti church visible at the end of the street behind her. The early morning light is pale and horizontal, the stone pavement still cool. The whole image belongs to no era.',
        'Roman Forum at sunset, Temple of Saturn — the six standing columns of the ancient temple casting long shadows across the Forum floor, the Colosseum a massive ochre ellipse visible beyond. She stands between two columns, one hand resting on the fluted stone, the golden hour light on the travertine warm as paint. The ruins of the Senate and Basilica Aemilia frame the middle ground. Two thousand years of atmosphere in every shadow.',
        'Rome rooftop with St Peter\'s dome at dusk — from the Gianicolo or Pincio hill, the great dome of St Peter\'s rises above the city roofline in the middle distance, lit amber as the sky turns violet behind it. She stands at the rooftop balustrade, back to the lens, looking toward the dome. The foreground rooftops are a warm terracotta sea; the dome is the horizon. The image is the oldest postcard in the world made new.',
        'Trastevere at midnight — the medieval lanes, worn cobblestone under amber streetlamps, ivy crawling the ochre walls, the sound of a fountain in some unseen courtyard nearby. She walks a narrow street, her figure the only moving thing, the lamp on the wall ahead casting its pool of warm light on the stone. The shadows between buildings are absolute. Rome has looked like this for a thousand years and will again.',
      ],
    },
  },

  {
    id: 'lagos-waterfront',
    name: 'Lagos Waterfront',
    tagline: 'Victoria Island. Atlantic light. Africa\'s most vibrant city.',
    category: 'editorial',
    mood: ['Lagos', 'Atlantic', 'Vibrant', 'Modern Africa'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('lagos-waterfront'),
      bg: 'custom-bg',
      lighting: 'Bright Equatorial Sun',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Canon R5 · 35mm',
      colorGrade: 'Saturated Warm',
      userPrompts: [
        'Lagos Victoria Island waterfront, midday — the Atlantic behind her, the VI skyline of glass towers rising to her left, equatorial light overhead at its full noon intensity. She stands on the waterfront promenade, the sea breeze constant, the energy of one of Africa\'s most vital cities visible in everything around her. The light is extraordinary: hard equatorial sun casting clean strong shadows, her skin warm against the bright Atlantic behind. The city is building its future in every direction.',
        'Eko Atlantic Lagos — the new city rising from reclaimed Atlantic land, tower cranes and half-finished glass buildings stretching toward the horizon, the sea still visible at the edges of the construction. She stands on the finished promenade section, the Atlantic at her back, the towers of the emerging skyline ahead of her. Shot at golden hour when the construction dust turns golden and the glass panels catch fire. The image is about ambition made physical.',
        'Lekki market Lagos, deep afternoon — the market stalls stacked with Ankara and Aso-oke fabrics in extraordinary patterns, bolts piled to the roof, the vendors\' conversation constant. She stands in the main aisle, a length of indigo Adire fabric half-unwrapped in one hand, the vendor beside her. The equatorial sun presses down on the corrugated roof; inside, the filtered light turns every color more vivid. The image belongs to no tradition except Lagos.',
        'Lagos rooftop at equatorial sunset — the sun drops toward the Atlantic horizon with the speed and completeness unique to the tropics, the sky going orange then violet then purple in under twenty minutes. She stands at the rooftop edge, face turned toward the sunset, the city spreading to the horizon in three directions behind her. The ocean is visible as a bright line to the south. The light on her skin is the warm amber of the last few minutes before the color changes.',
        'Nike Art Gallery Lagos courtyard — the sprawling gallery compound in Lekki, its five floors covered in sculptures, masks, and textiles from across the African continent. She stands in the open courtyard, surrounded by large-scale bronze figures and carved wooden installation. The building facade is itself a work: every surface a layer of craft. Dappled afternoon light through the garden trees.',
        'Lagos Bar Beach at dawn — the Atlantic beach at its quietest, the city beginning to stir behind but the beach itself still empty except for the early fishermen dragging their nets. She walks the water\'s edge, the wet sand firm beneath her, the sea flat and silver-pink in the pre-sunrise light. The city skyline is a warm silhouette behind her. The light is soft and directionless, the beginning of another equatorial day.',
      ],
    },
  },

  {
    id: 'cairo-bazaar',
    name: 'Cairo Gold',
    tagline: 'Khan el-Khalili. The pyramids at dusk. Five thousand years.',
    category: 'editorial',
    mood: ['Cairo', 'Ancient', 'Gold', 'Desert'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('cairo-bazaar'),
      bg: 'custom-bg',
      lighting: 'Desert Golden Hour',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Nikon Z8 · 35mm',
      colorGrade: 'Desert Gold',
      userPrompts: [
        'Giza plateau at golden hour — the Great Pyramid fills the entire background from edge to edge of the frame, the amber desert sand extending to its base in perfect gradients of orange and brown. She stands at the desert edge, the pyramid directly behind her, the scale reducing her to a single warm figure at the base of the most massive object ever built. The raking golden light makes every stone course readable. The sky above is a deep copper-blue. She is small and the pyramid is eternal.',
        'Khan el-Khalili bazaar, late afternoon — the medieval lanes of Cairo\'s great market narrow to barely two shoulders wide, the stalls pressing close with lanterns, silver filigree, brass trays, and spices. She walks one of the deeper alleys, the sun reduced to a blade of light cutting across the lane from above. The lanterns are already lit even in the daylight. The metalwork catches the amber light and multiplies it. The bazaar has been here for six centuries.',
        'Cairo Citadel, Mohamed Ali Mosque courtyard — the Ottoman mosque built of ablaq alabaster in the 19th century, the pale cream stone warm in the afternoon sun, the twin minarets pointing at a saturated blue sky. She stands in the open sahn courtyard, the ablution fountain behind her, the mosque entrance ahead. The alabaster walls absorb and radiate the afternoon warmth. The city of Cairo is visible far below through the courtyard arches.',
        'Qasr el-Nil Bridge at sunset — the Nile below the bridge catching the full sunset color, the sky and the river the same burning orange. She stands at the bridge rail, looking south, the stone lion sculptures on the bridge parapet behind her, the city on both banks visible in the warm light. The Nile at this hour is the color of old gold. The ancient river moving beneath a twenty-first century megalopolis.',
        'Cairo rooftop, Pyramids on the horizon — the city of Cairo spreading in every direction from this rooftop, twenty million people in every direction, and on the western horizon the three pyramids visible above the last of the buildings, impossibly ancient and impossibly present simultaneously. She stands at the rooftop edge, back to camera, looking west toward the monuments. The city noise rises from below. The juxtaposition is Cairo\'s defining contradiction.',
        'Egyptian Museum, Tutankhamun galleries — the warm amber museum lighting illuminates the golden death mask and the gilded shrine walls, the treasures from the boy-king\'s tomb filling the room with impossible ancient wealth. She stands at the center of the room, surrounded by artefacts from 1323 BCE, her posture quiet and respectful. The gold reads warm against the museum\'s ochre walls. Every object in the room is both priceless and present.',
      ],
    },
  },

  // ── CAMPAIGN ─────────────────────────────────────────────────────────────────

  {
    id: 'iceland-glacier',
    name: 'Iceland Glacier',
    tagline: 'Blue ice. Black sand. The edge of the world.',
    category: 'campaign',
    mood: ['Iceland', 'Glacier', 'Raw', 'Elemental'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('iceland-beach'),
      bg: 'custom-bg',
      lighting: 'Overcast Diffuse',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Phase One · 45mm',
      colorGrade: 'Desaturated Cool',
      userPrompts: [
        'Jökulsárlón glacier lagoon — massive fragments of blue ice float silently on black glacial water, some the size of houses, some the size of chairs. She stands on the black sand bank at the lagoon\'s edge, the glacier tongue descending from Vatnajökull in the far distance behind her. The flat overcast diffuse light of subarctic Iceland makes no shadows — everything is evenly, coldly lit. The electric blue of glacial ice exists nowhere else on earth: no filter, no processing, just the compressed centuries of ice made visible.',
        'Reynisfjara black sand beach — the hexagonal basalt columns of the sea cave rise forty metres from the black sand behind her, the formations perfect and geological. She stands ten metres from the surf, close enough to feel the spray, the North Atlantic crashing behind her with Atlantic Ocean force. The cave columns frame her on the left, the ocean on the right. The entire frame is black and grey and white: no color except the dark teal of the wave faces before they break.',
        'Iceland highlands rhyolite valley — the interior plateau of Iceland, accessible only in summer, the mountains painted in extraordinary colors by volcanic mineralogy: rust red, sulphur yellow, ash grey, deep ochre. No vegetation anywhere. She stands in the wide valley between two mountains, the scale so vast her figure is barely a mark in it. The flat Nordic sky above is grey-white. The scene looks genuinely alien.',
        'Iceland Northern Lights — the aurora borealis active overhead in bands of green and violet, the snow-covered landscape below lit by the display alone, no other light source. She stands in a clearing, face tilted upward, the aurora reflecting in the snow around her feet in a faint green cast. Shot at ISO 6400, long enough to capture the aurora bands as sharp rather than blurred. The sky is performing and she is the only audience.',
        'Icelandic geothermal hot spring — a natural pool of milky blue geothermal water steaming visibly in the cold morning air, the volcanic landscape stretching out in every direction, the steam rising in thick columns. She sits at the pool\'s stone edge, feet in the water, the steam rising around her lower body. The cold air makes the steam more dramatic. The ground around the pool is dark lava rock, the sky overcast and bright.',
        'Skógafoss waterfall — the massive curtain of water drops 60 metres from the cliff edge, the spray creating a permanent rainbow in the near-constant Icelandic mist. She stands at the base, the entire waterfall filling the background of the frame, the spray misting her entirely. The rocks around her are black and wet; the grass growing at the base is an electric green from constant moisture. The scale is vertiginous and the sound is total.',
      ],
    },
  },

  {
    id: 'tuscany-harvest',
    name: 'Tuscany Harvest',
    tagline: 'Cypress rows. Golden fields. The light that made oil painting.',
    category: 'campaign',
    mood: ['Tuscany', 'Harvest', 'Golden', 'Pastoral'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('tuscany-dawn'),
      bg: 'custom-bg',
      lighting: 'Golden Hour',
      camera: 'Full Body (50mm)',
      cameraFormat: 'Leica SL2 · 50mm',
      colorGrade: 'Kodak Portra 400',
      userPrompts: [
        'Val d\'Orcia at dawn — the iconic cypress-lined dirt road rises over the crest of the hill ahead, the early morning mist sitting in the valleys on either side in still white pools. She walks the road away from the camera, the two rows of cypress flanking her in a corridor of dark vertical shapes. The dawn light is the warm gold that made this landscape the most painted in Italy — low, raking, turning the dust on the road to amber. The valley on both sides disappears into white.',
        'Tuscany olive harvest — the ancient silver-green olive trees of a Tuscan grove, their bark twisted by centuries, the branches heavy with the green-black fruit of late October. Harvest nets spread on the ground below catch the falling olives. She stands among the trees, one arm reaching to a branch at shoulder height, the dappled light filtering through the canopy above in warm moving patches. The light smells like history.',
        'Montepulciano hilltop at golden hour — the medieval town walls of Montepulciano at the edge where the town ends and the valley drops away below. She stands at the town wall, looking out over the Val di Chiana in the afternoon light, the rolling hills and other hilltop towns visible in the distance. The stone of the wall is warm cream in this light. The wine country of Tuscany extends in every direction, a landscape of deliberate beauty.',
        'Tuscany vineyard at harvest — the vine rows in late September, the leaves turning gold and red at the edges, the Sangiovese grapes deep purple and heavy on the canes. She walks between two rows toward the camera, the vine leaves brushing either side. The rolling hills rise and fall behind her. The light is the specific quality of Italian harvest: warm and slightly hazy, the whole landscape saturated with the last heat of the year.',
        'Val d\'Orcia poppy fields — the famous spring fields of the Val d\'Orcia, red poppies covering the gentle hills in drifts, the cypress trees on the ridgelines above. She stands at the field edge where it meets the dirt track, the poppies at hip height around her. The light is soft morning with a slight overcast — the poppies glow without glaring. A farmhouse is visible on the hill behind in warm terracotta.',
        'Tuscan stone villa terrace — a restored farmhouse in the hills, the stone loggia opening to a formal garden below and the rolling Tuscan hills extending to the horizon. She stands at the balustrade of the terrace, both hands resting on the warm stone, looking out at the landscape. The view is the painting itself: cypress, olive, vineyard, and the particular way the light at 5pm makes everything in this valley look like it was lit for a portrait.',
      ],
    },
  },

  {
    id: 'bali-ceremony',
    name: 'Bali Sacred',
    tagline: 'Temple gates. Rice terraces. The island of gods.',
    category: 'campaign',
    mood: ['Bali', 'Sacred', 'Lush', 'Ancient'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('bali-terrace'),
      bg: 'custom-bg',
      lighting: 'Tropical Soft',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Sony A1 · 35mm',
      colorGrade: 'Humid Warm',
      userPrompts: [
        'Bali Tegallalang rice terraces at morning — the stepped emerald paddies descend the valley in geometric tiers, each terrace level catching the light differently, the whole hillside a staircase of bright greens. She stands on one of the narrow terrace paths, the stepped greens dropping away steeply below her, the coconut palms rising above. The light is the filtered tropical morning: warm and slightly humid, coming through the canopy at a low angle that makes every wet rice plant glow.',
        'Pura Tanah Lot at golden hour — the sea temple sits on its black volcanic rock just offshore, the Indian Ocean surrounding it on three sides, accessible only at low tide. She stands on the mainland shore, the causeway stones ahead, the waves breaking against the temple base behind her. The golden hour light catches the foam white and the rock black. The temple silhouette against the burning sky is the image that belongs to no photographer and every photographer.',
        'Bali jungle path in tropical forest — the forest path cuts through dense tropical vegetation, ferns and palms pressing close, shafts of white tropical light breaking through the canopy above in moving columns. She walks the path toward the camera, the greenery tunneling around her. The moisture is visible in the air. Shot on 35mm, the compression making the green walls even more enclosing. A cathedral built by the forest.',
        'Ubud market Bali — the daily market of Bali\'s artistic capital, the stalls dense with hand-carved wood figures, batik fabric in indigo and rust, woven baskets, daily offerings of yellow flowers and incense. She stands in the market interior, the vendor stalls around her at every level, the light warm and filtered through woven cane roofing above. The market smells of flowers and sandalwood. The artisan abundance is total.',
        'Bali villa infinity pool, late afternoon — the pool\'s far edge appears to dissolve into the rice terrace valley dropping away below, the volcanic mountains visible at the horizon in deep blue. She stands waist-deep at the infinity edge, both hands on the ledge, looking out at the valley and mountains. The pool water is warm and the sky above is the tropical afternoon: deep blue, a few white cumulus towers building over the mountains.',
        'Uluwatu sea cliffs at sunset — the southern limestone cliffs of Bukit Peninsula drop 75 metres directly to the Indian Ocean far below, the surf visible as white lines on the dark water. She stands at the temple cliff edge, the ocean panorama to the horizon behind her, the sunset sky behind that. The light is the last of the day: amber and orange, the ocean turning copper. The Kecak fire dance will begin below at the temple as the sun touches the water.',
      ],
    },
  },

  {
    id: 'capetown-table',
    name: 'Cape Town Table',
    tagline: 'Table Mountain. Atlantic ocean. The most beautiful city on earth.',
    category: 'campaign',
    mood: ['Cape Town', 'Mountain', 'Ocean', 'Dramatic'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('capetown-table'),
      bg: 'custom-bg',
      lighting: 'Bright Southern Sun',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Canon R5 · 35mm',
      colorGrade: 'Bright Clean',
      userPrompts: [
        'Table Mountain summit at the tablecloth — the famous orographic cloud spills over the flat summit edge like a slow-motion waterfall, the city of Cape Town and both oceans visible far below in the gaps between clouds. She stands at the summit rim, the tablecloth cloud moving past her at shoulder height, the city a miniature model below. The light up here is the clean, wind-buffeted brightness of high altitude. She is above the city and the city is enormous.',
        'Camps Bay beach, afternoon — the white sand beach curves between the Atlantic in front and the Twelve Apostles mountain range rising directly, dramatically, immediately behind. She walks the beach near the water\'s edge, the extraordinary double backdrop of ocean and mountain simultaneously visible. The Southern Atlantic is cold and turquoise; the mountains are sandstone and shadow. The light is the specific Cape afternoon: bright, warm-toned, the shadows blue.',
        'Bo-Kaap cobblestone street — the Cape Malay quarter\'s cobblestone lane lined with houses in vivid flat colors: cadmium yellow, cobalt blue, lime green, coral pink. Signal Hill rises at the end of the lane. She stands at the center of the street, the houses stacked in receding planes of color behind her. The Southern Hemisphere light is high and clean, the shadows short, the colors their truest selves.',
        'Cape Point lighthouse — the southernmost point of the Cape Peninsula, the old lighthouse on its headland above the meeting of Atlantic and Indian Oceans. She stands at the lighthouse base, the ocean on both sides visible from this elevation, the continent ending at the cliffs below. The wind here is constant and strong. The water is two different blues meeting in a line that is actually visible from above.',
        'Constantia winelands at harvest — the historic wine estates of the Constantia Valley, some of the oldest in the Southern Hemisphere, the Cape Dutch gabled manor houses at the end of oak-lined drives. She walks a vineyard row, the grapes heavy, Table Mountain visible above the tree line behind the estate. The light is the warm Cape autumn: golden, unhurried, the mountains a blue wall above the vines.',
        'V&A Waterfront at night — the working harbor with its yachts and fishing boats, the craft market lit and lively, Table Mountain dark and enormous behind the city lights. She stands at the waterfront railing, the harbor basin lit below, the mountain silhouette dominating the night sky behind the tower skyline. The mountain is always the largest thing in any Cape Town image, lit or unlit.',
      ],
    },
  },

  {
    id: 'norway-fjord',
    name: 'Norway Fjord',
    tagline: 'Sheer cliffs. Mirror water. Silence that has weight.',
    category: 'campaign',
    mood: ['Norway', 'Fjord', 'Epic', 'Silence'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('norway-fjord'),
      bg: 'custom-bg',
      lighting: 'Overcast Diffuse',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Phase One · 45mm',
      colorGrade: 'Desaturated Nordic',
      userPrompts: [
        'Geirangerfjord ferry passage — the sheer fjord walls rise 1400 metres directly from the water on both sides, the Seven Sisters waterfall cascading down the opposite cliff face in seven parallel threads. She stands at the ferry bow rail as the vessel moves between the walls, the scale making the boat feel like a toy and making her feel correctly proportioned to the landscape. The diffuse overcast light means no harsh shadows — everything is evenly, coldly rendered. The silence is immense.',
        'Preikestolen (Pulpit Rock) — the flat rock platform 600 metres above the Lysefjord, the fjord walls and water visible in every direction from this elevation. She stands at the very edge, heels to the cliff drop, the fjord and opposite mountain faces spread below. The rock has no guardrail. Shot from slightly below and behind, she is framed against the fjord in its full width. The vertigo is visible in how she stands: perfectly still, entirely at ease.',
        'Norwegian fjord village, morning — the classic red and ochre wooden Stabbur houses of a small fjord village, their reflections in the still fjord water below the dock a perfect mirror image. She stands on the old wooden dock, the village behind her, the reflection at her feet. The fjord is mirror-flat in the early morning before the ferries begin. The mountains on the opposite shore are reflected in the same still water. Everything doubled.',
        'Norwegian glacial mountain lake — a high-altitude lake between vertical mountain walls, the water so still and so clear it perfectly mirrors the peaks above. She stands at the granite shore, one foot slightly forward, looking out at the reflected mountains. The image has a perfect horizontal axis: the real mountains above, the reflected mountains below, her figure the only vertical in the center. The silence has weight.',
        'Norway fjord village in winter snow — fresh snow on every rooftop, the wooden facades white-capped, the warm amber light in the windows of the houses the only color against the white. She stands in the village lane, snow to her ankles, the fjord frozen at its edges visible beyond the last house. The light is the specific winter twilight of Norway: blue, flat, and beautiful.',
        'Norway midnight sun — the sun at midnight skimming the northern horizon without setting, casting a permanent golden hour that has lasted for weeks. She stands on a hill above the fjord, the sun a low orange disc behind her, the fjord landscape below lit in continuous warm gold. The shadows are impossibly long at this hour. The sky is the specific pale gold of the Arctic midnight: not dark, not day, an entirely different category of light.',
      ],
    },
  },

  {
    id: 'morocco-villa',
    name: 'Morocco Villa',
    tagline: 'Riad courtyard. Hammered lanterns. Desert palatial.',
    category: 'campaign',
    mood: ['Morocco', 'Riad', 'Palatial', 'Warm'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('marrakech-riad'),
      bg: 'custom-bg',
      lighting: 'Warm Afternoon',
      camera: 'Three-Quarter (50mm)',
      cameraFormat: 'Leica Q3 · 50mm',
      colorGrade: 'Warm Amber',
      userPrompts: [
        'Marrakech riad courtyard, afternoon — the central fountain with its carved marble basin, the hand-painted zellij tile floor in intricate geometric patterns, carved cedar archways framing each side, bougainvillea climbing the whitewashed upper walls. She sits at the fountain edge, one hand in the water, the courtyard architecture enclosing her in perfect Moorish symmetry. Filtered afternoon light comes through the open roof above in a soft downward column, landing on the tiles. The temperature drops ten degrees inside.',
        'High Atlas mountain village — the red-earth kasbahs of a Berber village in the Atlas foothills, the snow-capped Atlas peaks rising directly behind. She stands on a terrace of the village, looking toward the mountains, the terrace walls warm adobe red against the cold blue of the distant snow peaks. The scale of the mountains behind the modest village is the subject. The light is the strong direct Moroccan highland sun.',
        'Marrakech tanneries from above — the Chouara tannery viewed from a terrace above: the circular vats of natural dye in ochre, white, dark brown, and olive green, workers moving between them, the medieval process unchanged. She stands at the viewing terrace rail, looking down at the extraordinary color arrangement below, the medina skyline around her. The light is direct overhead noon; the colors in the vats are at their most saturated.',
        'Erg Chebbi dunes at sunset — the crescent dunes of the Moroccan Sahara in the last twenty minutes of light, the sand in every shade from deep amber to burnt orange, the shadows of the dune crests cutting perfect arcs across the warm sand. She stands at a dune crest, the shadow line of the ridge running through her feet, one side lit, one side shadow. The sky above is a deep blue-violet. The scale of the dune field behind is immense.',
        'Aït Benhaddou ancient ksar — the UNESCO-listed fortified city of sun-dried mud and straw, used in Gladiator, Game of Thrones, and dozens of other productions because it looks like every ancient city ever imagined. She walks the main street of the preserved settlement, the tiered kasbahs rising around her, the clay walls warm red-orange in the afternoon light. The Ounila River crossing behind gives the whole composition its depth.',
        'Marrakech rooftop at night — the medina spreads below in every direction: the Djemaa el-Fna square with its fires and performers visible in the distance, the Koutoubia minaret lit in warm amber against the dark sky, the call to prayer having just ended. She stands at the parapet, the city below, the warm air carrying jasmine and cedar smoke. The rooftop is tiled, the city is ancient, the night is warm.',
      ],
    },
  },

  {
    id: 'santorini-blue',
    name: 'Santorini Blue',
    tagline: 'White cube. Blue dome. Caldera edge. Forever.',
    category: 'campaign',
    mood: ['Santorini', 'Aegean', 'White', 'Iconic'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('santorini-edge'),
      bg: 'custom-bg',
      lighting: 'Bright Mediterranean',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Nikon Z9 · 35mm',
      colorGrade: 'Bright Clean Blue',
      userPrompts: [
        'Santorini Oia caldera terrace — the white cubic houses step down the volcanic cliff in diminishing tiers, the blue-domed churches at the lower levels, the caldera filled with Aegean deep blue far below. She stands on one of the narrow terraces, one hand on the whitewashed wall, the full caldera panorama behind her. The light is the bright Mediterranean midday — everything white is brilliant, every shadow is short and blue-edged. The view has no parallel in the world.',
        'Santorini infinity pool at the caldera edge — the pool\'s far end appears to dissolve into the caldera sea far below, the volcanic islands visible in the deep blue. She stands waist-deep at the pool rim, both arms extended along the edge, looking out at the caldera and the distant volcano island. The pool water and the sea are almost the same blue. The drop from the pool edge to the water below is hundreds of metres.',
        'Santorini stairway between walls — the narrow stepped path through Oia, the walls on both sides brilliant white, a single blue dome visible at the top of the stairs, a branch of bougainvillea arching across the upper right corner of the frame in magenta. She climbs the stairs, her figure pure and dark against the white. The composition is graphic and complete — white, white, blue, magenta, and her.',
        'Santorini sunset from Oia — the famous western sunset, the sky moving through amber to orange to deep violet behind the silhouetted white domes and windmill sails. Her silhouette stands at the clifftop against that sky, arms loose at her sides. The caldera below is black. The sunset is the most anticipated in the world, and it delivers differently every day.',
        'Kamari black pebble beach — the unique volcanic pebble beach of Santorini, every stone black and smooth, the Aegean a bright turquoise beyond. She sits on the pebbles, arms behind her, looking toward the sea. The white and blue buildings of the beach town are visible above the beach behind. The contrast — black pebble, white building, blue water, blue sky — is entirely graphic and entirely real.',
        'Santorini cave hotel room, caldera view — the cave suite carved into the volcanic cliff, the interior white-washed and vaulted, the arched window and terrace door framing the full caldera panorama. She stands at the window, both hands on the arch, looking out. The interior is cool and white; beyond the arch is the entire Aegean. The arch frames the view perfectly, and she frames the arch.',
      ],
    },
  },

  {
    id: 'swiss-alpine',
    name: 'Swiss Alpine',
    tagline: 'Snow peaks. Emerald meadows. The luxury of altitude.',
    category: 'campaign',
    mood: ['Swiss', 'Alpine', 'Clean', 'Elevated'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('swiss-alpine'),
      bg: 'custom-bg',
      lighting: 'Alpine Clear Sun',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Phase One · 45mm',
      colorGrade: 'Alpine Clean',
      userPrompts: [
        'Zermatt — the Matterhorn fills the upper third of the frame, the perfect pyramid of the peak against a deep altitude blue sky. She stands in fresh snow below, the iconic peak directly behind her, the village far below. At this altitude the air is extraordinarily clear — every detail of the mountain\'s face is sharp. Her figure against the immensity of the Matterhorn is the correct ratio: human to monumental.',
        'Swiss alpine meadow in high summer — the wildflower meadow at 2000 metres in full bloom: arnica, gentian, alpine asters in waves across the slope. The snow-capped peaks rise above on both sides; the valley drops below. She stands in the flowers to her mid-calf, arms open at her sides, the peaks behind. The cowbells are audible but the cows are invisible. The light at altitude is brilliant and clean.',
        'Lake Oeschinen, Bernese Oberland — the glacial turquoise water, the limestone peaks rising directly from the far shore, the color of the water almost impossible. She stands on the rocky shore, the lake behind her, the reflections of the peaks in the water. The turquoise-white gradient from shore to deep water is the visual event. No filter can improve what the glacial minerals produce naturally.',
        'St. Moritz frozen lake, winter — the famous lake frozen solid, the resort town climbing the hillside behind it, the Engadin peaks above. She stands on the ice surface, the town behind her reflecting in the glassy ice. The light is the sharp, cold winter noon of the Alps: bright, blue-shadowed, the ice a white mirror. The luxury of Switzerland\'s most expensive winter.',
        'Swiss chalet terrace, afternoon — the dark weathered wood of the chalet balcony, the window boxes overflowing with red geraniums, the mountain peaks visible above the roof line behind. She sits on the terrace bench, one knee up, a cup in hand, the peaks at her back. The domestic warmth of the dark wood interior visible through the glass behind contrasts with the cold white peaks outside. This is exactly what this life looks like.',
        'Aletsch Glacier — the vast blue-white expanse of Europe\'s largest glacier, the ice moving imperceptibly south, the crevasses revealing the ancient ice below. She stands on the glacier surface, the icescape stretching in every direction, the cloud line below the peaks showing the world beneath. The sky above the glacier is the deepest blue available at this altitude. The ice under her feet is 900 metres thick.',
      ],
    },
  },

  {
    id: 'peru-inca',
    name: 'Peru Ancient',
    tagline: 'Machu Picchu clouds. Andean light. Empire in the sky.',
    category: 'campaign',
    mood: ['Peru', 'Ancient', 'Andean', 'Dramatic'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: null,
      bg: 'custom-bg',
      lighting: 'Andean Morning',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Canon R5 · 35mm',
      colorGrade: 'Warm Natural',
      userPrompts: [
        'Machu Picchu at dawn — the cloud forest rolls through the ruins as the sun clears the mountain above, the citadel emerging from mist in sections. She stands on the upper agricultural terraces, the main citadel visible behind her, the Huayna Picchu mountain in cloud to her right. The dawn light on the ancient granite is golden and low-angled, the stones warm against the cool mist. Nothing here can be overstated — the reality exceeds the photograph every time.',
        'Sacred Valley Peru, afternoon — the broad Urubamba valley floor, the Inca salt pans of Maras on the terraced cliff face above, the ruins of Pisac visible on the mountain ridge. She stands on the valley floor, the full scale of the Andean landscape visible in every direction: the terraced mountainsides, the river, the peaks above the cloud line. The light is the specific Andean afternoon: high-altitude clear and warm.',
        'Lake Titicaca reed island — the totora reed islands of the Uros people float on the highest navigable lake in the world, the water a deep saturated blue at 3800 metres altitude. She stands on a reed island, the woven surface springy underfoot, the vast lake extending to the horizon in every direction, the Bolivian shore visible in the far distance. The sky at this altitude is a darker blue than any sky at sea level.',
        'Cusco, Inca and Colonial — the streets of Cusco where Spanish colonial buildings rise directly from Inca stone foundations, the massive precision-fitted granite blocks of the Inca walls meeting the rough colonial stonework above in a visible historical collision. She stands in one such street, the dual history rising around her. The morning light is the cold, clear light of the Andean highlands.',
        'Peruvian Amazon canopy walkway — suspended walkways high above the primary rainforest floor, the canopy level visible in every direction, the biodiversity of the world\'s greatest ecosystem around her at eye level. She stands on the walkway, looking out at the ocean of canopy, the individual trees enormous. The light is the filtered tropical green of the canopy: not direct sunlight, a diffused glow from above through a million leaves.',
        'Nazca Lines, observation tower — the desert pampa of the Nazca plateau, the ancient geoglyphs visible from the metal observation tower: the hummingbird, the monkey, the spider traced in the desert floor. She stands at the tower railing, looking down at the lines below. The desert is flat and ochre, the lines a darker ochre, the scale only comprehensible from above. The mystery is total.',
      ],
    },
  },

  {
    id: 'jordan-desert',
    name: 'Jordan Wadi',
    tagline: 'Petra rose-red rock. Wadi Rum sand. The ancient world.',
    category: 'campaign',
    mood: ['Jordan', 'Desert', 'Ancient', 'Rose-Red'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('sahara-dune'),
      bg: 'custom-bg',
      lighting: 'Desert Harsh',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Leica SL2 · 35mm',
      colorGrade: 'Desert Warm',
      userPrompts: [
        'Petra Treasury at the Siq exit — the narrow sandstone canyon of the Siq opens suddenly to reveal the Treasury facade carved directly into the rose-red cliff face, the scale of the revelation designed by the Nabataeans to overwhelm. She stands at the Siq exit, framed by the canyon walls, the Treasury filling the gap ahead. The rock is the extraordinary deep rose-red of iron-oxide sandstone, deepening at golden hour to amber. She is small; the facade is 40 metres tall.',
        'Wadi Rum desert, golden hour — the vast valley of Wadi Rum with its rust-red sand floor and towering sandstone monoliths rising 300 metres from the flat desert. She stands in the open desert, the rock formations behind her, the sand an extraordinary red-orange in the deep afternoon light. The shadows of the buttes stretch long across the sand. The sky above is a saturated Jordanian blue. Nothing grows here; the entire landscape is rock and sand and light.',
        'Petra Monastery, upper terrace — reached by 800 rock-cut steps, the Monastery is the largest carved monument in Petra: 50 metres wide, 45 metres tall, the facade elaborate and powerful. She stands on the terrace before it, the carved facade filling the background, the Wadi Rum visible through the gap in the mountains far below behind her. The stone is warm amber in afternoon light. The elevation and scale together create a specific vertigo.',
        'Dead Sea, Jordan shore — the lowest point on earth, the hyper-saline water so buoyant that floating is involuntary. She lies on the water surface, arms extended, entirely supported by the buoyancy, the Jordanian mountains visible across the haze. The salt-encrusted shoreline is white. The water is an opaque grey-blue, the surface flat and dense. The light is the harsh midday sun of the Jordan Valley.',
        'Aqaba Red Sea — the northernmost coral reef of the Red Sea, the water extraordinarily clear in the arid climate, the coral reef visible from the surface. She stands chest-deep in the clear water, looking down at the coral below, the water an extraordinary clarity that shows every detail of the bottom. The light refracts in patterns on the sand between the coral heads. The mountains of Jordan rise directly from the shore behind.',
        'Jerash, Roman colonnaded street — the cardo maximus of ancient Gerasa, the best-preserved Roman city outside Italy, its colonnaded main street still flanked by Corinthian columns. She walks the ancient paving, the column rows receding to a vanishing point ahead. The stone is warm limestone, the sky above the columns a deep Mediterranean blue. The city was abandoned for centuries and then found again exactly as Rome left it.',
      ],
    },
  },

  {
    id: 'namibia-desert',
    name: 'Namibia Dunes',
    tagline: 'Sossusvlei red. Dead Vlei white. Africa\'s oldest desert.',
    category: 'campaign',
    mood: ['Namibia', 'Dunes', 'Red', 'Vast'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('sahara-dune'),
      bg: 'custom-bg',
      lighting: 'Desert Dawn',
      camera: 'Full Body (28mm)',
      cameraFormat: 'Phase One · 35mm',
      colorGrade: 'Desert Saturated',
      userPrompts: [
        'Sossusvlei Dune 45 at sunrise — the tallest sand dunes in the world, the sand a deep red-orange that deepens to near-crimson at the dune crest. She stands at the top of Dune 45 at the exact moment of sunrise, the dune shadow cutting a perfect diagonal across the sand below her. The colors are almost impossible: the deepest red-orange sand against the deepest electric blue sky, with no gradation between them. Shot on medium format to capture both.',
        'Dead Vlei white clay pan — the ancient white clay floor surrounded by the tallest red dunes in the world, the dead 500-year-old camel thorn trees black against the white ground. She stands in the vlei, one of the dead trees beside her, the massive orange-red dune walls rising on every side. The clay floor is cracked in geometric patterns. The colors — white ground, black trees, red walls, blue sky — are a four-color graphic system of extraordinary power.',
        'Skeleton Coast, Namibia — the desolate Atlantic coast where the cold Benguela Current makes the air always hazy and the sea always dangerous. A rusted shipwreck sits in the surf behind her, the desert meeting the ocean with no transition. She stands on the black rock shore, the wreck behind her, the Atlantic crashing. The fog makes everything monochrome. The Skeleton Coast has been called the Gates of Hell by the Bushmen and the Land God Made in Anger.',
        'Etosha salt pan — the vast white salt pan at the center of Etosha National Park, visible from space, the heat shimmer making the far shore appear to hover above the ground. She stands at the pan\'s edge where it meets the dry savanna, the white expanse extending to the horizon ahead. The light is the brutal Namibian noon: white, directionless, flattening. A line of springbok are visible in the middle distance, also shimmering.',
        'Namibia night sky, Sossusvlei — the darkest accessible skies on earth, the Milky Way overhead as a solid luminous band rather than scattered stars, the galaxy center visible as a bright core. She lies on the warm sand, arms extended, looking directly up at the galaxy. Shot at ISO 6400 with a 20-second exposure, the stars are points rather than trails. The sand glows faintly in the starlight.',
        'Spitzkoppe granite inselberg — the great orange granite dome of Spitzkoppe rises 700 metres from the flat Namib desert floor, isolated and impossible. She stands at its base, one hand on the warm granite, the dome rising directly above her, the Namibian plains extending in every direction. The granite is ancient: 700 million years. The light is afternoon and direct, the shadow on the rock face showing every crack and texture.',
      ],
    },
  },

  {
    id: 'zanzibar-coast',
    name: 'Zanzibar',
    tagline: 'Spice island. Dhow sail. Indian Ocean turquoise.',
    category: 'campaign',
    mood: ['Zanzibar', 'Indian Ocean', 'Spice', 'Turquoise'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('accra-beach'),
      bg: 'custom-bg',
      lighting: 'Soft Tropical',
      camera: 'Full Body (50mm)',
      cameraFormat: 'Sony A1 · 50mm',
      colorGrade: 'True Life Accurate',
      userPrompts: [
        'Zanzibar Nungwi beach, morning — the powdered white coral sand, the Indian Ocean turquoise so clear the sandbars and coral patches show through it without snorkeling. She stands at the water\'s edge, the Indian Ocean color filling the entire background — a gradient from pale aquamarine at her feet to deep turquoise at the horizon. A traditional dhow with its lateen sail moves through the middle distance. The ocean here is almost unbelievable and accurate color science is the only instruction needed.',
        'Stone Town Zanzibar, carved door lane — the ancient Arab-Swahili city\'s narrow lanes lined with centuries-old carved teak doors, their intricate geometric and floral panels the finest woodcarving in East Africa. She stands before one of the great doors, one hand on the carved brass stud, looking at the camera. The lane is narrow; the buildings above lean slightly toward each other. The light in the lane is a warm indirect bounce from the high white walls.',
        'Zanzibar spice farm — the tropical garden in the interior of the island where cloves, vanilla, nutmeg, cinnamon, and cardamom grow in a dense green tangle. She stands in the spice garden, vanilla vines climbing the trees around her, clove buds on the branch at her shoulder. The light is filtered through tropical canopy: warm, dappled, humid. The air is visibly aromatic.',
        'Zanzibar Prison Island tortoises — the tiny island (Changuu) with its Aldabra giant tortoise sanctuary, the oldest individuals over 200 years old, the coral reef visible in the surrounding shallows. She sits cross-legged beside one of the enormous tortoises, its shell level with her shoulder, the creature ancient and indifferent. The island vegetation is green around them, the reef water visible through the trees.',
        'Zanzibar sunset dhow — on the deck of a traditional Swahili dhow, its lateen sail full, the Indian Ocean flat and golden as the sun sets. She stands at the bow, the sail above, the Stone Town skyline and its distinctive House of Wonders tower visible on shore. The sky is the equatorial sunset: going from gold to orange to deep coral in fifteen minutes. The dhow and the sunset belong together.',
        'Mnemba Atoll, turquoise shallows — the shallow coral atoll of Mnemba, the water a sequence of blues from palest aquamarine at the reef edge to deep Prussian blue in the channel. She stands on the reef flat in ankle-deep water, the underwater world of coral and fish visible through the crystal clarity at her feet, the atoll\'s sand cay visible in the background. The light refracts in moving patterns across the sandy bottom.',
      ],
    },
  },

  // ── STREET ───────────────────────────────────────────────────────────────────

  {
    id: 'london-tube',
    name: 'London Underground',
    tagline: 'Deep level. Tile. The oldest metro in the world.',
    category: 'street',
    mood: ['London', 'Underground', 'Gritty', 'Motion'],
    config: {
      photoDirection: 'STREET_STYLE_CANDID',
      locationPreset: loc('nyc-subway'),
      bg: 'custom-bg',
      lighting: 'Artificial Fluorescent',
      camera: 'Full Body (28mm)',
      cameraFormat: 'Ricoh GR IIIx · 40mm',
      colorGrade: 'Underground Grain',
      userPrompts: [
        'London deep level tube station — the curved tile walls of a Jubilee or Piccadilly line platform, the cream and teal or cream and chocolate tile, the distinctive roundel signage, a train arriving with a rush of displaced air. She stands on the yellow platform line, coat gathered, the train pulling in beside her as a blur of silver and green. The fluorescent platform lighting is clinical and universal; the rush of hot tunnel air bends her coat for a fraction of a second. The oldest metro in the world.',
        'London Underground carriage, mid-morning — the patterned moquette seats, the chrome handrails, the tube map in its distinctive font above the windows. She sits in a corner seat, one hand on the bar above, looking at her reflection in the dark window opposite, the tunnel wall rushing past behind it. The carriage sways. Her reflection is clear and present in the black glass.',
        'Angel or Holborn escalator shaft — the deep escalator descends into the earth at an angle so steep the bottom is invisible from the top. Other commuters are blurred movement on the up side. She stands alone on the down escalator, looking directly at the camera, perfectly still as the city descends around her. The fluorescent strip lights recede to a vanishing point in the ceiling above. The light is institutional, the depth vertiginous.',
        'London Overground elevated platform — the orange trains of the Overground visible from the elevated platform, the London skyline spread below at roof height. She stands at the platform edge, the city below and around her, the network of Victorian railway infrastructure visible in every direction. The light is the overcast London morning: flat, diffuse, grey. The city is enormous in every direction.',
        'London Waterloo rush hour — the Victorian iron and glass roof of Waterloo station arching 30 metres above, the morning commuter crowd moving in every direction through the concourse. She moves through the crowd, coat collar up, not rushing — the only still current in the stream of movement. The crowd blurs around her; she is sharp. The departure boards click overhead.',
        'Last tube, midnight — the near-empty Northern or Victoria line carriage at midnight, the fluorescent overhead lighting harsh and honest. She sits alone in the carriage, legs crossed, looking out the window at the tunnel walls rushing past in dark streaks of light. Her reflection is clear in the opposite window. Two other passengers are visible at the far end, asleep.',
      ],
    },
  },

  {
    id: 'paris-metro',
    name: 'Paris Métro',
    tagline: 'Art Nouveau iron. Belle Époque tile. The other Paris.',
    category: 'street',
    mood: ['Paris', 'Metro', 'Belle Époque', 'Underground'],
    config: {
      photoDirection: 'STREET_STYLE_CANDID',
      locationPreset: loc('paris-alley'),
      bg: 'custom-bg',
      lighting: 'Artificial Warm',
      camera: 'Full Body (28mm)',
      cameraFormat: 'Leica Q3 · 28mm',
      colorGrade: 'Warm Film Grain',
      userPrompts: [
        'Paris Métro Arts et Métiers station — the copper-plated submarine capsule aesthetic designed by artist François Schuiten: curved copper walls lined with circular portholes and mechanical clock elements. She stands in the curved copper corridor, the riveted metal warm amber around her, the porthole circles repeating. The light is warm and industrial. It feels genuinely like the interior of a Jules Verne submarine and the effect is entirely architectural, entirely real.',
        'Paris Métro Line 4 platform — the classic Paris Métro: cream and chocolate tile walls, the rubber-wheeled train arriving nearly silently, the station name in Art Deco white-on-blue tile above. She sits on the folded Strapontin bench attached to the pillar, coat over her lap, looking down the platform at the arriving train. The Belle Époque color palette of the tile and the fluorescent light create the specific visual world of the underground Paris.',
        'Paris Métro elevated crossing, Bir-Hakeim — the Line 6 viaduct crossing the Seine at Bir-Hakeim, the Eiffel Tower visible through the iron ironwork at the right moment. She stands at the carriage window, the Seine below visible in the gap, the tower framing the shot from across the river. The iron structure of the elevated section creates graphic shadow patterns on the carriage interior. The view lasts only seconds.',
        'Paris Métro Guimard entrance, Abbesses — the original 1900 Hector Guimard Art Nouveau entrance canopy in dark green cast iron, the lanterns lit, the dragonfly-wing glass panels above. She ascends the stairs into daylight, emerging from the entrance, the Montmartre street visible above. Shot from the street looking down, she is framed in the ornate ironwork of the canopy ascending toward the lens.',
        'Forum des Halles RER hub — the vast underground transit hub beneath the Jardin des Halles, the light descending in shafts from the garden above through the glass canopy. She moves through the concourse, the escalators and platforms around her, the architecture enormous and slightly inhuman in scale. The light shafts from above are the only warmth in the space.',
        'Paris Métro at midnight, elevated section — the last train on an elevated section, the carriage half-empty, the city lights of Paris visible through the windows as amber and white ribbons of light. She sits by the window, her reflection overlaid on the moving city outside. The Eiffel Tower is briefly visible through the glass, lit gold. The city continues without pause.',
      ],
    },
  },

  {
    id: 'berlin-wall',
    name: 'Berlin Wall',
    tagline: 'East Side Gallery. History as canvas. Divided no more.',
    category: 'street',
    mood: ['Berlin', 'Street Art', 'History', 'Raw'],
    config: {
      photoDirection: 'STREET_STYLE_CANDID',
      locationPreset: loc('berlin-neon'),
      bg: 'custom-bg',
      lighting: 'Overcast Urban',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Nikon Z8 · 35mm',
      colorGrade: 'Desaturated Urban',
      userPrompts: [
        'East Side Gallery Berlin — the longest surviving section of the Berlin Wall, 1.3 kilometres of concrete covered in murals by 118 artists from 21 countries. She walks along the wall, the famous Dmitri Vrubel "Fraternal Kiss" mural directly behind her, the two leaders’ faces enormous. The concrete of the wall is the texture of history: bullet holes still visible, the murals weathered by decades of Berlin weather. The Spree river is on the other side of the wall, invisible.',
        'Unter den Linden boulevard, summer — the historic central boulevard of Berlin, the lime trees fully leafed and forming a continuous green canopy above the central pedestrian walk. She moves through the dappled tree-light toward the Brandenburg Gate visible at the western end of the boulevard. The Humboldt University and the State Opera flank the street. The light through the linden trees in summer is specific: bright, moving, green-gold.',
        'Landwehrkanal Kreuzberg, May — the canal in Berlin\'s most creative district, the water lined with century-old plane trees in full spring leaf, the Maybachufer market stalls setting up on the opposite bank. She stands at the canal\'s edge, leaning against a plane tree trunk, the green water below, the leafy canopy above. The light in May through the trees is the most beautiful in Berlin. The neighbourhood smells of falafel and coffee.',
        'Tempelhofer Feld — the vast former Tempelhof Airport converted to public parkland, the runways still visible, the enormous curved terminal building dominating the western edge. She stands in the middle of the former runway, the terminal behind her a kilometre away but still commanding. Around her: dozens of people cycling, flying kites, playing with dogs. The scale of the open space in the middle of a city is disorienting and liberating.',
        'Berlin Berghain area, late evening — the industrial landscape around the infamous club: former power station brick, canal infrastructure, the post-industrial topography of Friedrichshain. She stands outside the building, the queue absent (too early), the massive industrial facade behind her lit only by the street and one red exit sign. The urban texture of Berlin nightlife from the outside: enormous, unglamorous, and completely itself.',
        'Hackesche Höfe, Courtyard 1 — the Jugendstil (Art Nouveau) tilework of the first courtyard of the Hackesche Höfe, the most elaborate of the eight interconnected courtyards. The curved tile facade in warm cream and cobalt is the backdrop. She stands in the courtyard center, the tiled facade behind her, a café terrace to one side. The light is the diffuse courtyard light of a Berlin noon: bright from above, soft from the reflections.',
      ],
    },
  },

  {
    id: 'lagos-market',
    name: 'Lagos Market',
    tagline: 'Balogun market. The commerce of a continent.',
    category: 'street',
    mood: ['Lagos', 'Market', 'Color', 'Energy'],
    config: {
      photoDirection: 'STREET_STYLE_CANDID',
      locationPreset: loc('night-market'),
      bg: 'custom-bg',
      lighting: 'Harsh Equatorial',
      camera: 'Full Body (28mm)',
      cameraFormat: 'Fuji X-T5 · 23mm',
      colorGrade: 'Saturated Warm',
      userPrompts: [
        'Balogun market Lagos Island — the largest market in West Africa, the stalls stacked floor-to-ceiling with Ankara fabric in every pattern imaginable: geometric, floral, abstract, in every combination of color. She stands in the market\'s main aisle, a bolt of indigo Adire fabric in one arm, the stall walls a riot of pattern on every side. The equatorial light that reaches through the corrugated roof turns every color more vivid. The commerce is total and exhilarating.',
        'Third Mainland Bridge, Lagos — the 11.8km bridge over Lagos Lagoon, the longest in Africa, the water below a flat silver, the Lagos Island skyline ahead and the mainland behind. She stands at the car lane\'s edge on a maintenance walkway, the lagoon wind constant, both city skylines simultaneously visible in opposite directions. Shot at dawn when the light is low and the lagoon water reflects the pink sky. The threshold between two halves of the world\'s fastest-growing megalopolis.',
        'Lekki Phase 1 at night — the outdoor bars and restaurants of Lagos\'s most dynamic nightlife strip, the terraces full, the music audible from the street. She stands at the entrance to one of the outdoor venues, the warm amber and neon of the bar signs behind her, the street alive. The equatorial night is warm; the city is at full volume. The creative energy of Lagos at midnight.',
        'Lagos Surulere, National Stadium — the 1970s brutalist National Stadium of Nigeria, its enormous concrete form rising above the neighborhood. She stands on the stadium approach, the concrete mass behind her, the old Lagos residential streets stretching around it. The patina of decades on the concrete, the everyday life of the neighborhood at its feet. The image is about a certain Lagos pride.',
        'Lagos Ajah, edge of city — the point where Lagos runs out: the Atlantic coast, the beach, the city ending behind her in a cluster of new development. She stands at the water\'s edge, the Atlantic before her and the city behind, barefoot on the dark sand. The equatorial afternoon light is direct and warm. This is the city\'s final comma before the ocean begins.',
        'Oyingbo market at dawn, Lagos — the wholesale market setting up before sunrise: vendors arriving with enormous head loads of yam, tomatoes, peppers, their silhouettes moving through the half-light of pre-dawn. She stands at the market\'s edge as the city wakes around her, the light beginning to warm on the stall roofs. Shot at ISO 3200 to capture the pre-dawn quality: warm, grainy, alive with commerce before the day officially begins.',
      ],
    },
  },

  {
    id: 'mumbai-street',
    name: 'Mumbai Streets',
    tagline: 'Maximum city. Marine Drive. The chaos that has beauty.',
    category: 'street',
    mood: ['Mumbai', 'Street', 'Chaos', 'Beautiful'],
    config: {
      photoDirection: 'STREET_STYLE_CANDID',
      locationPreset: loc('mumbai-drive'),
      bg: 'custom-bg',
      lighting: 'Harsh Tropical',
      camera: 'Full Body (28mm)',
      cameraFormat: 'Fuji X-Pro3 · 23mm',
      colorGrade: 'Warm Humid',
      userPrompts: [
        'Marine Drive dawn — the curve of Mumbai\'s Queen\'s Necklace promenade before the city fully wakes, the Arabian Sea flat and silver beside the walkway, the art deco apartment facades behind catching the first direct light. She walks the promenade in the direction of the curve, the sea beside her and the buildings behind, her figure in motion against the still water. The light is the specific pre-morning quality of Indian coastal cities: warm and slightly hazy, everything soft.',
        'Gateway of India, dawn — the massive basalt arch of the Gateway on the harbour front, the Taj Mahal Palace Hotel visible behind to the right. She stands on the broad plaza before the arch, her figure dwarfed by the scale of the colonial monument. The harbour is behind the arch; early fishing boats move in the gap. The light is the warm morning before the tourist crowds arrive. The arch frames the Arabian Sea.',
        'Dharavi pottery quarter — the kiln-fired clay pots stacked in towers around the kilns in the Kumbharwada pottery quarter of Dharavi, the red earthenware vessels drying in the sun. She stands in the pottery lane, the stacks of pots framing her on both sides, a potter\'s wheel visible behind. The equatorial sun is direct and warm. This is the craft economy of Mumbai at its most photogenic and its most honest.',
        'Mumbai local train, women\'s compartment — the Western Railway local train at Bandra or Dadar, the women\'s compartment full but not standing-room-only at this hour. She sits by the open door, the Mumbai suburban landscape rushing past at twenty kilometres per hour. The city\'s textile mills, chawls, and towers move through the open doorway. The specific color palette of Mumbai through that open door: bleached concrete, green trees, and the sky.',
        'Crawford Market interior — the Norman Gothic stone exterior and the interior hall of Mumbai\'s oldest market, the tropical fruit piled in color pyramids, the spice vendors with their open burlap sacks. She stands in the fruit section, the market light filtering through the clerestory windows above in warm beams. The colors of the fruit are vivid against the old stone. The market smells of cardamom and mango.',
        'Bandra West rooftop — above the hip quarter of Mumbai where the film industry lives, the Bandra-Worli Sea Link visible in the distance across the bay. She stands at the rooftop edge, the city below her at its most contemporary: street art, boutiques, café terraces. The sea link\'s cable-stay spans are visible in the golden hour light over the water. The city at its most modern, its most itself.',
      ],
    },
  },

  {
    id: 'mexico-city',
    name: 'Mexico City',
    tagline: 'Polanco. Zócalo. The world\'s largest city.',
    category: 'street',
    mood: ['Mexico City', 'Urban', 'Color', 'Ancient-Modern'],
    config: {
      photoDirection: 'STREET_STYLE_CANDID',
      locationPreset: loc('mexico-zocalo'),
      bg: 'custom-bg',
      lighting: 'High Altitude Sun',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Leica M11 · 35mm',
      colorGrade: 'Warm Saturated',
      userPrompts: [
        'Zócalo, Mexico City at dawn — the vast central plaza at the center of the largest city in the Western Hemisphere, the Metropolitan Cathedral\'s two towers and the National Palace flanking it, the Aztec Templo Mayor ruins visible at the northeast corner. She stands in the center of the plaza, the scale of the surrounding architecture enormous. The dawn light is the high-altitude CDMX morning: clear, cool, with a quality of light that exists only at 2240 metres elevation.',
        'Avenida Presidente Masaryk, Polanco — the wide tree-lined boulevard of Mexico City\'s most international neighborhood, the luxury boutiques behind their discreet facades, the jacaranda trees along the median in purple bloom. She walks Masaryk toward the camera, the boutique facades behind her, the tree canopy above. The light is the warm Mexico City afternoon filtered through the jacaranda bloom.',
        'Roma Norte, converted mansion — one of the Porfiriato-era mansions of Colonia Roma now converted to gallery or studio space, the Art Nouveau facade intact, the interior opened up. She stands in the internal garden courtyard, the ornate facade visible above, the bougainvillea climbing the walls. The light is the courtyard light of CDMX: warm, bounced, the sky a square of blue above.',
        'Xochimilco trajinera — on a painted wooden trajinera boat on the ancient canals of Xochimilco, the floating gardens (chinampas) of the Aztec agricultural system on both sides. She sits at the front of the boat, the canal ahead, the willow trees trailing in the water, other brightly painted trajineras passing. The colors of the boats are vivid and traditional: red, yellow, green, and every painted name.',
        'Frida Kahlo Museum, Coyoacán — the blue-cobalt walls of La Casa Azul, Frida Kahlo\'s house and lifelong studio, the cobblestone garden courtyard with its pre-Columbian sculptures and plants. She stands in the courtyard garden, the intense cobalt blue of the walls behind her, the morning light on the Diego Rivera murals inside visible through the open doorway. The neighborhood outside smells of mezcal and marigolds.',
        'Paseo de la Reforma at night — the long boulevard of Mexico City\'s grandest avenue, the Angel of Independence monument lit gold and white on its column above the roundabout, the towers of Polanco and Santa Fe visible in the distance. She stands at the roundabout edge, the lit monument behind her, the city traffic flowing. The altitude makes the night air clear; the city light is warm and vast.',
      ],
    },
  },

  {
    id: 'hong-kong-neon',
    name: 'Hong Kong Neon',
    tagline: 'Kowloon signs. Victoria Peak. Vertical city.',
    category: 'street',
    mood: ['Hong Kong', 'Neon', 'Vertical', 'Night'],
    config: {
      photoDirection: 'STREET_STYLE_CANDID',
      locationPreset: loc('hk-walkway'),
      bg: 'custom-bg',
      lighting: 'Neon Night',
      camera: 'Full Body (28mm)',
      cameraFormat: 'Ricoh GR IIIx · 40mm',
      colorGrade: 'Neon Saturated',
      userPrompts: [
        'Mong Kok neon canyon — the densest urban area on earth, the neon signs projecting from every floor of every building on both sides of the street, the combined light turning the whole corridor electric. She walks below the signs at 11pm, the color cast changing as she moves from one neon zone to another: cyan, then amber, then magenta. Shot from slightly below, the signs above her are the architecture. Everything below is lit from the signs above.',
        'Hong Kong Mid-Levels Escalator, morning commute — the longest outdoor covered escalator system in the world rises 135 metres through the hill neighborhoods, the city visible at successive levels through the covered structure. She rides upward, the city below and beside changing in the gaps between buildings. The morning light comes from the harbour side, catching the vertical city in horizontal amber bands. She rises through it.',
        'Victoria Peak at night — the viewing platform at the Peak, the Hong Kong skyline spread below in the most famous city-light panorama in the world: both shores of the harbour lit, the towers their full brilliance, the neon of Kowloon and the glass of Central. She stands at the railing, looking down at the display below. The air is slightly cooler up here; the lights below are the entire reason.',
        'Hong Kong Central elevated walkway — the network of elevated pedestrian bridges connecting the IFC, Exchange Square, and the Hong Kong Station. She walks the skybridge, the harbour visible below through the glass, the glass towers of Central rising around. The light is the diffuse overcast typical of Hong Kong: flat, slightly grey, making the glass and the water the same value.',
        'Aberdeen Harbour typhoon shelter — the traditional fishing boats moored in the protected harbour, their wooden hulls painted red and green, the floating restaurants beyond them with their string lights. She stands on the harbour wall, the traditional boats in the foreground, the towers of Aberdeen behind and above. The contrast of the fishing village aesthetic and the residential towers is the image.',
        'Causeway Bay midnight — the shopping district at full midnight intensity, the pavement crowds undiminished, the Sogo department store facade lit like a billboard from ground to roof. She moves through the crowd, the only person not looking at a phone, the vertical neon and LED facades of the shopping towers around her. The density of people and light in this small area of the planet is one of the defining experiences of Hong Kong.',
      ],
    },
  },

  {
    id: 'copenhagen-bike',
    name: 'Copenhagen',
    tagline: 'Nyhavn color. Bike culture. Danish design living.',
    category: 'street',
    mood: ['Copenhagen', 'Nordic', 'Bikes', 'Design'],
    config: {
      photoDirection: 'STREET_STYLE_CANDID',
      locationPreset: loc('cph-studio'),
      bg: 'custom-bg',
      lighting: 'Nordic Diffuse',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Leica Q3 · 35mm',
      colorGrade: 'Nordic Clean',
      userPrompts: [
        'Nyhavn quay, afternoon — the 17th-century canal lined with the famous colored townhouses in ochre, cobalt, terracotta, and cream, the old wooden sailing ships moored along the quay. She walks the cobblestone quay toward the canal entrance, the facades reflected in the canal water below. The light is the specific Nordic afternoon: low-angle even in summer, warm and slightly golden, the colors of the facades at their truest. Copenhagen at its most iconic and exactly as beautiful as promised.',
        'Copenhagen cycling infrastructure, morning — the wide dedicated cycling lanes of central Copenhagen at 8am, the stream of commuters on Dutch upright bikes and cargo bikes flowing past. She cycles in the stream, one hand on the bars, a coffee cup in the other, the city architecture passing behind. The Scandinavian morning light is clean and slightly blue. This is the most functional city in the world and it looks it.',
        'Torvehallerne glass market — the twin glass-roofed market pavilions at Israels Plads, the fresh Nordic produce and design food stalls inside catching the filtered light. She moves through the market interior, the glass roof casting a soft, diffuse light on the stalls around her. The produce is arranged with Danish precision: color-coordinated, beautiful, functional. The market is the city\'s values expressed in food.',
        'Danish Design Museum Copenhagen — the 18th-century Rococo building now housing the canon of Danish design: the Arne Jacobsen Egg chair, the PH lamps, the Bernadotte cutlery. She stands in one of the galleries, a Jacobsen Series 7 chair beside her, the warm wood and chrome of Danish modern design surrounding her. The light is the museum natural light from above: diffuse, even, honest.',
        'Frederiksberg Palace Gardens, autumn — the romantic English landscape park above the lake, the palace visible on the hill through the trees, the autumn leaves turning. She walks the tree-lined path beside the lake, the water still and reflecting the colored canopy above. The light is the Nordic autumn: golden and low, the shadows long, the colors amber and rust. The gardens are empty and entirely hers.',
        'Vesterbro Kødbyen, dusk — the former meatpacking district of central Copenhagen, its white-tiled industrial buildings now housing galleries, bars, and restaurants, the wide cobblestone courtyards lit by the warm evening light. She stands in the central courtyard, the white-tiled facade behind her, the creative district coming alive around her at dusk. The industrial-beautiful aesthetic of converted infrastructure.',
      ],
    },
  },

  {
    id: 'sao-paulo-graffiti',
    name: 'São Paulo Walls',
    tagline: 'Beco do Batman. Paulistano murals. Tropical megacity.',
    category: 'street',
    mood: ['São Paulo', 'Graffiti', 'Tropical', 'Megacity'],
    config: {
      photoDirection: 'STREET_STYLE_CANDID',
      locationPreset: loc('wynwood-walls'),
      bg: 'custom-bg',
      lighting: 'Tropical Overcast',
      camera: 'Full Body (28mm)',
      cameraFormat: 'Nikon Z6III · 28mm',
      colorGrade: 'Saturated Urban',
      userPrompts: [
        'Beco do Batman, Vila Madalena — the famous graffiti alley of São Paulo, every surface covered in commissioned murals: walls, stairs, columns, the ground itself. She stands at the alley\'s midpoint, the murals floor-to-ceiling around her in every direction, the narrow strip of sky above. The light in the alley is the reflected light of the murals: chromatic, vivid, shifting. The work here ranges from wildstyle to fine art and the total effect is overwhelming.',
        'MASP, Avenida Paulista — the Museu de Arte de São Paulo in its iconic suspended red concrete frame, hovering above the avenue on its two red columns, the open plaza beneath it. She stands below the museum in the covered plaza, looking up at the red steel structure above. Paulista\'s traffic and towers are visible behind and to both sides. The bold geometry of Lina Bo Bardi\'s 1968 building is the most distinctive museum facade in the Americas.',
        'São Paulo Jardins rooftop — above the wealthy garden district, the infinite horizontal density of São Paulo visible in every direction: towers, trees, towers, trees stretching to the smog-haze horizon. She stands at the rooftop edge, the city behind her in every direction, no hills or water to interrupt the urban field. São Paulo has no horizon. It just keeps going. The tropically overcast sky gives the whole city an even, grey-bright light.',
        'Mercado Municipal São Paulo, interior — the spectacular neo-Gothic market hall built in 1933, the soaring stained glass windows depicting São Paulo agricultural scenes casting color on the stone floor, the food stalls below. She stands in the main hall, a section of stained glass above casting colored light across the stone floor around her. The mortadella sandwich she holds is the size of a magazine. The market is São Paulo at its most theatrical.',
        'Liberdade neighborhood, lantern street — the Japanese-Brazilian quarter\'s main shopping street decorated with the red paper lanterns of the largest Japanese community outside Japan. She walks the street, the lanterns strung above at every level, the Japanese-influenced shop facades on both sides. The street light mixes with the ambient glow of the red lanterns. The neighborhood is both Japanese and entirely Brazilian.',
        'Vila Madalena at midnight — the bars and music venues of SP\'s most bohemian neighborhood at full capacity on a Saturday, the street energy moving between the open terraces. She stands at the street corner, the warm amber light from a bar interior behind, the passing crowd around her. The music is audible but not overwhelming; the light is warm and incidental. This is the specific atmosphere of a São Paulo night.',
      ],
    },
  },

  {
    id: 'amsterdam-bike',
    name: 'Amsterdam Pedal',
    tagline: 'Morning bike. Canal bridge. The Dutch way.',
    category: 'street',
    mood: ['Amsterdam', 'Bike', 'Morning', 'Dutch'],
    config: {
      photoDirection: 'STREET_STYLE_CANDID',
      locationPreset: loc('amsterdam-canal'),
      bg: 'custom-bg',
      lighting: 'Morning Soft',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Fuji X-T5 · 35mm',
      colorGrade: 'Warm Morning',
      userPrompts: [
        'Amsterdam morning bike crossing — she rides a classic Dutch omafiets upright bicycle across a canal bridge, the canal below, the gabled merchant houses behind, one hand on the bars and one carrying a paper coffee cup. The morning light is the diffuse Dutch brightness that Vermeer painted, coming from the south-southeast and catching the canal surface and the brick facades. This is Amsterdam as itself, not performed.',
        'Amsterdam Centraal Station bicycle parking — the vast multi-storey bicycle facility beside the station, 7000 bikes stacked in silence. She locks her bike in one of the racks, the extraordinary density of cycling infrastructure around her: a forest of handlebars and wheels. The structure is functional and strangely beautiful. This is the most powerful argument for Amsterdam\'s specific civic philosophy made visible.',
        'Vondelpark morning — the long green park at early morning, cyclists and joggers on the paths, the morning light coming through the plane trees in moving dappled columns. She walks the main path, the park still quiet, the light through the trees warm and specific to this hour. A heron stands at the pond edge, indifferent. The city outside the park is already awake but the park holds its own time.',
        'Albert Cuyp market — the longest street market in the Netherlands, the stalls running 300 metres through De Pijp: stroopwafels on the griddle, aged Gouda wheels, herring stands, spring flowers. She moves through the market, the vendor calls and the street food smells around her. The market light is the Amsterdam overcast-bright: flat, even, making everything sharply visible. The market has been here every day since 1905.',
        'Amsterdam canal in tulip season — April in Amsterdam: the floating flower market and the flower boxes overflowing with tulips in every color, the canal bridges decorated. She stands on one of the arched stone bridges, tulips visible in the water boxes below, the gabled facades above, the canal a still reflection. The colors of April in Amsterdam are the colors of the Dutch Golden Age painters who invented the tulip craze.',
        'Jordaan Sunday morning, Noordermarkt — the quietest hour of Amsterdam\'s most beautiful neighborhood: the canal reflections still in the morning calm, the antique and organic farmers markets just setting up around the Noordermarkt church. She stands on the canal bridge, the narrow canal below perfectly still, the house facades reflected exactly. The neighborhood looks like it did in 1650 except for her.',
      ],
    },
  },

  // ── BEAUTY ───────────────────────────────────────────────────────────────────

  {
    id: 'studio-vapor',
    name: 'Studio Vapor',
    tagline: 'Steam. Backlighting. The face as pure sculpture.',
    category: 'beauty',
    mood: ['Steam', 'Sculptural', 'Atmospheric', 'Intimate'],
    config: {
      photoDirection: 'BEAUTY_EDITORIAL',
      locationPreset: loc('atelier-studio'),
      bg: 'custom-bg',
      lighting: 'Backlit Steam',
      camera: 'Extreme Close-Up (100mm)',
      cameraFormat: 'Canon R5 · 100mm macro',
      colorGrade: 'High Contrast Soft',
      userPrompts: [
        'Beauty studio with directed steam — the vapor catches the single backlight, creating a diffuse white glow behind the face. She faces the camera, the steam surrounding her head like a halo. The skin is luminous in the diffused light, every pore visible, no hard shadows. Shot on 100mm macro for extreme face detail: lashes, texture, the curve of the lip.',
        'Steam close-up profile — the steam moving from right to left in the frame, her profile cutting through it. The face in perfect side view, the steam creating depth and atmosphere. The shape of the nose, the curve of the forehead, the neck.',
        'Steam and color gel — a single colored gel (cyan or amber) mixed with the steam backlight, giving the vapor a color cast while the face remains neutral. The color drama.',
        'Steam extreme detail — the extreme close-up of just the eyes and nose area, steam swirling above. The moisture on the eyelashes, the detail of the iris, the perfect arch of the brow.',
        'Steam full face neutral — straight-on face, both eyes, perfect symmetry, steam surrounding the entire head. The face as mandala, perfectly centered and lit.',
        'Steam and water — steam from below and water mist from above, the face between them. The extraordinary atmospheric quality of being surrounded by water in all its states.',
      ],
    },
  },

  {
    id: 'milk-bath',
    name: 'Milk Bath',
    tagline: 'White water. Petal surface. Ancient beauty ritual.',
    category: 'beauty',
    mood: ['Milk Bath', 'White', 'Ritual', 'Serene'],
    config: {
      photoDirection: 'BEAUTY_EDITORIAL',
      locationPreset: loc('spa-concrete'),
      bg: 'custom-bg',
      lighting: 'Overhead Soft Box',
      camera: 'Overhead (50mm)',
      cameraFormat: 'Phase One · 80mm',
      colorGrade: 'High Key White',
      userPrompts: [
        'Milk bath overhead — she lies in an opaque white bath, rose petals and botanical elements floating on the surface. Shot from directly above, her face the only skin visible. The white water, the pink petals, the absolute stillness.',
        'Milk bath with flower immersion — submerged to the shoulders, the white bath surface covered in white flowers: gardenias, white ranunculus, white peony petals. Her face above the floral surface.',
        'Milk bath hands — the close-up detail of hands resting on the milk surface, the contrast of skin against white, a single dark rose between the fingers.',
        'Milk bath rising — she sits up in the bath, the white water cascading from her, the milk droplets mid-fall caught at 1/1000 sec. The motion frozen.',
        'Milk bath with botanical additions — sliced citrus, herbs, essential oil droplets on the surface. The apothecary beauty ritual. Overhead shot capturing the entire composition.',
        'Milk bath at the rim — she leans back on the bath rim, neck extended, the white bath below her. Shot from the side to capture the architectural quality of the pose.',
      ],
    },
  },

  {
    id: 'gold-hour-face',
    name: 'Golden Face',
    tagline: 'Window gold. The hour when light becomes paint.',
    category: 'beauty',
    mood: ['Golden Hour', 'Window', 'Warm', 'Sculptural'],
    config: {
      photoDirection: 'BEAUTY_EDITORIAL',
      locationPreset: loc('atelier-studio'),
      bg: 'custom-bg',
      lighting: 'Golden Hour Window',
      camera: 'Extreme Close-Up (85mm)',
      cameraFormat: 'Canon R5 · 85mm',
      colorGrade: 'Kodak Portra 800',
      userPrompts: [
        'Golden hour window beauty — the last direct sunlight of the day through a single tall window, the light almost horizontal and perfectly golden. It strikes her face at a shallow angle, illuminating one side and leaving the other in deep warm shadow. Shot on 85mm for gorgeous background compression, the window and wall behind soft and glowing.',
        'Golden hour turning profile — she turns her face from full forward to profile as the golden light moves from front-lit to rim-lit. Shot at the exact moment she is 45 degrees to the light, one side incandescent, one side shadow.',
        'Golden hour through glass with dust — the golden beam visible as a shaft of light through the air, the suspended particles catching the light. She stands in the shaft, the light volumetric around her.',
        'Golden hour hair detail — tight on the hair as it catches the golden light, each strand separately lit. The face slightly out of focus below, the hair a halo of amber light.',
        'Golden hour eyelashes — extreme tight on the eye as the golden light catches the eyelashes, each one casting a micro-shadow on the lid below.',
        'Golden hour with shadow play — a grill or architectural element in the window casting a shadow pattern across her face. The geometry of shadow as beauty element.',
      ],
    },
  },

  {
    id: 'rain-face',
    name: 'Rain Face',
    tagline: 'Water on skin. Natural and elemental. Beauty unguarded.',
    category: 'beauty',
    mood: ['Rain', 'Water', 'Natural', 'Elemental'],
    config: {
      photoDirection: 'BEAUTY_EDITORIAL',
      locationPreset: null,
      bg: 'custom-bg',
      lighting: 'Overcast Diffuse',
      camera: 'Close-Up (85mm)',
      cameraFormat: 'Sony A1 · 85mm',
      colorGrade: 'Desaturated Natural',
      userPrompts: [
        'Rain beauty — face turned up to falling rain, eyes closed, water running down in perfect streams. The overcast sky above creates perfect diffuse fill light on the face. Skin luminous and wet, no makeup or minimal waterproof makeup. The simplest, most honest beauty shot.',
        'Rain profile — the profile view of the face in light rain, water beads on the eyelashes and skin surface visible at this focal length. The rain blurred to streaks in the background.',
        'Rain and motion — she shakes her head in the rain, the water droplets leaving her hair in a perfect arc, the face in the center of the motion blur of water.',
        'Raindrop close-up — extreme close-up on a single raindrop caught on the cheek or the lip, the reflection of the sky visible inside the drop.',
        'Rain in city — she stands in urban rain, looking at camera through the rain, the city blurred behind, the rain visible in mid-air as silver lines.',
        'After rain face — the face after rain has stopped: still wet, still dewy, the overcast light soft and even. The clean, post-rain look.',
      ],
    },
  },

  {
    id: 'night-bloom',
    name: 'Night Bloom',
    tagline: 'Dark studio. Single bloom. Chiaroscuro beauty.',
    category: 'beauty',
    mood: ['Dark', 'Bloom', 'Chiaroscuro', 'Intimate'],
    config: {
      photoDirection: 'BEAUTY_EDITORIAL',
      locationPreset: loc('private-library'),
      bg: 'custom-bg',
      lighting: 'Single Candle / Point Source',
      camera: 'Close-Up (85mm)',
      cameraFormat: 'Leica SL2 · 75mm',
      colorGrade: 'Rembrandt Warm',
      userPrompts: [
        'Single candle portrait — a single candle as the only light source, placed at the level of the chin, casting upward light that creates the Rembrandt look in reverse. The background is complete black. Her face emerges from darkness. Shot at ISO 3200 for grain.',
        'Flower close-up and face — a large-scale bloom (peony or ranunculus) held at face level, the face half-obscured behind the flower. The same available light on both face and flower.',
        'Dark portrait with single petal — a single rose petal held to the lips, the eyes closed, the background black. Minimal — just skin, petal, and shadow.',
        'Dark beauty with candelabra — multiple candles in a candelabra behind and to the side, the complex warm light of multiple flame sources. Old-master quality.',
        'Bloom crown — flowers arranged in the hair for an editorial crown, dark background, the blooms lit by a single directional source. The face below the flowers.',
        'Dark glass reflection — beauty shot into a dark mirror, her face and its reflection both partially visible, partially absorbed by the dark glass.',
      ],
    },
  },

  {
    id: 'ice-beauty',
    name: 'Ice',
    tagline: 'Sub-zero. Crystal clear. Cold as editorial philosophy.',
    category: 'beauty',
    mood: ['Ice', 'Cold', 'Crystal', 'Sculptural'],
    config: {
      photoDirection: 'BEAUTY_EDITORIAL',
      locationPreset: loc('ice-hotel'),
      bg: 'custom-bg',
      lighting: 'Blue Cold Backlight',
      camera: 'Close-Up (85mm)',
      cameraFormat: 'Phase One · 80mm',
      colorGrade: 'Ice Blue',
      userPrompts: [
        'Ice block beauty — she holds a block of clear ice at face level, the light refracting through it across her face. The ice is imperfect: bubbles, cracks, natural inclusions. Her face visible through the distortion.',
        'Ice hotel beauty — in a room entirely made of ice and snow, the walls blue and glowing from within. Her breath visible in the cold air, the skin dusted with frost.',
        'Ice cube on skin — a single perfect ice cube on the collarbone or cheek, the melt water running a perfect line down the skin.',
        'Frost breath — exhaled breath visible as vapor in cold air, the face obscured momentarily by the cloud of breath, then clear.',
        'Ice water close-up — face submerged or about to emerge from very cold water, the shock of cold visible in the expression. The high-key clarity of cold.',
        'Ice crystals — extreme close-up of ice crystals forming on eyelashes or hair. The fractal beauty of frozen water at the scale of the individual crystal.',
      ],
    },
  },

  {
    id: 'sand-skin',
    name: 'Desert Skin',
    tagline: 'Fine sand. Body warmth. Earth element beauty.',
    category: 'beauty',
    mood: ['Sand', 'Earth', 'Warm', 'Elemental'],
    config: {
      photoDirection: 'BEAUTY_EDITORIAL',
      locationPreset: loc('sahara-dune'),
      bg: 'custom-bg',
      lighting: 'Desert Sun',
      camera: 'Extreme Close-Up (100mm)',
      cameraFormat: 'Canon R5 · 100mm',
      colorGrade: 'Warm Earth',
      userPrompts: [
        'Sand on skin — desert sand caught on warm skin: on the cheekbone, the shoulder, the collarbone. The fine grains visible against the skin texture. Extreme close-up. The light is warm desert sun at an angle that shows skin texture and sand grain simultaneously.',
        'Dune shadow face — the sharp line of a dune shadow dividing the face exactly in half. One side in full desert sun, brilliant; the other in cool dune shadow. The precision of desert shadow.',
        'Sand and wind — a light desert wind lifting fine sand from the surface below her, the sand spiraling across the lower part of the frame. Her face above the sand movement, clear in the warm light.',
        'Desert earth tones — the face against the red sand, the skin tones and the earth tones in conversation. The warmth of both against the blue sky.',
        'Sand in hair — sand caught in wind-moved hair, the grains catching the light like tiny glass beads. The hair lifted by wind, the dune below.',
        'Desert dawn — the beauty shot at the exact moment the sun crests the dune horizon, the first direct light on the face, cold shadow still present behind. The transition.',
      ],
    },
  },

  {
    id: 'forest-light',
    name: 'Forest Light',
    tagline: 'Canopy green. Shaft of light. Nature as studio.',
    category: 'beauty',
    mood: ['Forest', 'Green', 'Natural', 'Ethereal'],
    config: {
      photoDirection: 'BEAUTY_EDITORIAL',
      locationPreset: loc('midnight-forest'),
      bg: 'custom-bg',
      lighting: 'Dappled Canopy',
      camera: 'Close-Up (85mm)',
      cameraFormat: 'Nikon Z8 · 85mm',
      colorGrade: 'Verdant Natural',
      userPrompts: [
        'Forest canopy beauty — a single shaft of sunlight descending through the tree canopy from above, striking the face from directly above. The surrounding forest in deep green shadow. The contrast of the lit face in the dark green forest.',
        'Fern close-up and face — a large fern frond at face level, the face partially visible through the fern geometry. The forest light behind, the fern in sharp focus against a soft face.',
        'Moss and water — a mossy rock beside a forest stream, she leans against the moss, the sound of water nearby, the green of the moss and the forest behind.',
        'Forest dawn mist — early morning forest mist in shafts of first light. The mist makes the light volumetric and the face emerges from it.',
        'Leaf shadow face — a branch with leaves held between the face and the sun, the leaf shadows projected across the face in a complex organic pattern.',
        'Forest floor — lying on the forest floor, looking up at the canopy above, the lens also pointing up. The face framed by the canopy opening, the sky beyond the leaves.',
      ],
    },
  },

  // ── AVANT-GARDE ──────────────────────────────────────────────────────────────

  {
    id: 'mirror-infinite',
    name: 'Infinite Mirror',
    tagline: 'Reflection fractal. Identity multiplied. The self unmoored.',
    category: 'avant-garde',
    mood: ['Mirror', 'Infinity', 'Surreal', 'Fragmented'],
    config: {
      photoDirection: 'AVANT_GARDE_COUTURE',
      locationPreset: loc('atelier-studio'),
      bg: 'custom-bg',
      lighting: 'Reflected',
      camera: 'Three-Quarter (35mm)',
      cameraFormat: 'Phase One · 45mm',
      colorGrade: 'High Contrast Clean',
      userPrompts: [
        'Infinity mirror room — walls and floor and ceiling all mirrors, her figure multiplied to infinity in every direction, becoming a pattern of repeating selves. She stands at the center, one solid figure surrounded by her infinite reflections. The spatial confusion is the content.',
        'Two-mirror portrait — standing between two facing mirrors at a slight angle, the reflections cascading away into the distance. She faces one, her back to the other. The reflections behind her go on forever in decreasing scale.',
        'Mirror fragment — a large broken mirror mounted on a wall, the fragments reflecting different parts of her body at different angles. She stands before it, the mirror reassembling her in pieces.',
        'Floor mirror — a floor-to-ceiling mirror laid flat on the ground, she stands on it and looks down at herself looking up. The ceiling above, the figure below.',
        'Mirror and smoke — a mirror surrounded by smoke, her reflection visible through the smoke, the edges dissolving. The real figure and its reflection both partially obscured.',
        'Kaleidoscope mirror construction — a custom multi-mirror arrangement creating a kaleidoscope effect with her figure as the central element. She becomes pattern and architecture simultaneously.',
      ],
    },
  },

  {
    id: 'body-architecture',
    name: 'Body Architecture',
    tagline: 'The human form as structural element. Fashion as building.',
    category: 'avant-garde',
    mood: ['Architecture', 'Structure', 'Form', 'Conceptual'],
    config: {
      photoDirection: 'AVANT_GARDE_COUTURE',
      locationPreset: loc('berlin-brutalist'),
      bg: 'custom-bg',
      lighting: 'Hard Side Light',
      camera: 'Full Body (50mm)',
      cameraFormat: 'Phase One · 80mm',
      colorGrade: 'High Contrast B&W',
      userPrompts: [
        'Brutalist architecture body — she stands against the raw concrete of a brutalist building, wearing a structural fashion piece that echoes the geometry of the architecture. The body and the building become one composition. Hard directional light creates deep shadow in both the concrete texture and the fashion construction.',
        'Staircase geometry — a brutalist spiral stair viewed from above, she stands at the center, the stair geometry radiating from her. The architecture as frame, the body as center.',
        'Shadow architecture — a building casting a complex shadow grid on a flat surface. She stands in the shadow, the geometry projected across her body and the surface around her.',
        'Body as column — she stands absolutely rigid between actual architectural columns, her posture so controlled she reads as a column herself. The repetition: column, column, figure, column.',
        'Ceiling fragment — shot from directly below looking up, she stands above on a glass floor (or this is composited), her body foreshortened in the extreme overhead view, the architecture radiating from her above.',
        'Window grid — a massive industrial window, the grid of frames casting a perfect shadow grid. She stands in the grid, each pane framing a different part of her.',
      ],
    },
  },

  {
    id: 'void-series',
    name: 'The Void',
    tagline: 'Pure black. The figure against nothing. Existence as statement.',
    category: 'avant-garde',
    mood: ['Void', 'Black', 'Existential', 'Pure'],
    config: {
      photoDirection: 'AVANT_GARDE_COUTURE',
      locationPreset: null,
      bg: 'custom-bg',
      lighting: 'Single Rim Light',
      camera: 'Full Body (85mm)',
      cameraFormat: 'Phase One · 150mm',
      colorGrade: 'Absolute Black',
      userPrompts: [
        'The void — pure black background, a single very narrow rim light from behind creating just the edge of the figure against absolute darkness. The silhouette is barely an outline. The fashion is present only in the edge that is lit. The figure is more absence than presence.',
        'White against void — inverse: pure white background, the figure in dark fashion casting a shadow. The figure as shadow, the void as form.',
        'Void with single beam — a single narrow beam of light descending from above into absolute blackness, striking the top of her head and shoulders. She stands in the only light in the universe.',
        'Void movement — long exposure movement in the void, the dark fashion leaving light trails or the body blurring across the frame. Motion in nothing.',
        'Void with object — one object only: a chair, a door frame, one specific object in the void. She interacts with that one object. Everything else is black.',
        'Void face — extreme close-up of the face emerging from absolute black. The face floats. The background offers no context, no location, no time.',
      ],
    },
  },

  {
    id: 'oversaturation',
    name: 'Fever Dream',
    tagline: 'Maximum saturation. Color beyond realism. The image as feeling.',
    category: 'avant-garde',
    mood: ['Saturated', 'Surreal', 'Fever', 'Maximum'],
    config: {
      photoDirection: 'AVANT_GARDE_COUTURE',
      locationPreset: loc('wynwood-walls'),
      bg: 'custom-bg',
      lighting: 'Multiple Color Sources',
      camera: 'Full Body (28mm)',
      cameraFormat: 'Sony A7R V · 24mm',
      colorGrade: 'Maximum Saturation',
      userPrompts: [
        'Fever dream saturation — the image processed far beyond natural color: every color pushed to its maximum. The grass is neon green, the sky is electric blue, the flowers are screaming red and orange. She stands in this hyper-saturated world wearing something that absorbs or reflects the extreme color.',
        'Colored smoke — multiple smoke cannons in different colors (pink, yellow, blue, orange) creating an atmosphere of layered color. She stands in the color cloud.',
        'Neon light bath — multiple neon light tubes in different colors positioned around her, the color mixing on her skin and the surfaces around her. The skin becomes a canvas for the color mixing.',
        'Prism projection — a prism projecting a spectrum of light across a white or neutral surface. She stands where the spectrum crosses her body.',
        'Color field — standing in front of enormous color field paintings (Rothko-style or similar). The entire background a single field of saturated color. She becomes a figure in an abstract painting.',
        'Double exposure color — a double exposure creating two images of her in different color casts overlapping. The visual language of dream and unreliable memory.',
      ],
    },
  },

  {
    id: 'paper-world',
    name: 'Paper World',
    tagline: 'Origami landscape. Folded reality. Fashion in paper architecture.',
    category: 'avant-garde',
    mood: ['Paper', 'Origami', 'White', 'Constructed'],
    config: {
      photoDirection: 'AVANT_GARDE_COUTURE',
      locationPreset: null,
      bg: 'custom-bg',
      lighting: 'Overhead Clean',
      camera: 'Full Body (50mm)',
      cameraFormat: 'Phase One · 80mm',
      colorGrade: 'High Key White',
      userPrompts: [
        'Paper architecture world — an entirely constructed paper environment: origami mountains, paper buildings, paper trees, all at the scale of her body or larger. She stands in this constructed paper world. Everything is white paper except her. Shot overhead to show the full landscape.',
        'Paper dress and paper world — an haute couture paper dress (white, sculptural) against a white paper background. The fashion and the environment become one medium.',
        'Paper shadows — white environment, hard overhead light, the shadows of paper elements creating a complex shadow drawing on the white floor. She stands among the shadows.',
        'Unfolding paper — the moment of unfolding a large paper construction, the paper elements mid-motion, some revealing new surfaces as they open.',
        'Paper and color — a white paper world with single color elements: one red origami flower, one blue paper bird. The color is precise and intentional.',
        'Paper cityscape — miniature paper buildings at the scale of her feet, she appears to be a giant in a paper city. The camera angle makes the scale work.',
      ],
    },
  },

  {
    id: 'water-body',
    name: 'Water Body',
    tagline: 'Submerged. Surface. The body between two worlds.',
    category: 'avant-garde',
    mood: ['Water', 'Submerged', 'Surreal', 'Fluid'],
    config: {
      photoDirection: 'AVANT_GARDE_COUTURE',
      locationPreset: loc('villa-pool'),
      bg: 'custom-bg',
      lighting: 'Underwater Refracted',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Nikon Z9 · 35mm underwater housing',
      colorGrade: 'Aquatic Deep',
      userPrompts: [
        'Underwater couture — shot from below the water surface looking up, she is partially submerged, the fashion billowing in the water around her, the surface visible above distorting the sky. The fashion becomes weightless architecture.',
        'Surface tension — half the frame above water, half below. Above: the normal world. Below: the refracted, distorted underwater world. Her body crosses the interface.',
        'Pool floor — shot from above, she lies on the floor of a very shallow pool, the water above her creating surface patterns. The aqueous distortion of her face through the water.',
        'Floating fabric — very light fabric released in water, photographed from above as it spreads across the surface in abstract patterns.',
        'Waterfall — standing in a waterfall, the water sheeting over her, the fashion soaked and clinging. The sheer volume of falling water.',
        'Ocean submerged — in the clear ocean, shot from below, her figure against the sky refracted through the water surface above.',
      ],
    },
  },

  {
    id: 'fragmentation',
    name: 'Fragmented',
    tagline: 'The image broken. Reassembled wrong. A new whole.',
    category: 'avant-garde',
    mood: ['Fragmented', 'Collage', 'Broken', 'Reconstructed'],
    config: {
      photoDirection: 'AVANT_GARDE_COUTURE',
      locationPreset: null,
      bg: 'custom-bg',
      lighting: 'Clean Studio',
      camera: 'Full Body (50mm)',
      cameraFormat: 'Phase One · 80mm',
      colorGrade: 'Clean Digital',
      userPrompts: [
        'Physical collage — a physical collage construction in front of the lens: photographs of parts of her body cut and rearranged and rephotographed. The body as image as body again. Layers of medium.',
        'Mirror shard portrait — multiple small mirrors at different angles reflecting different parts of her face. The face reconstructed from fragments.',
        'Cut-out negative space — pieces of the image removed (white voids in the shape of body parts). She exists in parts and absences.',
        'Triptych body — the body photographed in three separate frames that are then placed adjacent: head, torso, legs — but slightly misaligned, slightly different poses.',
        'Architectural fragment — she is framed through a series of apertures — doorways within doorways, frames within frames — each frame showing a different part of her, the full figure only assembled by reading all frames simultaneously.',
        'Body map — a scientific/diagrammatic treatment: the body mapped with geometric lines, measurements, annotations. Fashion as specimen.',
      ],
    },
  },

  {
    id: 'fire-smoke',
    name: 'Fire & Smoke',
    tagline: 'Smoke element. Atmospheric chaos. Power at the edge.',
    category: 'avant-garde',
    mood: ['Fire', 'Smoke', 'Drama', 'Elemental'],
    config: {
      photoDirection: 'AVANT_GARDE_COUTURE',
      locationPreset: loc('detroit-factory'),
      bg: 'custom-bg',
      lighting: 'Dramatic Side Light',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Canon R3 · 35mm',
      colorGrade: 'High Contrast Warm',
      userPrompts: [
        'Smoke editorial — theatrical colored smoke (black or white) filling the lower half of the frame, she stands above it. The smoke rises around her, partially obscuring the lower body and the floor. The upper body and face are clear in the directional light. Dramatic and atmospheric.',
        'Smoke and strong backlight — the backlight makes the smoke glowing and volumetric, she is silhouetted in the middle of the glow. The smoke is the light.',
        'Fire in background — controlled fire in the background behind her (firepit, bonfire), the orange-red glow backlighting her against the dark. Her face lit from the fire.',
        'Smoke portrait tight — tight on the face, smoke curling around the shoulders and jaw. The smoke at face level creates mystery and intimacy.',
        'Industrial smoke — the authentic smoke of industrial exhaust from factory stacks, she stands on a roof or dock with the industrial smoke columns behind. Urban environmental drama.',
        'Smoke color contrast — a cool-lit figure against warm-colored smoke, or vice versa. The color temperature contrast between the figure and the smoke.',
      ],
    },
  },

  // ── FINE ART ─────────────────────────────────────────────────────────────────

  {
    id: 'louvre-gallery',
    name: 'Louvre',
    tagline: 'Eight centuries of art. The body among masterpieces.',
    category: 'fine-art',
    mood: ['Louvre', 'Classical', 'Paris', 'Masterpiece'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('paris-salon'),
      bg: 'custom-bg',
      lighting: 'Museum Gallery',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Leica SL2 · 35mm',
      colorGrade: 'Museum Warm',
      userPrompts: [
        'Louvre Grande Galerie — the longest gallery in the world: 460 metres of Italian Renaissance paintings on both walls, the parquet floor in a warm herringbone, the tall windows on the north wall flooding the space with diffused museum light. She walks the center of the gallery, the paintings flanking her at every height, each one a living face from five centuries ago. She is the only moving thing. The gallery light is specifically beautiful: northern, even, warm.',
        'Winged Victory of Samothrace — the marble Nike stands at the top of the great Daru staircase, prow of a stone ship, wings extended, headless and permanent. She stands at the base of the stair, looking upward at the figure above, the staircase rising around her. The scale drama between the small human figure at the base and the 2.4-metre ancient marble above it is the composition. The light from the skylights above falls on the marble wings.',
        'Louvre after hours, Denon Wing — the galleries dimly lit by their individual painting spots, the corridors between them in near-darkness. She stands alone before a large Italian canvas, the spot illuminating the painting, spilling onto her face. The museum after closing is intimate in a way it never is during the day. The Mona Lisa\'s room is empty; the painting is private. The silence here is the loudest in Paris.',
        'Richelieu Wing covered sculpture court — the twin glass-roofed courts of the Richelieu Wing, flooded with even Paris daylight through the glass above. The Marly Horses rear above everything; the French 17th- and 18th-century sculpture fills the space at every scale. She stands between two monumental figures, the glass roof sky above, the marble horses visible behind. The court is one of the most beautiful interior spaces in Europe.',
        'Louvre Egyptian antiquities, colossal head — the Sully Wing\'s Egyptian collection, the granite colossal pharaonic head three metres tall on its plinth, the mummy cases and ushabtis in the cases along the walls. She stands before the colossal head, her figure barely reaching the neck of the sculpture. The museum light on the ancient granite is warm and amber. Three thousand years of art in every direction. Her presence in it is exactly right.',
        'Louvre pyramid interior at dusk — seen from inside the Cour Napoléon, the glass pyramid above visible against the sky turning violet at dusk, the historic Lescot Wing and the Denon and Richelieu facades around the courtyard. She stands in the center of the underground lobby, looking up through the pyramid geometry at the sky above. The glass triangles above cut the sky into precise fragments. The light comes from above and changes as the sky darkens.',
      ],
    },
  },

  {
    id: 'met-museum',
    name: 'The Met',
    tagline: 'Fifth Avenue. Five thousand years. The most important art.',
    category: 'fine-art',
    mood: ['Metropolitan', 'New York', 'Art', 'Grand'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('museum-afterhours'),
      bg: 'custom-bg',
      lighting: 'Museum Overhead',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Canon R5 · 35mm',
      colorGrade: 'Warm Museum',
      userPrompts: [
        'Met Great Hall — the vast Beaux-Arts entrance hall of the Metropolitan Museum, the arched ceiling 20 metres above, the columns, the famous seasonal flower arrangements at the information desk. She stands at the center of the hall, the full symmetry of the Neoclassical interior around her, the museum opening through the arches in every direction. The stone is warm limestone; the light comes from above. She is a single figure in the largest art museum in the Western Hemisphere.',
        'Temple of Dendur, Sackler Wing — the actual ancient Egyptian temple, relocated stone by stone from Aswan, sits inside its own glass hall at the Met, reflected in the reflecting pool before it, the Central Park and Fifth Avenue visible through the glass wall beyond. She stands beside the temple\'s stone pylons, the ancient hieroglyphs level with her shoulder. The afternoon light through the glass wall casts long shadows across the stone floor.',
        'Met roof garden, summer — the rooftop sculpture garden above the Fifth Avenue facade, a contemporary installation occupying the space, Central Park stretching below and the Manhattan skyline visible beyond the park. She stands beside the sculpture at the roof\'s edge, the park\'s green expanse dropping away, the East Side towers visible above the tree line. The high summer light is direct and clean.',
        'Met Dutch masters gallery — the 17th-century Dutch paintings rooms: Vermeer\'s light-filled interiors, Rembrandt\'s self-portraits, the Hals portraits. She stands in the Vermeer gallery, one of the small paintings at eye level beside her, the warm museum light on the varnished canvases. The paintings are small and the light in them is everything. Being in the room with the actual objects is different from any reproduction.',
        'Met Greek and Roman galleries — the marble halls with their columns and skylights, the Hellenistic and Roman sculpture in the cases and on the pedestals: torsos, heads, entire figures. She stands between two standing marble figures, the skylight above creating the same diffuse light the sculptors intended. The ancient stone is warm cream in this light. Time moves differently in this gallery.',
        'Met Costume Institute installation — the Anna Wintour Costume Center during an exhibition installation, the fashion archive of five centuries displayed in the context of its historical moment. She stands before a major work — a Balenciaga evening gown or a 17th-century court dress under glass — the dark gallery surrounding the lit display case. The relationship between the clothing in the case and the clothing she wears is the subject.',
      ],
    },
  },

  {
    id: 'guggenheim-bilbao',
    name: 'Guggenheim',
    tagline: 'Titanium curves. Bilbao river. Architecture as masterwork.',
    category: 'fine-art',
    mood: ['Guggenheim', 'Titanium', 'Gehry', 'Iconic'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('museum-afterhours'),
      bg: 'custom-bg',
      lighting: 'Overcast Silver',
      camera: 'Full Body (28mm)',
      cameraFormat: 'Leica Q3 · 28mm',
      colorGrade: 'Silver Cool',
      userPrompts: [
        'Guggenheim Bilbao, riverside walkway — the titanium-clad curved surfaces of Frank Gehry\'s 1997 building on the Nervión River, the scales of titanium reflecting the overcast Basque sky in hundreds of slightly different angles. She stands on the riverside walkway, both arms at her sides, the impossible organic building filling the background. The overcast light makes the titanium surfaces glow rather than glare — silver and slightly warm. The building curves above her at an angle that seems to defy gravity.',
        'Guggenheim Bilbao atrium — the 50-metre soaring interior atrium, the curved white walls rising in organic forms, the glass curtain wall bringing the Nervión River into the building as light. She stands on the atrium floor, the full vertical volume above her, the catwalks and glass elevators visible ascending the walls. The scale is theatrical. The light from the glass wall fills the space without direction.',
        'Jeff Koons Puppy, Guggenheim forecourt — the 12-metre topiary West Highland Terrier in living flowers (marigolds, petunias, begonias in seasonal rotation) stands at the museum entrance. She stands beside one enormous paw, the scale making her a fraction of the sculpture. Shot from below, both the puppy\'s face and her face visible, the blue Basque sky above. The piece is simultaneously monumental and absurd.',
        'Guggenheim New York, spiral ramp from below — the Frank Lloyd Wright spiral interior seen from the ground floor, the continuous ramp winding upward around the circular interior in a helix of white concrete. She stands at the ramp base, looking up, the spiral diminishing above in concentric circles. Shot from directly below, the geometry is a pure abstraction. The skylight at the center top is a white circle of light.',
        'Guggenheim New York exterior, Fifth Avenue — the inverted ziggurat of the building against the Manhattan grid: the wider upper floors cantilevered over the narrower base, the smooth white concrete against the limestone and glass of the Upper East Side. She stands on the Fifth Avenue sidewalk, the building occupying the background entirely. The building refuses the grid around it and the image is about that refusal.',
        'Guggenheim Bilbao at night — the building floodlit in warm amber, the titanium scales taking on a completely different character from the daylight silver: warmer, more physical, more present. The Nervión River reflects the lit building in a full-length mirror below. She stands on the bridge, the building visible on both sides of her — the real one and its reflection — the whole composition doubled by the river.',
      ],
    },
  },

  {
    id: 'tate-modern',
    name: 'Tate Modern',
    tagline: 'Turbine Hall. Power Station. Contemporary art cathedral.',
    category: 'fine-art',
    mood: ['Tate', 'Industrial', 'Contemporary', 'London'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('london-warehouse'),
      bg: 'custom-bg',
      lighting: 'Industrial Overhead',
      camera: 'Full Body (28mm)',
      cameraFormat: 'Canon R5 · 24mm',
      colorGrade: 'Industrial Cool',
      userPrompts: [
        'Tate Turbine Hall, major commission — the cavernous former turbine hall of Bankside Power Station: 35 metres tall, 155 metres long, the industrial ceiling visible above. A major commission installation fills the hall — monumental, scale-breaking, using the space as its medium. She stands in the hall, the installation around her at architectural scale, the original turbine gantries and brick walls above. The industrial light from the clerestory windows falls in long shafts.',
        'Tate Modern exterior, South Bank — the red brick mass of the former Giles Gilbert Scott power station on the South Bank, its single 99-metre chimney rising above. The Thames is beside it; the Millennium Bridge pedestrian span is visible in the distance. She stands on the riverside walkway, the building\'s immense brick wall behind her. The industrial aesthetic was never meant to be beautiful and is entirely so.',
        'Tate Tanks, lower level — the three massive circular oil tanks of the original power station, their curved concrete walls now exhibition spaces for performance and installation. She stands in one of the tanks, the curved concrete walls rising around her in a cylinder, the ceiling high and dark. The industrial origin is explicit: the walls have residue of the original use. The space is intimate in scale and monumental in atmosphere.',
        'Bankside at night — the Tate lit in warm amber floodlight, the Thames dark and moving beside it, the reflected light from the building shimmering in the current. St Paul\'s Cathedral dome visible through the Millennium Bridge cables across the water. She stands on the Embankment, the river between her and the south bank, the two great buildings facing each other across the water in a conversation of centuries.',
        'Switch House top terrace — the viewing level of the Blavatnik Building, Herzog & de Meuron\'s twisted brick addition, the 360-degree London panorama from 10 floors up: St Paul\'s, the City towers, the Shard, the Gherkin, the whole eastern London skyline. She stands at the terrace rail, the city visible in every direction, the river below. The wind up here is constant. The view is the most comprehensive in London.',
        'Tate Rothko room — the dedicated room of Mark Rothko\'s Seagram Murals, the large-scale colour field paintings on dark walls, the room designed to the paintings\' specific instruction. She stands in the center of the room, surrounded on three sides by the dark red and brown canvases. The lighting is low and warm; the paintings absorb it. The room has a specific meditative quality that affects every visitor. The large canvases are intended to be felt rather than seen.',
      ],
    },
  },

  {
    id: 'uffizi-florence',
    name: 'Uffizi',
    tagline: 'Birth of Venus. The Renaissance rooms. Florentine perfection.',
    category: 'fine-art',
    mood: ['Florence', 'Renaissance', 'Botticelli', 'Sublime'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('atelier-studio'),
      bg: 'custom-bg',
      lighting: 'Warm Gallery',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Leica SL2 · 35mm',
      colorGrade: 'Renaissance Warm',
      userPrompts: [
        'Uffizi Tribune — the octagonal Tribune room at the Uffizi, once considered the most important room in Europe: its red walls lined with the Medici portrait collection, the coffered ceiling, the floor inlaid with precious stone. She stands at the center, the paintings above her at every angle. The room is small and the density of masterwork around the walls is total. The warm red walls make the paintings glow. She is the one contemporary thing in a room of the 15th century.',
        'Uffizi Botticelli rooms — the two great Botticelli canvases face each other across the long gallery: the Primavera on one wall, the Birth of Venus on the other. She stands at the center of the room, both paintings simultaneously visible behind her. The room is wide enough to see both at distance and the light is the Uffizi morning light: diffuse, warm, northern. The most famous secular paintings of the Renaissance in the same air.',
        'Uffizi corridor at dusk — the long first-floor corridor of the Uffizi running along the Arno side, Roman busts and statues in the niches between the windows. The dusk light through the Arno-side windows is a warm amber that illuminates both the corridor and the river below. She walks the corridor toward camera, the Roman busts flanking her passage. The Arno is visible through the windows as an amber line below the darkening hills beyond.',
        'Vasari Corridor, Ponte Vecchio view — the secret corridor built by Cosimo I to move safely through the city, running through the Uffizi and across the Ponte Vecchio at upper-story level. She stands at one of the small oval windows in the Ponte Vecchio section, looking down through the glass at the bridge below, the Arno and the Florentine riverbanks visible. The corridor is narrow; the view through the window is everything.',
        'Piazzale Michelangelo at golden hour — the hilltop piazza above Florence with its bronze copy of David and the full Florentine panorama: the Duomo and its dome, the Palazzo Vecchio tower, the Arno\'s bends through the city, the hills beyond. She stands at the piazza railing, the entire city spread below in the late afternoon light. The city is terracotta and cream in this light; the Duomo dome is the same pink marble it has always been.',
        'Florence Baptistery, Gates of Paradise — the Ghiberti bronze doors on the east face of the Baptistery, the ten gilded biblical panels in relief, the most important bronzes of the early Renaissance. She stands directly before the gates, the golden panels level with her face, the warm afternoon light picking up every gilded surface. The Baptistery\'s marble stripes are behind her. The doors are 600 years old and the gold still reads.',
      ],
    },
  },

  {
    id: 'auction-house',
    name: 'Auction',
    tagline: 'Christie\'s. The evening sale. Where value is decided.',
    category: 'fine-art',
    mood: ['Auction', 'Christie\'s', 'Evening Sale', 'Power'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('auction-house'),
      bg: 'custom-bg',
      lighting: 'Gallery Spot',
      camera: 'Three-Quarter (50mm)',
      cameraFormat: 'Leica SL2 · 50mm',
      colorGrade: 'Warm Gallery',
      userPrompts: [
        'Christie\'s evening sale, front rows — the auction room during a major contemporary or Impressionist evening sale, the auctioneer at the podium, the lots lit on the display walls, the bidding paddles invisible in the tension. She sits in the first row in evening dress, completely composed while the room around her moves. The ceremony of value creation: the lot number called, the figure achieved. The works behind her are worth hundreds of millions.',
        'Pre-sale exhibition, Christie\'s — the five viewing days before the major sale when the works are displayed in the galleries. She stands close to a major canvas — a Basquiat or a Hockney — the painting large on the gallery wall beside her. Shot at the angle that shows both her face and the work simultaneously. The painting and the viewer in equal presence, neither subordinate. This is what private viewing looks like.',
        'Sotheby\'s New York, York Avenue — the evening before a major sale, the auction house facade lit, the works visible through the ground-floor windows from the street. She stands on the sidewalk outside, coat on, looking at the window display. The Upper East Side street behind her is dark. The works inside are lit theatrically. The institution is one of the most powerful in the art world and the building knows it.',
        'Private auction preview — the morning of the sale, the previewing rooms filled with collectors, dealers, and press examining the lots before the gavel. She stands before a major work in the preview gallery, one hand at her chin, studying the painting at close range. Around her, others are doing the same. The room is carpeted; the lighting is gallery-precise; the values at stake are enormous.',
        'Christie\'s consultation room — one of the quiet private rooms behind the viewing galleries, the consultation spaces where valuations, consignments, and private deals happen. She sits at the table, across from an invisible conversation. The room is simply furnished: table, chairs, track lighting on the wall where a work might be hung. The quiet rooms where the actual business of the auction world takes place.',
        'Auction catalog editorial treatment — a studio series that mimics the format of the great auction house catalogs: clean white backgrounds, the fashion treated like a lot to be examined with the same precision as the catalogued works. Each image has the authority and restraint of a Sotheby\'s lot photograph. The subject\'s posture is that of a work on display, aware of being assessed. Maximum authority, minimum noise.',
      ],
    },
  },

  {
    id: 'opera-house',
    name: 'Opera',
    tagline: 'Grand staircase. Red velvet. The ritual of high culture.',
    category: 'fine-art',
    mood: ['Opera', 'Grand', 'Red Velvet', 'Ceremony'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('opera-staircase'),
      bg: 'custom-bg',
      lighting: 'Chandelier Warm',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Leica M11 · 35mm',
      colorGrade: 'Warm Chandelier',
      userPrompts: [
        'Opéra Garnier grand staircase — the most celebrated staircase in the world: white marble steps, red velvet balustrades, gilded iron banisters, the Chagall ceiling visible through the chandelier above. She descends mid-stair, one hand lightly on the gold railing, in full evening dress, her pace unhurried. The staircase was designed specifically for the entrance and exit of the audience to be its own performance. She is performing it correctly.',
        'La Scala opera house, Milan — one of the world\'s great opera houses: the horseshoe of velvet-lined boxes in red and gold, the vast chandelier above the stalls, the stage dark. She stands at the front of a box, looking down at the stage below. The theater spreads in tiers around and behind her. The house is empty before the performance and the scale of it — the silence of an empty opera house — is its own atmosphere.',
        'Vienna Staatsoper, foyer — the imperial opera house\'s entrance foyer: white marble, red carpets, the crystal chandeliers warm above. She walks one of the curved foyer corridors during the interval, the crowd dispersed around her. The architecture is the Ringstrasse imperial style at its most accomplished: every surface considered, every proportion correct. The chandeliers make the marble glow.',
        'Bolshoi Theatre, Moscow — the great hall of the Bolshoi, the Russian imperial scale in red velvet and gold: five tiers of boxes around the horseshoe, the enormous chandelier at the center of the domed ceiling. She stands in a box at second tier level, looking at the stage below. The theater is empty before the performance; the scale is extraordinary. The Bolshoi\'s red and gold is the richest color in any opera house in the world.',
        'Royal Opera House, Covent Garden Floral Hall — the 19th-century cast iron and glass arcade structure now serves as the Royal Opera House foyer, its iron columns and vaulted glass roof lit in warm amber. She stands in the hall during the pre-show crowd, the iron and glass above, the audience in evening dress around her. The flowers on the bar level are white and oversized. The building is beautiful and knows it.',
        'Sydney Opera House concert hall — the interior of the largest of the shells: the pipe organ at 10,154 pipes visible behind the stage, the extraordinary acoustic ceiling in its geometric sections. She sits alone in the stalls before the audience arrives, the hall empty and enormous around her. The shell\'s interior acoustic design creates a visual beauty that matches the exterior. The organ is the largest mechanical musical instrument on the continent.',
      ],
    },
  },

  {
    id: 'museum-after-hours',
    name: 'After Hours',
    tagline: 'The museum at midnight. The art and no one else.',
    category: 'fine-art',
    mood: ['After Hours', 'Alone', 'Museum', 'Intimate'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('museum-afterhours'),
      bg: 'custom-bg',
      lighting: 'Emergency Night Lighting',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Sony A7R V · 35mm',
      colorGrade: 'Night Museum',
      userPrompts: [
        'Museum after closing, alone — the galleries at night, each painting lit by its individual spot, the corridors between galleries in darkness. She stands alone in a gallery of 17th-century paintings, the works surrounding her, not another human in the building. The intimacy of being alone with masterpieces is what this image is about: the private relationship that crowds make impossible. The spot on each painting is a small warm sun; the rest is shadow.',
        'Night security round — she moves through the darkened galleries with a small torch, the beam illuminating one painting at a time: a face, a landscape, a hand. The rest of the painting falls back into shadow. Shot following the beam, each illuminated section a fragment of the complete work. The museum at night is a different place: the works are still present but the context around them has changed entirely.',
        'Museum atrium, moonlight — a museum with a glass-roofed atrium, the moon visible through the glass panels above, the sculptures in the faint lunar light below. No artificial lighting. The sculptures are visible as shapes and shadows in the moonlight. She moves through the space, her figure catching more light than the stone figures around her, her warmth the anomaly in the cold classical space.',
        'Museum corridor at midnight — the long corridor between gallery wings, the emergency exit signs casting faint green light at intervals, the doors to the collection rooms closed on either side. She walks the corridor with no light source except the exit signs. The green cast makes everything cool and institutional. The paintings behind the doors are waiting. The corridor between masterpieces is its own space.',
        'Alone with a masterpiece — she stands directly before the most important work in the collection — a Velázquez, a Caravaggio — in complete darkness except for the painting\'s spot. The painting fills the upper background of the frame, the spot catching her face and the canvas simultaneously. The intimacy of the distance between her face and the painted face is the composition. Two presences in darkness.',
        'Museum at dawn, first light — before the guards arrive, before the first visitors, the first morning light through the museum skylights falls on paintings that have not seen natural light since yesterday\'s closing. She stands in a gallery as the light begins, the paintings emerging from the night-level electric to the daylight that is their true context. The moment of the museum coming back to itself.',
      ],
    },
  },

  // ── LIFESTYLE ────────────────────────────────────────────────────────────────

  {
    id: 'dubai-rooftop',
    name: 'Dubai Rooftop',
    tagline: 'Infinity pool. City of gold below. The top of the world.',
    category: 'lifestyle',
    mood: ['Dubai', 'Rooftop', 'Infinity Pool', 'Night'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('dubai-deck'),
      bg: 'custom-bg',
      lighting: 'Night City Glow',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Sony A1 · 35mm',
      colorGrade: 'Night Warm',
      userPrompts: [
        'Dubai infinity pool at night, Address Downtown — the rooftop infinity pool edge appears to dissolve into the city of lights below, the Burj Khalifa dominant and fully lit at 828 metres. She stands at the pool rim, the city spread below in every direction, the pool water lit from below casting a blue-white uplight. The distance between the pool edge and the street is 63 floors. The reflection of the Burj in the pool water is longer than the building itself.',
        'Burj Al Arab terrace — from a Jumeirah Beach hotel terrace, the sail-shaped Burj Al Arab visible on its artificial island across the blue Gulf. She stands at the terrace rail, the building framing her from behind and to the side. The late afternoon light on the white fibreglass sail facade changes it from white to warm gold. The Gulf water is a flat, deep turquoise below. The building was designed to represent the wealth of the entire emirate.',
        'Downtown Dubai rooftop, daytime — above the concentration of skyscrapers of Downtown Dubai, the Burj Khalifa rising above everything else by several hundred metres. She reclines on a daybed at the pool\'s edge, the skyline her wallpaper, the Burj visible above the pool frame behind her. The midday sun is direct and strong; the pool cools the air. The density of glass and steel in this small area of desert is unlike anywhere else.',
        'Atlantis Palm terrace — from the Atlantis Hotel roof, the Palm Jumeirah spreads below in its distinctive palm-tree shape: the trunk, the fronds, the crescent enclosing it, the Gulf on all sides. She stands at the terrace parapet, looking out at the artificial island below. The geometry of the Palm is only visible from altitude; from here it is a pattern of white buildings and dark water canals. The construction of ambition.',
        'Jumeirah Beach at dawn, empty — the wide beach completely empty at 6am, the Gulf flat and golden in the pre-sunrise light, the towers of Jumeirah Beach Residence visible behind. She walks the water\'s edge barefoot, her footprints the first in the sand, the Gulf water lapping gently. The light is the specific gold of the Arabian Gulf at first light: warm, hazy, the temperature already rising. The towers are reflections in the flat water.',
        'JBR waterfront walk, evening — the outdoor promenade of Jumeirah Beach Residence at sunset, the restaurants opening their terraces, the towers lit warm above. She walks the promenade, the Gulf to her right, the towers and their lit facades to her left, the sea breeze constant. The JBR crowd is the most international on earth: every nationality, every style. The evening air is warm and the light on the Gulf is copper.',
      ],
    },
  },

  {
    id: 'lake-como',
    name: 'Lake Como',
    tagline: 'Bellagio. The lake. The life that requires nothing to be justified.',
    category: 'lifestyle',
    mood: ['Lake Como', 'Italian', 'Old Money', 'Slow'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('villa-pool'),
      bg: 'custom-bg',
      lighting: 'Soft Italian Afternoon',
      camera: 'Full Body (50mm)',
      cameraFormat: 'Leica Q3 · 50mm',
      colorGrade: 'Kodak Portra 400',
      userPrompts: [
        'Villa Carlotta terrace, Lake Como — the terraced gardens descend from the villa to the lake shore, the opposite bank\'s mountains reflected in the still water below. She sits on one of the stone garden benches, the lake visible through the garden palms and camellias behind her, the afternoon light flat and golden on the water. The villa gardens are the accumulated botanical judgment of 300 years. Old money at its most beautiful and entirely undefended.',
        'Lake Como steam ferry — the historic wooden-hulled ferry service crossing between Bellagio, Varenna, and Cadenabbia, the diesel engines and the old timber hull creating the specific atmosphere of the lake\'s transport. She stands at the bow rail, the lake behind her, the village of Varenna approaching from the right with its pastel facades stacked up the hillside. The mountains above the opposite shore are reflected in the still water ahead.',
        'Bellagio promontory — the narrow headland where the lake divides into two equal arms, the view up both branches to the Alps in the north. She stands at the very point, the lake on both sides simultaneously, the mountains visible ahead in both directions. The gardens of Villa Serbelloni are above; the water is very close on both sides. The promontory is the most perfect viewpoint on the most beautiful lake in Italy.',
        'Villa d\'Este floating pool, Lake Como — the legendary hotel\'s famous floating pool, moored in the lake beside the terraced gardens, the hotel facade and the gardens above it. She sits at the pool\'s edge, feet in the water, the gardens rising behind her in tiers. The water of the pool and the water of the lake are the same temperature and the same grey-green. The hotel has been here since the 16th century and has made no apologies.',
        'Lake Como at sunset — the water turning from grey-green to copper as the sun touches the mountains to the west, the shadows of the peaks moving down the opposite shore. She sits on a restaurant terrace that overhangs the lake, the water at the table level, the mountains darkening behind. The specific Como light at this hour: warm, low, making the lake surface its own light source.',
        'Lake Como morning mist — the lake under morning fog, the mountains invisible above the cloud line, just the familiar shoreline and the still water and the mist in the valleys. She stands at the lakeside promenade, the mist at her back, the café lights warm behind her. The lake in fog is entirely grey: the water and the sky the same value. The mountains will return in an hour.',
      ],
    },
  },

  {
    id: 'st-barths',
    name: 'St. Barths',
    tagline: 'Gustavia. Shell Beach. French island perfection.',
    category: 'lifestyle',
    mood: ['St. Barths', 'Caribbean', 'French', 'Luxury'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('maldives-deck'),
      bg: 'custom-bg',
      lighting: 'Caribbean Bright',
      camera: 'Full Body (50mm)',
      cameraFormat: 'Sony A1 · 50mm',
      colorGrade: 'Caribbean Warm',
      userPrompts: [
        'Shell Beach, Gustavia — the unique beach on the harbor side of Gustavia, its shore composed entirely of small shells rather than sand, the water behind it the specific pale turquoise of protected Caribbean shallows. She sits on the shell surface, legs extended, the harbour mouth and its anchored sailboats visible in the distance. The shells catch the light differently than sand: cooler, more textured, pearl-like. The water color is almost impossible to render accurately.',
        'Gustavia harbour — the horseshoe harbour lined with superyachts and traditional Caribbean wooden boats, the French West Indian townhouses in pastel yellow and white along the quai. She walks the quai in the morning, the yachts reflected in the harbour water, the volcanic hills rising behind the town. The sky above St. Barths is a specific deep Caribbean blue. The harbour smells of diesel and salt and jasmine.',
        'St. Barths hillside villa terrace — the villa terraces of St. Barths\' interior hills, the views down to the bays below: St. Jean to the north, Saline to the south, the ocean in every direction. She sits on the terrace in the late afternoon, the island spread below, the trade winds constant. The vegetation is the French Caribbean mix: hibiscus, frangipani, sea grape, the hills vibrantly green above the pale sand bays.',
        'Saline beach, morning — the most beautiful beach on the island: reached over the salt pond hill, entirely undeveloped, the Atlantic side. At 8am it is empty. She walks the waterline, the Atlantic behind her, the salt pond and volcanic hills ahead. The sand here is white and fine; the water transitions from pale aquamarine to deep Atlantic blue. The beach is perfect and knows it.',
        'St. Barths sunrise over the hills — the first light coming over the volcanic peaks of the island\'s interior, the protected bays catching the first color before the hilltops. She stands at a high point, the bays below still in shadow, the sky above her turning pink and gold. The trade winds are in her hair. The light is the specific Caribbean dawn: fast, dramatic, warm.',
        'St. Barths reef, clear water — in the clear Caribbean water off Colombier or Corossol, the coral reef visible two metres below the surface, the fish moving through it. She stands chest-deep, looking down through the water at the reef below, the light refracting in moving patterns on the sandy bottom between the coral heads. The water is warm and completely transparent.',
      ],
    },
  },

  {
    id: 'aspen-snow',
    name: 'Aspen Winter',
    tagline: 'Fresh powder. Mountain town. The winter that requires money.',
    category: 'lifestyle',
    mood: ['Aspen', 'Snow', 'Mountain', 'Winter Luxury'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('swiss-chalet'),
      bg: 'custom-bg',
      lighting: 'Bright Snow',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Leica SL2 · 35mm',
      colorGrade: 'Bright Snow',
      userPrompts: [
        'Aspen Mountain, fresh powder — the ski runs deep in fresh overnight snow, the sky the deep blue that only exists at altitude, the mountain town miniature below on the valley floor. She stands at a mid-mountain vantage point, the fresh powder field untracked behind her, the Elk Mountains in every direction above the treeline. The morning snow light is brilliant and directionless — every surface equally lit, no shadows. The powder is at her knees.',
        'Aspen downtown Cooper Avenue — the main pedestrian street of town, the Victorian brick facades decorated for winter, the mountains visible at the end of every street cross. She walks the street in ski wear, a coffee in hand, the other Aspen visitors around her. The mountain light comes down the street in an afternoon shaft. The town is precisely the scale it should be: small enough to know, large enough to be interesting.',
        'Mountain lodge après-ski fireplace — the great stone fireplace of a mountain lodge, floor-to-ceiling river rock, a fire burning, the fresh snow visible through the windows behind. She sits in one of the chairs by the fire, ski boots off, the day\'s mountain visible through the glass. The firelight is warm and directional, catching the left side of her face, the rest in warm shadow. The specific luxury of warmth after cold.',
        'Aspen chalet exterior, morning — fresh snow on the dark wood chalet roof, the pine trees weighted with overnight snow, the mountain visible above the treeline. She stands on the front porch, steam from a coffee mug visible in the cold air. The morning light on the snow is the flat bright white of Colorado winter mornings: shadowless, brilliant, the snow a light source itself.',
        'Aspen outdoor hot tub in snow — the outdoor hot tub of a mountain property, every surface around it covered in snow, the steam rising in the cold air. She is in the hot tub, arms on the edge, the snow at face level around her, the mountains visible above. The contrast of the warm water and the cold air is physically palpable in the image. The steam makes her face barely visible.',
        'Aspen at night, snowfall — the town at night during a light snowfall, the Christmas lights and Victorian street lamps creating warm pools in the white. She stands on Cooper Street, the snow falling softly around her, the town lights warm and close, the mountain dark above the buildings. The snowflakes are visible mid-fall in the lamp light. The night is quiet and the snow absorbs all sound.',
      ],
    },
  },

  {
    id: 'hamptons',
    name: 'The Hamptons',
    tagline: 'Shingled estate. Privet hedge. East End summer forever.',
    category: 'lifestyle',
    mood: ['Hamptons', 'Summer', 'Privet', 'Atlantic'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('bh-pool-house'),
      bg: 'custom-bg',
      lighting: 'Summer Afternoon',
      camera: 'Full Body (50mm)',
      cameraFormat: 'Leica Q3 · 50mm',
      colorGrade: 'Kodak Portra 400',
      userPrompts: [
        'Hamptons shingled estate — the classic Hamptons architecture: white cedar shingles weathered to silver-grey, hydrangea borders at full bloom in blue and white, a gravel drive, a wide porch with rocking chairs. She stands on the porch steps, the afternoon Atlantic breeze moving through the hydrangeas, the light warm and specific to a Long Island August afternoon. This is precisely what summer wealth looks like in America, and it looks exactly the same as it did in 1975.',
        'Sagaponack farm stand, August — the Hamptons farm stands at peak summer: vine tomatoes in every color, white corn, sunflowers in galvanized buckets, zucchini in every size. She sits on the tailgate of the farm stand truck, the summer produce arranged casually behind her, the flat potato field visible across the road. The light is the direct August summer light of the East End: warm, abundant, the colors of the produce vivid and honest.',
        'East Hampton Main Beach, morning — the Atlantic beach before 9am, the parking lot filling but the beach still manageable, the lifeguard stand empty. She walks the waterline, the Atlantic to her left, the dunes behind to her right. The morning light comes from the northeast at a low angle, the wet sand reflecting it in a long shine. This is the democratic luxury of the East End — the same ocean for everyone, arriving in different vehicles.',
        'Dune Road, Westhampton — the narrow barrier strip with the Atlantic on one side and Moriches Bay on the other, the Dune Road shingle houses set back from both beaches. She stands on the bay side at the dock, the flat bay water behind her and the dunes visible over her shoulder. The light over the bay is the flat, white light of the South Shore: bright, directionless, the water silver.',
        'Hamptons pool at dusk — the backyard pool of a Georgica Pond property, the mature privet hedge enclosing it in green walls, the first stars beginning in the deep blue sky above. She floats on a pool float, arms extended, the sky deepening above her, the hedge walls keeping the world out. The pool is lit from below; the surrounding privet is in shadow. The specific luxury of a Hamptons summer evening.',
        'Sag Harbor, morning — the historic whaling village\'s Main Street at 8am, the 19th-century storefronts still quiet, the harbor visible at the end of the street with its wooden sailboats at anchor. She walks Main Street toward the harbor, the old buildings on both sides, the light coming down the street from the east. The village looks exactly as it did in 1840, which is the entire point.',
      ],
    },
  },

  {
    id: 'napa-wine',
    name: 'Napa Valley',
    tagline: 'Vine rows. Wine country afternoon. California pastoral luxury.',
    category: 'lifestyle',
    mood: ['Napa', 'Wine', 'California', 'Agricultural Luxury'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('tuscany-dawn'),
      bg: 'custom-bg',
      lighting: 'Golden Afternoon',
      camera: 'Full Body (50mm)',
      cameraFormat: 'Canon R5 · 50mm',
      colorGrade: 'Warm Natural',
      userPrompts: [
        'Napa vineyard row, late afternoon — the Cabernet Sauvignon vine rows of late September, the leaves turning amber at the edges, the grapes dark and heavy on the canes. She walks between the rows toward the lens, the vines brushing both sides, the Mayacamas Mountains visible at the end of the row. The California late-afternoon light is warm and specific: lower in angle than midday but still strong, making the vine leaves translucent gold.',
        'Opus One-style winery terrace — a great Napa winery in the Mondavi-Rothschild tradition, its terrace cantilevered above the vineyard rows looking down the valley. She sits at a table with a glass of Napa Cabernet, the vineyard below stepping down to the valley floor, the mountains behind hazy in the afternoon. The winery architecture is part of the wine: monumental, deliberate, California-modern.',
        'Calistoga resort pool, vineyards behind — the northernmost spa town of the Napa Valley, its geothermal mineral pool fed by the volcanic springs below. She sits at the pool edge of a resort property, the vine rows visible through the fence behind, the Palisades Mountains above. The pool water has a specific mineral quality to its color. The heat and the vines and the mountains are the Calistoga proposition.',
        'Napa barrel cave — the tunnel cave cut into the volcanic tuff hillside of a major winery, the French oak barrels stacked in their racks for a kilometre or more into the hill. She stands in the cave tunnel, the barrels receding to a vanishing point behind her, the arched stone ceiling above. The cool cave air and the warm oak smell of maturing wine. The light is the warm amber of the few cave lamps.',
        'Napa harvest morning — the picking season at first light, the harvest bins half-full of Cabernet grapes, the pickers visible at the far end of the rows. She stands at the bin, a cluster of dark grapes in her hand, the vines around her heavy with the harvest. The morning light is soft and slightly cool; the grapes are covered in a natural yeast bloom that catches the light. The valley is cold at 6am even in September.',
        'Yountville at dusk — the small wine-country village with its extraordinary restaurant density: the French Laundry, Bouchon, Bottega. She walks the main street as the evening light turns amber, the restaurant lights coming on, the valley visible at the end of every cross street. The village is small and entirely deliberate about what it is. The evening light on the historic inn facades is the best light in California.',
      ],
    },
  },

  {
    id: 'mykonos-infinity',
    name: 'Mykonos',
    tagline: 'Cycladic white. Aegean blue. The summer of myth.',
    category: 'lifestyle',
    mood: ['Mykonos', 'Cycladic', 'Aegean', 'Summer'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('santorini-edge'),
      bg: 'custom-bg',
      lighting: 'Greek Island Sun',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Leica Q3 · 35mm',
      colorGrade: 'Mediterranean Bright',
      userPrompts: [
        'Mykonos Little Venice, golden hour — the buildings of Little Venice extend directly over the Aegean, their foundations washed by the water, the colored wooden balconies overhanging the sea. She sits on a terrace table directly over the water, the Aegean below and behind her, the row of Cycladic buildings extending to the left, the windmills on the hill visible above. The golden hour light on the water and the facades is the most beautiful in the Aegean.',
        'Mykonos windmills at sunset — the row of seven 16th-century Venetian windmills on the Kato Myli hill above the harbour, their white cylindrical towers and conical thatched caps against a sky turning orange and violet. She stands before one windmill, the others receding behind, the Aegean and the harbour visible below. The sunset behind the windmills is the most reproduced image in Greece and entirely earns its reputation.',
        'Mykonos clifftop infinity pool — a resort property built into the Cycladic cliff, the pool extending to an invisible edge that meets the sea horizon. She stands at the pool rim, the Aegean stretching to Turkey in the east. The pool and the sea are the same blue. The light is the brilliant Greek island noon: no shadows, every surface its truest color, the water almost overwhelming.',
        'Mykonos Chora labyrinth — the famous maze of narrow whitewashed lanes, the paths twisting to prevent the north wind, the blue-painted steps, the bougainvillea spilling over walls. She walks one of the narrower lanes, her shoulder brushing the white wall, the Cycladic blue above, the lane opening and closing around corners. The white walls amplify the light. A pelican is visible in the background, indifferent.',
        'Psarou Beach, Mykonos — the most fashionable beach in the Aegean, the white canvas sunbeds under matching umbrellas aligned to the turquoise water, the fashion crowd in full presentation. She stands at the water\'s edge, the beach behind her, the Aegean turquoise at her feet. The midday light is the brilliant Aegean noon: everything sharp, every color correct, the water a saturated blue that earns every cliché about the Mediterranean.',
        'Mykonos Chora at dusk — the town as the evening light transitions, the bars and restaurants lighting their facades, the magical Mykonian blue-hour arriving. She stands at the edge of a small plateia, the white cube buildings glowing amber from the interior lights, the sky above a deep Mediterranean blue. The town\'s specific energy arrives at dusk: unhurried, warm, entirely present.',
      ],
    },
  },

  {
    id: 'miami-penthouse',
    name: 'Miami Penthouse',
    tagline: 'Brickell sky. Biscayne Bay below. Urban tropical luxury.',
    category: 'lifestyle',
    mood: ['Miami', 'Penthouse', 'Bay', 'Tropical Modern'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('nyc-penthouse'),
      bg: 'custom-bg',
      lighting: 'Tropical Evening',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Sony A1 · 35mm',
      colorGrade: 'Tropical Warm',
      userPrompts: [
        'Brickell penthouse, floor 55 — floor-to-ceiling glass on two sides: Biscayne Bay in one direction stretching south to the bay islands, the Brickell financial district towers in the other. She stands at the glass, both hands lightly touching the window, looking out at the bay spread below. The sun is moving toward the Everglades in the west, its light warm on the bay water. The apartment interior is minimal: stone floor, no furniture in this frame. The view is the furniture.',
        'Coconut Grove waterfront morning — the oldest neighborhood in Miami, its live oak canopy dark and cool above the streets, the Dinner Key Marina sailboats at anchor in the cove. She walks the bayfront walkway, the marina to her left, the old Florida bungalows visible through the trees to her right. The Coconut Grove light is filtered and green, different from the open-sky Miami of Brickell. The neighborhood is itself.',
        'Wynwood rooftop, murals below — above the street art district, looking down at the block-scale murals that cover every facade below. She stands at the rooftop edge of a Wynwood warehouse, the murals visible as a color mosaic below, the Miami sky above. The scale of the art is only comprehensible from above. The rooftop light is the flat tropical noon; the murals below it are their own light source.',
        'South Beach terrace, Art Deco district — a terrace level above Ocean Drive in the Art Deco district, the Atlantic visible beyond the beach behind her, the Deco hotel facades stretching south in their pastel stucco. She leans on the terrace railing, the warm Miami morning light on the buildings below. The shadows are short and the color palette is the Deco South Beach one: seafoam, coral, turquoise, cream.',
        'Miami Design District rooftop — above the luxury shopping district, its architectural boutiques and public sculpture visible below, the palm trees in the street-level plazas. She stands at the rooftop edge, the Design District below, the bay visible beyond Edgewater to the east. The midday tropical light is direct and warm; the design buildings below are a specific vocabulary of contemporary luxury.',
        'Biscayne Bay at sunset — on a boat in the bay, the Miami skyline to the west in full silhouette against the orange and pink sky, the bay water reflecting it all. She stands at the bow rail, the bay water spreading behind, the skyline behind that. The specific Miami sunset on the bay is extraordinary: the glass towers go from mirrored to silhouette in twenty minutes, the bay a changing copper below.',
      ],
    },
  },

  {
    id: 'swiss-chalet-life',
    name: 'Swiss Chalet',
    tagline: 'Dark wood. White mountains. The most expensive simplicity.',
    category: 'lifestyle',
    mood: ['Swiss', 'Chalet', 'Mountain', 'Slow'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('swiss-chalet'),
      bg: 'custom-bg',
      lighting: 'Alpine Morning',
      camera: 'Full Body (50mm)',
      cameraFormat: 'Leica Q3 · 50mm',
      colorGrade: 'Warm Alpine',
      userPrompts: [
        'Swiss chalet breakfast, morning — the dark old wood interior of an Engadin or Graubünden chalet, the geranium-filled window boxes visible through the small-paned glass, the mountain peak visible beyond. She sits at the wooden table, a coffee cup in both hands, the steam visible, the mountains behind her through the glass. The interior is warm amber from the wood and the table lamp; the view through the window is cold and brilliant. The extraordinary ordinariness of Swiss mountain life.',
        'Chalet balcony, dawn alpenglow — the mountains above still in the last dark of pre-dawn as the first alpenglow touches the highest peaks in pink. The chalet below is still in shadow. She stands on the wooden balcony, elbows on the rail, looking up at the mountains turning from grey to pink to white. The air is cold enough to see breath. The alpenglow lasts fifteen minutes and is unlike any other mountain light.',
        'Chalet Kachelofen, evening — the large tiled Swiss fireplace (Kachelofen) in the corner of the main room, the ceramic tiles warm to the touch, the fire visible through the iron door. Wood stacked in the alcove beside it. She sits on the bench attached to the stove, feet tucked beneath her, a book open. The chalet interior is dark and warm; the only light is the fire glow and one lamp. The mountains outside are dark.',
        'Alpine fondue table — the Swiss fondue set up at the wooden table: the cast iron caquelon, the cube bread, the Fendant wine, the long forks. She sits at the table, the fondue pot between her and the other side of the table, the chalet window showing the dark evening mountain behind. The ritual of communal Swiss eating. The cheese in the pot is Gruyère and Vacherin Fribourgeois and it smells of everything correct.',
        'Zermatt village, Matterhorn at end of street — the car-free village of Zermatt, the horse-drawn sleds and electric taxis the only vehicles, the main street leading directly to the unobstructed Matterhorn view at its end. She walks the main street toward the mountain, the shops and hotels on either side, the pyramid peak at the end of the street directly ahead. The Matterhorn is visible at the end of every street in the village and it never becomes ordinary.',
        'Chalet private spa, mountain view — the sauna and treatment room of a luxury chalet property, its glass wall or large window looking directly out at the mountain face. She sits in the sauna interior, the mountain visible through the glass beside her. The cedar interior is warm; the mountain outside is cold white. The cold plunge pool is visible behind. The private spa with the mountain view is the specific luxury of the Swiss chalet proposition.',
      ],
    },
  },

  {
    id: 'tuscany-villa',
    name: 'Tuscany Villa',
    tagline: 'Stone villa. Olive grove. The Italian life that is a work of art.',
    category: 'lifestyle',
    mood: ['Tuscany', 'Villa', 'Stone', 'Harvest'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('tuscany-dawn'),
      bg: 'custom-bg',
      lighting: 'Golden Italian',
      camera: 'Full Body (50mm)',
      cameraFormat: 'Leica SL2 · 50mm',
      colorGrade: 'Kodak Portra 400',
      userPrompts: [
        'Tuscan stone farmhouse loggia, afternoon — the stone loggia of a Val d\'Orcia farmhouse, its arched opening looking out over the olive grove and the rolling valley beyond, the cypress trees on the near hill. She sits in one of the wooden chairs, a glass of local Brunello on the table beside her, the afternoon light long and warm on the stone floor. The olive grove is silver-green in the late light. This is the life that everyone imagines and some people have.',
        'Tuscan villa pool — a stone-edged pool surrounded by rows of lavender, the farmhouse visible beyond the lavender, the rolling olive-covered hills beyond that. She floats on her back in the pool, arms extended, the Italian sky above her — the deep Tuscan blue that appears only inland and only in summer. The lavender smells are heavy in the warm air. The cicadas are constant.',
        'Tuscan olive grove, October — the ancient olive trees of an old Tuscan property, their trunks twisted over centuries into forms that are both botanical and sculptural, the silver-green leaves moving in the light. Harvest nets lie on the ground below. She stands in the grove, one hand on a trunk, the light through the canopy dappled. The olive grove has a specific quality of light: silver and warm simultaneously.',
        'Cortona hilltop at golden hour — the ancient Etruscan hilltop town\'s southern wall, the panorama of the Val di Chiana spreading below, Lake Trasimeno visible as a silver plate in the haze. She stands at the town wall, looking out over the valley, the light the long warm gold of the Tuscan late afternoon. The stone wall beneath her hands is warm from a day of sun. The valley is the colour of old paint.',
        'Tuscan farmhouse kitchen, evening — the kitchen of an old masseria: stone fireplace with its copper pots on the hooks, the long wooden table set for dinner, the evening light coming through the small window. She sits at the end of the table, elbows on wood, the kitchen arranged around her. The fireplace is lit; the room smells of wood smoke and rosemary. The stone floor and thick walls hold the cool of centuries.',
        'Cypress road approach — the classic Tuscan arrival: a long straight gravel road lined with tall Italian cypress trees leading to the farmhouse on the hill. She walks the road away from the lens, the cypress columns flanking her, the farmhouse visible at the end of the tree corridor. The afternoon light comes through the cypress at a low angle, casting long shadows across the white gravel. The composition is as deliberate as the road itself.',
      ],
    },
  },

  // ── CINEMATIC ────────────────────────────────────────────────────────────────

  {
    id: 'film-noir',
    name: 'Film Noir',
    tagline: 'Rain-wet street. Venetian blind shadows. The hardboiled beautiful.',
    category: 'cinematic',
    mood: ['Noir', 'Rain', 'Shadow', 'Mystery'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('london-mews'),
      bg: 'custom-bg',
      lighting: 'Single Street Lamp',
      camera: 'Three-Quarter (50mm)',
      cameraFormat: 'Leica M11 · 50mm',
      colorGrade: 'High Contrast B&W',
      userPrompts: [
        'Film noir street scene — black and white, rain-wet street, a single street lamp illuminating a pool of light. She stands at the edge of the light, half in shadow, a cigarette (or just the attitude). The shadows are deep black, the lit areas pure white. The visual language of every noir film ever made, made new.',
        'Venetian blind shadows — the iconic shadow pattern of venetian blinds projected across her face and the wall behind her. Shot in black and white. The shadows stripe across her, the light a warm amber source from outside.',
        'Noir window — she stands at a rain-streaked window, looking out at the wet city below. Back lit from outside, her figure in silhouette, the rain on the glass in pattern.',
        'Noir staircase — a spiral fire escape or interior stair, shot from below looking up, or from above looking down. The geometry of noir spaces.',
        'Noir car interior — sitting in a parked car on a dark street, the rain on the windows, the city lights diffused through the water on the glass. Interior light only from a small source.',
        'Noir alley — a narrow alley between tall buildings, a shaft of light from above, steam from a grate. She stands in the shaft of light, the darkness around her absolute.',
      ],
    },
  },

  {
    id: 'sci-fi-future',
    name: 'Sci-Fi Future',
    tagline: 'Neon city. Blade Runner rain. Fashion from the next century.',
    category: 'cinematic',
    mood: ['Sci-Fi', 'Neon', 'Future', 'Blade Runner'],
    config: {
      photoDirection: 'AVANT_GARDE_COUTURE',
      locationPreset: loc('berlin-neon'),
      bg: 'custom-bg',
      lighting: 'Neon Mixed',
      camera: 'Full Body (28mm)',
      cameraFormat: 'Sony A7R V · 24mm',
      colorGrade: 'Neon Saturated',
      userPrompts: [
        'Blade Runner future city — a neon-drenched night scene, the visual language of neo-noir science fiction: multiple overlapping neon sign colors (magenta, cyan, amber), rain on every surface, steam from underground vents, the city of ten million people visible in the background. She stands in the foreground, her fashion from a century ahead of us.',
        'Future interior — a highly designed futuristic interior: curved white surfaces, accent lighting, holographic elements implied. Clean, high-tech, sterile, and beautiful.',
        'Future landscape — somewhere that looks like another planet: volcanic Iceland, or a processed industrial landscape made to look alien. She stands in the alien landscape, the fashion more alien than the environment.',
        'Future transportation — a high-speed train or maglev station, the engineering beautiful and extreme. She waits on the platform, the train a blur of motion behind.',
        'Future city above the clouds — a high vantage point where clouds are below, the city towers rising through them. She stands at the peak, above the weather.',
        'Future fashion portrait — tight on the face and upper body, the fashion architectural and futuristic. The background minimal and the color grade pushed into science fiction territory.',
      ],
    },
  },

  {
    id: 'gothic-cathedral',
    name: 'Gothic',
    tagline: 'Cathedral stone. Stained glass. The medieval darkness that is beautiful.',
    category: 'cinematic',
    mood: ['Gothic', 'Cathedral', 'Dark', 'Spiritual'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('autumn-cathedral'),
      bg: 'custom-bg',
      lighting: 'Stained Glass Color',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Leica SL2 · 35mm',
      colorGrade: 'Gothic Dark',
      userPrompts: [
        'Gothic cathedral interior — the nave of a great medieval cathedral, the stone columns rising to pointed arches above, the stained glass windows casting pools of colored light on the stone floor. She stands in a pool of stained glass color, the rest of the cathedral in deep shadow around her.',
        'Cathedral exterior at dusk — the flying buttresses of a great Gothic cathedral, the carved gargoyles at the corners, the full west facade in the last blue-hour light, the towers silhouetted against a sky still luminous at the horizon. She stands in the cathedral close, one of the buttress piers close behind her, the darkening sky behind the tower pinnacles. The stone reads almost black against the residual sky light. A single lamp illuminates the close below.',
        'Cathedral crypt, candlelight — the Norman crypt below the nave, the low rounded stone arches, the columns thick and ancient, the candles in their iron holders casting warm points of light in the cool dark. She stands between two columns, the candlelight from one side making half her face visible and half shadow. The ceiling is close above. The crypt predates the nave above it by 300 years. The silence is specific.',
        'Cathedral choir stalls and organ — the carved wooden choirstalls of a great English cathedral, the misericords and canopied seats, the great pipe organ case visible above at the choir arch. She stands in the choir, one hand on the carved wood of a stall, looking toward the organ. The choir light is the specific cathedral interior quality: filtered through clerestory glass, cool and diffuse, making the carved wood warm against the stone.',
        'Cathedral rose window, looking up — shot from directly below a great rose window, looking straight up at the colored glass geometry. The pattern of tracery and glass in rose, blue, and amber fills the entire frame above. She stands in the light that descends from the window, the color falling on her face in a complex stained-glass pattern. The light is directional and colored; she is in it rather than beside it.',
        'Gothic cathedral at night, exterior — the cathedral floodlit from below, the flying buttresses casting dramatic shadows upward, the full stone complexity of the Gothic exterior visible in the warm artificial light. She stands at the foot of one buttress, the lit stonework rising above her. The sky behind the towers is a deep blue-black. The contrast between the warm amber of the lit stone and the night sky defines the Gothic exterior after dark.',
      ],
    },
  },

  {
    id: 'western-dust',
    name: 'Western Dust',
    tagline: 'Desert highway. Golden hour. The American frontier.',
    category: 'cinematic',
    mood: ['Western', 'Desert', 'Highway', 'Cinematic'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('highway-dawn'),
      bg: 'custom-bg',
      lighting: 'Desert Golden Hour',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Canon R5 · 35mm',
      colorGrade: 'Western Warm',
      userPrompts: [
        'Desert highway golden hour — the straight American highway vanishing to a heat-shimmer point on the horizon, the desert on either side. She stands in the road, the highway behind her, the golden hour light on her face. This is cinematic America at its most iconic.',
        'Monument Valley mesa — the red sandstone buttes of Monument Valley at the Arizona-Utah border, the flat desert floor stretching to the horizon, the clouds above enormous in the wide sky. She stands at the mesa edge, the valley floor dropping away below, the two mittens visible in the distance. Shot at golden hour from slightly below, her figure against the mesa sky. The red rock is the color of old iron and the sky above it is an impossible blue.',
        'Southwest ghost town, main street — an abandoned high desert town somewhere between Tucson and Albuquerque: wooden storefronts weathered silver-grey, the false fronts still standing, the interiors visible through the broken windows. She walks the main street, the only person in the silence. The afternoon sun is direct and unforgiving; the shadows short and absolute. The town was full of people seventy years ago and now it belongs to the wind.',
        'Route 66 desert motel — a classic motor court motel on Route 66, the neon sign visible in daylight (unlit, waiting for dark), the individual units behind a low wall, the desert stretching away behind. She stands at the door of unit 7, key in hand, looking directly at the lens. The concrete apron, the metal door, the neon lettering of the sign: the vernacular of American road travel at its most honest.',
        'Abandoned desert drive-in — the white screen of an abandoned drive-in theatre weathered to cream, the speaker posts still in their rows in the desert brush in front. She stands at the speaker post row, the screen behind and above her. Shot at the wide angle that shows both the screen and the rows of empty posts extending forward. The nostalgia of the space between what it was and what it is now is the entire image.',
        'Desert sunset silhouette — she stands on a slight rise above the desert floor as the sun touches the western horizon, her silhouette a clean dark shape against the most dramatic American sky: the bands moving from deep amber at the horizon through orange, pink, and violet to near-indigo at the top of the frame. The desert floor is dark below, the sky is performing above. The silhouette is all that is needed.',
      ],
    },
  },

  {
    id: 'surreal-dream',
    name: 'Surreal Dream',
    tagline: 'Dalí logic. Dream architecture. Fashion beyond reality.',
    category: 'cinematic',
    mood: ['Surreal', 'Dream', 'Dalí', 'Logic-free'],
    config: {
      photoDirection: 'AVANT_GARDE_COUTURE',
      locationPreset: null,
      bg: 'custom-bg',
      lighting: 'Dream Diffuse',
      camera: 'Full Body (50mm)',
      cameraFormat: 'Phase One · 80mm',
      colorGrade: 'Surreal Warm',
      userPrompts: [
        'Surrealist landscape — a dreamscape that follows Dalí or Magritte logic: the sky might be below, water might flow upward, shadows might fall in the wrong direction. The fashion is the only thing that obeys the laws of physics. She stands in the impossible landscape, perfectly composed.',
        'Giant flowers — flowers scaled to building size, she moving among petals as large as walls. The ordinary made monumental.',
        'Floating objects — objects that should be on the ground are in the air: furniture, food, fabric. She stands on the ground, the objects hovering around her.',
        'Time frozen — a moment of action frozen impossibly: water in mid-fall, fabric mid-billow, but frozen and perfect. The physics of stopped time.',
        'Double world — the same scene twice, stacked or side-by-side, but in different states: day and night, summer and winter, the same space in two realities.',
        'Infinite corridor — a corridor of identical doors, stretching to infinity in both directions. She stands at the center, one door open, the darkness of the open door the only variation.',
      ],
    },
  },

  {
    id: 'period-drama',
    name: 'Period Drama',
    tagline: 'Country house. Period furniture. The time before.',
    category: 'cinematic',
    mood: ['Period', 'Country House', 'Historical', 'Drama'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('private-library'),
      bg: 'custom-bg',
      lighting: 'Window Natural',
      camera: 'Full Body (50mm)',
      cameraFormat: 'Leica SL2 · 50mm',
      colorGrade: 'Period Warm',
      userPrompts: [
        'English country house library — the library of an Elizabethan or Georgian country house: floor-to-ceiling leather-bound books, the mahogany rolling ladder, a terrestrial globe, deep leather armchairs, a fire in the grate. She sits in one of the chairs, a book open on her lap, the afternoon window light coming in at a low angle across her face from the tall sash window. The room smells of leather and old paper. The entire aesthetic of the great British period drama is present and entirely real.',
        'Country house drawing room, morning — the formal double drawing room, the morning light through the tall south-facing windows falling in long panels across the Axminster carpet. The period furniture is arranged for a social ritual that no longer happens. She stands at the window, looking out at the park, the room reflected faintly in the glass beside her face. The light is the specific quality of English morning light through Georgian glass: slightly diffuse, entirely beautiful.',
        'Country house garden party — the south lawn of a great house, the tables set under the cedar trees, the house visible through the trees behind. Guests in period or semi-period dress are distributed across the lawn. She stands slightly apart from the social activity, looking across the lawn toward the house. The English afternoon light is warm and slightly overcast — the best light for outdoor gatherings and the most British.',
        'Estate landscape garden, afternoon — the 18th-century landscape garden of the estate: the serpentine lake, the Palladian bridge, the Doric temple on the hill above, the ha-ha separating the garden from the parkland. She walks the gravel path along the lake, the bridge visible in the distance, the parkland and its grazing cattle beyond the ha-ha to the right. The English landscape garden was designed to look like a painting.',
        'Country house grand staircase — the great staircase of a Jacobean or Baroque country house, the carved wood balustrade, the portraits of ancestors crowding the stair hall walls above. She descends the stair, one hand on the baluster, the portraits watching from above. The stair hall light comes from the high windows above the landing: cool, directional, architectural.',
        'Country house at dusk — the long facade of the house seen from the park in the last light, the windows beginning to glow warm amber as the lights come on room by room, the parkland darkening in the foreground. She stands on the grass of the park, facing the house, the evening light still touching the upper stories. The image is the classic view that has appeared in every country house novel, and it still works.',
      ],
    },
  },

  {
    id: 'underwater-depth',
    name: 'Underwater',
    tagline: 'Blue depth. Weightless. The world below the surface.',
    category: 'cinematic',
    mood: ['Underwater', 'Weightless', 'Deep Blue', 'Surreal'],
    config: {
      photoDirection: 'AVANT_GARDE_COUTURE',
      locationPreset: loc('maldives-deck'),
      bg: 'custom-bg',
      lighting: 'Underwater Caustics',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Nikon Z9 · 28mm underwater housing',
      colorGrade: 'Deep Blue Aquatic',
      userPrompts: [
        'Underwater full body — shot fully submerged, the fashion billowing weightlessly in all directions, the hair spreading in the water, the body suspended between the surface above (visible as a rippled light ceiling) and the depths below. The caustic light patterns from the surface play across everything.',
        'Surface looking down, underwater — shot from above the water surface through a waterproof housing looking straight down at her submerged below, her figure distorted and fragmented by the water interface, the fabric spreading weightlessly away from her body. The refraction multiplies her into shifting planes of the same figure. The surface ripple pattern moves across everything below it.',
        'Deep blue suspension — at a depth where the ambient light has filtered to deep blue, the surface above a distant pale luminous circle, the depth below invisible. She is suspended mid-water, arms extended, the fashion spreading in the weightlessness around her. No floor, no surface — just the blue in every direction and her figure at its center. The composition is existential.',
        'Coral reef environment — in clear tropical water, the coral reef at the scale of her body: brain coral at shoulder height, staghorn coral at face level, the reef fish moving through the scene. She moves through the reef, the marine world around her at human scale. The water is clear enough to see detail at ten metres. The light from above creates moving caustic patterns across everything.',
        'Pool underwater at night — a pool at night from below the surface, the underwater world lit by the pool lights, the surface above reflecting the lit floor back down in a mirror. She is suspended mid-pool, the water clear and blue above and below. The pool tile catches the underwater lighting in geometric patterns. Her fashion moves in slow motion in the water. The pool edge is a rectangle of darker water around the lit center.',
        'Ocean sandy floor — the shallow sandy seafloor in clear tropical water, the surface visible 8 metres above as a moving, shimmering light ceiling, the light rays descending in shifting columns. She stands on the sand, arms slightly extended, looking up at the surface above. The surreality of gravity functioning on the seafloor — standing, not floating — in an environment where everything else is moving with the current. The sand around her feet settles.',
      ],
    },
  },

  {
    id: 'aurora-night',
    name: 'Aurora',
    tagline: 'Northern lights. Arctic night. The sky that performs.',
    category: 'cinematic',
    mood: ['Aurora', 'Arctic', 'Night', 'Cosmic'],
    config: {
      photoDirection: 'LUXURY_BRAND_CAMPAIGN',
      locationPreset: loc('aurora'),
      bg: 'custom-bg',
      lighting: 'Aurora Ambient',
      camera: 'Full Body (24mm)',
      cameraFormat: 'Sony A7S III · 24mm',
      colorGrade: 'Aurora Green',
      userPrompts: [
        'Northern Lights full sky — the aurora borealis filling the entire sky in bands of green and violet, the snowy landscape below lit by the aurora alone. She stands in the snow, face upward, the aurora reflected in the snow around her. The sky is performing, and she is the audience.',
        'Aurora over frozen lake — the lake surface frozen completely smooth, the aurora reflected in the ice below as clearly as in the sky above. She stands at the lake center, the aurora wrapping both the sky above and the ice below, her figure the only thing that does not reflect or repeat. The reflection is precise and eerie: the same bands above and below, with her standing at the axis between them.',
        'Aurora silhouette — she stands on a low hill, her silhouette a clean dark shape against the aurora-active sky, the green and violet bands behind her with none of her own detail visible. The sky is the subject and she provides its scale. Shot wide enough that the full sweep of the aurora bands is visible; she is in the lower third, dark and absolute. The sky performs alone.',
        'Aurora cabin interior — a glass-roofed arctic cabin or Sami-style tent with a transparent panel in the ceiling, the aurora visible through the glass above. She lies on the cabin bed looking up through the glass at the aurora directly above. The interior is warm and amber from a small lamp; the aurora outside is green and cold. The warmth-cold, interior-exterior, human-cosmic contrasts are all present in one frame.',
        'Aurora through snowstorm — a light snowstorm, the snowflakes falling visibly in the near foreground, and through them the aurora breaking through in green and white: the display partially obscured but still powerful. She stands in the snow, face upward, the snowflakes falling around her and the aurora behind them. The drama of the atmospheric foreground competing with the cosmic background.',
        'Aurora fading at dawn — the specific twenty minutes when the aurora fades as the Arctic dawn begins: the sky transitioning from aurora-lit green-black to the first pale grey-blue light of the sub-Arctic morning. The green bands are still visible but weakening. She stands watching as the sky changes from one extraordinary state to another. The first hint of day is a thin band of pale blue at the eastern horizon.',
      ],
    },
  },

  // ── EDITORIAL ────────────────────────────────────────────────────────────────

  {
    id: 'london-rain',
    name: 'London Rain',
    tagline: 'Wet cobblestone. Gas-lit mews. The city as couture backdrop.',
    category: 'editorial',
    mood: ['London', 'Rain', 'Dark', 'Cinematic'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('london-mews'),
      bg: 'custom-bg',
      lighting: 'Overcast Diffuse',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Leica SL2 · 35mm',
      colorGrade: 'Desaturated Film',
      userPrompts: [
        'Wet London mews at dusk — rain-slicked cobblestones mirror the glow of wrought-iron gas lamps above. She stands at the center of the lane, one hand lifting the hem of a dramatic floor-length coat, water beading on the fabric. The mews closes behind her in soft bokeh, terracotta pots and Georgian facades dissolving into fog. Her gaze is direct, chin slightly lifted. The color palette: pewter sky, olive stone, the coat a deep burgundy. Raindrops visible mid-air, the whole frame humid with atmosphere.',
        'Same London mews, full rain now — she moves through the frame rather than posing in it, coat billowing behind her as she walks toward camera. Blurred motion in her stride, the cobblestones alive with surface reflection. One lamp post illuminates the left side of her face in warm amber; the rest dissolves into cool gray. The silhouette reads like a film still from a Hitchcock feature set in the present.',
        'London mews, post-rain — puddles perfectly still, reflecting the entire lane above. She crouches at the edge of a large puddle, studying her reflection — or ignoring it, head turned to the side. The symmetry between her and the reflection below is exact but slightly distorted by the water surface. Fog still clings to the far end of the lane.',
        'Tight editorial shot — London mews doorway, rain pouring just outside the shallow overhang she stands beneath. Her back is against a dark green door with brass hardware. Face turned upward toward the rain with eyes closed, utterly calm. Rain mist catches the lamplight around her. Shot on 85mm for compression — the door and brick behind are richly textured.',
        'London mews, golden hour through overcast — the rain has stopped but the light is diffuse and warm. She leans against a vintage car parked in the lane, arms crossed loosely, looking off-frame. The wet cobblestones catch the remaining light. Colors: amber, moss, cream — the palette of British autumn at its finest.',
        'London mews at blue hour — lamps on, sky a deep indigo above the narrow gap of buildings. She stands at the far end of the lane, walking away from camera, coat skirt trailing on the wet stones. The lamps create a vanishing-point row of warm circles. A single red umbrella, furled, hangs from her hand. Distance and elegance.',
      ],
    },
  },

  {
    id: 'dubai-glass',
    name: 'Dubai Glass',
    tagline: 'Mirrored tower. Desert light. Ambition made visible.',
    category: 'editorial',
    mood: ['Dubai', 'Glass', 'High-Rise', 'Fierce'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('dubai-deck'),
      bg: 'custom-bg',
      lighting: 'Harsh Direct Sun',
      camera: 'Three-Quarter (50mm)',
      cameraFormat: 'Phase One · 80mm',
      colorGrade: 'High Contrast Bleach',
      userPrompts: [
        'Dubai skyscraper observation deck, noon — the glass railing behind her reflects the entire city skyline in miniature. She stands at the rail, one hand resting on it, chin up, the desert horizon 60 floors below. The light is brutal and unfiltered, casting deep shadows under her jaw, cheekbones lit like sculpture. The city below: a tapestry of glass and sand. Heat shimmer visible at the edges of the frame.',
        'Dubai tower exterior elevator lobby, all glass — her reflection multiplies in the angled glass panels around her. She stands still while the city behind her moves (implied by the motion of clouds outside). Multiple ghost reflections of her in slightly different positions. The effect is fragmented, magazine-surreal, deeply architectural.',
        'Dubai rooftop infinity pool edge, dawn — the first light hits the glass towers across the skyline before it reaches ground. She stands at the pool edge, the water behind her catching the orange and pink sky. Her silhouette against that sky is clean and powerful. Silence before the city wakes.',
        'Interior shot — Dubai penthouse floor-to-ceiling window, golden afternoon. Her back is to the lens, both hands pressed lightly against the glass, the full city panorama spread below. The glass reflects her faintly. Shot from behind and slightly to the side — the city is the equal partner in this frame.',
        'Dubai helipad at blue hour — the towers lit gold and white behind her, she stands in the center of the H, arms slightly out, looking straight up. The wide-angle from below makes her look like she owns everything beneath the sky. Stars just beginning to show.',
        'Desert edge of Dubai — where the city ends and the sand begins. She stands at that precise line: glass and steel behind her, open dune ahead. Shot from low, so the city towers rise above her shoulders like a crown she is walking away from. The sand is soft gold, the city chrome and blue.',
      ],
    },
  },

  {
    id: 'singapore-rain',
    name: 'Singapore After Rain',
    tagline: 'Tropical glass city. Lush and vertical. Heat that shimmers.',
    category: 'editorial',
    mood: ['Singapore', 'Tropical', 'Modern', 'Lush'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('singapore-marina'),
      bg: 'custom-bg',
      lighting: 'Post-Storm Diffuse',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Nikon Z9 · 35mm',
      colorGrade: 'Humid Teal',
      userPrompts: [
        'Singapore Marina Bay after rain — the bay surface perfectly glassy, the lit towers reflected without distortion. She stands on the waterfront promenade, the iconic skyline framing her. Post-storm air: hyper-clear, slightly humid. Her outfit: fluid and sculptural. The light is the diffuse gray-silver that follows tropical downpours — soft, directionless, flattering.',
        'Singapore Gardens by the Bay supertrees — the massive vertical gardens rise behind her, their nighttime LED illumination just warming up at dusk. She stands between two supertree bases, looking upward, the scale making her elegantly small. Lush tropical fronds brush the frame edges.',
        'Singapore Chinatown shophouse street, post-rain — colorful facades reflected in the flooded gutter running down the center of the lane. She stands in the lane, the reflection at her feet a mirror world. Steamy vapor rises from the warm pavement. Red, turquoise, and ochre shophouse colors saturate the frame.',
        'Singapore Botanical Gardens — the first golden rays piercing the canopy after rain, shafts of light through humid air. She stands in a shaft of light, water droplets falling from leaves above catching the beam. The forest floor is deep green and wet. A cathedral quiet.',
        'Singapore rooftop bar, blue hour — the city below lit up, the infinity pool at her back, she leans against the bar itself and looks at camera with quiet authority. The skyline reflection in the pool behind her is perfect and electric.',
        'Singapore Changi Terminal 4 interior — the building is architecture as art: layered glass, waterfalls, living walls. She sits in the departure lounge, surrounded by lush hanging gardens growing from the walls. The scale is immense, the mood quietly surreal. Shot wide to show the impossible beautiful space.',
      ],
    },
  },

  {
    id: 'athens-marble',
    name: 'Athens Marble',
    tagline: 'Ancient stone. Aegean light. Civilization as runway.',
    category: 'editorial',
    mood: ['Athens', 'Ancient', 'Marble', 'Epic'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('athens-rooftop'),
      bg: 'custom-bg',
      lighting: 'Golden Hour Directional',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Leica M11 · 28mm',
      colorGrade: 'Warm Bleach Bypass',
      userPrompts: [
        'Athens rooftop with Acropolis view, golden hour — the Parthenon lit in amber behind her on the hill, the city spreading white and terracotta in every direction. She stands on the rooftop with the city at her back, the warm Aegean light on her face, the monuments of civilization reduced to backdrop. The shot is wide enough that she and the Acropolis share billing.',
        'Panathenaic Stadium Athens — the white marble track and curved seating empty, the ancient stadium hers alone. She walks the track in the center, shot from the far end so the entire oval frames her single figure. The marble under late sun is warm ivory.',
        'Athens Plaka neighborhood, narrow whitewashed stair-street — terracotta pots of bougainvillea cascade down the walls on either side. She climbs the stairs, one hand trailing the wall, looking back over her shoulder. The light is the perfect Attic late afternoon: golden and clean.',
        'National Archaeological Museum Athens — a long marble gallery, ancient kouros sculptures lining the walls on both sides. She walks the central aisle, not looking at the statues, the statues not looking at her — but the tension between old form and present form is the entire image.',
        'Cape Sounion — the Temple of Poseidon columns against a saturated Aegean blue sky. She stands between two columns, the sea visible behind her far below. The ancient stone warm against the impossible blue. Wind in her outfit.',
        'Athens Monastiraki square, early morning before the crowds — the ancient Hephaestion temple in soft morning light behind her. She sits on the edge of a stone planter with an espresso cup, not yet performing, just present. The square is empty and golden.',
      ],
    },
  },

  {
    id: 'chicago-wind',
    name: 'Chicago Wind',
    tagline: 'Glass and steel canyons. Lake Michigan cold. Architectural power.',
    category: 'editorial',
    mood: ['Chicago', 'Architectural', 'Wind', 'Urban'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('chicago-river'),
      bg: 'custom-bg',
      lighting: 'Overcast Urban',
      camera: 'Full Body (28mm)',
      cameraFormat: 'Canon R5 · 28mm',
      colorGrade: 'Steel Blue Muted',
      userPrompts: [
        'Chicago Riverwalk, overcast late morning — the river green-gray, both riverbanks lined with the most extraordinary collection of architectural styles in America. She stands on the riverwalk at the water\'s edge, the canyon of buildings rising behind her, a strong lake wind moving through her coat. Shot at river level to maximize the architectural drama.',
        'Chicago Cloud Gate (Bean) at dawn — the mirrored sculpture reflects the entire skyline distorted into a perfect oval. She stands at the edge of the Bean, her reflection warped and multiplied in the stainless surface. The skyline reflects upside down above her in the curved metal.',
        'Chicago "L" platform at rush hour, slightly elevated — the train tracks running above street level, a train approaching in the background in blur. She stands on the platform, the city below and around her at once. Elevated infrastructure as editorial theater.',
        'Chicago Millennium Park, first winter snow — the park empty except for her, a thin layer of fresh snow on every horizontal surface, the skyline behind perfectly crisp in the cold clear air. She stands in the snow in sharp contrast, the city silver and white behind her.',
        'Chicago Tribune Tower base — the Gothic stonework of the tower rising directly above her, fragments of other famous buildings embedded in the limestone walls behind her. She leans against the stone, looking up. The camera looks up with her.',
        'Chicago LSD (Lake Shore Drive) overpass — shot from below the elevated freeway, the geometric concrete structure above her, Lake Michigan visible in the gap beyond. Urban brutalism and natural water in one frame. Her outfit is architectural to match.',
      ],
    },
  },

  {
    id: 'miami-neon',
    name: 'Miami Neon',
    tagline: 'Art Deco. Ocean Drive. The night that never ends.',
    category: 'editorial',
    mood: ['Miami', 'Neon', 'Art Deco', 'Night'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('miami-deco'),
      bg: 'custom-bg',
      lighting: 'Neon Night',
      camera: 'Three-Quarter (50mm)',
      cameraFormat: 'Sony A7R V · 50mm',
      colorGrade: 'Neon Saturated',
      userPrompts: [
        'Miami Beach Ocean Drive at night — the Art Deco hotels lit in pink and turquoise neon, palm trees silhouetted against the sky. She stands in the center of the sidewalk, the hotel facades stacked behind her, the neon color cast painting one side of her in pink, the other in teal. The pavement reflects it all. The energy is electric and perfectly composed.',
        'Miami Art Basel installation space — a pop-up venue with immersive neon art walls, the kind you see nowhere else. She stands in front of a massive neon installation that fills the wall behind her with color and text. Her outfit absorbs and reflects the ambient color.',
        'Miami Wynwood Walls at dusk, murals illuminated — the enormous street art murals behind her, the alley between them a gallery. She stands at the entrance to the alley, the art framing the entire shot. The colors are those of high-end contemporary art: bold, graphic, intentional.',
        'Miami rooftop at magic hour — the sun setting over the bay, the skyline behind her, the infinity pool below her. She stands at the rooftop edge, back to the shot, the entire golden bay in front of her. The silhouette of the city in gold and the water in copper.',
        'South Beach sand at sunrise — completely empty beach, the first light turning the sand from gray to rose gold. She walks the water\'s edge, water lapping at her heels, the city faintly visible in the warming light behind. The simplicity is the luxury.',
        'Miami Design District — the architectural boutiques, mirrored buildings, public sculpture. She stands in front of a mirrored facade that reflects the entire neighborhood. Her figure is crisp; the reflection world behind her is slightly dreamy. The District as couture context.',
      ],
    },
  },

  {
    id: 'amsterdam-canal',
    name: 'Amsterdam Canal',
    tagline: 'Tall houses. Still water. The Dutch light that painters chased.',
    category: 'editorial',
    mood: ['Amsterdam', 'Canal', 'Dutch Light', 'Quiet'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('amsterdam-canal'),
      bg: 'custom-bg',
      lighting: 'Diffuse Northern Light',
      camera: 'Full Body (50mm)',
      cameraFormat: 'Leica Q3 · 28mm',
      colorGrade: 'Dutch Master Warm',
      userPrompts: [
        'Amsterdam Herengracht canal at golden hour — the tall narrow Dutch merchant houses reflected perfectly in the still canal water. She stands on the arched stone bridge, both arms resting on the railing, looking toward the camera. The reflection below her in the canal is almost more beautiful than the reality. The light is exactly what Vermeer was painting: soft, directional, northern gold.',
        'Amsterdam canal houseboat deck, morning — coffee in hand, she sits on the small deck of a houseboat, the canal life moving slowly past. Bicycles on the canal-side bridge in background blur. The domesticity of it is the editorial statement.',
        'Amsterdam Rijksmuseum underpass — the arched passageway through the museum building, the most photographed cycling lane in the world. She stands in the center of the arch, the museum facade framing her above. The proportions are perfect: her figure in the center of this grand symmetry.',
        'Amsterdam flower market stalls — buckets of tulips in every color, stacked impossibly high. She stands in the narrow aisle between the stalls, surrounded by blooms at every level. The color abundance is the composition.',
        'Amsterdam canal at blue hour — every bridge lit, the water electric with reflections. She stands at the canal\'s edge, looking down at the water, the entire illuminated canal world reflected at her feet.',
        'Amsterdam Jordaan neighborhood — the smallest, most beautiful streets in Europe. Ivy-covered facades, window boxes, canal glimpses between buildings. She walks the cobblestone street, the city\'s domestic perfection framing her.',
      ],
    },
  },

  {
    id: 'barcelona-gothic',
    name: 'Barcelona Gothic',
    tagline: 'Medieval stone. Catalan heat. Gaudí and shadow.',
    category: 'editorial',
    mood: ['Barcelona', 'Gothic', 'Warm', 'Textured'],
    config: {
      photoDirection: 'HIGH_FASHION_EDITORIAL',
      locationPreset: loc('barcelona-gothic'),
      bg: 'custom-bg',
      lighting: 'Harsh Mediterranean Sun',
      camera: 'Full Body (35mm)',
      cameraFormat: 'Nikon Z8 · 35mm',
      colorGrade: 'Warm Mediterranean',
      userPrompts: [
        'Barcelona Gothic Quarter — narrow medieval streets where the buildings are so tall and close that they block most of the sky. A single blade of sharp noon sunlight cuts diagonally across the stone wall and catches her. The shadow is as important as the light. The stone is warm gold limestone.',
        'Park Güell Barcelona — Gaudí\'s mosaic terraces, the ceramic salamander, the impossible organic architecture. She stands on the main terrace, the colorful mosaic bench curving behind her, the city visible far below. The surrealism is organic, not constructed.',
        'Casa Batlló facade Barcelona — the undulating bone-colored facade with its dragon-scale roof. Shot from across the Passeig de Gràcia, she stands in the street, the building an extraordinary backdrop behind her. The living architecture makes her feel like a protagonist in a fairy tale.',
        'Barcelona La Boqueria — the great market, light streaming through the iron and glass roof. She moves through the stalls, surrounded by color: the reds of tomatoes, the orange of persimmons, the green of herbs. The market as editorial theater.',
        'Barcelona Barceloneta beach at dawn — empty sand, the city behind, the Mediterranean flat and silver. She runs at the water\'s edge, her figure in motion against the horizontal calm of the sea and the vertical drama of the city.',
        'Barcelona El Born neighborhood rooftop — the Gothic church Santa Maria del Mar below, the city spreading to the sea. She stands at the rooftop edge at dusk, the last light warm on the church stonework, the sea a dark line beyond.',
      ],
    },
  },
];
