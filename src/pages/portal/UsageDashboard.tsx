import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSovereignStore } from '../../store/useSovereignStore';

// ─── SVG Arc Ring ─────────────────────────────────────────────────────────────
function QuotaRing({ value, max, label, color = '#B8952A' }: { value: number; max: number; label: string; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const r = 70; const cx = 90; const cy = 90; const stroke = 10;
  const circ = Math.PI * r * (240 / 180);
  const fill = (pct / 100) * circ;
  const startAngle = -210;
  const sweep = 240;

  function polar(deg: number) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
  function arcPath(start: number, end: number) {
    const s = polar(start); const e = polar(end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 180, height: 180 }}>
        <svg width={180} height={180} className="absolute inset-0">
          <circle cx={cx} cy={cy} r={r + 12} fill="none" stroke={color} strokeWidth={1} opacity={0.06} />
          <path d={arcPath(startAngle, startAngle + sweep)} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} strokeLinecap="round" />
          <motion.path
            d={arcPath(startAngle, startAngle + (sweep * pct / 100))}
            fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
            style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif italic text-white leading-none" style={{ fontSize: 36 }}>
            {value.toLocaleString()}
          </span>
          <span className="text-[7px] font-mono text-white/25 mt-1 tracking-[0.3em] uppercase">of {max.toLocaleString()}</span>
        </div>
      </div>
      <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25">{label}</p>
    </div>
  );
}

// ─── Tiny Sparkline ───────────────────────────────────────────────────────────
function Sparkline({ data, color = '#B8952A', width = 200, height = 40 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - (v / max) * (height - 4),
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)" />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color}66)` }} />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function UsageDashboard() {
  const { brand, isAdmin } = useAuth();
  const { campaigns } = useSovereignStore();

  const usage    = brand?.usage;
  const quota    = brand?.quota;
  const images   = usage?.currentPeriodImages   || 0;
  const maxImgs  = quota?.imagesPerMonth         || 0;
  const apiCalls = usage?.currentPeriodApiCalls  || 0;
  const maxApi   = quota?.apiCallsPerMonth       || 0;

  // Generate daily sparkline data from campaigns
  const dailyData = useMemo(() => {
    const days = 30;
    const buckets = Array(days).fill(0);
    const now = Date.now();
    campaigns.forEach(c => {
      if (!c.createdAt) return;
      const dayAgo = Math.floor((now - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      if (dayAgo >= 0 && dayAgo < days) buckets[days - 1 - dayAgo] += c.imagesDelivered || 0;
    });
    return buckets;
  }, [campaigns]);

  const savings = campaigns.length * 503;

  return (
    <div className="p-8 min-h-full">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif italic text-4xl text-white mb-2">Analytics</h1>
          <p className="text-[9px] font-mono tracking-[0.35em] uppercase text-white/25">
            {brand?.billing?.periodStart
              ? `Period: ${new Date(brand.billing.currentPeriodEnd || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
              : 'Current billing period'}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded border border-white/[0.08] text-[9px] font-mono text-white/40 hover:text-white transition-all uppercase tracking-[0.2em]">
          <Download size={11} /> Export CSV
        </button>
      </div>

      {/* Quota rings + cost comparison */}
      <div className="grid grid-cols-[auto_auto_1fr] gap-8 items-center mb-10 p-8 rounded"
        style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <QuotaRing value={images} max={maxImgs} label="Images Generated" />
        <div className="w-px h-32 bg-white/[0.05]" />
        <QuotaRing value={apiCalls} max={maxApi} label="API Calls" color="#6366F1" />

        <div className="col-start-3 row-start-1 flex flex-col justify-center gap-4 pl-8 border-l border-white/[0.05] ml-8">
          <p className="text-[7px] font-mono tracking-[0.45em] uppercase text-white/25">Cost Comparison</p>
          <div>
            <p className="text-[7px] font-mono text-white/25 mb-1 uppercase tracking-[0.2em]">LuxAura This Period</p>
            <p className="font-serif italic text-3xl text-[#B8952A]">
              ${((brand?.tier === 'enterprise' ? 4999 : brand?.tier === 'agency' ? 1499 : 499) || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[7px] font-mono text-white/25 mb-1 uppercase tracking-[0.2em]">Traditional Production Equivalent</p>
            <p className="font-serif italic text-3xl text-white/20 line-through">${savings.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-500" />
            <p className="text-emerald-500 font-mono text-sm font-semibold">
              ${Math.max(0, savings - 4999).toLocaleString()} saved
            </p>
          </div>
        </div>
      </div>

      {/* Daily chart */}
      <div className="mb-10 p-6 rounded"
        style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-[7px] font-mono tracking-[0.45em] uppercase text-white/25">Daily Image Generation — Last 30 Days</p>
          <p className="text-[7px] font-mono text-white/20">{images} total this period</p>
        </div>
        <div className="w-full">
          <Sparkline data={dailyData} width={800} height={80} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[7px] font-mono text-white/15">30 days ago</span>
          <span className="text-[7px] font-mono text-white/15">Today</span>
        </div>
      </div>

      {/* Campaign table */}
      <div className="rounded overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <p className="text-[7px] font-mono tracking-[0.45em] uppercase text-white/25">Campaign Breakdown</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {['Campaign', 'Images', 'Credits', 'Date', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[7px] font-mono tracking-[0.3em] uppercase text-white/20">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.slice(0, 10).map((c, i) => (
                <tr key={c.campaignId} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01] transition-colors">
                  <td className="px-5 py-3 text-[11px] font-medium text-white/60 max-w-[200px] truncate">{c.name || `Campaign ${i + 1}`}</td>
                  <td className="px-5 py-3 text-[10px] font-mono text-white/40">{c.imagesDelivered || 0}</td>
                  <td className="px-5 py-3 text-[10px] font-mono text-white/40">{c.creditsUsed || 0}</td>
                  <td className="px-5 py-3 text-[10px] font-mono text-white/30">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[7px] font-mono px-2 py-0.5 rounded text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
                      {c.status || 'Complete'}
                    </span>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-[9px] font-mono text-white/20">No campaigns yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
