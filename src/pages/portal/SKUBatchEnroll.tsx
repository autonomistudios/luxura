import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, X, ChevronLeft, Check, AlertTriangle,
  Layers, RefreshCw, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSovereignStore } from '../../store/useSovereignStore';
import { ANCHOR_TYPES, SKU_CATEGORIES } from '../../lib/skuConstants';

// ─── Types ────────────────────────────────────────────────────────────────────

type DraftStatus = 'idle' | 'queued' | 'enrolling' | 'ready' | 'failed';
type BatchMode   = 'one' | 'group';

interface DraftSku {
  localId:    string;
  files:      File[];
  previews:   string[];
  name:       string;
  skuCode:    string;
  category:   string;
  season:     string;
  anchorType: string;
  status:     DraftStatus;
  error:      string | null;
  skuId:      string | null;
  fidelity:   number | null;
}

// ─── Status config (mirrors SKUCatalog STATUS map) ─────────────────────────────

const STATUS_CFG: Record<DraftStatus, { label: string; color: string; dot: string; pulse?: boolean }> = {
  idle:      { label: 'DRAFT',      color: 'rgba(255,255,255,0.30)', dot: 'bg-white/20' },
  queued:    { label: 'QUEUED',     color: 'rgba(255,255,255,0.30)', dot: 'bg-white/20' },
  enrolling: { label: 'ENROLLING',  color: '#F59E0B',               dot: 'bg-amber-500', pulse: true },
  ready:     { label: 'DNA LOCKED', color: '#C5A253',               dot: 'bg-[#C5A253]' },
  failed:    { label: 'FAILED',     color: '#EF4444',               dot: 'bg-rose-500' },
};

// ─── Image helpers ─────────────────────────────────────────────────────────────

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function compressImage(base64: string, maxDim = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src      = base64;
    img.onerror  = () => resolve(base64);
    img.onload   = () => {
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round((h / w) * maxDim); w = maxDim; }
        else       { w = Math.round((w / h) * maxDim); h = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
}

function makePreviews(files: File[]): string[] {
  return files.map(f => URL.createObjectURL(f));
}

function revokePreviews(previews: string[]) {
  previews.forEach(p => { try { URL.revokeObjectURL(p); } catch {} });
}

// ─── Concurrency runner ────────────────────────────────────────────────────────

async function runWithLimit<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
) {
  const queue = [...items];
  const lanes = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift()!;
      await worker(item);
    }
  });
  await Promise.all(lanes);
}

// ─── Draft row ────────────────────────────────────────────────────────────────

