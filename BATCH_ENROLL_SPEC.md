# Build Spec — SKU Batch Enrollment (Library Module, Phase 2)

**For:** Sonnet 4.6, medium effort. Self-contained — everything you need is here. Match the existing
dark "quiet-luxury" portal aesthetic exactly (see Design Tokens below). Do not invent new styling.

**Goal:** Let a brand enroll *many* garments in one pass instead of one at a time. Two modes,
chosen per batch (the user explicitly wants both):
- **One per garment** (fast lane): each dropped image becomes its own draft SKU.
- **Group angles**: 1–3 images grouped into a single SKU (front / back / detail).

---

## 0. Reuse first — extract shared constants (do this before building the page)

`ANCHOR_TYPES`, `STEPS`, and the category list are currently defined *inline* in
[src/pages/portal/SKUEnrollmentFlow.tsx](src/pages/portal/SKUEnrollmentFlow.tsx). To avoid
duplication, create **`src/lib/skuConstants.ts`** exporting:

```ts
export const ANCHOR_TYPES = [ /* the 12 entries verbatim from SKUEnrollmentFlow.tsx lines 8–21 */ ];
export const SKU_CATEGORIES = ['Outerwear','Tops','Dresses','Trousers','Footwear','Accessories','Swimwear','Beauty'];
```

Then update `SKUEnrollmentFlow.tsx` to import from it (delete its local copies). The batch page
imports from it too. **Net effect:** single source of truth, both flows stay in sync.

---

## 1. Route & entry points

- **New page:** `src/pages/portal/SKUBatchEnroll.tsx`
- **Route:** add to [src/App.tsx](src/App.tsx) inside the `/portal` nested routes, next to the
  existing `skus/enroll`:
  ```tsx
  const SKUBatchEnroll = lazy(() => import('./pages/portal/SKUBatchEnroll'));
  // ...
  <Route path="skus/batch" element={<SKUBatchEnroll />} />
  ```
- **Entry from catalog:** in [src/pages/portal/SKUCatalog.tsx](src/pages/portal/SKUCatalog.tsx),
  add a secondary button beside the existing "Enroll SKU" header button (line ~222):
  `Batch Enroll` → `navigate('/portal/skus/batch')` (outline style, `Layers` or `Upload` icon).

---

## 2. API contract (already exists — reuse exactly, do NOT build a new endpoint)

`POST /api/v1/skus/enroll` — one call per SKU.

```ts
headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` }
body:    { name, skuCode, category, season, anchorType,
           sourceImage: <base64 dataURL>, additionalImages: <base64 dataURL[]> }
returns: { skuId, fidelityScore, referenceImageUrl }   // resolves 'ready' synchronously
```

- `idToken` via `useAuth()` → `user.getIdToken()`.
- `brandId` via `useAuth()` → `brand?.brandId`.
- base64 via the same `toBase64` FileReader helper in SKUEnrollmentFlow.tsx (lines 101–106).
- On success, push to the store: `useSovereignStore().addSku({...})` with the same SkuDocument
  shape as SKUEnrollmentFlow.tsx lines 141–146 (`enrollmentStatus: 'ready'`, the returned
  `fidelityScore` and `referenceImage`).

⚠️ **This endpoint is heavy** (runs DNA extraction + isolation render + fidelity scoring,
~10–40s each). Batch MUST throttle — see §5.

---

## 3. Draft data model (component state)

```ts
type DraftStatus = 'idle' | 'queued' | 'enrolling' | 'ready' | 'failed';

