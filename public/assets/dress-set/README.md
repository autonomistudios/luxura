# Dress Set — one garment, six consistent looks

A consistent-SKU demonstration: ONE garment (the red Aegean gown) rendered on a real
mannequin + 5 totally different models / scenes / poses, with the dress **garment-locked**
to a reference image so it stays identical across all six. No branding/text; the dress is
always on full display (never silhouette or shadow).

| File | Subject | Scene |
|---|---|---|
| `dress-mannequin.jpg` | Real dress-form mannequin (no model) | White studio — the anchor/base |
| `dress-rooftop.jpg` | Black model | NYC rooftop, golden hour |
| `dress-marble.jpg` | East Asian model | Bright marble gallery |
| `dress-greenhouse.jpg` | Latina model | Botanical greenhouse (twirl) |
| `dress-staircase.jpg` | Middle Eastern model | Grand marble staircase (seated) |
| `dress-desert.jpg` | South Asian model | Golden dunes (front-lit, no silhouette) |

## How it works
Generated at PRO grade (`gemini-3-pro-image`) via `/api/generate-prop-cover` in
**garment-lock** mode: the request sends `{ clean:true, refImage }`, and the endpoint
attaches the reference image + a GARMENT_LOCK directive so the model reproduces the exact
dress and only changes the model/pose/scene/lighting.

```bash
node scripts/generate-dress-set.mjs            # only missing
node scripts/generate-dress-set.mjs --force    # regenerate all
node scripts/generate-dress-set.mjs --only=dress-desert
SOURCE=path/to/other-dress.jpg node scripts/generate-dress-set.mjs --force   # different garment
```

Source garment defaults to `public/assets/showcase/statement-aegean.jpg`.
Completeness enforced by `runDressSetTests` in `audit/tests/prop-covers.js`.
