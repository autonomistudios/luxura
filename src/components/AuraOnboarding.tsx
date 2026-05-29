import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onComplete: () => void;
}

const PROFESSIONS = [
  'Hair Stylist', 'Barber', 'Makeup Artist', 'Nail Artist',
  'Fashion Designer', 'Clothing Brand', 'Jewelry Designer',
  'Photographer', 'Creative Director', 'Boutique Owner', 'Other',
];

const GOALS = [
  'Create content for social media',
  'Showcase products for my shop',
  'Build a portfolio',
  'Generate marketing campaigns',
  'Experiment with creative concepts',
  'Promote my services',
];

const STEPS = ['intro', 'name', 'profession', 'goals', 'done'] as const;
type Step = typeof STEPS[number];

export default function AuraOnboarding({ onComplete }: Props) {
  const { user } = useAuth();
  const [step, setStep]               = useState<Step>('intro');
  const [preferredName, setPreferredName] = useState(
    user?.displayName?.split(' ')[0] || ''
  );
  const [profession, setProfession]   = useState('');
  const [customProfession, setCustomProfession] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [saving, setSaving]           = useState(false);

  const stepIndex = STEPS.indexOf(step);

  function toggleGoal(g: string) {
    setSelectedGoals(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );
  }

  async function handleComplete() {
    setSaving(true);
    try {
      const idToken = await user!.getIdToken();
      const finalProfession = profession === 'Other' ? customProfession : profession;
      await fetch('/api/aura-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'completeOnboarding',
          fields: {
            preferredName:   preferredName.trim() || user?.displayName?.split(' ')[0] || 'Creator',
            profession:      finalProfession || null,
            goals:           selectedGoals,
            whyTheyreHere:   selectedGoals[0] || null,
          },
        }),
      });
    } catch (err) {
      console.warn('[AuraOnboarding] save failed (non-critical):', err);
    }
    setSaving(false);
    setStep('done');
  }

  function advance() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] backdrop-blur-2xl flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(5,5,5,0.97)' }}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-px bg-white/5">
        <motion.div
          className="h-full bg-[#D4AF37]/60"
          animate={{ width: `${((stepIndex) / (STEPS.length - 1)) * 100}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">

          {/* ── Intro ── */}
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="space-y-10 text-center"
            >
              <div className="space-y-2">
                <p className="text-[8px] font-mono uppercase tracking-[0.8em] text-[#D4AF37]/50">
                  LuxAura Studio
                </p>
                <h1 className="text-4xl font-serif italic text-white leading-tight">
                  Meet Aura.
                </h1>
                <p className="text-[13px] font-light text-white/40 leading-relaxed mt-4 max-w-sm mx-auto">
                  Your personal creative director. She learns your style, your product,
                  and your vision — so every generation feels like it was made for you.
                </p>
              </div>
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em]">
                It takes 60 seconds to introduce yourself.
              </p>
              <button
                onClick={advance}
                className="w-full py-4 border border-[#D4AF37]/40 text-[#D4AF37] text-[9px] font-mono uppercase tracking-[0.6em] hover:bg-[#D4AF37]/10 transition-all duration-500"
              >
                Begin
              </button>
            </motion.div>
          )}

          {/* ── Name ── */}
          {step === 'name' && (
            <motion.div
              key="name"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="space-y-10"
            >
              <div>
                <p className="text-[8px] font-mono uppercase tracking-[0.6em] text-[#D4AF37]/40 mb-3">
                  01 / 03
                </p>
                <h2 className="text-3xl font-serif italic text-white">
                  What should Aura call you?
                </h2>
                <p className="text-[11px] text-white/30 font-light mt-3">
                  Your first name, a nickname, whatever feels right.
                </p>
              </div>
              <div className="border-b border-white/10 pb-2">
                <input
                  type="text"
                  value={preferredName}
                  onChange={e => setPreferredName(e.target.value)}
                  placeholder="Your name"
                  autoFocus
                  className="w-full bg-transparent text-2xl font-serif italic text-white placeholder-white/15 focus:outline-none"
                  onKeyDown={e => e.key === 'Enter' && preferredName.trim() && advance()}
                />
              </div>
              <button
                onClick={advance}
                disabled={!preferredName.trim()}
                className="w-full py-4 border border-[#D4AF37]/40 text-[#D4AF37] text-[9px] font-mono uppercase tracking-[0.6em] hover:bg-[#D4AF37]/10 transition-all duration-500 disabled:opacity-20 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* ── Profession ── */}
          {step === 'profession' && (
            <motion.div
              key="profession"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div>
                <p className="text-[8px] font-mono uppercase tracking-[0.6em] text-[#D4AF37]/40 mb-3">
                  02 / 03
                </p>
                <h2 className="text-3xl font-serif italic text-white">
                  What do you do,{' '}
                  <span className="text-[#D4AF37]">{preferredName}?</span>
                </h2>
                <p className="text-[11px] text-white/30 font-light mt-3">
                  Aura uses this to understand what you're selling and how to frame every shot.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PROFESSIONS.map(p => (
                  <button
                    key={p}
                    onClick={() => setProfession(p)}
                    className={`px-4 py-3 border text-[9px] font-mono uppercase tracking-[0.2em] text-left transition-all duration-200 ${
                      profession === p
                        ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5'
                        : 'border-white/8 text-white/30 hover:text-white/60 hover:border-white/20'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {profession === 'Other' && (
                <input
                  type="text"
                  value={customProfession}
                  onChange={e => setCustomProfession(e.target.value)}
                  placeholder="Describe your profession…"
                  autoFocus
                  className="w-full bg-transparent border-b border-white/20 pb-2 text-white text-[12px] font-light placeholder-white/20 focus:outline-none focus:border-[#D4AF37]/40"
                />
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('name')}
                  className="flex-1 py-3 border border-white/8 text-white/25 text-[8px] font-mono uppercase tracking-[0.4em] hover:text-white/50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={advance}
                  disabled={!profession || (profession === 'Other' && !customProfession.trim())}
                  className="flex-[2] py-3 border border-[#D4AF37]/40 text-[#D4AF37] text-[9px] font-mono uppercase tracking-[0.4em] hover:bg-[#D4AF37]/10 transition-all duration-500 disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Goals ── */}
          {step === 'goals' && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div>
                <p className="text-[8px] font-mono uppercase tracking-[0.6em] text-[#D4AF37]/40 mb-3">
                  03 / 03
                </p>
                <h2 className="text-3xl font-serif italic text-white">
                  Why are you here?
                </h2>
                <p className="text-[11px] text-white/30 font-light mt-3">
                  Select everything that applies. Aura will keep this front of mind.
                </p>
              </div>
              <div className="space-y-2">
                {GOALS.map(g => (
                  <button
                    key={g}
                    onClick={() => toggleGoal(g)}
                    className={`w-full px-5 py-3 border text-[9px] font-mono uppercase tracking-[0.2em] text-left transition-all duration-200 ${
                      selectedGoals.includes(g)
                        ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5'
                        : 'border-white/8 text-white/30 hover:text-white/60 hover:border-white/20'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('profession')}
                  className="flex-1 py-3 border border-white/8 text-white/25 text-[8px] font-mono uppercase tracking-[0.4em] hover:text-white/50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-[2] py-3 border border-[#D4AF37]/40 text-[#D4AF37] text-[9px] font-mono uppercase tracking-[0.4em] hover:bg-[#D4AF37]/10 transition-all duration-500 disabled:opacity-30"
                >
                  {saving ? 'Saving…' : 'Meet Aura'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Done ── */}
          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-10 text-center"
            >
              <div className="space-y-4">
                <div className="w-16 h-px bg-[#D4AF37]/30 mx-auto" />
                <h2 className="text-4xl font-serif italic text-white">
                  Aura knows you now.
                </h2>
                <p className="text-[12px] text-white/35 font-light leading-relaxed max-w-sm mx-auto">
                  Every generation from here is built around your vision,{' '}
                  <span className="text-[#D4AF37]/70">{preferredName}</span>.
                  She'll learn more the longer you work together.
                </p>
                <div className="w-16 h-px bg-[#D4AF37]/30 mx-auto" />
              </div>
              <motion.button
                onClick={onComplete}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="w-full py-4 border border-[#D4AF37]/40 text-[#D4AF37] text-[9px] font-mono uppercase tracking-[0.6em] hover:bg-[#D4AF37]/10 transition-all duration-500"
              >
                Enter the Studio
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}
