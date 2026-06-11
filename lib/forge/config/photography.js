/**
 * lib/forge/config/photography.js
 * All photographic style data: directions, lighting, camera, color grade, skin tone maps.
 * Pure data — no logic, no imports. Safe to load in isolation.
 */

// ─── LIGHTING MAP: descriptive label → photography instruction ────────────────
export const LIGHTING_MAP = {
  "Clean & Even":       "soft-box studio lighting, balanced three-point setup, clean even fill with no harsh shadows, professional commercial photography",
  "Sunset Side Glow":   "warm golden directional side light, late-afternoon sun quality, amber-to-warm-white gradient, long soft shadows, glowing skin warmth",
  "Deep Shadow":        "Rembrandt lighting, single strong key light at 45 degrees, dramatic shadow triangle on cheek, high contrast chiaroscuro, one side in relative darkness",
  "Beauty Overhead":    "overhead butterfly beauty lighting, key light directly above the face, symmetrical shadows under nose and cheekbones, glamour photography quality",
  "Moody Cinema":       "cinematic low-key motivated lighting, deep shadow regions, single directional key, film noir atmosphere, selective pools of dramatic light",
  "Soft Natural":       "diffused window light quality, soft wrapping shadows, gentle gradient from highlight to shadow, clean and natural, no harsh edges",
};

// ─── CAMERA MAP: descriptive label → photography instruction ─────────────────
export const CAMERA_MAP = {
  "Editorial Wide (24mm)":  "24mm wide-angle lens, full body visible, environment context in frame, slight perspective distortion, editorial fashion spread",
  "Street Style (35mm)":    "35mm lens, 3/4 or full body crop, slight environment visible, street style editorial perspective, natural documentary feel",
  "Natural Eye (50mm)":     "50mm standard lens, true-to-life natural perspective, head-and-shoulders to 3/4 crop, how the human eye sees the subject",
  "Soft Background (85mm)": "85mm portrait lens, beautiful background compression, creamy bokeh behind subject, subject clearly isolated, classic beauty portrait",
  "Fashion Zoom (135mm)":   "135mm telephoto lens, heavily compressed background, bold subject pop, clean separation, fashion magazine close-crop",
  "Ultra Close-Up (Macro)": "100mm macro lens, extreme surface detail, ultra-shallow depth of field, every texture visible, ideal for nails/jewelry/makeup detail",
};

// ─── COLOR GRADE MAP: label → photography post-processing instruction ─────────
export const COLOR_GRADE_MAP = {
  "Kodak Portra 400":        "Kodak Portra 400 film emulation — warm organic skin tones, gentle grain structure, slightly lifted blacks, golden highlights, the definitive film stock of fashion portraiture masters; render skin with warmth and humanity",
  "Fuji Pro 400H":           "Fuji Pro 400H emulation — pastel, bright and airy color balance, slightly cool-to-neutral tones, delicate grain, skin rendering softly powdery and editorial; favored by Peter Lindbergh and Carine Roitfeld era shooters",
  "Kodak Ektar 100":         "Kodak Ektar 100 emulation — vivid saturated color, ultra-fine grain, strong contrast, deep rich blacks, maximum color depth; every garment color rendered at full saturation and clarity",
  "Cinematic Teal & Orange": "cinematic teal-and-orange Hollywood grade — skin tones pushed toward warm amber-orange, shadows tinted deep teal-cyan, high contrast split, blockbuster film atmosphere; the color science of major studio productions",
  "Bleach Bypass":           "bleach bypass silver retention process — muted and desaturated colors, dramatically increased contrast, silver sheen preserved in highlights, textures emphasised with harshness, gritty and raw fashion film aesthetic",
  "Cross Process":           "cross-process (C41 negative film developed in E6 slide chemistry) — unexpected vivid color shifts, strong cyan-green cast in shadows, orange-red lift in highlights, high saturation, distinctly experimental and avant garde fashion photography",
  "High Contrast B&W":       "Ilford HP5 Plus black and white — deep absolute black point, clean bright white highlights, visible grain structure, luminous skin rendering with dimensional shadow depth, silver gelatin darkroom print quality",
  "Gritty B&W Film":         "Kodak Tri-X 400 pushed to ISO 1600 — aggressive grain structure, high contrast, shadow detail crushed to black, highlights pushing toward blown, gritty documentary black and white, street photography and reportage aesthetic",
  "Vintage Warm":            "1970s vintage fashion photography aesthetic — warm yellowed highlights, gently faded contrast, orange-amber color cast through all tones, slightly hazy milky midtones, era-accurate analog warmth, photographic paper aging visible",
  "Nordic Matte":            "Scandinavian editorial matte — desaturated and slightly cool throughout, lifted matte blacks creating a milky shadow floor, minimal color palette, clean clinical skin rendering, quiet considered silence in every tone",
  "Matte Fade Editorial":    "editorial matte fade — lifted blacks creating milky shadow floor with no deep blacks, compressed highlights, slightly desaturated midtones, the signature grade of Vogue Paris and high-fashion editorial; every tone softened and considered",
  "Hyperreal":               "hyperreal maximum saturation color — deep absolute blacks, brilliant clipped highlights, all colors pushed 30% beyond natural saturation, aggressive and vibrant, every garment color screaming with visual impact",
  "True Life Accurate":      "accurate true-to-life color science — neutral white balance, zero grade or stylization, faithful catalog-accurate rendering, exactly what the garment looks like in real daylight; the commercial standard for product photography",
};

