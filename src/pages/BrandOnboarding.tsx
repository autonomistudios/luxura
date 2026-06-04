import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PHOTO_DIRECTIONS = [
  {
    id: 'high-fashion',
    label: 'High Fashion Editorial',
    sub: 'Vogue · i-D · Dazed Confused',
    mood: ['Dramatic', 'Architectural', 'Conceptual'],
    desc: 'High-contrast light, graphic negative space, and the model as sculptural form. Emotion through geometry.',
    image: '/assets/dna/01-high-fashion.jpg',
    accent: 'rgba(255,255,255,0.06)',
  },
  {
    id: 'luxury-campaign',
    label: 'Luxury Brand Campaign',
    sub: 'Chanel · Dior · Givenchy · Hermès',
    mood: ['Timeless', 'Heritage', 'Aspirational'],
    desc: 'Impeccable light control, restrained palette, and the quiet authority of a house with history.',
    image: '/assets/dna/02-luxury-campaign.jpg',
    accent: 'rgba(212,175,55,0.08)',
  },
  {
    id: 'street-style',
    label: 'Street Style Candid',
    sub: 'The Sartorialist · Hypebeast · Highsnobiety',
    mood: ['Alive', 'Authentic', 'Urban'],
    desc: 'Caught in motion against the architecture of a city. Fashion existing in the wild — not the studio.',
    image: '/assets/dna/03-street-style.jpg',
    accent: 'rgba(255,255,255,0.04)',
  },
  {
    id: 'avant-garde',
    label: 'Avant-Garde Couture',
    sub: 'Tim Walker · Nick Knight · Paolo Roversi',
    mood: ['Surreal', 'Fearless', 'Transformative'],
    desc: 'The garment as visual mythology. Fantasy architectures, impossible light, and fashion as fine art.',
    image: '/assets/dna/04-avant-garde.jpg',
    accent: 'rgba(139,92,246,0.08)',
  },
  {
    id: 'beauty',
    label: 'Beauty Editorial',
    sub: 'Vogue Beauty · Allure · W Magazine',
    mood: ['Intimate', 'Luminous', 'Precise'],
    desc: 'The face as landscape. Macro proximity, flawless skin rendering, and light that sculpts from within.',
    image: '/assets/dna/05-beauty.jpg',
    accent: 'rgba(251,191,36,0.06)',
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle Editorial',
    sub: 'Kinfolk · COS · Cereal Magazine',
    mood: ['Understated', 'Considered', 'Breathable'],
    desc: 'Minimal friction between the garment and the life being lived. Nordic light, slow moments, real spaces.',
    image: '/assets/dna/06-lifestyle.jpg',
    accent: 'rgba(255,255,255,0.04)',
  },
  {
    id: 'fine-art',
    label: 'Fine Art Portrait',
    sub: 'Annie Leibovitz · Gregory Crewdson · Nadav Kander',
    mood: ['Psychological', 'Singular', 'Indelible'],
    desc: 'One frame that contains an entire character. Narrative depth, painterly light, and unforgettable stillness.',
    image: '/assets/dna/07-fine-art.jpg',
    accent: 'rgba(255,255,255,0.03)',
  },
  {
    id: 'luxury-catalog',
    label: 'Luxury Catalog',
    sub: 'Net-a-Porter · SSENSE · MatchesFashion',
    mood: ['Precise', 'Trustworthy', 'Aspirational'],
    desc: 'The garment is the star. Flawless execution, perfect exposure, and the clarity that converts at checkout.',
    image: '/assets/dna/08-luxury-catalog.jpg',
    accent: 'rgba(184,149,42,0.07)',
  },
];

const USE_CASES = [
  { id: 'campaign',  label: 'Ad Campaigns',  desc: 'Seasonal advertising and editorial' },
  { id: 'lookbook',  label: 'Lookbooks',     desc: 'Collection presentation and buyers' },
  { id: 'product',   label: 'Product Shots', desc: 'E-commerce and catalog imagery' },
  { id: 'social',    label: 'Social Media',  desc: 'Content for digital channels' },
];

const STEPS = ['Brand Identity', 'Use Cases', 'Visual DNA', 'Invite Team'];

