import { getGcpAccessToken, setFirestoreREST, updateFirestoreREST, parseFirestoreFields } from './gcp-raw.js';

/**
 * lib/forge/services/aura-profile.js  —  Aura User Profile Service v2.0
 *
 * The memory layer that makes Aura a personalised creative director.
 * She learns who each user is, what they sell, how they shoot, and what they
 * want — so every conversation and every generation feels like it comes from
 * someone who has been paying attention from day one.
 *
 * ── Profile schema (Firestore: users/{uid}/aura-profile) ────────────────────
 * {
 *   // ── Identity (who they are) ─────────────────────────────────────────────
 *   displayName         : string   — pulled from Firebase Auth on first load
 *   preferredName       : string   — what they want Aura to call them
 *   profession          : string   — e.g. "hair stylist", "fashion designer"
 *   creativeIdentity    : string   — their self-described creative voice
 *   businessFocus       : string   — what they sell/promote with generated images
 *   whyTheyreHere       : string   — their stated purpose (onboarding or inferred)
 *   goals               : string[] — what success looks like for them
 *
 *   // ── Relationship (Aura ↔ user) ──────────────────────────────────────────
 *   sessionCount        : number   — total sessions with Aura
 *   firstSeen           : Timestamp
 *   lastSeen            : Timestamp
 *   trustTier           : 'new' | 'familiar' | 'trusted' | 'partner'
 *   auraVoiceTone       : string   — how Aura speaks to this user ("warm", "direct", "technical")
 *   onboarded           : boolean
 *
 *   // ── Distilled memory (what Aura has learned) ────────────────────────────
 *   // Max 20 entries, rolling FIFO. Each entry is a single human-readable fact.
 *   // NOT raw transcripts — distilled facts only. Voice-ready at zero restructuring.
 *   memories            : AuraMemory[]
 *   userDirectives      : string[] — explicit standing instructions the user has given Aura
 *                                    e.g. "always keep my skin tone consistent"
 *                                         "I shoot mostly outdoors"
 *                                         "never suggest full body for my nail shots"
 *
 *   // ── Style preferences (built over time) ────────────────────────────────
 *   styleSignature      : string   — e.g. "editorial, bold color, texture-forward"
 *   preferredMoods      : string[]
 *   preferredLighting   : string[]
 *   avoidList           : string[] — aesthetics/framings they consistently dislike
 *
 *   // ── Anchor intelligence (inferred from usage) ──────────────────────────
 *   anchorWeights       : Record<string, number>  — 0–1 EMA score per anchor
 *   primaryAnchor       : string
 *   anchorPriorityNote  : string   — product-focused creative directive for Aura
 *
 *   // ── Generation history ─────────────────────────────────────────────────
 *   totalGenerations    : number
 *   topAnchors          : string[]
 *   topMoods            : string[]
 *   recentShotTypes     : string[]
 *   lastUpdated         : Timestamp
 * }
 *
 * ── AuraMemory entry schema ──────────────────────────────────────────────────
 * {
 *   fact      : string    — a single human-readable fact Aura has learned
 *   source    : 'conversation' | 'generation' | 'onboarding' | 'inferred'
 *   timestamp : string    — ISO date string
 *   weight    : number    — 0–1, how confident/significant this memory is
 * }
 *
 * ── Usage ───────────────────────────────────────────────────────────────────
 * const profile = await loadAuraProfile(adminApp, uid, displayName);
 * await updateAuraProfile(adminApp, uid, runData);
 * await setAuraProfileField(adminApp, uid, fields);
 * await appendAuraMemory(adminApp, uid, fact, source, weight);
 * await addAuraDirective(adminApp, uid, directive);
 */

const PROFILE_COLLECTION = 'users';
const PROFILE_DOC        = 'aura-profile/profile';  // 4-segment doc path: users/{uid}/aura-profile/profile
const LOAD_TIMEOUT_MS    = 3000;
const MAX_MEMORIES       = 20;
const MAX_DIRECTIVES     = 30;

// ── Trust tier thresholds ────────────────────────────────────────────────────
const TRUST_TIERS = [
  { min: 0,   tier: 'new'      },
  { min: 3,   tier: 'familiar' },
  { min: 10,  tier: 'trusted'  },
  { min: 25,  tier: 'partner'  },
];

function computeTrustTier(sessionCount = 0) {
  return [...TRUST_TIERS].reverse().find(t => sessionCount >= t.min)?.tier || 'new';
}

