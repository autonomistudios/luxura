/**
 * AssetActionsDrawer
 * Shared Refine + Upscale panel. Renders inside any image modal.
 * Accepts the image (data URL or CDN URL) and fires onUpscaleReady when done.
 */
import { useState } from 'react';
import { auth } from '../lib/firebase';
import { Download, Sparkles, ArrowUpCircle } from 'lucide-react';

type DrawerTab = 'refine' | 'upscale';
type IterationType = 'composition_shift' | 'pose_variant' | 'feature_enhance';
type UpscaleMode = 'standard' | 'print';

const ITERATION_TYPES: { id: IterationType; label: string; hint: string }[] = [
  { id: 'feature_enhance',   label: 'Enhance Detail',  hint: 'Skin, fabric texture, accessory clarity' },
  { id: 'composition_shift', label: 'Reframe Shot',    hint: 'Crop, angle, spatial positioning' },
  { id: 'pose_variant',      label: 'Change Pose',     hint: 'Body language — identity & garment locked' },
];

const UPSCALE_MODES: {
  id: UpscaleMode; label: string; subtitle: string; credits: number; note: string;
}[] = [
  {
    id: 'standard',
    label: 'Detail 4×',
    subtitle: 'Real-ESRGAN',
    credits: 5,
    note: '~30 sec · Clean upscale, no artifacts',
  },
  {
    id: 'print',
    label: 'Print Master',
    subtitle: 'Clarity Upscaler',
    credits: 15,
    note: '~3 min · 300 DPI · AI-enhanced skin + fabric',
  },
];

interface AssetActionsDrawerProps {
  image: string;
  theme?: 'light' | 'dark';
}

