/**
 * api/stripe-webhook.js
 * POST /api/stripe-webhook — Stripe subscription lifecycle handler
 * Mirrors paypal-webhook.js structure with Stripe's HMAC signature verification
 */
import { getGcpAccessToken, setFirestoreREST, updateFirestoreREST, parseFirestoreFields } from '../lib/forge/services/gcp-raw.js';
import crypto from 'crypto';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const TIER_QUOTAS = {
  studio:     { imagesPerMonth: 500,   apiCallsPerMonth: 2000  },
  agency:     { imagesPerMonth: 2000,  apiCallsPerMonth: 10000 },
  enterprise: { imagesPerMonth: 10000, apiCallsPerMonth: 50000 },
};

// Map Stripe price IDs to tiers (set in env vars)
function priceToTier(priceId) {
  const map = {
    [process.env.STRIPE_PRICE_STUDIO]:     'studio',
    [process.env.STRIPE_PRICE_AGENCY]:     'agency',
    [process.env.STRIPE_PRICE_ENTERPRISE]: 'enterprise',
  };
  return map[priceId] || 'studio';
}

function verifyStripeSignature(payload, signature, secret) {
  try {
    const parts    = signature.split(',').reduce((acc, part) => {
      const [key, val] = part.split('=');
      acc[key] = val;
      return acc;
    }, {});
    const timestamp = parts['t'];
    const sigV1     = parts['v1'];
    if (!timestamp || !sigV1) return false;

    // Reject events older than 5 minutes
    if (Math.abs(Date.now() / 1000 - parseInt(timestamp, 10)) > 300) return false;

    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(sigV1, 'hex'));
  } catch { return false; }
}

async function findBrandByStripeCustomer(customerId) {
  const { token, projectId } = await getGcpAccessToken();
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'brands' }],
          where: { fieldFilter: { field: { fieldPath: 'billing.stripeCustomerId' }, op: 'EQUAL', value: { stringValue: customerId } } },
          limit: { value: 1 },
        },
      }),
    }
  );
  const data = await res.json();
  if (!data?.[0]?.document) return null;
  const fields = parseFirestoreFields(data[0].document.fields || {});
  return { brandId: fields.brandId, ...fields };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const signature = req.headers['stripe-signature'];
  if (!signature || !STRIPE_WEBHOOK_SECRET) {
    console.warn('[STRIPE] Missing signature or webhook secret');
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  // Read raw body
  let rawBody;
  try {
    rawBody = JSON.stringify(req.body);
  } catch { return res.status(400).json({ error: 'Invalid body' }); }

  if (!verifyStripeSignature(rawBody, signature, STRIPE_WEBHOOK_SECRET)) {
    console.warn('[STRIPE] Invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.body;
  const obj   = event?.data?.object;

  console.log(`[STRIPE] Event: ${event.type}`);

  try {
    switch (event.type) {

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const customerId = obj.customer;
        const priceId    = obj.items?.data?.[0]?.price?.id;
        const tier       = priceToTier(priceId);
        const quotas     = TIER_QUOTAS[tier] || TIER_QUOTAS.studio;

        const brand = await findBrandByStripeCustomer(customerId);
        if (!brand) { console.warn(`[STRIPE] Brand not found for customer ${customerId}`); break; }

        await updateFirestoreREST('brands', brand.brandId, {
          tier,
          quota: quotas,
          'billing.stripeCustomerId': customerId,
          'billing.subscriptionId':   obj.id,
          'billing.status':           obj.status,
          'billing.currentPeriodEnd': new Date(obj.current_period_end * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        });

        console.log(`[STRIPE] Subscription updated for brand ${brand.brandId}: tier=${tier}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const brand = await findBrandByStripeCustomer(obj.customer);
        if (!brand) break;

        await updateFirestoreREST('brands', brand.brandId, {
          tier:  'studio',
          quota: { imagesPerMonth: 0, apiCallsPerMonth: 0 },
          'billing.status':           'cancelled',
          'billing.subscriptionId':   null,
          updatedAt: new Date().toISOString(),
        });

        console.log(`[STRIPE] Subscription cancelled for brand ${brand.brandId}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const customerId = obj.customer;
        const brand      = await findBrandByStripeCustomer(customerId);
        if (!brand) break;

        // Reset monthly usage on successful renewal
        await updateFirestoreREST('brands', brand.brandId, {
          'usage.currentPeriodImages':   0,
          'usage.currentPeriodApiCalls': 0,
          'usage.periodStart':           new Date().toISOString(),
          'billing.status':              'active',
          updatedAt: new Date().toISOString(),
        });

        console.log(`[STRIPE] Invoice paid, usage reset for brand ${brand.brandId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const brand = await findBrandByStripeCustomer(obj.customer);
        if (!brand) break;

        await updateFirestoreREST('brands', brand.brandId, {
          'billing.status': 'past_due',
          updatedAt: new Date().toISOString(),
        });

        // Notify brand via webhook
        const { deliverWebhook, WEBHOOK_EVENTS } = await import('../lib/forge/services/webhook-service.js');
        await deliverWebhook(brand.brandId, {
          type: WEBHOOK_EVENTS.QUOTA_CRITICAL,
          data: { message: 'Payment failed — please update your billing information', status: 'past_due' },
        }).catch(() => {});

        console.log(`[STRIPE] Payment failed for brand ${brand.brandId}`);
        break;
      }
    }
  } catch (err) {
    console.error('[STRIPE] Handler error:', err.message);
  }

  return res.status(200).json({ received: true });
}
