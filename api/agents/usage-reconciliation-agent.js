/**
 * api/agents/usage-reconciliation-agent.js
 * Cron: 1st of every month — reset monthly usage counters
 * Also fires quota warning webhooks at 80% and 95% thresholds
 */
import { getGcpAccessToken, parseFirestoreFields } from '../../lib/forge/services/gcp-raw.js';
import { resetMonthlyUsage, checkQuotaWarningThreshold } from '../../lib/forge/services/brand-service.js';
import { deliverWebhook, WEBHOOK_EVENTS } from '../../lib/forge/services/webhook-service.js';
import { brandLog } from '../../lib/forge/utils/brand-logger.js';

const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(req, res) {
  if (CRON_SECRET && req.headers['x-cron-secret'] !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { token, projectId } = await getGcpAccessToken();
  const now = new Date().toISOString();

  // Fetch all brands
  const brandsRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/brands?pageSize=500`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!brandsRes.ok) return res.status(500).json({ error: 'Failed to fetch brands' });

  const brandsData = await brandsRes.json();
  const brands     = (brandsData.documents || []).map(doc => ({
    ...parseFirestoreFields(doc.fields || {}),
  }));

  let reset = 0;
  let warned = 0;

  for (const brand of brands) {
    if (!brand.brandId) continue;

    try {
      // Check if current period has ended → reset usage
      const periodEnd = brand.billing?.currentPeriodEnd;
      if (periodEnd && new Date(periodEnd) <= new Date()) {
        await resetMonthlyUsage(brand.brandId);
        brandLog(brand.brandId, 'usage-reconciliation', 'Monthly usage reset');
        reset++;
      }

      // Check quota warning thresholds
      const warning = await checkQuotaWarningThreshold(brand.brandId);
      if (warning) {
        const eventType = warning.level === 'critical' ? WEBHOOK_EVENTS.QUOTA_CRITICAL : WEBHOOK_EVENTS.QUOTA_WARNING;
        await deliverWebhook(brand.brandId, {
          type: eventType,
          data: { percentUsed: Math.round(warning.percentUsed), level: warning.level, brandId: brand.brandId },
        }).catch(() => {});
        warned++;
        brandLog(brand.brandId, 'usage-reconciliation', `Quota ${warning.level} warning sent (${Math.round(warning.percentUsed)}%)`);
      }
    } catch (err) {
      console.error(`[USAGE RECONCILIATION] Failed for brand ${brand.brandId}: ${err.message}`);
    }
  }

  console.log(`[USAGE RECONCILIATION] Complete — ${reset} resets, ${warned} warnings, ${brands.length} brands checked`);
  return res.status(200).json({ processed: brands.length, reset, warned, timestamp: now });
}
