/**
 * lib/forge/services/gemini-client.js
 * Gemini client factory and 429 exponential-backoff wrapper.
 *
 * createGenAI() is called once per request handler invocation — the instance
 * is stateless and safe to pass into any agent function.
 *
 * withGeminiBackoff() wraps any Gemini call with up to 3 retries on rate-limit
 * errors: 3 s → 6 s → 12 s. All other errors are re-thrown immediately.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * createGenAI
 * Returns a GoogleGenerativeAI instance keyed to the project API key.
 * Throws immediately if the key is not configured — fail fast at startup.
 * @returns {GoogleGenerativeAI}
 */
export function createGenAI() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY env var not configured');
  return new GoogleGenerativeAI(apiKey);
}

/**
 * withGeminiBackoff
 * Executes `fn` with exponential backoff on Gemini 429 / RESOURCE_EXHAUSTED errors.
 *
 * @param {() => Promise<any>} fn           — zero-arg async function to execute
 * @param {number}             maxAttempts  — total attempts before throwing (default: 3)
 * @returns {Promise<any>}
 */
export async function withGeminiBackoff(fn, maxAttempts = 3) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg   = String(err?.message || err || '');
      const is429 = msg.includes('429') ||
                    msg.includes('Too Many Requests') ||
                    msg.includes('RESOURCE_EXHAUSTED');
      if (!is429 || attempt === maxAttempts - 1) throw err;
      const delay = Math.min(3000 * Math.pow(2, attempt), 16000); // 3 s, 6 s, 12 s
      console.warn(
        `[FORGE] Gemini 429 — attempt ${attempt + 1}/${maxAttempts}, backoff ${delay}ms...`
      );
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
