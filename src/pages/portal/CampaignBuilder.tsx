import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, FolderLock, ChevronDown, Lock,
  Check, Play, Download, Save, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSovereignStore, type SkuDocument } from '../../store/useSovereignStore';
import { PHOTOGRAPHY_PRESETS } from '../../lib/photographyPresets';
import { LOCATION_PRESETS } from '../../lib/locationPresets';
import { ANCHOR_TYPES } from '../../lib/skuConstants';
import { MapPin, ChevronRight, Plus, X, Shirt, Wand2, Upload } from 'lucide-react';
import { CreativePropsGallery } from '../../components/CreativePropsGallery';
import type { CreativeProp } from '../../lib/creativeProps';
import { Badge } from '../../components/ui';

const ANCHOR_LABEL: Record<string, string> = Object.fromEntries(
  ANCHOR_TYPES.map(a => [a.id, a.label]),
);

// Canvas-compress an uploaded environment photo (max 1600px, JPEG q0.85) so the
// forge payload stays well under serverless body limits.
function compressImage(file: File, maxDim = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas unsupported'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Photography config (mirrors lib/forge/config/photography.js) ─────────────
const LIGHTING_OPTIONS    = ['Clean & Even', 'Sunset Side Glow', 'Deep Shadow', 'Beauty Overhead', 'Moody Cinema', 'Soft Natural'];
const CAMERA_OPTIONS      = ['Soft Background (85mm)', 'Natural Eye (50mm)', 'Editorial Wide (24mm)', 'Fashion Zoom (135mm)', 'Street Style (35mm)', 'Ultra Close-Up (Macro)'];
const COLOR_GRADE_OPTIONS = ['Matte Fade Editorial', 'Kodak Portra 400', 'Fuji Pro 400H', 'Cinematic Teal & Orange', 'Bleach Bypass', 'Cross Process', 'High Contrast B&W', 'Gritty B&W Film', 'Nordic Matte', 'Vintage Warm', 'Hyperreal'];
const SKIN_TONES = [
  { id: 'fair',      label: 'Fair',       hex: '#F5CBA7' },
  { id: 'porcelain', label: 'Porcelain',  hex: '#F2E8DC' },
  { id: 'neutral',   label: 'Neutral',    hex: '#D4A574' },
  { id: 'tan',       label: 'Tan',        hex: '#C49A6C' },
  { id: 'cinnamon',  label: 'Cinnamon',   hex: '#C68642' },
  { id: 'brown',     label: 'Brown',      hex: '#8D5524' },
  { id: 'chocolate', label: 'Chocolate',  hex: '#4A2912' },
  { id: 'ebony',     label: 'Deep Ebony', hex: '#2C1A0E' },
];

// ─── Editorial Direction (photo style classification) ─────────────────────────
const PHOTO_STYLE_OPTIONS = [
  { id: 'full-spread',             name: 'Full Spread',    pub: 'Auto-diversify' },
  { id: 'HIGH_FASHION_EDITORIAL',  name: 'High Fashion',   pub: 'Vogue · i-D' },
  { id: 'LUXURY_BRAND_CAMPAIGN',   name: 'Brand Campaign', pub: 'Chanel · Row' },
  { id: 'STREET_STYLE_CANDID',     name: 'Street Fashion', pub: 'Sartorialist' },
  { id: 'AVANT_GARDE_COUTURE',     name: 'Avant Garde',    pub: 'Tim Walker' },
  { id: 'BEAUTY_EDITORIAL',        name: 'Beauty Focus',   pub: 'Allure' },
  { id: 'LIFESTYLE_EDITORIAL',     name: 'Lifestyle',      pub: 'Kinfolk' },
  { id: 'FINE_ART_PORTRAIT',       name: 'Fine Portrait',  pub: 'Leibovitz' },
  { id: 'FASHION_MAGAZINE_SPREAD', name: 'Magazine',        pub: 'BAZAAR' },
  { id: 'LUXURY_CATALOG',          name: 'Lux Catalog',    pub: 'Net-a-Porter' },
];

const CAMERA_FORMAT_OPTIONS = [
  'Phase One 150MP · 80mm', 'Hasselblad H6D · 100mm', 'Leica M · 35mm Film',
  'Canon 1DX · 85mm', 'Contax 645 · 80mm Film', '4x5 Large Format Film',
  '35mm Disposable Film', 'Canon AE-1 · 50mm Film',
];

const MODEL_ARCHETYPE_OPTIONS = [
  'High Fashion', 'Commercial', 'Androgynous', 'Beauty',
  'Curve Editorial', 'Athletic', 'Petite', 'Distinguished',
];

const POSE_OPTIONS = [
  'Auto', 'Power Stand', 'Editorial Lean', 'Walking Motion', 'Seated Drape',
  'Over Shoulder', 'Hands Active', 'Full Extension', 'Candid Moment',
  'Contraposto', 'Profile Silhouette',
];

const EXPRESSION_OPTIONS = [
  'Auto', 'Fierce', 'Soft Romantic', 'Candid Joy', 'Cold Editorial',
  'Introspective', 'Sensual', 'Confident Direct',
];

const AGE_RANGE_OPTIONS = [
  'Emerging (18–24)', 'Prime Editorial (25–35)', 'Established (35–45)',
  'Mature Luxury (45–55)', 'Distinguished (55+)',
];

const SHOT_TYPE_OPTIONS = [
  'Full Body', '3/4 Body', 'Waist Up', 'Portrait', 'Beauty Close',
  'Detail Shot', 'Environmental Scale',
];

const ATMOSPHERE_OPTIONS = [
  'Auto', 'Golden Hour', 'Overcast Soft', 'Blue Hour', 'Harsh Midday',
  'Misty Rain', 'Dramatic Storm', 'Snow Winter', 'Heat Haze',
];

const STYLING_OPTIONS = [
  'Auto', 'Minimal Clean', 'Full Editorial', 'Street Cast',
  'Luxury Campaign', 'Sport Luxe',
];

const GENDER_OPTIONS = ['Female', 'Male', 'Unisex (Androgynous)'];

const STRATEGY_OPTIONS = [
  { id: 'change', label: 'AI Reimagine', sub: 'Generate new model' },
  { id: 'keep', label: 'Preserve Identity', sub: 'Keep exact face' },
];

// ─── Agent Pipeline Strip ─────────────────────────────────────────────────────
const AGENTS = [
  { id: 'intent',    label: 'Intent' },
  { id: 'dna',       label: 'DNA' },
  { id: 'director',  label: 'Director' },
  { id: 'auditor',   label: 'Auditor' },
  { id: 'images',    label: 'Images' },
];

function AgentStrip({ activeAgent, completedAgents }: { activeAgent: string | null; completedAgents: string[] }) {
  return (
    <div className="flex items-center gap-0 mb-4">
      {AGENTS.map((agent, i) => {
        const done   = completedAgents.includes(agent.id);
        const active = activeAgent === agent.id;
        const color  = done ? 'var(--success)' : active ? 'var(--gold)' : 'var(--text-quaternary)';
        return (
          <React.Fragment key={agent.id}>
            <div className="flex flex-col items-center gap-1">
              <div className="w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-300"
                style={{
                  borderColor: color,
                  background: done ? 'var(--success-wash)' : active ? 'var(--gold-wash)' : 'transparent',
                  boxShadow: active ? '0 0 8px var(--gold-glow)' : 'none',
                }}>
                {done
                  ? <Check size={9} style={{ color: 'var(--success)' }} />
                  : active
                    ? <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gold)' }}
                        animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                    : <div className="w-1 h-1 rounded-full" style={{ background: 'var(--text-quaternary)' }} />
                }
              </div>
              <span className="text-[6px] font-mono tracking-[0.2em] uppercase" style={{ color }}>{agent.label}</span>
            </div>
            {i < AGENTS.length - 1 && (
              <div className="flex-1 h-px mx-1 mb-4"
                style={{ background: done ? 'var(--success-wash)' : 'var(--hairline)' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Forge Slot ───────────────────────────────────────────────────────────────
function ForgeSlot({ image, index, isGenerating, isComplete, onRefine, onEnlarge, onExport }: {
  image: string; index: number; isGenerating: boolean; isComplete: boolean;
  onRefine?: (index: number) => void;
  onEnlarge?: (image: string) => void;
  onExport?: (image: string, index: number) => void;
}) {
  const isEmpty = !image && !isGenerating;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.06 }}
      className="relative aspect-[4/5] rounded-xl overflow-hidden group"
      style={{
        background: 'var(--surface-raised)',
        border: isComplete ? '1px solid var(--hairline-gold)' : '1px solid var(--hairline)',
        boxShadow: isComplete ? '0 0 24px var(--gold-glow)' : 'none',
      }}
    >
      {/* Empty portal */}
      {isEmpty && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-px h-8 bg-white/10 mb-3" />
          <span className="text-[10px] font-semibold tracking-widest uppercase text-white/20">
            Slot {index + 1}
          </span>
        </div>
      )}

      {/* Generating — cinematic shimmer */}
      {isGenerating && !image && (
        <div className="absolute inset-0">
          {/* Radial atmospheric glow */}
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 70%)' }} />
          {/* Shimmer sweep */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%)' }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          />
          {/* Rotating ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-12 h-12 rounded-full border-t-2 border-r-2 border-transparent"
              style={{ borderTopColor: 'var(--gold)', borderRightColor: 'var(--gold-deep)' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <div className="absolute bottom-6 left-0 right-0 text-center">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-white/60">
              Streaming Slot {index + 1}...
            </span>
          </div>
        </div>
      )}

      {/* Complete — image with overlay */}
      {image && (
        <>
          <img src={image} alt={`Slot ${index + 1}`}
            onClick={() => onEnlarge?.(image)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-zoom-in" />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
            bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-4">
            <div className="flex justify-between items-start">
              <span className="font-mono text-[8px] tracking-[0.26em] text-white bg-black/60 backdrop-blur-md px-2 py-1 rounded-md">
                PLATE {index + 1}
              </span>
              <span className="font-mono text-[8px] tracking-[0.26em] uppercase px-2 py-1 rounded-md backdrop-blur-md"
                style={{ color: 'var(--gold)', background: 'var(--gold-wash)', border: '1px solid var(--hairline-gold)' }}>
                Audited
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onRefine && (
                <button
                  onClick={() => onRefine(index)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-white/20 text-white text-[10px] font-mono tracking-[0.2em] uppercase rounded-lg hover:border-white/50 hover:bg-white/10 transition-all bg-black/40 backdrop-blur-md">
                  <Wand2 size={12} /> Refine
                </button>
              )}
              <button
                onClick={() => onExport?.(image, index)}
                className="flex-1 py-2.5 text-[10px] font-mono tracking-[0.2em] uppercase rounded-lg transition-all hover:-translate-y-px"
                style={{ background: 'linear-gradient(180deg,var(--gold-bright),var(--gold) 60%,var(--gold-deep))', color: 'var(--text-on-accent)' }}>
                Export
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── Config Select (Premium Luxury) ────────────────────────────────────────
function ConfigSelect({ label, value, locked, options, onChange }: {
  label: string; value: string; locked?: boolean;
  options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-[0.24em] uppercase text-tertiary">{label}</span>
        {locked && <Lock size={10} className="text-gold" />}
      </div>
      {locked ? (
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[var(--gold-wash)] border border-[var(--hairline-gold)]">
          <span className="text-[13px] font-light text-secondary flex-1 truncate">{value}</span>
          <Lock size={11} className="text-gold flex-shrink-0" />
        </div>
      ) : (
        <div className="relative">
          <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full appearance-none cursor-pointer pl-3.5 pr-10 py-2.5 rounded-xl bg-inset border border-hairline text-primary font-sans font-light text-[13px] transition-all duration-200 ease-[cubic-bezier(.16,1,.3,1)] hover:border-hairline-strong focus:outline-none focus:border-hairline-gold focus:ring-[3px] focus:ring-gold-wash"
          >
            {options.map(o => <option key={o} value={o} style={{ background: 'var(--surface-overlay)', color: 'var(--text-primary)' }}>{o}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" />
        </div>
      )}
    </div>
  );
}

// ─── Refine Modal — per-slot iterative refinement via /api/forge-iterate ───────
const ITERATION_TYPES = [
  { id: 'feature_enhance',   label: 'Enhance',     desc: 'Sharpen detail & finish, same shot' },
  { id: 'pose_variant',      label: 'Pose',        desc: 'New pose, same look & scene' },
  { id: 'composition_shift', label: 'Composition', desc: 'Recompose framing & crop' },
] as const;

function RefineModal({ slotIndex, image, getToken, onApply, onClose }: {
  slotIndex: number;
  image: string;
  getToken: () => Promise<string>;
  onApply: (slotIndex: number, image: string) => void;
  onClose: () => void;
}) {
  const [adjustment,    setAdjustment]    = useState('');
  const [iterationType, setIterationType] = useState<typeof ITERATION_TYPES[number]['id']>('feature_enhance');
  const [isRefining,    setIsRefining]    = useState(false);
  const [variants,      setVariants]      = useState<string[]>(['', '', '']);
  const [status,        setStatus]        = useState('');

  const anyVariant = variants.some(v => !!v);

  async function handleRefine() {
    if (isRefining) return;
    setIsRefining(true);
    setVariants(['', '', '']);
    setStatus('Refining — generating 3 variants…');
    try {
      const idToken = await getToken();
      const res = await fetch('/api/forge-iterate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ masterImage: image, adjustmentPrompt: adjustment || 'Refine to peak editorial quality while preserving identity, garment, and scene.', iterationType }),
      });
      if (!res.ok || !res.body) {
        const e = await res.json().catch(() => null);
        setStatus(e?.error || 'Refinement failed. Please try again.');
        setIsRefining(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === 'image' && typeof ev.slot === 'number') {
              setVariants(prev => { const next = [...prev]; next[ev.slot] = ev.image; return next; });
              setStatus(`Variant ${ev.slot + 1} / 3 ready`);
            } else if (ev.type === 'done') {
              setStatus('3 variants ready — choose one to replace the slot');
              setIsRefining(false);
            } else if (ev.type === 'error') {
              setStatus(`Error: ${ev.error}`);
              setIsRefining(false);
            }
          } catch { /* malformed SSE */ }
        }
      }
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
      setIsRefining(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-3xl rounded-lg flex flex-col gap-5 p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: '#0C0C11', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-serif italic text-2xl text-white">Refine Slot {slotIndex + 1}</h3>
            <p className="text-[8px] font-mono tracking-[0.3em] uppercase text-white/30 mt-1">
              Iterative refinement · 2 credits per run
            </p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1"><X size={16} /></button>
        </div>

        <div className="grid grid-cols-[160px_1fr] gap-5">
          {/* Master */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[7px] font-mono tracking-[0.3em] uppercase text-white/25">Master</span>
            <div className="aspect-[4/5] rounded overflow-hidden border border-white/10">
              <img src={image} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[7px] font-mono tracking-[0.35em] uppercase text-white/25">Refinement Type</span>
              <div className="grid grid-cols-3 gap-2">
                {ITERATION_TYPES.map(t => (
                  <button key={t.id} onClick={() => setIterationType(t.id)} disabled={isRefining}
                    className="flex flex-col gap-1 p-2.5 rounded text-left transition-all disabled:opacity-50"
                    style={{
                      background: iterationType === t.id ? 'rgba(197,162,83,0.10)' : 'rgba(255,255,255,0.02)',
                      border: iterationType === t.id ? '1px solid rgba(197,162,83,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    }}>
                    <span className="text-[9px] font-mono" style={{ color: iterationType === t.id ? '#C5A253' : 'rgba(255,255,255,0.5)' }}>{t.label}</span>
                    <span className="text-[6px] font-mono text-white/25 leading-tight">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[7px] font-mono tracking-[0.35em] uppercase text-white/25">Adjustment Direction</span>
              <textarea
                value={adjustment} onChange={e => setAdjustment(e.target.value)} rows={3}
                placeholder="e.g. warmer golden-hour light, turn slightly toward camera, crop tighter to waist-up…"
                disabled={isRefining}
                className="w-full px-3 py-2.5 rounded text-[10px] font-mono text-white/60 placeholder-white/15 outline-none resize-none disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
              />
            </div>

            <button
              onClick={handleRefine} disabled={isRefining}
              className="flex items-center justify-center gap-2 py-3 rounded font-serif italic text-black text-[13px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#C5A253', boxShadow: isRefining ? 'none' : '0 0 18px rgba(197,162,83,0.3)' }}>
              {isRefining ? <><RefreshCw size={13} className="animate-spin" /> Refining…</> : <><Wand2 size={13} /> Generate 3 Variants</>}
            </button>
            {status && <p className="text-[8px] font-mono text-white/30 tracking-[0.15em] text-center">{status}</p>}
          </div>
        </div>

        {/* Variants */}
        {(isRefining || anyVariant) && (
          <div>
            <span className="text-[7px] font-mono tracking-[0.35em] uppercase text-white/25 mb-2 block">Variants — click to replace slot</span>
            <div className="grid grid-cols-3 gap-3">
              {variants.map((v, i) => (
                <div key={i} className="relative aspect-[4/5] rounded overflow-hidden group"
                  style={{ background: 'linear-gradient(145deg,#111116,#0D0D10)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {v ? (
                    <>
                      <img src={v} className="w-full h-full object-cover" />
                      <button
                        onClick={() => { onApply(slotIndex, v); onClose(); }}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/55 transition-opacity">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C5A253] text-black text-[8px] font-mono tracking-[0.2em] uppercase font-semibold rounded">
                          <Check size={10} /> Use This
                        </span>
                      </button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-[#C5A253]/40"
                        animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CampaignBuilder() {
  const { brand, canForge, can, user } = useAuth();
  const canForgeRole = can('forge');
  const { skus, currentSkuId, setCurrentSkuId, currentGrid, setGridSlot, setCurrentGrid, campaigns, deployToVault } = useSovereignStore();
  const navigate = useNavigate();

  // ── Outfit composition — one or many SKUs combined into a single look ──────
  const [outfitSkuIds, setOutfitSkuIds] = useState<string[]>(() => currentSkuId ? [currentSkuId] : []);
  const [skuPickerOpen, setSkuPickerOpen] = useState(false);

  const readySkus  = skus.filter(s => s.enrollmentStatus === 'ready');
  const outfitSkus = outfitSkuIds
    .map(id => skus.find(s => s.skuId === id))
    .filter((s): s is SkuDocument => !!s);
  const activeSku  = outfitSkus[0] || null;
  const isOutfit   = outfitSkus.length > 1;

  // Keep the store's single-SKU pointer synced to the primary garment.
  useEffect(() => { setCurrentSkuId(outfitSkuIds[0] ?? null); }, [outfitSkuIds, setCurrentSkuId]);

  const addSku    = (id: string) => setOutfitSkuIds(prev => prev.includes(id) ? prev : [...prev, id]);
  const removeSku = (id: string) => setOutfitSkuIds(prev => prev.filter(x => x !== id));
  const clearOutfit = () => setOutfitSkuIds([]);

  const lockedParams = brand?.brandKit?.lockedParams || [];

  // Config state
  const [lighting,   setLighting]   = useState(brand?.brandKit?.defaultLighting   || 'Clean & Even');
  const [camera,     setCamera]     = useState(brand?.brandKit?.defaultCamera      || 'Soft Background (85mm)');
  const [colorGrade,        setColorGrade]        = useState(brand?.brandKit?.defaultColorGrade  || 'Matte Fade Editorial');
  const [skinTone,          setSkinTone]          = useState('neutral');
  const [location,          setLocation]          = useState('');
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [customBg,          setCustomBg]          = useState<string | null>(null);
  const customBgInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedPreset,    setSelectedPreset]    = useState<string | null>(null);
  const [prompt,            setPrompt]            = useState('');
  const [outputMode,        setOutputMode]        = useState<'still' | 'video'>('still');
  const [campaignName, setCampaignName] = useState('');
  const [isSaving,     setIsSaving]     = useState(false);
  const [saveError,    setSaveError]    = useState<string | null>(null);

  // ── Consumer IP: full Director Console state ──────────────────────────────
  const [photoDirection,  setPhotoDirection]  = useState('full-spread');
  const [cameraFormat,    setCameraFormat]    = useState('Phase One 150MP · 80mm');
  const [modelArchetype,  setModelArchetype]  = useState('High Fashion');
  const [poseDirection,   setPoseDirection]   = useState('Auto');
  const [expression,      setExpression]      = useState('Auto');
  const [ageRange,        setAgeRange]        = useState('Prime Editorial (25–35)');
  const [shotType,        setShotType]        = useState('Full Body');
  const [atmosphere,      setAtmosphere]      = useState('Auto');
  const [styling,         setStyling]         = useState('Auto');
  const [gender,          setGender]          = useState('Female');
  const [strategy,        setStrategy]        = useState<'change' | 'keep'>('change');
  const [showCreativeProps, setShowCreativeProps] = useState(false);
  const [activePropId,      setActivePropId]      = useState<string | null>(null);
  // Creative-control mode: 'assisted' (Director composes briefs) | 'verbatim' (your text used as-is)
  const [promptMode,        setPromptMode]        = useState<'assisted' | 'verbatim'>('assisted');
  // Review & Refine composer — per-layer editor + assembled pre-forge preview
  const [showComposer,      setShowComposer]      = useState(false);
  const [composerLayers,    setComposerLayers]    = useState({ subject: '', scene: '', photography: '', atmosphere: '' });
  const [lightboxImage,     setLightboxImage]     = useState<string | null>(null);
  const [isZipping,         setIsZipping]         = useState(false);

  // Generation state
  const [isForging,        setIsForging]        = useState(false);
  const [slots,            setSlots]            = useState<string[]>(Array(6).fill(''));

  // Persist the generated plates across a page refresh — they live only in memory
  // otherwise, so a reload was wiping the whole campaign. Restore on mount, save on change.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('luxaura:campaign');
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (Array.isArray(saved?.slots) && saved.slots.some(Boolean)) {
        setSlots(saved.slots);
        if (saved.campaignName) setCampaignName(saved.campaignName);
        if (saved.skuId && !currentSkuId) setCurrentSkuId(saved.skuId);
      }
    } catch { /* ignore corrupt cache */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      if (slots.some(Boolean)) {
        localStorage.setItem('luxaura:campaign', JSON.stringify({ skuId: currentSkuId, slots, campaignName }));
      }
    } catch { /* localStorage quota — skip persisting */ }
  }, [slots, currentSkuId, campaignName]);
  const [activeAgent,      setActiveAgent]      = useState<string | null>(null);
  const [completedAgents,  setCompletedAgents]  = useState<string[]>([]);
  const [progress,         setProgress]         = useState(0);
  const [forgeStatus,      setForgeStatus]      = useState('Pipeline Idle');
  const [showSaveModal,    setShowSaveModal]     = useState(false);
  const [refineSlot,       setRefineSlot]        = useState<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const applyVariant = (slotIndex: number, image: string) =>
    setSlots(prev => { const next = [...prev]; next[slotIndex] = image; return next; });

  const allComplete = slots.every(s => !!s);
  const anyComplete = slots.some(s => !!s);

  // ── Creative Props handler — applies full prop config ─────────────────────
  const handleCreativePropSelect = (prop: CreativeProp, sceneIndex = 0) => {
    setPhotoDirection(prop.config.photoDirection);
    if (!lockedParams.includes('lighting')) setLighting(prop.config.lighting);
    if (!lockedParams.includes('camera'))   setCamera(prop.config.camera);
    setCameraFormat(prop.config.cameraFormat);
    setColorGrade(prop.config.colorGrade);
    setPrompt(prop.config.userPrompts[sceneIndex] ?? prop.config.userPrompts[0]);
    if (prop.config.locationPreset) {
      setLocation(prop.config.locationPreset.id);
      setCustomBg(null);
    }
    setActivePropId(prop.id);
  };

  // Seed the editable layer stack from current selections, then open the
  // Review & Refine composer (per-layer editing + assembled pre-forge preview).
  function openComposer() {
    const subj = strategy === 'change'
      ? [gender, modelArchetype, ageRange].filter(v => v && v !== 'Auto').join(', ')
      : 'the same model — face preserved';
    setComposerLayers({
      subject: `${subj}${skinTone ? `${subj ? ', ' : ''}${skinTone} skin tone` : ''}`,
      scene: prompt || (location ? (LOCATION_PRESETS.find(p => p.id === location)?.label || '') : ''),
      photography: [lighting, camera, cameraFormat, colorGrade, shotType && shotType !== 'Auto' ? `${shotType} shot` : '']
        .filter(v => v && v !== 'Auto').join(' · '),
      atmosphere: atmosphere && atmosphere !== 'Auto' ? atmosphere : '',
    });
    setShowComposer(true);
  }

  const safeName = () => (activeSku?.name || 'campaign').replace(/[^a-z0-9]+/gi, '-').toLowerCase();

  // Remote Cloud Storage URLs have no CORS, so a direct blob-fetch is blocked. Route them
  // through the same-origin proxy, which streams them back with Content-Disposition so the
  // browser saves a real file. data-URLs download directly (no fetch, no CORS).
  const proxyUrl = (url: string, filename?: string) =>
    url.startsWith('data:')
      ? url
      : `/api/download?u=${encodeURIComponent(url)}${filename ? `&n=${encodeURIComponent(filename)}` : ''}`;

  // Download one plate.
  function downloadImage(url: string, filename: string) {
    const a = document.createElement('a');
    a.href = proxyUrl(url, filename);
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
  }

  // Bundle every completed plate into one ZIP.
  async function downloadAll() {
    const imgs = slots.filter(Boolean) as string[];
    if (!imgs.length || isZipping) return;
    setIsZipping(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      await Promise.all(imgs.map(async (url, i) => {
        const res = await fetch(proxyUrl(url));   // same-origin proxy → readable blob, no CORS
        if (!res.ok) throw new Error(`plate ${i + 1} fetch ${res.status}`);
        zip.file(`${safeName()}-plate-${i + 1}.jpg`, await res.blob());
      }));
      const blob = await zip.generateAsync({ type: 'blob' });
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href; a.download = `${safeName()}-campaign.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 2000);
    } catch {
      imgs.forEach((url, i) => downloadImage(url, `${safeName()}-plate-${i + 1}.jpg`)); // fallback: one-by-one
    } finally {
      setIsZipping(false);
    }
  }

  // Persist the generated plates to the Asset Vault (real save — was a fake navigate).
  async function handleSaveCampaign() {
    const imgs = slots.filter(Boolean) as string[];
    if (!imgs.length || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    const base = campaignName.trim() || `${activeSku?.name || 'Campaign'} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const date = new Date().toISOString();
    const sku = activeSku as { category?: string; anchorType?: string } | undefined;
    try {
      for (let i = 0; i < imgs.length; i++) {
        await deployToVault({
          id:          `${Date.now()}-${i}`,
          image:       imgs[i],
          storagePath: null,
          name:        `${base} · Plate ${i + 1}`,
          date,
          createdAt:   Date.now() + i,
          category:    sku?.category || 'campaign',
          anchors:     sku?.anchorType ? [sku.anchorType] : [],
          strategy,
          skinTone,
          lighting,
          camera,
          bg:          location || customBg || 'studio',
          prompt:      prompt || '',
          dna:         true,
        });
      }
      setShowSaveModal(false);
      navigate('/portal/vault');
    } catch (err) {
      setSaveError((err as Error)?.message || 'Save failed — please retry.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleForge(opts?: { prompt?: string }) {
    if (!canForge() || isForging || !activeSku) return;
    const effectivePrompt = (opts && typeof opts.prompt === 'string') ? opts.prompt : prompt;

    setIsForging(true);
    setSlots(Array(6).fill(''));
    setCompletedAgents([]);
    setActiveAgent('intent');
    setProgress(0);
    setForgeStatus('Agent 00: Classifying mission type...');

    const currentUser = user;
    if (!currentUser) { setIsForging(false); return; }

    try {
      const idToken = await currentUser.getIdToken();

      // Build the forge request body. Outfit mode (≥2 SKUs) sends skuIds[] and the
      // union of anchor types; single-SKU keeps the legacy skuId contract.
      const anchorUnion = Array.from(new Set(outfitSkus.map(s => s.anchorType)));
      const body = {
        skuId:    isOutfit ? undefined : activeSku.skuId,
        skuIds:   isOutfit ? outfitSkuIds : undefined,
        brandId:  brand?.brandId,
        config: {
          anchors:       isOutfit ? anchorUnion : [activeSku.anchorType],
          strategy,
          lighting,
          camera,
          colorGrade,
          skinTone,
          // Custom uploaded environment takes precedence over a preset location.
          locationPreset: customBg ? undefined : (location || undefined),
          background:     customBg ? 'custom-bg' : undefined,
          backgroundImage: customBg || undefined,
          userPrompt:    effectivePrompt || undefined,
          promptMode,
          gender:        gender.toLowerCase(),
          sourceImage:   activeSku.referenceImage || '',
          // ── Consumer IP fields ──────────────────────────────────────────
          photoDirection,
          cameraFormat,
          modelArchetype,
          pose:       poseDirection !== 'Auto' ? poseDirection : undefined,
          expression: expression !== 'Auto' ? expression : undefined,
          ageRange,
          shotType,
          atmosphere: atmosphere !== 'Auto' ? atmosphere : undefined,
          styling:    styling !== 'Auto' ? styling : undefined,
        },
      };

      const res = await fetch('/api/forge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(body),
      });

      if (!res.ok || !res.body) {
        setIsForging(false);
        setForgeStatus('Generation failed. Please try again.');
        return;
      }

      // Agent simulation based on timing
      const agentTimings: [string, number, string][] = [
        ['intent',   0,    'Agent 00: Intent classification complete'],
        ['dna',      8000, activeSku ? 'Agent 01: SKU DNA recall — Agent 01 bypassed' : 'Agent 01: Extracting DNA...'],
        ['director', 15000,'Agent 02: Generating 6 director briefs...'],
        ['auditor',  25000,'Agent 02.5: Cross-slot consistency audit...'],
        ['images',   35000,'Agent 03: Streaming editorial assets...'],
      ];

      agentTimings.forEach(([agent, delay, status]) => {
        setTimeout(() => {
          setActiveAgent(agent);
          setForgeStatus(status);
          setCompletedAgents(prev => {
            const idx = AGENTS.findIndex(a => a.id === agent);
            return AGENTS.slice(0, idx).map(a => a.id);
          });
          setProgress(Math.round((AGENTS.findIndex(a => a.id === agent) + 1) / AGENTS.length * 60));
        }, delay);
      });

      // Stream SSE
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'image' && typeof event.slot === 'number') {
              setSlots(prev => {
                const next = [...prev];
                next[event.slot] = event.image;
                return next;
              });
              setProgress(Math.round(60 + ((event.slot + 1) / 6) * 40));
              setForgeStatus(`Agent 03: Slot ${event.slot + 1} / 6 complete`);
              setCompletedAgents(['intent', 'dna', 'director', 'auditor']);
              setActiveAgent('images');
            } else if (event.type === 'done') {
              setCompletedAgents(['intent', 'dna', 'director', 'auditor', 'images']);
              setActiveAgent(null);
              setProgress(100);
              setForgeStatus('Forge complete — 6 editorial assets ready');
              setIsForging(false);
            } else if (event.type === 'error') {
              setForgeStatus(`Error: ${event.error}`);
              setIsForging(false);
            }
          } catch { /* malformed SSE line */ }
        }
      }

    } catch (err: any) {
      setForgeStatus(`Error: ${err.message}`);
      setIsForging(false);
    }
  }

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden font-sans bg-canvas text-primary">

      {/* ── LEFT: Control panel — frosted material chrome ─────────────────── */}
      <aside className="w-[400px] shrink-0 border-r border-hairline flex flex-col overflow-y-auto scrollbar-none"
        style={{ background: 'var(--material-panel)', backdropFilter: 'var(--material-blur-lg)', WebkitBackdropFilter: 'var(--material-blur-lg)' }}>

        <div className="p-8 flex flex-col gap-10">
          <div className="flex flex-col gap-1 border-b border-white/10 pb-6">
            <h3 className="font-serif text-xl font-light text-white tracking-tight">Production</h3>
            <p className="text-xs text-white/40 tracking-wide font-light">Configure your editorial direction</p>
          </div>

          {/* SKU Selector — Outfit Composition */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-tertiary">
                1. Garment SKU{outfitSkus.length === 1 ? '' : 's'}
              </p>
              <div className="flex items-center gap-3">
                {isOutfit && (
                  <span className="text-[9px] font-semibold tracking-widest uppercase text-white bg-white/10 px-2 py-1 rounded-full">
                    {outfitSkus.length} Combined
                  </span>
                )}
                {outfitSkus.length > 0 && (
                  <button onClick={clearOutfit}
                    className="text-[10px] font-semibold text-tertiary hover:text-white transition-colors uppercase tracking-widest">
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Selected garments */}
            {outfitSkus.length > 0 && (
              <div className="flex flex-col gap-2">
                {outfitSkus.map((sku, i) => (
                  <div key={sku.skuId} className="flex items-center gap-3 p-2.5 rounded-xl bg-overlay border border-white/5">
                    <div className="w-10 h-12 rounded-lg bg-black border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {sku.referenceImage
                        ? <img src={sku.referenceImage} className="w-full h-full object-cover" />
                        : <FolderLock size={14} className="text-tertiary" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-white truncate">{sku.name}</p>
                      <p className="text-[10px] font-medium text-tertiary mt-1 uppercase tracking-wider">
                        {ANCHOR_LABEL[sku.anchorType] || sku.anchorType}
                        {i === 0 && isOutfit ? ' · Primary' : ''}
                      </p>
                    </div>
                    <button onClick={() => removeSku(sku.skuId)}
                      className="text-tertiary hover:text-red-400 transition-colors flex-shrink-0 p-2 hover:bg-white/5 rounded-full">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add-garment button + picker */}
            {readySkus.length === 0 ? (
              <div className="p-5 text-center rounded-xl bg-overlay border border-white/5">
                <p className="text-[12px] font-medium text-tertiary">No enrolled SKUs</p>
                <button onClick={() => navigate('/portal/skus/enroll')}
                  className="mt-2 text-[12px] font-medium text-white hover:text-white/80 transition-colors underline">
                  Enroll a SKU
                </button>
              </div>
            ) : (
              <>
                {readySkus.some(s => !outfitSkuIds.includes(s.skuId)) && (
                  <button onClick={() => setSkuPickerOpen(o => !o)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[12px] font-semibold transition-all"
                    style={{
                      background: skuPickerOpen ? 'white' : 'var(--surface-overlay)',
                      color: skuPickerOpen ? 'black' : 'white',
                    }}>
                    <Plus size={14} strokeWidth={2.5} /> {outfitSkus.length === 0 ? 'Select Garment' : 'Add Garment'}
                  </button>
                )}
                <AnimatePresence>
                  {skuPickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-1 rounded-xl bg-overlay border border-white/5">
                      <div className="max-h-56 overflow-y-auto">
                        {readySkus.filter(s => !outfitSkuIds.includes(s.skuId)).map(sku => (
                          <button key={sku.skuId}
                            onClick={() => { addSku(sku.skuId); setSkuPickerOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0">
                            <Shirt size={14} className="text-white/40 flex-shrink-0" />
                            <span className="text-[13px] font-medium text-white truncate flex-1">{sku.name}</span>
                            <span className="text-[10px] font-semibold text-tertiary tracking-wider uppercase flex-shrink-0">
                              {ANCHOR_LABEL[sku.anchorType] || sku.anchorType}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {isOutfit && (
                  <p className="text-[11px] font-medium text-tertiary mt-1 leading-relaxed">
                    {outfitSkus.length} garments will be composed into one coordinated look — each held to its frozen DNA.
                  </p>
                )}
              </>
            )}
          </div>

          {/* ── Model Casting ─────────────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-tertiary mb-3">2. Model Casting</p>
            <div className="flex flex-col gap-4">
              {/* Strategy Toggle */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                {STRATEGY_OPTIONS.map(opt => {
                  const active = strategy === opt.id;
                  return (
                    <button key={opt.id} onClick={() => setStrategy(opt.id as 'change'|'keep')}
                      className={`flex flex-col gap-1 p-3 rounded-xl text-left transition-all border ${
                        active ? 'bg-gold border-gold text-on-accent' : 'bg-overlay border-white/5 hover:border-white/20 hover:bg-raised-2'
                      }`}>
                      <span className={`text-[11px] font-semibold leading-tight ${active ? 'text-black' : 'text-white'}`}>
                        {opt.label}
                      </span>
                      <span className={`text-[9px] font-medium leading-tight ${active ? 'text-black/60' : 'text-tertiary'}`}>{opt.sub}</span>
                    </button>
                  );
                })}
              </div>

              {strategy === 'change' && (
                <>
                  <ConfigSelect label="Gender" value={gender}
                    options={GENDER_OPTIONS} onChange={setGender} />
                  <ConfigSelect label="Model Archetype" value={modelArchetype}
                    options={MODEL_ARCHETYPE_OPTIONS} onChange={setModelArchetype} />
                  <ConfigSelect label="Age Range" value={ageRange}
                    options={AGE_RANGE_OPTIONS} onChange={setAgeRange} />
                </>
              )}
            </div>
          </div>

          {/* ── Skin Tone ─────────────────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-tertiary mb-3">3. Skin Tone</p>
            <div className="grid grid-cols-4 gap-2">
              {SKIN_TONES.map(tone => {
                const active = skinTone === tone.id;
                return (
                  <button key={tone.id} onClick={() => setSkinTone(tone.id)}
                    className={`flex flex-col items-center justify-center gap-2 p-2 rounded-xl transition-all border ${
                      active ? 'bg-white/10' : 'bg-transparent border-transparent hover:bg-white/5'
                    }`}
                    style={{ borderColor: active ? tone.hex : 'transparent' }}>
                    <div className="w-8 h-8 rounded-full border border-white/10 flex-shrink-0"
                      style={{
                        background: tone.hex,
                        boxShadow: active ? `0 0 12px ${tone.hex}80` : 'none',
                      }} />
                    <span className="text-[9px] font-medium text-center leading-tight text-white/70">
                      {tone.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Shoot Direction ────────────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-tertiary mb-3">4. Shoot Direction</p>
            <div className="flex flex-col gap-4">
              <ConfigSelect label="Expression" value={expression}
                options={EXPRESSION_OPTIONS} onChange={setExpression} />
              <ConfigSelect label="Pose Direction" value={poseDirection}
                options={POSE_OPTIONS} onChange={setPoseDirection} />
              <ConfigSelect label="Shot Type" value={shotType}
                options={SHOT_TYPE_OPTIONS} onChange={setShotType} />
              <ConfigSelect label="Atmosphere" value={atmosphere}
                options={ATMOSPHERE_OPTIONS} onChange={setAtmosphere} />
            </div>
          </div>

          {/* ── Scene (curated props + location, consolidated) ─────────── */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-tertiary mb-3">5. Scene</p>

            {/* Primary: a curated scene — sets the location, look, and its variations */}
            <button
              onClick={() => setShowCreativeProps(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-semibold tracking-widest uppercase transition-all"
              style={{
                background: activePropId ? 'white' : 'var(--surface-overlay)',
                color: activePropId ? 'black' : 'white',
              }}>
              <Sparkles size={14} />
              {activePropId ? activePropId.replace(/-/g, ' ') : 'Browse Scenes'}
            </button>
            {activePropId && (
              <button onClick={() => setActivePropId(null)}
                className="w-full text-center text-[10px] font-semibold text-tertiary hover:text-white mt-3 uppercase tracking-widest transition-colors">
                Clear Scene
              </button>
            )}

            <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-white/20 text-center my-3">— or upload your own environment —</p>

            {/* Custom environment upload — your own location; clears any active scene when set */}
            <input
              ref={customBgInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async e => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                try {
                  const compressed = await compressImage(file);
                  setCustomBg(compressed);
                  setLocation('');           // mutually exclusive with a preset
                  setActivePropId(null);     // and with a curated scene
                } catch { /* ignore unreadable image */ }
              }}
            />
            {customBg ? (
              <div className="flex items-center gap-3 p-3 mt-3 rounded-xl bg-overlay border border-white/5">
                <img src={customBg} className="w-12 h-10 object-cover rounded-lg flex-shrink-0 border border-white/10" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-white truncate">Custom environment</p>
                  <p className="text-[9px] font-medium text-tertiary tracking-wider uppercase mt-1">Scene recreated from upload</p>
                </div>
                <button onClick={() => setCustomBg(null)}
                  className="text-tertiary hover:text-red-400 transition-colors p-2 flex-shrink-0 hover:bg-white/5 rounded-full">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => customBgInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 mt-3 rounded-xl text-[10px] font-semibold tracking-widest uppercase text-tertiary hover:text-white transition-all bg-overlay hover:bg-raised-2 border border-dashed border-white/10 hover:border-white/20">
                <Upload size={14} /> Upload Custom Environment
              </button>
            )}

          </div>

          {/* ── Photography Preset (optional) ──────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-tertiary">6. Photography Preset</p>
              {selectedPreset && (
                <button onClick={() => { setSelectedPreset(null); }}
                  className="text-[10px] font-semibold text-tertiary hover:text-white transition-colors uppercase tracking-widest">
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-2 px-2 scrollbar-none snap-x">
              {PHOTOGRAPHY_PRESETS.map(preset => {
                const active = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedPreset(preset.id);
                      if (!lockedParams.includes('lighting')) setLighting(preset.lighting);
                      if (!lockedParams.includes('camera'))   setCamera(preset.camera);
                    }}
                    className={`flex-shrink-0 flex flex-col gap-2 p-3 rounded-xl text-left transition-all snap-start border ${
                      active ? 'bg-gold border-gold text-on-accent' : 'bg-overlay border-white/5 hover:border-white/20 hover:bg-raised-2'
                    }`}
                    style={{ width: 130 }}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className={`text-[12px] font-semibold leading-tight ${active ? 'text-black' : 'text-white'}`}>
                        {preset.name}
                      </span>
                      {active && <Check size={14} className="text-black" />}
                    </div>
                    <span className={`text-[9px] font-semibold tracking-wider uppercase px-2 py-1 rounded-full leading-none ${
                      active ? 'bg-black/10 text-black' : 'bg-black/40 text-tertiary'
                    }`}>
                      {preset.tag}
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedPreset && (() => {
              const p = PHOTOGRAPHY_PRESETS.find(x => x.id === selectedPreset);
              return p ? (
                <p className="text-[12px] text-tertiary mt-2 font-medium">{p.vibe}</p>
              ) : null;
            })()}
          </div>

          {/* ── Editorial Direction (optional) ─────────────────────────── */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-tertiary mb-3">7. Editorial Direction</p>
            <div className="grid grid-cols-2 gap-2">
              {PHOTO_STYLE_OPTIONS.map(style => {
                const active = photoDirection === style.id;
                return (
                  <button key={style.id} onClick={() => setPhotoDirection(style.id)}
                    className={`flex flex-col gap-1 p-3 rounded-xl text-left transition-all border ${
                      active ? 'bg-gold border-gold text-on-accent' : 'bg-overlay border-white/5 hover:border-white/20 hover:bg-raised-2'
                    }`}>
                    <span className={`text-[11px] font-semibold leading-tight ${active ? 'text-black' : 'text-white'}`}>
                      {style.name}
                    </span>
                    <span className={`text-[9px] font-medium leading-tight ${active ? 'text-black/60' : 'text-tertiary'}`}>{style.pub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Lighting & Camera (optional) ───────────────────────────── */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-tertiary">8. Lighting &amp; Camera</p>
              {lockedParams.length > 0 && (
                <span className="text-[9px] font-semibold text-white bg-white/10 px-2 py-1 rounded-full tracking-widest uppercase">
                  Brand Kit Active
                </span>
              )}
            </div>

            <ConfigSelect label="Lighting" value={lighting}
              locked={lockedParams.includes('lighting')}
              options={LIGHTING_OPTIONS} onChange={setLighting} />

            <ConfigSelect label="Camera / Focal Length" value={camera}
              locked={lockedParams.includes('camera')}
              options={CAMERA_OPTIONS} onChange={setCamera} />

            <ConfigSelect label="Color Grade / Film Stock" value={colorGrade}
              locked={lockedParams.includes('colorGrade')}
              options={COLOR_GRADE_OPTIONS} onChange={setColorGrade} />

            <ConfigSelect label="Camera Format / Optics" value={cameraFormat}
              options={CAMERA_FORMAT_OPTIONS} onChange={setCameraFormat} />

            <ConfigSelect label="Styling" value={styling}
              options={STYLING_OPTIONS} onChange={setStyling} />
          </div>

          {/* ── Creative Direction ────────────────────────────── */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-tertiary mb-3">9. Creative Direction</p>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={promptMode === 'verbatim' ? 'Your exact scene — sent to the model as written…' : 'Additional creative direction…'}
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-[12px] font-medium text-white placeholder-[#86868B] outline-none resize-none bg-overlay border border-white/5 focus:border-white/20 transition-colors"
            />

            {/* Creative control mode — Assisted vs Verbatim */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {([
                { id: 'assisted' as const, label: 'Assisted', sub: 'AI directs 6 briefs' },
                { id: 'verbatim' as const, label: 'Verbatim', sub: 'Your text, as-is ×6' },
              ]).map(({ id, label, sub }) => {
                const active = promptMode === id;
                return (
                  <button key={id} onClick={() => setPromptMode(id)}
                    className={`flex flex-col gap-0.5 p-2.5 rounded-xl text-left transition-all border ${active ? 'bg-gold border-gold text-on-accent' : 'bg-overlay border-white/5 hover:border-white/20 hover:bg-raised-2'}`}>
                    <span className={`text-[11px] font-semibold leading-tight ${active ? 'text-on-accent' : 'text-white'}`}>{label}</span>
                    <span className={`text-[9px] font-medium leading-tight ${active ? 'text-on-accent' : 'text-tertiary'}`}>{sub}</span>
                  </button>
                );
              })}
            </div>

            {/* Locked-DNA assurance — consistency is never sacrificed for control */}
            {activeSku && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--gold-wash)', border: '1px solid var(--hairline-gold)' }}>
                <Lock size={10} className="text-gold flex-shrink-0" />
                <span className="text-[9px] font-mono tracking-[0.1em] uppercase text-gold">
                  {isOutfit ? 'Outfit DNA locked' : 'Garment DNA locked'}{promptMode === 'verbatim' ? ' — only your scene text changes' : ''}
                </span>
              </div>
            )}
          </div>

          {/* ── Output Mode ───────────────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-tertiary mb-3">10. Output</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { mode: 'still' as const, label: '6 Stills', sub: '3 credits' },
                { mode: 'video' as const, label: 'Motion',   sub: '18 credits' },
              ] as const).map(({ mode, label, sub }) => (
                <button key={mode} onClick={() => setOutputMode(mode)}
                  className={`flex flex-col items-center py-3 rounded-xl transition-all text-center border ${
                    outputMode === mode ? 'bg-gold border-gold text-on-accent' : 'bg-overlay border-white/5 hover:border-white/20 hover:bg-raised-2'
                  }`}>
                  <span className={`text-[12px] font-semibold ${outputMode === mode ? 'text-black' : 'text-white'}`}>
                    {label}
                  </span>
                  <span className={`text-[9px] font-medium mt-1 ${outputMode === mode ? 'text-black/60' : 'text-tertiary'}`}>{sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Forge button */}
        <div className="p-6 mt-auto border-t border-white/5">
          <button
            onClick={handleForge}
            disabled={isForging || !activeSku || !canForge()}
            className="group relative w-full flex items-center justify-center gap-3 py-4 rounded-xl font-display italic text-[15px] text-on-accent overflow-hidden transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{ background: 'linear-gradient(180deg,var(--gold-bright) 0%,var(--gold) 55%,var(--gold-deep) 100%)', boxShadow: '0 8px 28px var(--gold-glow)' }}
          >
            <span aria-hidden className="pointer-events-none absolute top-0 -left-1/3 h-full w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-[left] duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:left-[130%]" style={{ transform: 'skewX(-20deg)' }} />
            {isForging
              ? <><RefreshCw size={16} className="animate-spin" /> Forging…</>
              : <><Play size={16} fill="currentColor" /> Engage the Forge</>
            }
          </button>
          <button
            onClick={openComposer}
            disabled={!activeSku || !canForge()}
            className="w-full mt-3 py-2.5 rounded-xl border border-hairline text-secondary hover:text-primary hover:border-hairline-strong transition-all font-mono text-[10px] tracking-[0.2em] uppercase disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Review &amp; Refine →
          </button>
          {!canForgeRole ? (
            <p className="text-[10px] font-semibold text-amber-500/80 text-center mt-3 tracking-widest uppercase">
              Your role (Social) is export-only — forging is disabled
            </p>
          ) : !activeSku && (
            <p className="text-[10px] font-semibold text-tertiary text-center mt-3 tracking-widest uppercase">
              Select a SKU to continue
            </p>
          )}
        </div>
      </aside>

      {/* ── CENTER: Forge stage ─────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden bg-canvas">

        {/* Editorial masthead */}
        <div className="px-8 pt-7 pb-5 border-b border-hairline shrink-0">
          <div className="flex items-end justify-between gap-6">
            <div className="min-w-0">
              <p className="font-mono text-[10px] tracking-[0.34em] uppercase text-gold mb-2">
                {isOutfit ? `Outfit · ${outfitSkus.length} Garments` : activeSku ? 'Campaign · DNA Locked' : 'Campaign'}
              </p>
              <h1 className="font-display italic font-medium text-[40px] leading-none tracking-[-0.02em] text-primary truncate">
                {campaignName || activeSku?.name || 'Untitled Campaign'}
              </h1>
            </div>
            {activeSku && (
              <Badge tone={allComplete ? 'success' : 'gold'} dot>
                {allComplete ? '6 of 6 Plates' : `${slots.filter(s => !!s).length} of 6 Plates`}
              </Badge>
            )}
          </div>
        </div>

        {/* Pipeline status bar */}
        <div className="px-8 pt-6 pb-4 border-b border-white/5 bg-black">
          <AgentStrip activeAgent={activeAgent} completedAgents={completedAgents} />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-white/50 tracking-widest uppercase">{forgeStatus}</span>
            <span className="text-[10px] font-semibold text-white/40">{progress}%</span>
          </div>
          <div className="w-full h-1 bg-overlay rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* 6-slot grid — cinematic */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* Atmospheric radial glow behind grid */}
          <div className="relative h-full flex flex-col">
            {isForging && (
              <div className="absolute inset-0 pointer-events-none z-0"
                style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 65%)' }} />
            )}
            <div className="relative z-10 grid grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ForgeSlot
                  key={i}
                  index={i}
                  image={slots[i] || ''}
                  isGenerating={isForging}
                  isComplete={!!slots[i]}
                  onRefine={canForgeRole ? setRefineSlot : undefined}
                  onEnlarge={setLightboxImage}
                  onExport={(img, idx) => downloadImage(img, `${safeName()}-plate-${idx + 1}.jpg`)}
                />
              ))}
            </div>

            {/* Post-generation actions */}
            {allComplete && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex items-center justify-center gap-4"
              >
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="group relative flex items-center gap-2 px-6 py-3 rounded-xl text-on-accent text-[11px] font-mono tracking-[0.2em] uppercase overflow-hidden transition-all hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(180deg,var(--gold-bright),var(--gold) 60%,var(--gold-deep))', boxShadow: '0 8px 28px var(--gold-glow)' }}
                >
                  <span aria-hidden className="pointer-events-none absolute top-0 -left-1/3 h-full w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-[left] duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:left-[130%]" style={{ transform: 'skewX(-20deg)' }} />
                  <Save size={14} /> Save as Campaign
                </button>
                <button
                  onClick={downloadAll}
                  disabled={isZipping}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-overlay border border-white/5 text-white/70 hover:text-white text-[11px] font-semibold tracking-widest uppercase transition-all disabled:opacity-50">
                  <Download size={14} /> {isZipping ? 'Zipping…' : 'Download All'}
                </button>
                <button
                  onClick={handleForge}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-overlay border border-white/5 text-white/70 hover:text-white text-[11px] font-semibold tracking-widest uppercase transition-all"
                >
                  <RefreshCw size={14} /> Regenerate
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* ── RIGHT: Session context ──────────────────────────────────────── */}
      <aside className="w-[320px] shrink-0 border-l border-white/5 flex flex-col overflow-y-auto p-6 gap-8 bg-black scrollbar-none">

        <p className="text-[11px] font-semibold tracking-widest uppercase text-white/40">Session Context</p>

        {/* Active SKU / outfit summary */}
        {activeSku && (
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-overlay border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] font-semibold text-white tracking-widest uppercase">
                {isOutfit ? 'Outfit DNA Recall' : 'DNA Recall Active'}
              </span>
            </div>
            {isOutfit ? (
              <div className="flex flex-col gap-2">
                {outfitSkus.map(s => (
                  <div key={s.skuId} className="flex items-center justify-between gap-3">
                    <span className="text-[12px] font-medium text-white truncate">{s.name}</span>
                    <span className="text-[9px] font-semibold text-tertiary tracking-wider uppercase flex-shrink-0">
                      {ANCHOR_LABEL[s.anchorType] || s.anchorType}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p className="text-[13px] font-medium text-white">{activeSku.name}</p>
                {activeSku.fidelityScore != null && (
                  <p className="text-[11px] font-medium text-tertiary">{activeSku.fidelityScore}% Pattern Fidelity</p>
                )}
              </>
            )}
            <p className="text-[10px] font-medium text-emerald-400 mt-1">Agent 01 + 01b bypassed</p>
          </div>
        )}

        {/* Config summary */}
        <div className="flex flex-col gap-4">
          {[
            ['Strategy',      strategy === 'change' ? 'AI Reimagine' : 'Preserve Face'],
            ['Direction',     photoDirection === 'full-spread' ? 'Full Spread' : PHOTO_STYLE_OPTIONS.find(s => s.id === photoDirection)?.name || photoDirection],
            ['Lighting',      lighting],
            ['Camera',        camera],
            ['Optics',        cameraFormat],
            ['Color Grade',   colorGrade],
            ['Archetype',     modelArchetype],
            ['Shot Type',     shotType],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-[9px] font-semibold tracking-widest uppercase text-tertiary">{label}</span>
              <span className="text-[12px] font-medium text-white truncate">{value}</span>
            </div>
          ))}
        </div>

        {/* Quota */}
        <div className="border-t border-white/5 pt-6">
          <span className="text-[9px] font-semibold tracking-widest uppercase text-tertiary">Brand Quota</span>
          <p className="text-[12px] font-medium text-white mt-2">
            {(brand?.usage.currentPeriodImages || 0).toLocaleString()} / {(brand?.quota.imagesPerMonth || 0).toLocaleString()} images
          </p>
        </div>

        {/* Recent with this SKU */}
        {activeSku && campaigns.filter(c => c.skuId === activeSku.skuId).length > 0 && (
          <div className="border-t border-white/5 pt-6">
            <span className="text-[9px] font-semibold tracking-widest uppercase text-tertiary mb-3 block">
              Previous Campaigns
            </span>
            <div className="flex flex-col gap-2">
              {campaigns.filter(c => c.skuId === activeSku.skuId).slice(0, 3).map(c => (
                <div key={c.campaignId} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-8 h-10 rounded-md bg-overlay border border-white/5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-white/70 truncate">{c.name || 'Campaign'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ── Review & Refine composer ─────────────────────────────────────── */}
      <AnimatePresence>
        {showComposer && (() => {
          const L = composerLayers;
          const composed = [
            L.scene.trim(),
            L.subject.trim()     ? `Subject: ${L.subject.trim()}.`         : '',
            L.photography.trim() ? `Photography: ${L.photography.trim()}.` : '',
            L.atmosphere.trim()  ? `Atmosphere: ${L.atmosphere.trim()}.`   : '',
          ].filter(Boolean).join('\n\n');
          const setLayer = (k: 'subject' | 'scene' | 'photography' | 'atmosphere', v: string) =>
            setComposerLayers(prev => ({ ...prev, [k]: v }));
          const field = (label: string, k: 'subject' | 'scene' | 'photography' | 'atmosphere', rows: number, hint?: string) => (
            <div>
              <label className="block font-mono text-[9px] tracking-[0.24em] uppercase text-tertiary mb-1.5">{label}{hint ? <span className="text-quaternary normal-case tracking-normal"> · {hint}</span> : null}</label>
              <textarea value={L[k]} onChange={e => setLayer(k, e.target.value)} rows={rows}
                className="w-full px-3.5 py-2.5 rounded-xl bg-inset border border-hairline text-primary font-sans font-light text-[12px] outline-none resize-none hover:border-hairline-strong focus:border-hairline-gold focus:ring-[3px] focus:ring-gold-wash transition-all ease-[cubic-bezier(.16,1,.3,1)]" />
            </div>
          );
          return (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowComposer(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 240, damping: 28 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[88vh] overflow-y-auto scrollbar-none rounded-2xl flex flex-col"
                style={{ background: 'var(--surface-raised)', border: '1px solid var(--hairline)', boxShadow: 'var(--shadow-xl)' }}
              >
                <div className="flex items-start justify-between p-6 border-b border-hairline sticky top-0 z-10" style={{ background: 'var(--surface-raised)' }}>
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-gold mb-1">Review &amp; Refine</p>
                    <h3 className="font-display italic text-2xl text-primary leading-none">Compose Your Plates</h3>
                    <p className="font-mono text-[8px] tracking-[0.2em] uppercase text-tertiary mt-1.5">Edit any layer — the garment DNA stays locked</p>
                  </div>
                  <button onClick={() => setShowComposer(false)} className="text-tertiary hover:text-primary p-1.5 rounded-lg hover:bg-overlay transition-all"><X size={16} /></button>
                </div>

                <div className="p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--gold-wash)', border: '1px solid var(--hairline-gold)' }}>
                    <Lock size={13} className="text-gold flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-mono text-[8px] tracking-[0.3em] uppercase text-gold">Garment DNA · Locked</p>
                      <p className="text-[12px] font-light text-secondary truncate">{isOutfit ? `${outfitSkus.length} garments — frozen` : (activeSku?.name || '—')}</p>
                    </div>
                  </div>

                  {field('Subject', 'subject', 2)}
                  {field('Scene', 'scene', 5, 'the main creative lever')}
                  {field('Photography', 'photography', 2)}
                  {field('Atmosphere', 'atmosphere', 1)}

                  <div>
                    <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-quaternary mb-2">Assembled Prompt — what each plate receives</p>
                    <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-secondary font-serif p-4 rounded-xl" style={{ background: 'var(--surface-sunken)', border: '1px solid var(--hairline)' }}>{composed || 'Add a scene to begin…'}</pre>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {([{ id: 'assisted', label: 'Assisted', sub: 'AI refines into 6 briefs' }, { id: 'verbatim', label: 'Verbatim', sub: 'Sent exactly as above' }] as const).map(({ id, label, sub }) => {
                      const active = promptMode === id;
                      return (
                        <button key={id} onClick={() => setPromptMode(id)} className={`flex flex-col gap-0.5 p-2.5 rounded-xl text-left transition-all border ${active ? 'bg-gold border-gold text-on-accent' : 'bg-overlay border-white/5 hover:border-white/20'}`}>
                          <span className={`text-[11px] font-semibold leading-tight ${active ? 'text-on-accent' : 'text-white'}`}>{label}</span>
                          <span className={`text-[9px] leading-tight ${active ? 'text-on-accent' : 'text-tertiary'}`}>{sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-6 border-t border-hairline sticky bottom-0" style={{ background: 'var(--surface-raised)' }}>
                  <button
                    onClick={() => { setShowComposer(false); setPrompt(L.scene); handleForge({ prompt: composed }); }}
                    disabled={!activeSku || !canForge() || !composed}
                    className="w-full py-3.5 rounded-xl font-display italic text-[15px] text-on-accent transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    style={{ background: 'linear-gradient(180deg,var(--gold-bright) 0%,var(--gold) 55%,var(--gold-deep) 100%)', boxShadow: '0 8px 28px var(--gold-glow)' }}
                  >
                    Forge 6 Plates · {promptMode === 'verbatim' ? 'Verbatim' : 'Assisted'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── Save modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowSaveModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded p-6 flex flex-col gap-5"
              style={{ background: '#0F0F14', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h3 className="font-serif italic text-xl text-white">Save Campaign</h3>
              <input
                value={campaignName}
                onChange={e => setCampaignName(e.target.value)}
                placeholder={`${activeSku?.name || 'Campaign'} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                className="px-3 py-2.5 rounded text-[11px] font-mono text-white/70 outline-none w-full"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}
                autoFocus
              />
              {saveError && <p className="text-[10px] font-mono text-rose-400">{saveError}</p>}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveCampaign}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded bg-[#C5A253] text-black text-[10px] font-mono tracking-[0.2em] uppercase font-semibold hover:bg-[#C9A84C] transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving…' : 'Save to Vault'}
                </button>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2.5 rounded border border-white/[0.08] text-white/40 text-[10px] font-mono uppercase transition-all hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Refine modal (per-slot iterative refinement) ────────────────── */}
      <AnimatePresence>
        {refineSlot !== null && slots[refineSlot] && (
          <RefineModal
            slotIndex={refineSlot}
            image={slots[refineSlot]}
            getToken={async () => {
              if (!user) throw new Error('Not signed in.');
              return user.getIdToken();
            }}
            onApply={applyVariant}
            onClose={() => setRefineSlot(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Creative Props Gallery modal ──────────────────────────────── */}
      {showCreativeProps && (
        <CreativePropsGallery
          onSelect={handleCreativePropSelect}
          onClose={() => setShowCreativeProps(false)}
        />
      )}

      {/* ── Lightbox — enlarge a plate ─────────────────────────────────── */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
            onClick={() => setLightboxImage(null)}
          >
            <motion.img
              key={lightboxImage}
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              src={lightboxImage}
              alt="Plate"
              onClick={e => e.stopPropagation()}
              className="max-h-[88vh] max-w-[90vw] object-contain rounded-lg"
              style={{ boxShadow: '0 20px 80px rgba(0,0,0,0.6)' }}
            />
            <div className="absolute top-6 right-6 flex items-center gap-3" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => downloadImage(lightboxImage, `${safeName()}-plate.jpg`)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-on-accent text-[10px] font-mono tracking-[0.2em] uppercase"
                style={{ background: 'linear-gradient(180deg,var(--gold-bright),var(--gold) 60%,var(--gold-deep))' }}>
                <Download size={14} /> Download
              </button>
              <button onClick={() => setLightboxImage(null)} className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"><X size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