// ─── CAMERA FORMAT MAP: label → photography instrument instruction ────────────
export const CAMERA_FORMAT_MAP = {
  "Phase One 150MP · 80mm":  "Phase One IQ4 150MP medium format digital, 80mm Schneider-Kreuznach HR lens — the highest resolution camera system in existence, unparalleled skin and fabric detail, the camera of luxury fashion campaigns and studio masters; every pore, every thread rendered",
  "Hasselblad H6D · 100mm":  "Hasselblad H6D-100c medium format digital, 100mm HC macro lens — exquisite Swedish color science, ultra-fine 100MP resolution, the camera of choice for beauty close-ups and fine art fashion photography; tonal rendering of unmatched depth",
  "Leica M · 35mm Film":     "Leica M6 rangefinder on 35mm Kodak Portra 400 film, Summicron 35mm f/2 ASPH — analog rangefinder character, subtle natural barrel distortion, gritty film texture, documentary soul, the camera of street fashion authenticity and Cartier-Bresson",
  "Canon 1DX · 85mm":        "Canon EOS-1DX Mark III, Canon EF 85mm f/1.4L IS — razor-sharp commercial portrait rendering, beautiful circular background bokeh, the professional workhorse of fashion campaigns and beauty editorial; sharpness without harshness",
  "Nikon D6 · 135mm":        "Nikon D6 professional body, Nikkor AF-S 135mm f/1.8 telephoto — heavily compressed perspective from distance, bold subject isolation from background rendered as smooth oil paint, fashion editorial clarity and subject-background separation",
  "Sony A1 · 50mm":          "Sony Alpha 1, FE 50mm f/1.2 GM — natural human-eye perspective, clinical sharpness throughout frame, versatile editorial rendering, the standard for lifestyle and catalog photography; balanced and honest",
  "Leica SL2 · 24mm Wide":   "Leica SL2 mirrorless, Super-Vario-Elmarit 24mm f/2.8 ASPH — wide editorial sweep with full environment visible, slight natural barrel distortion adding documentary energy, signature warm Leica color rendering and character",
  "Contax 645 · 80mm Film":  "Contax 645 medium format film camera, Carl Zeiss 80mm f/2 Planar T* lens on Fuji Pro 400H — legendary analog medium format color, the famous Zeiss 3D bokeh pop visible behind subject, the camera of 1990s Vogue and Harper's BAZAAR and irreplaceable film character",
  "4x5 Large Format Film":   "4x5 inch large format film camera on tripod, 210mm Schneider Symmar-S lens — absolute maximum resolution and tonal range in photography, the camera of Richard Avedon and Irving Penn, archival fine art darkroom print quality, deliberate and slow",
  "Polaroid · Instant Film":  "Polaroid OneStep on 600 instant film — lo-fi frame borders and irregular edges, instant film color unpredictability and slight shift, edge vignetting, soft grain throughout, avant garde fashion collectible aesthetic; imperfection as design choice",
  "35mm Disposable Film":    "single-use 35mm disposable camera, fixed 28mm plastic lens — heavy grain, strong edge vignetting, color shifts and slight light leaks, authentic documentary candid energy; the raw unretouched truth of real photography",
  "Canon AE-1 · 50mm Film":  "Canon AE-1 Program on 35mm Kodak film, 50mm f/1.8 lens — warm vintage character, natural rendering, lifestyle editorial soul, timeless analog warmth and grain, photography before digital; the camera of memory",
};

// ─── SKIN TONE MAP: label → photography casting description ──────────────────
// Keyed by the UI skin-tone id (matches SKIN_TONES in the campaign builder). Previously keyed by
// capitalised labels, which never matched the lowercase id sent by the client — so every tone
// silently degraded to the bare word and the rich, racially-explicit lock never reached the model.
export const SKIN_TONE_MAP = {
  "fair":      "SKIN TONE IS FAIR — very fair light skin, peachy-pink undertones, Northern European complexion, Fitzpatrick Type I-II, minimal melanin, pale with visible flush. HEX reference: #F5CBA7. This is NON-NEGOTIABLE. Do NOT generate medium, brown, tan, or dark skin under any circumstances.",
  "porcelain": "SKIN TONE IS PORCELAIN — porcelain pale, cool ivory undertones, translucent delicate complexion, Fitzpatrick Type I, almost white with blue-pink undertone. HEX reference: #F2E8DC. This is NON-NEGOTIABLE. Do NOT generate medium, brown, tan, or dark skin under any circumstances.",
  "neutral":   "SKIN TONE IS NEUTRAL MEDIUM — balanced medium complexion with neutral undertones, Fitzpatrick Type III-IV, naturally even and radiant. HEX reference: #C49A6C.",
  "tan":       "SKIN TONE IS TAN — lightly tanned warm skin, golden sun-kissed undertones, Mediterranean warmth, Fitzpatrick Type III. HEX reference: #D4A574. This is NON-NEGOTIABLE. Do NOT generate pale, dark, or deep brown skin under any circumstances.",
  "cinnamon":  "SKIN TONE IS CINNAMON — warm cinnamon medium skin, rich amber-brown undertones, Fitzpatrick Type IV, warm luminous glow. HEX reference: #C68642. This is NON-NEGOTIABLE. Do NOT generate pale, fair, or very dark skin under any circumstances.",
  "brown":     "SKIN TONE IS BROWN — medium-to-deep brown skin, warm earthy undertones, Fitzpatrick Type IV-V, naturally radiant complexion. HEX reference: #8D5524. This is NON-NEGOTIABLE. Do NOT generate pale, fair, or fair East Asian skin under any circumstances.",
  "chocolate": "SKIN TONE IS CHOCOLATE — deep chocolate-brown skin, rich warm undertones, Fitzpatrick Type V-VI, luminous deep complexion of African heritage. HEX reference: #4A2912. This is NON-NEGOTIABLE. Do NOT generate pale, fair, tan, or medium skin under any circumstances.",
  "ebony":     "SKIN TONE IS DEEP EBONY — the deepest, darkest true blue-black ebony skin at the very darkest end of Fitzpatrick Type VI; intensely melanin-rich, profoundly dark complexion of West/Central African heritage, with luminous light absorption on near-black skin. HEX reference: #120600. This is the SINGLE MOST IMPORTANT attribute and is NON-NEGOTIABLE: the model is unmistakably a very dark-skinned Black person. Do NOT generate medium, brown, chocolate, tan, light, East Asian, or South Asian skin under ANY circumstances — if the skin is not deeply, darkly ebony it is a generation failure.",
};

