// 🔍 ANÁLISE SEO COMPLETA - SEMrush Approach (Gratuito com Jina AI + Serper)

// Não precisa de Supabase - funciona com APIs diretas (Jina AI + Serper)

// 🚫 FILTRO: Domínios inválidos (portais, redes sociais, blogs, agregadores)
const INVALID_DOMAINS = [
  'wikipedia.org', 'wiki', 
  'youtube.com', 'youtu.be',
  'facebook.com', 'fb.com',
  'instagram.com',
  'twitter.com', 'x.com',
  'linkedin.com',
  'blog.', '.blog',
  'portal.', '.portal',
  'noticias.', '.noticias',
  'news.', '.news',
  'forum.', '.forum',
  'gov.br', '.gov.',
  'edu.', '.edu',
  'github.com',
  'stackoverflow.com',
  'medium.com',
  'reddit.com',
  // AGREGADORES E DIRETÓRIOS (HF-STACK-2)
  'econodata.com.br',
  'cnpj.biz',
  'cnpj.ws',
  'cnpja.com',
  'cnpjbrasil.com',
  'cnpjtotal.com.br',
  'portaldastransportadoras.com.br',
  'guiadeindustrias.com.br',
  'guiadeempresas',
  'telelistas.net',
  'escavador.com',
  'serasa.com.br',
];

// ✅ VALIDADOR: Só aceitar empresas REAIS
function isValidCompanyDomain(url: string): boolean {
  const urlLower = url.toLowerCase();
  
  // 1. Rejeitar domínios inválidos
  if (INVALID_DOMAINS.some(invalid => urlLower.includes(invalid))) {
    return false;
  }
  
  // 2. Aceitar apenas domínios corporativos
  const hasValidTLD = ['.com.br', '.ind.br', '.net.br', '.com', '.net', '.org', '.io'].some(tld => 
    urlLower.includes(tld)
  );
  
  return hasValidTLD;
}

export interface KeywordData {
  keyword: string;
  frequency: number;
  source: 'meta' | 'title' | 'heading' | 'content';
  relevance: number; // 0-100
}

export interface SEOProfile {
  domain: string;
  companyName: string;
  keywords: KeywordData[];
  metaTags: {
    title?: string;
    description?: string;
    keywords?: string;
  };
  topHeadings: string[];
  contentScore: number; // 0-100 (qualidade do conteúdo)
}

export interface SimilarCompanyBySEO {
  name: string;
  domain: string;
  website: string;
  overlapScore: number; // 0-100 (% de keywords compartilhadas)
  sharedKeywords: string[];
  uniqueKeywords: string[];
  estimatedTraffic?: number;
  ranking?: number;
}

/**
 * 🔍 EXTRAI KEYWORDS DO WEBSITE USANDO JINA AI
 */
export async function extractKeywordsFromWebsite(
  domain: string
): Promise<KeywordData[]> {
  console.log('[SEO] 🔍 Extraindo keywords de:', domain);

  try {
    const jinaKey = import.meta.env.VITE_JINA_API_KEY;
    if (!jinaKey) {
      console.error('[SEO] ❌ JINA_API_KEY não configurada');
      return [];
    }

    // Scraping com Jina AI (extrai conteúdo limpo)
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Authorization': `Bearer ${jinaKey}`,
        'X-Return-Format': 'markdown'
      }
    });

    if (!response.ok) {
      console.error('[SEO] ❌ Erro Jina AI:', response.status);
      return [];
    }

    const markdown = await response.text();
    
    // Extrair keywords por frequência (TF-IDF simplificado)
    const keywords = extractKeywordsFromText(markdown);
    
    console.log('[SEO] ✅ Extraídas', keywords.length, 'keywords');
    return keywords;

  } catch (error) {
    console.error('[SEO] ❌ Erro ao extrair keywords:', error);
    return [];
  }
}

/**
 * 📊 EXTRAI KEYWORDS DE TEXTO (TF-IDF SIMPLIFICADO)
 */
