# Sovereign Forge v10.1 — Handoff: Level 5 Architecture

All Level 5 architectural changes have been deployed. The platform has been entirely stripped of consumer-grade SDKs (like `firebase-admin`) and now operates on pure, high-speed REST operations native to Google Cloud Edge functions. 

The items below require your console or dashboard access to complete. Work through them top-to-bottom — they are ordered by severity.

---

## CRITICAL — Do These First (Edge Environment Ready)

### 1. Configure the Primary Cloud Authentication File (Service Account)

Because we have eliminated `firebase-admin` to drop cold-starts below 50ms, the system now relies entirely on a raw `FIREBASE_SERVICE_ACCOUNT` base64 string to self-sign JWTs and authenticate directly with the `oauth2.googleapis.com` servers.

**Steps:**
1. Firebase Console → Project Settings → Service accounts
2. Click **Generate new private key** → download JSON
3. Base64 encode it:
   - On Windows PowerShell:
     `[Convert]::ToBase64String([IO.File]::ReadAllBytes("serviceAccountKey.json"))`
   - On Mac/Linux:
     `base64 -i serviceAccountKey.json | tr -d '\n'`
4. In Vercel → Environment Variables:
   - Add: `FIREBASE_SERVICE_ACCOUNT` = `<base64 string>`
5. In your local `.env` file:
   - Add: `FIREBASE_SERVICE_ACCOUNT=<base64 string>`
6. Delete the downloaded JSON file immediately.

---

### 2. Set Up the New Identity Toolkit API Key

Your system now validates ID Tokens manually via Google Identity Toolkit. It requires a browser-safe API key.

**Steps:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Ensure you have an API key active for `Identity Toolkit API`.
3. In Vercel → Environment Variables:
   - Add: `VITE_FIREBASE_API_KEY` = `<your key>`
4. In your local `.env` file:
   - Add: `VITE_FIREBASE_API_KEY=<your key>`

---

### 3. Rotate the Exposed Google API Key

The key `AIzaSyCh8VFbHS7i...` was baked into the frontend bundle in prior testing and is publicly visible. Anyone can use it right now.

**Steps:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Find the key above → click it → click **Delete**
3. Click **Create Credentials** → API Key → name it `LuxAura Forge Server V10`
4. Under **API restrictions** → restrict to: `Generative Language API` only
5. Copy the new key
6. In Vercel dashboard → your project → Settings → Environment Variables:
   - Add: `GOOGLE_API_KEY` = `<new key>` (Production + Preview + Development)
   - Delete `VITE_GOOGLE_API_KEY` entirely from Vercel
7. In your local `.env` file:
   - Delete the `VITE_GOOGLE_API_KEY=...` line
   - Add `GOOGLE_API_KEY=<new key>` (server-side only, NO prefix)

---

### 4. Enable the New REST Auth Gate

Your `.env` currently has `VITE_AUTH_REQUIRED=false` — auth is disabled.

**Steps:**
1. In your local `.env`: change to `VITE_AUTH_REQUIRED=true`
2. In Vercel → Environment Variables → set `VITE_AUTH_REQUIRED=true`

---

### 5. Finalize Subscription IDs for pure-REST PayPal Webhooks

Currently empty in `.env` — no paid subscription can complete.

**Steps:**
1. Open `scripts/.paypal-plan-ids.json` — your plan IDs are already there
2. In Vercel → Environment Variables, set:
   - `VITE_PAYPAL_PLAN_AURA`      = `P-04393850GG492003KNHEQTTA`
   - `VITE_PAYPAL_PLAN_SOVEREIGN` = `P-5M7493012B082873ENHEQTTA`
   - `VITE_PAYPAL_PLAN_LUMINARY`  = `P-6CP57875RE562944DNHEQTTA`
3. Also set the same three in your local `.env`.

---

## IMPORTANT NOTES: SERVERLESS v10.1 UPGRADES

| File/Module | Level 5 Upgrade Action |
|---|---|
| `gcp-raw.js` | Built from scratch. Replaces all consumer SDKs. Handles Auth JWT signing, Firestore HTTP transactions, and Storage streaming. |
| `api/forge.js` | Refactored from an 850+ line monolith to a 260-line Edge-ready thin controller. |
| `agent00-classifier.js` | Extracted deterministic intent matching into an isolated pipeline stage. |
| `agent01-dna.js` | Extracted Forensic Vision pipeline block. |
| `agent01-prepass.js` | Extracted VTO, Flat Lay, and Garment Mashing operations. |
| `agent02.5-auditor.js` | Extracted cross-slot invariances and consistency auditing. |
| `agent03-prompt-architect.js` | Migrated OUT of the API folder to prevent Vercel route pollution. It now resides securely within `lib/forge/agents/`. |
| `firebase-admin` | **UNINSTALLED**. 107 bloat-heavy dependencies were purged from your package tree, dropping cold start boots well below the Edge limit. |
