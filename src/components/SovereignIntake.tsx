import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera } from 'lucide-react';

interface SovereignIntakeProps {
  onUpload: (file: File) => void;
}

export const SovereignIntake: React.FC<SovereignIntakeProps> = ({ onUpload }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      setScanned(false);
      // Artificial 800ms "Scanning" delay for psychological weight
      setTimeout(() => { onUpload(file); setScanned(true); }, 800);
    }
  };

  const handleChange = () => {
    setPreview(null);
    setScanned(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative aspect-[4/5] bg-black border border-white/10 flex flex-col items-center justify-center overflow-hidden group"
      >
        {/* The Gold-Leaf Border Detail (Top Right & Bottom Left) */}
        <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-[#C5A253]/65 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-[#C5A253]/65 pointer-events-none" />

        <AnimatePresence mode="wait">
          {!preview ? (
            <motion.label
              key="uploader"
              exit={{ opacity: 0, y: 10 }}
              className="cursor-pointer flex flex-col items-center space-y-6 z-10 w-full h-full justify-center"
            >
              <div className="p-8 rounded-full border border-white/15 bg-white/[0.04] group-hover:border-[#C5A253]/30 transition-all duration-700">
                <Camera size={32} className="text-white/50 group-hover:text-[#C5A253]/80 transition-colors" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-serif italic text-white mb-2">Initialize Intake</h3>
                <p className="text-[9px] font-mono uppercase tracking-[0.4em] text-white/60">
                  Select Master Asset for Calibration
                </p>
              </div>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} accept="image/*" />
            </motion.label>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 w-full h-full"
            >
              <img src={preview} className="w-full h-full object-cover" alt="Intake Preview" />
              {/* The "Scanning" Scanline */}
              <motion.div
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 w-full h-[1px] bg-[#C5A253]/40 shadow-[0_0_15px_#C5A253] z-20"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                {!scanned ? (
                  <p className="text-[10px] font-mono uppercase tracking-[0.8em] text-[#C5A253] animate-pulse">
                    Calibrating DNA...
                  </p>
                ) : (
                  <button
                    onClick={handleChange}
                    className="px-4 py-2 bg-black/70 backdrop-blur-md border border-white/20 text-[8px] font-mono uppercase tracking-[0.3em] text-white/70 hover:text-white hover:border-white/40 transition-all"
                  >
                    [ Change Image ]
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Framing Corners (Minimalist Crosshairs) */}
        <div className="absolute top-8 left-8 w-4 h-4 border-t border-l border-white/20" />
        <div className="absolute bottom-8 right-8 w-4 h-4 border-b border-r border-white/20" />
      </motion.div>
    </div>
  );
};
