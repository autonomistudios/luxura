import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import LuxCursor from './components/LuxCursor';
import CinematicIntro from './components/CinematicIntro';

// ── Lazy-loaded portal pages ───────────────────────────────────────────────────
const BrandOnboarding      = lazy(() => import('./pages/BrandOnboarding'));
const BrandPortalLayout    = lazy(() => import('./components/BrandPortalLayout'));
const BrandPortalHome      = lazy(() => import('./pages/portal/BrandPortalHome'));
const SKUCatalog           = lazy(() => import('./pages/portal/SKUCatalog'));
const SKUEnrollmentFlow    = lazy(() => import('./pages/portal/SKUEnrollmentFlow'));
const SKUBatchEnroll       = lazy(() => import('./pages/portal/SKUBatchEnroll'));
const SKUDetail            = lazy(() => import('./pages/portal/SKUDetail'));
const CampaignHistory      = lazy(() => import('./pages/portal/CampaignHistory'));
const AssetVault           = lazy(() => import('./pages/portal/AssetVault'));
const CampaignBuilder      = lazy(() => import('./pages/portal/CampaignBuilder'));
const SetInjectionManager  = lazy(() => import('./pages/portal/SetInjectionManager'));
const UsageDashboard       = lazy(() => import('./pages/portal/UsageDashboard'));
const BrandSettings        = lazy(() => import('./pages/portal/BrandSettings'));
const TeamManager          = lazy(() => import('./pages/portal/TeamManager'));
const APIAccessPortal      = lazy(() => import('./pages/portal/APIAccessPortal'));

const AUTH_REQUIRED = import.meta.env.VITE_AUTH_REQUIRED !== 'false';

// ── Loading screen ─────────────────────────────────────────────────────────────
function PortalSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-[9px] font-mono uppercase tracking-[0.5em] text-white/20 animate-pulse">
          Loading…
        </div>
      </div>
    }>
      {children}
    </Suspense>
  );
}

// ── Auth gate ─────────────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

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

// ── Brand gate — redirects to /onboard if no brand workspace ──────────────────
function BrandGate({ children }: { children: React.ReactNode }) {
  const { hasBrand, loading } = useAuth();
  const location = useLocation();

  // Dev mode: auth not required → skip brand check entirely, always render portal
  if (!AUTH_REQUIRED) return <>{children}</>;

  // Grace period: onboarding just completed, give AuthContext time to re-hydrate
  // before enforcing the brand check (prevents redirect loop on first navigation)
  const [grace, setGrace] = React.useState(() =>
    !!sessionStorage.getItem('lux_onboarding_complete')
  );

  React.useEffect(() => {
    if (!grace) return;
    sessionStorage.removeItem('lux_onboarding_complete');
    // Short timeout lets onAuthStateChanged re-run and brand context hydrate
    const t = setTimeout(() => setGrace(false), 1500);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  if (loading || grace) return null;
  if (!hasBrand) return <Navigate to="/onboard" state={{ from: location }} replace />;
  return <>{children}</>;
}

function App() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <>
      <LuxCursor />
      {!isLanding && <CinematicIntro />}
      <PortalSuspense>
        <Routes>
          {/* ── Public ──────────────────────────────────────────────────── */}
          <Route path="/"      element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* ── Brand onboarding (auth required, no brand yet) ──────────── */}
          <Route path="/onboard" element={
            <ProtectedRoute><BrandOnboarding /></ProtectedRoute>
          } />

          {/* ── Brand portal (auth + brand required) ────────────────────── */}
          <Route path="/portal" element={
            <ProtectedRoute>
              <BrandGate>
                <BrandPortalLayout />
              </BrandGate>
            </ProtectedRoute>
          }>
            <Route index                  element={<BrandPortalHome />} />
            <Route path="skus"            element={<SKUCatalog />} />
            <Route path="skus/enroll"     element={<SKUEnrollmentFlow />} />
            <Route path="skus/batch"      element={<SKUBatchEnroll />} />
            <Route path="skus/:skuId"     element={<SKUDetail />} />
            <Route path="campaigns"       element={<CampaignHistory />} />
            <Route path="campaigns/new"   element={<CampaignBuilder />} />
            <Route path="vault"           element={<AssetVault />} />
            <Route path="sets"            element={<SetInjectionManager />} />
            <Route path="analytics"       element={<UsageDashboard />} />
            <Route path="settings"        element={<BrandSettings />} />
            <Route path="team"            element={<TeamManager />} />
            <Route path="api"             element={<APIAccessPortal />} />
          </Route>

          {/* ── Admin (auth required, email-gated in component) ─────────── */}
          <Route path="/admin" element={
            <ProtectedRoute><AdminDashboard /></ProtectedRoute>
          } />

          {/* ── Legacy consumer routes → portal redirect ────────────────── */}
          <Route path="/dashboard" element={<Navigate to="/portal" replace />} />
          <Route path="/studio"    element={<Navigate to="/portal/campaigns/new" replace />} />
          <Route path="/vault"     element={<Navigate to="/portal" replace />} />
          <Route path="/profile"   element={<Navigate to="/portal/settings" replace />} />
          <Route path="/pricing"   element={<Navigate to="/portal" replace />} />

          {/* ── Catch-all ───────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/portal" replace />} />
        </Routes>
      </PortalSuspense>
    </>
  );
}

export default App;
