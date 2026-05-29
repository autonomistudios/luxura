import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PHASES = [
  { label: 'Extracting DNA signature', sub: 'Mapping anchor feature topology' },
  { label: 'Synthesizing manifesto', sub: 'Encoding creative parameters' },
  { label: 'Building 9-model chassis', sub: 'Assigning unique identities to each variation' },
  { label: 'Rendering variation 1–3', sub: 'Applying lighting & lens emulation' },
  { label: 'Rendering variation 4–6', sub: 'Skin tone calibration active' },
  { label: 'Rendering variation 7–9', sub: 'Final composition pass' },
  { label: 'Applying 150MP fidelity pass', sub: 'Quality verification in progress' },
  { label: 'Finalizing masterwork', sub: 'Almost there' },
];

interface ForgeActivationProps {
  artifactImg: string;
  intakeImg: string;
  onComplete?: () => void;
}

export const ForgeActivation: React.FC<ForgeActivationProps> = ({ artifactImg, intakeImg }) => {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Advance phase message every ~7s (total ~56s window to match API timeout)
  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIndex(prev => Math.min(prev + 1, PHASES.length - 1));
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  // Smooth progress bar — runs from 0 → 92% over ~55s, never reaches 100 until images arrive
  useEffect(() => {
    const start = Date.now();
    const DURATION = 55000;
    const TARGET = 92;

    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / DURATION) * TARGET, TARGET);
      setProgress(pct);
      if (pct < TARGET) requestAnimationFrame(tick);
    };

    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const phase = PHASES[phaseIndex];

  return (
    <div className="fixed inset-0 z-[120] bg-[#050505] overflow-hidden flex flex-col items-center justify-center">

      {/* Blurred intake image — slow continuous drift */}
      <motion.div
        className="absolute inset-0 z-0"
        animate={{ scale: [1.06, 1.12, 1.06] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img src={intakeImg} className="w-full h-full object-cover blur-[6px] opacity-20" alt="" />
      </motion.div>

      {/* Deep vignette */}
      <div className="absolute inset-0 z-[1] bg-gradient-radial from-transparent via-black/60 to-black/90 pointer-events-none" />

      {/* Floating artifact icon */}
      <motion.div
        className="relative z-10 mb-16"
        animate={{ y: [0, -18, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.div
          animate={{
            boxShadow: [
              '0 0 40px rgba(212,175,55,0.08)',
              '0 0 90px rgba(212,175,55,0.28)',
              '0 0 40px rgba(212,175,55,0.08)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-1 h-1 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4AF37]"
        />
        <img
          src={artifactImg}
          className="w-28 object-contain drop-shadow-[0_0_30px_rgba(212,175,55,0.45)]"
          alt=""
        />
      </motion.div>

      {/* Phase label */}
      <div className="relative z-10 text-center mb-12 h-16 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={phaseIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-2"
          >
            <p className="text-[11px] font-mono uppercase tracking-[0.6em] text-[#D4AF37]">
              {phase.label}
            </p>
            <p className="text-[9px] font-mono uppercase tracking-[0.4em] text-white/30">
              {phase.sub}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 w-64 md:w-96 flex flex-col gap-3">
        <div className="w-full h-[1px] bg-white/8 relative overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full bg-[#D4AF37]"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'linear' }}
          />
          {/* Shimmer */}
          <motion.div
            className="absolute top-0 h-full w-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-48px', '400px'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <div className="flex justify-between text-[8px] font-mono text-white/20 uppercase tracking-[0.4em]">
          <span>Rendering</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Bottom status */}
      <motion.p
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute bottom-12 text-[8px] font-mono uppercase tracking-[0.8em] text-white/20 z-10"
      >
        Studio Grade Integrity // 150MP Engine Active
      </motion.p>
    </div>
  );
};
