import React from 'react';
import { motion } from 'framer-motion';
import type { PhotographyPreset } from '../lib/photographyPresets';
import { PHOTOGRAPHY_PRESETS } from '../lib/photographyPresets';

interface PersonaCarouselProps {
  onSelect: (preset: PhotographyPreset) => void;
  activeId: string | null;
}

export const PersonaCarousel: React.FC<PersonaCarouselProps> = ({ onSelect, activeId }) => {
  return (
    <div className="w-full py-16 overflow-hidden">
      <div className="flex flex-col items-center space-y-10">
        <div className="text-center">
          <h4 className="text-[10px] font-mono uppercase tracking-[0.8em] text-[#D4AF37]/40 mb-2">Photography Presets</h4>
          <h2 className="text-4xl font-serif italic text-white">Pick Your Look</h2>
          <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.4em] mt-2">Selecting a preset fills your Lens, Lighting & Background automatically</p>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-10 px-8 no-scrollbar snap-x snap-mandatory scroll-smooth w-full">
          {PHOTOGRAPHY_PRESETS.map((preset) => (
            <motion.div
              key={preset.id}
              onClick={() => onSelect(preset)}
              whileHover={{ y: -8 }}
              className={`flex-none w-[240px] snap-center cursor-pointer transition-all duration-700 ${
                activeId === preset.id ? 'opacity-100 scale-100' : 'opacity-30 scale-95 grayscale'
              }`}
            >
              <div className={`relative aspect-[3/4] overflow-hidden border ${
                activeId === preset.id
                  ? 'border-[#D4AF37]/60 shadow-[0_0_30px_rgba(212,175,55,0.12)]'
                  : 'border-white/5'
              }`}>
                <img
                  src={preset.image}
                  alt={preset.name}
                  className="w-full h-full object-cover transition-transform duration-[4s] hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                {/* Active indicator */}
                {activeId === preset.id && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                )}

                <div className="absolute bottom-6 left-5 right-5">
                  <p className="text-[7px] font-mono uppercase tracking-[0.4em] text-[#D4AF37]/60 mb-1">{preset.tag}</p>
                  <h3 className="text-lg font-serif italic text-white leading-tight mb-2">{preset.name}</h3>
                  <p className="text-[8px] font-sans text-white/50 leading-relaxed">{preset.vibe}</p>
                </div>
              </div>

              {/* Settings preview shown on active */}
              {activeId === preset.id && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 px-2 space-y-1"
                >
                  {[
                    ['Light', preset.lighting],
                    ['Lens', preset.camera.split('(')[0].trim()],
                    ['BG', preset.bg.replace(/-/g, ' ').replace('custom bg', 'Environmental')],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between text-[7px] font-mono text-white/30 uppercase tracking-[0.3em]">
                      <span>{label}</span>
                      <span className="text-[#D4AF37]/50">{val}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
