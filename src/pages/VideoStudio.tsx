import React, { useState, useRef, useEffect, Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Download, RotateCw, Zap, Play, Lock, ChevronRight, X, Camera, Sparkles, Palette, ChevronDown, Vault, CheckCircle, Loader } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';
import { useSovereignStore } from '../store/useSovereignStore';
import type { VaultItem } from '../store/useSovereignStore';

type GenState = 'idle' | 'starting' | 'processing' | 'complete' | 'error';
type PresetTab = 'camera' | 'effects' | 'filters';

const DURATION_OPTIONS = [
  { value: '4', label: '4s', desc: 'Quick cut' },
  { value: '6', label: '6s', desc: 'Editorial' },
  { value: '8', label: '8s', desc: 'Feature' },
];

const RATIO_OPTIONS = [
  { value: '9:16', label: '9:16', desc: 'Portrait · Reels' },
  { value: '16:9', label: '16:9', desc: 'Landscape · Film' },
];

const ENGINE_OPTIONS = [
  {
    value: 'standard',
    label: 'Veo 3.1',
    tag:   'STANDARD',
    desc:  'Highest quality · Native audio · 1080p',
  },
  {
    value: 'fast',
    label: 'Veo 3.1',
    tag:   'FAST',
    desc:  'Speed optimized · Native audio · 1080p',
  },
];

const PROCESSING_PHASES = [
  'Initializing Veo 3.1 engine',
  'Analyzing source DNA',
  'Composing cinematic motion',
  'Synthesizing native audio',
  'Rendering frames 1–24',
  'Rendering frames 25–72',
  'Applying editorial grade',
  'Finalizing 1080p output',
];

// ── Cinema Presets ────────────────────────────────────────────────────────────

interface CinemaPreset {
  id:    string;
  label: string;
  tag?:  string;
  prompt: string;
}

const CAMERA_MOVES: CinemaPreset[] = [
  { id: 'slow-push',     label: 'Slow Push In',     tag: 'DRAMATIC',  prompt: 'ultra-slow dolly push in, shallow depth of field, subject sharpens as frame compresses, cinematic tension' },
  { id: 'orbital',      label: 'Orbital Arc',       tag: 'FASHION',   prompt: '360° orbital camera arc around subject, smooth fluid motion, editorial fashion cinematography' },
  { id: 'crane-rise',   label: 'Crane Rise',        tag: 'EPIC',      prompt: 'majestic crane shot rising from ground level to aerial view, reveals grand environment, cinematic sweep' },
  { id: 'parallax',     label: 'Parallax Float',    tag: 'LUXURY',    prompt: 'subtle parallax floating motion, foreground elements drift gently, dreamy cinematic depth' },
  { id: 'whip-pan',    label: 'Whip Pan Cut',       tag: 'DYNAMIC',   prompt: 'whip pan transition with motion blur, high energy editorial cut, fashion week pacing' },
  { id: 'handheld',     label: 'Handheld Authentic', tag: 'RAW',      prompt: 'authentic handheld camera, slight organic sway, documentary intimacy, gritty realism' },
  { id: 'tracking',     label: 'Tracking Walk',     tag: 'EDITORIAL', prompt: 'smooth lateral tracking shot following subject walking, runway presence, editorial confidence' },
  { id: 'dutch-tilt',   label: 'Dutch Tilt',        tag: 'AVANT',     prompt: 'Dutch angle tilt, avant-garde composition, high-fashion editorial tension' },
  { id: 'extreme-close', label: 'Extreme Close-Up', tag: 'DETAIL',    prompt: 'extreme close-up macro shots of texture details, fabric weave, skin, jewelry — slow pan across surfaces' },
  { id: 'reverse-zoom', label: 'Reverse Dolly Zoom', tag: 'ICONIC',   prompt: 'Hitchcock dolly-zoom effect, background expands as subject stays locked, surreal cinematic impact' },
];

const SPECIAL_EFFECTS: CinemaPreset[] = [
  { id: 'god-rays',     label: 'God Rays',          tag: 'DIVINE',    prompt: 'volumetric god rays piercing through atmosphere, divine light shafts, heavy ethereal haze' },
  { id: 'lens-flare',   label: 'Anamorphic Flares', tag: 'CINEMA',   prompt: 'JJ Abrams-style anamorphic lens flares, horizontal blue streak bokeh, premium cinematic look' },
  { id: 'particle-dust', label: 'Particle Dust',    tag: 'MAGIC',     prompt: 'golden dust particles floating through frame, bokeh orbs drifting, ethereal fairytale atmosphere' },
  { id: 'smoke',        label: 'Atmospheric Haze',  tag: 'MOODY',     prompt: 'thick atmospheric haze and smoke, mysterious low-lying fog, cinematic noir ambiance' },
  { id: 'neon-rain',    label: 'Neon Rain',         tag: 'CYBERPUNK', prompt: 'heavy rainfall with neon reflections on wet pavement, cyberpunk city glow, rain-soaked cinematic drama' },
  { id: 'light-leak',   label: 'Light Leak',        tag: 'ANALOG',    prompt: 'vintage analog film light leaks, warm orange and red washes bleeding into frame edges, retro film feel' },
  { id: 'holographic',  label: 'Holographic Shift', tag: 'FUTURISM',  prompt: 'holographic iridescent overlays shimmering across frame, spectral color separation, futuristic luxury' },
  { id: 'mirror',       label: 'Mirror Symmetry',   tag: 'ARTHAUS',   prompt: 'perfect bilateral mirror symmetry throughout shot, Kubrickian geometric precision, hypnotic editorial' },
  { id: 'glitch',       label: 'Digital Glitch',    tag: 'DISTORT',   prompt: 'deliberate digital glitch artifacts, chromatic aberration pulses, VHS scan lines, artistic corruption' },
  { id: 'freeze-frame', label: 'Freeze & Flow',     tag: 'CONTRAST',  prompt: 'freeze-frame stutter effect alternating with fluid slow motion, rhythmic editorial punctuation' },
];

