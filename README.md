# LuxAura B2B Operating System

**Sovereign AI fashion photography platform — B2B enterprise edition.**
7-agent forge pipeline · SKU DNA enrollment · Brand workspace management · Autonomous agents

---

## AI Model Registry

**Last verified: June 2026**

Single source of truth. Update `lib/forge/constants.js` AND this file when upgrading.

### Active Models

| Constant | Model ID | Role | Status |
|---|---|---|---|
| `TEXT_MODEL` | `gemini-2.5-pro` | DNA extraction, director briefs, consistency audit | Stable GA |
| `PXL_MODEL` | `gemini-3-pro-image-preview` | Image generation — Agent 01b + Agent 03 | Preview |

### Image Generation Models
| Model ID | Tier | Notes |
|---|---|---|
| `gemini-3-pro-image-preview` | Preview | **Current PXL_MODEL** — best identity lock, 2K output |
| `gemini-3.1-flash-image-preview` | Preview | Faster/cheaper fallback |
| `imagen-4.0-generate-001` | Stable GA | Dedicated text-to-image, 2K |
| `imagen-4.0-ultra-generate-001` | Stable GA | Highest quality for catalog shots |

### Text / Reasoning Models
| Model ID | Tier | Notes |
|---|---|---|
| `gemini-2.5-pro` | Stable GA | **Current TEXT_MODEL** — 1M context, best reasoning |
| `gemini-2.5-flash` | Stable GA | Price-performance alternative |
| `gemini-3.1-pro-preview` | Preview | Next upgrade target for TEXT_MODEL |

### Deprecated — Do Not Use
| Model ID | Reason |
|---|---|
| `gemini-3-pro-image` | Missing `-preview` suffix — invalid model ID |
| `gemini-3-pro-preview` | Shut down March 9, 2026 |
| `gemini-2.0-flash` | Deprecated — use gemini-2.5-flash |

---

## Architecture

### Forge Pipeline (7 Agents)

```
Brand API Key / Firebase Auth
        │
   Agent 00  Intent Classifier       (TEXT_MODEL) — deterministic
        │
   Agent 01  DNA Scanner             (TEXT_MODEL) — SKIPPED if SKU recalled
   Agent 01b Anchor Isolation        (PXL_MODEL)  — SKIPPED if SKU recalled
   Agent 01f VTO Orchestration       (Vertex AI → FASHN.ai fallback)
        │
   Agent 02 ×6  Creative Director   (TEXT_MODEL) — 6 unique scene briefs
   Agent 02.5   Consistency Auditor  (TEXT_MODEL) — cross-slot identity lock
        │
   Agent 03 ×6  Image Producer       (PXL_MODEL)  — SSE stream, 3-concurrent
```

### Agentic Workers (Vercel Cron)

| Agent | Schedule | Purpose |
|---|---|---|
| campaign-agent | */2 * * * * | Process queued batch jobs |
| usage-reconciliation-agent | 0 0 1 * * | Reset monthly quotas |
| consistency-guardian | 0 2 * * 1 | Detect SKU DNA drift |

---

## Deployment

- **Hosting:** Vercel (auto-deploy on push to `main`)
- **Auth:** Firebase Auth — Google OAuth
- **Database:** Firestore — multi-tenant `brands/{brandId}/...`
- **Storage:** Firebase Storage
- **Billing:** Stripe (Studio $499 · Agency $1,499 · Enterprise $4,999 /mo)

## Brand Tiers

| Tier | Price | Images/month | API Calls/month |
|---|---|---|---|
| Studio | $499/mo | 500 | 2,000 |
| Agency | $1,499/mo | 2,000 | 10,000 |
| Enterprise | $4,999/mo | 10,000 | 50,000 |

See `.env.example` for all required environment variables.