function extractKeywordsFromText(text: string): KeywordData[] {
  // Stopwords em português
  const stopwords = new Set([
    'a', 'o', 'e', 'é', 'de', 'da', 'do', 'para', 'com', 'em', 'no', 'na',
    'os', 'as', 'dos', 'das', 'um', 'uma', 'por', 'se', 'não', 'mais', 'como',
    'ou', 'ao', 'aos', 'à', 'pela', 'pelo', 'sobre', 'entre', 'sem', 'até'
  ]);

  // Extrair metatags
  const metaTitle = text.match(/^#\s+(.+)$/m)?.[1] || '';
  const metaDesc = text.match(/^>\s+(.+)$/m)?.[1] || '';
  
  // Extrair headings
  const headings = [...text.matchAll(/^#{1,3}\s+(.+)$/gm)].map(m => m[1]);
  
  // Tokenizar e contar frequências
  const words = text
    .toLowerCase()
    .replace(/[^\w\sáéíóúâêôãõç-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.has(w));

  const frequency = new Map<string, number>();
  words.forEach(word => {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  });

  // Calcular relevância (aparece em title/headings = mais relevante)
  const keywords: KeywordData[] = [];
  
  frequency.forEach((freq, keyword) => {
    let relevance = Math.min(freq * 5, 100); // Base: frequência
    let source: 'meta' | 'title' | 'heading' | 'content' = 'content';
    
    if (metaTitle.toLowerCase().includes(keyword)) {
      relevance += 30;
      source = 'title';
    } else if (headings.some(h => h.toLowerCase().includes(keyword))) {
      relevance += 20;
      source = 'heading';
    } else if (metaDesc.toLowerCase().includes(keyword)) {
      relevance += 15;
      source = 'meta';
    }
    
    keywords.push({
      keyword,
      frequency: freq,
      source,
      relevance: Math.min(relevance, 100)
    });
  });

  // Retornar top 50 por relevância
  return keywords
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 50);
}

/**
 * 🔎 BUSCA EMPRESAS QUE RANQUEIAM PARA AS MESMAS KEYWORDS (SERPER)
 */
export async function findCompaniesWithSimilarKeywords(
  keywords: string[],
  excludeDomain?: string
): Promise<SimilarCompanyBySEO[]> {
  console.log('[SEO] 🔍 Buscando empresas similares via keywords:', keywords.slice(0, 5));

  try {
    const serperKey = import.meta.env.VITE_SERPER_API_KEY;
    if (!serperKey) {
      console.error('[SEO] ❌ SERPER_API_KEY não configurada');
      return [];
    }

    const results: SimilarCompanyBySEO[] = [];
    const domainScores = new Map<string, {
      sharedKeywords: Set<string>;
      ranking: number[];
    }>();

    // Buscar top 10 resultados para cada keyword (top 5 keywords)
    for (const keyword of keywords.slice(0, 5)) {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: keyword,
          num: 10,
          gl: 'br',
          hl: 'pt-br'
        })
      });

      if (!response.ok) continue;

      const data = await response.json();
      const organic = data.organic || [];

      // Processar resultados
      organic.forEach((result: any, index: number) => {
        const domain = new URL(result.link).hostname.replace('www.', '');
        
        if (domain === excludeDomain) return;

        if (!domainScores.has(domain)) {
          domainScores.set(domain, {
            sharedKeywords: new Set(),
            ranking: []
          });
        }

        const score = domainScores.get(domain)!;
        score.sharedKeywords.add(keyword);
        score.ranking.push(index + 1);
      });
    }

    // Calcular overlap score
    domainScores.forEach((score, domain) => {
      const overlapScore = Math.round((score.sharedKeywords.size / Math.min(keywords.length, 5)) * 100);
      const avgRanking = Math.round(score.ranking.reduce((a, b) => a + b, 0) / score.ranking.length);

      // 🚫 FILTRAR domínios inválidos
      const domainUrl = `https://${domain}`;
      if (!isValidCompanyDomain(domainUrl)) {
        console.log('[SEO] ⚠️ Domain rejeitado (portal/blog):', domain);
        return; // SKIP
      }

      // ⚡ AUMENTAR threshold: 60% (não 40%)
      if (overlapScore >= 60) { // Mínimo 60% de overlap (mais rigoroso!)
        results.push({
          name: domain.split('.')[0].toUpperCase(),
          domain,
          website: domainUrl,
          overlapScore,
          sharedKeywords: Array.from(score.sharedKeywords),
          uniqueKeywords: [],
          ranking: avgRanking
        });
      }
    });

    console.log('[SEO] ✅ Encontradas', results.length, 'empresas similares');
    return results
      .sort((a, b) => b.overlapScore - a.overlapScore)
      .slice(0, 20);

  } catch (error) {
    console.error('[SEO] ❌ Erro ao buscar empresas similares:', error);
    return [];
  }
}

/**
 * 🎯 ANÁLISE SEO COMPLETA DE UMA EMPRESA
 */
export async function analyzeSEOProfile(
  domain: string,
  companyName: string
): Promise<SEOProfile> {
  console.log('[SEO] 🎯 Análise completa:', companyName);

  const keywords = await extractKeywordsFromWebsite(domain);
  
  // Calcular content score (baseado em keywords relevantes)
  const contentScore = Math.min(
    (keywords.filter(k => k.relevance > 70).length / 10) * 100,
    100
  );

  return {
    domain,
    companyName,
    keywords,
    metaTags: {
      title: keywords.find(k => k.source === 'title')?.keyword,
      description: keywords.filter(k => k.source === 'meta').map(k => k.keyword).join(', '),
      keywords: keywords.slice(0, 10).map(k => k.keyword).join(', ')
    },
    topHeadings: keywords.filter(k => k.source === 'heading').slice(0, 10).map(k => k.keyword),
    contentScore
  };
}

/**
 * 🔥 FUNÇÃO MASTER: ANÁLISE SEO + EMPRESAS SIMILARES
 */
export async function performFullSEOAnalysis(
  domain: string,
  companyName: string
): Promise<{
  profile: SEOProfile;
  similarCompanies: SimilarCompanyBySEO[];
}> {
  console.log('[SEO] 🔥 Análise Master:', companyName);

  // 1. Extrair keywords da empresa
  const profile = await analyzeSEOProfile(domain, companyName);

  // 2. Buscar empresas similares
  const topKeywords = profile.keywords
    .filter(k => k.relevance > 60)
    .slice(0, 10)
    .map(k => k.keyword);

  const similarCompanies = await findCompaniesWithSimilarKeywords(topKeywords, domain);

  console.log('[SEO] ✅ Análise Master concluída!');
  console.log('[SEO] 📊', profile.keywords.length, 'keywords |', similarCompanies.length, 'empresas similares');

  return { profile, similarCompanies };
}

