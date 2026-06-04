import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MasterExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: any;
}

export const MasterExportModal: React.FC<MasterExportModalProps> = ({ isOpen, onClose, asset }) => {
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExtraction = (_type: string) => {
    // Simulate high-fidelity asset rendering (1.5s)
    setExtracting(true);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setExtracting(false);
            setProgress(0);
            onClose();
          }, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 80);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/60 backdrop-blur-3xl"
        >
          <div className="relative w-full max-w-lg bg-[#050505] border border-white/10 p-6 md:p-12 overflow-hidden shadow-2xl h-[100dvh] md:h-auto overflow-y-auto">
            {/* The Asset Shadow Background */}            
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A253]/5 blur-[80px] -z-10" />
            
            <div className="space-y-12">              
              <div className="flex justify-between items-start">                
                <div>                  
                  <h2 className="text-3xl font-serif italic text-white mb-2">Master Extraction</h2>                  
                  <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-white/30">ID: {asset?.id} // 150MP TIFF READY</p>                
                </div>                
                <button onClick={onClose} className="text-white/20 hover:text-white transition-colors uppercase text-[9px] tracking-widest">Close</button>              
              </div>              
              
              {/* Format Selection vs Extraction View */}              
              <AnimatePresence mode="wait">                
                {!extracting ? (                  
                  <motion.div                     
                    key="selector"                    
                    initial={{ opacity: 0, y: 10 }}                    
                    animate={{ opacity: 1, y: 0 }}                    
                    className="space-y-4"                  
                  >                    
                    {[                      
                      { label: 'Master Archive', detail: '150MP TIFF // 48-bit Color' },                      
                      { label: 'Studio Portfolio', detail: '4K WebP // Social Optimized' },                      
                      { label: 'Mobile Original', detail: 'RAW Geometry // DNA Encrypted' }                    
                    ].map((format) => (                      
                      <button                         
                        key={format.label}                        
                        onClick={() => handleExtraction(format.label)}                        
                        className="w-full text-left p-6 border border-white/5 hover:border-[#C5A253]/40 transition-all group relative overflow-hidden"                      
                      >                        
                        <span className="text-xs font-serif italic text-white block mb-1 group-hover:text-[#C5A253] transition-colors">{format.label}</span>                        
                        <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">{format.detail}</span>                      
                      </button>                    
                    ))}                  
                  </motion.div>                
                ) : (                  
                  <motion.div                     
                    key="extracting"                    
                    initial={{ opacity: 0 }}                    
                    animate={{ opacity: 1 }}                    
                    className="py-12 space-y-8 text-center"                  
                  >                    
                    <p className="text-[10px] font-mono uppercase tracking-[0.8em] text-[#C5A253] animate-pulse">Extracting Asset...</p>                    
                    <div className="w-full h-[1px] bg-white/5 relative overflow-hidden">                       
                      <motion.div                         
                        initial={{ width: 0 }}                        
                        animate={{ width: `${progress}%` }}                        
                        className="absolute h-full bg-gradient-to-r from-transparent via-[#C5A253] to-white shadow-[0_0_15px_rgba(197,162,83,0.4)]"                       
                      />
                    </div>
                  </motion.div>
                )}              
              </AnimatePresence>              
              
              {/* Provenance Footer */}              
              <div className="pt-6 border-t border-white/5 flex justify-between items-center opacity-20">                
                <span className="text-[7px] font-mono uppercase tracking-[0.4em]">Sovereign Tier // Extraction Protocol v2.6</span>                
                <span className="text-[7px] font-mono uppercase tracking-[0.4em]">Secure Key Locked</span>              
              </div>            
            </div>          
          </div>        
        </motion.div>      
      )}    
    </AnimatePresence>  
  );
};
