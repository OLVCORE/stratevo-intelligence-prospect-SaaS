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
  businessType?: 'empresa' | 'vaga' | 'artigo' | 'perfil' | 'associacao' | 'educacional' | 'marketplace' | 'pdf' | 'reportagem' | 'outro';
}

// 🔥 DOMÍNIOS GENÉRICOS A EXCLUIR (não são empresas)
const GENERIC_DOMAINS = [
  // Redes sociais
  'linkedin.com', 'facebook.com', 'instagram.com', 'twitter.com', 'youtube.com',
  // Vagas/Recrutamento
  'glassdoor.com', 'indeed.com', 'vagas.com', 'catho.com', 'gupy.io',
  // Enciclopédias
  'wikipedia.org', 'wikimedia.org',
  // Governo
  'gov.br', '.gov.', 'receita.fazenda.gov.br',
  // Blogs/Plataformas de conteúdo
  'blogspot.com', 'wordpress.com', 'medium.com',
  // Associações
  'acate.com.br', 'abiquifi.org.br', 'abiquim.org.br',
  // Educacionais
  'insper.edu.br', 'espm.br', 'fia.com.br',
  // Portais de vagas
  'portalerp.com',
  // 🔥 NOVO: Marketplaces
  'ebay.com', 'ebay.es', 'ebay.com.br', 'ebay.co.uk',
  'amazon.com', 'amazon.com.br', 'amazon.co.uk',
  'mercadolivre.com.br', 'mercadolivre.com',
  'magazine-luiza.com.br', 'americanas.com.br', 'submarino.com.br',
  'casasbahia.com.br', 'extra.com.br', 'ponto.com.br',
  'shoptime.com.br', 'walmart.com.br',
  // 🔥 NOVO: PDFs e Documentos
  'pdfcoffee.com', 'anyflip.com', 'fliphtml5.com', 'issuu.com',
  'slideshare.net', 'scribd.com', 'docplayer.com.br',
  'pdfdrive.com', 'pdfhost.io',
  // 🔥 NOVO: Sites de notícias/reportagens
  'g1.com.br', 'uol.com.br', 'folha.com.br', 'estadao.com.br',
  'oglobo.com.br', 'exame.com', 'valor.com.br', 'infomoney.com.br',
  'abril.com.br', 'globo.com', 'r7.com',
  // 🔥 NOVO: Sites de estudos/pesquisas
  'scielo.org', 'scielo.br', 'researchgate.net', 'academia.edu',
  'scholar.google.com', 'pubmed.ncbi.nlm.nih.gov',
  // 🔥 NOVO: Sites de anúncios/classificados
  'olx.com.br', 'encontra.com.br', 'bomnegocio.com',
  // 🔥 NOVO: Sites de e-commerce genéricos (marketplaces)
  'shopee.com.br', 'alibaba.com', 'alibaba.com.br',
  'wish.com', 'wish.com.br', 'etsy.com',
];

