/**
 * 🔍 Busca de Concorrentes e Fornecedores via SERPER API
 * 🚀 VERSÃO MELHORADA: Similaridade de Websites (Semrush/SimilarWeb style)
 * Edge Function para descobrir concorrentes automaticamente
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface SerperResult {
  organic: Array<{
    title: string;
    link: string;
    snippet: string;
    position: number;
  }>;
}

interface CompetitorCandidate {
  nome: string;
  website: string;
  descricao: string;
  relevancia: number;
  fonte: 'serper';
  similarityScore?: number; // Score de similaridade de website (0-100)
  businessType?: 'empresa' | 'vaga' | 'artigo' | 'perfil' | 'associacao' | 'educacional' | 'outro';
}

// 🔥 DOMÍNIOS GENÉRICOS A EXCLUIR (não são empresas)
const GENERIC_DOMAINS = [
  'linkedin.com', 'facebook.com', 'instagram.com', 'twitter.com', 'youtube.com',
  'glassdoor.com', 'indeed.com', 'vagas.com', 'catho.com', 'gupy.io',
  'wikipedia.org', 'wikimedia.org',
  'gov.br', '.gov.', 'receita.fazenda.gov.br',
  'blogspot.com', 'wordpress.com', 'medium.com',
  'acate.com.br', 'abiquifi.org.br', 'abiquim.org.br', // Associações
  'insper.edu.br', 'espm.br', 'fia.com.br', // Educacionais
  'portalerp.com', // Portal de vagas
];

// 🔥 PALAVRAS-CHAVE QUE INDICAM NÃO-EMPRESA
const NON_COMPANY_KEYWORDS = [
  'vaga', 'vagas', 'oportunidade', 'trabalhe conosco', 'carreira',
  'artigo', 'blog', 'post', 'notícia', 'reportagem',
  'curso', 'pós-graduação', 'mba', 'treinamento', 'capacitação',
  'associação', 'sindicato', 'federação',
  'perfil', 'profile', 'linkedin.com/in',
  'evento', 'feira', 'congresso', 'palestra',
];

// 🔥 PALAVRAS-CHAVE QUE INDICAM EMPRESA REAL
const COMPANY_KEYWORDS = [
  'consultoria', 'soluções', 'serviços', 'empresa', 'ltda', 'sa',
  'fabricante', 'fornecedor', 'distribuidor', 'importadora', 'exportadora',
  'comércio exterior', 'supply chain', 'logística',
  'site oficial', 'website oficial', 'empresa',
];

/**
 * Detecta tipo de negócio baseado em título, snippet e URL
 */
function detectBusinessType(
  title: string,
  snippet: string,
  url: string
): 'empresa' | 'vaga' | 'artigo' | 'perfil' | 'associacao' | 'educacional' | 'outro' {
  const text = `${title} ${snippet} ${url}`.toLowerCase();
  
  // Verificar se é vaga
  if (NON_COMPANY_KEYWORDS.some(kw => text.includes(kw))) {
    if (text.includes('vaga') || text.includes('oportunidade') || text.includes('trabalhe')) {
      return 'vaga';
    }
    if (text.includes('artigo') || text.includes('blog') || text.includes('post')) {
      return 'artigo';
    }
    if (text.includes('curso') || text.includes('mba') || text.includes('pós-graduação')) {
      return 'educacional';
    }
    if (text.includes('associação') || text.includes('sindicato')) {
      return 'associacao';
    }
    if (text.includes('linkedin.com/in') || text.includes('perfil')) {
      return 'perfil';
    }
  }
  
  // Verificar se é empresa real
  if (COMPANY_KEYWORDS.some(kw => text.includes(kw))) {
    return 'empresa';
  }
  
  return 'outro';
}

/**
 * Calcula similaridade semântica de serviços/produtos usando análise de texto
 */
