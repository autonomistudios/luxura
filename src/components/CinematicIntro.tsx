import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CinematicIntro — Brand entrance sequence
 * Shows once per session. Approx 3.2 seconds.
 * 1. Pure black (0–0.6s)
 * 2. Thin gold line sweeps left → right (0.6–1.6s)
 * 3. "THE ATELIER" fades in (1.4–2.2s)
 * 4. Entire overlay fades out (2.4–3.2s)
 */
export default function CinematicIntro() {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState<'line' | 'text' | 'out' | 'done'>('line');

  useEffect(() => {
    if (sessionStorage.getItem('lux_intro_seen')) return;
    sessionStorage.setItem('lux_intro_seen', '1');
    setShow(true);

    const t1 = setTimeout(() => setPhase('text'), 1000);
    const t2 = setTimeout(() => setPhase('out'),  2200);
    const t3 = setTimeout(() => { setPhase('done'); setShow(false); }, 3200);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (!show || phase === 'done') return null;

  return (
    <AnimatePresence>
      <motion.div
        key="intro"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === 'out' ? 0 : 1 }}
        transition={{ duration: phase === 'out' ? 1 : 0, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[99999] bg-[#050505] flex flex-col items-center justify-center pointer-events-none"
      >
        {/* Gold scan line */}
        <div className="relative w-48 h-[1px] overflow-hidden mb-10">
          <motion.div
            className="absolute top-0 left-0 h-full bg-[#D4AF37]"
            initial={{ width: '0%' }}
            animate={{ width: phase === 'line' || phase === 'text' || phase === 'out' ? '100%' : '0%' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* Brand name */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: phase === 'text' || phase === 'out' ? 1 : 0, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <p className="text-[11px] font-mono uppercase tracking-[0.8em] text-[#D4AF37]/60 mb-4">
            Private Atelier
          </p>
          <h1 className="text-5xl font-serif font-light text-white tracking-[0.15em]">
            LUX<span className="italic text-[#D4AF37]">AURA</span>
          </h1>
        </motion.div>

        {/* Bottom scan line */}
        <div className="relative w-48 h-[1px] overflow-hidden mt-10">
          <motion.div
            className="absolute top-0 right-0 h-full bg-[#D4AF37]/40"
            initial={{ width: '0%' }}
            animate={{ width: phase === 'text' || phase === 'out' ? '100%' : '0%' }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
