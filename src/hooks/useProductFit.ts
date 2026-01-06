// src/hooks/useProductFit.ts
// Hook para análise de fit de produtos (substitui useUsageVerification)

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProductFitParams {
  companyId?: string;
  tenantId?: string;
  enabled?: boolean;
}

interface ProductFitResult {
  status: 'success' | 'error';
  fit_score: number; // 0-100
  fit_level: 'high' | 'medium' | 'low';
  products_recommendation: Array<{
    product_id: string;
    product_name: string;
    fit_score: number;
    recommendation: 'high' | 'medium' | 'low';
    justification: string;
    strengths: string[];
    weaknesses: string[];
  }>;
  analysis: {
    tenant_products_count: number;
    analyzed_products_count: number;
    cnae_match: boolean;
    sector_match: boolean;
    website_analysis?: string;
    overall_justification: string;
  };
  metadata: {
    analyzed_at: string;
    ai_model: string;
    confidence: 'high' | 'medium' | 'low';
  };
}

export const useProductFit = ({
  companyId,
  tenantId,
  enabled = false,
}: ProductFitParams) => {
  return useQuery({
    queryKey: ['product-fit', companyId, tenantId],
    refetchOnMount: true, // 🔥 Refetch ao montar
    refetchOnWindowFocus: false, // Não refetch ao focar janela
    refetchOnReconnect: true, // Refetch ao reconectar
    queryFn: async () => {
      // 🔥 VALIDAÇÃO ANTES DE TUDO: Não executar se parâmetros não estiverem disponíveis
      if (!companyId || !tenantId) {
        const errorMsg = 'companyId e tenantId são obrigatórios';
        console.warn('[PRODUCT-FIT-HOOK] ⚠️ Parâmetros não disponíveis:', { 
          companyId: companyId || 'NÃO DISPONÍVEL',
          tenantId: tenantId || 'NÃO DISPONÍVEL',
          enabled 
        });
        // Retornar dados vazios ao invés de lançar erro (evita quebrar o componente)
        return {
          status: 'error' as const,
          error: errorMsg,
          fit_score: 0,
          fit_level: 'low' as const,
          products_recommendation: [],
          analysis: {
            tenant_products_count: 0,
            analyzed_products_count: 0,
            cnae_match: false,
            sector_match: false,
            overall_justification: 'Parâmetros não disponíveis'
          },
          metadata: {
            analyzed_at: new Date().toISOString(),
            ai_model: 'none',
            confidence: 'low' as const
          }
        } as ProductFitResult;
      }

      console.log('[PRODUCT-FIT-HOOK] 🚀 Chamando calculate-product-fit...', { 
        companyId, 
        tenantId,
        enabled 
      });

      console.log('[PRODUCT-FIT-HOOK] 🔍 Invocando Edge Function...');
      const startTime = Date.now();
      
      try {
        const { data, error } = await supabase.functions.invoke('calculate-product-fit', {
          body: {
            company_id: companyId,
            tenant_id: tenantId,
          },
        });
        
        const duration = Date.now() - startTime;
        console.log(`[PRODUCT-FIT-HOOK] ⏱️ Edge Function respondeu em ${duration}ms`);

        if (error) {
          console.error('[PRODUCT-FIT-HOOK] ❌ Erro na Edge Function:', error);
          throw error;
        }

        console.log('[PRODUCT-FIT-HOOK] ✅ Dados recebidos:', {
          hasData: !!data,
          fit_score: data?.fit_score,
          fit_level: data?.fit_level,
          products_count: data?.products_recommendation?.length || 0,
        });

        return data as ProductFitResult;
      } catch (err: any) {
        const duration = Date.now() - startTime;
        console.error(`[PRODUCT-FIT-HOOK] ❌ Erro após ${duration}ms:`, err);
        throw err;
      }
    },
    enabled: enabled && !!companyId && !!tenantId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
  });
};

