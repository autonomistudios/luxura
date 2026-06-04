import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, FolderLock, Layers, ChevronDown, Lock,
  Check, AlertTriangle, Play, Download, Save, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSovereignStore, type SkuDocument } from '../../store/useSovereignStore';
import { PHOTOGRAPHY_PRESETS } from '../../lib/photographyPresets';
import { LOCATION_PRESETS } from '../../lib/locationPresets';
import { ANCHOR_TYPES } from '../../lib/skuConstants';
import { MapPin, ChevronRight, Plus, X, Shirt, Wand2, Upload } from 'lucide-react';
import { CreativePropsGallery } from '../../components/CreativePropsGallery';
import type { CreativeProp } from '../../lib/creativeProps';

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
        const color  = done ? '#10B981' : active ? '#B8952A' : 'rgba(255,255,255,0.15)';
        return (
          <React.Fragment key={agent.id}>
            <div className="flex flex-col items-center gap-1">
              <div className="w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-300"
                style={{
                  borderColor: color,
                  background: done ? '#10B98120' : active ? '#B8952A20' : 'transparent',
                  boxShadow: active ? `0 0 8px #B8952A66` : 'none',
                }}>
                {done
                  ? <Check size={9} style={{ color: '#10B981' }} />
                  : active
                    ? <motion.div className="w-1.5 h-1.5 rounded-full bg-[#B8952A]"
                        animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                    : <div className="w-1 h-1 rounded-full bg-white/20" />
                }
              </div>
              <span className="text-[6px] font-mono tracking-[0.2em] uppercase" style={{ color }}>{agent.label}</span>
            </div>
            {i < AGENTS.length - 1 && (
              <div className="flex-1 h-px mx-1 mb-4"
                style={{ background: done ? '#10B98140' : 'rgba(255,255,255,0.06)' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Forge Slot ───────────────────────────────────────────────────────────────
function ForgeSlot({ image, index, isGenerating, isComplete, onRefine }: {
  image: string; index: number; isGenerating: boolean; isComplete: boolean;
  onRefine?: (index: number) => void;
}) {
  const isEmpty = !image && !isGenerating;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.06 }}
      className="relative aspect-[4/5] rounded overflow-hidden group"
      style={{
        background: 'linear-gradient(145deg, #111116 0%, #0D0D10 100%)',
        border: isComplete ? '1px solid rgba(184,149,42,0.25)' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isComplete ? '0 0 12px rgba(184,149,42,0.08)' : 'none',
      }}
    >
      {/* Empty portal */}
      {isEmpty && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-px h-8 bg-white/10 mb-2" />
          <span className="text-[7px] font-mono tracking-[0.3em] uppercase text-white/15">
            Slot {index + 1}
          </span>
        </div>
      )}

      {/* Generating — cinematic shimmer */}
      {isGenerating && !image && (
        <div className="absolute inset-0">
          {/* Radial atmospheric glow */}
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(circle at 50% 50%, rgba(184,149,42,0.08) 0%, transparent 70%)' }} />
          {/* Shimmer sweep */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(184,149,42,0.06) 50%, transparent 60%)' }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          />
          {/* Rotating ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-10 h-10 rounded-full border-t-2 border-r-2 border-[#B8952A]/40"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <span className="text-[7px] font-mono tracking-[0.3em] uppercase text-[#B8952A]/60">
              Streaming Slot {index + 1}...
            </span>
          </div>
        </div>
      )}

      {/* Complete — image with overlay */}
      {image && (
        <>
          <img src={image} alt={`Slot ${index + 1}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
            bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-3">
            <div className="flex justify-between items-start">
              <span className="text-[7px] font-mono text-white bg-black/60 border border-white/10 px-1.5 py-0.5 rounded">
                SLOT {index + 1}
              </span>
              <span className="text-[7px] font-mono text-[#B8952A] bg-[#B8952A]/10 border border-[#B8952A]/20 px-1.5 py-0.5 rounded">
                AUDITED
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {onRefine && (
                <button
                  onClick={() => onRefine(index)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-white/15 text-white/80 text-[8px] font-mono tracking-[0.2em] uppercase font-semibold rounded hover:border-[#B8952A]/60 hover:text-white transition-all bg-black/40">
                  <Wand2 size={9} /> Refine
                </button>
              )}
              <button className="flex-1 py-1.5 bg-[#B8952A] text-black text-[8px] font-mono tracking-[0.2em] uppercase font-semibold rounded hover:bg-[#C9A84C] transition-all">
                Export
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ─── Config Select ────────────────────────────────────────────────────────────
function ConfigSelect({ label, value, locked, options, onChange }: {
  label: string; value: string; locked?: boolean;
  options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[7px] font-mono tracking-[0.35em] uppercase text-white/25">{label}</span>
        {locked && <Lock size={9} className="text-[#B8952A]/60" />}
      </div>
      {locked ? (
        <div className="flex items-center gap-2 px-2.5 py-2 rounded"
          style={{ background: 'rgba(184,149,42,0.06)', border: '1px solid rgba(184,149,42,0.15)' }}>
          <span className="text-[10px] font-mono text-white/40 flex-1 truncate">{value}</span>
          <Lock size={9} className="text-[#B8952A]/40 flex-shrink-0" />
        </div>
      ) : (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="px-2.5 py-2 rounded text-[10px] font-mono text-white/60 outline-none appearance-none cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
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
                      background: iterationType === t.id ? 'rgba(184,149,42,0.10)' : 'rgba(255,255,255,0.02)',
                      border: iterationType === t.id ? '1px solid rgba(184,149,42,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    }}>
                    <span className="text-[9px] font-mono" style={{ color: iterationType === t.id ? '#D4AF37' : 'rgba(255,255,255,0.5)' }}>{t.label}</span>
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
              style={{ background: '#B8952A', boxShadow: isRefining ? 'none' : '0 0 18px rgba(184,149,42,0.3)' }}>
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
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#B8952A] text-black text-[8px] font-mono tracking-[0.2em] uppercase font-semibold rounded">
                          <Check size={10} /> Use This
                        </span>
                      </button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-[#B8952A]/40"
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
  const { skus, currentSkuId, setCurrentSkuId, currentGrid, setGridSlot, setCurrentGrid, campaigns } = useSovereignStore();
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

  // Generation state
  const [isForging,        setIsForging]        = useState(false);
  const [slots,            setSlots]            = useState<string[]>(Array(6).fill(''));
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

  async function handleForge() {
    if (!canForge() || isForging || !activeSku) return;

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
          userPrompt:    prompt || undefined,
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
    <div className="h-[calc(100vh-56px)] flex overflow-hidden">

      {/* ── LEFT: Config panel ──────────────────────────────────────────── */}
      <aside className="w-[260px] shrink-0 border-r border-white/[0.06] flex flex-col overflow-y-auto"
        style={{ background: 'linear-gradient(180deg, #080810 0%, #050507 100%)' }}>

        <div className="p-5 flex flex-col gap-5">
          <p className="text-[7px] font-mono tracking-[0.45em] uppercase text-white/25">
            Forge Configuration
          </p>

          {/* SKU Selector — Outfit Composition */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25">
                1. Outfit — Garment SKU{outfitSkus.length === 1 ? '' : 's'}
              </p>
              <div className="flex items-center gap-2">
                {isOutfit && (
                  <span className="text-[6px] font-mono tracking-[0.2em] uppercase text-[#B8952A] bg-[#B8952A]/10 border border-[#B8952A]/20 px-1.5 py-0.5 rounded">
                    {outfitSkus.length} Combined
                  </span>
                )}
                {outfitSkus.length > 0 && (
                  <button onClick={clearOutfit}
                    className="text-[7px] font-mono text-white/20 hover:text-white/50 transition-colors">
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Selected garments */}
            {outfitSkus.length > 0 && (
              <div className="flex flex-col gap-1.5 mb-2">
                {outfitSkus.map((sku, i) => (
                  <div key={sku.skuId} className="flex items-center gap-2.5 p-2 rounded"
                    style={{ background: 'rgba(184,149,42,0.07)', border: '1px solid rgba(184,149,42,0.18)' }}>
                    <div className="w-8 h-10 rounded bg-[#0B0B0E] border border-white/10 flex items-center justify-center flex-shrink-0">
                      {sku.referenceImage
                        ? <img src={sku.referenceImage} className="w-full h-full object-cover rounded" />
                        : <FolderLock size={11} className="text-white/20" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-medium text-white/80 truncate">{sku.name}</p>
                      <p className="text-[7px] font-mono text-[#B8952A]/60 mt-0.5 tracking-[0.15em] uppercase">
                        {ANCHOR_LABEL[sku.anchorType] || sku.anchorType}
                        {i === 0 && isOutfit ? ' · Primary' : ''}
                      </p>
                    </div>
                    <button onClick={() => removeSku(sku.skuId)}
                      className="text-white/20 hover:text-red-400/70 transition-colors flex-shrink-0 p-1">
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add-garment button + picker */}
            {readySkus.length === 0 ? (
              <div className="p-4 text-center rounded border border-white/[0.08]">
                <p className="text-[9px] font-mono text-white/20">No enrolled SKUs</p>
                <button onClick={() => navigate('/portal/skus/enroll')}
                  className="mt-2 text-[8px] font-mono text-[#B8952A] hover:text-[#D4AF37] transition-colors">
                  Enroll a SKU →
                </button>
              </div>
            ) : (
              <>
                {readySkus.some(s => !outfitSkuIds.includes(s.skuId)) && (
                  <button onClick={() => setSkuPickerOpen(o => !o)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded text-[9px] font-mono tracking-[0.2em] uppercase transition-all"
                    style={{
                      background: skuPickerOpen ? 'rgba(184,149,42,0.10)' : 'rgba(255,255,255,0.02)',
                      border: skuPickerOpen ? '1px solid rgba(184,149,42,0.3)' : '1px solid rgba(255,255,255,0.08)',
                      color: skuPickerOpen ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                    }}>
                    <Plus size={11} /> {outfitSkus.length === 0 ? 'Select Garment' : 'Add Garment to Outfit'}
                  </button>
                )}
                <AnimatePresence>
                  {skuPickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-1.5 rounded"
                      style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#060608' }}>
                      <div className="max-h-44 overflow-y-auto">
                        {readySkus.filter(s => !outfitSkuIds.includes(s.skuId)).map(sku => (
                          <button key={sku.skuId}
                            onClick={() => { addSku(sku.skuId); setSkuPickerOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/[0.03] transition-colors text-left border-b border-white/[0.04] last:border-0">
                            <Shirt size={11} className="text-[#B8952A]/60 flex-shrink-0" />
                            <span className="text-[10px] font-mono text-white/50 truncate flex-1">{sku.name}</span>
                            <span className="text-[6px] font-mono text-white/25 tracking-[0.15em] uppercase flex-shrink-0">
                              {ANCHOR_LABEL[sku.anchorType] || sku.anchorType}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {isOutfit && (
                  <p className="text-[7px] font-mono text-white/25 mt-1.5 italic leading-relaxed">
                    {outfitSkus.length} garments will be composed into one coordinated look — each held to its frozen DNA.
                  </p>
                )}
              </>
            )}
          </div>

          {/* ── Photography Presets ────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25">2. Photography Preset</p>
              {selectedPreset && (
                <button onClick={() => { setSelectedPreset(null); }}
                  className="text-[7px] font-mono text-white/20 hover:text-white/50 transition-colors">
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
              {PHOTOGRAPHY_PRESETS.map(preset => {
                const active = selectedPreset === preset.id;
                return (
                  <motion.button
                    key={preset.id}
                    onClick={() => {
                      setSelectedPreset(preset.id);
                      if (!lockedParams.includes('lighting')) setLighting(preset.lighting);
                      if (!lockedParams.includes('camera'))   setCamera(preset.camera);
                    }}
                    whileHover={{ y: -2 }}
                    className="flex-shrink-0 flex flex-col gap-1.5 p-2.5 rounded text-left transition-all"
                    style={{
                      width: 90,
                      background: active ? 'rgba(184,149,42,0.10)' : 'rgba(255,255,255,0.02)',
                      border: active ? '1px solid rgba(184,149,42,0.40)' : '1px solid rgba(255,255,255,0.07)',
                      boxShadow: active ? '0 0 12px rgba(184,149,42,0.12)' : 'none',
                    }}
                  >
                    <span className="text-[8px] font-mono leading-tight" style={{ color: active ? '#D4AF37' : 'rgba(255,255,255,0.55)' }}>
                      {preset.name}
                    </span>
                    <span className="text-[6px] font-mono tracking-[0.2em] uppercase px-1.5 py-0.5 rounded leading-none"
                      style={{
                        background: active ? 'rgba(184,149,42,0.15)' : 'rgba(255,255,255,0.05)',
                        color: active ? '#B8952A' : 'rgba(255,255,255,0.25)',
                      }}>
                      {preset.tag}
                    </span>
                    {active && <Check size={8} className="text-[#B8952A] mt-0.5" />}
                  </motion.button>
                );
              })}
            </div>
            {selectedPreset && (() => {
              const p = PHOTOGRAPHY_PRESETS.find(x => x.id === selectedPreset);
              return p ? (
                <p className="text-[7px] font-mono text-white/25 mt-1.5 italic">{p.vibe}</p>
              ) : null;
            })()}
          </div>

          {/* ── Editorial Direction ───────────────────────────────── */}
          <div>
            <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25 mb-2">3. Editorial Direction</p>
            <div className="grid grid-cols-2 gap-1.5">
              {PHOTO_STYLE_OPTIONS.map(style => {
                const active = photoDirection === style.id;
                return (
                  <button key={style.id} onClick={() => setPhotoDirection(style.id)}
                    className="flex flex-col gap-0.5 p-2 rounded text-left transition-all"
                    style={{
                      background: active ? 'rgba(184,149,42,0.10)' : 'rgba(255,255,255,0.02)',
                      border: active ? '1px solid rgba(184,149,42,0.35)' : '1px solid rgba(255,255,255,0.06)',
                    }}>
                    <span className="text-[8px] font-mono leading-tight" style={{ color: active ? '#D4AF37' : 'rgba(255,255,255,0.50)' }}>
                      {style.name}
                    </span>
                    <span className="text-[6px] font-mono text-white/20 leading-tight">{style.pub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Production ──────────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25">4. Production</p>
              {lockedParams.length > 0 && (
                <span className="text-[6px] font-mono text-[#B8952A]/60 bg-[#B8952A]/10 border border-[#B8952A]/20 px-1.5 py-0.5 rounded tracking-[0.2em] uppercase">
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

          {/* ── Model Casting ─────────────────────────────────────────── */}
          <div>
            <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25 mb-2">5. Model Casting</p>
            <div className="flex flex-col gap-3">
              {/* Strategy Toggle */}
              <div className="grid grid-cols-2 gap-1.5 mb-1">
                {STRATEGY_OPTIONS.map(opt => {
                  const active = strategy === opt.id;
                  return (
                    <button key={opt.id} onClick={() => setStrategy(opt.id as 'change'|'keep')}
                      className="flex flex-col gap-0.5 p-2 rounded text-left transition-all"
                      style={{
                        background: active ? 'rgba(184,149,42,0.10)' : 'rgba(255,255,255,0.02)',
                        border: active ? '1px solid rgba(184,149,42,0.35)' : '1px solid rgba(255,255,255,0.06)',
                      }}>
                      <span className="text-[8px] font-mono leading-tight" style={{ color: active ? '#D4AF37' : 'rgba(255,255,255,0.50)' }}>
                        {opt.label}
                      </span>
                      <span className="text-[6px] font-mono text-white/20 leading-tight">{opt.sub}</span>
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
            <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25 mb-2">6. Skin Tone</p>
            <div className="grid grid-cols-4 gap-1.5">
              {SKIN_TONES.map(tone => {
                const active = skinTone === tone.id;
                return (
                  <button key={tone.id} onClick={() => setSkinTone(tone.id)}
                    className="flex flex-col items-center gap-1 p-1.5 rounded transition-all"
                    style={{
                      border: active ? `1px solid ${tone.hex}60` : '1px solid rgba(255,255,255,0.06)',
                      background: active ? `${tone.hex}15` : 'transparent',
                    }}>
                    <div className="w-6 h-6 rounded-full border border-white/10 flex-shrink-0"
                      style={{
                        background: tone.hex,
                        boxShadow: active ? `0 0 8px ${tone.hex}80` : 'none',
                      }} />
                    <span className="text-[6px] font-mono text-center leading-tight"
                      style={{ color: active ? tone.hex : 'rgba(255,255,255,0.25)' }}>
                      {tone.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Shoot Direction ────────────────────────────────────────── */}
          <div>
            <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25 mb-2">7. Shoot Direction</p>
            <div className="flex flex-col gap-3">
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

          {/* ── Location / Background ─────────────────────────────────── */}
          <div>
            <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25 mb-2">8. Location</p>
            <button
              onClick={() => setLocationPickerOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded text-left transition-all"
              style={{
                background: location ? 'rgba(184,149,42,0.06)' : 'rgba(255,255,255,0.02)',
                border: location ? '1px solid rgba(184,149,42,0.25)' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <MapPin size={11} className={location ? 'text-[#B8952A]' : 'text-white/20'} />
              <span className="text-[10px] font-mono flex-1 truncate" style={{ color: location ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)' }}>
                {location
                  ? LOCATION_PRESETS.find(p => p.id === location)?.label || location
                  : 'Studio backdrop (default)'}
              </span>
              {location
                ? <button onClick={e => { e.stopPropagation(); setLocation(''); }} className="text-white/20 hover:text-white/60 text-[8px] font-mono">Clear</button>
                : <ChevronRight size={10} className="text-white/20" />
              }
            </button>

            {/* Custom environment upload — overrides preset when set */}
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
                } catch { /* ignore unreadable image */ }
              }}
            />
            {customBg ? (
              <div className="flex items-center gap-2.5 p-2 mt-2 rounded"
                style={{ background: 'rgba(184,149,42,0.07)', border: '1px solid rgba(184,149,42,0.18)' }}>
                <img src={customBg} className="w-10 h-8 object-cover rounded flex-shrink-0 border border-white/10" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-mono text-white/70 truncate">Custom environment</p>
                  <p className="text-[6px] font-mono text-[#B8952A]/60 tracking-[0.15em] uppercase mt-0.5">Scene recreated from upload</p>
                </div>
                <button onClick={() => setCustomBg(null)}
                  className="text-white/20 hover:text-red-400/70 transition-colors p-1 flex-shrink-0">
                  <X size={11} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => customBgInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-1.5 py-2 mt-2 rounded text-[9px] font-mono tracking-[0.2em] uppercase text-white/40 hover:text-white/70 transition-all"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.12)' }}>
                <Upload size={10} /> Upload Custom Environment
              </button>
            )}

            {/* Inline location browser */}
            <AnimatePresence>
              {locationPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 220 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-2 rounded"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#060608' }}
                >
                  <div className="p-2 border-b border-white/[0.06] flex items-center justify-between">
                    <span className="text-[7px] font-mono text-white/25 uppercase tracking-[0.3em]">
                      {LOCATION_PRESETS.length} locations
                    </span>
                    <button onClick={() => setLocationPickerOpen(false)}
                      className="text-[7px] font-mono text-white/20 hover:text-white/50 transition-colors">
                      Done
                    </button>
                  </div>
                  <div className="overflow-y-auto" style={{ height: 175 }}>
                    {/* Group by category */}
                    {['Urban', 'Nature', 'Interior', 'Industrial', 'Conceptual', 'Seasonal'].map(cat => {
                      const catPresets = LOCATION_PRESETS.filter(p => p.category === cat);
                      return (
                        <div key={cat}>
                          <div className="px-3 py-1.5 sticky top-0"
                            style={{ background: '#060608' }}>
                            <span className="text-[6px] font-mono tracking-[0.35em] uppercase text-[#B8952A]/50">{cat}</span>
                          </div>
                          {catPresets.map(preset => (
                            <button key={preset.id}
                              onClick={() => { setLocation(preset.id); setLocationPickerOpen(false); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.03] transition-colors"
                              style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                              <span className="text-[9px] font-mono truncate flex-1"
                                style={{ color: location === preset.id ? '#B8952A' : 'rgba(255,255,255,0.45)' }}>
                                {preset.label}
                              </span>
                              {location === preset.id && <Check size={9} className="text-[#B8952A] flex-shrink-0" />}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Scene Props ──────────────────────────────────── */}
          <div>
            <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25 mb-2">9. Scene Props</p>
            <button
              onClick={() => setShowCreativeProps(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded text-[9px] font-mono tracking-[0.2em] uppercase transition-all"
              style={{
                background: activePropId ? 'rgba(184,149,42,0.10)' : 'rgba(255,255,255,0.02)',
                border: activePropId ? '1px solid rgba(184,149,42,0.35)' : '1px solid rgba(255,255,255,0.08)',
                color: activePropId ? '#D4AF37' : 'rgba(255,255,255,0.4)',
              }}>
              <Sparkles size={11} />
              {activePropId ? activePropId.replace(/-/g, ' ') : 'Browse Scene Props'}
            </button>
            {activePropId && (
              <button onClick={() => setActivePropId(null)}
                className="w-full text-center text-[7px] font-mono text-white/20 hover:text-white/50 mt-1 transition-colors">
                Clear Prop
              </button>
            )}
          </div>

          {/* ── Creative Direction ────────────────────────────── */}
          <div>
            <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25 mb-2">10. Creative Direction</p>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Additional creative direction..."
              rows={3}
              className="w-full px-3 py-2.5 rounded text-[10px] font-mono text-white/60 placeholder-white/15 outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
            />
          </div>

          {/* ── Output Mode ───────────────────────────────────────────── */}
          <div>
            <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25 mb-2">11. Output</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { mode: 'still' as const, label: '6 Stills', sub: '3 credits' },
                { mode: 'video' as const, label: 'Motion',   sub: '18 credits' },
              ] as const).map(({ mode, label, sub }) => (
                <button key={mode} onClick={() => setOutputMode(mode)}
                  className="flex flex-col items-center py-2.5 rounded transition-all text-center"
                  style={{
                    background: outputMode === mode ? 'rgba(184,149,42,0.08)' : 'rgba(255,255,255,0.02)',
                    border: outputMode === mode ? '1px solid rgba(184,149,42,0.3)' : '1px solid rgba(255,255,255,0.07)',
                  }}>
                  <span className="text-[9px] font-mono" style={{ color: outputMode === mode ? '#B8952A' : 'rgba(255,255,255,0.4)' }}>
                    {label}
                  </span>
                  <span className="text-[7px] font-mono text-white/20 mt-0.5">{sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Forge button */}
        <div className="p-5 mt-auto border-t border-white/[0.06]">
          <button
            onClick={handleForge}
            disabled={isForging || !activeSku || !canForge()}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded font-serif italic text-black text-[14px] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: '#B8952A',
              boxShadow: isForging ? 'none' : '0 0 24px rgba(184,149,42,0.35)',
            }}
          >
            {isForging
              ? <><RefreshCw size={14} className="animate-spin" /> Forging...</>
              : <><Play size={14} fill="black" /> Engage Sovereign Forge</>
            }
          </button>
          {!canForgeRole ? (
            <p className="text-[7px] font-mono text-amber-500/60 text-center mt-2 tracking-[0.2em] uppercase">
              Your role (Social) is export-only — forging is disabled
            </p>
          ) : !activeSku && (
            <p className="text-[7px] font-mono text-white/20 text-center mt-2 tracking-[0.2em] uppercase">
              Select a SKU to continue
            </p>
          )}
        </div>
      </aside>

      {/* ── CENTER: Forge grid ──────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Pipeline status bar */}
        <div className="px-6 pt-5 pb-3 border-b border-white/[0.05]">
          <AgentStrip activeAgent={activeAgent} completedAgents={completedAgents} />
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[8px] font-mono text-white/30 tracking-[0.2em]">{forgeStatus}</span>
            <span className="text-[8px] font-mono text-white/20">{progress}%</span>
          </div>
          <div className="w-full h-px bg-white/[0.04] rounded overflow-hidden">
            <motion.div
              className="h-full bg-[#B8952A] rounded"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* 6-slot grid — cinematic */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Atmospheric radial glow behind grid */}
          <div className="relative">
            {isForging && (
              <div className="absolute inset-0 pointer-events-none z-0"
                style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(184,149,42,0.06) 0%, transparent 65%)' }} />
            )}
            <div className="relative z-10 grid grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ForgeSlot
                  key={i}
                  index={i}
                  image={slots[i] || ''}
                  isGenerating={isForging}
                  isComplete={!!slots[i]}
                  onRefine={canForgeRole ? setRefineSlot : undefined}
                />
              ))}
            </div>
          </div>

          {/* Post-generation actions */}
          {allComplete && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 flex items-center gap-3"
            >
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded bg-[#B8952A] text-black text-[9px] font-mono tracking-[0.2em] uppercase font-semibold hover:bg-[#C9A84C] transition-all"
                style={{ boxShadow: '0 0 16px rgba(184,149,42,0.25)' }}
              >
                <Save size={11} /> Save as Campaign
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded border border-white/[0.08] text-white/50 hover:text-white text-[9px] font-mono tracking-[0.2em] uppercase transition-all">
                <Download size={11} /> Download All
              </button>
              <button
                onClick={handleForge}
                className="flex items-center gap-2 px-4 py-2.5 rounded border border-white/[0.08] text-white/50 hover:text-white text-[9px] font-mono tracking-[0.2em] uppercase transition-all"
              >
                <RefreshCw size={11} /> Regenerate
              </button>
            </motion.div>
          )}
        </div>
      </main>

      {/* ── RIGHT: Session context ──────────────────────────────────────── */}
      <aside className="w-[220px] shrink-0 border-l border-white/[0.06] flex flex-col overflow-y-auto p-5 gap-5"
        style={{ background: 'linear-gradient(180deg, #080810 0%, #050507 100%)' }}>

        <p className="text-[7px] font-mono tracking-[0.45em] uppercase text-white/25">Session Context</p>

        {/* Active SKU / outfit summary */}
        {activeSku && (
          <div className="flex flex-col gap-2 p-3 rounded"
            style={{ background: 'rgba(184,149,42,0.06)', border: '1px solid rgba(184,149,42,0.15)' }}>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B8952A]" />
              <span className="text-[7px] font-mono text-[#B8952A] tracking-[0.3em] uppercase">
                {isOutfit ? 'Outfit DNA Recall' : 'DNA Recall Active'}
              </span>
            </div>
            {isOutfit ? (
              <div className="flex flex-col gap-1">
                {outfitSkus.map(s => (
                  <div key={s.skuId} className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-medium text-white/70 truncate">{s.name}</span>
                    <span className="text-[6px] font-mono text-[#B8952A]/60 tracking-[0.15em] uppercase flex-shrink-0">
                      {ANCHOR_LABEL[s.anchorType] || s.anchorType}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p className="text-[10px] font-medium text-white/70">{activeSku.name}</p>
                {activeSku.fidelityScore != null && (
                  <p className="text-[7px] font-mono text-white/25">{activeSku.fidelityScore}% Pattern Fidelity</p>
                )}
              </>
            )}
            <p className="text-[7px] font-mono text-emerald-500/70">Agent 01 + 01b bypassed</p>
          </div>
        )}

        {/* Config summary */}
        <div className="flex flex-col gap-2">
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
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[6px] font-mono tracking-[0.3em] uppercase text-white/20">{label}</span>
              <span className="text-[9px] font-mono text-white/40 truncate">{value}</span>
            </div>
          ))}
        </div>

        {/* Quota */}
        <div className="border-t border-white/[0.05] pt-4">
          <span className="text-[6px] font-mono tracking-[0.3em] uppercase text-white/20">Brand Quota</span>
          <p className="text-[9px] font-mono text-white/40 mt-1">
            {(brand?.usage.currentPeriodImages || 0).toLocaleString()} / {(brand?.quota.imagesPerMonth || 0).toLocaleString()} images
          </p>
        </div>

        {/* Recent with this SKU */}
        {activeSku && campaigns.filter(c => c.skuId === activeSku.skuId).length > 0 && (
          <div className="border-t border-white/[0.05] pt-4">
            <span className="text-[6px] font-mono tracking-[0.3em] uppercase text-white/20 mb-2 block">
              Previous Campaigns
            </span>
            {campaigns.filter(c => c.skuId === activeSku.skuId).slice(0, 3).map(c => (
              <div key={c.campaignId} className="flex items-center gap-2 py-1.5">
                <div className="w-6 h-7 rounded bg-[#0B0B0E] border border-white/[0.06] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[8px] font-mono text-white/30 truncate">{c.name || 'Campaign'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>

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
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowSaveModal(false); navigate('/portal/campaigns'); }}
                  className="flex-1 py-2.5 rounded bg-[#B8952A] text-black text-[10px] font-mono tracking-[0.2em] uppercase font-semibold hover:bg-[#C9A84C] transition-all"
                >
                  Save to Vault
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
    </div>
  );
}
