/**
 * DISCOVER ALL TECHNOLOGIES
 * 
 * Descoberta dinâmica de TODAS as tecnologias/sistemas utilizados pela empresa.
 * Metodologia: IDÊNTICA ao TOTVS Check (8 FASES completas)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscoverAllTechnologiesRequest {
  companyName: string;
  cnpj?: string;
  allUrls: string[];
  knownCompetitors?: Array<{
    name: string;
    products: Array<{ name: string; aliases: string[] }>;
    website?: string;
    casesPage?: string;
  }>;
}

interface Evidence {
  url: string;
  title: string;
  snippet: string;
  source: string;
  matchType: 'single' | 'double' | 'triple';
  excerpt: string;
  weight: number;
  detected_products?: string[];
}

interface CompetitorProductDetection {
  competitor_name: string;
  product_name: string;
  confidence: 'high' | 'medium' | 'low';
  evidences: Evidence[];
  total_weight: number;
  match_summary: {
    single_matches: number;
    double_matches: number;
    triple_matches: number;
  };
  total_score: number;
}

interface TechnologyDiscovery {
  knownCompetitors: CompetitorProductDetection[];
  unknownTechnologies: any[];
  customSystems: any[];
  openSource: any[];
  stats: {
    totalUrlsAnalyzed: number;
    totalEvidences: number;
    totalCompetitorsDetected: number;
    totalUnknownTechnologies: number;
    totalCustomSystems: number;
  };
}

// 🌐 PORTAIS DE VAGAS (MESMOS DA ABA TOTVS)
const JOB_PORTALS_NACIONAL = [
  'br.linkedin.com/jobs',
  'br.linkedin.com/posts',
  'portal.gupy.io',
  'br.indeed.com'
];

// 📰 NOTÍCIAS PREMIUM (MESMAS DA ABA TOTVS)
const NEWS_SOURCES_PREMIUM = [
  'valor.globo.com',
  'exame.com',
  'estadao.com.br/economia',
  'infomoney.com.br',
  'folha.uol.com.br/mercado',
  'bloomberg.com.br',
  'br.investing.com',
  'ftbrasil.com.br',
  'braziljournal.com',
  'startse.com',
  'convergenciadigital.com.br',
  'itforum.com.br',
  'canaltech.com.br',
  'revistapegn.globo.com',
  'meioemensagem.com.br',
  'baguete.com.br',
  'cioadv.com.br',
  'mercadoeconsumo.com.br',
  'connectabil.com.br',
  'tiinside.com.br',
  'crn.com.br',
  'computerworld.com.br',
  'youtube.com',
  'vimeo.com',
  'slideshare.net',
  'instagram.com',
  'facebook.com',
  'linkedin.com/posts',
];

// 📘 CASES OFICIAIS DOS CONCORRENTES
const COMPETITOR_CASES_PORTALS = [
  'omie.com.br/cases',
  'senior.com.br/cases',
  'contaazul.com/cases',
  'bling.com.br/cases',
  'sankhya.com.br/cases',
];

// 📄 FONTES OFICIAIS BRASILEIRAS (MESMAS DA ABA TOTVS)
const OFFICIAL_SOURCES_BR = [
  'cvm.gov.br',
  'rad.cvm.gov.br',
  'b3.com.br',
  'investidor.b3.com.br',
  'esaj.tjsp.jus.br',
  'tjrj.jus.br',
  'cnj.jus.br',
  'jusbrasil.com.br',
  'imprensaoficial.com.br',
  'in.gov.br'
];

// 🎯 PESOS DAS FONTES (MESMOS DA ABA TOTVS)
const SOURCE_WEIGHTS = {
  job_portals: 70,
  competitor_cases: 80,
  official_docs: 100,
  premium_news: 85,
  tech_portals: 85,
  video_content: 75,
  social_media: 70,
  totvs_partners: 80,
};

/**
 * GERAR VARIAÇÕES DO NOME DA EMPRESA (MESMA LÓGICA DO TOTVS CHECK)
 */
function getCompanyVariations(companyName: string): string[] {
  if (!companyName) return [];
  
  const variations: string[] = [companyName];
  
  const corporateSuffixes = [
    ' S.A.', ' S/A', ' SA', ' LTDA', ' LTDA.', ' Ltda', ' Ltda.',
    ' EIRELI', ' EPP', ' ME', ' Indústrias', ' Indústria', 
    ' Comércio', ' Serviços', ' Participações', ' Holdings',
    ' Transportes', ' Logística', ' e Logística'
  ];
  
  let cleanName = companyName;
  for (const suffix of corporateSuffixes) {
    const regex = new RegExp(suffix + '.*$', 'i');
    cleanName = cleanName.replace(regex, '').trim();
  }
  
  if (cleanName !== companyName && cleanName.length >= 3) {
    variations.push(cleanName);
  }
  
  const words = cleanName.split(' ').filter(w => w.length > 0);
  if (words.length > 2) {
    variations.push(words.slice(0, 2).join(' '));
  }
  
  if (words.length > 0 && words[0].length >= 5) {
    variations.push(words[0]);
  }
  
  return [...new Set(variations)];
}

