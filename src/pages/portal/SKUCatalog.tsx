import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderLock, Upload, Eye, Play, Search } from 'lucide-react';
import { useSovereignStore } from '../../store/useSovereignStore';
import type { SkuDocument } from '../../store/useSovereignStore';

// ─── Fidelity Ring ────────────────────────────────────────────────────────────
function FidelityRing({ score }: { score: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 90 ? '#10B981' : score >= 70 ? '#B8952A' : '#EF4444';

  return (
    <div className="relative" style={{ width: 44, height: 44 }}>
      <svg width={44} height={44} className="absolute inset-0 -rotate-90">
        <circle cx={22} cy={22} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={3} />
        <motion.circle
          cx={22} cy={22} r={r} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - fill }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 3px ${color}88)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[8px] font-mono leading-none" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

// ─── SKU Card ─────────────────────────────────────────────────────────────────
function SKUCard({ sku, onSelect }: { sku: SkuDocument; onSelect: () => void }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const STATUS = {
    ready:      { label: 'DNA LOCKED',  color: '#B8952A', bg: 'rgba(184,149,42,0.10)', border: 'rgba(184,149,42,0.25)', dot: 'bg-[#B8952A]' },
    processing: { label: 'ENROLLING',   color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', dot: 'bg-amber-500 animate-pulse' },
    failed:     { label: 'FAILED',      color: '#EF4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)',  dot: 'bg-rose-500' },
    archived:   { label: 'ARCHIVED',    color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', dot: 'bg-white/20' },
    pending:    { label: 'PENDING',     color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', dot: 'bg-white/20' },
  };
  const cfg = STATUS[sku.enrollmentStatus] || STATUS.pending;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="group relative rounded overflow-hidden cursor-pointer"
      style={{
        background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)',
        border: hovered ? '1px solid rgba(184,149,42,0.3)' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: hovered ? '0 0 20px rgba(184,149,42,0.07)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Image */}
      <div className="aspect-[4/5] relative overflow-hidden bg-[#0D0D10]">
        {sku.referenceImage ? (
          <img src={sku.referenceImage} alt={sku.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <FolderLock size={28} className="text-white/[0.08]" />
          </div>
        )}

        {/* Scan animation */}
        {sku.enrollmentStatus === 'processing' && (
          <motion.div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#B8952A] to-transparent opacity-60"
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          />
        )}

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0B0B0E] to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
          <span className="text-[7px] font-mono tracking-[0.3em]" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>

        {/* Hover actions */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40"
            >
              {sku.enrollmentStatus === 'ready' && (
                <button onClick={e => { e.stopPropagation(); onSelect(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#B8952A] text-black text-[9px] font-mono tracking-[0.2em] uppercase font-semibold">
                  <Play size={10} fill="black" /> Generate
                </button>
              )}
              <button onClick={e => { e.stopPropagation(); navigate(`/portal/skus/${sku.skuId}`); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/20 text-white text-[9px] font-mono tracking-[0.2em] uppercase">
                <Eye size={10} /> Details
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] font-medium text-white/90 truncate">{sku.name}</h3>
            {sku.skuCode && <p className="text-[9px] font-mono text-[#B8952A]/60 mt-0.5 truncate">{sku.skuCode}</p>}
            <p className="text-[8px] font-mono text-white/25 mt-1.5 uppercase tracking-[0.25em]">
              {[sku.category, sku.season].filter(Boolean).join(' · ')}
            </p>
          </div>
          {sku.fidelityScore != null && sku.enrollmentStatus === 'ready' && (
            <FidelityRing score={sku.fidelityScore} />
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-[7px] font-mono tracking-[0.3em] uppercase px-2 py-1 rounded"
            style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {sku.anchorType}
          </span>
          {sku.enrollmentStatus === 'ready' && (
            <button
              onClick={() => { useSovereignStore.getState().setCurrentSkuId(sku.skuId); navigate('/portal/campaigns/new'); }}
              className="ml-auto text-[8px] font-mono text-white/25 hover:text-[#B8952A] transition-colors uppercase tracking-[0.2em]"
            >
              Run Campaign →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Enroll Dropzone ──────────────────────────────────────────────────────────
function EnrollDropzone() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ borderColor: 'rgba(184,149,42,0.4)' }}
      onClick={() => navigate('/portal/skus/enroll')}
      className="rounded cursor-pointer flex flex-col items-center justify-center gap-5 p-8 text-center"
      style={{
        aspectRatio: '4/5',
        border: '2px dashed rgba(255,255,255,0.10)',
        background: 'linear-gradient(145deg, #0D0D10 0%, #050505 100%)',
        transition: 'border-color 0.2s',
      }}
    >
      <div className="w-14 h-14 rounded-full flex items-center justify-center border border-white/[0.06]"
        style={{ background: 'rgba(184,149,42,0.06)' }}>
        <Upload size={22} className="text-[#B8952A]" />
      </div>
      <div>
        <p className="text-[13px] font-medium text-white/40 mb-1">New SKU Enrollment</p>
        <p className="text-[9px] font-mono text-white/20 leading-relaxed">
          Upload garment imagery to lock<br />fabric DNA permanently
        </p>
      </div>
      <span className="px-4 py-2 rounded text-[9px] font-mono tracking-[0.2em] uppercase text-black bg-white/80 hover:bg-white font-semibold transition-all">
        Select Files
      </span>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SKUCatalog() {
  const { skus, skusLoading } = useSovereignStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'ready' | 'processing' | 'failed'>('all');
  const [search, setSearch] = useState('');

  const counts = {
    all:        skus.length,
    ready:      skus.filter(s => s.enrollmentStatus === 'ready').length,
    processing: skus.filter(s => s.enrollmentStatus === 'processing').length,
    failed:     skus.filter(s => s.enrollmentStatus === 'failed').length,
  };

  const filtered = skus.filter(s => {
    const matchStatus = filter === 'all' || s.enrollmentStatus === filter;
    const matchSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.skuCode || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-8 min-h-full relative">
      {/* Atmospheric glow */}
      <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 100% 0%, rgba(184,149,42,0.04) 0%, transparent 60%)' }} />

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif italic text-4xl text-white leading-none mb-2">SKU Registry</h1>
          <p className="text-[9px] font-mono tracking-[0.35em] uppercase text-white/25">
            {counts.ready} Ready · {counts.processing} Processing · {counts.all} Total
          </p>
        </div>
        <button
          onClick={() => navigate('/portal/skus/enroll')}
          className="flex items-center gap-2 px-5 py-2.5 rounded border border-[#B8952A]/40 text-[#B8952A] text-[10px] font-mono tracking-[0.25em] uppercase hover:bg-[#B8952A]/10 transition-all"
        >
          <Upload size={12} /> Enroll SKU
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-1">
          {(['all', 'ready', 'processing', 'failed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded text-[9px] font-mono tracking-[0.2em] uppercase transition-all"
              style={{
                background: filter === f ? 'rgba(184,149,42,0.10)' : 'transparent',
                border: filter === f ? '1px solid rgba(184,149,42,0.35)' : '1px solid rgba(255,255,255,0.06)',
                color: filter === f ? '#B8952A' : 'rgba(255,255,255,0.3)',
              }}>
              {f}{counts[f] > 0 ? ` (${counts[f]})` : ''}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Search size={11} className="text-white/25 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search SKUs..."
            className="bg-transparent text-[11px] font-mono text-white/60 placeholder-white/20 outline-none w-48"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        <EnrollDropzone />
        {skusLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded animate-pulse"
                style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.04)' }} />
            ))
          : filtered.map(sku => (
              <SKUCard key={sku.skuId} sku={sku}
                onSelect={() => { useSovereignStore.getState().setCurrentSkuId(sku.skuId); navigate('/portal/campaigns/new'); }}
              />
            ))
        }
        {!skusLoading && filtered.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center text-center gap-3">
            <p className="font-serif italic text-xl text-white/20">
              {search ? 'No SKUs match your search' : 'Vault is empty'}
            </p>
            <p className="text-[9px] font-mono text-white/15 tracking-[0.3em] uppercase">
              Enroll your first garment to lock its DNA
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
