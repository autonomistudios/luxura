# LuxAura Creation Studio 2 — Audit Report

**Date:** 2026-04-29
**Scope:** Architecture overview, build state, lint, accessibility (WCAG 2.1 AA spot-check), design-system consistency, security review
**Stack:** Vite 7 + React 19 + TypeScript 5.9 + Tailwind 3.4 + Firebase + Vercel Serverless + Google Gemini

---

## 1. What LuxAura Is

A "Sovereign AI fashion photography platform" that takes a user upload and runs a 7-agent pipeline (Agents 00 → 01 → 01b → 02 ×6 → 02.5 → 03 ×6) over Google Gemini to produce a 6-image editorial grid. Auth + vault on Firebase, payments via PayPal subscriptions, virtual try-on via FASHN.ai, video via Veo 3.1.

**Routing (`src/App.tsx`):** Public — `/`, `/login`, `/pricing`. Protected — `/dashboard`, `/studio`, `/vault`, `/profile`, `/workflow/:categoryId`, `/garment`, `/video`, `/admin`, `/developer`. Auth gate is wrapped around an Onboarding gate (Aura profile fetch).

**Module layout:**
- `src/pages/` (11 pages) — Landing, Login, Pricing, Dashboard, Vault, Profile, Workflow, GarmentStudio, VideoStudio, AdminDashboard, DeveloperPortal
- `src/components/` (32 components) — Sovereign* family, Atelier/Editorial/Forge grids, Masterpiece reveal, AssetActionsDrawer, AuraOnboarding, etc.
- `src/lib/` — firebase init, paper-banana-protocol (core + critic), render-engine, social-export, useLuxSound, locationPresets, creativeProps
- `api/` (10 serverless endpoints) — forge, forge-iterate, upscale, vault-deploy/delete, credits, paypal-webhook, aura-profile, generate-prop-cover, prompt-architect
- `lib/forge/` — agents, config (anchors, photography, slots), services (gemini-client, gcp-raw, vault-service, fashn-tryon, vertex-vto, segment-composite, aura-profile, firebase-admin), utils (streaming, temperature, camera-resolver, failure-classifier)
- `agent/` — Python critic + skills (separate from runtime; tooling)
- `audit/` — local Node-based audit harness (`npm run audit*`)

---

## 2. Build & Type State — RED

### Blocker
- `vite_output.txt` records a build failure at `src/components/MasterpieceReveal.tsx:203:0 — Unexpected end of file`. The current file ends at line 154 and looks structurally complete (named export with `return createPortal(...)`), so the failure is from an older state — **re-run `vite build` to confirm it now succeeds**. If it still fails, the file is silently truncated mid-JSX.

