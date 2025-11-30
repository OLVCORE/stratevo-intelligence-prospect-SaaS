// src/hooks/useUsageVerification.ts
// Hook para verificação de uso de produtos/serviços (genérico, multi-tenant)

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UsageVerificationParams {
  companyId?: string;
  companyName?: string;
  cnpj?: string;
  domain?: string;
  tenantId?: string; // tenant_id para análises baseadas no tenant
  enabled?: boolean;
}

export const useUsageVerification = ({
  companyId,
  companyName,
  cnpj,
  domain,
  tenantId,
  enabled = false,
}: UsageVerificationParams) => {
  return useQuery({
    queryKey: ['usage-verification', companyId, companyName, cnpj, tenantId],
    queryFn: async () => {
      console.log('[HOOK] 🚀 Chamando usage-verification...', { 
        companyId, 
        companyName, 
        cnpj, 
        domain,
        tenantId,
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
        const { data, error } = await supabase.functions.invoke('usage-verification', {
          body: {
            company_id: companyId,
            company_name: companyName,
            cnpj,
            domain,
            tenant_id: tenantId, // Passar tenant_id para Edge Function
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
          if (errorBody?.partial_results) {
            console.warn('[HOOK] ⚠️ Retornando resultados parciais devido a erro:', errorBody.partial_results);
            return errorBody.partial_results;
          }
          
          throw error;
        }

        console.log('[HOOK] ✅ Dados recebidos:', {
          hasData: !!data,
          dataKeys: data ? Object.keys(data) : [],
          status: data?.status,
          evidencesCount: data?.evidences?.length || 0,
        });

        return data;
      } catch (err: any) {
        const duration = Date.now() - startTime;
        console.error(`[HOOK] ❌ Erro após ${duration}ms:`, err);
        throw err;
      }
    },
    enabled: enabled && (!!companyName || !!cnpj) && !!tenantId, // Requer tenant_id
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos (ex cacheTime)
  });
};

// 🔄 ALIAS para compatibilidade (deprecado - usar useUsageVerification)
/** @deprecated Use useUsageVerification instead */
export const useSimpleTOTVSCheck = useUsageVerification;

