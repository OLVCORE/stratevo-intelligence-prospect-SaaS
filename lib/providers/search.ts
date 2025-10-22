/**
 * Provider: Google CSE ou Serper
 * Busca web para encontrar websites de empresas
 */
import { fetchWithTimeout, retry } from '../fetchers';

export async function searchGoogleCSEOrSerper(query: string) {
  const googleKey = process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  const serperKey = process.env.SERPER_API_KEY;

  return retry(async () => {
    let json: any;
    let ms = 0;
    let source: 'cse' | 'serper' = 'serper';

    if (googleKey && cseId) {
      const { res, ms: t } = await fetchWithTimeout(
        `https://www.googleapis.com/customsearch/v1?key=${googleKey}&cx=${cseId}&q=${encodeURIComponent(query)}`,
        { timeoutMs: 6000 }
      );
      ms = t;
      if (!res.ok) throw new Error(`CSE_${res.status}`);
      json = await res.json();
      source = 'cse';
    } else if (serperKey) {
      const { res, ms: t } = await fetchWithTimeout(`https://google.serper.dev/search`, {
        method: 'POST',
        timeoutMs: 6000,
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': serperKey },
        body: JSON.stringify({ q: query }),
      });
      ms = t;
      if (!res.ok) throw new Error(`SERPER_${res.status}`);
      json = await res.json();
      source = 'serper';
    } else {
      throw new Error('No search provider keys configured');
    }

    const items: any[] = (json.items || json.organic || []).map((it: any) => ({
      title: it.title || it.title_plain || it.titleOriginal || '',
      link: it.link || it.url || '',
      snippet: it.snippet || it.snippet_highlighted || '',
    }));

    const primaryWebsite = items.find((i) => i.link?.startsWith('http'))?.link;
    const domain = primaryWebsite ? new URL(primaryWebsite).hostname.replace(/^www\./, '') : undefined;

    return { items, primaryWebsite, domain, source, ms };
  }, 2, 800);
}

