/**
 * lib/forge/constants.js
 * Global constants for the Sovereign Forge pipeline.
 * Imported by services, agents, and the main handler.
 */

// ─── AI Model IDs ─────────────────────────────────────────────────────────────
export const PXL_MODEL  = "gemini-3-pro-image";  // image generation — pinnacle: best identity lock, 4K, studio-grade
export const TEXT_MODEL = "gemini-2.5-pro";       // text reasoning + vision — sharper DNA extraction, better director briefs

// ─── Credit system ────────────────────────────────────────────────────────────
// Standard editorial: 3 credits (~$0.03 API cost, 90%+ margin at all tiers)
// VTO wardrobe transfer: 18 credits (~$0.35 API cost — Vertex AI + Remove.bg + visual audit)
export const FORGE_CREDIT_COST     = 3;  // standard editorial
export const FORGE_CREDIT_COST_VTO = 18; // VTO wardrobe transfer
export const ADMIN_EMAIL  = process.env.ADMIN_EMAIL  || 'louis@beapillar.org';
export const ADMIN_EMAILS = new Set([
  ADMIN_EMAIL,
  'autonomistudiosllc@gmail.com',
]);

// ─── Intelligence layer toggle ────────────────────────────────────────────────
// true  → Session Intelligence Agent (agent00-intent.js) runs before Agent 02.
//         Enriches shot type, pose, and framing with anchor-aware precision.
// false → Original direct injection model (raw config map lookups). Instant rollback.
export const USE_INTENT_AGENT = true;

// ─── Rate limiting (in-memory, per warm instance) ─────────────────────────────
export const RATE_LIMIT_MAX       = 5;          // max forge runs per window
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

// ─── Vertex AI Imagen 3 ───────────────────────────────────────────────────────
export const VERTEX_PROJECT  = process.env.GOOGLE_CLOUD_PROJECT;
export const VERTEX_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
export const VERTEX_MODEL    = 'imagen-3.0-capability-001';

// ─── Fashn.ai ─────────────────────────────────────────────────────────────────
export const FASHN_API_KEY = process.env.FASHN_API_KEY;

// ─── Anchor classification sets ───────────────────────────────────────────────
// Used by Agent 00 (mission classifier) and temperature calculator.
export const BEAUTY_PRECISION_ANCHORS = ['HAIR', 'BARBER', 'MAKEUP', 'NAILS'];
export const DETAIL_ACCESSORY_ANCHORS = ['EARRINGS', 'NECKLACE', 'RING', 'BRACELET', 'WATCH', 'BELT'];
export const CLOTHING_ANCHOR_TYPES    = ['SHIRT', 'PANTS', 'SHORTS', 'SWIMWEAR', 'HAT', 'FULL_OUTFIT'];

// Sub-anchors subsumed when FULL_OUTFIT is present (deduplication)
export const OUTFIT_SUBSUMES = ['SHIRT', 'PANTS', 'SHORTS', 'SWIMWEAR', 'SHOES', 'BELT', 'HAT'];

// ─── B2B Brand Tiers ──────────────────────────────────────────────────────────
export const BRAND_TIERS = {
  studio:     { imagesPerMonth: 500,   apiCallsPerMonth: 2000,  monthlyPrice: 499  },
  agency:     { imagesPerMonth: 2000,  apiCallsPerMonth: 10000, monthlyPrice: 1499 },
  enterprise: { imagesPerMonth: 10000, apiCallsPerMonth: 50000, monthlyPrice: 4999 },
};

// B2B quota costs (images consumed per operation)
export const BRAND_QUOTA_COST_STANDARD = 1;  // per forge run (covers 6 images)
export const BRAND_QUOTA_COST_VTO      = 6;  // per VTO forge run (Vertex AI + audit)
