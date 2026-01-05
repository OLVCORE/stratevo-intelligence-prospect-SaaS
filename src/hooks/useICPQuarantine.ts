import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { MC8MatchAssessment, ICPReportRow } from '@/types/icp';
import { normalizeFromICPResults } from '@/lib/utils/companyDataNormalizer';

export const ICP_QUARANTINE_QUERY_KEY = ['icp-quarantine'];

// Hook para salvar resultados na quarentena
export function useSaveToQuarantine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (results: any[]) => {
      // 🔥 CORRIGIDO: Buscar tenant_id para cada registro
      const { data: { user } } = await supabase.auth.getUser();
      let tenantId: string | null = null;
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        tenantId = userData?.tenant_id || null;
      }
      
      // Se não encontrou via user, tentar via company_id
      if (!tenantId && results.length > 0 && results[0].company_id) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('tenant_id')
          .eq('id', results[0].company_id)
          .maybeSingle();
        tenantId = companyData?.tenant_id || null;
      }

      const records = results.map(r => ({
        company_id: r.company_id,
        tenant_id: tenantId || r.tenant_id, // 🔥 CORRIGIDO: Incluir tenant_id
        cnpj: r.cnpj,
        razao_social: r.name,
        icp_score: r.icp_score || 0,
        temperatura: r.temperatura || 'cold',
        status: r.encontrou_totvs ? 'descartada' : 'pendente',
        motivo_descarte: r.encontrou_totvs ? 'Cliente TOTVS detectado' : null,
        evidencias_totvs: r.evidencias || [],
        breakdown: r.breakdown || {},
        motivos: r.motivos || [],
        raw_analysis: r,
      }));

      const { error } = await supabase
        .from('icp_analysis_results')
        .insert(records);

      if (error) throw error;
      return records;
    },
    onSuccess: (data) => {
      const aprovadas = data.filter(d => d.status === 'pendente').length;
      const descartadas = data.filter(d => d.status === 'descartada').length;
      
      toast.success('Análise salva na quarentena', {
        description: `${aprovadas} pendentes | ${descartadas} descartadas`,
      });
      
      queryClient.invalidateQueries({ queryKey: ICP_QUARANTINE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['icp-stats'] });
    },
    onError: (error: any) => {
      const message = String(error?.message || '');
      const code = (error as any)?.code;
      if (code === '23505' || /duplicate key value/i.test(message)) {
        toast.error('CNPJ duplicado', {
          description: 'Este CNPJ já existe na quarentena. O registro foi ignorado.',
        });
      } else {
        toast.error('Erro ao salvar na quarentena', {
          description: message,
        });
      }
    },
  });
}

// MC8: Função auxiliar para buscar ICP Report por CNPJ e extrair mc8Assessment
async function fetchMC8AssessmentForCNPJ(cnpj: string, tenantId: string): Promise<MC8MatchAssessment | undefined> {
  if (!cnpj || !tenantId) return undefined;

  try {
    // Buscar ICP Reports do tenant
    const { data: reports, error } = await supabase
      .from('icp_reports')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .order('generated_at', { ascending: false })
      .limit(50); // Limitar para performance

    if (error || !reports) return undefined;

    // Procurar report que tenha o CNPJ no report_data
    const cnpjClean = cnpj.replace(/\D/g, '');
    
    for (const report of reports as ICPReportRow[]) {
      const reportData = report.report_data as any;
      
      // Verificar em diferentes lugares do report_data
      const reportCNPJ = 
        reportData?.icp_metadata?.cnpj ||
        reportData?.onboarding_data?.step1_DadosBasicos?.cnpj;
      
      if (reportCNPJ) {
        const reportCNPJClean = String(reportCNPJ).replace(/\D/g, '');
        if (reportCNPJClean === cnpjClean) {
          // Encontrou! Retornar mc8Assessment se existir
          return reportData?.mc8Assessment as MC8MatchAssessment | undefined;
        }
      }
    }

    return undefined;
  } catch (error) {
    console.error('[MC8] Erro ao buscar assessment:', error);
    return undefined;
  }
}