/**
 * 🔥 NOVA FUNÇÃO: Ler contexto completo da URL para validação precisa (COMPETITORS)
 */
async function fetchAndAnalyzeUrlContextCompetitor(
  url: string,
  companyName: string,
  competitorName: string
): Promise<{ fullText: string; hasBusinessContext: boolean }> {
  try {
    console.log('[URL-CONTEXT-COMP] 🔍 Fazendo fetch de:', url);
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) {
      return { fullText: '', hasBusinessContext: false };
    }
    
    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    const title = titleMatch ? titleMatch[1] : '';
    const description = descMatch ? descMatch[1] : '';
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .substring(0, 2000);
    
    const fullText = `${title} ${description} ${textContent}`;
    
    // Usar IA para verificar correlação de negócios
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (openaiKey) {
      try {
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
              role: 'user',
              content: `Analise este texto e determine se há CORRELAÇÃO DE NEGÓCIOS entre "${companyName}" e "${competitorName}" (concorrente de software ERP/gestão).

TEXTO:
${fullText.substring(0, 1500)}

IMPORTANTE: Rejeite se "${competitorName}" aparecer em contexto de editora/publicações (ex: "Londres: Sage, 1994" = editora, não concorrente).

Responda APENAS JSON:
{
  "hasBusinessContext": true/false,
  "reason": "explicação breve"
}`
            }],
            max_tokens: 150,
            temperature: 0.3
          }),
          signal: AbortSignal.timeout(5000)
        });
        
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            console.log('[URL-CONTEXT-COMP] 🤖 IA analisou:', parsed);
            return { fullText, hasBusinessContext: parsed.hasBusinessContext || false };
          }
        }
      } catch (aiError) {
        console.log('[URL-CONTEXT-COMP] ⚠️ Erro na análise IA, usando validação básica');
      }
    }
    
    return { fullText, hasBusinessContext: true };
  } catch (error) {
    console.log('[URL-CONTEXT-COMP] ❌ Erro ao fetch URL:', error);
    return { fullText: '', hasBusinessContext: false };
  }
}

/**
 * VALIDAÇÃO DE EVIDÊNCIA (MESMA LÓGICA DO TOTVS CHECK)
 * 🔥 AGORA COM LEITURA DE CONTEXTO COMPLETO DA URL
 */
