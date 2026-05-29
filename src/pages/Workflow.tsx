import { useState, useEffect } from 'react';
import { luxSound } from '../lib/useLuxSound';
import { useParams, Link, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { SovereignIntake } from '../components/SovereignIntake';
import { PersonaCarousel } from '../components/PersonaCarousel';
import { ForgeActivation } from '../components/ForgeActivation';
import { MasterpieceReveal } from '../components/MasterpieceReveal';
import SovereignForge from '../components/SovereignForge';
import IterationPanel from '../components/IterationPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { PaperBananaProtocol } from '../lib/paper-banana-protocol/core';
import { LocationPresetPicker } from '../components/LocationPresetPicker';
import type { LocationPreset } from '../lib/locationPresets';
import type { PBPRequest, PBPAgentReport, PromptPayload } from '../lib/paper-banana-protocol/core';
import { RenderEngine } from '../lib/render-engine';
import { CriticAgent } from '../lib/paper-banana-protocol/critic';
import { useSovereignStore } from '../store/useSovereignStore';
import type { VaultItem } from '../store/useSovereignStore';
import { CreativePropsGallery } from '../components/CreativePropsGallery';
import type { CreativeProp } from '../lib/creativeProps';
import { useAuth } from '../contexts/AuthContext';

type Step = 'ingestion' | 'model-strategy' | 'preview';

/**
 * Sovereign Workflow - The High-Fidelity Generation Engine
 * Focus: Asymmetrical Editorial Grid & Atmospheric Transitions.
 */

const PHOTO_STYLE_OPTIONS = [
    { id: 'HIGH_FASHION_EDITORIAL', name: 'High Fashion Editorial', pub: 'Vogue · i-D · Dazed' },
    { id: 'LUXURY_BRAND_CAMPAIGN', name: 'Luxury Brand Campaign', pub: 'Chanel · Dior · LV' },
    { id: 'STREET_STYLE_CANDID', name: 'Street Fashion', pub: 'Sartorialist · Highsnobiety' },
    { id: 'AVANT_GARDE_COUTURE', name: 'Avant Garde Couture', pub: 'Tim Walker · Nick Knight' },
    { id: 'BEAUTY_EDITORIAL', name: 'Beauty Editorial', pub: 'Vogue Beauty · Allure' },
    { id: 'LIFESTYLE_EDITORIAL', name: 'Lifestyle Editorial', pub: 'Kinfolk · Reformation' },
    { id: 'FINE_ART_PORTRAIT', name: 'Fine Art Portrait', pub: 'Leibovitz · MoMA' },
    { id: 'FASHION_MAGAZINE_SPREAD', name: 'Magazine Spread', pub: 'BAZAAR · Elle' },
    { id: 'LUXURY_CATALOG', name: 'Luxury Catalog', pub: 'Net-a-Porter · Ssense' },
];
const CAMERA_FORMAT_OPTIONS = [
    'Phase One 150MP · 80mm', 'Hasselblad H6D · 100mm', 'Leica M · 35mm Film',
    'Canon 1DX · 85mm', 'Nikon D6 · 135mm', 'Sony A1 · 50mm',
    'Leica SL2 · 24mm Wide', 'Contax 645 · 80mm Film', '4x5 Large Format Film',
    'Polaroid · Instant Film', '35mm Disposable Film', 'Canon AE-1 · 50mm Film',
];
const COLOR_GRADE_OPTIONS = [
    'Auto', 'Kodak Portra 400', 'Fuji Pro 400H', 'Kodak Ektar 100',
    'Cinematic Teal & Orange', 'Bleach Bypass', 'Cross Process',
    'High Contrast B&W', 'Gritty B&W Film', 'Vintage Warm',
    'Nordic Matte', 'Matte Fade Editorial', 'Hyperreal', 'True Life Accurate',
];

const ConsoleSelect = ({ label, value, options, onChange, disabled }: { label: string, value: string, options: string[], onChange: (val: string) => void, disabled?: boolean }) => (
    <div className={`flex flex-col gap-1 transition-opacity duration-300 ${disabled ? 'opacity-20 pointer-events-none select-none' : ''}`}>
        <label className="text-[9px] font-mono uppercase tracking-wider text-[#1C1C1C]/50">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="minimal-select w-full bg-transparent border-0 border-b border-[#1C1C1C]/15 focus:border-[#D4AF37] focus:ring-0 px-0 py-1 text-xs text-[#1C1C1C] appearance-none cursor-pointer transition-colors duration-200 disabled:cursor-not-allowed"
        >
            {options.map(opt => <option key={opt} value={opt} className="bg-white text-[#1C1C1C]">{opt}</option>)}
        </select>
    </div>
);

export default function Workflow() {
    const { categoryId } = useParams();
    const location = useLocation();
    const deployToVault = useSovereignStore((state) => state.deployToVault);
    const { canForge, freeRunAvailable } = useAuth();
    const [showUpgradeWall, setShowUpgradeWall] = useState(false);

    // If navigated from Vault "Create New Variations", prefill will carry the original settings
    const prefill = (location.state as { prefill?: VaultItem & { autoExecute?: boolean } })?.prefill;

    const [step, setStep] = useState<Step>('ingestion');
    const isKinetic = categoryId === 'barber' || categoryId === 'clothing';
    const theme = isKinetic ? 'noir' : 'aura';
    const [strategy, setStrategy] = useState<'keep' | 'change' | null>(prefill?.strategy || null);
    const [assetFile, setAssetFile] = useState<File | null>(null);
    const [intakeImg, setIntakeImg] = useState<string>('');

    // Model Config State — seeded from vault prefill if present
    const [skinTone, setSkinTone] = useState(prefill?.skinTone || 'Porcelain');
    const [lighting, setLighting] = useState(prefill?.lighting || 'Clean & Even');
    const [camera, setCamera] = useState(prefill?.camera || 'Soft Background (85mm)');
    const [bg, setBg] = useState(prefill?.bg || 'studio-grey');
    const [prompt, setPrompt] = useState(prefill?.prompt || '');
    const [photoDirection, setPhotoDirection] = useState('full-spread');
    const [colorGrade, setColorGrade] = useState('Auto');
    const [cameraFormat, setCameraFormat] = useState('Sony A1 · 50mm');
    const [gender, setGender] = useState('Female');
    const [modelArchetype, setModelArchetype] = useState('High Fashion');
    const [poseDirection, setPoseDirection] = useState('Auto');
    const [expression, setExpression] = useState('Auto');
    const [ageRange, setAgeRange] = useState('Prime Editorial (25–35)');
    const [shotType, setShotType] = useState('Full Body');
    const [atmosphere, setAtmosphere] = useState('Auto');
    const [styling, setStyling] = useState('Auto');

    // Anchor: direct map from category route to specific anchor ID
    const CATEGORY_ANCHOR_MAP: Record<string, string> = {
        hair: 'HAIR', barber: 'BARBER', makeup: 'MAKEUP', nails: 'NAILS',
        clothing: 'FULL_OUTFIT', accessories: 'BELT',
    };
    const CATEGORY_GROUP_MAP: Record<string, string> = {
        clothing: 'CLOTHING', accessories: 'ACCESSORIES',
    };
    const anchorDefault = CATEGORY_ANCHOR_MAP[categoryId || 'hair'] || 'HAIR';
    const [anchors, setAnchors] = useState<string[]>(prefill?.anchors || [anchorDefault]);
    const [expandedGroup, setExpandedGroup] = useState<string | null>(
        CATEGORY_GROUP_MAP[categoryId || ''] || null
    );

    // When coming from vault, use the saved image as the generation source
    useEffect(() => {
        if (!prefill?.image) return;
        
        const loadPrefill = async () => {
            setIntakeImg(prefill.image);
            const [header, data] = prefill.image.split(',');
            const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
            const binary = atob(data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            
            const file = new File([bytes], 'vault-source.jpg', { type: mime });
            setAssetFile(file);
            setStep('model-strategy');
        };

        loadPrefill();
    }, [prefill]);

    const CLOTHING_ANCHOR_IDS = ['SHIRT', 'PANTS', 'SHORTS', 'SWIMWEAR', 'HAT', 'FULL_OUTFIT'];

    const toggleAnchor = (id: string) => {
        setAnchors(prev =>
            prev.includes(id)
                ? prev.length > 1 ? prev.filter(a => a !== id) : prev // keep at least one
                : [...prev, id]
        );
    };

    // Visual preset state — separate from generation strategy
    const [visualPreset, setVisualPreset] = useState<string | null>(null);
    const [locationPreset, setLocationPreset] = useState<LocationPreset | null>(null);

    // Creative Props Gallery
    const [showCreativeProps, setShowCreativeProps] = useState(false);
    const [activePropId, setActivePropId] = useState<string | null>(null);

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

    // PBP Execution State
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployedIds, setDeployedIds] = useState<Set<number>>(new Set());
    const [deployError, setDeployError] = useState<string | null>(null);
    const [, setAgentReports] = useState<PBPAgentReport[]>([]);
    const [finalPrompt, setFinalPrompt] = useState('');
    const [forgeGrid, setForgeGrid] = useState<string[]>([]);
    const [activeAssetId, setActiveAssetId] = useState<number | null>(null);
    const [refineAssetId, setRefineAssetId] = useState<number | null>(null);
    const [engineError, setEngineError] = useState<string | null>(null);

    // [DNA_AUTO_EXECUTE] — Coming from Vault with autoExecute flag
    useEffect(() => {
        if (prefill?.autoExecute && assetFile && !isProcessing && forgeGrid.length === 0) {
            console.log("[VAULT] Auto-Executing Generation Stage 4...");
            setStep('preview');
            setTimeout(() => executeProtocol(), 100);
        }
    }, [assetFile, prefill]); // eslint-disable-line react-hooks/exhaustive-deps

    const nextStep = () => {
        if (step === 'ingestion' && assetFile) setStep('model-strategy');
        if (step === 'model-strategy' && strategy) {
            if (!canForge()) { setShowUpgradeWall(true); return; }
            setStep('preview');
            setTimeout(() => executeProtocol(), 50);
        }
    };

    const handleAssetUpload = (file: File) => {
        setAssetFile(file);
        setIntakeImg(URL.createObjectURL(file));
        setTimeout(() => {
            setStep('model-strategy');
        }, 800);
    };

    const executeProtocol = async () => {
        if (!assetFile) return;

        setIsProcessing(true);
        setEngineError(null);
        setAgentReports([]);

        const request: PBPRequest = {
            category: categoryId || 'Asset',
            assetFile: assetFile,
            strategy: (strategy || 'change') as 'change' | 'keep',
            config: {
                skinTone,
                lighting,
                camera,
                background: bg,
                userPrompt: prompt
            }
        };

        try {
            const payload: PromptPayload = await PaperBananaProtocol.execute(request, (report) => {
                setAgentReports(prev => [...prev, report]);
            });
            setFinalPrompt(payload.native_prompt);

            let generatedGrid: string[] = [];

            try {
                // Instantiating the proxy engine. The key is completely absent from the frontend payload.
                const engine = new RenderEngine('');

                // Convert uploaded DNA into Base64 for Image-to-Image structural mapping
                const getBase64 = (f: File): Promise<string> => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(f);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = () => reject(new Error(`IMAGE_READ_FAILED: "${f.name}" could not be loaded. If this file is stored in OneDrive, right-click it → "Always keep on this device" to download it locally, then retry. Otherwise the file may be corrupted — try re-saving or using a different photo.`));
                });

                // [DNA_COMPRESSION_PROTOCOL] — Ensure high-fidelity under Vercel's 4.5MB limit
                const compressImage = (base64: string, maxMB: number = 2.5): Promise<string> => new Promise((resolve) => {
                    const img = new Image();
                    img.src = base64;
                    img.onerror = () => resolve(base64); // fallback: return original if canvas load fails
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;

                        // Maintain aspect ratio but ensure it's not giant
                        const maxDim = 2048;
                        if (width > maxDim || height > maxDim) {
                            if (width > height) {
                                height = (height / width) * maxDim;
                                width = maxDim;
                            } else {
                                width = (width / height) * maxDim;
                                height = maxDim;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx?.drawImage(img, 0, 0, width, height);

                        // Quality iteration loop to find the sweet spot under 3MB
                        let quality = 0.95;
                        let result = canvas.toDataURL('image/jpeg', quality);
                        while (result.length > maxMB * 1024 * 1024 && quality > 0.1) {
                            quality -= 0.05;
                            result = canvas.toDataURL('image/jpeg', quality);
                        }
                        console.log(`[DNA_PROTOCOL] Compressed to ${(result.length / 1024 / 1024).toFixed(2)}MB with q=${quality.toFixed(2)}`);
                        resolve(result);
                    };
                });

                const sourceBase64 = await getBase64(assetFile);
                const optimizedBase64 = await compressImage(sourceBase64);

                if (!optimizedBase64 || optimizedBase64.length < 100) throw new Error("DNA_MISSING: Payload failed.");

                generatedGrid = await engine.executeMantisLoop(payload.native_prompt, {
                    aspect_ratio: payload.parameters.aspect_ratio,
                    fidelity: payload.parameters.fidelity,
                    isWhaleContract: true,
                    sourceImage: optimizedBase64,
                    anchor: anchors[0],
                    anchors,
                    strategy: strategy || 'change',
                    // Director Console selections — forwarded as locked constraints to forge
                    skinTone,
                    lighting,
                    background: bg,
                    camera,
                    locationPreset: locationPreset?.description,
                    photoDirection,
                    colorGrade: colorGrade !== 'Auto' ? colorGrade : undefined,
                    cameraFormat,
                    gender,
                    modelArchetype: modelArchetype !== 'Auto' ? modelArchetype : undefined,
                    pose: poseDirection !== 'Auto' ? poseDirection : undefined,
                    expression: expression !== 'Auto' ? expression : undefined,
                    ageRange: ageRange !== 'Auto' ? ageRange : undefined,
                    shotType: shotType !== 'Auto' ? shotType : undefined,
                    atmosphere: atmosphere !== 'Auto' ? atmosphere : undefined,
                    styling: styling !== 'Auto' ? styling : undefined,
                    userPrompt: prompt || '',  // raw creative direction — separate from PBP string
                });
            } catch (err: any) {
                console.error("[Mantis] Engine Failure — NO FALLBACK:", err?.message || err);
                setAgentReports(prev => [...prev, {
                    step: 'Mantis Engine',
                    status: 'failed',
                    message: `ENGINE_ERROR: ${err?.message || 'Check Vercel Logs'}`,
                    confidence: 0
                }]);
                throw err; // Fail loud — no mockups.
            }

            // We push the full 6-image permutation into the Sovereign Persistence Forge
            setForgeGrid(generatedGrid);
            luxSound.complete();
            setAgentReports(prev => [...prev, { step: 'Gemini Producer', status: 'verified', message: 'High-Fidelity DNA Render Complete.', confidence: 1.0 }]);

            const audit = await CriticAgent.audit(assetFile, generatedGrid[0]);
            setAgentReports(prev => [...prev, {
                step: 'Developing the Vision',
                status: audit.status === 'REJECTED' ? 'failed' : 'verified',
                message: audit.status === 'REJECTED' ? 'Calibrating Natural Depth...' : 'VISION APPROVED: Ready for the Vault.',
                confidence: audit.status === 'REJECTED' ? 1.0 - audit.structural_dna_score : 1.0
            }]);
        } catch (error: any) {
            const msg = error?.message || 'Unknown forge failure. Check Vercel Function Logs.';
            console.error("[SOVEREIGN] Creation Failed:", msg);
            setEngineError(msg);
        } finally {
            setIsProcessing(false);
            setStep('preview');
        }
    };


    return (
        <>
        <Layout>
            <div data-theme={theme} className="max-w-[1600px] mx-auto px-4 lg:px-12 flex flex-col xl:flex-row gap-16 transition-colors duration-1000 min-h-[80vh] py-12">

                {/* Stage 1: The Tactical Context Sidebar — shows uploaded DNA */}
                <aside className="w-full xl:w-80 flex flex-col items-center justify-center gap-12 order-2 xl:order-1 pt-20">
                    {intakeImg ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full aspect-[3/4] overflow-hidden border border-[#1C1C1C]/12 relative"
                        >
                            {/* Corner marks — framed artwork aesthetic */}
                            <div className="absolute top-2 left-2 w-5 h-5 border-t border-l border-[#D4AF37]/30 pointer-events-none z-10" />
                            <div className="absolute top-2 right-2 w-5 h-5 border-t border-r border-[#D4AF37]/30 pointer-events-none z-10" />
                            <div className="absolute bottom-2 left-2 w-5 h-5 border-b border-l border-[#D4AF37]/30 pointer-events-none z-10" />
                            <div className="absolute bottom-2 right-2 w-5 h-5 border-b border-r border-[#D4AF37]/30 pointer-events-none z-10" />
                            <img src={intakeImg} alt="Source DNA" className="w-full h-full object-cover" />
                        </motion.div>
                    ) : (
                        <motion.img
                            src={`/assets/icon_${categoryId || 'hair'}.png`}
                            className="w-32 object-contain opacity-50 transition-all duration-1000"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        />
                    )}
                    <div className="text-center font-mono text-[9px] uppercase tracking-[0.4em] text-[#D4AF37]/40 border-t border-[#1C1C1C]/8 pt-8 w-3/4">
                        <p>{intakeImg ? 'DNA_LOCKED // SOURCE CONFIRMED' : 'Subject Calibration // 150MP'}</p>
                    </div>
                </aside>

                {/* Stage 2: The Master Workspace */}
                <section className="flex-1 order-1 xl:order-2 overflow-x-hidden">
                    <header className="mb-20 blur-in">
                        <div className="flex items-center gap-3 text-[10px] font-mono text-[#1C1C1C]/45 uppercase tracking-[0.6em] mb-6">
                            <Link to="/" className="hover:text-accent transition-colors">Digital_Atelier</Link>
                            <ChevronRight size={10} className="text-[#1C1C1C]/15" />
                            <span className="text-[#1C1C1C]/65">{categoryId}</span>
                        </div>

                        <h1 className="text-6xl font-serif text-[#1C1C1C] tracking-tighter leading-tight mb-4">
                            {step === 'ingestion' && <><span className="text-accent italic">ATELIER</span> INTAKE</>}
                            {step === 'model-strategy' && <>PERSONA <span className="text-accent italic">STRATEGY</span></>}
                            {step === 'preview' && <><span className="text-accent italic">SUPREME</span> GENERATION</>}
                        </h1>

                        <p className="text-[11px] font-mono text-[#1C1C1C]/55 uppercase tracking-[0.4em] leading-relaxed max-w-xl">
                            {step === 'ingestion' && `Lock your ${categoryId} source. Establishing photographic baseline.`}
                            {step === 'model-strategy' && `Selecting visual philosophy for atmospheric rendering.`}
                            {step === 'preview' && 'Executing the master rendering protocol. Initializing 150MP engine fidelity.'}
                        </p>
                    </header>

                    <main className="relative min-h-[500px]">
                        <AnimatePresence mode="wait">
                            {step === 'ingestion' && (
                                <motion.div
                                    key="ingestion"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <div className="w-full">
                                        <SovereignIntake onUpload={handleAssetUpload} />
                                    </div>
                                </motion.div>
                            )}

                            {step === 'model-strategy' && (
                                <motion.div
                                    key="strategy"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full space-y-12"
                                >
                                    {/* 0. Asset Anchor Selector */}
                                    <div className="space-y-4">
                                        <p className="text-[8px] font-mono uppercase tracking-[0.6em] text-[#1C1C1C]/60 text-center">Subject Anchor // What to Protect</p>

                                        {/* Tier 1 — Direct anchors */}
                                        <div className="flex justify-center flex-wrap gap-3">
                                            {[
                                                { id: 'HAIR', label: 'Hair' },
                                                { id: 'BARBER', label: 'Barber / Fade' },
                                                { id: 'MAKEUP', label: 'Makeup' },
                                                { id: 'NAILS', label: 'Nails' },
                                            ].map(({ id, label }) => (
                                                <button key={id}
                                                    onClick={() => { toggleAnchor(id); setExpandedGroup(null); }}
                                                    className={`px-5 py-2 border text-[9px] font-mono uppercase tracking-[0.2em] transition-all duration-300 ${anchors.includes(id) ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_12px_rgba(212,175,55,0.18)]' : 'border-[#1C1C1C]/12 text-[#1C1C1C]/45 hover:text-[#1C1C1C]/65 hover:border-[#1C1C1C]/20'}`}>
                                                    [ {label} ]
                                                </button>
                                            ))}

                                            {/* Clothing group toggle — defaults to FULL_OUTFIT */}
                                            <button
                                                onClick={() => setExpandedGroup(g => {
                                                    const next = g === 'CLOTHING' ? null : 'CLOTHING';
                                                    if (next === 'CLOTHING' && !anchors.some(a => CLOTHING_ANCHOR_IDS.includes(a))) {
                                                        setAnchors(prev => [...prev.filter(a => !CLOTHING_ANCHOR_IDS.includes(a)), 'FULL_OUTFIT']);
                                                    }
                                                    return next;
                                                })}
                                                className={`px-5 py-2 border text-[9px] font-mono uppercase tracking-[0.2em] transition-all duration-300 ${expandedGroup === 'CLOTHING' || anchors.some(a => CLOTHING_ANCHOR_IDS.includes(a)) ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_12px_rgba(212,175,55,0.18)]' : 'border-[#1C1C1C]/12 text-[#1C1C1C]/45 hover:text-[#1C1C1C]/65 hover:border-[#1C1C1C]/20'}`}>
                                                [ Clothing ▾ ]
                                            </button>

                                            {/* Accessories group toggle */}
                                            <button
                                                onClick={() => setExpandedGroup(g => g === 'ACCESSORIES' ? null : 'ACCESSORIES')}
                                                className={`px-5 py-2 border text-[9px] font-mono uppercase tracking-[0.2em] transition-all duration-300 ${expandedGroup === 'ACCESSORIES' ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_12px_rgba(212,175,55,0.18)]' : 'border-[#1C1C1C]/12 text-[#1C1C1C]/45 hover:text-[#1C1C1C]/65 hover:border-[#1C1C1C]/20'}`}>
                                                [ Accessories ▾ ]
                                            </button>
                                        </div>

                                        {/* Tier 2 — Clothing subcategories */}
                                        {expandedGroup === 'CLOTHING' && (
                                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                                                className="flex justify-center flex-wrap gap-2 pt-2 pl-4 border-l border-[#D4AF37]/20 ml-4">
                                                {[
                                                    { id: 'SHIRT', label: 'Shirt / Blouse' },
                                                    { id: 'PANTS', label: 'Pants / Trousers' },
                                                    { id: 'SHORTS', label: 'Shorts' },
                                                    { id: 'SWIMWEAR', label: 'Swimwear' },
                                                    { id: 'HAT', label: 'Hat / Headwear' },
                                                    { id: 'FULL_OUTFIT', label: 'Full Outfit' },
                                                ].map(({ id, label }) => (
                                                    <button key={id}
                                                        onClick={() => toggleAnchor(id)}
                                                        className={`px-4 py-1.5 border text-[8px] font-mono uppercase tracking-[0.2em] transition-all duration-200 ${anchors.includes(id) ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_12px_rgba(212,175,55,0.18)]' : 'border-[#1C1C1C]/12 text-[#1C1C1C]/55 hover:text-[#1C1C1C]/60 hover:border-[#1C1C1C]/20'}`}>
                                                        {label}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}

                                        {/* Tier 2 — Accessories subcategories */}
                                        {expandedGroup === 'ACCESSORIES' && (
                                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                                                className="flex justify-center flex-wrap gap-2 pt-2 pl-4 border-l border-[#D4AF37]/20 ml-4">
                                                {[
                                                    { id: 'BELT', label: 'Belt' },
                                                    { id: 'SHOES', label: 'Shoes' },
                                                    { id: 'EARRINGS', label: 'Earrings' },
                                                    { id: 'NECKLACE', label: 'Necklace' },
                                                    { id: 'BRACELET', label: 'Bracelet' },
                                                    { id: 'WATCH', label: 'Watch' },
                                                    { id: 'RING', label: 'Ring' },
                                                ].map(({ id, label }) => (
                                                    <button key={id}
                                                        onClick={() => toggleAnchor(id)}
                                                        className={`px-4 py-1.5 border text-[8px] font-mono uppercase tracking-[0.2em] transition-all duration-200 ${anchors.includes(id) ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_12px_rgba(212,175,55,0.18)]' : 'border-[#1C1C1C]/12 text-[#1C1C1C]/55 hover:text-[#1C1C1C]/60 hover:border-[#1C1C1C]/20'}`}>
                                                        {label}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}

                                        {/* Selected anchors readout */}
                                        {anchors.length > 0 && (
                                            <p className="text-center text-[8px] font-mono text-[#D4AF37]/40 tracking-[0.4em] uppercase pt-1">
                                                Locked → {anchors.map(a => a.replace(/_/g, ' ')).join(' + ')}
                                            </p>
                                        )}
                                    </div>

                                    {/* STEP 2 — Identity Mode */}
                                    <div className="space-y-3">
                                        <p className="text-[8px] font-mono uppercase tracking-[0.5em] text-[#1C1C1C]/60 text-center">Generation Mode</p>
                                        <div className="flex justify-center gap-4">
                                            <button
                                                onClick={() => setStrategy('keep')}
                                                className={`px-8 py-3 border text-[10px] font-mono uppercase tracking-[0.2em] transition-colors ${strategy === 'keep' ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_12px_rgba(212,175,55,0.18)]' : 'border-[#1C1C1C]/12 text-[#1C1C1C]/55 hover:text-[#1C1C1C]/80'}`}
                                            >
                                                [ Preserve Original ]
                                            </button>
                                            <button
                                                onClick={() => setStrategy('change')}
                                                className={`px-8 py-3 border text-[10px] font-mono uppercase tracking-[0.2em] transition-colors ${strategy === 'change' ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5 shadow-[0_0_12px_rgba(212,175,55,0.18)]' : 'border-[#1C1C1C]/12 text-[#1C1C1C]/55 hover:text-[#1C1C1C]/80'}`}
                                            >
                                                [ AI Reimagination ]
                                            </button>
                                        </div>
                                    </div>

                                    {/* ── CREATIVE PROPS ── */}
                                    <div className="flex flex-col items-center gap-3 pt-1">
                                        <button
                                            onClick={() => setShowCreativeProps(true)}
                                            className="px-8 py-3 border text-[10px] font-mono uppercase tracking-[0.3em] transition-all duration-300 hover:border-[#D4AF37]/60 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5"
                                            style={{ borderColor: activePropId ? 'rgba(212,175,55,0.5)' : 'rgba(28,28,28,0.2)', color: activePropId ? '#D4AF37' : 'rgba(28,28,28,0.5)' }}
                                        >
                                            ✦ Creative Props
                                        </button>
                                        {activePropId && (
                                            <p className="text-[7px] font-mono uppercase tracking-[0.3em] text-[#D4AF37]/50">
                                                Active: {activePropId.replace(/-/g, ' ')}
                                            </p>
                                        )}
                                    </div>

                                    {/* ── DIVIDER ── */}
                                    <div className="border-t border-[#1C1C1C]/8" />

                                    {/* Photography Direction — 10-card style picker */}
                                    <div className="space-y-4">
                                        <div className="text-center space-y-1">
                                            <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-[#D4AF37]/50">Step 2 — Photography Direction</p>
                                            <p className="text-[8px] font-mono uppercase tracking-[0.3em] text-[#1C1C1C]/60">Choose a style or let the system cycle all 6</p>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                            <button
                                                onClick={() => setPhotoDirection('full-spread')}
                                                className={`p-3 border text-left transition-all duration-300 ${photoDirection === 'full-spread' ? 'border-[#D4AF37]/70 bg-[#D4AF37]/8' : 'border-[#1C1C1C]/8 hover:border-[#1C1C1C]/25'}`}
                                            >
                                                <p className={`text-[8px] font-mono uppercase tracking-[0.2em] mb-1 leading-tight ${photoDirection === 'full-spread' ? 'text-[#D4AF37]' : 'text-[#1C1C1C]/60'}`}>Full Editorial Spread</p>
                                                <p className="text-[6px] font-mono text-[#1C1C1C]/60 uppercase tracking-[0.1em]">All 6 styles · Auto</p>
                                            </button>
                                            {PHOTO_STYLE_OPTIONS.map(style => (
                                                <button
                                                    key={style.id}
                                                    onClick={() => setPhotoDirection(style.id)}
                                                    className={`p-3 border text-left transition-all duration-300 ${photoDirection === style.id ? 'border-[#D4AF37]/70 bg-[#D4AF37]/8' : 'border-[#1C1C1C]/8 hover:border-[#1C1C1C]/25'}`}
                                                >
                                                    <p className={`text-[8px] font-mono uppercase tracking-[0.15em] mb-1 leading-tight ${photoDirection === style.id ? 'text-[#D4AF37]' : 'text-[#1C1C1C]/60'}`}>{style.name}</p>
                                                    <p className="text-[6px] font-mono text-[#1C1C1C]/60 leading-relaxed">{style.pub}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="border-t border-[#1C1C1C]/8" />

                                    {/* STEP 3 — Visual Preset (pick the vibe first) */}
                                    <div className="space-y-4">
                                        <div className="text-center space-y-1">
                                            <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-[#D4AF37]/50">Step 3 — Choose Your Vibe</p>
                                            <p className="text-[8px] font-mono uppercase tracking-[0.3em] text-[#1C1C1C]/60">Visual preset · sets lighting, camera & atmosphere</p>
                                        </div>
                                        <PersonaCarousel
                                            activeId={visualPreset}
                                            onSelect={(preset) => {
                                                setVisualPreset(preset.id);
                                                setLighting(preset.lighting);
                                                setCamera(preset.camera);
                                                setBg(preset.bg);
                                                // skinTone is intentionally NOT set from presets.
                                                // When strategy==='keep', ConsoleSelect is disabled.
                                                // When strategy==='change', user controls it manually.
                                            }}
                                        />
                                    </div>

                                    {/* ── DIVIDER ── */}
                                    <div className="border-t border-[#1C1C1C]/8" />

                                    {/* STEP 4 — Location (where is the shoot?) */}
                                    <div className="space-y-4">
                                        <div className="text-center space-y-1">
                                            <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-[#D4AF37]/50">Step 3 — Set the Scene</p>
                                            <p className="text-[8px] font-mono uppercase tracking-[0.3em] text-[#1C1C1C]/60">100 editorial locations · or leave as studio</p>
                                        </div>
                                        <div className="max-w-2xl mx-auto">
                                            <LocationPresetPicker
                                                selected={locationPreset}
                                                onSelect={(preset) => {
                                                    setLocationPreset(preset);
                                                    if (preset) setBg('custom-bg');
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* ── DIVIDER ── */}
                                    <div className="border-t border-[#1C1C1C]/8" />

                                    {/* STEP 5 — Fine-tune (optional, collapses visually) */}
                                    <div className="space-y-6">
                                        <div className="text-center space-y-1">
                                            <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-[#1C1C1C]/60">Step 4 — Fine-Tune <span className="text-[#1C1C1C]/15">(optional)</span></p>
                                            <p className="text-[8px] font-mono uppercase tracking-[0.3em] text-[#1C1C1C]/50">Override any detail from your preset</p>
                                        </div>

                                        {/* Director Console — three sections */}
                                        <div className="max-w-3xl mx-auto border border-[#1C1C1C]/8 divide-y divide-[#1C1C1C]/6">

                                            {/* Section 1 — Model Casting */}
                                            <div className="p-6 space-y-3">
                                                <div className="border-t border-[#1C1C1C]/10 pt-2 mb-2"><span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#1C1C1C]/40 block">Model Casting</span></div>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                                                    <ConsoleSelect label="Gender" value={gender} options={['Female', 'Male', 'Unisex (Androgynous)']} onChange={setGender} disabled={strategy === 'keep'} />
                                                    <ConsoleSelect label="Model Archetype" value={modelArchetype} options={['High Fashion', 'Commercial', 'Androgynous', 'Beauty', 'Curve Editorial', 'Athletic', 'Petite', 'Distinguished']} onChange={setModelArchetype} disabled={strategy === 'keep'} />
                                                    <ConsoleSelect label="Age Range" value={ageRange} options={['Emerging (18–24)', 'Prime Editorial (25–35)', 'Established (35–45)', 'Mature Luxury (45–55)', 'Distinguished (55+)']} onChange={setAgeRange} disabled={strategy === 'keep'} />
                                                    <ConsoleSelect label="Skin Tone" value={skinTone} options={['Fair', 'Porcelain', 'Tan', 'Cinnamon', 'Brown', 'Chocolate', 'Deep']} onChange={setSkinTone} disabled={strategy === 'keep'} />
                                                </div>
                                            </div>

                                            {/* Section 2 — Shoot Direction */}
                                            <div className="p-6 space-y-3">
                                                <div className="border-t border-[#1C1C1C]/10 pt-2 mb-2"><span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#1C1C1C]/40 block">Shoot Direction</span></div>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                                                    <ConsoleSelect label="Expression" value={expression} options={['Auto', 'Fierce', 'Soft Romantic', 'Candid Joy', 'Cold Editorial', 'Introspective', 'Sensual', 'Confident Direct']} onChange={setExpression} />
                                                    <ConsoleSelect label="Pose Direction" value={poseDirection} options={['Auto', 'Power Stand', 'Editorial Lean', 'Walking Motion', 'Seated Drape', 'Over Shoulder', 'Hands Active', 'Full Extension', 'Candid Moment', 'Contraposto', 'Profile Silhouette']} onChange={setPoseDirection} />
                                                    <ConsoleSelect label="Shot Type" value={shotType} options={['Full Body', '3/4 Body', 'Waist Up', 'Portrait', 'Beauty Close', 'Detail Shot', 'Environmental Scale']} onChange={setShotType} />
                                                    <ConsoleSelect label="Atmosphere" value={atmosphere} options={['Auto', 'Golden Hour', 'Overcast Soft', 'Blue Hour', 'Harsh Midday', 'Misty Rain', 'Dramatic Storm', 'Snow Winter', 'Heat Haze']} onChange={setAtmosphere} />
                                                </div>
                                            </div>

                                            {/* Section 3 — Production */}
                                            <div className="p-6 space-y-3">
                                                <div className="border-t border-[#1C1C1C]/10 pt-2 mb-2"><span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#1C1C1C]/40 block">Production</span></div>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                                                    <ConsoleSelect label="Lighting" value={lighting} options={['Clean & Even', 'Sunset Side Glow', 'Deep Shadow', 'Beauty Overhead', 'Moody Cinema', 'Soft Natural']} onChange={setLighting} />
                                                    <ConsoleSelect label="Styling" value={styling} options={['Auto', 'Minimal Clean', 'Full Editorial', 'Street Cast', 'Luxury Campaign', 'Sport Luxe']} onChange={setStyling} />
                                                    <ConsoleSelect label="Color Grade" value={colorGrade} options={COLOR_GRADE_OPTIONS} onChange={setColorGrade} />
                                                    <ConsoleSelect label="Camera Format" value={cameraFormat} options={CAMERA_FORMAT_OPTIONS} onChange={setCameraFormat} />
                                                    <ConsoleSelect label="Studio Backdrop" value={bg === 'custom-bg' ? 'Environmental' : bg.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('-')} options={['Studio-Grey', 'Pitch-Black', 'Editorial-White', 'Environmental']} onChange={(val) => { setBg(val === 'Environmental' ? 'custom-bg' : val.toLowerCase()); if (val !== 'Environmental') setLocationPreset(null); }} />
                                                </div>
                                            </div>

                                        </div>

                                        {/* Custom direction */}
                                        <div className="max-w-2xl mx-auto relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <span className="text-[#D4AF37]/30 text-xs font-mono">{'>'}</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                placeholder="Additional creative direction — e.g. 'model on a red Vespa, racing jacket'"
                                                className="w-full bg-transparent border-b border-[#1C1C1C]/12 focus:border-[#D4AF37]/40 text-[#1C1C1C] py-4 pl-10 pr-4 text-sm font-sans placeholder:text-[#1C1C1C]/50 focus:outline-none transition-colors"
                                            />
                                        </div>
                                        {/* Warn when keep strategy + scene-specific prompt */}
                                        {strategy === 'keep' && prompt.trim().length > 0 && (
                                            <div className="max-w-2xl mx-auto mt-2 px-3 py-2 border border-[#D4AF37]/20 bg-[#D4AF37]/5">
                                                <p className="text-[9px] font-mono text-[#D4AF37]/70 tracking-[0.15em] uppercase">
                                                    Preserve Original locks the model's pose and clothing. For scene props, vehicles, or outfit changes — switch to <button onClick={() => setStrategy('change')} className="underline text-[#D4AF37] hover:text-[#D4AF37]/80 cursor-pointer">AI Reimagination</button>.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {step === 'preview' && (
                                <motion.div
                                    key="preview"
                                    initial={{ opacity: 0, scale: 0.99 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="max-w-[1400px] w-full"
                                >
                                    {isProcessing && forgeGrid.length === 0 ? (
                                        <ForgeActivation artifactImg={`/assets/icon_${categoryId || 'hair'}.png`} intakeImg={intakeImg} />
                                    ) : engineError ? (
                                        <div className="p-16 border border-red-500/30 bg-red-950/20 flex flex-col items-center text-center max-w-2xl mx-auto gap-6">
                                            <div className="text-[10px] font-mono text-red-400 tracking-[0.6em] uppercase">[ ENGINE_FAILURE ]</div>
                                            <p className="text-[#1C1C1C] font-mono text-sm leading-relaxed break-all">{engineError}</p>
                                            <button
                                                className="px-8 py-3 border border-[#D4AF37] text-[#D4AF37] text-[10px] font-mono uppercase tracking-[0.4em] hover:bg-[#D4AF37]/10 transition-all"
                                                onClick={() => { setEngineError(null); setFinalPrompt(''); setStep('model-strategy'); }}
                                            >
                                                [ RETRY_SEQUENCE ]
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-full relative">
                                            {/* 1. The Persistent Forge Grid */}
                                            {forgeGrid.length > 0 && (
                                                <SovereignForge
                                                    assets={forgeGrid}
                                                    theme={theme}
                                                    onSelectAsset={(id) => { setActiveAssetId(id); setDeployError(null); }}
                                                    onRefineAsset={(id) => setRefineAssetId(id)}
                                                    deployedIds={deployedIds}
                                                />
                                            )}

                                            {/* 2. The Kinetic Expansion Overview (Masterpiece Reveal) */}
                                            {activeAssetId !== null && (
                                                <MasterpieceReveal
                                                    masterImage={forgeGrid[activeAssetId - 1]}
                                                    assetId={activeAssetId}
                                                    onClose={() => setActiveAssetId(null)}
                                                    isDeploying={isDeploying}
                                                    deployError={deployError}
                                                    onDeploy={async () => {
                                                        setIsDeploying(true);
                                                        setDeployError(null);
                                                        const categoryLabel = (categoryId || 'creation').charAt(0).toUpperCase() + (categoryId || 'creation').slice(1);
                                                        const vaultItem: VaultItem = {
                                                            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                                                            image: forgeGrid[activeAssetId - 1],
                                                            storagePath: null, // set server-side by vault-deploy
                                                            name: `${categoryLabel} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                                                            date: new Date().toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' }),
                                                            createdAt: Date.now(),
                                                            category: categoryId || 'hair',
                                                            anchors,
                                                            strategy: (strategy || 'change') as 'keep' | 'change',
                                                            skinTone,
                                                            lighting,
                                                            camera,
                                                            bg,
                                                            prompt,
                                                        };
                                                        try {
                                                            await deployToVault(vaultItem);
                                                            setDeployedIds(prev => new Set([...prev, activeAssetId]));
                                                            setActiveAssetId(null); // close modal, stay on grid
                                                        } catch (err: any) {
                                                            console.error('[VAULT] Deploy failed:', err);
                                                            setDeployError(err?.message || 'Save failed — check Firebase Storage & Firestore rules');
                                                        } finally {
                                                            setIsDeploying(false);
                                                        }
                                                    }}
                                                />
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Phase 2 — Iteration Panel */}
                        {refineAssetId !== null && forgeGrid[refineAssetId - 1] && (
                            <IterationPanel
                                masterImage={forgeGrid[refineAssetId - 1]}
                                onClose={() => setRefineAssetId(null)}
                            />
                        )}

                        {/* Universal Control Bar */}
                        <div className="mt-20 pt-10 border-t border-[#1C1C1C]/8 blur-in" style={{ animationDelay: '0.8s' }}>
                            <div className="w-full flex justify-between items-center px-4 md:px-8">
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#1C1C1C]/45 hover:text-[#1C1C1C] transition-colors cursor-pointer"
                                    onClick={() => {
                                        if (step === 'model-strategy') setStep('ingestion');
                                        if (step === 'preview') {
                                            setStep('model-strategy');
                                            // Clear all generation state so Proceed runs fresh
                                            setFinalPrompt('');
                                            setForgeGrid([]);
                                            setActiveAssetId(null);
                                            setEngineError(null);
                                        }
                                    }}
                                    disabled={step === 'ingestion' || (isProcessing && !finalPrompt)}
                                >
                                    [ Return_Sequence ]
                                </motion.button>

                                {step !== 'preview' && step !== 'ingestion' && (
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        className={`relative px-10 py-4 border border-[#1C1C1C]/20 text-[#1C1C1C] text-[10px] font-mono uppercase tracking-[0.4em] transition-all duration-700 hover:border-accent hover:text-accent cursor-pointer ${strategy === null && step === 'model-strategy' ? 'opacity-20 pointer-events-none' : ''}`}
                                        onClick={nextStep}
                                    >
                                        {freeRunAvailable() && step === 'model-strategy' && (
                                            <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-white text-[8px] font-mono px-1.5 py-0.5 tracking-widest uppercase">
                                                1 Free Run
                                            </span>
                                        )}
                                        Proceed
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </main>
                </section>
            </div>
        </Layout>

        {showCreativeProps && (
            <CreativePropsGallery
                onSelect={handleCreativePropSelect}
                onClose={() => setShowCreativeProps(false)}
            />
        )}

        <AnimatePresence>
        {showUpgradeWall && (
            <motion.div
                className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowUpgradeWall(false)}
            >
                <motion.div
                    className="bg-white border border-[#1C1C1C]/10 p-12 max-w-md w-full mx-4 text-center"
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <p className="text-[9px] font-mono uppercase tracking-[0.4em] text-[#1C1C1C]/40 mb-4">Your complimentary run has been used</p>
                    <h2 className="text-2xl font-light text-[#1C1C1C] tracking-wide mb-3">Continue Creating</h2>
                    <p className="text-xs text-[#1C1C1C]/60 font-light leading-relaxed mb-8">
                        Subscribe to unlock unlimited forge runs, full vault access, and priority rendering.
                    </p>
                    <div className="flex flex-col gap-3">
                        {[
                            { tier: 'Aura', price: '$85', credits: '300 credits / mo' },
                            { tier: 'Sovereign', price: '$165', credits: '750 credits + video' },
                            { tier: 'Luminary', price: '$299', credits: '1500 credits + video' },
                        ].map(({ tier, price, credits }) => (
                            <Link
                                key={tier}
                                to="/profile"
                                className="flex items-center justify-between px-6 py-4 border border-[#1C1C1C]/10 hover:border-[#D4AF37] transition-colors duration-300 group"
                                onClick={() => setShowUpgradeWall(false)}
                            >
                                <span className="text-xs font-mono uppercase tracking-[0.3em] text-[#1C1C1C] group-hover:text-[#D4AF37] transition-colors">{tier}</span>
                                <span className="text-[10px] text-[#1C1C1C]/40 font-light">{credits}</span>
                                <span className="text-xs font-light text-[#1C1C1C]">{price}<span className="text-[9px] text-[#1C1C1C]/40">/mo</span></span>
                            </Link>
                        ))}
                    </div>
                    <button
                        className="mt-6 text-[9px] font-mono uppercase tracking-[0.3em] text-[#1C1C1C]/30 hover:text-[#1C1C1C]/60 transition-colors cursor-pointer"
                        onClick={() => setShowUpgradeWall(false)}
                    >
                        [ Dismiss ]
                    </button>
                </motion.div>
            </motion.div>
        )}
        </AnimatePresence>
        </>
    );
}
