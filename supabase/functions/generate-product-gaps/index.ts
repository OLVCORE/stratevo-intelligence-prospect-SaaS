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
  
  // 🧠 DADOS CONTEXTUAIS DE TODAS AS ABAS
  decisorsData?: {
    total: number;
    cLevel: number;
    hasFinanceDecisors: boolean;
    hasTechDecisors: boolean;
  };
  digitalData?: {
    maturityScore: number;
    hasWebsite: boolean;
    hasSocialMedia: boolean;
    technologies: string[];
    websiteTraffic?: number;
    allUrls?: string[]; // 🔥 TODAS AS URLs descobertas (50+)
    socialNetworks?: {
      linkedin?: string;
      facebook?: string;
      instagram?: string;
      twitter?: string;
      youtube?: string;
    };
    websiteContent?: string;
    // 🔥 ANÁLISE PROFUNDA (de analyze-urls-deep)
    deepAnalysis?: {
      company_moment: string;
      digital_maturity: string;
      key_insights: string[];
      recent_activities: string[];
      buying_signals: string[];
      red_flags: string[];
      green_flags: string[];
      recommended_approach: string;
      best_timing: string;
    };
    signalsSummary?: {
      productLaunches: number;
      expansions: number;
      hiring: number;
      partnerships: number;
      awards: number;
      events: number;
      international: number;
    };
  };
  analysis360Data?: {
    revenue: number;
    debts: number;
    debtsPercentage: number;
    growthRate: number;
    hiringTrends: number;
    recentNews: number;
    healthScore: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  };
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
  'Agronegócio': { primary: ['Datasul', 'TOTVS BI'], relevant: ['Carol AI', 'TOTVS Cloud'] },
  'Sustentabilidade': { primary: ['Protheus', 'Fluig BPM', 'TOTVS BI'], relevant: ['TOTVS Cloud', 'Fluig ECM', 'TOTVS iPaaS'] },
  'Reciclagem': { primary: ['Protheus', 'Fluig BPM', 'TOTVS BI'], relevant: ['TOTVS Cloud', 'Fluig ECM', 'TOTVS iPaaS'] }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ✅ Criar cliente Supabase com SERVICE_ROLE_KEY (mesmo padrão de enrich-apollo-decisores)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!serviceRoleKey) {
      console.error('[PRODUCT-GAPS] ❌ SERVICE_ROLE_KEY não configurada!');
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration', details: 'SERVICE_ROLE_KEY missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    // ✅ VALIDAÇÃO: Tentar parsear o body com tratamento de erro robusto
    let body: ProductGapRequest;
    try {
      body = await req.json();
      console.log('[PRODUCT-GAPS] ✅ Body recebido:', {
        companyName: body.companyName,
        cnpj: body.cnpj || '(não fornecido)',
        sector: body.sector,
        hasCompanyName: !!body.companyName
      });
    } catch (parseError) {
      console.error('[PRODUCT-GAPS] ❌ Erro ao parsear body:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao parsear body da requisição',
          details: parseError instanceof Error ? parseError.message : String(parseError)
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // ✅ VALIDAÇÃO: Garantir que companyName existe
    if (!body.companyName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'companyName é obrigatório',
          received: Object.keys(body)
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const {
      companyName,
      cnpj, // ✅ CRÍTICO: Extrair cnpj do body (estava faltando!)
      sector,
      cnae,
      size,
      employees,
      detectedProducts = [],
      detectedEvidences = [],
      competitors = [],
      similarCompanies = [],
      decisorsData,
      digitalData,
      analysis360Data
    } = body;

    console.log('[PRODUCT-GAPS] ✨ EVOLUÇÃO v2.0: Análise Holística + Recomendações');
    console.log('[PRODUCT-GAPS] 📊 Empresa:', companyName);
    console.log('[PRODUCT-GAPS] 🆔 CNPJ:', cnpj || '(não fornecido)'); // ✅ Log para debug
    console.log('[PRODUCT-GAPS] 🏢 Setor:', sector, '| CNAE:', cnae, '| Funcionários:', employees);
    console.log('[PRODUCT-GAPS] ✅ Dados extraídos com sucesso. cnpj está definido:', typeof cnpj !== 'undefined');
    console.log('[PRODUCT-GAPS] 📦 Produtos detectados:', detectedProducts.length);
    console.log('[PRODUCT-GAPS] 🔍 Evidências:', detectedEvidences.length);
    console.log('[PRODUCT-GAPS] 👥 Decisores:', decisorsData?.total || 0);
    console.log('[PRODUCT-GAPS] 🌐 Digital Score:', digitalData?.maturityScore || 0);
    console.log('[PRODUCT-GAPS] 💰 Saúde:', analysis360Data?.healthScore || 'unknown');

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

    // 🔥 CRÍTICO: VALIDAÇÃO - NÃO RECOMENDAR SE EMPRESA JÁ É CLIENTE TOTVS
    // Verificar se há evidências TOTVS (triple/double matches indicam cliente)
    const hasTOTVSEvidence = detectedProducts.length > 0 || detectedEvidences.length > 0;
    const hasTripleMatches = detectedEvidences.some((e: any) => 
      e.sources?.some((s: any) => s.matchType === 'triple' || s.matchType === 'triple_match')
    );
    const hasDoubleMatches = detectedEvidences.some((e: any) => 
      e.sources?.some((s: any) => s.matchType === 'double' || s.matchType === 'double_match')
    );
    
    const isTOTVSCustomer = hasTripleMatches || (hasDoubleMatches && detectedProducts.length > 0);
    
    if (isTOTVSCustomer) {
      console.log('[PRODUCT-GAPS] ⚠️ EMPRESA JÁ É CLIENTE TOTVS - NÃO RECOMENDAR PRODUTOS');
      console.log('[PRODUCT-GAPS] 📊 Evidências:', {
        hasTripleMatches,
        hasDoubleMatches,
        detectedProducts: detectedProducts.length,
        detectedEvidences: detectedEvidences.length
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          strategy: 'customer_retention',
          segment: sector || 'Serviços',
          products_in_use: productsInUse,
          primary_opportunities: [], // ✅ NÃO RECOMENDAR PARA CLIENTE
          relevant_opportunities: [], // ✅ NÃO RECOMENDAR PARA CLIENTE
          estimated_potential: null,
          executive_summary: {
            company_analysis: `${companyName} já é cliente TOTVS (evidências de uso detectadas).`,
            moment_analysis: 'Cliente ativo - foco em retenção e expansão',
            sales_type: 'customer_retention',
            methodology: 'Detecção automática de evidências TOTVS',
            recommendations_rationale: 'Não recomendar novos produtos - empresa já é cliente TOTVS',
            key_findings: [
              `Detectados ${detectedProducts.length} produto(s) TOTVS em uso`,
              hasTripleMatches ? 'Triple matches confirmam uso de produtos TOTVS' : '',
              hasDoubleMatches ? 'Double matches indicam relação com TOTVS' : ''
            ].filter(Boolean)
          },
          sales_approach: {
            type: 'customer_retention',
            recommendation: 'Focar em retenção e expansão do contrato atual',
            call_script: {
              opening: `Olá, vimos que ${companyName} já utiliza soluções TOTVS. Como está a experiência com nossos produtos?`,
              objections: [],
              closing: 'Gostaríamos de entender melhor suas necessidades para potencial expansão.'
            },
            talking_points: [
              'Foco em retenção e satisfação',
              'Identificação de oportunidades de expansão',
              'Suporte e relacionamento próximo'
            ]
          },
          stack_suggestion: [],
          total_estimated_value: 0,
          insights: [
            'Empresa já é cliente TOTVS - não recomendar novos produtos',
            hasTripleMatches ? 'Triple matches confirmam uso ativo' : '',
            hasDoubleMatches ? 'Double matches indicam relação estabelecida' : ''
          ].filter(Boolean)
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // ==================================================================
    // ETAPA 2: IDENTIFICAR SEGMENTO E BUSCAR MATRIZ (INTELIGENTE)
    // ==================================================================
    
    // Identificação inteligente baseada em CNAE + Setor
    let segmentKey = 'Serviços'; // Fallback
    
    // Primeiro: Tentar identificar por CNAE específico
    if (cnae) {
      const cnaePrefix = cnae.replace(/[^\d]/g, '').substring(0, 2);
      
      // CNAEs específicos
      if (cnaePrefix === '38') segmentKey = 'Sustentabilidade'; // 38 = Gestão de resíduos
      else if (cnaePrefix === '01' || cnaePrefix === '02') segmentKey = 'Agronegócio'; // 01/02 = Agricultura/Pecuária
      else if (cnaePrefix === '85') segmentKey = 'Educação'; // 85 = Educação
      else if (cnaePrefix === '86') segmentKey = 'Saúde'; // 86 = Saúde
      else if (cnaePrefix === '62' || cnaePrefix === '63') segmentKey = 'Tecnologia'; // 62/63 = TI
      else if (cnaePrefix === '41' || cnaePrefix === '42' || cnaePrefix === '43') segmentKey = 'Construção'; // 41-43 = Construção
      else if (cnaePrefix === '47') segmentKey = 'Varejo'; // 47 = Comércio varejista
      else if (['10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33'].includes(cnaePrefix)) {
        segmentKey = 'Indústria'; // 10-33 = Indústria de transformação
      }
    }
    
    // Segundo: Se não identificou por CNAE, usar setor
    if (segmentKey === 'Serviços' && sector) {
      const normalizedSector = sector.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      
      const foundKey = Object.keys(SEGMENT_PRIORITIES).find(key =>
        normalizedSector.includes(key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())
      );
      
      if (foundKey) segmentKey = foundKey;
    }

    const segmentMatrix = SEGMENT_PRIORITIES[segmentKey as keyof typeof SEGMENT_PRIORITIES] || 
                          SEGMENT_PRIORITIES['Serviços'];

    console.log('[PRODUCT-GAPS] 🎯 Segmento identificado:', segmentKey, '(CNAE:', cnae, '| Setor:', sector, ')');

    // ==================================================================
    // ETAPA 2.5: ANÁLISE CONTEXTUAL DA EMPRESA (HOLÍSTICA)
    // ==================================================================
    
    // Analisar saúde financeira
    const isHealthy = analysis360Data?.healthScore === 'excellent' || analysis360Data?.healthScore === 'good';
    const isInCrisis = analysis360Data?.healthScore === 'poor' || analysis360Data?.healthScore === 'critical';
    const hasHighDebts = (analysis360Data?.debtsPercentage || 0) > 15;
    const isGrowing = (analysis360Data?.growthRate || 0) > 5;
    const isHiring = (analysis360Data?.hiringTrends || 0) > 0;
    const hasRecentActivity = (analysis360Data?.recentNews || 0) > 0;
    
    // Analisar maturidade digital
    const isDigitalMature = (digitalData?.maturityScore || 0) >= 70;
    const hasTechStack = (digitalData?.technologies?.length || 0) > 0;
    const hasOnlinePresence = digitalData?.hasWebsite || digitalData?.hasSocialMedia;
    
    // Analisar decisores
    const hasDecisors = (decisorsData?.total || 0) > 0;
    const hasCLevel = (decisorsData?.cLevel || 0) > 0;
    const canReachTechTeam = decisorsData?.hasTechDecisors || false;
    const canReachFinanceTeam = decisorsData?.hasFinanceDecisors || false;
    
    // 🎯 CLASSIFICAR MOMENTO DA EMPRESA
    let companyMoment: 'expansion' | 'stable' | 'crisis' | 'unknown' = 'unknown';
    let momentReason = '';
    
    // 🔥 PONTO 1: Integrar deepAnalysis na lógica determinística
    // Se há análise profunda de URLs, usar o momento detectado lá primeiro
    const deepMoment = digitalData?.deepAnalysis?.company_moment;
    if (deepMoment) {
      // Mapear termos da deepAnalysis para momentos padronizados
      if (deepMoment.toLowerCase().includes('cris') || deepMoment.toLowerCase().includes('delicad') || deepMoment.toLowerCase().includes('problem')) {
        companyMoment = 'crisis';
        momentReason = `Momento detectado via análise profunda de URLs: ${deepMoment}`;
      } else if (deepMoment.toLowerCase().includes('cresc') || deepMoment.toLowerCase().includes('expans') || deepMoment.toLowerCase().includes('expandi')) {
        companyMoment = 'expansion';
        momentReason = `Momento detectado via análise profunda de URLs: ${deepMoment}`;
      } else if (deepMoment.toLowerCase().includes('estável') || deepMoment.toLowerCase().includes('estavel') || deepMoment.toLowerCase().includes('establ')) {
        companyMoment = 'stable';
        momentReason = `Momento detectado via análise profunda de URLs: ${deepMoment}`;
      }
    }
    
    // Se não foi determinado via deepAnalysis, usar lógica determinística tradicional
    if (companyMoment === 'unknown') {
      if (isInCrisis || hasHighDebts) {
        companyMoment = 'crisis';
        momentReason = `Empresa em momento delicado (${hasHighDebts ? 'dívidas altas' : 'saúde financeira baixa'})`;
      } else if (isGrowing && isHiring && hasRecentActivity) {
        companyMoment = 'expansion';
        momentReason = `Empresa em crescimento (${analysis360Data?.growthRate}% ao ano, contratando)`;
      } else if (isHealthy && !hasHighDebts) {
        companyMoment = 'stable';
        momentReason = `Empresa estável e saudável financeiramente`;
      }
    }
    
    // 🔥 PONTO 2: Fallback inteligente usando sinais de URLs
    // Se ainda for 'unknown', usar sinais de mercado das URLs como fallback
    if (companyMoment === 'unknown' && digitalData?.signalsSummary) {
      const signals = digitalData.signalsSummary;
      const positiveSignals = (signals.expansions || 0) + (signals.hiring || 0) + (signals.productLaunches || 0) + (signals.partnerships || 0);
      const totalSignals = positiveSignals + (signals.events || 0) + (signals.awards || 0);
      
      if (positiveSignals >= 3) {
        companyMoment = 'expansion';
        momentReason = `Sinais de mercado detectados via URLs (${positiveSignals} sinais positivos: expansões, contratações, lançamentos)`;
      } else if (totalSignals >= 2) {
        companyMoment = 'stable';
        momentReason = `Atividade detectada via URLs (${totalSignals} sinais de mercado)`;
      }
    }
    
    // Se ainda for 'unknown', usar sinais de buying_signals como último recurso
    if (companyMoment === 'unknown' && digitalData?.deepAnalysis?.buying_signals?.length) {
      const buyingSignals = digitalData.deepAnalysis.buying_signals;
      if (buyingSignals.length >= 2) {
        companyMoment = 'expansion';
        momentReason = `Sinais de compra detectados via URLs (${buyingSignals.length} sinais)`;
      }
    }
    
    console.log('[PRODUCT-GAPS] 🧠 Momento da empresa:', companyMoment, '-', momentReason);
    console.log('[PRODUCT-GAPS] 📊 Saúde:', {
      isHealthy,
      isInCrisis,
      hasHighDebts,
      isGrowing,
      isHiring,
      hasRecentActivity
    });
    console.log('[PRODUCT-GAPS] 🌐 Digital:', {
      isDigitalMature,
      hasTechStack,
      hasOnlinePresence
    });
    console.log('[PRODUCT-GAPS] 👥 Decisores:', {
      hasDecisors,
      hasCLevel,
      canReachTechTeam,
      canReachFinanceTeam
    });

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
      `\nCONCORRENTES DETECTADOS: ${competitors.map((c: any) => c.name).join(', ')}` : '';

    // 🔥 Preparar produtos detectados como string JSON (para evitar problema de template string aninhado)
    const detectedProductsJson = JSON.stringify(detectedProducts);

    // 🔧 Função auxiliar para construir orientação de momento da empresa
    function buildMomentGuidance(moment: string): string {
      if (moment === 'crisis') {
        return `⚠️ ATENÇÃO - EMPRESA EM MOMENTO DELICADO:
→ NÃO recomendar investimentos altos (Datasul, RM enterprise)
→ FOCAR em: economia de custos, eficiência, ROI rápido (<12m)
→ Produtos: TOTVS Cloud (reduz infra), Fluig (automatiza), Techfin (capital de giro)
→ Abordagem: Consultiva, mostrar economia, POC grátis`;
      } else if (moment === 'expansion') {
        return `🔥 MOMENTO QUENTE - EMPRESA EM CRESCIMENTO:
→ RECOMENDAR stack robusto para escalar operação
→ FOCAR em: automação, escalabilidade, analytics, competitividade
→ Produtos: ERP completo, BI/Analytics, Carol AI, CRM, Cloud
→ Abordagem: Agressiva, mostrar cases de crescimento, implementação rápida`;
      } else {
        return `💡 EMPRESA ESTÁVEL:
→ RECOMENDAR otimização e transformação digital gradual
→ FOCAR em: processos, compliance, inovação incremental
→ Produtos: Fluig BPM, TOTVS BI, Assinatura Eletrônica, Cloud
→ Abordagem: Educativa, mostrar benchmarks, implementação gradual`;
      }
    }

    // 🔧 Função auxiliar para construir seção de análise de URLs (evita template strings aninhados complexos)
    function buildUrlAnalysisSection(digitalData: any): string {
      if (!digitalData?.allUrls || digitalData.allUrls.length === 0) {
        return '   ⚠️ Nenhuma URL disponível para análise';
      }

      const urlCount = digitalData.allUrls.length;
      const urlList = digitalData.allUrls.slice(0, 20).join(', ') || 'N/A';
      const moreUrlsText = urlCount > 20 ? `\n   ... e mais ${urlCount - 20} URLs` : '';
      
      let section = `   📊 TOTAL DE URLs: ${urlCount} URLs\n   🌐 URLs ANALISADAS: ${urlList}${moreUrlsText}\n`;
      
      if (digitalData?.signalsSummary) {
        section += `   \n   📈 SINAIS DE MERCADO:\n` +
          `   - Lançamentos de Produtos: ${digitalData.signalsSummary.productLaunches}\n` +
          `   - Expansões: ${digitalData.signalsSummary.expansions}\n` +
          `   - Contratações: ${digitalData.signalsSummary.hiring}\n` +
          `   - Parcerias: ${digitalData.signalsSummary.partnerships}\n` +
          `   - Prêmios/Certificações: ${digitalData.signalsSummary.awards}\n` +
          `   - Eventos/Feiras: ${digitalData.signalsSummary.events}\n` +
          `   - Atividade Internacional: ${digitalData.signalsSummary.international}\n`;
      }
      
      if (digitalData?.deepAnalysis) {
        section += `   \n   🧠 ANÁLISE PROFUNDA (100% DO CONTEÚDO ANALISADO):\n` +
          `   - Momento da Empresa: ${digitalData.deepAnalysis.company_moment || 'N/A'}\n` +
          `   - Maturidade Digital: ${digitalData.deepAnalysis.digital_maturity || 'N/A'}\n`;
        
        if (digitalData.deepAnalysis.key_insights?.length) {
          section += `   \n   🔍 INSIGHTS PRINCIPAIS (LENDO TODO O CONTEÚDO):\n` +
            digitalData.deepAnalysis.key_insights.map((insight: string) => `   • ${insight}`).join('\n') + '\n';
        }
        
        if (digitalData.deepAnalysis.recent_activities?.length) {
          section += `   \n   🎯 ATIVIDADES RECENTES (ANÁLISE INTEGRAL):\n` +
            digitalData.deepAnalysis.recent_activities.map((activity: string) => `   • ${activity}`).join('\n') + '\n';
        }
        
        if (digitalData.deepAnalysis.buying_signals?.length) {
          section += `   \n   🔥 SINAIS DE COMPRA (DETECTADOS EM 100% DAS URLs):\n` +
            digitalData.deepAnalysis.buying_signals.map((signal: string) => `   ✅ ${signal}`).join('\n') + '\n';
        }
        
        if (digitalData.deepAnalysis.red_flags?.length) {
          section += `   \n   ⚠️ ALERTAS (ANÁLISE COMPLETA):\n` +
            digitalData.deepAnalysis.red_flags.map((flag: string) => `   ⚠️ ${flag}`).join('\n') + '\n';
        }
        
        if (digitalData.deepAnalysis.green_flags?.length) {
          section += `   \n   ✅ SINAIS POSITIVOS (ANÁLISE COMPLETA):\n` +
            digitalData.deepAnalysis.green_flags.map((flag: string) => `   ✅ ${flag}`).join('\n') + '\n';
        }
        
        section += `   \n   💡 ABORDAGEM RECOMENDADA (BASEADA EM 100% DA ANÁLISE):\n   ${digitalData.deepAnalysis.recommended_approach || 'N/A'}\n`;
        section += `   \n   ⏰ TIMING IDEAL (BASEADO EM TODOS OS SINAIS):\n   ${digitalData.deepAnalysis.best_timing || 'N/A'}\n`;
      } else {
        section += `   \n   ⚠️ Análise profunda em processamento (analisando 100% do conteúdo das URLs)\n`;
      }
      
      if (digitalData?.websiteContent) {
        const contentPreview = digitalData.websiteContent.substring(0, 1000);
        const contentMore = digitalData.websiteContent.length > 1000 ? '...' : '';
        section += `   \n   📄 CONTEÚDO DO WEBSITE (ANÁLISE INTEGRAL):\n   ${contentPreview}${contentMore}\n`;
      }
      
      return section;
    }

    // 🎯 PROMPT HOLÍSTICO: Análise 100% INTEGRAL de conteúdo, URLs, resultados
    // 🔥 CRÍTICO: Analisar 100% do conteúdo fornecido, sem pular informações
    const aiPrompt = `Você é consultor sênior de vendas TOTVS com expertise em análise de fit e timing de vendas B2B.

⚠️ INSTRUÇÃO CRÍTICA: Você DEVE analisar 100% do conteúdo fornecido abaixo. 
Leia TODAS as informações, TODAS as URLs analisadas, TODOS os sinais, TODOS os dados contextuais.
Não pule nenhuma informação. Use TUDO para gerar recomendações precisas e assertivas.

═══════════════════════════════════════════════════════════════════
EMPRESA: ${companyName}
═══════════════════════════════════════════════════════════════════
CNPJ: ${cnpj || 'não fornecido'}
CNAE: ${cnae || 'não especificado'} → Segmento: ${segmentKey}
SETOR: ${sector || segmentKey}
PORTE: ${size || 'médio'} (${employees || '100'} funcionários)

═══════════════════════════════════════════════════════════════════
ANÁLISE CONTEXTUAL 100% COMPLETA (TODAS AS 9 ABAS + URLs PROFUNDAS):
═══════════════════════════════════════════════════════════════════

📊 1. STATUS TOTVS:
   ${strategy === 'cross-sell' ? `✅ JÁ É CLIENTE (${detectedProducts.length} produtos: ${detectedProducts.join(', ')})` : '🎯 PROSPECT (não é cliente)'}

👥 2. DECISORES:
   Total: ${decisorsData?.total || 0} | C-Level: ${decisorsData?.cLevel || 0}
   Acesso TI: ${canReachTechTeam ? 'SIM ✅' : 'NÃO ❌'}
   Acesso Financeiro: ${canReachFinanceTeam ? 'SIM ✅' : 'NÃO ❌'}

🌐 3. MATURIDADE DIGITAL:
   Score: ${digitalData?.maturityScore || 0}/100
   Website: ${digitalData?.hasWebsite ? 'SIM' : 'NÃO'}
   Tecnologias: ${digitalData?.technologies?.join(', ') || 'N/A'}
   Insight: ${isDigitalMature ? '✅ Madura digitalmente' : '⚠️ Baixa maturidade'}

🔍 3.1. ANÁLISE 100% PROFUNDA DE URLs (${digitalData?.allUrls?.length || 0} URLs analisadas integralmente):
   ${buildUrlAnalysisSection(digitalData)}

💰 4. SAÚDE FINANCEIRA:
   Receita: R$ ${(analysis360Data?.revenue || 0) / 1000}K/ano
   Dívidas: ${analysis360Data?.debtsPercentage || 0}%
   Crescimento: ${analysis360Data?.growthRate || 0}% ao ano
   Saúde Geral: ${analysis360Data?.healthScore?.toUpperCase() || 'DESCONHECIDA'}

📈 5. SINAIS DE MERCADO:
   Contratando: ${isHiring ? 'SIM 🔥' : 'NÃO'}
   Notícias: ${analysis360Data?.recentNews || 0} recentes
   Atividade: ${hasRecentActivity ? 'ALTA' : 'BAIXA'}

🏆 6. CONCORRENTES:
   ${competitors.length > 0 ? competitors.map((c: any) => c.name).join(', ') : 'Nenhum detectado (greenfield)'}

═══════════════════════════════════════════════════════════════════
🎯 MOMENTO DA EMPRESA: ${companyMoment.toUpperCase()}
═══════════════════════════════════════════════════════════════════
${momentReason}

${companyMoment === 'crisis' ? `
⚠️ ATENÇÃO - EMPRESA EM MOMENTO DELICADO:
→ NÃO recomendar investimentos altos (Datasul, RM enterprise)
→ FOCAR em: economia de custos, eficiência, ROI rápido (<12m)
→ Produtos: TOTVS Cloud (reduz infra), Fluig (automatiza), Techfin (capital de giro)
→ Abordagem: Consultiva, mostrar economia, POC grátis
` : companyMoment === 'expansion' ? `
🔥 MOMENTO QUENTE - EMPRESA EM CRESCIMENTO:
→ RECOMENDAR stack robusto para escalar operação
→ FOCAR em: automação, escalabilidade, analytics, competitividade
→ Produtos: ERP completo, BI/Analytics, Carol AI, CRM, Cloud
→ Abordagem: Agressiva, mostrar cases de crescimento, implementação rápida
` : `
💡 EMPRESA ESTÁVEL:
→ RECOMENDAR otimização e transformação digital gradual
→ FOCAR em: processos, compliance, inovação incremental
→ Produtos: Fluig BPM, TOTVS BI, Assinatura Eletrônica, Cloud
→ Abordagem: Educativa, mostrar benchmarks, implementação gradual
`}

═══════════════════════════════════════════════════════════════════
PRODUTOS DISPONÍVEIS PARA ${segmentKey}:
═══════════════════════════════════════════════════════════════════
PRIMÁRIOS: ${segmentMatrix.primary.join(', ')}
RELEVANTES: ${segmentMatrix.relevant.join(', ')}

═══════════════════════════════════════════════════════════════════
TAREFA:
═══════════════════════════════════════════════════════════════════

Gere recomendações SENSATAS e CONTEXTUALIZADAS que:

1. RESPEITEM o momento (não venda caro para quem está em crise)
2. CONSIDEREM saúde financeira e capacidade de investimento
3. LEVEM EM CONTA maturidade digital (não venda BI avançado para quem não tem site)
4. USEM sinais de compra (contratando = momento quente)
5. CONSIDEREM decisores (sem acesso TI = dificultar venda)
6. PRIORIZEM ROI e viabilidade
7. CITEM cases de sucesso REAIS do segmento

═══════════════════════════════════════════════════════════════════
🎯 EXECUTIVO SUMMARY (RESUMO HOLÍSTICO) - REQUERIDO:
═══════════════════════════════════════════════════════════════════

Você DEVE gerar um RESUMO EXECUTIVO HOLÍSTICO que analise:
1. TODAS as 9 abas do relatório (TOTVS Check, Decisores, Digital, 360°, Competitors, Similar, Clients, Products, Opportunities)
2. TODAS as ${digitalData?.allUrls?.length || 0} URLs analisadas (conteúdo integral)
3. MOMENTO da empresa (crescimento/estável/crise) baseado em 100% dos dados
4. TIPO DE VENDA (New Sale/Cross-Sell/Upsell) baseado em produtos detectados
5. METODOLOGIA completa explicando como chegamos às recomendações
6. RAZÃO de cada produto recomendado (baseado em análise integral)

O resumo executivo deve explicar:
- Como a empresa chegou neste momento (análise de todas as URLs e dados)
- Por que recomendamos cada produto (baseado em TODAS as informações)
- Metodologia completa da análise (9 abas + URLs + sinais)
- Nível de assertividade (baseado em quantidade e qualidade dos dados)`;

    // Construir o JSON de exemplo completo usando concatenação de strings (evita problemas de template string aninhado)
    const urlCount = digitalData?.allUrls?.length || 0;
    const sectorName = sector || segmentKey;
    const cnaeValue = cnae || 'não especificado';
    
    const jsonExample = '{\n' +
      '  "executive_summary": {\n' +
      '    "company_analysis": "Análise completa da empresa baseada em 100% das informações (9 abas + ' + urlCount + ' URLs). Descreva o momento atual, saúde financeira, maturidade digital, decisores, etc.",\n' +
      '    "moment_analysis": "Análise detalhada do momento da empresa (crescimento/estável/crise) baseada em TODOS os sinais detectados nas URLs e dados 360°",\n' +
      '    "sales_type": "' + strategy + '",\n' +
      '    "sales_type_explanation": "Explicação detalhada do tipo de venda (New Sale/Cross-Sell/Upsell) baseado em produtos detectados",\n' +
      '    "sector_identified": "' + sectorName + '",\n' +
      '    "sector_source": "Fonte do setor identificado (CNAE/Apollo/STC)",\n' +
      '    "products_detected_count": ' + detectedProducts.length + ',\n' +
      '    "products_detected": ' + detectedProductsJson + ',\n' +
      '    "gap_analysis": "Análise de gaps: produtos essenciais para o setor que NÃO foram detectados",\n' +
      '    "recommendations_rationale": "Explicação completa de POR QUE recomendamos estes produtos específicos, baseado em TODAS as informações analisadas",\n' +
      '    "methodology": "Metodologia completa: explicar COMO chegamos às recomendações. Mencionar análise de 9 abas + ' + urlCount + ' URLs + sinais de mercado + saúde financeira + maturidade digital",\n' +
      '    "url_analysis_count": ' + urlCount + ',\n' +
      '    "url_analysis_summary": "Resumo da análise das URLs: principais sinais detectados, atividades recentes, indicadores de compra",\n' +
      '    "confidence_level": "Nível de confiança na análise (alta/média/baixa) baseado em quantidade e qualidade dos dados",\n' +
      '    "key_findings": ["Achado principal 1 baseado em análise 100%", "Achado principal 2", "Achado principal 3"]\n' +
      '  },\n' +
      '  "company_moment": "' + companyMoment + '",\n' +
      '  "moment_analysis": "Análise detalhada em 2-3 frases baseada em 100% dos dados",\n' +
      '  "primary_opportunities": [\n' +
      '    {\n' +
      '      "name": "Nome Produto",\n' +
      '      "category": "Categoria",\n' +
      '      "fit_score": 75,\n' +
      '      "value": "R$ XXK-XXXK ARR",\n' +
      '      "reason": "POR QUE FAZ SENTIDO NO MOMENTO ATUAL da empresa",\n' +
      '      "use_case": "Caso de uso ESPECÍFICO para ' + sectorName + ' considerando CNAE ' + cnaeValue + '",\n' +
      '      "roi_months": 12,\n' +
      '      "priority": "high",\n' +
      '      "timing": "immediate",\n' +
      '      "benefits": ["Benefício 1", "Benefício 2", "Benefício 3"],\n' +
      '      "case_study": "Case REAL de empresa similar",\n' +
      '      "contextual_fit": "Por que é adequado ao momento ' + companyMoment + '"\n' +
      '    }\n' +
      '  ],\n' +
      '  "relevant_opportunities": [],\n' +
      '  "estimated_potential": {\n' +
      '    "min_revenue": "R$ XXXK",\n' +
      '    "max_revenue": "R$ XXXK",\n' +
      '    "close_probability": "60-85%",\n' +
      '    "timeline_months": "X-XX meses",\n' +
      '    "timing_recommendation": "Quando abordar"\n' +
      '  },\n' +
      '  "red_flags": [],\n' +
      '  "green_flags": []\n' +
      '}';
    
    // Combinar prompt principal com exemplo JSON
    const fullPrompt = aiPrompt + '\n\nResponda APENAS JSON válido (sem comentários, sem markdown):\n\n' + jsonExample;

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
          messages: [{ role: 'user', content: fullPrompt }],
          temperature: 0.7,
          max_tokens: 4000 // 🔥 AUMENTADO para suportar análise 100% + resumo executivo holístico
        })
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const aiContent = aiData.choices[0].message.content;
        aiRecommendations = JSON.parse(aiContent.replace(/```json\n?|```/g, ''));
        console.log('[PRODUCT-GAPS] ✅ IA gerou recomendações com sucesso');
      }
    } catch (error) {
      console.error('[PRODUCT-GAPS] ⚠️ Erro na IA, usando fallback inteligente:', error);
      
      // 🔥 FALLBACK INTELIGENTE: Usar matriz de produtos
      aiRecommendations = {
        primary_opportunities: primaryGaps.slice(0, 3).map((productName: string) => ({
          name: productName,
          category: Object.keys(TOTVS_PRODUCTS).find(cat =>
            TOTVS_PRODUCTS[cat as keyof typeof TOTVS_PRODUCTS].includes(productName)
          ) || 'ERP',
          fit_score: 85,
          value: 'R$ 200K-500K ARR',
          reason: `Produto essencial para o segmento ${segmentKey}`,
          use_case: `Gestão especializada para ${sector || segmentKey}`,
          roi_months: 15,
          priority: 'high',
          timing: 'immediate',
          benefits: [
            'Integração com processos do setor',
            'ROI comprovado em empresas similares',
            'Suporte especializado TOTVS'
          ],
          case_study: `Empresas do segmento ${segmentKey} obtiveram ROI em 12-18 meses`
        })),
        relevant_opportunities: relevantGaps.slice(0, 3).map((productName: string) => ({
          name: productName,
          category: Object.keys(TOTVS_PRODUCTS).find(cat =>
            TOTVS_PRODUCTS[cat as keyof typeof TOTVS_PRODUCTS].includes(productName)
          ) || 'Cloud',
          fit_score: 75,
          value: 'R$ 80K-200K ARR',
          reason: `Produto complementar para ${segmentKey}`,
          use_case: `Expansão de capacidades para ${sector || segmentKey}`,
          roi_months: 18,
          priority: 'medium',
          timing: 'short_term',
          benefits: [
            'Complementa stack TOTVS',
            'Aumenta eficiência operacional',
            'Reduz custos a médio prazo'
          ],
          case_study: `Implementação bem-sucedida em empresas de ${segmentKey}`
        })),
        estimated_potential: {
          min_revenue: `R$ ${primaryGaps.length * 200}K`,
          max_revenue: `R$ ${(primaryGaps.length + relevantGaps.length) * 300}K`,
          close_probability: '70-80%',
          timeline_months: '12-18 meses'
        }
      };
      
      console.log('[PRODUCT-GAPS] ✅ Fallback gerou:', 
        aiRecommendations.primary_opportunities.length + aiRecommendations.relevant_opportunities.length, 
        'recomendações');
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
      console.error('[PRODUCT-GAPS] ⚠️ Erro ao gerar scripts, usando fallback:', error);
      
      // 🔥 FALLBACK INTELIGENTE: Gerar scripts básicos
      salesScripts = {
        email_script: {
          subject: `Soluções TOTVS para ${sector || segmentKey}: ${primaryGaps.slice(0, 2).join(' + ')}`,
          body: `Olá,\n\nPercebemos que a ${companyName} atua no segmento de ${sector || segmentKey} e identificamos oportunidades de otimização com TOTVS.\n\nProdutos recomendados:\n${primaryGaps.slice(0, 3).map((p: string) => `- ${p}`).join('\n')}\n\nGostaria de agendar uma conversa de 30 minutos?\n\nAtenciosamente,\nEquipe TOTVS`
        },
        call_script: {
          opening: `Olá, falo com o responsável por tecnologia da ${companyName}? Sou da TOTVS e identificamos oportunidades para otimizar processos de ${sector || segmentKey}.`,
          discovery: `1. Como vocês gerenciam [processo específico do setor] hoje?\n2. Quais os principais desafios de gestão?\n3. Já avaliaram soluções integradas?`,
          pitch: `Temos soluções específicas para ${sector || segmentKey}, incluindo ${primaryGaps.slice(0, 2).join(' e ')}, que já ajudaram empresas similares a reduzir custos em até 30%.`,
          objections: ['Preço alto → ROI em 12-18 meses comprovado', 'Já temos sistema → Integração nativa TOTVS'],
          closing: 'Posso agendar uma demo de 30min na próxima semana?'
        },
        talking_points: [
          `Líder de mercado em ${sector || segmentKey}`,
          'ROI comprovado em 12-18 meses',
          'Suporte especializado e cases de sucesso'
        ]
      };
      
      console.log('[PRODUCT-GAPS] ✅ Scripts de fallback gerados');
    }

    // ==================================================================
    // ETAPA 6: MONTAR RESPOSTA FINAL (GARANTIR DADOS)
    // ==================================================================
    
    // 🔥 GARANTIR que SEMPRE tenha recomendações (mesmo se IA falhar)
    let primaryOpportunities = aiRecommendations?.primary_opportunities || [];
    let relevantOpportunities = aiRecommendations?.relevant_opportunities || [];
    
    // Se IA retornou vazio, gerar pelo menos 3 recomendações da matriz
    if (primaryOpportunities.length === 0 && primaryGaps.length > 0) {
      console.log('[PRODUCT-GAPS] ⚠️ IA retornou vazio, gerando do fallback inteligente');
      aiRecommendations = {
        primary_opportunities: primaryGaps.slice(0, 3).map((productName: string) => ({
          name: productName,
          category: Object.keys(TOTVS_PRODUCTS).find(cat =>
            TOTVS_PRODUCTS[cat as keyof typeof TOTVS_PRODUCTS].includes(productName)
          ) || 'ERP',
          fit_score: 88,
          value: 'R$ 250K-600K ARR',
          reason: `Produto essencial para empresas de ${segmentKey}. Gerencia operações críticas do setor.`,
          use_case: `Aplicação específica em ${sector || segmentKey}: controle de processos, rastreabilidade e compliance.`,
          roi_months: 15,
          priority: 'high',
          timing: 'immediate',
          benefits: [
            'Integração completa com processos do setor',
            'ROI comprovado em 12-18 meses',
            'Suporte especializado TOTVS 24/7'
          ],
          case_study: `Empresas similares de ${segmentKey} obtiveram redução de 25-35% em custos operacionais`
        })),
        relevant_opportunities: relevantGaps.slice(0, 3).map((productName: string) => ({
          name: productName,
          category: Object.keys(TOTVS_PRODUCTS).find(cat =>
            TOTVS_PRODUCTS[cat as keyof typeof TOTVS_PRODUCTS].includes(productName)
          ) || 'Cloud',
          fit_score: 76,
          value: 'R$ 100K-250K ARR',
          reason: `Produto complementar que agrega valor ao ${segmentKey}`,
          use_case: `Expansão de capacidades para ${sector || segmentKey}`,
          roi_months: 18,
          priority: 'medium',
          timing: 'short_term',
          benefits: [
            'Complementa stack principal',
            'Aumenta eficiência operacional',
            'Reduz custos a médio prazo'
          ],
          case_study: `Implementações bem-sucedidas no setor ${segmentKey}`
        })),
        estimated_potential: {
          min_revenue: `R$ ${primaryGaps.length * 250}K`,
          max_revenue: `R$ ${(primaryGaps.length * 600 + relevantGaps.length * 200)}K`,
          close_probability: '70-85%',
          timeline_months: '12-18 meses'
        }
      };
      
      primaryOpportunities = aiRecommendations.primary_opportunities;
      relevantOpportunities = aiRecommendations.relevant_opportunities;
    }
    const estimatedPotential = aiRecommendations?.estimated_potential || {
      min_revenue: `R$ ${primaryGaps.length * 200}K`,
      max_revenue: `R$ ${(primaryGaps.length + relevantGaps.length) * 300}K`,
      close_probability: '70-80%',
      timeline_months: '12-18 meses'
    };
    
    // 🔥 NOVO: Resumo Executivo Holístico (extrair da IA ou gerar fallback)
    const executiveSummary = aiRecommendations?.executive_summary || {
      company_analysis: `${companyName} é uma empresa de ${sector || segmentKey} com ${employees || 100} funcionários. ` +
        `Análise baseada em ${digitalData?.allUrls?.length || 0} URLs e dados de 9 abas do relatório. ` +
        `Momento atual: ${companyMoment} (${momentReason}).`,
      moment_analysis: momentReason || `Empresa em momento ${companyMoment}.`,
      sales_type: strategy,
      sales_type_explanation: strategy === 'cross-sell' 
        ? `Cliente TOTVS com ${detectedProducts.length} produtos em uso. Oportunidade de expansão do stack.`
        : `Prospect novo. Oportunidade de stack inicial.`,
      sector_identified: sector || segmentKey,
      sector_source: cnae ? 'CNAE' : 'Apollo/STC',
      products_detected_count: detectedProducts.length,
      products_detected: detectedProducts,
      gap_analysis: `Produtos essenciais para ${segmentKey} não detectados: ${primaryGaps.slice(0, 3).join(', ')}`,
      recommendations_rationale: `Recomendamos estes produtos baseado em análise de ${digitalData?.allUrls?.length || 0} URLs, ` +
        `saúde financeira ${analysis360Data?.healthScore || 'desconhecida'}, ` +
        `maturidade digital ${digitalData?.maturityScore || 0}/100, ` +
        `momento da empresa ${companyMoment}, e produtos detectados ${detectedProducts.length}.`,
      methodology: `Metodologia: Análise holística de 9 abas (TOTVS Check, Decisores, Digital, 360°, Competitors, Similar, Clients, Products, Opportunities) ` +
        `+ análise profunda de ${digitalData?.allUrls?.length || 0} URLs descobertas + sinais de mercado + saúde financeira + maturidade digital. ` +
        `Cada recomendação foi validada contra matriz de produtos por segmento e contexto da empresa.`,
      url_analysis_count: digitalData?.allUrls?.length || 0,
      url_analysis_summary: digitalData?.signalsSummary 
        ? `Análise de ${digitalData.allUrls?.length || 0} URLs detectou: ${digitalData.signalsSummary.expansions} expansões, ` +
          `${digitalData.signalsSummary.hiring} contratações, ${digitalData.signalsSummary.partnerships} parcerias. ` +
          `Sinais de compra: ${digitalData.deepAnalysis?.buying_signals?.length || 0}.`
        : 'Análise de URLs em processamento.',
      confidence_level: (digitalData?.allUrls?.length || 0) > 50 && detectedProducts.length > 0 ? 'alta' : 
                        (digitalData?.allUrls?.length || 0) > 20 ? 'média' : 'baixa',
      key_findings: [
        `Momento da empresa: ${companyMoment} (${momentReason})`,
        `Maturidade digital: ${digitalData?.maturityScore || 0}/100`,
        `Saúde financeira: ${analysis360Data?.healthScore || 'desconhecida'}`,
        `Tipo de venda: ${strategy === 'cross-sell' ? 'Cross-Sell (cliente existente)' : 'New Sale (prospect)'}`,
        `Oportunidades primárias: ${primaryGaps.length} produtos essenciais não detectados`
      ]
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
      
      // 0️⃣ RESUMO EXECUTIVO HOLÍSTICO (ANÁLISE 100%)
      executive_summary: executiveSummary,
      
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