async function isValidCompetitorEvidence(
  snippet: string,
  title: string,
  companyName: string,
  competitorName: string,
  productName: string,
  url?: string // 🔥 NOVO: URL para leitura de contexto completo
): Promise<{ valid: boolean; matchType: 'single' | 'double' | 'triple' | 'rejected'; detectedProducts: string[] }> {
  
  const fullText = `${title} ${snippet}`;
  const textLower = fullText.toLowerCase();
  
  console.log('[DISCOVER-TECH] 🔍 === VALIDANDO EVIDÊNCIA ===');
  console.log('[DISCOVER-TECH] 📄 Título:', title.substring(0, 100));
  console.log('[DISCOVER-TECH] 📄 Snippet:', snippet.substring(0, 150));
  console.log('[DISCOVER-TECH] 🏢 Empresa:', companyName);
  console.log('[DISCOVER-TECH] 🏆 Concorrente:', competitorName);
  console.log('[DISCOVER-TECH] 📦 Produto:', productName);
  
  // 🔥 VALIDAÇÃO ANTI-FALSO POSITIVO: Rejeitar contextos onde "Sage" é editora, não ERP
  // Ex: "Londres: Sage, 1994" = editora de livros, NÃO concorrente
  // Ex: "Case Study Research: design and methods, Londres: Sage, 1994" = editora
  const falsePositivePatterns = [
    // Padrões de editora/publicações
    /londres\s*:\s*sage|sage\s*,\s*199\d|sage\s*,\s*20\d{2}/i, // "Londres: Sage" ou "Sage, 1994" ou "Sage, 2000"
    /sage\s*publications|editora\s*sage|publicações\s*sage/i,
    /sage\s*press|sage\s*publishing|editor\s*sage|publisher.*sage/i,
    // Rejeitar se "Sage" aparece próximo a termos acadêmicos/editoriais
    /(case\s*study|research|design|methods|publications?|editora|press|publishing|publisher|book|livro).*sage|sage.*(case\s*study|research|design|methods|publications?|editora|press|publishing|publisher|book|livro)/i,
    // Rejeitar padrões de citação acadêmica: "Londres: Sage, 1994" ou "Sage, Londres, 1994"
    /(londres|new\s*york|california|thousand\s*oaks).*sage.*\d{4}|sage.*(londres|new\s*york|california|thousand\s*oaks).*\d{4}/i,
    // Rejeitar se aparece em contexto de referência bibliográfica
    /(references?|bibliography|bibliografia|cited|citado).*sage|sage.*(references?|bibliography|bibliografia)/i,
  ];
  
  if (competitorName.toLowerCase().includes('sage')) {
    for (const pattern of falsePositivePatterns) {
      if (pattern.test(fullText)) {
        console.log('[DISCOVER-TECH] ❌ Rejeitado: "Sage" detectado mas é editora/publicações (falso positivo)');
        console.log('[DISCOVER-TECH] 📄 Texto que causou rejeição:', fullText.substring(0, 200));
        return { valid: false, matchType: 'rejected', detectedProducts: [] };
      }
    }
  }
  
  const companyVariations = getCompanyVariations(companyName);
  console.log('[DISCOVER-TECH] 🔍 Variações do nome:', companyVariations);
  
  // 🔥 CRÍTICO: Encontrar posição da empresa no texto
  let companyPosition = -1;
  let matchedVariation = '';
  
  for (const variation of companyVariations) {
    const pos = textLower.indexOf(variation.toLowerCase());
    if (pos !== -1) {
      companyPosition = pos;
      matchedVariation = variation;
      break;
    }
  }
  
  if (companyPosition === -1) {
    console.log('[DISCOVER-TECH] ❌ Rejeitado: Nome da empresa NÃO encontrado no texto');
    return { valid: false, matchType: 'rejected', detectedProducts: [] };
  }
  
  console.log('[DISCOVER-TECH] ✅ Empresa encontrada (variação):', matchedVariation, 'na posição', companyPosition);
  
  // 🔥 CRÍTICO: Verificar se concorrente e produto aparecem JUNTOS com a empresa na MESMA MATÉRIA
  // Janela de contexto: 150 caracteres antes e depois da empresa (ajustado para matéria)
  const WINDOW_SIZE = 150; // Caracteres ao redor da empresa (mesma lógica do TOTVS Check)
  const startWindow = Math.max(0, companyPosition - WINDOW_SIZE);
  const endWindow = Math.min(fullText.length, companyPosition + matchedVariation.length + WINDOW_SIZE);
  const contextWindow = fullText.substring(startWindow, endWindow).toLowerCase();
  
  console.log('[DISCOVER-TECH] 🔍 Janela de contexto (150 chars - MESMA MATÉRIA):', contextWindow.substring(0, 300));
  
  // Verificar concorrente no contexto
  const competitorLower = competitorName.toLowerCase();
  const competitorWords = competitorName.toLowerCase().split(' ').filter(w => w.length > 2);
  
  let hasCompetitorInContext = false;
  
  // Para Sage, exigir contexto de ERP/software/tecnologia E estar próximo à empresa (MESMA MATÉRIA)
  if (competitorName.toLowerCase().includes('sage')) {
    const sageContext = /(sage|sagem?)\s+(erp|software|sistema|solução|tecnologia|gestão|enterprise|implementa|usa|utiliza|adota)/i;
    hasCompetitorInContext = sageContext.test(contextWindow);
    if (!hasCompetitorInContext) {
      console.log('[DISCOVER-TECH] ❌ Rejeitado: "Sage" não aparece em contexto de ERP/software próximo à empresa na MESMA MATÉRIA');
      return { valid: false, matchType: 'rejected', detectedProducts: [] };
    }
  } else {
    // Para outros concorrentes, verificar se aparece no contexto (MESMA MATÉRIA)
    hasCompetitorInContext = contextWindow.includes(competitorLower) || 
                            competitorWords.some(word => contextWindow.includes(word));
  }
  
  if (!hasCompetitorInContext) {
    console.log('[DISCOVER-TECH] ❌ Rejeitado: Concorrente não aparece próximo à empresa na MESMA MATÉRIA (falso positivo)');
    console.log('[DISCOVER-TECH] 💡 Isso significa que empresa e concorrente aparecem em matérias diferentes da mesma página');
    return { valid: false, matchType: 'rejected', detectedProducts: [] };
  }
  
  // Verificar produto no contexto
  const productLower = productName.toLowerCase();
  const productWords = productName.toLowerCase().split(' ').filter(w => w.length > 2);
  
  let hasProductInContext = false;
  const detectedProducts: string[] = [];
  
  if (contextWindow.includes(productLower)) {
    hasProductInContext = true;
    detectedProducts.push(productName);
  } else {
    for (const word of productWords) {
      if (contextWindow.includes(word) && word.length > 3) {
        hasProductInContext = true;
        if (!detectedProducts.includes(productName)) {
          detectedProducts.push(productName);
        }
        break;
      }
    }
  }
  
  // Produtos genéricos (ERP, CRM)
  if (productName.toLowerCase().includes('erp')) {
    if (contextWindow.includes('erp') || contextWindow.includes('enterprise resource planning')) {
      hasProductInContext = true;
      if (!detectedProducts.includes(productName)) {
        detectedProducts.push(productName);
      }
    }
  }
  if (productName.toLowerCase().includes('crm')) {
    if (contextWindow.includes('crm') || contextWindow.includes('customer relationship management')) {
      hasProductInContext = true;
      if (!detectedProducts.includes(productName)) {
        detectedProducts.push(productName);
      }
    }
  }
  
  // 🔥 NOVO: Se temos URL, fazer leitura de contexto completo para validação precisa
  let hasBusinessContext = true; // Default: aceitar se não tiver URL
  if (url) {
    console.log('[DISCOVER-TECH] 🔍 Lendo contexto completo da URL para validação precisa...');
    const urlContext = await fetchAndAnalyzeUrlContextCompetitor(url, companyName, competitorName);
    hasBusinessContext = urlContext.hasBusinessContext;
    
    if (!hasBusinessContext) {
      console.log('[DISCOVER-TECH] ❌ Rejeitado: IA não detectou correlação de negócios real no contexto completo da URL');
      return { valid: false, matchType: 'rejected', detectedProducts: [] };
    }
    
    // Se passou na validação IA, usar texto completo da URL para detecção de produtos
    if (urlContext.fullText) {
      const fullContextWindow = urlContext.fullText.toLowerCase();
      const companyPos = fullContextWindow.indexOf(matchedVariation.toLowerCase());
      if (companyPos !== -1) {
        const startWindow = Math.max(0, companyPos - 150);
        const endWindow = Math.min(fullContextWindow.length, companyPos + matchedVariation.length + 150);
        const enhancedContext = fullContextWindow.substring(startWindow, endWindow);
        
        if (enhancedContext.includes(productLower) || productWords.some(w => enhancedContext.includes(w))) {
          if (!detectedProducts.includes(productName)) {
            detectedProducts.push(productName);
            hasProductInContext = true;
          }
        }
      }
    }
  }
  
  // 🔥 TRIPLE MATCH: Empresa + Concorrente + Produto (TUDO NA MESMA MATÉRIA, MESMO CONTEXTO)
  if (hasCompetitorInContext && hasProductInContext) {
    console.log('[DISCOVER-TECH] ✅ ✅ ✅ TRIPLE MATCH DETECTADO! (Empresa + Concorrente + Produto na mesma matéria)');
    console.log('[DISCOVER-TECH] 🎯 Produtos:', detectedProducts.length > 0 ? detectedProducts.join(', ') : productName);
    return {
      valid: true,
      matchType: 'triple',
      detectedProducts: detectedProducts.length > 0 ? detectedProducts : [productName]
    };
  }
  
  // 🔥 DOUBLE MATCH - VARIAÇÃO 1: Empresa + Nome do Concorrente (na mesma matéria, mesmo contexto)
  if (hasCompetitorInContext) {
    console.log('[DISCOVER-TECH] ✅ ✅ DOUBLE MATCH DETECTADO! (Empresa + Nome do Concorrente na mesma matéria)');
    return {
      valid: true,
      matchType: 'double',
      detectedProducts: []
    };
  }
  
  // 🔥 DOUBLE MATCH - VARIAÇÃO 2: Empresa + Produto/Solução do Concorrente (sem mencionar nome do concorrente)
  if (hasProductInContext) {
    console.log('[DISCOVER-TECH] ✅ ✅ DOUBLE MATCH DETECTADO! (Empresa + Produto/Solução do Concorrente na mesma matéria, sem mencionar nome do concorrente)');
    console.log('[DISCOVER-TECH] 🎯 Produtos:', detectedProducts.length > 0 ? detectedProducts.join(', ') : productName);
    return {
      valid: true,
      matchType: 'double',
      detectedProducts: detectedProducts.length > 0 ? detectedProducts : [productName]
    };
  }
  
  // ❌ REJEITAR: Se não há concorrente nem produto no contexto, é falso positivo
  console.log('[DISCOVER-TECH] ❌ Rejeitado: Nenhuma correlação de negócios encontrada na mesma matéria');
  return { valid: false, matchType: 'rejected', detectedProducts: [] };
}

