import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  visible: boolean;
  label: string;
  discipline: string;
}

/**
 * Full-screen branded overlay shown when navigating between Atelier domains.
 * Creates a "loading moment" that feels intentional and premium instead of a jarring cut.
 */
export default function DomainTransition({ visible, label, discipline }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[300] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Gold atmospheric bloom */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full bg-[#C5A253]/6 blur-[150px] pointer-events-none" />

          {/* Discipline eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-[8px] font-mono uppercase tracking-[0.8em] text-[#C5A253]/50 mb-5"
          >
            {discipline}
          </motion.p>

          {/* Main label */}
          <motion.h2
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl font-serif text-white tracking-tighter text-center px-8 mb-10 leading-tight"
          >
            Initializing&nbsp;
            <span className="text-[#C5A253] italic">{label}</span>
          </motion.h2>

          {/* Hairline progress bar */}
          <div className="relative w-64 h-[1px] bg-white/5 overflow-hidden">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              transition={{ delay: 0.2, duration: 0.65, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C5A253] to-[#C5A253]"
            />
            {/* Shimmer sweep */}
            <motion.div
              className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              animate={{ x: ['-80px', '320px'] }}
              transition={{ delay: 0.55, duration: 0.65, ease: 'easeOut' }}
            />
          </div>

          {/* Status pulse */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-5 text-[8px] font-mono uppercase tracking-[0.6em] text-white/20"
          >
            Opening the Atelier...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
