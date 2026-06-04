---
description: LuxAura "Atelier OS" design system — token architecture, the UI component library, and the Apple×Versace×Elle aesthetic rules. Use whenever building or modifying any UI.
---

# LuxAura — Atelier OS

**Aesthetic:** *Apple × Versace × Vanity Fair / Elle.*
Apple's material precision + restraint, Versace's confident editorial gold (intent, never excess),
Vanity Fair / Elle's Didone masthead typography and photo-led spreads.

> **The single source of truth is `src/styles/tokens.css`.** Never hard-code a hex that a
> token already covers. Tailwind utilities (`bg-canvas`, `text-secondary`, `border-hairline`,
> `text-gold`, `bg-gold`) are wired to those tokens in `tailwind.config.js`.

## Dual-surface architecture (the key idea)
- `:root` → **DARK ATELIER CHROME** (the app — default).
- `[data-surface="paper"]` → **LIGHT EDITORIAL SPREAD** (lookbook / gallery / export — Vanity Fair on ivory).
- Any component built on the semantic tokens **auto-reskins** when dropped inside a
  `data-surface="paper"` container. Build components against semantic tokens, not raw hex.

## Color tokens (semantic — consume these)
```
--surface-canvas / -sunken / -raised / -raised-2 / -overlay / -inset   (elevation ladder)
--text-primary / -secondary / -tertiary / -quaternary / -disabled       (Apple label model)
--hairline / --hairline-strong / --hairline-gold                         (separators)
--gold (#C5A253) / --gold-bright / --gold-deep / --gold-glow / --gold-wash / --gold-line
--accent → var(--gold)   (recolor the whole app from ONE line)
--success / --warning / --danger / --info  (+ -wash variants)
--shadow-sm/-md/-lg/-xl · --glow-gold · --material-chrome/-panel · --material-blur(-lg)
```
The accent is **champagne `#C5A253`** — refined warm gold, NOT brassy `#D4AF37` or olive `#B8952A` (both retired).
Gold appears with intent only: CTAs, active states, hairline rules, masthead kickers, status. Never everywhere.

## Typography (the magazine model)
- **Bodoni Moda** (`font-display`) — Didone masthead. Page titles, hero numerals, the editorial voice. Always *italic* for display.
- **Cormorant Garamond** (`font-serif`) — running editorial serif: pull quotes, lede copy, captions on paper spreads.
- **Inter** (`font-sans`) — all UI chrome (the Apple SF-analog workhorse).
- **JetBrains Mono** (`font-mono`) — spec labels, data, kickers, status. UPPERCASE, wide tracking (`0.2em–0.45em`).
- All four are loaded in `index.html`. Type scale + tracking + leading live in `tokens.css`.

## Component library — `src/components/ui` (import from the barrel)
```tsx
import { Button, Surface, Field, Label, Input, Textarea, Select,
         Badge, Masthead, Kicker, SectionLabel, MicroLabel, Editorial,
         Spinner, Divider, GoldRule } from '../components/ui';
```
- **Button** — `variant`: `forge` (signature gold Bodoni-italic CTA w/ sheen sweep) · `primary` (gold) · `secondary` · `ghost` · `danger`. `size` sm/md/lg, `loading`, `icon`, `fullWidth`.
- **Surface** — card/panel. `elevation` flat/raised/overlay, `active` (gold-locked), `interactive` (hover lift), `material` (frosted vibrancy).
- **Field / Select / Input / Textarea / Label** — Apple-clean controls, gold focus ring, token-backed.
- **Badge** — status pill. `tone` gold/success/warning/danger/info/neutral, `dot` (pulsing).
- **Masthead / Kicker / SectionLabel / MicroLabel / Editorial** — the type primitives.
- **Spinner** (gold-capped ring) · **Divider / GoldRule** (hairline / gold editorial rule).

## Motion — `src/lib/motion.ts`
Apple spring physics + the house expo-out ease `cubic-bezier(0.16,1,0.3,1)`.
Use `spring.{snappy,gentle,soft}`, `ease.*`, `dur.*`, variants `rise/fade/scaleIn/blurIn`,
`stagger(gap,delay)`, and `pageTransition` (used by `BrandPortalLayout`). Framer Motion for transitions.

## Rules
1. Consume semantic tokens; never reintroduce raw `#86868B`/`#1C1C1E`/`#B8952A`/`#D4AF37` for new work.
2. Champagne gold `#C5A253` is the only accent. Restraint = luxury (Apple) + the gold = the signature (Versace).
3. Page titles & big numerals → **Bodoni** (`font-display italic`). Body serif → Cormorant. UI → Inter. Labels → mono caps.
4. Radii are Apple-generous (cards `rounded-2xl`/16px, controls `rounded-xl`/12px, pills `rounded-pill`). NOT the old 4px.
5. Frosted material (`var(--material-*)` + `backdrop-filter`) for chrome/floating panels — the Apple signature.
6. Dark chrome is default; opt into light editorial spreads with `data-surface="paper"`.
7. The portal sets `cursor:auto`; the custom `LuxCursor` is for marketing pages only.

## The Lookbook — light editorial spread (the "paper" surface in production)
- Route `/portal/lookbook` (`src/pages/portal/Lookbook.tsx`), nav item in the shell, and a
  "View as Lookbook" entry in the Asset Vault.
- Pure pagination core: `src/lib/lookbook.js` (+ `lookbook.d.ts`). `paginate(plates, {brandName, title})`
  → cover → feature/duo spreads → colophon. Framework-free and unit-tested by the node audit.
- The viewer wraps each sheet in `data-surface="paper"`, so every token-built component flips to
  ivory ink automatically — dark Apple chrome frames the light Vanity-Fair spread.
- **Print / PDF**: the toolbar button calls `window.print()`; the `@media print` block in `index.css`
  reveals only `[data-print-root]` and lays each `.lookbook-print-page` on its own landscape sheet.
- To add ANY new light-surface view: wrap its root in `data-surface="paper"` and build with the same
  tokens + components — no per-instance overrides needed.

## Tests (no framework — extends the node audit harness)
- `audit/tests/design-system.js`:
  - `runDesignTokenTests` — static invariants: dual-surface defined, champagne `#C5A253` is the accent,
    retired golds (`#B8952A`/`#D4AF37`) absent, all 4 fonts loaded, Tailwind wired to tokens, lookbook
    route/nav wired, print support present.
  - `runLookbookPaginationTests` — unit tests of the pure core (cover/colophon bookends, every plate used
    once, contiguous folios, Roman numerals, deterministic season/meta).
- Wired into `audit/index.js` § 0b. Run: `npm run audit` (or `node audit/index.js --suite=design|lookbook`).
