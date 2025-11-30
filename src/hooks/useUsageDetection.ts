// src/hooks/useUsageDetection.ts
// Hook para detecção de uso de produtos/serviços (genérico, multi-tenant)

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UsageDetectionParams {
  companyId: string;
  companyName: string;
  companyDomain?: string;
}

export function useUsageDetection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, companyName, companyDomain }: UsageDetectionParams) => {
      const { data, error } = await supabase.functions.invoke('detect-usage', {
        body: {
          company_id: companyId,
          company_name: companyName,
          domain: companyDomain,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
      queryClient.invalidateQueries({ queryKey: ['usage-detection'] });
      
      if (data.status === 'disqualified') {
        toast.error('⛔ EMPRESA DESCARTADA - CLIENTE IDENTIFICADO', {
          description: `Detectado uso de produtos/serviços (Score: ${data.score}/100). ${data.evidences?.length || 0} evidências encontradas.`,
          duration: 8000,
        });
      } else {
        toast.success('✅ Empresa qualificada - Sem uso detectado', {
          description: `Lead válido para prospecção ativa (Score: ${data.score}/100)`,
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao detectar uso', {
        description: error.message,
      });
    },
  });
}

// Alias para compatibilidade (deprecado)
/** @deprecated Use useUsageDetection instead */
export const useTOTVSDetection = useUsageDetection;