// Heritage coherent with each explicitly-chosen skin tone. Aligns the model's ethnicity with the
// selected tone — otherwise a randomly-assigned heritage (e.g. East Asian) collides with the tone
// and produces a racially-incoherent model (e.g. an Asian model on a "Deep Ebony" selection).
export const SKIN_TONE_HERITAGE = {
  fair:      "Northern European (Scandinavian/British) heritage",
  porcelain: "Northern / Eastern European heritage",
  tan:       "Mediterranean / Latina heritage",
  cinnamon:  "Latina / South Asian / Middle Eastern heritage",
  brown:     "South Asian / Latina heritage",
  chocolate: "Black, of African heritage",
  ebony:     "Black, of West / Central African heritage",
};

// ─── MODEL ARCHETYPE MAP ─────────────────────────────────────────────────────
export const MODEL_ARCHETYPE_MAP = {
  "High Fashion": "MODEL ARCHETYPE: High Fashion Editorial — 5'10\"–6'1\" elongated frame, angular bone structure, sharp defined jawline, prominent cheekbones, long swan neck, narrow shoulders with unexpected strength, long limbs that create geometric shapes naturally, BMI of a runway model, proportions that make garments architectural — the epitome of what fashion houses cast for runway and campaigns. This model's body IS the fashion.",
  "Commercial":   "MODEL ARCHETYPE: Commercial — approachable relatable beauty, 5'6\"–5'9\", warm natural expression, friendly symmetrical features, healthy athletic build, the kind of beauty that makes aspirational products feel attainable — the face of a major brand campaign that speaks to everyone. Warm, confident, real.",
  "Androgynous":  "MODEL ARCHETYPE: Androgynous — strong gender-ambiguous features, sharp angular bone structure, defined brow bone, strong jaw with soft eyes, slender elongated frame, features that read as both masculine and feminine simultaneously, the kind of face that stops a room — high fashion's most coveted look. Fitzpatrick-appropriate skin.",
  "Beauty":       "MODEL ARCHETYPE: Beauty Model — face is the absolute hero, flawless symmetrical features built for close-up, perfect bone structure ideal for beauty editorial, expressive luminous eyes with architectural lashes, lips with precise natural definition, the face of a beauty campaign — every feature optimized for maximum impact in close crop.",
  "Curve Editorial": "MODEL ARCHETYPE: Curve Editorial — full-figured with high fashion sensibility, confident powerful posture, beautiful full curves rendered in high-fashion proportion, the kind of body that luxury brands are casting now — aspirational, powerful, and undeniably editorial. Full curves, proud silhouette, fashion-forward energy.",
  "Athletic":     "MODEL ARCHETYPE: Athletic — strong toned physique, visible lean muscle definition, active proportions, sports-luxury crossover energy, healthy powerful body — the model at the intersection of performance and fashion. Strong but elegant. Nike x Vogue energy.",
  "Petite":       "MODEL ARCHETYPE: Petite — 5'2\"–5'5\", perfectly proportioned smaller frame, the proportions scaled to petite but with full high-fashion sensibility and editorial command — proves that fashion has no single size template. Compact and powerful.",
  "Distinguished": "MODEL ARCHETYPE: Distinguished Mature — 45–60 years old, lived-in beauty, silver or distinguished hair, elegant confidence that can only come from decades of living, the face of Céline, Saint Laurent, and the new luxury that values wisdom — profound and aspirational in a way youth simply cannot achieve.",
};

