import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { useSovereignStore } from '../store/useSovereignStore';

const ADMIN_EMAILS = new Set(['louis@beapillar.org', 'autonomistudiosllc@gmail.com']);

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'aura' | 'sovereign' | 'luminary';

export interface UserProfile {
  uid:                string;
  email:              string;
  displayName:        string;
  photoURL:           string;
  tier:               SubscriptionTier;
  imageCredits:       number;
  videoCredits:       number;
  freeRunUsed:        boolean;
  subscriptionId:     string | null;
  subscriptionStatus: string | null;
  createdAt?:         unknown;
}

export const TIER_CONFIG: Record<SubscriptionTier, {
  label:        string;
  price:        number;
  imageCredits: number;
  videoCredits: number;
  color:        string;
}> = {
  free: {
    label:        'Free',
    price:        0,
    imageCredits: 0,    // no free credits — subscription required
    videoCredits: 0,
    color:        'white',
  },
  aura: {
    label:        'Aura',
    price:        85,
    imageCredits: 300,  // 100 standard runs OR 16 VTO wardrobe runs / month — 93%+ margin
    videoCredits: 0,
    color:        '#D4AF37',
  },
  sovereign: {
    label:        'Sovereign',
    price:        165,
    imageCredits: 750,  // 250 standard runs OR 41 VTO wardrobe runs / month — 91%+ margin
    videoCredits: 5,
    color:        '#C0C0C0',
  },
  luminary: {
    label:        'Luminary',
    price:        299,
    imageCredits: 1500, // 500 standard runs OR 83 VTO wardrobe runs / month — 90%+ margin
    videoCredits: 20,
    color:        '#E5D3FF',
  },
};

// Credits consumed per operation
// Standard editorial: 3 credits (~$0.03 API cost)
// VTO wardrobe transfer: 18 credits (~$0.35 API cost — Vertex AI + Remove.bg + visual audit)
// Pricing ratio reflects true pipeline cost differential. Maintains 90%+ margin at all tiers.
export const CREDIT_COST = {
  forgeRun:      3,   // standard editorial — 3 credits
  forgeRunVTO:   18,  // VTO wardrobe transfer — 18 credits
  videoGen:      10,  // 1 video = 10 video credits (future)
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthContextType {
  user:                User | null;
  profile:             UserProfile | null;
  loading:             boolean;
  isAdmin:             boolean;
  signInWithGoogle:    () => Promise<void>;
  logout:              () => Promise<void>;
  refreshProfile:      () => Promise<void>;
  deductImageCredits:  (amount?: number) => Promise<boolean>;
  deductVideoCredits:  (amount?: number) => Promise<boolean>;
  consumeFreeRun:      () => Promise<boolean>;
  canForge:            () => boolean;
  canGenerateVideo:    () => boolean;
  freeRunAvailable:    () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const setStoreUid = useSovereignStore((s) => s.setUid);

  async function fetchProfile(uid: string): Promise<UserProfile | null> {
    const ref  = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      setProfile(data);
      return data;
    }
    return null;
  }

  async function provisionNewUser(u: User): Promise<UserProfile> {
    const newProfile: UserProfile = {
      uid:                u.uid,
      email:              u.email        || '',
      displayName:        u.displayName  || 'Creator',
      photoURL:           u.photoURL     || '',
      tier:               'free',
      imageCredits:       TIER_CONFIG.free.imageCredits,
      videoCredits:       0,
      freeRunUsed:        false,
      subscriptionId:     null,
      subscriptionStatus: null,
    };
    await setDoc(doc(db, 'users', u.uid), {
      ...newProfile,
      createdAt: serverTimestamp(),
    });
    setProfile(newProfile);
    return newProfile;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const existing = await fetchProfile(u.uid);
          if (!existing) await provisionNewUser(u);
        } catch (err) {
          console.error('[Auth] Profile load failed — check Firestore rules:', err);
        }
        setStoreUid(u.uid);
      } else {
        setProfile(null);
        setStoreUid(null);
      }
      setLoading(false); // always runs, even if Firestore fails
    });
    return unsubscribe;
  }, []);

  async function signInWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function logout() {
    await signOut(auth);
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.uid);
  }

  const isAdmin = user?.email ? ADMIN_EMAILS.has(user.email.toLowerCase()) : false;

  /** Deduct image credits. Returns true if successful, false if insufficient. */
  async function deductImageCredits(amount = CREDIT_COST.forgeRun): Promise<boolean> {
    if (isAdmin) return true; // unlimited for admin
    if (!user || !profile) return false;
    if (profile.imageCredits < amount) return false;

    const ref = doc(db, 'users', user.uid);
    await updateDoc(ref, { imageCredits: increment(-amount) });

    // Optimistic local update
    setProfile((prev) => prev ? { ...prev, imageCredits: prev.imageCredits - amount } : prev);
    return true;
  }

  /** Deduct video credits. Returns true if successful, false if insufficient. */
  async function deductVideoCredits(amount = 1): Promise<boolean> {
    if (isAdmin) return true; // unlimited for admin
    if (!user || !profile) return false;
    if (profile.videoCredits < amount) return false;
    const ref = doc(db, 'users', user.uid);
    await updateDoc(ref, { videoCredits: increment(-amount) });
    setProfile((prev) => prev ? { ...prev, videoCredits: prev.videoCredits - amount } : prev);
    return true;
  }

  /** Returns true if the user still has their complimentary free run available. */
  function freeRunAvailable(): boolean {
    if (isAdmin) return false; // admins don't consume free runs
    return !!profile && !profile.freeRunUsed && profile.tier === 'free';
  }

  /**
   * Atomically marks the free run as consumed.
   * Returns true on success, false if already used or not eligible.
   */
  async function consumeFreeRun(): Promise<boolean> {
    if (isAdmin) return true;
    if (!user || !profile) return false;
    if (profile.freeRunUsed || profile.tier !== 'free') return false;
    const ref = doc(db, 'users', user.uid);
    await updateDoc(ref, { freeRunUsed: true });
    setProfile((prev) => prev ? { ...prev, freeRunUsed: true } : prev);
    return true;
  }

  /** Quick synchronous check — can this user start a forge run right now? */
  function canForge(): boolean {
    if (isAdmin) return true;
    if (!profile) return false;
    if (!profile.freeRunUsed && profile.tier === 'free') return true; // free taste-test
    return profile.imageCredits >= CREDIT_COST.forgeRun;
  }

  /** Quick synchronous check — can this user generate a video right now? */
  function canGenerateVideo(): boolean {
    if (isAdmin) return true; // unlimited for admin
    return !!profile && profile.videoCredits >= 1;
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAdmin,
      signInWithGoogle,
      logout,
      refreshProfile,
      deductImageCredits,
      deductVideoCredits,
      consumeFreeRun,
      canForge,
      canGenerateVideo,
      freeRunAvailable,
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