export default function AssetActionsDrawer({ image, theme = 'light' }: AssetActionsDrawerProps) {
  const isDark = theme === 'dark';

  const txt     = isDark ? 'text-white'          : 'text-[#1A1A1A]';
  const txtMid  = isDark ? 'text-white/50'        : 'text-[#8A867D]';
  const txtMono = isDark ? 'text-white/20'        : 'text-[#B5B0A8]';
  const border  = isDark ? 'border-white/10'      : 'border-[#E5E0D8]';
  const bg      = isDark ? 'bg-[#111]'            : 'bg-[#FAF9F7]';
  const active  = isDark ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5'
                         : 'border-[#1A1A1A] bg-[#1A1A1A] text-white';
  const inactive = isDark ? `border-white/10 ${txtMid} hover:border-white/30 hover:text-white/70`
                           : `border-[#E5E0D8] ${txtMid} hover:border-[#1A1A1A] hover:text-[#1A1A1A]`;
  const ctaBorder = isDark ? 'border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10'
                           : 'border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white';
  const tabActive   = isDark ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-[#1A1A1A] text-[#1A1A1A]';
  const tabInactive = isDark ? `border-transparent ${txtMid} hover:text-white/60`
                              : `border-transparent ${txtMid} hover:text-[#1A1A1A]`;

  const [activeTab, setActiveTab] = useState<DrawerTab>('refine');

  // ── Refine state ──────────────────────────────────────────────────────────
  const [iterationType,    setIterationType]    = useState<IterationType>('feature_enhance');
  const [adjustmentPrompt, setAdjustmentPrompt] = useState('');
  const [refineResults,    setRefineResults]    = useState<(string | null)[]>([null, null, null]);
  const [refineRunning,    setRefineRunning]    = useState(false);
  const [refineError,      setRefineError]      = useState<string | null>(null);

  // ── Upscale state ─────────────────────────────────────────────────────────
  const [upscaleMode,    setUpscaleMode]    = useState<UpscaleMode>('standard');
  const [upscaleResult,  setUpscaleResult]  = useState<string | null>(null);
  const [upscaleRunning, setUpscaleRunning] = useState(false);
  const [upscaleError,   setUpscaleError]   = useState<string | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────
  async function getToken() {
    const u = auth.currentUser;
    if (!u) throw new Error('Sign in required.');
    return u.getIdToken();
  }

  // ── Refine handler ────────────────────────────────────────────────────────
  async function handleRefine() {
    if (!adjustmentPrompt.trim()) return;
    setRefineRunning(true);
    setRefineError(null);
    setRefineResults([null, null, null]);
    try {
      const idToken = await getToken();
      const response = await fetch('/api/forge-iterate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ masterImage: image, adjustmentPrompt, iterationType }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        if (response.status === 402) throw new Error('Insufficient credits — upgrade your plan.');
        throw new Error(err?.error || `Error ${response.status}`);
      }
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'image') {
              setRefineResults((prev) => { const n = [...prev]; n[event.slot] = event.image; return n; });
            } else if (event.type === 'error') {
              setRefineError(String(event.error) || 'Forge returned an error.');
              setRefineRunning(false);
              return;
            }
          } catch { /* skip SSE parse errors, not API errors */ }
        }
      }
    } catch (err: unknown) {
      setRefineError(err instanceof Error ? err.message : 'Refinement failed.');
    } finally {
      setRefineRunning(false);
    }
  }

  // ── Upscale handler ───────────────────────────────────────────────────────
  async function handleUpscale() {
    setUpscaleRunning(true);
    setUpscaleError(null);
    setUpscaleResult(null);
    try {
      const idToken = await getToken();
      const res = await fetch('/api/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ image, scale: 4, mode: upscaleMode }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) throw new Error('Insufficient credits — upgrade your plan.');
        throw new Error(data.error || `Error ${res.status}`);
      }
      setUpscaleResult(data.url);
    } catch (err: unknown) {
      setUpscaleError(err instanceof Error ? err.message : 'Upscale failed.');
    } finally {
      setUpscaleRunning(false);
    }
  }

  return (
    <div className={`w-full ${bg} border-t ${border}`} onClick={(e) => e.stopPropagation()}>

      {/* Tab Bar */}
      <div className={`flex border-b ${border}`}>
        {([
          { id: 'refine'  as DrawerTab, label: 'Refine',  Icon: Sparkles },
          { id: 'upscale' as DrawerTab, label: 'Upscale', Icon: ArrowUpCircle },
        ]).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-5 py-3 text-[8px] font-mono uppercase tracking-[0.3em] border-b-2 transition-all -mb-px cursor-pointer ${
              activeTab === id ? tabActive : tabInactive
            }`}
          >
            <Icon size={10} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Refine Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'refine' && (
        <div className="p-5 space-y-5">
          {/* Mode */}
          <div>
            <p className={`text-[8px] font-mono uppercase tracking-[0.4em] ${txtMono} mb-2`}>Refinement Mode</p>
            <div className="grid grid-cols-3 gap-2">
              {ITERATION_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setIterationType(t.id)}
                  className={`py-2 px-2 text-left border transition-all cursor-pointer ${
                    iterationType === t.id ? active : inactive
                  }`}
                >
                  <span className={`block text-[9px] font-mono uppercase tracking-wide leading-tight ${iterationType === t.id ? '' : txtMid}`}>{t.label}</span>
                  <span className="block text-[8px] opacity-50 mt-0.5 leading-tight">{t.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Directive */}
          <div>
            <p className={`text-[8px] font-mono uppercase tracking-[0.4em] ${txtMono} mb-2`}>Adjustment Directive</p>
            <textarea
              value={adjustmentPrompt}
              onChange={(e) => setAdjustmentPrompt(e.target.value)}
              placeholder={
                iterationType === 'composition_shift' ? 'e.g. Tighten to three-quarter crop, more negative space on right' :
                iterationType === 'pose_variant'      ? 'e.g. Model looks over left shoulder, slight lean into light' :
                                                        'e.g. Enhance fabric texture on bodice, deepen shadow definition'
              }
              rows={2}
              className={`w-full bg-transparent border ${border} ${txt} text-[10px] p-3 resize-none focus:outline-none placeholder:${txtMono} font-light`}
            />
          </div>

          <button
            onClick={handleRefine}
            disabled={refineRunning || !adjustmentPrompt.trim()}
            className={`w-full py-2.5 border text-[9px] font-mono uppercase tracking-[0.4em] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${ctaBorder}`}
          >
            {refineRunning ? 'Generating 3 variants...' : 'Refine  ·  2 credits'}
          </button>

          {refineError && <p className="text-[10px] text-red-500">{refineError}</p>}

          {(refineRunning || refineResults.some(Boolean)) && (
            <div>
              <p className={`text-[8px] font-mono uppercase tracking-[0.4em] ${txtMono} mb-2`}>Refined Variants</p>
              <div className="grid grid-cols-3 gap-2">
                {(['Faithful', 'Editorial', 'Cinematic'] as const).map((label, i) => (
                  <div key={i} className={`border ${border} overflow-hidden relative bg-black/5`}>
                    <div className="aspect-[3/4]">
                    {refineResults[i] ? (
                      <>
                        <img src={refineResults[i]!} className="w-full h-full object-cover" alt={label} />
                        <a
                          href={refineResults[i]!}
                          download={`${label.toLowerCase()}-${i+1}.jpg`}
                          className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] font-mono px-2 py-1 hover:bg-black transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >↓</a>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                        {refineRunning
                          ? <div className={`w-4 h-4 border ${isDark ? 'border-white/10 border-t-[#D4AF37]' : 'border-[#E5E0D8] border-t-[#1A1A1A]'} rounded-full animate-spin`} />
                          : <span className={`text-[9px] font-mono ${txtMono}`}>{i+1}</span>
                        }
                      </div>
                    )}
                    </div>
                    <div className={`px-2 py-1.5 border-t ${border}`}>
                      <span className={`text-[8px] font-mono uppercase tracking-wider ${refineResults[i] ? txt : txtMono}`}>{label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Upscale Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'upscale' && (
        <div className="p-5 space-y-5">
          <p className={`text-[8px] font-mono uppercase tracking-[0.4em] ${txtMono}`}>
            Select Upscale Mode
          </p>

          <div className="grid grid-cols-2 gap-3">
            {UPSCALE_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setUpscaleMode(m.id)}
                className={`text-left p-4 border transition-all cursor-pointer ${
                  upscaleMode === m.id ? active : inactive
                }`}
              >
                <span className={`block text-xs font-light ${upscaleMode === m.id ? '' : txt}`}>{m.label}</span>
                <span className={`block text-[8px] font-mono uppercase tracking-wider mt-0.5 ${upscaleMode === m.id ? 'opacity-70' : txtMono}`}>{m.subtitle}</span>
                <span className={`block text-[9px] mt-2 ${upscaleMode === m.id ? 'opacity-60' : txtMid}`}>{m.credits} credits</span>
                <span className={`block text-[8px] mt-0.5 leading-tight ${upscaleMode === m.id ? 'opacity-50' : txtMono}`}>{m.note}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleUpscale}
            disabled={upscaleRunning}
            className={`w-full py-2.5 border text-[9px] font-mono uppercase tracking-[0.4em] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${ctaBorder}`}
          >
            <ArrowUpCircle size={11} />
            {upscaleRunning
              ? `Processing ${upscaleMode === 'print' ? '— up to 3 min' : '— ~30 sec'}...`
              : `Upscale  ·  ${UPSCALE_MODES.find(m => m.id === upscaleMode)!.credits} credits`
            }
          </button>

          {upscaleError && <p className="text-[10px] text-red-500">{upscaleError}</p>}

          {upscaleResult && (
            <div className="space-y-3">
              <p className={`text-[8px] font-mono uppercase tracking-[0.4em] ${txtMono}`}>Upscaled Result</p>
              <img src={upscaleResult} alt="Upscaled" className={`w-full border ${border}`} />
              <a
                href={upscaleResult}
                target="_blank"
                rel="noreferrer"
                download="upscaled.png"
                className={`flex items-center justify-center gap-2 w-full py-2.5 border text-[9px] font-mono uppercase tracking-[0.4em] transition-all ${ctaBorder}`}
              >
                <Download size={11} />
                Download Full Resolution
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
