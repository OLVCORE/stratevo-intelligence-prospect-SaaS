/**
 * 🔍 Busca de Concorrentes e Fornecedores via SERPER API
 * 🚀 VERSÃO MELHORADA: Similaridade de Websites (Semrush/SimilarWeb style)
 * Edge Function para descobrir concorrentes automaticamente
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
 * 🔥 MELHORADO: Calcula similaridade semântica com foco em produtos específicos
 * Rankeamento baseado no número de produtos específicos encontrados
 */
function calculateSemanticSimilarity(
  targetIndustry: string,
  targetProducts: string[],
  candidateTitle: string,
  candidateSnippet: string
): { score: number; productMatches: number; exactMatches: number } {
  let score = 0;
  const text = `${candidateTitle} ${candidateSnippet}`.toLowerCase();
  const industryLower = targetIndustry.toLowerCase();
  
  // 🔥 DINÂMICO: Detectar termos específicos dos produtos do tenant (SEM hardcoding)
  // Se os produtos do tenant mencionam termos específicos, dar bonus para candidatos que também têm
  const candidateText = `${candidateTitle} ${candidateSnippet}`.toLowerCase();
  
  // Verificar se os produtos do tenant têm termos específicos e se o candidato também tem
  for (const product of targetProducts.slice(0, 10)) {
    const productLower = product.toLowerCase();
    // Se o produto tem termos específicos (mais de 2 palavras), dar bonus se candidato também tem
    const productWords = productLower.split(/\s+/).filter(w => w.length > 3);
    if (productWords.length >= 2) {
      // Verificar se pelo menos 2 palavras do produto aparecem no candidato
      const matchedWords = productWords.filter(word => candidateText.includes(word));
      if (matchedWords.length >= 2) {
        score += 10; // Bonus por termos específicos encontrados
      }
    }
  }
  
  // 🔥 REDUZIDO: Similaridade de indústria (peso: 15% - era 30%)
  // Menos peso porque indústria pode ser genérica
  if (text.includes(industryLower)) {
    score += 15;
  } else {
    const industryWords = industryLower.split(/\s+/);
    const matchedWords = industryWords.filter(word => 
      word.length > 3 && text.includes(word)
    );
    if (matchedWords.length > 0) {
      score += (matchedWords.length / industryWords.length) * 10;
    }
  }
  
  // 🔥 CRÍTICO: Similaridade de produtos/serviços (peso: 70% - AUMENTADO de 60%)
  // Usar TODOS os produtos do tenant e contar matches exatos
  let productMatches = 0;
  let exactProductMatches = 0;
  let partialProductMatches = 0;
  
  // Filtrar termos genéricos dos produtos para evitar matches falsos
  const genericProductTerms = ['consultoria', 'soluções', 'serviços', 'empresa', 'fornecedor'];
  
  for (const product of targetProducts) { // 🔥 USAR TODOS OS PRODUTOS
    const productLower = product.toLowerCase().trim();
    
    // 🔥 AJUSTADO: Ignorar apenas produtos muito genéricos (1 palavra)
    const productWords = productLower.split(/\s+/).filter(w => w.length > 2);
    if (productWords.length < 1) continue; // Apenas 1 palavra mínima (era 2)
    
    // 🔥 AJUSTADO: Verificar se produto não é apenas termo genérico (mais permissivo)
    const isGeneric = genericProductTerms.some(term => 
      productLower === term || productLower === `${term} em` || productLower === `${term} de`
    );
    if (isGeneric && productWords.length < 2) continue; // Reduzido de 3 para 2
    
    // Match exato do produto completo (peso MUITO maior)
    if (text.includes(productLower)) {
      exactProductMatches++;
      score += 25; // 🔥 AUMENTADO: +25 pontos por produto encontrado (era 15)
      productMatches++;
    } else {
      // Match parcial: buscar palavras-chave do produto
      let matchedWords = 0;
      let importantWordsMatched = 0;
      
      // Identificar palavras importantes (não genéricas)
      const importantWords = productWords.filter(w => 
        w.length > 3 && !genericProductTerms.includes(w)
      );
      
      for (const word of productWords) {
        if (word.length > 3 && text.includes(word)) {
          matchedWords++;
          if (importantWords.includes(word)) {
            importantWordsMatched++;
          }
        }
      }
      
      // Se encontrou pelo menos 60% das palavras importantes, considerar match parcial
      if (importantWords.length > 0 && importantWordsMatched > 0) {
        const matchRatio = importantWordsMatched / importantWords.length;
        if (matchRatio >= 0.6) {
          partialProductMatches++;
          productMatches++;
          score += Math.round(15 * matchRatio); // Peso proporcional ao match
        } else if (matchRatio >= 0.4) {
          score += Math.round(8 * matchRatio); // Match fraco, peso menor
        }
      } else if (matchedWords > 0 && productWords.length > 0) {
        // Fallback: usar todas as palavras se não houver palavras importantes
        const matchRatio = matchedWords / productWords.length;
        if (matchRatio >= 0.5) {
          partialProductMatches++;
          productMatches++;
          score += Math.round(10 * matchRatio);
        }
      }
    }
  }
  
  // 🔥 BONUS ESCALONADO: Mais produtos = mais bonus
  if (exactProductMatches >= 5) {
    score += 30; // Bonus máximo para 5+ produtos
  } else if (exactProductMatches >= 4) {
    score += 25;
  } else if (exactProductMatches >= 3) {
    score += 20;
  } else if (exactProductMatches >= 2) {
    score += 15;
  }
  
  // Bonus adicional para múltiplos matches parciais
  if (partialProductMatches >= 3) {
    score += 10;
  }
  
  // 🔥 REDUZIDO: Palavras-chave genéricas (peso: 5% - era 10%)
  // Muito menos peso para termos genéricos
  const genericKeywords = [
    'consultoria', 'soluções', 'serviços', 'empresa', 'fornecedor',
    'gestão', 'estratégia', 'compliance', 'governança'
  ];
  
  let genericScore = 0;
  for (const kw of genericKeywords) {
    if (text.includes(kw)) {
      genericScore += 0.5; // 🔥 REDUZIDO: 0.5 pontos por termo genérico (era 1)
    }
  }
  genericScore = Math.min(genericScore, 5); // Máximo 5 pontos (era 10)
  
  score += genericScore;
  
  // Estrutura de empresa (peso: 5% - reduzido)
  if (text.includes('empresa') || text.includes('ltda') || text.includes('sa')) {
    score += 5;
  }
  
  return {
    score: Math.min(100, Math.round(score)),
    productMatches,
    exactMatches: exactProductMatches
  };
}