// ── Defaults for new users ───────────────────────────────────────────────────
const DEFAULT_PROFILE = {
  displayName:         null,
  preferredName:       null,
  profession:          null,
  creativeIdentity:    null,
  businessFocus:       null,
  whyTheyreHere:       null,
  goals:               [],
  sessionCount:        0,
  firstSeen:           null,
  lastSeen:            null,
  trustTier:           'new',
  auraVoiceTone:       'warm',
  onboarded:           false,
  memories:            [],
  userDirectives:      [],
  styleSignature:      null,
  preferredMoods:      [],
  preferredLighting:   [],
  avoidList:           [],
  anchorWeights:       {},
  primaryAnchor:       null,
  anchorPriorityNote:  null,
  totalGenerations:    0,
  topAnchors:          [],
  topMoods:            [],
  recentShotTypes:     [],
};

/**
 * Load the Aura profile for a user.
 * Bumps sessionCount and lastSeen on every load.
 * Returns DEFAULT_PROFILE on any error or timeout — never throws.
 */
export async function loadAuraProfile(adminApp, uid, displayName = null) {
  try {
    const { token, projectId } = await getGcpAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/aura-profile/profile`;
    
    const res = await Promise.race([
      fetch(url, { headers: { 'Authorization': `Bearer ${token}` } }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('AURA_PROFILE_TIMEOUT')), LOAD_TIMEOUT_MS)),
    ]);

    const now = new Date().toISOString();

    if (!res.ok) {
      if (res.status === 404) {
        // First-ever session — initialise the profile
        const newProfile = {
          ...DEFAULT_PROFILE,
          displayName:  displayName || null,
          preferredName: displayName ? displayName.split(' ')[0] : null,
          sessionCount: 1,
          firstSeen:    now,
          lastSeen:     now,
          trustTier:    'new',
        };
        // Fire-and-forget REST set
        setFirestoreREST(`users/${uid}/aura-profile`, 'profile', newProfile).catch(() => {});
        console.log(`[AURA] New user ${uid} — profile initialised. Welcome, ${newProfile.preferredName || 'new user'}.`);
        return newProfile;
      }
      throw new Error(`Firestore REST GET failed: ${res.status}`);
    }

    const doc = await res.json();
    const data = parseFirestoreFields(doc.fields || {});
    const sessionCount = (data.sessionCount || 0) + 1;
    const trustTier    = computeTrustTier(sessionCount);

    // Bump session stats — fire-and-forget REST set
    setFirestoreREST(`users/${uid}/aura-profile`, 'profile', {
      ...data,
      sessionCount,
      trustTier,
      lastSeen:    now,
      displayName: displayName || data.displayName || null,
    }).catch(() => {});

    const profile = { ...DEFAULT_PROFILE, ...data, sessionCount, trustTier, lastSeen: now };
    console.log(`[AURA] Profile loaded — ${profile.preferredName || profile.displayName || uid} | trustTier: ${trustTier} | sessions: ${sessionCount} | primaryAnchor: ${profile.primaryAnchor || 'none'} | generations: ${profile.totalGenerations || 0}`);
    return profile;

  } catch (err) {
    console.warn(`[AURA] Profile load failed (${err?.message}) — proceeding with defaults.`);
    return { ...DEFAULT_PROFILE };
  }
}

/**
 * Update the Aura profile after a generation run.
 * Merges anchor usage, shot type history, mood history.
 * Fire-and-forget — never awaited in the critical path.
 */
export async function updateAuraProfile(adminApp, uid, runData) {
  try {
    const {
      anchors        = [],
      shotType       = null,
      mood           = null,
      lighting       = null,
      imagesProduced = 0,
    } = runData;

    const { token, projectId } = await getGcpAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/aura-profile/profile`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    
    let cur = { ...DEFAULT_PROFILE };
    if (res.ok) {
      const doc = await res.json();
      cur = { ...cur, ...parseFirestoreFields(doc.fields || {}) };
    }

    // ── Anchor weight update (exponential moving average) ────────────────────
    const weights = { ...(cur.anchorWeights || {}) };
    anchors.forEach(a => {
      weights[a] = Math.min(1, ((weights[a] || 0) * 0.8) + 0.2);
    });
    Object.keys(weights).forEach(a => {
      if (!anchors.includes(a)) weights[a] = Math.max(0, weights[a] * 0.95);
    });

    const topAnchors    = Object.entries(weights).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
    const primaryAnchor = topAnchors[0] || cur.primaryAnchor || null;
    const anchorPriorityNote = primaryAnchor
      ? buildAnchorPriorityNote(primaryAnchor, cur.profession)
      : cur.anchorPriorityNote;

    const recentShotTypes = shotType
      ? [shotType, ...(cur.recentShotTypes || [])].slice(0, 10)
      : (cur.recentShotTypes || []);

    const moodCounts = { ...(cur._moodCounts || {}) };
    if (mood) moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    const topMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

    const lightingCounts = { ...(cur._lightingCounts || {}) };
    if (lighting) lightingCounts[lighting] = (lightingCounts[lighting] || 0) + 1;
    const preferredLighting = Object.entries(lightingCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

    // ── Infer a memory fact from this generation run ──────────────────────────
    const inferred = buildInferredMemory(anchors, shotType, mood, cur);

    const delta = {
      anchorWeights:    weights,
      primaryAnchor,
      anchorPriorityNote,
      topAnchors,
      topMoods,
      preferredLighting,
      recentShotTypes,
      totalGenerations: (cur.totalGenerations || 0) + imagesProduced,
      _moodCounts:      moodCounts,
      _lightingCounts:  lightingCounts,
      lastUpdated:      new Date().toISOString(),
    };

    await setFirestoreREST(`users/${uid}/aura-profile`, 'profile', { ...cur, ...delta });

    // Append inferred memory if new insight detected
    if (inferred) {
      await _appendMemoryToDoc(uid, cur.memories || [], inferred);
    }

    console.log(`[AURA] Profile updated — primaryAnchor: ${primaryAnchor} | totalGenerations: ${delta.totalGenerations}`);
  } catch (err) {
    console.warn(`[AURA] Profile update failed (non-critical): ${err?.message}`);
  }
}

/**
 * Write specific fields to the Aura profile (e.g. from onboarding UI).
 * Used when user explicitly tells Aura their profession, name, or goals.
 */
export async function setAuraProfileField(adminApp, uid, fields) {
  try {
    const { token, projectId } = await getGcpAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/aura-profile/profile`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    
    let cur = {};
    if (res.ok) {
      const doc = await res.json();
      cur = parseFirestoreFields(doc.fields || {});
    }

    await setFirestoreREST(`users/${uid}/aura-profile`, 'profile', {
      ...cur,
      ...fields,
      lastUpdated: new Date().toISOString(),
    });
    console.log(`[AURA] Profile field set for ${uid}: ${Object.keys(fields).join(', ')}`);
  } catch (err) {
    console.warn(`[AURA] Profile field set failed: ${err?.message}`);
  }
}

/**
 * Append a distilled memory fact to the user's Aura profile.
 * Called from conversation layer when Aura learns something significant.
 * Rolling FIFO — oldest memory drops when limit is reached.
 *
 * @param {string} fact    — single human-readable sentence: "User shoots mostly outdoors in natural light"
 * @param {string} source  — 'conversation' | 'generation' | 'onboarding' | 'inferred'
 * @param {number} weight  — 0–1 significance score (default 0.7)
 */
export async function appendAuraMemory(adminApp, uid, fact, source = 'conversation', weight = 0.7) {
  try {
    const { token, projectId } = await getGcpAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/aura-profile/profile`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    
    let cur = {};
    if (res.ok) {
      const doc = await res.json();
      cur = parseFirestoreFields(doc.fields || {});
    }

    await _appendMemoryToDoc(uid, cur.memories || [], { fact, source, weight });
    console.log(`[AURA] Memory appended for ${uid} [${source}]: "${fact.substring(0, 80)}..."`);
  } catch (err) {
    console.warn(`[AURA] Memory append failed: ${err?.message}`);
  }
}

/**
 * Add a standing user directive (explicit instruction Aura must always follow).
 * e.g. "always keep my skin tone consistent", "never suggest full body for nail shots"
 * Deduplicates before writing — no redundant entries.
 */
export async function addAuraDirective(adminApp, uid, directive) {
  try {
    const { token, projectId } = await getGcpAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/aura-profile/profile`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    
    let cur = {};
    if (res.ok) {
      const doc = await res.json();
      cur = parseFirestoreFields(doc.fields || {});
    }

    const existing = cur.userDirectives || [];
    const isDuplicate = existing.some(d => d.toLowerCase().includes(directive.toLowerCase().substring(0, 30)));
    if (isDuplicate) return;
    const updated = [directive, ...existing].slice(0, MAX_DIRECTIVES);

    await setFirestoreREST(`users/${uid}/aura-profile`, 'profile', {
      ...cur,
      userDirectives: updated,
      lastUpdated: new Date().toISOString(),
    });
    console.log(`[AURA] Directive added for ${uid}: "${directive}"`);
  } catch (err) {
    console.warn(`[AURA] Directive add failed: ${err?.message}`);
  }
}

// ── Internal helpers ─────────────────────────────────────────────────────────

async function _appendMemoryToDoc(uid, existingMemories, memoryEntry) {
  const entry = {
    fact:      memoryEntry.fact,
    source:    memoryEntry.source || 'inferred',
    timestamp: new Date().toISOString(),
    weight:    memoryEntry.weight ?? 0.7,
  };
  const updated = [entry, ...existingMemories].slice(0, MAX_MEMORIES);
  await setFirestoreREST(`users/${uid}/aura-profile`, 'profile', { memories: updated, lastUpdated: new Date().toISOString() });
}

/**
 * Infer a memory fact from a generation run.
 * Returns a memory entry if a new pattern is detected, null otherwise.
 */
function buildInferredMemory(anchors, shotType, mood, cur) {
  const totalGens = (cur.totalGenerations || 0);

  // Only start inferring after 3+ runs — avoid noise from first-time exploration
  if (totalGens < 3) return null;

  const weights = cur.anchorWeights || {};
  const topAnchor = Object.entries(weights).sort((a, b) => b[1] - a[1])[0];

  // Infer dominant anchor pattern at milestone generations
  if (topAnchor && topAnchor[1] > 0.6 && [5, 10, 20, 50].includes(totalGens + 1)) {
    const label = topAnchor[0];
    return {
      fact:   `User consistently shoots ${label} content — it appears to be their primary product or focus area.`,
      source: 'inferred',
      weight: topAnchor[1],
    };
  }

  // Infer shot type preference
  const recentShots = cur.recentShotTypes || [];
  if (shotType && recentShots.filter(s => s === shotType).length >= 4) {
    return {
      fact:   `User strongly prefers "${shotType}" shot type — appears consistently across recent generations.`,
      source: 'inferred',
      weight: 0.75,
    };
  }

  // Infer mood preference
  const moodCounts = cur._moodCounts || {};
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
  if (topMood && topMood[1] >= 5 && mood === topMood[0]) {
    return {
      fact:   `User's dominant mood preference is "${topMood[0]}" — it appears in the majority of their generations.`,
      source: 'inferred',
      weight: 0.8,
    };
  }

  return null;
}

