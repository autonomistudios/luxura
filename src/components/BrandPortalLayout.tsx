import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, FolderLock, Layers, Users,
  BarChart2, Settings, Code2, LogOut,
  AlertTriangle, LayoutGrid, BookOpen,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Badge } from './ui';
import { pageTransition } from '../lib/motion';

const NAV_ITEMS = [
  { to: '/portal',           label: 'Studio Forge',    icon: Sparkles,   end: true  },
  { to: '/portal/skus',      label: 'SKU Vault',       icon: FolderLock, end: false },
  { to: '/portal/sets',      label: 'Virtual Backlot', icon: Layers,     end: false },
  { to: '/portal/campaigns', label: 'Campaigns',       icon: Sparkles,   end: false },
  { to: '/portal/vault',     label: 'Asset Vault',     icon: LayoutGrid, end: false },
  { to: '/portal/lookbook',  label: 'Lookbook',        icon: BookOpen,   end: false },
  { to: '/portal/analytics', label: 'Analytics',       icon: BarChart2,  end: false },
  { to: '/portal/settings',  label: 'Brand Settings',  icon: Settings,   end: false },
  { to: '/portal/team',      label: 'Team',            icon: Users,      end: false },
  { to: '/portal/api',       label: 'API Access',      icon: Code2,      end: false },
];

export default function BrandPortalLayout() {
  const { brand, user, logout, quotaPercent, quotaRemaining, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);

  const pct        = quotaPercent();
  const quotaColor = pct >= 95 ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--gold)';

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-canvas text-primary flex flex-col font-sans" style={{ cursor: 'auto' }}>

      {/* ── Top status bar — frosted material chrome ───────────────────────── */}
      <header
        className="h-16 shrink-0 z-20 flex items-center justify-between px-7 border-b border-hairline sticky top-0"
        style={{ background: 'var(--material-chrome)', backdropFilter: 'var(--material-blur)', WebkitBackdropFilter: 'var(--material-blur)' }}
      >
        <div className="flex items-center gap-5">
          <span className="font-display italic font-medium text-[22px] tracking-[0.01em] leading-none">
            Lux<span className="not-italic font-semibold tracking-[0.02em]">Aura</span>
          </span>
          <span className="h-5 w-px bg-hairline-strong" />
          <span className="font-mono text-[10px] tracking-[0.34em] uppercase text-tertiary">The Atelier</span>
        </div>

        <div className="flex items-center gap-7 font-mono text-[11px] tracking-[0.04em] text-secondary">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-soft" style={{ boxShadow: '0 0 10px var(--success)' }} />
            Edge Connected
          </span>
          {brand && (
            <>
              <span className="hidden md:inline">Plan / <span className="text-primary capitalize">{brand.tier}</span></span>
              <span className="flex items-center gap-2">
                Usage / <span style={{ color: quotaColor }}>
                  {brand.usage.currentPeriodImages.toLocaleString()} of {brand.quota.imagesPerMonth.toLocaleString()}
                </span>
                {pct >= 80 && <AlertTriangle size={12} style={{ color: quotaColor }} />}
              </span>
            </>
          )}
          {isAdmin && <Badge tone="gold">Admin</Badge>}
        </div>
      </header>

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className="w-[248px] shrink-0 border-r border-hairline bg-sunken flex flex-col justify-between py-9 px-4 z-10">
          <div className="flex flex-col gap-9">

            {/* Brand identity */}
            <div className="px-3">
              {brand?.logoUrl ? (
                <img src={brand.logoUrl} alt={brand.name} className="max-w-[150px] max-h-9 object-contain" />
              ) : (
                <div className="flex flex-col gap-1.5">
                  <h1 className="font-display italic font-medium text-[22px] tracking-[-0.01em] leading-none text-primary">
                    {brand?.name || 'LuxAura'}
                  </h1>
                  <span className="font-mono text-[8px] tracking-[0.42em] uppercase text-quaternary">
                    {brand?.tier || 'Studio'} Atelier
                  </span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-0.5">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3.5 pl-4 pr-3 py-2.5 rounded-lg text-[13px] transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${
                      isActive ? 'text-primary' : 'text-tertiary hover:text-primary hover:bg-[var(--surface-raised)]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span layoutId="nav-active"
                          className="absolute inset-0 rounded-lg -z-10"
                          style={{ background: 'linear-gradient(90deg, var(--gold-wash) 0%, transparent 80%)', borderLeft: '2px solid var(--gold)' }}
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                      <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} style={{ color: isActive ? 'var(--gold)' : undefined }} />
                      <span className={isActive ? 'font-medium tracking-[0.01em]' : 'font-light'}>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Bottom — quota meter + user */}
          <div className="flex flex-col gap-6 px-3">
            {brand && (
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-baseline">
                  <span className="font-mono text-[8px] tracking-[0.34em] uppercase text-quaternary">Monthly Quota</span>
                  <span className="font-mono text-[10px] text-secondary">{Math.round(pct)}%</span>
                </div>
                <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-inset)' }}>
                  <motion.div className="h-full rounded-full"
                    style={{ background: quotaColor, boxShadow: `0 0 10px ${quotaColor}` }}
                    initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-quaternary">
                  {quotaRemaining().toLocaleString()} plates remaining
                </span>
              </div>
            )}

            <div className="border-t border-hairline pt-5 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-raised border border-hairline flex items-center justify-center">
                    <span className="font-mono text-[11px] text-secondary">{user?.email?.[0]?.toUpperCase() || 'U'}</span>
                  </div>
                )}
                <span className="text-[12px] font-light text-secondary truncate">{user?.email?.split('@')[0] || '—'}</span>
              </div>
              <button onClick={handleLogout} disabled={loggingOut} title="Sign out"
                className="text-tertiary hover:text-primary transition-colors p-2 hover:bg-raised rounded-lg">
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </aside>

        {/* ── Page content ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-canvas relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={pageTransition.initial}
              animate={pageTransition.animate}
              exit={pageTransition.exit}
              transition={pageTransition.transition}
              className="min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
