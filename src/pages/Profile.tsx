import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Zap, Video, Crown, Plus, X, Sparkles, Brain, MessageSquare, Send } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
const TIER_CONFIG: Record<string, { label: string; color: string; price: number; imageCredits: number; videoCredits: number }> = {
  free:      { label: 'Free',      color: 'white',   price: 0,   imageCredits: 0,    videoCredits: 0  },
  aura:      { label: 'Aura',      color: '#D4AF37', price: 85,  imageCredits: 300,  videoCredits: 0  },
  sovereign: { label: 'Sovereign', color: '#C0C0C0', price: 165, imageCredits: 750,  videoCredits: 5  },
  luminary:  { label: 'Luminary',  color: '#E5D3FF', price: 299, imageCredits: 1500, videoCredits: 20 },
};
import { useSovereignStore } from '../store/useSovereignStore';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuraMemory {
  fact:      string;
  source:    string;
  timestamp: string;
  weight:    number;
}

interface AuraProfile {
  preferredName?:      string;
  profession?:         string;
  creativeIdentity?:   string;
  businessFocus?:      string;
  whyTheyreHere?:      string;
  goals?:              string[];
  trustTier?:          string;
  sessionCount?:       number;
  totalGenerations?:   number;
  primaryAnchor?:      string;
  topAnchors?:         string[];
  topMoods?:           string[];
  preferredLighting?:  string[];
  memories?:           AuraMemory[];
  userDirectives?:     string[];
  onboarded?:          boolean;
}

const TRUST_TIER_LABELS: Record<string, string> = {
  new:      'New',
  familiar: 'Familiar',
  trusted:  'Trusted',
  partner:  'Creative Partner',
};

const TRUST_TIER_COLORS: Record<string, string> = {
  new:      '#888',
  familiar: '#D4AF37',
  trusted:  '#C0C0C0',
  partner:  '#E5D3FF',
};

// ─── Aura Profile Hook ────────────────────────────────────────────────────────

