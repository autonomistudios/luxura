import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Printer, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSovereignStore } from '../../store/useSovereignStore';
import { paginate, roman } from '../../lib/lookbook';
import type { LookbookPage, Plate } from '../../lib/lookbook';

/* Film-grain texture (subtle, multiplied over ivory paper). */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E\")";

// ── Editorial copy helpers ──────────────────────────────────────────────────
function titleOf(p?: Plate): string {
  return (p?.name || p?.category || 'Untitled Plate').trim();
}
function ledeOf(p?: Plate): string {
  const prompt = (p?.prompt || '').trim();
  if (prompt.length > 24) {
    return prompt.length > 220 ? prompt.slice(0, 220).replace(/\s+\S*$/, '') + '…' : prompt;
  }
  return 'A study in silk, shadow and engineered fidelity — the garment rendered identically across every frame of the sequence, without drift.';
}
function creditsOf(p?: Plate): [string, string][] {
  return ([
    ['Lighting', p?.lighting],
    ['Optics', p?.camera],
    ['Cast', p?.skinTone],
    ['Set', p?.bg],
  ] as [string, string | undefined][]).filter(([, v]) => !!v) as [string, string][];
}

// ── The paper sheet (flips tokens to ivory via data-surface) ─────────────────
function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-surface="paper"
      className="lookbook-sheet relative w-full aspect-[3/2] overflow-hidden rounded-[6px]"
      style={{ background: 'var(--surface-canvas)', color: 'var(--text-primary)', boxShadow: '0 40px 120px rgba(0,0,0,0.55)' }}
    >
      <div className="absolute inset-0 pointer-events-none z-10"
        style={{ backgroundImage: GRAIN, backgroundSize: '140px', opacity: 0.32, mixBlendMode: 'multiply' }} />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

function RunningHead({ page }: { page: Extract<LookbookPage, { meta: any }> }) {
  return (
    <div className="flex justify-between items-center pb-4 mb-6" style={{ borderBottom: '1px solid var(--hairline)' }}>
      <span className="font-mono text-[9px] tracking-[0.34em] uppercase text-tertiary">{page.meta.brandName}</span>
      <span className="font-mono text-[9px] tracking-[0.3em] uppercase" style={{ color: 'var(--gold)' }}>
        {page.meta.season} · Vol. {page.meta.volume}
      </span>
    </div>
  );
}

function PlateImage({ src, className = '', style }: { src?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: 'var(--surface-sunken)', ...style }}>
      {src
        ? <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center 22%' }} loading="lazy" />
        : <div className="absolute inset-0 flex items-center justify-center"><Sparkles size={20} className="text-quaternary" /></div>}
    </div>
  );
}

// ── Page layouts ─────────────────────────────────────────────────────────────
function Cover({ page }: { page: Extract<LookbookPage, { kind: 'cover' }> }) {
  const { meta, item } = page;
  return (
    <div className="relative h-full w-full">
      <PlateImage src={item?.image} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 z-[1]"
        style={{ background: 'linear-gradient(to top, rgba(16,12,6,.66) 0%, rgba(16,12,6,.12) 42%, rgba(16,12,6,.4) 100%)' }} />
      <div className="absolute inset-0 z-[2] flex flex-col justify-between p-10 text-white">
        <div className="flex justify-between items-start font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,.88)' }}>
          <span>{meta.brandName}</span>
          <span>Vol. {meta.volume} · {meta.season}</span>
        </div>
        <div className="text-center">
          <p className="font-mono text-[10px] tracking-[0.5em] uppercase mb-4" style={{ color: '#E4CC8F' }}>The Lookbook</p>
          <h1 className="font-display italic font-medium leading-[0.92]" style={{ fontSize: 'clamp(44px,7vw,96px)', letterSpacing: '-0.03em' }}>
            {meta.brandName}
          </h1>
          <p className="font-serif italic text-2xl mt-3" style={{ color: 'rgba(255,255,255,.82)' }}>{meta.seasonLong} {meta.year}</p>
        </div>
        <div className="text-center font-mono text-[9px] tracking-[0.4em] uppercase" style={{ color: 'rgba(255,255,255,.62)' }}>
          {meta.plateCount} Plates · Forged by the Atelier Engine
        </div>
      </div>
    </div>
  );
}

