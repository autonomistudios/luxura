/**
 * PayPal Webhook Handler
 *
 * Listens for PayPal subscription lifecycle events and updates
 * the subscriber's Firestore record accordingly using pure REST.
 * No firebase-admin dependency.
 */
import { queryFirestoreREST, updateFirestoreREST } from '../lib/forge/services/gcp-raw.js';

const TIER_CREDITS = {
  aura:      { imageCredits: 300,  videoCredits: 0  },
  sovereign: { imageCredits: 750,  videoCredits: 5  },
  luminary:  { imageCredits: 1500, videoCredits: 20 },
};

async function getPayPalAccessToken() {
  const base = process.env.PAYPAL_SANDBOX === 'true'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

  const creds = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method:  'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    'grant_type=client_credentials',
  });
  const data = await res.json();
  return { token: data.access_token, base };
}

async function verifyWebhookSignature(req, rawBody) {
  try {
    const { token, base } = await getPayPalAccessToken();
    const payload = {
      auth_algo:         req.headers['paypal-auth-algo'],
      cert_url:          req.headers['paypal-cert-url'],
      transmission_id:   req.headers['paypal-transmission-id'],
      transmission_sig:  req.headers['paypal-transmission-sig'],
      transmission_time: req.headers['paypal-transmission-time'],
      webhook_id:        process.env.PAYPAL_WEBHOOK_ID,
      webhook_event:     JSON.parse(rawBody),
    };
    const res = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const result = await res.json();
    return result.verification_status === 'SUCCESS';
  } catch {
    return false;
  }
}

async function findUserBySubscription(subscriptionId) {
  const doc = await queryFirestoreREST('users', 'subscriptionId', 'EQUAL', subscriptionId);
  if (!doc) return null;
  
  const idPath = doc.name.split('/');
  const uid = idPath[idPath.length - 1];
  
  const data = {};
  for (const [k, v] of Object.entries(doc.fields || {})) {
    if (v.stringValue !== undefined) data[k] = v.stringValue;
    if (v.integerValue !== undefined) data[k] = parseInt(v.integerValue, 10);
  }
  return { id: uid, data };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');

  if (!process.env.PAYPAL_WEBHOOK_ID) {
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const valid = await verifyWebhookSignature(req, rawBody);
  if (!valid) return res.status(400).json({ error: 'Invalid signature' });

  let event;
  try { event = JSON.parse(rawBody); }
  catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const eventType      = event.event_type;
  const subscriptionId = event.resource?.id || event.resource?.billing_agreement_id;
  console.log(`[PAYPAL-WEBHOOK] ${eventType} — subscription: ${subscriptionId}`);

  try {
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const uid      = event.resource?.custom_id;
        const planId   = event.resource?.plan_id;
        const planTierMap = {
          [process.env.PAYPAL_PLAN_AURA      || process.env.VITE_PAYPAL_PLAN_AURA]:      'aura',
          [process.env.PAYPAL_PLAN_SOVEREIGN || process.env.VITE_PAYPAL_PLAN_SOVEREIGN]:  'sovereign',
          [process.env.PAYPAL_PLAN_LUMINARY  || process.env.VITE_PAYPAL_PLAN_LUMINARY]:   'luminary',
        };
        const tier = planTierMap[planId];
        if (!tier || !uid) break;

        const credits = TIER_CREDITS[tier];
        await updateFirestoreREST('users', uid, {
          tier,
          subscriptionId,
          subscriptionStatus: 'ACTIVE',
          imageCredits: credits.imageCredits,
          videoCredits: credits.videoCredits,
        });
        break;
      }
      case 'BILLING.SUBSCRIPTION.RENEWED': {
        const user = await findUserBySubscription(subscriptionId);
        if (!user) break;

        const credits = TIER_CREDITS[user.data.tier];
        if (!credits) break;

        await updateFirestoreREST('users', user.id, {
          imageCredits:       credits.imageCredits,
          videoCredits:       credits.videoCredits,
          subscriptionStatus: 'ACTIVE',
        });
        break;
      }
      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        const user = await findUserBySubscription(subscriptionId);
        if (!user) break;

        await updateFirestoreREST('users', user.id, {
          tier:               'free',
          subscriptionStatus: 'CANCELLED',
          subscriptionId:     null,
          imageCredits:       0,
          videoCredits:       0,
        });
        break;
      }
      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        const user = await findUserBySubscription(subscriptionId);
        if (!user) break;

        await updateFirestoreREST('users', user.id, {
          subscriptionStatus: 'SUSPENDED',
        });
        break;
      }
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[PAYPAL-WEBHOOK] Error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
}