const CINEMATIC_FILTERS: CinemaPreset[] = [
  { id: 'golden-hour',  label: 'Golden Hour',       tag: 'WARM',      prompt: 'golden hour magic hour lighting, warm amber and amber-rose tones, long shadows, luxurious warmth' },
  { id: 'blue-steel',   label: 'Blue Steel',        tag: 'COLD',      prompt: 'desaturated steel-blue color grade, cold shadows, clinical precision, high-fashion editorial look' },
  { id: 'velvet-black', label: 'Velvet Black',      tag: 'NOIR',      prompt: 'deep crushed blacks, velvety shadows, selective highlights, luxury noir color grading, 2.39:1 crop' },
  { id: 'vintage-35mm', label: 'Vintage 35mm',      tag: 'FILM',      prompt: 'authentic 35mm film grain, Kodak Portra warmth, slight fade in shadows, nostalgic analog texture' },
  { id: 'teal-orange',  label: 'Teal & Orange',     tag: 'BLOCKBUSTER', prompt: 'Hollywood teal and orange complementary color grade, skin tones warm, shadows pushed teal, cinematic blockbuster look' },
  { id: 'bleach',       label: 'Bleach Bypass',     tag: 'GRITTY',    prompt: 'bleach bypass process, desaturated with retained contrast, silver-halide texture, brutal editorial grade' },
  { id: 'infrared',     label: 'Infrared Dream',    tag: 'SURREAL',   prompt: 'infrared photography simulation, foliage glows white, skin luminous, sky deep purple, dreamlike surrealism' },
  { id: 's-log',        label: 'S-Log Flat',        tag: 'NATURAL',   prompt: 'flat S-Log color profile, natural neutral tones, documentary authenticity, zero contrast grade' },
  { id: 'duotone',      label: 'Duotone Wash',      tag: 'ARTISAN',   prompt: 'dramatic duotone wash, two-color palette dominates entire scene, graphic editorial boldness' },
  { id: 'lux-gold',     label: 'LuxAura Gold',      tag: 'SIGNATURE', prompt: 'LuxAura signature grade: rich amber shadows, creamy highlights, subtle vignette, eternal luxury editorial' },
];

// ── Vault Picker Modal ────────────────────────────────────────────────────────