// Hook para buscar empresas na quarentena
export function useQuarantineCompanies(filters?: {
  status?: string;
  temperatura?: string;
  minScore?: number;
}) {
  return useQuery({
    queryKey: [...ICP_QUARANTINE_QUERY_KEY, filters],
    queryFn: async () => {
      // MC8: Obter tenantId do contexto
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        let query = supabase
          .from('icp_analysis_results')
          .select(`
            *,
            website_encontrado,
            website_fit_score,
            website_products_match,
            linkedin_url,
            purchase_intent_score
          `)
          .order('icp_score', { ascending: false });

        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.temperatura) {
          query = query.eq('temperatura', filters.temperatura);
        }
        if (filters?.minScore) {
          query = query.gte('icp_score', filters.minScore);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      }

      // Buscar tenant_id do usuário
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      const tenantId = userData?.tenant_id;

      let query = supabase
        .from('icp_analysis_results')
        .select(`
          *,
          website_encontrado,
          website_fit_score,
          website_products_match,
          linkedin_url,
          purchase_intent_score
        `)
        .order('icp_score', { ascending: false });

      // 🔥 CORRIGIDO: Filtrar por tenant_id para isolamento multi-tenant
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.temperatura) {
        query = query.eq('temperatura', filters.temperatura);
      }
      if (filters?.minScore) {
        query = query.gte('icp_score', filters.minScore);
      }

      const { data, error } = await query;
      if (error) throw error;

      // 🔧 NORMALIZAR DADOS usando normalizador universal
      const normalizedData = (data || []).map((item: any) => {
        const normalized = normalizeFromICPResults(item);
        return {
          ...normalized,
          ...item, // Preservar campos adicionais que não estão no normalizador
        };
      });

      // MC8: Enriquecer com mc8Assessment para cada empresa
      if (tenantId && normalizedData && normalizedData.length > 0) {
        const enrichedData = await Promise.all(
          normalizedData.map(async (item: any) => {
            // Buscar mc8Assessment se houver CNPJ
            if (item.cnpj) {
              const mc8Assessment = await fetchMC8AssessmentForCNPJ(item.cnpj, tenantId);
              return {
                ...item,
                mc8Assessment,
                // MC8: Tentar encontrar icpReportId (buscar o report mais recente com esse CNPJ)
                icpReportId: mc8Assessment ? await findICPReportIdByCNPJ(item.cnpj, tenantId) : undefined,
              };
            }
            return item;
          })
        );
        return enrichedData;
      }

      return normalizedData;
    },
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
    refetchOnWindowFocus: true,
  });
}

// MC8: Função auxiliar para encontrar icpReportId por CNPJ
async function findICPReportIdByCNPJ(cnpj: string, tenantId: string): Promise<string | undefined> {
  if (!cnpj || !tenantId) return undefined;

  try {
    const { data: reports } = await supabase
      .from('icp_reports')
      .select('id, report_data')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .order('generated_at', { ascending: false })
      .limit(50);

    if (!reports) return undefined;

    const cnpjClean = cnpj.replace(/\D/g, '');
    
    for (const report of reports as ICPReportRow[]) {
      const reportData = report.report_data as any;
      const reportCNPJ = 
        reportData?.icp_metadata?.cnpj ||
        reportData?.onboarding_data?.step1_DadosBasicos?.cnpj;
      
      if (reportCNPJ) {
        const reportCNPJClean = String(reportCNPJ).replace(/\D/g, '');
        if (reportCNPJClean === cnpjClean) {
          return report.id;
        }
      }
    }

    return undefined;
  } catch (error) {
    console.error('[MC8] Erro ao buscar icpReportId:', error);
    return undefined;
  }
}

