/**
 * Hook para sincronizar empresas com o Data Enrich (Lovable) via enrich-batch.
 * Usado automaticamente em "Enviar para Banco de Empresas" (QualifiedProspectsStock).
 * Pode ser reutilizado em outros fluxos (ex.: Base de Empresas, import em lote).
 */

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { enrichBatch, isDataEnrichConfigured, type EnrichBatchCompany } from '@/services/dataEnrichApi';

export function useSyncToDataEnrich() {
  return useMutation({
    mutationFn: async (companies: EnrichBatchCompany[]) => {
      if (!isDataEnrichConfigured()) {
        throw new Error('VITE_DATAENRICH_API_KEY não configurada');
      }
      return enrichBatch(companies);
    },
    onSuccess: (data, variables) => {
      const count = variables.length;
      if (data?.success) {
        toast.success(`${count} empresa(s) enviada(s) para Data Enrich`, {
          description: 'Enriquecimento de decisores em andamento (Apollo/Lusha).',
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Falha ao sincronizar com Data Enrich', {
        description: error.message,
      });
    },
  });
}
