import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Upload, Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SetItem {
  id: string;
  name: string;
  status: 'ready' | 'calibrating' | 'failed';
  intensity: number;
  colorTemp: number;
  shadowSoftness: number;
  thumbnailUrl?: string;
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between">
        <span className="text-[8px] font-mono tracking-[0.3em] uppercase text-white/30">{label}</span>
        <span className="text-[8px] font-mono text-white/40">{value}%</span>
      </div>
      <input type="range" min="0" max="100" value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: '#C5A253', background: `linear-gradient(to right, #C5A253 ${value}%, rgba(255,255,255,0.08) ${value}%)` }} />
    </div>
  );
}

function SetCard({ set, onUpdate }: { set: SetItem; onUpdate: (id: string, field: string, val: number) => void }) {
  const statusColor = set.status === 'ready' ? '#10B981' : set.status === 'failed' ? '#EF4444' : '#F59E0B';
  const statusLabel = set.status === 'ready' ? 'MESH CALIBRATED 100%' : set.status === 'failed' ? 'CALIBRATION FAILED' : 'CALIBRATING SPATIALS...';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Set image */}
      <div className="aspect-[16/9] relative overflow-hidden bg-[#0D0D10]">
        {set.thumbnailUrl
          ? <img src={set.thumbnailUrl} className="w-full h-full object-cover" />
          : <div className="absolute inset-0 flex items-center justify-center"><Layers size={24} className="text-white/10" /></div>
        }
        {set.status === 'calibrating' && (
          <motion.div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C5A253] to-transparent opacity-70"
            animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
        )}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded text-[7px] font-mono tracking-[0.2em]"
          style={{ color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}30` }}>
          {set.status === 'ready' && <Check size={8} />}
          {set.status === 'calibrating' && <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />}
          {set.status === 'failed' && <AlertTriangle size={8} />}
          {statusLabel}
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        <h3 className="text-[13px] font-medium text-white/80">{set.name}</h3>

        {set.status === 'ready' && (
          <div className="flex flex-col gap-3">
            <Slider label="Global Intensity" value={set.intensity} onChange={v => onUpdate(set.id, 'intensity', v)} />
            <Slider label="Color Temperature" value={set.colorTemp} onChange={v => onUpdate(set.id, 'colorTemp', v)} />
            <Slider label="Shadow Softness" value={set.shadowSoftness} onChange={v => onUpdate(set.id, 'shadowSoftness', v)} />
          </div>
        )}

        {set.status === 'calibrating' && (
          <div className="flex flex-col gap-2">
            <div className="w-full h-px bg-white/[0.04] rounded overflow-hidden">
              <motion.div className="h-full bg-[#F59E0B]/60 rounded" animate={{ width: ['0%', '70%', '40%', '90%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
            </div>
            <p className="text-[8px] font-mono text-[#F59E0B]/60">Extracting spatial lighting signature...</p>
          </div>
        )}

        <button className="w-full py-2 rounded text-[9px] font-mono tracking-[0.2em] uppercase transition-all"
          style={{ background: set.status === 'ready' ? '#C5A253' : 'rgba(255,255,255,0.04)',
            color: set.status === 'ready' ? '#000' : 'rgba(255,255,255,0.4)',
            border: set.status === 'ready' ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
          {set.status === 'ready' ? 'Use in Forge' : set.status === 'failed' ? 'Retry' : 'Calibrating...'}
        </button>
      </div>
    </motion.div>
  );
}

export default function SetInjectionManager() {
  const { brand } = useAuth();
  const [sets, setSets] = useState<SetItem[]>([
    { id: 'set-1', name: 'Amalfi Coastal Terrace', status: 'ready', intensity: 78, colorTemp: 65, shadowSoftness: 45 },
    { id: 'set-2', name: 'Brutalist Milan Gallery', status: 'ready', intensity: 45, colorTemp: 35, shadowSoftness: 90 },
    { id: 'set-3', name: 'Wet Marble Studio Floor', status: 'calibrating', intensity: 90, colorTemp: 50, shadowSoftness: 10 },
  ]);

  function handleUpdate(id: string, field: string, val: number) {
    setSets(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  }

  return (
    <div className="p-8 min-h-full">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display italic text-4xl text-primary mb-2">Virtual Backlot</h1>
          <p className="text-[9px] font-mono tracking-[0.35em] uppercase text-white/25">
            Upload physical set references — LuxAura calibrates light-bounce and spatial depth
          </p>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono text-white/30">
          <span className="text-emerald-500">{sets.filter(s => s.status === 'ready').length} Calibrated</span>
          <span>·</span>
          <span className="text-amber-500">{sets.filter(s => s.status === 'calibrating').length} Calibrating</span>
        </div>
      </div>

      {/* Upload zone */}
      <motion.div
        whileHover={{ borderColor: 'rgba(197,162,83,0.4)' }}
        className="rounded flex items-center justify-between gap-6 px-8 py-6 mb-8 cursor-pointer transition-all"
        style={{ border: '2px dashed rgba(255,255,255,0.10)', background: 'linear-gradient(145deg, #0D0D10 0%, #050505 100%)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center border border-white/[0.06]"
            style={{ background: 'rgba(197,162,83,0.06)' }}>
            <Upload size={18} className="text-[#C5A253]" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/50">Inject New Set</p>
            <p className="text-[9px] font-mono text-white/25 mt-0.5">
              Upload 1–3 panoramic reference photos · LuxAura extracts lighting signature and spatial DNA
            </p>
          </div>
        </div>
        <button className="px-5 py-2.5 rounded border border-white/[0.10] text-[9px] font-mono text-white/40 hover:text-white hover:border-white/20 transition-all uppercase tracking-[0.2em] flex-shrink-0">
          Upload References
        </button>
      </motion.div>

      {/* Set grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sets.map(set => (
          <SetCard key={set.id} set={set} onUpdate={handleUpdate} />
        ))}
      </div>
    </div>
  );
}
