import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MasterApprovalSeal from './MasterApprovalSeal';
import AssetActionsDrawer from './AssetActionsDrawer';
import { X, Film, Download } from 'lucide-react';
import { exportSocialImage, downloadDataUrl, type SocialFormat } from '../lib/social-export';

interface MasterpieceRevealProps {
    masterImage: string;
    assetId: number;
    onDeploy: () => void;
    onClose: () => void;
    isDeploying?: boolean;
    deployError?: string | null;
}

export const MasterpieceReveal: React.FC<MasterpieceRevealProps> = ({ masterImage, assetId, onDeploy, onClose, isDeploying = false, deployError = null }) => {
    const [isRevealed, setIsRevealed] = useState(false);
    const [isExporting, setIsExporting] = useState<SocialFormat | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Reduced to 400ms for snappier haptic engagement
        const timer = setTimeout(() => setIsRevealed(true), 400); 
        return () => clearTimeout(timer);
    }, []);

    const handleExport = async (format: SocialFormat, filename: string) => {
        setIsExporting(format);
        await exportSocialImage(masterImage, format, (dataUrl) => {
            downloadDataUrl(dataUrl, filename);
            setIsExporting(null);
        });
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col md:flex-row items-center justify-center bg-[#FAF9F6]/95 backdrop-blur-md pb-20 md:pb-0 px-4">
            
            {/* The Return Path (Close Button) */}
            <button 
                onClick={onClose}
                aria-label="Close Preview"
                className="absolute top-10 right-10 text-[#6E6A60] hover:text-[#1C1C1C] hover:scale-110 cursor-pointer pointer-events-auto z-[999] p-4 transition-all"
            >
                <X size={32} strokeWidth={1} />
            </button>

            {/* 1. The 150MP Master Asset / Kinetic Expansion */}      
            <motion.div         
                layoutId={`asset-${assetId}`}
                className="relative w-full md:w-auto md:h-[85vh] aspect-[4/5] overflow-hidden shadow-2xl bg-white border border-[#E5E0D8] z-[110]"      
            >        
                <img           
                    src={masterImage}           
                    className={`w-full h-full object-cover transition-all duration-[2s] ${isRevealed ? 'blur-0 scale-100' : 'blur-xl scale-[1.02]'}`}         
                    alt="Sovereign Outcome"
                />
                
                {isRevealed && <MasterApprovalSeal />}        
                {/* Removed black linen texture for a cleaner presentation */}
            </motion.div>      
            
            {/* 2. The Extraction Console (Mobile Bottom Sheet & Desktop Sidebar) */}      
            <div className={`fixed bottom-0 left-0 w-full md:relative md:w-[380px] md:ml-16 bg-white md:bg-transparent border-t md:border-t-0 border-[#E5E0D8] rounded-t-3xl md:rounded-none px-8 pb-12 pt-16 md:p-0 flex flex-col items-center md:items-start gap-10 transform transition-transform duration-[0.6s] ease-[cubic-bezier(0.16,1,0.3,1)] z-[120] shadow-[0_-20px_40px_rgba(0,0,0,0.03)] md:shadow-none ${isRevealed ? 'translate-y-0 opacity-100' : 'translate-y-full md:translate-y-0 md:opacity-0'}`}>
                <div className="space-y-4 text-center md:text-left">          
                    <h2 className="text-4xl md:text-5xl font-serif text-[#1C1C1C] tracking-tight leading-none">Editorial <br/><span className="italic font-light">Perfection</span></h2>          
                    <p className="text-[9px] font-mono uppercase tracking-[0.4em] text-[#6E6A60]">Authenticated // 150MP</p>        
                </div>        
                
                {/* The Deploy Button */}
                <div className="w-full space-y-3">
                    <motion.button
                        whileHover={isDeploying ? {} : { y: -2 }}
                        whileTap={isDeploying ? {} : { scale: 0.98 }}
                        onClick={isDeploying ? undefined : onDeploy}
                        disabled={isDeploying}
                        className="relative px-8 py-4 bg-[#1C1C1C] border border-[#1C1C1C] group overflow-hidden w-full disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-xl transition-all duration-300"
                    >
                        <span className="relative z-10 text-[10px] font-mono uppercase tracking-[0.3em] text-white">
                            {isDeploying ? 'Saving…' : 'Deploy to Vault'}
                        </span>
                    </motion.button>

                    {/* Animate This */}
                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            navigate('/video', { state: { sourceImage: masterImage } });
                            onClose();
                        }}
                        className="relative px-8 py-4 bg-white border border-[#E5E0D8] group overflow-hidden w-full hover:border-[#1C1C1C] transition-colors duration-300"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3 text-[10px] font-mono uppercase tracking-[0.3em] text-[#1C1C1C]">
                            <Film size={14} strokeWidth={1} />
                            Animate Sequence
                        </span>
                    </motion.button>
                </div>

                {/* Social Export Engine */}
                <div className="w-full pt-8 border-t border-[#E5E0D8] space-y-4">
                    <p className="text-[9px] font-mono text-[#6E6A60] uppercase tracking-[0.4em] text-center md:text-left">
                        Social Export
                    </p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <button
                            title="Download Original"
                            onClick={() => handleExport('original', `luxaura-master-${assetId}.jpg`)}
                            className="w-12 h-12 flex items-center justify-center border border-[#E5E0D8] hover:border-[#1C1C1C] text-[#6E6A60] hover:text-[#1C1C1C] hover:bg-[#F2EFE9] transition-colors rounded-sm"
                        >
                            <Download size={14} strokeWidth={1} className={isExporting === 'original' ? 'animate-bounce' : ''} />
                        </button>
                        <button
                            title="Story (9:16)"
                            onClick={() => handleExport('ig_story', `luxaura-story-${assetId}.jpg`)}
                            className="w-12 h-12 flex items-center justify-center border border-[#E5E0D8] hover:border-[#1C1C1C] text-[#6E6A60] hover:text-[#1C1C1C] hover:bg-[#F2EFE9] transition-colors rounded-sm"
                        >
                            <span className="text-[9px] font-mono tracking-widest">9:16</span>
                        </button>
                        <button
                            title="Post (1:1)"
                            onClick={() => handleExport('ig_post', `luxaura-square-${assetId}.jpg`)}
                            className="w-12 h-12 flex items-center justify-center border border-[#E5E0D8] hover:border-[#1C1C1C] text-[#6E6A60] hover:text-[#1C1C1C] hover:bg-[#F2EFE9] transition-colors rounded-sm"
                        >
                            <span className="text-[9px] font-mono tracking-widest">1:1</span>
                        </button>
                        <button
                            title="Landscape (16:9)"
                            onClick={() => handleExport('linkedin', `luxaura-cover-${assetId}.jpg`)}
                            className="w-12 h-12 flex items-center justify-center border border-[#E5E0D8] hover:border-[#1C1C1C] text-[#6E6A60] hover:text-[#1C1C1C] hover:bg-[#F2EFE9] transition-colors rounded-sm"
                        >
                            <span className="text-[9px] font-mono tracking-widest">16:9</span>
                        </button>
                    </div>
                </div>

                {deployError && (
                    <p className="text-[9px] font-mono text-red-500 text-center leading-relaxed max-w-xs">
                        {deployError}
                    </p>
                )}

                {/* Refine + Upscale */}
                <div className="w-full">
                    <AssetActionsDrawer image={masterImage} theme="light" />
                </div>
            </div>
        </div>,
        document.body
    );
};
