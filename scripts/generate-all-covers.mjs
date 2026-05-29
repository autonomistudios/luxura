/**
 * Batch cover image generator for all new creative props.
 * Calls the deployed /api/generate-prop-cover endpoint sequentially.
 * Run: node scripts/generate-all-covers.mjs
 */

const BASE_URL = 'https://luxaurastudio.vercel.app';
const DELAY_MS = 4000; // 4s between calls to avoid rate limits

const NEW_PROPS = [
  // ── EDITORIAL (new 15) ──────────────────────────────────────────────────────
  {
    id: 'istanbul-bridge',
    prompt: 'Galata Bridge Istanbul at golden hour — the Bosphorus below, the old city skyline of minarets and domes behind her. She stands at the rail, looking across the water toward Asia. The light is the warm amber of Ottoman afternoons. Fishing lines dangle from the bridge rails around her, the city living its life. Editorial fashion photography, Leica 35mm film look.',
  },
  {
    id: 'havana-facade',
    prompt: 'Havana Old City — a wall of peeling colonial facades in ochre, turquoise, and rose, the paint revealing layers of history beneath. She stands against the most beautiful of the walls, the texture and color so rich it competes with her. The shadow is deep and graphic. Editorial fashion photography.',
  },
  {
    id: 'buenos-aires-editorial',
    prompt: 'Buenos Aires Recoleta — the Haussmann-style boulevards, the café terraces, the jacaranda trees in full purple bloom. She walks the sidewalk under a jacaranda canopy, purple flowers on the pavement around her feet. Warm afternoon light. Editorial fashion photography.',
  },
  {
    id: 'sydney-harbour',
    prompt: 'Sydney Opera House forecourt — the iconic white shell sails rising behind her, the harbour beyond them deep blue. She stands on the forecourt steps, the harbour bridge visible to the left. The light is the extraordinary Sydney light: bright, clean, and blue-white. Editorial fashion photography.',
  },
  {
    id: 'rome-piazza',
    prompt: 'Trevi Fountain Rome at 2am — the piazza empty of tourists, the fountain lit in warm amber, the water sound filling the silence. She stands at the fountain edge, the Baroque facade behind her, the lit water casting moving light. The marble is gold in this light. Editorial fashion photography, Leica film look.',
  },
  {
    id: 'lagos-waterfront',
    prompt: 'Lagos Victoria Island waterfront — the Atlantic behind her, the VI skyline of glass towers to her left, the warm equatorial light overhead. She stands on the waterfront with the energy of the city around her. Editorial fashion photography.',
  },
  {
    id: 'cairo-bazaar',
    prompt: 'Cairo desert edge at Giza — the Great Pyramid filling the entire background at golden hour, the desert sand extending to its base. She stands at the desert edge, the pyramid amber-lit behind her. Editorial fashion photography.',
  },
  // ── EDITORIAL (8 more at end of file) ──────────────────────────────────────
  {
    id: 'london-rain',
    prompt: 'Wet London mews at dusk — rain-slicked cobblestones mirror the glow of wrought-iron gas lamps above. She stands at the center of the lane, one hand lifting the hem of a dramatic floor-length coat, water beading on the fabric. Fog at the end of the lane. Leica 35mm editorial fashion photography.',
  },
  {
    id: 'dubai-glass',
    prompt: 'Dubai skyscraper observation deck, noon — the glass railing behind her reflects the entire city skyline in miniature. She stands at the rail, one hand resting on it, chin up, the desert horizon 60 floors below. Harsh unfiltered sun, deep shadows. Phase One editorial fashion photography.',
  },
  {
    id: 'singapore-rain',
    prompt: 'Singapore Marina Bay after rain — the bay surface perfectly glassy, the lit towers reflected without distortion. She stands on the waterfront promenade, the iconic skyline framing her. Post-storm air, hyper-clear. Editorial fashion photography.',
  },
  {
    id: 'athens-marble',
    prompt: 'Athens rooftop with Acropolis view at golden hour — the Parthenon lit in amber on the hill behind her, the city spreading white and terracotta in every direction. She stands on the rooftop, the warm Aegean light on her face. Editorial fashion photography, Leica film look.',
  },
  {
    id: 'chicago-wind',
    prompt: 'Chicago Riverwalk, overcast — the river green-gray, both riverbanks lined with extraordinary architecture. She stands on the riverwalk at the water\'s edge, a strong lake wind moving through her coat. Editorial fashion photography, 28mm wide angle.',
  },
  {
    id: 'miami-neon',
    prompt: 'Miami Beach Ocean Drive at night — Art Deco hotels lit in pink and turquoise neon, palm trees silhouetted. She stands in the center of the sidewalk, neon color painting one side of her pink and the other teal. The pavement reflects it all. Editorial fashion photography.',
  },
  {
    id: 'amsterdam-canal',
    prompt: 'Amsterdam Herengracht canal at golden hour — tall narrow Dutch merchant houses reflected perfectly in still canal water. She stands on the arched stone bridge, looking toward the camera. The light exactly what Vermeer was painting. Editorial fashion photography, Leica film look.',
  },
  {
    id: 'barcelona-gothic',
    prompt: 'Barcelona Gothic Quarter — narrow medieval streets, a single blade of sharp noon sunlight cutting diagonally across the warm stone wall and catching her. The shadow is as important as the light. Editorial fashion photography.',
  },

  // ── CAMPAIGN (12) ──────────────────────────────────────────────────────────
  {
    id: 'iceland-glacier',
    prompt: 'Iceland Jökulsárlón glacier lagoon — massive blue ice fragments floating on black water, the glacier descending from the ice cap above. She stands on the black sand bank, the glacier behind her. The extraordinary electric blue of glacial ice against black volcanic sand. Luxury brand campaign photography, Phase One.',
  },
  {
    id: 'tuscany-harvest',
    prompt: 'Tuscany Val d\'Orcia at dawn — the iconic cypress-lined dirt road rising over the hill, the mist in the valleys, the light the warm gold that made this landscape famous. She walks the road, the cypress rows framing her, the valley dropping away on both sides. Luxury brand campaign, Leica 50mm Portra look.',
  },
  {
    id: 'bali-ceremony',
    prompt: 'Bali Tegallalang rice terraces — the stepped emerald green paddies descending the valley, the coconut palms above. She stands on one of the terrace paths, the green tiers descending below her. The light is the filtered tropical morning: warm and humid. Luxury brand campaign photography.',
  },
  {
    id: 'capetown-table',
    prompt: 'Cape Town Table Mountain summit — the flat-topped mountain above the clouds, the city and both oceans visible below. She stands at the summit edge, the tablecloth cloud spilling over the edge beside her, the city miniature below. Luxury brand campaign photography.',
  },
  {
    id: 'norway-fjord',
    prompt: 'Geirangerfjord Norway — the fjord walls rising 1400 meters directly from the water, the Seven Sisters waterfall cascading down the opposite cliff face. She stands on the ferry deck as it moves through the fjord. Overcast Nordic light. Luxury campaign photography, Phase One.',
  },
  {
    id: 'morocco-villa',
    prompt: 'Marrakech luxury riad courtyard — the central fountain, the hand-painted zellij tiles, the carved stucco archways, the bougainvillea climbing the walls. She sits at the fountain edge, the courtyard architecture surrounding her in perfect symmetry. Afternoon light through the open roof. Luxury brand campaign photography.',
  },
  {
    id: 'santorini-blue',
    prompt: 'Santorini Oia caldera edge — the white cubic houses stepping down the volcanic cliff, the blue-domed churches, the caldera below filled with deep Aegean blue. She stands on one of the terraces, the most photographed view in Greece behind her. Luxury brand campaign photography.',
  },
  {
    id: 'swiss-alpine',
    prompt: 'Swiss Alps above Zermatt — the Matterhorn behind her, snow-covered landscape at altitude, the air extraordinarily clear. She stands in the snow, the iconic pyramid peak directly behind her, the sky deep blue at altitude. Luxury campaign photography, Phase One.',
  },
  {
    id: 'peru-inca',
    prompt: 'Machu Picchu at dawn — the clouds rolling through the ruins, the sun just clearing the mountain above the citadel. She stands on the agricultural terraces, the citadel behind, the Andes peaks in cloud around her. The light is the golden dawn on ancient stone. Luxury brand campaign photography.',
  },
  {
    id: 'jordan-desert',
    prompt: 'Petra Jordan — the Treasury building carved into the rose-red sandstone cliff. She stands at the Siq exit where the Treasury first becomes visible, framed by the narrow canyon walls. The rock is the extraordinary rose-red of Nabataean sandstone. Luxury brand campaign photography.',
  },
  {
    id: 'namibia-desert',
    prompt: 'Sossusvlei Namibia — the highest dunes in the world, the sand a deep orange-red against electric blue sky. She stands at the crest of Dune 45 at sunrise, the dune shadow cutting exactly across the sand below her. Phase One campaign photography.',
  },
  {
    id: 'zanzibar-coast',
    prompt: 'Zanzibar Nungwi beach — the powdered coral sand, the Indian Ocean turquoise so clear the sandbars show through it, a dhow sailing in the middle distance. She stands at the water\'s edge, the ocean color almost unbelievable behind her. Luxury brand campaign photography.',
  },

  // ── STREET (10) ─────────────────────────────────────────────────────────────
  {
    id: 'london-tube',
    prompt: 'London Underground deep level station — the curved tile walls, the distinctive roundel signage, the train arriving in a rush of displaced air. She stands on the platform, coat gathered, the train pulling in beside her. Grain, authentic street photography.',
  },
  {
    id: 'paris-metro',
    prompt: 'Paris Métro Arts et Métiers station — the copper-plated walls and Jules Verne submarine aesthetic. She stands in the curved copper chamber, the portholes and mechanical elements around her. Street fashion photography.',
  },
  {
    id: 'berlin-wall',
    prompt: 'East Side Gallery Berlin — the longest remaining section of the Berlin Wall, covered in murals. She walks along the wall, the famous "Fraternal Kiss" mural behind her. The murals are enormous and the wall is the texture of history. Street fashion photography.',
  },
  {
    id: 'lagos-market',
    prompt: 'Balogun market Lagos Island — the greatest market in West Africa, the stalls stacked with Ankara fabric bolts in every pattern. She stands in the market, the fabric colors everywhere around her. Street fashion photography, Fuji grain.',
  },
  {
    id: 'mumbai-street',
    prompt: 'Mumbai Marine Drive at dawn — the curve of the Queen\'s Necklace before the city wakes, the Arabian Sea beside the promenade. She walks the promenade, the sea beside her, the city stirring. Street fashion photography.',
  },
  {
    id: 'mexico-city',
    prompt: 'Mexico City Zócalo — the enormous central plaza, the Metropolitan Cathedral and National Palace flanking it. She stands in the vast plaza, the monumental architecture surrounding her. Street fashion photography, Leica.',
  },
  {
    id: 'hong-kong-neon',
    prompt: 'Mong Kok Hong Kong at night — the densest neon sign district in the world, signs projecting from every building at every level, the street below a corridor of light. She walks beneath the signs, the neon above casting color in every direction. Street fashion photography.',
  },
  {
    id: 'copenhagen-bike',
    prompt: 'Nyhavn Copenhagen — the famous colored townhouses along the canal, the wooden sailing ships moored along the quay. She walks the quay, the reflections of the colorful facades in the canal water. Nordic light street fashion photography.',
  },
  {
    id: 'sao-paulo-graffiti',
    prompt: 'Beco do Batman São Paulo — the famous graffiti alley in Vila Madalena, every surface a mural. She stands in the alley, the murals covering walls, stairs, and every surface around her. Street fashion photography.',
  },
  {
    id: 'amsterdam-bike',
    prompt: 'Amsterdam morning bike commute — she rides a classic Dutch upright bicycle across one of the famous canal bridges, the canal below, the gabled houses behind. One hand on the handlebars, the other holding a coffee. Fuji street fashion photography.',
  },

  // ── BEAUTY (8) ──────────────────────────────────────────────────────────────
  {
    id: 'studio-vapor',
    prompt: 'Beauty studio with directed steam — the vapor catches the single backlight, creating a diffuse white glow behind the face. She faces the camera, the steam surrounding her head like a halo. The skin is luminous in the diffused light. Shot on 100mm macro. Vogue beauty editorial.',
  },
  {
    id: 'milk-bath',
    prompt: 'Milk bath overhead — she lies in an opaque white bath, rose petals and botanical elements floating on the surface. Shot from directly above, her face the only skin visible. The white water, the pink petals, the absolute stillness. Vogue beauty editorial photography.',
  },
  {
    id: 'gold-hour-face',
    prompt: 'Golden hour window beauty — the last direct sunlight of the day through a single tall window, almost horizontal and perfectly golden. It strikes her face at a shallow angle, illuminating one side in gold and leaving the other in deep warm shadow. 85mm beauty editorial.',
  },
  {
    id: 'rain-face',
    prompt: 'Rain beauty — face turned up to falling rain, eyes closed, water running down in perfect streams. The overcast sky above creates perfect diffuse fill light on the face. Skin luminous and wet. Vogue beauty editorial photography.',
  },
  {
    id: 'night-bloom',
    prompt: 'Single candle portrait — a single candle as the only light source, placed at chin level, casting upward Rembrandt light. The background is complete black. Her face emerges from darkness. Shot at ISO 3200 for grain. Beauty editorial.',
  },
  {
    id: 'ice-beauty',
    prompt: 'Ice block beauty — she holds a block of clear ice at face level, the light refracting through it across her face. The ice is imperfect: bubbles, cracks, natural inclusions. Her face visible through the distortion. Blue cold color grade. Beauty editorial photography.',
  },
  {
    id: 'sand-skin',
    prompt: 'Sand on skin — desert sand caught on warm skin on the cheekbone and shoulder. The fine grains visible against the skin texture. Extreme close-up. The light is warm desert sun at an angle that shows skin texture and sand grain simultaneously. Beauty editorial.',
  },
  {
    id: 'forest-light',
    prompt: 'Forest canopy beauty — a single shaft of sunlight descending through the tree canopy from above, striking the face from directly above. The surrounding forest in deep green shadow. The contrast of the lit face in the dark green forest. 85mm beauty editorial.',
  },

  // ── AVANT-GARDE (8) ─────────────────────────────────────────────────────────
  {
    id: 'mirror-infinite',
    prompt: 'Infinity mirror room — walls and floor and ceiling all mirrors, her figure multiplied to infinity in every direction, becoming a pattern of repeating selves. She stands at the center, one solid figure surrounded by her infinite reflections. Avant-garde couture photography.',
  },
  {
    id: 'body-architecture',
    prompt: 'Brutalist architecture body — she stands against the raw concrete of a brutalist building, wearing a structural fashion piece that echoes the geometry of the architecture. Hard directional light creates deep shadow in both the concrete texture and the fashion construction. High contrast avant-garde.',
  },
  {
    id: 'void-series',
    prompt: 'The void — pure black background, a single very narrow rim light from behind creating just the edge of the figure against absolute darkness. The silhouette is barely an outline. The fashion is present only in the edge that is lit. Avant-garde couture photography.',
  },
  {
    id: 'oversaturation',
    prompt: 'Fever dream saturation — multiple smoke cannons in different colors (pink, yellow, blue, orange) creating an atmosphere of layered color. She stands in the color cloud. Maximum saturation avant-garde fashion photography.',
  },
  {
    id: 'paper-world',
    prompt: 'Paper architecture world — an entirely constructed paper environment: origami mountains, paper buildings, paper trees, all at the scale of her body. She stands in this constructed paper world. Everything is white paper except her. Avant-garde couture editorial.',
  },
  {
    id: 'water-body',
    prompt: 'Underwater couture — shot from below the water surface looking up, she is partially submerged, the fashion billowing in the water around her, the surface visible above distorting the sky. The fashion becomes weightless architecture. Avant-garde fashion photography.',
  },
  {
    id: 'fragmentation',
    prompt: 'Mirror shard portrait — multiple small mirrors at different angles reflecting different parts of her face. The face reconstructed from fragments, partially visible in each shard. Avant-garde couture photography, Phase One.',
  },
  {
    id: 'fire-smoke',
    prompt: 'Smoke editorial — theatrical black smoke filling the lower half of the frame, she stands above it. The smoke rises around her, partially obscuring the lower body. The upper body and face are clear in the directional light. Dramatic avant-garde fashion photography.',
  },

  // ── FINE ART (8) ────────────────────────────────────────────────────────────
  {
    id: 'louvre-gallery',
    prompt: 'Louvre Grande Galerie — the longest gallery in the world, the paintings of the Italian Renaissance on both walls, the parquet floor, the tall windows. She walks the center of the gallery, the paintings flanking her. Museum gallery lighting. Fine art fashion editorial, Leica.',
  },
  {
    id: 'met-museum',
    prompt: 'Met Great Hall — the vast Beaux-Arts entrance hall with its columns and arched ceiling and the famous flower arrangements. She stands in the center of the hall, the symmetry of the space around her. Museum overhead lighting. Fine art fashion editorial.',
  },
  {
    id: 'guggenheim-bilbao',
    prompt: 'Guggenheim Bilbao exterior — the titanium-clad building on the Nervión River, its curved organic forms reflecting the overcast Basque sky. She stands on the riverside walkway, the impossible building behind her. Overcast silver light. Fine art fashion editorial.',
  },
  {
    id: 'tate-modern',
    prompt: 'Tate Turbine Hall — the enormous hall 35 meters tall and 155 meters long. She stands in the hall during a major installation, the work around her at architectural scale. Industrial beauty. Fine art fashion editorial, Canon.',
  },
  {
    id: 'uffizi-florence',
    prompt: 'Botticelli rooms Uffizi — the room of the Primavera and the Birth of Venus. She stands at the center of the room, the two great Botticelli paintings facing each other. Warm gallery lighting. Fine art fashion editorial, Leica.',
  },
  {
    id: 'auction-house',
    prompt: 'Christie\'s evening sale — the auction room during a major sale, the works lit on the walls. She sits in the front rows in evening dress, the bidding invisible around her. Gallery spot lighting. Fine art fashion editorial, Leica.',
  },
  {
    id: 'opera-house',
    prompt: 'Paris Opéra Garnier grand staircase — the most beautiful staircase in the world, the Baroque excess of red velvet, gold, and marble. She descends the stair, one hand on the gold railing, the chandelier above. Chandelier warm light. Fine art fashion editorial.',
  },
  {
    id: 'museum-after-hours',
    prompt: 'Museum after closing — the galleries at night, the works lit by their individual spots, the corridors between galleries dark. She stands alone in a gallery, the art surrounding her, no one else in the world. Night museum lighting. Fine art fashion editorial.',
  },

  // ── LIFESTYLE (10) ──────────────────────────────────────────────────────────
  {
    id: 'dubai-rooftop',
    prompt: 'Dubai rooftop infinity pool at night — the pool edge appears to merge with the city of lights below, the Burj Khalifa the dominant feature of the skyline. She stands at the pool rim, the city spread below. Pool lit from within. Luxury lifestyle photography.',
  },
  {
    id: 'lake-como',
    prompt: 'Villa Carlotta Lake Como terrace — the terraced gardens dropping to the lake below, the opposite shore mountains reflected in the still water. She sits on a stone bench in the garden, the lake behind, the afternoon light on the water. Leica 50mm Portra. Luxury lifestyle.',
  },
  {
    id: 'st-barths',
    prompt: 'St. Barths Shell Beach — the unique shell-pebble beach in Gustavia, the turquoise Caribbean water, the sailboats in the harbour. She sits on the shell beach, the water behind her the color of shallow tropical sea. Luxury lifestyle photography.',
  },
  {
    id: 'aspen-snow',
    prompt: 'Aspen Mountain at fresh powder day — the ski runs deep in fresh snow, the blue sky above. She stands at a mid-mountain vantage, the fresh powder field behind, the Elk Mountains in all directions. Bright snow light. Luxury lifestyle photography.',
  },
  {
    id: 'hamptons',
    prompt: 'Hamptons shingled estate — the classic Hamptons house: white cedar shingles weathered silver, hydrangea borders. She stands on the porch, the afternoon light warm, the Atlantic breeze in the hydrangeas. Leica Portra. Luxury lifestyle photography.',
  },
  {
    id: 'napa-wine',
    prompt: 'Napa Valley vineyard in late afternoon — the golden California light on the vine leaves, the mountains beyond the valley. She walks between the vine rows, the grapes heavy in the harvest season. Luxury lifestyle photography, Canon.',
  },
  {
    id: 'mykonos-infinity',
    prompt: 'Mykonos Little Venice — the buildings that hang directly over the sea, the waves washing the foundations, the windmills above on the hill. She sits on a terrace over the water, the Aegean splashing below. Greek island sun. Luxury lifestyle photography.',
  },
  {
    id: 'miami-penthouse',
    prompt: 'Miami Brickell penthouse — floor-to-ceiling glass, Biscayne Bay in one direction, the Brickell financial district in the other. She stands at the glass, the bay spread below, the sun setting. Minimal and perfect interior. Luxury lifestyle photography.',
  },
  {
    id: 'swiss-chalet-life',
    prompt: 'Swiss chalet morning — the dark wood interior with its geranium-filled window boxes outside, the mountains visible through the window. She sits at the breakfast table, the mountains behind, steam from a coffee cup rising. Leica Portra. Luxury lifestyle photography.',
  },
  {
    id: 'tuscany-villa',
    prompt: 'Tuscan stone farmhouse terrace — the stone loggia overlooking the olive grove and the Val d\'Orcia beyond, the cypress trees on the hill. She sits on the terrace in linen, a glass of local wine, the afternoon light long on the stone. Leica Portra luxury lifestyle.',
  },

  // ── CINEMATIC (8) ───────────────────────────────────────────────────────────
  {
    id: 'film-noir',
    prompt: 'Film noir street scene — black and white, rain-wet street, a single street lamp illuminating a pool of light. She stands at the edge of the light, half in shadow. The shadows are deep black, the lit areas pure white. High contrast cinematic B&W photography.',
  },
  {
    id: 'sci-fi-future',
    prompt: 'Blade Runner future city — a neon-drenched night scene: multiple overlapping neon sign colors (magenta, cyan, amber), rain on every surface, steam from underground vents, the city of ten million people in the background. She stands in the foreground, futuristic fashion. Cinematic photography.',
  },
  {
    id: 'gothic-cathedral',
    prompt: 'Gothic cathedral interior — the nave with stone columns rising to pointed arches above, the stained glass windows casting pools of colored light on the stone floor. She stands in a pool of stained glass color, the cathedral in deep shadow around her. Cinematic fashion photography.',
  },
  {
    id: 'western-dust',
    prompt: 'Desert highway golden hour — the straight American highway vanishing to a heat-shimmer point on the horizon, the desert on either side. She stands in the road, the highway behind her, the golden hour light on her face. Cinematic fashion photography, Canon.',
  },
  {
    id: 'surreal-dream',
    prompt: 'Surrealist landscape — a dreamscape that follows Dalí logic: flowers scaled to building size, the sky a warm dream color. She stands in the impossible landscape, perfectly composed. The fashion is the only thing that obeys the laws of physics. Cinematic avant-garde photography.',
  },
  {
    id: 'period-drama',
    prompt: 'Country house library — floor-to-ceiling books on shelves, the rolling ladder, a globe, leather chairs, a fire. She sits in one of the chairs, a book open on her lap, the afternoon window light on the side of her face. Leica 50mm. Cinematic period fashion photography.',
  },
  {
    id: 'underwater-depth',
    prompt: 'Underwater couture full body — shot fully submerged, the fashion billowing weightlessly in all directions, the hair spreading in the water, the body suspended between the surface above (visible as a rippled light ceiling) and the depths below. Caustic light patterns. Cinematic fashion photography.',
  },
  {
    id: 'aurora-night',
    prompt: 'Northern Lights full sky — the aurora borealis filling the entire sky in bands of green and violet, the snowy landscape below lit by the aurora alone. She stands in the snow, face upward, the aurora reflected in the snow around her. Sony A7S III. Cinematic fashion photography.',
  },
];

async function generateCover(prop, index) {
  const label = `[${index + 1}/${NEW_PROPS.length}] ${prop.id}`;
  console.log(`${label} — generating...`);
  try {
    const res = await fetch(`${BASE_URL}/api/generate-prop-cover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propId: prop.id, userPrompt: prop.prompt }),
    });
    const data = await res.json();
    if (data.coverUrl) {
      console.log(`${label} ✓ saved to Firestore`);
      return true;
    } else {
      console.error(`${label} ✗ no coverUrl:`, data.error || 'unknown');
      return false;
    }
  } catch (err) {
    console.error(`${label} ✗ fetch error:`, err.message);
    return false;
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log(`\nGenerating covers for ${NEW_PROPS.length} props...\n`);
  let success = 0, fail = 0;

  for (let i = 0; i < NEW_PROPS.length; i++) {
    const ok = await generateCover(NEW_PROPS[i], i);
    if (ok) success++; else fail++;
    if (i < NEW_PROPS.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\nDone. ${success} succeeded, ${fail} failed.`);
}

main().catch(console.error);
