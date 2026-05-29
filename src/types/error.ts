/**
 * src/types/error.ts — Type-safe error narrowing
 *
 * Replaces the `catch (err: any)` antipattern with proper unknown-narrowing.
 */

export interface ErrorWithCode {
  code?: string;
  name?: string;
  message?: string;
}

/** Extract a human-readable message from an unknown error. */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

/** Extract an error code (e.g. Firebase 'auth/unauthorized-domain') if present. */
export function getErrorCode(err: unknown): string | null {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: unknown }).code;
    return typeof code === 'string' ? code : null;
  }
  return null;
}

/** Check if an error is a DOMException AbortError (fetch timeout). */
export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
    || (err && typeof err === 'object' && 'name' in err && (err as { name: unknown }).name === 'AbortError') === true;
}
