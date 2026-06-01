import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  FolderLock, 
  Layers, 
  Users, 
  ShieldCheck, 
  Upload, 
  Sliders, 
  Eye, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import Layout from '../components/Layout';
import { luxSound } from '../lib/useLuxSound';

// Define structural interfaces for our B2B Dashboard
interface SKUItem {
  id: string;
  name: string;
  category: string;
  season: string;
  status: 'locked' | 'processing' | 'drift';
  dnaFidelity: number;
  thumbnail: string;
  referenceImage: string;
}

interface SetInjection {
  id: string;
  name: string;
  intensity: number;
  temp: number;
  softness: number;
  status: string;
  thumbnail: string;
}

interface ModelAnchor {
  id: string;
  name: string;
  agency: string;
  verticals: string[];
  status: 'active' | 'suspended';
  rate: number;
  thumbnail: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'forge' | 'skus' | 'backlot' | 'talent' | 'ledger'>('forge');

  // B2B State Data
  const [skus, setSkus] = useState<SKUItem[]>([
    {
      id: 'sku-001',
      name: 'Black Linen Blazer SS26',
      category: 'Outerwear',
      season: 'Spring/Summer 2026',
      status: 'locked',
      dnaFidelity: 99.8,
      thumbnail: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=300&auto=format&fit=crop',
      referenceImage: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 'sku-002',
      name: 'Silk Slip Dress Resort 27',
      category: 'Dresses',
      season: 'Resort 2027',
      status: 'locked',
      dnaFidelity: 99.2,
      thumbnail: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=300&auto=format&fit=crop',
      referenceImage: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 'sku-003',
      name: 'Cropped Utility Jacket',
      category: 'Jackets',
      season: 'Fall/Winter 2026',
      status: 'processing',
      dnaFidelity: 42.0,
      thumbnail: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=300&auto=format&fit=crop',
      referenceImage: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop'
    },
    {
      id: 'sku-004',
      name: 'Draped Satin Trouser',
      category: 'Pants',
      season: 'Resort 2027',
      status: 'drift',
      dnaFidelity: 84.5,
      thumbnail: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=300&auto=format&fit=crop',
      referenceImage: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=600&auto=format&fit=crop'
    }
  ]);

  const [sets, setSets] = useState<SetInjection[]>([
    {
      id: 'set-001',
      name: 'Amalfi Coastal Terrace',
      intensity: 78,
      temp: 65,
      softness: 45,
      status: 'Mesh Calibrated 100%',
      thumbnail: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 'set-002',
      name: 'Brutalist Milan Gallery',
      intensity: 45,
      temp: 35,
      softness: 90,
      status: 'Mesh Calibrated 100%',
      thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 'set-003',
      name: 'Wet Marble Studio Floor',
      intensity: 90,
      temp: 50,
      softness: 10,
      status: 'Calibrating Spatials...',
      thumbnail: 'https://images.unsplash.com/photo-1582268611958-ebfd161ff975?q=80&w=300&auto=format&fit=crop'
    }
  ]);

  const [talent, setTalent] = useState<ModelAnchor[]>([
    {
      id: 'model-naomi',
      name: 'Naomi Agy-01',
      agency: 'Elite Management',
      verticals: ['High Fashion', 'Couture', 'Tailoring'],
      status: 'active',
      rate: 15,
      thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 'model-jordan',
      name: 'Jordan IMG-77',
      agency: 'IMG Models',
      verticals: ['Streetwear', 'High Fashion', 'Outerwear'],
      status: 'active',
      rate: 15,
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 'model-sasha',
      name: 'Sasha Next-12',
      agency: 'Next Management',
      verticals: ['Swimwear', 'Activewear'],
      status: 'active',
      rate: 18,
      thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&auto=format&fit=crop'
    }
  ]);

  // Campaign Forge Controls State
  const [selectedSku, setSelectedSku] = useState<string>('sku-001');
  const [selectedModel, setSelectedModel] = useState<string>('model-naomi');
  const [selectedSet, setSelectedSet] = useState<string>('set-001');
  const [selectedScene, setSelectedScene] = useState<string>('scene-tokyo-cyberpunk');
  const [outputMode, setOutputMode] = useState<'still' | 'video'>('still');

