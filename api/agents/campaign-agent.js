/**
 * api/agents/campaign-agent.js
 * Cron: every 2 minutes — processes queued campaign jobs
 * Secured by CRON_SECRET header
 */
import { getGcpAccessToken, parseFirestoreFields, updateFirestoreREST } from '../../lib/forge/services/gcp-raw.js';
import { deliverWebhook, WEBHOOK_EVENTS } from '../../lib/forge/services/webhook-service.js';
import { brandLog, brandError } from '../../lib/forge/utils/brand-logger.js';
import { loadSkuForForge } from '../../lib/forge/services/sku-service.js';
import { createGenAI, withGeminiBackoff } from '../../lib/forge/services/gemini-client.js';

const CRON_SECRET  = process.env.CRON_SECRET;
const MAX_JOBS     = 3; // Process max 3 jobs per invocation to stay within Vercel 280s timeout
const JOB_TIMEOUT  = 90_000; // 90s per job

export default async function handler(req, res) {
  // Verify cron secret
  if (CRON_SECRET && req.headers['x-cron-secret'] !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { token, projectId } = await getGcpAccessToken();
  const dbUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  // Query all queued jobs across all brands (collection group query)
  const queryRes = await fetch(`${dbUrl}:runQuery`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'jobs', allDescendants: true }],
        where: { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'queued' } } },
        orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'ASCENDING' }],
        limit: { value: MAX_JOBS },
      },
    }),
  });

  const data = await queryRes.json();
  const jobs = (data || []).filter(item => item.document).map(item => ({
    ...parseFirestoreFields(item.document.fields || {}),
    _path: item.document.name,
  }));

  if (!jobs.length) {
    return res.status(200).json({ processed: 0, message: 'No queued jobs' });
  }

  brandLog('system', 'campaign-agent', `Processing ${jobs.length} queued jobs`);

  const results = await Promise.allSettled(jobs.map(job => processJob(job, dbUrl, token)));

  const processed = results.filter(r => r.status === 'fulfilled').length;
  const failed    = results.filter(r => r.status === 'rejected').length;

  return res.status(200).json({ processed, failed, total: jobs.length });
}

async function processJob(job, dbUrl, token) {
  const { brandId, jobId, skuId, config, webhookUrl } = job;

  brandLog(brandId, 'campaign-agent', `Starting job ${jobId} — skuId=${skuId}`);

  // Mark processing
  await updateFirestoreREST(`brands/${brandId}/jobs`, jobId, {
    status: 'processing', startedAt: new Date().toISOString(),
  });

  try {
    // Load SKU DNA (same recall as forge.js)
    let skuData = null;
    if (skuId) {
      skuData = await loadSkuForForge(brandId, skuId);
      brandLog(brandId, 'campaign-agent', `SKU DNA loaded for ${skuId}, fidelity=${skuData.fidelityScore}`);
    }

    // Simplified generation via Gemini directly (without full SSE pipeline)
    // For batch jobs, we generate using the same prompt architecture but collect results
    const genAI  = createGenAI();
    const { PXL_MODEL } = await import('../../lib/forge/constants.js');
    const model  = genAI.getGenerativeModel({
      model: PXL_MODEL,
      generationConfig: { responseModalities: ['IMAGE'], temperature: 0.85 },
    });

    const prompt = buildBatchPrompt(job, skuData);
    const images = [];

    // Generate 6 slots sequentially (avoids rate limits in batch context)
    for (let i = 0; i < 6; i++) {
      try {
        const parts = [{ text: `${prompt} — Slot ${i + 1} of 6, unique pose and composition.` }];
        if (skuData?.referenceImageBase64) {
          parts.push({ inlineData: { mimeType: 'image/png', data: skuData.referenceImageBase64 } });
        }

        const result = await withGeminiBackoff(() => model.generateContent({ contents: [{ role: 'user', parts }] }));
        const imgPart = result.response.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.mimeType?.startsWith('image/'));

        if (imgPart) {
          images.push({ slot: i, mimeType: imgPart.inlineData.mimeType, data: imgPart.inlineData.data });
        }
      } catch (err) {
        brandError(brandId, 'campaign-agent', `Slot ${i} failed for job ${jobId}`, err);
      }
    }

    const results = {
      images: images.map(img => ({ slot: img.slot, available: true })),
      imagesDelivered: images.length,
    };

    // Mark complete
    await updateFirestoreREST(`brands/${brandId}/jobs`, jobId, {
      status: 'complete', results, completedAt: new Date().toISOString(),
    });

    // Update campaign record if linked
    if (job.campaignId) {
      await updateFirestoreREST(`brands/${brandId}/campaigns`, job.campaignId, {
        status: 'complete', imagesDelivered: images.length, completedAt: new Date().toISOString(),
      });
    }

    // Deliver webhook
    await deliverWebhook(brandId, {
      type: WEBHOOK_EVENTS.CAMPAIGN_COMPLETE,
      data: { jobId, skuId, imagesDelivered: images.length },
    }).catch(() => {});

    brandLog(brandId, 'campaign-agent', `Job ${jobId} complete — ${images.length}/6 images delivered`);

  } catch (err) {
    brandError(brandId, 'campaign-agent', `Job ${jobId} fatal error`, err);

    await updateFirestoreREST(`brands/${brandId}/jobs`, jobId, {
      status: 'failed', error: err.message, completedAt: new Date().toISOString(),
    }).catch(() => {});

    await deliverWebhook(brandId, {
      type: WEBHOOK_EVENTS.CAMPAIGN_FAILED,
      data: { jobId, error: err.message },
    }).catch(() => {});

    throw err;
  }
}

function buildBatchPrompt(job, skuData) {
  const config  = job.config || {};
  const lighting = config.lighting || 'Clean & Even';
  const camera   = config.camera   || 'Soft Background (85mm)';

  if (skuData) {
    const anchorDna = skuData.dna?.[skuData.anchorType] || '';
    return `Professional fashion editorial photograph. ${anchorDna.slice(0, 300)}. Lighting: ${lighting}. Camera: ${camera}. High-fashion aesthetic, editorial quality, dark background.`;
  }

  return `Professional high-fashion editorial photograph. Lighting: ${lighting}. Camera: ${camera}. Quiet luxury aesthetic.`;
}
