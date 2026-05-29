import { motion } from 'framer-motion';
import { CheckCircle } from "lucide-react";

export default function MasterApprovalSeal() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 2 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.8, type: "spring", stiffness: 100 }}
      className="absolute bottom-8 right-8 flex flex-col items-end gap-2"
    >
      <div className="flex items-center gap-3 bg-[#050505]/80 backdrop-blur-xl px-5 py-2.5 border border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
        <CheckCircle size={14} className="text-[#D4AF37]" />
        <span className="font-mono text-[9px] tracking-[0.4em] text-[#D4AF37] uppercase font-black italic">
          Studio Grade Approved
        </span>
      </div>
      <p className="font-mono text-[8px] text-white/30 uppercase tracking-[0.8em] mr-1">
        Mantis Engine // DNA Safe
      </p>
    </motion.div>
  );
}
