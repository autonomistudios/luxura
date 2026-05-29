import { create } from 'zustand';
import {
  collection, getDocs,
  query, orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VaultItem {
  id:         string;
  image:       string;        // Firebase Storage HTTPS URL
  storagePath: string | null; // Exact GCS path — used by vault-delete for guaranteed cleanup
  name:        string;
  date:       string;
  createdAt:  number;   // Date.now() — used for ordering
  category:   string;
  anchors:    string[];
  strategy:   'keep' | 'change';
  skinTone:   string;
  lighting:   string;
  camera:     string;
  bg:         string;
  prompt:     string;
}

export interface VideoVaultItem {
  id:          string;
  videoUrl:    string;        // Firebase Storage HTTPS URL (permanent)
  storagePath: string;
  title:       string;
  prompt:      string;
  aspectRatio: string;
  duration:    string;
  model:       string;        // 'standard' | 'fast'
  createdAt:   number;
  date:        string;
  sizeBytes:   number;
}

interface SovereignStore {
  vaultAssets:       VaultItem[];
  vaultLoading:      boolean;
  videoVaultAssets:  VideoVaultItem[];
  videoVaultLoading: boolean;
  currentGrid:  string[];
  activeAsset:  number | null;
  currentUid:   string | null;

  deployToVault:       (item: VaultItem)          => Promise<void>;
  removeFromVault:     (id: string)               => Promise<void>;
  removeFromVideoVault:(id: string)               => void;
  loadVideoVault:      (uid: string)              => Promise<void>;
  resetWorkflow:       ()                         => void;
  setCurrentGrid:      (grid: string[])           => void;
  setGridSlot:         (slot: number, image: string) => void;
  setActiveAsset:      (id: number | null)        => void;
  setUid:              (uid: string | null)       => void;
}

// ─── Firestore helpers ────────────────────────────────────────────────────────

async function fetchVaultFromFirestore(uid: string): Promise<VaultItem[]> {
  try {
    const q    = query(collection(db, 'users', uid, 'vault'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as VaultItem);
  } catch {
    return [];
  }
}

async function fetchVideoVaultFromFirestore(uid: string): Promise<VideoVaultItem[]> {
  try {
    const q    = query(collection(db, 'users', uid, 'videoVault'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as VideoVaultItem);
  } catch {
    return [];
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSovereignStore = create<SovereignStore>((set) => ({
  vaultAssets:       [],
  vaultLoading:      false,
  videoVaultAssets:  [],
  videoVaultLoading: false,
  currentGrid:  [],
  activeAsset:  null,
  currentUid:   null,

  // Called on auth change — reload both vaults from Firestore for this user
  setUid: (uid) => {
    set({ currentUid: uid, vaultAssets: [], vaultLoading: !!uid, videoVaultAssets: [], videoVaultLoading: !!uid });
    if (!uid) return;
    fetchVaultFromFirestore(uid).then((items) => {
      set({ vaultAssets: items, vaultLoading: false });
    });
    fetchVideoVaultFromFirestore(uid).then((items) => {
      set({ videoVaultAssets: items, videoVaultLoading: false });
    });
  },

  loadVideoVault: async (uid) => {
    set({ videoVaultLoading: true });
    const items = await fetchVideoVaultFromFirestore(uid);
    set({ videoVaultAssets: items, videoVaultLoading: false });
  },

  deployToVault: async (item) => {
    console.log(`[VAULT] Contacting /api/vault-deploy to securely save item ${item.id} without CORS/rules issues...`);
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not signed in.');
    const idToken = await currentUser.getIdToken();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000); // 30s hard cap
    let response: Response;
    try {
      response = await fetch('/api/vault-deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ item }),
        signal: controller.signal,
      });
    } catch (err: any) {
      throw new Error(err?.name === 'AbortError' ? 'Vault save timed out — check your connection and try again.' : err?.message || 'Network error saving to vault.');
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.error || `Server error: ${response.status}`);
    }

    const { item: finalItem } = await response.json();
    console.log(`[VAULT] Deploy complete! URL: ${finalItem.image.substring(0, 60)}...`);

    // Optimistic local update (newest first)
    set((state) => ({ vaultAssets: [finalItem, ...state.vaultAssets] }));
  },

  removeFromVault: async (id) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not signed in.');
    const idToken = await currentUser.getIdToken();

    // Route through Admin SDK endpoint — guaranteed to delete Storage file + Firestore record
    // regardless of client-side security rules. storagePath written by vault-deploy.js ensures
    // the exact file is found regardless of extension (.png, .jpg, etc.)
    const response = await fetch('/api/vault-delete', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body:    JSON.stringify({ id }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.error || `Delete failed: ${response.status}`);
    }

    set((state) => ({ vaultAssets: state.vaultAssets.filter((v) => v.id !== id) }));
  },

  removeFromVideoVault: async (id) => {
    // Optimistic local removal
    set((state) => ({ videoVaultAssets: state.videoVaultAssets.filter((v) => v.id !== id) }));

    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const idToken = await currentUser.getIdToken();

    // Call backend endpoint to delete from Storage + Firestore
    try {
      const response = await fetch('/api/vault-video-delete', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body:    JSON.stringify({ id }),
      });

      if (!response.ok) {
        console.error('[VIDEO VAULT] Server deletion failed:', response.status);
      }
    } catch (err) {
      console.error('[VIDEO VAULT] Error during deletion:', err);
    }
  },

  setCurrentGrid:  (grid) => set({ currentGrid: grid }),
  setGridSlot:     (slot, image) => set((state) => {
    const next = state.currentGrid.length >= 6
      ? [...state.currentGrid]
      : Array.from({ length: 6 }, (_, i) => state.currentGrid[i] ?? '');
    next[slot] = image;
    return { currentGrid: next };
  }),
  setActiveAsset:  (id)   => set({ activeAsset: id }),
  resetWorkflow:   ()     => set({ currentGrid: [], activeAsset: null }),
}));

