---
description: LuxAura deployment checklist, environment variables, Vercel configuration, and go-live procedure. Use when deploying or debugging production issues.
---

# LuxAura Deployment

## Vercel Configuration
- **Production branch:** `main` (NOT master — change in Settings → Git if wrong)
- **Framework:** Vite
- **Build command:** `npm install --include=dev && npm run build`
- **Install command:** `npm install --include=dev`

## Required Environment Variables (Vercel Dashboard)

### Critical — app won't work without these:
```
GOOGLE_API_KEY              = AIzaSy...  (Gemini API — must start with AIzaSy, NOT AQ.)
FIREBASE_SERVICE_ACCOUNT    = base64...  (base64-encoded service account JSON)
FIREBASE_API_KEY            = AIzaSy...  (same as VITE_FIREBASE_API_KEY)
VITE_AUTH_REQUIRED          = true       (production — false only for local dev)
VITE_FIREBASE_API_KEY       = AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN   = autonomi-studios-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID    = autonomi-studios-prod
VITE_FIREBASE_STORAGE_BUCKET= autonomi-studios-prod.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 564210927036
VITE_FIREBASE_APP_ID        = 1:564210927036:web:...
```

### Security — required for B2B features:
```
CRON_SECRET      = lux_cron_...  (protects /api/agents/* cron endpoints)
WEBHOOK_SECRET   = lux_webhook_... (signs outbound webhook payloads)
```

### Optional services:
```
FASHN_API_KEY    = fa-...  (VTO fallback — Fashn.ai)
GOOGLE_CLOUD_PROJECT   = autonomi-studios-prod
GOOGLE_CLOUD_LOCATION  = us-central1
STRIPE_WEBHOOK_SECRET  = whsec_...  (Stripe billing)
STRIPE_PRICE_STUDIO    = price_...
STRIPE_PRICE_AGENCY    = price_...
STRIPE_PRICE_ENTERPRISE= price_...
```

## Common API Key Mistakes
```
WRONG: AQ.Ab8RN6...  ← OAuth access token, expires in 1 hour
RIGHT: AIzaSy...     ← API key, does not expire

If you see 401 on forge generations → GOOGLE_API_KEY is the AQ. format
Fix: Go to aistudio.google.com → Get API Key → Create new API key
```

## Vercel Cron Jobs (configured in vercel.json)
```json
"crons": [
  { "path": "/api/agents/campaign-agent",             "schedule": "*/2 * * * *" },
  { "path": "/api/agents/usage-reconciliation-agent", "schedule": "0 0 1 * *"   },
  { "path": "/api/agents/consistency-guardian",       "schedule": "0 2 * * 1"   }
]
```
All cron endpoints check `x-cron-secret` header against `CRON_SECRET` env var.

## Firestore Rules Deployment
After changing `firestore.rules`, deploy via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```
Or upload directly in Firebase Console → Firestore → Rules tab.

## Go-Live Checklist
```
□ GOOGLE_API_KEY set to AIzaSy... format in Vercel
□ VITE_AUTH_REQUIRED=true in Vercel
□ FIREBASE_SERVICE_ACCOUNT set (base64 service account JSON)
□ CRON_SECRET set in Vercel
□ WEBHOOK_SECRET set in Vercel
□ Vercel production branch = main (Settings → Git → Production Branch)
□ Firestore rules deployed (firebase deploy --only firestore:rules)
□ Admin account completes brand onboarding on first login
□ Test: enroll one SKU → verify DNA extraction completes
□ Test: run one forge campaign → verify 6 images stream via SSE
□ Test: check /portal → dashboard loads with quota meter
```

## First Login After Deploy
1. Visit production URL
2. Sign in with Google (autonomistudiosllc@gmail.com)
3. You'll land on `/onboard` — complete the 4-step wizard
4. Navigate to `/portal` — dashboard should show 0/quota
5. Go to SKU Vault → enroll a garment flat lay
6. Go to Campaign Builder → select enrolled SKU → fire forge
7. Verify 6 images stream back

## Debugging Production Issues

### Forge 401 errors
→ GOOGLE_API_KEY is expired/wrong format

### Forge 402 errors  
→ Admin bypass not working — check ADMIN_EMAILS in constants.js includes your email

### Portal shows old app
→ Vercel is on wrong branch — change Settings → Git → Production Branch to `main`

### Brand onboarding loops back
→ API call to /api/brands/onboard failing
→ Check: FIREBASE_SERVICE_ACCOUNT is set, FIREBASE_API_KEY matches VITE_FIREBASE_API_KEY

### SSE stream drops after ~30s
→ Normal on Vercel Hobby — functions timeout at 30s
→ Upgrade to Vercel Pro for 300s timeout (already set in vercel.json, just need Pro plan)

## Branch Strategy
```
main      → production (luxaurastudio.vercel.app)
legacy    → preserved consumer app (commit 44d42f6)
feature/* → new features, deploy to preview URLs
```

## Local Development
```bash
# Dev server with auth disabled
VITE_AUTH_REQUIRED=false npm run dev

# Full production build check
npm run build

# Audit
node audit/index.js          # static analysis
node audit/index.js --live   # includes live API tests
```