/**
 * 🔥 NOVO: Gera embedding usando OpenAI
 */
async function generateEmbedding(text: string, openaiKey: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      console.warn('[Embeddings] ⚠️ Erro ao gerar embedding:', response.status);
      return [];
    }

    const data = await response.json();
    return data.data[0]?.embedding || [];
  } catch (error) {
    console.warn('[Embeddings] ⚠️ Erro ao gerar embedding:', error);
    return [];
  }
}

/**
 * 🔥 NOVO: Calcula similaridade de cosseno entre dois vetores
 */
function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length === 0 || vec2.length === 0 || vec1.length !== vec2.length) {
    return 0;
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * 🔥 NOVO: Classifica empresa por indústria usando OpenAI
 */
async function classifyIndustry(
  title: string,
  snippet: string,
  openaiKey: string
): Promise<string[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: 'Você é um especialista em classificação de empresas por indústria. Retorne APENAS um JSON válido com o formato: {"industries": ["indústria1", "indústria2"]}. Use termos em português brasileiro. Se não conseguir identificar, retorne array vazio.'
        }, {
          role: 'user',
          content: `Classifique a empresa por indústria(s). Título: ${title}\nDescrição: ${snippet}`
        }],
        temperature: 0.1,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      console.warn('[ClassifyIndustry] ⚠️ Erro ao classificar indústria:', response.status);
      return [];
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '{}';
    
    try {
      const parsed = JSON.parse(content);
      return parsed.industries || [];
    } catch {
      return [];
    }
  } catch (error) {
    console.warn('[ClassifyIndustry] ⚠️ Erro ao classificar indústria:', error);
    return [];
  }
}

/**
 * 🔥 NOVO: Calcula match de indústria
 */
function calculateIndustryMatch(
  targetIndustry: string,
  candidateIndustries: string[]
): number {
  if (candidateIndustries.length === 0) return 0;
  
  const targetLower = targetIndustry.toLowerCase();
  for (const industry of candidateIndustries) {
    const industryLower = industry.toLowerCase();
    if (industryLower.includes(targetLower) || targetLower.includes(industryLower)) {
      return 100; // Match perfeito
    }
    // Match parcial
    const targetWords = targetLower.split(/\s+/);
    const industryWords = industryLower.split(/\s+/);
    const commonWords = targetWords.filter(w => industryWords.includes(w) && w.length > 3);
    if (commonWords.length > 0) {
      return 50; // Match parcial
    }
  }
  return 0;
}

/**
 * 🔥 NOVO: Calcula match geográfico
 */
function calculateGeographicMatch(
  targetLocation: string | undefined,
  candidateUrl: string
): number {
  if (!targetLocation || targetLocation === 'Brasil') return 50; // Neutro se não especificado
  
  const locationLower = targetLocation.toLowerCase();
  const urlLower = candidateUrl.toLowerCase();
  
  // Extrair estado/cidade do location
  const locationParts = locationLower.split(',').map(p => p.trim());
  
  for (const part of locationParts) {
    if (urlLower.includes(part)) {
      return 100; // Match perfeito
    }
  }
  
  return 0;
}

/**
 * 🔥 NOVO: Calcula autoridade do domínio (baseado em posição no Google)
 */
function calculateDomainAuthority(position: number): number {
  // Posição 1 = 100, posição 10 = 10, posição 20+ = 0
  if (position <= 1) return 100;
  if (position <= 5) return 80;
  if (position <= 10) return 60;
  if (position <= 20) return 40;
  return 20;
}

/**
 * 🔥 REFEITO: Filtros Universais para Validar Concorrentes (funciona para QUALQUER setor)
 * Baseado no prompt cirúrgico universal - VERSÃO CORRIGIDA
 */
interface FilterContext {
  tenantDomain: string;
  tenantName: string;
}

