/**
 * lib/forge/permissions.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Canonical capability model for brand workspaces (the security source of truth).
 *
 * Capabilities are a thin, declarative layer over the existing role hierarchy
 * (viewer < editor < admin < owner; api == editor). We do NOT fork access control
 * on job titles — "Creative Director / Photographer / Social" are presentation
 * labels that map onto these tiers (see ROLE_LABELS). Capabilities are stable;
 * titles are cosmetic.
 *
 * The frontend mirror lives in src/lib/permissions.ts; an audit test asserts the
 * two stay byte-for-byte in sync so UI gating can never diverge from enforcement.
 */

// Role hierarchy — must match requireRole() in brand-auth.js.
export const ROLE_HIERARCHY = { viewer: 0, editor: 1, admin: 2, owner: 3, api: 1 };

// Minimum role required for each capability.
export const CAPABILITY_MIN_ROLE = {
  viewAssets:          'viewer',  // browse vault, campaigns
  exportAssets:        'viewer',  // download / export finished assets
  forge:               'editor',  // run generation + per-slot refine (spends credits)
  manageSkus:          'editor',  // enroll / edit SKUs
  manageSets:          'editor',  // virtual backlot sets
  deleteSku:           'admin',   // destructive SKU removal
  manageTeam:          'admin',   // invite / change / remove members
  manageBrandSettings: 'admin',   // brand kit, logo, defaults
  manageApiKeys:       'owner',   // issue / revoke programmatic keys
  manageBilling:       'owner',   // subscription, plan, billing
};

// Friendly labels for the team UI — purely cosmetic over the role tiers.
export const ROLE_LABELS = {
  owner:  'Owner',
  admin:  'Creative Director',
  editor: 'Photographer',
  viewer: 'Social Media',
  api:    'API Client',
};

/** Does this role satisfy the given capability? */
export function can(role, capability) {
  const min = CAPABILITY_MIN_ROLE[capability];
  if (min === undefined) return false;           // unknown capability → deny
  const level = ROLE_HIERARCHY[role] ?? -1;
  return level >= ROLE_HIERARCHY[min];
}

/**
 * Throw a 403-style AuthError if the resolved brand context lacks a capability.
 * `ctx` is the object returned by resolveBrandContext ({ role, ... }).
 */
export function requireCapability(ctx, capability) {
  if (!can(ctx?.role, capability)) {
    const err = new Error(
      `FORBIDDEN: Role '${ctx?.role ?? 'unknown'}' lacks capability '${capability}'.`,
    );
    err.code = 'FORBIDDEN';
    err.statusCode = 403;
    throw err;
  }
}
