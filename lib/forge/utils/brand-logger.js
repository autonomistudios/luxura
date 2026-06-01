/**
 * lib/forge/utils/brand-logger.js
 * Structured logging for all brand agent operations.
 * Writes metrics to Firestore for the analytics dashboard.
 */
import { setFirestoreREST } from '../services/gcp-raw.js';
import crypto from 'crypto';

export function brandLog(brandId, agent, message, data = {}) {
  const prefix = `[BRAND:${brandId}][AGENT:${agent}]`;
  console.log(`${prefix} ${message}`, Object.keys(data).length ? data : '');
}

export function brandError(brandId, agent, message, error) {
  const prefix = `[BRAND:${brandId}][AGENT:${agent}][ERROR]`;
  console.error(`${prefix} ${message}`, error?.message || error);
}

export async function brandMetric(brandId, metric, value) {
  const date  = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const docId = `${date}_${metric}`;
  try {
    await setFirestoreREST(`brands/${brandId}/metrics`, docId, {
      metric, value, date, recordedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn(`[BRAND METRIC] Write failed for ${brandId}/${metric}: ${err.message}`);
  }
}
