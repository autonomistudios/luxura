---
description: How to add new portal pages, wire routes, and follow established patterns for the LuxAura B2B brand portal. Use when creating new portal features.
---

# LuxAura Portal Page Patterns

## Route Structure (App.tsx)
All portal pages live under `/portal` nested inside `BrandPortalLayout`:
```tsx
<Route path="/portal" element={<ProtectedRoute><BrandGate><BrandPortalLayout /></BrandGate></ProtectedRoute>}>
  <Route index                  element={<BrandPortalHome />} />
  <Route path="skus"            element={<SKUCatalog />} />
  <Route path="your-new-page"   element={<YourNewPage />} />  // ← add here
</Route>
```

## Adding a New Portal Page

1. Create `src/pages/portal/YourNewPage.tsx`
2. Add lazy import in `App.tsx`:
   ```tsx
   const YourNewPage = lazy(() => import('./pages/portal/YourNewPage'));
   ```
3. Add route in the portal `<Route>` block
4. Add nav item in `BrandPortalLayout.tsx` NAV_ITEMS array:
   ```tsx
   { to: '/portal/your-new-page', label: 'Your Feature', icon: IconName, end: false }
   ```

## Page Template
```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useSovereignStore } from '../../store/useSovereignStore';

export default function YourNewPage() {
  const { brand } = useAuth();
  const { skus } = useSovereignStore();

  return (
    <div className="p-8 min-h-full relative">
      {/* Atmospheric corner glow */}
      <div className="absolute top-0 right-0 w-80 h-80 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 100% 0%, rgba(184,149,42,0.04) 0%, transparent 60%)' }} />

      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-serif italic text-4xl text-white mb-2">Page Title</h1>
        <p className="text-[9px] font-mono tracking-[0.35em] uppercase text-white/25">
          Subtitle description
        </p>
      </div>

      {/* Content */}
    </div>
  );
}
```

## Auth Context (useAuth)
```tsx
const {
  user,           // Firebase User | null
  brand,          // BrandProfile | null
  loading,        // boolean — true while auth initializing
  isAdmin,        // boolean — autonomistudiosllc@gmail.com
  hasBrand,       // boolean
  canForge,       // () => boolean — quota check
  quotaRemaining, // () => number
  quotaPercent,   // () => number — 0-100
  refreshBrand,   // () => Promise<void>
  logout,         // () => Promise<void>
} = useAuth();
```

## BrandProfile shape
```typescript
interface BrandProfile {
  brandId:     string;
  name:        string;
  slug:        string;
  tier:        'studio' | 'agency' | 'enterprise';
  status:      string;
  logoUrl:     string | null;
  usage:       { currentPeriodImages: number; currentPeriodApiCalls: number; periodStart: string };
  quota:       { imagesPerMonth: number; apiCallsPerMonth: number };
  brandKit:    { defaultSkinTones: string[]; defaultLighting: string; defaultCamera: string; defaultColorGrade: string; lockedParams: string[] };
  billing:     { status: string; currentPeriodEnd: string | null };
  role:        'owner' | 'admin' | 'editor' | 'viewer';
}
```

## Zustand Store (useSovereignStore)
```tsx
const {
  currentBrandId,       // string | null
  currentSkuId,         // string | null — selected SKU for campaign
  skus,                 // SkuDocument[]
  skusLoading,          // boolean
  campaigns,            // CampaignDocument[]
  currentGrid,          // string[] — 6 image slots
  vaultAssets,          // VaultItem[]
  setCurrentSkuId,      // (id) => void
  loadSkus,             // (brandId) => Promise<void>
  deployToVault,        // (item) => Promise<void>
} = useSovereignStore();
```

## API Calls from Frontend (pattern)
```tsx
async function callApi(endpoint: string, body: object) {
  const idToken = await user?.getIdToken();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}
```

## Empty State Pattern
```tsx
<div className="border border-dashed border-white/[0.08] rounded p-16 flex flex-col items-center text-center gap-4"
  style={{ background: 'linear-gradient(145deg, #0D0D10 0%, #050505 100%)' }}>
  <IconComponent size={24} className="text-white/10" />
  <p className="font-serif italic text-xl text-white/20">Nothing here yet</p>
  <p className="text-[9px] font-mono text-white/15 tracking-[0.3em] uppercase">Description</p>
  <button onClick={() => navigate('/portal/relevant-page')}
    className="px-5 py-2.5 rounded border border-white/[0.08] text-[10px] font-mono text-white/30 hover:text-white hover:border-[#B8952A]/40 transition-all uppercase tracking-[0.25em]">
    Call to Action
  </button>
</div>
```

## Loading Skeleton Pattern
```tsx
{loading ? (
  <div className="grid grid-cols-3 gap-5">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="aspect-[4/5] rounded animate-pulse"
        style={{ background: 'linear-gradient(145deg, #111116 0%, #0B0B0E 100%)', border: '1px solid rgba(255,255,255,0.04)' }} />
    ))}
  </div>
) : /* actual content */ }
```

## Page Transitions
All portal content is wrapped in AnimatePresence in BrandPortalLayout:
```tsx
// Each page automatically gets:
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -8 }}
transition={{ duration: 0.25, ease: 'easeOut' }}
```
No need to add motion.div wrappers in individual pages for basic transitions.

## Navigation (useNavigate)
```tsx
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();

// Internal portal nav
navigate('/portal/campaigns/new');
navigate(`/portal/skus/${skuId}`);

// With SKU pre-selected
useSovereignStore.getState().setCurrentSkuId(skuId);
navigate('/portal/campaigns/new');
```