// Hook para aprovar empresas em batch
export function useApproveQuarantineBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (analysisIds: string[]) => {
      const ids = (analysisIds || []).filter((id): id is string => Boolean(id));
      if (ids.length === 0) throw new Error('Nenhuma empresa selecionada');

      // 🔥 CORRIGIDO: Buscar tenant_id do usuário para filtrar
      const { data: { user } } = await supabase.auth.getUser();
      let tenantId: string | null = null;
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        tenantId = userData?.tenant_id || null;
      }

      // 1. Buscar dados das empresas por ID da análise (filtrando por tenant_id)
      let query = supabase
        .from('icp_analysis_results')
        .select('*')
        .in('id', ids);
      
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      const { data: quarantineData, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      if (!quarantineData || quarantineData.length === 0) throw new Error('Nenhuma empresa encontrada');

      // 2. Validar dados obrigatórios e separar empresas válidas
      const validCompanies = quarantineData.filter(q => 
        q.cnpj && 
        q.cnpj.trim() !== '' && 
        q.razao_social && 
        q.razao_social.trim() !== ''
      );

      const invalidCompanies = quarantineData.filter(q => 
        !q.cnpj || 
        q.cnpj.trim() === '' || 
        !q.razao_social || 
        q.razao_social.trim() === ''
      );

      if (validCompanies.length === 0) {
        throw new Error('Nenhuma empresa possui dados válidos (CNPJ e Razão Social são obrigatórios)');
      }

      // 3. CRIAR DEALS DIRETAMENTE (leads_pool foi eliminado)
      // Buscar current user para atribuir deals (reutilizar user já obtido acima)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // ✅ PRESERVAR TODOS OS DADOS ENRIQUECIDOS ao criar deals
      const dealsToCreate = validCompanies.map(q => {
        const rawData: any = {
          ...(q.raw_data || {}),
          ...(q.raw_analysis || {}),
          // Preservar dados de enriquecimento de website
          website_enrichment: q.website_encontrado ? {
            website_encontrado: q.website_encontrado,
            website_fit_score: q.website_fit_score,
            website_products_match: q.website_products_match,
            linkedin_url: q.linkedin_url,
          } : undefined,
          // Preservar fit_score e grade se existirem
          fit_score: (q.raw_data as any)?.fit_score || (q.raw_analysis as any)?.fit_score,
          grade: (q.raw_data as any)?.grade || (q.raw_analysis as any)?.grade,
          icp_id: (q.raw_data as any)?.icp_id || (q.raw_analysis as any)?.icp_id,
          // Preservar dados de enriquecimento da Receita Federal
          receita_federal: (q.raw_data as any)?.receita_federal || (q.raw_analysis as any)?.receita_federal,
          // Preservar dados de enriquecimento do Apollo
          apollo: (q.raw_data as any)?.apollo || (q.raw_analysis as any)?.apollo,
          // Metadados adicionais
          icp_score: q.icp_score || 0,
          temperatura: q.temperatura || 'cold',
        };

        return {
          title: `Prospecção - ${q.razao_social}`,
          description: `Empresa aprovada da quarentena com ICP Score: ${q.icp_score || 0}. Temperatura: ${q.temperatura || 'cold'}. Website: ${q.website_encontrado || 'N/A'}. LinkedIn: ${q.linkedin_url || 'N/A'}.`,
          company_id: q.company_id,
          value: 0, // Será preenchido depois pelo vendedor
          probability: Math.min(Math.round((q.icp_score || 0) / 100 * 50), 50), // ICP Score → probabilidade inicial
          priority: (q.icp_score || 0) >= 75 ? 'high' : 'medium',
          stage: 'discovery', // Primeiro estágio do pipeline
          assigned_to: currentUser?.id || null,
          source: 'quarantine_approval',
          bitrix24_data: rawData,
          status: 'open',
        };
      });

      const { error: insertError } = await supabase
        .from('sdr_deals')
        .insert(dealsToCreate);

      if (insertError) throw insertError;

      // 4. Atualizar status na quarentena para empresas válidas
      const validIds = validCompanies.map(q => q.id);
      const { error: updateError } = await supabase
        .from('icp_analysis_results')
        .update({ status: 'aprovada' })
        .in('id', validIds);

      if (updateError) throw updateError;

      // 5. Marcar empresas inválidas como "dados_incompletos"
      if (invalidCompanies.length > 0) {
        const invalidIds = invalidCompanies.map(q => q.id);
        await supabase
          .from('icp_analysis_results')
          .update({ 
            status: 'pendente',
            motivo_descarte: 'Dados incompletos (CNPJ ou Razão Social ausentes)'
          })
          .in('id', invalidIds);
      }

      // 6. Retornar resultado
      return {
        approved: validCompanies.length,
        dealsCreated: validCompanies.length, // Todos viram deals agora
        invalid: invalidCompanies.length,
        invalidNames: invalidCompanies.map(c => c.razao_social || 'Sem nome').slice(0, 5)
      };
    },
    onSuccess: (data) => {
      const mainMessage = `${data.approved} empresas aprovadas | ${data.dealsCreated} deals criados no Pipeline (Discovery)`;
      
      const warningMessage = data.invalid > 0
        ? ` | ⚠️ ${data.invalid} empresas com dados incompletos (não aprovadas)`
        : '';

      toast.success('Empresas aprovadas com sucesso!', {
        description: mainMessage + warningMessage,
        duration: 5000,
      });

      if (data.invalid > 0 && data.invalidNames.length > 0) {
        toast.warning('Empresas não aprovadas:', {
          description: `${data.invalidNames.join(', ')}${data.invalid > 5 ? ' e outras...' : ''} - Dados incompletos`,
          duration: 7000,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ICP_QUARANTINE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['approved-companies'] }); // ✅ INVALIDAR LEADS APROVADOS
      queryClient.invalidateQueries({ queryKey: ['leads-pool'] });
      queryClient.invalidateQueries({ queryKey: ['sdr-deals'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao aprovar empresas', {
        description: error.message,
      });
    },
  });
}

