/**
 * src/lib/permissions.ts
 * Frontend mirror of lib/forge/permissions.js (the security source of truth).
 *
 * This drives UI gating only — it is convenience, NOT enforcement. The server
 * re-checks every capability. An audit test asserts this map stays in sync with
 * the backend so the UI can never show an action the server would reject.
 */
import type { BrandRole } from '../contexts/AuthContext';

export type Capability =
  | 'viewAssets'
  | 'exportAssets'
  | 'forge'
  | 'manageSkus'
  | 'manageSets'
  | 'deleteSku'
  | 'manageTeam'
  | 'manageBrandSettings'
  | 'manageApiKeys'
  | 'manageBilling';

type AnyRole = BrandRole | 'api';

// Must match ROLE_HIERARCHY in lib/forge/permissions.js.
export const ROLE_HIERARCHY: Record<AnyRole, number> = {
  viewer: 0, editor: 1, admin: 2, owner: 3, api: 1,
};

// Must match CAPABILITY_MIN_ROLE in lib/forge/permissions.js.
export const CAPABILITY_MIN_ROLE: Record<Capability, AnyRole> = {
  viewAssets:          'viewer',
  exportAssets:        'viewer',
  forge:               'editor',
  manageSkus:          'editor',
  manageSets:          'editor',
  deleteSku:           'admin',
  manageTeam:          'admin',
  manageBrandSettings: 'admin',
  manageApiKeys:       'owner',
  manageBilling:       'owner',
};

// Friendly labels for the team UI — cosmetic over the role tiers.
export const ROLE_LABELS: Record<AnyRole, string> = {
  owner:  'Owner',
  admin:  'Creative Director',
  editor: 'Photographer',
  viewer: 'Social Media',
  api:    'API Client',
};

export function can(role: AnyRole | null | undefined, capability: Capability): boolean {
  if (!role) return false;
  const min = CAPABILITY_MIN_ROLE[capability];
  const level = ROLE_HIERARCHY[role] ?? -1;
  return level >= ROLE_HIERARCHY[min];
}
