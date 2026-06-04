import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Search, Download } from 'lucide-react';
import { useSovereignStore } from '../../store/useSovereignStore';

export default function CampaignHistory() {
  const { campaigns, campaignsLoading, skus, setCurrentSkuId } = useSovereignStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = campaigns.filter(c =>
    !search || (c.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const skuName = (skuId: string) => skus.find(s => s.skuId === skuId)?.name || skuId;

  return (
    <div className="p-8 min-h-full">
      <div className="absolute top-0 right-0 w-80 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 100% 0%, rgba(197,162,83,0.04) 0%, transparent 60%)' }} />

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display italic text-4xl text-primary mb-2">Campaigns</h1>
          <p className="text-[9px] font-mono tracking-[0.35em] uppercase text-white/25">
            {campaigns.length} total · {campaigns.filter(c => c.status === 'complete').length} complete
          </p>
        </div>
        <button onClick={() => navigate('/portal/campaigns/new')}
          className="flex items-center gap-2 px-5 py-2.5 rounded bg-[#C5A253] text-black text-[10px] font-mono tracking-[0.2em] uppercase font-semibold transition-all"
          style={{ boxShadow: '0 0 20px rgba(197,162,83,0.2)' }}>
          <Sparkles size={12} /> New Campaign
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 rounded mb-8 max-w-xs"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <Search size={11} className="text-white/25" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns..."
          className="bg-transparent text-[11px] font-mono text-white/60 placeholder-white/20 outline-none flex-1" />
      </div>

      {campaignsLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded animate-pulse"
              style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center text-center gap-4">
          <Sparkles size={24} className="text-white/10" />
          <p className="font-serif italic text-2xl text-white/20">
            {search ? 'No campaigns match your search' : 'No campaigns yet'}
          </p>
          <button onClick={() => navigate('/portal/campaigns/new')}
            className="text-[8px] font-mono text-[#C5A253] hover:text-[#C5A253] transition-colors uppercase tracking-[0.3em]">
            Create your first campaign →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((c, i) => (
            <motion.div key={c.campaignId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-5 p-5 rounded group cursor-pointer transition-all"
              style={{
                background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(197,162,83,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
            >
              {/* Thumbnail */}
              <div className="w-14 h-[70px] rounded overflow-hidden bg-[#0B0B0E] flex-shrink-0 border border-white/[0.06]" />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white/80 truncate">{c.name || `Campaign ${c.campaignId.slice(-6)}`}</p>
                <p className="text-[9px] font-mono text-white/30 mt-1">{skuName(c.skuId)}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 flex-shrink-0">
                <div className="text-right">
                  <p className="text-[8px] font-mono text-white/20 uppercase tracking-[0.25em]">Images</p>
                  <p className="text-[11px] font-mono text-white/50">{c.imagesDelivered || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-mono text-white/20 uppercase tracking-[0.25em]">Credits</p>
                  <p className="text-[11px] font-mono text-white/50">{c.creditsUsed || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-mono text-white/20 uppercase tracking-[0.25em]">Date</p>
                  <p className="text-[11px] font-mono text-white/50">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[7px] font-mono px-2 py-1 rounded tracking-[0.2em] uppercase"
                    style={{
                      color: c.status === 'complete' ? '#10B981' : c.status === 'failed' ? '#EF4444' : '#F59E0B',
                      background: c.status === 'complete' ? 'rgba(16,185,129,0.10)' : c.status === 'failed' ? 'rgba(239,68,68,0.10)' : 'rgba(245,158,11,0.10)',
                      border: `1px solid ${c.status === 'complete' ? 'rgba(16,185,129,0.25)' : c.status === 'failed' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
                    }}>
                    {c.status || 'Complete'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
