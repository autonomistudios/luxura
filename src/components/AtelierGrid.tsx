import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Film, Play } from 'lucide-react';
import { luxSound } from '../lib/useLuxSound';
import DomainTransition from './DomainTransition';

const CATEGORIES = [
  {
    id: 'hairstylist',
    name: 'Hair Architecture',
    artifact: '/assets/icon_hair.png',
    result: '/assets/master_hair.png',
    discipline: 'Hair Stylist',
    subtext: 'Structural Fiber & Form',
    path: '',
    isComing: false,
  },
  {
    id: 'nails',
    name: 'Nail Design',
    artifact: '/assets/icon_nails.png',
    result: '/assets/master_nails.png',
    discipline: 'Nail Artist',
    subtext: '3D Surface Architecture',
    path: '',
    isComing: false,
  },
  {
    id: 'clothing',
    name: 'Fashion & Clothing',
    artifact: '/assets/icon_clothing.png',
    result: '/assets/master_clothing_noir.png',
    discipline: 'Fashion Director',
    subtext: 'Silhouette & Fabric Identity',
    path: '',
    isComing: false,
  },
  {
    id: 'makeup',
    name: 'Makeup Artistry',
    artifact: '/assets/icon_makeup.png',
    result: '/assets/master_makeup.png',
    discipline: 'Makeup Artist',
    subtext: 'Pigment & Contour Mastery',
    path: '',
    isComing: false,
  },
  {
    id: 'barber',
    name: 'Barber Direction',
    artifact: '/assets/icon_barber_mercury.png',
    result: '/assets/master_barber_noir.png',
    discipline: 'Barber Director',
    subtext: 'Fade Precision & Edge Craft',
    path: '',
    isComing: false,
  },
  {
    id: 'cinema',
    name: 'Cinema Studio',
    artifact: '',
    result: '',
    discipline: 'Video Director',
    subtext: 'Editorial Motion & Cinematic AI',
    path: '/video',
    isComing: true,
  },
];

