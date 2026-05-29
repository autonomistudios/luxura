import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Loader2, Shield } from 'lucide-react';

interface AssetUploaderProps {
    category: string;
    onUploadComplete: (file: File) => void;
}

export default function AssetUploader({ category, onUploadComplete }: AssetUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [scanning, setScanning] = useState(false);
    const [completed, setCompleted] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const selectedFile = acceptedFiles[0];
            setFile(selectedFile);
            simulateScanning(selectedFile);
        }
    }, []);

    const simulateScanning = (selectedFile: File) => {
        setScanning(true);
        setTimeout(() => {
            setScanning(false);
            setCompleted(true);
            setTimeout(() => { onUploadComplete(selectedFile); }, 1000);
        }, 3500);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1,
        disabled: scanning || completed,
    });

    const reset = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFile(null);
        setScanning(false);
        setCompleted(false);
    };

    return (
        <div className="relative w-full aspect-[4/5] lg:aspect-[16/9] bg-[#F2EFE9] border border-[#1C1C1C]/8 overflow-hidden transition-all duration-1000 group">

            <AnimatePresence mode="wait">
                {!file ? (
                    <div {...getRootProps()} className="h-full">
                        <motion.div
                            key="intake"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col items-center justify-center cursor-pointer relative"
                        >
                            <input {...getInputProps()} />

                            {/* Pulse ring */}
                            <motion.div
                                animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.2, 0.1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute w-[300px] h-[300px] border border-accent rounded-full pointer-events-none"
                            />

                            <div className="relative z-10 flex flex-col items-center gap-8">
                                <div className={`p-8 border transition-all duration-1000 ${isDragActive ? 'border-accent bg-accent/10' : 'border-[#1C1C1C]/12 bg-[#1C1C1C]/[0.02]'}`}>
                                    <Upload size={48} className={`transition-colors duration-1000 ${isDragActive ? 'text-accent' : 'text-[#1C1C1C]/25'}`} />
                                </div>

                                <div className="text-center space-y-4">
                                    <h3 className="text-3xl font-serif text-[#1C1C1C] tracking-tighter italic">INTAKE <span className="text-accent underline underline-offset-8">SOURCE</span></h3>
                                    <p className="text-[10px] font-mono text-[#1C1C1C]/40 uppercase tracking-[0.6em]">DRAG & DROP {category.toUpperCase()} MASTER ASSET</p>
                                </div>

                                <div className="px-6 py-2 border border-[#1C1C1C]/10 text-[9px] font-mono text-[#1C1C1C]/30 uppercase tracking-[0.3em]">
                                    SUPPORTS: JPG_PNG_HEIC // 150MP_COMPLIANT
                                </div>
                            </div>

                            {/* Corner marks */}
                            <div className="absolute top-10 left-10 w-4 h-4 border-t border-l border-[#1C1C1C]/15" />
                            <div className="absolute top-10 right-10 w-4 h-4 border-t border-r border-[#1C1C1C]/15" />
                            <div className="absolute bottom-10 left-10 w-4 h-4 border-b border-l border-[#1C1C1C]/15" />
                            <div className="absolute bottom-10 right-10 w-4 h-4 border-b border-r border-[#1C1C1C]/15" />
                        </motion.div>
                    </div>
                ) : (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full w-full relative flex items-center justify-center bg-[#0A0A0A]"
                    >
                        <img
                            src={URL.createObjectURL(file)}
                            alt="Ingestion Preview"
                            className={`max-w-full max-h-full object-contain transition-all duration-[3s] ${scanning ? 'blur-md grayscale opacity-40 scale-110' : 'opacity-100'}`}
                        />

                        {!scanning && !completed && (
                            <button
                                onClick={reset}
                                className="absolute top-10 right-10 z-50 px-6 py-2 bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-mono text-white/60 uppercase tracking-widest hover:border-accent hover:text-white transition-all"
                            >
                                [ ABORT_SOURCE ]
                            </button>
                        )}

                        {/* MANTIS DNA SCANNER OVERLAY — intentionally dark */}
                        <AnimatePresence>
                            {scanning && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-40"
                                >
                                    <motion.div
                                        className="absolute left-0 right-0 h-[2px] bg-accent shadow-[0_0_30px_var(--accent-color)] z-50"
                                        animate={{ top: ['-10%', '110%'] }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                                    />
                                    <div className="absolute inset-x-20 inset-y-10 border border-white/10 border-dashed" />
                                    <div className="absolute inset-x-10 inset-y-20 border border-white/10 border-dashed" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="p-12 bg-black/80 backdrop-blur-2xl border border-accent/20 flex flex-col items-center gap-6 shadow-2xl">
                                            <Loader2 size={32} className="animate-spin text-accent" />
                                            <div className="text-center space-y-2">
                                                <h4 className="text-xl font-serif text-white italic">DNA_MATRIC_MAPPING</h4>
                                                <p className="text-[9px] font-mono text-accent/60 uppercase tracking-[0.4em]">EXTRACTING {category.toUpperCase()} FIDELITY VECTORS...</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* LOCK SUCCESS — intentionally dark overlay on image */}
                        <AnimatePresence>
                            {completed && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center"
                                >
                                    <div className="p-16 border border-accent/40 bg-black/60 flex flex-col items-center gap-8 shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                                        <div className="w-24 h-24 rounded-full border border-accent flex items-center justify-center shadow-accent">
                                            <Shield size={40} className="text-accent" />
                                        </div>
                                        <div className="text-center space-y-3">
                                            <h2 className="text-3xl font-serif text-white italic tracking-tighter">FIDELITY_LOCKED</h2>
                                            <p className="text-[10px] font-mono text-white/60 uppercase tracking-[0.6em] leading-relaxed">
                                                {category.toUpperCase()} ARTIFACTS SUCCESSFULLY RECONSTRUCTED
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay z-[100]">
                <div className="w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            </div>
        </div>
    );
}