// Hook para descartar empresa
export function useRejectQuarantine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ analysisId, motivo }: { analysisId: string; motivo: string }) => {
      // Atualiza o registro da análise por ID
      const { error } = await supabase
        .from('icp_analysis_results')
        .update({ 
          status: 'descartada',
          motivo_descarte: motivo,
        })
        .eq('id', analysisId);

      if (error) throw error;

      // Buscar company_id (se existir) para marcar empresa como desqualificada
      const { data: record } = await supabase
        .from('icp_analysis_results')
        .select('company_id')
        .eq('id', analysisId)
        .single();

      if (record?.company_id) {
        await supabase
          .from('companies')
          .update({
            is_disqualified: true,
            disqualification_reason: motivo,
          })
          .eq('id', record.company_id);
      }
    },
    onSuccess: () => {
      toast.success('Empresa descartada');
      queryClient.invalidateQueries({ queryKey: ICP_QUARANTINE_QUERY_KEY });
    },
    onError: (error: any) => {
      toast.error('Erro ao descartar', {
        description: error.message,
      });
    },
  });
}

// Hook para aprovação automática baseada em regras
export function useAutoApprove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rules: {
      minScore?: number;
      temperatura?: 'hot' | 'warm' | 'cold';
      autoCreateDeals?: boolean;
    }) => {
      // 🔥 CORRIGIDO: Buscar tenant_id do usuário para filtrar
      const { data: { user } } = await supabase.auth.getUser();
      let tenantId: string | null = null;
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('tenant_id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        tenantId = userData?.tenant_id || null;
      }

      let query = supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('status', 'pendente');
      
      // 🔥 CORRIGIDO: Filtrar por tenant_id
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      if (rules.minScore) {
        query = query.gte('icp_score', rules.minScore);
      }
      if (rules.temperatura) {
        query = query.eq('temperatura', rules.temperatura);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) {
        return { approved: 0, deals: 0 };
      }

      const analysisIds = data.map(d => d.id);

      // Aprovar usando o batch (usando origem válida do constraint)
      const leadsToInsert = data.map(q => ({
        company_id: q.company_id,
        cnpj: q.cnpj,
        razao_social: q.razao_social,
        icp_score: q.icp_score,
        temperatura: q.temperatura,
        status: 'pool',
        source: 'icp_auto_approval',
        origem: 'icp_massa', // Valor válido do constraint
        raw_data: q.raw_analysis,
      }));

      await supabase.from('leads_pool').insert(leadsToInsert);
      await supabase
        .from('icp_analysis_results')
        .update({ status: 'aprovada' })
        .in('id', analysisIds);

      let dealsCreated = 0;
      if (rules.autoCreateDeals) {
        const dealsToCreate = data.map(lead => ({
          company_id: lead.company_id,
          deal_title: `Auto - ${lead.razao_social}`,
          deal_stage: 'discovery',
          priority: lead.icp_score >= 75 ? 'high' : 'medium',
          deal_value: lead.icp_score >= 85 ? 100000 : 50000,
          probability: Math.round(lead.icp_score * 0.8),
          source: 'icp_auto_approval',
          lead_score: lead.icp_score,
        }));

        const { data: dealsData } = await supabase
          .from('sdr_deals')
          .insert(dealsToCreate)
          .select('id');

        dealsCreated = dealsData?.length || 0;
      }

      return { approved: data.length, deals: dealsCreated };
    },
    onSuccess: (data) => {
      toast.success('Aprovação automática concluída', {
        description: data.deals > 0
          ? `${data.approved} aprovadas | ${data.deals} deals criados`
          : `${data.approved} empresas aprovadas`,
      });
      
      queryClient.invalidateQueries({ queryKey: ICP_QUARANTINE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['leads-pool'] });
      queryClient.invalidateQueries({ queryKey: ['sdr-deals'] });
    },
  });
}
