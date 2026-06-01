import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Users, TrendingUp, BarChart2 } from 'lucide-react';
import Layout from '../components/Layout';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

const ADMIN_EMAIL = 'autonomistudiosllc@gmail.com';
type SubscriptionTier = 'free' | 'aura' | 'sovereign' | 'luminary';
interface UserProfile { uid: string; email: string; displayName: string; photoURL: string; tier: string; imageCredits: number; videoCredits: number; subscriptionStatus: string | null; createdAt?: unknown; }
const TIER_CONFIG: Record<string, { label: string; color: string; price: number }> = {
  free:      { label: 'Free',      color: 'white',   price: 0   },
  aura:      { label: 'Aura',      color: '#D4AF37', price: 85  },
  sovereign: { label: 'Sovereign', color: '#C0C0C0', price: 165 },
  luminary:  { label: 'Luminary',  color: '#E5D3FF', price: 299 },
};
const TIER_PRICES: Record<string, number> = { free: 0, aura: 85, sovereign: 165, luminary: 299 };

export default function AdminDashboard() {
  const { user, loading, isAdmin } = useAuth();
  const navigate          = useNavigate();

  const [users,    setUsers]    = useState<UserProfile[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // Redirect non-admins immediately
  useEffect(() => {
    if (!loading && !isAdmin) navigate('/', { replace: true });
  }, [loading, isAdmin, navigate]);

  // Load all users from Firestore
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const q    = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setUsers(snap.docs.map(d => d.data() as UserProfile));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setFetching(false);
      }
    })();
  }, [isAdmin]);

  if (!isAdmin) return null;

  // ── Computed Stats ───────────────────────────────────────────────────────────
  const tierCounts = { free: 0, aura: 0, sovereign: 0, luminary: 0 } as Record<SubscriptionTier, number>;
  let mrr = 0;
  for (const u of users) {
    const t = u.tier as SubscriptionTier;
    tierCounts[t] = (tierCounts[t] || 0) + 1;
    if (t !== 'free' && u.subscriptionStatus === 'ACTIVE') mrr += TIER_PRICES[t];
  }
  const paidUsers       = users.filter(u => u.tier !== 'free' && u.subscriptionStatus === 'ACTIVE').length;
  const conversionRate  = users.length > 0 ? ((paidUsers / users.length) * 100).toFixed(1) : '0';
  const totalVideoLeft  = users.reduce((a, u) => a + (u.videoCredits || 0), 0);
  const totalImageLeft  = users.reduce((a, u) => a + (u.imageCredits || 0), 0);

  const STAT_CARDS = [
    { label: 'Total Users',      value: users.length.toLocaleString(), sub: 'All time',                      icon: Users },
    { label: 'Paid Subscribers', value: paidUsers.toLocaleString(),    sub: 'Active subscriptions',           icon: Zap },
    { label: 'Est. MRR',         value: `$${mrr.toLocaleString()}`,    sub: 'Monthly recurring revenue',      icon: TrendingUp },
    { label: 'Conversion Rate',  value: `${conversionRate}%`,          sub: 'Free → paid conversion',         icon: BarChart2 },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">

        {/* ── Header ── */}
        <div className="mb-12 pb-8 border-b border-[#1C1C1C]/8">
          <p className="text-[8px] font-mono uppercase tracking-[0.6em] text-[#D4AF37]/50 mb-2">
            Sovereign Console · Admin Access
          </p>
          <h1 className="text-4xl font-serif text-[#1C1C1C] italic mb-2">Studio Intelligence</h1>
          <p className="text-[8px] font-mono text-[#1C1C1C]/35 uppercase tracking-widest">{user?.email}</p>
        </div>

        {/* ── Firestore Rules Warning ── */}
        {error && (
          <div className="mb-10 p-5 border border-red-500/20 bg-red-950/10">
            <p className="text-[9px] font-mono text-red-400 mb-2">[ Firestore Permission Denied ]</p>
            <p className="text-[8px] font-mono text-[#1C1C1C]/45 leading-relaxed mb-3">
              Add this rule in Firebase Console → Firestore → Rules to allow admin read access:
            </p>
            <pre className="text-[8px] font-mono text-[#D4AF37]/60 bg-black/40 p-4 overflow-x-auto leading-relaxed rounded-none">
{`match /users/{uid} {
  allow read, write: if request.auth != null && (
    request.auth.uid == uid ||
    request.auth.token.email == '${ADMIN_EMAIL}'
  );
}`}
            </pre>
          </div>
        )}

        {fetching ? (
          <div className="flex items-center justify-center py-48">
            <p className="text-[9px] font-mono uppercase tracking-[0.6em] text-[#1C1C1C]/35 animate-pulse">
              Loading studio data...
            </p>
          </div>
        ) : (
          <>
            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              {STAT_CARDS.map(({ label, value, sub, icon: Icon }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.6 }}
                  className="border border-[#1C1C1C]/8 bg-[#F2EFE9] p-6 hover:border-[#D4AF37]/20 transition-colors duration-700 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[7px] font-mono uppercase tracking-[0.4em] text-[#1C1C1C]/40">{label}</p>
                    <Icon size={11} className="text-[#1C1C1C]/20 group-hover:text-[#D4AF37]/40 transition-colors" />
                  </div>
                  <p className="text-3xl font-serif text-[#D4AF37] leading-none mb-1">{value}</p>
                  <p className="text-[7px] font-mono text-[#1C1C1C]/35">{sub}</p>
                </motion.div>
              ))}
            </div>

            {/* ── Secondary Metrics ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              {[
                { label: 'Annual Run Rate',   value: `$${(mrr * 12).toLocaleString()}` },
                { label: 'Avg Rev / User',    value: users.length > 0 ? `$${(mrr / users.length).toFixed(2)}` : '$0.00' },
                { label: 'Image Credits Left', value: totalImageLeft.toLocaleString() },
                { label: 'Video Credits Left', value: totalVideoLeft.toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="border border-[#1C1C1C]/8 bg-[#F2EFE9] p-5">
                  <p className="text-[7px] font-mono uppercase tracking-[0.4em] text-[#1C1C1C]/35 mb-2">{label}</p>
                  <p className="text-2xl font-serif text-[#1C1C1C]/65">{value}</p>
                </div>
              ))}
            </div>

            {/* ── Tier Breakdown ── */}
            <div className="mb-10">
              <p className="text-[8px] font-mono uppercase tracking-[0.5em] text-[#1C1C1C]/40 mb-5">Tier Distribution</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.keys(tierCounts) as SubscriptionTier[]).map((tier) => {
                  const pct = users.length > 0 ? (tierCounts[tier] / users.length) * 100 : 0;
                  const cfg = TIER_CONFIG[tier];
                  return (
                    <div key={tier} className="border border-white/5 p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[8px] font-mono uppercase tracking-[0.3em]" style={{ color: cfg.color }}>
                          {cfg.label}
                        </span>
                        <span className="text-2xl font-serif" style={{ color: cfg.color }}>
                          {tierCounts[tier]}
                        </span>
                      </div>
                      <div className="h-[1px] bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                          className="h-full"
                          style={{ backgroundColor: cfg.color, opacity: 0.5 }}
                        />
                      </div>
                      <p className="text-[7px] font-mono text-white/15 mt-2">{pct.toFixed(1)}% of users</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── User Table ── */}
            <div>
              <p className="text-[8px] font-mono uppercase tracking-[0.5em] text-[#1C1C1C]/40 mb-5">
                All Accounts — {users.length} records
              </p>
              <div className="border border-white/5 overflow-x-auto">
                <table className="w-full text-[9px] font-mono min-w-[800px]">
                  <thead>
                    <tr className="border-b border-[#1C1C1C]/8">
                      {['Display Name', 'Email', 'Tier', 'Sub Status', 'Img Credits', 'Vid Credits', 'Joined'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[7px] text-white/20 uppercase tracking-[0.3em] font-normal whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const cfg     = TIER_CONFIG[u.tier as SubscriptionTier] || TIER_CONFIG.free;
                      const isActive = u.subscriptionStatus === 'ACTIVE';
                      const joinDate = (u.createdAt as any)?.seconds
                        ? new Date((u.createdAt as any).seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                        : '—';
                      return (
                        <tr key={u.uid} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 text-white/60 whitespace-nowrap">{u.displayName || '—'}</td>
                          <td className="px-4 py-3 text-white/35 whitespace-nowrap">{u.email}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="uppercase tracking-widest" style={{ color: cfg.color }}>{u.tier}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={isActive ? 'text-green-400' : u.tier === 'free' ? 'text-white/20' : 'text-yellow-500/70'}>
                              {u.subscriptionStatus || (u.tier === 'free' ? 'free' : 'inactive')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white/35">{u.imageCredits ?? 0}</td>
                          <td className="px-4 py-3 text-white/35">{u.videoCredits ?? 0}</td>
                          <td className="px-4 py-3 text-white/20 whitespace-nowrap">{joinDate}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {users.length === 0 && !error && (
                  <div className="py-20 text-center">
                    <p className="text-[8px] font-mono text-white/15 uppercase tracking-widest">No users yet</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
