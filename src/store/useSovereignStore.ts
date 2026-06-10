import { create } from 'zustand';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VaultItem {
  id:          string;
  image:       string;
  storagePath: string | null;
  name:        string;
  date:        string;
  createdAt:   number;
  category:    string;
  anchors:     string[];
  strategy:    'keep' | 'change';
  skinTone:    string;
  lighting:    string;
  camera:      string;
  bg:          string;
  prompt:      string;
  dna?:        boolean;
}

export interface VideoVaultItem {
  id:          string;
  videoUrl:    string;
  storagePath: string;
  title:       string;
  prompt:      string;
  aspectRatio: string;
  duration:    string;
  model:       string;
  createdAt:   number;
  date:        string;
  sizeBytes:   number;
}

export interface SkuDocument {
  skuId:            string;
  brandId:          string;
  name:             string;
  skuCode:          string;
  category:         string;
  season:           string;
  anchorType:       string;
  assetType?:       'garment' | 'model';   // 'model' = a reusable injectable identity
  sourceImages:     string[];
  dna:              Record<string, string> | null;
  referenceImage:   string | null;
  enrollmentStatus: 'pending' | 'processing' | 'ready' | 'failed' | 'archived';
  fidelityScore:    number | null;
  createdAt:        string;
  updatedAt:        string;
}

export interface CampaignDocument {
  campaignId:      string;
  name:            string;
  status:          string;
  skuId:           string;
  creditsUsed:     number;
  imagesDelivered: number;
  createdAt:       string;
  completedAt:     string | null;
}

// ─── Store interface ──────────────────────────────────────────────────────────

interface SovereignStore {
  // ── Auth ──────────────────────────────────────────────────────────────────
  currentUid:     string | null;
  currentBrandId: string | null;
  setUid:         (uid: string | null) => void;
  setBrandId:     (brandId: string | null) => void;

  // ── Generation grid ───────────────────────────────────────────────────────
  currentGrid:    string[];
  activeAsset:    number | null;
  setCurrentGrid: (grid: string[]) => void;
  setGridSlot:    (slot: number, image: string) => void;
  setActiveAsset: (id: number | null) => void;
  resetWorkflow:  () => void;

  // ── Active session ─────────────────────────────────────────────────────────
  currentSkuId:       string | null;
  activeCampaignId:   string | null;
  setCurrentSkuId:    (id: string | null) => void;
  setActiveCampaignId:(id: string | null) => void;

  // ── SKU catalog ────────────────────────────────────────────────────────────
  skus:            SkuDocument[];
  skusLoading:     boolean;
  loadSkus:        (brandId: string) => Promise<void>;
  addSku:          (sku: SkuDocument) => void;
  enrollModel:     (name: string, image: string) => Promise<SkuDocument>;
  updateSkuStatus: (skuId: string, status: SkuDocument['enrollmentStatus'], updates?: Partial<SkuDocument>) => void;

  // ── Campaign history ───────────────────────────────────────────────────────
  campaigns:        CampaignDocument[];
  campaignsLoading: boolean;
  loadCampaigns:    (brandId: string) => Promise<void>;

  // ── Brand asset vault (brand-scoped) ──────────────────────────────────────
  vaultAssets:      VaultItem[];
  vaultLoading:     boolean;
  deployToVault:    (item: VaultItem) => Promise<void>;
  removeFromVault:  (id: string) => Promise<void>;

  // ── Video vault ────────────────────────────────────────────────────────────
  videoVaultAssets:   VideoVaultItem[];
  videoVaultLoading:  boolean;
  loadVideoVault:     (uid: string) => Promise<void>;
  removeFromVideoVault:(id: string) => void;
}

// ─── Firestore helpers ────────────────────────────────────────────────────────

