// 🔍 BUSCA OFICIAL DE WEBSITE - Retorna TOP 10 para user ESCOLHER!

export interface WebsiteSearchResult {
  url: string;
  title: string;
  snippet: string;
  isBacklink: boolean;
  confidence: number;
}

// 🚫 BACKLINKS E SITES DE DADOS PÚBLICOS (NÃO SÃO WEBSITES OFICIAIS!)
const BACKLINK_DOMAINS = [
  'infojobs.com.br',
  'empresasaqui.com.br',
  'econodata.com.br',
  'escavador.com',        // ← CRÍTICO: Site de dados judiciais
  'jusbrasil.com.br',     // ← Dados jurídicos
  'serasa',               // ← Serasa Experian
  'cnpj.net',
  'cnpj.biz',
  'cnpj.ws',
  'reclameaqui.com.br',   // ← Reclamações
  'guiamais.com.br',
  'telelistas.net',
  'apontador.com.br',
  'glassdoor.com',
  'indeed.com',
  'catho.com.br',
  'linkedin.com/jobs',
  'wikipedia.org',
  'youtube.com',
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

    // 🎯 EXTRAIR NOME FANTASIA (entre parênteses) - MAIS ASSERTIVO!
    const nomeBusca = razaoSocial.includes('(') 
      ? razaoSocial.match(/\(([^)]+)\)/)?.[1] || razaoSocial
      : razaoSocial;
    
    console.log('[OFFICIAL] 🎯 Usando nome:', nomeBusca, '(extraído de:', razaoSocial + ')');

    // ⚡ QUERY EXATA DO GOOGLE (100% ASSERTIVA!)
    const query = `website oficial ${razaoSocial}`;
    
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 20, // TOP 20 resultados
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
      
      // 🚫 REJEITAR REDES SOCIAIS (não são websites oficiais!)
      const isSocialMedia = 
        url.includes('facebook.com') ||
        url.includes('instagram.com') ||
        url.includes('linkedin.com/company') ||
        url.includes('linkedin.com/in') ||
        url.includes('twitter.com') ||
        url.includes('youtube.com');
      
      // Detectar se é backlink
      const isBacklink = BACKLINK_DOMAINS.some(backlink => 
        url.toLowerCase().includes(backlink)
      );
      
      // Calcular confiança (0-100)
      let confidence = 100 - (index * 5); // Posição no ranking (menos penalidade)
      
      // 🚫 PENALIZAR PESADO redes sociais (não queremos como #1!)
      if (isSocialMedia) {
        confidence = confidence * 0.2; // 80% de penalidade!
      }
      
      if (isBacklink) {
        confidence = confidence * 0.3; // Penalizar backlinks
      }
      
      // ✅ BONIFICAR websites corporativos próprios
      if (url.includes('.com.br') || url.includes('.ind.br') || url.includes('.net.br')) {
        confidence = Math.min(100, confidence + 40); // +40 pontos!
      }
      
      // ✅ BONIFICAR PESADO se tem nome da empresa no domain (CRITÉRIO #1!)
      const domain = url.replace(/^https?:\/\//, '').split('/')[0];
      const primeirapalavra = razaoSocial.toLowerCase().split(' ')[0];
      const segundaPalavra = razaoSocial.toLowerCase().split(' ')[1] || '';
      
      // Match perfeito no domain (ex: ceramfix.com.br para "Ceramfix...")
      if (domain.toLowerCase().includes(primeirapalavra) && primeirapalavra.length > 4) {
        confidence = Math.min(100, confidence + 60); // +60 pontos! MÁXIMA PRIORIDADE!
      }
      
      // Match duplo (ex: goldencargo.com.br para "Golden Cargo...")
      if (segundaPalavra.length > 3 && domain.toLowerCase().includes(segundaPalavra)) {
        confidence = Math.min(100, confidence + 40); // +40 pontos!
      }
      
      // Bonificar se tem nome da empresa no title
      if (title.toLowerCase().includes(primeirapalavra)) {
        confidence = Math.min(100, confidence + 10);
      }

      return {
        url,
        title,
        snippet,
        isBacklink: isBacklink || isSocialMedia,
        confidence: Math.round(confidence),
      };
    });

    // Ordenar por confiança (maior primeiro)
    const finalResults = results
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20); // TOP 20!
    
    console.log('[OFFICIAL] ✅ Retornando', finalResults.length, 'resultados');
    console.log('[OFFICIAL] 🎯 TOP 3:', finalResults.slice(0, 3).map(r => ({ url: r.url, conf: r.confidence })));
    
    return finalResults;

  } catch (error) {
    console.error('[OFFICIAL] ❌ Erro na busca:', error);
    return [];
  }
}