### Type errors (`build_errors.txt`, 33 lines)
- 28× `TS6133` "declared but never read" — unused `React` imports (modern JSX runtime doesn't need them), unused lucide icons, unused Workflow.tsx state setters (`setSkinTone`, `setLighting`, `setCamera`, `setBg`, `setPrompt`, `agentReports`, `auditStatus`, `auditNotes`, `isRefining`).
- **2 real type errors in `src/pages/Workflow.tsx`:**
  - L72 — `Type 'string' is not assignable to type '"keep" | "change"'` — narrow with a literal cast or use a discriminated enum.
  - L224 — `Type 'string | null' is not assignable to type 'string'` — guard the null branch.

**Recommended fix sequence:** auto-fix unused imports (`tsc --noEmit` then `eslint --fix`), then resolve the two real type errors, then rebuild.

---

## 3. Lint — 53 problems (46 errors, 7 warnings)

| Class | Count | Examples |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | 17 | `Pricing.tsx`, `Workflow.tsx`, `VideoStudio.tsx`, `AdminDashboard.tsx`, `useSovereignStore.ts` — most are PayPal SDK escape-hatches and Firebase data shapes |
| `@typescript-eslint/no-unused-vars` | 16 | Same set as TS6133 plus `_apiKey`, `_request`, `_notes`, `_` |
| `react-refresh/only-export-components` | 4 | `AuthContext.tsx` exports a Provider + a hook + types from one file; `PersonaCarousel.tsx` exports a constant alongside the component |
| `react-hooks/exhaustive-deps` | 6 (warnings) | `LuxCursor`, `GarmentStudio`, `Pricing`, `AuthContext` |
| `react-hooks/set-state-in-effect` | 2 | `CinematicIntro.tsx:19`, `Pricing.tsx:121` — cascading-render risk |
| `no-irregular-whitespace` | 2 | `VideoStudio.tsx:1048` — non-breaking space inside JSX literal |
| `prefer-const` | 1 | `paper-banana-protocol/critic.ts:36` `debt` |

**Recommendation:** treat the seven `any`s in `VideoStudio.tsx` and `Workflow.tsx` as the highest-value cleanup — those modules are the agent boundary where types matter.

---

## 4. Accessibility — WCAG 2.1 AA spot-check — RED/AMBER

Sample of issues across `src/components/` and `src/pages/`:

**Critical (blocks AA):**
- **`<img>` without `alt`** — at least 20 occurrences (AssetUploader, AtelierGrid, CreativePropsGallery, ForgeActivation, IterationPanel, MasterpieceReveal, PersonaCarousel, SovereignAtelier, SovereignCategoryCard, SovereignForge, StudioConcierge, GarmentStudio, Landing ×5, Vault, VideoStudio, etc.). WCAG 1.1.1 requires non-decorative images to have alternative text and decorative images to have `alt=""`.
- **`<div onClick>`** in `AssetActionsDrawer.tsx`, `CreativePropsGallery.tsx`, `EditorialGrid.tsx`, `ForgeMatrix.tsx` — non-button elements with click handlers are not keyboard-reachable. Convert to `<button>` (with `aria-label` if icon-only) or add `role="button"` + `tabIndex={0}` + Enter/Space key handlers.
- **`<input>` without label / `aria-label`** in AssetUploader, AuraOnboarding (×2), LocationPresetPicker, SovereignIntake, GarmentStudio (×2), Profile, Vault, Workflow. Each visible field needs an associated `<label htmlFor>` or `aria-label`.
- **`outline-none` used 14 times** without a visible `:focus-visible` replacement in most cases. Removes keyboard focus indication. WCAG 2.4.7.

**Serious:**
- **Body type 7px–9px is everywhere** — 317 occurrences of `text-[7px]`, `text-[8px]`, `text-[9px]`. WCAG doesn't set a minimum, but combined with the `tracking-[0.4em]` letterspacing you use throughout, this likely fails 1.4.4 (resize text 200% without loss of content/function) on small viewports and is brutally hard to read for low-vision users. Minimum 12px is a defensible floor for the editorial mono captions.
- **Two `<h1>` in `SovereignNavigation.tsx`** — only one h1 per page is best practice (WCAG 2.4.6).
- **No `prefers-reduced-motion` handling anywhere.** Framer Motion + GSAP everywhere, with `CinematicIntro`, `MasterpieceReveal`, blur transitions, `LuxCursor`, GSAP animations. WCAG 2.3.3. Add `useReducedMotion()` from `framer-motion` and respect it.
- **Only 2 `aria-*` attributes in the whole `src/`.** That is by itself a signal — the design leans on visual-only affordances.

**Color contrast (heuristic from Tailwind tokens):**
- `#8A867D` (muted) on `#FAF9F6` (background) ≈ **3.4:1** — fails AA for normal text (4.5:1 needed). This is your default "muted caption" color and it's visible across most pages. Either deepen the muted color (e.g., `#6E6A60` ≈ 5.0:1) or restrict it to ≥18px / ≥14px-bold.

---

## 5. Design-System Consistency — AMBER

`tailwind.config.js` defines a real token set: `background`, `surface`, `border`, `text`, `muted`, `gold` (light/DEFAULT/hover/dark), `mercury`, `anthracite`. **Almost nothing uses them.**

**Drift evidence (raw hex counts in `src/components` + `src/pages`):**

| Hex | Count | Should be |
|---|---|---|
| `#D4AF37` | 382 | `text-gold` / `bg-gold` |
| `#1C1C1C` | 341 | `text-text` |
| `#8A867D` | 48 | `text-muted` |
| `#E5E0D8` | 43 | `border-border` |
| `#F2EFE9` | 17 | `bg-surface` / `bg-anthracite` |
| `#FAF9F6` | 8 | `bg-background` |

**Six near-duplicate "blacks":** `#1C1C1C` (341), `#1A1A1A` (22), `#1a1612` (12), `#0E0E0E` (3), `#0a0a0a` (2), `#050505` (17). Pick one canonical near-black, retire the rest.

**Four near-duplicate "creams":** `#FAF9F6`, `#F8F7F5`, `#FAF9F7`, `#F0EDE8` — same problem.

**Broken token:** `obsidian: '#FAF9F6'` is identical to `background`. Either it's wrong (obsidian should be near-black) or the token name is misleading.

**Misleading token:** `fontFamily.mono = ['Inter', 'monospace']` — Inter is not monospace. If you want a faux-mono editorial caption, fine, but call it `caption` not `mono`.

**One stray non-palette color:** `#ff4444` — likely an error state. If so, it should be a named token (`error: '#...'`) so it can be tuned globally.

**Recommendation:** add a `pnpm refactor:tokens` step (regex codemod) to replace the top six hex values with their token classes. Cuts ~830 hex literals to ~0 and gives you a real design system.

---

## 6. Security Review — CRITICAL

### Critical
1. **`.env` is not in `.gitignore`.** Current `.gitignore` only has `*.local`. The `.env` at the project root contains `FIREBASE_SERVICE_ACCOUNT` (full base64 GCP service account JSON), `GOOGLE_API_KEY`, `FASHN_API_KEY`, all PayPal plan IDs, and the Firebase web config. **Add a literal `.env` line to `.gitignore` immediately, then `git ls-files .env` to confirm it isn't already tracked.** If it is tracked, treat every secret in it as compromised: rotate the GCP service account key, the GOOGLE_API_KEY, and the FASHN key.

2. **Server still falls back to `VITE_GOOGLE_API_KEY`.** `lib/forge/services/gemini-client.js:21` reads `process.env.VITE_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY`, and `gcp-raw.js:50` does the same with `VITE_FIREBASE_API_KEY`. Per `HANDOFF.md` §3 the `VITE_GOOGLE_API_KEY` was rotated and must not be used. **Remove the `VITE_*` fallbacks server-side** — anything that ships to the client (`VITE_` prefix) and is also accepted server-side defeats the rotation. Keep `VITE_FIREBASE_API_KEY` for the browser SDK only; server should use `GOOGLE_API_KEY` exclusively.

### High
3. **`Access-Control-Allow-Origin: *`** on `api/aura-profile.js` (and likely others not shown). With Bearer-auth this still permits any origin to call your API with a stolen token; lock to your production origin(s) via an allowlist. WCAG/security best-practice and a precondition for tightening CSRF posture.

4. **No security headers in `vercel.json`.** Add `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY` (or `frame-ancestors` in CSP), `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. Vercel supports a `headers` array in `vercel.json` — straightforward win.

5. **`HANDOFF.md` claims `firebase-admin` was uninstalled to drop cold starts; reality:** `package.json` still lists `"firebase-admin": "^13.8.0"`, and `api/forge.js` still does `import admin from 'firebase-admin'` at the top, alongside imports from `lib/forge/services/firebase-admin.js`. Either the migration is incomplete or the docs are wrong. This isn't a security vuln by itself, but it's the kind of architectural drift that hides real ones.

### Medium / informational
6. **No visible application-level rate limiting** beyond the `checkRateLimit` helper imported by forge.js. Verify it's actually invoked on every credit-spending endpoint (`forge`, `forge-iterate`, `upscale`, `vault-deploy`).
7. **Admin determined by hardcoded email** (`autonomistudiosllc@gmail.com`) in firestore.rules. Functional and fine for a single admin, but if you add a second admin this becomes an O(n) edit. Consider a `custom claim` approach (`request.auth.token.admin == true`) set via the Admin SDK.
8. **No `dangerouslySetInnerHTML`, `eval()`, or `new Function()` anywhere in `src/`, `api/`, or `lib/forge/`.** Good.
9. **No raw secret patterns (AIza…, sk-…, BEGIN PRIVATE KEY) found in committed source.** Good.
10. Firestore rules are well-structured: per-collection, owner-scoped, write-fields whitelisted, server-only writes for `generations` and `prop-covers`. The `users/{uid} { allow read: if isAdmin(); }` block at the bottom is redundant with the earlier `match /users/{uid}` — harmless but worth tidying.

---

## 7. Prioritized Punch List

**Do today (≤30 min):**
1. Add `.env` to `.gitignore`. Verify with `git ls-files .env`.
2. Remove `VITE_GOOGLE_API_KEY` / `VITE_FIREBASE_API_KEY` fallbacks from `gemini-client.js` and `gcp-raw.js`.
3. Run `vite build` again — confirm or refute the `MasterpieceReveal.tsx` failure.
4. Fix the two real type errors in `Workflow.tsx` (L72, L224).

**Do this week:**
5. `eslint . --fix` to clear the 28 unused-imports / unused-vars errors.
6. Lock CORS to a production origin allowlist; add security headers to `vercel.json`.
7. Audit every `<img>` in the inventory above and add real `alt` text or `alt=""`.
8. Convert the 4 `<div onClick>` instances to `<button>`.
9. Add `useReducedMotion()` gating to `CinematicIntro`, `MasterpieceReveal`, `LuxCursor`.
10. Deepen `text-muted` to ≥4.5:1 contrast (`#6E6A60` or similar).

**Do this sprint:**
11. Codemod the top 6 hex literals to Tailwind tokens; retire the 5 surplus near-blacks/creams.
12. Resolve the `firebase-admin` migration story — either finish removing it (per HANDOFF) or update HANDOFF to match reality.
13. Replace 17 `any`s in PayPal/Firebase glue with proper types; lift `Pricing.tsx` PayPal-SDK types into a `paypal.d.ts`.
14. Split `AuthContext.tsx` so it exports only the provider component (move `useAuth` and types to `auth.ts`) — fixes 4 `react-refresh/only-export-components` errors.

---

*Generated by an audit pass on the connected workspace. No code changes were made; this is a read-only report.*
