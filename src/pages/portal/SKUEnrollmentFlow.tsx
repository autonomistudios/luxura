import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Check, ChevronRight, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSovereignStore } from '../../store/useSovereignStore';
import { ANCHOR_TYPES, SKU_CATEGORIES } from '../../lib/skuConstants';

const STEPS = ['Upload Images', 'Garment Details', 'DNA Extraction', 'Review & Save'];

function StepConnector({ done }: { done: boolean }) {
  return (
    <div className="flex-1 h-px mx-3 mt-[-10px]"
      style={{ background: done ? 'rgba(197,162,83,0.5)' : 'rgba(255,255,255,0.08)' }} />
  );
}

function StepDot({ index, current, done, label }: { index: number; current: number; done: boolean; label: string }) {
  const active = index === current;
  const color = done ? '#10B981' : active ? '#C5A253' : 'rgba(255,255,255,0.2)';
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all"
        style={{ borderColor: color, background: done ? '#10B98120' : active ? '#C5A25320' : 'transparent',
          boxShadow: active ? `0 0 12px ${color}66` : 'none' }}>
        {done
          ? <Check size={12} style={{ color: '#10B981' }} />
          : <span className="text-[10px] font-mono" style={{ color }}>{index + 1}</span>
        }
      </div>
      <span className="text-[7px] font-mono tracking-[0.3em] uppercase whitespace-nowrap" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

export default function SKUEnrollmentFlow() {
  const { brand, user } = useAuth();
  const { addSku, updateSkuStatus } = useSovereignStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [skuCode, setSkuCode] = useState('');
  const [category, setCategory] = useState('');
  const [season, setSeason] = useState('');
  const [anchorType, setAnchorType] = useState('FULL_OUTFIT');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'idle' | 'uploading' | 'extracting' | 'rendering' | 'scoring' | 'done' | 'error'>('idle');
  const [enrollProgress, setEnrollProgress] = useState(0);
  const [enrollStage, setEnrollStage] = useState('');
  const [enrolledSkuId, setEnrolledSkuId] = useState<string | null>(null);
  const [fidelityScore, setFidelityScore] = useState<number | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')).slice(0, 3);
    addFiles(files);
  }, []);

  function addFiles(files: File[]) {
    const combined = [...images, ...files].slice(0, 3);
    setImages(combined);
    const urls = combined.map(f => URL.createObjectURL(f));
    setPreviews(urls);
  }

  function removeImage(i: number) {
    const next = images.filter((_, idx) => idx !== i);
    setImages(next);
    setPreviews(next.map(f => URL.createObjectURL(f)));
  }

  async function handleEnroll() {
    if (!name || !images.length || !user) return;
    setEnrollmentStatus('uploading');
    setEnrollProgress(10);
    setEnrollStage('Uploading source imagery...');

    try {
      const idToken = await user.getIdToken();
      const toBase64 = (file: File) => new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      const [primary, ...additional] = await Promise.all(images.map(toBase64));

      setEnrollmentStatus('extracting');
      setEnrollProgress(30);
      setEnrollStage('Agent 01: Extracting garment DNA...');

      const res = await fetch('/api/v1/skus/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ name, skuCode, category, season, anchorType, sourceImage: primary, additionalImages: additional }),
      });

      setEnrollProgress(60);
      setEnrollStage('Agent 01b: Rendering isolation reference...');
      setEnrollmentStatus('rendering');

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Enrollment failed: ${res.status}`);
      }

      setEnrollProgress(85);
      setEnrollStage('Calculating fidelity score...');
      setEnrollmentStatus('scoring');

      const data = await res.json();
      setEnrolledSkuId(data.skuId);
      setFidelityScore(data.fidelityScore);
      setReferenceImageUrl(data.referenceImageUrl);
      setEnrollProgress(100);
      setEnrollmentStatus('done');
      setEnrollStage('Enrollment complete');

      addSku({
        skuId: data.skuId, brandId: brand?.brandId || '', name, skuCode, category, season, anchorType,
        sourceImages: [primary], dna: null, referenceImage: data.referenceImageUrl,
        enrollmentStatus: 'ready', fidelityScore: data.fidelityScore,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });

      setTimeout(() => setStep(3), 500);

    } catch (err: any) {
      setError(err.message);
      setEnrollmentStatus('error');
    }
  }

  const canProceedStep1 = name.trim().length >= 2 && anchorType;
  const canProceedStep2 = images.length >= 1;

  function next() {
    if (step === 1) { setStep(2); handleEnroll(); }
    else setStep(s => Math.min(s + 1, 3));
  }

  return (
    <div className="min-h-full p-8 relative">
      <div className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(197,162,83,0.05) 0%, transparent 60%)' }} />

      <div className="relative max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display italic text-4xl text-primary mb-2">SKU Enrollment</h1>
          <p className="text-[9px] font-mono tracking-[0.35em] uppercase text-white/25">
            Lock garment DNA permanently into your catalog
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-start mb-10">
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              <StepDot index={i} current={step} done={i < step} label={label} />
              {i < STEPS.length - 1 && <StepConnector done={i < step} />}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 2 — Details (photo already uploaded, shown as reference) */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="rounded p-8 flex flex-col gap-6"
              style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {previews.length > 0 && (
                <div className="flex items-center gap-3 pb-1">
                  {previews.slice(0, 3).map((src, i) => (
                    <div key={i} className="w-14 rounded overflow-hidden border border-white/10" style={{ height: '4.5rem' }}>
                      <img src={src} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <p className="text-[8px] font-mono text-white/30 tracking-[0.25em] uppercase leading-relaxed">
                    Your reference{previews.length > 1 ? 's' : ''} — now describe<br />the garment below.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/30">Garment Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Black Linen Blazer SS26"
                    className="px-3 py-2.5 rounded text-[12px] font-medium text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/30">SKU Code</label>
                  <input value={skuCode} onChange={e => setSkuCode(e.target.value)} placeholder="BLB-SS26-001"
                    className="px-3 py-2.5 rounded text-[12px] font-mono text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/30">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="px-3 py-2.5 rounded text-[12px] font-mono text-white/70 outline-none appearance-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option value="">Select category</option>
                    {SKU_CATEGORIES.map(c =>
                      <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/30">Season</label>
                  <input value={season} onChange={e => setSeason(e.target.value)} placeholder="Spring/Summer 2026"
                    className="px-3 py-2.5 rounded text-[12px] font-mono text-white/70 outline-none"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              </div>

              <div>
                <label className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/30 block mb-3">Anchor Type *</label>
                <div className="grid grid-cols-4 gap-2">
                  {ANCHOR_TYPES.map(at => (
                    <button key={at.id} onClick={() => setAnchorType(at.id)}
                      className="flex flex-col gap-0.5 p-3 rounded text-left transition-all"
                      style={{
                        background: anchorType === at.id ? 'rgba(197,162,83,0.10)' : 'rgba(255,255,255,0.02)',
                        border: anchorType === at.id ? '1px solid rgba(197,162,83,0.35)' : '1px solid rgba(255,255,255,0.06)',
                      }}>
                      <span className="text-[9px] font-mono" style={{ color: anchorType === at.id ? '#C5A253' : 'rgba(255,255,255,0.5)' }}>
                        {at.label}
                      </span>
                      <span className="text-[7px] font-mono text-white/20">{at.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(0)}
                  className="px-5 py-2.5 rounded border border-white/[0.08] text-white/40 text-[10px] font-mono tracking-[0.2em] uppercase hover:text-white transition-all">
                  Back
                </button>
                <button onClick={next} disabled={!canProceedStep1}
                  className="flex items-center gap-2 px-6 py-3 rounded bg-[#C5A253] text-black text-[10px] font-mono tracking-[0.2em] uppercase font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  style={{ boxShadow: canProceedStep1 ? '0 0 20px rgba(197,162,83,0.25)' : 'none' }}>
                  Begin Enrollment <ChevronRight size={13} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 1 — Upload (first: the photo becomes the reference) */}
          {step === 0 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="rounded p-8 flex flex-col gap-6"
              style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-sm font-medium text-white/60 mb-1">Upload garment reference images</p>
                <p className="text-[9px] font-mono text-white/25">Primary shot + up to 2 angles (e.g. <span className="text-white/40">back</span>, detail) for fuller coverage · PNG, JPG · Max 50MB each</p>
              </div>

              <div ref={dropRef} onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                onClick={() => document.getElementById('file-input')?.click()}
                className="rounded cursor-pointer flex flex-col items-center justify-center gap-4 p-12 text-center transition-all hover:border-[#C5A253]/40"
                style={{ border: `2px dashed ${images.length ? 'rgba(197,162,83,0.3)' : 'rgba(255,255,255,0.1)'}`, background: 'rgba(255,255,255,0.01)' }}>
                <Upload size={28} className="text-[#C5A253]" />
                <div>
                  <p className="text-sm font-medium text-white/40">Drop images here or click to browse</p>
                  <p className="text-[9px] font-mono text-white/20 mt-1">For best results: shoot on neutral white background</p>
                </div>
                <input id="file-input" type="file" accept="image/*" multiple className="hidden"
                  onChange={e => e.target.files && addFiles(Array.from(e.target.files))} />
              </div>

              {previews.length > 0 && (
                <div className="flex gap-4">
                  {previews.map((src, i) => (
                    <div key={i} className="relative w-32 h-40 rounded overflow-hidden"
                      style={{ border: i === 0 ? '2px solid rgba(197,162,83,0.4)' : '1px solid rgba(255,255,255,0.1)' }}>
                      <img src={src} className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5 text-[6px] font-mono text-[#C5A253] bg-black/70 px-1.5 py-0.5 rounded tracking-[0.2em] uppercase">
                          Primary
                        </span>
                      )}
                      <button onClick={e => { e.stopPropagation(); removeImage(i); }}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center hover:bg-rose-500/80 transition-colors">
                        <X size={10} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={next} disabled={!canProceedStep2}
                  className="flex items-center gap-2 px-6 py-3 rounded bg-[#C5A253] text-black text-[10px] font-mono tracking-[0.2em] uppercase font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  style={{ boxShadow: canProceedStep2 ? '0 0 20px rgba(197,162,83,0.25)' : 'none' }}>
                  Continue <ChevronRight size={13} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Processing */}
          {step === 2 && (
            <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded p-12 flex flex-col items-center text-center gap-8"
              style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {enrollmentStatus === 'error' ? (
                <>
                  <AlertTriangle size={32} className="text-rose-500" />
                  <div>
                    <p className="text-sm font-medium text-white/60 mb-1">Enrollment Failed</p>
                    <p className="text-[9px] font-mono text-rose-400/80">{error}</p>
                  </div>
                  <button onClick={() => { setStep(1); setEnrollmentStatus('idle'); setError(null); }}
                    className="px-5 py-2.5 rounded border border-white/10 text-[10px] font-mono text-white/40 hover:text-white transition-all uppercase tracking-[0.2em]">
                    Try Again
                  </button>
                </>
              ) : (
                <>
                  {/* Animated extraction visual */}
                  <div className="relative w-40 h-40">
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(circle, rgba(197,162,83,0.10) 0%, transparent 70%)' }} />
                    <motion.div
                      className="absolute inset-0 rounded-full border-t-2 border-r-2 border-[#C5A253]/50"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
                    <motion.div
                      className="absolute inset-4 rounded-full border-b-2 border-l-2 border-[#C5A253]/30"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[#C5A253] font-mono text-2xl font-light">{enrollProgress}%</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-mono tracking-[0.4em] uppercase text-[#C5A253] mb-2">{enrollStage}</p>
                    <div className="w-64 h-px bg-white/[0.04] rounded overflow-hidden mx-auto">
                      <motion.div className="h-full bg-[#C5A253] rounded"
                        animate={{ width: `${enrollProgress}%` }} transition={{ duration: 0.5 }} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-left w-64">
                    {['Uploading source imagery', 'Extracting anchor DNA', 'Rendering isolation reference', 'Calculating fidelity score'].map((stage, i) => {
                      const done = enrollProgress > (i + 1) * 22;
                      const active = enrollProgress > i * 22 && !done;
                      return (
                        <div key={stage} className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: done ? '#10B98120' : active ? '#C5A25320' : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${done ? '#10B981' : active ? '#C5A253' : 'rgba(255,255,255,0.1)'}` }}>
                            {done ? <Check size={8} className="text-emerald-500" />
                              : active ? <motion.div className="w-1.5 h-1.5 rounded-full bg-[#C5A253]"
                                  animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                              : null}
                          </div>
                          <span className="text-[9px] font-mono" style={{ color: done ? 'rgba(255,255,255,0.5)' : active ? '#C5A253' : 'rgba(255,255,255,0.2)' }}>
                            {stage}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Step 4 — Review */}
          {step === 3 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="rounded p-8 flex flex-col gap-6"
              style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="grid grid-cols-2 gap-8">
                {/* Source vs reference */}
                <div>
                  <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25 mb-3">Source Image</p>
                  <div className="aspect-[4/5] rounded overflow-hidden bg-[#0D0D10] border border-white/[0.06]">
                    {previews[0] && <img src={previews[0]} className="w-full h-full object-cover" />}
                  </div>
                </div>
                <div>
                  <p className="text-[7px] font-mono tracking-[0.4em] uppercase text-white/25 mb-3">Reference Render</p>
                  <div className="aspect-[4/5] rounded overflow-hidden bg-[#0D0D10] border border-white/[0.06] relative">
                    {referenceImageUrl
                      ? <img src={referenceImageUrl} className="w-full h-full object-cover" />
                      : <div className="absolute inset-0 flex items-center justify-center">
                          <p className="text-[9px] font-mono text-white/20">Generating...</p>
                        </div>
                    }
                  </div>
                </div>
              </div>

              {/* Fidelity + details */}
              <div className="flex items-center gap-6 p-5 rounded"
                style={{ background: 'rgba(197,162,83,0.06)', border: '1px solid rgba(197,162,83,0.15)' }}>
                <div className="text-center">
                  <p className="font-display italic text-5xl" style={{ color: (fidelityScore || 0) >= 80 ? '#10B981' : '#F59E0B' }}>
                    {fidelityScore ?? '--'}
                  </p>
                  <p className="text-[7px] font-mono tracking-[0.35em] uppercase text-white/25 mt-1">Pattern Fidelity</p>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C5A253]" />
                    <span className="text-[7px] font-mono text-[#C5A253] tracking-[0.3em] uppercase">DNA LOCKED</span>
                  </div>
                  <p className="text-sm font-medium text-white/70">{name}</p>
                  {skuCode && <p className="text-[9px] font-mono text-white/30">{skuCode}</p>}
                  <p className="text-[8px] font-mono text-white/20 uppercase tracking-[0.2em]">{anchorType} · {category}</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button onClick={() => navigate(`/portal/skus/${enrolledSkuId}`)}
                  className="px-5 py-2.5 rounded border border-white/[0.08] text-white/40 text-[10px] font-mono tracking-[0.2em] uppercase hover:text-white transition-all">
                  View Details
                </button>
                <button onClick={() => { useSovereignStore.getState().setCurrentSkuId(enrolledSkuId!); navigate('/portal/campaigns/new'); }}
                  className="flex items-center gap-2 px-6 py-3 rounded bg-[#C5A253] text-black text-[10px] font-mono tracking-[0.2em] uppercase font-semibold transition-all"
                  style={{ boxShadow: '0 0 20px rgba(197,162,83,0.25)' }}>
                  <span>Generate Campaign</span> <ChevronRight size={13} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