// ─── POSE MAP ────────────────────────────────────────────────────────────────
export const POSE_MAP = {
  "Power Stand":      "POSE DIRECTION: Power Stand — weight shifted onto back leg creating natural hip asymmetry, front foot slightly forward, shoulders square and back commanding the space, chin slightly elevated with absolute confidence, arms loose at sides or one hand on hip with precision intention — authority radiates from every line of the body.",
  "Editorial Lean":   "POSE DIRECTION: Editorial Lean — body at sharp 3/4 angle to camera, one hand resting deliberately against a surface (wall, door frame, own thigh), neck long and extended, shoulders slightly dropped and relaxed, creating an S-curve through the spine — the pose that fills magazine pages.",
  "Walking Motion":   "POSE DIRECTION: Walking in Motion — body caught mid-stride with genuine kinetic energy, one foot slightly elevated, arms in natural opposing swing, garment alive with movement, hair caught in the motion — freeze a single perfect moment of actual walking. Natural, real, dynamic.",
  "Seated Drape":     "POSE DIRECTION: Seated Editorial Drape — body elegantly arranged across a surface (chair, steps, floor, ledge), limbs extended in long diagonal lines, one arm extended fully, legs positioned to create maximum garment visibility, body draped as if placed by a couture stylist — effortless but completely considered.",
  "Over Shoulder":    "POSE DIRECTION: Over-Shoulder Turn — back to camera showing full garment rear, face and neck turned back over one shoulder with sharp intensity, creating a diagonal line from foot to eyes, the look that says 'watch me leave' — elongates the neck, shows back of garment, creates narrative tension.",
  "Hands Active":     "POSE DIRECTION: Hands Active — hands engaged with purpose: both hands in hair lifting it from the neck, or one hand at collar, or hand framing face with intention, or adjusting lapel — hands tell a story and break the stiffness of posed photography. Natural, purposeful, elegant.",
  "Full Extension":   "POSE DIRECTION: Full Extension — arms raised overhead or extended dramatically outward, body fully elongated to maximum height, on tiptoes or with one leg extended, garment stretched to full silhouette, showing every design detail — maximum visual impact and garment presentation.",
  "Candid Moment":    "POSE DIRECTION: Candid Authentic Moment — mid-laugh with genuine joy, or looking away into distance in quiet thought, or caught adjusting something, zero awareness of camera — the anti-pose that creates the most human connection. Real emotion, unguarded, authentic.",
  "Contraposto":      "POSE DIRECTION: Classical Contraposto — weight on one leg creating natural hip tilt, opposing shoulder drop, gentle S-curve through spine, arm resting on the raised hip, classical sculpture energy — the pose used by Michelangelo, now in fashion photography. Timeless weight and balance.",
  "Profile Silhouette": "POSE DIRECTION: Pure Profile Silhouette — body at perfect 90° profile to camera, chin slightly elevated, one foot slightly in front of the other, arms at side or one slightly forward — the architectural silhouette that reads as pure shape. Fashion as graphic design.",
};

// ─── EXPRESSION MAP ───────────────────────────────────────────────────────────
export const EXPRESSION_MAP = {
  "Fierce":       "EXPRESSION DIRECTION: Fierce — intense direct eye contact burning into the lens, jaw slightly set, lips pressed together with controlled power, brow slightly furrowed with purpose — this expression says 'I own this' without a single word. The expression of Naomi Campbell on a Versace runway.",
  "Soft Romantic": "EXPRESSION DIRECTION: Soft Romantic — lips slightly parted as if mid-breath, gaze soft and slightly unfocused or looking just past the lens, eyes luminous and open, expression carrying quiet vulnerability and warmth — the expression of a quiet luxury campaign in evening light.",
  "Candid Joy":   "EXPRESSION DIRECTION: Candid Joy — genuine mid-laugh caught in motion, eyes crinkled with real amusement, teeth visible naturally, head slightly thrown back — the expression that feels completely real because it is. Unguarded, alive, magnetic.",
  "Cold Editorial": "EXPRESSION DIRECTION: Cold Editorial — completely neutral, unreadable, cool, detached — the classic editorial face that makes the garment the entire story. No expression IS the expression. The blank canvas of high fashion. Ice and intention.",
  "Introspective": "EXPRESSION DIRECTION: Introspective — eyes slightly cast down or to the side as if in private thought, lips closed in quiet contemplation, the expression of someone living in their own beautiful world — creates narrative mystery and invites the viewer into a story.",
  "Sensual":      "EXPRESSION DIRECTION: Sensual — heavy-lidded soft eyes, lips barely parted, chin slightly down, gaze directed upward at lens — quiet smoldering energy, the expression of luxury perfume campaigns and evening wear.",
  "Confident Direct": "EXPRESSION DIRECTION: Confident Direct — eyes locked onto lens with absolute self-assurance, natural relaxed lips, the expression of someone who needs nothing from the viewer — pure confident presence. The expression that makes billboard campaigns.",
};

// ─── AGE RANGE MAP ────────────────────────────────────────────────────────────
export const AGE_RANGE_MAP = {
  "Emerging (18–24)":    "AGE IS 18–24 YEARS OLD [NON-NEGOTIABLE — DO NOT GENERATE ANYONE OLDER]: Young adult, 18 to 24 years old, smooth unlined skin with zero wrinkles, bright luminous eyes, fresh youthful facial structure. Face has no visible aging markers. Fitzpatrick-smooth texture. This is a mandatory casting directive — if you generate a model older than 24 you have failed the brief.",
  "Prime Editorial (25–35)": "AGE IS 25–35 YEARS OLD [NON-NEGOTIABLE — DO NOT GENERATE ANYONE OUTSIDE THIS RANGE]: Adult in peak editorial range, 25 to 35 years old, features fully formed and confident, minimal to no visible aging lines, the ideal high fashion model age. Face has full definition without age markers. This is a mandatory casting directive.",
  "Established (35–45)": "AGE IS 35–45 YEARS OLD [NON-NEGOTIABLE — DO NOT GENERATE ANYONE OUTSIDE THIS RANGE]: Mature adult, 35 to 45 years old, subtle fine lines beginning at the eyes and expression lines at the mouth, face shows beautiful character development without deep wrinkles. Not young, not elderly — distinguished prime. This is a mandatory casting directive — if you generate a 20-year-old you have failed the brief.",
  "Mature Luxury (45–55)": "AGE IS 45–55 YEARS OLD [NON-NEGOTIABLE — DO NOT GENERATE ANYONE YOUNGER]: Mature distinguished adult, 45 to 55 years old, visible fine lines and laugh lines, grey or silver beginning to show in hair, the commanding presence of midlife authority. Face shows real age — crow's feet, forehead lines, neck texture beginning. NOT a young model. NOT a 30-year-old. A genuinely middle-aged face with beauty and authority. Céline, Saint Laurent, Bottega Veneta campaign casting. This is a mandatory casting directive.",
  "Distinguished (55+)": "AGE IS 55+ YEARS OLD [NON-NEGOTIABLE — DO NOT GENERATE ANYONE YOUNGER THAN 55]: Senior distinguished adult, 55 years old or older, silver or white hair, deep expression lines, pronounced laugh lines, visible neck and eye area aging. This is a genuinely older person with profound beauty — NOT a young person with grey hair, NOT a 40-year-old — a truly senior face with decades of living visible. The fastest growing luxury segment. Radiating wisdom and absolute confidence. This is a mandatory casting directive — generating a young model is a critical failure.",
};