/**
 * BUSCA EM MÚLTIPLOS PORTAIS (MESMA LÓGICA DO TOTVS CHECK)
 */
async function searchMultiplePortalsForCompetitor(params: {
  portals: string[];
  companyName: string;
  competitorName: string;
  productName: string;
  serperKey: string;
  sourceType: string;
  sourceWeight: number;
  dateRestrict?: string;
}): Promise<Evidence[]> {
  const { portals, companyName, competitorName, productName, serperKey, sourceType, sourceWeight, dateRestrict = 'y5' } = params;
  const evidencias: Evidence[] = [];
  let processedPortals = 0;
  
  console.log(`[DISCOVER-TECH] 🔍 Iniciando busca em ${portals.length} portais (${sourceType})...`);
  console.log(`[DISCOVER-TECH] 📅 Filtro de data: últimos ${dateRestrict.replace('y', '')} anos`);
  
  const companyVariations = getCompanyVariations(companyName);
  const shortCompanyName = companyVariations[companyVariations.length - 1] || companyName;
  
  for (const portal of portals) {
    try {
      const query = `site:${portal} "${shortCompanyName}" "${competitorName}"`;
      
      console.log(`[DISCOVER-TECH] 🔍 Buscando: ${query}`);
      
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: query,
          num: 10,
          gl: 'br',
          hl: 'pt-br',
          tbs: `qdr:${dateRestrict}`,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const results = data.organic || [];
        processedPortals++;
        
        console.log(`[DISCOVER-TECH] 📊 ${portal}: ${results.length} resultados brutos`);
        
        if (results.length > 0) {
          console.log(`[DISCOVER-TECH] 📋 ${portal} - Sample:`, 
            results.slice(0, 2).map((r: any) => r.title?.substring(0, 60)).join(' | ')
          );
        }
        
        let validCount = 0;
        let rejectedCount = 0;
        
        for (const result of results) {
          const title = result.title || '';
          const snippet = result.snippet || '';
          const url = result.link || result.url || '';
          
          // 🔥 VALIDAÇÃO COM leitura de contexto completo da URL
          const validation = await isValidCompetitorEvidence(snippet, title, companyName, competitorName, productName, url);
          
          if (!validation.valid) {
            rejectedCount++;
            if (rejectedCount <= 3) {
              console.log(`[DISCOVER-TECH] ❌ ${portal} - REJEITADO (${validation.matchType}): ${title.substring(0, 70)}`);
            }
            continue;
          }
          
          validCount++;
          
          let weight = 1;
          if (validation.matchType === 'triple') weight = 5;
          else if (validation.matchType === 'double') weight = 3;
          else if (validation.matchType === 'single') weight = 1;
          
          evidencias.push({
            source: sourceType,
            source_name: portal,
            matchType: validation.matchType,
            content: snippet,
            url: result.link,
            title: title,
            snippet: snippet,
            excerpt: snippet,
            weight: weight,
            detected_products: validation.detectedProducts,
          });
          
          console.log(`[DISCOVER-TECH] ✅ ${portal}: ${validation.matchType.toUpperCase()} - ${title.substring(0, 50)}`);
        }
        
        if (validCount > 0) {
          console.log(`[DISCOVER-TECH] ✅ ${portal}: ${validCount} evidências VÁLIDAS de ${results.length} resultados`);
        } else if (results.length > 0) {
          console.log(`[DISCOVER-TECH] ⚠️ ${portal}: ${results.length} resultados mas 0 VÁLIDOS (todos rejeitados)`);
        }
      } else {
        console.error(`[DISCOVER-TECH] ❌ ${portal}: Serper retornou status ${response.status}`);
      }
    } catch (error) {
      console.error(`[DISCOVER-TECH] ❌ Erro em ${portal}:`, error);
    }
  }
  
  console.log(`[DISCOVER-TECH] 🏁 Busca concluída: ${processedPortals}/${portals.length} portais processados`);
  console.log(`[DISCOVER-TECH] 📊 Total de evidências encontradas: ${evidencias.length}`);
  
  return evidencias;
}

