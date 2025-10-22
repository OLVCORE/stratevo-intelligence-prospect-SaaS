/**
 * Provider: BuiltWith (OPCIONAL)
 * Se BUILTWITH_API_KEY não existir, retorna null (SEM ERRO)
 * SEM MOCKS - se falhar, retorna erro explícito
 */

export async function fetchBuiltWith(domain: string) {
  if (!process.env.BUILTWITH_API_KEY) return null;

  const t0 = performance.now();
  try {
    const res = await fetch(
      `https://api.builtwith.com/v21/api.json?KEY=${process.env.BUILTWITH_API_KEY}&LOOKUP=${domain}`
    );
    const latency = Math.round(performance.now() - t0);

    if (!res.ok) return { error: true, latency };

    const json = await res.json();
    return { json, latency };
  } catch (e: any) {
    const latency = Math.round(performance.now() - t0);
    return { error: true, latency };
  }
}

