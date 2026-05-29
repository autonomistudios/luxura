import React from 'react';
import { motion } from 'framer-motion';
import { Watch, Ruler, Wind } from 'lucide-react';

interface KineticMetricProps {
  label: string;
  value: number;
  icon: React.ElementType;
  delay: number;
}

const KineticMetric: React.FC<KineticMetricProps> = ({ label, value, icon: Icon, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 1, ease: [0.16, 1, 0.3, 1] }}
    className="py-6 border-b border-[#1C1C1C]/8 group relative"
  >
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-4 text-[#1C1C1C]">
        <div className="p-2 border border-[#1C1C1C]/10 group-hover:border-[#D4AF37]/30 transition-all duration-700 bg-[#1C1C1C]/[0.02]">
          <Icon size={12} className="opacity-40" />
        </div>
        <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#1C1C1C]/35 group-hover:text-[#1C1C1C] transition-opacity">{label}</span>
      </div>
      <span className="text-[11px] font-mono text-[#1C1C1C] tracking-[0.3em] font-black">{value}%</span>
    </div>
    <div className="w-full h-[1px] bg-[#1C1C1C]/[0.06] overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ delay: delay + 0.8, duration: 2, ease: [0.16, 1, 0.3, 1] }}
        className="h-full bg-[#D4AF37]/50"
      />
    </div>
  </motion.div>
);

export const KineticAudit: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-10 border border-[#1C1C1C]/8 bg-[#F2EFE9] relative overflow-hidden"
    >
      <div className="absolute top-8 left-0 w-[1px] h-32 bg-gradient-to-b from-[#D4AF37]/30 to-transparent" />

      <div className="flex justify-between items-baseline mb-12">
        <h4 className="text-[11px] font-mono text-[#1C1C1C]/60 uppercase tracking-[0.8em] italic">NOIR_KINETIC_AUDIT</h4>
        <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
      </div>

      <div className="space-y-2">
        <KineticMetric label="Mechanical Logic" value={98.4} icon={Watch} delay={0.2} />
        <KineticMetric label="Fibre Fidelity"   value={96.1} icon={Ruler} delay={0.4} />
        <KineticMetric label="Optical Physics"  value={92.7} icon={Wind}  delay={0.6} />
      </div>

      <div className="mt-16 pt-8 border-t border-[#1C1C1C]/8">
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <span className="text-[8px] font-mono uppercase tracking-[0.8em] text-[#1C1C1C]/35">Sync_Status: LOCKED</span>
            <div className="flex gap-2 h-4 items-end">
              {[...Array(16)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [4, 14, 4], opacity: [0.2, 0.6, 0.2] }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.1 }}
                  className="w-[1px] bg-[#D4AF37]/50"
                />
              ))}
            </div>
          </div>
          <span className="text-[7px] font-mono text-[#1C1C1C]/20 uppercase tracking-[0.4em] vertical-text">MECHANICAL_S_CORE</span>
        </div>
      </div>
    </motion.div>
  );
};

export default KineticAudit;
