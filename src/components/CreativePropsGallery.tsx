import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CREATIVE_PROPS } from "../lib/creativeProps";
import type { CreativeProp, PropCategory } from "../lib/creativeProps";

interface CreativePropsGalleryProps {
  onSelect: (prop: CreativeProp, sceneIndex: number) => void;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  all:           'All',
  editorial:     'Editorial',
  campaign:      'Campaign',
  street:        'Street',
  beauty:        'Beauty',
  'avant-garde': 'Avant-Garde',
  'fine-art':    'Fine Art',
  lifestyle:     'Lifestyle',
  cinematic:     'Cinematic',
};

// Category → fallback cover, using the AI-generated DNA imagery already shipped in
// public/assets/dna. Guarantees every prop card shows fashion imagery even before a
// bespoke per-prop cover is generated (previously cards rendered image-less, which
// read as "just a list of scenes").
const CATEGORY_COVER: Record<string, string> = {
  editorial:     '/assets/dna/01-high-fashion.jpg',
  campaign:      '/assets/dna/02-luxury-campaign.jpg',
  street:        '/assets/dna/03-street-style.jpg',
  'avant-garde': '/assets/dna/04-avant-garde.jpg',
  beauty:        '/assets/dna/05-beauty.jpg',
  lifestyle:     '/assets/dna/06-lifestyle.jpg',
  'fine-art':    '/assets/dna/07-fine-art.jpg',
  cinematic:     '/assets/dna/08-luxury-catalog.jpg',
};

