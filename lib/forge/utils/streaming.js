/**
 * lib/forge/utils/streaming.js
 * Concurrency-limited async executor with per-result streaming callback.
 *
 * Used by Agent 03 to run 6 image generation slots at max 3 concurrent workers,
 * streaming each completed slot to the SSE client immediately rather than waiting
 * for the full batch to finish.
 */

/**
 * pLimitStreaming
 * Runs an array of async factory functions with a concurrency ceiling.
 * Calls onResult(localIndex, result) the moment each slot resolves or rejects.
 *
 * @param {Array<() => Promise<any>>} fns         — array of zero-arg async factories
 * @param {number}                    concurrency  — max parallel workers
 * @param {(i: number, result: {status: string, value?: any, reason?: any}) => void} onResult
 * @returns {Promise<Array<{status: 'fulfilled'|'rejected', value?: any, reason?: any}>>}
 */
export async function pLimitStreaming(fns, concurrency, onResult) {
  const out  = new Array(fns.length);
  let   next = 0;

  async function worker() {
    while (next < fns.length) {
      const i = next++;
      try {
        const value = await fns[i]();
        out[i] = { status: 'fulfilled', value };
        if (onResult) onResult(i, out[i]);
      } catch (e) {
        out[i] = { status: 'rejected', reason: e };
        if (onResult) onResult(i, out[i]);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, fns.length) }, worker)
  );
  return out;
}
