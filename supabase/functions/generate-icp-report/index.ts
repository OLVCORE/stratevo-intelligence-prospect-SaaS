// 🔒 PROTEGIDO: NÃO ALTERAR SEM AUTORIZAÇÃO
// Edge Function: generate-icp-report
// Gera relatórios universais (STRATEVO One) para QUALQUER empresa/setor/porte
// Usa APENAS os campos: executiveSummaryMarkdown e fullReportMarkdown

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, x-requested-with',
  'Access-Control-Max-Age': '86400',
};

// Interface para os dados do onboarding
interface OnboardingData {
  step1_DadosBasicos?: {
    razaoSocial?: string;
    nomeFantasia?: string;
    cnpj?: string;
    email?: string;
    telefone?: string;
    website?: string;
    setorPrincipal?: string;
    porteEmpresa?: string;
    capitalSocial?: number;
    naturezaJuridica?: string;
    dataAbertura?: string;
    situacaoCadastral?: string;
    cnaePrincipal?: string;
    cnaesSecundarios?: string[];
    endereco?: {
      logradouro?: string;
      numero?: string;
      bairro?: string;
      cidade?: string;
      estado?: string;
      cep?: string;
    };
  };
  step2_SetoresNichos?: {
    setoresAlvo?: string[];
    nichosAlvo?: string[];
    cnaesAlvo?: string[];
    setoresAlvoCodes?: string[];
    customSectorNames?: Record<string, string>;
  };
  step3_PerfilClienteIdeal?: {
    setoresAlvo?: string[];
    nichosAlvo?: string[];
    cnaesAlvo?: string[];
    ncmsAlvo?: string[];
    porteAlvo?: string[];
    localizacaoAlvo?: {
      estados?: string[];
      regioes?: string[];
      cidades?: string[];
    };
    faturamentoAlvo?: {
      minimo?: number;
      maximo?: number;
    };
    funcionariosAlvo?: {
      minimo?: number;
      maximo?: number;
    };
    caracteristicasEspeciais?: string[];
  };
  step4_SituacaoAtual?: {
    categoriaSolucao?: string;
    diferenciais?: string[];
    casosDeUso?: string[];
    ticketsECiclos?: Array<{
      ticketMedio?: number;
      ticketMedioMin?: number;
      ticketMedioMax?: number;
      cicloVenda?: number;
      cicloVendaMin?: number;
      cicloVendaMax?: number;
      criterio?: string;
    }>;
    ticketMedio?: number;
    cicloVendaMedia?: number;
    concorrentesDiretos?: Array<{
      nome?: string;
      cnpj?: string;
      website?: string;
      diferencialDeles?: string;
      setor?: string;
      cidade?: string;
      estado?: string;
      capitalSocial?: number;
      cnaePrincipal?: string;
      descricaoCnae?: string;
    }>;
    analisarComIA?: boolean;
  };
  step5_HistoricoEEnriquecimento?: {
    clientesAtuais?: Array<{
      nome?: string;
      razaoSocial?: string;
      cnpj?: string;
      setor?: string;
      cidade?: string;
      estado?: string;
      capitalSocial?: number;
      cnaePrincipal?: string;
      descricaoCnae?: string;
      ticketMedio?: number;
      motivoCompra?: string;
      resultadoObtido?: string;
      tempoCliente?: string;
    }>;
    empresasBenchmarking?: Array<{
      nome?: string;
      razaoSocial?: string;
      cnpj?: string;
      setor?: string;
      cidade?: string;
      estado?: string;
      capitalSocial?: number;
      cnaePrincipal?: string;
      descricaoCnae?: string;
      motivoReferencia?: string;
    }>;
    analisarComIA?: boolean;
  };
}

// =============================================================================
// 🎯 INTERFACES PARA REPORT MODEL (DADOS REAIS)
// =============================================================================

interface Mc8PortfolioSummary {
  totalCompanies: number;
  statusCounts: {
    PRIORITIZAR: number;
    NUTRIR: number;
    DESCARTAR: number;
  };
  bucketCounts: {
    ICP_CORE: number;
    ICP_ADJACENTE: number;
    FORA_ICP: number;
  };
  examples: Array<{
    companyName: string;
    status: 'PRIORITIZAR' | 'NUTRIR' | 'DESCARTAR';
    bucket: 'ICP_CORE' | 'ICP_ADJACENTE' | 'FORA_ICP';
    sector?: string;
    uf?: string;
    mainReasons?: string[];
  }>;
}

interface CompetitiveAnalysis {
  competitors: Array<{
    nome: string;
    cnpj?: string;
    setor?: string;
    cidade?: string;
    estado?: string;
    capitalSocial?: number;
    diferencialDeles?: string;
    website?: string;
  }>;
  swotAnalysis?: {
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    threats?: string[];
  };
  marketPosition?: string;
  competitiveAdvantages?: string[];
}

interface ProductHeatmap {
  tenantProducts: Array<{
    nome: string;
    categoria?: string;
    descricao?: string;
  }>;
  competitorProducts: Array<{
    competitorName: string;
    competitorCnpj?: string;
    produtos: Array<{
      nome: string;
      categoria?: string;
    }>;
  }>;
  productGaps?: string[];
  opportunities?: string[];
}

interface ClientBCGData {
  clientesAtuais: Array<{
    nome: string;
    razaoSocial?: string;
    cnpj?: string;
    setor?: string;
    cidade?: string;
    estado?: string;
    capitalSocial?: number;
    ticketMedio?: number;
    motivoCompra?: string;
  }>;
  empresasBenchmarking: Array<{
    nome: string;
    razaoSocial?: string;
    cnpj?: string;
    setor?: string;
    motivoReferencia?: string;
  }>;
  bcgMatrix?: {
    stars?: number;
    cashCows?: number;
    questionMarks?: number;
    dogs?: number;
  };
  clientSegmentation?: {
    highValue?: number;
    mediumValue?: number;
    lowValue?: number;
  };
}

interface MarketInsights {
  marketTrends?: string[];
  opportunities?: string[];
  threats?: string[];
  recommendations?: string[];
  sectorAnalysis?: string;
}

interface ReportModel {
  tenantCompany: {
    name: string;
    cnpj?: string;
    segment?: string;
    razaoSocial?: string;
    nomeFantasia?: string;
    website?: string;
    setorPrincipal?: string;
    porteEmpresa?: string;
    capitalSocial?: number;
    cidade?: string;
    estado?: string;
  };
  icpProfile: {
    id: string;
    nome: string;
    descricao?: string;
    setor_foco?: string;
    nicho_foco?: string;
  };
  onboardingData: {
    // Campos agregados (compatibilidade)
    diferenciais?: string[];
    casosDeUso?: string[];
    ticketsECiclos?: Array<{
      ticketMedio?: number;
      ticketMedioMin?: number;
      ticketMedioMax?: number;
      cicloVenda?: number;
      criterio?: string;
    }>;
    categoriaSolucao?: string;
    setoresAlvo?: string[];
    nichosAlvo?: string[];
    cnaesAlvo?: string[];
    porteAlvo?: string[];
    localizacaoAlvo?: {
      estados?: string[];
      regioes?: string[];
      cidades?: string[];
    };
    faturamentoAlvo?: {
      minimo?: number;
      maximo?: number;
    };
    funcionariosAlvo?: {
      minimo?: number;
      maximo?: number;
    };
    // 🔥🔥🔥 DADOS COMPLETOS DAS 6 ETAPAS
    step1_DadosBasicos?: OnboardingData['step1_DadosBasicos'];
    step2_SetoresNichos?: OnboardingData['step2_SetoresNichos'];
    step3_PerfilClienteIdeal?: OnboardingData['step3_PerfilClienteIdeal'];
    step4_SituacaoAtual?: OnboardingData['step4_SituacaoAtual'];
    step5_HistoricoEEnriquecimento?: OnboardingData['step5_HistoricoEEnriquecimento'];
  };
  mc6Summary?: {
    enabled: boolean;
    summary?: string;
    score?: number;
  } | null;
  mc8Portfolio?: Mc8PortfolioSummary | null;
  mc9Expansion?: {
    totalTargets?: number;
    clusters?: string[];
    sampleQueries?: string[];
  } | null;
  nichesAndSectors?: {
    mainSectors: string[];
    niches: string[];
  };
  competitiveAnalysis?: CompetitiveAnalysis | null;
  productHeatmap?: ProductHeatmap | null;
  clientBCGData?: ClientBCGData | null;
  marketInsights?: MarketInsights | null;
  // 🔥🔥🔥 NOVOS CAMPOS: Relatórios prontos e análises relacionadas
  existingReports?: {
    total: number;
    latest: any;
    summaries: Array<{
      id: string;
      report_type: string;
      generated_at: string;
      hasFullReport: boolean;
      hasExecutiveSummary: boolean;
      keyInsights?: string[];
      recommendations?: string[];
    }>;
    aggregatedData?: {
      mc8Assessments?: any[];
      mc9Plans?: any[];
    };
  } | null;
  relatedAnalyses?: {
    competitiveAnalyses?: any[];
    swotAnalyses?: any[];
    bcgMatrices?: any[];
    marketInsights?: any[];
  } | null;
  // 🔥🔥🔥 INTERNAL CONTEXT: Todos os dados internos (6 steps + Competitiva + BCG + SWOT + heatmap + insights)
  internalContext?: {
    onboardingSteps: any;
    produtosTenant: any[];
    produtosConcorrentes: any[];
    competitiva: {
      overview: any;
      swot: any;
      bcg: any;
      insights: any;
    };
    icpMetadata: any;
  } | null;
}

// =============================================================================
// 🎯 FUNÇÃO: Buscar Análise Competitiva (Concorrentes + SWOT)
// =============================================================================
async function fetchCompetitiveAnalysis(
  supabase: any,
  tenant_id: string,
  onboardingData: OnboardingData
): Promise<CompetitiveAnalysis | null> {
  try {
    // 1. Buscar concorrentes do onboarding (step1_data ou step4_data)
    const concorrentes = onboardingData.step1_DadosBasicos?.concorrentesDiretos || 
                        onboardingData.step4_SituacaoAtual?.concorrentesDiretos || [];
    
    console.log('[COMPETITIVE-ANALYSIS] 🔍 Buscando concorrentes:', {
      step1_count: onboardingData.step1_DadosBasicos?.concorrentesDiretos?.length || 0,
      step4_count: onboardingData.step4_SituacaoAtual?.concorrentesDiretos?.length || 0,
      total: concorrentes.length,
      concorrentes: concorrentes.map((c: any) => ({
        nome: c.nome || c.razaoSocial,
        setor: c.setor,
        cidade: c.cidade,
        estado: c.estado,
      })),
    });
    
    if (concorrentes.length === 0) {
      console.log('[COMPETITIVE-ANALYSIS] ⚠️ Nenhum concorrente encontrado no onboarding');
      return null;
    }

    // 2. Buscar análise competitiva salva (se existir)
    const { data: competitiveData } = await supabase
      .from('competitive_analysis')
      .select('swot_analysis, ceo_analysis, competitor_data')
      .eq('tenant_id', tenant_id)
      .maybeSingle();

    // 3. Buscar análise SWOT baseada em produtos (icp_competitive_swot)
    const { data: swotData } = await supabase
      .from('icp_competitive_swot')
      .select('strengths, weaknesses, opportunities, threats')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 4. Buscar diferenciais do tenant
    const diferenciais = onboardingData.step4_SituacaoAtual?.diferenciais || [];

    const result = {
      competitors: concorrentes.map((c: any) => ({
        nome: c.nome || c.razaoSocial || c.nomeFantasia || 'Concorrente',
        cnpj: c.cnpj,
        setor: c.setor,
        cidade: c.cidade,
        estado: c.estado,
        capitalSocial: c.capitalSocial || 0,
        diferencialDeles: c.diferencialDeles,
        website: c.website,
      })),
      swotAnalysis: swotData || competitiveData?.swot_analysis || undefined,
      competitiveAdvantages: diferenciais,
    };

    console.log('[COMPETITIVE-ANALYSIS] ✅ Dados retornados:', {
      competitorsCount: result.competitors.length,
      hasSWOT: !!result.swotAnalysis,
      diferenciaisCount: result.competitiveAdvantages.length,
      competitors: result.competitors.map((c: any) => c.nome),
      swotSource: swotData ? 'icp_competitive_swot' : (competitiveData?.swot_analysis ? 'competitive_analysis' : 'none'),
    });

    return result;
  } catch (error) {
    console.error('[COMPETITIVE-ANALYSIS] Erro:', error);
    return null;
  }
}

// =============================================================================
// 🎯 FUNÇÃO: Buscar Product Heatmap (Produtos do Tenant + Concorrentes)
// =============================================================================
async function fetchProductHeatmap(
  supabase: any,
  tenant_id: string,
  tenant_cnpj?: string
): Promise<ProductHeatmap | null> {
  try {
    // 1. Buscar produtos do tenant (suportar nome/product_name, categoria/category)
    const { data: tenantProducts } = await supabase
      .from('tenant_products')
      .select('nome, product_name, categoria, category, descricao, description')
      .eq('tenant_id', tenant_id);

    // 2. Buscar produtos dos concorrentes
    const { data: competitorProducts } = await supabase
      .from('tenant_competitor_products')
      .select('competitor_name, competitor_cnpj, nome, categoria, descricao')
      .eq('tenant_id', tenant_id);

    // Normalizar produtos do tenant (usar nome se product_name não existir, etc.)
    const normalizedTenantProducts = (tenantProducts || []).map((p: any) => ({
      nome: p.nome || p.product_name || 'Produto',
      categoria: p.categoria || p.category || 'Outros',
      descricao: p.descricao || p.description || '',
    }));

    console.log('[PRODUCT-HEATMAP] 🔍 Produtos encontrados:', {
      tenantProducts: normalizedTenantProducts.length,
      competitorProducts: competitorProducts?.length || 0,
      tenantProductsSample: normalizedTenantProducts.slice(0, 3).map((p: any) => ({ nome: p.nome, categoria: p.categoria })),
    });

    if (normalizedTenantProducts.length === 0 && 
        (!competitorProducts || competitorProducts.length === 0)) {
      console.log('[PRODUCT-HEATMAP] ⚠️ Nenhum produto encontrado');
      return null;
    }

    // Agrupar produtos por concorrente
    const productsByCompetitor = new Map<string, any[]>();
    (competitorProducts || []).forEach((p: any) => {
      const key = p.competitor_cnpj || p.competitor_name || 'Unknown';
      if (!productsByCompetitor.has(key)) {
        productsByCompetitor.set(key, []);
      }
      productsByCompetitor.get(key)!.push({
        nome: p.nome,
        categoria: p.categoria,
      });
    });

    const competitorProductsList = Array.from(productsByCompetitor.entries()).map(([key, produtos]) => {
      const firstProduct = produtos[0];
      const firstCompetitorProduct = competitorProducts?.find((cp: any) => 
        (cp.competitor_cnpj || cp.competitor_name) === key
      );
      return {
        competitorName: firstCompetitorProduct?.competitor_name || key,
        competitorCnpj: firstCompetitorProduct?.competitor_cnpj,
        produtos,
      };
    });

    const result = {
      tenantProducts: normalizedTenantProducts,
      competitorProducts: competitorProductsList,
    };

    console.log('[PRODUCT-HEATMAP] ✅ Dados retornados:', {
      tenantProductsCount: result.tenantProducts.length,
      competitorProductsCount: result.competitorProducts.length,
      totalCompetitors: result.competitorProducts.length,
      categories: [...new Set([...result.tenantProducts.map((p: any) => p.categoria), ...result.competitorProducts.flatMap((cp: any) => cp.produtos.map((p: any) => p.categoria))])],
    });

    return result;
  } catch (error) {
    console.error('[PRODUCT-HEATMAP] Erro:', error);
    return null;
  }
}

// =============================================================================
// 🎯 FUNÇÃO: Buscar Dados de Clientes e BCG
// =============================================================================
async function fetchClientBCGData(
  supabase: any,
  tenant_id: string,
  onboardingData: OnboardingData
): Promise<ClientBCGData | null> {
  try {
    // 1. Buscar clientes atuais (já mesclados no onboardingData)
    const clientesAtuais = onboardingData.step5_HistoricoEEnriquecimento?.clientesAtuais || [];

    // 2. Buscar empresas de benchmarking
    const empresasBenchmarking = onboardingData.step5_HistoricoEEnriquecimento?.empresasBenchmarking || [];

    if (clientesAtuais.length === 0 && empresasBenchmarking.length === 0) {
      console.log('[CLIENT-BCG] Nenhum cliente ou benchmarking encontrado');
      return null;
    }

    // 3. Buscar dados de BCG Matrix (se existir)
    const { data: bcgData } = await supabase
      .from('icp_bcg_matrix')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 4. Calcular segmentação de clientes (baseado em capital social ou ticket médio)
    const highValue = clientesAtuais.filter((c: any) => 
      (c.capitalSocial || 0) > 10000000 || (c.ticketMedio || 0) > 50000
    ).length;
    const mediumValue = clientesAtuais.filter((c: any) => 
      (c.capitalSocial || 0) > 1000000 && (c.capitalSocial || 0) <= 10000000 ||
      (c.ticketMedio || 0) > 10000 && (c.ticketMedio || 0) <= 50000
    ).length;
    const lowValue = clientesAtuais.length - highValue - mediumValue;

    return {
      clientesAtuais: clientesAtuais.map((c: any) => ({
        nome: c.nome || c.razaoSocial || 'Cliente',
        razaoSocial: c.razaoSocial,
        cnpj: c.cnpj,
        setor: c.setor,
        cidade: c.cidade,
        estado: c.estado,
        capitalSocial: c.capitalSocial || 0,
        ticketMedio: c.ticketMedio,
        motivoCompra: c.motivoCompra,
      })),
      empresasBenchmarking: empresasBenchmarking.map((e: any) => ({
        nome: e.nome || e.razaoSocial || 'Empresa',
        razaoSocial: e.razaoSocial,
        cnpj: e.cnpj,
        setor: e.setor,
        motivoReferencia: e.motivoReferencia,
      })),
      bcgMatrix: bcgData ? {
        stars: bcgData.stars || 0,
        cashCows: bcgData.cash_cows || 0,
        questionMarks: bcgData.question_marks || 0,
        dogs: bcgData.dogs || 0,
      } : undefined,
      clientSegmentation: {
        highValue,
        mediumValue,
        lowValue,
      },
    };
  } catch (error) {
    console.error('[CLIENT-BCG] Erro:', error);
    return null;
  }
}