// ─── SHOT TYPE MAP ────────────────────────────────────────────────────────────
export const SHOT_TYPE_MAP = {
  "Full Body":     "SHOT TYPE: Full Body — head to toe fully visible, entire figure from crown to feet, complete garment presentation from collar to hem to shoe, the entire story of the look told in one frame. No cropping of feet or ankles.",
  "3/4 Body":      "SHOT TYPE: Three-Quarter Body — head to mid-thigh crop, the most common fashion editorial framing — shows garment from top to thigh with slight environmental context, intimate without being a headshot.",
  "Waist Up":      "SHOT TYPE: Waist Up — head to hip crop, torso fully visible, ideal for tops, jackets, and accessories — close enough to show garment detail, wide enough to show silhouette.",
  "Portrait":      "SHOT TYPE: Editorial Portrait — head and shoulders or chest-up, face is primary, hair architecture fully visible, collar and neckline of garment visible — the portrait that reveals personality.",
  "Beauty Close":  "SHOT TYPE: Beauty Close-Up — face from crown to chin only, makeup, skin, and feature detail is the entire subject — pores, lashes, lips rendered at maximum resolution. The face fills the frame.",
  "Detail Shot":   "SHOT TYPE: Detail Shot — extreme close crop on a specific garment element: the texture of a fabric, embellishment, button, seam, print pattern — fashion as texture and craftsmanship. The garment as fine art object.",
  "Environmental Scale": "SHOT TYPE: Environmental Scale — model appears relatively small within a large dramatic environment, architecture or landscape dwarfs the figure, showing the full grandeur of location — the fashion editorial as travel photography.",
};

// ─── ATMOSPHERE MAP ───────────────────────────────────────────────────────────
export const ATMOSPHERE_MAP = {
  "Golden Hour":   "ATMOSPHERE: Golden Hour — warm low sun at 10–20° above horizon, long directional shadows, amber-gold light wrapping every surface, magic-hour quality that transforms any location into a dream — the most beautiful light in photography.",
  "Overcast Soft": "ATMOSPHERE: Overcast — flat diffused white sky acting as a giant softbox, no shadows, even light on all surfaces, colors rendered accurately without shadow distortion — the lighting that fashion photographers secretly prefer for color accuracy.",
  "Blue Hour":     "ATMOSPHERE: Blue Hour — 20 minutes after sunset, deep blue sky that holds last light, warm artificial lights beginning to glow, cool-to-warm color contrast, cinematic urban twilight — the most cinematic light possible.",
  "Harsh Midday":  "ATMOSPHERE: Harsh Midday — direct overhead sun creating strong shadow pools beneath nose and brow, high contrast, bleached highlights, raw and unforgiving light that creates avant-garde edge — the light no one books but everyone remembers.",
  "Misty Rain":    "ATMOSPHERE: Misty Rain — wet surfaces reflecting light, light mist in the air softening backgrounds, rain-slicked ground creating reflections, moody atmospheric depth, the romanticism of rain on fashion — Paris in November.",
  "Dramatic Storm": "ATMOSPHERE: Pre-Storm Drama — dark brooding sky, high contrast between lit subject and dark clouds, charged electric atmosphere, urgent energy — fashion against the force of nature.",
  "Snow Winter":   "ATMOSPHERE: Winter Snow — cold blue-white light, snow on all surfaces, breath possibly visible, sharp cold air quality to the light, winter luxury energy — Aspen, alpine, the cold that makes fur and wool sublime.",
  "Heat Haze":     "ATMOSPHERE: Desert Heat — harsh bleaching midday sun, heat shimmer visible in background, bleached warm light, the unforgiving beauty of extreme heat — Morocco, Jordan, Namibia.",
};

// ─── STYLING MAP ──────────────────────────────────────────────────────────────
export const STYLING_MAP = {
  "Minimal Clean":    "STYLING DIRECTION: Minimal — no accessories, clean hair pulled back or simply worn, garment as the singular focus, the quiet luxury of nothing extra — Jil Sander, The Row, Lemaire. Let the garment breathe.",
  "Full Editorial":   "STYLING DIRECTION: Full Editorial Styling — jewelry layered with intention, hair architecturally styled, makeup fully considered, accessories chosen to complete the narrative — styled as if by Lori Goldstein for a Vogue cover. Every detail considered.",
  "Street Cast":      "STYLING DIRECTION: Street Cast Raw — intentionally undone, imperfect, natural — hair with real texture and movement, minimal makeup revealing real skin, accessories worn as the model would choose them personally, the anti-styling that takes more skill than perfect styling.",
  "Luxury Campaign":  "STYLING DIRECTION: Luxury Campaign Polish — every single element considered and perfect, hair flawless in its intention, makeup enhancing without masking, accessories are status objects chosen with curatorial precision — the standard of a Chanel or Dior global campaign. Not a single element is accidental.",
  "Sport Luxe":       "STYLING DIRECTION: Sport Luxe — athletic wear elevated with luxury accessories, clean minimalist approach, fresh natural makeup, hair natural or in clean athletic style — the intersection of performance and luxury that defines a decade of fashion.",
};

