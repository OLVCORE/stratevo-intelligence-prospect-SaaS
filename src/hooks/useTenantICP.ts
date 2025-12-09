import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

/**
 * Modelo completo do ICP do tenant
 * MC1[data]: Hook unificado para consumir todos os blocos de inteligência do ICP
 */
export interface TenantICPModel {
  // Perfil básico
  profile: {
    id: string;
    nome: string;
    descricao: string | null;
    tipo: string;
    setor_foco: string | null;
    nicho_foco: string | null;
    ativo: boolean;
    icp_principal: boolean;
    created_at: string;
    updated_at: string;
  } | null;
  
  // Persona e critérios
  persona: {
    decisor: string | null;
    dor_principal: string | null;
    objeções: string[];
    desejos: string[];
    stack_tech: string | null;
    maturidade_digital: string | null;
    canal_preferido: string | null;
    pitch: string | null;
    playbooks: string[];
  } | null;
  
  // Critérios de qualificação
  criteria: {
    setores_alvo: string[];
    cnaes_alvo: string[];
    porte: string[];
    regioes_alvo: string[];
    faturamento_min: number | null;
    faturamento_max: number | null;
    funcionarios_min: number | null;
    funcionarios_max: number | null;
  } | null;
  
  // Análise competitiva (SNAPSHOT)
  competitiveMatrix: {
    topCompetitors: Array<{
      nome: string;
      capitalSocial: number;
      ameacaPotencial: 'alta' | 'media' | 'baixa';
      produtosCount: number;
    }>;
    totalCapital: number;
    yourMarketShare: number;
    yourPosition: number;
    diferenciais: string[];
    swotAnalysis: any;
    marketShareAnalysis: any;
  } | null;
  
  // Matriz BCG (SNAPSHOT)
  bcgMatrix: {
    priorityNiches: Array<{
      name: string;
      growth: number;
      marketShare: number;
      type: 'niche';
    }>;
    desiredClients: Array<{
      name: string;
      growth: number;
      marketShare: number;
      revenue: number;
      type: 'client';
    }>;
    benchmarking: Array<{
      name: string;
      growth: number;
      marketShare: number;
      type: 'benchmarking';
    }>;
  } | null;
  
  // Métricas de produtos (SNAPSHOT)
  productMetrics: {
    tenantProductsCount: number;
    tenantProductsCategories: string[];
    competitorProductsCount: number;
    competitorProductsCategories: string[];
    differentials: Array<{ nome: string; categoria: string }>;
    opportunities: Array<{ categoria: string; gap: string }>;
    highCompetition: Array<{ categoria: string; competitorCount: number }>;
    totalCategories: number;
  } | null;
  
  // Plano estratégico (SNAPSHOT)
  strategicPlan: {
    quickWins: string[];
    criticalDecisions: string[];
    investmentSummary: {
      shortTerm: number;
      mediumTerm: number;
      longTerm: number;
    };
    actions: Array<{
      title: string;
      status: string;
      priority: string;
      timeframe: string;
    }>;
  } | null;
  
  // Análise CEO (SNAPSHOT)
  CEOAnalysis: {
    recommendation: string | null;
    keyInsights: string[];
  } | null;
  