/**
 * BUSCAR EM CASES OFICIAIS DO CONCORRENTE
 */
async function searchCompetitorCases(
  companyName: string,
  competitorName: string,
  productName: string,
  competitorWebsite: string,
  serperKey: string
): Promise<Evidence[]> {
  const evidencias: Evidence[] = [];
  
  const domain = competitorWebsite
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0];
  
  console.log(`[DISCOVER-TECH] 🔍 Buscando cases de ${competitorName} (${domain}) para ${companyName}...`);
  
  const companyVariations = getCompanyVariations(companyName);
  const shortCompanyName = companyVariations[companyVariations.length - 1] || companyName;
  
  const query = `"${shortCompanyName}" site:${domain}`;
  
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: query,
        num: 10,
        gl: 'br',
        hl: 'pt-br',
        tbs: 'qdr:y5',
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      const results = data.organic || [];
      
      for (const result of results) {
        if (!result.link.includes(domain)) continue;
        
        const validation = await isValidCompetitorEvidence(
          result.snippet || '',
          result.title || '',
          companyName,
          competitorName,
          productName,
          result.link || result.url || ''
        );
        
        if (!validation.valid) continue;
        
        let weight = validation.matchType === 'triple' ? 5 : validation.matchType === 'double' ? 3 : 1;
        
        evidencias.push({
          source: 'competitor_case',
          source_name: domain,
          matchType: validation.matchType,
          content: result.snippet || '',
          url: result.link,
          title: result.title || '',
          snippet: result.snippet || '',
          excerpt: result.snippet || '',
          weight: weight,
          detected_products: validation.detectedProducts,
        });
      }
    }
  } catch (error) {
    console.error(`[DISCOVER-TECH] ❌ Erro ao buscar cases de ${competitorName}:`, error);
  }
  
  return evidencias;
}

