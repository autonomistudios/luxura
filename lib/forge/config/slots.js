/**
 * lib/forge/config/slots.js
 * Model permutation pools, framing types, and deterministic slot generation.
 * Exports pools, the RNG/shuffle utilities, and the slot builder.
 */

// ─── MODEL PERMUTATION POOLS ─────────────────────────────────────────────────
export const AGES = [
  "22 years old",
  "26 years old",
  "19 years old",
  "31 years old",
  "24 years old",
  "38 years old",
  "29 years old",
  "21 years old",
  "34 years old",
  "27 years old",
];

export const BODY_TYPES = [
  "lean and athletic, narrow hips, defined shoulders",
  "petite and slender, delicate frame, small waist",
  "curvy hourglass figure, full hips, defined waist",
  "tall and statuesque, long legs, broad shoulders",
  "medium build, balanced proportions, strong core",
  "plus-size with full curves, wide hips, generous bust",
  "muscular and toned, broad back, defined arms",
  "willowy and elongated, extremely slim, runway proportions",
  "compact and strong, short stature, powerful build",
  "average height, soft curves, natural everyday proportions",
];

export const ETHNICITIES = [
  "South Asian (Indian/Sri Lankan)",
  "East Asian (Korean/Japanese/Chinese)",
  "Black African (West African heritage)",
  "Northern European (Scandinavian/British)",
  "Hispanic Latina (Mexican/Colombian/Brazilian)",
  "Indigenous American (Native American heritage)",
  "Middle Eastern (Persian/Lebanese/Egyptian)",
  "Pacific Islander (Samoan/Hawaiian/Fijian)",
  "Mediterranean (Greek/Italian/Spanish)",
  "Afro-Caribbean (Jamaican/Trinidadian/Haitian)",
];

export const FACES = [
  "high sculpted cheekbones, sharp narrow nose, defined angular jaw",
  "soft round features, gentle button nose, warm gentle jawline",
  "bold editorial bone structure, wide-set eyes, strong brow ridge",
  "deep-set soulful eyes, straight prominent nose, strong distinguished chin",
  "monolid almond eyes, petite jaw, delicately pointed chin",
  "full wide lips, broad high forehead, wide almond eyes, prominent cheeks",
  "heavy freckles across nose and cheeks, sharp cheekbones, clear defined features",
  "wide prominent nose, full lips, broad forehead, powerful symmetrical features",
  "strong thick brows, square jawline, prominent cheekbones, intense gaze",
  "elegant elongated neck, refined symmetrical features, graceful proportions",
];

export const POSES = [
  "strict side profile — body and face turned 90° left, chin level, shoulders square to side",
  "head tilted back at 30°, eyes looking upward toward ceiling, long neck exposed, mouth slightly parted",
  "dead-center symmetrical gaze, eyes locked directly into the lens, completely still, frontal",
  "both hands firmly on hips, standing, three-quarter body turn toward camera, chin lifted",
  "gaze cast 45° away from camera to upper right, chin down, lost in thought, no eye contact with lens",
  "leaning hard into a wall or surface, weight on one shoulder, arms crossed, direct gaze",
  "over-the-shoulder glance — body fully facing away, head twisted 180° back at camera, strong back line",
  "relaxed seated — legs crossed or extended, body reclined, one arm resting, casual confidence",
  "low crouch or partial kneel, body close to ground level, looking up or straight, dynamic energy",
  "standing upright, arms loose at sides, chin tilted slightly down, quiet and composed",
  "turned slightly away, hand near face or chin, candid editorial feeling",
  "walking stride frozen mid-step, body moving, eyes forward or off-camera",
];

// Standard pool — used when only face/hair/makeup/accessory anchors are selected
export const FRAMINGS = [
  "EXTREME HEADSHOT: Face fills 80% of frame. Crown may be cropped. Chin just in frame.",
  "CHEST-UP PORTRAIT: Top of head to mid-chest. No waist visible. Classic beauty crop.",
  "3/4 BODY: Crown to just above knees. Full torso and arms visible.",
  "FULL BODY: Head to feet fully in frame with breathing room top and bottom.",
  "ENVIRONMENTAL: Subject takes up 60% of frame. Setting/background clearly visible around them.",
  "HALF BODY: Crown to hips. Hands may be visible. Mid-body crop.",
  "PROFILE SILHOUETTE: Full body in profile, subject facing 90° to camera, full height visible.",
  "LOW ANGLE FULL BODY: Camera below waist level shooting upward, feet at bottom, head at top.",
  "EDITORIAL DETAIL: Cropped tight on the anchored feature — fill frame with the hero element.",
];

