// 🔍 BUSCA OFICIAL DE WEBSITE - Retorna TOP 10 para user ESCOLHER!

export interface WebsiteSearchResult {
  url: string;
  title: string;
  snippet: string;
  isBacklink: boolean;
  confidence: number;
}

// 🚫 BACKLINKS (destacar mas mostrar)
const BACKLINK_DOMAINS = [
  'infojobs.com.br',
  'empresasaqui.com.br',
  'econodata.com.br',
  'cnpj.net',
  'cnpj.biz',
  'cnpj.ws',
  'guiamais.com.br',
  'telelistas.net',
  'apontador.com.br',
];

/**
 * 🔍 BUSCA DIRETA: "website oficial [empresa]"
 * Retorna TOP 10 resultados para user ESCOLHER
 */
export async function searchOfficialWebsite(
  razaoSocial: string
): Promise<WebsiteSearchResult[]> {
  console.log('[OFFICIAL] 🔍 Buscando website oficial de:', razaoSocial);

  try {
    const serperKey = import.meta.env.VITE_SERPER_API_KEY;
    if (!serperKey) throw new Error('SERPER_API_KEY não configurada');

    // ⚡ QUERY DIRETA E ASSERTIVA
    const query = `website oficial "${razaoSocial}"`;
    
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 10, // TOP 10 resultados
        gl: 'br',
        hl: 'pt-br',
      }),
    });

    if (!response.ok) throw new Error('Erro na busca Google');

    const data = await response.json();
    const organic = data.organic || [];
    
    console.log('[OFFICIAL] 📊 Organic results:', organic.length);

    // Processar e rankear resultados
    const results: WebsiteSearchResult[] = organic.map((result: any, index: number) => {
      const url = result.link || '';
      const title = result.title || '';
      const snippet = result.snippet || '';
      
      // Detectar se é backlink
      const isBacklink = BACKLINK_DOMAINS.some(backlink => 
        url.toLowerCase().includes(backlink)
      );
      
      // Calcular confiança (0-100)
      let confidence = 100 - (index * 10); // Posição no ranking
      
      if (isBacklink) {
        confidence = confidence * 0.3; // Penalizar backlinks
      }
      
      // Bonificar se tem nome da empresa no title
      if (title.toLowerCase().includes(razaoSocial.toLowerCase().split(' ')[0])) {
        confidence = Math.min(100, confidence + 20);
      }
      
      // Bonificar se tem .com.br ou .ind.br
      if (url.includes('.com.br') || url.includes('.ind.br')) {
        confidence = Math.min(100, confidence + 15);
      }

      return {
        url,
        title,
        snippet,
        isBacklink,
        confidence: Math.round(confidence),
      };
    });

    // Ordenar por confiança (maior primeiro)
    const finalResults = results
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
    
    console.log('[OFFICIAL] ✅ Retornando', finalResults.length, 'resultados');
    console.log('[OFFICIAL] 🎯 TOP 3:', finalResults.slice(0, 3).map(r => ({ url: r.url, conf: r.confidence })));
    
    return finalResults;

  } catch (error) {
    console.error('[OFFICIAL] ❌ Erro na busca:', error);
    return [];
  }
}

