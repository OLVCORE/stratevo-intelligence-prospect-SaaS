import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY') || '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

interface AnalyzedURL {
  url: string;
  title: string;
  snippet: string;
  date?: string;
  source_type: 'website' | 'linkedin' | 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'news' | 'review' | 'other';
  ai_analysis: {
    content_type: string;
    buying_signal: boolean;
    temperature: 'hot' | 'warm' | 'cold';
    pain_point?: string;
    event?: string;
    sales_relevance: number;
    insight: string;
    script_suggestion: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar se tem body antes de parsear
    const body = await req.text();
    if (!body) {
      return new Response(
        JSON.stringify({ error: 'Body is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { companyName, cnpj, domain, sector } = JSON.parse(body);

    console.log(`[DIGITAL-INTEL] 🚀 Iniciando análise para: ${companyName}`);

    // ETAPA 1: BUSCAR TODAS AS URLs (50-100)
    const allUrls = await searchAllUrls(companyName, cnpj, domain);
    console.log(`[DIGITAL-INTEL] ✅ ${allUrls.length} URLs coletadas`);

    // ETAPA 2: ANALISAR TODAS AS URLs EM PARALELO (BATCH DE 10)
    console.log(`[DIGITAL-INTEL] 🧠 Iniciando análise PARALELA de ${allUrls.length} URLs com GPT-4o-mini...`);
    
    const analyzedUrls: AnalyzedURL[] = [];
    let aiSuccessCount = 0;
    let aiErrorCount = 0;
    
    // Processar em lotes de 10 URLs por vez (evitar sobrecarga)
    const batchSize = 10;
    for (let i = 0; i < allUrls.length; i += batchSize) {
      const batch = allUrls.slice(i, i + batchSize);
      console.log(`[DIGITAL-INTEL] 📦 Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(allUrls.length / batchSize)} (${batch.length} URLs)`);
      
      // Analisar TODAS as URLs do lote EM PARALELO
      const batchPromises = batch.map(async (urlData) => {
        try {
          const analysis = await analyzeUrlWithAI(urlData, companyName);
          return { ...urlData, ai_analysis: analysis };
        } catch (error) {
          console.error(`[DIGITAL-INTEL] ❌ Erro ao analisar ${urlData.url}:`, error);
          // Retornar análise fria em caso de erro
          return {
            ...urlData,
            ai_analysis: {
              content_type: 'outro',
              buying_signal: false,
              temperature: 'cold' as const,
              pain_point: null,
              event: null,
              sales_relevance: 1,
              insight: 'Análise falhou',
              script_suggestion: '',
            }
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        if (result.ai_analysis.buying_signal || result.ai_analysis.temperature === 'hot') {
          aiSuccessCount++;
          console.log(`[DIGITAL-INTEL] 🔥 Sinal detectado! Temperature: ${result.ai_analysis.temperature}, Relevance: ${result.ai_analysis.sales_relevance}/10`);
        } else {
          aiErrorCount++;
        }
        analyzedUrls.push(result);
      });
      
      console.log(`[DIGITAL-INTEL] ✅ Lote ${Math.floor(i / batchSize) + 1} completo`);
    }
    
    console.log(`[DIGITAL-INTEL] ✅ Análise IA completa: ${aiSuccessCount} sinais positivos, ${aiErrorCount} neutros`);

    // ETAPA 3: CROSS-MATCHING E DIAGNÓSTICO FINAL
    const diagnosis = await generateDiagnosis(analyzedUrls, companyName, sector);

    return new Response(
      JSON.stringify(diagnosis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[DIGITAL-INTEL] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function searchAllUrls(companyName: string, cnpj: string, domain?: string) {
  // 🔥 TODAS AS 20 QUERIES MANTIDAS - MÁXIMA ASSERTIVIDADE
  const searches = [
    // Website oficial
    `site oficial ${companyName}`,
    `${companyName} CNPJ ${cnpj}`,
    
    // Redes sociais
    `${companyName} site:linkedin.com/company`,
    `${companyName} site:instagram.com`,
    `${companyName} site:facebook.com`,
    `${companyName} site:twitter.com OR site:x.com`,
    `${companyName} site:youtube.com`,
    
    // Blog e notícias
    `${companyName} blog`,
    `${companyName} notícias`,
    `${companyName} comunicados`,
    
    // Vagas e expansão
    `${companyName} vagas site:linkedin.com/jobs`,
    `${companyName} contratando`,
    
    // Reclamações e dores
    `${companyName} site:reclameaqui.com.br`,
    `${companyName} problemas`,
    
    // Investimentos e crescimento
    `${companyName} investimento`,
    `${companyName} expansão`,
    `${companyName} nova filial`,
    
    // Tecnologia
    `${companyName} ERP`,
    `${companyName} sistema`,
  ];

  const allResults = [];
  
  for (const query of searches) {
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num: 5 }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.organic) {
          data.organic.forEach((result: any) => {
            allResults.push({
              url: result.link,
              title: result.title,
              snippet: result.snippet || '',
              date: result.date,
              source_type: detectSourceType(result.link),
            });
          });
        }
      }
      
      // Rate limiting (aumentado para 500ms - mais seguro)
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`[SEARCH] Erro na busca "${query}":`, error);
    }
  }

  // Remover duplicatas
  const uniqueUrls = Array.from(new Map(allResults.map(item => [item.url, item])).values());
  return uniqueUrls;
}

function detectSourceType(url: string): AnalyzedURL['source_type'] {
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('facebook.com')) return 'facebook';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('youtube.com')) return 'youtube';
  if (url.includes('reclameaqui.com.br')) return 'review';
  if (url.includes('noticia') || url.includes('news') || url.includes('blog')) return 'news';
  return 'other';
}

async function analyzeUrlWithAI(urlData: any, companyName: string) {
  const systemPrompt = `Você é um analista de vendas B2B especializado em identificar oportunidades comerciais através de presença digital. Retorne APENAS JSON válido, sem markdown.`;
  
  const userPrompt = `Analise este conteúdo da empresa ${companyName}:

URL: ${urlData.url}
Título: ${urlData.title}
Conteúdo: ${urlData.snippet}
Data: ${urlData.date || 'Não disponível'}

Retorne JSON:
{
  "content_type": "vaga_emprego|noticia|reclamacao|post_social|comunicado|produto|outro",
  "buying_signal": boolean,
  "temperature": "hot|warm|cold",
  "pain_point": "string ou null",
  "event": "string ou null",
  "sales_relevance": 1-10,
  "insight": "máx 100 caracteres",
  "script_suggestion": "máx 150 caracteres"
}

CRITÉRIOS:
- HOT: Vaga TI, reclamação sistema, expansão, investimento
- WARM: Notícia positiva, crescimento, evento
- COLD: Conteúdo genérico`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    return JSON.parse(content);
  } catch (error) {
    console.error('[AI] Erro na análise:', error);
    // Fallback se a IA não retornar JSON válido
    return {
      content_type: 'outro',
      buying_signal: false,
      temperature: 'cold',
      pain_point: null,
      event: null,
      sales_relevance: 1,
      insight: 'Análise não conclusiva',
      script_suggestion: '',
    };
  }
}

async function generateDiagnosis(analyzedUrls: AnalyzedURL[], companyName: string, sector?: string) {
  // Calcular temperatura global
  const hotCount = analyzedUrls.filter(u => u.ai_analysis.temperature === 'hot').length;
  const warmCount = analyzedUrls.filter(u => u.ai_analysis.temperature === 'warm').length;
  const coldCount = analyzedUrls.filter(u => u.ai_analysis.temperature === 'cold').length;

  let overallTemperature: 'hot' | 'warm' | 'cold' = 'cold';
  let temperatureScore = 0;

  if (hotCount >= 3) {
    overallTemperature = 'hot';
    temperatureScore = 85 + (hotCount * 2);
  } else if (hotCount >= 1 || warmCount >= 5) {
    overallTemperature = 'warm';
    temperatureScore = 50 + (hotCount * 10) + (warmCount * 3);
  } else {
    overallTemperature = 'cold';
    temperatureScore = 20 + (warmCount * 2);
  }

  temperatureScore = Math.min(100, temperatureScore);

  // Extrair sinais de compra
  const buyingSignals = analyzedUrls
    .filter(u => u.ai_analysis.buying_signal)
    .map(u => ({
      signal: u.ai_analysis.event || u.title,
      source: u.source_type,
      url: u.url,
      relevance: u.ai_analysis.sales_relevance >= 7 ? 'critical' as const : 
                 u.ai_analysis.sales_relevance >= 5 ? 'high' as const : 'medium' as const,
    }))
    .sort((a, b) => (b.relevance === 'critical' ? 1 : 0) - (a.relevance === 'critical' ? 1 : 0))
    .slice(0, 10);

  // Extrair dores
  const painPoints = analyzedUrls
    .filter(u => u.ai_analysis.pain_point)
    .map(u => ({
      pain: u.ai_analysis.pain_point!,
      severity: u.source_type === 'review' ? 'critical' as const : 
                u.ai_analysis.sales_relevance >= 7 ? 'high' as const : 'medium' as const,
      source: u.source_type,
      url: u.url,
      totvs_solution: suggestTOTVSSolution(u.ai_analysis.pain_point!),
    }))
    .slice(0, 5);

  // Extrair presença digital
  const digitalPresence = {
    website: analyzedUrls.find(u => u.source_type === 'other' && !u.url.includes('linkedin'))?.url,
    linkedin: analyzedUrls.find(u => u.source_type === 'linkedin')?.url,
    instagram: analyzedUrls.find(u => u.source_type === 'instagram')?.url,
    facebook: analyzedUrls.find(u => u.source_type === 'facebook')?.url,
    twitter: analyzedUrls.find(u => u.source_type === 'twitter')?.url,
    youtube: analyzedUrls.find(u => u.source_type === 'youtube')?.url,
  };

  // Calcular probabilidade de fechamento
  const closingProbability = Math.min(100, 
    temperatureScore * 0.6 + 
    (buyingSignals.length * 5) + 
    (painPoints.length * 8)
  );

  return {
    temperature: overallTemperature,
    temperature_score: temperatureScore,
    sales_readiness_score: Math.round(temperatureScore / 10),
    closing_probability: Math.round(closingProbability),
    digital_presence: digitalPresence,
    buying_signals: buyingSignals,
    pain_points: painPoints,
    timeline: [], // TODO: Ordenar por data
    ai_diagnosis: generateDiagnosisText(overallTemperature, buyingSignals, painPoints),
    sales_script: generateSalesScript(companyName, buyingSignals, painPoints),
    approach_timing: getApproachTiming(overallTemperature, buyingSignals),
    analyzed_urls: analyzedUrls,
    generated_at: new Date().toISOString(),
  };
}

function suggestTOTVSSolution(painPoint: string): string {
  const pain = painPoint.toLowerCase();
  if (pain.includes('erp') || pain.includes('sistema')) return 'TOTVS Protheus (ERP Cloud)';
  if (pain.includes('estoque') || pain.includes('inventário')) return 'TOTVS WMS';
  if (pain.includes('fiscal') || pain.includes('nota')) return 'TOTVS Fiscal Compliance';
  if (pain.includes('vendas') || pain.includes('crm')) return 'TOTVS CRM';
  return 'TOTVS ERP Suite';
}

function generateDiagnosisText(temperature: string, signals: any[], pains: any[]): string {
  if (temperature === 'hot') {
    return `Empresa em momento CRÍTICO de oportunidade. Identificamos ${signals.length} sinais de compra ativos e ${pains.length} dores confirmadas. ABORDAR IMEDIATAMENTE.`;
  } else if (temperature === 'warm') {
    return `Empresa apresenta sinais positivos de oportunidade. ${signals.length} indicadores favoráveis identificados. Momento adequado para abordagem consultiva.`;
  } else {
    return `Empresa sem sinais urgentes de oportunidade no momento. Recomenda-se nurturing e acompanhamento mensal.`;
  }
}

function generateSalesScript(companyName: string, signals: any[], pains: any[]): string {
  if (signals.length === 0) {
    return `Olá! Vi que a ${companyName} atua no setor e gostaria de compartilhar cases de empresas similares que otimizaram processos com TOTVS.`;
  }

  const topSignal = signals[0];
  return `Olá! Vi que a ${companyName} ${topSignal.signal}. Trabalho com empresas do setor e temos cases específicos que podem ser relevantes. Podemos agendar 15min esta semana?`;
}

function getApproachTiming(temperature: string, signals: any[]): string {
  if (temperature === 'hot') {
    return 'IMEDIATO (próximos 3-7 dias)';
  } else if (temperature === 'warm') {
    return 'CURTO PRAZO (próximas 2 semanas)';
  } else {
    return 'MÉDIO PRAZO (próximo mês)';
  }
}