function calculateSemanticSimilarity(
  targetIndustry: string,
  targetProducts: string[],
  candidateTitle: string,
  candidateSnippet: string
): number {
  let score = 0;
  const text = `${candidateTitle} ${candidateSnippet}`.toLowerCase();
  const industryLower = targetIndustry.toLowerCase();
  
  // Similaridade de indústria (peso: 30%)
  if (text.includes(industryLower)) {
    score += 30;
  } else {
    // Buscar palavras-chave relacionadas
    const industryWords = industryLower.split(/\s+/);
    const matchedWords = industryWords.filter(word => 
      word.length > 3 && text.includes(word)
    );
    if (matchedWords.length > 0) {
      score += (matchedWords.length / industryWords.length) * 20;
    }
  }
  
  // Similaridade de produtos/serviços (peso: 40%)
  let productMatches = 0;
  for (const product of targetProducts.slice(0, 5)) {
    const productLower = product.toLowerCase();
    if (text.includes(productLower)) {
      productMatches++;
      score += 8; // +8 pontos por produto encontrado
    } else {
      // Buscar palavras-chave do produto
      const productWords = productLower.split(/\s+/);
      const matchedProductWords = productWords.filter(word => 
        word.length > 3 && text.includes(word)
      );
      if (matchedProductWords.length > 0) {
        score += (matchedProductWords.length / productWords.length) * 4;
      }
    }
  }
  
  // Palavras-chave de negócio (peso: 20%)
  const businessKeywords = [
    'consultoria', 'soluções', 'serviços', 'comércio exterior',
    'supply chain', 'logística', 'importação', 'exportação',
    'gestão', 'estratégia', 'compliance', 'governança'
  ];
  const matchedBusiness = businessKeywords.filter(kw => text.includes(kw));
  score += (matchedBusiness.length / businessKeywords.length) * 20;
  
  // Estrutura de empresa (peso: 10%)
  if (text.includes('empresa') || text.includes('ltda') || text.includes('sa')) {
    score += 10;
  }
  
  return Math.min(100, Math.round(score));
}

/**
 * Calcula relevância completa (posição + similaridade + filtros)
 */
