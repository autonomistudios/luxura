import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Upload, X, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const TABS = ['General', 'Brand Kit', 'Billing'] as const;
type Tab = typeof TABS[number];

const LIGHTING_OPTIONS   = ['Clean & Even', 'Sunset Side Glow', 'Deep Shadow', 'Beauty Overhead', 'Moody Cinema', 'Soft Natural'];
const CAMERA_OPTIONS     = ['Soft Background (85mm)', 'Natural Eye (50mm)', 'Editorial Wide (24mm)', 'Fashion Zoom (135mm)', 'Street Style (35mm)', 'Ultra Close-Up (Macro)'];
const COLORGRADE_OPTIONS = ['Matte Fade Editorial', 'Kodak Portra 400', 'Cinematic Teal & Orange', 'High Contrast B&W', 'Nordic Matte', 'Hyperreal', 'Vintage Warm'];
const SKIN_TONE_OPTIONS  = ['Neutral', 'Fair', 'Warm Medium', 'Tan', 'Brown', 'Deep Ebony'];

function VisualSelect({ label, value, options, locked, onChange }: {
  label: string; value: string; options: string[]; locked: boolean; onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/30">{label}</label>
        {locked && <Lock size={9} className="text-[#B8952A]/60" />}
      </div>
      {locked ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded"
          style={{ background: 'rgba(184,149,42,0.06)', border: '1px solid rgba(184,149,42,0.15)' }}>
          <span className="text-[10px] font-mono text-[#B8952A]/70 flex-1">{value}</span>
          <Lock size={9} className="text-[#B8952A]/40" />
        </div>
      ) : (
        <select value={value} onChange={e => onChange(e.target.value)}
          className="px-3 py-2 rounded text-[10px] font-mono text-white/60 outline-none appearance-none"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      )}
    </div>
  );
}

