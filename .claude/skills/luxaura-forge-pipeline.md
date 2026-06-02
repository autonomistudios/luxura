---
description: LuxAura 7-agent forge pipeline — architecture, agent roles, SKU recall bypass, how to modify prompts, add anchors, and debug generation failures.
---

# LuxAura Forge Pipeline

## Models (current as of June 2026)
```javascript
PXL_MODEL  = "gemini-3-pro-image"  // Nano Banana Pro — Stable GA, 4K studio quality
TEXT_MODEL = "gemini-2.5-pro"       // Stable GA, 1M context
```
Both in `lib/forge/constants.js`. Update there + README when upgrading.

## Pipeline Flow

```
POST /api/forge or POST /api/v1/forge/generate
  │
  ├── Auth gate (Firebase Bearer OR X-Brand-API-Key header)
  ├── Rate limit check (consumer) OR quota check (B2B)
  ├── Credit/quota deduction (atomic Firestore transaction)
  │
  ├── SKU RECALL CHECK ← KEY B2B FEATURE
  │   If req.body.skuId + req.body.brandId:
  │     loadSkuForForge(brandId, skuId) → inject dnaMap + anchorRefImage
  │     skuDnaInjected = true → Agents 01 + 01b BYPASSED
  │
  ├── SSE headers flushed (Content-Type: text/event-stream)
  ├── 15s heartbeat started
  │
  ├── AGENT 00: Intent Classifier (deterministic, no LLM)
  │   → missionType: KEEP_GARMENT_TRANSFER | KEEP_ANCHOR_EDIT | AI_GARMENT_ANCHOR |
  │                  AI_BEAUTY_ANCHOR | AI_ACCESSORY_ANCHOR | AI_STANDARD
  │
  ├── AGENT 01: DNA Extraction (TEXT_MODEL, parallel)  ← SKIPPED if skuDnaInjected
  │   → identityTask() → modelIdentityDNA
  │   → hairTask() (conditional)
  │   → anchorTasks[] → dnaMap[anchorType]
  │
  ├── AGENTS 01b–01e: Pre-pass renders (PXL_MODEL)  ← SKIPPED if skuDnaInjected
  │   → 01b: anchor isolation (face-free reference)
  │   → 01c: AI garment render
  │   → 01d: model identity sheet
  │   → 01e: clothing mask
  │
  ├── AGENTS 01f/01g: VTO orchestration
  │   → Vertex AI Imagen 3 → FASHN.ai fallback
  │
  ├── AGENT 02: Creative Director (TEXT_MODEL, 6 slots)
  │   → 350ms stagger between slots
  │   → Per-slot: ethnicity, face, pose, age, body type, framing, outfit permutations
  │
  ├── AGENT 02.5: Consistency Auditor (TEXT_MODEL)
  │   → Validates all 6 briefs for: gender, background, skin tone, anchor presence
  │   → Corrects violations in-place
  │
  └── AGENT 03: Image Producer (PXL_MODEL, 3-concurrent)
      → Pass 1: 6 slots, pLimitStreaming(3)
      → Pass 2: smart retry on failures (classifyFailure → mutation → retry)
      → Stream: data: { type: 'image', slot: N, image: base64 }
      → Final: data: { type: 'done', count: N }
```

## SKU Recall Bypass (critical B2B feature)

```javascript
// In api/forge.js, before Agent 01:
if (req.body.skuId && req.body.brandId) {
  const skuData = await loadSkuForForge(brandId, skuId);
  Object.assign(dnaMap, skuData.dna);        // Inject frozen DNA
  anchorRefImage = { data: skuData.referenceImageBase64, mimeType: 'image/png' };
  anchorRefAnchorType = skuData.anchorType;
  skuDnaInjected = true;
  // Agent 01 block has: if (!skuDnaInjected) try { ... }
}
```

DNA object structure (must match exactly for recall to work):
```javascript
{
  FULL_OUTFIT: "Black linen blazer, single-breasted...",
  identity:    "Fair skin, East Asian heritage...",
  hair:        "Dark brown, shoulder length..."    // only for clothing anchors
}
```

## Adding a New Anchor Type

1. Add to `lib/forge/config/anchors.js`:
   - `ANCHOR_LABELS` object: `MY_ANCHOR: 'Display Name'`
   - `DNA_EXTRACTION_PROMPTS.MY_ANCHOR`: forensic extraction prompt
   - `ANCHOR_ENFORCEMENT.MY_ANCHOR`: fidelity lock phrase

2. Add to appropriate category in `lib/forge/constants.js`:
   - `BEAUTY_PRECISION_ANCHORS`, `DETAIL_ACCESSORY_ANCHORS`, or `CLOTHING_ANCHOR_TYPES`

3. Add isolation instruction to `ISOLATION_INSTRUCTIONS` in `api/forge.js` and `api/v1/skus/enroll.js`

## Modifying Agent Prompts

- Agent 00: `lib/forge/agents/agent00-intent.js`
- Agent 01: Inline in `api/forge.js` (identityTask, hairTask, anchorTasks)
- Agent 02: `lib/forge/agents/agent02-director.js`
- Agent 02.5: `lib/forge/agents/agent02.5-auditor.js`
- Agent 03: `lib/forge/agents/agent03-prompt-architect.js`

## Temperature Calibration
```
PHOTO_EDIT:           0.07–0.11
VTO_BACKGROUND_REPLACE: 0.18–0.33
VTO_EDITORIAL:         0.20–0.35
INPAINTING:            0.05–0.09
TWO_IMAGE:             0.12–0.18
AI_GENERATE:           0.72–1.20

Retry deltas (Pass 2):
  IMAGE_MISSING: +0.10
  TIMEOUT:       -0.18
  SAFETY:        -0.22
  GARMENT_DRIFT: -0.15
  DEFAULT:       -0.06
```

## Safety Settings (CRITICAL — do not change without understanding)
```javascript
// Keep/clone modes: omit safetySettings entirely
// Prevents anti-deepfake filter activation on real-person identity work
// AI_GENERATE only: use SAFETY_SETTINGS with BLOCK_NONE for harassment/hate

// This is why: if safetySettings present on PHOTO_EDIT,
// Gemini's deepfake detection blocks the generation.
```

## SSE Event Format
```javascript
data: { type: 'image', slot: 0–5, image: 'base64dataURI' }
data: { type: 'done', count: 6 }
data: { type: 'error', error: 'message' }
// Plus: heartbeat comments (: heartbeat) every 15s
```

## Debugging Generation Failures
1. Check `audit/audit-report.json` — run `node audit/index.js` for static analysis
2. Check Vercel function logs for `[FORGE]` prefix lines
3. Common issues:
   - Rate limit (429): handled automatically with backoff in `withGeminiBackoff`
   - Safety block: check missionType — may need to omit safetySettings
   - No image returned: check slot 0 missing in Pass 1, triggers Pass 2 retry
   - SKU recall fail: check `enrollmentStatus === 'ready'` and referenceImage exists
