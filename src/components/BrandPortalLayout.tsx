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
    <div className="min-h-screen bg-black text-white flex flex-col select-none font-sans">

      {/* ── Top status bar ──────────────────────────────────────────────────── */}
      <header className="h-16 border-b border-white/[0.05] bg-black/50 backdrop-blur-2xl flex items-center justify-between px-8 shrink-0 z-20">
        <div className="flex items-center gap-6">
          <span className="text-[11px] font-medium tracking-widest uppercase text-[#F5F5F7]">
            LuxAura Studio
          </span>
          <span className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            <span className="text-[11px] text-[#86868B]">Edge Connected</span>
          </div>
        </div>

        <div className="flex items-center gap-8 text-[11px] font-medium">
          {brand && (
            <>
              <div>
                <span className="text-[#86868B]">Plan / </span>
                <span className="text-white capitalize">{brand.tier}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#86868B]">Usage / </span>
                <span style={{ color: quotaColor }}>
                  {brand.usage.currentPeriodImages.toLocaleString()} of {brand.quota.imagesPerMonth.toLocaleString()}
                </span>
                {pct >= 80 && (
                  <AlertTriangle size={12} style={{ color: quotaColor }} />
                )}
              </div>
            </>
          )}
          {isAdmin && (
            <span className="bg-white/10 text-white px-2.5 py-1 rounded-full text-[9px] tracking-widest uppercase font-semibold">
              Admin
            </span>
          )}
        </div>
      </header>

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className="w-[240px] shrink-0 border-r border-white/[0.04] bg-black flex flex-col justify-between py-10 px-4 z-10">
          <div className="flex flex-col gap-10">

            {/* Brand identity */}
            <div className="px-4">
              {brand?.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="max-w-[140px] max-h-10 object-contain"
                />
              ) : (
                <div className="flex flex-col gap-1">
                  <h1 className="font-sans font-semibold text-[20px] tracking-tight text-white leading-none">
                    {brand?.name || 'LUXAURA'}
                  </h1>
                  <span className="text-[10px] tracking-widest uppercase text-[#86868B]">
                    {brand?.tier || 'Studio'}
                  </span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1.5">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-[#1C1C1E] text-white shadow-sm'
                        : 'text-[#86868B] hover:text-white hover:bg-[#1C1C1E]/50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : 'text-[#86868B]'} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Bottom — quota meter + logout */}
          <div className="flex flex-col gap-6 px-4">

            {/* Quota meter */}
            {brand && (
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] tracking-widest uppercase text-[#86868B]">
                    Monthly Limit
                  </span>
                  <span className="text-[10px] font-medium text-white">
                    {Math.round(pct)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#1C1C1E] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: pct >= 95 ? '#FF453A' : pct >= 80 ? '#FF9F0A' : '#FFFFFF' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}

            {/* User + logout */}
            <div className="border-t border-white/[0.06] pt-5 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#1C1C1E] border border-white/10 flex items-center justify-center">
                    <span className="text-[11px] font-medium text-white">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <span className="text-[12px] font-medium text-[#F5F5F7] truncate">
                  {user?.email?.split('@')[0] || '—'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-[#86868B] hover:text-white transition-colors p-2 hover:bg-[#1C1C1E] rounded-full"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </aside>

        {/* ── Page content ────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto bg-black relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(5px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
