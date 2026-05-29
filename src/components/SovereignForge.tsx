import React, { useState, useRef } from 'react';
import { luxSound } from '../lib/useLuxSound';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Sovereign Macro-Loupe - The Billion-Dollar Evaluation Move
 * Quiet Luxury Update: Thin dark optical crosshair, ultra-clean zoom.
 */
const MacroLoupe: React.FC<{ 
  src: string; 
  mousePos: { x: number; y: number; pX: number; pY: number };
}> = ({ 
  src, 
  mousePos
}) => {
  const LOUPE_SIZE = 180;
  const ZOOM_LEVEL = 2.5;

  return (
    <motion.div
      className="hidden md:block absolute pointer-events-none border border-black/10 rounded-full overflow-hidden z-[200] shadow-2xl bg-white"
      style={{
        width: LOUPE_SIZE,
        height: LOUPE_SIZE,
        left: mousePos.x - LOUPE_SIZE / 2,
        top: mousePos.y - LOUPE_SIZE / 2,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div 
        className="w-full h-full"
        style={{
          backgroundImage: `url(${src})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${100 * ZOOM_LEVEL}%`,
          backgroundPosition: `${mousePos.pX}% ${mousePos.pY}%`
        }}
      />
      {/* Optical Crosshair - Quiet Luxury Thin */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 mix-blend-difference">
        <div className="w-full h-[0.5px] bg-white" />
        <div className="h-full w-[0.5px] bg-white" />
      </div>
    </motion.div>
  );
};

interface ForgeTileProps {
  src: string;
  id: number;
  onSelect: () => void;
  onRefine?: () => void;
  index: number;
  deployed?: boolean;
  isGenerating?: boolean;
}

const ForgeTile: React.FC<ForgeTileProps> = ({ src, id, onSelect, onRefine, index, deployed = false, isGenerating = false }) => {
  const [showLoupe, setShowLoupe] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, pX: 0, pY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isLoading = isGenerating && !src;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    setMousePos({
      x, y,
      pX: (x / width) * 100,
      pY: (y / height) * 100
    });
  };

  return (
    <motion.div
      ref={containerRef}
      layoutId={`asset-${id}`}
      onClick={() => { if (!isLoading) { luxSound.select(); onSelect(); } }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.08, duration: 0.6, ease: "easeOut" }}
      className={`relative w-full aspect-[4/5] bg-[#F2EFE9] overflow-hidden transition-all duration-700 ${isLoading ? 'cursor-default' : `cursor-crosshair hover:shadow-2xl`}`}
      onMouseEnter={() => { if (!isLoading) setShowLoupe(true); }}
      onMouseLeave={() => setShowLoupe(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Loading skeleton — Quiet Luxury soft pulse */}
      {isLoading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/50">
          <motion.div
            className="w-[1px] h-12 bg-black/10"
            animate={{ height: ['20px', '60px', '20px'], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-[#1C1C1C]">
              Rendering {id} / 6
            </span>
            <span className="text-[7px] font-mono uppercase tracking-[0.25em] text-[#6E6A60]">
              Scene active
            </span>
          </div>
        </div>
      ) : (
        /* The Asset */
        <img src={src} alt="Forge Contact Sheet Cell Output" className="w-full h-full object-cover transition-transform duration-[2s] scale-[1.01] hover:scale-100" />
      )}

      {/* Quiet Luxury Overlays */}
      {!isLoading && src && (
        <>
          <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors duration-500 pointer-events-none" />
          {deployed && (
            <div className="absolute top-4 right-4 z-10">
              <span className="text-[8px] font-mono uppercase tracking-widest text-[#1C1C1C] bg-white/90 backdrop-blur px-3 py-1.5 shadow-sm border border-black/5">Saved</span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-5 flex justify-between items-end bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500">
            <div className="flex flex-col gap-1 text-white pointer-events-none">
              <span className="text-[8px] font-mono uppercase tracking-[0.2em] opacity-80">Matrix Block {id}</span>
              <span className="text-sm font-serif italic tracking-wide">Scene Iteration</span>
            </div>
            <div className="flex items-center gap-2">
              {onRefine && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRefine(); }}
                  className="text-[8px] font-mono uppercase tracking-widest text-white bg-white/20 backdrop-blur border border-white/30 px-3 py-1.5 hover:bg-white/30 transition-colors"
                >
                  Refine
                </button>
              )}
              <div className="text-[8px] font-mono text-white/80 uppercase tracking-widest pointer-events-none">
                150MP
              </div>
            </div>
          </div>
          <AnimatePresence>
            {showLoupe && <MacroLoupe src={src} mousePos={mousePos} />}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
};

interface SovereignForgeProps {
  assets: string[];
  theme?: 'aura' | 'noir';
  onSelectAsset: (assetId: number) => void;
  onRefineAsset?: (assetId: number) => void;
  deployedIds?: Set<number>;
  isGenerating?: boolean;
}

export const SovereignForge: React.FC<SovereignForgeProps> = ({ assets, onSelectAsset, onRefineAsset, deployedIds, isGenerating = false }) => {
  return (
    <div className="w-full max-w-none mx-auto pb-24">
      {/* Header: Quiet Luxury Editorial Minimalist */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#E5E0D8] pb-8 mb-12 px-4 lg:px-12">
        <div className="space-y-4">
          <p className="text-[9px] font-mono text-[#6E6A60] tracking-[0.4em] uppercase">
            Scene Matrix Scaffolding
          </p>
          <h2 className="text-4xl md:text-5xl font-serif text-[#1C1C1C] tracking-tight leading-none">
            Editorial <span className="italic font-light">Contact Sheet</span>
          </h2>
        </div>
        <div className="mt-6 md:mt-0 flex flex-col items-start md:items-end gap-1 text-[8px] font-mono text-[#6E6A60] tracking-[0.3em] uppercase">
          <span>Optical Inspection // 2.5X</span>
          <span>150MP Standard</span>
        </div>
      </header>

      {/* The 6-Image Editorial Contact Sheet Matrix */}
      {/* 
        We use a 1px gap background bleed to create the "Contact Sheet" look without thick borders.
        Bg is set to the border color, and the grid gap reveals it. 
      */}
      <div className="px-4 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-[#E5E0D8] border border-[#E5E0D8]">
          {assets.map((asset, i) => (
              <div key={i} className="bg-white">
                <ForgeTile
                  src={asset}
                  id={i + 1}
                  index={i}
                  onSelect={() => onSelectAsset(i + 1)}
                  onRefine={onRefineAsset ? () => onRefineAsset(i + 1) : undefined}
                  deployed={deployedIds?.has(i + 1)}
                  isGenerating={isGenerating}
                />
              </div>
          ))}
        </div>
      </div>
      
      {/* Atmosphere Accent */}
      <div className="pt-24 flex justify-center px-4 lg:px-12">
        <div className="flex items-center gap-6 text-[8px] font-mono text-[#6E6A60] uppercase tracking-[0.4em]">
          <div className="w-12 h-[1px] bg-[#E5E0D8]" />
          <span>Matrix Complete</span>
          <div className="w-12 h-[1px] bg-[#E5E0D8]" />
        </div>
      </div>
    </div>
  );
};

export default SovereignForge;
