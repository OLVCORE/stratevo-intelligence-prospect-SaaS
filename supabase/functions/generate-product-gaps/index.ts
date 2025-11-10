import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductGapRequest {
  companyId: string;
  companyName: string;
  cnpj?: string;
  sector?: string;
  cnae?: string;
  size?: string;
  employees?: number;
  detectedProducts?: string[];
  detectedEvidences?: Array<{
    product: string;
    sources: Array<{ url: string; title: string; source_name: string }>;
  }>;
  competitors?: any[];
  similarCompanies?: any[];
}

// Catálogo TOTVS (14 categorias) - EXPANDIDO
const TOTVS_PRODUCTS = {
  'IA': ['Carol AI', 'Auditoria Folha IA', 'Análise Preditiva', 'IA Generativa'],
  'ERP': ['Protheus', 'Datasul', 'RM', 'Logix', 'Winthor', 'Backoffice'],
  'Analytics': ['TOTVS BI', 'Advanced Analytics', 'Data Platform', 'Dashboards'],
  'Assinatura': ['TOTVS Assinatura Eletrônica', 'DocuSign Integration'],
  'Atendimento': ['TOTVS Chatbot', 'Service Desk', 'Omnichannel'],
  'Cloud': ['TOTVS Cloud', 'IaaS', 'Backup Cloud', 'Disaster Recovery'],
  'Crédito': ['TOTVS Techfin', 'Antecipação de Recebíveis', 'Capital de Giro'],
  'CRM': ['TOTVS CRM', 'Sales Force Automation', 'Customer 360'],
  'Fluig': ['Fluig BPM', 'Fluig ECM', 'Fluig Workflow', 'Processos Digitais'],
  'iPaaS': ['TOTVS iPaaS', 'API Management', 'Integração de Sistemas'],
  'Marketing': ['RD Station', 'Marketing Automation', 'Lead Generation'],
  'Pagamentos': ['TOTVS Pay', 'PIX Integrado', 'Gateway de Pagamentos'],
  'RH': ['TOTVS Folha', 'TOTVS Ponto', 'TOTVS Recrutamento', 'LMS', 'Performance'],
  'SFA': ['TOTVS SFA', 'Força de Vendas', 'Mobile Sales']
};