// ─── GENDER MAP ───────────────────────────────────────────────────────────────
export const GENDER_MAP = {
  "Female": "SUBJECT GENDER IS FEMALE [NON-NEGOTIABLE]: The model is a woman — feminine facial bone structure, feminine body proportions, feminine presentation. Do NOT generate a male or androgynous model. Definitively female.",
  "Male":   "SUBJECT GENDER IS MALE [NON-NEGOTIABLE]: The model is a man — masculine jawline, masculine brow ridge, masculine body proportions, masculine presentation. Do NOT generate a female or androgynous model. Definitively male.",
  "Unisex (Androgynous)": "SUBJECT GENDER IS ANDROGYNOUS [NON-NEGOTIABLE]: The model presents as intentionally gender-ambiguous — sharp angular features that read both masculine and feminine simultaneously, slender androgynous body frame, no strong gender markers, the deliberately non-binary aesthetic of high fashion. Think: Sasha Velour, Hari Nef, the editorial androgyny of Saint Laurent runway. Intentionally between male and female.",
};

// ─── VARIATION MODIFIERS — injected per generation to ensure uniqueness ───────
export const VARIATION_SEEDS = [
  "weight on left leg, right shoulder very slightly dropped",
  "chin turned 3 degrees right of lens, eyes looking directly at lens",
  "slight natural breath visible in parted lips",
  "one strand of hair across forehead from movement",
  "fingers of right hand gently curled, left hand open",
  "body at 5 degrees more profile than standard",
  "eyebrows in their natural resting position, fully relaxed",
  "slight natural shadows under lower lashes from real depth",
  "shoulders at their natural unposed level, not consciously held",
  "caught at the precise top of an exhale",
  "eyes with very slight asymmetry matching natural human variation",
  "natural micro-crinkle at outer eye corners from genuine gaze",
  "collar settling naturally from slight movement",
  "arm hanging at completely natural gravity angle",
  "weight distributed 60/40 between feet, subtle hip consequence",
  "jaw at natural relaxed angle, not consciously set",
  "one eyebrow very fractionally higher than the other — natural human asymmetry",
  "slight natural light catch on lip gloss from environment",
  "hair with genuine volume and direction from real gravity",
  "fingers at their natural resting length and curl",
];