  // Estados
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook unificado para buscar modelo completo do ICP ativo
 * MC1[data]: Consome snapshots/sínteses já calculadas, NUNCA recalcula
 */
export function useTenantICP(icpId?: string): TenantICPModel {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['tenant-icp', tenantId, icpId],
    queryFn: async (): Promise<Omit<TenantICPModel, 'isLoading' | 'error'>> => {
      if (!tenantId) {
        console.warn('MC1[data]: tenantId não disponível');
        return {
          profile: null,
          persona: null,
          criteria: null,
          competitiveMatrix: null,
          bcgMatrix: null,
          productMetrics: null,
          strategicPlan: null,
          CEOAnalysis: null,
          isLoading: false,
          error: new Error('Tenant não disponível'),
        };
      }

      console.log(`MC1[data]: carregando modelo completo do ICP para tenant ${tenantId}${icpId ? ` (ICP: ${icpId})` : ''}`);

      // 1. Buscar ICP principal/ativo
      let icpProfile: any = null;
      if (icpId) {
        console.log(`MC1[data]: buscando ICP específico ${icpId}`);
        const { data, error } = await (supabase as any)
          .from('icp_profiles_metadata')
          .select('*')
          .eq('id', icpId)
          .eq('tenant_id', tenantId)
          .maybeSingle();
        
        if (error) {
          console.error('MC1[data]: erro ao buscar ICP específico:', error);
        } else {
          icpProfile = data;
        }
      } else {
        console.log('MC1[data]: buscando ICP principal/ativo');
        // Buscar ICP principal ou ativo
        const { data, error } = await (supabase as any)
          .from('icp_profiles_metadata')
          .select('*')
          .eq('tenant_id', tenantId)
          .or('icp_principal.eq.true,ativo.eq.true')
          .order('icp_principal', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.error('MC1[data]: erro ao buscar ICP ativo:', error);
        } else {
          icpProfile = data;
        }
      }

      if (!icpProfile) {
        console.warn('MC1[data]: nenhum ICP encontrado para o tenant');
        return {
          profile: null,
          persona: null,
          criteria: null,
          competitiveMatrix: null,
          bcgMatrix: null,
          productMetrics: null,
          strategicPlan: null,
          CEOAnalysis: null,
          isLoading: false,
          error: new Error('ICP não encontrado'),
        };
      }

      console.log(`MC1[data]: ICP ativo = ${icpProfile.id} (${icpProfile.nome})`);

      // 2. Buscar dados do onboarding (persona, critérios, concorrentes, BCG)
      console.log('MC1[data]: carregando dados do onboarding');
      const { data: onboardingData, error: onboardingError } = await (supabase as any)
        .from('onboarding_sessions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (onboardingError) {
        console.warn('MC1[data]: erro ao buscar onboarding:', onboardingError);
      }

      const session = onboardingData || null;
      const step1 = session?.step1_data || {};
      const step2 = session?.step2_data || {};
      const step3 = session?.step3_data || {};
      const step4 = session?.step4_data || {};
      const step5 = session?.step5_data || {};

      // 3. Buscar análise competitiva (com fallback)
      console.log('MC1[data]: carregando snapshot competitivo');
      let competitiveMatrix: TenantICPModel['competitiveMatrix'] = null;
      
      // Tentar competitive_analysis primeiro (se existir)
      const { data: competitiveData } = await (supabase as any)
        .from('competitive_analysis')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (competitiveData) {
        console.log('MC1[data]: usando dados de competitive_analysis');
        const competitors = competitiveData.competitor_data || [];
        const totalCapital = competitors.reduce((sum: number, c: any) => sum + (c.capitalSocial || 0), 0);
        const tenantCapital = step1?.capitalSocial || 0;
        const totalMarketCapital = totalCapital + tenantCapital;
        const yourMarketShare = totalMarketCapital > 0 ? (tenantCapital / totalMarketCapital) * 100 : 0;
        
        const sortedCompetitors = [...competitors].sort((a: any, b: any) => (b.capitalSocial || 0) - (a.capitalSocial || 0));
        const allCompanies = [
          { nome: step1?.razaoSocial || 'Sua Empresa', capitalSocial: tenantCapital, isYourCompany: true },
          ...competitors.map((c: any) => ({ ...c, isYourCompany: false }))
        ].sort((a: any, b: any) => (b.capitalSocial || 0) - (a.capitalSocial || 0));
        const yourPosition = allCompanies.findIndex((c: any) => c.isYourCompany) + 1;

        competitiveMatrix = {
          topCompetitors: sortedCompetitors.slice(0, 5).map((c: any) => ({
            nome: c.razaoSocial || c.nome || 'N/A',
            capitalSocial: c.capitalSocial || 0,
            ameacaPotencial: (c.capitalSocial || 0) > tenantCapital * 1.5 ? 'alta' : 
                            (c.capitalSocial || 0) > tenantCapital * 0.5 ? 'media' : 'baixa',
            produtosCount: 0, // Será preenchido depois com produtos
          })),
          totalCapital,
          yourMarketShare,
          yourPosition,
          diferenciais: step4?.diferenciais || [],
          swotAnalysis: competitiveData.swot_analysis || {},
          marketShareAnalysis: competitiveData.market_share_analysis || {},
        };
      } else {
        // Fallback: usar dados do onboarding
        console.log('MC1[data]: usando fallback (onboarding_sessions) para análise competitiva');
        const concorrentes = step1?.concorrentesDiretos || step4?.concorrentesDiretos || [];
        const tenantCapital = step1?.capitalSocial || 0;
        const totalCapital = concorrentes.reduce((sum: number, c: any) => sum + (c.capitalSocial || 0), 0);
        const totalMarketCapital = totalCapital + tenantCapital;
        const yourMarketShare = totalMarketCapital > 0 ? (tenantCapital / totalMarketCapital) * 100 : 0;
        
        const sortedCompetitors = [...concorrentes].sort((a: any, b: any) => (b.capitalSocial || 0) - (a.capitalSocial || 0));
        const allCompanies = [
          { nome: step1?.razaoSocial || 'Sua Empresa', capitalSocial: tenantCapital, isYourCompany: true },
          ...concorrentes.map((c: any) => ({ ...c, isYourCompany: false }))
        ].sort((a: any, b: any) => (b.capitalSocial || 0) - (a.capitalSocial || 0));
        const yourPosition = allCompanies.findIndex((c: any) => c.isYourCompany) + 1;

        competitiveMatrix = {
          topCompetitors: sortedCompetitors.slice(0, 5).map((c: any) => ({
            nome: typeof c === 'string' ? c : (c.razaoSocial || c.nome || 'N/A'),
            capitalSocial: typeof c === 'object' ? (c.capitalSocial || 0) : 0,
            ameacaPotencial: 'media' as const,
            produtosCount: 0,
          })),
          totalCapital,
          yourMarketShare,
          yourPosition,
          diferenciais: step4?.diferenciais || [],
          swotAnalysis: {},
          marketShareAnalysis: {},
        };
      }

      // 4. Buscar produtos para enriquecer competitiveMatrix
      const { data: competitorProducts } = await (supabase as any)
        .from('tenant_competitor_products')
        .select('competitor_cnpj, competitor_name')
        .eq('tenant_id', tenantId);

      if (competitorProducts && competitiveMatrix) {
        const productsByCNPJ = competitorProducts.reduce((acc: Record<string, number>, p: any) => {
          const cnpj = p.competitor_cnpj?.replace(/\D/g, '');
          if (cnpj) {
            acc[cnpj] = (acc[cnpj] || 0) + 1;
          }
          return acc;
        }, {});

        competitiveMatrix.topCompetitors = competitiveMatrix.topCompetitors.map(comp => {
          // Tentar encontrar CNPJ do concorrente (pode estar em step1)
          const concorrente = step1?.concorrentesDiretos?.find((c: any) => 
            (typeof c === 'object' && (c.razaoSocial === comp.nome || c.nome === comp.nome))
          );
          const cnpj = typeof concorrente === 'object' && concorrente?.cnpj 
            ? concorrente.cnpj.replace(/\D/g, '') 
            : null;
          return {
            ...comp,
            produtosCount: cnpj ? (productsByCNPJ[cnpj] || 0) : 0,
          };
        });
      }

      // 5. Buscar Matriz BCG (do onboarding step5)
      console.log('MC1[data]: carregando snapshot BCG');
      let bcgMatrix: TenantICPModel['bcgMatrix'] = null;
      if (step5) {
        const clientesAtuais = step5.clientesAtuais || [];
        const empresasBenchmarking = step5.empresasBenchmarking || [];
        const nichos = step3?.nichosAlvo || [];

        bcgMatrix = {
          priorityNiches: nichos.slice(0, 5).map((nicho: string) => ({
            name: nicho,
            growth: 0, // Placeholder - não recalcular
            marketShare: 0,
            type: 'niche' as const,
          })),
          desiredClients: clientesAtuais.slice(0, 5).map((cliente: any) => ({
            name: typeof cliente === 'string' ? cliente : (cliente.razaoSocial || cliente.nome || 'N/A'),
            growth: 0,
            marketShare: 0,
            revenue: typeof cliente === 'object' ? (cliente.faturamento || 0) : 0,
            type: 'client' as const,
          })),
          benchmarking: empresasBenchmarking.slice(0, 5).map((empresa: any) => ({
            name: typeof empresa === 'string' ? empresa : (empresa.razaoSocial || empresa.nome || 'N/A'),
            growth: 0,
            marketShare: 0,
            type: 'benchmarking' as const,
          })),
        };
      }

      // 6. Buscar métricas de produtos
      console.log('MC1[data]: carregando snapshot produtos');
      const { data: tenantProducts } = await (supabase as any)
        .from('tenant_products')
        .select('nome, categoria')
        .eq('tenant_id', tenantId)
        .eq('ativo', true);

      const { data: competitorProductsFull } = await (supabase as any)
        .from('tenant_competitor_products')
        .select('nome, categoria')
        .eq('tenant_id', tenantId);

      const tenantCategories = new Set((tenantProducts || []).map((p: any) => p.categoria).filter(Boolean));
      const competitorCategories = new Set((competitorProductsFull || []).map((p: any) => p.categoria).filter(Boolean));
      
      // Calcular diferenciais (produtos únicos do tenant)
      const tenantProductNames = new Set((tenantProducts || []).map((p: any) => p.nome?.toLowerCase().trim()));
      const competitorProductNames = new Set((competitorProductsFull || []).map((p: any) => p.nome?.toLowerCase().trim()));
      const differentials = (tenantProducts || [])
        .filter((p: any) => {
          const nome = p.nome?.toLowerCase().trim();
          return nome && !competitorProductNames.has(nome);
        })
        .slice(0, 5)
        .map((p: any) => ({ nome: p.nome, categoria: p.categoria || 'Outros' }));

      // Calcular oportunidades (categorias que concorrentes têm mas tenant não)
      const opportunities = Array.from(competitorCategories)
        .filter(cat => !tenantCategories.has(cat))
        .slice(0, 5)
        .map(cat => ({ categoria: cat, gap: `Tenant não atua nesta categoria` }));

      // Calcular alta concorrência (categorias com muitos concorrentes)
      const categoryCounts = (competitorProductsFull || []).reduce((acc: Record<string, number>, p: any) => {
        const cat = p.categoria || 'Outros';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
      const highCompetition = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, count]) => ({ categoria: cat, competitorCount: count as number }));

      let productMetrics: TenantICPModel['productMetrics'] = null;
      if (tenantProducts || competitorProductsFull) {
        productMetrics = {
          tenantProductsCount: tenantProducts?.length || 0,
          tenantProductsCategories: Array.from(tenantCategories),
          competitorProductsCount: competitorProductsFull?.length || 0,
          competitorProductsCategories: Array.from(competitorCategories),
          differentials,
          opportunities,
          highCompetition,
          totalCategories: new Set([...tenantCategories, ...competitorCategories]).size,
        };
      }

      // 7. Buscar plano estratégico
      console.log('MC1[data]: carregando snapshot plano estratégico');
      const { data: strategicPlanData } = await (supabase as any)
        .from('strategic_action_plans')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let strategicPlan: TenantICPModel['strategicPlan'] = null;
      if (strategicPlanData) {
        strategicPlan = {
          quickWins: strategicPlanData.quick_wins || [],
          criticalDecisions: strategicPlanData.critical_decisions || [],
          investmentSummary: strategicPlanData.investment_summary || {
            shortTerm: 0,
            mediumTerm: 0,
            longTerm: 0,
          },
          actions: (strategicPlanData.actions || []).slice(0, 5).map((a: any) => ({
            title: a.title || a.titulo || 'Ação',
            status: a.status || 'backlog',
            priority: a.priority || a.prioridade || 'medium',
            timeframe: a.timeframe || a.prazo || 'medium',
          })),
        };
      }

      // 8. Buscar análise CEO
      console.log('MC1[data]: carregando snapshot análise CEO');
      let CEOAnalysis: TenantICPModel['CEOAnalysis'] = null;
      
      // Tentar strategic_action_plans primeiro
      if (strategicPlanData?.ceo_recommendation) {
        CEOAnalysis = {
          recommendation: strategicPlanData.ceo_recommendation,
          keyInsights: [],
        };
      } else if (competitiveData?.ceo_analysis) {
        CEOAnalysis = {
          recommendation: competitiveData.ceo_analysis,
          keyInsights: [],
        };
      } else if (icpProfile?.icp_recommendation?.analise_detalhada?.recomendacoes_estrategicas) {
        CEOAnalysis = {
          recommendation: icpProfile.icp_recommendation.analise_detalhada.recomendacoes_estrategicas.join('\n'),
          keyInsights: icpProfile.icp_recommendation.analise_detalhada.padroes_identificados || [],
        };
      }

      // 9. Montar persona e critérios
      const persona = step3 ? {
        decisor: step3.persona?.decisor || step3.persona || null,
        dor_principal: step3.dores?.[0] || step3.dorPrincipal || null,
        objeções: step3.objeções || step3.objecoes || [],
        desejos: step3.desejos || [],
        stack_tech: step3.stackTech || step3.stack_tech || null,
        maturidade_digital: step3.maturidadeDigital || step3.maturidade_digital || null,
        canal_preferido: step3.canalPreferido || step3.canal_preferido || null,
        pitch: step3.pitch || null,
        playbooks: step3.playbooks || [],
      } : null;

      const criteria = step3 ? {
        setores_alvo: step3.setoresAlvo || step2?.setoresAlvo || [],
        cnaes_alvo: step3.cnaesAlvo || [],
        porte: step3.porteAlvo || [],
        regioes_alvo: step3.localizacaoAlvo?.regioes || step3.localizacaoAlvo?.estados || [],
        faturamento_min: step3.faturamentoAlvo?.minimo || null,
        faturamento_max: step3.faturamentoAlvo?.maximo || null,
        funcionarios_min: step3.funcionariosAlvo?.minimo || null,
        funcionarios_max: step3.funcionariosAlvo?.maximo || null,
      } : null;

      console.log('MC1[data]: modelo completo do ICP carregado com sucesso');

      return {
        profile: icpProfile ? {
          id: icpProfile.id,
          nome: icpProfile.nome,
          descricao: icpProfile.descricao,
          tipo: icpProfile.tipo,
          setor_foco: icpProfile.setor_foco,
          nicho_foco: icpProfile.nicho_foco,
          ativo: icpProfile.ativo,
          icp_principal: icpProfile.icp_principal || icpProfile.is_main_icp || false,
          created_at: icpProfile.created_at,
          updated_at: icpProfile.updated_at,
        } : null,
        persona,
        criteria,
        competitiveMatrix,
        bcgMatrix,
        productMetrics,
        strategicPlan,
        CEOAnalysis,
        isLoading: false,
        error: null,
      };
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  if (isLoading || !data) {
    return {
      profile: null,
      persona: null,
      criteria: null,
      competitiveMatrix: null,
      bcgMatrix: null,
      productMetrics: null,
      strategicPlan: null,
      CEOAnalysis: null,
      isLoading: true,
      error: null,
    };
  }

  return {
    ...data,
    isLoading: false,
    error: error as Error | null,
  };
}

