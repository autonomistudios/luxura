import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const RefinementOverlay: React.FC<{ isRefining: boolean, message?: string }> = ({ isRefining, message = "Polishing the Silhouette..." }) => {
  return (
    <AnimatePresence>
      {isRefining && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-black/20 backdrop-blur-md z-50">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="text-center">
              <h3 className="text-5xl font-serif text-white mb-4 luxury-script">{message}</h3>
              <p className="font-mono text-[10px] tracking-[0.5em] text-white/50 uppercase">DEVELOPING THE VISION</p>
            </div>
            
            <div className="w-16 h-16 border-t-2 border-[#D4AF37] rounded-full animate-spin mt-4" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