// ─── MASTER PHOTOGRAPHY DIRECTIONS ───────────────────────────────────────────
// 9 world-class photographic archetypes. Each slot in the 9-grid gets one direction,
// producing a full editorial spread instead of 9 variations of the same vibe.
export const MASTER_PHOTOGRAPHY_DIRECTIONS = [
  {
    id:          'HIGH_FASHION_EDITORIAL',
    name:        'High Fashion Editorial',
    publication: 'Vogue, i-D, Dazed & Confused',
    aesthetic:   'Extreme editorial tension. Architectural pose. Luxury couture energy. Fashion as power.',
    lighting:    'dramatic Rembrandt-split single key light from 45° camera-left, deep amber fill barely visible from right, high-contrast chiaroscuro — one cheek sculpted in shadow, zero frontal fill, dark and moody atmosphere, Peter Lindbergh and Helmut Newton influence',
    color_grade: 'desaturated midtones with preserved shadow depth, pushed skin highlights, cross-process finish: cyan cast in deep shadows, antique gold in highlights, visible 400-ISO film grain texture, analog halation on skin edges',
    posing:      'extreme angular architecture — one arm extended sharply away from body, torso twisted hard at waist, chin sharply elevated, body creating maximum geometric tension, strong silhouette, zero softness or relaxation anywhere in the frame',
    composition: 'asymmetric — subject occupies 60% of frame, heavy negative space on opposite side, slight below-eye-level camera angle, unconventional slight Dutch tilt adding editorial dissonance',
    camera_note: '50mm Leica M aesthetic — natural perspective, slight shallow depth of field, full body or strong 3/4 crop, peripheral environment visible at edges of frame',
    post:        'visible film grain, blacks crushed to near-pure, skin halation, analog texture throughout — the tactile quality of a silver gelatin darkroom print',
  },
  {
    id:          'LUXURY_BRAND_CAMPAIGN',
    name:        'Luxury Brand Campaign',
    publication: 'Chanel, Dior, Givenchy, Louis Vuitton global campaign',
    aesthetic:   'Polished, aspirational, commanding. Commercial-perfect yet undeniably fashion-forward. Billboard power.',
    lighting:    'large beauty-dish overhead key light, twin soft fill panels flanking subject on each side, gentle rim kicker separation from behind, perfect butterfly shadow under nose — maximally flattering, even skin rendering with dimensional depth, commercial fashion lighting at its finest',
    color_grade: 'rich saturated color science, warm neutral white balance, skin luminosity maximized with healthy glow, ultra-clean with high-end magazine sharpness, slight warm vignette pulling focus to subject, controlled highlights, deep shadow detail retained',
    posing:      'commanding frontal power stance — direct eye contact with lens, shoulders back, absolute confidence, one hand on hip with precise intention, other arm extended or composed — poses that convey "I own this room"',
    composition: 'centered power composition — subject fills 75% of frame height, slight breathing room above crown, clean minimal negative space, billboard-ready framing — designed to read at 10 feet and 10 inches',
    camera_note: '85mm Phase One aesthetic — razor-sharp critical focus on eyes, very slight background bokeh, every garment detail tack-sharp, clinical precision',
    post:        'zero grain, ultra-clean commercial retouching with natural pore retention, perfect color balance, open shadows, controlled highlights — the retouching standard of a major fashion house global campaign',
  },
  {
    id:          'STREET_STYLE_CANDID',
    name:        'Street Fashion',
    publication: 'The Sartorialist, Hypebeast, Highsnobiety, i-D Street Report',
    aesthetic:   'Candid urban energy. Real. Effortless. Luxury living on the street. Documentary truth.',
    lighting:    'natural overcast urban daylight or golden-hour streetlight — directional side light from a gap between buildings, slight environmental bounce from concrete or glass facade, zero artificial fill, the imperfect beauty of real outdoor light',
    color_grade: 'warm film emulation — Kodak Portra 400 character, gentle grain, lifted blacks, skin warmth fully preserved, slight yellow-green in shadow zones, the honest color truth of documentary photography',
    posing:      'mid-stride walking freeze — body caught in genuine motion, one foot slightly lifted, arms swinging naturally, eyes forward or glancing sideways — zero awareness of camera, the subject is living their life and we captured it',
    composition: 'rule of thirds, environment actively participates — urban architecture, concrete, cobblestones, glass facades visible around subject, 35mm street framing, documentary energy, slight environmental imperfection adds authenticity',
    camera_note: '35mm street photography perspective — gritty natural angle, slight motion blur on swinging garment or hair suggesting real movement, imperfect edges, environmental truth',
    post:        'visible fine film grain, slight chromatic aberration at edges, matte blacks, real shadow detail, slight lens warmth — the complete opposite of a retouched studio shot, tactile and real',
  },
  {
    id:          'AVANT_GARDE_COUTURE',
    name:        'Avant Garde Couture',
    publication: 'Tim Walker for British Vogue, Nick Knight, AnOther Magazine, System Magazine',
    aesthetic:   'Art-house fashion. Conceptual. Surrealist edge. Fashion as sculpture. Unexpected beauty that challenges convention.',
    lighting:    'mixed colored gels — deep magenta or violet rim from camera-right, electric blue or teal from camera-left, split-tone colored subject against near-black background, OR single extreme backlight creating silhouette with ethereal glow halo, drama is mandatory',
    color_grade: 'hyper-stylized color — vivid unexpected palette, strong split toning between warm and cool zones, saturated colored light on skin, high contrast, cinematic and otherworldly — this image should feel like entering a different dimension',
    posing:      'extreme and unexpected — body arched dramatically backward at impossible angle, or arms forming geometric shapes at sharp angles, or extreme profile creating sculptural silhouette, or contorted in a way that reads as living sculpture — zero conventional model poses',
    composition: 'rule-breaking — subject placed at extreme frame edge, or shot from directly above (aerial bird-eye), or extreme close crop on an unexpected body part, or deliberately unbalanced and uncomfortable — makes the viewer question the frame itself',
    camera_note: '28mm wide-angle with intentional edge distortion adding surreal quality, OR extreme macro on one unexpected element — perspective that transforms fashion into fine art',
    post:        'heavy cinematic color grade, potential double-exposure or solarization, aggressive shadow crushing, strong contrast, deliberate analog damage aesthetic — this image is ART first, fashion second',
  },
  {
    id:          'BEAUTY_EDITORIAL',
    name:        'Vogue Beauty Editorial',
    publication: "Vogue Beauty, Harper's BAZAAR Beauty, Allure",
    aesthetic:   'Pure beauty. Luminous intimacy. Every pore and pigment a universe. The face as the ultimate fashion accessory.',
    lighting:    'overhead butterfly key light positioned directly above and in front of face at 45° angle, creating perfectly symmetrical butterfly shadow beneath nose and defining cheekbones, two large white reflector panels flanking face for soft fill, gentle separate kicker from behind — the quintessential beauty photography lighting setup',
    color_grade: 'ultra-clean accurate color rendering with no stylization, warm white balance, skin luminosity maximized — subsurface scattering visible, dewy and alive, healthy glow without digital enhancement, true-to-life beauty color science',
    posing:      'extreme beauty crop from crown to collarbone, face front-on or precise 45° angle, gaze burns directly into lens with absolute intensity, lips slightly parted in quiet breath OR pressed firmly together with quiet intention — minimal body movement, face is the event',
    composition: 'headshot to chest-up only, face precisely centered or placed at classic beauty compositional point, butterfly symmetry reinforced by framing, the makeup / jewelry / hair architecture fills the frame as the hero',
    camera_note: '100mm macro or 85mm portrait at wide aperture — paper-thin depth of field, absolute critical focus on eyes and lashes, skin pore texture rendered with architectural precision',
    post:        'high-end beauty retouching at frequency separation level — pore structure preserved, no plastic skin, luminosity built through dodge-and-burn not digital filter, the gold standard of beauty editorial retouching',
  },
  {
    id:          'LIFESTYLE_EDITORIAL',
    name:        'Lifestyle Editorial',
    publication: 'Kinfolk, Aritzia, COS, Reformation, & Other Stories, Cereal',
    aesthetic:   'Natural, warm, aspirational. Luxury through ease, not formality. The fashion of living beautifully.',
    lighting:    'golden-hour window light flooding in from one direction, or dappled outdoor light through foliage, directional and warm, gentle environmental bounce from a light wall or natural reflector — what photographers call the light of God, impossible to replicate in studio',
    color_grade: 'warm analog film stock emulation — Lightroom Moody Warm preset or VSCO A4 character, lifted blacks, golden highlights, natural honest skin rendering, the organic warmth of 35mm film shot on a sunny afternoon',
    posing:      'candid, relaxed, authentically human — looking away from camera with quiet focus, slight natural smile, body in natural rest: weight on one hip, leaning against warm textured wall, seated with legs extended, sitting on steps — the pose says "this is just my life"',
    composition: 'lifestyle context — subject lives inside a beautiful space: light-flooded room with texture, garden with dappled sun, market with color, architectural interior with warmth, natural landscape with scale — the environment is 40% of the story',
    camera_note: '50mm or 35mm natural human perspective, slight natural background bokeh from real depth, nothing forced or over-engineered, snapshot quality executed with professional mastery',
    post:        'airy and warm, lifted exposure, soft blacks, golden color balance, subtle grain from a real film aesthetic — sun flare or lens warmth may be visible, the kind of image that makes you want to book a flight',
  },
  {
    id:          'FINE_ART_PORTRAIT',
    name:        'Fine Art Portrait',
    publication: 'Annie Leibovitz, Gregory Crewdson, Museum of Modern Art',
    aesthetic:   'Painterly, contemplative, museum-worthy. Fashion as fine art. The body as canvas.',
    lighting:    "Rembrandt lighting — single dramatic key from 45° above camera-left, creating the signature triangular highlight on the shadow cheek, deep dimensional pools of shadow, chiaroscuro worthy of Caravaggio or Vermeer, directional and intentional as a painter's brush",
    color_grade: 'rich tonal range — deep shadows that hold full detail, warm mid-tones with dimensional depth, controlled highlights that never blow, selective desaturation toward neutral tones with reserved color in the hero garment, the warmth and depth of a silver gelatin darkroom print',
    posing:      'still, composed, contemplative — subject looks slightly away from camera in precise three-quarter profile as if in private thought, body positioned with classical triangular geometry, serene but powerful, body language suggesting vast interiority',
    composition: "classical painting geometry — triangular form of subject's body, rule of thirds with environmental negative space used meaningfully, figure in space like a master painting, the background tells as much story as the subject",
    camera_note: '85mm portrait with slight depth of field creating sharp subject against softly rendered background, classical portrait perspective untouched by trend',
    post:        'film photography quality — the tonal range and depth of a fine art darkroom print, no digital harshness, luminous skin with complete shadow detail preserved, the physical texture of photographic paper',
  },
  {
    id:          'FASHION_MAGAZINE_SPREAD',
    name:        'Fashion Magazine Spread',
    publication: "Harper's BAZAAR, Elle, Marie Claire, Town & Country center spread",
    aesthetic:   'Story-driven editorial narrative. Fashion characters in a scene. The spread that stops you mid-flip.',
    lighting:    'cinematic mixed motivated lighting — primary source from environment (window spill, lamp warmth, evening streetlight) plus gentle ambient fill that flatters without dominating, light tells the story of the environment, naturalistic enhanced',
    color_grade: 'editorial cinematic grade — rich and considered, every color chosen with intention, warm-to-cool split toning common to fashion film and high-end editorial, season-appropriate color story that sets a mood',
    posing:      'movement-forward editorial — clothes alive in motion, hair caught mid-swing, subject mid-transition: walking fast, turning back with drama, reaching for something unseen, twirling, the precise moment between two actions',
    composition: 'double-page magazine spread energy — horizontal editorial sweep, subject full-figure within a beautiful environment, location as active character, the shot has narrative — someone could write three paragraphs about this image',
    camera_note: '24mm wide editorial lens — environment and figure given equal visual weight, slight dynamic energy at edges, cinematic and story-forward, captures the world the model inhabits',
    post:        "editorial magazine standard: rich color, sharp but warm retouching, fashion-forward without surrealism, balanced retouching that enhances without erasing, the quality of the Harper's BAZAAR center spread",
  },
  {
    id:          'LUXURY_CATALOG',
    name:        'Luxury E-Commerce Catalog',
    publication: 'Net-a-Porter, Matches Fashion, Ssense, Mr Porter, MatchesFashion',
    aesthetic:   'Clean, commercial, ultimate clarity. Product as undisputed hero. Purchase-ready perfection.',
    lighting:    'perfected high-key three-point studio setup: large 4x6ft softbox main at 45° camera-left, matching fill panel camera-right, gentle kicker from behind — maximally flattering, zero harsh shadow, every garment detail readable, commercial fashion lighting perfected',
    color_grade: 'clean true-to-life accurate color science — garment colors render exactly as they appear in physical reality, neutral white balance, slight brightness lift, zero stylization or color grade — what you see is what you buy',
    posing:      'clean confident catalog pose — model standing at slight 3/4 angle toward camera or frontal, hands at sides or one hand on hip, outfit fully visible from head to toe, confident but approachable, nothing extreme',
    composition: 'full body or 3/4 body centered in frame, white or very light neutral seamless background, slight drop shadow below feet for dimension, garment 100% visible — every design detail, every seam, inspectable at high zoom',
    camera_note: '50mm standard lens at f/8 equivalent depth of field — focus sharp from crown to sole, nothing soft or shallow, total product clarity, commercial precision',
    post:        'clean commercial retouching: true-to-life color, no stylization, garment fabric and texture detail maximum clarity, natural skin with appropriate retouching, every image should make the viewer reach for their wallet',
  },
];
