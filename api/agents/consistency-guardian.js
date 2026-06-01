/**
 * api/agents/consistency-guardian.js
 * Cron: Mondays 2am UTC — detect DNA drift across campaigns using same SKU
 * Brands with ≥5 campaigns per SKU get drift analysis. Flags re-enrollment when drift > 35.
 */
import { getGcpAccessToken, parseFirestoreFields } from '../../lib/forge/services/gcp-raw.js';
import { deliverWebhook } from '../../lib/forge/services/webhook-service.js';
import { createGenAI, withGeminiBackoff } from '../../lib/forge/services/gemini-client.js';
import { TEXT_MODEL } from '../../lib/forge/constants.js';
import { brandLog, brandError } from '../../lib/forge/utils/brand-logger.js';

const CRON_SECRET    = process.env.CRON_SECRET;
const DRIFT_THRESHOLD = 35;
const MIN_CAMPAIGNS   = 5;

export default async function handler(req, res) {
  if (CRON_SECRET && req.headers['x-cron-secret'] !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { token, projectId } = await getGcpAccessToken();

  // Fetch all brands
  const brandsRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/brands?pageSize=200`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const brandsData = await brandsRes.json();
  const brands     = (brandsData.documents || []).map(doc => parseFirestoreFields(doc.fields || {}));

  let analysed = 0;
  let flagged  = 0;

  for (const brand of brands) {
    if (!brand.brandId) continue;

    try {
      const drifted = await analyseSkuDrift(brand.brandId, token, projectId);
      if (drifted.length > 0) {
        flagged += drifted.length;
        for (const skuId of drifted) {
          await deliverWebhook(brand.brandId, {
            type: 'sku.drift_detected',
            data: { skuId, message: 'DNA drift detected. Consider re-enrolling this SKU for optimal consistency.', brandId: brand.brandId },
          }).catch(() => {});
        }
      }
      analysed++;
    } catch (err) {
      brandError(brand.brandId, 'consistency-guardian', 'Analysis failed', err);
    }
  }

  return res.status(200).json({ analysed, flagged, brands: brands.length });
}

async function analyseSkuDrift(brandId, token, projectId) {
  const dbUrl  = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  const drifted = [];

  // Get SKUs for this brand
  const skuRes = await fetch(
    `${dbUrl}/brands/${brandId}/skus?pageSize=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const skuData = await skuRes.json();
  const skus    = (skuData.documents || []).map(doc => parseFirestoreFields(doc.fields || {}))
    .filter(s => s.enrollmentStatus === 'ready');

  for (const sku of skus) {
    if (!sku.skuId || !sku.referenceImage) continue;

    // Get campaigns using this SKU
    const campRes = await fetch(
      `${dbUrl}:runQuery`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'campaigns' }],
            where: { fieldFilter: { field: { fieldPath: 'skuId' }, op: 'EQUAL', value: { stringValue: sku.skuId } } },
            orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
            limit: { value: 10 },
          },
        }),
      }
    );

    const campData  = await campRes.json();
    const campaigns = (campData || []).filter(i => i.document).map(i => parseFirestoreFields(i.document.fields || {}));

    if (campaigns.length < MIN_CAMPAIGNS) continue;

    // Sample last 3 campaigns for drift analysis
    const recent = campaigns.slice(0, 3);
    const avgFidelity = recent.reduce((sum, c) => sum + (c.avgFidelityScore || 90), 0) / recent.length;
    const enrollFidelity = sku.fidelityScore || 90;
    const driftScore = Math.max(0, enrollFidelity - avgFidelity);

    brandLog(brandId, 'consistency-guardian', `SKU ${sku.skuId}: enrolled=${enrollFidelity}, recent avg=${avgFidelity.toFixed(1)}, drift=${driftScore.toFixed(1)}`);

    if (driftScore > DRIFT_THRESHOLD) {
      drifted.push(sku.skuId);
      brandLog(brandId, 'consistency-guardian', `DRIFT DETECTED for SKU ${sku.skuId} — score ${driftScore.toFixed(1)} > threshold ${DRIFT_THRESHOLD}`);
    }
  }

  return drifted;
}