function isValidCompetitor(result: SerperResult['organic'][0], context: FilterContext): boolean {
  const url = (result.link || '').toLowerCase();
  const title = (result.title || '').toLowerCase();
  const snippet = (result.snippet || '').toLowerCase();
  const fullText = `${title} ${snippet}`;
  
  // ============================================
  // FILTRO 1: Blacklist Universal de Domínios (EXPANDIDO)
  // ============================================
  const universalBlacklist = [
    // Redes sociais
    'facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com',
    'youtube.com', 'tiktok.com', 'pinterest.com', 'reddit.com',
    
    // Ferramentas Google
    'google.com', 'translate.google', 'maps.google',
    
    // Enciclopédias e wikis
    'wikipedia.org', 'wikihow.com',
    
    // Marketplaces genéricos
    'mercadolivre.com', 'mercadolibre.com', 'aliexpress.com',
    'amazon.com', 'amazon.com.br', 'olx.com', 'olx.com.br',
    'magazineluiza.com', 'americanas.com', 'casasbahia.com',
    'shopee.com', 'shein.com', 'netepi.com', 'copabo.com',
    
    // Plataformas de conteúdo
    'medium.com', 'wordpress.com', 'blogspot.com', 'wix.com',
    
    // 🔥 NOVO: Sites governamentais e institucionais (EXPANDIDO)
    'gov.br', 'planalto.gov.br', 'receita.fazenda.gov.br',
    'sebrae.com', 'sebrae.br', 'sebraetec', 'senai.br', 'sesi.org',
    'fiesp.com', 'fiesp.org', 'apexbrasil.com', 'mdic.gov.br',
    'inteligencia-dados.fiesp.com', 'congressousp.fipecafi.org',
    'imagem.camara.leg.br', 'basis.trt2.jus.br', 'neic.iesp.uerj.br',
    'ceaf.mpac.mp.br', 'fentect.org.br', 'andes.org.br',
    
    // 🔥 NOVO: Plataformas educacionais e acadêmicas
    'passeidireto', 'aprovadotcc', 'educamaisbrasil', 'anhanguera',
    'cruzeirodosul', 'uninter', 'ens.edu', 'teses.usp',
    
    // 🔥 NOVO: E-commerces e distribuidores genéricos
    'netepi', 'copabo', 'astrodistribuidora', 'tradeinn',
    'industrialstarter', 'maxxdistribuidora',
    
    // Padrões de URL de blogs/notícias
    '/blog/', '/noticias/', '/artigos/', '/noticia/', '/artigo/',
    'blog.', 'noticias.', 'news.'
  ];
  
  if (universalBlacklist.some(blocked => url.includes(blocked))) {
    return false;
  }
  
  // ============================================
  // FILTRO 2: Excluir o Próprio Tenant (MELHORADO)
  // ============================================
  if (context.tenantDomain) {
    const tenantDomainClean = context.tenantDomain.toLowerCase().replace('www.', '');
    const urlClean = url.replace('www.', '');
    
    // Extrair domínio do resultado
    const domainMatch = urlClean.match(/^https?:\/\/([^\/]+)/);
    if (domainMatch) {
      const resultDomain = domainMatch[1];
      if (resultDomain === tenantDomainClean || resultDomain.includes(tenantDomainClean) || tenantDomainClean.includes(resultDomain)) {
        console.log(`[FILTRO] ❌ Excluído: próprio tenant (${resultDomain} === ${tenantDomainClean})`);
        return false;
      }
    }
  }
  
  if (context.tenantName) {
    const tenantNameNormalized = context.tenantName.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10); // Primeiros 10 caracteres para evitar matches falsos
    
    const urlNormalized = url.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    
    if (tenantNameNormalized.length >= 5 && urlNormalized.includes(tenantNameNormalized)) {
      console.log(`[FILTRO] ❌ Excluído: nome do tenant encontrado na URL`);
      return false;
    }
  }
  
  // ============================================
  // FILTRO 3: Detectar Conteúdo Editorial (MELHORADO)
  // ============================================
  const editorialSignals = [
    'como fazer', 'passo a passo', 'tutorial', 'guia completo',
    'dicas', 'aprenda', 'entenda', 'saiba mais', 'descubra',
    'o que é', 'por que', 'quando usar', 'publicado em',
    'por:', 'autor:', 'leia mais', 'continue lendo',
    'artigo sobre', 'estudo de', 'pesquisa sobre', 'análise de mercado',
    'tendências', 'reportagem', 'notícia', 'matéria'
  ];
  
  const editorialCount = editorialSignals.filter(signal =>
    title.includes(signal) || snippet.includes(signal)
  ).length;
  
  // Se tem 2+ sinais editoriais, é conteúdo, não empresa
  if (editorialCount >= 2) {
    console.log(`[FILTRO] ❌ Excluído: conteúdo editorial (${editorialCount} sinais)`);
    return false;
  }
  
  // ============================================
  // FILTRO 4: Detectar E-commerce de Revenda (MELHORADO)
  // ============================================
  const ecommerceSignals = [
    'comprar', 'compre', 'preço', 'r$', 'reais',
    'frete grátis', 'entrega', 'parcela', 'desconto',
    'promoção', 'oferta', 'à vista', 'cartão',
    'estoque', 'disponível', 'adicionar ao carrinho',
    'compre agora', 'melhor preço', 'loja online'
  ];
  
  const ecommerceCount = ecommerceSignals.filter(signal =>
    title.includes(signal) || snippet.includes(signal)
  ).length;
  
  // Se tem 4+ sinais de e-commerce, provavelmente é revendedor
  if (ecommerceCount >= 4) {
    console.log(`[FILTRO] ❌ Excluído: e-commerce revendedor (${ecommerceCount} sinais)`);
    return false;
  }
  
  // ============================================
  // FILTRO 5: Validar Domínio Corporativo (MELHORADO)
  // ============================================
  const domainMatch = url.match(/^https?:\/\/(?:www\.)?([^\/]+)/);
  if (!domainMatch) {
    return false;
  }
  
  const domain = domainMatch[1];
  
  // Verificar TLDs corporativos válidos
  const validTLDs = ['.com.br', '.com', '.net.br', '.net', '.org.br', '.ind.br'];
  const hasValidTLD = validTLDs.some(tld => domain.endsWith(tld));
  
  if (!hasValidTLD) {
    console.log(`[FILTRO] ❌ Excluído: TLD inválido (${domain})`);
    return false;
  }
  
  // Rejeitar subdomínios suspeitos
  const suspiciousSubdomains = ['blog.', 'noticias.', 'news.', 'artigos.', 'inteligencia-dados.'];
  if (suspiciousSubdomains.some(sub => domain.startsWith(sub))) {
    console.log(`[FILTRO] ❌ Excluído: subdomínio suspeito (${domain})`);
    return false;
  }
  
  // ============================================
  // FILTRO 6: Verificar Sinais Corporativos (MELHORADO)
  // ============================================
  const corporateSignals = [
    'empresa', 'fabricante', 'indústria', 'fornecedor',
    'sobre', 'quem somos', 'nossa história', 'nossos produtos',
    'soluções', 'serviços', 'clientes', 'portfólio',
    'cnpj', 'contato', 'orçamento', 'consultoria',
    'companhia', 'ltda', 'distribuidor'
  ];
  
  const corporateCount = corporateSignals.filter(signal =>
    title.includes(signal) || snippet.includes(signal) || url.includes(signal)
  ).length;
  
  // Precisa ter pelo menos 1 sinal corporativo
  if (corporateCount < 1) {
    console.log(`[FILTRO] ❌ Excluído: sem sinais corporativos`);
    return false;
  }
  
  return true; // Passou em todos os filtros
}

