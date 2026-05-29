import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Workflow from './pages/Workflow';
import DeveloperPortal from './pages/DeveloperPortal';
import SovereignDashboard from './components/SovereignDashboard';
import Vault from './pages/Vault';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Pricing from './pages/Pricing';
import GarmentStudio from './pages/GarmentStudio';
import VideoStudio from './pages/VideoStudio';
import AdminDashboard from './pages/AdminDashboard';
import LuxCursor from './components/LuxCursor';
import CinematicIntro from './components/CinematicIntro';
import AuraOnboarding from './components/AuraOnboarding';

/** Auth gate — enabled by default. Set VITE_AUTH_REQUIRED=false to disable (local dev only). */
const AUTH_REQUIRED = import.meta.env.VITE_AUTH_REQUIRED !== 'false';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location          = useLocation();

  if (!AUTH_REQUIRED) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-[9px] font-mono uppercase tracking-[0.5em] text-white/20 animate-pulse">
          Initializing…
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

// ── Onboarding gate — checks Aura profile, shows modal on first login ─────────
function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checked, setChecked]                 = useState(false);

  useEffect(() => {
    if (!user || !AUTH_REQUIRED) { setChecked(true); return; }
    let cancelled = false;
    user.getIdToken().then(idToken =>
      fetch('/api/aura-profile', { headers: { 'Authorization': `Bearer ${idToken}` } })
    ).then(r => r.json()).then(({ profile }) => {
      if (!cancelled) {
        setNeedsOnboarding(!profile || !profile.onboarded);
        setChecked(true);
      }
    }).catch(() => {
      if (!cancelled) setChecked(true); // fail open — don't block on error
    });
    return () => { cancelled = true; };
  }, [user]);

  if (!checked) return null; // brief — resolves in <1s normally

  return (
    <>
      {children}
      <AnimatePresence>
        {needsOnboarding && (
          <AuraOnboarding onComplete={() => setNeedsOnboarding(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function App() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <>
      <LuxCursor />
      {!isLanding && <CinematicIntro />}
      <Routes>
        {/* Public routes */}
        <Route path="/"        element={<Landing />} />
        <Route path="/login"   element={<Login />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* Protected routes — wrapped in OnboardingGate */}
        <Route path="/dashboard" element={<ProtectedRoute><OnboardingGate><Dashboard /></OnboardingGate></ProtectedRoute>} />
        <Route path="/studio"    element={<ProtectedRoute><OnboardingGate><SovereignDashboard /></OnboardingGate></ProtectedRoute>} />
        <Route path="/vault"     element={<ProtectedRoute><Vault /></ProtectedRoute>} />
        <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/workflow/:categoryId" element={<ProtectedRoute><Workflow /></ProtectedRoute>} />
        <Route path="/garment"   element={<ProtectedRoute><GarmentStudio /></ProtectedRoute>} />
        <Route path="/video"     element={<ProtectedRoute><VideoStudio /></ProtectedRoute>} />
        <Route path="/admin"     element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/developer" element={<ProtectedRoute><DeveloperPortal /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;
