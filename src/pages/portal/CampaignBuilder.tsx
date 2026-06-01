import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, FolderLock, Layers, ChevronDown, Lock,
  Check, AlertTriangle, Play, Download, Save, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSovereignStore } from '../../store/useSovereignStore';
import { PHOTOGRAPHY_PRESETS } from '../../lib/photographyPresets';
import { LOCATION_PRESETS } from '../../lib/locationPresets';
import { MapPin, ChevronRight } from 'lucide-react';

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
function ForgeSlot({ image, index, isGenerating, isComplete }: {
  image: string; index: number; isGenerating: boolean; isComplete: boolean;
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
            <button className="w-full py-1.5 bg-[#B8952A] text-black text-[8px] font-mono tracking-[0.2em] uppercase font-semibold rounded hover:bg-[#C9A84C] transition-all">
              Export High-Res
            </button>
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CampaignBuilder() {
  const { brand, canForge, user } = useAuth();
  const { skus, currentSkuId, setCurrentSkuId, currentGrid, setGridSlot, setCurrentGrid, campaigns } = useSovereignStore();
  const navigate = useNavigate();

  const activeSku = skus.find(s => s.skuId === currentSkuId) || null;
  const lockedParams = brand?.brandKit?.lockedParams || [];

  // Config state
  const [lighting,   setLighting]   = useState(brand?.brandKit?.defaultLighting   || 'Clean & Even');
  const [camera,     setCamera]     = useState(brand?.brandKit?.defaultCamera      || 'Soft Background (85mm)');
  const [colorGrade,        setColorGrade]        = useState(brand?.brandKit?.defaultColorGrade  || 'Matte Fade Editorial');
  const [skinTone,          setSkinTone]          = useState('neutral');
  const [location,          setLocation]          = useState('');
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [selectedPreset,    setSelectedPreset]    = useState<string | null>(null);
  const [prompt,            setPrompt]            = useState('');
  const [outputMode,        setOutputMode]        = useState<'still' | 'video'>('still');
  const [campaignName, setCampaignName] = useState('');

  // Generation state
  const [isForging,        setIsForging]        = useState(false);
  const [slots,            setSlots]            = useState<string[]>(Array(6).fill(''));
  const [activeAgent,      setActiveAgent]      = useState<string | null>(null);
  const [completedAgents,  setCompletedAgents]  = useState<string[]>([]);
  const [progress,         setProgress]         = useState(0);
  const [forgeStatus,      setForgeStatus]      = useState('Pipeline Idle');
  const [showSaveModal,    setShowSaveModal]     = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const allComplete = slots.every(s => !!s);
  const anyComplete = slots.some(s => !!s);

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

      // Build the forge request body
      const body = {
        skuId:    activeSku.skuId,
        brandId:  brand?.brandId,
        config: {
          anchors:       [activeSku.anchorType],
          strategy:      'change',
          lighting,
          camera,
          colorGrade,
          skinTone,
          locationPreset: location || undefined,
          userPrompt:    prompt || undefined,
          gender:        'female',
          sourceImage:   activeSku.referenceImage || '',
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

          {/* SKU Selector */}
          <div>
            <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25 mb-2">1. Garment SKU</p>
            {activeSku ? (
              <div className="flex items-center gap-3 p-3 rounded"
                style={{ background: 'rgba(184,149,42,0.08)', border: '1px solid rgba(184,149,42,0.2)' }}>
                <div className="w-10 h-12 rounded bg-[#0B0B0E] border border-white/10 flex items-center justify-center flex-shrink-0">
                  {activeSku.referenceImage
                    ? <img src={activeSku.referenceImage} className="w-full h-full object-cover rounded" />
                    : <FolderLock size={12} className="text-white/20" />
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-white/80 truncate">{activeSku.name}</p>
                  <p className="text-[7px] font-mono text-[#B8952A]/60 mt-0.5">DNA LOCKED</p>
                  {activeSku.fidelityScore != null && (
                    <p className="text-[7px] font-mono text-white/25 mt-0.5">{activeSku.fidelityScore}% Fidelity</p>
                  )}
                </div>
                <button onClick={() => setCurrentSkuId(null)}
                  className="text-white/20 hover:text-white/60 text-[8px] font-mono transition-colors flex-shrink-0">
                  Change
                </button>
              </div>
            ) : (
              <div className="rounded border border-white/[0.08] overflow-hidden max-h-48 overflow-y-auto">
                {skus.filter(s => s.enrollmentStatus === 'ready').length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-[9px] font-mono text-white/20">No enrolled SKUs</p>
                    <button onClick={() => navigate('/portal/skus/enroll')}
                      className="mt-2 text-[8px] font-mono text-[#B8952A] hover:text-[#D4AF37] transition-colors">
                      Enroll a SKU →
                    </button>
                  </div>
                ) : skus.filter(s => s.enrollmentStatus === 'ready').map(sku => (
                  <button key={sku.skuId}
                    onClick={() => setCurrentSkuId(sku.skuId)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/[0.03] transition-colors text-left border-b border-white/[0.04] last:border-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B8952A] flex-shrink-0" />
                    <span className="text-[10px] font-mono text-white/50 truncate">{sku.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Photography Presets ──────────────────────────────────── */}
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

          {/* ── Individual overrides ──────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25">3. Fine Tune</p>
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
          </div>

          {/* ── Skin Tone ─────────────────────────────────────────────── */}
          <div>
            <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25 mb-2">4. Skin Tone</p>
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

          {/* ── Location / Background ─────────────────────────────────── */}
          <div>
            <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25 mb-2">5. Location</p>
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

          {/* ── Creative Direction ────────────────────────────────────── */}
          <div>
            <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25 mb-2">6. Creative Direction</p>
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
            <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25 mb-2">7. Output</p>
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
          {!activeSku && (
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

        {/* Active SKU summary */}
        {activeSku && (
          <div className="flex flex-col gap-2 p-3 rounded"
            style={{ background: 'rgba(184,149,42,0.06)', border: '1px solid rgba(184,149,42,0.15)' }}>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B8952A]" />
              <span className="text-[7px] font-mono text-[#B8952A] tracking-[0.3em] uppercase">DNA Recall Active</span>
            </div>
            <p className="text-[10px] font-medium text-white/70">{activeSku.name}</p>
            {activeSku.fidelityScore != null && (
              <p className="text-[7px] font-mono text-white/25">{activeSku.fidelityScore}% Pattern Fidelity</p>
            )}
            <p className="text-[7px] font-mono text-emerald-500/70">Agent 01 + 01b bypassed</p>
          </div>
        )}

        {/* Config summary */}
        <div className="flex flex-col gap-2">
          {[
            ['Lighting',    lighting],
            ['Camera',      camera],
            ['Color Grade', colorGrade],
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
    </div>
  );
}
