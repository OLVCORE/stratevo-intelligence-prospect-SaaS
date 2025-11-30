import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SimpleTOTVSCheckParams {
  companyId?: string;
  companyName?: string;
  cnpj?: string;
  domain?: string;
  tenantId?: string; // 🔥 NOVO: tenant_id para análises baseadas no tenant
  enabled?: boolean;
}

export const useSimpleTOTVSCheck = ({
  companyId,
  companyName,
  cnpj,
  domain,
  tenantId, // 🔥 NOVO
  enabled = false,
}: SimpleTOTVSCheckParams) => {
  return useQuery({
    queryKey: ['simple-totvs-check', companyId, companyName, cnpj],
    queryFn: async () => {
      console.log('[HOOK] 🚀 Chamando simple-totvs-check...', { 
        companyId, 
        companyName, 
        cnpj, 
        domain,
        enabled 
      });

      if (!companyName && !cnpj) {
        const errorMsg = 'companyName ou cnpj é obrigatório';
        console.error('[HOOK] ❌', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('[HOOK] 🔍 Invocando Edge Function...');
      const startTime = Date.now();
      
      try {
      const { data, error } = await supabase.functions.invoke('simple-totvs-check', {
        body: {
          company_id: companyId,
          company_name: companyName,
          cnpj,
          domain,
          tenant_id: tenantId, // 🔥 NOVO: Passar tenant_id para Edge Function
        },
      });
        
        const duration = Date.now() - startTime;
        console.log(`[HOOK] ⏱️ Edge Function respondeu em ${duration}ms`);

        if (error) {
          console.error('[HOOK] ❌ Erro na Edge Function:', error);
          console.error('[HOOK] ❌ Detalhes do erro:', {
            message: error.message,
            context: error.context,
            name: error.name,
          });
          
          // 🔥 Tentar extrair mais detalhes do erro (status code, body, etc)
          let errorBody: any = null;
          if (error.context && typeof error.context === 'object') {
            try {
              const response = error.context as Response;
              if (response) {
                console.error('[HOOK] ❌ Status da resposta:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('[HOOK] ❌ Body da resposta:', errorText);
                try {
                  errorBody = JSON.parse(errorText);
                } catch {
                  // Não é JSON, ignorar
                }
              }
            } catch (e) {
              console.error('[HOOK] ⚠️ Não foi possível ler detalhes do erro:', e);
            }
          }
          
          // 🔥 Se houver resultados parciais salvos, retornar eles em vez de erro
          if (errorBody?.partial_results?.saved && errorBody?.partial_results?.evidences) {
            console.log('[HOOK] ✅ Resultados parciais encontrados, retornando dados salvos');
            return {
              data: {
                status: errorBody.partial_results.triple_matches > 0 || errorBody.partial_results.double_matches > 0 ? 'likely' : 'unlikely',
                confidence: errorBody.partial_results.triple_matches > 0 ? 'high' : 'medium',
                evidences: errorBody.partial_results.evidences,
                triple_matches: errorBody.partial_results.triple_matches,
                double_matches: errorBody.partial_results.double_matches,
                single_matches: 0,
                total_weight: errorBody.partial_results.evidences.reduce((sum: number, e: any) => sum + (e.weight || 0), 0),
                _partial: true, // Flag para indicar que são resultados parciais
                _message: 'Verificação interrompida por limite de memória, mas resultados parciais foram salvos.'
              }
            };
          }
          
          // 🔥 Se for erro de CORS, dar mensagem mais clara
          if (error.message?.includes('CORS') || error.message?.includes('Failed to send') || error.message?.includes('ERR_FAILED')) {
            const corsError = new Error('Erro de CORS: Não foi possível conectar ao servidor. Tente limpar o cache do navegador (Ctrl+Shift+Delete) e recarregar a página.');
            (corsError as any).isCorsError = true;
            throw corsError;
          }
          
          // 🔥 Se for timeout ou status 546 (erro interno do Supabase)
          if (error.message?.includes('non-2xx') || duration > 50000 || errorBody?.code === 'WORKER_LIMIT') {
            const timeoutError = new Error(
              errorBody?.code === 'WORKER_LIMIT' 
                ? 'Limite de memória atingido: A verificação foi interrompida. Resultados parciais podem ter sido salvos. Verifique o relatório ou tente novamente.'
                : `A verificação está demorando muito (${Math.round(duration/1000)}s). Isso pode indicar um timeout ou erro interno. Verifique os logs da Edge Function no Dashboard do Supabase.`
            );
            (timeoutError as any).isTimeoutError = true;
            throw timeoutError;
          }
          
          throw error;
        }
        
        console.log('[HOOK] ✅ Resposta recebida:', data);
        
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
        
        console.log('[HOOK] ✅ Resultado final retornado');
        return data;
      } catch (err: any) {
        const duration = Date.now() - startTime;
        console.error(`[HOOK] ❌ Erro após ${duration}ms:`, err);
        
        // 🔥 Re-throw para que o React Query trate
        throw err;
      }
    },
    enabled: enabled && (!!companyName || !!cnpj),
    staleTime: 0,                    // 🔥 SEMPRE considerar stale (permitir refetch forçado)
    gcTime: 1000 * 60 * 60 * 24,    // 24h em cache (mas pode ser removido manualmente)
    refetchOnMount: false,           // ❌ NÃO refetch ao montar!
    refetchOnWindowFocus: false,     // ❌ NÃO refetch ao trocar aba!
    retry: 2,                        // 🔄 Tentar 2 vezes em caso de erro
    retryDelay: 1000,                // ⏱️ Esperar 1s entre tentativas
  });
};
