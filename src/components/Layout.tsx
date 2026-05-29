import React from 'react';
import { Cpu, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import SovereignNavigation from './SovereignNavigation';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="app-viewport min-h-screen selection:bg-accent selection:text-black pt-32 pb-24 md:pb-0">
            <SovereignNavigation />

            <main className="main-reveal relative z-10 w-full mb-16 pb-32 md:pb-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                >
                    {children}
                </motion.div>
            </main>

            {/* The Sovereign Ledger: Universal State Awareness */}
            <footer className="sovereign-ledger hidden md:flex">
                <div className="flex gap-12">
                    <div className="flex gap-4">
                        <span className="opacity-40">Atelier</span>
                        <span className="text-[#1C1C1C] font-black tracking-widest">LUXAURA</span>
                    </div>
                    <div className="flex gap-4 hidden md:flex">
                        <span className="opacity-40">Est.</span>
                        <span className="text-[#1C1C1C]">MMXXV</span>
                    </div>
                </div>

                <div className="flex gap-12 items-center">
                    <div className="flex gap-4 items-center">
                        <Cpu size={14} className="text-accent" />
                        <span className="opacity-40">Engine</span>
                        <span className="text-[#1C1C1C]">Live</span>
                    </div>
                    <div className="flex gap-4 items-center hidden lg:flex">
                        <Layers size={14} className="text-accent" />
                        <span className="opacity-40">Vault</span>
                        <span className="text-[#1C1C1C]">Secured</span>
                    </div>
                    <div className="w-[1px] h-4 bg-[#1C1C1C]/10 mx-2" />
                    <div className="text-[10px] font-black text-accent border border-accent/20 px-3 py-1 bg-accent/5 tracking-[0.3em]">
                        Private Atelier
                    </div>
                </div>
            </footer>

            <div className="fixed inset-0 pointer-events-none z-[1001] opacity-[0.02] mix-blend-overlay">
                <div className="w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            </div>
        </div>
    );
}
