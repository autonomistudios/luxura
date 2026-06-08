# Prop Covers — hero imagery for the Scene Props gallery

This folder is the **permanent, in-repo, CDN-served source of truth** for Creative
Prop cover images. One file per prop: `public/assets/props/<propId>.jpg`.

These are the "visual representation of the location" shown on the prop-selection
page. They are committed to git on purpose — so they survive Firebase/Vercel
project switches and never silently disappear (the original covers were lost
exactly because they lived only in a Firestore collection tied to one project).

## How covers are generated

Generated at **Pro grade** with **`gemini-3-pro-image` (Nano Banana Pro)** — the
same model used for user image generation — via the deployed endpoint
`/api/generate-prop-cover` in `fullRes` mode (1280px, q88, no Firestore write).

```bash
# Generate only missing covers (safe, idempotent)
node scripts/generate-prop-covers.mjs

# Regenerate everything
node scripts/generate-prop-covers.mjs --force

# Regenerate specific props
node scripts/generate-prop-covers.mjs --only=glass-tower,dust-and-gold
```

No local credentials are required — generation runs on the deployed endpoint,
which holds `GOOGLE_API_KEY` server-side. (The legacy local Firebase-Admin path
is intentionally not used; its service-account key is corrupt.)

### Creative direction
`scripts/generate-prop-covers.mjs` holds the prompting:
- **`PROP_SHOOTS`** — bespoke, diversely-cast model + wardrobe + scene per prop (studio IP).
- Props without a bespoke shoot are built from the prop's primary scene
  (`userPrompts[0]`) + rotated diverse casting (`CASTING`) + per-category couture
  styling (`CATEGORY_STYLING`).
- Every prompt gets the "hero cover — make it hot" elevation directive.
- The endpoint prepends the master art-direction system prompt (`COVER_SYSTEM`).

## Cover resolution at runtime (`CreativePropsGallery`)
1. Runtime custom cover from Firestore `prop-covers/<id>` (a user-generated override), else
2. **this committed file** `/assets/props/<id>.jpg`, else
3. category fallback image in `/assets/dna/` (on image error).

## Completeness is enforced by tests
`audit/tests/prop-covers.js` (run via `node audit/index.js`) fails if any prop is
missing a cover here, or if a cover file is suspiciously small. Keep this folder
in sync with `src/lib/creativeProps.ts`.
