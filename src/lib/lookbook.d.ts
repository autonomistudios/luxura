/**
 * Atelier OS — Lookbook types (declarations for the pure JS core in lookbook.js).
 * Consumed by the React viewer (typed) and validated at runtime by the node audit.
 */

/** Minimal plate shape the lookbook needs (a structural subset of VaultItem). */
export interface Plate {
  id: string;
  image: string;
  name?: string;
  category?: string;
  prompt?: string;
  skinTone?: string;
  lighting?: string;
  camera?: string;
  bg?: string;
  createdAt?: number;
}

export interface LookbookMeta {
  brandName: string;
  title: string;
  volume: string;
  /** Short season code, e.g. "SS26". */
  season: string;
  /** Long season, e.g. "Spring / Summer". */
  seasonLong: string;
  year: number;
  plateCount: number;
}

interface PageBase {
  meta: LookbookMeta;
  /** 1-based page index within the lookbook. */
  number: number;
  /** Total page count. */
  total: number;
}

export type LookbookPage =
  | ({ kind: 'empty' } & PageBase)
  | ({ kind: 'cover'; item: Plate } & PageBase)
  | ({ kind: 'spread'; layout: 'feature' | 'duo'; items: Plate[] } & PageBase)
  | ({ kind: 'colophon' } & PageBase);

export interface PaginateOptions {
  brandName?: string;
  title?: string;
  /** Override the "now" stamp for deterministic season derivation (tests). */
  nowMs?: number;
}

export function roman(n: number): string;
export function buildMeta(brandName: string, title: string, plates: Plate[], nowMs?: number): LookbookMeta;
export function paginate(plates: Plate[], opts?: PaginateOptions): LookbookPage[];
export function spreadPlates(pages: LookbookPage[]): Plate[];
