# LuxAura Statement Collection — showcase imagery

Six production-ready hero images that showcase the studio's work. Committed,
CDN-served, IP-safe (LUXAURA-only branding, no third-party names).

| File | Concept | Location | Casting | Mood |
|---|---|---|---|---|
| `the-garment.jpg` | Couture gown alone (ghost-mannequin, no model) | Studio | — | Sculptural product hero |
| `statement-sahara.jpg` | Monument | Sahara dunes, golden hour | Deep-ebony | Warm, commanding |
| `statement-tokyo-neon.jpg` | Neon midnight | Tokyo, rain, neon | East Asian | Cool, electric |
| `statement-mirror.jpg` | Infinite mirror | Mirror chamber | Mixed-race | Futuristic, high-gloss |
| `statement-aegean.jpg` | Aegean light | Santorini, golden hour | Scandinavian | Serene, airy |
| `statement-the-face.jpg` | The face | Beauty studio | Nigerian | Intense, dewy |

## Generate / regenerate
At PRO grade (`gemini-3-pro-image`) via the deployed `/api/generate-prop-cover`
fullRes endpoint — no local credentials needed.

```bash
node scripts/generate-showcase.mjs            # only missing
node scripts/generate-showcase.mjs --force    # regenerate all
node scripts/generate-showcase.mjs --only=the-garment
```

Creative direction (casting, garment, scene, light, mood, pose) lives in the
`SHOWCASE` array in `scripts/generate-showcase.mjs`. The master art-direction
system prompt (`COVER_SYSTEM` in `api/generate-prop-cover.js`) enforces LUXAURA-only
branding, correct anatomy/proportion, true photorealism, and complete framing.

Completeness is enforced by `audit/tests/prop-covers.js` (`runShowcaseTests`),
run via `node audit/index.js`.
