import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, FolderLock, Layers, Users, ShieldCheck,
  BarChart2, Settings, Code2, LogOut, ChevronRight,
  AlertTriangle, LayoutGrid,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/portal',              label: 'Studio Forge',        icon: Sparkles,    end: true  },
  { to: '/portal/skus',         label: 'SKU Vault',           icon: FolderLock,  end: false },
  { to: '/portal/sets',         label: 'Virtual Backlot',     icon: Layers,      end: false },
  { to: '/portal/campaigns',    label: 'Campaigns',           icon: Sparkles,    end: false },
  { to: '/portal/vault',        label: 'Asset Vault',         icon: LayoutGrid,  end: false },
  { to: '/portal/analytics',    label: 'Analytics',           icon: BarChart2,   end: false },
  { to: '/portal/settings',     label: 'Brand Settings',      icon: Settings,    end: false },
  { to: '/portal/team',         label: 'Team',                icon: Users,       end: false },
  { to: '/portal/api',          label: 'API Access',          icon: Code2,       end: false },
];

export default function BrandPortalLayout() {
  const { brand, user, logout, quotaPercent, quotaRemaining, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const pct       = quotaPercent();
  const remaining = quotaRemaining();
  const quotaColor = pct >= 95 ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#B8952A';

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col select-none">

      {/* ── Top status bar ──────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-white/[0.06] bg-[#07070A]/90 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-5">
          <span className="text-[9px] font-mono tracking-[0.45em] uppercase text-[#B8952A]">
            Brand Workspace
          </span>
          <span className="h-3 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-white/40">Edge Servers: Ready</span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-[10px] font-mono">
          {brand && (
            <>
              <div>
                <span className="text-white/30">Tier: </span>
                <span className="text-[#B8952A] capitalize font-semibold">{brand.tier}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/30">Images: </span>
                <span style={{ color: quotaColor }}>
                  {brand.usage.currentPeriodImages.toLocaleString()} / {brand.quota.imagesPerMonth.toLocaleString()}
                </span>
                {pct >= 80 && (
                  <AlertTriangle size={11} style={{ color: quotaColor }} />
                )}
              </div>
            </>
          )}
          {isAdmin && (
            <span className="text-[#B8952A] bg-[#B8952A]/10 border border-[#B8952A]/20 px-2 py-0.5 rounded text-[8px] tracking-[0.3em] uppercase">
              Admin
            </span>
          )}
          <button
            onClick={() => navigate('/admin')}
            className="text-white/20 hover:text-white/60 transition-colors text-[10px] font-mono"
          >
            Studio
          </button>
        </div>
      </header>

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className="w-[200px] shrink-0 border-r border-white/[0.06] bg-[#060608] flex flex-col justify-between py-8 px-3 z-10">
          <div className="flex flex-col gap-8">

            {/* Brand identity */}
            <div className="px-3">
              {brand?.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="max-w-[160px] max-h-12 object-contain"
                />
              ) : (
                <div className="flex flex-col gap-0.5">
                  <h1 className="font-serif italic text-[18px] tracking-[0.08em] text-white leading-none">
                    {brand?.name || 'LUXAURA'}
                  </h1>
                  <span className="text-[8px] font-mono tracking-[0.35em] uppercase text-[#B8952A]">
                    {brand?.tier || 'Studio'}
                  </span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-0.5">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded text-[13px] font-medium tracking-wide transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-[#B8952A]/12 to-transparent border-l-2 border-[#B8952A] text-white pl-[10px]'
                        : 'text-white/35 hover:text-white hover:bg-white/[0.02] border-l-2 border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={14} className={isActive ? 'text-[#B8952A]' : ''} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Bottom — quota meter + logout */}
          <div className="flex flex-col gap-4 px-3">

            {/* Quota meter */}
            {brand && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-mono tracking-[0.35em] uppercase text-white/25">
                    Image Quota
                  </span>
                  <span className="text-[8px] font-mono" style={{ color: quotaColor }}>
                    {Math.round(pct)}%
                  </span>
                </div>
                <div className="w-full h-[2px] bg-white/[0.05] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: quotaColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[8px] font-mono text-white/20">
                  {remaining === Infinity ? '∞' : remaining.toLocaleString()} remaining
                </span>
              </div>
            )}

            {/* User + logout */}
            <div className="border-t border-white/[0.05] pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full opacity-80" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#B8952A]/20 border border-[#B8952A]/30 flex items-center justify-center">
                    <span className="text-[8px] font-mono text-[#B8952A]">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <span className="text-[10px] font-mono text-white/30 truncate">
                  {user?.email?.split('@')[0] || '—'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-white/20 hover:text-white/60 transition-colors p-1 rounded"
                title="Sign out"
              >
                <LogOut size={12} />
              </button>
            </div>
          </div>
        </aside>

        {/* ── Page content ────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-[#050507]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
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
