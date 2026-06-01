/**
 * lib/forge/services/webhook-service.js
 * Webhook delivery system for brand event notifications.
 * HMAC-SHA256 signed payloads, 3-retry with exponential backoff.
 */
import crypto from 'crypto';
import { getGcpAccessToken, parseFirestoreFields, setFirestoreREST, updateFirestoreREST } from './gcp-raw.js';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'lux_webhook_secret_change_in_prod';
const MAX_LOG_ENTRIES = 100;

// ─── Event Types ──────────────────────────────────────────────────────────────
export const WEBHOOK_EVENTS = {
  SKU_ENROLLED:        'sku.enrolled',
  SKU_FAILED:          'sku.failed',
  CAMPAIGN_COMPLETE:   'campaign.complete',
  CAMPAIGN_FAILED:     'campaign.failed',
  BATCH_COMPLETE:      'batch.complete',
  SET_CALIBRATED:      'set.calibrated',
  QUOTA_WARNING:       'quota.warning',
  QUOTA_CRITICAL:      'quota.critical',
};

// ─── Deliver Webhook ──────────────────────────────────────────────────────────
export async function deliverWebhook(brandId, event) {
  const webhookUrl = await getBrandWebhookUrl(brandId);
  if (!webhookUrl) return { delivered: false, httpStatus: null, reason: 'No webhook URL configured' };

  const payload = {
    event: event.type,
    brandId,
    timestamp: new Date().toISOString(),
    data: event.data || event,
  };

  const signature = signWebhookPayload(JSON.stringify(payload), WEBHOOK_SECRET);
  const attempts = [2000, 5000, 10000]; // backoff delays in ms

  let lastStatus = null;
  for (let i = 0; i < attempts.length; i++) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-LuxAura-Signature': signature,
          'X-LuxAura-Event': event.type,
          'X-LuxAura-Delivery': `${brandId}_${Date.now()}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      lastStatus = res.status;

      if (res.ok) {
        await logWebhookDelivery(brandId, { event: event.type, url: webhookUrl, status: res.status, success: true });
        return { delivered: true, httpStatus: res.status };
      }

      // Non-2xx — retry after delay
      if (i < attempts.length - 1) {
        await sleep(attempts[i]);
      }
    } catch (err) {
      console.warn(`[WEBHOOK] Delivery attempt ${i + 1} failed for brand ${brandId}: ${err.message}`);
      if (i < attempts.length - 1) {
        await sleep(attempts[i]);
      }
    }
  }

  await logWebhookDelivery(brandId, { event: event.type, url: webhookUrl, status: lastStatus, success: false });
  return { delivered: false, httpStatus: lastStatus };
}

// ─── Signature Utilities ──────────────────────────────────────────────────────
export function signWebhookPayload(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyWebhookSignature(payload, signature, secret) {
  const expected = signWebhookPayload(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
}

// ─── Test Delivery ────────────────────────────────────────────────────────────
export async function testWebhookDelivery(brandId, testUrl) {
  const testPayload = {
    event: 'webhook.test',
    brandId,
    timestamp: new Date().toISOString(),
    data: { message: 'This is a test delivery from LuxAura. Your webhook is configured correctly.' },
  };

  const signature = signWebhookPayload(JSON.stringify(testPayload), WEBHOOK_SECRET);
  try {
    const res = await fetch(testUrl || (await getBrandWebhookUrl(brandId)), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LuxAura-Signature': signature,
        'X-LuxAura-Event': 'webhook.test',
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10000),
    });
    return { delivered: res.ok, httpStatus: res.status };
  } catch (err) {
    return { delivered: false, httpStatus: null, error: err.message };
  }
}

// ─── Internals ────────────────────────────────────────────────────────────────
async function getBrandWebhookUrl(brandId) {
  const { token, projectId } = await getGcpAccessToken();
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/brands/${brandId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return null;
  const doc = await res.json();
  const fields = parseFirestoreFields(doc.fields || {});
  return fields.webhookUrl || null;
}

async function logWebhookDelivery(brandId, { event, url, status, success }) {
  const logId = `log_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
  try {
    await setFirestoreREST(`brands/${brandId}/webhookLogs`, logId, {
      logId,
      event,
      url,
      httpStatus: status,
      success,
      timestamp: new Date().toISOString(),
    });
    // Enforce max 100 log entries (fire-and-forget, non-blocking)
    pruneWebhookLogs(brandId).catch(() => {});
  } catch (err) {
    console.warn(`[WEBHOOK] Log write failed: ${err.message}`);
  }
}

async function pruneWebhookLogs(brandId) {
  const { token, projectId } = await getGcpAccessToken();
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/brands/${brandId}/webhookLogs?pageSize=200&orderBy=timestamp%20desc`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return;
  const data = await res.json();
  const docs = data.documents || [];
  if (docs.length <= MAX_LOG_ENTRIES) return;

  // Delete oldest entries beyond limit
  const toDelete = docs.slice(MAX_LOG_ENTRIES);
  await Promise.allSettled(
    toDelete.map(doc => {
      const parts = doc.name.split('/');
      const logId = parts[parts.length - 1];
      return import('./gcp-raw.js').then(m =>
        m.deleteFirestoreREST(`brands/${brandId}/webhookLogs/${logId}`)
      );
    })
  );
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
