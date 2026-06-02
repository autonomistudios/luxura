---
description: LuxAura B2B API patterns — how to add endpoints, auth middleware, brand service usage, Firestore schema, and quota management. Use when building new API routes.
---

# LuxAura B2B API Patterns

## Auth Middleware (every /api/v1/* endpoint starts with this)

```javascript
import { resolveBrandContext, requireRole } from '../../../lib/forge/services/brand-auth.js';

export default async function handler(req, res) {
  let ctx;
  try { ctx = await resolveBrandContext(req); }
  catch (err) { return res.status(err.statusCode || 401).json({ error: err.message }); }

  const { brandId, role, brand, uid } = ctx;
  // authMethod: 'firebase' | 'apikey'
  // role: 'owner' | 'admin' | 'editor' | 'viewer' | 'api'
}
```

## Role Enforcement
```javascript
// Require minimum role — throws AuthError if insufficient
try { requireRole(ctx, 'editor'); }  // 'viewer' | 'editor' | 'admin' | 'owner'
catch (err) { return res.status(403).json({ error: err.message }); }

// Role hierarchy: viewer(0) < editor(1) = api(1) < admin(2) < owner(3)
```

## Brand Service Operations
```javascript
import { getBrand, checkBrandQuota, recordBrandUsage } from '../lib/forge/services/brand-service.js';

// Get brand context
const brand = await getBrand(brandId);

// Check and atomically increment quota (returns true/false)
const ok = await checkBrandQuota(brandId, costInImages);
if (!ok) return res.status(402).json({ error: 'QUOTA_EXCEEDED' });

// Admin brands (autonomistudiosllc@gmail.com) bypass quota automatically
```

## SKU Service Operations
```javascript
import { createSku, getSku, listSkus, updateSkuEnrollment, loadSkuForForge } from '../lib/forge/services/sku-service.js';

// Create new SKU (status: 'pending')
const { skuId } = await createSku(brandId, { name, skuCode, category, season, anchorType });

// Update after enrollment
await updateSkuEnrollment(brandId, skuId, { dna, referenceImage, fidelityScore, enrollmentStatus: 'ready' });

// Load for forge (validates ready status, fetches reference image as base64)
const { dna, referenceImageBase64, anchorType, fidelityScore } = await loadSkuForForge(brandId, skuId);
```

## Firestore Schema
```
brands/{brandId}
  ├── brandId, name, slug, tier, status, logoUrl
  ├── apiKeyHash, apiKeyPrefix
  ├── quota: { imagesPerMonth, apiCallsPerMonth }
  ├── usage: { currentPeriodImages, currentPeriodApiCalls, periodStart }
  ├── brandKit: { defaultSkinTones[], defaultLighting, defaultCamera, defaultColorGrade, lockedParams[] }
  ├── billing: { stripeCustomerId, subscriptionId, status, currentPeriodEnd }
  ├── webhookUrl, createdAt, updatedAt
  │
  ├── members/{uid}        — { uid, email, role, joinedAt }
  ├── skus/{skuId}         — { skuId, dna, referenceImage, enrollmentStatus, fidelityScore, ... }
  ├── sets/{setId}         — { setId, calibrationData, status, referenceImages }
  ├── campaigns/{id}       — { campaignId, skuId, status, results, creditsUsed }
  ├── jobs/{jobId}         — { jobId, status, skuId, config, results, error }
  ├── vault/{assetId}      — { assetId, imageUrl, storagePath, fidelityScore }
  └── webhookLogs/{logId}  — { event, url, httpStatus, success, timestamp }
```

## Raw Firestore Operations (gcp-raw.js)
```javascript
import {
  setFirestoreREST,       // POST (create document)
  updateFirestoreREST,    // PATCH (update specific fields)
  deleteFirestoreREST,    // DELETE document
  queryFirestoreREST,     // Simple WHERE query
  queryFirestoreWhereREST,// Composite WHERE query
  parseFirestoreFields,   // Convert Firestore field format → plain object
  toFirestoreFields,      // Convert plain object → Firestore field format
  uploadStorageREST,      // Upload to Firebase Storage, returns HTTPS URL
  getGcpAccessToken,      // Get Bearer token for direct REST calls
} from '../lib/forge/services/gcp-raw.js';
```

## Webhook Delivery
```javascript
import { deliverWebhook, WEBHOOK_EVENTS } from '../lib/forge/services/webhook-service.js';

await deliverWebhook(brandId, {
  type: WEBHOOK_EVENTS.SKU_ENROLLED,  // or CAMPAIGN_COMPLETE, QUOTA_WARNING, etc.
  data: { skuId, fidelityScore, status: 'ready' },
}).catch(() => {});  // Always fire-and-forget — never block response on webhook
```

## Adding a New API Endpoint

1. Create file at `api/v1/{resource}/{action}.js`
2. Add timeout to `vercel.json` under `functions`
3. Pattern:
```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  let ctx;
  try { ctx = await resolveBrandContext(req); }
  catch (err) { return res.status(err.statusCode || 401).json({ error: err.message }); }

  // Validate input
  const { requiredField } = req.body || {};
  if (!requiredField) return res.status(400).json({ error: 'requiredField is required' });

  // Business logic
  // ...

  return res.status(200).json({ result });
}
```

## Brand API Key Format
```
lux_live_{40 hex chars}   — production keys
lux_test_{40 hex chars}   — test keys (same validation)

Header: X-Brand-API-Key: lux_live_xxxx...
Key is SHA-256 hashed for storage — never stored in plaintext
Only the prefix (first 12 chars) is stored for display
```

## Cron Endpoint Pattern
```javascript
const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(req, res) {
  if (CRON_SECRET && req.headers['x-cron-secret'] !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // ... agent logic
}
```
