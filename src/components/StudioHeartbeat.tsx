import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Activity } from 'lucide-react';

const LOG_MAP = {
  aura: [
    "DNA_AUDIT: Mapping follicular topology...",
    "AESTHETIC_ARCHITECT: Balancing specular scattering...",
    "AURORA_ENGINE: Calibrating organic subsurface glow...",
    "CRITIC: Verified. Texture fidelity within 0.02% variance."
  ],
  noir: [
    "KINETIC_AUDIT: Synchronizing mechanical gear ratios...",
    "BLADE_PHYSICS: Measuring edge-angle integrity...",
    "NOIR_ENGINE: Optimizing mercury-chrome reflections...",
    "CRITIC: Verified. Structural engineering logic locked."
  ]
};

interface StudioHeartbeatProps {
  theme: 'aura' | 'noir';
}

/**
 * Studio Heartbeat - The Adaptive Terminal
 * Synchronizes terminal vocabulary and color space with the active domain theme.
 * Aura (Gold): Aesthetic arrangement and organic textures.
 * Noir (Mercury): Mechanical validation and structural engineering.
 */
export const StudioHeartbeat: React.FC<StudioHeartbeatProps> = ({ theme }) => {
  const [currentLogIndex, setCurrentLogIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLogIndex((prev) => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-black/40 backdrop-blur-xl border border-accent/20 p-4 rounded-sm transition-colors duration-1000 shadow-xl">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-accent" />
          <h4 className="text-[10px] font-mono uppercase tracking-[0.4em] text-accent">
            {theme === 'aura' ? 'Neural Styling' : 'Neural Engineering'}
          </h4>
        </div>
        <div className="flex items-center gap-1">
           <Activity size={12} className="text-accent animate-pulse" />
           <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Live Pulse</span>
        </div>
      </div>

      <div className="space-y-2 h-20 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${theme}-${currentLogIndex}`}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            className="text-[10px] font-mono leading-relaxed"
          >
            <span className="text-accent mr-2">{">"}</span>
            <span className="text-white/60 tracking-wider">
              {LOG_MAP[theme][currentLogIndex]}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Faint vertical "Scanline" background */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20" />
      </div>

      <div className="mt-4 pt-2 border-t border-white/5 flex items-center justify-between">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
              className="w-1 h-1 bg-accent rounded-full shadow-[0_0_5px_var(--accent-color)]"
            />
          ))}
        </div>
        <span className="text-[8px] font-mono text-white/10 uppercase tracking-[0.5em]">
          Studio 2.0 // Sovereign OS
        </span>
      </div>
    </div>
  );
};

export default StudioHeartbeat;
