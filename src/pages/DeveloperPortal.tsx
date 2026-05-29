import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Shield, Key, Terminal, User, Settings, Database, Server, RefreshCw, Copy, Check, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Developer Portal: Engine Overview
 * The Mission Control for the Sovereign $3B Platform.
 * Features: High-fidelity metrics, Real-time Mantis Health, Auth Management.
 */
export default function DeveloperPortal() {
    const [engineLoad, setEngineLoad] = useState(42.8);
    const [latency, setLatency] = useState(1.2);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Simulate Real-time Metrics
    useEffect(() => {
        const interval = setInterval(() => {
            setEngineLoad(prev => +(prev + (Math.random() * 2 - 1)).toFixed(1));
            setLatency(prev => +(prev + (Math.random() * 0.2 - 0.1)).toFixed(2));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(text);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const protocols = [
        { name: 'PAPER_BANANA_ACTIVE', status: 'OPERATIONAL', active: true },
        { name: 'SOVEREIGN_EASE_STABLE', status: 'PENDING', active: false },
        { name: 'NOIR_KINETIC_FLUX', status: 'OPERATIONAL', active: true },
        { name: 'OBSIDIAN_CORE_LOCK', status: 'STANDBY', active: false },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-accent selection:text-black overflow-hidden flex flex-col font-body">
            
            {/* Top Navigation Bar */}
            <header className="fixed top-0 left-0 w-full z-[100] h-14 backdrop-blur-3xl border-b border-white/10 px-6 flex items-center justify-between" style={{ backgroundColor: 'rgba(5,5,5,0.80)' }}>
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/5 transition-colors">
                            <Menu size={16} />
                        </button>
                        <span className="font-mono font-black text-white tracking-[0.4em] text-[10px] uppercase">MANTIS_ENGINE</span>
                    </div>
                    
                    <nav className="hidden md:flex gap-8">
                        {['Forge', 'Diagnostics', 'Protocols', 'Cloud'].map(item => (
                            <a key={item} href="#" className={`text-[10px] font-mono tracking-[0.3em] uppercase transition-all duration-700 ${item === 'Diagnostics' ? 'text-white border-b border-white' : 'text-white/30 hover:text-white'}`}>
                                {item}
                            </a>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        <span className="font-mono text-[8px] text-accent tracking-widest uppercase">Live_Node: ATELIER_V2</span>
                    </div>
                    <div className="flex gap-4">
                        <Settings size={14} className="text-white/30 cursor-pointer hover:text-white" />
                        <Terminal size={14} className="text-white/30 cursor-pointer hover:text-white" />
                        <User size={14} className="text-white/30 cursor-pointer hover:text-white" />
                    </div>
                </div>
            </header>

            <div className="flex flex-1 pt-14">
                
                {/* Side Navigation */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.aside
                            initial={{ x: -256 }}
                            animate={{ x: 0 }}
                            exit={{ x: -256 }}
                            className="fixed left-0 top-14 bottom-0 w-64 bg-[#0E0E0E] border-r border-white/5 z-50 flex flex-col p-8"
                        >
                            <div className="mb-14">
                                <h2 className="text-xl font-serif italic text-white mb-1">LuxAura</h2>
                                <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/20">Operational_Manifest</p>
                            </div>

                            <nav className="flex-1 space-y-4">
                                {[
                                    { icon: Server, label: 'Overview', active: true },
                                    { icon: Activity, label: 'Analytics', active: false },
                                    { icon: Shield, label: 'Security', active: false },
                                    { icon: Database, label: 'Vault', active: false },
                                    { icon: Key, label: 'Auth Keys', active: false },
                                ].map(item => (
                                    <div key={item.label} className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-all duration-700 ${item.active ? 'bg-white/5 border-l-2 border-white text-white' : 'text-white/30 hover:text-white hover:bg-white/[0.02]'}`}>
                                        <item.icon size={14} />
                                        <span className="font-mono text-[10px] tracking-widest uppercase">{item.label}</span>
                                    </div>
                                ))}
                            </nav>

                            <div className="mt-auto space-y-6 pt-10 border-t border-white/5">
                                <Link to="/" className="flex items-center gap-4 text-white/20 hover:text-white transition-colors">
                                    <RefreshCw size={12} />
                                    <span className="font-mono text-[9px] uppercase tracking-widest">Return to Studio</span>
                                </Link>
                                <div className="text-[8px] font-mono text-white/10 tracking-[0.2em] p-4 bg-white/5 border border-white/5 text-center">
                                    STABLE_BUILD_V3.8
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Main Content Space */}
                <main className={`flex-1 transition-all duration-1000 ${sidebarOpen ? 'ml-64' : 'ml-0'} p-12 overflow-y-auto`}>
                    
                    <div className="max-w-[1400px] mx-auto space-y-24 pb-24">
                        
                        {/* Stage 1: The Pulse (High-Fidelity Metric Graph) */}
                        <section className="space-y-12 blur-in" style={{ animationDelay: '0.1s' }}>
                            <div className="flex justify-between items-end border-b border-white/5 pb-6">
                                <div>
                                    <h1 className="text-6xl font-serif tracking-tighter text-white mb-2 italic">SYSTEM_HEALTH</h1>
                                    <p className="font-mono text-[10px] tracking-[0.5em] text-white/30 uppercase leading-relaxed">REAL_TIME MONITORING OF THE MANTIS ENGINE LOAD</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-5xl font-mono text-accent font-black">{engineLoad}%</span>
                                    <p className="font-mono text-[10px] tracking-widest text-accent/40 uppercase mt-2">OPTIMIZED_CAPACITY</p>
                                </div>
                            </div>

                            <div className="relative h-[400px] bg-white/[0.02] border border-white/5 overflow-hidden group">
                                {/* Synthetic Scanlines */}
                                <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(255,255,255,0.05)_50%,transparent_50%)] bg-[length:100%_4px]" />
                                
                                <div className="absolute inset-0 p-12 flex flex-col justify-between">
                                    <div className="flex justify-between font-mono text-[10px] text-white/20 tracking-[0.3em]">
                                        <span>FIDELITY_STREAM: ACTIVE</span>
                                        <span>TIMESTAMP: {new Date().toLocaleTimeString()}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <div className="flex items-center gap-6">
                                            <span className="text-6xl font-serif text-white/5 italic select-none">150MP_SENSOR</span>
                                            <div className="h-px w-32 bg-white/10" />
                                        </div>
                                        <span className="font-mono text-[10px] text-white/20 tracking-[0.8em] uppercase">Spectral_Mapping_v2.1</span>
                                    </div>
                                </div>

                                {/* Graph Overlay (Animated Path) */}
                                <svg className="absolute inset-x-0 bottom-0 w-full h-[200px]" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="metric-gradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <motion.path
                                        d="M0,100 L100,80 L200,120 L300,50 L400,90 L500,40 L600,70 L700,20 L800,60 L900,10 L1000,40 V200 H0 Z"
                                        fill="url(#metric-gradient)"
                                        initial={{ opacity: 0, pathLength: 0 }}
                                        animate={{ opacity: 1, pathLength: 1 }}
                                        transition={{ duration: 4, ease: "easeInOut" }}
                                    />
                                    <motion.path
                                        d="M0,100 L100,80 L200,120 L300,50 L400,90 L500,40 L600,70 L700,20 L800,60 L900,10 L1000,40"
                                        stroke="var(--accent-color)"
                                        strokeWidth="2"
                                        fill="none"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 4, ease: "easeInOut" }}
                                    />
                                </svg>
                            </div>
                        </section>

                        {/* Stage 2: Performance Grid */}
                        <section className="grid lg:grid-cols-3 border border-white/10 blur-in" style={{ animationDelay: '0.3s' }}>
                            {[
                                { label: 'Total Requests', value: '1.2M', detail: '24H_CYCLE' },
                                { label: 'Avg Latency', value: '1.2ms', detail: 'GLOBAL_EDGE' },
                                { label: 'Success Rate', value: '99.8%', detail: 'STABLE_UPTIME' },
                            ].map((stat, i) => (
                                <div key={stat.label} className={`p-16 space-y-8 hover:bg-white/[0.02] transition-all duration-1000 group ${i !== 2 ? 'border-r border-white/10' : ''}`}>
                                    <span className="block font-mono text-[10px] tracking-[0.5em] text-white/30 uppercase group-hover:text-accent transition-colors">{stat.label}</span>
                                    <h3 className="text-7xl font-serif text-white tracking-tighter">
                                        {stat.value.split('').map((char, j) => (
                                            <span key={j} className={j > 2 ? 'text-white/20' : ''}>{char}</span>
                                        ))}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <div className="h-px flex-1 bg-white/5" />
                                        <span className="font-mono text-[9px] text-white/20 tracking-widest">{stat.detail}</span>
                                    </div>
                                </div>
                            ))}
                        </section>

                        {/* Stage 3: Operational Detail (Split View) */}
                        <section className="grid lg:grid-cols-2 gap-20 items-start blur-in" style={{ animationDelay: '0.6s' }}>
                            
                            {/* Active Protocols List */}
                            <div className="space-y-10">
                                <div className="flex justify-between items-baseline border-b border-white/5 pb-4">
                                    <h2 className="text-2xl font-serif text-white italic">Active Protocols</h2>
                                    <span className="font-mono text-[10px] text-white/20 tracking-widest uppercase">8_THREADS_LIVE</span>
                                </div>
                                <div className="space-y-px">
                                    {protocols.map(proto => (
                                        <div key={proto.name} className="group p-6 bg-white/[0.02] border border-transparent hover:border-white/5 flex justify-between items-center transition-all duration-700">
                                            <span className="font-mono text-[11px] uppercase tracking-widest text-white/60 group-hover:text-white">{proto.name}</span>
                                            <div className="flex items-center gap-4">
                                                <div className={`h-1 w-12 transition-all duration-1000 ${proto.active ? 'bg-accent' : 'bg-white/10 group-hover:bg-white/20'}`} />
                                                <span className={`font-mono text-[9px] tracking-widest uppercase ${proto.active ? 'text-accent' : 'text-white/20'}`}>{proto.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Auth Key Management */}
                            <div className="space-y-10">
                                <div className="flex justify-between items-baseline border-b border-white/5 pb-4">
                                    <h2 className="text-2xl font-serif text-white italic">Auth_Keys</h2>
                                    <button className="font-mono text-[9px] text-accent/40 uppercase tracking-widest hover:text-accent transition-colors">REVOKE_ALL</button>
                                </div>
                                <div className="p-12 bg-white/[0.02] border border-white/5 space-y-10 relative overflow-hidden group">
                                    
                                    <div className="space-y-3">
                                        <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/20">Production Sovereign Node</p>
                                        <div className="flex items-center justify-between border-b border-white/5 py-4 group/key">
                                            <span className="font-mono text-[11px] tracking-tighter text-white opacity-80">LXA_PROD_8829_XXXX_XXXX_1102</span>
                                            <button onClick={() => copyToClipboard('LXA_PROD_8829_XXXX_XXXX_1102')} className="text-white/20 hover:text-white transition-colors">
                                                {copiedKey === 'LXA_PROD_8829_XXXX_XXXX_1102' ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/20">Sandbox Environment</p>
                                        <div className="flex items-center justify-between border-b border-white/5 py-4 group/key">
                                            <span className="font-mono text-[11px] tracking-tighter text-white opacity-80">LXA_SAND_0019_XXXX_XXXX_9932</span>
                                            <button onClick={() => copyToClipboard('LXA_SAND_0019_XXXX_XXXX_9932')} className="text-white/20 hover:text-white transition-colors">
                                                {copiedKey === 'LXA_SAND_0019_XXXX_XXXX_9932' ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button className="w-full py-5 bg-accent text-black font-mono text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white transition-all duration-1000 mt-8">
                                        GENERATE_NEW_KEY
                                    </button>

                                    {/* Corner Artifacts */}
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/5" />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/5" />
                                </div>
                            </div>

                        </section>
                    </div>

                    {/* Operational Footer HUD */}
                    <footer className="fixed bottom-0 left-0 right-0 h-12 bg-[#0E0E0E] border-t border-white/5 flex items-center justify-between px-10 z-[100]">
                        <div className="flex items-center gap-12">
                            <div className="flex items-center gap-3 font-mono text-[9px] tracking-widest uppercase text-white/20">
                                <Activity size={12} className="text-accent animate-pulse" />
                                <span>Satellite_Link: <span className="text-accent">ESTABLISHED</span></span>
                            </div>
                            <div className="flex items-center gap-3 font-mono text-[9px] tracking-widest uppercase text-white/20">
                                <Shield size={12} className="text-white/40" />
                                <span>ENCRYPTION: AES-4096</span>
                            </div>
                        </div>
                        <p className="font-mono text-[8px] uppercase tracking-[0.5em] text-white/10">©2026 LUXAURA_ATELIER_SYSTEMS // SOVEREIGN_NODE</p>
                    </footer>

                </main>
            </div>

            {/* Kinetic Diagnostic Overlay */}
            <div className="fixed bottom-24 right-10 w-56 p-6 bg-white/[0.02] backdrop-blur-3xl border border-white/5 z-[200] space-y-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">Diagnostic_Flux</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                </div>
                <div className="space-y-3 font-mono text-[10px]">
                    <div className="flex justify-between">
                        <span className="text-white/20">LATENCY:</span>
                        <span className="text-accent">{latency}ms</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/20">MEMORY:</span>
                        <span className="text-white">22.4GB</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/20">LOAD:</span>
                        <div className="w-16 h-1 bg-white/5 overflow-hidden">
                            <motion.div animate={{ width: `${engineLoad}%` }} className="h-full bg-accent" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