function LockToggle({ label, locked, onToggle }: { label: string; locked: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className="flex items-center justify-between w-full p-3 rounded transition-all text-left"
      style={{ background: locked ? 'rgba(184,149,42,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${locked ? 'rgba(184,149,42,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
      <span className="text-[10px] font-mono text-white/50">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[7px] font-mono uppercase tracking-[0.2em]" style={{ color: locked ? '#B8952A' : 'rgba(255,255,255,0.2)' }}>
          {locked ? 'Locked' : 'Editable'}
        </span>
        {locked ? <Lock size={11} className="text-[#B8952A]" /> : <Unlock size={11} className="text-white/20" />}
      </div>
    </button>
  );
}

export default function BrandSettings() {
  const { brand, refreshBrand, user } = useAuth();
  const [tab, setTab] = useState<Tab>('General');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // General
  const [brandName, setBrandName] = useState(brand?.name || '');
  const [logoPreview, setLogoPreview] = useState<string | null>(brand?.logoUrl || null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Brand Kit
  const locked = brand?.brandKit?.lockedParams || [];
  const [lockedParams, setLockedParams] = useState<string[]>(locked);
  const [defaultLighting,   setDefaultLighting]   = useState(brand?.brandKit?.defaultLighting || 'Clean & Even');
  const [defaultCamera,     setDefaultCamera]     = useState(brand?.brandKit?.defaultCamera || 'Soft Background (85mm)');
  const [defaultColorGrade, setDefaultColorGrade] = useState(brand?.brandKit?.defaultColorGrade || 'Matte Fade Editorial');
  const [defaultSkinTone,   setDefaultSkinTone]   = useState((brand?.brandKit?.defaultSkinTones || ['Neutral'])[0] || 'Neutral');

  function toggleLock(param: string) {
    setLockedParams(prev => prev.includes(param) ? prev.filter(p => p !== param) : [...prev, param]);
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (logoFile && user) {
        const idToken = await user.getIdToken();
        const formData = new FormData();
        formData.append('logo', logoFile);
        await fetch('/api/v1/brands/logo', {
          method: 'POST', headers: { 'Authorization': `Bearer ${idToken}` }, body: formData,
        });
      }
      await refreshBrand();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) { console.error(err); }
    setSaving(false);
  }

  const TIER_INFO = {
    studio:     { label: 'Studio',     price: '$499/mo',  images: '500 images/mo' },
    agency:     { label: 'Agency',     price: '$1,499/mo', images: '2,000 images/mo' },
    enterprise: { label: 'Enterprise', price: '$4,999/mo', images: '10,000 images/mo' },
  };
  const tierInfo = TIER_INFO[brand?.tier || 'studio'];

  return (
    <div className="p-8 min-h-full max-w-3xl">
      <div className="mb-8">
        <h1 className="font-serif italic text-4xl text-white mb-2">Brand Settings</h1>
        <p className="text-[9px] font-mono tracking-[0.35em] uppercase text-white/25">
          Configure your brand workspace and visual identity
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-8 border-b border-white/[0.06] pb-0">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-5 py-3 text-[10px] font-mono tracking-[0.2em] uppercase transition-all relative"
            style={{ color: tab === t ? 'white' : 'rgba(255,255,255,0.3)' }}>
            {t}
            {tab === t && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-px bg-[#B8952A]" />
            )}
          </button>
        ))}
      </div>

      {/* General */}
      {tab === 'General' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
          {/* Logo */}
          <div className="rounded p-6 flex flex-col gap-5"
            style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[7px] font-mono tracking-[0.45em] uppercase text-white/25">Brand Logo</p>

            <div className="flex items-start gap-6">
              {/* Preview */}
              <div className="flex items-center justify-center rounded"
                style={{ width: 200, height: 80, background: 'rgba(255,255,255,0.03)', border: logoPreview ? '1px solid rgba(184,149,42,0.2)' : '2px dashed rgba(255,255,255,0.08)' }}>
                {logoPreview
                  ? <img src={logoPreview} className="max-w-full max-h-full object-contain p-2" />
                  : <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">No Logo</span>
                }
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-[9px] font-mono text-white/30 leading-relaxed">
                  Your logo appears in the workspace navigation and on exported assets.<br />
                  Accepts PNG, SVG, JPG · Max 2MB
                </p>
                <div className="flex gap-2">
                  <button onClick={() => logoInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded border border-white/[0.08] text-[9px] font-mono text-white/40 hover:text-white hover:border-white/20 transition-all uppercase tracking-[0.2em]">
                    <Upload size={11} /> Upload Logo
                  </button>
                  {logoPreview && (
                    <button onClick={() => { setLogoPreview(null); setLogoFile(null); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded border border-rose-500/20 text-[9px] font-mono text-rose-400/60 hover:text-rose-400 transition-all uppercase tracking-[0.2em]">
                      <X size={11} /> Remove
                    </button>
                  )}
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </div>
              </div>
            </div>
          </div>

          {/* Brand details */}
          <div className="rounded p-6 flex flex-col gap-5"
            style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[7px] font-mono tracking-[0.45em] uppercase text-white/25">Brand Identity</p>
            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/30">Brand Name</label>
                <input value={brandName} onChange={e => setBrandName(e.target.value)}
                  className="px-3 py-2.5 rounded text-[12px] font-medium text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/30">Slug</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Lock size={10} className="text-white/20" />
                  <span className="text-[11px] font-mono text-white/30">{brand?.slug || '—'}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/30">Brand ID</label>
                <div className="px-3 py-2.5 rounded flex items-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-[9px] font-mono text-white/25 truncate">{brand?.brandId || '—'}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/30">Tier</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded"
                  style={{ background: 'rgba(184,149,42,0.06)', border: '1px solid rgba(184,149,42,0.15)' }}>
                  <span className="text-[10px] font-mono text-[#B8952A] capitalize">{brand?.tier || 'Studio'}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Brand Kit */}
      {tab === 'Brand Kit' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
          <p className="text-[9px] font-mono text-white/30 leading-relaxed">
            Set defaults for all campaigns. Lock parameters to prevent team members from overriding them.
          </p>

          <div className="rounded p-6 flex flex-col gap-5"
            style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[7px] font-mono tracking-[0.45em] uppercase text-white/25">Default Parameters</p>
            <div className="grid grid-cols-2 gap-5">
              <VisualSelect label="Default Lighting" value={defaultLighting} options={LIGHTING_OPTIONS}
                locked={lockedParams.includes('lighting')} onChange={setDefaultLighting} />
              <VisualSelect label="Default Camera" value={defaultCamera} options={CAMERA_OPTIONS}
                locked={lockedParams.includes('camera')} onChange={setDefaultCamera} />
              <VisualSelect label="Default Color Grade" value={defaultColorGrade} options={COLORGRADE_OPTIONS}
                locked={lockedParams.includes('colorGrade')} onChange={setDefaultColorGrade} />
              <VisualSelect label="Default Skin Tone" value={defaultSkinTone} options={SKIN_TONE_OPTIONS}
                locked={lockedParams.includes('skinTones')} onChange={setDefaultSkinTone} />
            </div>
          </div>

          <div className="rounded p-6 flex flex-col gap-3"
            style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[7px] font-mono tracking-[0.45em] uppercase text-white/25 mb-1">Lock Parameters</p>
            <p className="text-[8px] font-mono text-white/20 mb-3">When locked, team members cannot override these settings in campaigns</p>
            {[
              { key: 'lighting',   label: 'Lighting Style' },
              { key: 'camera',     label: 'Camera / Focal Length' },
              { key: 'colorGrade', label: 'Color Grade / Film Stock' },
              { key: 'skinTones',  label: 'Skin Tone Defaults' },
            ].map(({ key, label }) => (
              <LockToggle key={key} label={label} locked={lockedParams.includes(key)} onToggle={() => toggleLock(key)} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Billing */}
      {tab === 'Billing' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
          <div className="rounded p-6 flex flex-col gap-4"
            style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25 mb-1">Current Plan</p>
                <span className="text-xl font-serif italic text-[#B8952A]">{tierInfo.label}</span>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-serif italic text-white">{tierInfo.price}</p>
                <p className="text-[9px] font-mono text-white/30">{tierInfo.images}</p>
              </div>
            </div>

            <div className="border-t border-white/[0.05] pt-4">
              <div className="flex justify-between text-[9px] font-mono text-white/30 mb-1">
                <span>Status</span>
                <span className="text-emerald-500 capitalize">{brand?.billing?.status || 'Active'}</span>
              </div>
              {brand?.billing?.currentPeriodEnd && (
                <div className="flex justify-between text-[9px] font-mono text-white/30">
                  <span>Period Ends</span>
                  <span>{new Date(brand.billing.currentPeriodEnd).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <button className="w-full py-3 rounded border border-white/[0.08] text-[10px] font-mono text-white/40 hover:text-white hover:border-white/20 transition-all uppercase tracking-[0.2em] mt-2">
              Manage Subscription →
            </button>
          </div>
        </motion.div>
      )}

      {/* Save button */}
      {tab !== 'Billing' && (
        <div className="mt-8 flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded text-[10px] font-mono tracking-[0.2em] uppercase font-semibold transition-all disabled:opacity-60"
            style={{ background: saved ? '#10B981' : '#B8952A', color: '#000', boxShadow: saved ? '0 0 20px rgba(16,185,129,0.25)' : '0 0 20px rgba(184,149,42,0.25)' }}>
            {saved ? <><Check size={12} /> Saved</> : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
