import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Search } from 'lucide-react';
import { LOCATION_PRESETS, LOCATION_CATEGORIES, type LocationPreset } from '../lib/locationPresets';

interface LocationPresetPickerProps {
  selected: LocationPreset | null;
  onSelect: (preset: LocationPreset | null) => void;
}

export function LocationPresetPicker({ selected, onSelect }: LocationPresetPickerProps) {
  const [open,     setOpen]     = useState(false);
  const [category, setCategory] = useState<string>('All');
  const [search,   setSearch]   = useState('');

  const filtered = LOCATION_PRESETS.filter((p) => {
    const matchCat = category === 'All' || p.category === category;
    const matchQ   = !search || p.label.toLowerCase().includes(search.toLowerCase()) ||
                     p.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div className="space-y-3">
      <p className="text-[8px] font-mono uppercase tracking-[0.4em] text-[#1C1C1C]/40">Location Preset</p>

      <button
        onClick={() => setOpen(true)}
        className={`w-full flex items-center gap-3 px-4 py-3 border text-left transition-all duration-300 ${
          selected
            ? 'border-[#C5A253]/40 bg-[#C5A253]/[0.03]'
            : 'border-[#1C1C1C]/10 bg-[#1C1C1C]/[0.02] hover:border-[#1C1C1C]/25'
        }`}
      >
        <MapPin size={10} className={selected ? 'text-[#C5A253]' : 'text-[#1C1C1C]/30'} />
        <div className="flex-1 min-w-0">
          {selected ? (
            <>
              <p className="text-[10px] font-mono text-[#C5A253] truncate">{selected.label}</p>
              <p className="text-[8px] font-mono text-[#1C1C1C]/35 uppercase tracking-[0.2em]">{selected.category}</p>
            </>
          ) : (
            <p className="text-[10px] font-mono text-[#1C1C1C]/40 uppercase tracking-[0.2em]">No location — studio backdrop</p>
          )}
        </div>
        {selected && (
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(null); }}
            className="p-1 text-[#1C1C1C]/30 hover:text-[#1C1C1C]/70 transition-colors"
          >
            <X size={10} />
          </button>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#1C1C1C]/50 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[85vh] bg-[#FAF9F6] border border-[#1C1C1C]/12 flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="px-8 py-6 border-b border-[#1C1C1C]/8 flex items-start justify-between gap-6 shrink-0">
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-[#C5A253]/60 mb-1">100 Editorial Environments</p>
                  <h3 className="text-2xl font-serif text-[#1C1C1C] italic">Select a Location</h3>
                </div>
                <button onClick={() => setOpen(false)} className="text-[#1C1C1C]/30 hover:text-[#1C1C1C] transition-colors mt-1">
                  <X size={16} />
                </button>
              </div>

              <div className="px-8 py-4 border-b border-[#1C1C1C]/8 shrink-0 space-y-4">
                <div className="relative">
                  <Search size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1C1C1C]/30" />
                  <input
                    type="text"
                    placeholder="Search locations…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#1C1C1C]/[0.03] border border-[#1C1C1C]/10 pl-8 pr-4 py-2.5 text-[10px] font-mono text-[#1C1C1C] placeholder:text-[#1C1C1C]/30 focus:outline-none focus:border-[#C5A253]/40 transition-colors"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {['All', ...LOCATION_CATEGORIES].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-4 py-1.5 border text-[8px] font-mono uppercase tracking-[0.2em] transition-all duration-200 ${
                        category === cat
                          ? 'border-[#C5A253]/50 text-[#C5A253] bg-[#C5A253]/5'
                          : 'border-[#1C1C1C]/10 text-[#1C1C1C]/40 hover:border-[#1C1C1C]/25 hover:text-[#1C1C1C]/70'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-y-auto flex-1 px-8 py-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filtered.map((preset) => {
                    const isSelected = selected?.id === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => { onSelect(preset); setOpen(false); }}
                        className={`text-left p-4 border transition-all duration-300 ${
                          isSelected
                            ? 'border-[#C5A253]/50 bg-[#C5A253]/[0.05]'
                            : 'border-[#1C1C1C]/8 bg-transparent hover:border-[#1C1C1C]/20 hover:bg-[#1C1C1C]/[0.02]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className={`text-[11px] font-serif leading-tight ${isSelected ? 'text-[#C5A253]' : 'text-[#1C1C1C]'}`}>
                            {preset.label}
                          </p>
                          <span className={`text-[7px] font-mono uppercase tracking-[0.2em] shrink-0 ${isSelected ? 'text-[#C5A253]/60' : 'text-[#1C1C1C]/35'}`}>
                            {preset.category}
                          </span>
                        </div>
                        <p className="text-[8px] font-mono text-[#1C1C1C]/40 leading-relaxed line-clamp-2">
                          {preset.description}
                        </p>
                      </button>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div className="col-span-3 py-12 text-center text-[10px] font-mono text-[#1C1C1C]/35 uppercase tracking-widest">
                      No locations match "{search}"
                    </div>
                  )}
                </div>
              </div>

              <div className="px-8 py-4 border-t border-[#1C1C1C]/8 shrink-0">
                <p className="text-[8px] font-mono text-[#1C1C1C]/30 uppercase tracking-[0.3em]">
                  {filtered.length} location{filtered.length !== 1 ? 's' : ''} · click any to select
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
