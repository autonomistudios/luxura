import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, Wand2, X, ImageOff, Film, Play, Image } from 'lucide-react';
import AssetActionsDrawer from '../components/AssetActionsDrawer';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { useSovereignStore } from '../store/useSovereignStore';
import type { VaultItem, VideoVaultItem } from '../store/useSovereignStore';
import { LOCATION_PRESETS } from '../lib/locationPresets';
import type { LocationPreset } from '../lib/locationPresets';

function VaultImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  return (
    <div className="relative w-full h-full">
      {!loaded && !errored && (
        <div className="absolute inset-0 bg-white/5 animate-pulse" />
      )}
      {errored ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/[0.02]">
          <ImageOff size={20} className="text-white/20" />
          <p className="text-[7px] font-mono text-white/20 uppercase tracking-[0.3em]">Load Failed</p>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`${className || ''} transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => { setLoaded(true); setErrored(true); }}
        />
      )}
    </div>
  );
}

const ANCHOR_DISPLAY: Record<string, string> = {
  HAIR: 'Hair', BARBER: 'Barber', MAKEUP: 'Makeup', NAILS: 'Nails',
  SHIRT: 'Shirt', PANTS: 'Pants', SHORTS: 'Shorts', SWIMWEAR: 'Swimwear',
  HAT: 'Hat', FULL_OUTFIT: 'Full Outfit', BELT: 'Belt', SHOES: 'Shoes',
  EARRINGS: 'Earrings', NECKLACE: 'Necklace', BRACELET: 'Bracelet',
  WATCH: 'Watch', RING: 'Ring',
};

const CLOTHING_ANCHOR_IDS = ['SHIRT', 'PANTS', 'SHORTS', 'SWIMWEAR', 'HAT', 'FULL_OUTFIT'];

const TIER1_ANCHORS = [
  { id: 'HAIR', label: 'Hair' },
  { id: 'BARBER', label: 'Barber' },
  { id: 'MAKEUP', label: 'Makeup' },
  { id: 'NAILS', label: 'Nails' },
];
const CLOTHING_ANCHORS = [
  { id: 'SHIRT', label: 'Shirt' },
  { id: 'PANTS', label: 'Pants' },
  { id: 'SHORTS', label: 'Shorts' },
  { id: 'SWIMWEAR', label: 'Swimwear' },
  { id: 'HAT', label: 'Hat' },
  { id: 'FULL_OUTFIT', label: 'Full Outfit' },
];
const ACCESSORY_ANCHORS = [
  { id: 'BELT', label: 'Belt' },
  { id: 'SHOES', label: 'Shoes' },
  { id: 'EARRINGS', label: 'Earrings' },
  { id: 'NECKLACE', label: 'Necklace' },
  { id: 'BRACELET', label: 'Bracelet' },
  { id: 'WATCH', label: 'Watch' },
  { id: 'RING', label: 'Ring' },
];

type VaultTab = 'remix' | 'enhance';

function RemixPanel({ item, onClose }: { item: VaultItem; onClose: () => void }) {
  const navigate = useNavigate();
  const { removeFromVault } = useSovereignStore();

  const [activeTab, setActiveTab] = useState<VaultTab>('remix');

  const [remixAnchors, setRemixAnchors] = useState<string[]>(
    Array.isArray(item.anchors) && item.anchors.length ? [...item.anchors] : ['HAIR']
  );
  const [remixStrategy, setRemixStrategy] = useState<'keep' | 'change'>(item.strategy ?? 'change');
  const [remixSkin, setRemixSkin] = useState(item.skinTone || 'Porcelain');
  const [remixLighting, setRemixLighting] = useState(item.lighting || 'Clean & Even');
  const [remixCamera, setRemixCamera] = useState(item.camera || 'Soft Background (85mm)');
  const [remixPrompt, setRemixPrompt] = useState(item.prompt || '');
  const [remixLocation, setRemixLocation] = useState<LocationPreset | null>(null);

  const toggleAnchor = (id: string) => {
    setRemixAnchors((prev) =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter((a) => a !== id) : prev
        : [...prev, id]
    );
  };

  const handleRemix = () => {
    navigate(`/workflow/${item.category}`, {
      state: {
        prefill: {
          ...item,
          anchors: remixAnchors,
          strategy: remixStrategy,
          skinTone: remixSkin,
          lighting: remixLighting,
          camera: remixCamera,
          prompt: remixPrompt,
          locationPreset: remixLocation?.description,
          autoExecute: true // Jumps directly to Gen Stage 4
        },
      },
    });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = item.image;
    link.download = `${item.name.replace(/[\s—]+/g, '_')}.jpg`;
    link.click();
  };

  const handleRemove = () => {
    removeFromVault(item.id);
    onClose();
  };

  const hasClothing = remixAnchors.some((a) => CLOTHING_ANCHOR_IDS.includes(a));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 md:p-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.96, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 24 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-4xl bg-[#050505] border border-white/10 flex flex-col md:flex-row overflow-hidden max-h-[92vh] md:max-h-[88vh]"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-white/30 hover:text-white transition-colors p-2 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Image */}
        <div className="w-full md:w-[38%] flex-shrink-0 aspect-[3/4] md:aspect-auto overflow-hidden">
          <VaultImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
        </div>

        {/* Settings Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header + Tabs */}
          <div className="px-8 pt-8 pb-0 pr-12 flex-shrink-0 space-y-5">
            <div>
              <p className="text-[8px] font-mono uppercase tracking-[0.6em] text-[#C5A253]/50 mb-1">
                {item.date} // {item.category}
              </p>
              <h2 className="text-2xl font-serif italic text-white">{item.name}</h2>
            </div>
            {/* Tab switcher */}
            <div className="flex border-b border-white/10">
              {([
                { id: 'remix'   as VaultTab, label: 'Remix',   Icon: Wand2 },
                { id: 'enhance' as VaultTab, label: 'Refine & Upscale', Icon: Image },
              ]).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-[8px] font-mono uppercase tracking-[0.3em] border-b-2 transition-all -mb-px cursor-pointer ${
                    activeTab === id
                      ? 'border-[#C5A253] text-[#C5A253]'
                      : 'border-transparent text-white/25 hover:text-white/50'
                  }`}
                >
                  <Icon size={10} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">

          {/* Enhance tab — always mounted, hidden when inactive to preserve SSE stream state */}
          <div className={activeTab === 'enhance' ? 'block' : 'hidden'}>
            <AssetActionsDrawer image={item.image} theme="dark" />
          </div>

          {activeTab === 'remix' && (
          <div className="px-8 py-6 space-y-8">

          {/* Anchor toggles */}
          <div className="space-y-3">
            <p className="text-[8px] font-mono uppercase tracking-[0.5em] text-white/20">
              Anchors — Toggle to Adjust
            </p>
            {/* Tier 1 */}
            <div className="flex flex-wrap gap-2">
              {TIER1_ANCHORS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => toggleAnchor(id)}
                  className={`px-3 py-1.5 border text-[8px] font-mono uppercase tracking-[0.2em] transition-all duration-200 cursor-pointer ${
                    remixAnchors.includes(id)
                      ? 'border-[#C5A253] text-[#C5A253] bg-[#C5A253]/5'
                      : 'border-white/10 text-white/25 hover:text-white/50 hover:border-white/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* Clothing */}
            <div className="flex flex-wrap gap-2">
              {CLOTHING_ANCHORS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => toggleAnchor(id)}
                  className={`px-3 py-1.5 border text-[8px] font-mono uppercase tracking-[0.2em] transition-all duration-200 cursor-pointer ${
                    remixAnchors.includes(id)
                      ? 'border-[#C5A253] text-[#C5A253] bg-[#C5A253]/5'
                      : 'border-white/10 text-white/25 hover:text-white/50 hover:border-white/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* Accessories */}
            <div className="flex flex-wrap gap-2">
              {ACCESSORY_ANCHORS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => toggleAnchor(id)}
                  className={`px-3 py-1.5 border text-[8px] font-mono uppercase tracking-[0.2em] transition-all duration-200 cursor-pointer ${
                    remixAnchors.includes(id)
                      ? 'border-[#C5A253] text-[#C5A253] bg-[#C5A253]/5'
                      : 'border-white/10 text-white/25 hover:text-white/50 hover:border-white/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[7px] font-mono text-[#C5A253]/40 tracking-[0.4em] uppercase">
              Locked → {remixAnchors.map((a) => ANCHOR_DISPLAY[a] || a).join(' + ')}
              {hasClothing ? '  ·  outfit-safe framing active' : ''}
            </p>
          </div>

          {/* Strategy toggle */}
          <div className="space-y-3">
            <p className="text-[8px] font-mono uppercase tracking-[0.5em] text-white/20">
              Generation Strategy
            </p>
            <div className="flex gap-3">
              {([
                { val: 'keep' as const, label: '[ Preserve Original ]' },
                { val: 'change' as const, label: '[ AI Reimagination ]' },
              ]).map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => setRemixStrategy(val)}
                  className={`px-4 py-2 border text-[8px] font-mono uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer ${
                    remixStrategy === val
                      ? 'border-[#C5A253] text-[#C5A253] bg-[#C5A253]/5'
                      : 'border-white/10 text-white/30 hover:text-white/60'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* INTERACTIVE CONTROLS */}
          <div className="space-y-6 pt-4 border-t border-white/5">
            <p className="text-[8px] font-mono uppercase tracking-[0.5em] text-white/20">
              Technical Controls
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Skin Tone */}
              <div className="space-y-2">
                <p className="text-[7px] font-mono uppercase tracking-[0.3em] text-white/20">Skin Tone</p>
                <select 
                  value={remixSkin}
                  onChange={(e) => setRemixSkin(e.target.value)}
                  disabled={remixStrategy === 'keep'}
                  className="w-full bg-transparent border-b border-white/10 py-1 text-[10px] font-mono text-[#C5A253] focus:outline-none disabled:opacity-20"
                >
                  {['Fair', 'Porcelain', 'Tan', 'Cinnamon', 'Brown', 'Chocolate', 'Deep'].map(opt => <option key={opt} value={opt} className="bg-black">{opt}</option>)}
                </select>
              </div>

              {/* Lighting */}
              <div className="space-y-2">
                <p className="text-[7px] font-mono uppercase tracking-[0.3em] text-white/20">Lighting</p>
                <select 
                  value={remixLighting}
                  onChange={(e) => setRemixLighting(e.target.value)}
                  className="w-full bg-transparent border-b border-white/10 py-1 text-[10px] font-mono text-[#C5A253] focus:outline-none"
                >
                  {['Clean & Even', 'Sunset Side Glow', 'Deep Shadow', 'Beauty Overhead', 'Moody Cinema', 'Soft Natural'].map(opt => <option key={opt} value={opt} className="bg-black">{opt}</option>)}
                </select>
              </div>

              {/* Camera */}
              <div className="space-y-2">
                <p className="text-[7px] font-mono uppercase tracking-[0.3em] text-white/20">Lens / Depth</p>
                <select 
                  value={remixCamera}
                  onChange={(e) => setRemixCamera(e.target.value)}
                  className="w-full bg-transparent border-b border-white/10 py-1 text-[10px] font-mono text-[#C5A253] focus:outline-none"
                >
                  {['Soft Background (85mm)', 'Natural Eye (50mm)', 'Fashion Zoom (135mm)', 'Editorial Wide (24mm)', 'Street Style (35mm)', 'Ultra Close-Up (Macro)'].map(opt => <option key={opt} value={opt} className="bg-black">{opt}</option>)}
                </select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <p className="text-[7px] font-mono uppercase tracking-[0.3em] text-white/20">Environment</p>
                <button 
                  onClick={() => setRemixPrompt('REMIX_LOC')} 
                  className="w-full text-left border-b border-white/10 py-1 text-[10px] font-mono text-[#C5A253] truncate hover:text-white transition-colors"
                >
                   {remixLocation ? remixLocation.label : (item.bg === 'custom-bg' ? 'Custom Env' : (item.bg || 'Studio Grey'))}
                </button>
              </div>
            </div>

            {/* Prompt override */}
            <div className="space-y-2">
              <p className="text-[7px] font-mono uppercase tracking-[0.3em] text-white/20">Atmospheric Note</p>
              <input 
                 type="text"
                 value={remixPrompt === 'REMIX_LOC' ? '' : remixPrompt}
                 onChange={(e) => setRemixPrompt(e.target.value)}
                 placeholder="e.g. model on a yacht, rainy street..."
                 className="w-full bg-transparent border-b border-white/10 py-1 text-[10px] font-mono text-white/60 focus:outline-none focus:border-[#C5A253]/40"
              />
            </div>
            
            {/* Conditional Location Picker Mock (since it requires a complex component) */}
            {remixPrompt === 'REMIX_LOC' && (
               <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-2xl p-8 flex items-center justify-center">
                  <div className="w-full max-w-2xl space-y-6">
                     <div className="flex justify-between items-center">
                        <h3 className="text-xl font-serif italic text-white">Select New Environment</h3>
                        <button onClick={() => setRemixPrompt('')} className="text-white/30 hover:text-white"><X size={20}/></button>
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-2 overflow-y-auto max-h-[60vh] pr-4 custom-scrollbar">
                        {LOCATION_PRESETS.map(loc => (
                           <button 
                              key={loc.id} 
                              onClick={() => { setRemixLocation(loc); setRemixPrompt(''); }}
                              className="p-3 border border-white/5 hover:border-[#C5A253]/50 text-[8px] font-mono text-left uppercase tracking-widest text-white/40 hover:text-[#C5A253] transition-all"
                           >
                              {loc.label}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <motion.button
              onClick={handleRemix}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 border border-[#C5A253]/50 text-[#C5A253] text-[9px] font-mono uppercase tracking-[0.5em] hover:bg-[#C5A253]/10 transition-all duration-500 flex items-center justify-center gap-3 cursor-pointer"
            >
              <Wand2 size={14} />
              Create New Variations
            </motion.button>
            <div className="flex gap-3">
              <motion.button
                onClick={handleDownload}
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-3 border border-white/10 text-white/40 text-[8px] font-mono uppercase tracking-[0.4em] hover:text-white hover:border-white/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={12} />
                Download
              </motion.button>
              <motion.button
                onClick={handleRemove}
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-3 border border-red-500/20 text-red-400/50 text-[8px] font-mono uppercase tracking-[0.4em] hover:text-red-400 hover:border-red-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 size={12} />
                Remove
              </motion.button>
            </div>
          </div>

          </div>
          )}

          </div>{/* end tab content */}
        </div>{/* end settings panel */}
      </motion.div>
    </motion.div>
  );
}

export default function Vault() {
  const { vaultAssets, vaultLoading, videoVaultAssets, videoVaultLoading, removeFromVideoVault } = useSovereignStore();
  const location = useLocation();
  const initialTab = (location.state as { tab?: string } | null)?.tab === 'videos' ? 'videos' : 'images';
  const [tab, setTab] = useState<'images' | 'videos'>(initialTab as 'images' | 'videos');
  const [selected, setSelected] = useState<VaultItem | null>(null);
  const [playingVideo, setPlayingVideo] = useState<VideoVaultItem | null>(null);

  const handleDeleteVideo = (id: string) => removeFromVideoVault(id);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '';
    const mb = bytes / 1024 / 1024;
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <Layout>
      <div className="min-h-screen pt-32 px-6 md:px-12 pb-20">

        {/* Header */}
        <div className="flex justify-between items-end mb-12 border-b border-[#1C1C1C]/8 pb-8 max-w-7xl mx-auto">
          <div>
            <h1 className="text-5xl font-serif italic text-[#1C1C1C] mb-2">The Vault</h1>
            <p className="text-[10px] font-mono uppercase tracking-[0.6em] text-[#C5A253]/50">
              Saved Masterpieces // {vaultAssets.length} Image{vaultAssets.length !== 1 ? 's' : ''} · {videoVaultAssets.length} Video{videoVaultAssets.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[9px] font-mono text-[#1C1C1C]/30 uppercase tracking-[0.3em]">
              Sovereign Tier // Persistent Storage
            </p>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="max-w-7xl mx-auto flex gap-0 border-b border-[#1C1C1C]/8 mb-16">
          {(['images', 'videos'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-6 py-3 text-[8px] font-mono uppercase tracking-[0.4em] transition-all border-b-2 ${
                tab === t
                  ? 'border-[#C5A253] text-[#C5A253]'
                  : 'border-transparent text-[#1C1C1C]/35 hover:text-[#1C1C1C]/65'
              }`}
            >
              {t === 'images' ? <Image size={10} /> : <Film size={10} />}
              {t === 'images' ? `Images (${vaultAssets.length})` : `Videos (${videoVaultAssets.length})`}
            </button>
          ))}
        </div>

        {/* ── IMAGES TAB ── */}
        {tab === 'images' && (
          <>
        {/* Loading state */}
        {vaultLoading && (
          <div className="flex items-center justify-center py-48">
            <p className="text-[9px] font-mono uppercase tracking-[0.8em] text-[#1C1C1C]/35 animate-pulse">
              Loading vault…
            </p>
          </div>
        )}

        {/* Empty state */}
        {!vaultLoading && vaultAssets.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="flex flex-col items-center justify-center py-48 text-center gap-8"
          >
            <div className="w-16 h-[1px] bg-[#C5A253]/20" />
            <div className="space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.8em] text-[#1C1C1C]/45">
                The Vault Awaits
              </p>
              <p className="text-[11px] font-mono text-[#1C1C1C]/40 leading-relaxed max-w-xs">
                Generate variations in the Atelier, click any image, and press Deploy to Vault to save it here.
              </p>
            </div>
            <div className="w-16 h-[1px] bg-[#C5A253]/20" />
          </motion.div>
        )}

        {/* Vault Grid */}
        {!vaultLoading && vaultAssets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 max-w-7xl mx-auto">
            {vaultAssets.map((asset, i) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.9 }}
                whileHover={{ y: -8 }}
                whileTap={{ scale: 0.98 }}
                className="group cursor-pointer"
                onClick={() => setSelected(asset)}
              >
                {/* Asset Preview */}
                <div className="relative aspect-[4/5] overflow-hidden border border-[#1C1C1C]/8 group-hover:border-[#C5A253]/30 transition-all duration-1000">
                  {/* Corner marks */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#C5A253]/20 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#C5A253]/20 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-[#C5A253]/20 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-[#C5A253]/20 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <VaultImage
                    src={asset.image}
                    alt={asset.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-[2s] scale-105 group-hover:scale-100"
                  />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="absolute bottom-6 left-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0">
                    <p className="text-[8px] font-mono text-[#C5A253] tracking-[0.4em] mb-1 uppercase">
                      {Array.isArray(asset.anchors)
                        ? asset.anchors.map((a) => ANCHOR_DISPLAY[a] || a).join(' + ')
                        : ''}
                    </p>
                    <h3 className="text-xl font-serif italic text-white">{asset.name}</h3>
                  </div>

                  {/* Click hint */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="flex items-center gap-1.5 border border-[#C5A253]/30 px-2 py-1 bg-black/60">
                      <Wand2 size={9} className="text-[#C5A253]/60" />
                      <span className="text-[7px] font-mono text-[#C5A253]/60 uppercase tracking-[0.3em]">Remix</span>
                    </div>
                  </div>
                </div>

                {/* Asset Footer */}
                <div className="mt-4 flex justify-between items-center px-1 opacity-50 group-hover:opacity-100 transition-opacity duration-700">
                  <span className="text-[9px] font-mono text-[#1C1C1C]/40 tracking-widest">{asset.date}</span>
                  <span className="text-[9px] font-mono text-[#C5A253] tracking-widest uppercase">
                    {asset.strategy === 'keep' ? 'Preserved' : 'AI Gen'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
          </>
        )}

        {/* ── VIDEOS TAB ── */}
        {tab === 'videos' && (
          <>
            {videoVaultLoading && (
              <div className="flex items-center justify-center py-48">
                <p className="text-[9px] font-mono uppercase tracking-[0.8em] text-[#1C1C1C]/35 animate-pulse">Loading videos…</p>
              </div>
            )}

            {!videoVaultLoading && videoVaultAssets.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-48 text-center gap-8"
              >
                <Film size={32} className="text-[#1C1C1C]/20" />
                <div className="space-y-3">
                  <p className="text-[10px] font-mono uppercase tracking-[0.8em] text-[#1C1C1C]/45">No Videos Yet</p>
                  <p className="text-[11px] font-mono text-[#1C1C1C]/40 leading-relaxed max-w-xs">
                    Generate a video in Cinema Studio, then press “Save to Video Vault” to store it here permanently.
                  </p>
                </div>
              </motion.div>
            )}

            {!videoVaultLoading && videoVaultAssets.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {videoVaultAssets.map((video, i) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.8 }}
                    className="group"
                  >
                    {/* Video Thumbnail / Preview */}
                    <div
                      className={`relative overflow-hidden border border-white/6 group-hover:border-[#C5A253]/30 transition-all duration-700 cursor-pointer ${
                        video.aspectRatio === '9:16' ? 'aspect-[9/16] max-w-[200px] mx-auto' : 'aspect-video'
                      }`}
                      onClick={() => setPlayingVideo(video)}
                    >
                      <video
                        src={video.videoUrl}
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700"
                        onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
                      />
                      {/* Hover play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="w-12 h-12 border border-[#C5A253]/50 rounded-full flex items-center justify-center bg-black/60">
                          <Play size={16} className="text-[#C5A253] ml-0.5" />
                        </div>
                      </div>
                      {/* Corner marks */}
                      <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#C5A253]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#C5A253]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#C5A253]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#C5A253]/30 opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* Model badge */}
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[6px] font-mono text-[#C5A253]/60 uppercase tracking-[0.3em] border border-[#C5A253]/20 px-1.5 py-0.5 bg-black/60">
                          Veo 3.1 {video.model === 'fast' ? 'Fast' : 'STD'}
                        </span>
                      </div>
                    </div>

                    {/* Video metadata */}
                    <div className="mt-3 px-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-mono text-[#1C1C1C]/65 truncate">{video.title}</p>
                          <p className="text-[7px] font-mono text-[#1C1C1C]/35 uppercase tracking-[0.3em] mt-0.5">
                            {video.aspectRatio} · {video.duration}s · {formatBytes(video.sizeBytes)}
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <a
                            href={video.videoUrl}
                            download={`${video.title.replace(/[^a-z0-9]/gi, '_')}.mp4`}
                            className="p-1.5 border border-[#1C1C1C]/10 text-[#1C1C1C]/35 hover:text-[#1C1C1C] hover:border-[#1C1C1C]/25 transition-colors"
                            title="Download"
                          >
                            <Download size={10} />
                          </a>
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="p-1.5 border border-white/8 text-white/30 hover:text-red-400/60 hover:border-red-500/20 transition-colors"
                            title="Remove from vault"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Image Remix Panel */}
      <AnimatePresence>
        {selected && (
          <RemixPanel key={selected.id} item={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>

      {/* Video Lightbox */}
      <AnimatePresence>
        {playingVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setPlayingVideo(null); }}
          >
            <motion.div
              initial={{ scale: 0.96, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={`relative ${ playingVideo.aspectRatio === '9:16' ? 'max-w-xs w-full' : 'max-w-4xl w-full' }`}
            >
              <button
                onClick={() => setPlayingVideo(null)}
                className="absolute -top-10 right-0 text-white/30 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
              <div className="border border-[#C5A253]/20 overflow-hidden">
                <video
                  src={playingVideo.videoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full"
                  style={{ aspectRatio: playingVideo.aspectRatio === '9:16' ? '9/16' : '16/9' }}
                />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-mono text-[#C5A253]/60 uppercase tracking-[0.4em]">{playingVideo.title}</p>
                  <p className="text-[7px] font-mono text-white/25 mt-1">{playingVideo.aspectRatio} · {playingVideo.duration}s · Veo 3.1 {playingVideo.model === 'fast' ? 'Fast' : 'Standard'}</p>
                </div>
                <a
                  href={playingVideo.videoUrl}
                  download={`${playingVideo.title.replace(/[^a-z0-9]/gi, '_')}.mp4`}
                  className="flex items-center gap-2 px-5 py-2.5 border border-[#C5A253]/30 text-[#C5A253]/70 text-[8px] font-mono uppercase tracking-[0.3em] hover:bg-[#C5A253]/10 transition-colors"
                >
                  <Download size={11} /> Download
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
