// 🚨 MICROCICLO 2: Bloqueio global de enrichment fora de SALES TARGET
import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isInSalesTargetContext } from '@/lib/utils/enrichmentContextValidator';

interface Company {
  id: string;
  cnpj?: string;
  headquarters_state?: string;
  headquarters_city?: string;
  niche_code?: string;
}

/**
 * Hook para enriquecimento automático de dados da empresa via ReceitaWS
 * Executa automaticamente ao detectar dados faltantes (Estado, Município, Nicho)
 */
export function useAutoEnrichCompany(company?: Company | null) {
  const queryClient = useQueryClient();

  const enrichMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const { data, error } = await supabase.functions.invoke('enrich-company-receita', {
        body: { company_id: companyId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Revalidar queries relacionadas à empresa
      if (company?.id) {
        queryClient.invalidateQueries({ queryKey: ['company', company.id] });
        queryClient.invalidateQueries({ queryKey: ['companies'] });
      }
      
      console.log('✅ Empresa enriquecida automaticamente:', data.enriched_fields);
    },
    onError: (error) => {
      console.error('❌ Erro ao enriquecer empresa:', error);
    },
  });

  useEffect(() => {
    // 🚨 MICROCICLO 2: BLOQUEIO AUTOMÁTICO - Auto-enrichment desativado
    // Enrichment só é permitido em SALES TARGET (Leads Aprovados)
    const isSalesTarget = isInSalesTargetContext();
    
    if (!isSalesTarget) {
      console.log('[useAutoEnrichCompany] 🚫 Auto-enrichment bloqueado - não está em SALES TARGET');
      return;
    }

    // Verificar se precisa enriquecer
    if (!company?.id) return;
    if (enrichMutation.isPending) return;

    // Prioridade: Estado e Município (essenciais para análises)
    const needsEnrichment = 
      !company.headquarters_state || 
      !company.headquarters_city;

    const hasCNPJ = !!company.cnpj;

    // Se precisa enriquecer e tem CNPJ, executar automaticamente (apenas em SALES TARGET)
    if (needsEnrichment && hasCNPJ) {
      console.log('[useAutoEnrichCompany] ✅ Contexto validado - SALES TARGET');
      console.log('🔄 Iniciando enriquecimento automático da empresa (Estado/Município)...');
      enrichMutation.mutate(company.id);
    }
  }, [company?.id, company?.cnpj, company?.headquarters_state, company?.headquarters_city]);

  return {
    isEnriching: enrichMutation.isPending,
    enrichmentError: enrichMutation.error,
  };
}