interface DraftSku {
  localId:     string;        // crypto.randomUUID()
  files:       File[];        // 1 in "one-per-garment"; 1–3 in "group angles"
  previews:    string[];      // URL.createObjectURL per file
  name:        string;        // required, >=2 chars
  skuCode:     string;
  category:    string;
  season:      string;
  anchorType:  string;        // default 'FULL_OUTFIT'
  status:      DraftStatus;
  error:       string | null;
  skuId:       string | null; // set on success
  fidelity:    number | null; // set on success
}
```

`mode: 'one' | 'group'` is page-level state (the toggle).

---

## 4. UX flow & layout

Header: serif italic `h1` "Batch Enrollment" + mono sub-label
`{drafts.length} GARMENTS STAGED · {readyCount} ENROLLED`. Back link to SKU Vault.

**Mode toggle** (segmented control, gold-active styling like CampaignBuilder's output-mode toggle):
`One per garment` | `Group angles`. Switching mode with staged drafts: confirm + re-derive drafts
(in "one" → each file its own draft; in "group" → all loose files go to an unassigned tray).

**Dropzone** (reuse the dashed-border style from `EnrollDropzone` in SKUCatalog.tsx lines 153–184):
accepts multiple images (`<input type="file" accept="image/*" multiple>` + drag/drop).
- **one** mode: each dropped file → one `DraftSku` appended.
- **group** mode: dropped files enter an "Unassigned (N)" tray; user multi-selects thumbnails and
  clicks "Group into SKU" → creates one `DraftSku` with up to 3 images (slice(0,3)).

**Draft table** — one glass-panel row per `DraftSku` (card style from SKUCard / ConfigSelect):
| col | control |
|---|---|
| Thumbnail(s) | 1 (one-mode) or stacked up to 3 (group-mode), with remove-image X in group-mode |
| Name * | text input |
| SKU code | text input |
| Category | select (`SKU_CATEGORIES`) |
| Season | text input |
| Anchor type | select (`ANCHOR_TYPES`) |
| Status | dot+label using the STATUS color map from SKUCatalog.tsx lines 40–46 (queued→white, enrolling→amber pulse, ready→gold + fidelity %, failed→rose) |
| Remove row | X button (disabled while enrolling) |

**Bulk helpers** (a row above the table):
- `Apply category to all`, `Apply season to all` (set from a small inline control).
- `Auto-number SKU codes` — prompt for a prefix (e.g. `BLB-SS26-`), fill `prefix + zero-padded index`.

---

## 5. Enroll orchestration (the careful part)

Button: **`Enroll {validCount} SKUs`** (disabled unless ≥1 valid draft and none currently enrolling).

Validation per draft (mirror single-flow): `name.trim().length >= 2 && files.length >= 1 && anchorType`.

Run with a **concurrency limit of 2** (endpoint is heavy; >2 risks timeouts/quota spikes). Write a
tiny inline runner — do NOT add a dependency:

```ts
async function runWithLimit<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  const queue = [...items];
  const lanes = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) { const item = queue.shift()!; await worker(item); }
  });
  await Promise.all(lanes);
}
```

Per draft worker:
1. set status `enrolling`.
2. base64-encode files (`toBase64`), split `[primary, ...additional]`.
3. POST to `/api/v1/skus/enroll` with the body in §2.
4. on ok: status `ready`, store `skuId`/`fidelity`, call `addSku(...)`.
5. on error: status `failed`, store `error` message. **Do not abort the batch** — other lanes continue.

Show a top progress strip: `{done}/{total}` with a gold fill (reuse CampaignBuilder's progress bar
treatment). While enrolling, lock the mode toggle and dropzone.

**Completion summary:** when all settled, show `X enrolled · Y failed`. If any failed, offer
`Retry failed` (re-runs only `status==='failed'` drafts) and keep their rows editable. Provide a
`Done → SKU Vault` button (`navigate('/portal/skus')`).

---

## 6. Image handling

Each enroll request carries only ONE SKU's images, so payload-per-request is small — but still guard
against giant uploads. Before base64, downscale any image whose longest edge > 1600px to 1600px at
0.85 JPEG quality (canvas). Reuse the compression approach from
[src/pages/GarmentStudio.tsx](src/pages/GarmentStudio.tsx) `compressImage` (~line 327) if you can
import/extract it; otherwise replicate it locally. Revoke object URLs on unmount.

---

## 7. Design tokens (match exactly — no Material/shadcn defaults)

- Gold: `#B8952A` (primary), `#D4AF37` (bright accent). Backgrounds: `#050505`, `#0B0B0E`, `#0D0D10`,
  card gradient `linear-gradient(145deg, #111116 0%, #0B0B0E 100%)`.
- Headings: serif italic (`font-serif italic`, the Cormorant family). Micro-labels: `font-mono`,
  uppercase, `tracking-[0.3em]`–`[0.45em]`, sizes `7px`–`11px`, color `text-white/25`–`/30`.
- Borders `rgba(255,255,255,0.06)`; gold focus/hover `rgba(184,149,42,0.3)`.
- Framer Motion for row enter (`initial opacity:0 y:16 → animate`), AnimatePresence on remove.
- Status dot colors: ready `#10B981`/gold, processing/enrolling `#F59E0B` (pulse), failed `#EF4444`.

---

## 8. Acceptance criteria

- [ ] `npx tsc --noEmit` clean; `npm run build` succeeds.
- [ ] `/portal/skus/batch` renders; reachable from SKU Vault "Batch Enroll".
- [ ] Drop 5 images in **one** mode → 5 draft rows, each editable, `Enroll 5 SKUs` works with
      max 2 concurrent, rows transition queued→enrolling→ready, and 5 cards appear in SKU Vault.
- [ ] **group** mode: select 3 images → 1 SKU draft with 3 thumbnails → enrolls as a single SKU.
- [ ] A failed row does not abort the batch; `Retry failed` re-runs only those.
- [ ] `ANCHOR_TYPES`/`SKU_CATEGORIES` now imported from `src/lib/skuConstants.ts` in BOTH the batch
      page and `SKUEnrollmentFlow.tsx` (no duplicated literals).
- [ ] Visually indistinguishable in styling language from `SKUCatalog` / `CampaignBuilder`.

---

## 9. Out of scope (don't build now)

Server-side batch endpoint, CSV import of metadata, drag-reorder of rows, multi-brand. Note them as
TODOs if you touch adjacent code, but do not implement.
