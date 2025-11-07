import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para RESTAURAR empresas descartadas de volta para a quarentena
 * Use case: Empresas foram auto-descartadas pelo batch mas não deveriam
 */
export function useRestoreDiscarded() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (discardedIds: string[]) => {
      console.log(`[RESTORE] 🔄 Restaurando ${discardedIds.length} empresas...`);

      for (const discardedId of discardedIds) {
        // 1. Buscar dados da empresa descartada
        const { data: discarded, error: fetchError } = await supabase
          .from('discarded_companies')
          .select('*')
          .eq('id', discardedId)
          .single();

        if (fetchError || !discarded) {
          console.error(`[RESTORE] ❌ Erro ao buscar empresa ${discardedId}:`, fetchError);
          continue;
        }

        console.log(`[RESTORE] 📦 Restaurando: ${discarded.company_name}`);

        // 2. Restaurar para quarentena
        if (discarded.company_id) {
          // Se tem company_id, atualizar status em icp_analysis_results
          const { error: updateError } = await supabase
            .from('icp_analysis_results')
            .update({ status: 'pendente' })
            .eq('company_id', discarded.company_id);

          if (updateError) {
            console.error(`[RESTORE] ❌ Erro ao restaurar ${discarded.company_name}:`, updateError);
            continue;
          }
        } else {
          // Se não tem company_id, criar novo registro na quarentena
          const { error: insertError } = await supabase
            .from('icp_analysis_results')
            .insert({
              cnpj: discarded.cnpj,
              razao_social: discarded.company_name,
              status: 'pendente',
              icp_score: discarded.original_icp_score || 0,
              temperatura: discarded.original_icp_temperature || 'cold',
              analysis_data: {
                restored_from_discard: true,
                restored_at: new Date().toISOString(),
                previous_discard_reason: discarded.discard_reason_label,
              },
            });

          if (insertError) {
            console.error(`[RESTORE] ❌ Erro ao criar registro de ${discarded.company_name}:`, insertError);
            continue;
          }
        }

        // 3. Remover de descartadas
        const { error: deleteError } = await supabase
          .from('discarded_companies')
          .delete()
          .eq('id', discardedId);

        if (deleteError) {
          console.error(`[RESTORE] ❌ Erro ao remover de descartadas:`, deleteError);
        }

        console.log(`[RESTORE] ✅ ${discarded.company_name} restaurada para quarentena`);
      }

      return { restored: discardedIds.length };
    },
    onSuccess: (data) => {
      toast.success(`✅ ${data.restored} empresa(s) restaurada(s) para quarentena!`, {
        description: 'As empresas voltaram para a lista de pendentes.',
        duration: 5000,
      });

      // Invalidar queries para recarregar dados
      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
      queryClient.invalidateQueries({ queryKey: ['discarded-companies'] });
    },
    onError: (error: any) => {
      console.error('[RESTORE] ❌ Erro ao restaurar empresas:', error);
      toast.error('Erro ao restaurar empresas', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook para RESTAURAR TODAS as empresas descartadas automaticamente pelo batch
 */
export function useRestoreAllBatchDiscarded() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('[RESTORE-ALL] 🔄 Buscando empresas auto-descartadas pelo batch...');

      // Buscar TODAS as empresas descartadas pelo batch automático
      const { data: batchDiscarded, error: fetchError } = await supabase
        .from('discarded_companies')
        .select('*')
        .eq('discard_reason_id', 'totvs_client')
        .ilike('discard_reason_label', '%Batch Automático%');

      if (fetchError) {
        throw fetchError;
      }

      if (!batchDiscarded || batchDiscarded.length === 0) {
        toast.info('Nenhuma empresa auto-descartada encontrada.');
        return { restored: 0 };
      }

      console.log(`[RESTORE-ALL] 📦 Encontradas ${batchDiscarded.length} empresas auto-descartadas`);

      // Restaurar cada uma
      for (const discarded of batchDiscarded) {
        // 1. Restaurar para quarentena
        if (discarded.company_id) {
          await supabase
            .from('icp_analysis_results')
            .update({ status: 'pendente' })
            .eq('company_id', discarded.company_id);
        } else {
          await supabase
            .from('icp_analysis_results')
            .insert({
              cnpj: discarded.cnpj,
              razao_social: discarded.company_name,
              status: 'pendente',
              icp_score: discarded.original_icp_score || 0,
              temperatura: discarded.original_icp_temperature || 'cold',
            });
        }

        // 2. Remover de descartadas
        await supabase
          .from('discarded_companies')
          .delete()
          .eq('id', discarded.id);

        console.log(`[RESTORE-ALL] ✅ ${discarded.company_name} restaurada`);
      }

      return { restored: batchDiscarded.length };
    },
    onSuccess: (data) => {
      toast.success(`✅ ${data.restored} empresa(s) restaurada(s)!`, {
        description: 'Todas as empresas auto-descartadas voltaram para a quarentena.',
        duration: 5000,
      });

      queryClient.invalidateQueries({ queryKey: ['icp-quarantine'] });
      queryClient.invalidateQueries({ queryKey: ['discarded-companies'] });
    },
    onError: (error: any) => {
      console.error('[RESTORE-ALL] ❌ Erro:', error);
      toast.error('Erro ao restaurar empresas', { description: error.message });
    },
  });
}

