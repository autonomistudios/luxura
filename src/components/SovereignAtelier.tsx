import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface Domain {
  id: string;
  name: string;
  subtext: string;
  masterImageUrl: string;
  artifactIconUrl: string;
  theme?: 'aura' | 'noir';
}

interface SovereignAtelierProps {
  domains: Domain[];
  onSelect: (id: string) => void;
}

/**
 * Sovereign Atelier - The Editorial Selection Grid
 * Features:
 * - Asymmetrical Editorial Layout.
 * - Unified Theme Control (Aura/Noir).
 * - Cinematic Fidelity Transitions.
 */
const SovereignAtelier: React.FC<SovereignAtelierProps> = ({ domains, onSelect }) => {
  const [activeTheme, setActiveTheme] = useState<'aura' | 'noir'>('aura');

  const handleDomainHover = (domain: Domain) => {
    const theme = domain.theme === 'noir' ? 'noir' : 'aura';
    setActiveTheme(theme);
    // Sync with the app wrapper if needed
    document.documentElement.setAttribute('data-theme', theme);
  };

  return (
    <div className="pb-40 transition-colors duration-1000">
      <style>{`
        .glint-text { 
           background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
           background-size: 200% auto;
           transition: color 1s ease;
        }
      `}</style>
      
      {/* Header: Editorial Context */}
      <header className="mb-32 flex justify-between items-end border-b border-white/5 pb-10 max-w-[1600px] mx-auto transition-colors duration-1000">
        <div className="blur-in" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-7xl font-serif text-white tracking-tighter leading-none mb-6">
            DOMAIN <span className="text-accent italic">SELECTION</span>
          </h1>
          <p className="text-[11px] font-mono uppercase tracking-[0.6em] text-white/30">
            SELECT A MASTER DOMAIN TO INITIALIZE SOVEREIGN_CORE_GENERATION
          </p>
        </div>
        <div className="flex flex-col items-end gap-3 text-[10px] font-mono uppercase tracking-[0.5em] text-white/20 pb-2 blur-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-accent shadow-accent" />
             <span>NEURAL_LOAD: OPTIMAL</span>
          </div>
          <span>STUDIO_2_CORE_V3.8</span>
        </div>
      </header>

      {/* The Editorial Matrix: 12-Column Asymmetry */}
      <div className="grid grid-cols-12 gap-x-16 gap-y-48 items-start max-w-[1600px] mx-auto">
        {domains.map((domain, i) => {
          // Editorial Asymmetry Logic: Alternate column spreads
          const colSpan = i % 2 === 0 ? 'col-span-12 lg:col-span-7' : 'col-span-12 lg:col-span-5 lg:mt-32';
          
          return (
            <motion.div 
              key={domain.id}
              onClick={() => onSelect(domain.id)}
              onMouseEnter={() => handleDomainHover(domain)}
              onMouseLeave={() => {
                setActiveTheme('aura');
                document.documentElement.setAttribute('data-theme', 'aura');
              }}
              className={`relative group cursor-pointer ${colSpan}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 2, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Internal Metadata Marker */}
              <div className="absolute -left-16 top-0 text-[10px] font-mono text-white/10 uppercase tracking-[0.8em] vertical-text hidden xl:block">
                DNA_ARTIFACT_TYPE_00{i+1}
              </div>

              {/* The Cinematic Asset Container */}
              <div className="relative aspect-[4/5] overflow-hidden bg-anthracite grayscale group-hover:grayscale-0 transition-all duration-[2s] ease-in-out shadow-[0_60px_120px_rgba(0,0,0,0.9)] border border-white/5 group-hover:border-accent/30">
                <motion.img 
                  src={domain.masterImageUrl} 
                  alt={domain.name}
                  className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-[4s] ease-out-quint"
                />
                
                {/* Editorial Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-95 group-hover:opacity-40 transition-opacity duration-[1.5s]" />
                
                {/* Interactive Scanline Overlay */}
                {activeTheme === 'noir' && domain.theme === 'noir' && (
                   <div className="dna-scanline opacity-20" />
                )}
              </div>

              {/* Content Integration */}
              <div className="mt-12 flex justify-between items-start border-l border-white/5 pl-8 transition-colors duration-1000">
                <div className="space-y-4">
                  <h3 className="text-4xl font-serif text-accent uppercase tracking-wider leading-none group-hover:translate-x-4 transition-all duration-1000 group-hover:text-white">
                    {domain.name}
                  </h3>
                  <p className="text-[11px] font-mono text-white/40 uppercase tracking-[0.4em] leading-relaxed max-w-[320px]">
                    {domain.subtext}
                  </p>
                </div>
                
                {/* 3D Representative Artifact Icon */}
                <div className="relative w-24 h-24 border border-white/5 group-hover:border-accent/40 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-1000 p-4 bg-white/[0.02] backdrop-blur-xl">
                   <img 
                    src={domain.artifactIconUrl} 
                    alt="Persona Artifact" 
                    className="w-full h-full object-contain opacity-40 group-hover:opacity-100 transition-opacity duration-1000"
                  />
                  <div className="absolute inset-0 border border-white/0 group-hover:border-accent/10 transition-all" />
                </div>
              </div>

              {/* Selection Inducer: Editorial Line */}
              <div className="absolute -bottom-8 left-8 right-0 h-[1px] bg-white/5 group-hover:bg-accent/60 transition-all duration-[1.5s] origin-left scale-x-0 group-hover:scale-x-100" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SovereignAtelier;