function DraftRow({
  draft, mode, isRunning,
  onChange, onRemove, onRemoveImage,
}: {
  draft:         DraftSku;
  mode:          BatchMode;
  isRunning:     boolean;
  onChange:      (localId: string, patch: Partial<DraftSku>) => void;
  onRemove:      (localId: string) => void;
  onRemoveImage: (localId: string, imgIdx: number) => void;
}) {
  const cfg    = STATUS_CFG[draft.status];
  const locked = draft.status === 'enrolling' || draft.status === 'ready';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
      className="rounded overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)',
        border: draft.status === 'ready'
          ? '1px solid rgba(197,162,83,0.25)'
          : draft.status === 'failed'
            ? '1px solid rgba(239,68,68,0.20)'
            : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-start gap-4 p-4">

        {/* Thumbnail(s) */}
        <div className="flex gap-1.5 flex-shrink-0">
          {draft.previews.slice(0, 3).map((src, i) => (
            <div key={i} className="relative w-14 h-[72px] rounded overflow-hidden flex-shrink-0"
              style={{ border: i === 0 ? '1px solid rgba(197,162,83,0.35)' : '1px solid rgba(255,255,255,0.08)' }}>
              <img src={src} className="w-full h-full object-cover" alt="" />
              {mode === 'group' && !locked && draft.previews.length > 1 && (
                <button
                  onClick={() => onRemoveImage(draft.localId, i)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/80 flex items-center justify-center hover:bg-rose-500 transition-colors"
                >
                  <X size={8} className="text-white" />
                </button>
              )}
              {i === 0 && draft.previews.length > 1 && (
                <span className="absolute bottom-0.5 left-0.5 text-[5px] font-mono text-[#C5A253] bg-black/70 px-1 rounded tracking-wider uppercase">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Fields */}
        <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Name */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-1">
            <label className="text-[7px] font-mono tracking-[0.35em] uppercase text-white/25">Name *</label>
            <input
              value={draft.name}
              onChange={e => onChange(draft.localId, { name: e.target.value })}
              disabled={locked}
              placeholder="Garment name"
              className="px-2 py-1.5 rounded text-[11px] font-medium text-white outline-none disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* SKU code */}
          <div className="flex flex-col gap-1">
            <label className="text-[7px] font-mono tracking-[0.35em] uppercase text-white/25">SKU code</label>
            <input
              value={draft.skuCode}
              onChange={e => onChange(draft.localId, { skuCode: e.target.value })}
              disabled={locked}
              placeholder="BLB-SS26-001"
              className="px-2 py-1.5 rounded text-[11px] font-mono text-white/70 outline-none disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1">
            <label className="text-[7px] font-mono tracking-[0.35em] uppercase text-white/25">Category</label>
            <select
              value={draft.category}
              onChange={e => onChange(draft.localId, { category: e.target.value })}
              disabled={locked}
              className="px-2 py-1.5 rounded text-[11px] font-mono text-white/70 outline-none appearance-none disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <option value="">Category</option>
              {SKU_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Season */}
          <div className="flex flex-col gap-1">
            <label className="text-[7px] font-mono tracking-[0.35em] uppercase text-white/25">Season</label>
            <input
              value={draft.season}
              onChange={e => onChange(draft.localId, { season: e.target.value })}
              disabled={locked}
              placeholder="SS26"
              className="px-2 py-1.5 rounded text-[11px] font-mono text-white/70 outline-none disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Anchor type */}
          <div className="col-span-2 md:col-span-4 flex flex-col gap-1">
            <label className="text-[7px] font-mono tracking-[0.35em] uppercase text-white/25">Anchor type</label>
            <div className="flex flex-wrap gap-1.5">
              {ANCHOR_TYPES.map(at => (
                <button
                  key={at.id}
                  onClick={() => onChange(draft.localId, { anchorType: at.id })}
                  disabled={locked}
                  className="px-2 py-1 rounded text-[8px] font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: draft.anchorType === at.id ? 'rgba(197,162,83,0.12)' : 'rgba(255,255,255,0.02)',
                    border:     draft.anchorType === at.id ? '1px solid rgba(197,162,83,0.35)' : '1px solid rgba(255,255,255,0.06)',
                    color:      draft.anchorType === at.id ? '#C5A253' : 'rgba(255,255,255,0.35)',
                  }}
                >
                  {at.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status + remove */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
            <span className="text-[7px] font-mono tracking-[0.3em]" style={{ color: cfg.color }}>{cfg.label}</span>
            {draft.status === 'ready' && draft.fidelity != null && (
              <span className="text-[7px] font-mono text-[#C5A253]/60 ml-1">{draft.fidelity}%</span>
            )}
          </div>

          {draft.status === 'failed' && draft.error && (
            <p className="text-[7px] font-mono text-rose-400/70 max-w-[140px] text-right leading-relaxed">{draft.error}</p>
          )}

          {draft.status === 'ready' && (
            <Check size={13} className="text-emerald-500" />
          )}

          {!locked && (
            <button
              onClick={() => onRemove(draft.localId)}
              disabled={isRunning}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-rose-500/15 transition-colors disabled:opacity-30"
            >
              <X size={12} className="text-white/30 hover:text-rose-400" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Unassigned tray (group mode) ──────────────────────────────────────────────

function UnassignedTray({
  files, selected, onToggle, onGroup, onClear,
}: {
  files:    File[];
  selected: Set<number>;
  onToggle: (i: number) => void;
  onGroup:  () => void;
  onClear:  (i: number) => void;
}) {
  if (!files.length) return null;

  return (
    <div className="rounded p-4 mb-4"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.10)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[8px] font-mono tracking-[0.4em] uppercase text-white/30">
          Unassigned ({files.length}) — select images to group into one SKU
        </span>
        {selected.size > 0 && (
          <button
            onClick={onGroup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#C5A253] text-black text-[9px] font-mono tracking-[0.2em] uppercase font-semibold"
          >
            <Layers size={10} /> Group into SKU ({Math.min(selected.size, 3)})
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {files.map((f, i) => {
          const url = URL.createObjectURL(f);
          const sel = selected.has(i);
          return (
            <div
              key={i}
              className="relative w-16 h-20 rounded overflow-hidden cursor-pointer transition-all"
              style={{
                border: sel ? '2px solid rgba(197,162,83,0.70)' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: sel ? '0 0 10px rgba(197,162,83,0.20)' : 'none',
              }}
              onClick={() => onToggle(i)}
            >
              <img src={url} className="w-full h-full object-cover" alt="" />
              {sel && (
                <div className="absolute inset-0 bg-[#C5A253]/20 flex items-center justify-center">
                  <Check size={14} className="text-[#C5A253]" />
                </div>
              )}
              <button
                onClick={e => { e.stopPropagation(); onClear(i); URL.revokeObjectURL(url); }}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/80 flex items-center justify-center hover:bg-rose-500 transition-colors"
              >
                <X size={8} className="text-white" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SKUBatchEnroll() {
  const { brand, user } = useAuth();
  const { addSku }      = useSovereignStore();
  const navigate        = useNavigate();

  const [mode, setMode]       = useState<BatchMode>('one');
  const [drafts, setDrafts]   = useState<DraftSku[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Group-mode unassigned tray
  const [unassigned, setUnassigned]     = useState<File[]>([]);
  const [traySelected, setTraySelected] = useState<Set<number>>(new Set());

  // Progress
  const [doneCount,  setDoneCount]  = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Bulk helpers state
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkSeason,   setBulkSeason]   = useState('');
  const [skuPrefix,    setSkuPrefix]    = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke all object URLs on unmount
  useEffect(() => {
    return () => {
      drafts.forEach(d => revokePreviews(d.previews));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Draft helpers ───────────────────────────────────────────────────────────

  function makeDraft(files: File[]): DraftSku {
    return {
      localId:    crypto.randomUUID(),
      files,
      previews:   makePreviews(files),
      name:       files[0]?.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') ?? '',
      skuCode:    '',
      category:   '',
      season:     '',
      anchorType: 'FULL_OUTFIT',
      status:     'idle',
      error:      null,
      skuId:      null,
      fidelity:   null,
    };
  }

  function updateDraft(localId: string, patch: Partial<DraftSku>) {
    setDrafts(prev => prev.map(d => d.localId === localId ? { ...d, ...patch } : d));
  }

  function removeDraft(localId: string) {
    setDrafts(prev => {
      const d = prev.find(x => x.localId === localId);
      if (d) revokePreviews(d.previews);
      return prev.filter(x => x.localId !== localId);
    });
  }

  function removeDraftImage(localId: string, imgIdx: number) {
    setDrafts(prev => prev.map(d => {
      if (d.localId !== localId) return d;
      const files    = d.files.filter((_, i) => i !== imgIdx);
      const previews = makePreviews(files);
      revokePreviews(d.previews);
      return { ...d, files, previews };
    }));
  }

  // ─── Drop / file input ───────────────────────────────────────────────────────

  function acceptFiles(incoming: File[]) {
    const images = incoming.filter(f => f.type.startsWith('image/'));
    if (!images.length) return;

    if (mode === 'one') {
      setDrafts(prev => [...prev, ...images.map(f => makeDraft([f]))]);
    } else {
      setUnassigned(prev => [...prev, ...images]);
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    acceptFiles(Array.from(e.dataTransfer.files));
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) acceptFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  // ─── Mode switch ─────────────────────────────────────────────────────────────

  function switchMode(next: BatchMode) {
    if (next === mode) return;
    if (drafts.length > 0 || unassigned.length > 0) {
      if (!confirm('Switching mode will clear all staged garments. Continue?')) return;
      drafts.forEach(d => revokePreviews(d.previews));
      setDrafts([]);
      setUnassigned([]);
      setTraySelected(new Set());
    }
    setMode(next);
  }

  // ─── Group mode helpers ───────────────────────────────────────────────────────

  function toggleTraySelect(i: number) {
    setTraySelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  function groupSelected() {
    const indices = [...traySelected].sort((a, b) => a - b).slice(0, 3);
    const files   = indices.map(i => unassigned[i]);
    setDrafts(prev => [...prev, makeDraft(files)]);
    setUnassigned(prev => prev.filter((_, i) => !traySelected.has(i)));
    setTraySelected(new Set());
  }

  function clearTrayItem(i: number) {
    setUnassigned(prev => prev.filter((_, idx) => idx !== i));
    setTraySelected(prev => {
      const next = new Set(prev);
      next.delete(i);
      return next;
    });
  }

  // ─── Bulk helpers ────────────────────────────────────────────────────────────

  function applyBulkCategory() {
    if (!bulkCategory) return;
    setDrafts(prev => prev.map(d =>
      d.status === 'idle' || d.status === 'queued' ? { ...d, category: bulkCategory } : d
    ));
  }

  function applyBulkSeason() {
    if (!bulkSeason) return;
    setDrafts(prev => prev.map(d =>
      d.status === 'idle' || d.status === 'queued' ? { ...d, season: bulkSeason } : d
    ));
  }

  function autoNumberSkus() {
    const prefix = skuPrefix.trim() || 'SKU-';
    let counter  = 1;
    setDrafts(prev => prev.map(d => {
      if (d.status !== 'idle' && d.status !== 'queued') return d;
      return { ...d, skuCode: `${prefix}${String(counter++).padStart(3, '0')}` };
    }));
  }

  // ─── Enroll orchestration ────────────────────────────────────────────────────

  const validDrafts = drafts.filter(
    d => d.name.trim().length >= 2 && d.files.length >= 1 && d.anchorType &&
         (d.status === 'idle' || d.status === 'queued')
  );

  const failedDrafts = drafts.filter(d => d.status === 'failed');
  const readyCount   = drafts.filter(d => d.status === 'ready').length;
  const allSettled   = drafts.length > 0 && drafts.every(d => d.status === 'ready' || d.status === 'failed');

  async function enroll(targets: DraftSku[]) {
    if (!user || !brand?.brandId || !targets.length) return;
    setIsRunning(true);
    setDoneCount(0);
    setTotalCount(targets.length);

    // Mark all as queued
    const ids = new Set(targets.map(d => d.localId));
    setDrafts(prev => prev.map(d => ids.has(d.localId) ? { ...d, status: 'queued' } : d));

    const idToken = await user.getIdToken();

    await runWithLimit(targets, 2, async (draft) => {
      updateDraft(draft.localId, { status: 'enrolling' });
      try {
        const b64files   = await Promise.all(draft.files.map(f => toBase64(f)));
        const compressed = await Promise.all(b64files.map(b => compressImage(b)));
        const [sourceImage, ...additionalImages] = compressed;

        const res = await fetch('/api/v1/skus/enroll', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
          body:    JSON.stringify({
            name:        draft.name.trim(),
            skuCode:     draft.skuCode,
            category:    draft.category,
            season:      draft.season,
            anchorType:  draft.anchorType,
            sourceImage,
            additionalImages,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Enrollment failed: ${res.status}`);
        }

        const data = await res.json();

        updateDraft(draft.localId, {
          status:   'ready',
          skuId:    data.skuId,
          fidelity: data.fidelityScore ?? null,
          error:    null,
        });

        addSku({
          skuId:            data.skuId,
          brandId:          brand.brandId,
          name:             draft.name.trim(),
          skuCode:          draft.skuCode,
          category:         draft.category,
          season:           draft.season,
          anchorType:       draft.anchorType,
          sourceImages:     [sourceImage],
          dna:              null,
          referenceImage:   data.referenceImageUrl ?? null,
          enrollmentStatus: 'ready',
          fidelityScore:    data.fidelityScore ?? null,
          createdAt:        new Date().toISOString(),
          updatedAt:        new Date().toISOString(),
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Enrollment failed';
        updateDraft(draft.localId, { status: 'failed', error: msg });
      } finally {
        setDoneCount(prev => prev + 1);
      }
    });

    setIsRunning(false);
  }

  const startEnroll  = ()  => enroll(validDrafts);
  const retryFailed  = ()  => enroll(failedDrafts.map(d => ({ ...d, status: 'idle' as DraftStatus })));

  // ─── Derived ──────────────────────────────────────────────────────────────────

  const progressPct  = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const canEnroll    = validDrafts.length > 0 && !isRunning;
  const canRetry     = failedDrafts.length > 0 && !isRunning;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full p-8 relative">
      {/* Atmospheric glow */}
      <div className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(197,162,83,0.05) 0%, transparent 60%)' }} />

      <div className="relative max-w-5xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('/portal/skus')}
              className="flex items-center gap-1.5 text-[8px] font-mono tracking-[0.3em] uppercase text-white/25 hover:text-[#C5A253] transition-colors mb-4"
            >
              <ChevronLeft size={11} /> SKU Vault
            </button>
            <h1 className="font-display italic text-4xl text-primary leading-none mb-2">Batch Enrollment</h1>
            <p className="text-[9px] font-mono tracking-[0.35em] uppercase text-white/25">
              {drafts.length} GARMENT{drafts.length !== 1 ? 'S' : ''} STAGED
              {readyCount > 0 ? ` · ${readyCount} ENROLLED` : ''}
            </p>
          </div>

          {/* Done button */}
          {allSettled && (
            <motion.button
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate('/portal/skus')}
              className="flex items-center gap-2 px-5 py-2.5 rounded bg-[#C5A253] text-black text-[10px] font-mono tracking-[0.2em] uppercase font-semibold"
              style={{ boxShadow: '0 0 20px rgba(197,162,83,0.3)' }}
            >
              SKU Vault <ArrowRight size={12} />
            </motion.button>
          )}
        </div>

        {/* ── Progress strip ───────────────────────────────────────────────────── */}
        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-mono tracking-[0.35em] uppercase text-[#C5A253]">
                  Enrolling — {doneCount} of {totalCount}
                </span>
                <span className="text-[8px] font-mono text-white/25">{progressPct}%</span>
              </div>
              <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #C5A253, #C5A253)' }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Completion summary ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {allSettled && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded p-4 flex items-center justify-between"
              style={{ background: failedDrafts.length ? 'rgba(239,68,68,0.06)' : 'rgba(197,162,83,0.06)', border: `1px solid ${failedDrafts.length ? 'rgba(239,68,68,0.2)' : 'rgba(197,162,83,0.2)'}` }}
            >
              <div className="flex items-center gap-3">
                {failedDrafts.length === 0
                  ? <Check size={16} className="text-emerald-500" />
                  : <AlertTriangle size={16} className="text-rose-400" />
                }
                <span className="text-[10px] font-mono text-white/60">
                  {readyCount} enrolled · {failedDrafts.length} failed
                </span>
              </div>
              {canRetry && (
                <button
                  onClick={retryFailed}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/10 text-[9px] font-mono text-white/40 hover:text-white hover:border-white/20 transition-all uppercase tracking-[0.2em]"
                >
                  <RefreshCw size={10} /> Retry failed ({failedDrafts.length})
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mode toggle ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-[8px] font-mono tracking-[0.4em] uppercase text-white/25">Mode</span>
          <div className="flex rounded overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['one', 'group'] as BatchMode[]).map((m) => (
              <button
                key={m}
                disabled={isRunning}
                onClick={() => switchMode(m)}
                className="px-4 py-2 text-[9px] font-mono tracking-[0.2em] uppercase transition-all disabled:opacity-40"
                style={{
                  background: mode === m ? 'rgba(197,162,83,0.12)' : 'transparent',
                  color:      mode === m ? '#C5A253' : 'rgba(255,255,255,0.30)',
                  borderRight: m === 'one' ? '1px solid rgba(255,255,255,0.08)' : undefined,
                }}
              >
                {m === 'one' ? 'One per garment' : 'Group angles'}
              </button>
            ))}
          </div>
          <span className="text-[8px] font-mono text-white/20 leading-relaxed">
            {mode === 'one'
              ? 'Each image → separate SKU'
              : 'Select 1–3 angles → group into one SKU'}
          </span>
        </div>

        {/* ── Bulk helpers ─────────────────────────────────────────────────────── */}
        {drafts.some(d => d.status === 'idle' || d.status === 'queued') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap items-center gap-3 mb-5 p-3 rounded"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/20">Bulk apply</span>

            {/* Category */}
            <div className="flex items-center gap-1.5">
              <select
                value={bulkCategory}
                onChange={e => setBulkCategory(e.target.value)}
                className="px-2 py-1 rounded text-[9px] font-mono text-white/50 outline-none appearance-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <option value="">Category…</option>
                {SKU_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <button
                disabled={!bulkCategory} onClick={applyBulkCategory}
                className="px-2 py-1 rounded text-[8px] font-mono text-white/40 hover:text-[#C5A253] disabled:opacity-30 transition-colors uppercase tracking-[0.15em]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >Apply to all</button>
            </div>

            <div className="w-px h-4 bg-white/[0.06]" />

            {/* Season */}
            <div className="flex items-center gap-1.5">
              <input
                value={bulkSeason}
                onChange={e => setBulkSeason(e.target.value)}
                placeholder="Season…"
                className="px-2 py-1 rounded text-[9px] font-mono text-white/50 outline-none w-28"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <button
                disabled={!bulkSeason.trim()} onClick={applyBulkSeason}
                className="px-2 py-1 rounded text-[8px] font-mono text-white/40 hover:text-[#C5A253] disabled:opacity-30 transition-colors uppercase tracking-[0.15em]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >Apply to all</button>
            </div>

            <div className="w-px h-4 bg-white/[0.06]" />

            {/* Auto-number */}
            <div className="flex items-center gap-1.5">
              <input
                value={skuPrefix}
                onChange={e => setSkuPrefix(e.target.value)}
                placeholder="Prefix e.g. BLB-SS26-"
                className="px-2 py-1 rounded text-[9px] font-mono text-white/50 outline-none w-36"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <button
                onClick={autoNumberSkus}
                className="px-2 py-1 rounded text-[8px] font-mono text-white/40 hover:text-[#C5A253] transition-colors uppercase tracking-[0.15em]"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >Auto-number</button>
            </div>
          </motion.div>
        )}

        {/* ── Dropzone ─────────────────────────────────────────────────────────── */}
        {!isRunning && (
          <motion.div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ borderColor: 'rgba(197,162,83,0.45)' }}
            className="rounded cursor-pointer flex flex-col items-center justify-center gap-4 p-10 text-center mb-6 transition-all"
            style={{ border: '2px dashed rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.01)' }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center border border-white/[0.06]"
              style={{ background: 'rgba(197,162,83,0.06)' }}>
              <Upload size={20} className="text-[#C5A253]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/40 mb-1">Drop garment images or click to browse</p>
              <p className="text-[9px] font-mono text-white/20">
                {mode === 'one' ? 'Each image becomes a separate SKU' : 'Images go to the staging tray — group them into SKUs'}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
          </motion.div>
        )}

        {/* ── Unassigned tray (group mode) ──────────────────────────────────────── */}
        {mode === 'group' && (
          <UnassignedTray
            files={unassigned}
            selected={traySelected}
            onToggle={toggleTraySelect}
            onGroup={groupSelected}
            onClear={clearTrayItem}
          />
        )}

        {/* ── Draft table ───────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {drafts.map(draft => (
            <div key={draft.localId} className="mb-3">
              <DraftRow
                draft={draft}
                mode={mode}
                isRunning={isRunning}
                onChange={updateDraft}
                onRemove={removeDraft}
                onRemoveImage={removeDraftImage}
              />
            </div>
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {drafts.length === 0 && !unassigned.length && (
          <div className="py-16 text-center">
            <p className="font-serif italic text-xl text-white/15 mb-2">No garments staged</p>
            <p className="text-[9px] font-mono text-white/10 tracking-[0.3em] uppercase">
              Drop images above to begin
            </p>
          </div>
        )}

        {/* ── Enroll CTA ────────────────────────────────────────────────────────── */}
        {(validDrafts.length > 0 || canRetry) && !allSettled && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex items-center justify-between"
          >
            <span className="text-[8px] font-mono text-white/20 tracking-[0.25em] uppercase">
              {validDrafts.length} valid · {drafts.length - validDrafts.length - readyCount - failedDrafts.length} incomplete · max 2 concurrent
            </span>
            <div className="flex items-center gap-3">
              {canRetry && !isRunning && (
                <button
                  onClick={retryFailed}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded border border-white/10 text-[10px] font-mono text-white/35 hover:text-white hover:border-white/20 transition-all uppercase tracking-[0.2em]"
                >
                  <RefreshCw size={11} /> Retry ({failedDrafts.length})
                </button>
              )}
              <button
                onClick={startEnroll}
                disabled={!canEnroll}
                className="flex items-center gap-2 px-6 py-3 rounded text-black text-[10px] font-mono tracking-[0.2em] uppercase font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                style={{
                  background: canEnroll ? '#C5A253' : 'rgba(197,162,83,0.4)',
                  boxShadow:  canEnroll ? '0 0 24px rgba(197,162,83,0.30)' : 'none',
                }}
              >
                Enroll {validDrafts.length} SKU{validDrafts.length !== 1 ? 's' : ''}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
