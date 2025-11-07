import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SimpleTOTVSCheckParams {
  companyId?: string;
  companyName?: string;
  cnpj?: string;
  domain?: string;
  enabled?: boolean;
}

export const useSimpleTOTVSCheck = ({
  companyId,
  companyName,
  cnpj,
  domain,
  enabled = false,
}: SimpleTOTVSCheckParams) => {
  return useQuery({
    queryKey: ['simple-totvs-check', companyId, companyName, cnpj],
    queryFn: async () => {
      console.log('[HOOK] Chamando simple-totvs-check...');

      const { data, error } = await supabase.functions.invoke('simple-totvs-check', {
        body: {
          company_id: companyId,
          company_name: companyName,
          cnpj,
          domain,
        },
      });

      if (error) {
        console.error('[HOOK] Erro:', error);
        throw error;
      }

      console.log('[HOOK] Resultado:', data);
      
      // 💾 AUTO-SALVAR NO HISTÓRICO STC + FULL_REPORT (evitar desperdício de créditos!)
      if (data && companyId) {
        try {
          const result = data.data || data;
          
          // 1) Salvar na tabela simple_totvs_checks (já existe)
          const { error: insertError } = await supabase.from('stc_verification_history').insert({
            company_id: companyId,
            company_name: companyName || 'N/A',
            cnpj: cnpj || null,
            status: result.status || 'unknown',
            confidence: result.confidence || 'low',
            triple_matches: result.triple_matches || 0,
            double_matches: result.double_matches || 0,
            single_matches: result.single_matches || 0,
            total_score: result.total_weight || 0,
            evidences: result.evidences || [],
            sources_consulted: result.methodology?.searched_sources || 0,
            queries_executed: result.methodology?.total_queries || 0,
            verification_duration_ms: parseInt(result.methodology?.execution_time) || 0
          });
          
          if (insertError) {
            if (insertError.code === 'PGRST116' || insertError.message?.includes('does not exist')) {
              console.warn('[STC] Tabela stc_verification_history não existe (OK - histórico desabilitado)');
            } else {
              console.warn('[STC] Erro ao salvar histórico:', insertError.message);
            }
          } else {
            console.log('[STC] ✅ Verificação salva no histórico');
          }
          
          // 2) 💾 CRÍTICO: Salvar também em full_report.detection_report
          // Isso garante que dados não serão perdidos e créditos não serão desperdiçados!
          const { data: existingReport } = await supabase
            .from('stc_verification_history')
            .select('id, full_report')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (existingReport) {
            const updatedFullReport = {
              ...(existingReport.full_report || {}),
              detection_report: result // 🔥 SALVA RESULTADO COMPLETO AQUI!
            };
            
            await supabase
              .from('stc_verification_history')
              .update({ full_report: updatedFullReport })
              .eq('id', existingReport.id);
            
            console.log('[STC] 💾 TOTVS Check salvo em full_report.detection_report');
          }
        } catch (historyError: any) {
          console.warn('[STC] ⚠️ Erro ao salvar histórico (não crítico):', historyError.message);
          // Não falha a verificação se salvar histórico falhar
        }
      }
      
      return data;
    },
    enabled: enabled && (!!companyName || !!cnpj),
    staleTime: 1000 * 60 * 60 * 24, // ⚡ 24 HORAS (não reconsumir!)
    gcTime: 1000 * 60 * 60 * 24,    // 24h em cache
    refetchOnMount: false,           // ❌ NÃO refetch ao montar!
    refetchOnWindowFocus: false,     // ❌ NÃO refetch ao trocar aba!
  });
};
