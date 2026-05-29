import React from 'react';
import { motion } from 'framer-motion';

interface SovereignCategoryCardProps {
  title: string;
  description: string;
  imageUrl: string;
  iconUrl: string;
  onClick?: () => void;
  selected?: boolean;
}

/**
 * Sovereign Category Card - Ultra-Premium Edition
 * Features:
 * - Helix Spin: 360-degree Y-axis rotation of the 3D Artifact on hover.
 * - Gold-Glint: Shimmering metallic reflection on typography.
 * - Kinetic Zoom: Cinematic scale transformation of the master backdrop.
 * - DNA Architecture: Sharp 4px corners and obsidian-vault contrast.
 */
const SovereignCategoryCard: React.FC<SovereignCategoryCardProps> = ({ 
  title, 
  description, 
  imageUrl, 
  iconUrl, 
  onClick,
  selected 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`relative group w-full overflow-hidden rounded-[4px] bg-obsidian border transition-all duration-700 cursor-pointer 
        ${selected ? 'border-gold shadow-[0_0_30px_rgba(212,175,55,0.2)]' : 'border-neutral-900 hover:border-gold/40'}`}
    >
      
      {/* Background Image Kinetic Zoom */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-700"
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 4, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 p-8 flex flex-col items-center text-center min-h-[460px] justify-end">
        
        {/* Helix Spin Icon Container (3D Artifact) */}
        <motion.div
          className="mb-10 w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-gold-light via-gold to-gold-dark p-[1px] shadow-2xl shadow-gold/20"
          whileHover={{ rotateY: 360 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-obsidian flex items-center justify-center">
            <img 
              src={iconUrl} 
              alt={`${title} Artifact`} 
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>

        {/* Gold-Glint Header Animation */}
        <h3 className="relative mb-4 text-2xl font-serif font-black tracking-[0.2em] text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gold-light group-hover:via-white group-hover:to-gold-light group-hover:bg-[length:200%_auto] group-hover:animate-glint transition-all duration-500 uppercase">
          {title}
        </h3>

        <p className="text-neutral-500 text-xs font-mono leading-relaxed max-w-[280px] group-hover:text-neutral-300 transition-colors duration-500 uppercase tracking-widest">
          {description}
        </p>

        {/* DNA Selection Indicator */}
        {selected && (
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '40%' }}
            className="h-[2px] bg-gold mt-6 shadow-[0_0_10px_#D4AF37]"
          />
        )}

        {/* Subtle Bottom Interactive Accent */}
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gold/50 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-700" />
      </div>
    </div>
  );
};

export default SovereignCategoryCard;