// Clothing-safe pool — used when any garment anchor is present.
// All framings show enough of the body to display the full outfit.
export const CLOTHING_FRAMINGS = [
  "FULL BODY: Head to feet fully in frame with generous breathing room. All garments visible.",
  "3/4 BODY: Crown to mid-shin. Full torso, complete outfit from shoulders to just above ankle.",
  "PROFILE SILHOUETTE FULL: Subject in full side profile, head to feet, complete outfit silhouette.",
  "LOW ANGLE FULL BODY: Camera below hip level shooting upward, full outfit from shoes to crown.",
  "ENVIRONMENTAL FULL: Subject full-body in setting, visible from head to toe in environment.",
  "WALKING FULL BODY: Mid-stride, full figure head to toe, outfit in motion.",
  "REAR FULL BODY: Model facing away from camera, full outfit visible from behind, head to heel.",
  "EDITORIAL OUTFIT DETAIL: Tight crop on a hero garment element — texture, hardware, or fabric drape. Clothing fills frame.",
  "SEATED FULL LENGTH: Model seated, full outfit visible — top, bottom, and footwear all in frame.",
  "STANDING EDITORIAL: Straight-on full body, model filling 80% of frame height, outfit centre.",
];

export const OUTFITS = [
  "black leather biker jacket, dark straight-leg jeans",
  "oversized cream textured knit sweater, minimal accessories",
  "silk emerald green bias-cut slip dress, strappy heels",
  "crisp white oversized button-down shirt, tailored trousers",
  "cropped denim jacket, fitted black turtleneck underneath",
  "sheer printed bohemian midi dress, layered jewelry",
  "structured charcoal grey power blazer, matching wide-leg trousers",
  "camel cashmere turtleneck, dark slim trousers, ankle boots",
  "vintage oversized 90s windbreaker, fitted black joggers",
  "deep navy velvet wrap dress, minimal gold jewelry",
];

export const EYE_COLORS = [
  "rich deep brown", "warm amber honey", "grey-green hazel",
  "deep dark ebony", "blue-grey steel", "golden green",
  "dark warm hazel", "clear bright brown", "deep obsidian black", "green with gold flecks",
];

// ─── DETERMINISTIC UNIQUE SHUFFLE ─────────────────────────────────────────────
// Produces a repeatable shuffle from a numeric seed (no two slots share the same choice).
export function makeRng(seed) {
  let s = (seed | 0) || 99991;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 | 0;
    return (s >>> 0) / 0xffffffff;
  };
}

export function uniqueShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * buildSlots — generates 9 unique permutation sets for the slot grid.
 * @param {number} entropySeed  — numeric seed derived from the request entropy string
 * @param {boolean} hasClothingAnchor — selects clothing-safe framing pool when true
 * @returns {{ ethnicities, faces, poses, eyes, ages, bodyTypes, framings, outfits }}
 */
export function buildSlots(entropySeed, hasClothingAnchor) {
  const rng         = makeRng(entropySeed);
  const framingPool = hasClothingAnchor ? CLOTHING_FRAMINGS : FRAMINGS;
  return {
    ethnicities: uniqueShuffle(ETHNICITIES, makeRng(entropySeed + 1)),
    faces:       uniqueShuffle(FACES,       makeRng(entropySeed + 2)),
    poses:       uniqueShuffle(POSES,       makeRng(entropySeed + 3)),
    eyes:        uniqueShuffle(EYE_COLORS,  makeRng(entropySeed + 4)),
    ages:        uniqueShuffle(AGES,        makeRng(entropySeed + 5)),
    bodyTypes:   uniqueShuffle(BODY_TYPES,  makeRng(entropySeed + 6)),
    framings:    uniqueShuffle(framingPool, makeRng(entropySeed + 7)),
    outfits:     uniqueShuffle(OUTFITS,     makeRng(entropySeed + 8)),
  };
  void rng; // rng used for seed derivation only
}
