// 🚨 MICROCICLO 2: Bloqueio global de enrichment fora de SALES TARGET
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isInSalesTargetContext } from '@/lib/utils/enrichmentContextValidator';

export interface AutoEnrichResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{
    company_id: string;
    company_name: string;
    error: string;
  }>;
}

export function useAutoEnrich() {
  return useMutation({
    mutationFn: async () => {
      // 🚨 MICROCICLO 2: VALIDAÇÃO DE CONTEXTO OBRIGATÓRIA
      const isSalesTarget = isInSalesTargetContext();
      if (!isSalesTarget) {
        const errorMessage = 'Auto-Enrich bloqueado. Disponível apenas para Leads Aprovados (Sales Target).';
        console.error('[Auto-Enrich] 🚫 BLOQUEADO:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('[Auto-Enrich] ✅ Contexto validado - SALES TARGET');
      console.log('[Auto-Enrich] Iniciando processo manual');
      
      const { data, error } = await supabase.functions.invoke('auto-enrich-companies', {
        body: {}
      });

      if (error) throw error;
      return data as AutoEnrichResult;
    },
    onSuccess: (data) => {
      if (data.success > 0) {
        toast.success('🔄 Auto-Enriquecimento Concluído', {
          description: `${data.success} empresas enriquecidas com sucesso${data.failed > 0 ? ` (${data.failed} falharam)` : ''}`,
        });
      } else {
        toast.info('ℹ️ Auto-Enriquecimento', {
          description: 'Nenhuma empresa necessita enriquecimento no momento',
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Erro no auto-enriquecimento', {
        description: error.message,
      });
    },
  });
}