export const CreativePropsGallery: React.FC<CreativePropsGalleryProps> = ({ onSelect, onClose }) => {
  const [filter, setFilter]         = useState<PropCategory | 'all'>('all');
  const [covers, setCovers]         = useState<Record<string, string>>({});
  const [selected, setSelected]     = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  // Active scene index per prop card
  const [sceneIdx, setSceneIdx]     = useState<Record<string, number>>({});
  // Prop opened in the full-text scene-variation detail view
  const [detail, setDetail]         = useState<CreativeProp | null>(null);

  useEffect(() => {
    getDocs(collection(db, 'prop-covers')).then(snap => {
      const map: Record<string, string> = {};
      snap.forEach(doc => { map[doc.id] = doc.data().coverUrl; });
      setCovers(map);
    }).catch(() => {});
  }, []);

  const filtered = filter === 'all'
    ? CREATIVE_PROPS
    : CREATIVE_PROPS.filter(p => p.category === filter);

  const usedCategories = ['all', ...Array.from(new Set(CREATIVE_PROPS.map(p => p.category)))];

  const getSceneIdx = (propId: string) => sceneIdx[propId] ?? 0;

  const handleSelect = (prop: CreativeProp) => {
    setSelected(prop.id);
    setTimeout(() => { onSelect(prop, getSceneIdx(prop.id)); onClose(); }, 180);
  };

  const handleSceneChange = (e: React.MouseEvent, propId: string, idx: number) => {
    e.stopPropagation();
    setSceneIdx(prev => ({ ...prev, [propId]: idx }));
  };

  const handleGenerateCover = async (e: React.MouseEvent, prop: CreativeProp) => {
    e.stopPropagation();
    if (generating) return;
    setGenerating(prop.id);
    try {
      const res = await fetch('/api/generate-prop-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propId: prop.id, userPrompt: prop.config.userPrompts[0] }),
      });
      const data = await res.json();
      if (data.coverUrl) setCovers(prev => ({ ...prev, [prop.id]: data.coverUrl }));
    } catch {
      // silently fail
    } finally {
      setGenerating(null);
    }
  };

  // ── Scene-variation detail view — all 5–6 variations as full readable text ──
  if (detail) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.97)' }}>
        <div className="flex-shrink-0 px-6 pt-8 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="max-w-4xl mx-auto flex items-start justify-between">
            <div>
              <button
                onClick={() => setDetail(null)}
                className="text-[8px] font-mono uppercase tracking-[0.4em] text-[#C5A253]/60 hover:text-[#C5A253] transition-colors mb-3"
              >
                ← All Scenes
              </button>
              <p className="text-[9px] font-mono uppercase tracking-[0.6em] text-[#C5A253]/50 mb-1">
                {detail.category} · {detail.config.userPrompts.length} Scene Variation{detail.config.userPrompts.length === 1 ? '' : 's'}
              </p>
              <h2 className="text-xl font-light tracking-[0.12em] text-white/90">{detail.name}</h2>
              <p className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/25 mt-1">
                Click any scene to inject it — fully editable afterward in Creative Direction
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[8px] font-mono uppercase tracking-[0.4em] text-white/20 hover:text-white/60 transition-colors pt-1"
            >
              [ Close ]
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            {detail.config.userPrompts.map((scene, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => { onSelect(detail, idx); onClose(); }}
                className="text-left border p-5 transition-all duration-200 group focus:outline-none focus:ring-1 focus:ring-[#C5A253]/50"
                style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(8,8,8,0.9)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(197,162,83,0.4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-[#C5A253]">
                    Scene {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[7px] font-mono uppercase tracking-[0.25em] text-white/25 group-hover:text-[#C5A253]/70 transition-colors">
                    ✦ Inject &amp; Edit →
                  </span>
                </div>
                <p className="text-[12px] leading-[1.75] text-white/55" style={{ fontFamily: 'Georgia, serif' }}>
                  {scene}
                </p>
              </button>
            ))}
          </div>

          {/* Prop production settings — context for the scenes */}
          <div className="max-w-4xl mx-auto mt-6 pt-5 border-t flex flex-wrap gap-x-4 gap-y-1 text-[7px] font-mono uppercase tracking-[0.2em] text-white/25"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <span>{detail.config.lighting}</span><span>·</span>
            <span>{detail.config.colorGrade}</span><span>·</span>
            <span>{detail.config.cameraFormat}</span>
            {detail.config.locationPreset && (<><span>·</span><span>{detail.config.locationPreset.label}</span></>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(0,0,0,0.96)' }}
    >
      {/* ── Fixed header ── */}
      <div
        className="flex-shrink-0 px-6 pt-8 pb-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.6em] text-[#C5A253]/50 mb-1">
                LuxAura · Creative Inspirations
              </p>
              <h2 className="text-xl font-light tracking-[0.12em] text-white/90">
                Choose Your Scene
              </h2>
              <p className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/25 mt-1">
                Click any scene to inject the full production setup · zero credits to browse
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[8px] font-mono uppercase tracking-[0.4em] text-white/20 hover:text-white/60 transition-colors pt-1"
            >
              [ Close ]
            </button>
          </div>

          {/* Category filter tabs */}
          <div className="flex flex-wrap gap-2">
            {usedCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat as PropCategory | 'all')}
                className="px-4 py-1.5 text-[7px] font-mono uppercase tracking-[0.25em] border transition-all duration-200"
                style={{
                  borderColor: filter === cat ? 'rgba(197,162,83,0.6)' : 'rgba(255,255,255,0.08)',
                  color: filter === cat ? '#C5A253' : 'rgba(255,255,255,0.3)',
                  background: filter === cat ? 'rgba(197,162,83,0.06)' : 'transparent',
                }}
              >
                {CATEGORY_LABELS[cat] ?? cat}
                <span className="ml-1.5 opacity-50">
                  {cat === 'all' ? CREATIVE_PROPS.length : CREATIVE_PROPS.filter(p => p.category === cat).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Scrollable grid ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(prop => {
              const generatedCover = covers[prop.id];
              const coverUrl       = generatedCover || CATEGORY_COVER[prop.category] || '';
              const isSelected = selected === prop.id;
              const isGenerating = generating === prop.id;
              const activeIdx  = getSceneIdx(prop.id);
              const hasVariants = prop.config.userPrompts.length > 1;

              return (
                <button
                  key={prop.id}
                  type="button"
                  onClick={() => setDetail(prop)}
                  className="flex flex-col text-left w-full border cursor-pointer transition-all duration-300 group focus:outline-none focus:ring-1 focus:ring-[#C5A253]/50"
                  style={{
                    borderColor: isSelected ? 'rgba(197,162,83,0.8)' : 'rgba(255,255,255,0.06)',
                    background: 'rgba(8,8,8,0.9)',
                    boxShadow: isSelected ? '0 0 24px rgba(197,162,83,0.15)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(197,162,83,0.3)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                  }}
                >
                  {/* Cover image */}
                  <div
                    className="relative w-full flex-shrink-0 overflow-hidden"
                    style={{ paddingBottom: '62%' }}
                  >
                    <img
                      src={coverUrl}
                      alt={prop.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      style={{ filter: generatedCover ? 'none' : 'saturate(0.9) brightness(0.8) contrast(1.05)' }}
                    />
                    {/* Bespoke cover generation — optional, surfaced on hover only when no custom cover exists yet */}
                    {!generatedCover && (
                      <button
                        onClick={e => handleGenerateCover(e, prop)}
                        disabled={!!generating}
                        className="absolute bottom-2 right-2 z-10 px-2 py-1 text-[6px] font-mono uppercase tracking-[0.2em] border opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:opacity-40"
                        style={{ borderColor: 'rgba(197,162,83,0.4)', color: 'rgba(197,162,83,0.85)', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
                      >
                        {isGenerating ? '· Generating ·' : '✦ Custom Cover'}
                      </button>
                    )}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: 'linear-gradient(to top, rgba(8,8,8,0.7) 0%, transparent 60%)' }}
                    />
                    {/* Mood tags */}
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1 pointer-events-none">
                      {prop.mood.slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          className="text-[6px] font-mono uppercase tracking-[0.15em] px-1.5 py-0.5"
                          style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(197,162,83,0.75)' }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="flex flex-col flex-1 p-4">
                    {/* Name + category */}
                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="text-[11px] font-light tracking-[0.1em] text-white/90">
                        {prop.name}
                      </h3>
                      <span
                        className="text-[6px] font-mono uppercase tracking-[0.15em] ml-2 flex-shrink-0"
                        style={{ color: 'rgba(197,162,83,0.45)' }}
                      >
                        {prop.category}
                      </span>
                    </div>

                    <p className="text-[8px] font-mono text-white/35 mb-3 leading-relaxed">
                      {prop.tagline}
                    </p>

                    {/* Scene variation selector — shown when multiple scenes exist */}
                    {hasVariants && (
                      <div className="mb-3" onClick={e => e.stopPropagation()}>
                        <p className="text-[6px] font-mono uppercase tracking-[0.25em] text-white/25 mb-1.5">
                          Scene Variation
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {prop.config.userPrompts.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={e => handleSceneChange(e, prop.id, idx)}
                              className="w-6 h-6 text-[7px] font-mono border transition-all duration-150"
                              style={{
                                borderColor: activeIdx === idx ? 'rgba(197,162,83,0.8)' : 'rgba(255,255,255,0.12)',
                                color: activeIdx === idx ? '#C5A253' : 'rgba(255,255,255,0.3)',
                                background: activeIdx === idx ? 'rgba(197,162,83,0.1)' : 'transparent',
                              }}
                            >
                              {idx + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Active scene prose */}
                    <p
                      className="text-[7.5px] leading-[1.7] text-white/50 mb-4 flex-1"
                      style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
                    >
                      {prop.config.userPrompts[activeIdx]}
                    </p>

                    {/* Settings strip */}
                    <div
                      className="flex flex-wrap gap-x-3 gap-y-1 pb-3 mb-3 border-b text-[6px] font-mono uppercase tracking-[0.15em] text-white/25"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                      <span>{prop.config.lighting}</span>
                      <span>·</span>
                      <span>{prop.config.colorGrade}</span>
                      <span>·</span>
                      <span>{prop.config.cameraFormat.split(' · ')[0]}</span>
                      {prop.config.locationPreset && (
                        <><span>·</span><span>{prop.config.locationPreset.label}</span></>
                      )}
                    </div>

                    {/* CTA */}
                    <button
                      className="w-full py-2 text-[8px] font-mono uppercase tracking-[0.35em] border transition-all duration-200"
                      style={{
                        borderColor: 'rgba(197,162,83,0.3)',
                        color: 'rgba(197,162,83,0.65)',
                      }}
                      onClick={e => { e.stopPropagation(); setDetail(prop); }}
                    >
                      {`✦ View ${prop.config.userPrompts.length} Scene${prop.config.userPrompts.length === 1 ? '' : 's'} →`}
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