/**
 * CALCULAR SCORE DE CONFIANÇA
 */
function calculateConfidenceScore(evidences: Evidence[]): { score: number; confidence: 'high' | 'medium' | 'low' } {
  const tripleMatches = evidences.filter(e => e.matchType === 'triple').length;
  const doubleMatches = evidences.filter(e => e.matchType === 'double').length;
  
  let score = 0;
  
  const tripleInCases = evidences.filter(e => 
    e.matchType === 'triple' && e.source === 'competitor_case'
  ).length;
  if (tripleInCases > 0) score += 40;
  
  const tripleInOfficial = evidences.filter(e => 
    e.matchType === 'triple' && e.source === 'official_docs'
  ).length;
  if (tripleInOfficial > 0) score += 50;
  
  const tripleInNews = evidences.filter(e => 
    e.matchType === 'triple' && e.source === 'premium_news'
  ).length;
  if (tripleInNews > 0) score += 30;
  
  const tripleInJobs = evidences.filter(e => 
    e.matchType === 'triple' && e.source === 'job_portals'
  ).length;
  if (tripleInJobs > 0) score += 35;
  
  const doubleInJobs = evidences.filter(e => 
    e.matchType === 'double' && e.source === 'job_portals'
  ).length;
  if (doubleInJobs > 0) score += 20;
  
  const uniqueDomains = new Set(evidences.map(e => {
    try {
      return new URL(e.url).hostname;
    } catch {
      return e.url;
    }
  }));
  score += Math.min(uniqueDomains.size * 5, 20);
  
  if (tripleMatches >= 2) score += 10;
  
  let confidence: 'high' | 'medium' | 'low';
  if (score >= 70) confidence = 'high';
  else if (score >= 50) confidence = 'medium';
  else confidence = 'low';
  
  return { score, confidence };
}

/**
 * DESCOBERTA PRINCIPAL - 8 FASES IDÊNTICAS AO TOTVS CHECK
 */