function VaultPicker({
  assets,
  loading,
  onSelect,
  onClose,
}: {
  assets:    VaultItem[];
  loading:   boolean;
  onSelect:  (item: VaultItem) => void;
  onClose:   () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-12"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.96, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 24 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-5xl bg-[#050505] border border-white/10 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Lock size={9} className="text-[#C5A253]/60" />
              <p className="text-[8px] font-mono uppercase tracking-[0.6em] text-[#C5A253]/60">
                Vault — Authorized Source Images
              </p>
            </div>
            <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
              Select a masterpiece to bring to life
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/20 hover:text-white transition-colors p-2"
          >
            <X size={16} />
          </button>
        </div>

        {/* Grid */}
        <div className="overflow-y-auto p-8 flex-1">
          {loading && (
            <div className="flex items-center justify-center py-24">
              <p className="text-[9px] font-mono uppercase tracking-[0.8em] text-white/20 animate-pulse">
                Loading vault…
              </p>
            </div>
          )}

          {!loading && assets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
              <div className="w-12 h-[1px] bg-[#C5A253]/20" />
              <p className="text-[9px] font-mono uppercase tracking-[0.6em] text-white/20">
                Your vault is empty
              </p>
              <p className="text-[8px] font-mono text-white/12 max-w-xs leading-relaxed">
                Generate images in the Atelier, deploy your best work to the Vault, then return here to animate them.
              </p>
              <Link
                to="/"
                onClick={onClose}
                className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.4em] text-[#C5A253]/60 hover:text-[#C5A253] transition-colors border border-[#C5A253]/20 hover:border-[#C5A253]/40 px-5 py-3"
              >
                Go to Atelier
                <ChevronRight size={11} />
              </Link>
              <div className="w-12 h-[1px] bg-[#C5A253]/20" />
            </div>
          )}

          {!loading && assets.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {assets.map((item) => (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSelect(item)}
                  className="group relative aspect-[3/4] border border-white/8 hover:border-[#C5A253]/50 transition-all duration-500 overflow-hidden cursor-pointer"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-[1.5s] scale-105 group-hover:scale-100"
                  />
                  {/* Corner marks on hover */}
                  <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[#C5A253]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-[#C5A253]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-[#C5A253]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[#C5A253]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                    <p className="text-[7px] font-mono text-[#C5A253] uppercase tracking-widest truncate">{item.name}</p>
                    <p className="text-[6px] font-mono text-white/40 uppercase tracking-widest">{item.date}</p>
                  </div>

                  {/* Select overlay */}
                  <div className="absolute inset-0 bg-[#C5A253]/0 group-hover:bg-[#C5A253]/5 transition-colors duration-500" />
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="px-8 py-4 border-t border-white/5 shrink-0">
          <p className="text-[7px] font-mono text-white/15 uppercase tracking-[0.4em]">
            ◆ Only images deployed to your Vault can be animated — this ensures quality and continuity across your work
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Error Boundary ───────────────────────────────────────────────────────────

class VideoStudioErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[VideoStudio] Render error:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6 px-8 text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.6em] text-red-400">[ Cinema Studio Error ]</p>
          <p className="text-sm font-mono text-white/30 max-w-xl leading-relaxed">{this.state.error.message}</p>
          <p className="text-[8px] font-mono text-white/15 max-w-xl">{this.state.error.stack?.split('\n').slice(0,3).join(' | ')}</p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            className="px-8 py-3 border border-[#C5A253]/30 text-[#C5A253]/70 text-[9px] font-mono uppercase tracking-[0.4em] hover:bg-[#C5A253]/10 transition-all"
          >
            [ Reload ]
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Main Component ────────────────────────────────────────────────────────────

function VideoStudio() {
  const { profile, deductVideoCredits, isAdmin } = useAuth();
  const { vaultAssets, vaultLoading } = useSovereignStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [showVaultPicker,   setShowVaultPicker]   = useState(false);
  const [selectedVaultItem, setSelectedVaultItem] = useState<VaultItem | null>(null);
  const [sourceImage,       setSourceImage]       = useState<string | null>(null); // URL or base64 data URL

  // Accept a pre-loaded image passed via router state from MasterpieceReveal ("Animate This").
  // The image is a data URL — compress it to match the vault-loaded path.
  useEffect(() => {
    const state = location.state as { sourceImage?: string } | null;
    if (state?.sourceImage) {
      compressImage(state.sourceImage).then((compressed) => {
        setSourceImage(compressed);
        setSelectedVaultItem(null);
      }).catch(() => {
        setSourceImage(state.sourceImage!);
      });
      // Clear the router state so a back-navigation doesn't re-trigger
      window.history.replaceState({}, '', location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [prompt,           setPrompt]           = useState('');
  const [duration,         setDuration]         = useState('6');
  const [aspectRatio,      setAspectRatio]       = useState('9:16');
  const [engineModel,      setEngineModel]       = useState('standard');
  const [genState,         setGenState]         = useState<GenState>('idle');
  const [videoUrl,         setVideoUrl]         = useState<string | null>(null);
  const [error,            setError]            = useState<string | null>(null);
  const [pollProgress,     setPollProgress]     = useState(0);
  const [phaseIndex,       setPhaseIndex]       = useState(0);
  const [showPresets,      setShowPresets]      = useState(false);
  const [presetTab,        setPresetTab]        = useState<PresetTab>('camera');
  const [activeCamera,     setActiveCamera]     = useState<string | null>(null);
  const [activeEffect,     setActiveEffect]     = useState<string | null>(null);
  const [activeFilter,     setActiveFilter]     = useState<string | null>(null);
  const [vaultSaveState,   setVaultSaveState]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [vaultSaveError,   setVaultSaveError]   = useState<string | null>(null);

  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build composite preset prompt segment
  const buildPresetPrompt = () => {
    const parts: string[] = [];
    if (activeCamera) {
      const p = CAMERA_MOVES.find((c) => c.id === activeCamera);
      if (p) parts.push(p.prompt);
    }
    if (activeEffect) {
      const p = SPECIAL_EFFECTS.find((e) => e.id === activeEffect);
      if (p) parts.push(p.prompt);
    }
    if (activeFilter) {
      const p = CINEMATIC_FILTERS.find((f) => f.id === activeFilter);
      if (p) parts.push(p.prompt);
    }
    return parts.join(', ');
  };

  const applyPreset = (tab: PresetTab, id: string) => {
    if (tab === 'camera') setActiveCamera((prev) => prev === id ? null : id);
    if (tab === 'effects') setActiveEffect((prev) => prev === id ? null : id);
    if (tab === 'filters') setActiveFilter((prev) => prev === id ? null : id);
  };

  const presetPromptSegment = buildPresetPrompt();

  const videoCredits = profile?.videoCredits ?? 0;

  // ── Image helpers ─────────────────────────────────────────────────────────────

  // compressImage: used only for router-state images passed from MasterpieceReveal (data URLs)
  const compressImage = (base64: string): Promise<string> => new Promise((resolve) => {
    const img = new Image();
    img.src   = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      const maxDim = 1024;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round((height / width) * maxDim); width = maxDim; }
        else                { width  = Math.round((width  / height) * maxDim); height = maxDim; }
      }
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
  });

  // loadVaultImage: store the Firebase Storage URL directly.
  // The server (video-start.js) downloads it server-side — no browser CORS involved.
  const loadVaultImage = (item: VaultItem) => {
    setSelectedVaultItem(item);
    setShowVaultPicker(false);
    setError(null);
    // Pass the URL as-is; the <img> tag in the UI will display it fine,
    // and the API endpoint will fetch it from the server.
    setSourceImage(item.image);
  };


  // ── Polling ──────────────────────────────────────────────────────────────────

  const startPolling = (operationName: string) => {
    let elapsed      = 0;
    const maxWait    = 360000;
    const interval   = 8000;

    setPollProgress(5);
    setPhaseIndex(0);
    setGenState('processing');

    phaseRef.current = setInterval(() => {
      setPhaseIndex((prev) => Math.min(prev + 1, PROCESSING_PHASES.length - 1));
    }, 45000 / PROCESSING_PHASES.length);

    pollRef.current = setInterval(async () => {
      elapsed += interval;
      setPollProgress((prev) => Math.min(90, prev + (85 / (maxWait / interval))));

      try {
        // Refresh token on every poll — polling can run for up to 6 minutes
        const pollToken = await auth.currentUser?.getIdToken();
        const res  = await fetch(`/api/video-status?operationName=${encodeURIComponent(operationName)}`, {
          headers: { 'Authorization': `Bearer ${pollToken ?? ''}` },
        });
        const data = await res.json();

        if (data.status === 'complete') {
          clearInterval(pollRef.current!);
          clearInterval(phaseRef.current!);
          setPollProgress(100);
          setVideoUrl(data.videoUri);
          setGenState('complete');
          return;
        }

        if (data.error) {
          clearInterval(pollRef.current!);
          clearInterval(phaseRef.current!);
          setError(data.error);
          setGenState('error');
          return;
        }

        if (elapsed >= maxWait) {
          clearInterval(pollRef.current!);
          clearInterval(phaseRef.current!);
          setError('Generation timed out after 6 minutes. Please try again.');
          setGenState('error');
        }
      } catch {
        clearInterval(pollRef.current!);
        clearInterval(phaseRef.current!);
        setError('Connection lost during generation. Please retry.');
        setGenState('error');
      }
    }, interval);
  };

  // ── Generate ─────────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (genState !== 'idle' && genState !== 'error') return;
    if (!sourceImage) {
      setError('Select an image from your Vault to continue.');
      return;
    }

    const presetSuffix = buildPresetPrompt();
    const basePrompt   = prompt.trim() ||
      'Cinematic editorial fashion video — elegant model in motion, luxury aesthetic, soft golden lighting, slow walk, haute couture';
    const finalPrompt  = presetSuffix ? `${basePrompt}, ${presetSuffix}` : basePrompt;

    const ok = await deductVideoCredits(1);
    if (!ok) {
      setError('No video credits remaining. Upgrade to Sovereign or Luminary to generate videos.');
      return;
    }

    setGenState('starting');
    setError(null);
    setVideoUrl(null);
    setPollProgress(0);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/video-start', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${idToken ?? ''}`,
        },
        body:    JSON.stringify({ prompt: finalPrompt, sourceImage, aspectRatio, durationSeconds: duration, model: engineModel }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || data.detail || 'Failed to start generation');
      startPolling(data.operationName);
    } catch (err: any) {
      setError(err.message);
      setGenState('error');
    }
  };

  const handleReset = () => {
    if (pollRef.current)  clearInterval(pollRef.current);
    if (phaseRef.current) clearInterval(phaseRef.current);
    setGenState('idle');
    setVideoUrl(null);
    setError(null);
    setPollProgress(0);
    setPhaseIndex(0);
    setSelectedVaultItem(null);
    setSourceImage(null);
    setVaultSaveState('idle');
    setVaultSaveError(null);
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const a      = document.createElement('a');
    a.href       = videoUrl;
    a.download   = `luxaura-cinema-${Date.now()}.mp4`;
    a.click();
  };

  const handleSaveToVideoVault = async () => {
    if (!videoUrl || vaultSaveState === 'saving' || vaultSaveState === 'saved') return;
    setVaultSaveState('saving');
    setVaultSaveError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/video-vault-save', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${idToken ?? ''}`,
        },
        body: JSON.stringify({
          proxyUrl:    videoUrl,
          title:       `Cinema · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
          prompt:      prompt.trim() || 'Cinematic editorial fashion video',
          aspectRatio,
          duration,
          model:       engineModel,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to save to vault');
      setVaultSaveState('saved');
    } catch (err: any) {
      setVaultSaveError(err.message);
      setVaultSaveState('error');
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-8">

        {/* ── Header ── */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <Film size={13} className="text-[#C5A253]" />
            <span className="text-[8px] font-mono uppercase tracking-[0.6em] text-[#C5A253]/60">
              LuxAura — Cinema Studio · Powered by Google Veo 3.1
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif text-white tracking-tighter leading-tight mb-4">
            Your Work,<br />
            <span className="text-[#C5A253] italic">In Motion.</span>
          </h1>
          <div className="flex items-center gap-3 mt-4">
            <Zap size={9} style={{ color: '#C5A253' }} />
            <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.4em]">
              {isAdmin ? '∞ video credits' : `${videoCredits} video credit${videoCredits !== 1 ? 's' : ''} remaining${videoCredits === 0 ? ' — Upgrade to generate videos' : ''}`}
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── SETUP ── */}
          {(genState === 'idle' || genState === 'starting') && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16"
            >
              {/* Left: Vault Image Selector */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-white/25">
                    Step 1 — Source from Vault
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Lock size={8} className="text-[#C5A253]/40" />
                    <span className="text-[7px] font-mono uppercase tracking-[0.3em] text-[#C5A253]/40">
                      Vault Only
                    </span>
                  </div>
                </div>

                {/* Selector panel */}
                <motion.button
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setShowVaultPicker(true)}
                  className="relative w-full aspect-[3/4] border border-white/8 hover:border-[#C5A253]/40 transition-all duration-700 cursor-pointer group overflow-hidden flex items-center justify-center"
                >

                  {sourceImage && selectedVaultItem ? (
                    <>
                      <img
                        src={sourceImage}
                        className="w-full h-full object-cover transition-all duration-[2s] scale-105 group-hover:scale-100"
                        alt="Selected vault image"
                      />
                      {/* Corner marks */}
                      <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-[#C5A253]/40 pointer-events-none z-10" />
                      <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-[#C5A253]/40 pointer-events-none z-10" />
                      <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-[#C5A253]/40 pointer-events-none z-10" />
                      <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-[#C5A253]/40 pointer-events-none z-10" />

                      {/* Image name tag */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-5 py-4 pointer-events-none">
                        <p className="text-[7px] font-mono uppercase tracking-[0.4em] text-[#C5A253]/70 truncate">
                          {selectedVaultItem.name}
                        </p>
                      </div>

                      {/* Hover — change selection */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center z-20">
                        <p className="text-[9px] font-mono text-white uppercase tracking-widest">Change Selection</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-5 pointer-events-none px-6 text-center">
                      <div className="absolute top-4 left-4 w-5 h-5 border-t border-l border-white/8" />
                      <div className="absolute top-4 right-4 w-5 h-5 border-t border-r border-white/8" />
                      <div className="absolute bottom-4 left-4 w-5 h-5 border-b border-l border-white/8" />
                      <div className="absolute bottom-4 right-4 w-5 h-5 border-b border-r border-white/8" />

                      {/* Lock icon */}
                      <div className="w-12 h-12 border border-white/8 flex items-center justify-center group-hover:border-[#C5A253]/30 transition-colors duration-700">
                        <Lock size={18} className="text-white/15 group-hover:text-[#C5A253]/40 transition-colors duration-700" />
                      </div>

                      <div className="space-y-2">
                        <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-white/25 group-hover:text-white/40 transition-colors">
                          Select from Vault
                        </p>
                        <p className="text-[7px] font-mono text-white/12 leading-relaxed">
                          Only images saved to your Vault<br />can be animated in Cinema Studio
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-[7px] font-mono uppercase tracking-[0.4em] text-[#C5A253]/30 group-hover:text-[#C5A253]/60 transition-colors">
                        <span>Open Vault</span>
                        <ChevronRight size={10} />
                      </div>
                    </div>
                  )}
                </motion.button>

                {/* Vault count hint */}
                <p className="text-[7px] font-mono uppercase tracking-[0.4em] text-white/15 text-center">
                  {vaultLoading
                    ? 'Loading vault…'
                    : vaultAssets.length === 0
                      ? 'No vault assets yet — create images in the Atelier first'
                      : `${vaultAssets.length} asset${vaultAssets.length !== 1 ? 's' : ''} available in your vault`}
                </p>
              </div>

              {/* Right: Settings */}
              <div className="space-y-10">

                {/* Creative Direction */}
                <div className="space-y-4">
                  <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-white/25">Step 2 — Creative Direction</p>
                  <div className="relative">
                    <span className="absolute left-0 top-3 text-[#C5A253]/30 text-xs font-mono">{'>'}</span>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      placeholder="Slow editorial walk through Paris streets, golden hour, haute couture, cinematic depth of field..."
                      className="w-full bg-transparent border-b border-white/8 focus:border-[#C5A253]/30 text-white text-sm font-sans placeholder:text-white/15 focus:outline-none transition-colors resize-none py-3 pl-6 pr-2 leading-relaxed"
                    />
                  </div>

                  {/* Active preset preview */}
                  {presetPromptSegment && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border border-[#C5A253]/20 bg-[#C5A253]/3 px-4 py-3 space-y-1"
                    >
                      <p className="text-[7px] font-mono uppercase tracking-[0.5em] text-[#C5A253]/50">◆ Cinema Presets Active</p>
                      <p className="text-[8px] font-mono text-white/30 leading-relaxed">{presetPromptSegment}</p>
                    </motion.div>
                  )}

                  {/* Cinema Presets Panel */}
                  <div className="border border-white/6">
                    <button
                      onClick={() => setShowPresets(!showPresets)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Sparkles size={10} className="text-[#C5A253]/60" />
                        <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-white/30">Cinema Presets</span>
                        {(activeCamera || activeEffect || activeFilter) && (
                          <span className="text-[7px] font-mono text-[#C5A253]/70 border border-[#C5A253]/30 px-1.5 py-0.5">
                            {[activeCamera, activeEffect, activeFilter].filter(Boolean).length} active
                          </span>
                        )}
                      </div>
                      <motion.div animate={{ rotate: showPresets ? 180 : 0 }} transition={{ duration: 0.3 }}>
                        <ChevronDown size={11} className="text-white/20" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {showPresets && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden border-t border-white/6"
                        >
                          {/* Preset Tabs */}
                          <div className="flex border-b border-white/6">
                            {([
                              { id: 'camera',  label: 'Camera Moves',    Icon: Camera  },
                              { id: 'effects', label: 'Special Effects',  Icon: Sparkles },
                              { id: 'filters', label: 'Cinematic Filters', Icon: Palette },
                            ] as { id: PresetTab; label: string; Icon: any }[]).map(({ id, label, Icon }) => (
                              <button
                                key={id}
                                onClick={() => setPresetTab(id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[8px] font-mono uppercase tracking-[0.3em] transition-all ${
                                  presetTab === id
                                    ? 'text-[#C5A253] border-b border-[#C5A253] bg-[#C5A253]/5'
                                    : 'text-white/20 hover:text-white/40'
                                }`}
                              >
                                <Icon size={9} />
                                {label}
                              </button>
                            ))}
                          </div>

                          {/* Preset Grid */}
                          <div className="p-4 grid grid-cols-2 gap-2">
                            {(presetTab === 'camera' ? CAMERA_MOVES : presetTab === 'effects' ? SPECIAL_EFFECTS : CINEMATIC_FILTERS).map((preset) => {
                              const tabKey = presetTab as PresetTab;
                              const activeId = tabKey === 'camera' ? activeCamera : tabKey === 'effects' ? activeEffect : activeFilter;
                              const isActive = activeId === preset.id;
                              return (
                                <motion.button
                                  key={preset.id}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => applyPreset(presetTab, preset.id)}
                                  className={`group relative text-left px-3 py-2.5 border transition-all duration-300 ${
                                    isActive
                                      ? 'border-[#C5A253] bg-[#C5A253]/8 shadow-[0_0_12px_rgba(197,162,83,0.15)]'
                                      : 'border-white/6 hover:border-white/15 hover:bg-white/3'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <p className={`text-[8px] font-mono uppercase tracking-[0.2em] ${
                                      isActive ? 'text-[#C5A253]' : 'text-white/40 group-hover:text-white/60'
                                    }`}>{preset.label}</p>
                                    {preset.tag && (
                                      <span className={`text-[6px] font-mono tracking-[0.2em] ${
                                        isActive ? 'text-[#C5A253]/70' : 'text-white/20'
                                      }`}>{preset.tag}</span>
                                    )}
                                  </div>
                                  {isActive && (
                                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#C5A253]" />
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>

                          {/* Clear all */}
                          {(activeCamera || activeEffect || activeFilter) && (
                            <div className="px-4 pb-4">
                              <button
                                onClick={() => { setActiveCamera(null); setActiveEffect(null); setActiveFilter(null); }}
                                className="text-[7px] font-mono uppercase tracking-[0.4em] text-white/20 hover:text-red-400/60 transition-colors"
                              >
                                ✕ Clear All Presets
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-3">
                  <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-white/25">Step 3 — Duration</p>
                  <div className="flex gap-3">
                    {DURATION_OPTIONS.map(({ value, label, desc }) => (
                      <motion.button
                        key={value}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setDuration(value)}
                        className={`flex-1 py-4 border text-center transition-all duration-300 ${
                          duration === value
                            ? 'border-[#C5A253] text-[#C5A253] bg-[#C5A253]/5 shadow-[0_0_12px_rgba(197,162,83,0.18)]'
                            : 'border-white/8 text-white/30 hover:border-white/20 hover:text-white/60'
                        }`}
                      >
                        <p className="text-[12px] font-mono uppercase tracking-widest">{label}</p>
                        <p className="text-[7px] font-mono mt-0.5 opacity-50">{desc}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-3">
                  <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-white/25">Step 4 — Format</p>
                  <div className="flex gap-3">
                    {RATIO_OPTIONS.map(({ value, label, desc }) => (
                      <motion.button
                        key={value}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setAspectRatio(value)}
                        className={`flex-1 py-4 border text-center transition-all duration-300 ${
                          aspectRatio === value
                            ? 'border-[#C5A253] text-[#C5A253] bg-[#C5A253]/5 shadow-[0_0_12px_rgba(197,162,83,0.18)]'
                            : 'border-white/8 text-white/30 hover:border-white/20 hover:text-white/60'
                        }`}
                      >
                        <p className="text-[12px] font-mono uppercase tracking-widest">{label}</p>
                        <p className="text-[7px] font-mono mt-0.5 opacity-50">{desc}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Engine */}
                <div className="space-y-3">
                  <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-white/25">Step 5 — Engine</p>
                  <div className="flex gap-3">
                    {ENGINE_OPTIONS.map(({ value, label, tag, desc }) => (
                      <motion.button
                        key={value}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setEngineModel(value)}
                        className={`flex-1 py-4 border text-center transition-all duration-300 ${
                          engineModel === value
                            ? 'border-[#C5A253] text-[#C5A253] bg-[#C5A253]/5 shadow-[0_0_12px_rgba(197,162,83,0.18)]'
                            : 'border-white/8 text-white/30 hover:border-white/20 hover:text-white/60'
                        }`}
                      >
                        <p className="text-[11px] font-mono uppercase tracking-widest">
                          {label} <span className="text-[9px] opacity-70">{tag}</span>
                        </p>
                        <p className="text-[7px] font-mono mt-0.5 opacity-50">{desc}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[9px] font-mono text-red-400/80 border border-red-500/20 px-4 py-3"
                  >
                    {error}
                  </motion.p>
                )}

                {/* CTA */}
                <div className="pt-2">
                  {(isAdmin || videoCredits > 0) ? (
                    <motion.button
                      onClick={handleGenerate}
                      disabled={genState === 'starting' || !sourceImage}
                      whileTap={{ scale: 0.97 }}
                      className="group relative w-full py-5 bg-[#C5A253] text-black text-[10px] font-mono uppercase tracking-[0.5em] overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        <Play size={12} />
                        {genState === 'starting'
                          ? 'Initiating Cinema…'
                          : !sourceImage
                            ? 'Select a Vault Image First'
                            : 'Generate Video'}
                      </span>
                      <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    </motion.button>
                  ) : (
                    <div className="py-5 border border-white/8 text-center space-y-1">
                      <p className="text-[9px] font-mono text-white/25 uppercase tracking-widest">No Video Credits</p>
                      <p className="text-[8px] font-mono text-white/15">Upgrade to Sovereign ($165) or Luminary ($299)</p>
                    </div>
                  )}
                  <p className="text-[7px] font-mono text-white/12 text-center mt-3 uppercase tracking-widest">
                    1 credit · Veo 3.1 {engineModel === 'fast' ? 'Fast' : 'Standard'} · 1080p · Native Audio · 1–6 min
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── PROCESSING ── */}
          {genState === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative flex flex-col items-center justify-center py-40 text-center gap-10 overflow-hidden"
            >
              {sourceImage && (
                <div className="absolute inset-0 pointer-events-none">
                  <img src={sourceImage} className="w-full h-full object-cover blur-[80px] opacity-10 scale-110" alt="" />
                </div>
              )}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-[#C5A253]/5 blur-[120px] pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center gap-10">
                <motion.div
                  animate={{ y: [0, -16, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Film size={64} className="text-[#C5A253] opacity-50 drop-shadow-[0_0_30px_rgba(197,162,83,0.5)]" />
                </motion.div>

                <div className="space-y-2 h-12 flex flex-col items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={phaseIndex}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.5 }}
                    >
                      <p className="text-[11px] font-mono uppercase tracking-[0.6em] text-[#C5A253]">
                        {PROCESSING_PHASES[phaseIndex]}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                  <p className="text-[8px] font-mono uppercase tracking-[0.4em] text-white/20">
                    Veo 3.1 · Google DeepMind
                  </p>
                </div>

                <div className="w-80 space-y-2">
                  <div className="relative h-[1px] bg-white/8 overflow-hidden">
                    <motion.div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#C5A253] to-[#F5D060]"
                      style={{ width: `${pollProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                    <motion.div
                      className="absolute top-0 h-full w-24 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{ x: ['-96px', '380px'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                  <div className="flex justify-between text-[7px] font-mono text-white/20 uppercase tracking-widest">
                    <span>Rendering</span>
                    <span>{Math.round(pollProgress)}%</span>
                  </div>
                </div>

                <motion.p
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 3.5, repeat: Infinity }}
                  className="text-[8px] font-mono uppercase tracking-[0.7em] text-white/15"
                >
                  Studio Grade · 24fps · 720p
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* ── COMPLETE ── */}
          {genState === 'complete' && videoUrl && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-8"
            >
              <div className={`relative border border-[#C5A253]/20 overflow-hidden ${aspectRatio === '9:16' ? 'max-w-sm w-full' : 'max-w-4xl w-full'}`}>
                <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-[#C5A253]/40 pointer-events-none z-10" />
                <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-[#C5A253]/40 pointer-events-none z-10" />
                <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-[#C5A253]/40 pointer-events-none z-10" />
                <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-[#C5A253]/40 pointer-events-none z-10" />
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full"
                  style={{ aspectRatio: aspectRatio === '9:16' ? '9/16' : '16/9' }}
                />
              </div>

              <p className="text-[8px] font-mono uppercase tracking-[0.5em] text-[#C5A253]/50">
                ◆ Cinema Complete · LuxAura × Veo 3.1
              </p>

              {/* Primary action row */}
              <div className="flex flex-wrap gap-3 justify-center">
                <motion.button
                  onClick={handleDownload}
                  whileTap={{ scale: 0.97 }}
                  className="group relative flex items-center gap-2 px-8 py-4 bg-[#C5A253] text-black text-[9px] font-mono uppercase tracking-[0.4em] overflow-hidden"
                >
                  <Download size={12} />
                  Download MP4
                  <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </motion.button>

                {/* Save to Video Vault */}
                <motion.button
                  onClick={handleSaveToVideoVault}
                  disabled={vaultSaveState === 'saving' || vaultSaveState === 'saved'}
                  whileTap={{ scale: 0.97 }}
                  className={`group relative flex items-center gap-2 px-8 py-4 text-[9px] font-mono uppercase tracking-[0.4em] border transition-all duration-500 overflow-hidden ${
                    vaultSaveState === 'saved'
                      ? 'border-emerald-500/40 text-emerald-400/80 bg-emerald-500/5'
                      : vaultSaveState === 'saving'
                        ? 'border-[#C5A253]/20 text-[#C5A253]/40 cursor-wait'
                        : vaultSaveState === 'error'
                          ? 'border-red-500/30 text-red-400/60 hover:border-red-500/50'
                          : 'border-[#C5A253]/30 text-[#C5A253]/70 hover:border-[#C5A253]/60 hover:text-[#C5A253] hover:bg-[#C5A253]/5'
                  }`}
                >
                  {vaultSaveState === 'saving' ? (
                    <><Loader size={12} className="animate-spin" />Saving…</>
                  ) : vaultSaveState === 'saved' ? (
                    <><CheckCircle size={12} />Saved to Vault</>
                  ) : vaultSaveState === 'error' ? (
                    <><Vault size={12} />Retry Save</>
                  ) : (
                    <><Vault size={12} />Save to Video Vault</>
                  )}
                </motion.button>

                <motion.button
                  onClick={handleReset}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-8 py-4 border border-white/10 text-white/40 text-[9px] font-mono uppercase tracking-[0.4em] hover:text-white hover:border-white/30 transition-colors"
                >
                  <RotateCw size={12} />
                  New Video
                </motion.button>
              </div>

              {/* Post-save confirmation + vault link */}
              <AnimatePresence>
                {vaultSaveState === 'saved' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-3 border border-emerald-500/20 bg-emerald-500/5 px-6 py-3"
                  >
                    <CheckCircle size={12} className="text-emerald-400/70 shrink-0" />
                    <p className="text-[8px] font-mono text-emerald-400/70 uppercase tracking-[0.3em]">Permanently saved to your Video Vault · </p>
                    <button
                      onClick={() => navigate('/vault', { state: { tab: 'videos' } })}
                      className="text-[8px] font-mono text-[#C5A253]/70 hover:text-[#C5A253] uppercase tracking-[0.3em] flex items-center gap-1 transition-colors"
                    >
                      View Vault <ChevronRight size={9} />
                    </button>
                  </motion.div>
                )}
                {vaultSaveState === 'error' && vaultSaveError && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[8px] font-mono text-red-400/70 border border-red-500/20 px-4 py-2"
                  >
                    {vaultSaveError}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── ERROR ── */}
          {genState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center gap-6"
            >
              <p className="text-[10px] font-mono uppercase tracking-[0.6em] text-red-400">[ Generation Failed ]</p>
              <p className="text-sm font-mono text-white/30 max-w-lg leading-relaxed">{error}</p>
              <motion.button
                onClick={handleReset}
                whileTap={{ scale: 0.97 }}
                className="px-10 py-4 border border-[#C5A253]/40 text-[#C5A253] text-[9px] font-mono uppercase tracking-[0.4em] hover:bg-[#C5A253]/10 transition-all"
              >
                [ Retry ]
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Vault Picker Overlay ── */}
      <AnimatePresence>
        {showVaultPicker && (
          <VaultPicker
            assets={vaultAssets}
            loading={vaultLoading}
            onSelect={loadVaultImage}
            onClose={() => setShowVaultPicker(false)}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}
// ── Wrapped Export ───────────────────────────────────────────────────────────

export default function VideoStudioPage() {
  return (
    <VideoStudioErrorBoundary>
      <VideoStudio />
    </VideoStudioErrorBoundary>
  );
}
