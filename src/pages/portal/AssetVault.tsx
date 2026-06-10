import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Download, Check, LayoutGrid, X, Sparkles, Loader2, BookOpen } from 'lucide-react';
import JSZip from 'jszip';
import { useSovereignStore, type VaultItem } from '../../store/useSovereignStore';

// ─── Download helpers ──────────────────────────────────────────────────────────
function safeName(item: VaultItem): string {
  const base = (item.name || 'asset').replace(/[^\w-]+/g, '_').slice(0, 60);
  return `${base}_${item.id.slice(-6)}`;
}

// Cloud Storage sends no CORS headers, so a direct blob-fetch is blocked. Route remote
// images through the same-origin proxy, which streams them with Content-Disposition so the
// browser always saves a real file. data-URLs download directly.
function proxyUrl(url: string, filename?: string): string {
  return url.startsWith('data:')
    ? url
    : `/api/download?u=${encodeURIComponent(url)}${filename ? `&n=${encodeURIComponent(filename)}` : ''}`;
}

function downloadAsset(item: VaultItem): void {
  const name = `${safeName(item)}.png`;
  const a = document.createElement('a');
  a.href = proxyUrl(item.image, name);
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
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
        downloadAsset(items[0]);
        setProgress(100);
      } else {
        // Multiple files: package into a ZIP
        const zip = new JSZip();
        let successCount = 0;
        
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          try {
            const res = await fetch(proxyUrl(item.image));   // same-origin proxy → readable blob, no CORS
            if (!res.ok) throw new Error(String(res.status));
            const blob = await res.blob();
            // Add file to zip
            zip.file(`${safeName(item)}.png`, blob);
            successCount++;
          } catch (err) {
            console.warn(`Failed to fetch ${item.name} for zip:`, err);
          }
          setProgress(Math.round(((i + 1) / items.length) * 50)); // 50% for fetching
        }

        // If CORS blocked ALL images, fallback to sequential individual downloads
        if (successCount === 0) {
          console.warn('All files failed to zip (CORS issue). Falling back to sequential downloads.');
          for (let i = 0; i < items.length; i++) {
            downloadAsset(items[i]);
            setProgress(50 + Math.round(((i + 1) / items.length) * 50));
            await new Promise(r => setTimeout(r, 250));
          }
          return;
        }

        // Generate the zip file
        const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
          // metadata.percent is 0-100; map it to the 50-100% range of the progress bar
          setProgress(50 + Math.round(metadata.percent / 2));
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
    <div className="p-10 min-h-full font-sans">
      <div className="absolute top-0 right-0 w-full h-96 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 70%)' }} />

      {/* Header */}
      <div className="flex items-end justify-between mb-10 border-b border-white/[0.05] pb-8">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">Asset Vault</h1>
          <p className="text-[12px] font-medium tracking-wide text-[#86868B]">
            {vaultAssets.length} assets · {filtered.length} shown{selected.size > 0 ? ` · ${selected.size} selected` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/portal/lookbook')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-hairline text-secondary hover:text-primary hover:border-hairline-gold text-[12px] font-medium transition-all">
            <BookOpen size={14} /> View as Lookbook
          </button>
          {selected.size > 0 && (
            <button onClick={clearSelection}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#1C1C1E] text-white hover:bg-[#2C2C2E] text-[12px] font-medium transition-all">
              <X size={14} /> Clear Selection
            </button>
          )}
          <button
            onClick={downloadSelected}
            disabled={selected.size === 0 || downloading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black hover:bg-white/90 text-[12px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ boxShadow: selected.size > 0 && !downloading ? '0 4px 14px rgba(255,255,255,0.2)' : 'none' }}>
            {downloading
              ? <><Loader2 size={14} className="animate-spin" /> Packaging {progress}%</>
              : <><Download size={14} strokeWidth={2.5} /> Download Selected</>}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="flex items-center gap-3 bg-[#1C1C1E] rounded-full px-4 py-2 border border-white/5 flex-1 max-w-sm focus-within:border-white/20 transition-colors">
          <Search size={16} className="text-[#86868B]" />
          <input
            placeholder="Search assets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-[13px] text-white placeholder-[#86868B] outline-none flex-1 font-medium" />
        </div>

        <select value={anchor} onChange={e => setAnchor(e.target.value)}
          className="px-4 py-2.5 rounded-full bg-[#1C1C1E] text-[12px] font-medium text-white border border-white/5 outline-none cursor-pointer appearance-none">
          <option value="all" className="bg-[#111116] text-white">All anchors</option>
          {anchorFacets.map(a => <option key={a} value={a} className="bg-[#111116] text-white">{a}</option>)}
        </select>

        <select value={category} onChange={e => setCategory(e.target.value)}
          className="px-4 py-2.5 rounded-full bg-[#1C1C1E] text-[12px] font-medium text-white border border-white/5 outline-none cursor-pointer appearance-none">
          <option value="all" className="bg-[#111116] text-white">All categories</option>
          {categoryFacets.map(c => <option key={c} value={c} className="bg-[#111116] text-white">{c}</option>)}
        </select>

        <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
          className="px-4 py-2.5 rounded-full bg-[#1C1C1E] text-[12px] font-medium text-white border border-white/5 outline-none cursor-pointer appearance-none">
          <option value="newest" className="bg-[#111116] text-white">Newest first</option>
          <option value="oldest" className="bg-[#111116] text-white">Oldest first</option>
          <option value="name" className="bg-[#111116] text-white">Name A–Z</option>
        </select>

        {filtered.length > 0 && (
          <button
            onClick={toggleAllVisible}
            className="px-4 py-2.5 rounded-full border border-white/10 text-white hover:bg-white/10 text-[12px] font-medium transition-all ml-auto"
          >
            {allVisibleSelected ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Grid */}
      {vaultLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4 text-[#86868B]">
          <Loader2 size={24} className="animate-spin text-white/40" />
          <span className="text-[12px] font-medium tracking-wide">Loading Vault...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4 text-[#86868B] border border-white/5 rounded-3xl bg-[#1C1C1E]/30">
          <LayoutGrid size={32} className="opacity-20" />
          <p className="text-[14px] font-medium">{hasFilters ? 'No assets match your filters.' : 'Your vault is empty.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filtered.map(item => {
            const isSelected = selected.has(item.id);
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={item.id}
                onClick={() => toggle(item.id)}
                className={`group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer bg-[#1C1C1E] transition-all duration-300 ${
                  isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : 'hover:ring-1 hover:ring-white/30'
                }`}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />

                {/* Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Selection Checkmark */}
                <div className="absolute top-4 left-4 z-10">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors duration-200 ${
                    isSelected ? 'bg-white border-white text-black' : 'border-white/40 bg-black/40 backdrop-blur-md opacity-0 group-hover:opacity-100 text-transparent'
                  }`}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                </div>

                {/* Hover Metadata */}
                <div className="absolute bottom-0 left-0 w-full p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <h3 className="text-white text-[13px] font-semibold truncate mb-1">{item.name || 'Untitled Asset'}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[#86868B] text-[10px] uppercase tracking-wider">{item.category || 'Uncategorized'}</span>
                      {item.dna && <Sparkles size={10} className="text-[#86868B]" />}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); downloadAsset(item); }}
                      className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-[10px] font-medium transition-colors"
                    >
                      Save
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