export default function BrandOnboarding() {
  const { user, brand, refreshBrand } = useAuth();
  const navigate = useNavigate();

  // If the user already has a brand (returned from a previous session), skip
  // onboarding entirely. This prevents the step-4 skip loop where name is empty
  // and BrandGate bounces the user back before refreshBrand completes.
  React.useEffect(() => {
    if (brand) {
      sessionStorage.setItem('lux_onboarding_complete', '1');
      navigate('/portal', { replace: true });
    }
  }, [brand, navigate]);

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [useCases, setUseCases] = useState<string[]>([]);
  const [photoDirection, setPhotoDirection] = useState<string | null>(null);
  const [inviteEmails, setInviteEmails] = useState(['', '']);
  const [submitting, setSubmitting] = useState(false);

  function handleNameChange(val: string) {
    setName(val);
    const auto = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    setSlug(auto);
    setSlugAvailable(null);
  }

  async function checkSlug(val: string) {
    setSlug(val);
    if (!val) return;
    await new Promise(r => setTimeout(r, 400));
    setSlugAvailable(val.length > 2);
  }

  function toggleUseCase(id: string) {
    setUseCases(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);
  }

  async function handleSubmit() {
    // No name or no auth — go straight to portal (dev mode / edge case)
    if (!name || !user) {
      sessionStorage.setItem('lux_onboarding_complete', '1');
      navigate('/portal');
      return;
    }
    setSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/brands/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ name, slug }),
      });
      // 200 = created, 409 = already exists — both are valid to proceed
      if (res.ok || res.status === 409) {
        sessionStorage.setItem('lux_onboarding_complete', '1');
        await refreshBrand(); // hydrate AuthContext so BrandGate doesn't bounce back
        navigate('/portal', { replace: true });
        return;
      }
      // Hard error — show it but don't loop
      const err = await res.json().catch(() => ({}));
      console.error('[Onboarding] API error:', err);
    } catch (err) {
      console.error('[Onboarding] Submit error:', err);
      sessionStorage.setItem('lux_onboarding_complete', '1');
      await refreshBrand().catch(() => {});
      navigate('/portal', { replace: true });
    }
    setSubmitting(false);
  }

  const canProceed = [
    name.trim().length >= 2 && slugAvailable !== false,
    useCases.length > 0,
    !!photoDirection,
    true,
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* Full-page cinematic glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 1200, height: 800,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(184,149,42,0.07) 0%, transparent 55%)' }} />
      </div>

      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Wordmark */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mb-12 text-center">
          <p className="font-serif italic text-3xl tracking-[0.2em] text-white">LUXAURA</p>
          <p className="text-[7px] font-mono tracking-[0.5em] uppercase text-[#B8952A] mt-1">B2B Operating System</p>
        </motion.div>

        {/* Stepper */}
        <div className="flex items-center gap-0 mb-12 w-full max-w-lg">
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all"
                  style={{
                    borderColor: i < step ? '#10B981' : i === step ? '#B8952A' : 'rgba(255,255,255,0.15)',
                    background: i < step ? '#10B98120' : i === step ? '#B8952A20' : 'transparent',
                    boxShadow: i === step ? '0 0 12px rgba(184,149,42,0.4)' : 'none',
                  }}>
                  {i < step
                    ? <Check size={12} style={{ color: '#10B981' }} />
                    : <span className="text-[9px] font-mono" style={{ color: i === step ? '#B8952A' : 'rgba(255,255,255,0.2)' }}>{i + 1}</span>
                  }
                </div>
                <span className="text-[6px] font-mono tracking-[0.3em] uppercase whitespace-nowrap"
                  style={{ color: i <= step ? '#B8952A' : 'rgba(255,255,255,0.2)' }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-2 mb-4"
                  style={{ background: i < step ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.07)' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step content */}
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {/* Step 1 — Brand Identity */}
            {step === 0 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-8 text-center">
                <div>
                  <h2 className="font-serif italic text-5xl text-white mb-3">Define your brand.</h2>
                  <p className="text-[9px] font-mono text-white/30 tracking-[0.3em] uppercase">
                    Set up your brand workspace in LuxAura
                  </p>
                </div>

                <div className="flex flex-col gap-4 text-left">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/30">Brand Name *</label>
                    <input value={name} onChange={e => handleNameChange(e.target.value)}
                      placeholder="Maison Cèdre" autoFocus
                      className="px-4 py-3 rounded text-[16px] font-medium text-white outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', fontSize: 20 }} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/30">Workspace URL</label>
                      {slugAvailable === true && <span className="text-[7px] font-mono text-emerald-500 uppercase tracking-[0.2em]">Available</span>}
                      {slugAvailable === false && <span className="text-[7px] font-mono text-rose-400 uppercase tracking-[0.2em]">Taken</span>}
                    </div>
                    <div className="flex items-center rounded overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${slugAvailable === false ? 'rgba(239,68,68,0.4)' : slugAvailable === true ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.12)'}` }}>
                      <span className="px-4 py-3 text-[11px] font-mono text-white/20 border-r border-white/[0.08] bg-white/[0.02] flex-shrink-0">
                        luxaura.app/
                      </span>
                      <input value={slug} onChange={e => checkSlug(e.target.value)}
                        placeholder="maison-cedre"
                        className="flex-1 px-4 py-3 bg-transparent text-[12px] font-mono text-white/70 outline-none" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2 — Use Cases */}
            {step === 1 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-8 text-center">
                <div>
                  <h2 className="font-serif italic text-5xl text-white mb-3">How will you use LuxAura?</h2>
                  <p className="text-[9px] font-mono text-white/30 tracking-[0.3em] uppercase">Select all that apply</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-left">
                  {USE_CASES.map(uc => {
                    const selected = useCases.includes(uc.id);
                    return (
                      <button key={uc.id} onClick={() => toggleUseCase(uc.id)}
                        className="flex items-start gap-4 p-5 rounded transition-all text-left"
                        style={{
                          background: selected ? 'rgba(184,149,42,0.08)' : 'rgba(255,255,255,0.02)',
                          border: selected ? '2px solid rgba(184,149,42,0.4)' : '2px solid rgba(255,255,255,0.07)',
                        }}>
                        <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: selected ? '#B8952A' : 'rgba(255,255,255,0.06)', border: selected ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
                          {selected && <Check size={11} style={{ color: '#000' }} />}
                        </div>
                        <div>
                          <p className="text-[12px] font-medium" style={{ color: selected ? 'white' : 'rgba(255,255,255,0.5)' }}>{uc.label}</p>
                          <p className="text-[9px] font-mono text-white/25 mt-0.5">{uc.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 3 — Visual DNA */}
            {step === 2 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-8 text-center">
                <div>
                  <h2 className="font-serif italic text-5xl text-white mb-3">Define your visual signature.</h2>
                  <p className="text-[9px] font-mono text-white/30 tracking-[0.3em] uppercase">
                    Select the photography direction that defines your brand
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-4 text-left">
                  {PHOTO_DIRECTIONS.map((pd, i) => {
                    const selected = photoDirection === pd.id;
                    const dimmed   = !selected && !!photoDirection;
                    return (
                      <motion.button
                        key={pd.id}
                        onClick={() => setPhotoDirection(pd.id)}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -4 }}
                        className="relative rounded overflow-hidden flex flex-col justify-end text-left group"
                        style={{
                          aspectRatio: '3/4',
                          border: selected
                            ? '2px solid #B8952A'
                            : '2px solid rgba(255,255,255,0.07)',
                          boxShadow: selected
                            ? '0 0 30px rgba(184,149,42,0.30), 0 0 60px rgba(184,149,42,0.10)'
                            : '0 4px 24px rgba(0,0,0,0.4)',
                          filter: dimmed ? 'brightness(0.45) saturate(0.6)' : 'brightness(1) saturate(1)',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {/* Background image */}
                        <img
                          src={pd.image}
                          alt={pd.label}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />

                        {/* Base gradient overlay — always visible */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />

                        {/* Accent color overlay */}
                        <div className="absolute inset-0" style={{ background: pd.accent }} />

                        {/* Selected: gold sweep animation */}
                        {selected && (
                          <motion.div
                            className="absolute inset-0 pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                              background: 'linear-gradient(135deg, rgba(184,149,42,0.08) 0%, transparent 50%, rgba(184,149,42,0.04) 100%)',
                            }}
                          />
                        )}

                        {/* Selected checkmark */}
                        {selected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center z-10"
                            style={{
                              background: '#B8952A',
                              boxShadow: '0 0 12px rgba(184,149,42,0.6)',
                            }}
                          >
                            <Check size={13} style={{ color: '#000' }} />
                          </motion.div>
                        )}

                        {/* Card number — watermark */}
                        <div
                          className="absolute top-4 left-4 font-serif italic leading-none select-none pointer-events-none"
                          style={{
                            fontSize: 48,
                            color: selected ? 'rgba(184,149,42,0.18)' : 'rgba(255,255,255,0.07)',
                            transition: 'color 0.3s',
                          }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </div>

                        {/* Content — bottom overlay */}
                        <div className="relative z-10 p-4 flex flex-col gap-2">
                          {/* Mood chips */}
                          <div className="flex flex-wrap gap-1 mb-1">
                            {pd.mood.map(m => (
                              <span
                                key={m}
                                className="text-[6px] font-mono tracking-[0.25em] uppercase px-1.5 py-0.5 rounded"
                                style={{
                                  background: selected ? 'rgba(184,149,42,0.20)' : 'rgba(255,255,255,0.08)',
                                  color:      selected ? '#D4AF37' : 'rgba(255,255,255,0.45)',
                                  border:     `1px solid ${selected ? 'rgba(184,149,42,0.35)' : 'rgba(255,255,255,0.1)'}`,
                                  transition: 'all 0.3s',
                                }}
                              >
                                {m}
                              </span>
                            ))}
                          </div>

                          {/* Divider */}
                          <div
                            className="w-full h-px"
                            style={{
                              background: selected
                                ? 'linear-gradient(to right, rgba(184,149,42,0.6), transparent)'
                                : 'rgba(255,255,255,0.10)',
                              transition: 'background 0.3s',
                            }}
                          />

                          {/* Label */}
                          <p
                            className="font-serif italic leading-tight"
                            style={{
                              fontSize: 15,
                              color:    selected ? '#FFFFFF' : 'rgba(255,255,255,0.82)',
                              transition: 'color 0.3s',
                            }}
                          >
                            {pd.label}
                          </p>

                          {/* Sub reference */}
                          <p className="text-[7px] font-mono text-white/30 tracking-[0.2em] leading-relaxed">
                            {pd.sub}
                          </p>

                          {/* Description — reveals on hover/selected */}
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{
                              opacity: selected ? 1 : 0,
                              height:  selected ? 'auto' : 0,
                            }}
                            transition={{ duration: 0.25 }}
                            className="text-[8px] font-mono text-white/50 leading-relaxed overflow-hidden"
                          >
                            {pd.desc}
                          </motion.p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 4 — Invite Team */}
            {step === 3 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-8 text-center">
                <div>
                  <h2 className="font-serif italic text-5xl text-white mb-3">Invite your team.</h2>
                  <p className="text-[9px] font-mono text-white/30 tracking-[0.3em] uppercase">
                    Optional — you can add teammates later in Settings
                  </p>
                </div>
                <div className="flex flex-col gap-3 text-left">
                  {inviteEmails.map((email, i) => (
                    <input key={i} value={email}
                      onChange={e => setInviteEmails(prev => { const n = [...prev]; n[i] = e.target.value; return n; })}
                      placeholder={`teammate${i + 1}@${slug || 'brand'}.com`} type="email"
                      className="px-4 py-3 rounded text-[12px] font-mono text-white/60 outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }} />
                  ))}
                  <button onClick={() => setInviteEmails(p => [...p, ''])}
                    className="text-[8px] font-mono text-white/25 hover:text-[#B8952A] transition-colors self-start uppercase tracking-[0.3em]">
                    + Add another
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between w-full max-w-2xl mt-10">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="px-5 py-3 rounded border border-white/[0.08] text-[10px] font-mono text-white/40 hover:text-white transition-all uppercase tracking-[0.2em]">
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canProceed[step]}
              className="flex items-center gap-2 px-8 py-3 rounded text-[10px] font-mono tracking-[0.2em] uppercase font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ background: '#B8952A', color: '#000', boxShadow: canProceed[step] ? '0 0 24px rgba(184,149,42,0.3)' : 'none' }}>
              Continue <ChevronRight size={13} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 px-8 py-3 rounded text-[10px] font-mono tracking-[0.2em] uppercase font-semibold disabled:opacity-60 transition-all"
              style={{ background: '#B8952A', color: '#000', boxShadow: '0 0 24px rgba(184,149,42,0.3)' }}>
              {submitting ? 'Creating workspace...' : <><Check size={13} /> Enter LuxAura</>}
            </button>
          )}
        </div>

        {step === 3 && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-4 text-[8px] font-mono text-white/20 hover:text-white/50 transition-colors uppercase tracking-[0.3em]"
          >
            {submitting ? 'Setting up...' : 'Skip invites for now'}
          </button>
        )}
      </div>
    </div>
  );
}