export default function AtelierGrid() {
  const navigate = useNavigate();
  const [transitionData, setTransitionData] = useState<{ label: string; discipline: string } | null>(null);

  const handleSelect = (id: string, path?: string) => {
    if (path) {
      setTimeout(() => navigate(path), 300);
      return;
    }
    const cat = CATEGORIES.find(c => c.id === id);
    setTransitionData({ label: cat?.name || id, discipline: cat?.discipline || '' });
    setTimeout(() => navigate(`/workflow/${id}`), 900);
  };

  return (
    <div className="min-h-screen">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center justify-center text-center px-6 pt-16 pb-24 overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-[#D4AF37]/6 blur-[120px]" />
        </div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="text-[9px] font-mono uppercase tracking-[0.8em] text-[#B8952A] mb-6"
        >
          Private Atelier — Est. MMXXV
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl md:text-8xl font-serif text-[#1a1612] tracking-tighter leading-[0.9] mb-8"
        >
          The&nbsp;<span className="text-[#B8952A] italic">Atelier</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 1 }}
          className="max-w-md text-[13px] font-sans text-[#1a1612]/50 leading-relaxed tracking-wide"
        >
          Select your discipline. Upload your work. Watch it become the portfolio you've always imagined.
        </motion.p>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.2, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 w-16 h-[1px] bg-[#D4AF37]/30 origin-center"
        />
      </motion.section>

      {/* ── MARQUEE TICKER ────────────────────────────────────────── */}
      <div className="overflow-hidden border-y border-[#1a1612]/8 py-3 mb-0 relative">
        <div className="flex whitespace-nowrap" style={{ animation: 'marquee 40s linear infinite' }}>
          {Array.from({ length: 4 }).map((_, r) => (
            <span key={r} className="flex items-center gap-12 mr-12">
              {['Hair Architecture', 'Nail Artistry', 'Fashion Direction', 'Makeup Mastery', 'Barber Precision', 'Editorial Vision', 'Silhouette Design', 'Pigment & Form', 'Fiber & Texture', 'Fade Craft'].map((label, j) => (
                <span key={j} className="flex items-center gap-4">
                  <span className="text-[9px] font-mono uppercase tracking-[0.6em] text-[#1a1612]/30">{label}</span>
                  <span className="text-[#B8952A]/40 text-[8px]">◆</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── CATEGORY GRID ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-0 border-t border-[#1a1612]/10">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="group flex flex-col cursor-pointer border-r border-b border-[#1a1612]/8 last:border-r-0 hover:bg-[#1a1612]/[0.02] transition-colors duration-700"
            whileTap={{ scale: 0.98 }}
            onMouseEnter={() => luxSound.hover()}
            onClick={() => handleSelect(cat.id, cat.path || undefined)}
          >
            {/* ── Icon / Cinema placeholder ── */}
            <div className="relative w-full h-52 flex items-center justify-center bg-[#EDE7D9] overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none flex items-center justify-center">
                <div className="w-3/4 h-3/4 rounded-full bg-[#B8952A]/10 blur-3xl" />
              </div>

              {cat.isComing ? (
                <motion.div
                  animate={{ y: [0, -14, 0] }}
                  transition={{ duration: 5 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex flex-col items-center gap-3"
                >
                  <Film
                    size={80}
                    className="opacity-40 group-hover:opacity-90 transition-all duration-1000 drop-shadow-[0_0_0px_rgba(184,149,42,0)] group-hover:drop-shadow-[0_0_30px_rgba(184,149,42,0.4)]"
                    style={{ color: '#B8952A' }}
                  />
                </motion.div>
              ) : (
                <motion.img
                  src={cat.artifact}
                  alt={cat.name}
                  className="w-[82%] h-[82%] object-contain opacity-70 group-hover:opacity-100 transition-all duration-1000 drop-shadow-[0_4px_16px_rgba(26,22,18,0.15)] group-hover:drop-shadow-[0_8px_32px_rgba(184,149,42,0.30)]"
                  style={{ filter: 'brightness(0.4) sepia(0.3) saturate(0.8)' }}
                  animate={{ y: [0, -14, 0] }}
                  transition={{ duration: 5 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </div>

            {/* ── Photo / Cinema frame ── */}
            <div className="aspect-[3/4] overflow-hidden relative">
              {cat.isComing ? (
                <div className="w-full h-full bg-[#E8E0D0] flex flex-col items-center justify-center relative">
                  {/* Animated scan line */}
                  <motion.div
                    className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#B8952A]/30 to-transparent"
                    animate={{ top: ['10%', '90%', '10%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  {/* Corner marks */}
                  <div className="absolute top-4 left-4 w-5 h-5 border-t border-l border-[#B8952A]/30" />
                  <div className="absolute top-4 right-4 w-5 h-5 border-t border-r border-[#B8952A]/30" />
                  <div className="absolute bottom-4 left-4 w-5 h-5 border-b border-l border-[#B8952A]/30" />
                  <div className="absolute bottom-4 right-4 w-5 h-5 border-b border-r border-[#B8952A]/30" />
                  {/* Play icon center */}
                  <Play size={28} className="text-[#1a1612] opacity-15 group-hover:opacity-35 transition-opacity duration-700" fill="#1a1612" />
                  <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#E8E0D0] to-transparent" />
                  <div className="absolute inset-0 border border-transparent group-hover:border-[#B8952A]/25 transition-colors duration-700 pointer-events-none" />
                </div>
              ) : (
                <>
                  <img
                    src={cat.result}
                    alt={cat.name}
                    className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-all duration-[2s] ease-out"
                    style={{ filter: 'grayscale(0.15) brightness(1.05) contrast(0.95)' }}
                  />
                  <div className="absolute inset-0 bg-[#F5F0E8]/15 group-hover:bg-transparent transition-colors duration-[2s]" />
                  <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#F5F0E8] to-transparent" />
                  <div className="absolute inset-0 border border-transparent group-hover:border-[#B8952A]/20 transition-colors duration-700 pointer-events-none" />
                </>
              )}
            </div>

            {/* ── Label ── */}
            <div className="px-6 py-6 border-t border-[#1a1612]/8 group-hover:border-[#B8952A]/25 transition-colors duration-700">
              <div className="flex items-center gap-3 mb-1">
                <p className="text-[8px] font-mono uppercase tracking-[0.5em] text-[#B8952A]/60 group-hover:text-[#B8952A] transition-colors">
                  {cat.discipline}
                </p>
                {cat.isComing && (
                  <span className="text-[7px] font-mono uppercase tracking-[0.3em] text-[#B8952A]/70 border border-[#B8952A]/35 px-1.5 py-0.5 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-[#B8952A] animate-pulse inline-block" />
                    Soon
                  </span>
                )}
              </div>
              <h3 className="text-xl font-serif text-[#1a1612] tracking-tight leading-tight luxury-script group-hover:text-[#B8952A] transition-colors duration-700">
                {cat.name}
              </h3>
              <p className="text-[8px] font-mono uppercase tracking-[0.4em] text-[#1a1612]/35 mt-2">
                {cat.subtext}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <DomainTransition
        visible={!!transitionData}
        label={transitionData?.label || ''}
        discipline={transitionData?.discipline || ''}
      />
    </div>
  );
}