// PRODUCT_SEGMENT_MATRIX - Mapeamento simplificado para Edge Function
const SEGMENT_PRIORITIES = {
  'Indústria': { primary: ['Protheus', 'Datasul', 'Fluig BPM', 'TOTVS BI'], relevant: ['Carol AI', 'TOTVS Cloud', 'TOTVS iPaaS'] },
  'Educação': { primary: ['RM', 'Fluig ECM', 'TOTVS CRM'], relevant: ['RD Station', 'TOTVS Chatbot', 'TOTVS Pay'] },
  'Varejo': { primary: ['Winthor', 'TOTVS Pay', 'TOTVS SFA'], relevant: ['TOTVS CRM', 'TOTVS BI', 'Carol AI'] },
  'Serviços': { primary: ['Protheus', 'Fluig BPM', 'TOTVS CRM'], relevant: ['RD Station', 'TOTVS Assinatura Eletrônica', 'TOTVS Chatbot'] },
  'Saúde': { primary: ['RM', 'Fluig ECM', 'TOTVS Cloud'], relevant: ['TOTVS BI', 'TOTVS Chatbot'] },
  'Tecnologia': { primary: ['Protheus', 'TOTVS CRM', 'RD Station'], relevant: ['Fluig BPM', 'TOTVS iPaaS', 'Carol AI'] },
  'Construção': { primary: ['Datasul', 'Fluig BPM'], relevant: ['TOTVS BI', 'TOTVS Assinatura Eletrônica'] },
  'Agronegócio': { primary: ['Datasul', 'TOTVS BI'], relevant: ['Carol AI', 'TOTVS Cloud'] }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const body: ProductGapRequest = await req.json();
    const {
      companyName,
      sector,
      cnae,
      size,
      employees,
      detectedProducts = [],
      detectedEvidences = [],
      competitors = [],
      similarCompanies = []
    } = body;

    console.log('[PRODUCT-GAPS] ✨ EVOLUÇÃO v2.0: Produtos & Oportunidades');
    console.log('[PRODUCT-GAPS] 📊 Empresa:', companyName);
    console.log('[PRODUCT-GAPS] 📦 Produtos detectados:', detectedProducts.length);
    console.log('[PRODUCT-GAPS] 🔍 Evidências:', detectedEvidences.length);

    // ✅ CONECTAR OPENAI GPT-4o-mini
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiKey) {
      console.error('[PRODUCT-GAPS] ❌ OPENAI_API_KEY não configurada!');
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // ==================================================================
    // ETAPA 1: PRODUTOS EM USO (Confirmados por evidências)
    // ==================================================================
    const productsInUse = detectedEvidences.map(evidence => ({
      product: evidence.product,
      category: Object.keys(TOTVS_PRODUCTS).find(cat =>
        TOTVS_PRODUCTS[cat as keyof typeof TOTVS_PRODUCTS].includes(evidence.product)
      ) || 'Outro',
      evidenceCount: evidence.sources.length,
      sources: evidence.sources.slice(0, 3) // Top 3 fontes mais relevantes
    }));

    console.log('[PRODUCT-GAPS] ✅ Produtos em uso:', productsInUse.length);

    // ==================================================================
    // ETAPA 2: IDENTIFICAR SEGMENTO E BUSCAR MATRIZ
    // ==================================================================
    const normalizedSector = (sector || 'Serviços').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const segmentKey = Object.keys(SEGMENT_PRIORITIES).find(key =>
      normalizedSector.toLowerCase().includes(key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())
    ) || 'Serviços';

    const segmentMatrix = SEGMENT_PRIORITIES[segmentKey as keyof typeof SEGMENT_PRIORITIES] || 
                          SEGMENT_PRIORITIES['Serviços'];

    console.log('[PRODUCT-GAPS] 🎯 Segmento:', segmentKey);

    // ==================================================================
    // ETAPA 3: GAP ANALYSIS - OPORTUNIDADES PRIMÁRIAS E RELEVANTES
    // ==================================================================
    const strategy = detectedProducts.length > 0 ? 'cross-sell' : 'new-sale';
    
    // Oportunidades Primárias: Produtos nucleares NÃO detectados
    const primaryGaps = segmentMatrix.primary.filter(p => !detectedProducts.includes(p));
    
    // Oportunidades Relevantes: Produtos complementares NÃO detectados
    const relevantGaps = segmentMatrix.relevant.filter(p => !detectedProducts.includes(p));

    console.log('[PRODUCT-GAPS] 🎯 Oportunidades Primárias:', primaryGaps.length);
    console.log('[PRODUCT-GAPS] 💡 Oportunidades Relevantes:', relevantGaps.length);

    // ==================================================================
    // ETAPA 4: GERAR RECOMENDAÇÕES DETALHADAS COM IA
    // ==================================================================
    const competitorInfo = competitors.length > 0 ? 
      `\nCONCORRENTES: ${competitors.map(c => c.name).join(', ')}` : '';

    const aiPrompt = `Você é especialista em produtos TOTVS e vendas B2B.

EMPRESA: ${companyName}
SETOR: ${sector || 'não especificado'}
PORTE: ${size || 'médio'} (${employees || '?'} funcionários)
CNAE: ${cnae || 'não especificado'}${competitorInfo}
ESTRATÉGIA: ${strategy === 'cross-sell' ? 'CROSS-SELL (já é cliente TOTVS)' : 'NEW SALE (prospect)'}

PRODUTOS JÁ EM USO: ${detectedProducts.length > 0 ? detectedProducts.join(', ') : 'Nenhum'}

OPORTUNIDADES PRIMÁRIAS (nucleares, alta prioridade):
${primaryGaps.slice(0, 3).join(', ') || 'Nenhuma'}

OPORTUNIDADES RELEVANTES (complementares, média prioridade):
${relevantGaps.slice(0, 3).join(', ') || 'Nenhuma'}

TAREFA: Gere recomendações COMPLETAS para os produtos acima.

Responda APENAS JSON válido:
{
  "primary_opportunities": [
    {
      "name": "Nome do Produto",
      "category": "Categoria",
      "fit_score": 85-100,
      "value": "R$ XXK-XXXK ARR",
      "reason": "Por que esse produto faz sentido PARA ESSA EMPRESA ESPECÍFICA",
      "use_case": "Caso de uso específico para ${sector}",
      "roi_months": 12-24,
      "priority": "high",
      "timing": "immediate",
      "benefits": ["Benefício específico 1", "Benefício 2", "Benefício 3"],
      "case_study": "Exemplo real de sucesso no segmento ${sector}"
    }
  ],
  "relevant_opportunities": [
    {
      "name": "Nome do Produto",
      "category": "Categoria",
      "fit_score": 70-85,
      "value": "R$ XXK-XXXK ARR",
      "reason": "Razão específica",
      "use_case": "Caso de uso",
      "roi_months": 15-24,
      "priority": "medium",
      "timing": "short_term",
      "benefits": ["Benefício 1", "Benefício 2", "Benefício 3"],
      "case_study": "Exemplo de sucesso"
    }
  ],
  "estimated_potential": {
    "min_revenue": "R$ XXXK",
    "max_revenue": "R$ XXXK",
    "close_probability": "70-85%",
    "timeline_months": "6-12 meses"
  }
}`;

    let aiRecommendations: any = null;

    try {
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: aiPrompt }],
          temperature: 0.7,
          max_tokens: 2500
        })
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const aiContent = aiData.choices[0].message.content;
        aiRecommendations = JSON.parse(aiContent.replace(/```json\n?|```/g, ''));
        console.log('[PRODUCT-GAPS] ✅ IA gerou recomendações com sucesso');
      }
    } catch (error) {
      console.error('[PRODUCT-GAPS] ⚠️ Erro na IA, usando fallback:', error);
    }

    // ==================================================================
    // ETAPA 5: GERAR SCRIPTS DE VENDAS COM IA
    // ==================================================================
    const salesPrompt = `Você é especialista em vendas B2B de software empresarial.

EMPRESA: ${companyName}
SETOR: ${sector}
ESTRATÉGIA: ${strategy === 'cross-sell' ? 'CROSS-SELL' : 'NEW SALE'}
PRODUTOS OPORTUNIDADE: ${primaryGaps.slice(0, 2).join(', ')}

Gere scripts de abordagem comercial profissionais e personalizados.

Responda APENAS JSON:
{
  "email_script": {
    "subject": "Assunto atrativo e personalizado",
    "body": "Email completo em HTML com 3-4 parágrafos, personalizado para ${sector}, mencionando dores específicas do segmento"
  },
  "call_script": {
    "opening": "Abertura de ligação (30s)",
    "discovery": "3 perguntas de descoberta específicas para ${sector}",
    "pitch": "Pitch de valor em 60s",
    "objections": ["Objeção comum 1 e resposta", "Objeção 2 e resposta"],
    "closing": "Fechamento e próximos passos"
  },
  "talking_points": [
    "Ponto-chave 1 específico para ${sector}",
    "Ponto-chave 2",
    "Ponto-chave 3"
  ]
}`;

    let salesScripts: any = null;

    try {
      const salesResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: salesPrompt }],
          temperature: 0.8,
          max_tokens: 2000
        })
      });

      if (salesResponse.ok) {
        const salesData = await salesResponse.json();
        const salesContent = salesData.choices[0].message.content;
        salesScripts = JSON.parse(salesContent.replace(/```json\n?|```/g, ''));
        console.log('[PRODUCT-GAPS] ✅ Scripts de vendas gerados');
      }
    } catch (error) {
      console.error('[PRODUCT-GAPS] ⚠️ Erro ao gerar scripts:', error);
    }

    // ==================================================================
    // ETAPA 6: MONTAR RESPOSTA FINAL
    // ==================================================================
    const primaryOpportunities = aiRecommendations?.primary_opportunities || [];
    const relevantOpportunities = aiRecommendations?.relevant_opportunities || [];
    const estimatedPotential = aiRecommendations?.estimated_potential || {
      min_revenue: 'R$ 300K',
      max_revenue: 'R$ 800K',
      close_probability: '70-80%',
      timeline_months: '6-12 meses'
    };

    // Calcular valor total
    const allOpportunities = [...primaryOpportunities, ...relevantOpportunities];
    const totalEstimatedValue = allOpportunities.length > 0 
      ? `R$ ${allOpportunities.length * 150}K-${allOpportunities.length * 300}K ARR`
      : 'R$ 0';

    // Stack sugerido
    const stackSuggestion = {
      core: primaryOpportunities.map((p: any) => p.name),
      complementary: relevantOpportunities.map((p: any) => p.name),
      future_expansion: ['Carol AI', 'TOTVS Analytics', 'TOTVS Cloud']
    };

    const response = {
      success: true,
      strategy,
      segment: segmentKey,
      
      // 1️⃣ PRODUTOS EM USO
      products_in_use: productsInUse,
      
      // 2️⃣ OPORTUNIDADES PRIMÁRIAS (nucleares)
      primary_opportunities: primaryOpportunities,
      
      // 3️⃣ OPORTUNIDADES RELEVANTES (complementares)
      relevant_opportunities: relevantOpportunities,
      
      // 4️⃣ POTENCIAL ESTIMADO
      estimated_potential: estimatedPotential,
      
      // 5️⃣ ABORDAGEM SUGERIDA (scripts IA)
      sales_approach: salesScripts || {
        email_script: { subject: 'Oportunidade TOTVS', body: 'Script não disponível' },
        call_script: { opening: 'Script não disponível' },
        talking_points: ['Ponto 1', 'Ponto 2', 'Ponto 3']
      },
      
      // 6️⃣ STACK SUGERIDO
      stack_suggestion: stackSuggestion,
      
      // LEGADO (manter compatibilidade)
      recommended_products: [...primaryOpportunities, ...relevantOpportunities].slice(0, 5),
      total_estimated_value: totalEstimatedValue,
      insights: [
        strategy === 'cross-sell' 
          ? `Cliente TOTVS: ${productsInUse.length} produtos em uso. ${primaryOpportunities.length + relevantOpportunities.length} oportunidades identificadas.`
          : `Prospect: ${primaryOpportunities.length + relevantOpportunities.length} produtos recomendados para stack inicial.`,
        `Potencial de receita: ${estimatedPotential.min_revenue} - ${estimatedPotential.max_revenue}`,
        `Timeline estimado: ${estimatedPotential.timeline_months}`
      ],
      generated_at: new Date().toISOString()
    };

    console.log('[PRODUCT-GAPS] ✅ Análise completa finalizada');
    console.log('[PRODUCT-GAPS] 📊 Total oportunidades:', primaryOpportunities.length + relevantOpportunities.length);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('[PRODUCT-GAPS] ❌ Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao gerar análise de produtos e oportunidades'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