// ── Internal: build human-readable anchor priority note ──────────────────────
function buildAnchorPriorityNote(primaryAnchor, profession) {
  const ANCHOR_PRODUCT_MAP = {
    HAIR:       'Hair is the product being sold. Every composition must showcase the hair architecture, color, texture, and styling with editorial precision. Hair must be the hero element.',
    BARBER:     'The barbershop cut is the product. Compositions must showcase the fade, line work, and cut structure clearly. Always front-facing or profile. Hair detail is the deliverable.',
    MAKEUP:     'The makeup look is the product. Face must be the hero. Skin, eyes, lips, and application technique must be sharp and prominent. Beauty editorial framing is mandatory.',
    NAILS:      'The nail art is the product. Hands and nail design must be prominently featured. The nail detail must be sharp, well-lit, and clearly visible. Macro or close-up mandatory.',
    FULL_OUTFIT:'The full outfit is the product being styled and sold. Garment must be shown in full — no cropping. Fabric texture, silhouette, and styling details are the deliverable.',
    SHIRT:      'The garment (top/shirt) is the product. Upper body composition preferred. Fabric and design detail must be clear.',
    DRESS:      'The dress or gown is the product. Full-length shots preferred to show silhouette. Fabric movement and design details are the deliverable.',
    EARRINGS:   'The earrings are the product. They must be clearly visible, well-lit, and sharp. Face and neck framing should showcase the jewelry.',
    NECKLACE:   'The necklace is the product. It must be prominently featured, sharp, and well-lit against the décolletage.',
    SHOES:      'The footwear is the product. Feet and shoes must be visible and sharp. Full-body or editorial three-quarter shots preferred.',
  };
  const base = ANCHOR_PRODUCT_MAP[primaryAnchor]
    || `${primaryAnchor} is the primary anchor — it must be prominently featured in every composition.`;

  return profession ? `As a ${profession}: ${base}` : base;
}
