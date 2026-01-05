import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useApprovedCompanies(filters?: {
  status?: string;
  temperatura?: string;
  minScore?: number;
}) {
  return useQuery({
    queryKey: ['approved-companies', filters],
    queryFn: async () => {
      // 🎯 BUSCAR EMPRESAS APROVADAS (status='aprovada')
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

      console.log(`[useApprovedCompanies] ✅ ${data?.length || 0} empresas aprovadas encontradas`);
      return data || [];
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
    
    const dealsToCreate = validCompanies.map(q => {
      const rawData: any = {
        ...(q.raw_data || {}),
        ...(q.raw_analysis || {}),
        icp_score: q.icp_score || 0,
        temperatura: q.temperatura || 'cold',
      };

      return {
        title: `Prospecção - ${q.razao_social}`,
        description: `Empresa aprovada com ICP Score: ${q.icp_score || 0}. Temperatura: ${q.temperatura || 'cold'}.`,
        company_id: q.company_id,
        value: 0,
        probability: Math.min(Math.round((q.icp_score || 0) / 100 * 50), 50),
        priority: (q.icp_score || 0) >= 75 ? 'high' : 'medium',
        stage: 'discovery',
        assigned_to: user?.id || null,
        source: 'approved_to_pipeline',
        bitrix24_data: rawData,
        status: 'open',
      };
    });

    const { error: insertError } = await supabase
      .from('sdr_deals')
      .insert(dealsToCreate);

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

