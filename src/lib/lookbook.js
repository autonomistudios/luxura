/**
 * Atelier OS — Lookbook pagination (pure, framework-free).
 *
 * Turns a flat list of vault plates into an ordered set of editorial magazine
 * pages: cover -> spreads (feature/duo rhythm) -> colophon. No DOM, no React,
 * no dependencies — so it is unit-tested directly by the node audit harness
 * (audit/tests/design-system.js). Types live in lookbook.d.ts.
 */

const ROMAN = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

/** Convert a positive integer to a Roman numeral ('' for n <= 0). */
export function roman(n) {
  let x = Math.floor(n);
  if (!Number.isFinite(x) || x <= 0) return '';
  let out = '';
  for (const [v, s] of ROMAN) while (x >= v) { out += s; x -= v; }
  return out;
}

/** Derive {year, season('SS26'), seasonLong} from an epoch-ms stamp (UTC, deterministic). */
function seasonFrom(ms) {
  const d = new Date(ms);
  const year = d.getUTCFullYear();
  const isSpringSummer = d.getUTCMonth() <= 5; // Jan–Jun
  return {
    year,
    season: `${isSpringSummer ? 'SS' : 'AW'}${String(year).slice(2)}`,
    seasonLong: isSpringSummer ? 'Spring / Summer' : 'Autumn / Winter',
  };
}

/**
 * Build deterministic masthead metadata. Pure given the same inputs (the season
 * is derived from the newest plate's createdAt, falling back to nowMs).
 */
export function buildMeta(brandName, title, plates, nowMs) {
  const fallback = typeof nowMs === 'number' ? nowMs : Date.now();
  const stamps = (plates || []).map(p => (p && p.createdAt) || 0).filter(Boolean);
  const stamp = stamps.length ? Math.max(...stamps) : fallback;
  const { year, season, seasonLong } = seasonFrom(stamp);
  return {
    brandName: brandName || 'LuxAura',
    title: title || 'The Lookbook',
    volume: 'I',
    season,
    seasonLong,
    year,
    plateCount: (plates || []).length,
  };
}

/**
 * Paginate plates into ordered lookbook pages.
 * Cover (hero = first plate) -> editorial spreads -> colophon.
 * Empty input yields a single 'empty' page so the viewer degrades gracefully.
 *
 * Contract (enforced by tests):
 *   - paginate([])            -> [{kind:'empty'}]
 *   - first page is 'cover', last page is 'colophon' (when plates exist)
 *   - every input plate appears in exactly one spread (cover hero may repeat)
 *   - page.number is 1-based and contiguous; page.total === pages.length
 */
export function paginate(plates, opts = {}) {
  const list = (Array.isArray(plates) ? plates : []).filter(Boolean);
  const meta = buildMeta(opts.brandName || '', opts.title || '', list, opts.nowMs);

  if (list.length === 0) {
    return [{ kind: 'empty', meta, number: 1, total: 1 }];
  }

  const spreads = [];
  // feature(1) / feature(1) / duo(2) rhythm — editorial variety, all plates used.
  let i = 0;
  let beat = 0;
  while (i < list.length) {
    const wantDuo = beat % 3 === 2;
    if (wantDuo && i + 1 < list.length) {
      spreads.push({ kind: 'spread', layout: 'duo', items: [list[i], list[i + 1]], meta });
      i += 2;
    } else {
      spreads.push({ kind: 'spread', layout: 'feature', items: [list[i]], meta });
      i += 1;
    }
    beat++;
  }

  const pages = [
    { kind: 'cover', item: list[0], meta },
    ...spreads,
    { kind: 'colophon', meta },
  ];
  const total = pages.length;
  return pages.map((p, idx) => ({ ...p, number: idx + 1, total }));
}

/** Flatten every plate that appears inside spread pages (viewer + test helper). */
export function spreadPlates(pages) {
  return (pages || [])
    .filter(p => p && p.kind === 'spread')
    .flatMap(p => p.items || []);
}