function Feature({ page }: { page: Extract<LookbookPage, { kind: 'spread' }> }) {
  const plate = page.items[0];
  const lede = ledeOf(plate);
  const credits = creditsOf(plate);
  return (
    <div className="grid grid-cols-[1.04fr_0.96fr] h-full">
      <div className="relative">
        <PlateImage src={plate?.image} className="absolute inset-0 h-full w-full" />
        <span className="absolute left-5 bottom-5 z-[2] font-mono text-[8px] tracking-[0.26em] uppercase"
          style={{ color: 'rgba(255,255,255,.9)', textShadow: '0 1px 8px rgba(0,0,0,.55)' }}>
          Plate {String(page.number).padStart(2, '0')}
        </span>
      </div>
      <div className="flex flex-col p-9 lg:p-11">
        <RunningHead page={page} />
        <p className="font-mono text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: 'var(--gold)' }}>
          {plate?.category || 'House Editorial'}
        </p>
        <h2 className="font-display italic font-medium text-primary leading-[0.98] mb-1"
          style={{ fontSize: 'clamp(28px,3.2vw,50px)', letterSpacing: '-0.02em' }}>
          {titleOf(plate)}
        </h2>
        <span className="block h-px w-14 my-5" style={{ background: 'var(--gold)', opacity: 0.6 }} />
        <p className="font-serif text-[16px] leading-relaxed text-secondary">
          <span className="float-left font-display italic font-semibold mr-3 mt-1"
            style={{ fontSize: '64px', lineHeight: '0.7', color: 'var(--gold)' }}>{lede.charAt(0)}</span>
          {lede.slice(1)}
        </p>
        <div className="mt-auto pt-6 grid grid-cols-2 gap-x-6 gap-y-3" style={{ borderTop: '1px solid var(--hairline)' }}>
          {credits.length > 0 ? credits.map(([k, v]) => (
            <div key={k}>
              <div className="font-mono text-[8px] tracking-[0.28em] uppercase text-quaternary mb-1">{k}</div>
              <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-tertiary truncate">{v}</div>
            </div>
          )) : (
            <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-quaternary">DNA-Locked · 2K Fidelity</div>
          )}
        </div>
        <div className="flex justify-between items-center mt-5 font-mono text-[8px] tracking-[0.3em] uppercase text-quaternary">
          <span>Forged · DNA-Locked</span>
          <span className="font-display italic text-tertiary text-[13px]">— {roman(page.number)} —</span>
        </div>
      </div>
    </div>
  );
}

function Duo({ page }: { page: Extract<LookbookPage, { kind: 'spread' }> }) {
  return (
    <div className="h-full flex flex-col p-9 lg:p-11">
      <RunningHead page={page} />
      <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
        {page.items.map((plate, i) => (
          <figure key={plate?.id || i} className="flex flex-col min-h-0">
            <PlateImage src={plate?.image} className="flex-1 rounded-[3px]" />
            <figcaption className="flex items-center justify-between pt-3">
              <span className="font-mono text-[8px] tracking-[0.26em] uppercase text-tertiary truncate">{titleOf(plate)}</span>
              <span className="font-mono text-[8px] tracking-[0.22em] uppercase" style={{ color: 'var(--gold)' }}>
                {plate?.lighting || 'Editorial'}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="flex justify-between items-center mt-6 pt-5 font-mono text-[8px] tracking-[0.3em] uppercase text-quaternary"
        style={{ borderTop: '1px solid var(--hairline)' }}>
        <span>{page.meta.brandName} · {page.meta.seasonLong} {page.meta.year}</span>
        <span className="font-display italic text-tertiary text-[13px]">— {roman(page.number)} —</span>
      </div>
    </div>
  );
}

function Colophon({ page }: { page: Extract<LookbookPage, { kind: 'colophon' }> }) {
  const { meta } = page;
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-12">
      <p className="font-mono text-[10px] tracking-[0.5em] uppercase mb-6" style={{ color: 'var(--gold)' }}>Colophon</p>
      <h2 className="font-display italic font-medium text-primary" style={{ fontSize: 'clamp(40px,5vw,76px)', letterSpacing: '-0.02em' }}>Fin.</h2>
      <span className="block h-px w-16 my-7" style={{ background: 'var(--gold)', opacity: 0.6 }} />
      <p className="font-serif italic text-secondary text-xl max-w-md leading-relaxed">
        {meta.brandName} — {meta.seasonLong} {meta.year}. {meta.plateCount} plates, each held to its frozen DNA across the full sequence.
      </p>
      <p className="font-mono text-[8px] tracking-[0.4em] uppercase text-quaternary mt-9">
        Forged by the Atelier Engine · LuxAura Creation Studio
      </p>
    </div>
  );
}

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-12 gap-5">
      <p className="font-display italic text-primary" style={{ fontSize: 'clamp(32px,4vw,52px)' }}>An empty atelier</p>
      <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-tertiary">Forge a campaign to fill your lookbook</p>
      <button onClick={() => navigate('/portal/campaigns/new')}
        className="mt-2 px-6 py-3 rounded-xl font-mono text-[10px] tracking-[0.2em] uppercase text-on-accent"
        style={{ background: 'linear-gradient(180deg,var(--gold-bright),var(--gold) 60%,var(--gold-deep))' }}>
        Open the Forge
      </button>
    </div>
  );
}

