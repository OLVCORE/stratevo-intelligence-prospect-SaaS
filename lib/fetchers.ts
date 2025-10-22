/**
 * Utilitários para fetch com timeout e retry
 */

export async function fetchWithTimeout(url: string, opts: any = {}) {
  const { timeoutMs = 8000, ...rest } = opts;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const t0 = performance.now();
    const res = await fetch(url, { signal: ctrl.signal, ...rest });
    const ms = Math.round(performance.now() - t0);
    return { res, ms };
  } finally {
    clearTimeout(id);
  }
}

export async function retry<T>(fn: () => Promise<T>, tries = 3, delayMs = 1000) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastErr;
}

