import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, FolderLock, Layers, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSovereignStore } from '../../store/useSovereignStore';

// ─── Cinematic Quota Arc ──────────────────────────────────────────────────────
function QuotaArc({ percent, isAdmin }: { percent: number; isAdmin: boolean }) {
  const r = 80;
  const cx = 100;
  const cy = 100;
  const stroke = 12;
  const sweep = 240;
  const startAngle = -210;

  function polarToXY(deg: number) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(start: number, end: number) {
    const s = polarToXY(start);
    const e = polarToXY(end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const endAngle = startAngle + sweep;
  const fillEnd = startAngle + (sweep * Math.min(percent, 100)) / 100;
  const color = percent >= 95 ? '#EF4444' : percent >= 80 ? '#F59E0B' : '#C5A253';

  return (
    <div className="relative" style={{ width: 200, height: 200 }}>
      {/* Atmospheric glow layers */}
      <div className="absolute inset-0 rounded-full" style={{
        background: `radial-gradient(circle, ${color}12 0%, transparent 65%)`,
      }} />
      <svg width={200} height={200} className="absolute inset-0">
        <circle cx={cx} cy={cy} r={r + 18} fill="none" stroke={color} strokeWidth={1} opacity={0.05} />
        <circle cx={cx} cy={cy} r={r + 10} fill="none" stroke={color} strokeWidth={1} opacity={0.08} />
        <path d={arcPath(startAngle, endAngle)} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} strokeLinecap="round" />
        <motion.path
          d={arcPath(startAngle, isAdmin ? endAngle : fillEnd)}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: 'easeOut', delay: 0.4 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}99)` }}
        />
      </svg>
    </div>
  );
}

// ─── Stat Number ─────────────────────────────────────────────────────────────
function StatNumber({ label, value, gold = false, delay = 0 }: {
  label: string; value: string | number; gold?: boolean; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col gap-1"
    >
      <span
        className="font-serif italic leading-none"
        style={{
          fontSize: 'clamp(40px, 5vw, 64px)',
          color: gold ? '#C5A253' : '#ffffff',
        }}
      >
        {value}
      </span>
      <span className="text-[8px] font-mono tracking-[0.45em] uppercase text-white/25">{label}</span>
    </motion.div>
  );
}

// ─── Campaign Strip ───────────────────────────────────────────────────────────
function CampaignCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.7 + index * 0.06 }}
      className="group relative rounded overflow-hidden cursor-pointer flex-shrink-0"
      style={{
        width: 160,
        background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="aspect-[4/5] bg-[#0D0D10] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0B0B0E]/80" />
        <span className="absolute top-2 right-2 text-[7px] font-mono text-[#C5A253] bg-black/60 border border-[#C5A253]/30 px-1.5 py-0.5 rounded">
          AUDITED
        </span>
      </div>
      <div className="p-2.5">
        <p className="text-[10px] font-mono text-white/50 truncate">Campaign {index + 1}</p>
        <p className="text-[8px] font-mono text-white/25 mt-0.5">6 images</p>
      </div>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(197,162,83,0.25)' }} />
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BrandPortalHome() {
  const { brand, quotaPercent, quotaRemaining, isAdmin } = useAuth();
  const { skus, campaigns } = useSovereignStore();
  const navigate = useNavigate();

  const pct       = quotaPercent();
  const remaining = isAdmin ? Infinity : quotaRemaining();
  const readySKUs = skus.filter(s => s.enrollmentStatus === 'ready' && s.assetType !== 'model').length;

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* ── Full-page cinematic atmospheric glow ──────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 1000, height: 700,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(197,162,83,0.07) 0%, transparent 60%)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 600, height: 600,
          background: 'radial-gradient(circle at 100% 100%, rgba(197,162,83,0.04) 0%, transparent 60%)',
        }} />
      </div>

      <div className="relative p-8 lg:p-12">

        {/* ── Cinematic hero section ─────────────────────────────────────── */}
        <div className="mb-14">
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-[8px] font-mono tracking-[0.5em] uppercase text-[#C5A253] mb-4"
          >
            {brand?.name || 'Brand Studio'} · Sovereign AI Production
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display italic text-primary leading-[0.95] mb-6"
            style={{ fontSize: 'clamp(48px, 6vw, 88px)', letterSpacing: '-0.025em' }}
          >
            Command Your<br />
            <span style={{ color: '#C5A253' }}>Narrative.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={() => navigate('/portal/campaigns/new')}
              className="flex items-center gap-2.5 px-6 py-3 rounded bg-[#C5A253] hover:bg-[#C9A84C] text-black text-[11px] font-mono tracking-[0.2em] uppercase font-semibold transition-all"
              style={{ boxShadow: '0 0 24px rgba(197,162,83,0.3)' }}
            >
              <Sparkles size={13} />
              New Campaign
            </button>
            <button
              onClick={() => navigate('/portal/skus/enroll')}
              className="flex items-center gap-2.5 px-6 py-3 rounded border border-white/[0.08] hover:border-[#C5A253]/40 text-white/50 hover:text-white text-[11px] font-mono tracking-[0.2em] uppercase transition-all"
            >
              <FolderLock size={13} />
              Enroll SKU
            </button>
            <button
              onClick={() => navigate('/portal/sets')}
              className="flex items-center gap-2.5 px-6 py-3 rounded border border-white/[0.08] hover:border-[#C5A253]/40 text-white/50 hover:text-white text-[11px] font-mono tracking-[0.2em] uppercase transition-all"
            >
              <Layers size={13} />
              Inject Set
            </button>
          </motion.div>
        </div>

        {/* ── Cinematic stats row ────────────────────────────────────────── */}
        <div className="grid grid-cols-[200px_1fr] gap-12 mb-14 items-center">

          {/* Quota arc */}
          <div className="relative flex flex-col items-center">
            <QuotaArc percent={pct} isAdmin={isAdmin} />
            {/* Center overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif italic text-white leading-none" style={{ fontSize: 42 }}>
                {isAdmin ? '∞' : (brand?.usage.currentPeriodImages || 0).toLocaleString()}
              </span>
              <span className="text-[7px] font-mono tracking-[0.3em] uppercase text-white/25 mt-1">
                of {isAdmin ? '∞' : (brand?.quota.imagesPerMonth || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-[7px] font-mono tracking-[0.35em] uppercase text-white/20 mt-2 text-center">
              Images This Period
            </p>
          </div>

          {/* Stat numbers — Midnight Symphony style */}
          <div className="grid grid-cols-4 gap-8">
            <StatNumber
              label="SKUs Enrolled"
              value={readySKUs}
              delay={0.2}
            />
            <StatNumber
              label="Campaigns Run"
              value={campaigns.length}
              delay={0.28}
            />
            <StatNumber
              label="Avg Fidelity"
              value="94.2%"
              gold
              delay={0.36}
            />
            <StatNumber
              label="Images Generated"
              value={(brand?.usage.currentPeriodImages || 0).toLocaleString()}
              delay={0.44}
            />
          </div>
        </div>

        {/* ── Campaign film strip ────────────────────────────────────────── */}
        {campaigns.length > 0 ? (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[8px] font-mono tracking-[0.45em] uppercase text-white/25">
                Recent Campaigns
              </span>
              <button
                onClick={() => navigate('/portal/campaigns')}
                className="flex items-center gap-1.5 text-[8px] font-mono text-white/20 hover:text-[#C5A253] transition-colors uppercase tracking-[0.3em]"
              >
                View all <ArrowRight size={10} />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
              {campaigns.slice(0, 8).map((_, i) => (
                <CampaignCard key={i} index={i} />
              ))}
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-12 border border-dashed border-white/[0.07] rounded p-16 flex flex-col items-center text-center"
            style={{ background: 'linear-gradient(145deg, #0D0D10 0%, #050505 100%)' }}
          >
            <Sparkles size={24} className="text-white/10 mb-4" />
            <p className="font-serif italic text-2xl text-white/20 mb-2">Your first campaign awaits</p>
            <p className="text-[9px] font-mono text-white/15 tracking-[0.3em] uppercase mb-6">
              Enroll a SKU and generate your first editorial spread
            </p>
            <button
              onClick={() => navigate('/portal/campaigns/new')}
              className="px-5 py-2.5 rounded border border-white/[0.08] text-[10px] font-mono text-white/30 hover:text-white hover:border-[#C5A253]/40 transition-all uppercase tracking-[0.25em]"
            >
              Start Now
            </button>
          </motion.div>
        )}

        {/* ── SKU vault quick view ───────────────────────────────────────── */}
        {skus.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="text-[8px] font-mono tracking-[0.45em] uppercase text-white/25">
                SKU Vault
              </span>
              <button
                onClick={() => navigate('/portal/skus')}
                className="flex items-center gap-1.5 text-[8px] font-mono text-white/20 hover:text-[#C5A253] transition-colors uppercase tracking-[0.3em]"
              >
                View all <ArrowRight size={10} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skus.slice(0, 10).map(sku => (
                <motion.button
                  key={sku.skuId}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ borderColor: 'rgba(197,162,83,0.35)' }}
                  onClick={() => navigate(`/portal/skus/${sku.skuId}`)}
                  className="flex items-center gap-2 px-3 py-2 rounded text-left transition-all"
                  style={{
                    background: 'linear-gradient(145deg, #0F0F13 0%, #0B0B0E 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    sku.enrollmentStatus === 'ready'      ? 'bg-emerald-500' :
                    sku.enrollmentStatus === 'processing' ? 'bg-[#F59E0B] animate-pulse' :
                    sku.enrollmentStatus === 'failed'     ? 'bg-rose-500' : 'bg-white/20'
                  }`} />
                  <span className="text-[10px] font-mono text-white/50 max-w-[140px] truncate">{sku.name}</span>
                  {sku.fidelityScore != null && (
                    <span className="text-[8px] font-mono text-[#C5A253]/60 ml-1">{sku.fidelityScore}%</span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
