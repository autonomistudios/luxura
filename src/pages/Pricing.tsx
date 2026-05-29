import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import type { SubscriptionTier } from '../contexts/AuthContext';
import { useAuth, TIER_CONFIG } from '../contexts/AuthContext';
import { db } from '../lib/firebase';

// ── PayPal plan IDs from env ──────────────────────────────────────────────────
const PAYPAL_PLAN_IDS: Record<string, string> = {
  aura:      import.meta.env.VITE_PAYPAL_PLAN_AURA      || '',
  sovereign: import.meta.env.VITE_PAYPAL_PLAN_SOVEREIGN || '',
  luminary:  import.meta.env.VITE_PAYPAL_PLAN_LUMINARY  || '',
};

const TIERS: Array<{
  id:      SubscriptionTier;
  popular: boolean;
  desc:    string;
  perks:   string[];
}> = [
  {
    id:      'aura',
    popular: false,
    desc:    'Perfect for individual creators and personal brand building.',
    perks: [
      '300 image credits / month',
      '100 forge runs (6 images each)',
      'Full anchor system access',
      'Vault storage & remix',
      'All skin tone & lighting controls',
      'Email support',
    ],
  },
  {
    id:      'sovereign',
    popular: true,
    desc:    'For growing studios, content teams, and professional creators.',
    perks: [
      '750 image credits / month',
      '250 forge runs / month',
      '5 video generation credits',
      'Priority Mantis Engine queue',
      'Everything in Aura',
      'Priority email support',
    ],
  },
  {
    id:      'luminary',
    popular: false,
    desc:    'Full production capacity for agencies and power users.',
    perks: [
      '1,500 image credits / month',
      '500 forge runs / month',
      '20 video generation credits',
      'Dedicated compute lane',
      'Everything in Sovereign',
      'Direct account support',
    ],
  },
];

const CREDIT_TOPUPS = [
  { imageCredits: 100, price: 9,  label: '100 Image Credits' },
  { imageCredits: 300, price: 24, label: '300 Image Credits' },
  { imageCredits: 500, price: 35, label: '500 Image Credits' },
];

// ── Native PayPal button (no React wrapper) ───────────────────────────────────

let paypalScriptLoading = false;
let paypalScriptLoaded  = false;
const paypalCallbacks: Array<() => void> = [];

