import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useSovereignStore } from '../store/useSovereignStore';

const ADMIN_EMAILS = new Set(['louis@beapillar.org', 'autonomistudiosllc@gmail.com']);

// ─── Types ────────────────────────────────────────────────────────────────────

export type BrandRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface BrandKit {
  defaultSkinTones:  string[];
  defaultLighting:   string;
  defaultCamera:     string;
  defaultColorGrade: string;
  lockedParams:      string[];
}

export interface BrandUsage {
  currentPeriodImages:   number;
  currentPeriodApiCalls: number;
  periodStart:           string;
}

export interface BrandQuota {
  imagesPerMonth:    number;
  apiCallsPerMonth:  number;
}

export interface BrandBilling {
  status:           string;
  currentPeriodEnd: string | null;
  trialEnd:         string | null;
}

export interface BrandProfile {
  brandId:     string;
  name:        string;
  slug:        string;
  tier:        'studio' | 'agency' | 'enterprise';
  status:      string;
  logoUrl:     string | null;
  usage:       BrandUsage;
  quota:       BrandQuota;
  brandKit:    BrandKit;
  billing:     BrandBilling;
  apiKeyPrefix: string | null;
  webhookUrl:  string | null;
  role:        BrandRole;
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface BrandAuthContextType {
  user:             User | null;
  brand:            BrandProfile | null;
  loading:          boolean;
  isAdmin:          boolean;
  hasBrand:         boolean;
  signInWithGoogle: () => Promise<void>;
  logout:           () => Promise<void>;
  refreshBrand:     () => Promise<void>;
  canForge:         () => boolean;
  quotaRemaining:   () => number;
  quotaPercent:     () => number;
}

const AuthContext = createContext<BrandAuthContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [brand,   setBrand]   = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const setStoreUid     = useSovereignStore((s) => s.setUid);
  const setStoreBrandId = useSovereignStore((s) => s.setBrandId);

  async function fetchBrandContext(u: User): Promise<BrandProfile | null> {
    try {
      const idToken = await u.getIdToken();
      const res = await fetch('/api/v1/brands/auth', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.brand ? { ...data.brand, role: data.role } : null;
    } catch (err) {
      console.error('[Auth] Brand context fetch failed:', err);
      return null;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setStoreUid(u.uid);
        const brandData = await fetchBrandContext(u);
        if (brandData) {
          setBrand(brandData);
          setStoreBrandId(brandData.brandId);
        } else {
          setBrand(null);
          setStoreBrandId(null);
        }
      } else {
        setBrand(null);
        setStoreUid(null);
        setStoreBrandId(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signInWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function logout() {
    await signOut(auth);
  }

  async function refreshBrand() {
    if (!user) return;
    const brandData = await fetchBrandContext(user);
    if (brandData) {
      setBrand(brandData);
      setStoreBrandId(brandData.brandId);
    }
  }

  const isAdmin = user?.email
    ? ADMIN_EMAILS.has(user.email.toLowerCase())
    : false;

  function canForge(): boolean {
    if (isAdmin) return true;
    if (!brand) return false;
    const remaining = (brand.quota.imagesPerMonth - brand.usage.currentPeriodImages);
    return remaining > 0;
  }

  function quotaRemaining(): number {
    if (isAdmin) return Infinity;
    if (!brand) return 0;
    return Math.max(0, brand.quota.imagesPerMonth - brand.usage.currentPeriodImages);
  }

  function quotaPercent(): number {
    if (!brand || brand.quota.imagesPerMonth === 0) return 0;
    return Math.min(100, (brand.usage.currentPeriodImages / brand.quota.imagesPerMonth) * 100);
  }

  return (
    <AuthContext.Provider value={{
      user,
      brand,
      loading,
      isAdmin,
      hasBrand:       !!brand,
      signInWithGoogle,
      logout,
      refreshBrand,
      canForge,
      quotaRemaining,
      quotaPercent,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
