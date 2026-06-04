import React from 'react';
import { motion } from 'framer-motion';

interface SessionInitializationProps {
  domainName: string;
}

export const SessionInitialization: React.FC<SessionInitializationProps> = ({ domainName }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center"
  >
    {/* The Obsidian Wipe: Subtle texture overlay */}
    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

    <div className="relative z-10 text-center space-y-12">
      {/* Branding Reveal */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "circOut" }}
      >
        <h2 className="text-5xl font-serif italic text-white tracking-tighter">
          Initializing <span className="text-[#C5A253]">{domainName}</span>
        </h2>
        <p className="text-[10px] font-mono uppercase tracking-[0.6em] text-white/30 mt-4">
          Sovereign Protocol // Secure Intake Active
        </p>
      </motion.div>

      {/* The Gold-Script Progress Bar (The Hairline) */}
      <div className="relative w-64 h-[1px] bg-white/5 mx-auto overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C5A253] to-transparent"
        />
      </div>

      {/* Narrative Loop (Wait Message) */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-[9px] font-mono italic text-[#C5A253]/50 tracking-[0.4em] uppercase"
      >
        Opening the Atelier...
      </motion.p>
    </div>
  </motion.div>
);
