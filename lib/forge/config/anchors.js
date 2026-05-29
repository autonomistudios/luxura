/**
 * lib/forge/config/anchors.js
 * Anchor readable names, DNA extraction prompts, and fidelity enforcement phrases.
 * Pure data — no logic, no imports.
 */

// ─── ANCHOR READABLE NAMES ───────────────────────────────────────────────────
export const ANCHOR_LABELS = {
  // Core beauty
  HAIR:        "hairstyle",
  BARBER:      "barbered fade and cut",
  NAILS:       "nail art design",
  MAKEUP:      "makeup application",
  // Clothing
  SHIRT:       "shirt or blouse design",
  PANTS:       "pants or trousers design",
  SHORTS:      "shorts design",
  SWIMWEAR:    "swimwear design",
  DRESS:       "dress or gown design",
  HAT:         "hat or headwear",
  FULL_OUTFIT: "complete outfit ensemble",
  // Accessories
  BELT:        "belt design",
  SHOES:       "footwear design",
  EARRINGS:    "earring design",
  NECKLACE:    "necklace design",
  BRACELET:    "bracelet design",
  WATCH:       "watch design",
  RING:        "ring design",
};

// ─── ANCHOR-SPECIFIC DNA EXTRACTION PROMPTS ──────────────────────────────────
export const DNA_EXTRACTION_PROMPTS = {

  HAIR: `FORENSIC HAIR ANALYST — Extract HAIR schematic ONLY.
1. SILHOUETTE: Exact shape, volume, height, and perimeter of the hairstyle.
2. LENGTH: Measurements at crown, sides, back. Any graduation or layers.
3. TEXTURE: Curl pattern (straight/wavy/coily/kinky), strand thickness, density, surface finish.
4. COLOR: Base color(s), highlights, lowlights, ombre gradient, root depth, tonal variation. Be precise (e.g. "honey blonde highlights over dark brown base with 2 inches of root growth").
5. STYLING: Blow-dry direction, part placement, pinning, slick-back, any accessories.
6. FRINGE: Bang type, length, and positioning if present.
OUTPUT ONLY the hair's architectural DNA. All other body/face features are [FORBIDDEN].`,

  BARBER: `FORENSIC BARBER ANALYST — Extract CUT/FADE schematic ONLY.
1. FADE TYPE: High/mid/low/skin fade. Exact taper graduation and skin-to-hair transition.
2. TOP STRUCTURE: Length on top, texture style (textured/slicked/curly/loc'd), direction.
3. LINEUP: Temple edge angle, neckline shape (rounded/squared/tapered), sideburn cut.
4. BLEND ZONE: Gradient precision — how many guard lengths used in transition.
5. DESIGN ELEMENTS: Razor parts, patterns, hard lines, designs cut in.
OUTPUT ONLY the cut's geometric DNA. All face/skin/body features are [FORBIDDEN].`,

  NAILS: `FORENSIC NAIL ANALYST — Extract NAIL ART schematic ONLY.
1. SHAPE: Nail shape (square/squoval/round/oval/almond/coffin/stiletto/lipstick) and length in mm approximate.
2. BASE: Exact base color(s), finish (matte/glossy/chrome/gel/dip/acrylic), any gradient.
3. ART DESIGN: Patterns, florals, gems/crystals, foil, decals, stamps, freehand art, 3D elements. Per nail if different.
4. ACCENT NAILS: Any nails with unique or differentiated designs — specify which finger(s).
5. FINISH: Overall topcoat effect, shimmer, holographic, magnetic effect if present.
OUTPUT ONLY the nail design DNA. All hand/skin/face features are [FORBIDDEN].`,

  MAKEUP: `FORENSIC MAKEUP ANALYST — Extract MAKEUP APPLICATION schematic ONLY.
1. BASE: Coverage level, foundation finish (dewy/matte/satin/natural), visible skin prep.
2. EYES: Shadow colors and placement zones, blending technique, liner style and placement, lash type (natural/dramatic/graphic), brow shape and fill method.
3. LIPS: Liner placement, lip color, finish (matte/gloss/satin), any overdraw or ombre.
4. CONTOUR/SCULPT: Cheekbone definition, nose contour, jawline shadow placement.
5. HIGHLIGHT: Placement points (cheekbone, nose bridge, cupid's bow, inner corners).
6. BLUSH/BRONZER: Color, placement technique (draping/apple/sculpt), intensity.
7. OVERALL AESTHETIC: Name the style (editorial/old Hollywood glam/natural/avant-garde/graphic/smoky/etc.).
OUTPUT ONLY the makeup artistry DNA. Natural face structure and skin tone are [FORBIDDEN].`,

  SHIRT: `FORENSIC GARMENT ANALYST — Extract SHIRT or BLOUSE schematic ONLY.
1. CATEGORY: Shirt, blouse, button-down, crop top, tank, bodysuit, tee — specify exactly.
2. COLLAR: Collar style (no collar/crew/v-neck/button-down/mandarin/collar/cowl/off-shoulder). Shape and size.
3. SLEEVES: Sleeve length (sleeveless/cap/short/3-quarter/long), cuff style, any volume or detail.
4. FIT: Body silhouette (oversized/relaxed/fitted/cropped/boxy/draped).
5. FABRIC/MATERIAL: Type (silk/cotton/linen/satin/knit/velvet/chiffon/denim), texture, and sheen.
6. PATTERN & PRINT: [CRITICAL] Describe every print, pattern, stripe, logo, floral, or graphic. Note the scale (micro/macro), repetition, and colors of the print. If there is embroidery or lace, describe the intricate weave precisely.
7. STATEMENT EMBELLISHMENTS: [HIGH PRIORITY] Identify any 3D structural or decorative elements on this garment: bows (size, position, color), ruffle or frill clusters (at collar/cuffs/hem), 3D floral appliqués, beaded or sequin embellishment zones, embroidery patches, pintuck or smocking details, or any element that protrudes from or decorates the fabric surface. State POSITION (collar/chest/cuffs/hem/back), SIZE, COLOR, and MATERIAL of each. If none present, state "No statement embellishments."
8. PRIMARY COLORS: Exact base and secondary colors.
9. DETAILS: Buttons, zippers, ties, hardware, ruffles, cut-outs.
OUTPUT ONLY the shirt/blouse design DNA. Model face/body/other clothing are [FORBIDDEN].`,

  PANTS: `FORENSIC GARMENT ANALYST — Extract PANTS or TROUSERS schematic ONLY.
1. CATEGORY: Trousers, jeans, leggings, slacks, joggers, cargo, palazzo — specify.
2. RISE: Low/mid/high rise waistband placement.
3. FIT: Silhouette (skinny/straight/wide-leg/flared/tapered/relaxed/bootcut).
4. LENGTH: Ankle/cropped/midi/floor — approximate inseam impression.
5. FABRIC: Material type, texture, weight, stretch, and any distressing/wash.
6. PATTERN & WASH: [CRITICAL] Describe any plaid, stripe, floral, or graphic print. For denim, describe the specific wash, fading, whiskers, and distressing patterns.
7. STATEMENT EMBELLISHMENTS: Identify any structural decorative elements: embroidery zones (position, motif, colors), large logo or graphic patches, sequin or crystal zones, contrast panels, or stripe tape. If none, state "No statement embellishments."
8. PRIMARY COLORS: Exact base tones.
9. DETAILS: Waistband style, belt loops, pockets, seams, cuffs, embroidery, hardware.
OUTPUT ONLY the pants/trousers design DNA. Model torso/face/other clothing are [FORBIDDEN].`,

  SHORTS: `FORENSIC GARMENT ANALYST — Extract SHORTS schematic ONLY.
1. CATEGORY: Denim cutoffs, athletic, tailored, bike shorts, board shorts, bermuda — specify.
2. LENGTH: Micro/mid-thigh/knee-length/bermuda. Approximate inseam.
3. FIT: Silhouette (skin-tight/fitted/relaxed/wide-leg).
4. WAISTBAND: Style, elastic/belted/button, rise.
5. FABRIC: Material type, texture, stretch level.
6. PATTERN & PRINT: [CRITICAL] Describe the print, stripe, or embroidery precisely. Note the color repetition and scale.
7. STATEMENT EMBELLISHMENTS: Identify any decorative structural elements: embroidery, patches, sequin zones, fringe at hem, contrast taping. If none, state "No statement embellishments."
8. PRIMARY COLORS: Exact base color tones.
9. DETAILS: Pockets, cuffs/hems, embellishments, hardware, side slits.
OUTPUT ONLY the shorts design DNA. Model legs/torso/face are [FORBIDDEN].`,

  SWIMWEAR: `FORENSIC GARMENT ANALYST — Extract SWIMWEAR schematic ONLY.
1. STYLE: One-piece/two-piece bikini/monokini/tankini/swim trunks/board shorts — specify exactly.
2. TOP (if applicable): Bikini top style (triangle/bandeau/halter/underwire/bralette), strap style, coverage level.
3. BOTTOM (if applicable): Brief/high-cut/mid/full coverage, side tie/fixed.
4. SILHOUETTE: Overall body coverage and cut.
5. FABRIC: Material (lycra/neoprene/crochet/mesh/metallic), texture, and stretch.
6. PATTERN & PRINT: [CRITICAL] Describe the print (e.g., tropical, animal print, geometric). Note the scale and exact colors within the pattern. If it is a solid color, identify the precise tone and finish (matte/shimmer/ribbed).
7. STATEMENT EMBELLISHMENTS: [HIGH PRIORITY] Identify any decorative structural elements: 3D florals, bows, ruffle clusters, cutout arrangements, metal hardware (rings, chains, clasps — describe shape and finish), sequin or crystal embellishment zones, or tie details that form a visual statement. State POSITION, SIZE, COLOR, and MATERIAL.
8. DETAILS: Hardware, rings, ties, logo, cutouts, ruching.
OUTPUT ONLY the swimwear design DNA. Model body/face features are [FORBIDDEN].`,

  HAT: `FORENSIC ACCESSORY ANALYST — Extract HAT or HEADWEAR schematic ONLY.
1. STYLE: Baseball cap/beanie/fedora/bucket hat/beret/snapback/wide-brim/turban/headband — specify exactly.
2. STRUCTURE: Crown height and shape (flat/structured/slouchy/tall).
3. BRIM: Brim presence, width, shape (flat/curved/floppy), and angle.
4. MATERIAL: Fabric type (wool/cotton/straw/leather/knit/denim/satin), texture.
5. COLOR & PATTERN: Exact color, pattern, colorblocking.
6. STATEMENT EMBELLISHMENTS: [HIGH PRIORITY] Identify any decorative elements on the hat: feathers (color, position, size, directionality), 3D florals or bows, pins, badges, veiling, chains, or ribbon details. State POSITION on hat (crown/brim/band/side), SIZE, COLOR, and MATERIAL. These define the hat's identity.
7. DETAILS: Logo, embroidery, pins, branding, closures, sizing adjustment, brim color contrast.
OUTPUT ONLY the hat/headwear DNA. Hair, face, and body are [FORBIDDEN].`,

  DRESS: `FORENSIC GARMENT ANALYST — Extract DRESS or GOWN schematic ONLY.
[CRITICAL]: IGNORE MANNEQUINS, STANDS, HANGERS, AND MODELS. Describe only the garment itself.
1. SILHOUETTE: Full-length, midi, mini, ballgown, sheath, wrap, shift — specify exactly.
2. NECKLINE: V-neck, sweetheart, halter, cowl, plunging, crew — specify shape.
3. SLEEVES: Cap, flutter, long, sleeveless, spaghetti strap — describe the arm coverage.
4. FABRIC & DRAPE: [CRITICAL] Describe the fabric (satin, chiffon, velvet, lace) and how it flows, pleats, or ruffles.
5. PATTERN & PRINT: [CRITICAL] Describe the repeating pattern, print motif, scale, and every color with pixel-level precision.
6. STATEMENT EMBELLISHMENTS: [HIGHEST PRIORITY — NON-NEGOTIABLE] Identify and describe every 3D structural element attached to the dress. This includes: feathers (describe color, placement on garment e.g. "large single ivory feather centered on chest bodice at mid-bust", size, directionality, plume density), 3D floral appliqués, bows (size, placement, material), ruffle clusters, crystal or sequin embellishment zones, pom-poms, pleated sculptural details, or any element that protrudes from the fabric surface. These are the garment's identity — they MUST be described precisely even if small. State the POSITION on the garment body (bodice/hem/shoulder/neckline/sleeve/waist), approximate SIZE, COLOR, and MATERIAL of each embellishment.
[NO HALLUCINATIONS]: Do not describe any ribbons, side pieces, or accessories not clearly visible in the source. Do not assume design details.
7. PRIMARY COLORS: Exact base and secondary colors.
8. HARDWARE & CLOSURES: Belt, buttons, zippers, slits, lace-up details.
OUTPUT ONLY the dress/gown design DNA. Model face/body/mannequin/other clothing are [FORBIDDEN].`,

  FULL_OUTFIT: `FORENSIC GARMENT ANALYST — Extract FULL OUTFIT ENSEMBLE schematic.
[ABSOLUTE LOCK]: IGNORE MODELS, MANNEQUINS, AND STUDIO PROPS. Focus exclusively on CLOTHING.
1. TOP PIECE: Describe the top garment (see shirt/blouse protocol) with all details.
2. BOTTOM PIECE: Describe the bottom garment or full-length piece with all details.
3. LAYERING: Any jacket, coat, vest, blazer, or overlay — describe each layer.
4. PATTERN & FABRIC HARMONY: [CRITICAL] Describe repeating patterns, print scale, and fabric weave with 100% fidelity. Do not simplify prints.
[NO HALLUCINATIONS]: Do not add or assume ribbons, side panels, or fasteners. Describe ONLY what is physically present on the garment.
5. STATEMENT EMBELLISHMENTS: [HIGHEST PRIORITY — NON-NEGOTIABLE] Identify and describe every 3D structural element on any piece of the outfit. This includes: feathers (color, exact placement e.g. "large single ivory feather at center chest, approx 12 inches, pointing upward", plume density), 3D floral appliqués, bows, ruffle clusters, crystal or sequin zones, pom-poms, sculptural pleating, fringe, tassel, or any element that protrudes from the fabric surface. State the POSITION (bodice/hem/shoulder/sleeve/waist/collar), SIZE, COLOR, and MATERIAL of each embellishment. These are identity-defining — a garment without its feather or statement piece is the wrong garment.
6. COORDINATION: How pieces work together (matching tones/contrasting/pattern mix).
7. OVERALL SILHOUETTE: The complete body shape created by the outfit.
8. KEY HARDWARE: Standout design moments — hardware, closures, buckles, chains.
[CRITICAL OVERRIDE]: You are describing CLOTHING ONLY. You are absolutely FORBIDDEN from describing the skin tone, face, race, or body parts of the person wearing it. Banned words: porcelain, pale, tanned, white, black, brown, fair, skin, neck, arms, legs.
OUTPUT the full outfit's design DNA.`,

  BELT: `FORENSIC ACCESSORY ANALYST — Extract BELT design schematic ONLY.
1. STYLE: Dress belt/casual/statement/corset/wrap/chain belt — specify.
2. WIDTH: Narrow (under 1")/standard (1-1.5")/wide (1.5-3")/statement (3"+).
3. MATERIAL: Leather (smooth/textured/patent)/fabric/chain/metal/elastic — specify.
4. COLOR: Exact color, any contrast stitching, or two-tone.
5. BUCKLE: Shape (rectangle/oval/D-ring/prong/slide/hook), material, finish (gold/silver/brass/matte/glossy), and size.
6. HARDWARE: Any studs, eyelets, chains, or decorative elements on the belt strap.
7. DETAILING: Logo, embossing, cutouts, embroidery, distressing.
OUTPUT ONLY the belt design DNA. Waist/body/clothing it's worn with are [FORBIDDEN].`,

  SHOES: `FORENSIC ACCESSORY ANALYST — Extract FOOTWEAR design schematic ONLY.
1. STYLE: Sneaker/pump/boot/sandal/loafer/mule/platform/wedge/flat/heel — specify exactly.
2. TOE SHAPE: Round/square/pointed/open toe.
3. HEEL: Type (stiletto/block/wedge/kitten/platform/flat heel/no heel) and approximate height.
4. UPPER MATERIAL: Leather/suede/patent/mesh/fabric/vinyl — specify and describe texture.
5. COLOR: Exact color(s), any color-blocking, metallic finish, or pattern.
6. SOLE: Sole color, texture, platform height if present.
7. CLOSURE: Laces/strap(s)/buckle(s)/slip-on/zipper — describe placement.
8. DETAILS: Logos, hardware (type and finish), embellishments, branding, embroidery.
OUTPUT ONLY the shoe design DNA. Feet/ankles/legs are [FORBIDDEN].`,

  EARRINGS: `FORENSIC ACCESSORY ANALYST — Extract EARRING design schematic ONLY.
1. STYLE: Stud/hoop/huggie/drop/dangle/chandelier/ear cuff/climber/threader — specify.
2. SIZE: Approximate dimensions (stud: 4mm, hoop: 30mm diameter, drop: 3" length, etc.).
3. MATERIAL: Gold/silver/rose gold/brass/platinum/resin/acrylic — specify karat if apparent.
4. FINISH: Polished/matte/hammered/brushed/textured/oxidized.
5. STONES/GEMS: Type (diamond/pearl/cubic zirconia/crystal/turquoise), size, setting style, color.
6. DESIGN MOTIF: Geometric/organic/floral/sculptural/abstract/logo — describe shape precisely.
7. BACKS: Post/butterfly/lever-back/ear wire/clip-on if visible.
OUTPUT ONLY the earring design DNA. Face/ear/hair are [FORBIDDEN].`,

  NECKLACE: `FORENSIC ACCESSORY ANALYST — Extract NECKLACE design schematic ONLY.
1. STYLE: Chain/pendant/choker/bib/statement/layered/lariat/collar — specify.
2. LENGTH: Choker (14-16")/princess (17-19")/matinee (20-24")/opera (28-36") — approximate.
3. CHAIN TYPE: Box/cable/rope/figaro/herringbone/link/ball chain — describe link shape.
4. MATERIAL: Gold/silver/rose gold/brass/vermeil/sterling — specify karat if apparent.
5. PENDANT/FOCAL: Shape, size, material, any engraving, stones, or motif — describe precisely.
6. STONES/GEMS: Type, size, setting (prong/bezel/pavé/channel), color.
7. FINISH: Polished/matte/hammered/mixed textures.
OUTPUT ONLY the necklace design DNA. Neckline/chest/body are [FORBIDDEN].`,

  BRACELET: `FORENSIC ACCESSORY ANALYST — Extract BRACELET design schematic ONLY.
1. STYLE: Bangle/cuff/chain/charm/tennis/beaded/wrap/cuff/hinged — specify.
2. WIDTH: Thin (under 5mm)/medium (5-15mm)/wide (15mm+)/statement cuff.
3. MATERIAL: Gold/silver/rose gold/brass/leather/fabric/beads/gemstones — specify.
4. FINISH: Polished/matte/hammered/textured/engraved.
5. CHARMS/DETAILS: Any charms, stones, engravings, logos, or decorative elements.
6. CLOSURE: Toggle/lobster claw/box clasp/slide/open cuff/magnetic.
OUTPUT ONLY the bracelet design DNA. Wrist/hand/skin are [FORBIDDEN].`,

  WATCH: `FORENSIC ACCESSORY ANALYST — Extract WATCH design schematic ONLY.
1. CASE: Shape (round/square/tonneau/rectangular), approximate diameter (36/40/44mm), material (stainless/gold/titanium/ceramic).
2. DIAL: Color, texture (brushed/guilloché/matte), subdials presence, any special finish.
3. HANDS: Style (dauphine/baton/skeleton/applied indices), color, luminosity.
4. MARKERS: Hour markers (applied/printed/Roman/Arabic), color, style.
5. BEZEL: Type (plain/fluted/diamond/ceramic/rotating), material and finish.
6. CROWN: Size, position, any adornment.
7. STRAP/BRACELET: Material (leather/steel/rubber/fabric), color, pattern, clasp type and finish.
8. BRAND AESTHETIC: Note any visible text, logo placement, or brand indicators.
OUTPUT ONLY the watch design DNA. Wrist/hand/skin are [FORBIDDEN].`,

  RING: `FORENSIC ACCESSORY ANALYST — Extract RING design schematic ONLY.
1. STYLE: Band/signet/statement/cocktail/eternity/solitaire/cluster/geometric — specify.
2. BAND: Width (thin/medium/wide), profile (flat/domed/knife-edge/comfort-fit), material.
3. METAL: Gold (yellow/white/rose)/silver/platinum/two-tone — specify karat if apparent.
4. STONE(S): Type, shape (round/princess/emerald/oval/pear/marquise), size approximate, color.
5. SETTING STYLE: Prong/bezel/flush/pavé/channel/tension/cathedral — describe precisely.
6. DESIGN DETAILS: Engravings, milgrain, filigree, twisted band, stackable elements.
OUTPUT ONLY the ring design DNA. Finger/hand/skin are [FORBIDDEN].`,
};

