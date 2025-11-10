/**
 * ANALYZE URLs DEEP
 * 
 * Analisa profundamente TODAS as URLs e redes sociais descobertas
 * para entender o momento atual da empresa:
 * - Lançamentos de produtos
 * - Expansão geográfica
 * - Participação em feiras/eventos
 * - Contratações
 * - Parcerias estratégicas
 * - Prêmios e reconhecimentos
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzeUrlsRequest {
  companyName: string;
  urls: string[]; // Todas URLs descobertas (50+)
  socialNetworks: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
}

interface UrlAnalysisResult {
  url: string;
  title: string;
  content: string;
  signals: {
    productLaunch: boolean;
    expansion: boolean;
    hiring: boolean;
    partnership: boolean;
    award: boolean;
    event: boolean;
    international: boolean;
  };
  keywords: string[];
  date?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { companyName, urls, socialNetworks }: AnalyzeUrlsRequest = await req.json();
    
    console.log('[ANALYZE-URLS] 🔍 Analisando', urls.length, 'URLs para:', companyName);
    
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // ==================================================================
    // ETAPA 1: FETCH E ANÁLISE DE URLs (máximo 50)
    // ==================================================================
    const urlsToAnalyze = urls.slice(0, 50);
    const urlAnalyses: UrlAnalysisResult[] = [];
    
    for (const url of urlsToAnalyze) {
      try {
        // Fetch conteúdo da URL
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(10000) // 10s timeout
        });
        
        if (!response.ok) continue;
        
        const html = await response.text();
        
        // Extrair título e meta description
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
        
        const title = titleMatch ? titleMatch[1] : '';
        const description = descMatch ? descMatch[1] : '';
        
        // Extrair snippet de texto (primeiros 500 chars)
        const textContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .substring(0, 500);
        
        // Detectar sinais específicos
        const contentLower = (title + ' ' + description + ' ' + textContent).toLowerCase();
        
        const signals = {
          productLaunch: /lançamento|novo produto|nova linha|inovação|produto|lançar/i.test(contentLower),
          expansion: /expansão|nova unidade|novo escritório|filial|internacional|export/i.test(contentLower),
          hiring: /contrat|vaga|oportunidade|trabalhe conosco|carreira/i.test(contentLower),
          partnership: /parceria|acordo|aliança|joint venture|colaboração/i.test(contentLower),
          award: /prêmio|reconhecimento|certificação|iso|award|top/i.test(contentLower),
          event: /feira|evento|congresso|conferência|palestra|participação/i.test(contentLower),
          international: /internacional|export|import|exterior|global/i.test(contentLower)
        };
        
        urlAnalyses.push({
          url,
          title,
          content: title + ' ' + description,
          signals,
          keywords: []
        });
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error('[ANALYZE-URLS] Erro ao fetch', url, error);
      }
    }
    
    console.log('[ANALYZE-URLS] ✅ Analisadas', urlAnalyses.length, 'URLs');

    // ==================================================================
    // ETAPA 2: ANÁLISE DE REDES SOCIAIS (LinkedIn, etc.)
    // ==================================================================
    const socialInsights: string[] = [];
    
    // LinkedIn (mais importante para B2B)
    if (socialNetworks.linkedin) {
      socialInsights.push('LinkedIn ativo - bom sinal para abordagem B2B');
    }
    
    // Instagram/Facebook (indica atividade de marketing)
    if (socialNetworks.instagram || socialNetworks.facebook) {
      socialInsights.push('Presença em redes sociais - empresa investe em marketing digital');
    }
    
    // YouTube (indica conteúdo educacional/cases)
    if (socialNetworks.youtube) {
      socialInsights.push('Canal YouTube - empresa produz conteúdo, pode estar madura digitalmente');
    }

    // ==================================================================
    // ETAPA 3: SÍNTESE COM IA (GPT-4o-mini)
    // ==================================================================
    
    // Consolidar sinais
    const totalProductLaunches = urlAnalyses.filter(u => u.signals.productLaunch).length;
    const totalExpansions = urlAnalyses.filter(u => u.signals.expansion).length;
    const totalHiring = urlAnalyses.filter(u => u.signals.hiring).length;
    const totalPartnerships = urlAnalyses.filter(u => u.signals.partnership).length;
    const totalAwards = urlAnalyses.filter(u => u.signals.award).length;
    const totalEvents = urlAnalyses.filter(u => u.signals.event).length;
    const totalInternational = urlAnalyses.filter(u => u.signals.international).length;
    
    // Top URLs com sinais
    const relevantUrls = urlAnalyses
      .filter(u => Object.values(u.signals).some(s => s))
      .slice(0, 10);
    
    const aiPrompt = `Analise as URLs e redes sociais da empresa ${companyName} e determine o MOMENTO ATUAL:

SINAIS DETECTADOS (${urlAnalyses.length} URLs analisadas):
- Lançamentos de produtos: ${totalProductLaunches}
- Expansões: ${totalExpansions}
- Contratações: ${totalHiring}
- Parcerias: ${totalPartnerships}
- Prêmios/Certificações: ${totalAwards}
- Eventos/Feiras: ${totalEvents}
- Atividade Internacional: ${totalInternational}

REDES SOCIAIS:
${Object.entries(socialNetworks).filter(([k, v]) => v).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

URLs COM SINAIS RELEVANTES:
${relevantUrls.map(u => `- ${u.title} (${Object.entries(u.signals).filter(([k, v]) => v).map(([k]) => k).join(', ')})`).join('\n')}

Responda APENAS JSON:
{
  "company_moment": "expansion|stable|crisis|transformation",
  "digital_maturity": "high|medium|low",
  "key_insights": [
    "Insight 1 baseado nas URLs analisadas",
    "Insight 2",
    "Insight 3"
  ],
  "recent_activities": [
    "Atividade recente 1",
    "Atividade recente 2"
  ],
  "buying_signals": [
    "Sinal de compra 1 (ex: contratando TI)",
    "Sinal 2"
  ],
  "red_flags": ["Alerta se houver"],
  "green_flags": ["Sinal positivo"],
  "recommended_approach": "aggressive|consultive|cautious",
  "best_timing": "immediate|1-3_months|6_months",
  "confidence_level": "high|medium|low"
}`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: aiPrompt }],
        temperature: 0.6,
        max_tokens: 1500
      })
    });

    let deepAnalysis: any = null;
    
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const aiContent = aiData.choices[0].message.content;
      deepAnalysis = JSON.parse(aiContent.replace(/```json\n?|```/g, ''));
      console.log('[ANALYZE-URLS] ✅ Análise profunda completa');
    }

    // ==================================================================
    // RESPOSTA FINAL
    // ==================================================================
    const response = {
      success: true,
      company_name: companyName,
      urls_analyzed: urlAnalyses.length,
      signals_summary: {
        productLaunches: totalProductLaunches,
        expansions: totalExpansions,
        hiring: totalHiring,
        partnerships: totalPartnerships,
        awards: totalAwards,
        events: totalEvents,
        international: totalInternational
      },
      deep_analysis: deepAnalysis || {
        company_moment: 'unknown',
        key_insights: ['Análise não disponível'],
        buying_signals: [],
        recommended_approach: 'consultive'
      },
      relevant_urls: relevantUrls.map(u => ({
        url: u.url,
        title: u.title,
        signals: Object.entries(u.signals).filter(([k, v]) => v).map(([k]) => k)
      })),
      analyzed_at: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('[ANALYZE-URLS] Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