/**
 * 🔥 NOVO: Sistema de Pontuação Universal para Sites Corporativos
 * Funciona para QUALQUER setor (automotivo, cosméticos, metalurgia, software, etc.)
 */
function calculateUniversalCorporateScore(result: SerperResult['organic'][0]): number {
  let score = 0;
  const url = (result.link || '').toLowerCase();
  const title = (result.title || '').toLowerCase();
  const snippet = (result.snippet || '').toLowerCase();
  const fullText = `${title} ${snippet}`;
  
  // ============================================
  // PONTUAÇÃO POSITIVA (Indicadores Corporativos)
  // ============================================
  
  // +30: Domínio brasileiro corporativo
  if (url.includes('.com.br') || url.includes('.ind.br')) {
    score += 30;
  }
  
  // +25: Página institucional no URL
  const institutionalPages = ['/sobre', '/empresa', '/quem-somos', '/institucional', '/about'];
  if (institutionalPages.some(page => url.includes(page))) {
    score += 25;
  }
  
  // +20: Palavras corporativas no TÍTULO
  const titleCorporateWords = ['empresa', 'indústria', 'fabricante', 'soluções', 'serviços'];
  const titleCorporateCount = titleCorporateWords.filter(word => title.includes(word)).length;
  score += titleCorporateCount * 20;
  
  // +15: Menção a CNPJ ou dados legais
  if (fullText.includes('cnpj') || fullText.includes('razão social')) {
    score += 15;
  }
  
  // +10: Estrutura de site profissional (HTTPS)
  if (url.startsWith('https://')) {
    score += 10;
  }
  
  // +10: Menção a clientes ou portfólio
  if (fullText.includes('clientes') || fullText.includes('portfólio') || fullText.includes('cases')) {
    score += 10;
  }
  
  // ============================================
  // PONTUAÇÃO NEGATIVA (Indicadores Não-Corporativos)
  // ============================================
  
  // -50: Forte indicador de e-commerce de revenda
  const strongEcommerceIndicators = ['compre agora', 'adicionar ao carrinho', 'frete grátis'];
  if (strongEcommerceIndicators.some(indicator => fullText.includes(indicator))) {
    score -= 50;
  }
  
  // -40: Indicadores de conteúdo editorial
  if (title.includes('como fazer') || title.includes('passo a passo')) {
    score -= 40;
  }
  
  // -30: Menção a preços de forma destacada
  if (snippet.includes('r$') || snippet.includes('preço:')) {
    score -= 30;
  }
  
  // -20: Padrões de blog
  if (url.includes('/blog/') || url.includes('/artigo/')) {
    score -= 20;
  }
  
  return score;
}

/**
 * 🔥 MELHORADO: Calcula relevância completa com múltiplos critérios (SEMrush/SimilarWeb style)
 * Agora usa: produtos (40%), embeddings (30%), indústria (15%), geografia (10%), autoridade (5%)
 */