// ─── ANCHOR FIDELITY ENFORCEMENT PHRASES ─────────────────────────────────────
export const ANCHOR_ENFORCEMENT = {
  HAIR:        "Every strand, wave, color dimension, highlight placement, length, and styling detail from the HAIR_DNA must appear 100% preserved on the new model's head.",
  BARBER:      "Every fade line, taper graduation, lineup edge, top length, and design element from the BARBER_DNA must appear 100% preserved on the new model's head.",
  NAILS:       "Every nail shape, color, art pattern, gem placement, and finish from the NAIL_DNA must appear 100% preserved on the new model's visible hands.",
  MAKEUP:      "Every color, blend, line, technique, and application detail from the MAKEUP_DNA must appear 100% preserved on the new model's face.",
  SHIRT:       "Every design detail, collar style, sleeve, color, pattern, and fabric quality from the SHIRT_DNA must appear 100% preserved on the new model's body.",
  PANTS:       "Every cut, rise, silhouette, fabric, color, and detail from the PANTS_DNA must appear 100% preserved on the new model's lower body.",
  SHORTS:      "Every cut, length, fabric, color, and detail from the SHORTS_DNA must appear 100% preserved on the new model.",
  SWIMWEAR:    "Every style element, cut, color, pattern, hardware, and detail from the SWIMWEAR_DNA must appear 100% preserved on the new model.",
  HAT:         "Every structural element, brim shape, material, color, and detail from the HAT_DNA must appear 100% preserved on the new model's head.",
  FULL_OUTFIT: "Every garment, layering decision, color coordination, and design detail from the OUTFIT_DNA must appear 100% preserved on the new model.",
  BELT:        "The belt's width, material, color, buckle design, and hardware from the BELT_DNA must appear 100% preserved around the new model's waist.",
  SHOES:       "Every shoe style, material, color, heel, sole, and hardware detail from the SHOE_DNA must appear 100% preserved on the new model's feet.",
  EARRINGS:    "The exact earring style, size, material, stones, and design motif from the EARRING_DNA must appear 100% preserved on the new model's ears.",
  NECKLACE:    "The exact necklace chain, pendant, length, and material from the NECKLACE_DNA must appear 100% preserved at the new model's neckline.",
  BRACELET:    "The exact bracelet style, material, width, and details from the BRACELET_DNA must appear 100% preserved on the new model's wrist.",
  WATCH:       "The exact watch case, dial, hands, strap, and design from the WATCH_DNA must appear 100% preserved on the new model's wrist.",
  RING:        "The exact ring style, metal, stone(s), setting, and band details from the RING_DNA must appear 100% preserved on the new model's finger(s).",
};