// 🔥 PALAVRAS-CHAVE QUE INDICAM NÃO-EMPRESA
const NON_COMPANY_KEYWORDS = [
  // Vagas
  'vaga', 'vagas', 'oportunidade', 'trabalhe conosco', 'carreira', 'recrutamento',
  // Conteúdo/Artigos
  'artigo', 'blog', 'post', 'notícia', 'reportagem', 'matéria', 'publicação',
  'estudo', 'pesquisa', 'análise de mercado', 'tendências',
  // Educacional
  'curso', 'pós-graduação', 'mba', 'treinamento', 'capacitação', 'workshop',
  // Associações
  'associação', 'sindicato', 'federação', 'confederação',
  // Perfis
  'perfil', 'profile', 'linkedin.com/in',
  // Eventos
  'evento', 'feira', 'congresso', 'palestra', 'webinar',
  // 🔥 NOVO: PDFs e Documentos
  '.pdf', 'download pdf', 'baixar pdf', 'documento pdf',
  'ebook', 'manual', 'catálogo pdf', 'folheto',
  // 🔥 NOVO: Marketplaces/Anúncios
  'comprar online', 'loja online', 'e-commerce', 'marketplace',
  'anúncio', 'classificado', 'vender', 'comprar',
  // 🔥 NOVO: Reportagens/Notícias
  'reportagem', 'notícia', 'jornal', 'revista', 'publicação',
  'entrevista', 'cobertura', 'matéria especial',
  // 🔥 NOVO: Estudos/Pesquisas
  'estudo de caso', 'pesquisa acadêmica', 'tese', 'dissertação',
  'paper', 'artigo científico', 'publicação científica',
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
 * 🔥 MELHORADO: Filtros mais rigorosos para excluir marketplaces, PDFs, reportagens
 */
function detectBusinessType(
  title: string,
  snippet: string,
  url: string
): 'empresa' | 'vaga' | 'artigo' | 'perfil' | 'associacao' | 'educacional' | 'marketplace' | 'pdf' | 'reportagem' | 'outro' {
  const text = `${title} ${snippet} ${url}`.toLowerCase();
  const urlLower = url.toLowerCase();
  
  // 🔥 CRÍTICO: Verificar domínios genéricos primeiro
  if (GENERIC_DOMAINS.some(domain => urlLower.includes(domain))) {
    // Verificar se é marketplace
    if (urlLower.includes('ebay') || urlLower.includes('amazon') || 
        urlLower.includes('mercadolivre') || urlLower.includes('shopee') ||
        urlLower.includes('alibaba') || urlLower.includes('wish') ||
        urlLower.includes('magazine') || urlLower.includes('americanas') ||
        urlLower.includes('casasbahia') || urlLower.includes('extra') ||
        urlLower.includes('walmart') || urlLower.includes('olx')) {
      return 'marketplace';
    }
    // Verificar se é PDF
    if (urlLower.includes('pdfcoffee') || urlLower.includes('anyflip') ||
        urlLower.includes('fliphtml5') || urlLower.includes('issuu') ||
        urlLower.includes('slideshare') || urlLower.includes('scribd') ||
        urlLower.includes('docplayer') || urlLower.includes('pdfdrive') ||
        urlLower.includes('pdfhost') || urlLower.endsWith('.pdf')) {
      return 'pdf';
    }
    // Verificar se é reportagem/notícia
    if (urlLower.includes('g1') || urlLower.includes('uol') || 
        urlLower.includes('folha') || urlLower.includes('estadao') ||
        urlLower.includes('oglobo') || urlLower.includes('exame') ||
        urlLower.includes('valor') || urlLower.includes('infomoney') ||
        urlLower.includes('globo') || urlLower.includes('r7')) {
      return 'reportagem';
    }
    // Outros domínios genéricos
    return 'outro';
  }
  
  // 🔥 Verificar palavras-chave que indicam não-empresa
  if (NON_COMPANY_KEYWORDS.some(kw => text.includes(kw))) {
    // Vagas
    if (text.includes('vaga') || text.includes('oportunidade') || 
        text.includes('trabalhe') || text.includes('recrutamento') ||
        text.includes('carreira')) {
      return 'vaga';
    }
    // PDFs/Documentos
    if (text.includes('.pdf') || text.includes('download pdf') ||
        text.includes('baixar pdf') || text.includes('documento pdf') ||
        text.includes('ebook') || text.includes('manual') ||
        text.includes('catálogo pdf') || text.includes('folheto') ||
        urlLower.endsWith('.pdf')) {
      return 'pdf';
    }
    // Reportagens/Notícias
    if (text.includes('reportagem') || text.includes('notícia') ||
        text.includes('jornal') || text.includes('revista') ||
        text.includes('publicação') || text.includes('entrevista') ||
        text.includes('cobertura') || text.includes('matéria especial')) {
      return 'reportagem';
    }
    // Artigos/Blogs
    if (text.includes('artigo') || text.includes('blog') || 
        text.includes('post') || text.includes('publicação')) {
      return 'artigo';
    }
    // Estudos/Pesquisas
    if (text.includes('estudo de caso') || text.includes('pesquisa acadêmica') ||
        text.includes('tese') || text.includes('dissertação') ||
        text.includes('paper') || text.includes('artigo científico') ||
        text.includes('publicação científica')) {
      return 'artigo';
    }
    // Marketplaces/Anúncios
    if (text.includes('comprar online') || text.includes('loja online') ||
        text.includes('e-commerce') || text.includes('marketplace') ||
        text.includes('anúncio') || text.includes('classificado') ||
        text.includes('vender') || text.includes('comprar')) {
      return 'marketplace';
    }
    // Educacional
    if (text.includes('curso') || text.includes('mba') || 
        text.includes('pós-graduação') || text.includes('workshop')) {
      return 'educacional';
    }
    // Associações
    if (text.includes('associação') || text.includes('sindicato') ||
        text.includes('federação') || text.includes('confederação')) {
      return 'associacao';
    }
    // Perfis
    if (text.includes('linkedin.com/in') || text.includes('perfil') ||
        text.includes('profile')) {
      return 'perfil';
    }
  }
  
  // 🔥 Verificar se é empresa real (apenas se passou todos os filtros)
  if (COMPANY_KEYWORDS.some(kw => text.includes(kw))) {
    return 'empresa';
  }
  
  // Se não passou em nenhum filtro, mas tem estrutura de URL de empresa (.com.br, etc.)
  if (urlLower.match(/\.com\.br$|\.com$|\.net\.br$|\.org\.br$/) && 
      !urlLower.includes('blog') && !urlLower.includes('wiki') &&
      !urlLower.includes('gov') && !urlLower.includes('edu')) {
    // Verificar se tem palavras que indicam empresa
    if (text.includes('empresa') || text.includes('ltda') || 
        text.includes('soluções') || text.includes('serviços') ||
        text.includes('consultoria') || text.includes('fornecedor')) {
      return 'empresa';
    }
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
  
  // 🔥 CRÍTICO: Similaridade de produtos/serviços (peso: 60% - AUMENTADO)
  // Usar TODOS os produtos do tenant, não apenas os 5 primeiros
  let productMatches = 0;
  let exactProductMatches = 0;
  
  for (const product of targetProducts) { // 🔥 USAR TODOS OS PRODUTOS
    const productLower = product.toLowerCase().trim();
    
    // Match exato do produto completo (peso maior)
    if (text.includes(productLower)) {
      exactProductMatches++;
      score += 15; // 🔥 AUMENTADO: +15 pontos por produto encontrado (era 8)
      productMatches++;
    } else {
      // Match parcial: buscar palavras-chave do produto
      const productWords = productLower.split(/\s+/).filter(w => w.length > 2);
      let matchedWords = 0;
      
      for (const word of productWords) {
        if (word.length > 3 && text.includes(word)) {
          matchedWords++;
        }
      }
      
      // Se encontrou pelo menos 50% das palavras do produto, considerar match parcial
      if (matchedWords > 0 && productWords.length > 0) {
        const matchRatio = matchedWords / productWords.length;
        if (matchRatio >= 0.5) {
          productMatches++;
          score += Math.round(8 * matchRatio); // Peso proporcional ao match
        } else if (matchRatio >= 0.3) {
          score += Math.round(4 * matchRatio); // Match fraco, peso menor
        }
      }
    }
  }
  
  // Bonus se encontrou múltiplos produtos
  if (exactProductMatches >= 2) {
    score += 10; // Bonus por múltiplos matches
  }
  if (exactProductMatches >= 3) {
    score += 5; // Bonus adicional
  }
  
  // Palavras-chave de negócio genéricas (peso: 10% - REDUZIDO)
  // 🔥 REMOVIDO: Termos hardcoded específicos (Supply Chain, Comex, etc.)
  // Agora usa apenas termos genéricos que podem aparecer em qualquer setor
  const genericKeywords = [
    'consultoria', 'soluções', 'serviços', 'empresa', 'fornecedor',
    'gestão', 'estratégia', 'compliance', 'governança'
  ];
  
  let genericScore = 0;
  for (const kw of genericKeywords) {
    if (text.includes(kw)) {
      genericScore += 1;
    }
  }
  genericScore = Math.min(genericScore, 10); // Máximo 10 pontos
  
  score += genericScore;
  
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
  
  // 🔥 PENALIZAR tipos não-empresa (MELHORADO: inclui marketplace, pdf, reportagem)
  let typePenalty = 0;
  if (businessType === 'vaga' || businessType === 'artigo' || businessType === 'perfil' ||
      businessType === 'marketplace' || businessType === 'pdf' || businessType === 'reportagem') {
    typePenalty = -100; // 🔥 Penalidade máxima (excluir completamente)
  } else if (businessType === 'associacao' || businessType === 'educacional') {
    typePenalty = -50; // Penalidade alta
  } else if (businessType !== 'empresa') {
    typePenalty = -30; // Penalidade para outros tipos não-empresa
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
  
  // 🔥 MELHORADO: Verificar produtos específicos no título (peso maior)
  let productMatchesInTitle = 0;
  for (const product of products.slice(0, 10)) {
    const productLower = product.toLowerCase();
    if (titleLower.includes(productLower)) {
      productMatchesInTitle++;
      relevancia += 8; // +8 pontos por produto encontrado no título (era +5 genérico)
    }
  }
  
  // Bonus se encontrou múltiplos produtos no título
  if (productMatchesInTitle >= 2) {
    relevancia += 5;
  }
  
  // Palavras-chave no snippet (peso: 10%)
  // 🔥 MELHORADO: Verificar se produtos específicos do tenant aparecem no snippet
  const snippetLower = result.snippet.toLowerCase();
  
  // Verificar produtos específicos no snippet (peso maior)
  let productMatchesInSnippet = 0;
  for (const product of products.slice(0, 5)) {
    if (snippetLower.includes(product.toLowerCase())) {
      productMatchesInSnippet++;
      relevancia += 5; // +5 pontos por produto encontrado no snippet
    }
  }
  
  // Termos genéricos (peso menor)
  if (snippetLower.includes('consultoria') || snippetLower.includes('soluções')) relevancia += 3;
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

    // 🔥 MELHORADO: Múltiplas queries usando TODOS os produtos do tenant dinamicamente
    // Usar mais produtos (até 15) para melhor cobertura
    const productsToUse = products.slice(0, 15);
    
    // 🔥 NOVO: Extrair palavras-chave principais dos produtos para queries mais específicas
    const extractKeywords = (productList: string[]): string[] => {
      const keywords = new Set<string>();
      for (const product of productList) {
        const words = product.toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 3)
          .filter(w => !['para', 'com', 'sem', 'sobre', 'sobre', 'através'].includes(w));
        words.forEach(w => keywords.add(w));
      }
      return Array.from(keywords).slice(0, 10);
    };
    
    const productKeywords = extractKeywords(productsToUse);
    
    // 🔥 MELHORADO: Construir queries mais variadas e específicas
    // ESTRATÉGIA: Criar queries que variem produtos, termos e combinações
    const queries: string[] = [];
    
    // Query 1: Primeiros 3 produtos + consultoria (alta especificidade)
    if (productsToUse.length >= 3) {
      queries.push(`"${productsToUse[0]}" OR "${productsToUse[1]}" OR "${productsToUse[2]}" consultoria Brasil`);
    }
    
    // Query 2: Produtos 4-6 + fornecedor (variação de produtos)
    if (productsToUse.length >= 6) {
      queries.push(`"${productsToUse[3]}" OR "${productsToUse[4]}" OR "${productsToUse[5]}" fornecedor soluções Brasil`);
    }
    
    // Query 3: Indústria + primeiros 2 produtos (combinação indústria+produtos)
    if (productsToUse.length >= 2 && industry) {
      queries.push(`${industry} "${productsToUse[0]}" OR "${productsToUse[1]}" empresa Brasil`);
    }
    
    // Query 4: Palavras-chave dos produtos + consultoria especializada
    if (productKeywords.length >= 3) {
      queries.push(`${productKeywords.slice(0, 3).join(' OR ')} consultoria especializada Brasil`);
    }
    
    // Query 5: Produtos relacionados (ex: Importação + Exportação)
    if (productsToUse.length >= 2) {
      // Buscar produtos que contenham palavras relacionadas
      const importExport = productsToUse.filter(p => 
        p.toLowerCase().includes('import') || p.toLowerCase().includes('export') || 
        p.toLowerCase().includes('comércio exterior') || p.toLowerCase().includes('supply chain')
      );
      if (importExport.length >= 2) {
        queries.push(`"${importExport[0]}" AND "${importExport[1]}" consultoria Brasil`);
      }
    }
    
    // Query 6: Produtos de consultoria (se houver múltiplos)
    const consultoriaProducts = productsToUse.filter(p => 
      p.toLowerCase().includes('consultoria') || p.toLowerCase().includes('consulting')
    );
    if (consultoriaProducts.length >= 2) {
      queries.push(`${consultoriaProducts.slice(0, 2).map(p => `"${p}"`).join(' OR ')} empresa Brasil`);
    }
    
    // Query 7: Produtos + termos de negócio (variação de termos)
    if (productsToUse.length >= 3) {
      queries.push(`${productsToUse.slice(0, 3).map(p => `"${p}"`).join(' OR ')} (empresa OR fornecedor OR soluções) Brasil`);
    }
    
    // Query 8: Produtos + supply chain/logística (se aplicável)
    const supplyChainProducts = productsToUse.filter(p => 
      p.toLowerCase().includes('supply') || p.toLowerCase().includes('logística') || 
      p.toLowerCase().includes('logistica') || p.toLowerCase().includes('chain')
    );
    if (supplyChainProducts.length > 0) {
      queries.push(`${supplyChainProducts.slice(0, 2).map(p => `"${p}"`).join(' OR ')} consultoria especializada Brasil`);
    }
    
    // Query 9: Produtos + compliance/governança (se aplicável)
    const complianceProducts = productsToUse.filter(p => 
      p.toLowerCase().includes('compliance') || p.toLowerCase().includes('governança') ||
      p.toLowerCase().includes('governanca') || p.toLowerCase().includes('riscos')
    );
    if (complianceProducts.length > 0) {
      queries.push(`${complianceProducts.slice(0, 2).map(p => `"${p}"`).join(' OR ')} consultoria Brasil`);
    }
    
    // Query 10: Fallback - Primeiros 5 produtos genéricos (se não houver queries específicas)
    if (queries.length === 0 && productsToUse.length > 0) {
      queries.push(`${productsToUse.slice(0, 5).map(p => `"${p}"`).join(' OR ')} consultoria empresa Brasil`);
    }

    if (location && location !== 'Brasil') {
      queries.push(`${productsToUse.slice(0, 3).map(p => `"${p}"`).join(' OR ')} ${location} consultoria`);
    }
    
    console.log('[SERPER Search] 📦 Produtos usados na busca:', productsToUse.length, 'produtos');
    console.log('[SERPER Search] 📋 Primeiros produtos:', productsToUse.slice(0, 5));
    console.log('[SERPER Search] 🔑 Palavras-chave extraídas:', productKeywords.slice(0, 5));
    console.log('[SERPER Search] 🏭 Indústria recebida:', industry);
    console.log('[SERPER Search] 📍 Localização recebida:', location);
    console.log('[SERPER Search] 🔢 Total de queries geradas:', queries.length);
    console.log('[SERPER Search] 📝 Queries completas:');
    queries.forEach((q, idx) => {
      console.log(`  ${idx + 1}. ${q}`);
    });

    const allResults: SerperResult['organic'] = [];
    const seenDomains = new Set<string>();

    // Executar todas as queries
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      try {
        console.log(`[SERPER Search] 🔍 Query ${i + 1}/${queries.length}:`, query);
        
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
                num: Math.max(20, maxResults * 3), // 🔥 AUMENTADO: Pegar mais resultados para filtrar melhor
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

        // 🔥 MELHORADO: Filtrar com threshold mais baixo mas verificar produtos
        // Se encontrou produtos específicos, aceitar mesmo com relevância menor
        const hasProductMatch = products.some((p: string) => {
          const productLower = p.toLowerCase();
          const text = `${result.title} ${result.snippet}`.toLowerCase();
          return text.includes(productLower);
        });
        
        // Threshold dinâmico: mais baixo se encontrou produtos, mais alto se não encontrou
        const minRelevancia = hasProductMatch ? 25 : 40;
        
        // 🔥 MELHORADO: Filtrar todos os tipos não-empresa
        const nonCompanyTypes = ['vaga', 'artigo', 'perfil', 'marketplace', 'pdf', 'reportagem', 'associacao', 'educacional'];
        if (relevancia < minRelevancia || (businessType && nonCompanyTypes.includes(businessType))) {
          console.log(`[SERPER Search] ❌ Filtrado: ${result.title} (${businessType}, relevância: ${relevancia}, min: ${minRelevancia}, hasProduct: ${hasProductMatch})`);
          continue;
        }
        
        // 🔥 CRÍTICO: Aceitar apenas empresas reais
        if (businessType !== 'empresa') {
          console.log(`[SERPER Search] ❌ Filtrado (não é empresa): ${result.title} (${businessType})`);
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
    console.log('[SERPER Search] 📊 Estatísticas:', {
      totalCandidates: candidates.length,
      finalCandidates: finalCandidates.length,
      totalResults: allResults.length,
      filtered: allResults.length - candidates.length,
      queriesExecuted: queries.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        query: queries[0],
        candidates: finalCandidates,
        total: candidates.length,
        totalFound: candidates.length, // 🔥 CORRIGIDO: Adicionar campo esperado pelo frontend
        queriesExecuted: queries.length, // 🔥 CORRIGIDO: Adicionar campo esperado pelo frontend
        filtered: allResults.length - candidates.length,
        debug: {
          productsUsed: productsToUse.length,
          industry,
          location,
          queriesGenerated: queries.length,
          totalResults: allResults.length,
          candidatesBeforeFilter: candidates.length,
        },
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