function useAuraProfile(user: ReturnType<typeof useAuth>['user']) {
  const [auraProfile, setAuraProfile] = useState<AuraProfile | null>(null);
  const [auraLoading, setAuraLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const res     = await fetch('/api/aura-profile', {
        headers: { 'Authorization': `Bearer ${idToken}` },
      });
      if (res.ok) {
        const { profile } = await res.json();
        setAuraProfile(profile || {});
      }
    } catch (err) {
      console.warn('[AuraProfile] load failed', err);
    } finally {
      setAuraLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return { auraProfile, auraLoading, reload: load, setAuraProfile };
}

// ── Profile Page ──────────────────────────────────────────────────────────────

export default function Profile() {
  const { user, profile, logout, loading, isAdmin } = useAuth();
  const navigate                                     = useNavigate();
  const vaultAssets                                  = useSovereignStore((s) => s.vaultAssets);
  const { auraProfile, auraLoading, reload, setAuraProfile } = useAuraProfile(user);

  // Directive state
  const [newDirective, setNewDirective] = useState('');
  const [savingDirective, setSavingDirective] = useState(false);

  // Conversation / memory state
  const [conversationMsg, setConversationMsg] = useState('');
  const [sendingMsg, setSendingMsg]           = useState(false);
  const [msgSent, setMsgSent]                 = useState(false);

  async function apiPost(body: object) {
    const idToken = await user!.getIdToken();
    const res = await fetch('/api/aura-profile', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function addDirective() {
    if (!newDirective.trim()) return;
    setSavingDirective(true);
    try {
      await apiPost({ action: 'addDirective', directive: newDirective.trim() });
      setAuraProfile(prev => prev ? {
        ...prev,
        userDirectives: [newDirective.trim(), ...(prev.userDirectives || [])],
      } : prev);
      setNewDirective('');
    } catch (err) {
      console.warn('[Directive] save failed', err);
    }
    setSavingDirective(false);
  }

  async function removeDirective(d: string) {
    try {
      await apiPost({ action: 'removeDirective', directive: d });
      setAuraProfile(prev => prev ? {
        ...prev,
        userDirectives: (prev.userDirectives || []).filter(x => x !== d),
      } : prev);
    } catch (err) {
      console.warn('[Directive] remove failed', err);
    }
  }

  async function sendConversationMessage() {
    if (!conversationMsg.trim()) return;
    setSendingMsg(true);
    try {
      await apiPost({ action: 'appendMemory', fact: conversationMsg.trim(), source: 'conversation', weight: 0.8 });
      setConversationMsg('');
      setMsgSent(true);
      setTimeout(() => setMsgSent(false), 3000);
      await reload();
    } catch (err) {
      console.warn('[Conversation] send failed', err);
    }
    setSendingMsg(false);
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  if (loading) return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[9px] font-mono uppercase tracking-[0.6em] text-[#1C1C1C]/35 animate-pulse">
          Loading profile…
        </p>
      </div>
    </Layout>
  );

  if (!profile) return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <p className="text-[9px] font-mono uppercase tracking-[0.6em] text-[#1C1C1C]/50">
          Profile unavailable
        </p>
        <p className="text-[8px] font-mono text-[#1C1C1C]/40 max-w-xs text-center leading-relaxed">
          Could not load your profile. This is usually a Firestore rules issue — check Firebase Console → Firestore → Rules.
        </p>
        <Link to="/login" className="text-[9px] font-mono uppercase tracking-[0.4em] text-[#D4AF37]/50 hover:text-[#D4AF37] transition-colors border border-[#D4AF37]/20 px-5 py-2">
          Back to Login
        </Link>
      </div>
    </Layout>
  );

  const tier    = profile.tier;
  const tierCfg = TIER_CONFIG[tier];

  const imgPct  = isAdmin ? 100 : Math.min(100, (profile.imageCredits / Math.max(tierCfg.imageCredits, 1)) * 100);
  const vidPct  = isAdmin ? 100 : Math.min(100, (profile.videoCredits / Math.max(tierCfg.videoCredits || 1, 1)) * 100);
  const imgRuns = isAdmin ? '∞' : String(Math.floor(profile.imageCredits / 6));

  const trustTier  = auraProfile?.trustTier || 'new';
  const trustColor = TRUST_TIER_COLORS[trustTier] || '#888';

  return (
    <Layout>
      <div className="min-h-screen pt-32 px-6 md:px-12 pb-20">
        <div className="max-w-4xl mx-auto space-y-16">

          {/* ── Header: Identity ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="flex flex-col md:flex-row items-center md:items-start gap-10 border-b border-[#1C1C1C]/8 pb-16 text-center md:text-left"
          >
            <div className="relative w-28 h-28 shrink-0">
              <div className="absolute inset-0 rounded-full border border-[#D4AF37]/20 animate-[ping_3s_infinite]" />
              <div className="w-full h-full rounded-full border border-[#D4AF37]/30 p-0.5 overflow-hidden">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#1C1C1C]/5 flex items-center justify-center">
                    <span className="text-2xl font-serif text-[#1C1C1C]/40">{profile.displayName.charAt(0)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex-1">
              <h1 className="text-4xl font-serif italic text-[#1C1C1C] mb-2">{profile.displayName}</h1>
              <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-[#1C1C1C]/40 mb-4">
                {profile.email}
              </p>
              {auraProfile?.profession && (
                <p className="text-[10px] font-mono text-[#D4AF37]/60 uppercase tracking-[0.3em] mb-4">
                  {auraProfile.profession}
                </p>
              )}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 border mb-6"
                   style={{ borderColor: `${tierCfg.color}40`, color: tierCfg.color }}>
                <Crown size={10} />
                <span className="text-[9px] font-mono uppercase tracking-[0.4em]">
                  {tierCfg.label} {tier !== 'free' ? `— $${tierCfg.price}/mo` : '— Free Tier'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.4em] text-[#1C1C1C]/35 hover:text-[#1C1C1C]/70 transition-colors"
              >
                <LogOut size={11} />
                Sign Out
              </button>
            </div>
          </motion.div>

          {/* ── Stats grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Vault Assets',    value: String(vaultAssets.length),                          detail: 'Saved Creations' },
              { label: 'Image Credits',   value: isAdmin ? '∞' : String(profile.imageCredits),        detail: isAdmin ? 'Unlimited — Admin' : `~${imgRuns} forge run${imgRuns !== '1' ? 's' : ''} remaining` },
              { label: 'Video Credits',   value: isAdmin ? '∞' : String(profile.videoCredits),        detail: isAdmin ? 'Unlimited — Admin' : tier === 'free' ? 'Upgrade to unlock' : 'Veo 3 generations' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12, duration: 0.8 }}
                className="p-8 border border-[#1C1C1C]/8 bg-[#F2EFE9] hover:bg-[#EDE9E3] transition-colors duration-500 cursor-default group"
              >
                <p className="text-[8px] font-mono uppercase tracking-[0.4em] text-[#1C1C1C]/40 mb-4 group-hover:text-[#1C1C1C]/70 transition-colors">{stat.label}</p>
                <h3 className="text-3xl font-serif text-[#1C1C1C] mb-1">{stat.value}</h3>
                <p className="text-[8px] font-mono text-[#D4AF37]/40 uppercase tracking-[0.2em] group-hover:text-[#D4AF37] transition-colors">{stat.detail}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Credit usage bars ── */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 1 }} className="space-y-8">
            <h4 className="text-[10px] font-mono uppercase tracking-[0.6em] text-[#1C1C1C]/40">Credit Usage</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Zap size={10} className="text-[#D4AF37]" />
                  <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#1C1C1C]/50">Image Credits</span>
                </div>
                <span className="text-[9px] font-mono text-[#1C1C1C]/45">{profile.imageCredits} / {tierCfg.imageCredits}</span>
              </div>
              <div className="h-px bg-[#1C1C1C]/8 relative overflow-hidden">
                <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: imgPct / 100 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} style={{ backgroundColor: tierCfg.color }} className="absolute inset-y-0 left-0 w-full origin-left" />
              </div>
            </div>
            {tierCfg.videoCredits > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Video size={10} className="text-[#D4AF37]" />
                    <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#1C1C1C]/50">Video Credits</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#1C1C1C]/45">{profile.videoCredits} / {tierCfg.videoCredits}</span>
                </div>
                <div className="h-px bg-[#1C1C1C]/8 relative overflow-hidden">
                  <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: vidPct / 100 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} style={{ backgroundColor: tierCfg.color }} className="absolute inset-y-0 left-0 w-full origin-left" />
                </div>
              </div>
            )}
          </motion.div>

          {/* ── Aura Intelligence Section ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }} className="space-y-10">

            {/* Section header */}
            <div className="flex items-center justify-between border-b border-[#1C1C1C]/8 pb-4">
              <div className="flex items-center gap-3">
                <Sparkles size={14} className="text-[#D4AF37]" />
                <h4 className="text-[10px] font-mono uppercase tracking-[0.6em] text-[#1C1C1C]/60">Aura Intelligence</h4>
              </div>
              {!auraLoading && auraProfile && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: trustColor }} />
                  <span className="text-[8px] font-mono uppercase tracking-[0.3em]" style={{ color: trustColor }}>
                    {TRUST_TIER_LABELS[trustTier] || trustTier} · {auraProfile.sessionCount || 0} session{(auraProfile.sessionCount || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {auraLoading && (
              <p className="text-[9px] font-mono uppercase tracking-[0.4em] text-[#1C1C1C]/25 animate-pulse">
                Loading Aura profile…
              </p>
            )}

            {!auraLoading && auraProfile && (
              <div className="space-y-12">

                {/* Identity summary */}
                {(auraProfile.profession || auraProfile.goals?.length) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {auraProfile.profession && (
                      <div className="p-6 border border-[#1C1C1C]/6 bg-[#F8F7F5]">
                        <p className="text-[7px] font-mono uppercase tracking-[0.5em] text-[#1C1C1C]/30 mb-2">Profession</p>
                        <p className="text-[13px] font-light text-[#1C1C1C]/70">{auraProfile.profession}</p>
                      </div>
                    )}
                    {auraProfile.goals && auraProfile.goals.length > 0 && (
                      <div className="p-6 border border-[#1C1C1C]/6 bg-[#F8F7F5]">
                        <p className="text-[7px] font-mono uppercase tracking-[0.5em] text-[#1C1C1C]/30 mb-3">Goals</p>
                        <ul className="space-y-1">
                          {auraProfile.goals.map((g, i) => (
                            <li key={i} className="text-[11px] font-light text-[#1C1C1C]/55 flex items-center gap-2">
                              <span className="w-1 h-1 rounded-full bg-[#D4AF37]/40 shrink-0" />
                              {g}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Aura's learned patterns */}
                {(auraProfile.primaryAnchor || (auraProfile.topMoods && auraProfile.topMoods.length > 0)) && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Brain size={11} className="text-[#1C1C1C]/30" />
                      <p className="text-[8px] font-mono uppercase tracking-[0.5em] text-[#1C1C1C]/35">
                        What Aura Has Learned
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {auraProfile.primaryAnchor && (
                        <span className="px-3 py-1.5 border border-[#D4AF37]/30 text-[8px] font-mono text-[#D4AF37]/70 uppercase tracking-[0.2em]">
                          Primary: {auraProfile.primaryAnchor}
                        </span>
                      )}
                      {auraProfile.topAnchors?.map(a => (
                        <span key={a} className="px-3 py-1.5 border border-[#1C1C1C]/8 text-[8px] font-mono text-[#1C1C1C]/35 uppercase tracking-[0.2em]">
                          {a}
                        </span>
                      ))}
                      {auraProfile.topMoods?.map(m => (
                        <span key={m} className="px-3 py-1.5 border border-[#1C1C1C]/6 text-[8px] font-mono text-[#1C1C1C]/30 uppercase tracking-[0.2em]">
                          {m} mood
                        </span>
                      ))}
                      {auraProfile.preferredLighting?.map(l => (
                        <span key={l} className="px-3 py-1.5 border border-[#1C1C1C]/6 text-[8px] font-mono text-[#1C1C1C]/25 uppercase tracking-[0.2em]">
                          {l}
                        </span>
                      ))}
                    </div>
                    <p className="text-[8px] font-mono text-[#1C1C1C]/25 uppercase tracking-[0.3em]">
                      {auraProfile.totalGenerations || 0} total generation{(auraProfile.totalGenerations || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                {/* Memories */}
                {auraProfile.memories && auraProfile.memories.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-[8px] font-mono uppercase tracking-[0.5em] text-[#1C1C1C]/35">
                      Aura's Memory ({auraProfile.memories.length})
                    </p>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                      {auraProfile.memories.map((m, i) => (
                        <div key={i} className="flex gap-3 p-4 border border-[#1C1C1C]/5 bg-[#F8F7F5]">
                          <div className="shrink-0 mt-1">
                            <div className="w-1 h-1 rounded-full bg-[#D4AF37]/30" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-light text-[#1C1C1C]/65 leading-relaxed">{m.fact}</p>
                            <p className="text-[7px] font-mono uppercase tracking-[0.3em] text-[#1C1C1C]/25 mt-1">
                              {m.source} · {new Date(m.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Standing Directives */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <p className="text-[8px] font-mono uppercase tracking-[0.5em] text-[#1C1C1C]/35">
                      Standing Directives
                    </p>
                    <span className="text-[7px] font-mono text-[#1C1C1C]/20 uppercase tracking-[0.2em]">
                      — rules Aura always follows for you
                    </span>
                  </div>

                  {/* Existing directives */}
                  {auraProfile.userDirectives && auraProfile.userDirectives.length > 0 ? (
                    <div className="space-y-2">
                      {auraProfile.userDirectives.map((d, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 p-3 border border-[#1C1C1C]/6 bg-[#F8F7F5] group/dir">
                          <p className="text-[11px] font-light text-[#1C1C1C]/60 leading-relaxed flex-1">{d}</p>
                          <button
                            onClick={() => removeDirective(d)}
                            className="text-[#1C1C1C]/15 hover:text-red-400/60 transition-colors opacity-0 group-hover/dir:opacity-100 shrink-0"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] font-light text-[#1C1C1C]/25 italic">
                      No standing directives yet. Add instructions below.
                    </p>
                  )}

                  {/* Add directive */}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newDirective}
                      onChange={e => setNewDirective(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !savingDirective && addDirective()}
                      placeholder="e.g. Always keep my skin tone consistent"
                      className="flex-1 bg-transparent border-b border-[#1C1C1C]/10 py-2 text-[11px] font-light text-[#1C1C1C]/70 placeholder-[#1C1C1C]/20 focus:outline-none focus:border-[#D4AF37]/30"
                    />
                    <button
                      onClick={addDirective}
                      disabled={!newDirective.trim() || savingDirective}
                      className="flex items-center gap-1.5 px-4 py-2 border border-[#D4AF37]/30 text-[#D4AF37]/70 text-[8px] font-mono uppercase tracking-[0.3em] hover:bg-[#D4AF37]/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <Plus size={10} />
                      Add
                    </button>
                  </div>
                </div>

                {/* Tell Aura something */}
                <div className="space-y-4 border-t border-[#1C1C1C]/6 pt-10">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={11} className="text-[#1C1C1C]/30" />
                    <p className="text-[8px] font-mono uppercase tracking-[0.5em] text-[#1C1C1C]/35">
                      Tell Aura Something
                    </p>
                  </div>
                  <p className="text-[10px] font-light text-[#1C1C1C]/35 leading-relaxed">
                    Share context Aura should remember — your shooting style, product details, preferences,
                    anything that helps her understand your vision better.
                  </p>
                  <div className="flex gap-3 items-end">
                    <textarea
                      value={conversationMsg}
                      onChange={e => setConversationMsg(e.target.value)}
                      placeholder="e.g. I mostly shoot indoors under ring light. My main product is loc extensions…"
                      rows={3}
                      className="flex-1 bg-[#F8F7F5] border border-[#1C1C1C]/8 p-4 text-[11px] font-light text-[#1C1C1C]/70 placeholder-[#1C1C1C]/20 focus:outline-none focus:border-[#D4AF37]/30 resize-none leading-relaxed"
                    />
                    <button
                      onClick={sendConversationMessage}
                      disabled={!conversationMsg.trim() || sendingMsg}
                      className="flex items-center gap-2 px-5 py-3 border border-[#D4AF37]/30 text-[#D4AF37]/70 text-[8px] font-mono uppercase tracking-[0.3em] hover:bg-[#D4AF37]/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed self-end"
                    >
                      <Send size={11} />
                      {sendingMsg ? 'Saving…' : 'Tell Aura'}
                    </button>
                  </div>
                  <AnimatePresence>
                    {msgSent && (
                      <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[9px] font-mono uppercase tracking-[0.4em] text-[#D4AF37]/60"
                      >
                        Aura remembers.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            )}

          </motion.div>

          {/* ── Subscription management ── */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 1 }} className="flex flex-col md:flex-row gap-4 items-start">
            <Link
              to="/pricing"
              className="px-8 py-3 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-mono uppercase tracking-[0.3em] hover:bg-[#D4AF37]/10 transition-colors"
            >
              {tier === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
            </Link>
            {tier === 'free' && (
              <p className="text-[10px] text-[#1C1C1C]/40 font-light self-center leading-relaxed max-w-xs">
                {profile.freeRunUsed
                  ? 'Your complimentary run has been used. Subscribe to continue generating.'
                  : '1 complimentary run available — no card required. Subscribe to unlock full forge capacity.'}
              </p>
            )}
            {tier !== 'free' && profile.subscriptionStatus === 'ACTIVE' && (
              <div className="flex items-center gap-2 self-center">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#1C1C1C]/50">
                  Subscription Active
                </span>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </Layout>
  );
}