function loadPayPalScript(clientId: string, onReady: () => void) {
  if (paypalScriptLoaded) { onReady(); return; }
  paypalCallbacks.push(onReady);
  if (paypalScriptLoading) return;

  paypalScriptLoading = true;
  const script = document.createElement('script');
  script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription&components=buttons`;
  script.async = true;
  script.onload = () => {
    paypalScriptLoaded  = true;
    paypalScriptLoading = false;
    paypalCallbacks.forEach((cb) => cb());
    paypalCallbacks.length = 0;
  };
  script.onerror = () => {
    paypalScriptLoading = false;
    console.error('[PayPal] Script failed to load — check network or ad blocker');
  };
  document.head.appendChild(script);
}

interface PayPalSubscribeButtonProps {
  planId:      string;
  tierId:      SubscriptionTier;
  clientId:    string;
  uid:         string;
  onApprove:   (subscriptionID: string) => void;
  onError:     (err: any) => void;
}

function PayPalSubscribeButton({ planId, tierId: _tierId, clientId, uid, onApprove, onError }: PayPalSubscribeButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sdkReady, setSdkReady]     = useState(paypalScriptLoaded);
  const [rendered, setRendered]     = useState(false);
  const [sdkError, setSdkError]     = useState(false);

  useEffect(() => {
    if (sdkReady) return;
    loadPayPalScript(clientId, () => setSdkReady(true));
  }, [clientId]);

  useEffect(() => {
    if (!sdkReady || !containerRef.current || rendered) return;

    const paypal = (window as any).paypal;
    if (!paypal) { setSdkError(true); return; }

    containerRef.current.innerHTML = '';

    try {
      paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'subscribe', height: 40 },
        createSubscription: (_data: any, actions: any) =>
          actions.subscription.create({ plan_id: planId, custom_id: uid }),
        onApprove: (data: any) => onApprove(data.subscriptionID || ''),
        onError:   (err: any)  => { console.error('[PayPal]', err); onError(err); },
      }).render(containerRef.current);
      setRendered(true);
    } catch (err) {
      console.error('[PayPal] Button render failed:', err);
      setSdkError(true);
    }
  }, [sdkReady, planId, uid]);

  if (sdkError) return (
    <p className="text-[9px] font-mono text-yellow-500/60 text-center py-3 border border-yellow-500/20">
      PayPal unavailable — try disabling ad blockers
    </p>
  );

  if (!sdkReady) return (
    <p className="text-[9px] font-mono text-white/20 text-center py-3 animate-pulse uppercase tracking-widest">
      Loading…
    </p>
  );

  return <div ref={containerRef} className="w-full" />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Pricing() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [activating, setActivating] = useState<string | null>(null);
  const [success,    setSuccess]    = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';

  async function handleSubscriptionApproved(tierId: SubscriptionTier, subscriptionID: string) {
    if (!user) { navigate('/login'); return; }
    setActivating(tierId);
    try {
      const tierCfg = TIER_CONFIG[tierId];
      await updateDoc(doc(db, 'users', user.uid), {
        tier:               tierId,
        imageCredits:       tierCfg.imageCredits,
        videoCredits:       tierCfg.videoCredits,
        subscriptionId:     subscriptionID,
        subscriptionStatus: 'ACTIVE',
      });
      await refreshProfile();
      setSuccess(`${tierCfg.label} plan activated! ${tierCfg.imageCredits} image credits added.`);
      setTimeout(() => navigate('/profile'), 2500);
    } catch (err) {
      console.error('[PRICING] activation error:', err);
      setError('Activation failed — please contact support.');
    } finally {
      setActivating(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] px-6 pt-20 pb-32 relative overflow-hidden">

      {/* Atmospheric overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay">
        <div className="w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* Back nav */}
      <div className="max-w-6xl mx-auto mb-16">
        <Link
          to={user ? '/' : '/login'}
          className="text-[9px] font-mono uppercase tracking-[0.4em] text-white/30 hover:text-white transition-colors"
        >
          ← {user ? 'Back to Atelier' : 'Back to Login'}
        </Link>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="max-w-6xl mx-auto text-center mb-20 space-y-4"
      >
        <p className="text-[9px] font-mono uppercase tracking-[0.6em] text-[#D4AF37]/50">
          LuxAura Private Atelier
        </p>
        <h1 className="text-5xl md:text-6xl font-serif text-white tracking-tight">
          Subscription Plans
        </h1>
        <p className="text-white/30 text-sm font-light max-w-md mx-auto leading-relaxed">
          Each plan renews monthly. Credits reset every billing cycle.
          Cancel anytime from your profile.
        </p>
        {profile && (
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-[#D4AF37]">
            Current Plan: {TIER_CONFIG[profile.tier].label}
          </p>
        )}
      </motion.div>

      {/* Success / Error banners */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto mb-8 p-4 border border-green-500/30 bg-green-500/10 text-center"
        >
          <p className="text-green-400 text-[11px] font-mono uppercase tracking-widest">{success}</p>
        </motion.div>
      )}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto mb-8 p-4 border border-red-500/30 bg-red-500/10 text-center"
        >
          <p className="text-red-400 text-[11px] font-mono uppercase tracking-widest">{error}</p>
        </motion.div>
      )}

      {/* Tier cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
        {TIERS.map((tier, i) => {
          const cfg          = TIER_CONFIG[tier.id];
          const isCurrent    = profile?.tier === tier.id;
          const planId       = PAYPAL_PLAN_IDS[tier.id];
          const isActivating = activating === tier.id;

          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.8 }}
              className={`relative p-8 border flex flex-col gap-6 ${
                tier.popular
                  ? 'border-[#D4AF37]/40 bg-[#D4AF37]/[0.03]'
                  : 'border-white/5 bg-white/[0.01]'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#D4AF37] text-black text-[8px] font-mono uppercase tracking-[0.3em]">
                  Most Popular
                </div>
              )}

              {isCurrent && (
                <div className="absolute top-4 right-4 px-3 py-1 border border-green-500/40 text-green-400 text-[8px] font-mono uppercase tracking-widest">
                  Active
                </div>
              )}

              {/* Tier name + price */}
              <div>
                <p className="text-[9px] font-mono uppercase tracking-[0.5em] mb-2"
                   style={{ color: cfg.color }}>
                  {cfg.label}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-serif text-white">${cfg.price}</span>
                  <span className="text-white/30 text-xs font-mono">/mo</span>
                </div>
                <p className="text-white/30 text-xs mt-3 leading-relaxed">{tier.desc}</p>
              </div>

              {/* Perks */}
              <ul className="space-y-2 flex-1">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3">
                    <span style={{ color: cfg.color }} className="text-xs mt-0.5">✓</span>
                    <span className="text-white/50 text-[11px] font-mono">{perk}</span>
                  </li>
                ))}
              </ul>

              {/* Subscribe button */}
              <div className="mt-auto">
                {isCurrent ? (
                  <div className="text-center py-3 border border-green-500/20 text-green-400 text-[10px] font-mono uppercase tracking-widest">
                    Your Current Plan
                  </div>
                ) : !user ? (
                  <Link
                    to="/login"
                    className="block text-center py-3 border text-[10px] font-mono uppercase tracking-widest transition-all duration-500"
                    style={{ borderColor: `${cfg.color}40`, color: cfg.color }}
                  >
                    Sign In to Subscribe
                  </Link>
                ) : isActivating ? (
                  <div className="text-center py-3 text-[10px] font-mono uppercase tracking-widest text-white/30 animate-pulse">
                    Activating…
                  </div>
                ) : !planId ? (
                  <div className="text-center py-3 border border-white/10 text-white/20 text-[10px] font-mono uppercase tracking-widest">
                    Plan ID Not Configured
                  </div>
                ) : (
                  <PayPalSubscribeButton
                    planId={planId}
                    tierId={tier.id}
                    clientId={paypalClientId}
                    uid={user.uid}
                    onApprove={(subId) => handleSubscriptionApproved(tier.id, subId)}
                    onError={() => setError('PayPal encountered an error. Please try again.')}
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Credit top-ups */}
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 space-y-2">
          <p className="text-[9px] font-mono uppercase tracking-[0.6em] text-white/20">
            Need More?
          </p>
          <h2 className="text-2xl font-serif text-white">Additional Image Credits</h2>
          <p className="text-white/30 text-xs">One-time purchases. Credits are added instantly.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CREDIT_TOPUPS.map((topup) => (
            <div
              key={topup.label}
              className="p-6 border border-white/5 bg-white/[0.01] flex flex-col gap-4"
            >
              <div>
                <p className="text-[9px] font-mono uppercase tracking-[0.4em] text-white/30 mb-1">
                  {topup.label}
                </p>
                <p className="text-2xl font-serif text-white">${topup.price}</p>
                <p className="text-[10px] font-mono text-white/20 mt-1">
                  ≈ {Math.floor(topup.imageCredits / 6)} forge runs
                </p>
              </div>
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                Coming Soon
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Credit cost transparency */}
      <div className="max-w-2xl mx-auto mt-20 p-8 border border-white/5 text-center space-y-4">
        <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-white/20">
          Credit Costs
        </p>
        <div className="flex justify-center gap-12">
          <div>
            <p className="text-2xl font-serif text-white">3</p>
            <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 mt-1">
              credits per forge run
            </p>
          </div>
          <div className="w-px bg-white/5" />
          <div>
            <p className="text-2xl font-serif text-white">6</p>
            <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 mt-1">
              images per forge run
            </p>
          </div>
          <div className="w-px bg-white/5" />
          <div>
            <p className="text-2xl font-serif text-white">1</p>
            <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 mt-1">
              video credit per video
            </p>
          </div>
        </div>
        <p className="text-[10px] text-white/20 font-light">
          One forge run produces 6 unique editorial images.
        </p>
      </div>
    </div>
  );
}
