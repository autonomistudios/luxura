/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  DESIGN SYSTEM AUDIT — Atelier OS                                         ║
 * ║  Two suites:                                                              ║
 * ║   1. runDesignTokenTests       — static invariants of the token system,   ║
 * ║      fonts, dual-surface, lookbook wiring & print support.                ║
 * ║   2. runLookbookPaginationTests — unit tests of the pure pagination core. ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
import { readFileSync } from 'node:fs';
import { paginate, roman, buildMeta, spreadPlates } from '../../src/lib/lookbook.js';

const T = (pass, label, detail) => ({ pass: !!pass, label, detail: detail || null });
const read = (rel) => {
  try { return readFileSync(new URL('../../' + rel, import.meta.url), 'utf8'); }
  catch (e) { return ''; }
};

// ─────────────────────────────────────────────────────────────────────────────
// 1 · DESIGN TOKEN & WIRING INVARIANTS
// ─────────────────────────────────────────────────────────────────────────────
export function runDesignTokenTests() {
  const out = [];
  const tokens = read('src/styles/tokens.css');
  const html   = read('index.html');
  const tw     = read('tailwind.config.js');
  const css    = read('src/index.css');
  const app    = read('src/App.tsx');
  const layout = read('src/components/BrandPortalLayout.tsx');

  // — Token file exists & defines the dual-surface system
  out.push(T(tokens.length > 0, 'tokens.css exists (single source of truth)'));
  out.push(T(tokens.includes(':root'), 'tokens.css defines :root (dark atelier chrome)'));
  out.push(T(tokens.includes('[data-surface="paper"]'), 'tokens.css defines [data-surface="paper"] (light editorial spread)'));

  // — Champagne gold is the accent; the retired golds must NOT reappear
  out.push(T(/--gold:\s*#C5A253/i.test(tokens), 'Accent gold is champagne #C5A253'));
  out.push(T(!/#B8952A/i.test(tokens), 'Retired bronze gold #B8952A absent from tokens', '#B8952A found — re-unify to #C5A253'));
  out.push(T(!/#D4AF37/i.test(tokens), 'Retired brassy gold #D4AF37 absent from tokens', '#D4AF37 found — re-unify to #C5A253'));

  // — Dual-surface canvases differ (dark near-black vs ivory paper)
  out.push(T(/#08080A/i.test(tokens), 'Dark canvas #08080A present (chrome surface)'));
  out.push(T(/#F4F1EA/i.test(tokens), 'Ivory canvas #F4F1EA present (paper surface)'));
  out.push(T(tokens.includes('--text-primary') && tokens.includes('--hairline'), 'Semantic text/hairline tokens defined'));

  // — Fonts actually loaded (no silent Courier fallback)
  out.push(T(html.includes('Bodoni+Moda'), 'Bodoni Moda (Didone masthead) loaded in index.html'));
  out.push(T(html.includes('Cormorant+Garamond'), 'Cormorant Garamond (editorial serif) loaded'));
  out.push(T(html.includes('family=Inter') || html.includes('&family=Inter'), 'Inter (UI sans) loaded'));
  out.push(T(html.includes('JetBrains+Mono'), 'JetBrains Mono (spec labels) loaded — kills Courier fallback'));

  // — Tailwind is wired to the tokens, not hard-coded hex
  out.push(T(tw.includes('var(--surface-canvas)'), 'Tailwind maps surfaces to tokens (var(--surface-canvas))'));
  out.push(T(tw.includes('var(--gold)'), 'Tailwind maps gold to token (var(--gold))'));
  out.push(T(/display:\s*\[\s*'Bodoni Moda'/.test(tw), "Tailwind font-display → 'Bodoni Moda'"));

  // — Lookbook is wired end-to-end
  out.push(T(/path="lookbook"/.test(app), 'Lookbook route registered in App.tsx'));
  out.push(T(/import\(['"]\.\/pages\/portal\/Lookbook['"]\)/.test(app), 'Lookbook lazy-imported in App.tsx'));
  out.push(T(layout.includes('/portal/lookbook'), 'Lookbook nav item present in BrandPortalLayout'));

  // — Print / PDF support exists
  out.push(T(css.includes('@media print'), 'Print stylesheet present (@media print)'));
  out.push(T(css.includes('data-print-root') && css.includes('lookbook-print-page'), 'Print targets the lookbook print container'));

  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2 · LOOKBOOK PAGINATION (pure core)
// ─────────────────────────────────────────────────────────────────────────────
const makePlates = (n, base = 1738368000000) =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i}`, image: `img${i}.png`, name: `Plate ${i}`, createdAt: base + i * 1000 }));

export function runLookbookPaginationTests() {
  const out = [];

  // — Empty input degrades gracefully
  const empty = paginate([]);
  out.push(T(empty.length === 1 && empty[0].kind === 'empty', 'paginate([]) → single empty page'));
  out.push(T(empty[0].number === 1 && empty[0].total === 1, 'empty page numbered 1/1'));

  // — Structural contract across a range of plate counts
  for (const n of [1, 2, 3, 5, 6, 12, 27]) {
    const plates = makePlates(n);
    const pages  = paginate(plates, { brandName: 'Test House', title: 'The Lookbook' });

    out.push(T(pages[0].kind === 'cover', `n=${n}: first page is cover`));
    out.push(T(pages[pages.length - 1].kind === 'colophon', `n=${n}: last page is colophon`));

    const contiguous = pages.every((p, i) => p.number === i + 1 && p.total === pages.length);
    out.push(T(contiguous, `n=${n}: page numbers contiguous & total correct`));

    // every input plate appears exactly once across spreads
    const ids = spreadPlates(pages).map(p => p.id);
    const unique = new Set(ids);
    out.push(T(ids.length === n && unique.size === n, `n=${n}: every plate appears exactly once in spreads`,
      `got ${ids.length} plate refs (${unique.size} unique) for ${n} inputs`));

    out.push(T(pages[0].item && pages[0].item.id === plates[0].id, `n=${n}: cover hero is the first plate`));
  }

  // — Roman numerals
  const romanCases = [[1, 'I'], [4, 'IV'], [5, 'V'], [9, 'IX'], [14, 'XIV'], [40, 'XL'], [90, 'XC'], [0, ''], [-3, '']];
  for (const [n, expected] of romanCases) {
    out.push(T(roman(n) === expected, `roman(${n}) === "${expected}"`, `got "${roman(n)}"`));
  }

  // — buildMeta: deterministic + correct season derivation (UTC)
  const feb = buildMeta('House', 'X', [{ id: 'a', image: 'i', createdAt: Date.UTC(2026, 1, 15) }]); // Feb → SS
  const oct = buildMeta('House', 'X', [{ id: 'b', image: 'i', createdAt: Date.UTC(2026, 9, 15) }]); // Oct → AW
  out.push(T(feb.season === 'SS26', 'buildMeta: Feb 2026 → season SS26', `got ${feb.season}`));
  out.push(T(oct.season === 'AW26', 'buildMeta: Oct 2026 → season AW26', `got ${oct.season}`));
  out.push(T(feb.year === 2026 && feb.plateCount === 1, 'buildMeta: year + plateCount correct'));

  const m1 = buildMeta('House', 'X', makePlates(4));
  const m2 = buildMeta('House', 'X', makePlates(4));
  out.push(T(JSON.stringify(m1) === JSON.stringify(m2), 'buildMeta is deterministic for equal inputs'));

  return out;
}
