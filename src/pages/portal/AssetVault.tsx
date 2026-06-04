import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Download, Check, LayoutGrid, X, Sparkles, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { useSovereignStore, type VaultItem } from '../../store/useSovereignStore';

// ─── Download helpers ──────────────────────────────────────────────────────────
function safeName(item: VaultItem): string {
  const base = (item.name || 'asset').replace(/[^\w-]+/g, '_').slice(0, 60);
  return `${base}_${item.id.slice(-6)}`;
}

// Fetch→blob for a forced same-name download; falls back to a direct link if the
// asset host blocks cross-origin fetch (public storage URLs normally allow it).
async function downloadAsset(item: VaultItem): Promise<void> {
  try {
    const res = await fetch(item.image, { mode: 'cors' });
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName(item)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    const a = document.createElement('a');
    a.href = item.image;
    a.download = `${safeName(item)}.png`;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AssetVault() {
  const { vaultAssets, vaultLoading } = useSovereignStore();
  const navigate = useNavigate();

  const [search, setSearch]       = useState('');
  const [anchor, setAnchor]       = useState<string>('all');
  const [category, setCategory]   = useState<string>('all');
  const [sort, setSort]           = useState<'newest' | 'oldest' | 'name'>('newest');
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress]   = useState(0);

  // Facets derived from the data present.
  const anchorFacets = useMemo(() => {
    const s = new Set<string>();
    vaultAssets.forEach(a => (a.anchors || []).forEach(x => x && s.add(x)));
    return Array.from(s).sort();
  }, [vaultAssets]);

  const categoryFacets = useMemo(() => {
    const s = new Set<string>();
    vaultAssets.forEach(a => a.category && s.add(a.category));
    return Array.from(s).sort();
  }, [vaultAssets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = vaultAssets.filter(a => {
      if (anchor !== 'all' && !(a.anchors || []).includes(anchor)) return false;
      if (category !== 'all' && a.category !== category) return false;
      if (!q) return true;
      const hay = [
        a.name, a.prompt, a.category, a.skinTone, a.lighting, a.camera, a.bg,
        ...(a.anchors || []),
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
    out = [...out].sort((x, y) => {
      if (sort === 'name')   return (x.name || '').localeCompare(y.name || '');
      if (sort === 'oldest') return (x.createdAt || 0) - (y.createdAt || 0);
      return (y.createdAt || 0) - (x.createdAt || 0);
    });
    return out;
  }, [vaultAssets, search, anchor, category, sort]);

  const allVisibleSelected = filtered.length > 0 && filtered.every(a => selected.has(a.id));

  const toggle = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAllVisible = () =>
    setSelected(prev => {
      const n = new Set(prev);
      if (allVisibleSelected) filtered.forEach(a => n.delete(a.id));
      else filtered.forEach(a => n.add(a.id));
      return n;
    });

  const clearSelection = () => setSelected(new Set());

  async function downloadSelected() {
    const items = vaultAssets.filter(a => selected.has(a.id));
    if (items.length === 0 || downloading) return;
    setDownloading(true);
    setProgress(0);

    try {
      if (items.length === 1) {
        // Single file: download directly
        await downloadAsset(items[0]);
        setProgress(100);
      } else {
        // Multiple files: package into a ZIP
        const zip = new JSZip();
        let successCount = 0;
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          try {
            const res = await fetch(item.image, { mode: 'cors' });
            if (!res.ok) throw new Error(String(res.status));
            const blob = await res.blob();
            // Add file to zip
            zip.file(`${safeName(item)}.png`, blob);
            successCount++;
          } catch (err) {
            console.warn(`Failed to fetch ${item.name} for zip (likely CORS):`, err);
          }
          setProgress(Math.round(((i + 1) / items.length) * 50)); // 50% for fetching
        }

        // If CORS blocked ALL images, fallback to sequential individual downloads
        if (successCount === 0) {
          console.warn('All files failed to zip (CORS issue). Falling back to sequential downloads.');
          for (let i = 0; i < items.length; i++) {
            await downloadAsset(items[i]);
            setProgress(50 + Math.round(((i + 1) / items.length) * 50));
            await new Promise(r => setTimeout(r, 250));
          }
          return;
        }

        // Generate the zip file
        const zipBlob = await zip.generateAsync({ 
          type: 'blob',
          onUpdate: (metadata) => {
            // metadata.percent is 0-100; map it to the 50-100% range of the progress bar
            setProgress(50 + Math.round(metadata.percent / 2));
          }
        });

        // Trigger download
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LuxAura_Assets.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Batch download failed:', err);
    } finally {
      setDownloading(false);
      setProgress(0);
      setSelected(new Set()); // Auto-clear selection after successful download
    }
  }

  const hasFilters = search || anchor !== 'all' || category !== 'all';

  return (
    <div className="p-8 min-h-full">
      <div className="absolute top-0 right-0 w-80 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 100% 0%, rgba(184,149,42,0.04) 0%, transparent 60%)' }} />

      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="font-serif italic text-4xl text-white mb-2">Asset Vault</h1>
          <p className="text-[9px] font-mono tracking-[0.35em] uppercase text-white/25">
            {vaultAssets.length} assets · {filtered.length} shown{selected.size > 0 ? ` · ${selected.size} selected` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button onClick={clearSelection}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded border border-white/10 text-white/40 hover:text-white text-[10px] font-mono tracking-[0.2em] uppercase transition-all">
              <X size={12} /> Clear
            </button>
          )}
          <button
            onClick={downloadSelected}
            disabled={selected.size === 0 || downloading}
            className="flex items-center gap-2 px-5 py-2.5 rounded bg-[#B8952A] text-black text-[10px] font-mono tracking-[0.2em] uppercase font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ boxShadow: selected.size > 0 && !downloading ? '0 0 20px rgba(184,149,42,0.2)' : 'none' }}>
            {downloading
              ? <><Loader2 size={12} className="animate-spin" /> Downloading {progress}%</>
              : <><Download size={12} /> Download Selected{selected.size > 0 ? ` (${selected.size})` : ''}</>}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-7">
        <div className="flex items-center gap-2 px-3 py-2 rounded flex-1 min-w-[220px] max-w-sm"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Search size={11} className="text-white/25" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, anchor, prompt, lighting…"
            className="bg-transparent text-[11px] font-mono text-white/60 placeholder-white/20 outline-none flex-1" />
        </div>

        <select value={anchor} onChange={e => setAnchor(e.target.value)}
          className="px-3 py-2 rounded text-[10px] font-mono text-white/55 outline-none cursor-pointer appearance-none"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <option value="all" className="bg-[#111116] text-white">All anchors</option>
          {anchorFacets.map(a => <option key={a} value={a} className="bg-[#111116] text-white">{a}</option>)}
        </select>

        <select value={category} onChange={e => setCategory(e.target.value)}
          className="px-3 py-2 rounded text-[10px] font-mono text-white/55 outline-none cursor-pointer appearance-none"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <option value="all" className="bg-[#111116] text-white">All categories</option>
          {categoryFacets.map(c => <option key={c} value={c} className="bg-[#111116] text-white">{c}</option>)}
        </select>

        <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
          className="px-3 py-2 rounded text-[10px] font-mono text-white/55 outline-none cursor-pointer appearance-none"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <option value="newest" className="bg-[#111116] text-white">Newest first</option>
          <option value="oldest" className="bg-[#111116] text-white">Oldest first</option>
          <option value="name" className="bg-[#111116] text-white">Name A–Z</option>
        </select>

        {filtered.length > 0 && (
          <button onClick={toggleAllVisible}
            className="px-3 py-2 rounded text-[10px] font-mono tracking-[0.15em] uppercase transition-all"
            style={{
              background: allVisibleSelected ? 'rgba(184,149,42,0.10)' : 'rgba(255,255,255,0.02)',
              border: allVisibleSelected ? '1px solid rgba(184,149,42,0.3)' : '1px solid rgba(255,255,255,0.08)',
              color: allVisibleSelected ? '#D4AF37' : 'rgba(255,255,255,0.4)',
            }}>
            {allVisibleSelected ? 'Deselect all' : 'Select all'}
          </button>
        )}
      </div>

      {/* Body */}
      {vaultLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded animate-pulse"
              style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 flex flex-col items-center text-center gap-4">
          <LayoutGrid size={26} className="text-white/10" />
          <p className="font-serif italic text-2xl text-white/20">
            {hasFilters ? 'No assets match your filters' : 'No assets in the vault yet'}
          </p>
          {hasFilters ? (
            <button onClick={() => { setSearch(''); setAnchor('all'); setCategory('all'); }}
              className="text-[8px] font-mono text-[#B8952A] hover:text-[#D4AF37] transition-colors uppercase tracking-[0.3em]">
              Clear filters
            </button>
          ) : (
            <button onClick={() => navigate('/portal/campaigns/new')}
              className="flex items-center gap-1.5 text-[8px] font-mono text-[#B8952A] hover:text-[#D4AF37] transition-colors uppercase tracking-[0.3em]">
              <Sparkles size={11} /> Forge your first campaign
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((item, i) => {
            const isSel = selected.has(item.id);
            return (
              <motion.div key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                className="relative aspect-[4/5] rounded overflow-hidden group cursor-pointer"
                onClick={() => toggle(item.id)}
                style={{
                  background: 'linear-gradient(145deg, #111116 0%, #0D0D10 100%)',
                  border: isSel ? '1px solid rgba(184,149,42,0.6)' : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: isSel ? '0 0 14px rgba(184,149,42,0.18)' : 'none',
                }}>
                {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}

                {/* Select check */}
                <div className="absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: isSel ? '#B8952A' : 'rgba(0,0,0,0.5)',
                    border: isSel ? 'none' : '1px solid rgba(255,255,255,0.3)',
                  }}>
                  {isSel && <Check size={11} className="text-black" />}
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                  bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-3">
                  <p className="text-[9px] font-medium text-white/90 truncate">{item.name || 'Untitled'}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[7px] font-mono text-white/40 truncate">
                      {(item.anchors || [])[0] || item.category || '—'}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); downloadAsset(item); }}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-black/60 border border-white/15 text-white/80 text-[7px] font-mono tracking-[0.15em] uppercase hover:border-[#B8952A]/60 transition-all">
                      <Download size={9} /> Save
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
