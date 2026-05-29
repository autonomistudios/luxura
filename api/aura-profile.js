/**
 * api/aura-profile.js  —  Aura Profile REST API
 *
 * GET  /api/aura-profile         — fetch the caller's Aura profile
 * POST /api/aura-profile         — mutate the profile
 *   body.action = 'setFields'    — { fields: Record<string,any> }
 *   body.action = 'addDirective' — { directive: string }
 *   body.action = 'removeDirective' — { directive: string }
 *   body.action = 'appendMemory' — { fact, source?, weight? }
 *   body.action = 'completeOnboarding' — { fields: Record<string,any> }
 */

import { verifyIdTokenREST, getGcpAccessToken, setFirestoreREST, parseFirestoreFields } from '../lib/forge/services/gcp-raw.js';
import {
  setAuraProfileField,
  appendAuraMemory,
  addAuraDirective,
} from '../lib/forge/services/aura-profile.js';

const PROFILE_COLLECTION = 'users';
const PROFILE_DOC        = 'aura-profile/profile';  // 4-segment doc path: users/{uid}/aura-profile/profile

async function verifyToken(req) {
  const authHeader = req.headers['authorization'] || '';
  const idToken    = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!idToken) return null;
  try {
    const uid = await verifyIdTokenREST(idToken);
    const payloadBase64 = idToken.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
    return { uid, displayName: decoded.name || decoded.email?.split('@')[0] || null };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && (origin.endsWith('.vercel.app') || origin.startsWith('http://localhost:') || origin.endsWith('firebaseapp.com') || origin.endsWith('web.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const caller = await verifyToken(req);
  if (!caller) return res.status(401).json({ error: 'UNAUTHORIZED' });

  // ── GET — return the profile ──────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { token, projectId } = await getGcpAccessToken();
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${PROFILE_COLLECTION}/${caller.uid}/${PROFILE_DOC}`;
      const docRes = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!docRes.ok) {
        if (docRes.status === 404) return res.status(200).json({ profile: null });
        throw new Error(`Firestore REST GET failed: ${docRes.status}`);
      }
      const doc = await docRes.json();
      const data = parseFirestoreFields(doc.fields || {});
      return res.status(200).json({ profile: data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST — mutate ─────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { action, fields, directive, fact, source, weight } = req.body || {};

    try {
      switch (action) {

        case 'setFields':
        case 'completeOnboarding': {
          if (!fields || typeof fields !== 'object') return res.status(400).json({ error: 'Missing fields' });
          const payload = { ...fields };
          if (action === 'completeOnboarding') payload.onboarded = true;
          await setAuraProfileField(null, caller.uid, payload);
          return res.status(200).json({ ok: true });
        }

        case 'addDirective': {
          if (!directive || typeof directive !== 'string') return res.status(400).json({ error: 'Missing directive' });
          await addAuraDirective(null, caller.uid, directive.trim());
          return res.status(200).json({ ok: true });
        }

        case 'removeDirective': {
          if (!directive) return res.status(400).json({ error: 'Missing directive' });
          const { token, projectId } = await getGcpAccessToken();
          const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${PROFILE_COLLECTION}/${caller.uid}/${PROFILE_DOC}`;
          const docRes = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
          
          let cur = {};
          if (docRes.ok) {
            const doc = await docRes.json();
            cur = parseFirestoreFields(doc.fields || {});
          }
          
          const updated = (cur.userDirectives || []).filter(d => d !== directive);
          await setFirestoreREST(`${PROFILE_COLLECTION}/${caller.uid}/aura-profile`, 'profile', {
            ...cur,
            userDirectives: updated,
            lastUpdated: new Date().toISOString(),
          });
          return res.status(200).json({ ok: true });
        }

        case 'appendMemory': {
          if (!fact || typeof fact !== 'string') return res.status(400).json({ error: 'Missing fact' });
          await appendAuraMemory(null, caller.uid, fact.trim(), source || 'conversation', weight ?? 0.7);
          return res.status(200).json({ ok: true });
        }

        default:
          return res.status(400).json({ error: `Unknown action: ${action}` });
      }
    } catch (err) {
      console.error('[AURA API]', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
