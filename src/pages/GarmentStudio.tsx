import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Zap, Shield, Loader2 } from 'lucide-react';
import Layout from '../components/Layout';
import SovereignForge from '../components/SovereignForge';
import { MasterpieceReveal } from '../components/MasterpieceReveal';
import IterationPanel from '../components/IterationPanel';
import { ForgeActivation } from '../components/ForgeActivation';
import { PersonaCarousel } from '../components/PersonaCarousel';
import { RenderEngine } from '../lib/render-engine';
import { PaperBananaProtocol } from '../lib/paper-banana-protocol/core';
import type { PBPRequest, PromptPayload } from '../lib/paper-banana-protocol/core';
import { LocationPresetPicker } from '../components/LocationPresetPicker';
import type { LocationPreset } from '../lib/locationPresets';
import { useSovereignStore } from '../store/useSovereignStore';
import type { VaultItem } from '../store/useSovereignStore';
import { useAuth, CREDIT_COST } from '../contexts/AuthContext';
import { CreativePropsGallery } from '../components/CreativePropsGallery';
import type { CreativeProp } from '../lib/creativeProps';

// ── Dropzone slot ─────────────────────────────────────────────────────────────

interface UploadSlotProps {
  label: string;
  sublabel: string;
  file: File | null;
  previewUrl: string;
  onFile: (f: File) => void;
  onClear: () => void;
  additionalFiles: File[];
  additionalUrls: string[];
  onAdditionalFile: (f: File) => void;
  onRemoveAdditional: (i: number) => void;
}