// =============================================================================
// 🎯 FUNÇÃO: Buscar Market Insights
// =============================================================================
async function fetchMarketInsights(
  supabase: any,
  tenant_id: string,
  icp_metadata_id: string,
  setor_foco?: string
): Promise<MarketInsights | null> {
  try {
    // 1. Buscar insights de mercado salvos (se existir)
    const { data: marketInsights } = await supabase
      .from('icp_market_insights')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('icp_profile_metadata_id', icp_metadata_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (marketInsights) {
      return {
        marketTrends: marketInsights.trends || [],
        opportunities: marketInsights.opportunities || [],
        threats: marketInsights.threats || [],
        recommendations: marketInsights.recommendations || [],
        sectorAnalysis: marketInsights.sector_analysis,
      };
    }

    // Se não houver insights salvos, retornar null (será gerado pela LLM baseado nos dados)
    return null;
  } catch (error) {
    console.error('[MARKET-INSIGHTS] Erro:', error);
    return null;
  }
}

// =============================================================================
// 🎯 FUNÇÃO: Buscar Portfólio MC8 (Carteira de Empresas)
// =============================================================================
async function fetchMC8Portfolio(
  supabase: any,
  icp_metadata_id: string,
  tenant_id: string,
  tenant_cnpj?: string
): Promise<Mc8PortfolioSummary | null> {
  try {
    // Buscar todos os relatórios ICP com mc8Assessment para este ICP
    const { data: reports, error } = await supabase
      .from('icp_reports')
      .select('report_data, company_id')
      .eq('icp_profile_metadata_id', icp_metadata_id)
      .eq('tenant_id', tenant_id)
      .not('report_data->mc8Assessment', 'is', null);
    
    // Buscar dados de companies separadamente se necessário
    const companyIds = reports?.filter((r: any) => r.company_id).map((r: any) => r.company_id) || [];
    let companiesMap: Record<string, any> = {};
    if (companyIds.length > 0) {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, company_name, cnpj, industry, uf')
        .in('id', companyIds);
      if (companies) {
        companies.forEach((c: any) => {
          companiesMap[c.id] = c;
        });
      }
    }

    if (error) {
      console.error('[MC8-PORTFOLIO] Erro ao buscar relatórios:', error);
      return null;
    }

    if (!reports || reports.length === 0) {
      console.log('[MC8-PORTFOLIO] Nenhum relatório com MC8 encontrado');
      return null;
    }

    // Filtrar relatórios que não sejam do tenant (garantir que tenant nunca seja avaliado)
    const portfolioReports = reports.filter((r: any) => {
      const reportData = r.report_data as any;
      const company = r.company_id ? companiesMap[r.company_id] : null;
      const companyCnpj = company?.cnpj || reportData?.onboarding_data?.step1_DadosBasicos?.cnpj;
      // Se tiver CNPJ do tenant, excluir
      if (tenant_cnpj && companyCnpj) {
        const cleanTenantCnpj = tenant_cnpj.replace(/\D/g, '');
        const cleanCompanyCnpj = companyCnpj.replace(/\D/g, '');
        if (cleanTenantCnpj === cleanCompanyCnpj) {
          return false; // Excluir tenant
        }
      }
      return reportData?.mc8Assessment;
    });

    if (portfolioReports.length === 0) {
      return null;
    }

    // Agregar dados
    const statusCounts = {
      PRIORITIZAR: 0,
      NUTRIR: 0,
      DESCARTAR: 0,
    };
    const bucketCounts = {
      ICP_CORE: 0,
      ICP_ADJACENTE: 0,
      FORA_ICP: 0,
    };
    const examples: Mc8PortfolioSummary['examples'] = [];

    portfolioReports.forEach((r: any) => {
      const reportData = r.report_data as any;
      const mc8 = reportData.mc8Assessment;
      if (!mc8) return;

      const level = mc8.level || 'BAIXA';
      const status = level === 'ALTA' ? 'PRIORITIZAR' : level === 'MEDIA' ? 'NUTRIR' : 'DESCARTAR';
      const bucket = level === 'ALTA' ? 'ICP_CORE' : level === 'MEDIA' ? 'ICP_ADJACENTE' : 'FORA_ICP';

      statusCounts[status]++;
      bucketCounts[bucket]++;

      // Adicionar exemplos (até 5)
      if (examples.length < 5) {
        const company = r.company_id ? companiesMap[r.company_id] : null;
        const companyName = company?.company_name || 
                           reportData?.onboarding_data?.step1_DadosBasicos?.razaoSocial ||
                           reportData?.onboarding_data?.step1_DadosBasicos?.nomeFantasia ||
                           'Empresa';
        examples.push({
          companyName,
          status,
          bucket,
          sector: company?.industry || reportData?.onboarding_data?.step1_DadosBasicos?.setorPrincipal,
          uf: company?.uf || reportData?.onboarding_data?.step1_DadosBasicos?.endereco?.estado,
          mainReasons: mc8.bestAngles?.slice(0, 3) || [],
        });
      }
    });

    return {
      totalCompanies: portfolioReports.length,
      statusCounts,
      bucketCounts,
      examples,
    };
  } catch (error) {
    console.error('[MC8-PORTFOLIO] Erro:', error);
    return null;
  }
}

// =============================================================================
// 🔥🔥🔥 FUNÇÃO: Construir Internal Context (TODOS os dados internos)
// =============================================================================
async function buildInternalContext(params: {
  supabaseClient: any;
  tenantId: string;
  icpProfileMetadataId: string;
}) {
  const { supabaseClient, tenantId, icpProfileMetadataId } = params;

  console.log('[BUILD-INTERNAL-CONTEXT] 🔍 Buscando todos os dados internos...');

  // 1) Sessão de onboarding mais recente (steps 1 a 6)
  const { data: onboardingSession } = await supabaseClient
    .from('onboarding_sessions')
    .select('step1_data, step2_data, step3_data, step4_data, step5_data, step6_data, updated_at')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 2) Produtos do tenant
  const { data: tenantProducts } = await supabaseClient
    .from('tenant_products')
    .select('id, nome, categoria, category, segmento, linha, ativo, receita_estimativa, margem_estimativa, descricao, description')
    .eq('tenant_id', tenantId);

  // 3) Produtos de concorrentes + intensidade (para o heatmap)
  const { data: competitorProducts } = await supabaseClient
    .from('tenant_competitor_products')
    .select('id, competitor_name, categoria, segmento, linha, intensidade, cidade, estado, capital_social, nome, descricao')
    .eq('tenant_id', tenantId);

  // 4) Análise competitiva agregada (a mesma fonte do mapa, cards e métricas da aba Competitiva)
  const { data: competitiveAnalysis } = await supabaseClient
    .from('competitive_analysis')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('icp_profile_metadata_id', icpProfileMetadataId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 5) SWOT competitiva
  const { data: competitiveSwot } = await supabaseClient
    .from('icp_competitive_swot')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('icp_profile_id', icpProfileMetadataId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 6) Matriz BCG (market share x crescimento, clientes alvo, etc.)
  const { data: bcgMatrix } = await supabaseClient
    .from('icp_bcg_matrix')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('icp_profile_id', icpProfileMetadataId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 7) Market Insights + tendências
  const { data: marketInsights } = await supabaseClient
    .from('icp_market_insights')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('icp_profile_metadata_id', icpProfileMetadataId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 8) Metadata do ICP (texto de resumo que aparece no topo da página do ICP Principal)
  const { data: icpMetadata } = await supabaseClient
    .from('icp_profiles_metadata')
    .select('*')
    .eq('id', icpProfileMetadataId)
    .maybeSingle();

  const result = {
    onboardingSteps: onboardingSession || null,
    produtosTenant: tenantProducts || [],
    produtosConcorrentes: competitorProducts || [],
    competitiva: {
      overview: competitiveAnalysis || null,
      swot: competitiveSwot || null,
      bcg: bcgMatrix || null,
      insights: marketInsights || null,
    },
    icpMetadata: icpMetadata || null,
  };

  console.log('[BUILD-INTERNAL-CONTEXT] ✅ Contexto interno construído:', {
    hasOnboarding: !!onboardingSession,
    produtosTenantCount: (tenantProducts || []).length,
    produtosConcorrentesCount: (competitorProducts || []).length,
    hasCompetitiveOverview: !!competitiveAnalysis,
    hasSwot: !!competitiveSwot,
    hasBcg: !!bcgMatrix,
    hasMarketInsights: !!marketInsights,
    hasIcpMetadata: !!icpMetadata,
  });

  return result;
}

