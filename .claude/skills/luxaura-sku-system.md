---
description: LuxAura SKU enrollment, DNA storage, forge recall, and consistency guarantee. Use when working with the SKU catalog, enrollment flow, or garment DNA system.
---

# LuxAura SKU System

## The Core Idea
A brand uploads a garment once → Agent 01 extracts and freezes the DNA → stored permanently in Firestore → any future forge run can recall that frozen DNA and skip Agent 01 + 01b entirely. This is the consistency guarantee: same garment, same DNA, infinite regenerations.

## SKU Document Shape
```typescript
{
  skuId:            string;   // sku_1748600000_abc123
  brandId:          string;
  name:             string;   // "Black Linen Blazer SS26"
  skuCode:          string;   // "BLB-SS26-001"
  category:         string;   // "Outerwear"
  season:           string;   // "Spring/Summer 2026"
  anchorType:       string;   // "FULL_OUTFIT" — must match ANCHOR_LABELS key
  sourceImages:     string[]; // Firebase Storage URLs
  dna:              {          // FROZEN at enrollment — never changes
    [anchorType]: string;      // e.g. FULL_OUTFIT: "Black linen blazer..."
    identity:     string;      // model/person description
    hair?:        string;      // for clothing anchors
  } | null;
  referenceImage:   string;   // Firebase Storage URL — Agent 01b anchor isolation render
  enrollmentStatus: 'pending' | 'processing' | 'ready' | 'failed' | 'archived';
  fidelityScore:    number;   // 0-100 — how accurately DNA was captured
  createdAt:        string;
  updatedAt:        string;
}
```

## Enrollment Flow (api/v1/skus/enroll.js)
```
1. resolveBrandContext() + requireRole('editor')
2. createSku(brandId, metadata) → skuId, status: 'processing'
3. Upload source image to Storage: brands/{brandId}/skus/{skuId}/source.jpg
4. Run Agent 01 DNA extraction inline:
   - Parallel: anchorDna (using DNA_EXTRACTION_PROMPTS[anchorType]) + identityDna
   - Optional: hairDna (for clothing anchors)
5. Run Agent 01b anchor isolation:
   - Uses ISOLATION_INSTRUCTIONS[anchorType] prompt
   - Generates face-free reference render
   - Uploads to Storage: brands/{brandId}/skus/{skuId}/reference.png
6. calculateFidelityScore(sourceBase64, referenceBase64, anchorType) → 0-100
7. updateSkuEnrollment(brandId, skuId, { dna, referenceImage, fidelityScore, status: 'ready' })
8. deliverWebhook(brandId, { type: 'sku.enrolled', data: { skuId, fidelityScore } })
```

## DNA Keys (must match exactly for forge recall)
```javascript
// The dna object keys mirror the in-memory dnaMap in api/forge.js
// Object.assign(dnaMap, skuData.dna) is the entire injection — zero transformation

// For FULL_OUTFIT/DRESS/clothing anchors:
{ FULL_OUTFIT: "...", identity: "...", hair: "..." }

// For beauty/accessory anchors:
{ HAIR: "...", identity: "..." }
{ MAKEUP: "...", identity: "..." }
{ EARRINGS: "...", identity: "..." }
```

## Forge Recall (api/forge.js)
```javascript
// Triggered when: req.body.skuId && req.body.brandId
// Key: skuDnaInjected = true makes Agent 01 block skip with: if (!skuDnaInjected) try { ... }

const skuData = await loadSkuForForge(brandId, skuId);
Object.assign(dnaMap, skuData.dna);
anchorRefImage = { data: skuData.referenceImageBase64, mimeType: 'image/png' };
anchorRefAnchorType = skuData.anchorType;
skuDnaInjected = true;
```

## Fidelity Score Guide
```
90-100: Excellent — DNA captured with high precision, expect exact reproductions
70-89:  Good — Minor variations possible, particularly in fine details
50-69:  Fair — Consider re-enrolling with better source images
<50:    Poor — Re-enrollment strongly recommended, multi-angle shots needed
```

## Re-enrollment Strategy
When `enrollmentStatus === 'drift'` (detected by consistency-guardian.js):
1. User initiates re-enrollment from SKU detail page
2. New enrollment runs same pipeline — overwrites dna + referenceImage
3. fidelityScore updated
4. All future generations use the fresh DNA

## ISOLATION_INSTRUCTIONS by Anchor Type
Located in both `api/forge.js` and `api/v1/skus/enroll.js`:
- `FULL_OUTFIT` / `DRESS`: Professional flat lay, face-free, 100% pattern fidelity
- `SHIRT` / `PANTS` / `SHORTS`: Headless mannequin, clean studio
- `HAIR` / `BARBER`: Crown to neck only, no body/clothing
- `NAILS`: Wrist to fingertip only
- `MAKEUP`: Anonymous placeholder face, exact makeup reproduction
- `SHOES`: Standalone product shot or ankle-only
- `EARRINGS` / `NECKLACE`: Macro close-up, no face

## Batch Enrollment (api/v1/forge/batch.js)
```
POST /api/v1/forge/batch
{ skuIds: string[] (max 10), config: {}, webhookUrl?: string }
→ Creates one job/{jobId} per SKU in brands/{brandId}/jobs/
→ campaign-agent.js processes queued jobs every 2 minutes
→ Webhook delivered on completion
```

## Consistency Guardian (api/agents/consistency-guardian.js)
Runs every Monday 2am UTC. Detects DNA drift:
- Requires ≥5 campaigns using same SKU
- Compares last 3 campaign outputs vs enrolled dna
- drift score = enrollFidelity - recentAvgFidelity
- If drift > 35: delivers webhook { type: 'sku.drift_detected', data: { skuId } }