  // Generation Simulator State
  const [isForging, setIsForging] = useState(false);
  const [forgeStep, setForgeStep] = useState<string>('');
  const [forgeProgress, setForgeProgress] = useState(0);
  const [slotsData, setSlotsData] = useState<{ id: number; url: string; ready: boolean }[]>([]);

  // 1,000 Scene Moat List Sample
  const SCENES = [
    { id: 'scene-tokyo-cyberpunk', name: 'Tokyo Cyberpunk Alley (Wet Neon & Brutalism)' },
    { id: 'scene-mediterranean-villa', name: 'Mediterranean Cliffside Villa (Sunset Light & Limestone)' },
    { id: 'scene-parisian-haussmann', name: 'Parisian Haussmann Balcony (Muted Gray & Diffuse Light)' },
    { id: 'scene-brutalist-concrete', name: 'Brutalist Concrete Colonnade (High Contrast Shadows)' },
    { id: 'scene-icelandic-basalt', name: 'Icelandic Basalt Columns (Mist & Charcoal Dunes)' },
    { id: 'scene-desert-monolith', name: 'Nevada Desert Monolith (Golden Hour Reflection)' }
  ];

  // Upload state mock
  const [uploadingSku, setUploadingSku] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);

  const simulateSkuUpload = () => {
    setUploadingSku(true);
    setUploadStep(1);
    luxSound.click();
    
    setTimeout(() => {
      setUploadStep(2); // DNA extraction
      setTimeout(() => {
        setUploadStep(3); // Pre-pass anchor
        setTimeout(() => {
          const newSku: SKUItem = {
            id: `sku-${Date.now()}`,
            name: 'Tailored Wool Trenchcoat SS26',
            category: 'Outerwear',
            season: 'Spring/Summer 2026',
            status: 'locked',
            dnaFidelity: 99.6,
            thumbnail: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=300&auto=format&fit=crop',
            referenceImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop'
          };
          setSkus(prev => [newSku, ...prev]);
          setUploadingSku(false);
          setUploadStep(0);
        }, 1500);
      }, 1500);
    }, 1200);
  };

  const handleStartForge = () => {
    if (isForging) return;
    setIsForging(true);
    setForgeProgress(0);
    setForgeStep('Agent 01: Forensic DNA extraction locks active');
    setSlotsData(Array.from({ length: 6 }).map((_, i) => ({ id: i + 1, url: '', ready: false })));
    luxSound.click();

    // Pipeline simulation
    setTimeout(() => {
      setForgeStep('Agent 01b-01e: Spatial Anchor Pre-pass isolations finished');
      setForgeProgress(20);
      
      setTimeout(() => {
        setForgeStep('Agent 01f/g: Vertex AI VTO orchestration pipeline running');
        setForgeProgress(40);
        
        setTimeout(() => {
          setForgeStep('Agent 02.5: Consistency Auditor locks identity/skin across 6 slots');
          setForgeProgress(60);
          
          setTimeout(() => {
            setForgeStep('Agent 03: Generating 6 editorial assets concurrently (SSE stream)');
            setForgeProgress(85);

            // Stream slots one by one
            const sampleImages = [
              'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=600&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=600&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop'
            ];

            sampleImages.forEach((img, idx) => {
              setTimeout(() => {
                setSlotsData(prev => prev.map((slot, sIdx) => sIdx === idx ? { ...slot, url: img, ready: true } : slot));
                if (idx === 5) {
                  setForgeStep('Forge Complete. 6 High-Fashion Campaign Assets Ready.');
                  setForgeProgress(100);
                  setIsForging(false);
                }
              }, (idx + 1) * 800);
            });

          }, 1500);
        }, 1500);
      }, 1500);
    }, 1500);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans select-none">
        
        {/* TOP STATUS BAR */}
        <div className="border-b border-white/[0.08] px-6 py-4 bg-[#07070a]/90 backdrop-blur-md flex items-center justify-between z-10">
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-mono tracking-[0.4em] uppercase text-[#B8952A]">Brand Workspace</span>
            <span className="h-4 w-[1px] bg-white/10"></span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-mono text-white/50">Edge Servers: Ready</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs font-mono">
            <div>
              <span className="text-white/40">Tier: </span>
              <span className="text-[#B8952A] font-semibold">Sovereign Enterprise</span>
            </div>
            <div>
              <span className="text-white/40">Credits Available: </span>
              <span>12,450 / 15,000</span>
            </div>
          </div>
        </div>

        {/* MAIN LAYOUT WRAPPER */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* RUNWAY SIDEBAR */}
          <aside className="w-64 border-r border-white/[0.08] bg-[#060608] flex flex-col justify-between py-8 px-4 shrink-0">
            <div className="flex flex-col gap-10">
              <div className="px-4">
                <h1 className="text-2xl font-serif tracking-[0.2em] text-white font-normal uppercase">
                  LUXAURA
                </h1>
                <p className="text-[8px] font-mono tracking-[0.3em] uppercase text-[#B8952A] mt-1">Creation Studio 2</p>
              </div>

              {/* Sidebar Navigation */}
              <nav className="flex flex-col gap-2">
                <button 
                  onClick={() => { setActiveTab('forge'); luxSound.hover(); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded text-sm font-medium tracking-wide transition-all ${
                    activeTab === 'forge' 
                      ? 'bg-gradient-to-r from-[#B8952A]/15 to-transparent border-l-2 border-[#B8952A] text-white' 
                      : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <Sparkles size={16} className={activeTab === 'forge' ? 'text-[#B8952A]' : ''} />
                  Studio Forge
                </button>
                <button 
                  onClick={() => { setActiveTab('skus'); luxSound.hover(); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded text-sm font-medium tracking-wide transition-all ${
                    activeTab === 'skus' 
                      ? 'bg-gradient-to-r from-[#B8952A]/15 to-transparent border-l-2 border-[#B8952A] text-white' 
                      : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <FolderLock size={16} className={activeTab === 'skus' ? 'text-[#B8952A]' : ''} />
                  SKU Vault
                </button>
                <button 
                  onClick={() => { setActiveTab('backlot'); luxSound.hover(); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded text-sm font-medium tracking-wide transition-all ${
                    activeTab === 'backlot' 
                      ? 'bg-gradient-to-r from-[#B8952A]/15 to-transparent border-l-2 border-[#B8952A] text-white' 
                      : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <Layers size={16} className={activeTab === 'backlot' ? 'text-[#B8952A]' : ''} />
                  Virtual Backlot
                </button>
                <button 
                  onClick={() => { setActiveTab('talent'); luxSound.hover(); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded text-sm font-medium tracking-wide transition-all ${
                    activeTab === 'talent' 
                      ? 'bg-gradient-to-r from-[#B8952A]/15 to-transparent border-l-2 border-[#B8952A] text-white' 
                      : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <Users size={16} className={activeTab === 'talent' ? 'text-[#B8952A]' : ''} />
                  Talent Directory
                </button>
                <button 
                  onClick={() => { setActiveTab('ledger'); luxSound.hover(); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded text-sm font-medium tracking-wide transition-all ${
                    activeTab === 'ledger' 
                      ? 'bg-gradient-to-r from-[#B8952A]/15 to-transparent border-l-2 border-[#B8952A] text-white' 
                      : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <ShieldCheck size={16} className={activeTab === 'ledger' ? 'text-[#B8952A]' : ''} />
                  Compliance Ledger
                </button>
              </nav>
            </div>

            <div className="px-4 py-4 border-t border-white/[0.05] flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-white/30">
                <span>CONCURRENCY SLA</span>
                <span className="text-emerald-500">100%</span>
              </div>
              <div className="w-full bg-white/[0.05] h-1 rounded-full overflow-hidden">
                <div className="bg-[#B8952A] h-full w-[80%]"></div>
              </div>
            </div>
          </aside>

          {/* DYNAMIC CONTENT CONTAINER */}
          <main className="flex-1 overflow-y-auto bg-[#050507] p-8">
            <AnimatePresence mode="wait">
              
              {/* STUDIO FORGE VIEW */}
              {activeTab === 'forge' && (
                <motion.div
                  key="forge"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col gap-8 h-full"
                >
                  {/* Page Header */}
                  <div>
                    <h2 className="text-3xl font-serif tracking-tight text-white">Campaign Forge</h2>
                    <p className="text-xs text-white/40 font-mono mt-1">Sovereign 7-Agent Assembly Line</p>
                  </div>

                  {/* Forge Assembly Panels */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* SKU Selection */}
                    <div className="border border-white/[0.06] rounded bg-[#0b0b0e] p-5 flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono uppercase tracking-wider text-white/50">1. Select Garment SKU</span>
                        <FolderLock size={14} className="text-[#B8952A]" />
                      </div>
                      <div className="flex flex-col gap-3">
                        {skus.filter(s => s.status === 'locked').map(sku => (
                          <div 
                            key={sku.id}
                            onClick={() => setSelectedSku(sku.id)}
                            className={`p-3 rounded border flex items-center justify-between cursor-pointer transition-all ${
                              selectedSku === sku.id 
                                ? 'border-[#B8952A] bg-[#B8952A]/5' 
                                : 'border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <img src={sku.thumbnail} alt={sku.name} className="w-10 h-10 object-cover rounded" />
                              <div>
                                <h4 className="text-xs font-medium text-white">{sku.name}</h4>
                                <p className="text-[9px] font-mono text-white/40">{sku.category} • {sku.season}</p>
                              </div>
                            </div>
                            <span className="text-[8px] font-mono text-[#B8952A] bg-[#B8952A]/10 px-2 py-0.5 rounded border border-[#B8952A]/20">DNA LOCKED</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Likeness Selection */}
                    <div className="border border-white/[0.06] rounded bg-[#0b0b0e] p-5 flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono uppercase tracking-wider text-white/50">2. Select Likeness Anchor</span>
                        <Users size={14} className="text-[#B8952A]" />
                      </div>
                      <div className="flex flex-col gap-3">
                        {talent.map(model => (
                          <div 
                            key={model.id}
                            onClick={() => setSelectedModel(model.id)}
                            className={`p-3 rounded border flex items-center justify-between cursor-pointer transition-all ${
                              selectedModel === model.id 
                                ? 'border-[#B8952A] bg-[#B8952A]/5' 
                                : 'border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <img src={model.thumbnail} alt={model.name} className="w-10 h-10 object-cover rounded" />
                              <div>
                                <h4 className="text-xs font-medium text-white">{model.name}</h4>
                                <p className="text-[9px] font-mono text-white/40">{model.agency} • Rate: {model.rate}cr</p>
                              </div>
                            </div>
                            <span className="text-[8px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">LICENSED</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Set Injection & Scene */}
                    <div className="border border-white/[0.06] rounded bg-[#0b0b0e] p-5 flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono uppercase tracking-wider text-white/50">3. Select Set & Scene Moat</span>
                        <Layers size={14} className="text-[#B8952A]" />
                      </div>
                      <div className="flex flex-col gap-3">
                        
                        {/* Set Selection */}
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {sets.filter(s => s.status.includes('100%')).map(set => (
                            <div 
                              key={set.id}
                              onClick={() => setSelectedSet(set.id)}
                              className={`flex-shrink-0 p-2 rounded border flex flex-col gap-2 cursor-pointer transition-all ${
                                selectedSet === set.id 
                                  ? 'border-[#B8952A] bg-[#B8952A]/5' 
                                  : 'border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03]'
                              }`}
                            >
                              <img src={set.thumbnail} alt={set.name} className="w-20 h-12 object-cover rounded" />
                              <span className="text-[9px] text-center w-20 truncate">{set.name}</span>
                            </div>
                          ))}
                        </div>

                        {/* Scene Moat Selection */}
                        <div className="flex flex-col gap-1.5 mt-2">
                          <label className="text-[9px] font-mono text-white/40 uppercase">Scene Calibration (1,000 Moat Library)</label>
                          <select 
                            value={selectedScene}
                            onChange={(e) => setSelectedScene(e.target.value)}
                            className="bg-[#050507] border border-white/[0.08] text-xs px-3 py-2 rounded focus:outline-none focus:border-[#B8952A] text-white/80"
                          >
                            {SCENES.map(scene => (
                              <option key={scene.id} value={scene.id}>{scene.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* ACTION CONTROLS */}
                  <div className="border border-white/[0.08] bg-[#0b0b0f] p-6 rounded flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-8">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Campaign Format</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setOutputMode('still')}
                            className={`px-4 py-2 rounded text-xs font-mono border transition-all ${
                              outputMode === 'still' 
                                ? 'border-[#B8952A] text-white bg-[#B8952A]/5' 
                                : 'border-white/[0.08] text-white/50 hover:border-white/20'
                            }`}
                          >
                            6 Stills Editorial (3 credits)
                          </button>
                          <button 
                            onClick={() => setOutputMode('video')}
                            className={`px-4 py-2 rounded text-xs font-mono border transition-all ${
                              outputMode === 'video' 
                                ? 'border-[#B8952A] text-white bg-[#B8952A]/5' 
                                : 'border-white/[0.08] text-white/50 hover:border-white/20'
                            }`}
                          >
                            Couture Motion (18 credits)
                          </button>
                        </div>
                      </div>

                      <div className="h-10 w-[1px] bg-white/10 hidden md:block"></div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Est. Internal Compute Cost</span>
                        <span className="text-xs font-mono text-[#B8952A]">$0.50 API + $1.50 Compute ($2.00 Total)</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleStartForge}
                      disabled={isForging}
                      className="px-8 py-3 rounded font-serif tracking-wider font-medium text-black bg-[#B8952A] hover:bg-[#c2a23a] transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(184,149,42,0.3)]"
                    >
                      <Play size={16} fill="black" />
                      ENGAGE SOVEREIGN FORGE
                    </button>
                  </div>

                  {/* FORGE STREAMING GRID */}
                  <div className="flex-1 border border-white/[0.06] rounded bg-[#07070a] p-6 flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.05] pb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono uppercase tracking-wider text-white/50">Active Generation Pipeline</span>
                        {isForging && <span className="w-1.5 h-1.5 rounded-full bg-[#B8952A] animate-ping"></span>}
                      </div>
                      
                      <div className="flex-1 max-w-xl">
                        <div className="flex justify-between items-center text-[10px] font-mono text-white/40 mb-1">
                          <span>{forgeStep || 'Pipeline Idle'}</span>
                          <span>{forgeProgress}%</span>
                        </div>
                        <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            className="bg-[#B8952A] h-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${forgeProgress}%` }}
                            transition={{ duration: 0.5 }}
                          ></motion.div>
                        </div>
                      </div>
                    </div>

                    {/* Grid of 6 Slots */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {slotsData.length === 0 ? (
                        Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="aspect-[3/4] rounded border border-white/[0.04] bg-white/[0.01] flex flex-col items-center justify-center p-4">
                            <span className="text-[10px] font-mono text-white/10 uppercase">Slot {i + 1} Empty</span>
                          </div>
                        ))
                      ) : (
                        slotsData.map((slot) => (
                          <div 
                            key={slot.id} 
                            className="aspect-[3/4] rounded border border-white/[0.06] bg-[#0a0a0d] overflow-hidden relative group"
                          >
                            {!slot.ready ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0b0b0e] to-[#050507]">
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-shimmer" />
                                <div className="w-12 h-12 border-t-2 border-r-2 border-[#B8952A]/20 rounded-full animate-spin"></div>
                                <span className="text-[9px] font-mono text-white/30 uppercase mt-4">Streaming Slot {slot.id}...</span>
                              </div>
                            ) : (
                              <>
                                <img 
                                  src={slot.url} 
                                  alt={`Slot ${slot.id}`} 
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                                  <div className="flex justify-between items-start">
                                    <span className="text-[8px] font-mono text-white bg-black/60 px-1.5 py-0.5 rounded border border-white/10">SLOT {slot.id}</span>
                                    <span className="text-[8px] font-mono text-[#B8952A] bg-[#B8952A]/10 px-1.5 py-0.5 rounded border border-[#B8952A]/20">AUDITED</span>
                                  </div>
                                  <button className="w-full py-1.5 bg-[#B8952A] text-black text-[10px] font-mono tracking-wider font-semibold rounded hover:bg-[#c2a23a] transition-all">
                                    EXPORT HIGH-RES
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                  </div>

                </motion.div>
              )}

              {/* SKU VAULT VIEW */}
              {activeTab === 'skus' && (
                <motion.div
                  key="skus"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col gap-8"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-3xl font-serif tracking-tight text-white">SKU Registry</h2>
                      <p className="text-xs text-white/40 font-mono mt-1">Enroll physical garments, lock DNA blueprints permanently.</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-white/60">
                      <span>Total SKUs: {skus.length}</span>
                      <span>•</span>
                      <span className="text-emerald-500">Locked & Ready: {skus.filter(s => s.status === 'locked').length}</span>
                    </div>
                  </div>

                  {/* SKU Cards Grid & Dropzone */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Dotted Dropzone */}
                    <div className="border border-dashed border-white/20 rounded bg-[#0b0b0e] p-6 flex flex-col items-center justify-center text-center gap-6 min-h-[300px] hover:border-[#B8952A]/50 transition-colors duration-300">
                      {!uploadingSku ? (
                        <>
                          <div className="w-16 h-16 rounded-full bg-white/[0.02] flex items-center justify-center border border-white/[0.08]">
                            <Upload size={24} className="text-[#B8952A]" />
                          </div>
                          <div className="flex flex-col gap-2">
                            <h4 className="text-sm font-medium">New SKU Enrollment</h4>
                            <p className="text-xs text-white/40 max-w-xs leading-relaxed">
                              Upload high-resolution garment flat lays, detailed shots, or 3D product patterns to index fabric DNA.
                            </p>
                          </div>
                          <button 
                            onClick={simulateSkuUpload}
                            className="px-6 py-2.5 rounded font-mono text-xs text-black bg-white hover:bg-neutral-200 transition-all font-semibold"
                          >
                            SELECT REFERENCE FILES
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-4 w-full px-4">
                          <div className="w-10 h-10 border-t-2 border-r-2 border-[#B8952A] rounded-full animate-spin"></div>
                          <div className="flex flex-col gap-1 w-full text-center">
                            <h4 className="text-xs font-mono uppercase tracking-wider text-[#B8952A]">
                              {uploadStep === 1 && "Uploading Source Imagery..."}
                              {uploadStep === 2 && "Agent 01: Extracting Garment DNA..."}
                              {uploadStep === 3 && "Agent 01b: Creating Pre-pass Renders..."}
                            </h4>
                            <div className="w-full bg-white/[0.05] h-1 rounded-full overflow-hidden mt-2">
                              <div className="h-full bg-[#B8952A] animate-uploadProgress"></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SKU Cards */}
                    {skus.map(sku => (
                      <div key={sku.id} className="border border-white/[0.06] rounded bg-[#0b0b0e] overflow-hidden flex flex-col group">
                        <div className="aspect-[16/10] relative overflow-hidden bg-neutral-900">
                          <img src={sku.referenceImage} alt={sku.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute top-3 right-3">
                            {sku.status === 'locked' && (
                              <span className="text-[8px] font-mono text-[#B8952A] bg-black/80 px-2 py-0.5 rounded border border-[#B8952A]/40 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#B8952A]"></span>
                                DNA LOCKED
                              </span>
                            )}
                            {sku.status === 'processing' && (
                              <span className="text-[8px] font-mono text-amber-500 bg-black/80 px-2 py-0.5 rounded border border-amber-500/40 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                ENROLLING
                              </span>
                            )}
                            {sku.status === 'drift' && (
                              <span className="text-[8px] font-mono text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30 flex items-center gap-1.5">
                                <AlertCircle size={10} />
                                DRIFT DETECTED
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between gap-4 border-t border-white/[0.05]">
                          <div className="flex flex-col gap-1">
                            <h3 className="text-sm font-medium">{sku.name}</h3>
                            <p className="text-[10px] font-mono text-white/40">{sku.category} • {sku.season}</p>
                          </div>
                          
                          <div className="flex justify-between items-center bg-[#050507] p-2.5 rounded border border-white/[0.04]">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] font-mono text-white/30 uppercase">Pattern Fidelity</span>
                              <span className="text-xs font-mono text-white/80">{sku.dnaFidelity}%</span>
                            </div>
                            <div className="flex gap-1.5">
                              <button className="p-1.5 bg-white/[0.02] border border-white/[0.06] rounded hover:bg-white/[0.05] text-white/60 hover:text-white transition-all">
                                <Eye size={12} />
                              </button>
                              <button className="p-1.5 bg-white/[0.02] border border-white/[0.06] rounded hover:bg-white/[0.05] text-white/60 hover:text-white transition-all">
                                <Sliders size={12} />
                              </button>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={() => { setActiveTab('forge'); setSelectedSku(sku.id); }}
                              disabled={sku.status !== 'locked'}
                              className="flex-1 py-2 text-[10px] font-mono tracking-wider font-semibold rounded bg-[#B8952A] text-black hover:bg-[#c2a23a] transition-all disabled:opacity-30 disabled:cursor-not-allowed uppercase"
                            >
                              Run Campaign
                            </button>
                            <button className="px-3 py-2 text-[10px] font-mono tracking-wider font-semibold rounded border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.02] transition-all uppercase">
                              DNA Logs
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                  </div>
                </motion.div>
              )}

              {/* VIRTUAL BACKLOT VIEW */}
              {activeTab === 'backlot' && (
                <motion.div
                  key="backlot"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col gap-8"
                >
                  <div>
                    <h2 className="text-3xl font-serif tracking-tight text-white">Virtual Backlot</h2>
                    <p className="text-xs text-white/40 font-mono mt-1">Upload 3D panoramic references to sync studio light-bounce and scene depth.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {sets.map(set => (
                      <div key={set.id} className="border border-white/[0.06] rounded bg-[#0b0b0e] p-5 flex flex-col gap-4">
                        <div className="aspect-[16/9] rounded overflow-hidden relative">
                          <img src={set.thumbnail} alt={set.name} className="w-full h-full object-cover" />
                          <div className="absolute top-3 right-3">
                            <span className="text-[8px] font-mono text-emerald-400 bg-black/80 px-2 py-0.5 rounded border border-emerald-400/40">
                              {set.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <h3 className="text-sm font-medium">{set.name}</h3>
                          <span className="text-[9px] font-mono text-white/30 uppercase">Light-bounce Presets</span>
                        </div>

                        {/* Interactive Sliders */}
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[10px] font-mono text-white/50">
                              <span>Global Intensity</span>
                              <span>{set.intensity}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={set.intensity} 
                              className="accent-[#B8952A] h-1 bg-white/10 rounded-lg cursor-pointer"
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setSets(prev => prev.map(s => s.id === set.id ? { ...s, intensity: val } : s));
                              }}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[10px] font-mono text-white/50">
                              <span>Color Temp (Warm/Cool)</span>
                              <span>{set.temp}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={set.temp} 
                              className="accent-[#B8952A] h-1 bg-white/10 rounded-lg cursor-pointer"
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setSets(prev => prev.map(s => s.id === set.id ? { ...s, temp: val } : s));
                              }}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[10px] font-mono text-white/50">
                              <span>Shadow Softness</span>
                              <span>{set.softness}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={set.softness} 
                              className="accent-[#B8952A] h-1 bg-white/10 rounded-lg cursor-pointer"
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setSets(prev => prev.map(s => s.id === set.id ? { ...s, softness: val } : s));
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-white/[0.04] mt-2">
                          <button className="flex-1 py-2 text-[10px] font-mono tracking-wider font-semibold rounded bg-white/5 border border-white/[0.08] text-white hover:bg-white/10 transition-all uppercase">
                            Calibrate Set
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* TALENT CLEARINGHOUSE VIEW */}
              {activeTab === 'talent' && (
                <motion.div
                  key="talent"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col gap-8"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-3xl font-serif tracking-tight text-white">Talent Clearinghouse</h2>
                      <p className="text-xs text-white/40 font-mono mt-1">Authorized database for locked model identity replicas.</p>
                    </div>
                    <span className="text-[10px] font-mono text-[#B8952A] bg-[#B8952A]/10 px-3 py-1 rounded border border-[#B8952A]/20 uppercase">
                      New York Compliance Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {talent.map(model => (
                      <div key={model.id} className="border border-white/[0.06] rounded bg-[#0b0b0e] overflow-hidden flex flex-col">
                        <div className="aspect-[16/10] relative">
                          <img src={model.thumbnail} alt={model.name} className="w-full h-full object-cover" />
                          <div className="absolute top-3 right-3 flex gap-2">
                            <span className="text-[8px] font-mono text-emerald-400 bg-black/80 px-2 py-0.5 rounded border border-emerald-400/40">
                              ACTIVE LICENSE
                            </span>
                          </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col gap-4 border-t border-white/[0.05]">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-sm font-medium">{model.name}</h3>
                              <p className="text-[10px] font-mono text-white/40">{model.agency}</p>
                            </div>
                            <span className="text-xs font-mono text-[#B8952A]">{model.rate} credits/img</span>
                          </div>

                          <div className="flex flex-col gap-2 bg-[#050507] p-3 rounded border border-white/[0.04]">
                            <span className="text-[8px] font-mono text-white/30 uppercase">Allowed Verticals & Toggles</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {model.verticals.map((vert, idx) => (
                                <span key={idx} className="text-[8px] font-mono text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                  {vert}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-[9px] font-mono text-white/40 mt-2 pt-2 border-t border-white/[0.03]">
                              <span>Tobacco/Alcohol</span>
                              <span className="text-rose-500 uppercase">Restricted</span>
                            </div>
                          </div>

                          <button 
                            onClick={() => { setActiveTab('forge'); setSelectedModel(model.id); }}
                            className="w-full py-2.5 text-[10px] font-mono tracking-wider font-semibold rounded bg-[#B8952A] text-black hover:bg-[#c2a23a] transition-all uppercase"
                          >
                            Select Model
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* COMPLIANCE LEDGER VIEW */}
              {activeTab === 'ledger' && (
                <motion.div
                  key="ledger"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col gap-8 text-white/80"
                >
                  <div>
                    <h2 className="text-3xl font-serif tracking-tight text-white">Compliance & Audit Ledger</h2>
                    <p className="text-xs text-white/40 font-mono mt-1">Cryptographic records for synthetic performers under NY & CA laws.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="border border-white/[0.06] rounded bg-[#0b0b0e] p-5 flex flex-col gap-3">
                      <span className="text-xs font-mono text-white/40 uppercase">License Consent Watermarking</span>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-emerald-500" size={20} />
                        <h4 className="text-sm font-medium">Automatic Injection Active</h4>
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed">
                        Every image generated with locked Identity Anchors contains cryptographic metadata embedding talent consent hashes.
                      </p>
                    </div>

                    <div className="border border-white/[0.06] rounded bg-[#0b0b0e] p-5 flex flex-col gap-3">
                      <span className="text-xs font-mono text-white/40 uppercase">NY Synthetic Performers Law</span>
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-emerald-500" size={20} />
                        <h4 className="text-sm font-medium">Compliance Validated</h4>
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed">
                        Automated smart contracts clear licensing agreements in milliseconds. Audit trails log every SKU interaction.
                      </p>
                    </div>

                    <div className="border border-white/[0.06] rounded bg-[#0b0b0e] p-5 flex flex-col gap-3">
                      <span className="text-xs font-mono text-white/40 uppercase">Compute Efficiency Report</span>
                      <div className="flex items-center gap-3">
                        <TrendingUp className="text-[#B8952A]" size={20} />
                        <h4 className="text-sm font-medium">99.2% Profit Margins</h4>
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed">
                        Internal edge executions average $2.00 compute costs per batch, generating high-yield boutique lookbooks.
                      </p>
                    </div>
                  </div>

                  {/* Mock Logs Table */}
                  <div className="border border-white/[0.06] rounded bg-[#0b0b0e] overflow-hidden mt-4">
                    <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-white/50">Recent Audit Records</span>
                      <span className="text-[10px] font-mono text-white/30">Auto-Refreshed: 1m ago</span>
                    </div>
                    <div className="divide-y divide-white/[0.04] text-xs">
                      <div className="px-6 py-3.5 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-white/30">03:14:12</span>
                          <span className="font-medium text-white/80">Sovereign Forge: Black Linen Blazer x Naomi Agy-01</span>
                        </div>
                        <span className="font-mono text-emerald-500">COMPLIANT (Consent Hash: a8f9...b22e)</span>
                      </div>
                      <div className="px-6 py-3.5 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-white/30">02:55:04</span>
                          <span className="font-medium text-white/80">SKU Registered: Silk Slip Dress Resort 27</span>
                        </div>
                        <span className="font-mono text-[#B8952A]">DNA BLUEPRINT LOCKED</span>
                      </div>
                      <div className="px-6 py-3.5 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-white/30">01:42:19</span>
                          <span className="font-medium text-white/80">Set Sync: Amalfi Coastal Terrace (Spatial Mesh Upload)</span>
                        </div>
                        <span className="font-mono text-white/70">MESH CONVERGED</span>
                      </div>
                    </div>
                  </div>

                </motion.div>
              )}

            </AnimatePresence>
          </main>

        </div>

      </div>
    </Layout>
  );
}