function calculateRelevance(
  result: SerperResult['organic'][0],
  industry: string,
  products: string[],
  location?: string
): { relevancia: number; similarityScore: number; businessType: CompetitorCandidate['businessType'] } {
  const businessType = detectBusinessType(result.title, result.snippet, result.link);
  
  // 🔥 PENALIZAR tipos não-empresa
  let typePenalty = 0;
  if (businessType === 'vaga' || businessType === 'artigo' || businessType === 'perfil') {
    typePenalty = -50; // Penalidade alta
  } else if (businessType === 'associacao' || businessType === 'educacional') {
    typePenalty = -30; // Penalidade média
  }
  
  // Base: posição no Google (peso: 25%)
  let relevancia = Math.max(0, 100 - (result.position * 3)); // 1º = 97, 2º = 94, etc.
  
  // Similaridade semântica (peso: 50%)
  const similarityScore = calculateSemanticSimilarity(
    industry,
    products,
    result.title,
    result.snippet
  );
  relevancia += (similarityScore * 0.5); // 50% do peso
  
  // Palavras-chave no título (peso: 15%)
  const titleLower = result.title.toLowerCase();
  if (titleLower.includes(industry.toLowerCase())) relevancia += 10;
  if (products.some((p: string) => titleLower.includes(p.toLowerCase()))) relevancia += 5;
  
  // Palavras-chave no snippet (peso: 10%)
  const snippetLower = result.snippet.toLowerCase();
  if (snippetLower.includes('consultoria') || snippetLower.includes('soluções')) relevancia += 5;
  if (snippetLower.includes('comércio exterior') || snippetLower.includes('supply chain')) relevancia += 5;
  if (location && snippetLower.includes(location.toLowerCase())) relevancia += 3;
  
  // Aplicar penalidade de tipo
  relevancia += typePenalty;
  
  return {
    relevancia: Math.max(0, Math.min(100, Math.round(relevancia))),
    similarityScore,
    businessType
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      industry, 
      products = [], 
      location, 
      excludeDomains = [],
      maxResults = 10 
    } = await req.json();

    console.log('[SERPER Search] 🚀 Iniciando busca melhorada:', { industry, products, location, maxResults });

    const serperApiKey = Deno.env.get('SERPER_API_KEY');
    if (!serperApiKey) {
      throw new Error('SERPER_API_KEY não configurada');
    }

    // 🔥 MELHORADO: Múltiplas queries mais específicas
    const queries = [
      // Query 1: Empresa + Indústria + Produtos
      `${industry} ${products.slice(0, 3).join(' OR ')} empresa consultoria Brasil`,
      // Query 2: Consultoria especializada
      `consultoria ${industry} ${products.slice(0, 2).join(' OR ')} Brasil`,
      // Query 3: Serviços específicos
      `${products.slice(0, 2).join(' OR ')} ${industry} serviços soluções Brasil`,
    ];

    if (location && location !== 'Brasil') {
      queries.push(`${industry} ${products[0] || ''} ${location} consultoria`);
    }

    const allResults: SerperResult['organic'] = [];
    const seenDomains = new Set<string>();

    // Executar todas as queries
    for (const query of queries) {
      try {
        console.log('[SERPER Search] 🔍 Query:', query);
        
        const serperResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: query,
            gl: 'br',
            hl: 'pt',
            num: Math.max(10, maxResults * 2), // Pegar mais resultados
          }),
        });

        if (!serperResponse.ok) {
          console.warn('[SERPER Search] ⚠️ Erro na query:', query, serperResponse.status);
          continue;
        }

        const serperData: SerperResult = await serperResponse.json();
        const results = serperData.organic || [];
        
        // Adicionar resultados únicos
        for (const result of results) {
          try {
            const url = new URL(result.link);
            const domain = url.hostname.replace('www.', '');
            
            if (!seenDomains.has(domain)) {
              seenDomains.add(domain);
              allResults.push(result);
            }
          } catch {
            continue;
          }
        }
      } catch (error) {
        console.error('[SERPER Search] ❌ Erro na query:', query, error);
        continue;
      }
    }

    console.log('[SERPER Search] 📊 Total de resultados únicos:', allResults.length);

    // Processar e filtrar resultados
    const candidates: CompetitorCandidate[] = [];

    for (const result of allResults) {
      try {
        // Extrair domínio
        const url = new URL(result.link);
        const domain = url.hostname.replace('www.', '');

        // Filtrar domínios excluídos
        if (excludeDomains.some(excluded => domain.includes(excluded))) {
          continue;
        }

        // Filtrar domínios genéricos
        if (GENERIC_DOMAINS.some(generic => domain.includes(generic))) {
          continue;
        }

        // Filtrar marketplaces
        const isMarketplace = [
          'mercadolivre', 'amazon', 'alibaba', 'aliexpress',
          'americanas', 'magazineluiza', 'casasbahia', 'pontofrio',
        ].some(m => domain.includes(m));

        if (isMarketplace) continue;

        // Calcular relevância e similaridade
        const { relevancia, similarityScore, businessType } = calculateRelevance(
          result,
          industry,
          products,
          location
        );

        // 🔥 FILTRAR: Apenas empresas com relevância mínima
        if (relevancia < 30 || businessType === 'vaga' || businessType === 'artigo' || businessType === 'perfil') {
          console.log(`[SERPER Search] ❌ Filtrado: ${result.title} (${businessType}, relevância: ${relevancia})`);
          continue;
        }

        // Extrair nome da empresa do título (remover sufixos comuns)
        let nome = result.title
          .replace(/\s*-\s*(Vaga|Oportunidade|Trabalhe|Carreira).*$/i, '')
          .replace(/\s*\|\s*.*$/, '')
          .trim();

        candidates.push({
          nome,
          website: result.link,
          descricao: result.snippet,
          relevancia,
          similarityScore,
          businessType,
          fonte: 'serper',
        });

      } catch (error) {
        console.error('[SERPER Search] ❌ Erro ao processar resultado:', error);
        continue;
      }
    }

    // Ordenar por relevância (similaridade tem peso maior)
    candidates.sort((a, b) => {
      // Priorizar empresas reais
      if (a.businessType === 'empresa' && b.businessType !== 'empresa') return -1;
      if (b.businessType === 'empresa' && a.businessType !== 'empresa') return 1;
      
      // Depois por relevância
      if (b.relevancia !== a.relevancia) {
        return b.relevancia - a.relevancia;
      }
      
      // Por último por similaridade
      return (b.similarityScore || 0) - (a.similarityScore || 0);
    });

    const finalCandidates = candidates.slice(0, maxResults);
    console.log('[SERPER Search] ✅ Candidatos finais:', finalCandidates.length);

    return new Response(
      JSON.stringify({
        success: true,
        query: queries[0],
        candidates: finalCandidates,
        total: candidates.length,
        filtered: allResults.length - candidates.length,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('[SERPER Search] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro desconhecido' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