function renderPage(page: LookbookPage) {
  switch (page.kind) {
    case 'cover':    return <Cover page={page} />;
    case 'spread':   return page.layout === 'duo' ? <Duo page={page} /> : <Feature page={page} />;
    case 'colophon': return <Colophon page={page} />;
    default:         return <EmptyState />;
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Lookbook() {
  const { brand } = useAuth();
  const { vaultAssets } = useSovereignStore();
  const navigate = useNavigate();

  const pages = useMemo(
    () => paginate(vaultAssets as unknown as Plate[], { brandName: brand?.name, title: 'The Lookbook' }),
    [vaultAssets, brand?.name],
  );

  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const last = pages.length - 1;
  const clamped = Math.min(idx, last);

  const go = useCallback((delta: number) => {
    setDir(delta);
    setIdx(i => Math.max(0, Math.min(last, i + delta)));
  }, [last]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Escape') navigate('/portal/vault');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, navigate]);

  return (
    <div className="relative min-h-full bg-canvas flex flex-col select-none" style={{ cursor: 'auto' }}>

      {/* Toolbar (dark chrome) */}
      <div data-print-hide className="flex items-center justify-between px-8 py-5 border-b border-hairline shrink-0">
        <div className="flex items-baseline gap-4">
          <span className="font-display italic font-medium text-[22px] text-primary">The Lookbook</span>
          <span className="font-mono text-[9px] tracking-[0.34em] uppercase text-tertiary">
            {brand?.name || 'LuxAura'} · {pages[0]?.meta.season}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-tertiary tabular-nums mr-1">
            {String(clamped + 1).padStart(2, '0')} / {String(pages.length).padStart(2, '0')}
          </span>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-hairline text-secondary hover:text-primary hover:border-hairline-strong transition-all font-mono text-[10px] tracking-[0.2em] uppercase">
            <Printer size={13} /> Print / PDF
          </button>
          <button onClick={() => navigate('/portal/vault')}
            className="p-2 rounded-xl border border-hairline text-tertiary hover:text-primary hover:border-hairline-strong transition-all" title="Close (Esc)">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Stage — centered paper sheet on the dark mat */}
      <div data-print-hide className="flex-1 flex items-center justify-center px-6 lg:px-20 py-8 relative">
        {clamped > 0 && (
          <button onClick={() => go(-1)} aria-label="Previous page"
            className="absolute left-4 lg:left-8 z-20 w-11 h-11 rounded-full flex items-center justify-center border border-hairline bg-raised/60 backdrop-blur-md text-secondary hover:text-primary hover:border-hairline-gold transition-all">
            <ChevronLeft size={18} />
          </button>
        )}

        <div className="w-full max-w-5xl" style={{ perspective: 1800 }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={clamped}
              custom={dir}
              initial={{ opacity: 0, x: dir * 50, rotateY: dir * 4 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: dir * -50, rotateY: dir * -4 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              {pages[clamped] && <Sheet>{renderPage(pages[clamped])}</Sheet>}
            </motion.div>
          </AnimatePresence>
        </div>

        {clamped < last && (
          <button onClick={() => go(1)} aria-label="Next page"
            className="absolute right-4 lg:right-8 z-20 w-11 h-11 rounded-full flex items-center justify-center border border-hairline bg-raised/60 backdrop-blur-md text-secondary hover:text-primary hover:border-hairline-gold transition-all">
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Folio dots */}
      <div data-print-hide className="shrink-0 flex items-center justify-center gap-1.5 pb-7">
        {pages.map((_, i) => (
          <button key={i} onClick={() => { setDir(i > clamped ? 1 : -1); setIdx(i); }} aria-label={`Page ${i + 1}`}
            className="h-1 rounded-full transition-all duration-300"
            style={{
              width: i === clamped ? 22 : 6,
              background: i === clamped ? 'var(--gold)' : 'var(--hairline-strong)',
            }} />
        ))}
      </div>

      {/* Print-only: every page stacked, each its own sheet (data-print-root) */}
      <div data-print-root className="hidden print:block">
        {pages.map((p, i) => (
          <div key={i} className="lookbook-print-page">
            <Sheet>{renderPage(p)}</Sheet>
          </div>
        ))}
      </div>
    </div>
  );
}