async function calculateRelevance(
  result: SerperResult['organic'][0],
  industry: string,
  products: string[],
  location: string | undefined,
  openaiKey: string | undefined,
  tenantProductsText: string | undefined,
  tenantEmbedding: number[] | undefined
): Promise<{ relevancia: number; similarityScore: number; businessType: CompetitorCandidate['businessType']; productMatches: number; exactMatches: number; semanticSimilarity: number; industryMatch: number; geographicMatch: number; domainAuthority: number }> {
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
  
  // 🔥 NOVO: Similaridade semântica com foco em produtos (peso: 40%)
  const similarityResult = calculateSemanticSimilarity(
    industry,
    products,
    result.title,
    result.snippet
  );
  const productSimilarityScore = similarityResult.score;
  
  // 🔥 NOVO: Embeddings semânticos (peso: 30%) - OPCIONAL (não bloquear se falhar)
  let semanticSimilarity = 0;
  try {
    if (openaiKey && tenantEmbedding && tenantEmbedding.length > 0) {
      const candidateText = `${result.title} ${result.snippet}`;
      const candidateEmbedding = await generateEmbedding(candidateText, openaiKey);
      if (candidateEmbedding.length > 0) {
        const cosineSim = calculateCosineSimilarity(tenantEmbedding, candidateEmbedding);
        semanticSimilarity = Math.round(cosineSim * 100); // Converter para 0-100
      }
    }
  } catch (error) {
    console.warn('[calculateRelevance] ⚠️ Erro ao calcular embedding, continuando sem ele:', error);
    semanticSimilarity = 0; // Continuar sem embedding se falhar
  }
  
  // 🔥 NOVO: Classificação de indústria (peso: 15%) - OPCIONAL (não bloquear se falhar)
  let industryMatch = 0;
  let candidateIndustries: string[] = [];
  try {
    if (openaiKey) {
      candidateIndustries = await classifyIndustry(result.title, result.snippet, openaiKey);
      industryMatch = calculateIndustryMatch(industry, candidateIndustries);
    }
  } catch (error) {
    console.warn('[calculateRelevance] ⚠️ Erro ao classificar indústria, continuando sem ela:', error);
    industryMatch = 0; // Continuar sem classificação se falhar
  }
  
  // 🔥 NOVO: Match geográfico (peso: 10%)
  const geographicMatch = calculateGeographicMatch(location, result.link);
  
  // 🔥 NOVO: Autoridade do domínio (peso: 5%)
  const domainAuthority = calculateDomainAuthority(result.position);
  
  // 🔥 AJUSTADO: Relevância com múltiplos critérios (SEMrush/SimilarWeb style)
  // Se embeddings/indústria não estiverem disponíveis, redistribuir pesos
  const hasSemantic = semanticSimilarity > 0;
  const hasIndustry = industryMatch > 0;
  
  // Pesos dinâmicos: redistribuir se algum critério não estiver disponível
  let weights = {
    productMatches: 0.40,      // 40% - Produtos específicos encontrados
    semanticSimilarity: 0.30,    // 30% - Similaridade semântica (embeddings)
    industryMatch: 0.15,        // 15% - Classificação por indústria
    geographicMatch: 0.10,      // 10% - Localização geográfica
    domainAuthority: 0.05       // 5% - Autoridade/ranqueamento do site
  };
  
  // Se não houver embeddings, redistribuir peso para produtos
  if (!hasSemantic) {
    weights.productMatches = 0.60; // Aumentar para 60%
    weights.semanticSimilarity = 0; // Remover
  }
  
  // Se não houver classificação de indústria, redistribuir peso
  if (!hasIndustry) {
    weights.productMatches += 0.10; // Aumentar produtos para 70% (ou 60% se não houver embeddings)
    weights.industryMatch = 0; // Remover
  }
  
  let relevancia = (
    productSimilarityScore * weights.productMatches +
    semanticSimilarity * weights.semanticSimilarity +
    industryMatch * weights.industryMatch +
    geographicMatch * weights.geographicMatch +
    domainAuthority * weights.domainAuthority
  );
  
  // 🔥 NOVO: Bonus baseado no número de produtos encontrados
  if (similarityResult.exactMatches >= 5) {
    relevancia += 20; // Bonus máximo
  } else if (similarityResult.exactMatches >= 3) {
    relevancia += 15;
  } else if (similarityResult.exactMatches >= 2) {
    relevancia += 10;
  } else if (similarityResult.exactMatches >= 1) {
    relevancia += 5;
  }
  
  // 🔥 AJUSTADO: Penalizar menos se não encontrou nenhum produto específico
  if (similarityResult.productMatches === 0) {
    relevancia -= 10; // Penalidade reduzida
  }
  
  // Usar productSimilarityScore como similarityScore para compatibilidade
  const similarityScore = productSimilarityScore;
  
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
    businessType,
    productMatches: similarityResult.productMatches,
    exactMatches: similarityResult.exactMatches,
    semanticSimilarity,
    industryMatch,
    geographicMatch,
    domainAuthority
  };
}