async function discoverAllTechnologies(
  companyName: string,
  allUrls: string[],
  knownCompetitors: Array<{ 
    name: string; 
    products: Array<{ name: string; aliases: string[] }>;
    website?: string;
    casesPage?: string;
  }>,
  serperKey?: string
): Promise<TechnologyDiscovery> {
  const discovery: TechnologyDiscovery = {
    knownCompetitors: [],
    unknownTechnologies: [],
    customSystems: [],
    openSource: [],
    stats: {
      totalUrlsAnalyzed: 0,
      totalEvidences: 0,
      totalCompetitorsDetected: 0,
      totalUnknownTechnologies: 0,
      totalCustomSystems: 0,
    },
  };
  
  console.log(`[DISCOVER-TECH] 🚀 Iniciando descoberta dinâmica para: ${companyName}`);
  console.log(`[DISCOVER-TECH] 🏆 Concorrentes conhecidos: ${knownCompetitors?.length || 0}`);
  
  if (!serperKey) {
    console.warn('[DISCOVER-TECH] ⚠️ SERPER_API_KEY não configurada');
    return discovery;
  }
  
  const companyVariations = getCompanyVariations(companyName);
  const shortCompanyName = companyVariations[companyVariations.length - 1] || companyName;
  
  // Para cada concorrente e produto, executar as 8 FASES
  for (const competitor of knownCompetitors) {
    for (const product of competitor.products) {
      console.log(`[DISCOVER-TECH] 🔍 [${competitor.name} - ${product.name}] Iniciando 8 FASES...`);
      
      const allEvidences: Evidence[] = [];
      let totalQueries = 0;
      let sourcesConsulted = 0;
      
      // 🌐 FASE 1: BUSCA NOS PORTAIS DE VAGAS (últimos 5 anos)
      console.log(`[DISCOVER-TECH] 🌐 FASE 1: Buscando em portais de vagas...`);
      const evidenciasVagas = await searchMultiplePortalsForCompetitor({
        portals: JOB_PORTALS_NACIONAL,
        companyName: shortCompanyName,
        competitorName: competitor.name,
        productName: product.name,
        serperKey,
        sourceType: 'job_portals',
        sourceWeight: SOURCE_WEIGHTS.job_portals,
        dateRestrict: 'y5',
      });
      allEvidences.push(...evidenciasVagas);
      sourcesConsulted += JOB_PORTALS_NACIONAL.length;
      totalQueries += JOB_PORTALS_NACIONAL.length;
      console.log(`[DISCOVER-TECH] ✅ FASE 1: ${evidenciasVagas.length} evidências`);
      
      // 📘 FASE 2: BUSCA NOS CASES OFICIAIS DO CONCORRENTE
      console.log(`[DISCOVER-TECH] 📘 FASE 2: Buscando em cases oficiais...`);
      let evidenciasCases: Evidence[] = [];
      if (competitor.website || competitor.casesPage) {
        const website = competitor.website || competitor.casesPage || '';
        if (website) {
          evidenciasCases = await searchCompetitorCases(
            shortCompanyName,
            competitor.name,
            product.name,
            website,
            serperKey
          );
        }
      }
      allEvidences.push(...evidenciasCases);
      sourcesConsulted += evidenciasCases.length > 0 ? 1 : 0;
      totalQueries += evidenciasCases.length > 0 ? 1 : 0;
      console.log(`[DISCOVER-TECH] ✅ FASE 2: ${evidenciasCases.length} evidências`);
      
      // 📄 FASE 3: BUSCA NAS FONTES OFICIAIS (CVM, B3, TJSP)
      console.log(`[DISCOVER-TECH] 📄 FASE 3: Buscando em fontes oficiais...`);
      const evidenciasOficiais = await searchMultiplePortalsForCompetitor({
        portals: OFFICIAL_SOURCES_BR,
        companyName: shortCompanyName,
        competitorName: competitor.name,
        productName: product.name,
        serperKey,
        sourceType: 'official_docs',
        sourceWeight: SOURCE_WEIGHTS.official_docs,
        dateRestrict: 'y6',
      });
      allEvidences.push(...evidenciasOficiais);
      sourcesConsulted += OFFICIAL_SOURCES_BR.length;
      totalQueries += OFFICIAL_SOURCES_BR.length;
      console.log(`[DISCOVER-TECH] ✅ FASE 3: ${evidenciasOficiais.length} evidências`);
      
      // 📰 FASE 4: BUSCA NAS FONTES DE NOTÍCIAS PREMIUM
      console.log(`[DISCOVER-TECH] 📰 FASE 4: Buscando em notícias premium...`);
      const evidenciasNewsPremium = await searchMultiplePortalsForCompetitor({
        portals: NEWS_SOURCES_PREMIUM,
        companyName: shortCompanyName,
        competitorName: competitor.name,
        productName: product.name,
        serperKey,
        sourceType: 'premium_news',
        sourceWeight: SOURCE_WEIGHTS.premium_news,
        dateRestrict: 'y5',
      });
      allEvidences.push(...evidenciasNewsPremium);
      sourcesConsulted += NEWS_SOURCES_PREMIUM.length;
      totalQueries += NEWS_SOURCES_PREMIUM.length;
      console.log(`[DISCOVER-TECH] ✅ FASE 4: ${evidenciasNewsPremium.length} evidências`);
      
      // 📰 FASE 4.5: BUSCA EM PORTAIS DE TECNOLOGIA
      console.log(`[DISCOVER-TECH] 📰 FASE 4.5: Buscando em portais de tecnologia...`);
      const evidenciasTechPortals = await searchMultiplePortalsForCompetitor({
        portals: [
          'baguete.com.br',
          'cioadv.com.br',
          'mercadoeconsumo.com.br',
          'connectabil.com.br',
          'tiinside.com.br',
          'crn.com.br',
          'computerworld.com.br'
        ],
        companyName: shortCompanyName,
        competitorName: competitor.name,
        productName: product.name,
        serperKey,
        sourceType: 'tech_portals',
        sourceWeight: SOURCE_WEIGHTS.tech_portals,
        dateRestrict: 'y5',
      });
      allEvidences.push(...evidenciasTechPortals);
      sourcesConsulted += 7;
      totalQueries += 7;
      console.log(`[DISCOVER-TECH] ✅ FASE 4.5: ${evidenciasTechPortals.length} evidências`);
      
      // 🎥 FASE 5: BUSCA EM VÍDEOS (YouTube, Vimeo)
      console.log(`[DISCOVER-TECH] 🎥 FASE 5: Buscando em vídeos...`);
      const evidenciasVideos = await searchMultiplePortalsForCompetitor({
        portals: ['youtube.com', 'vimeo.com'],
        companyName: shortCompanyName,
        competitorName: competitor.name,
        productName: product.name,
        serperKey,
        sourceType: 'video_content',
        sourceWeight: SOURCE_WEIGHTS.video_content,
        dateRestrict: 'y5',
      });
      allEvidences.push(...evidenciasVideos);
      sourcesConsulted += 2;
      totalQueries += 2;
      console.log(`[DISCOVER-TECH] ✅ FASE 5: ${evidenciasVideos.length} evidências`);
      
      // 📱 FASE 6: BUSCA EM REDES SOCIAIS
      console.log(`[DISCOVER-TECH] 📱 FASE 6: Buscando em redes sociais...`);
      const evidenciasSocial = await searchMultiplePortalsForCompetitor({
        portals: ['instagram.com', 'facebook.com', 'linkedin.com/posts'],
        companyName: shortCompanyName,
        competitorName: competitor.name,
        productName: product.name,
        serperKey,
        sourceType: 'social_media',
        sourceWeight: SOURCE_WEIGHTS.social_media,
        dateRestrict: 'y3',
      });
      allEvidences.push(...evidenciasSocial);
      sourcesConsulted += 3;
      totalQueries += 3;
      console.log(`[DISCOVER-TECH] ✅ FASE 6: ${evidenciasSocial.length} evidências`);
      
      // 📰 FASE 8: BUSCA EM GOOGLE NEWS
      console.log(`[DISCOVER-TECH] 📰 FASE 8: Buscando em Google News...`);
      totalQueries++;
      try {
        const newsQuery = `"${shortCompanyName}" "${competitor.name}" "${product.name}"`;
        const newsResponse = await fetch('https://google.serper.dev/news', {
          method: 'POST',
          headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: newsQuery, num: 10, gl: 'br', hl: 'pt-br' }),
        });
        
        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          const news = newsData.news || [];
          
          for (const item of news) {
            const validation = await isValidCompetitorEvidence(
              item.snippet || '',
              item.title || '',
              companyName,
              competitor.name,
              product.name,
              item.link || item.url || ''
            );
            
            if (validation.valid) {
              let weight = validation.matchType === 'triple' ? 5 : validation.matchType === 'double' ? 3 : 1;
              allEvidences.push({
                source: 'google_news',
                source_name: 'google_news',
                matchType: validation.matchType,
                content: item.snippet || '',
                url: item.link || '',
                title: item.title || '',
                snippet: item.snippet || '',
                excerpt: item.snippet || '',
                weight: weight,
                detected_products: validation.detectedProducts,
              });
            }
          }
        }
      } catch (error) {
        console.error(`[DISCOVER-TECH] ❌ Erro FASE 8:`, error);
      }
      console.log(`[DISCOVER-TECH] ✅ FASE 8 concluída`);
      
      // Remover duplicatas
      const uniqueEvidences = Array.from(
        new Map(allEvidences.map(e => [e.url, e])).values()
      );
      
      if (uniqueEvidences.length > 0) {
        const { score, confidence } = calculateConfidenceScore(uniqueEvidences);
        const matchSummary = {
          single_matches: uniqueEvidences.filter(e => e.matchType === 'single').length,
          double_matches: uniqueEvidences.filter(e => e.matchType === 'double').length,
          triple_matches: uniqueEvidences.filter(e => e.matchType === 'triple').length,
        };
        
        discovery.knownCompetitors.push({
          competitor_name: competitor.name,
          product_name: product.name,
          confidence,
          evidences: uniqueEvidences,
          total_weight: uniqueEvidences.reduce((sum, e) => sum + e.weight, 0),
          match_summary: matchSummary,
          total_score: score,
        });
        
        console.log(`[DISCOVER-TECH] ✅ [${competitor.name} - ${product.name}] ${uniqueEvidences.length} evidências totais`);
      }
    }
  }
  
  discovery.stats = {
    totalUrlsAnalyzed: allUrls?.length || 0,
    totalEvidences: discovery.knownCompetitors.flatMap(c => c.evidences).length,
    totalCompetitorsDetected: discovery.knownCompetitors.length,
    totalUnknownTechnologies: 0,
    totalCustomSystems: 0,
  };
  
  return discovery;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: DiscoverAllTechnologiesRequest = await req.json();
    const { companyName, cnpj, allUrls, knownCompetitors = [] } = body;
    
    if (!companyName) {
      return new Response(
        JSON.stringify({ error: 'companyName é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const serperKey = Deno.env.get('SERPER_API_KEY');
    if (!serperKey) {
      return new Response(
        JSON.stringify({
          success: true,
          discovery: {
            knownCompetitors: [],
            unknownTechnologies: [],
            customSystems: [],
            openSource: [],
            stats: {
              totalUrlsAnalyzed: 0,
              totalEvidences: 0,
              totalCompetitorsDetected: 0,
              totalUnknownTechnologies: 0,
              totalCustomSystems: 0,
            },
          },
          error: 'SERPER_API_KEY não configurada',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    const discovery = await discoverAllTechnologies(
      companyName,
      allUrls || [],
      knownCompetitors || [],
      serperKey
    );
    
    return new Response(
      JSON.stringify({
        success: true,
        discovery,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[DISCOVER-TECH] ❌ Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