function UploadSlot({ label, sublabel, file, previewUrl, onFile, onClear, additionalFiles, additionalUrls, onAdditionalFile, onRemoveAdditional }: UploadSlotProps) {
  const [scanning, setScanning] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted[0]) return;
    onFile(accepted[0]);
    setScanning(true);
    setTimeout(() => { setScanning(false); }, 2800);
  }, [onFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    disabled: scanning,
  });

  return (
    <div className="relative w-full">
      <div className="relative w-full aspect-[3/4] border border-[#E5E0D8] overflow-hidden bg-white shadow-sm transition-shadow">
        <AnimatePresence mode="wait">
          {!file ? (
            <div {...getRootProps()} className="h-full">
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className={`h-full flex flex-col items-center justify-center cursor-pointer transition-colors duration-500 ${isDragActive ? 'bg-[#F2EFE9]' : 'hover:bg-[#FAF9F6]'}`}
              >
                <input {...getInputProps()} />
                <motion.div
                  animate={{ scale: [1, 1.02, 1], opacity: [0.02, 0.05, 0.02] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute w-[220px] h-[220px] border border-[#1C1C1C] rounded-full pointer-events-none"
                />
                <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
                  <div className={`p-6 border rounded-full transition-all duration-700 ${isDragActive ? 'border-[#1C1C1C]/20 bg-white' : 'border-[#E5E0D8] bg-white shadow-sm'}`}>
                    <Upload size={24} strokeWidth={1.5} className={`transition-colors duration-700 ${isDragActive ? 'text-[#1C1C1C]' : 'text-[#6E6A60]'}`} />
                  </div>
                  <div>
                    <p className="text-[16px] font-serif text-[#1C1C1C] italic mb-2 tracking-wide">{label}</p>
                    <p className="text-[8px] font-mono uppercase tracking-[0.3em] text-[#6E6A60]">{sublabel}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <motion.div key="filled" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full relative group">
              <img
                src={previewUrl}
                alt={label}
                className={`w-full h-full object-contain transition-all duration-[2.5s] bg-[#F2EFE9] ${scanning ? 'blur-sm grayscale opacity-40 scale-105' : 'opacity-100 group-hover:scale-[1.02]'}`}
              />
              {/* Scanner */}
              {scanning && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 bg-white/60 backdrop-blur-sm">
                  <motion.div
                    className="absolute left-0 right-0 h-[1px] bg-[#1C1C1C]"
                    animate={{ top: ['-5%', '105%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-8 bg-white border border-[#E5E0D8] shadow-xl flex flex-col items-center gap-4">
                      <Loader2 size={16} strokeWidth={1.5} className="animate-spin text-[#1C1C1C]" />
                      <p className="text-[8px] font-mono uppercase tracking-[0.4em] text-[#6E6A60]">Scanning Matrix…</p>
                    </div>
                  </div>
                </motion.div>
              )}
              {/* Change button — top right */}
              {!scanning && (
                <button
                  onClick={(e) => { e.stopPropagation(); onClear(); setScanning(false); }}
                  className="absolute top-4 right-4 z-50 px-4 py-2 bg-white/90 backdrop-blur-md border border-[#E5E0D8] text-[8px] font-mono uppercase tracking-[0.3em] text-[#6E6A60] hover:text-[#1C1C1C] hover:border-[#1C1C1C]/20 transition-all shadow-sm rounded-sm opacity-0 group-hover:opacity-100"
                >
                  Change
                </button>
              )}
              {/* Lock badge */}
              {!scanning && (
                <div className="absolute bottom-4 left-4 right-4 z-50 px-4 py-3 bg-white/95 backdrop-blur-md border border-[#E5E0D8] flex items-center justify-between shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-3">
                    <Shield size={12} strokeWidth={1.5} className="text-[#1C1C1C]" />
                    <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-[#1C1C1C]">Asset Locked</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Additional reference angles strip */}
      {file && !scanning && (
        <div className="mt-4 space-y-3">
          <p className="text-[8px] font-mono uppercase tracking-[0.4em] text-[#6E6A60]">+ Extra Angles (up to 3)</p>
          <div className="flex gap-3 flex-wrap">
            {additionalUrls.map((url, i) => (
              <div key={i} className="relative w-16 h-20 overflow-hidden border border-[#E5E0D8] bg-white group">
                <img src={url} alt={`ref ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => onRemoveAdditional(i)}
                  className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[#1C1C1C] text-sm font-mono backdrop-blur-sm"
                >
                  ×
                </button>
              </div>
            ))}
            {additionalFiles.length < 3 && (
              <label className="w-16 h-20 border border-dashed border-[#E5E0D8] hover:border-[#1C1C1C]/30 flex items-center justify-center cursor-pointer text-[#6E6A60] hover:text-[#1C1C1C] transition-colors bg-[#FAF9F6] hover:bg-white">
                <span className="text-xl font-light">+</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onAdditionalFile(f); e.target.value = ''; }}
                />
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Director Console select ───────────────────────────────────────────────────

function ConsoleSelect({ label, value, options, onChange, disabled }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 transition-opacity duration-300 ${disabled ? 'opacity-30 pointer-events-none' : ''}`}>
      <label className="text-[9px] font-mono uppercase tracking-wider text-[#6E6A60]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="minimal-select w-full bg-transparent border-0 border-b border-[#E5E0D8] focus:border-[#C5A253] focus:ring-0 px-0 py-1 text-xs text-[#1C1C1C] appearance-none cursor-pointer transition-colors duration-200"
      >
        {options.map(opt => <option key={opt} value={opt} className="bg-white text-[#1C1C1C]">{opt}</option>)}
      </select>
    </div>
  );
}

function ConsoleSectionHeader({ label }: { label: string }) {
  return (
    <div className="border-t border-[#E5E0D8] pt-2 mb-6">
      <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#6E6A60] block">{label}</span>
    </div>
  );
}

// ── Photography style options ─────────────────────────────────────────────────
const PHOTO_STYLE_OPTIONS = [
  { id: 'HIGH_FASHION_EDITORIAL',  name: 'High Fashion',  pub: 'Vogue · i-D' },
  { id: 'LUXURY_BRAND_CAMPAIGN',   name: 'Brand Campaign',pub: 'Chanel · Row' },
  { id: 'STREET_STYLE_CANDID',     name: 'Street Fashion',pub: 'Sartorialist' },
  { id: 'AVANT_GARDE_COUTURE',     name: 'Avant Garde',   pub: 'Tim Walker' },
  { id: 'BEAUTY_EDITORIAL',        name: 'Beauty Focus',  pub: 'Allure' },
  { id: 'LIFESTYLE_EDITORIAL',     name: 'Lifestyle',     pub: 'Kinfolk' },
  { id: 'FINE_ART_PORTRAIT',       name: 'Fine Portrait', pub: 'Leibovitz' },
  { id: 'FASHION_MAGAZINE_SPREAD', name: 'Magazine',      pub: 'BAZAAR' },
  { id: 'LUXURY_CATALOG',          name: 'Lux Catalog',   pub: 'Net-a-Porter' },
];

const CAMERA_FORMAT_OPTIONS = [
  'Phase One 150MP · 80mm',
  'Hasselblad H6D · 100mm',
  'Leica M · 35mm Film',
  'Canon 1DX · 85mm',
  'Nikon D6 · 135mm',
  'Sony A1 · 50mm',
  'Leica SL2 · 24mm Wide',
  'Contax 645 · 80mm Film',
  '4x5 Large Format Film',
  'Polaroid · Instant Film',
  '35mm Disposable Film',
];

const COLOR_GRADE_OPTIONS = [
  'Auto',
  'Kodak Portra 400',
  'Fuji Pro 400H',
  'Kodak Ektar 100',
  'Cinematic Teal & Orange',
  'Bleach Bypass',
  'Cross Process',
  'High Contrast B&W',
  'Gritty B&W Film',
  'Vintage Warm',
  'Nordic Matte',
  'Matte Fade Editorial',
  'Hyperreal',
  'True Life Accurate',
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function GarmentStudio() {
  const { profile, isAdmin } = useAuth();
  const deployToVault = useSovereignStore((s) => s.deployToVault);
  const setGridSlot   = useSovereignStore((s) => s.setGridSlot);

  const [modelFile,   setModelFile]   = useState<File | null>(null);
  const [garmentFile, setGarmentFile] = useState<File | null>(null);
  const [modelUrl,    setModelUrl]    = useState('');
  const [garmentUrl,  setGarmentUrl]  = useState('');

  const [modelAdditionalFiles,   setModelAdditionalFiles]   = useState<File[]>([]);
  const [modelAdditionalUrls,    setModelAdditionalUrls]    = useState<string[]>([]);
  const [garmentAdditionalFiles, setGarmentAdditionalFiles] = useState<File[]>([]);
  const [garmentAdditionalUrls,  setGarmentAdditionalUrls]  = useState<string[]>([]);

  const [lighting,        setLighting]        = useState('Clean & Even');
  const [camera,          setCamera]          = useState('Soft Background (85mm)');
  const [bg,              setBg]              = useState('studio-grey');
  const [prompt,          setPrompt]          = useState('');
  const [locationPreset,  setLocationPreset]  = useState<LocationPreset | null>(null);

  const [skinTone,     setSkinTone]     = useState('Auto');
  const [gender,       setGender]       = useState('Female');
  const [modelArchetype, setModelArchetype] = useState('High Fashion');
  const [poseDirection, setPoseDirection] = useState('Auto');
  const [expression,   setExpression]   = useState('Auto');
  const [ageRange,     setAgeRange]     = useState('Prime Editorial (25–35)');
  const [shotType,     setShotType]     = useState('Full Body');
  const [atmosphere,   setAtmosphere]   = useState('Auto');
  const [styling,      setStyling]      = useState('Auto');
  const [strategy,     setStrategy]     = useState<'keep' | 'change'>('keep');
  const [photoDirection, setPhotoDirection] = useState('full-spread');
  const [colorGrade,     setColorGrade]     = useState('Auto');
  const [cameraFormat,   setCameraFormat]   = useState('Sony A1 · 50mm');
  const [garmentCategory, setGarmentCategory] = useState('FULL_OUTFIT');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeploying,  setIsDeploying]  = useState(false);
  const [deployedIds,  setDeployedIds]  = useState<Set<number>>(new Set());
  const [deployError,  setDeployError]  = useState<string | null>(null);
  const [forgeGrid,    setForgeGrid]    = useState<string[]>([]);
  const [activeAsset,  setActiveAsset]  = useState<number | null>(null);
  const [refineAsset,  setRefineAsset]  = useState<number | null>(null);
  const [engineError,  setEngineError]  = useState<string | null>(null);
  const [uploadError,  setUploadError]  = useState<string | null>(null);
  const [step,         setStep]         = useState<'upload' | 'preview'>('upload');
  const [showCreativeProps, setShowCreativeProps] = useState(false);
  const [activePropId,      setActivePropId]      = useState<string | null>(null);

  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

  const handleModelUpload = useCallback((f: File) => {
    setUploadError(null);
    if (f.size > MAX_UPLOAD_BYTES) {
      setUploadError(`Model photo is ${(f.size / 1024 / 1024).toFixed(1)} MB — max 10MB limit.`);
      return;
    }
    setModelFile(f);
    setModelUrl(URL.createObjectURL(f));
  }, []);

  const handleCreativePropSelect = (prop: CreativeProp, sceneIndex: number = 0) => {
    setStrategy('change');
    setPhotoDirection(prop.config.photoDirection);
    setLocationPreset(prop.config.locationPreset);
    setBg(prop.config.bg);
    setLighting(prop.config.lighting);
    setCamera(prop.config.camera);
    setCameraFormat(prop.config.cameraFormat);
    setColorGrade(prop.config.colorGrade);
    setPrompt(prop.config.userPrompts[sceneIndex] ?? prop.config.userPrompts[0]);
    setActivePropId(prop.id);
  };

  const handleGarmentUpload = useCallback((f: File) => {
    setUploadError(null);
    setGarmentFile(null);
    setGarmentUrl('');
    setGarmentAdditionalFiles([]);
    setGarmentAdditionalUrls([]);
    if (f.size > MAX_UPLOAD_BYTES) {
      setUploadError(`Garment photo is ${(f.size / 1024 / 1024).toFixed(1)} MB — max 10MB limit.`);
      return;
    }
    setGarmentFile(f);
    setGarmentUrl(URL.createObjectURL(f));
  }, []);

  const readyToForge = !!modelFile && !!garmentFile;
  const creditsPerRun = CREDIT_COST.forgeRunVTO;
  const canForge = isAdmin || (profile ? profile.imageCredits >= creditsPerRun : false);

  const compressImage = (base64: string, maxMB = 2.5): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onerror = () => resolve(base64);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        const maxDim = 2048;
        if (w > maxDim || h > maxDim) {
          if (w > h) { h = (h / w) * maxDim; w = maxDim; }
          else       { w = (w / h) * maxDim; h = maxDim; }
        }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
        let q = 0.92;
        let result = canvas.toDataURL('image/jpeg', q);
        while (result.length > maxMB * 1024 * 1024 && q > 0.1) { q -= 0.05; result = canvas.toDataURL('image/jpeg', q); }
        resolve(result);
      };
    });

  const getBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.readAsDataURL(f);
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(new Error(`IMAGE_READ_FAILED: Corrupted image file.`));
    });

  const handleForge = async () => {
    if (!modelFile || !garmentFile || !canForge) return;

    setIsProcessing(true);
    setEngineError(null);
    setForgeGrid(Array(6).fill(''));
    setStep('preview');

    try {
      // CREDITS BYPASSED FOR DEMO
      // const ok = await deductImageCredits();
      // if (!ok) { setEngineError('Insufficient credits.'); setForgeGrid([]); return; }

      const request: PBPRequest = {
        category: 'clothing',
        assetFile: modelFile,
        strategy,
        config: { skinTone, lighting, camera, background: bg, userPrompt: prompt },
      };
      const payload: PromptPayload = await PaperBananaProtocol.execute(request, () => {});

      const [sourceB64raw, garmentB64raw] = await Promise.all([
        getBase64(modelFile),
        getBase64(garmentFile),
      ]);
      const [sourceB64, garmentB64] = await Promise.all([
        compressImage(sourceB64raw),
        compressImage(garmentB64raw),
      ]);

      const additionalModelImages = await Promise.all(
        modelAdditionalFiles.map(async f => compressImage(await getBase64(f)))
      );
      const additionalGarmentImages = await Promise.all(
        garmentAdditionalFiles.map(async f => compressImage(await getBase64(f)))
      );

      const engine = new RenderEngine('');
      const grid = await engine.executeMantisLoop(
        payload.native_prompt,
        {
          aspect_ratio: payload.parameters.aspect_ratio,
          fidelity: payload.parameters.fidelity,
          isWhaleContract: true,
          sourceImage: sourceB64,
          garmentImage: garmentB64,
          anchor: garmentCategory,
          anchors: [garmentCategory],
          strategy,
          lighting,
          background: bg,
          camera,
          locationPreset: locationPreset?.description,
          photoDirection,
          colorGrade: colorGrade !== 'Auto' ? colorGrade : undefined,
          cameraFormat,
          userPrompt: prompt,
          gender,
          modelArchetype,
          pose: poseDirection !== 'Auto' ? poseDirection : undefined,
          expression: expression !== 'Auto' ? expression : undefined,
          ageRange,
          shotType,
          atmosphere: atmosphere !== 'Auto' ? atmosphere : undefined,
          styling: styling !== 'Auto' ? styling : undefined,
          additionalModelImages,
          additionalGarmentImages,
        },
        (slot, image) => {
          setForgeGrid((prev) => {
            const next = prev.length === 6 ? [...prev] : Array(6).fill('');
            next[slot] = image;
            return next;
          });
          setGridSlot(slot, image);
        },
      );

      setForgeGrid(grid);
    } catch (err: any) {
      console.error('[GARMENT STUDIO]', err);
      setEngineError(err?.message || 'Forge failed — check logs.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
  <div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1C]">
    <Layout>
      <div className="max-w-[1400px] mx-auto px-4 lg:px-12 py-16 md:py-24 space-y-24">

        {/* Quiet Luxury Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16,1,0.3,1] }}
          className="border-b border-[#E5E0D8] pb-10 space-y-5"
        >
          <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-[#6E6A60]">
            Garment Studio — Direct Synthesis
          </p>
          <h1 className="text-5xl md:text-7xl font-serif text-[#1C1C1C] tracking-tight leading-tight">
            Dress the <span className="italic font-light">Subject.</span>
          </h1>
          <p className="text-[#6E6A60] text-sm font-light max-w-xl leading-relaxed">
            Supply a person. Supply an outfit. The studio maps the garment with architectural precision across 6 editorial variations.
          </p>
          {profile && (
            <div className="flex items-center gap-3 pt-6">
              <div className={`flex items-center gap-2 px-4 py-2 border rounded-sm ${canForge ? 'border-[#E5E0D8] bg-white' : 'border-red-500/20 bg-red-50'}`}>
                <Zap size={10} strokeWidth={1} className={canForge ? 'text-[#1C1C1C]' : 'text-red-400'} />
                <span className={`text-[9px] font-mono tracking-widest ${canForge ? 'text-[#1C1C1C]' : 'text-red-400'}`}>
                  {profile.imageCredits} credits available · {creditsPerRun} / run
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {step === 'upload' && (
          <div className="space-y-16">
            {/* Dual upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-xs font-serif italic text-[#1C1C1C]">01.</span>
                  <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#6E6A60]">The Subject</p>
                </div>
                <UploadSlot
                  label="Upload Profile"
                  sublabel="Model mapping target"
                  file={modelFile}
                  previewUrl={modelUrl}
                  onFile={handleModelUpload}
                  onClear={() => { setModelFile(null); setModelUrl(''); setModelAdditionalFiles([]); setModelAdditionalUrls([]); setUploadError(null); }}
                  additionalFiles={modelAdditionalFiles}
                  additionalUrls={modelAdditionalUrls}
                  onAdditionalFile={(f) => { setModelAdditionalFiles(prev => [...prev, f]); setModelAdditionalUrls(prev => [...prev, URL.createObjectURL(f)]); }}
                  onRemoveAdditional={(i) => { setModelAdditionalFiles(prev => prev.filter((_, idx) => idx !== i)); setModelAdditionalUrls(prev => prev.filter((_, idx) => idx !== i)); }}
                />
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.1 }}>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-xs font-serif italic text-[#1C1C1C]">02.</span>
                  <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#6E6A60]">The Garment</p>
                </div>
                <UploadSlot
                  label="Upload Garment"
                  sublabel="Flat-lay or lookbook source"
                  file={garmentFile}
                  previewUrl={garmentUrl}
                  onFile={handleGarmentUpload}
                  onClear={() => { setGarmentFile(null); setGarmentUrl(''); setGarmentAdditionalFiles([]); setGarmentAdditionalUrls([]); setUploadError(null); }}
                  additionalFiles={garmentAdditionalFiles}
                  additionalUrls={garmentAdditionalUrls}
                  onAdditionalFile={(f) => { setGarmentAdditionalFiles(prev => [...prev, f]); setGarmentAdditionalUrls(prev => [...prev, URL.createObjectURL(f)]); }}
                  onRemoveAdditional={(i) => { setGarmentAdditionalFiles(prev => prev.filter((_, idx) => idx !== i)); setGarmentAdditionalUrls(prev => prev.filter((_, idx) => idx !== i)); }}
                />
              </motion.div>
            </div>

            {/* Upload validation error banner */}
            <AnimatePresence>
              {uploadError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-3 px-6 py-4 border border-red-200 bg-red-50 text-red-600 rounded-sm"
                >
                  <span className="text-[9px] font-mono uppercase tracking-widest mt-1">Error</span>
                  <p className="text-sm font-light leading-relaxed">{uploadError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Director console — visible once both images uploaded */}
            <AnimatePresence>
              {readyToForge && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: [0.16,1,0.3,1] }}
                  className="space-y-16"
                >
                  <div className="w-full h-px bg-[#E5E0D8]" />

                  {/* Concept Injectors */}
                  <div className="flex flex-col items-start gap-3 max-w-2xl">
                    <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#6E6A60]">Concept Injectors</p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setShowCreativeProps(true)}
                        className={`px-8 py-3 border rounded-sm text-[10px] font-mono uppercase tracking-[0.2em] transition-all duration-300 ${activePropId ? 'border-[#1C1C1C] text-[#1C1C1C] bg-[#F2EFE9]' : 'border-[#E5E0D8] text-[#6E6A60] hover:text-[#1C1C1C] hover:border-[#1C1C1C]/30 bg-white'}`}
                      >
                        Browse Scene Props
                      </button>
                      {activePropId && <p className="text-[10px] font-serif italic text-[#1C1C1C]">Active: {activePropId.replace(/-/g, ' ')}</p>}
                    </div>
                  </div>

                  {/* Strategy — Preserve vs Reimagine */}
                  <div className="space-y-6">
                    <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#6E6A60] text-center">Subject Integrity Mode</p>
                    <div className="flex justify-center gap-6">
                      <button
                        onClick={() => setStrategy('keep')}
                        className={`px-10 py-4 border rounded-sm text-[10px] font-mono uppercase tracking-[0.2em] transition-all duration-300 ${strategy === 'keep' ? 'border-[#1C1C1C] text-white bg-[#1C1C1C]' : 'border-[#E5E0D8] text-[#6E6A60] hover:text-[#1C1C1C] hover:border-[#1C1C1C]/30 bg-white'}`}
                      >
                        Preserve Identity
                      </button>
                      <button
                        onClick={() => setStrategy('change')}
                        className={`px-10 py-4 border rounded-sm text-[10px] font-mono uppercase tracking-[0.2em] transition-all duration-300 ${strategy === 'change' ? 'border-[#1C1C1C] text-white bg-[#1C1C1C]' : 'border-[#E5E0D8] text-[#6E6A60] hover:text-[#1C1C1C] hover:border-[#1C1C1C]/30 bg-white'}`}
                      >
                        AI Reimagine
                      </button>
                    </div>
                    <p className="text-center text-[10px] font-serif italic text-[#6E6A60] tracking-wide">
                      {strategy === 'keep' ? "The subject's facial structure and identity will be locked." : "A completely synthetic fashion model will be generated."}
                    </p>
                  </div>

                  {/* Photography Style Picker */}
                  <div className="space-y-6">
                    <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#6E6A60]">Editorial Direction</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {/* Auto / Full Spread card */}
                      <button
                        onClick={() => setPhotoDirection('full-spread')}
                        className={`p-5 border rounded-sm text-left transition-all duration-300 col-span-1 ${
                          photoDirection === 'full-spread' ? 'border-[#1C1C1C] bg-[#F2EFE9] shadow-sm' : 'border-[#E5E0D8] bg-white hover:border-[#1C1C1C]/20'
                        }`}
                      >
                        <p className={`text-[10px] font-mono uppercase tracking-widest mb-2 leading-tight ${photoDirection === 'full-spread' ? 'text-[#1C1C1C]' : 'text-[#6E6A60]'}`}>Full Spread</p>
                        <p className="text-xs font-serif italic text-[#6E6A60] leading-relaxed">Auto-diversify 6 styles</p>
                      </button>
                      {/* Specific style cards */}
                      {PHOTO_STYLE_OPTIONS.map(style => (
                        <button
                          key={style.id}
                          onClick={() => setPhotoDirection(style.id)}
                          className={`p-5 border rounded-sm text-left transition-all duration-300 ${
                            photoDirection === style.id ? 'border-[#1C1C1C] bg-[#F2EFE9] shadow-sm' : 'border-[#E5E0D8] bg-white hover:border-[#1C1C1C]/20'
                          }`}
                        >
                          <p className={`text-[10px] font-mono uppercase tracking-widest mb-2 leading-tight ${photoDirection === style.id ? 'text-[#1C1C1C]' : 'text-[#6E6A60]'}`}>{style.name}</p>
                          <p className="text-xs font-serif italic text-[#6E6A60] leading-relaxed">{style.pub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Director Console — three-section Stitch layout */}
                  <div className="max-w-5xl bg-white border border-[#E5E0D8] shadow-sm">
                    <div className="px-8 pt-6 pb-2">
                      <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-[#6E6A60]">Director Console</p>
                    </div>

                    {/* Section 1 — Model Casting */}
                    <div className="px-8 pb-6">
                      <ConsoleSectionHeader label="Model Casting" />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-6">
                        <ConsoleSelect label="Gender" value={gender} options={['Female','Male','Unisex (Androgynous)']} onChange={setGender} disabled={strategy === 'keep'} />
                        <ConsoleSelect label="Model Archetype" value={modelArchetype} options={['High Fashion','Commercial','Androgynous','Beauty','Curve Editorial','Athletic','Petite','Distinguished']} onChange={setModelArchetype} disabled={strategy === 'keep'} />
                        <ConsoleSelect label="Age Range" value={ageRange} options={['Emerging (18–24)','Prime Editorial (25–35)','Established (35–45)','Mature Luxury (45–55)','Distinguished (55+)']} onChange={setAgeRange} disabled={strategy === 'keep'} />
                        <ConsoleSelect label="Skin Profile" value={skinTone} options={['Auto','Fair','Porcelain','Tan','Cinnamon','Brown','Chocolate','Deep']} onChange={setSkinTone} disabled={strategy === 'keep'} />
                      </div>
                    </div>

                    {/* Section 2 — Shoot Direction */}
                    <div className="px-8 pb-6">
                      <ConsoleSectionHeader label="Shoot Direction" />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-6">
                        <ConsoleSelect label="Expression" value={expression} options={['Auto','Fierce','Soft Romantic','Candid Joy','Cold Editorial','Introspective','Sensual','Confident Direct']} onChange={setExpression} />
                        <ConsoleSelect label="Pose Direction" value={poseDirection} options={['Auto','Power Stand','Editorial Lean','Walking Motion','Seated Drape','Over Shoulder','Hands Active','Full Extension','Candid Moment','Contraposto','Profile Silhouette']} onChange={setPoseDirection} />
                        <ConsoleSelect label="Shot Type" value={shotType} options={['Full Body','3/4 Body','Waist Up','Portrait','Beauty Close','Detail Shot','Environmental Scale']} onChange={setShotType} />
                        <ConsoleSelect label="Atmosphere" value={atmosphere} options={['Auto','Golden Hour','Overcast Soft','Blue Hour','Harsh Midday','Misty Rain','Dramatic Storm','Snow Winter','Heat Haze']} onChange={setAtmosphere} />
                      </div>
                    </div>

                    {/* Section 3 — Production */}
                    <div className="px-8 pb-8">
                      <ConsoleSectionHeader label="Production" />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-6">
                        <ConsoleSelect label="Lighting Setup" value={lighting} options={['Clean & Even','Sunset Side Glow','Deep Shadow','Beauty Overhead','Moody Cinema','Soft Natural']} onChange={setLighting} />
                        <ConsoleSelect label="Styling" value={styling} options={['Auto','Minimal Clean','Full Editorial','Street Cast','Luxury Campaign','Sport Luxe']} onChange={setStyling} />
                        <ConsoleSelect label="Color Profile" value={colorGrade} options={COLOR_GRADE_OPTIONS} onChange={setColorGrade} />
                        <ConsoleSelect label="Optics" value={cameraFormat} options={CAMERA_FORMAT_OPTIONS} onChange={setCameraFormat} />
                        <ConsoleSelect label="Garment Anchor" value={garmentCategory} options={['FULL_OUTFIT', 'DRESS', 'SHIRT', 'PANTS', 'SHORTS', 'SWIMWEAR', 'HAT']} onChange={setGarmentCategory} />
                        <ConsoleSelect
                          label={bg === 'custom-bg' && !locationPreset ? 'Environment (Prompted)' : 'Backdrop'}
                          value={bg === 'custom-bg' ? 'Custom Background' : bg.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('-')}
                          options={['Studio-Grey','Pitch-Black','Editorial-White','Custom Background']}
                          onChange={(v) => {
                            if (v === 'Custom Background') { setBg('custom-bg'); setLocationPreset(null); }
                            else { setBg(v.toLowerCase()); setLocationPreset(null); }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location preset */}
                  <LocationPresetPicker selected={locationPreset} onSelect={(preset) => { setLocationPreset(preset); if (preset) setBg('custom-bg'); }} />

                  {/* Visual presets */}
                  <PersonaCarousel activeId={null} onSelect={(preset) => { setLighting(preset.lighting); setCamera(preset.camera); setBg(preset.bg); }} />

                  {/* Prompt */}
                  <div className="max-w-3xl relative mt-4">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Inject custom directorial constraints (e.g., 'Model is seated on a linen sofa reading a magazine')..."
                      className="w-full bg-white border border-[#E5E0D8] rounded-sm text-[#1C1C1C] p-6 text-sm font-sans placeholder:text-[#6E6A60] focus:outline-none focus:border-[#1C1C1C]/40 transition-colors shadow-sm resize-none min-h-[120px]"
                    />
                  </div>

                  {/* Generate Action */}
                  <div className="flex flex-col md:flex-row md:items-center gap-6 pt-12 border-t border-[#E5E0D8]">
                    <button
                      onClick={handleForge}
                      disabled={!canForge || isProcessing}
                      className={`px-12 py-5 rounded-sm text-[11px] font-mono uppercase tracking-widest transition-all duration-500 ${
                        canForge
                          ? 'bg-[#1C1C1C] text-white hover:bg-[#6E6A60] hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5'
                          : 'bg-[#F2EFE9] text-[#6E6A60] border border-[#E5E0D8] cursor-not-allowed'
                      }`}
                    >
                      Produce Editorial Grid
                    </button>
                    {!canForge ? (
                       <p className="text-red-500 text-[10px] font-mono uppercase tracking-widest">
                       Insufficient credits — <a href="/pricing" className="underline hover:text-red-400">Add limit →</a>
                     </p>
                    ) : (
                      <span className="text-[10px] font-mono text-[#6E6A60] uppercase tracking-widest">
                        Consumes {creditsPerRun} credits
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Forge results */}
        {step === 'preview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, ease: "easeOut" }} className="w-full">
            {isProcessing && forgeGrid.length === 0 ? (
              <ForgeActivation artifactImg="/assets/icon_clothing.png" intakeImg={modelUrl} />
            ) : engineError ? (
              <div className="p-16 border border-red-200 bg-red-50 flex flex-col items-center text-center max-w-2xl mx-auto gap-6 rounded-sm">
                <div className="text-[10px] font-mono text-red-500 tracking-[0.4em] uppercase">Engine Interruption</div>
                <p className="text-[#1C1C1C] font-mono text-sm leading-relaxed break-all">{engineError}</p>
                <button
                  className="px-8 py-3 bg-red-500 text-[#1C1C1C] rounded-sm text-[10px] font-mono uppercase tracking-widest hover:bg-red-600 transition-all"
                  onClick={() => { setEngineError(null); setForgeGrid([]); setStep('upload'); }}
                >
                  Return to Input
                </button>
              </div>
            ) : forgeGrid.length > 0 ? (
              <div className="relative w-full">
                <SovereignForge assets={forgeGrid} onSelectAsset={(id) => { setActiveAsset(id); setDeployError(null); }} onRefineAsset={(id) => setRefineAsset(id)} deployedIds={deployedIds} isGenerating={isProcessing} />
                {activeAsset !== null && (
                  <MasterpieceReveal
                    masterImage={forgeGrid[activeAsset - 1]}
                    assetId={activeAsset}
                    onClose={() => setActiveAsset(null)}
                    isDeploying={isDeploying}
                    deployError={deployError}
                    onDeploy={async () => {
                      setIsDeploying(true);
                      setDeployError(null);
                      const item: VaultItem = {
                        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                        image: forgeGrid[activeAsset - 1],
                        storagePath: null, 
                        name: `Editorial Run — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                        date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' }),
                        createdAt: Date.now(),
                        category: 'clothing',
                        anchors: ['FULL_OUTFIT'],
                        strategy,
                        skinTone,
                        lighting,
                        camera,
                        bg,
                        prompt,
                      };
                      try {
                        await deployToVault(item);
                        setDeployedIds(prev => new Set([...prev, activeAsset]));
                        setActiveAsset(null); 
                      } catch (err: any) {
                        setDeployError(err?.message || 'Storage save failed.');
                      } finally {
                        setIsDeploying(false);
                      }
                    }}
                  />
                )}
                {refineAsset !== null && forgeGrid[refineAsset - 1] && (
                  <IterationPanel
                    masterImage={forgeGrid[refineAsset - 1]}
                    onClose={() => setRefineAsset(null)}
                  />
                )}
              </div>
            ) : null}

            {/* Back button */}
            {!isProcessing && (
              <div className="mt-16 pt-8 border-t border-[#E5E0D8] text-center md:text-left">
                <button
                  onClick={() => { setStep('upload'); setForgeGrid([]); setEngineError(null); }}
                  className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#6E6A60] hover:text-[#1C1C1C] transition-colors"
                >
                  Configure New Sequence
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </Layout>
    {showCreativeProps && (
      <CreativePropsGallery
        onSelect={handleCreativePropSelect}
        onClose={() => setShowCreativeProps(false)}
      />
    )}
  </div>
  );
}