serve(async (req) => {
  // 🔥 CRÍTICO: Tratar OPTIONS PRIMEIRO (ANTES DE QUALQUER COISA - SEM TRY/CATCH)
  // ⚠️ IMPORTANTE: O navegador faz preflight OPTIONS antes de POST
  // ⚠️ CRÍTICO: Status 200 é obrigatório para passar no check do navegador
  if (req.method === 'OPTIONS') {
    console.log('[SERPER Search] ✅ OPTIONS preflight recebido');
    return new Response('', { 
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    console.log('[SERPER Search] 📥 Recebendo requisição...');
    
    let industry: string = '';
    let products: string[] = [];
    let location: string | undefined;
    let excludeDomains: string[] = [];
    let maxResults = 10;
    let page = 1;
    
    try {
      const body = await req.json();
      // 🔥 NOVO: Suportar query direta (com operadores Google) OU industry (legado)
      const query = body.query || '';
      industry = body.industry || '';
      products = Array.isArray(body.products) ? body.products : [];
      location = body.location;
      excludeDomains = Array.isArray(body.excludeDomains) ? body.excludeDomains : [];
      maxResults = typeof body.maxResults === 'number' ? body.maxResults : 10;
      page = typeof body.page === 'number' ? body.page : 1;
      // 🔥 NOVO: Receber informações do tenant para filtros
      const tenantDomain = body.tenantDomain || '';
      const tenantName = body.tenantName || '';
      
      console.log('[SERPER Search] ✅ Body parseado:', { 
        query: query || 'N/A',
        industry, 
        productsCount: products.length, 
        location, 
        maxResults,
        page,
        tenantDomain,
        tenantName
      });
    } catch (parseError) {
      console.error('[SERPER Search] ❌ Erro ao parsear body:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao parsear requisição',
          details: parseError instanceof Error ? parseError.message : String(parseError)
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('[SERPER Search] 🚀 Iniciando busca melhorada:', { industry, productsCount: products.length, location, maxResults });

    const serperApiKey = Deno.env.get('SERPER_API_KEY');
    if (!serperApiKey) {
      throw new Error('SERPER_API_KEY não configurada');
    }

    // 🔥 NOVO: Obter chave OpenAI e gerar embedding dos produtos do tenant
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const tenantProductsText = products.length > 0 ? products.join(', ') : '';
    let tenantEmbedding: number[] = [];
    
    // 🔥 TEMPORÁRIO: Desabilitar embeddings para evitar erro 500
    // if (openaiKey && tenantProductsText) {
    //   console.log('[SERPER Search] 🔥 Gerando embedding dos produtos do tenant...');
    //   try {
    //     tenantEmbedding = await generateEmbedding(tenantProductsText, openaiKey);
    //     if (tenantEmbedding.length > 0) {
    //       console.log('[SERPER Search] ✅ Embedding gerado com sucesso (dimensões:', tenantEmbedding.length, ')');
    //     } else {
    //       console.warn('[SERPER Search] ⚠️ Falha ao gerar embedding, continuando sem embeddings semânticos');
    //     }
    //   } catch (error) {
    //     console.warn('[SERPER Search] ⚠️ Erro ao gerar embedding, continuando sem embeddings:', error);
    //   }
    // } else {
    //   console.warn('[SERPER Search] ⚠️ OpenAI não configurado ou sem produtos, continuando sem embeddings semânticos');
    // }
    console.warn('[SERPER Search] ⚠️ Embeddings temporariamente desabilitados para debug');

    // 🔥 NOVO: Se recebeu query direta (com operadores Google), usar ela
    // Caso contrário, gerar queries dinâmicas (compatibilidade com versão antiga)
    const queries: string[] = [];
    
    if (query && query.trim()) {
      // Usar query direta do frontend (já vem com operadores Google)
      queries.push(query);
      console.log('[SERPER Search] 🔍 Usando query direta do frontend:', query);
    } else {
      // 🔥 REFEITO: Gerar queries dinâmicas com operadores Google (universal)
      const productsToUse = products.slice(0, 5); // Limitar a 5 para query não ficar muito longa
      
      if (productsToUse.length > 0) {
        // Query: Produtos com OR + forçar sites corporativos
        const productsQuery = productsToUse.map(p => `"${p}"`).join(' OR ');
        const baseQuery = `(${productsQuery}) (empresa OR fabricante OR fornecedor OR indústria OR consultoria)`;
        
        // Exclusões genéricas (aplicáveis a QUALQUER setor)
        const exclusions = [
          '-blog', '-notícia', '-artigo', '-"como fazer"', '-tutorial', '-dicas', '-guia',
          '-mercadolivre', '-aliexpress', '-amazon', '-olx', '-shopee', '-magalu',
          '-youtube', '-facebook', '-instagram', '-linkedin', '-twitter',
          '-gov.br', '-sebrae', '-senai', '-sesi', '-fiesp', '-apexbrasil'
        ].join(' ');
        
        // Forçar domínios corporativos brasileiros
        const domainFilter = '(site:.com.br OR site:.com OR site:.net.br OR site:.net)';
        
        // Localização
        const locationFilter = location && location !== 'Brasil' ? location : 'Brasil';
        
        // Query final
        const finalQuery = `${baseQuery} ${exclusions} ${domainFilter} ${locationFilter}`.trim().replace(/\s+/g, ' ');
        queries.push(finalQuery);
        
        console.log('[SERPER Search] 🔍 Query dinâmica gerada:', finalQuery);
      }
    }
    
    console.log('[SERPER Search] 📦 Produtos usados na busca:', products.length, 'produtos');
    console.log('[SERPER Search] 📋 Primeiros produtos:', products.slice(0, 5));
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
                num: Math.max(30, maxResults * 3), // 🔥 AUMENTADO: Pegar mais resultados para filtrar melhor (30 mínimo)
                start: (page - 1) * 10, // 🔥 NOVO: Paginação (10 resultados por página)
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
    console.log('[SERPER Search] 📊 Produtos recebidos:', products.length, products.slice(0, 5));

    // Processar e filtrar resultados
    const candidates: CompetitorCandidate[] = [];
    let processedCount = 0;
    let filteredCount = 0;
    let filteredByDomain = 0;
    let filteredByMarketplace = 0;
    let filteredByBusinessType = 0;
    let acceptedCount = 0;

    console.log('[SERPER Search] 🔄 Iniciando processamento de', allResults.length, 'resultados...');

    for (const result of allResults) {
      processedCount++;
      try {
        // Extrair domínio com tratamento de erro
        let domain = '';
        try {
          const url = new URL(result.link);
          domain = url.hostname.replace('www.', '');
        } catch (urlError) {
          console.warn('[SERPER Search] ⚠️ Erro ao parsear URL:', result.link, urlError);
          continue;
        }

        // Filtrar domínios excluídos
        if (excludeDomains.some(excluded => domain.includes(excluded))) {
          continue;
        }

        // 🔥 REFEITO: Aplicar filtros universais (funciona para QUALQUER setor)
        const filterContext: FilterContext = {
          tenantDomain: tenantDomain || '',
          tenantName: tenantName || ''
        };
        
        if (!isValidCompetitor(result, filterContext)) {
          filteredByDomain++;
          continue;
        }
        
        console.log(`[SERPER Search] ✅ Passou nos filtros: ${result.title} (${result.link})`);
        
        const titleLower = (result.title || '').toLowerCase();
        const snippetLower = (result.snippet || '').toLowerCase();

        // 🔥 NOVO: Calcular similaridade de produtos e pontuação universal
        let businessType: CompetitorCandidate['businessType'] = 'empresa';
        let similarityScore = 0;
        let productMatches = 0;
        let exactMatches = 0;
        let relevancia = 50; // Default
        
        try {
          businessType = detectBusinessType(result.title || '', result.snippet || '', result.link || '');
          
          // Calcular similaridade de produtos (sem embeddings/classificação)
          const similarityResult = calculateSemanticSimilarity(
            industry || '',
            products || [],
            result.title || '',
            result.snippet || ''
          );
          
          similarityScore = similarityResult.score || 0;
          productMatches = similarityResult.productMatches || 0;
          exactMatches = similarityResult.exactMatches || 0;
          
          // 🔥 NOVO: Calcular pontuação universal corporativa
          const corporateScore = calculateUniversalCorporateScore(result);
          
          // Calcular relevância combinando similaridade de produtos + pontuação corporativa
          relevancia = similarityScore; // Base: similaridade de produtos (0-100)
          relevancia += Math.max(0, corporateScore); // Adicionar pontuação corporativa (pode ser negativa)
          
          // Bonus por posição no Google (1º = +30, 2º = +27, etc.)
          const positionBonus = Math.max(0, 30 - ((result.position || 100) * 0.3));
          relevancia += positionBonus;
          
          // Bonus por produtos encontrados
          if (exactMatches >= 3) relevancia += 20;
          else if (exactMatches >= 2) relevancia += 15;
          else if (exactMatches >= 1) relevancia += 10;
          
          // Penalidade se não encontrou produtos
          if (exactMatches === 0 && productMatches === 0) relevancia -= 30;
          
          relevancia = Math.min(100, Math.max(0, relevancia)); // Garantir entre 0-100
        } catch (calcError) {
          console.warn('[SERPER Search] ⚠️ Erro ao calcular similaridade/relevância, usando valores padrão:', calcError);
          // Usar valores padrão se falhar
        }

        // 🔥 CRÍTICO: REMOVER filtro de similaridade completamente (aceitar todos)
        // Não filtrar por similaridade - deixar passar todos para depois ordenar
        
        // 🔥 CRÍTICO: REMOVER filtro de relevância completamente (aceitar todos)
        // Não filtrar por relevância - deixar passar todos para depois ordenar
        
        // 🔥 MELHORADO: Filtrar tipos não-empresa (vaga, artigo, perfil, educacional)
        // Aceitar apenas: empresa, associacao (se tiver produtos), outro (se tiver produtos)
        const strictNonCompanyTypes = ['vaga', 'artigo', 'perfil', 'educacional'];
        if (businessType && strictNonCompanyTypes.includes(businessType)) {
          filteredByBusinessType++;
          console.log(`[SERPER Search] ❌ Filtrado (tipo não-empresa): ${result.title} (${businessType})`);
          continue;
        }
        
        // 🔥 NOVO: Filtrar domínios educacionais explicitamente
        const educationalDomains = [
          'passeidireto', 'aprovadotcc', 'educamaisbrasil', 'anhanguera',
          'cruzeirodosul', 'uninter', 'ens.edu', 'teses.usp', 'portfolio',
          'acadportfolios', 'consultoriaportfolios', 'portfoliooead', 'portfolio-pronto'
        ];
        if (educationalDomains.some(edu => domain.includes(edu))) {
          filteredByBusinessType++;
          console.log(`[SERPER Search] ❌ Filtrado (domínio educacional): ${result.title} (${domain})`);
          continue;
        }
        
        // 🔥 NOVO: Filtrar artigos/estudos por palavras-chave no título
        const articleKeywords = [
          'curso', 'cursos', 'treinamento', 'capacitação', 'graduação',
          'pós-graduação', 'mba', 'projeto de extensão', 'tcc', 'trabalho acadêmico',
          'estudo', 'pesquisa', 'análise de', 'tendências', 'artigo sobre'
        ];
        // Reutilizar titleLower já declarado acima (linha 1008)
        if (articleKeywords.some(keyword => titleLower.includes(keyword))) {
          filteredByBusinessType++;
          console.log(`[SERPER Search] ❌ Filtrado (palavra-chave educacional no título): ${result.title}`);
          continue;
        }
        
        // Se chegou aqui, aceitar o resultado
        acceptedCount++;
        console.log(`[SERPER Search] ✅ Aceito: ${result.title} (produtos: ${exactMatches}/${productMatches}, similaridade: ${similarityScore}%, relevância: ${relevancia}, tipo: ${businessType})`);

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
          exactMatches, // 🔥 NOVO: Adicionar número de produtos encontrados
          productMatches, // 🔥 NOVO: Adicionar número total de matches
        } as any);

      } catch (error) {
        console.error('[SERPER Search] ❌ Erro ao processar resultado:', error);
        continue;
      }
    }

    // 🔥 MELHORADO: Ordenar por número de produtos encontrados PRIMEIRO, depois relevância
    // Priorizar empresas que mencionam mais produtos específicos
    candidates.sort((a, b) => {
      // Priorizar empresas reais
      if (a.businessType === 'empresa' && b.businessType !== 'empresa') return -1;
      if (b.businessType === 'empresa' && a.businessType !== 'empresa') return 1;
      
      // Primeiro: número de produtos encontrados (maior primeiro)
      const aProducts = (a as any).exactMatches || 0;
      const bProducts = (b as any).exactMatches || 0;
      if (aProducts !== bProducts) {
        return bProducts - aProducts;
      }
      // Segundo: similaridade (maior primeiro)
      const aSim = a.similarityScore || 0;
      const bSim = b.similarityScore || 0;
      if (aSim !== bSim) {
        return bSim - aSim;
      }
      // Terceiro: relevância (maior primeiro)
      return b.relevancia - a.relevancia;
    });

    // 🔥 AUMENTADO: Retornar no mínimo 20 empresas (ou maxResults se maior)
    const finalCandidates = candidates.slice(0, Math.max(20, maxResults));
    console.log('[SERPER Search] ✅ Candidatos finais:', finalCandidates.length);
    console.log('[SERPER Search] 📊 Estatísticas detalhadas:', {
      totalResultsFromSerper: allResults.length,
      processed: processedCount,
      filteredByDomain,
      filteredByMarketplace,
      filteredByBusinessType,
      accepted: acceptedCount,
      totalCandidates: candidates.length,
      finalCandidates: finalCandidates.length,
      queriesExecuted: queries.length,
    });
    
    // 🔥 CRÍTICO: Se não encontrou nenhum candidato, retornar pelo menos os primeiros resultados do SERPER
    let finalResults = finalCandidates;
    if (finalCandidates.length === 0 && allResults.length > 0) {
      console.warn('[SERPER Search] ⚠️ NENHUM candidato passou nos filtros! Retornando primeiros resultados brutos do SERPER...');
      const fallbackCandidates: CompetitorCandidate[] = [];
      for (let i = 0; i < Math.min(10, allResults.length); i++) {
        const result = allResults[i];
        try {
          const url = new URL(result.link);
          const domain = url.hostname.replace('www.', '');
          
          // Apenas filtrar marketplaces e domínios genéricos óbvios
          if (GENERIC_DOMAINS.some(generic => domain.includes(generic))) continue;
          if (['mercadolivre', 'amazon', 'alibaba'].some(m => domain.includes(m))) continue;
          
          let nome = result.title.replace(/\s*-\s*(Vaga|Oportunidade).*$/i, '').trim();
          
          fallbackCandidates.push({
            nome,
            website: result.link,
            descricao: result.snippet,
            relevancia: 50, // Relevância padrão
            similarityScore: 10, // Similaridade padrão
            businessType: 'empresa',
            fonte: 'serper',
          } as any);
        } catch {
          continue;
        }
      }
      finalResults = fallbackCandidates;
      console.log('[SERPER Search] ✅ Retornando', fallbackCandidates.length, 'candidatos brutos do SERPER');
    }

    return new Response(
      JSON.stringify({
        success: true,
        query: queries[0] || '',
        candidates: finalResults,
        candidatesCount: finalResults.length,
        total: finalResults.length,
        totalFound: finalResults.length, // 🔥 CORRIGIDO: Adicionar campo esperado pelo frontend
        queriesExecuted: queries.length, // 🔥 CORRIGIDO: Adicionar campo esperado pelo frontend
        filtered: allResults.length - finalResults.length,
        debug: {
          productsUsed: productsToUse.length,
          industry,
          location,
          queriesGenerated: queries.length,
          totalResults: allResults.length,
          candidatesBeforeFilter: candidates.length,
          finalCandidates: finalResults.length,
        },
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('[SERPER Search] ❌ Erro:', error);
    console.error('[SERPER Search] ❌ Stack:', error?.stack);
    console.error('[SERPER Search] ❌ Name:', error?.name);
    
    // Retornar erro detalhado para debug
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error?.message || 'Erro desconhecido',
        errorType: error?.name || 'Unknown',
        stack: error?.stack || 'No stack trace',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