async function fetchVaultFromFirestore(brandId: string): Promise<VaultItem[]> {
  try {
    const q    = query(collection(db, 'brands', brandId, 'vault'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as VaultItem);
  } catch { return []; }
}

async function fetchSkusFromFirestore(brandId: string): Promise<SkuDocument[]> {
  try {
    const q    = query(collection(db, 'brands', brandId, 'skus'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as SkuDocument);
  } catch { return []; }
}

async function fetchCampaignsFromFirestore(brandId: string): Promise<CampaignDocument[]> {
  try {
    const q    = query(collection(db, 'brands', brandId, 'campaigns'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as CampaignDocument);
  } catch { return []; }
}

async function fetchVideoVaultFromFirestore(uid: string): Promise<VideoVaultItem[]> {
  try {
    const q    = query(collection(db, 'users', uid, 'videoVault'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as VideoVaultItem);
  } catch { return []; }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSovereignStore = create<SovereignStore>((set, get) => ({
  // Auth
  currentUid:     null,
  currentBrandId: null,

  setUid: (uid) => {
    set({ currentUid: uid });
  },

  setBrandId: (brandId) => {
    set({
      currentBrandId:  brandId,
      vaultAssets:     [],
      skus:            [],
      campaigns:       [],
      vaultLoading:    !!brandId,
      skusLoading:     !!brandId,
      campaignsLoading:!!brandId,
    });
    if (!brandId) return;

    fetchVaultFromFirestore(brandId).then(items =>
      set({ vaultAssets: items, vaultLoading: false })
    );
    fetchSkusFromFirestore(brandId).then(items =>
      set({ skus: items, skusLoading: false })
    );
    fetchCampaignsFromFirestore(brandId).then(items =>
      set({ campaigns: items, campaignsLoading: false })
    );
  },

  // Generation grid
  currentGrid:  [],
  activeAsset:  null,

  setCurrentGrid: (grid) => set({ currentGrid: grid }),
  setGridSlot: (slot, image) => set((state) => {
    const next = state.currentGrid.length >= 6
      ? [...state.currentGrid]
      : Array.from({ length: 6 }, (_, i) => state.currentGrid[i] ?? '');
    next[slot] = image;
    return { currentGrid: next };
  }),
  setActiveAsset: (id)  => set({ activeAsset: id }),
  resetWorkflow:  ()    => set({ currentGrid: [], activeAsset: null }),

  // Active session
  currentSkuId:     null,
  activeCampaignId: null,
  setCurrentSkuId:     (id) => set({ currentSkuId: id }),
  setActiveCampaignId: (id) => set({ activeCampaignId: id }),

  // SKU catalog
  skus:        [],
  skusLoading: false,

  loadSkus: async (brandId) => {
    set({ skusLoading: true });
    const items = await fetchSkusFromFirestore(brandId);
    set({ skus: items, skusLoading: false });
  },

  addSku: (sku) => set(state => ({ skus: [sku, ...state.skus] })),

  // Enroll a reusable model identity (stored as a model-tagged SKU). Returns the catalogue
  // record (without the heavy base64) and prepends it to the in-memory skus list.
  enrollModel: async (name, image) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not signed in.');
    const idToken = await currentUser.getIdToken();
    const res = await fetch('/api/v1/models/enroll', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body:    JSON.stringify({ name, image }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => null);
      throw new Error(e?.error || `Model enrollment failed: ${res.status}`);
    }
    const { model } = await res.json();
    set(state => ({ skus: [model as SkuDocument, ...state.skus] }));
    return model as SkuDocument;
  },

  updateSkuStatus: (skuId, status, updates = {}) =>
    set(state => ({
      skus: state.skus.map(s =>
        s.skuId === skuId ? { ...s, enrollmentStatus: status, ...updates } : s
      ),
    })),

  // Campaign history
  campaigns:        [],
  campaignsLoading: false,

  loadCampaigns: async (brandId) => {
    set({ campaignsLoading: true });
    const items = await fetchCampaignsFromFirestore(brandId);
    set({ campaigns: items, campaignsLoading: false });
  },

  // Brand asset vault
  vaultAssets:  [],
  vaultLoading: false,

  deployToVault: async (item) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not signed in.');
    const idToken = await currentUser.getIdToken();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    let response: Response;
    try {
      response = await fetch('/api/vault-deploy', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body:    JSON.stringify({ item }),
        signal:  controller.signal,
      });
    } catch (err: any) {
      throw new Error(err?.name === 'AbortError' ? 'Vault save timed out.' : err?.message || 'Network error.');
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const e = await response.json().catch(() => null);
      throw new Error(e?.error || `Server error: ${response.status}`);
    }

    const { item: finalItem } = await response.json();
    set(state => ({ vaultAssets: [finalItem, ...state.vaultAssets] }));
  },

  removeFromVault: async (id) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Not signed in.');
    const idToken = await currentUser.getIdToken();
    const res = await fetch('/api/vault-delete', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body:    JSON.stringify({ id }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => null);
      throw new Error(e?.error || `Delete failed: ${res.status}`);
    }
    set(state => ({ vaultAssets: state.vaultAssets.filter(v => v.id !== id) }));
  },

  // Video vault
  videoVaultAssets:  [],
  videoVaultLoading: false,

  loadVideoVault: async (uid) => {
    set({ videoVaultLoading: true });
    const items = await fetchVideoVaultFromFirestore(uid);
    set({ videoVaultAssets: items, videoVaultLoading: false });
  },

  removeFromVideoVault: async (id) => {
    set(state => ({ videoVaultAssets: state.videoVaultAssets.filter(v => v.id !== id) }));
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const idToken = await currentUser.getIdToken();
    fetch('/api/vault-video-delete', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body:    JSON.stringify({ id }),
    }).catch(() => {});
  },
}));