// =============================================================================
// 🎯 FUNÇÃO: Construir Report Model (Dados Reais)
// =============================================================================
async function buildReportModel(
  supabase: any,
  metadata: any,
  tenant: any,
  onboardingData: OnboardingData,
  icp_metadata_id: string,
  tenant_id: string
): Promise<ReportModel> {
  // 1. Tenant Company (DADOS COMPLETOS)
  const tenantCompany = {
    name: tenant?.nome || tenant?.name || onboardingData.step1_DadosBasicos?.razaoSocial || 'Empresa Cliente',
    cnpj: tenant?.cnpj || onboardingData.step1_DadosBasicos?.cnpj,
    segment: tenant?.segmento || tenant?.segment || onboardingData.step1_DadosBasicos?.setorPrincipal,
    razaoSocial: onboardingData.step1_DadosBasicos?.razaoSocial,
    nomeFantasia: onboardingData.step1_DadosBasicos?.nomeFantasia,
    website: onboardingData.step1_DadosBasicos?.website,
    setorPrincipal: onboardingData.step1_DadosBasicos?.setorPrincipal,
    porteEmpresa: onboardingData.step1_DadosBasicos?.porteEmpresa,
    capitalSocial: onboardingData.step1_DadosBasicos?.capitalSocial,
    cidade: onboardingData.step1_DadosBasicos?.endereco?.cidade,
    estado: onboardingData.step1_DadosBasicos?.endereco?.estado,
  };

  // 2. ICP Profile
  const icpProfile = {
    id: metadata.id,
    nome: metadata.nome || 'ICP Principal',
    descricao: metadata.descricao,
    setor_foco: metadata.setor_foco,
    nicho_foco: metadata.nicho_foco,
  };

  // 3. MC6 Summary (se disponível)
  let mc6Summary = null;
  try {
    const { data: latestReport } = await supabase
      .from('icp_reports')
      .select('report_data')
      .eq('icp_profile_metadata_id', icp_metadata_id)
      .eq('tenant_id', tenant_id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestReport?.report_data?.icpMatchFitOverview) {
      mc6Summary = latestReport.report_data.icpMatchFitOverview;
    }
  } catch (e) {
    console.log('[REPORT-MODEL] MC6 não disponível');
  }

  // 4. MC8 Portfolio
  const mc8Portfolio = await fetchMC8Portfolio(
    supabase,
    icp_metadata_id,
    tenant_id,
    tenantCompany.cnpj
  );

  // 5. MC9 Expansion
  let mc9Expansion = null;
  try {
    const { data: mc9Reports } = await supabase
      .from('icp_reports')
      .select('report_data')
      .eq('icp_profile_metadata_id', icp_metadata_id)
      .eq('tenant_id', tenant_id)
      .not('report_data->mc9HunterPlan', 'is', null)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (mc9Reports?.report_data?.mc9HunterPlan) {
      const mc9 = mc9Reports.report_data.mc9HunterPlan;
      mc9Expansion = {
        totalTargets: mc9.summary?.highFitCount + mc9.summary?.mediumFitCount || 0,
        clusters: mc9.clusters?.slice(0, 3).map((c: any) => c.name) || [],
        sampleQueries: mc9.queries?.slice(0, 2).map((q: any) => q.query) || [],
      };
    }
  } catch (e) {
    console.log('[REPORT-MODEL] MC9 não disponível');
  }

  // 6. Nichos e Setores
  const step2 = onboardingData.step2_SetoresNichos || {};
  const step3 = onboardingData.step3_PerfilClienteIdeal || {};
  const nichesAndSectors = {
    mainSectors: step2.setoresAlvo || step3.setoresAlvo || [],
    niches: step2.nichosAlvo || step3.nichosAlvo || [],
  };

  // 7. 🔥🔥🔥 DADOS COMPLETOS DAS 6 ETAPAS DO ONBOARDING (TUDO para LLM analisar)
  // ⚠️ CRÍTICO: Passar TODOS os dados completos, não apenas campos agregados
  const onboardingDataForModel = {
    // Campos agregados (mantidos para compatibilidade)
    diferenciais: onboardingData.step4_SituacaoAtual?.diferenciais || [],
    casosDeUso: onboardingData.step4_SituacaoAtual?.casosDeUso || [],
    ticketsECiclos: onboardingData.step4_SituacaoAtual?.ticketsECiclos || [],
    categoriaSolucao: onboardingData.step4_SituacaoAtual?.categoriaSolucao,
    setoresAlvo: step2.setoresAlvo || step3.setoresAlvo || [],
    nichosAlvo: step2.nichosAlvo || step3.nichosAlvo || [],
    cnaesAlvo: step2.cnaesAlvo || step3.cnaesAlvo || [],
    porteAlvo: step3.porteAlvo || [],
    localizacaoAlvo: step3.localizacaoAlvo || {},
    faturamentoAlvo: step3.faturamentoAlvo || {},
    funcionariosAlvo: step3.funcionariosAlvo || {},
    
    // 🔥🔥🔥 ETAPA 1 COMPLETA: Dados Básicos da Empresa
    step1_DadosBasicos: onboardingData.step1_DadosBasicos ? {
      razaoSocial: onboardingData.step1_DadosBasicos.razaoSocial,
      nomeFantasia: onboardingData.step1_DadosBasicos.nomeFantasia,
      cnpj: onboardingData.step1_DadosBasicos.cnpj,
      email: onboardingData.step1_DadosBasicos.email,
      telefone: onboardingData.step1_DadosBasicos.telefone,
      website: onboardingData.step1_DadosBasicos.website,
      setorPrincipal: onboardingData.step1_DadosBasicos.setorPrincipal,
      porteEmpresa: onboardingData.step1_DadosBasicos.porteEmpresa,
      capitalSocial: onboardingData.step1_DadosBasicos.capitalSocial,
      naturezaJuridica: onboardingData.step1_DadosBasicos.naturezaJuridica,
      dataAbertura: onboardingData.step1_DadosBasicos.dataAbertura,
      situacaoCadastral: onboardingData.step1_DadosBasicos.situacaoCadastral,
      cnaePrincipal: onboardingData.step1_DadosBasicos.cnaePrincipal,
      cnaesSecundarios: onboardingData.step1_DadosBasicos.cnaesSecundarios || [],
      endereco: onboardingData.step1_DadosBasicos.endereco,
      concorrentesDiretos: onboardingData.step1_DadosBasicos.concorrentesDiretos || [],
      clientesAtuais: onboardingData.step1_DadosBasicos.clientesAtuais || [],
    } : undefined,
    
    // 🔥🔥🔥 ETAPA 2 COMPLETA: Setores e Nichos
    step2_SetoresNichos: onboardingData.step2_SetoresNichos ? {
      sectorAtual: onboardingData.step2_SetoresNichos.sectorAtual,
      nicheAtual: onboardingData.step2_SetoresNichos.nicheAtual,
      cnaes: onboardingData.step2_SetoresNichos.cnaes || [],
      setoresAlvo: onboardingData.step2_SetoresNichos.setoresAlvo || [],
      nichosAlvo: onboardingData.step2_SetoresNichos.nichosAlvo || [],
      cnaesAlvo: onboardingData.step2_SetoresNichos.cnaesAlvo || [],
      setoresAlvoCodes: onboardingData.step2_SetoresNichos.setoresAlvoCodes || [],
      customSectorNames: onboardingData.step2_SetoresNichos.customSectorNames || {},
    } : undefined,
    
    // 🔥🔥🔥 ETAPA 3 COMPLETA: Perfil do Cliente Ideal
    step3_PerfilClienteIdeal: onboardingData.step3_PerfilClienteIdeal ? {
      setoresAlvo: onboardingData.step3_PerfilClienteIdeal.setoresAlvo || [],
      nichosAlvo: onboardingData.step3_PerfilClienteIdeal.nichosAlvo || [],
      cnaesAlvo: onboardingData.step3_PerfilClienteIdeal.cnaesAlvo || [],
      ncmsAlvo: onboardingData.step3_PerfilClienteIdeal.ncmsAlvo || [],
      porteAlvo: onboardingData.step3_PerfilClienteIdeal.porteAlvo || [],
      localizacaoAlvo: onboardingData.step3_PerfilClienteIdeal.localizacaoAlvo || {},
      faturamentoAlvo: onboardingData.step3_PerfilClienteIdeal.faturamentoAlvo || {},
      funcionariosAlvo: onboardingData.step3_PerfilClienteIdeal.funcionariosAlvo || {},
      caracteristicasEspeciais: onboardingData.step3_PerfilClienteIdeal.caracteristicasEspeciais || [],
    } : undefined,
    
    // 🔥🔥🔥 ETAPA 4 COMPLETA: Situação Atual (CRÍTICO - diferenciais, casos de uso, tickets, concorrentes)
    step4_SituacaoAtual: onboardingData.step4_SituacaoAtual ? {
      categoriaSolucao: onboardingData.step4_SituacaoAtual.categoriaSolucao,
      diferenciais: onboardingData.step4_SituacaoAtual.diferenciais || [],
      casosDeUso: onboardingData.step4_SituacaoAtual.casosDeUso || [],
      ticketsECiclos: onboardingData.step4_SituacaoAtual.ticketsECiclos || [],
      ticketMedio: onboardingData.step4_SituacaoAtual.ticketMedio,
      cicloVendaMedia: onboardingData.step4_SituacaoAtual.cicloVendaMedia,
      concorrentesDiretos: onboardingData.step4_SituacaoAtual.concorrentesDiretos || [],
      analisarComIA: onboardingData.step4_SituacaoAtual.analisarComIA,
    } : undefined,
    
    // 🔥🔥🔥 ETAPA 5 COMPLETA: Histórico e Enriquecimento (clientes atuais, benchmarking)
    step5_HistoricoEEnriquecimento: onboardingData.step5_HistoricoEEnriquecimento ? {
      clientesAtuais: onboardingData.step5_HistoricoEEnriquecimento.clientesAtuais || [],
      empresasBenchmarking: onboardingData.step5_HistoricoEEnriquecimento.empresasBenchmarking || [],
      analisarComIA: onboardingData.step5_HistoricoEEnriquecimento.analisarComIA,
    } : undefined,
  };

  // 7. 🔥 NOVO: Análise Competitiva
  const competitiveAnalysis = await fetchCompetitiveAnalysis(
    supabase,
    tenant_id,
    onboardingData
  );

  // 8. 🔥 NOVO: Product Heatmap
  const productHeatmap = await fetchProductHeatmap(
    supabase,
    tenant_id,
    tenantCompany.cnpj
  );

  // 9. 🔥 NOVO: Dados de Clientes e BCG
  const clientBCGData = await fetchClientBCGData(
    supabase,
    tenant_id,
    onboardingData
  );

  // 10. 🔥 NOVO: Market Insights
  const marketInsights = await fetchMarketInsights(
    supabase,
    tenant_id,
    icp_metadata_id,
    metadata.setor_foco
  );

  // 11. 🔥🔥🔥 NOVO: Buscar Relatórios ICP Já Prontos (para contexto completo)
  let existingReports = null;
  try {
    const { data: completedReports } = await supabase
      .from('icp_reports')
      .select('id, report_type, status, full_report_markdown, executive_summary_markdown, report_data, generated_at')
      .eq('icp_profile_metadata_id', icp_metadata_id)
      .eq('tenant_id', tenant_id)
      .eq('status', 'completed')
      .order('generated_at', { ascending: false })
      .limit(5); // Últimos 5 relatórios completos

    if (completedReports && completedReports.length > 0) {
      existingReports = {
        total: completedReports.length,
        latest: completedReports[0],
        summaries: completedReports.map((r: any) => ({
          id: r.id,
          report_type: r.report_type,
          generated_at: r.generated_at,
          hasFullReport: !!(r.full_report_markdown || r.report_data?.fullReportMarkdown),
          hasExecutiveSummary: !!(r.executive_summary_markdown || r.report_data?.executiveSummaryMarkdown),
          // Extrair insights principais dos relatórios anteriores
          keyInsights: r.report_data?.keyInsights || [],
          recommendations: r.report_data?.recommendations || [],
        })),
        // Extrair dados agregados de todos os relatórios
        aggregatedData: {
          mc8Assessments: completedReports
            .filter((r: any) => r.report_data?.mc8Assessment)
            .map((r: any) => r.report_data.mc8Assessment),
          mc9Plans: completedReports
            .filter((r: any) => r.report_data?.mc9HunterPlan)
            .map((r: any) => r.report_data.mc9HunterPlan),
        },
      };
      console.log('[REPORT-MODEL] ✅ Relatórios ICP prontos encontrados:', existingReports.total);
    } else {
      console.log('[REPORT-MODEL] ⚠️ Nenhum relatório ICP completo encontrado');
    }
  } catch (e) {
    console.error('[REPORT-MODEL] Erro ao buscar relatórios existentes:', e);
  }

  // 12. 🔥🔥🔥 NOVO: Buscar Análises e Gráficos Relacionados
  let relatedAnalyses = null;
  try {
    // Buscar análises competitivas completas
    const { data: competitiveAnalyses } = await supabase
      .from('competitive_analysis')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .limit(3);

    // Buscar análises SWOT
    const { data: swotAnalyses } = await supabase
      .from('icp_competitive_swot')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .limit(3);

    // Buscar matriz BCG
    const { data: bcgMatrices } = await supabase
      .from('icp_bcg_matrix')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .limit(3);

    // Buscar insights de mercado
    const { data: marketInsightsData } = await supabase
      .from('icp_market_insights')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('icp_profile_metadata_id', icp_metadata_id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (competitiveAnalyses || swotAnalyses || bcgMatrices || marketInsightsData) {
      relatedAnalyses = {
        competitiveAnalyses: competitiveAnalyses || [],
        swotAnalyses: swotAnalyses || [],
        bcgMatrices: bcgMatrices || [],
        marketInsights: marketInsightsData || [],
      };
      console.log('[REPORT-MODEL] ✅ Análises relacionadas encontradas:', {
        competitive: (relatedAnalyses?.competitiveAnalyses || []).length,
        swot: (relatedAnalyses?.swotAnalyses || []).length,
        bcg: (relatedAnalyses?.bcgMatrices || []).length,
        market: (relatedAnalyses?.marketInsights || []).length,
      });
    }
  } catch (e) {
    console.error('[REPORT-MODEL] Erro ao buscar análises relacionadas:', e);
  }

  return {
    tenantCompany,
    icpProfile,
    onboardingData: onboardingDataForModel,
    mc6Summary: mc6Summary || null,
    mc8Portfolio: mc8Portfolio || null,
    mc9Expansion: mc9Expansion || null,
    nichesAndSectors,
    competitiveAnalysis: competitiveAnalysis || null,
    productHeatmap: productHeatmap || null,
    clientBCGData: clientBCGData || null,
    marketInsights: marketInsights || null,
    // 🔥🔥🔥 NOVOS CAMPOS: Relatórios prontos e análises relacionadas
    existingReports: existingReports || null,
    relatedAnalyses: relatedAnalyses || null,
  };
}

serve(async (req) => {
  // 🔥 CRÍTICO: Tratar OPTIONS PRIMEIRO
  if (req.method === 'OPTIONS') {
    console.log('[GENERATE-ICP-REPORT] ✅ Respondendo ao preflight OPTIONS');
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  console.log('[GENERATE-ICP-REPORT] 🚀 Requisição recebida:', req.method);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const serperKey = Deno.env.get('SERPER_API_KEY');

    console.log('[GENERATE-ICP-REPORT] 📋 Variáveis de ambiente:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasOpenaiKey: !!openaiKey,
      hasSerperKey: !!serperKey,
    });

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Variáveis de ambiente do Supabase não configuradas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY não configurada. Configure em: Dashboard > Edge Functions > Secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { icp_metadata_id, report_type, tenant_id } = await req.json();

    console.log('[GENERATE-ICP-REPORT] 📊 Parâmetros:', { icp_metadata_id, report_type, tenant_id });

    if (!icp_metadata_id || !tenant_id) {
      return new Response(
        JSON.stringify({ error: 'icp_metadata_id e tenant_id são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 🔥 ENTERPRISE PATTERN: Criar registro ANTES de processar (status: 'generating')
    // Isso permite rastreamento e retry em caso de falha
    console.log('[GENERATE-ICP-REPORT] 📝 Criando registro inicial no banco (status: generating)...');
    const { data: initialReport, error: initialError } = await supabase
      .from('icp_reports')
      .insert({
        icp_profile_metadata_id: icp_metadata_id,
        tenant_id: tenant_id,
        report_type: report_type || 'completo',
        status: 'generating',
        report_data: {
          started_at: new Date().toISOString(),
          progress: 0,
        },
      })
      .select('id')
      .single();

    if (initialError || !initialReport) {
      console.error('[GENERATE-ICP-REPORT] ❌ Erro ao criar registro inicial:', initialError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar registro inicial', details: initialError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const reportId = initialReport.id;
    console.log('[GENERATE-ICP-REPORT] ✅ Registro criado:', reportId);

    // Função helper para atualizar progresso
    const updateProgress = async (progress: number, message?: string) => {
      try {
        await supabase
          .from('icp_reports')
          .update({
            report_data: {
              progress,
              last_update: new Date().toISOString(),
              message,
            },
          })
          .eq('id', reportId);
      } catch (e) {
        console.warn('[GENERATE-ICP-REPORT] ⚠️ Erro ao atualizar progresso:', e);
      }
    };

    // Função helper para marcar como falha
    const markAsFailed = async (errorMessage: string) => {
      try {
        await supabase
          .from('icp_reports')
          .update({
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', reportId);
      } catch (e) {
        console.error('[GENERATE-ICP-REPORT] ❌ Erro ao marcar como falha:', e);
      }
    };

    try {
      await updateProgress(10, 'Buscando dados do ICP...');

      // 1. Buscar metadata do ICP
      const { data: metadata, error: metaError } = await supabase
      .from('icp_profiles_metadata')
      .select('*')
      .eq('id', icp_metadata_id)
      .eq('tenant_id', tenant_id)
      .single();

      if (metaError || !metadata) {
        console.error('[GENERATE-ICP-REPORT] ❌ ICP não encontrado:', metaError);
        await markAsFailed(`ICP não encontrado: ${metaError?.message}`);
        return new Response(
          JSON.stringify({ error: 'ICP não encontrado', details: metaError?.message, reportId }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[GENERATE-ICP-REPORT] ✅ Metadata encontrada:', metadata.nome);

      await updateProgress(20, 'Carregando dados do tenant e onboarding...');

      // 2. Buscar tenant para contexto
      const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenant_id)
      .single();

      console.log('[GENERATE-ICP-REPORT] ✅ Tenant:', tenant?.nome);

      // 3. 🔥 CRÍTICO: Buscar dados COMPLETOS do onboarding_sessions
      const { data: sessions, error: sessionError } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('updated_at', { ascending: false })
      .limit(1);

      if (sessionError) {
        console.error('[GENERATE-ICP-REPORT] ⚠️ Erro ao buscar sessão:', sessionError);
      }

      const session = sessions && sessions.length > 0 ? sessions[0] : null;
      
      if (!session) {
        console.log('[GENERATE-ICP-REPORT] ⚠️ Nenhuma sessão de onboarding encontrada, usando dados vazios');
      }

      // Extrair dados do onboarding
      // 🔥 CORRIGIDO: Mesclar clientesAtuais de Step1 e Step5 (evitar duplicatas por CNPJ)
      const clientesStep1 = session?.step1_data?.clientesAtuais || [];
      const clientesStep5 = session?.step5_data?.clientesAtuais || [];
      const clientesUnicos = new Map<string, any>();
      [...clientesStep1, ...clientesStep5].forEach((cliente: any) => {
        const cnpjClean = cliente.cnpj?.replace(/\D/g, '') || '';
        if (cnpjClean && !clientesUnicos.has(cnpjClean)) {
          clientesUnicos.set(cnpjClean, cliente);
        }
      });
      const todosClientes = Array.from(clientesUnicos.values());
      
      const onboardingData: OnboardingData = {
        step1_DadosBasicos: session?.step1_data || {},
        step2_SetoresNichos: session?.step2_data || {},
        step3_PerfilClienteIdeal: session?.step3_data || {},
        step4_SituacaoAtual: session?.step4_data || {},
        step5_HistoricoEEnriquecimento: {
          ...(session?.step5_data || {}),
          clientesAtuais: todosClientes, // 🔥 CORRIGIDO: Usar clientes mesclados
        },
      };

      console.log('[GENERATE-ICP-REPORT] 📊 Dados do onboarding carregados:', {
        hasStep1: !!session?.step1_data,
        hasStep2: !!session?.step2_data,
        hasStep3: !!session?.step3_data,
        hasStep4: !!session?.step4_data,
        hasStep5: !!session?.step5_data,
        // 🔥 LOG DETALHADO: Verificar dados específicos
        concorrentesStep1: session?.step1_data?.concorrentesDiretos?.length || 0,
        concorrentesStep4: session?.step4_data?.concorrentesDiretos?.length || 0,
        diferenciais: session?.step4_data?.diferenciais?.length || 0,
        casosDeUso: session?.step4_data?.casosDeUso?.length || 0,
        clientesStep1: session?.step1_data?.clientesAtuais?.length || 0,
        clientesStep5: session?.step5_data?.clientesAtuais?.length || 0,
        clientesTotal: todosClientes.length,
        empresasBenchmarking: session?.step5_data?.empresasBenchmarking?.length || 0,
      });
      
      // 🔥 LOG DETALHADO: Mostrar primeiros dados reais
      if (session?.step4_data?.concorrentesDiretos && session.step4_data.concorrentesDiretos.length > 0) {
        console.log('[GENERATE-ICP-REPORT] 🔍 PRIMEIROS CONCORRENTES REAIS:', 
          session.step4_data.concorrentesDiretos.slice(0, 3).map((c: any) => ({
            nome: c.nome || c.razaoSocial,
            setor: c.setor,
            cidade: c.cidade,
            estado: c.estado,
          }))
        );
      }
      
      if (session?.step4_data?.diferenciais && session.step4_data.diferenciais.length > 0) {
        console.log('[GENERATE-ICP-REPORT] 🔍 DIFERENCIAIS REAIS:', session.step4_data.diferenciais.slice(0, 5));
      }
      
      if (todosClientes.length > 0) {
        console.log('[GENERATE-ICP-REPORT] 🔍 PRIMEIROS CLIENTES REAIS:', 
          todosClientes.slice(0, 3).map((c: any) => ({
            nome: c.nome || c.razaoSocial,
            setor: c.setor,
            cidade: c.cidade,
          }))
        );
      }

      await updateProgress(30, 'Construindo modelo de dados...');

      // 4. Buscar critérios de análise configurados
      const { data: criteria } = await supabase
      .from('icp_analysis_criteria')
      .select('*')
      .eq('icp_profile_metadata_id', icp_metadata_id)
      .eq('tenant_id', tenant_id)
      .maybeSingle();

      // 5. Buscar dados da web com SERPER (se disponível)
      let webSearchResults = '';
      if (serperKey && onboardingData.step1_DadosBasicos?.website) {
        try {
        const searchQuery = `${onboardingData.step1_DadosBasicos?.razaoSocial || ''} ${onboardingData.step4_SituacaoAtual?.categoriaSolucao || ''} mercado Brasil`;
        const serperResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: searchQuery,
            gl: 'br',
            hl: 'pt-br',
            num: 5,
          }),
        });

          if (serperResponse.ok) {
            const serperData = await serperResponse.json();
            webSearchResults = serperData.organic?.map((r: any) => 
              `- ${r.title}: ${r.snippet} (${r.link})`
            ).join('\n') || '';
            console.log('[GENERATE-ICP-REPORT] ✅ SERPER retornou resultados');
          }
        } catch (e) {
          console.log('[GENERATE-ICP-REPORT] ⚠️ SERPER erro:', e);
        }
      }

      // 6. 🔥🔥🔥 CONSTRUIR INTERNAL CONTEXT (TODOS os dados internos)
      await updateProgress(35, 'Buscando contexto interno completo...');
      const internalContext = await buildInternalContext({
        supabaseClient: supabase,
        tenantId: tenant_id,
        icpProfileMetadataId: icp_metadata_id,
      });

      // 7. 🎯 CONSTRUIR REPORT MODEL (DADOS REAIS) + INJETAR INTERNAL CONTEXT
      await updateProgress(40, 'Construindo modelo de dados...');
      const existingReportModel = await buildReportModel(
        supabase,
        metadata,
        tenant,
        onboardingData,
        icp_metadata_id,
        tenant_id
      );

      // 🔥🔥🔥 INJETAR INTERNAL CONTEXT no reportModel
      const reportModel = {
        ...existingReportModel,
        internalContext,
      };

    // 🔥 LOG DETALHADO: Mostrar TODOS os dados disponíveis
    console.log('[GENERATE-ICP-REPORT] ✅ Report Model construído:', {
      hasMC8: !!reportModel.mc8Portfolio,
      hasMC9: !!reportModel.mc9Expansion,
      totalCompanies: reportModel.mc8Portfolio?.totalCompanies || 0,
      hasCompetitiveAnalysis: !!reportModel.competitiveAnalysis,
      competitorsCount: reportModel.competitiveAnalysis?.competitors?.length || 0,
      hasProductHeatmap: !!reportModel.productHeatmap,
      tenantProductsCount: reportModel.productHeatmap?.tenantProducts?.length || 0,
      competitorProductsCount: reportModel.productHeatmap?.competitorProducts?.length || 0,
      hasClientBCGData: !!reportModel.clientBCGData,
      clientesCount: reportModel.clientBCGData?.clientesAtuais?.length || 0,
      benchmarkingCount: reportModel.clientBCGData?.empresasBenchmarking?.length || 0,
      hasMarketInsights: !!reportModel.marketInsights,
      onboardingData: {
        hasStep1: !!onboardingData.step1_DadosBasicos,
        hasStep2: !!onboardingData.step2_SetoresNichos,
        hasStep3: !!onboardingData.step3_PerfilClienteIdeal,
        hasStep4: !!onboardingData.step4_SituacaoAtual,
        hasStep5: !!onboardingData.step5_HistoricoEEnriquecimento,
        diferenciais: onboardingData.step4_SituacaoAtual?.diferenciais?.length || 0,
        casosDeUso: onboardingData.step4_SituacaoAtual?.casosDeUso?.length || 0,
        ticketsCiclos: onboardingData.step4_SituacaoAtual?.ticketsECiclos?.length || 0,
      },
    });
    
    // 🔥 LOG COMPLETO DO REPORT MODEL (para debug) - PRIMEIROS 2000 CHARS
    const reportModelJson = JSON.stringify(reportModel, null, 2);
    console.log('[GENERATE-ICP-REPORT] 📊 Report Model COMPLETO (primeiros 2000 chars):', reportModelJson.substring(0, 2000));
    console.log('[GENERATE-ICP-REPORT] 📊 Report Model tamanho total:', reportModelJson.length, 'caracteres');
    
    // 🔥🔥🔥 LOG CRÍTICO: Verificar se onboardingData está COMPLETO
    console.log('[GENERATE-ICP-REPORT] 🔥🔥🔥 ONBOARDING DATA COMPLETO (JSON):', JSON.stringify(reportModel.onboardingData, null, 2));
    
    // 🔥🔥🔥 LOG CRÍTICO: Verificar relatórios prontos e análises relacionadas
    if (reportModel.existingReports) {
      console.log('[GENERATE-ICP-REPORT] 🔥🔥🔥 RELATÓRIOS ICP PRONTOS ENCONTRADOS:', {
        total: reportModel.existingReports.total,
        latestId: reportModel.existingReports.latest?.id,
        latestGeneratedAt: reportModel.existingReports.latest?.generated_at,
        summaries: reportModel.existingReports.summaries.map((s: any) => ({
          id: s.id,
          report_type: s.report_type,
          hasFullReport: s.hasFullReport,
          hasExecutiveSummary: s.hasExecutiveSummary,
        })),
      });
    } else {
      console.log('[GENERATE-ICP-REPORT] ⚠️ Nenhum relatório ICP pronto encontrado para contexto');
    }
    
    if (reportModel.relatedAnalyses) {
      console.log('[GENERATE-ICP-REPORT] 🔥🔥🔥 ANÁLISES RELACIONADAS ENCONTRADAS:', {
        competitiveAnalyses: reportModel.relatedAnalyses.competitiveAnalyses?.length || 0,
        swotAnalyses: reportModel.relatedAnalyses.swotAnalyses?.length || 0,
        bcgMatrices: reportModel.relatedAnalyses.bcgMatrices?.length || 0,
        marketInsights: reportModel.relatedAnalyses.marketInsights?.length || 0,
      });
    } else {
      console.log('[GENERATE-ICP-REPORT] ⚠️ Nenhuma análise relacionada encontrada');
    }
    
    // 🔥 LOG CRÍTICO: Verificar se TODOS os dados das 6 etapas estão no reportModel
    console.log('[GENERATE-ICP-REPORT] 🔥 VERIFICAÇÃO CRÍTICA DE DADOS NO REPORT MODEL:', {
      competitiveAnalysis: {
        exists: !!reportModel.competitiveAnalysis,
        competitorsCount: reportModel.competitiveAnalysis?.competitors?.length || 0,
        firstCompetitor: reportModel.competitiveAnalysis?.competitors?.[0] || null,
        diferenciaisCount: reportModel.competitiveAnalysis?.competitiveAdvantages?.length || 0,
        firstDiferencial: reportModel.competitiveAnalysis?.competitiveAdvantages?.[0] || null,
      },
      productHeatmap: {
        exists: !!reportModel.productHeatmap,
        tenantProductsCount: reportModel.productHeatmap?.tenantProducts?.length || 0,
        firstTenantProduct: reportModel.productHeatmap?.tenantProducts?.[0] || null,
        competitorProductsCount: reportModel.productHeatmap?.competitorProducts?.length || 0,
      },
      clientBCGData: {
        exists: !!reportModel.clientBCGData,
        clientesCount: reportModel.clientBCGData?.clientesAtuais?.length || 0,
        firstCliente: reportModel.clientBCGData?.clientesAtuais?.[0] || null,
        benchmarkingCount: reportModel.clientBCGData?.empresasBenchmarking?.length || 0,
      },
      // 🔥🔥🔥 VERIFICAÇÃO COMPLETA DAS 6 ETAPAS
      onboardingData: {
        // Step 1
        step1_razaoSocial: reportModel.onboardingData?.step1_DadosBasicos?.razaoSocial || null,
        step1_concorrentes: reportModel.onboardingData?.step1_DadosBasicos?.concorrentesDiretos?.length || 0,
        step1_clientes: reportModel.onboardingData?.step1_DadosBasicos?.clientesAtuais?.length || 0,
        // Step 2
        step2_setores: reportModel.onboardingData?.step2_SetoresNichos?.setoresAlvo?.length || 0,
        step2_nichos: reportModel.onboardingData?.step2_SetoresNichos?.nichosAlvo?.length || 0,
        // Step 3
        step3_porte: reportModel.onboardingData?.step3_PerfilClienteIdeal?.porteAlvo?.length || 0,
        step3_localizacao: reportModel.onboardingData?.step3_PerfilClienteIdeal?.localizacaoAlvo ? '✅' : '❌',
        // Step 4 - 🔥 MAIS IMPORTANTE
        step4_diferenciais: reportModel.onboardingData?.step4_SituacaoAtual?.diferenciais?.length || 0,
        step4_casosDeUso: reportModel.onboardingData?.step4_SituacaoAtual?.casosDeUso?.length || 0,
        step4_ticketsECiclos: reportModel.onboardingData?.step4_SituacaoAtual?.ticketsECiclos?.length || 0,
        step4_concorrentes: reportModel.onboardingData?.step4_SituacaoAtual?.concorrentesDiretos?.length || 0,
        step4_categoriaSolucao: reportModel.onboardingData?.step4_SituacaoAtual?.categoriaSolucao || null,
        // Step 5
        step5_clientes: reportModel.onboardingData?.step5_HistoricoEEnriquecimento?.clientesAtuais?.length || 0,
        step5_benchmarking: reportModel.onboardingData?.step5_HistoricoEEnriquecimento?.empresasBenchmarking?.length || 0,
        // Campos simplificados (compatibilidade)
        diferenciais: reportModel.onboardingData?.diferenciais?.length || 0,
        casosDeUso: reportModel.onboardingData?.casosDeUso?.length || 0,
        ticketsECiclos: reportModel.onboardingData?.ticketsECiclos?.length || 0,
      },
    });
    
    // 🔥 VALIDAÇÃO PRÉ-LLM: Verificar se há dados reais disponíveis
    if (reportModel.competitiveAnalysis?.competitors && reportModel.competitiveAnalysis.competitors.length > 0) {
      console.log('[GENERATE-ICP-REPORT] ✅ CONCORRENTES DISPONÍVEIS:', reportModel.competitiveAnalysis.competitors.length);
      reportModel.competitiveAnalysis.competitors.forEach((c: any, idx: number) => {
        console.log(`[GENERATE-ICP-REPORT]   Concorrente ${idx + 1}: ${c.nome} (${c.setor}, ${c.cidade}/${c.estado})`);
      });
    } else {
      console.log('[GENERATE-ICP-REPORT] ⚠️ NENHUM CONCORRENTE DISPONÍVEL no reportModel');
    }
    
    if (reportModel.onboardingData?.diferenciais && reportModel.onboardingData.diferenciais.length > 0) {
      console.log('[GENERATE-ICP-REPORT] ✅ DIFERENCIAIS DISPONÍVEIS:', reportModel.onboardingData.diferenciais);
    } else {
      console.log('[GENERATE-ICP-REPORT] ⚠️ NENHUM DIFERENCIAL DISPONÍVEL no reportModel');
    }

    // 7. 🎯 MONTAR PROMPT PARA LLM (NOVO MODELO)
    const prompt = buildLLMPrompt(reportModel);

    console.log('[GENERATE-ICP-REPORT] 🤖 Chamando OpenAI...');

    // MC6: Integração Match & Fit no relatório ICP
    let icpMatchFitOverview: any = null;
    try {
      console.log('[GENERATE-ICP-REPORT] MC6: Iniciando Match & Fit para ICP');
      icpMatchFitOverview = await buildIcpMatchFitOverview(
        tenant_id,
        metadata,
        onboardingData,
        supabase
      );
      console.log('[GENERATE-ICP-REPORT] MC6: Match & Fit concluído', {
        enabled: icpMatchFitOverview?.enabled,
        score: icpMatchFitOverview?.score,
      });
    } catch (matchFitError) {
      console.warn('[GENERATE-ICP-REPORT] MC6: Erro ao calcular Match & Fit:', matchFitError);
      // Não falhar o relatório por causa do Match & Fit
      icpMatchFitOverview = {
        enabled: false,
        summary: 'Não foi possível gerar análise de Match & Fit devido a erro interno.',
      };
    }

    // 8. 🎯 SYSTEM PROMPT OFICIAL MC9 V2.5 - ULTRA RIGOROSO
    const SYSTEM_PROMPT = `Você é STRATEVO ONE – Módulo oficial de Inteligência Comercial e Estratégica do ecossistema OLV.

Sua função é gerar dois artefatos em Markdown, totalmente estruturados e universais, aplicáveis a qualquer empresa, setor, CNAE, porte ou modelo de negócios:

executiveSummaryMarkdown → Resumo Executivo Hierarquizado
fullReportMarkdown → Relatório Estratégico Completo Hierarquizado

🔥🔥🔥 FONTE ÚNICA DE DADOS: reportModel.internalContext 🔥🔥🔥

Você DEVE usar EXCLUSIVAMENTE os dados de reportModel.internalContext. Este objeto contém:
- onboardingSteps: TODAS as 6 etapas do onboarding (step1_data a step6_data)
- produtosTenant: portfólio completo do tenant
- produtosConcorrentes: portfólio dos concorrentes com intensidade
- competitiva.overview: análise competitiva agregada
- competitiva.swot: análise SWOT já calculada
- competitiva.bcg: matriz BCG com dados reais
- competitiva.insights: insights de mercado já identificados
- icpMetadata: resumo textual do ICP

🚨🚨🚨 REGRAS CRÍTICAS E ABSOLUTAS - LEIA COM ATENÇÃO 🚨🚨🚨

⚠️⚠️⚠️ PROIBIDO ABSOLUTAMENTE - SE VOCÊ FIZER ISSO, O RELATÓRIO SERÁ REJEITADO E DELETADO ⚠️⚠️⚠️

❌ NUNCA, JAMAIS, SOB NENHUMA CIRCUNSTÂNCIA:
- Invente números de mercado (TAM, SAM, SOM, PIB, faturamento projetado, crescimento setorial, market share, R$ 10 bilhões, R$ 1,5 bilhão, etc.)
- Use exemplos genéricos hardcoded (GERDAU, EMBRAER, VALE, UNIMED, AMBEV, UNI LUVAS, KLABIN como exemplo fixo)
- Crie seções como "TAM/SAM/SOM", "Análise Macroeconômica", "Análise Macroeconômica e Setorial", "PIB e Inflação"
- Crie seções como "Top 5 Oportunidades", "Top 3 Riscos", "Plano de Ação", "Próximos Passos", "Recomendação Principal do CEO", "Quick Wins", "KPIs e Métricas"
- Crie seções como "Visão Geral da Empresa", "Principais Oportunidades Identificadas", "Principais Riscos Mapeados"
- Escreva "faltando concorrentes", "sem concorrentes mapeados", "apesar de não haver concorrentes" se internalContext.competitiva.overview ou internalContext.onboardingSteps tiver dados de concorrentes
- Use frases genéricas como "variações macroeconômicas", "inflação afetando poder de compra", "PIB brasileiro", "crescimento setorial", "segundo dados do IBGE"
- Assuma dados que não estão explicitamente no reportModel.internalContext
- Use estruturas antigas como "Curto Prazo (0-6 meses)", "Médio Prazo (6-18 meses)", "Longo Prazo (18-36 meses)" com "Responsável:", "Prazo:", "Investimento:"

✅✅✅ OBRIGATÓRIO - FAÇA ISSO OU O RELATÓRIO SERÁ REJEITADO ✅✅✅

✅ Use EXCLUSIVAMENTE dados de reportModel.internalContext (FONTE ÚNICA DE VERDADE)
✅ Se internalContext.competitiva.overview existir, USE os dados REAIS da análise competitiva
✅ Se internalContext.competitiva.swot existir, USE os dados REAIS da SWOT (strengths, weaknesses, opportunities, threats)
✅ Se internalContext.competitiva.bcg existir, USE os dados REAIS da matriz BCG (stars, cashCows, questionMarks, dogs)
✅ Se internalContext.competitiva.insights existir, USE os insights REAIS de mercado
✅ Se internalContext.produtosTenant existir, LISTE TODOS os produtos REAIS (nome, categoria, segmento, receita, margem)
✅ Se internalContext.produtosConcorrentes existir, LISTE produtos dos concorrentes REAIS com intensidade
✅ Se internalContext.onboardingSteps.step4_data.diferenciais existir, LISTE os diferenciais REAIS (não genéricos)
✅ Se internalContext.onboardingSteps.step5_data.clientesAtuais existir, LISTE clientes REAIS com dados completos
✅ Se internalContext.onboardingSteps.step4_data.concorrentesDiretos existir, LISTE TODOS os concorrentes REAIS
✅ Se um dado NÃO estiver em internalContext, OMITA completamente a seção (NÃO invente, NÃO use genéricos)
✅ A estrutura deve seguir EXATAMENTE o GOLDEN SAMPLE fornecido
✅ Tudo deve ser orientado a AÇÃO, VENDA, FIT e DECISÃO baseado em DADOS REAIS de internalContext
✅ Use os marcadores [SDR], [CLOSER], [GERENTE], [DIRETOR_CEO] para separar recomendações por papel

🔥🔥🔥 EXEMPLOS CONCRETOS DO QUE NÃO FAZER (REJEITADO AUTOMATICAMENTE) 🔥🔥🔥

❌ ERRADO: "TAM (Total Addressable Market): R$ 10 bilhões anuais" ou "SAM: R$ 1,5 bilhão" ou "SOM: R$ 150 milhões"
✅ CORRETO: OMITIR completamente esta seção. NÃO existe em internalContext. NÃO invente números de mercado.

❌ ERRADO: "Análise Macroeconômica e Setorial" ou "PIB e Inflação: O PIB do Brasil tem projeção de crescimento moderado"
✅ CORRETO: OMITIR completamente. NÃO existe em internalContext. NÃO invente dados macroeconômicos.

❌ ERRADO: "Top 5 Oportunidades" ou "Top 3 Riscos" ou "Plano de Ação (Próximos Passos)"
✅ CORRETO: Usar a estrutura do GOLDEN SAMPLE. NÃO use estruturas antigas como "Top 5", "Top 3", "Plano de Ação".

❌ ERRADO: "faltando concorrentes diretos listados" ou "apesar de não haver concorrentes mapeados"
✅ CORRETO: Se internalContext.onboardingSteps.step4_data.concorrentesDiretos existir, listar: "Concorrentes identificados: [Nome Real 1] (Setor: [setor real], Cidade: [cidade real], Estado: [estado real], Capital Social: R$ [valor real]), [Nome Real 2]..."

❌ ERRADO: "Variações macroeconômicas e inflação afetando o poder de compra" (genérico)
✅ CORRETO: Se internalContext.competitiva.insights.threats existir, usar os dados REAIS. Se não existir, OMITIR completamente.

❌ ERRADO: "A empresa se destaca pela customização" (genérico sem dados)
✅ CORRETO: Se internalContext.onboardingSteps.step4_data.diferenciais existir, listar: "Diferenciais competitivos: [Diferencial Real 1 do array], [Diferencial Real 2 do array]..."

❌ ERRADO: "Principais Riscos: Econômicos, Competitivos, Execução" (genérico)
✅ CORRETO: Se internalContext.competitiva.swot.threats existir, usar os dados REAIS. Se não existir, OMITIR completamente.

❌ ERRADO: "Visão Geral da Empresa e seu Posicionamento" ou "Recomendação Estratégica Principal"
✅ CORRETO: Usar a estrutura do GOLDEN SAMPLE. NÃO use títulos de estruturas antigas.

❌ ERRADO: "Curto Prazo (0-6 meses): Ações Imediatas: Fortalecer relacionamento..." com "Responsável:", "Prazo:", "Investimento:"
✅ CORRETO: Usar a estrutura do GOLDEN SAMPLE com marcadores [SDR], [CLOSER], [GERENTE], [DIRETOR_CEO]. NÃO use "Curto Prazo", "Médio Prazo", "Longo Prazo" com responsáveis e prazos.

❌ ERRADO: "KPIs e Métricas Sugeridas: Vendas: Volume de vendas por setor..."
✅ CORRETO: OMITIR completamente. NÃO existe em internalContext. NÃO invente KPIs.

❌ ERRADO: "Quick Wins Imediatos" ou "Decisões Críticas a Tomar"
✅ CORRETO: Usar a estrutura do GOLDEN SAMPLE. NÃO use "Quick Wins" ou "Decisões Críticas".

🧩 HIERARQUIAS (OBRIGATÓRIAS)

Todo relatório (Resumo e Completo) deve conter recomendações separadas por papel:

[SDR] → Geração de leads, listas, ICP, gatilhos de abordagem, scripts.
[CLOSER] → Argumentos de fechamento, objeções, ROI percebido, oportunidades quentes.
[GERENTE] → Diretrizes de pipeline, metas, indicadores, supervisão comercial.
[DIRETOR_CEO] → Tese estratégica, direcionamento de longo prazo, riscos, alocação de recursos.

Cada seção relevante deve conter blocos separados com esses marcadores, sempre.

🔒 REGRAS FINAIS (MANDATÓRIAS)

Nunca duplicar conteúdo entre Resumo e Completo (cada um tem propósito diferente).
Nunca usar exemplos ou dados fictícios.
Sempre manter a estrutura hierárquica.
Sempre produzir Markdown limpo, profissional e direto.
Sempre orientar para faturamento, crescimento e eficiência.

📦 ENTREGA FINAL DA LLM (JSON)

A resposta final sempre deve retornar:

{
  "executiveSummaryMarkdown": "...",
  "fullReportMarkdown": "..."
}`;


      // 8. Chamar OpenAI
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1, // 🔥 REDUZIDO para 0.1 - mais determinístico, menos criatividade/invenção
          response_format: { type: 'json_object' },
          max_tokens: 12000,
        }),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('[GENERATE-ICP-REPORT] ❌ Erro OpenAI:', errorText);
        await markAsFailed(`Erro ao chamar OpenAI: ${errorText}`);
        return new Response(
          JSON.stringify({ error: 'Erro ao chamar OpenAI', details: errorText, reportId }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const openaiData = await openaiResponse.json();
      const rawContent = openaiData.choices[0]?.message?.content || '{}';
      
      console.log('[GENERATE-ICP-REPORT] 📝 Resposta bruta da LLM (primeiros 500 chars):', rawContent.substring(0, 500));
      
      // 🔥 PARSER RIGOROSO MC9 V2.3 - Abortar se JSON inválido
      let parsed: any;
      try {
        parsed = JSON.parse(rawContent);
        console.log('[GENERATE-ICP-REPORT] ✅ JSON parseado com sucesso');
      } catch (err: any) {
        console.error('[GENERATE-ICP-REPORT] [LLM ERROR] JSON inválido. Conteúdo bruto:', rawContent.substring(0, 1000));
        await markAsFailed(`LLM retornou JSON inválido: ${err.message}`);
        return new Response(
          JSON.stringify({ error: 'LLM retornou JSON inválido. Abortado.', details: err.message, reportId }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 🔥 EXTRAÇÃO PRIMEIRO: Extrair campos antes de validar (validação flexível)
      const executiveSummary =
        parsed.executive_summary_markdown ||
        parsed.executiveSummaryMarkdown ||
        parsed.executiveSummary ||
        parsed.summary_markdown ||
        parsed.summaryMarkdown ||
        parsed.executive_summary ||
        parsed.summary ||
        parsed.resumo ||
        parsed.resumo_executivo ||
        parsed.resumoExecutivo ||
        '';

      const fullReport =
        parsed.full_report_markdown ||
        parsed.fullReportMarkdown ||
        parsed.fullReport ||
        parsed.full_markdown ||
        parsed.fullMarkdown ||
        parsed.full ||
        parsed.complete_report ||
        parsed.completeReport ||
        parsed.relatorio_completo ||
        parsed.relatorioCompleto ||
        parsed.completo ||
        '';

      // 🔥 VALIDAÇÃO CRÍTICA: Campos obrigatórios devem existir (após extração flexível)
      if (!executiveSummary || executiveSummary.trim().length < 200 || !fullReport || fullReport.trim().length < 1000) {
        console.error('[GENERATE-ICP-REPORT] [LLM ERROR] Campos não encontrados ou muito curtos:', {
          keys: Object.keys(parsed),
          executiveSummaryLength: executiveSummary?.length || 0,
          fullReportLength: fullReport?.length || 0,
          executiveSummaryPreview: executiveSummary?.substring(0, 200) || 'VAZIO',
          fullReportPreview: fullReport?.substring(0, 200) || 'VAZIO',
          parsedKeys: Object.keys(parsed),
          parsedValues: Object.keys(parsed).reduce((acc, key) => {
            const val = (parsed as any)[key];
            acc[key] = typeof val === 'string' ? val.substring(0, 100) : typeof val;
            return acc;
          }, {} as any),
        });
        await markAsFailed(`LLM não retornou campos válidos (exec: ${executiveSummary?.length || 0}, full: ${fullReport?.length || 0})`);
        return new Response(
          JSON.stringify({ 
            error: 'LLM não retornou os campos obrigatórios válidos.', 
            executiveSummaryLength: executiveSummary?.length || 0,
            fullReportLength: fullReport?.length || 0,
            reportId 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 🔥 LOG CRÍTICO: Verificar o que a LLM retornou
      console.log('[GENERATE-ICP-REPORT] 🔥🔥🔥 RESPOSTA DA LLM (PRIMEIROS 2000 CHARS):', rawContent.substring(0, 2000));
      console.log('[GENERATE-ICP-REPORT] 🔥🔥🔥 CHAVES DO JSON PARSED:', Object.keys(parsed));
      console.log('[GENERATE-ICP-REPORT] 🔥🔥🔥 VALORES DAS CHAVES:', {
        hasFullReportMarkdown: !!parsed.fullReportMarkdown,
        hasExecutiveSummaryMarkdown: !!parsed.executiveSummaryMarkdown,
        hasFull_report_markdown: !!parsed.full_report_markdown,
        hasExecutive_summary_markdown: !!parsed.executive_summary_markdown,
        allKeys: Object.keys(parsed),
        allValues: Object.keys(parsed).reduce((acc, key) => {
          const val = (parsed as any)[key];
          if (typeof val === 'string') {
            acc[key] = `${val.length} chars: ${val.substring(0, 100)}`;
          } else {
            acc[key] = typeof val;
          }
          return acc;
        }, {} as any),
      });

      console.log('[GENERATE-ICP-REPORT] 🔥🔥🔥 EXTRAÇÃO DE CAMPOS:', {
        executiveSummaryLength: executiveSummary.length,
        executiveSummaryPreview: executiveSummary.substring(0, 200),
        fullReportLength: fullReport.length,
        fullReportPreview: fullReport.substring(0, 200),
        executiveSummarySource: 
          parsed.executive_summary_markdown ? 'executive_summary_markdown' :
          parsed.executiveSummaryMarkdown ? 'executiveSummaryMarkdown' :
          parsed.summary_markdown ? 'summary_markdown' :
          parsed.summary ? 'summary' : 'NENHUM',
        fullReportSource:
          parsed.full_report_markdown ? 'full_report_markdown' :
          parsed.fullReportMarkdown ? 'fullReportMarkdown' :
          parsed.full_markdown ? 'full_markdown' :
          parsed.full ? 'full' : 'NENHUM',
      });
      
      // 🔥 VALIDAÇÃO ANTI-GENÉRICO: Detectar e REJEITAR conteúdo proibido (LISTA EXPANDIDA)
      // Normalizar texto removendo acentos para melhor detecção
      const normalizeText = (text: string) => {
        if (!text || typeof text !== 'string') return '';
        return text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[^\w\s]/g, ' '); // Remove pontuação
      };
      
      const fullReportText = normalizeText(fullReport);
      const summaryText = normalizeText(executiveSummary);
      const combinedText = fullReportText + ' ' + summaryText;
      
      // 🔥 WHITELIST UNIVERSAL: Extrai TODOS os termos legítimos dos dados reais do tenant
      // ⚠️ 100% DINÂMICO - NENHUM hardcode - Funciona para QUALQUER tenant/setor
      const buildWhitelist = (reportModel: any): string[] => {
        const whitelist: string[] = [];
        
        // Função auxiliar para extrair palavras de um texto
        const extractWords = (text: string): string[] => {
          if (!text || typeof text !== 'string') return [];
          const normalized = normalizeText(text);
          // Dividir em palavras (mínimo 3 caracteres para evitar ruído)
          return normalized.split(/\s+/).filter(w => w.length >= 3);
        };
        
        // Função auxiliar para adicionar termos de um objeto/array recursivamente
        const addTermsFromValue = (value: any): void => {
          if (!value) return;
          
          if (typeof value === 'string') {
            const words = extractWords(value);
            whitelist.push(...words);
            // Também adicionar a string completa normalizada
            whitelist.push(normalizeText(value));
          } else if (Array.isArray(value)) {
            value.forEach(item => addTermsFromValue(item));
          } else if (typeof value === 'object') {
            Object.values(value).forEach(v => addTermsFromValue(v));
          }
        };
        
        // 1. Dados da empresa tenant (qualquer campo)
        if (reportModel.tenantCompany) {
          addTermsFromValue(reportModel.tenantCompany);
        }
        
        // 2. Dados do onboarding (qualquer campo)
        if (reportModel.onboardingData) {
          addTermsFromValue(reportModel.onboardingData);
        }
        
        // 3. Dados do ICP profile
        if (reportModel.icpProfile) {
          addTermsFromValue(reportModel.icpProfile);
        }
        
        // 4. Clientes reais (qualquer campo)
        if (reportModel.clientBCGData?.clientes) {
          reportModel.clientBCGData.clientes.forEach((cliente: any) => {
            addTermsFromValue(cliente);
          });
        }
        
        // 5. Concorrentes reais (qualquer campo)
        if (reportModel.competitiveAnalysis?.competitors) {
          reportModel.competitiveAnalysis.competitors.forEach((comp: any) => {
            addTermsFromValue(comp);
          });
        }
        
        // 6. Produtos do tenant (qualquer campo)
        if (reportModel.productHeatmap?.tenantProducts) {
          reportModel.productHeatmap.tenantProducts.forEach((prod: any) => {
            addTermsFromValue(prod);
          });
        }
        
        // 7. Produtos de concorrentes (qualquer campo)
        if (reportModel.productHeatmap?.competitorProducts) {
          reportModel.productHeatmap.competitorProducts.forEach((prod: any) => {
            addTermsFromValue(prod);
          });
        }
        
        // 8. Dados de SWOT, BCG, Market Insights (qualquer campo)
        if (reportModel.internalContext) {
          addTermsFromValue(reportModel.internalContext);
        }
        
        // Remover duplicatas e strings vazias
        return whitelist
          .filter((t, i, arr) => arr.indexOf(t) === i) // Remover duplicatas
          .filter(t => t.length >= 2); // Remover strings muito curtas
      };
      
      const whitelist = buildWhitelist(reportModel);
      console.log('[GENERATE-ICP-REPORT] ✅ WHITELIST criada:', {
        whitelistCount: whitelist.length,
        whitelistSample: whitelist.slice(0, 20),
      });
      
      // 🔥 LOG CRÍTICO: Verificar o que está sendo validado
      console.log('[GENERATE-ICP-REPORT] 🔥🔥🔥 VALIDAÇÃO - Texto sendo validado:', {
        fullReportLength: fullReport.length,
        executiveSummaryLength: executiveSummary.length,
        combinedTextLength: combinedText.length,
        fullReportSample: fullReport.substring(0, 500),
        executiveSummarySample: executiveSummary.substring(0, 500),
        combinedTextSample: combinedText.substring(0, 1000),
      });
      
      // 🔥🔥🔥 LISTA COMPLETA DE FRASES PROIBIDAS (TUDO que o usuário pediu para remover)
      // ⚠️ NOTA: Termos que estão na whitelist serão IGNORADOS mesmo se estiverem aqui
      const forbiddenPhrases = [
        // TAM/SAM/SOM
        'tam/sam/som',
        'tam (total',
        'sam (serviceable',
        'som (serviceable',
        'total addressable market',
        'serviceable addressable market',
        'serviceable obtainable market',
        'tam:',
        'sam:',
        'som:',
        'mercado total',
        'mercado endereçável',
        'mercado obtível',
        // Análise Macroeconômica
        'análise macroeconômica',
        'análise macroeconômica e setorial',
        'pib brasileiro',
        'pib do brasil',
        'crescimento setorial',
        'projeção de crescimento',
        'projeções de crescimento',
        'variações macroeconômicas',
        'inflação afetando',
        'inflação e',
        'inflação continua',
        'inflação sendo',
        'segundo dados do ibge',
        'dados do ibge',
        // Estruturas antigas
        'top 5 oportunidades',
        'top 3 riscos',
        'top 3',
        'top 5',
        'plano de ação',
        'próximos passos',
        'recomendação principal do ceo',
        'recomendação principal',
        'quick wins',
        'decisões críticas',
        'kpis e métricas',
        'visão geral da empresa',
        'principais oportunidades identificadas',
        'principais riscos mapeados',
        'riscos mapeados',
        'riscos econômicos',
        'riscos competitivos',
        'riscos de execução',
        'riscos de mercado',
        // Concorrentes
        'faltando concorrentes',
        'sem concorrentes mapeados',
        'sem concorrentes diretos listados',
        'faltando concorrentes diretos',
        'nenhum concorrente',
        'não há concorrentes',
        'não existem concorrentes',
        'apesar de não haver concorrentes',
        'apesar de nenhum concorrente',
        // Números inventados
        'r$ 10 bilhões',
        'r$ 1,5 bilhão',
        'r$ 500 milhões',
        'r$ 50 milhões',
        'r$ 150 milhões',
        'estimado em cerca de',
        'estimado em',
        'estimados em',
        'projetado em',
        'projeção de',
        'cerca de r$',
        // ⚠️ REMOVIDO: Exemplos hardcoded de empresas específicas
        // Esses termos serão cobertos pela whitelist dinâmica baseada nos dados reais do tenant
        // Outros genéricos
        'curto prazo (0-6 meses)',
        'médio prazo (6-18 meses)',
        'longo prazo (18-36 meses)',
        'responsável:',
        'prazo:',
        'investimento:',
        // Estruturas antigas específicas do relatório
        'visão geral da empresa e seu posicionamento',
        'visão geral da empresa',
        'principais oportunidades identificadas',
        'principais riscos mapeados',
        'recomendação estratégica principal',
        'perfil ideal consolidado',
        'características dos melhores clientes',
        'padrões identificados',
        'score de fit ideal',
        'posicionamento vs concorrentes mapeados',
        'gaps de mercado não atendidos',
        'vantagens competitivas sustentáveis',
        'ameaças competitivas',
        'riscos de mercado',
        'análise estatística dos clientes',
        'ticket médio e ciclo de venda',
        'padrões de compra',
        'tendências e projeções',
        'novas tecnologias',
        'transformações setoriais',
        'análise macroeconômica e setorial',
        'pib e inflação',
        'barreiras de entrada',
        'moderadas para empresas',
        '4% ao ano',
        'segundo dados',
        'dados do ibge',
        'projeções de',
        'projeção de crescimento',
        'crescimento impulsionado',
        'demanda por',
        'mercado de',
        'mercado total',
        'mercado endereçável',
        'mercado obtível',
        'r$ 10 bilhões anuais',
        'r$ 1,5 bilhão',
        'r$ 150 milhões',
        'representando 10%',
        'focando em contratos',
        'r$ 50.000.000',
        'r$ 1.000.000.000',
        'r$ 45.000',
        'r$ 325.000',
        'entre 30 e 120 dias',
        '30 e 120 dias',
        'cerca de 4%',
        '4% ao ano',
        // ⚠️ REMOVIDO: Termos hardcoded específicos (empresas, materiais, cidades, regiões, setores, produtos, portes)
        // Esses termos serão cobertos pela whitelist dinâmica baseada nos dados reais do tenant
        'sensores de monitoramento',
        'rede de distribuidores',
        'fornecedores de matéria-prima',
        'universidades para p&d',
        'programa de capacitação',
        'equipe de vendas',
        'crm para otimizar',
        'implementar crm',
        'desenvolvimento de rede',
        'parcerias com universidades',
        'alianças com fornecedores',
        'criar rede de distribuidores',
        'desenvolvimento de epis',
        'novos produtos lançados',
        'taxa de retenção',
        'satisfação',
        'eficiência de produção',
        'controle de qualidade',
        'volume de vendas',
        'por setor e região',
        'número de novos produtos',
        'novos produtos lançados',
        'eficiência de produção',
        'controle de qualidade',
        'volume de vendas por setor',
        'taxa de retenção de clientes',
        'satisfação',
        'eficiencia de produção',
        'controle de qualidade',
        'novos produtos lançados',
        'número de novos produtos',
        'inovação: número',
        'produção: eficiência',
        'clientes: taxa',
        'vendas: volume',
        'kpis e métricas sugeridas',
        'vendas: volume de vendas',
        'clientes: taxa de retenção',
        'produção: eficiência',
        'inovação: número de',
        'plano de ação (próximos passos)',
        'implementar crm: responsável',
        'expandir portfólio: responsável',
        'parcerias com universidades: responsável',
        'desenvolvimento de rede: responsável',
        'programa de capacitação: responsável',
        'quick wins imediatos',
        'melhorar a eficiência',
        'fortalecer o relacionamento',
        'decisões críticas a tomar',
        'avaliar a capacidade',
        'analisar a viabilidade',
        'internacionalização no longo prazo',
        'focando inicialmente na',
        'este relatório visa',
        'proporcionar uma visão',
        'maximizando seu potencial',
        'mitigando riscos',
        'relatório gerado por',
        'análise de ceo',
        'estratégico de mercado',
        'subsidiar decisões estratégicas',
        'orientando sua expansão',
        'mitigação de riscos',
        'mercado competitivo',
        'em evolução',
        'mercado de epis',
        'altamente competitivo',
        'sujeito a pressões',
        'pressões de preço',
        'grandes fabricantes',
        'produtos similares',
        'diferenciação através',
        'customização e tecnologia',
        'personalização para pcds',
        'consultoria técnica especializada',
        'áreas ainda pouco exploradas',
        // ⚠️ REMOVIDO: 'tecnologia avançada em materiais', 'atendimento consultivo' - podem ser diferenciais reais
        'entrada de concorrentes',
        'capacidade de produção',
        'preços competitivos',
        'volatilidade econômica',
        'impacto da inflação',
        'flutuações no câmbio',
        'custos de produção',
        'mudanças regulatórias',
        'novas normas de segurança',
        'alterar requisitos',
        'dependência de grandes contratos',
        'concentração em poucos clientes',
        'risco financeiro',
        'perda de contratos',
        'inovação de concorrentes',
        'tecnologia em epis',
        'rápida evolução',
        'constante atualização',
        'desafios em manter',
        'aumento da demanda',
        'ações imediatas',
        'fortalecer o relacionamento',
        'clientes existentes',
        'explorar upselling',
        // ⚠️ REMOVIDO: 'produtos customizados' - pode ser um diferencial real do tenant
        'processo comercial',
        'implementar crm',
        'otimizar o ciclo',
        'oportunidades no pipeline',
        'focar em contratos',
        'empresas de benchmarking',
        'novos nichos',
        'expandir para setores',
        // ⚠️ REMOVIDO: Setores/regiões específicos - serão cobertos pela whitelist dinâmica
        'desenvolvimento de canais',
        'criar rede',
        // ⚠️ REMOVIDO: 'distribuidores no sudeste' - região específica
        'parcerias estratégicas',
        'alianças com fornecedores',
        'matéria-prima para inovação',
        'novos mercados/regiões',
        'explorar oportunidades',
        // ⚠️ REMOVIDO: Regiões específicas - serão cobertas pela whitelist dinâmica
        'novos produtos/serviços',
        // ⚠️ REMOVIDO: 'desenvolvimento de epis' - produto específico
        'sensores de monitoramento',
        'internacionalização',
        'avaliar mercados',
        // ⚠️ REMOVIDO: 'américa latina' - região específica
        'consolidar a presença',
        'através de parcerias',
        'inovação em produtos',
        // ⚠️ REMOVIDO: 'produtos customizados' - pode ser um diferencial real
        'melhorar a eficiência',
        'ciclo de vendas',
        'através de crm',
        'fortalecer o relacionamento',
        'base atual',
        'avaliar a capacidade',
        'produção e investimento',
        'necessário para escalar',
        'analisar a viabilidade',
        'internacionalização',
        'longo prazo',
        'focando inicialmente',
        'américa latina',
        'relatório gerado por',
        'stratevo intelligence',
        'análise de ceo',
        'estratégico de mercado',
        'visa proporcionar',
        'visão clara',
        'estratégica para',
        'maximizando seu potencial',
        'crescimento e mitigando',
        'riscos no mercado',
        'subsidiar decisões',
        'estratégicas para',
        'orientando sua expansão',
        'mitigação de riscos',
        'mercado competitivo',
        'em evolução',
        // Frases específicas do relatório atual
        'tam, sam e som estimados',
        'tam sam e som estimados',
        'tam sam som estimados',
        'top 10 ações prioritárias',
        'top 10 acoes prioritarias',
        'responsáveis sugeridos',
        'responsaveis sugeridos',
        'prazos recomendados',
        'investimento estimado',
        'investimento:',
        'r$ 300.000',
        'r$ 800.000',
        'r$ 1.500.000',
        'r$ 12 bilhões',
        'r$ 3 bilhões',
        'r$ 90 a r$ 150 milhões',
        'r$ 90 a r$ 150 milhoes',
        '3-5% do sam',
        '3 a 5% do sam',
        'aproximadamente r$',
        'estimado em aproximadamente',
        'baseados em dados de mercado',
        'projeções de crescimento setorial',
        'análise setorial detalhada',
        'analise setorial detalhada',
        'tamanho do mercado',
        'estimado em r$ 10 bilhões',
        'r$ 10 bilhões para epis',
        'cadeia de valor',
        'players multinacionais',
        'potencial de mercado',
        'grande número de empresas',
        'análise de cnaes',
        'analise de cnaes',
        'oportunidades não exploradas',
        'oportunidades nao exploradas',
        'análise competitiva profunda',
        'analise competitiva profunda',
        'necessidade de ajuste competitivo',
        'integração de iot',
        'integração de iot e materiais',
        'materiais inteligentes em epis',
        'oportunidades emergentes',
        'espera-se um aumento',
        'aumento de 10% ao ano',
        'roi estimado em 15%',
        'roi estimado',
        '15% no primeiro ano',
        'projeção de crescimento de 2,5%',
        '2,5% ao ano',
        'crescimento de 2,5%',
        'indústria manufatureira',
        'industria manufatureira',
        'digitalização e automação',
        'aumentando a demanda',
        'dashboard sugerido',
        'monitoramento semanal',
        'feedback trimestral',
        'número de novos produtos desenvolvidos',
        'numero de novos produtos desenvolvidos',
        'matriz de probabilidade x impacto',
        'matriz de probabilidade',
        'alta probabilidade/alto impacto',
        'média probabilidade/alto impacto',
        'métricas de sucesso por horizonte temporal',
        'metricas de sucesso',
        'horizonte temporal',
        'crescimento em vendas',
        'novos contratos em nichos',
        'presença em novos mercados',
        // ⚠️ REMOVIDO: 'nacionais' - palavra comum e legítima que pode aparecer em contextos válidos
        // Frases específicas do relatório atual do usuário
        'tam sam e som estimados',
        'tam sam som estimados',
        'top 5 oportunidades',
        'top 3 riscos',
        'análise macroeconômica',
        'analise macroeconomica',
        'pib e setores alvo',
        'projeção de crescimento de 2,5%',
        '2,5% ao ano',
        'tamanho do mercado estimado em r$ 10 bilhões',
        // ⚠️ REMOVIDO: 'r$ 10 bilhões para epis' - produto específico que será coberto pela whitelist
        'análise setorial detalhada',
        'analise setorial detalhada',
        'análise de cnaes',
        'analise de cnaes',
        'análise estatística dos clientes',
        'analise estatistica dos clientes',
        'análise competitiva profunda',
        'analise competitiva profunda',
        'tendências e projeções',
        'tendencias e projecoes',
        'previsões e recomendações',
        'previsoes e recomendacoes',
        'espera-se um aumento de 10%',
        'aumento de 10% ao ano',
        'roi estimado em 15%',
        '15% no primeiro ano',
        'sem concorrentes cadastrados',
        'sem concorrentes',
        'não há concorrentes',
        // ⚠️ REMOVIDO: 'kevlar', 'nomex' - materiais específicos que podem ser diferenciais reais
        'r$ 150.000',
        'r$ 15.000.000',
        'r$ 1.000.000.000',
        'capital social de r$',
        // ⚠️ REMOVIDO: 'ativa desde 2013' - data específica que pode ser real
        // ⚠️ REMOVIDO: 'mogi das cruzes' - cidade específica que será coberta pela whitelist
        // ⚠️ REMOVIDO: 'região sudeste do brasil' - região específica que será coberta pela whitelist
      ];
      
      // Normalizar frases proibidas também
      const normalizedForbiddenPhrases = forbiddenPhrases.map(phrase => normalizeText(phrase));
      
      // 🔥 VALIDAÇÃO MAIS RIGOROSA: Verificar cada frase individualmente, IGNORANDO whitelist
      const foundForbidden: string[] = [];
      for (const phrase of normalizedForbiddenPhrases) {
        // 🔥 IGNORAR se a frase está na whitelist (é um dado real)
        const isWhitelisted = whitelist.some(w => phrase.includes(w) || w.includes(phrase));
        if (isWhitelisted) {
          continue; // Pular esta frase - é legítima
        }
        
        if (combinedText.includes(phrase)) {
          foundForbidden.push(phrase);
        }
      }
      
      console.log('[GENERATE-ICP-REPORT] 🔍 VALIDAÇÃO: Verificando conteúdo proibido...', {
        combinedTextLength: combinedText.length,
        forbiddenPhrasesCount: normalizedForbiddenPhrases.length,
        whitelistCount: whitelist.length,
        foundForbiddenCount: foundForbidden.length,
        foundForbidden: foundForbidden.slice(0, 20), // Primeiras 20 encontradas
        combinedTextSample: combinedText.substring(0, 500), // Amostra do texto para debug
      });
      if (foundForbidden.length > 0) {
        console.error('[GENERATE-ICP-REPORT] [LLM ERROR] ❌❌❌ CONTEÚDO PROIBIDO DETECTADO:', foundForbidden);
        console.error('[GENERATE-ICP-REPORT] [LLM ERROR] Trecho do relatório (primeiros 2000 chars):', combinedText.substring(0, 2000));
        console.error('[GENERATE-ICP-REPORT] [LLM ERROR] Total de frases proibidas encontradas:', foundForbidden.length);
        await markAsFailed(`LLM gerou conteúdo proibido: ${foundForbidden.slice(0, 5).join(', ')} (e mais ${foundForbidden.length - 5})`);
        return new Response(
          JSON.stringify({ 
            error: 'LLM gerou conteúdo proibido. Relatório REJEITADO automaticamente.', 
            forbiddenPhrases: foundForbidden.slice(0, 10),
            totalFound: foundForbidden.length,
            reportId 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }


      console.log('[GENERATE-ICP-REPORT] ✅ Artefatos gerados (MC9 V5):', {
        hasSummary: !!executiveSummary,
        summaryLength: executiveSummary.length,
        summaryPreview: executiveSummary.substring(0, 200),
        hasFullReport: !!fullReport,
        fullReportLength: fullReport.length,
        fullReportPreview: fullReport.substring(0, 200),
        parsedKeys: Object.keys(parsed), // Debug: ver quais chaves a IA retornou
      });

      // 🔥 VALIDAÇÃO CRÍTICA: Abortar se campos estiverem vazios ou muito curtos
      const executiveSummaryTrimmed = executiveSummary?.trim() || '';
      const fullReportTrimmed = fullReport?.trim() || '';

      if (!executiveSummaryTrimmed || executiveSummaryTrimmed.length < 200) {
        console.error('[GENERATE-ICP-REPORT] ❌ ERRO CRÍTICO: executiveSummaryMarkdown está VAZIO ou muito curto!', {
          length: executiveSummaryTrimmed.length,
          preview: executiveSummaryTrimmed.substring(0, 100),
        });
        await markAsFailed(`executiveSummaryMarkdown está vazio ou muito curto (${executiveSummaryTrimmed.length} chars, mínimo 200)`);
        return new Response(
          JSON.stringify({ 
            error: 'executiveSummaryMarkdown está vazio ou muito curto. Abortado.', 
            length: executiveSummaryTrimmed.length,
            minimum: 200,
            reportId 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!fullReportTrimmed || fullReportTrimmed.length < 1000) {
        console.error('[GENERATE-ICP-REPORT] ❌ ERRO CRÍTICO: fullReportMarkdown está VAZIO ou muito curto!', {
          length: fullReportTrimmed.length,
          preview: fullReportTrimmed.substring(0, 100),
        });
        await markAsFailed(`fullReportMarkdown está vazio ou muito curto (${fullReportTrimmed.length} chars, mínimo 1000)`);
        return new Response(
          JSON.stringify({ 
            error: 'fullReportMarkdown está vazio ou muito curto. Abortado.', 
            length: fullReportTrimmed.length,
            minimum: 1000,
            reportId 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 🔥 VALIDAÇÃO: Garantir que o conteúdo não é apenas placeholders
      const hasRealContent = 
        !fullReportTrimmed.toLowerCase().includes('dados não disponíveis') ||
        fullReportTrimmed.length > 2000; // Se tiver mais de 2000 chars, provavelmente tem conteúdo real

      if (!hasRealContent && fullReportTrimmed.length < 2000) {
        console.error('[GENERATE-ICP-REPORT] ❌ ERRO: Relatório parece conter apenas placeholders');
        await markAsFailed('Relatório contém apenas placeholders ou conteúdo genérico');
        return new Response(
          JSON.stringify({ 
            error: 'Relatório contém apenas placeholders. Abortado.', 
            reportId 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await updateProgress(80, 'Salvando relatório no banco...');

      // 🔒 PROTEGIDO: NÃO ALTERAR SEM AUTORIZAÇÃO
      // MC9-V2.4: Montar relatório completo - UNIVERSAL (serve para qualquer empresa)
      // 🔥 CAMPOS PRIMÁRIOS: executiveSummaryMarkdown e fullReportMarkdown (sempre presentes e validados)
      // ⚠️ NÃO incluir reportModel aqui - pode causar problemas de tamanho e não é necessário no banco
      
      // 🔥 CONSTRUIR reportData COM OS CAMPOS NOVOS PRIMEIRO (garantir que sejam salvos)
      // Usar versões trimmed e validadas
      const reportData: any = {};
      
      // PRIMEIRO: Campos novos (prioridade máxima) - usar versões validadas
      reportData.executiveSummaryMarkdown = executiveSummaryTrimmed;
      reportData.fullReportMarkdown = fullReportTrimmed;
      
      // SEGUNDO: Metadados básicos
      reportData.icp_metadata = metadata;
      reportData.onboarding_data = onboardingData;
      
      // TERCEIRO: Campo legado (para compatibilidade retroativa apenas - NÃO usar como fonte principal)
      reportData.analysis = report_type === 'completo' ? fullReportTrimmed : executiveSummaryTrimmed;
      
      // QUARTO: Outros campos
      reportData.generated_at = new Date().toISOString();
      reportData.type = report_type;
      reportData.tenant = tenant ? { nome: tenant.nome, cnpj: tenant.cnpj } : null;
      
      // QUINTO: Campo opcional de Match & Fit
      if (icpMatchFitOverview) {
        reportData.icpMatchFitOverview = icpMatchFitOverview;
      }
      
      // 🔥 VALIDAÇÃO: Garantir que os campos novos estão presentes
      if (!reportData.executiveSummaryMarkdown || !reportData.fullReportMarkdown) {
        console.error('[GENERATE-ICP-REPORT] ❌ ERRO: Campos novos não foram atribuídos!', {
          hasExecutiveSummary: !!reportData.executiveSummaryMarkdown,
          hasFullReport: !!reportData.fullReportMarkdown,
        });
        await markAsFailed('Campos novos não foram atribuídos corretamente');
        throw new Error('Campos novos não foram atribuídos corretamente');
      }

      // MC9-V2.4: Log final dos artefatos antes de salvar (usar versões validadas)
      console.log('[GENERATE-ICP-REPORT] FINAL_ARTIFACTS', {
        hasFullReport: !!fullReportTrimmed,
        fullReportLength: fullReportTrimmed.length,
        hasExecSummary: !!executiveSummaryTrimmed,
        execSummaryLength: executiveSummaryTrimmed.length,
        fullReportPreview: fullReportTrimmed.substring(0, 200),
        execSummaryPreview: executiveSummaryTrimmed.substring(0, 200),
      });

      console.log('[GENERATE-ICP-REPORT] 💾 Salvando relatório no banco:', {
        reportId,
        report_type,
        hasExecutiveSummary: !!reportData.executiveSummaryMarkdown,
        executiveSummaryLength: reportData.executiveSummaryMarkdown.length,
        hasFullReport: !!reportData.fullReportMarkdown,
        fullReportLength: reportData.fullReportMarkdown.length,
        reportDataKeys: Object.keys(reportData),
      });

      // 🔒 PROTEGIDO: NÃO ALTERAR SEM AUTORIZAÇÃO
      // 9. 🔥 ENTERPRISE PATTERN: Atualizar registro existente (não criar novo)
      // Isso garante atomicidade e rastreabilidade
      
      // Log do tamanho do JSON antes de salvar
      const reportDataJson = JSON.stringify(reportData);
      console.log('[GENERATE-ICP-REPORT] 📦 Tamanho do reportData antes de salvar:', {
        jsonSize: reportDataJson.length,
        executiveSummarySize: reportData.executiveSummaryMarkdown.length,
        fullReportSize: reportData.fullReportMarkdown.length,
        reportDataKeys: Object.keys(reportData),
      });
      
      // 🔥 SALVAR DIRETAMENTE NAS COLUNAS NOVAS (snake_case) + report_data (para compatibilidade)
      console.log('[GENERATE-ICP-REPORT] 💾 Salvando nas colunas novas (versões validadas):', {
        reportId,
        fullReportLength: fullReportTrimmed.length,
        executiveSummaryLength: executiveSummaryTrimmed.length,
        fullReportPreview: fullReportTrimmed.substring(0, 100),
        executiveSummaryPreview: executiveSummaryTrimmed.substring(0, 100),
        validationPassed: true,
      });
      
      // 🔥 ENTERPRISE PATTERN: UPDATE ao invés de INSERT (já criamos o registro antes)
      // Usar versões trimmed e validadas
      const updatePayload = {
        // 🔥 COLUNAS NOVAS (snake_case - direto no banco) - usar versões validadas
        full_report_markdown: fullReportTrimmed,
        executive_summary_markdown: executiveSummaryTrimmed,
        // report_data (para compatibilidade retroativa)
        report_data: reportData,
        status: 'completed',
        updated_at: new Date().toISOString(),
      };

      console.log('[GENERATE-ICP-REPORT] 💾 Salvando relatório no banco:', {
        reportId,
        fullReportLength: updatePayload.full_report_markdown.length,
        executiveSummaryLength: updatePayload.executive_summary_markdown.length,
        fullReportPreview: updatePayload.full_report_markdown.substring(0, 100),
        executiveSummaryPreview: updatePayload.executive_summary_markdown.substring(0, 100),
        status: updatePayload.status,
      });

      // 🔥🔥🔥 LOG CRÍTICO: Verificar payload antes de salvar
      console.log('[GENERATE-ICP-REPORT] 🔥🔥🔥 PAYLOAD ANTES DO UPDATE:', {
        reportId,
        updatePayloadKeys: Object.keys(updatePayload),
        fullReportLength: updatePayload.full_report_markdown?.length || 0,
        executiveSummaryLength: updatePayload.executive_summary_markdown?.length || 0,
        fullReportPreview: updatePayload.full_report_markdown?.substring(0, 200) || 'VAZIO',
        executiveSummaryPreview: updatePayload.executive_summary_markdown?.substring(0, 200) || 'VAZIO',
        fullReportType: typeof updatePayload.full_report_markdown,
        executiveSummaryType: typeof updatePayload.executive_summary_markdown,
      });

      const { data: report, error: reportError } = await supabase
        .from('icp_reports')
        .update(updatePayload)
        .eq('id', reportId)
        .select('id, full_report_markdown, executive_summary_markdown, report_data, status, updated_at') // 🔥 Selecionar colunas novas explicitamente
        .single();

      // 🔥🔥🔥 LOG CRÍTICO: Verificar resposta do UPDATE
      console.log('[GENERATE-ICP-REPORT] 🔥🔥🔥 RESPOSTA DO UPDATE:', {
        hasError: !!reportError,
        errorMessage: reportError?.message,
        hasData: !!report,
        reportId: report?.id,
        hasFullReportColumn: !!(report as any)?.full_report_markdown,
        fullReportColumnLength: (report as any)?.full_report_markdown?.length || 0,
        hasExecutiveSummaryColumn: !!(report as any)?.executive_summary_markdown,
        executiveSummaryColumnLength: (report as any)?.executive_summary_markdown?.length || 0,
        reportKeys: report ? Object.keys(report) : [],
      });

      if (reportError) {
        console.error('[GENERATE-ICP-REPORT] ❌ Erro ao salvar:', reportError);
        console.error('[GENERATE-ICP-REPORT] ❌ Detalhes do erro:', {
          message: reportError.message,
          details: reportError.details,
          hint: reportError.hint,
          code: reportError.code,
        });
        console.error('[GENERATE-ICP-REPORT] ❌ Payload que tentou salvar:', {
          fullReportLength: updatePayload.full_report_markdown?.length || 0,
          executiveSummaryLength: updatePayload.executive_summary_markdown?.length || 0,
        });
        await markAsFailed(`Erro ao salvar: ${reportError.message}`);
        return new Response(
          JSON.stringify({ error: 'Erro ao salvar relatório', details: reportError.message, reportId }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 🔥🔥🔥 VALIDAÇÃO CRÍTICA: Verificar se as colunas foram realmente salvas
      if (!report) {
        console.error('[GENERATE-ICP-REPORT] ❌❌❌ ERRO CRÍTICO: UPDATE retornou null!');
        await markAsFailed('UPDATE retornou null - relatório não foi salvo');
        return new Response(
          JSON.stringify({ error: 'UPDATE retornou null', reportId }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const savedFullReport = (report as any)?.full_report_markdown;
      const savedExecutiveSummary = (report as any)?.executive_summary_markdown;

      if (!savedFullReport || savedFullReport.length < 1000) {
        console.error('[GENERATE-ICP-REPORT] ❌❌❌ ERRO CRÍTICO: full_report_markdown NÃO foi salvo corretamente!', {
          hasValue: !!savedFullReport,
          length: savedFullReport?.length || 0,
          expectedLength: fullReportTrimmed.length,
        });
        await markAsFailed(`full_report_markdown não foi salvo (length: ${savedFullReport?.length || 0})`);
        return new Response(
          JSON.stringify({ error: 'full_report_markdown não foi salvo corretamente', reportId }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!savedExecutiveSummary || savedExecutiveSummary.length < 200) {
        console.error('[GENERATE-ICP-REPORT] ❌❌❌ ERRO CRÍTICO: executive_summary_markdown NÃO foi salvo corretamente!', {
          hasValue: !!savedExecutiveSummary,
          length: savedExecutiveSummary?.length || 0,
          expectedLength: executiveSummaryTrimmed.length,
        });
        await markAsFailed(`executive_summary_markdown não foi salvo (length: ${savedExecutiveSummary?.length || 0})`);
        return new Response(
          JSON.stringify({ error: 'executive_summary_markdown não foi salvo corretamente', reportId }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[GENERATE-ICP-REPORT] ✅✅✅ VALIDAÇÃO PASSOU: Campos foram salvos corretamente!', {
        fullReportLength: savedFullReport.length,
        executiveSummaryLength: savedExecutiveSummary.length,
        fullReportPreview: savedFullReport.substring(0, 200),
        executiveSummaryPreview: savedExecutiveSummary.substring(0, 200),
      });

      // 🔥🔥🔥 VERIFICAÇÃO FINAL: Buscar o relatório novamente para confirmar
      const { data: verifyReport, error: verifyError } = await supabase
        .from('icp_reports')
        .select('id, full_report_markdown, executive_summary_markdown')
        .eq('id', reportId)
        .single();

      if (verifyError) {
        console.error('[GENERATE-ICP-REPORT] ❌❌❌ ERRO ao verificar relatório salvo:', verifyError);
      } else {
        console.log('[GENERATE-ICP-REPORT] ✅✅✅ VERIFICAÇÃO FINAL - Relatório confirmado no banco:', {
          reportId: verifyReport?.id,
          hasFullReport: !!(verifyReport as any)?.full_report_markdown,
          fullReportLength: (verifyReport as any)?.full_report_markdown?.length || 0,
          hasExecutiveSummary: !!(verifyReport as any)?.executive_summary_markdown,
          executiveSummaryLength: (verifyReport as any)?.executive_summary_markdown?.length || 0,
        });
      }

      console.log('[GENERATE-ICP-REPORT] ✅ UPDATE executado com sucesso. Verificando resposta:', {
        hasReport: !!report,
        reportId: report?.id,
        reportType: report?.report_type,
        reportKeys: report ? Object.keys(report) : [],
        hasFullReportColumn: !!(report as any)?.full_report_markdown,
        hasExecutiveSummaryColumn: !!(report as any)?.executive_summary_markdown,
      });

    // 🔥 VALIDAÇÃO CRÍTICA: Verificar se os campos foram salvos corretamente
    const savedReportData = report?.report_data as any;
    const savedKeys = savedReportData ? Object.keys(savedReportData) : [];
    const reportObj = report as any;
    
    console.log('[GENERATE-ICP-REPORT] ✅ Relatório salvo. Verificando campos:', {
      reportId: report.id,
      report_type: report.report_type,
      // 🔥 VERIFICAR COLUNAS DIRETAS PRIMEIRO
      COLUNAS_NOVAS: {
        hasFullReportMarkdown_COLUMN: !!reportObj.full_report_markdown,
        fullReportMarkdown_COLUMN_Length: reportObj.full_report_markdown?.length || 0,
        fullReportMarkdown_COLUMN_Preview: reportObj.full_report_markdown?.substring(0, 100),
        hasExecutiveSummaryMarkdown_COLUMN: !!reportObj.executive_summary_markdown,
        executiveSummaryMarkdown_COLUMN_Length: reportObj.executive_summary_markdown?.length || 0,
        executiveSummaryMarkdown_COLUMN_Preview: reportObj.executive_summary_markdown?.substring(0, 100),
      },
      // Verificar report_data também
      reportData: {
        hasExecutiveSummary: !!savedReportData?.executiveSummaryMarkdown,
        executiveSummaryLength: savedReportData?.executiveSummaryMarkdown?.length || 0,
        hasFullReport: !!savedReportData?.fullReportMarkdown,
        fullReportLength: savedReportData?.fullReportMarkdown?.length || 0,
        hasAnalysis: !!savedReportData?.analysis,
        analysisLength: savedReportData?.analysis?.length || 0,
        savedKeys: savedKeys,
        savedKeysList: savedKeys.join(', '),
      },
    });

    // 🔥 ALERTA SE OS CAMPOS NOVOS NÃO FORAM SALVOS
    if (!savedReportData?.executiveSummaryMarkdown && !savedReportData?.fullReportMarkdown) {
      console.error('[GENERATE-ICP-REPORT] ⚠️⚠️⚠️ ATENÇÃO: Campos novos NÃO foram salvos!', {
        savedKeys: savedKeys,
        savedKeysList: savedKeys.join(', '),
        reportDataKeys: Object.keys(reportData),
        reportDataKeysList: Object.keys(reportData).join(', '),
        reportDataExecutiveSummary: reportData.executiveSummaryMarkdown?.substring(0, 100),
        reportDataFullReport: reportData.fullReportMarkdown?.substring(0, 100),
        // Debug: verificar tamanhos
        executiveSummarySize: reportData.executiveSummaryMarkdown?.length || 0,
        fullReportSize: reportData.fullReportMarkdown?.length || 0,
        reportDataSize: JSON.stringify(reportData).length,
      });
    } else {
      console.log('[GENERATE-ICP-REPORT] ✅✅✅ Campos novos SALVOS COM SUCESSO!', {
        savedKeys: savedKeys,
        executiveSummaryLength: savedReportData?.executiveSummaryMarkdown?.length || 0,
        fullReportLength: savedReportData?.fullReportMarkdown?.length || 0,
      });
    }

      // 🔥🔥🔥 LOG FINAL CRÍTICO: Confirmar salvamento antes de retornar
      const finalFullReport = (report as any)?.full_report_markdown || savedFullReport;
      const finalExecutiveSummary = (report as any)?.executive_summary_markdown || savedExecutiveSummary;
      
      console.log('[GENERATE-ICP-REPORT] 🔥🔥🔥 LOG FINAL - ANTES DE RETORNAR SUCESSO:', {
        reportId: report.id,
        hasFullReportColumn: !!finalFullReport,
        fullReportColumnLength: finalFullReport?.length || 0,
        hasExecutiveSummaryColumn: !!finalExecutiveSummary,
        executiveSummaryColumnLength: finalExecutiveSummary?.length || 0,
        fullReportPreview: finalFullReport?.substring(0, 200) || 'VAZIO',
        executiveSummaryPreview: finalExecutiveSummary?.substring(0, 200) || 'VAZIO',
        reportKeys: Object.keys(report || {}),
      });

      if (!finalFullReport || finalFullReport.length < 1000) {
        console.error('[GENERATE-ICP-REPORT] ❌❌❌ ERRO CRÍTICO FINAL: full_report_markdown NÃO foi salvo!');
        await markAsFailed('full_report_markdown não foi salvo - abortando retorno de sucesso');
        return new Response(
          JSON.stringify({ error: 'full_report_markdown não foi salvo corretamente', reportId }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!finalExecutiveSummary || finalExecutiveSummary.length < 200) {
        console.error('[GENERATE-ICP-REPORT] ❌❌❌ ERRO CRÍTICO FINAL: executive_summary_markdown NÃO foi salvo!');
        await markAsFailed('executive_summary_markdown não foi salvo - abortando retorno de sucesso');
        return new Response(
          JSON.stringify({ error: 'executive_summary_markdown não foi salvo corretamente', reportId }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await updateProgress(100, 'Relatório gerado com sucesso!');

      // 🔥 ENTERPRISE PATTERN: Retornar sucesso com reportId para rastreamento
      console.log('[GENERATE-ICP-REPORT] ✅✅✅ RETORNANDO SUCESSO - Campos confirmados salvos:', {
        reportId: report.id,
        fullReportLength: finalFullReport.length,
        executiveSummaryLength: finalExecutiveSummary.length,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          report,
          reportId: report.id,
          message: 'Relatório gerado e salvo com sucesso',
          fullReportLength: finalFullReport.length,
          executiveSummaryLength: finalExecutiveSummary.length,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (processingError: any) {
      // 🔥 ENTERPRISE PATTERN: Capturar qualquer erro durante o processamento
      console.error('[GENERATE-ICP-REPORT] ❌ Erro durante processamento:', processingError);
      await markAsFailed(processingError.message || 'Erro desconhecido durante processamento');
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao processar relatório', 
          details: processingError.message,
          reportId,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('[GENERATE-ICP-REPORT] ❌ Erro:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// =====================================================
// MIGRAÇÃO SUGERIDA PARA EXECUÇÃO MANUAL NO SUPABASE:
// =====================================================
// As colunas full_report_markdown e executive_summary_markdown
// já foram criadas pela migration: 20250206000000_add_icp_report_markdown_columns.sql
//
// Se por algum motivo as colunas não existirem, execute:
//
// ALTER TABLE public.icp_reports
//   ADD COLUMN IF NOT EXISTS full_report_markdown TEXT,
//   ADD COLUMN IF NOT EXISTS executive_summary_markdown TEXT;
//
// CREATE INDEX IF NOT EXISTS idx_icp_reports_full_markdown 
//   ON public.icp_reports(icp_profile_metadata_id) 
//   WHERE full_report_markdown IS NOT NULL;
//
// CREATE INDEX IF NOT EXISTS idx_icp_reports_summary_markdown 
//   ON public.icp_reports(icp_profile_metadata_id) 
//   WHERE executive_summary_markdown IS NOT NULL;
// =====================================================

// =============================================================================
// 🎯 MC6: Função de orquestração para Match & Fit de ICP
// =============================================================================
/**
 * MC6: Gera visão resumida de compatibilidade entre ICP e portfólio do tenant
 */
async function buildIcpMatchFitOverview(
  tenantId: string,
  icpMetadata: any,
  onboardingData: OnboardingData,
  supabase: any
): Promise<{
  enabled: boolean;
  summary: string;
  score?: number;
  portfolioCoverage?: string[];
  notes?: string[];
}> {
  console.log('[MC6] Iniciando análise ICP x Portfólio para tenant:', tenantId);

  try {
    // 1. Buscar portfólio do tenant
    const { data: tenantProducts } = await supabase
      .from('tenant_products')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('ativo', true);

    if (!tenantProducts || tenantProducts.length === 0) {
      return {
        enabled: false,
        summary: 'Portfólio do tenant não está cadastrado. Recomenda-se cadastrar produtos/soluções para análise de Match & Fit.',
      };
    }

    // 2. Montar ICP completo (similar ao que é feito em generate-company-report)
    const step3 = onboardingData.step3_PerfilClienteIdeal || {};
    const icpDeno = {
      profile: {
        id: icpMetadata.id,
        nome: icpMetadata.nome || 'ICP Principal',
        descricao: icpMetadata.descricao,
        setor_foco: icpMetadata.setor_foco,
        nicho_foco: icpMetadata.nicho_foco,
      },
      persona: {
        dor_principal: step3.dorPrincipal || null,
        desejos: step3.desejos || [],
      },
      criteria: {
        setores_alvo: step3.setoresAlvo || step3.setores_alvo || [],
        cnaes_alvo: step3.cnaesAlvo || step3.cnaes_alvo || [],
        porte: step3.porteAlvo || step3.porte_alvo || [],
        regioes_alvo: step3.localizacaoAlvo?.regioes || step3.localizacaoAlvo?.estados || [],
        faturamento_min: step3.faturamentoAlvo?.minimo || null,
        faturamento_max: step3.faturamentoAlvo?.maximo || null,
        funcionarios_min: step3.funcionariosAlvo?.minimo || null,
        funcionarios_max: step3.funcionariosAlvo?.maximo || null,
      },
    };

    // 3. Validar se há ICP suficiente
    if (!icpDeno.criteria.setores_alvo || icpDeno.criteria.setores_alvo.length === 0) {
      return {
        enabled: false,
        summary: 'ICP não possui setores-alvo definidos. Recomenda-se completar o cadastro do ICP para análise de Match & Fit.',
      };
    }

    // 4. Montar "lead genérico" baseado no ICP (sem empresa específica)
    // Usamos os critérios do ICP como se fossem características de uma empresa ideal
    const leadGenérico = {
      companySector: icpDeno.criteria.setores_alvo?.[0] || null,
      cnae: icpDeno.criteria.cnaes_alvo?.[0] || null,
      companySize: icpDeno.criteria.porte?.[0] || null,
      companyRegion: icpDeno.criteria.regioes_alvo?.[0] || null,
      capitalSocial: icpDeno.criteria.faturamento_min || null,
      interestArea: icpDeno.persona.desejos?.[0] || null,
    };

    // 5. Importar e chamar engine Deno
    const { runMatchFitEngineDeno } = await import('../_shared/matchFitEngineDeno.ts');

    const matchFitInput = {
      lead: leadGenérico,
      icp: icpDeno,
      portfolio: tenantProducts.map((p: any) => ({
        id: p.id,
        nome: p.nome,
        descricao: p.descricao,
        categoria: p.categoria,
        subcategoria: p.subcategoria,
        cnaes_alvo: p.cnaes_alvo || [],
        setores_alvo: p.setores_alvo || [],
        portes_alvo: p.portes_alvo || [],
        capital_social_minimo: p.capital_social_minimo,
        capital_social_maximo: p.capital_social_maximo,
        regioes_alvo: p.regioes_alvo || [],
        diferenciais: p.diferenciais || [],
        casos_uso: p.casos_uso || [],
        dores_resolvidas: p.dores_resolvidas || [],
        beneficios: p.beneficios || [],
        ativo: p.ativo !== false,
        destaque: p.destaque || false,
      })),
      tenantId,
      tenantName: icpMetadata.nome || undefined,
    };

    const matchFitResult = runMatchFitEngineDeno(matchFitInput);

    // 6. Processar resultado e gerar resumo
    if (matchFitResult.scores.length === 0) {
      return {
        enabled: false,
        summary: 'Não foi possível calcular fit entre ICP e portfólio. Verifique se os critérios do ICP estão alinhados com os produtos cadastrados.',
      };
    }

    // Calcular score global (média ponderada dos top 3 scores de produtos)
    const productScores = matchFitResult.scores
      .filter(s => s.referenceType === 'product')
      .slice(0, 3);
    
    const scoreGlobal = productScores.length > 0
      ? Math.round(productScores.reduce((sum, s) => sum + s.score, 0) / productScores.length)
      : matchFitResult.metadata.bestFitScore;

    // Extrair cobertura de portfólio (setores/categorias cobertos)
    const portfolioCoverage: string[] = [];
    const setoresCobertos = new Set<string>();
    tenantProducts.forEach((p: any) => {
      if (p.setores_alvo && Array.isArray(p.setores_alvo)) {
        p.setores_alvo.forEach((s: string) => setoresCobertos.add(s));
      }
      if (p.categoria) {
        portfolioCoverage.push(p.categoria);
      }
    });
    const setoresUnicos = Array.from(setoresCobertos);

    // Gerar notas sobre oportunidades/gaps
    const notes: string[] = [];
    if (scoreGlobal >= 70) {
      notes.push('Alto alinhamento entre ICP e portfólio indica boa estratégia de produto.');
    } else if (scoreGlobal >= 50) {
      notes.push('Alinhamento moderado sugere oportunidades de ajuste no portfólio ou no ICP.');
    } else {
      notes.push('Baixo alinhamento indica necessidade de revisão estratégica do portfólio ou do ICP.');
    }

    if (matchFitResult.recommendations.length > 0) {
      const topRec = matchFitResult.recommendations[0];
      if (topRec.priority === 'high') {
        notes.push(`Produto "${topRec.solutionName}" apresenta alto fit com o ICP.`);
      }
    }

    if (setoresUnicos.length < icpDeno.criteria.setores_alvo.length) {
      notes.push(`Portfólio cobre ${setoresUnicos.length} de ${icpDeno.criteria.setores_alvo.length} setores-alvo do ICP.`);
    }

    // Gerar resumo executivo
    const summary = matchFitResult.executiveSummary || 
      `Análise de Match & Fit identificou ${matchFitResult.scores.length} alinhamentos entre o ICP e o portfólio do tenant, com score médio de ${scoreGlobal}%.`;

    return {
      enabled: true,
      summary,
      score: scoreGlobal,
      portfolioCoverage: setoresUnicos.length > 0 ? setoresUnicos : undefined,
      notes: notes.length > 0 ? notes : undefined,
    };

  } catch (error) {
    console.error('[MC6] Erro ao processar Match & Fit:', error);
    return {
      enabled: false,
      summary: 'Erro ao processar análise de Match & Fit. Tente novamente mais tarde.',
    };
  }
}

// =============================================================================
// 🎯 GOLDEN SAMPLE – MODELO DE SAÍDA (REFERÊNCIA DE ESTILO)
// 🔒 PROTEGIDO: NÃO ALTERAR SEM AUTORIZAÇÃO
// =============================================================================
// 🔒 PROTEGIDO: NÃO ALTERAR SEM AUTORIZAÇÃO
// GOLDEN SAMPLE UNIVERSAL V4 - Estrutura definitiva com hierarquias
const GOLDEN_SAMPLE_MARKDOWN = `
# 📋 Resumo Executivo — STRATEVO ONE

## 1. Snapshot Estratégico da Empresa
(Descrição objetiva: setor, mercado, foco, proposta de valor, tipo de operação.)

## 2. ICP Recomendado
- Setores-alvo
- Porte-alvo
- Região-alvo
- Perfil decisor
- Contexto operacional
- Dor central do ICP

## 3. Oportunidades Estratégicas Identificadas
(Use dados REAIS de internalContext.competitiva.insights.opportunities ou internalContext.competitiva.swot.opportunities. Se não existir, OMITIR completamente.)

## 4. Riscos e Alertas Estratégicos
(Use dados REAIS de internalContext.competitiva.insights.threats ou internalContext.competitiva.swot.threats. Se não existir, OMITIR completamente.)

## 5. Recomendações Imediatas
(Use dados REAIS de internalContext. Se não houver dados específicos, OMITIR completamente.)

---

# 📌 Ações por Hierarquia

## [SDR] O que fazer agora
(Listas → filtros → gatilhos → textos de abordagem → validação rápida.)

## [CLOSER] Como fechar mais rápido
(Argumentos-chaves, provas de valor, queima de objeções.)

## [GERENTE] Direção tática
(Métricas, gestão de pipeline, ajustes de operação.)

## [DIRETOR_CEO] Tese Executiva
(Para onde direcionar o negócio, visão de crescimento e posicionamento.)

---

# 📊 Relatório Estratégico Completo — STRATEVO ONE

## 1. Visão Estratégica Consolidada
(Descrição sólida e estratégica baseada em dados reais.)

## 2. Diagnóstico Estratégico
- Maturidade comercial
- Maturidade operacional
- Maturidade digital
- Fit de produto/serviço no mercado

## 3. ICP — Perfil Ideal Detalhado
- Setores-alvo
- Subnichos
- Porte
- Região
- Tipo de operação
- Dores específicas
- Gatilhos de compra

## 4. Análise Competitiva
- Barreiras de entrada
- Diferenciais
- Vantagens observadas
- Vulnerabilidades
- **🔥 USE competitiveAnalysis do reportModel:**
  - Listar concorrentes identificados (nome, setor, localização, capital social)
  - Análise SWOT se disponível (strengths, weaknesses, opportunities, threats)
  - Posicionamento competitivo baseado nos dados reais
  - Vantagens competitivas do tenant (competitiveAdvantages)

## 5. Análise Comercial (Fit & Conversion)
- Sinais de conversão
- Sinais de risco
- Potenciais ciclos comerciais
- Nível de urgência percebido

## 6. Análise Operacional e Produto
- Características do portfólio
- Gaps de entrega
- Pontos de força técnica

## 7. Análise Setorial Inteligente
(Análise qualitativa baseada no setor — NUNCA inventar números.)

## 8. Oportunidades Estratégicas
- Ações comerciais
- Ações operacionais
- Ações de diferenciação
- Oportunidades de expansão

## 9. Riscos Estratégicos
- Concorrência
- Execução
- Produto
- Operação
- Mercado

## 10. Roadmap de 12 a 36 Meses
- Prioridades de curto prazo
- Prioridades de médio prazo
- Prioridades de longo prazo

---

# 📌 Ações por Hierarquia

## [SDR]
(Ações claras, práticas, listas, ICP, filtros, abordagens.)

## [CLOSER]
(Estratégias de fechamento, objeções, pontos críticos.)

## [GERENTE]
(Gestão, métricas, correções de rota, previsões.)

## [DIRETOR_CEO]
(Tese estratégica completa baseada na empresa, setor e mercado analisado.)
`;

// =============================================================================
// 🎯 FUNÇÃO: Construir Prompt para LLM (NOVO MODELO UNIVERSAL)
// 🔒 PROTEGIDO: NÃO ALTERAR SEM AUTORIZAÇÃO
// =============================================================================
function buildLLMPrompt(reportModel: ReportModel): string {
  const modelJson = JSON.stringify(reportModel, null, 2);
  
  // 🔥🔥🔥 LOG CRÍTICO: Verificar EXATAMENTE o que está sendo enviado para a LLM
  console.log('[BUILD-LLM-PROMPT] 🔥🔥🔥 ONBOARDING DATA COMPLETO ENVIADO PARA LLM:', JSON.stringify(reportModel.onboardingData, null, 2));
  console.log('[BUILD-LLM-PROMPT] 📊 Tamanho do JSON completo:', modelJson.length, 'caracteres');
  console.log('[BUILD-LLM-PROMPT] 📊 Primeiros 1000 chars do onboardingData no JSON:', JSON.stringify(reportModel.onboardingData).substring(0, 1000));
  
  // 🔥🔥🔥 LOG CRÍTICO: Verificar se internalContext está presente
  if (reportModel.internalContext) {
    console.log('[BUILD-LLM-PROMPT] 🔥🔥🔥 INTERNAL CONTEXT DISPONÍVEL:', {
      hasOnboardingSteps: !!reportModel.internalContext.onboardingSteps,
      produtosTenantCount: reportModel.internalContext.produtosTenant?.length || 0,
      produtosConcorrentesCount: reportModel.internalContext.produtosConcorrentes?.length || 0,
      hasCompetitiveOverview: !!reportModel.internalContext.competitiva?.overview,
      hasSwot: !!reportModel.internalContext.competitiva?.swot,
      hasBcg: !!reportModel.internalContext.competitiva?.bcg,
      hasMarketInsights: !!reportModel.internalContext.competitiva?.insights,
    });
  } else {
    console.log('[BUILD-LLM-PROMPT] ⚠️ INTERNAL CONTEXT NÃO DISPONÍVEL');
  }

  return `
Você é um analista estratégico sênior do STRATEVO Intelligence.

Você receberá o objeto JSON abaixo chamado "reportModel".

🔥🔥🔥 FONTE PRINCIPAL DE DADOS: reportModel.internalContext 🔥🔥🔥

O reportModel.internalContext contém TODOS os dados internos já coletados e analisados:

- onboardingSteps: respostas completas das 6 etapas do ICP (step1_data a step6_data)
  * step1_data: dados básicos da empresa, concorrentes diretos, clientes atuais
  * step2_data: setores e nichos alvo
  * step3_data: perfil do cliente ideal (porte, localização, faturamento, funcionários)
  * step4_data: situação atual (diferenciais, casos de uso, tickets, ciclo de venda, concorrentes)
  * step5_data: histórico e enriquecimento (clientes atuais, empresas de benchmarking)
  * step6_data: dados adicionais se disponíveis

- produtosTenant: portfólio completo de produtos/serviços do tenant (nome, categoria, segmento, linha, receita, margem)

- produtosConcorrentes: portfólio dos concorrentes com intensidade por categoria (competitor_name, categoria, intensidade, capital_social)

- competitiva.overview: análise competitiva agregada (mapa, ranking, indicadores principais da aba Competitiva)

- competitiva.swot: análise SWOT competitiva já calculada (strengths, weaknesses, opportunities, threats)

- competitiva.bcg: matriz BCG com market share, crescimento e posição desejada (stars, cashCows, questionMarks, dogs)

- competitiva.insights: insights de mercado e tendências já identificadas

- icpMetadata: resumo textual do ICP Principal usado na interface

TAREFA PRINCIPAL:

Use EXCLUSIVAMENTE os dados de reportModel.internalContext para gerar um RELATÓRIO ESTRATÉGICO COMPLETO, em português, em formato Markdown.

===== reportModel (INCLUINDO internalContext) =====

${modelJson}

========================

Obrigatório: produzir resposta SOMENTE NESTE FORMATO:

{
  "executiveSummaryMarkdown": "markdown aqui...",
  "fullReportMarkdown": "markdown aqui..."
}

🏛️ Formato do Artefato 1 — executiveSummaryMarkdown (RESUMO EXECUTIVO)

Estrutura fixa, universal:

# 📋 Resumo Executivo — STRATEVO ONE

## 1. Snapshot Estratégico da Empresa
(Descrição objetiva baseada no reportModel: setor, mercado, foco, proposta de valor, tipo de operação.)

## 2. ICP Recomendado
- Setores-alvo
- Porte-alvo
- Região-alvo
- Perfil decisor
- Contexto operacional
- Dor central do ICP

## 3. Oportunidades Estratégicas Identificadas
(Use dados REAIS de internalContext.competitiva.insights.opportunities ou internalContext.competitiva.swot.opportunities. Se não existir, OMITIR completamente.)

## 4. Riscos e Alertas Estratégicos
(Use dados REAIS de internalContext.competitiva.insights.threats ou internalContext.competitiva.swot.threats. Se não existir, OMITIR completamente.)

## 5. Recomendações Imediatas
(Use dados REAIS de internalContext. Se não houver dados específicos, OMITIR completamente.)

---

# 📌 Ações por Hierarquia

## [SDR] O que fazer agora
(Listas → filtros → gatilhos → textos de abordagem → validação rápida.)

## [CLOSER] Como fechar mais rápido
(Argumentos-chaves, provas de valor, queima de objeções.)

## [GERENTE] Direção tática
(Métricas, gestão de pipeline, ajustes de operação.)

## [DIRETOR_CEO] Tese Executiva
(Para onde direcionar o negócio, visão de crescimento e posicionamento.)

---

🏛️ Formato do Artefato 2 — fullReportMarkdown (RELATÓRIO COMPLETO)

Estrutura fixa, robusta e universal:

# 📊 Relatório Estratégico Completo — STRATEVO ONE

## 1. Visão Estratégica Consolidada
(Descrição sólida e estratégica baseada no reportModel.)

## 2. Diagnóstico Estratégico
- Maturidade comercial
- Maturidade operacional
- Maturidade digital
- Fit de produto/serviço no mercado

## 3. ICP — Perfil Ideal Detalhado
- Setores-alvo
- Subnichos
- Porte
- Região
- Tipo de operação
- Dores específicas
- Gatilhos de compra

## 4. Análise Competitiva
- Barreiras de entrada
- Diferenciais
- Vantagens observadas
- Vulnerabilidades
- **🔥 USE competitiveAnalysis do reportModel:**
  - Listar concorrentes identificados (nome, setor, localização, capital social)
  - Análise SWOT se disponível (strengths, weaknesses, opportunities, threats)
  - Posicionamento competitivo baseado nos dados reais
  - Vantagens competitivas do tenant (competitiveAdvantages)

## 5. Análise Comercial (Fit & Conversion)
- Sinais de conversão
- Sinais de risco
- Potenciais ciclos comerciais
- Nível de urgência percebido

## 6. Análise Operacional e Produto
- **🔥 OBRIGATÓRIO: USE productHeatmap do reportModel:**
  - Se productHeatmap.tenantProducts existir, liste os produtos REAIS do tenant
  - Formato: "Produtos do tenant: [Produto Real 1] ([categoria real]), [Produto Real 2] ([categoria real])..."
  - Se productHeatmap.competitorProducts existir, liste produtos REAIS dos concorrentes
  - Formato: "[Concorrente Real 1] possui [X] produtos nas categorias: [categoria 1], [categoria 2]..."
  - Compare produtos REAIS do tenant vs concorrentes REAIS
  - Identifique categorias onde o tenant é único (sem concorrentes)
  - Identifique categorias com alta concorrência (múltiplos concorrentes)

## 7. Análise Setorial Inteligente
(Baseado no setor do reportModel → NUNCA inventar números → apenas análise qualitativa.)
- **🔥 USE clientBCGData do reportModel:**
  - Se clientBCGData.clientesAtuais existir, liste clientes REAIS
  - Formato: "Clientes atuais: [Nome Real 1] ([setor real], Ticket médio: R$ [valor real]), [Nome Real 2]..."
  - Se clientBCGData.empresasBenchmarking existir, liste empresas REAIS de benchmarking
  - Formato: "Empresas de benchmarking: [Nome Real 1] ([setor real], Capital: R$ [valor real]), [Nome Real 2]..."
  - Se clientBCGData.bcgMatrix existir, use os dados REAIS da matriz BCG
  - Se clientBCGData.clientSegmentation existir, mencione a segmentação REAL
- **🔥 USE marketInsights do reportModel se disponível:**
  - Tendências de mercado REAIS (marketTrends)
  - Oportunidades identificadas REAIS (opportunities)
  - Ameaças identificadas REAIS (threats)
  - Recomendações estratégicas REAIS (recommendations)

## 8. Oportunidades Estratégicas
- Ações comerciais
- Ações operacionais
- Ações de diferenciação
- Oportunidades de expansão

## 9. Riscos Estratégicos
- Concorrência
- Execução
- Produto
- Operação
- Mercado

## 10. Roadmap de 12 a 36 Meses
- Prioridades de curto prazo
- Prioridades de médio prazo
- Prioridades de longo prazo

---

# 📌 Ações por Hierarquia

## [SDR]
(Ações claras, práticas, listas, ICP, filtros, abordagens.)

## [CLOSER]
(Estratégias de fechamento, objeções, pontos críticos.)

## [GERENTE]
(Gestão, métricas, correções de rota, previsões.)

## [DIRETOR_CEO]
(Tese estratégica completa baseada na empresa, setor e mercado analisado.)

---

🚨🚨🚨 REGRAS CRÍTICAS E OBRIGATÓRIAS 🚨🚨🚨

⚠️ PROIBIDO ABSOLUTAMENTE:
- NUNCA invente números, PIB, TAM/SAM/SOM, faturamento, inflação, projeções macroeconômicas.
- NUNCA use exemplos fixos ou genéricos (UNI LUVAS, GERDAU, EMBRAER, VALE, etc.).
- NUNCA use estruturas antigas ("Visão Geral da Empresa", "Top 5 Oportunidades", "Análise Macroeconômica", etc.).
- NUNCA crie conteúdo placeholder, mock ou genérico.
- NUNCA assuma dados que não estão explicitamente no reportModel.

✅ OBRIGATÓRIO:
- Use EXCLUSIVAMENTE dados do reportModel fornecido acima.
- Se um dado não estiver no reportModel, OMITA a seção ou escreva "Dados não disponíveis".
- Use os dados REAIS de:
  * onboardingData.diferenciais (lista real de diferenciais)
  * onboardingData.casosDeUso (casos de uso reais)
  * onboardingData.ticketsECiclos (tickets e ciclos reais)
  * competitiveAnalysis.competitors (concorrentes reais com nome, setor, localização)
  * productHeatmap.tenantProducts (produtos reais do tenant)
  * productHeatmap.competitorProducts (produtos reais dos concorrentes)
  * clientBCGData.clientesAtuais (clientes reais com dados completos)
  * clientBCGData.empresasBenchmarking (empresas de benchmarking reais)
- SEMPRE incluir marcações [SDR], [CLOSER], [GERENTE], [DIRETOR_CEO] em todas as seções de ação.
- SEMPRE seguir a estrutura do GOLDEN SAMPLE acima.
- SEMPRE produzir Markdown limpo, profissional e direto.

🔥🔥🔥 INSTRUÇÕES CRÍTICAS PARA DADOS DE INTELIGÊNCIA INTERNA 🔥🔥🔥

USE OS DADOS REAIS DO reportModel.internalContext. NÃO INVENTE NADA!

🚨🚨🚨 PRIORIDADE: SEMPRE USE reportModel.internalContext PRIMEIRO 🚨🚨🚨

O reportModel.internalContext é a FONTE PRINCIPAL e mais completa de dados. Use-o para:

1. **internalContext.onboardingSteps** (DADOS COMPLETOS DAS 6 ETAPAS):
   - 🔥🔥🔥 CRÍTICO: Use internalContext.onboardingSteps ao invés de reportModel.onboardingData quando disponível
   - internalContext.onboardingSteps.step1_data: dados básicos, concorrentes diretos, clientes atuais
   - internalContext.onboardingSteps.step2_data: setores e nichos alvo
   - internalContext.onboardingSteps.step3_data: perfil do cliente ideal completo
   - internalContext.onboardingSteps.step4_data: diferenciais, casos de uso, tickets, concorrentes
   - internalContext.onboardingSteps.step5_data: clientes atuais, benchmarking
   - internalContext.onboardingSteps.step6_data: dados adicionais se disponíveis

2. **internalContext.produtosTenant** (PORTFÓLIO DO TENANT):
   - Liste TODOS os produtos reais: nome, categoria, segmento, linha, receita estimativa, margem
   - Formato: "Portfólio do tenant: [Produto 1] ([categoria], Segmento: [segmento], Receita estimada: R$ [valor], Margem: [%]), [Produto 2]..."

3. **internalContext.produtosConcorrentes** (HEATMAP DE PRODUTOS):
   - Liste produtos dos concorrentes com intensidade: competitor_name, categoria, intensidade, capital_social
   - Compare produtos do tenant vs concorrentes por categoria
   - Formato: "[Concorrente X] possui [N] produtos na categoria [Y] com intensidade [alta/média/baixa]"

4. **internalContext.competitiva.overview** (ANÁLISE COMPETITIVA):
   - Use os dados da análise competitiva agregada (mesma fonte da aba Competitiva)
   - Inclua ranking, indicadores principais, mapa competitivo

5. **internalContext.competitiva.swot** (SWOT COMPETITIVA):
   - Use strengths, weaknesses, opportunities, threats REAIS da análise SWOT
   - Formato: "SWOT Competitiva: Pontos Fortes: [lista real], Pontos Fracos: [lista real]..."

6. **internalContext.competitiva.bcg** (MATRIZ BCG):
   - Use stars, cashCows, questionMarks, dogs REAIS
   - Formato: "Matriz BCG: Stars: [N], Cash Cows: [N], Question Marks: [N], Dogs: [N]"

7. **internalContext.competitiva.insights** (INSIGHTS DE MERCADO):
   - Use tendências, oportunidades, ameaças, recomendações REAIS

8. **internalContext.icpMetadata** (METADATA DO ICP):
   - Use a descrição e resumo textual do ICP Principal

🚨🚨🚨 EXEMPLOS CONCRETOS DE COMO USAR OS DADOS REAIS 🚨🚨🚨

1. **onboardingSteps** (DADOS COMPLETOS DAS 6 ETAPAS): 
   - 🔥🔥🔥 CRÍTICO: O reportModel contém TODOS os dados das 6 etapas do onboarding
   - Use onboardingData.step1_DadosBasicos para dados da empresa (razaoSocial, cnpj, setorPrincipal, porteEmpresa, capitalSocial, endereco)
   - Use onboardingData.step1_DadosBasicos.concorrentesDiretos para concorrentes do Step 1
   - Use onboardingData.step1_DadosBasicos.clientesAtuais para clientes do Step 1
   - Use onboardingData.step2_SetoresNichos para setores e nichos alvo
   - Use onboardingData.step3_PerfilClienteIdeal para perfil detalhado (porte, localização, faturamento, funcionários)
   - Use onboardingData.step4_SituacaoAtual.diferenciais para diferenciais REAIS
   - Use onboardingData.step4_SituacaoAtual.casosDeUso para casos de uso REAIS
   - Use onboardingData.step4_SituacaoAtual.ticketsECiclos para tickets e ciclos REAIS
   - Use onboardingData.step4_SituacaoAtual.concorrentesDiretos para concorrentes do Step 4
   - Use onboardingData.step5_HistoricoEEnriquecimento.clientesAtuais para TODOS os clientes (mesclados)
   - Use onboardingData.step5_HistoricoEEnriquecimento.empresasBenchmarking para empresas de benchmarking
   
   EXEMPLO CORRETO:
   - Se onboardingData.step4_SituacaoAtual.diferenciais = ["Customização avançada", "Atendimento 24/7", "Garantia estendida"]
   - Você DEVE escrever: "Diferenciais competitivos: Customização avançada, Atendimento 24/7, Garantia estendida"
   - NÃO escreva: "A empresa se destaca pela qualidade" (genérico)
   - Se onboardingData.step2_SetoresNichos.setoresAlvo = ["Manufatura", "Alimentos"]
   - Você DEVE escrever: "Setores-alvo: Manufatura, Alimentos"
   - Se onboardingData.step5_HistoricoEEnriquecimento.clientesAtuais tiver dados, liste os clientes REAIS

2. **competitiveAnalysis**: 
   - 🔥🔥🔥 CRÍTICO: Se competitiveAnalysis.competitors existir e tiver pelo menos 1 item, VOCÊ DEVE listar TODOS os concorrentes REAIS
   - 🔥🔥🔥 CRÍTICO: NUNCA escreva "faltando concorrentes", "sem concorrentes mapeados", "sem concorrentes diretos listados" ou similar se competitiveAnalysis.competitors tiver dados
   - Formato OBRIGATÓRIO: "Concorrentes identificados: [Nome Real 1] (Setor: [setor real], Localização: [cidade/estado real], Capital Social: R$ [valor real]), [Nome Real 2]..."
   - Use competitiveAnalysis.swotAnalysis se presente (strengths, weaknesses, opportunities, threats REAIS)
   - Use competitiveAnalysis.competitiveAdvantages para listar vantagens REAIS do tenant
   
   EXEMPLO CORRETO:
   - Se competitiveAnalysis.competitors = [{nome: "Empresa X", setor: "Manufatura", cidade: "São Paulo", estado: "SP", capitalSocial: 5000000}]
   - Você DEVE escrever: "Concorrentes identificados: Empresa X (Setor: Manufatura, Localização: São Paulo/SP, Capital Social: R$ 5.000.000)"
   - NÃO escreva: "faltando concorrentes diretos listados" ou "sem concorrentes mapeados"

3. **productHeatmap**: 
   - Se disponível, liste TODOS os produtos REAIS do tenant (tenantProducts: nome, categoria, descricao)
   - Liste produtos REAIS dos concorrentes (competitorProducts: competitorName, produtos[])
   - Compare produtos REAIS do tenant vs concorrentes REAIS
   
   EXEMPLO CORRETO:
   - Se productHeatmap.tenantProducts = [{nome: "Sistema ERP", categoria: "Software"}, {nome: "Consultoria", categoria: "Serviços"}]
   - Você DEVE escrever: "Produtos do tenant: Sistema ERP (Software), Consultoria (Serviços)"
   - NÃO escreva: "A empresa oferece soluções tecnológicas" (genérico)

4. **clientBCGData**: 
   - Se disponível, liste clientes REAIS (clientesAtuais: nome, setor, cidade, ticketMedio, motivoCompra)
   - Liste empresas de benchmarking REAIS (empresasBenchmarking: nome, setor, motivoReferencia)
   - Use clientSegmentation REAIS (highValue, mediumValue, lowValue)
   - Use bcgMatrix REAIS se disponível (stars, cashCows, questionMarks, dogs)
   
   EXEMPLO CORRETO:
   - Se clientBCGData.clientesAtuais = [{nome: "Cliente A", setor: "Indústria", cidade: "São Paulo", ticketMedio: 50000}]
   - Você DEVE escrever: "Clientes atuais incluem: Cliente A (Setor: Indústria, Cidade: São Paulo, Ticket médio: R$ 50.000)"
   - NÃO escreva: "A empresa atende grandes clientes" (genérico)

5. **marketInsights**: 
   - Se disponível, use marketTrends REAIS (lista de tendências)
   - Use opportunities REAIS (lista de oportunidades)
   - Use threats REAIS (lista de ameaças)
   - Use recommendations REAIS (lista de recomendações)

6. **existingReports** (🔥🔥🔥 NOVO - RELATÓRIOS ICP JÁ PRONTOS):
   - 🔥🔥🔥 CRÍTICO: Se existingReports existir, você DEVE analisar os relatórios anteriores para identificar:
     * Padrões e tendências ao longo do tempo
     * Evolução do ICP e recomendações anteriores
     * Insights consolidados de múltiplas análises
     * Recomendações que foram implementadas ou não
   - Use existingReports.summaries para ver histórico de relatórios
   - Use existingReports.aggregatedData.mc8Assessments para ver evolução da carteira
   - Use existingReports.aggregatedData.mc9Plans para ver evolução do hunting
   - Compare o relatório atual com os anteriores para mostrar progresso ou mudanças
   - Formato: "Análise histórica: Baseado em [X] relatórios anteriores, observa-se [tendência/evolução]..."
   
   EXEMPLO CORRETO:
   - Se existingReports.total = 3 e existingReports.summaries tiver recomendações anteriores
   - Você DEVE escrever: "Análise histórica: Baseado em 3 relatórios anteriores deste ICP, observa-se uma evolução positiva na carteira, com aumento de [X]% em contas ICP Core..."
   - NÃO ignore os relatórios anteriores se existirem

7. **relatedAnalyses** (🔥🔥🔥 NOVO - ANÁLISES E GRÁFICOS RELACIONADOS):
   - 🔥🔥🔥 CRÍTICO: Se relatedAnalyses existir, você DEVE usar TODAS as análises relacionadas:
     * relatedAnalyses.competitiveAnalyses: Análises competitivas completas já realizadas
     * relatedAnalyses.swotAnalyses: Análises SWOT já realizadas
     * relatedAnalyses.bcgMatrices: Matrizes BCG já calculadas
     * relatedAnalyses.marketInsights: Insights de mercado já coletados
   - Use esses dados para enriquecer o relatório com análises já validadas
   - Formato: "Análises relacionadas: Com base em [X] análises competitivas anteriores, identificamos [insight]..."
   
   EXEMPLO CORRETO:
   - Se relatedAnalyses.swotAnalyses tiver dados, você DEVE mencionar: "Análise SWOT consolidada: Baseado em análises anteriores, os principais pontos fortes identificados são [lista real]..."
   - NÃO ignore análises relacionadas se existirem

🚨🚨🚨 CRÍTICO - LEIA COM MUITA ATENÇÃO 🚨🚨🚨

1. Se competitiveAnalysis.competitors existir e tiver pelo menos 1 item:
   - VOCÊ DEVE listar TODOS os concorrentes REAIS
   - NUNCA escreva "faltando concorrentes" ou "sem concorrentes mapeados"
   - Formato: "Concorrentes identificados: [Nome Real] (Setor: [setor real], Localização: [cidade/estado real], Capital Social: [valor real])"

2. Se onboardingData.diferenciais existir e tiver pelo menos 1 item:
   - VOCÊ DEVE listar TODOS os diferenciais REAIS
   - NUNCA use diferenciais genéricos como "customização" se não estiver na lista
   - Formato: "Diferenciais competitivos: [Diferencial Real 1], [Diferencial Real 2]..."

3. Se productHeatmap.tenantProducts existir e tiver pelo menos 1 item:
   - VOCÊ DEVE listar os produtos REAIS do tenant
   - Formato: "Produtos do tenant: [Produto Real 1] ([categoria real]), [Produto Real 2]..."

4. Se clientBCGData.clientesAtuais existir e tiver pelo menos 1 item:
   - VOCÊ DEVE mencionar clientes REAIS
   - Formato: "Clientes atuais incluem: [Nome Real 1] ([setor real]), [Nome Real 2]..."

5. Se um dado NÃO estiver disponível (null, undefined, array vazio):
   - OMITA completamente a seção
   - NÃO invente dados
   - NÃO use exemplos genéricos
   - NÃO crie seções como "TAM/SAM/SOM" ou "Análise Macroeconômica"

6. NUNCA, JAMAIS:
   - Invente números de mercado (TAM, SAM, SOM, PIB, faturamento projetado)
   - Use exemplos genéricos (GERDAU, EMBRAER, VALE, etc.) a menos que estejam nos dados
   - Escreva "faltando" ou "sem dados" se os dados EXISTIREM no reportModel
   - Crie conteúdo genérico sobre "variações macroeconômicas" ou "inflação" sem dados específicos

🔥🔥🔥 ESTRUTURA OBRIGATÓRIA - SIGA EXATAMENTE O GOLDEN SAMPLE 🔥🔥🔥

Você DEVE seguir EXATAMENTE a estrutura do GOLDEN SAMPLE abaixo. NÃO use estruturas antigas como "Top 5", "Top 3", "Plano de Ação", "Análise Macroeconômica", etc.

${GOLDEN_SAMPLE_MARKDOWN}

🚨🚨🚨 LEMBRE-SE: Use EXCLUSIVAMENTE dados de reportModel.internalContext. NÃO invente nada. Se um dado não existir, OMITA a seção completamente. 🚨🚨🚨
`;
}
