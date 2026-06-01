import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, RefreshCw, Archive, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { useSovereignStore } from '../../store/useSovereignStore';
import type { SkuDocument } from '../../store/useSovereignStore';

export default function SKUDetail() {
  const { skuId } = useParams<{ skuId: string }>();
  const navigate = useNavigate();
  const { skus, campaigns, setCurrentSkuId } = useSovereignStore();
  const [expandedDna, setExpandedDna] = useState<string | null>(null);

  const sku = skus.find(s => s.skuId === skuId) || null;
  const skuCampaigns = campaigns.filter(c => c.skuId === skuId);

  const statusColor = {
    ready:      '#10B981',
    processing: '#F59E0B',
    failed:     '#EF4444',
    archived:   'rgba(255,255,255,0.3)',
    pending:    'rgba(255,255,255,0.3)',
  };

  if (!sku) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-full gap-4">
      <p className="font-serif italic text-2xl text-white/20">SKU not found</p>
      <button onClick={() => navigate('/portal/skus')}
        className="text-[9px] font-mono text-[#B8952A] hover:text-[#D4AF37] transition-colors uppercase tracking-[0.3em]">
        ← Back to Vault
      </button>
    </div>
  );

  const color = statusColor[sku.enrollmentStatus] || 'rgba(255,255,255,0.3)';
  const fidelityColor = (sku.fidelityScore || 0) >= 90 ? '#10B981' : (sku.fidelityScore || 0) >= 70 ? '#B8952A' : '#EF4444';

  return (
    <div className="p-8 min-h-full">
      {/* Back + Header */}
      <button onClick={() => navigate('/portal/skus')}
        className="flex items-center gap-1.5 text-[8px] font-mono text-white/25 hover:text-[#B8952A] transition-colors mb-6 uppercase tracking-[0.3em]">
        <ArrowLeft size={11} /> SKU Vault
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif italic text-4xl text-white mb-2">{sku.name}</h1>
          <div className="flex items-center gap-3">
            {sku.skuCode && <span className="text-[9px] font-mono text-[#B8952A]/70">{sku.skuCode}</span>}
            <span className="text-[8px] font-mono text-white/25 uppercase tracking-[0.25em]">
              {[sku.category, sku.season].filter(Boolean).join(' · ')}
            </span>
            <span className="flex items-center gap-1.5 text-[7px] font-mono tracking-[0.3em] px-2 py-0.5 rounded"
              style={{ color, background: `${color}15`, border: `1px solid ${color}40` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              {sku.enrollmentStatus.toUpperCase()}
            </span>
          </div>
        </div>
        {sku.enrollmentStatus === 'ready' && (
          <div className="flex gap-3">
            <button
              onClick={() => { setCurrentSkuId(sku.skuId); navigate('/portal/campaigns/new'); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded bg-[#B8952A] text-black text-[10px] font-mono tracking-[0.2em] uppercase font-semibold transition-all"
              style={{ boxShadow: '0 0 20px rgba(184,149,42,0.25)' }}>
              <Play size={12} fill="black" /> Generate Campaign
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-[320px_1fr] gap-8">
        {/* Left — Reference image + score */}
        <div className="flex flex-col gap-5">
          <div className="aspect-[4/5] rounded overflow-hidden relative"
            style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {sku.referenceImage
              ? <img src={sku.referenceImage} className="w-full h-full object-cover" />
              : <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-[9px] font-mono text-white/20">No reference image</p>
                </div>
            }
          </div>

          {sku.fidelityScore != null && (
            <div className="p-5 rounded flex items-center gap-4"
              style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-center">
                <span className="font-serif italic text-5xl" style={{ color: fidelityColor }}>{sku.fidelityScore}</span>
                <p className="text-[6px] font-mono tracking-[0.35em] uppercase text-white/20 mt-1">/ 100</p>
              </div>
              <div>
                <p className="text-[7px] font-mono tracking-[0.3em] uppercase text-white/25 mb-1">Pattern Fidelity</p>
                <p className="text-[9px] font-mono" style={{ color: fidelityColor }}>
                  {(sku.fidelityScore || 0) >= 90 ? 'Excellent — High accuracy reconstruction'
                    : (sku.fidelityScore || 0) >= 70 ? 'Good — Minor detail variation possible'
                    : 'Low — Consider re-enrollment'}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button onClick={() => navigate('/portal/skus/enroll')}
              className="flex items-center justify-center gap-2 py-2.5 rounded border border-white/[0.08] text-[9px] font-mono text-white/40 hover:text-white hover:border-white/20 transition-all uppercase tracking-[0.2em]">
              <RefreshCw size={11} /> Re-enroll
            </button>
          </div>
        </div>

        {/* Right — DNA + campaigns */}
        <div className="flex flex-col gap-6">
          {/* DNA Summary */}
          {sku.dna && (
            <div className="rounded overflow-hidden"
              style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <p className="text-[7px] font-mono tracking-[0.45em] uppercase text-white/25">Garment DNA</p>
              </div>
              {Object.entries(sku.dna).map(([key, value]) => (
                <div key={key} className="border-b border-white/[0.04] last:border-0">
                  <button
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/[0.01] transition-colors"
                    onClick={() => setExpandedDna(expandedDna === key ? null : key)}>
                    <span className="text-[8px] font-mono tracking-[0.3em] uppercase text-[#B8952A]/70">{key}</span>
                    {expandedDna === key ? <ChevronUp size={12} className="text-white/20" /> : <ChevronDown size={12} className="text-white/20" />}
                  </button>
                  {expandedDna === key && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="overflow-hidden">
                      <p className="px-5 pb-4 text-[10px] font-mono text-white/40 leading-relaxed">{value as string}</p>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Campaign history */}
          <div>
            <p className="text-[7px] font-mono tracking-[0.45em] uppercase text-white/25 mb-4">
              Campaign History ({skuCampaigns.length})
            </p>
            {skuCampaigns.length > 0 ? (
              <div className="flex flex-col gap-3">
                {skuCampaigns.map(c => (
                  <div key={c.campaignId} className="flex items-center gap-4 p-4 rounded"
                    style={{ background: 'linear-gradient(145deg, #0F0F13 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="w-10 h-12 rounded bg-[#0B0B0E] border border-white/[0.06] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-white/70 truncate">{c.name || 'Campaign'}</p>
                      <p className="text-[8px] font-mono text-white/25 mt-0.5">{c.imagesDelivered || 0} images · {c.creditsUsed || 0} credits</p>
                    </div>
                    <span className="text-[7px] font-mono text-white/20">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-[9px] font-mono text-white/20">No campaigns yet</p>
                {sku.enrollmentStatus === 'ready' && (
                  <button onClick={() => { setCurrentSkuId(sku.skuId); navigate('/portal/campaigns/new'); }}
                    className="mt-3 text-[8px] font-mono text-[#B8952A] hover:text-[#D4AF37] transition-colors uppercase tracking-[0.3em]">
                    Generate first campaign →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
