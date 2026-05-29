# LuxAura Creation Studio 2

Sovereign AI fashion photography platform — 7-agent forge pipeline powered by Google Gemini.

---

## AI Model Registry

**Last verified:** April 3, 2026 — Source: https://ai.google.dev/gemini-api/docs/models

This is the single source of truth for all AI models used in this project. When upgrading, update `api/forge.js` constants AND this file.

### Active Models in forge.js

| Constant | Current Model ID | Role | Status |
|---|---|---|---|
| `TEXT_MODEL` | `gemini-2.5-flash` | DNA extraction, director briefs, consistency audit, identity scan | Stable GA |
| `PXL_MODEL` | `gemini-3.1-flash-image-preview` | Image generation (Agent 01b, Agent 03) | Preview |

### Full Gemini Model Registry (April 2026)

#### Text / Multimodal Reasoning

| Model ID | Tier | Notes |
|---|---|---|
| `gemini-2.5-pro` | Stable GA | Most capable. Best for complex reasoning, 1M context |
| `gemini-2.5-flash` | Stable GA | Best price-performance. **Current TEXT_MODEL** |
| `gemini-2.5-flash-lite` | Stable GA | Fastest/cheapest. Use for high-volume low-stakes calls |
| `gemini-3.1-pro-preview` | Preview | Bleeding edge. Upgrade TEXT_MODEL here when GA |
| `gemini-3-flash-preview` | Preview | Fast preview-tier. |
| `gemini-flash-latest` | Alias | Always points to latest stable Flash |
| `gemini-pro-latest` | Alias | Always points to latest stable Pro |

#### Image Generation

| Model ID | Tier | Notes |
|---|---|---|
| `gemini-3.1-flash-image-preview` | Preview | **Current PXL_MODEL** — Gemini native image gen + editing |
| `gemini-3-pro-image-preview` | Preview | Highest quality image gen. Upgrade PXL_MODEL here |
| `gemini-2.5-flash-image` | Stable GA | Stable fallback for image generation |
| `imagen-4.0-generate-001` | Stable GA | Dedicated text-to-image. Up to 2K resolution |
| `imagen-4.0-ultra-generate-001` | Stable GA | Highest quality Imagen. Best for product/catalog shots |
| `imagen-4.0-fast-generate-001` | Stable GA | Fast Imagen. Use for previews/thumbnails |

#### Video Generation

| Model ID | Tier | Notes |
|---|---|---|
| `veo-3.1-generate-preview` | Preview | Best video quality. Cinematic + native audio. Paid tier required |
| `veo-3.1-fast-generate-preview` | Preview | Faster/cheaper Veo 3.1 |
| `veo-3.0-generate-001` | Stable GA | Stable video gen baseline |
| `veo-3.0-fast-generate-001` | Stable GA | Fast stable video |
| `veo-2.0-generate-001` | Stable GA | Legacy. Prefer veo-3.x |

#### Embeddings

| Model ID | Tier | Notes |
|---|---|---|
| `gemini-embedding-001` | Stable GA | Standard embeddings |

---

### Deprecated — Do Not Use

| Model ID | Status | Replace With |
|---|---|---|
| `gemini-2.0-flash` | Deprecated (404) | `gemini-2.5-flash` |
| `gemini-2.0-flash-lite` | Deprecated | `gemini-2.5-flash-lite` or `gemini-2.5-flash` |
| `gemini-3-pro-preview` | Shut down March 9, 2026 | `gemini-3.1-pro-preview` |

---

### Upgrade Path

When upgrading models, update **both** locations:

1. `api/forge.js` — `TEXT_MODEL` and `PXL_MODEL` constants at the top of the file
2. This README — Active Models table above

**Next upgrade targets:**
- `TEXT_MODEL`: `gemini-2.5-flash` → `gemini-3.1-pro-preview` (when stable/GA)
- `PXL_MODEL`: `gemini-3.1-flash-image-preview` → `gemini-3-pro-image-preview` (when stable/GA)

---

## Architecture

```
User Upload → PaperBananaProtocol → /api/forge SSE Stream → 6-image grid
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
              Agent 00             Agent 01              Agent 01b
          Intent Classifier      DNA Scanner          Anchor Visualizer
          (TEXT_MODEL)           (TEXT_MODEL)          (PXL_MODEL)
                    │
              Agent 02 × 6
          Creative Director
          (TEXT_MODEL)
                    │
              Agent 02.5
          Consistency Auditor
          (TEXT_MODEL)
                    │
              Agent 03 × 6
          Image Producer
          (PXL_MODEL)
```

## Deployment

- **Frontend:** Vercel (auto-deploy on push to `master`)
- **Backend:** Vercel Serverless Functions (`/api/*`)
- **Auth:** Firebase Auth + Firestore
- **Storage:** Firebase Storage (vault assets)
- **VTO:** FASHN.ai API
