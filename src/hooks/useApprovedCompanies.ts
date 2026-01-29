import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Tipo unificado para linha de Leads Aprovados (icp_analysis_results ou fallback companies) */
export type ApprovedCompanyRow = {
  id: string;
  company_id: string | null;
  cnpj: string;
  razao_social: string;
  icp_score?: number;
  temperatura?: string;
  status?: string;
  raw_data?: Record<string, unknown>;
  website?: string | null;
  industry?: string | null;
  decision_makers_count?: number;
  _from_fallback?: boolean;
  [key: string]: unknown;
};

export function useApprovedCompanies(filters?: {
  status?: string;
  temperatura?: string;
  minScore?: number;
}) {
  return useQuery({
    queryKey: ['approved-companies', filters],
    queryFn: async (): Promise<ApprovedCompanyRow[]> => {
      // 🎯 BUSCAR EMPRESAS APROVADAS (status='aprovada') — select * evita erro em colunas opcionais
      let query = supabase
        .from('icp_analysis_results')
        .select('*')
        .eq('status', 'aprovada'); // ✅ APENAS APROVADAS

      // Aplicar filtros adicionais
      if (filters?.temperatura) {
        query = query.eq('temperatura', filters.temperatura);
      }

      if (filters?.minScore !== undefined) {
        query = query.gte('icp_score', filters.minScore);
      }

      const { data, error } = await query.order('icp_score', { ascending: false });

      if (error) {
        console.error('[useApprovedCompanies] Erro:', error);
        throw error;
      }

      const approved = (data || []) as ApprovedCompanyRow[];
      if (approved.length > 0) {
        console.log(`[useApprovedCompanies] ✅ ${approved.length} empresas aprovadas encontradas`);
        return approved;
      }

      // Sem fallback: quando 0 aprovadas, retornar lista vazia.
      // Assim, após "Enviar ao pipeline", as linhas saem da lista (status vira 'pipeline')
      // e a tabela fica zerada — os deals aparecem no SDR Workspace.
      // Evita exibir empresas da Base como se fossem aprovadas (ids eram company_id,
      // causando 406 / "Empresa não encontrada" em enriquecimento).
      console.log('[useApprovedCompanies] ✅ 0 empresas aprovadas (nenhum pendente de envio ao pipeline)');
      return [];
    },
    staleTime: 30000, // 30 segundos
    refetchOnWindowFocus: true,
  });
}

// Hook para enviar aprovadas para o pipeline (criar deals)
export function useSendToPipeline() {
  return async (analysisIds: string[]) => {
    const ids = (analysisIds || []).filter((id): id is string => Boolean(id));
    if (ids.length === 0) throw new Error('Nenhuma empresa selecionada');

    // 1. Buscar dados das empresas aprovadas
    const { data: approvedData, error: fetchError } = await supabase
      .from('icp_analysis_results')
      .select('*')
      .in('id', ids);

    if (fetchError) throw fetchError;
    if (!approvedData || approvedData.length === 0) throw new Error('Nenhuma empresa encontrada');

    // 2. Validar dados obrigatórios
    const validCompanies = approvedData.filter(q => 
      q.cnpj && 
      q.cnpj.trim() !== '' && 
      q.razao_social && 
      q.razao_social.trim() !== ''
    );

    if (validCompanies.length === 0) {
      throw new Error('Nenhuma empresa com dados válidos (CNPJ e Razão Social obrigatórios)');
    }

    // 3. CRIAR DEALS (transferência para pipeline)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Schema sdr_deals (tabela real): title, stage, value, assigned_to
    type SdrDealInsert = {
      title: string;
      description: string | null;
      company_id: string | null;
      value: number;
      probability: number;
      stage: string;
      assigned_to: string | null;
      source?: string;
      bitrix24_data?: Record<string, unknown>;
      status?: string;
    };

    const dealsToCreate: SdrDealInsert[] = validCompanies.map(q => {
      const rawData: Record<string, unknown> = {
        ...(typeof q.raw_data === 'object' && q.raw_data !== null ? (q.raw_data as Record<string, unknown>) : {}),
        ...(typeof (q as Record<string, unknown>).raw_analysis === 'object' && (q as Record<string, unknown>).raw_analysis !== null ? ((q as Record<string, unknown>).raw_analysis as Record<string, unknown>) : {}),
        icp_score: q.icp_score || 0,
        temperatura: q.temperatura || 'cold',
      };

      return {
        title: `Prospecção - ${q.razao_social}`,
        description: `Empresa aprovada com ICP Score: ${q.icp_score || 0}. Temperatura: ${q.temperatura || 'cold'}.`,
        company_id: q.company_id,
        value: 0,
        probability: Math.min(Math.round((q.icp_score || 0) / 100 * 50), 50),
        stage: 'lead',
        assigned_to: user?.id ?? null,
        source: 'approved_to_pipeline',
        bitrix24_data: rawData,
        status: 'open',
      };
    });

    const { error: insertError } = await supabase
      .from('sdr_deals')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(dealsToCreate as any);

    if (insertError) throw insertError;

    // 4. Atualizar status para 'pipeline' (transferência!)
    const validIds = validCompanies.map(q => q.id);
    const { error: updateError } = await supabase
      .from('icp_analysis_results')
      .update({ 
        status: 'pipeline', // ✅ NOVO STATUS!
        pipeline_sent_at: new Date().toISOString()
      })
      .in('id', validIds);

    if (updateError) throw updateError;

    return {
      sent: validCompanies.length,
      dealsCreated: validCompanies.length,
      skipped: approvedData.length - validCompanies.length
    };
  };
}

