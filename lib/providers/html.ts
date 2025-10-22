/**
 * Provider: HTML Artifacts
 * Fetch homepage e extrai meta tags, scripts, links
 * SEM MOCKS - se falhar, retorna erro explícito
 */

export async function fetchHomepageArtifacts(url: string, timeoutMs = 8000) {
  const u = url.startsWith('http') ? url : `https://${url}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = performance.now();

  try {
    const res = await fetch(u, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'OLV-Prospect/1.0' },
    });

    clearTimeout(t);
    const latency = Math.round(performance.now() - t0);

    if (!res.ok) throw new Error(`HTTP_${res.status}`);

    const html = await res.text();

    // Extração básica (regex simples - pode melhorar com parser se necessário)
    const metas: string[] = Array.from(html.matchAll(/<meta[^>]+>/gi)).map((m) => m[0]);
    const scripts: string[] = Array.from(
      html.matchAll(/<script[^>]+src=['"]([^'"]+)['"]/gi)
    ).map((m: any) => m[1]);
    const links: string[] = Array.from(
      html.matchAll(/<link[^>]+href=['"]([^'"]+)['"]/gi)
    ).map((m: any) => m[1]);

    const title = (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '').trim();

    return {
      html,
      title,
      metas,
      scripts,
      links,
      latency,
      finalUrl: res.url,
    };
  } catch (e: any) {
    clearTimeout(t);
    throw new Error(String(e));
  }
}

