// src/features/linkedin/hooks/useLinkedInQueue.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LinkedInQueueItem } from "../types/linkedin.types";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";

export function useLinkedInQueue(accountId?: string) {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  // Buscar fila
  const { data: queueItems, isLoading } = useQuery({
    queryKey: ['linkedin-queue', tenant?.id, accountId],
    queryFn: async (): Promise<LinkedInQueueItem[]> => {
      if (!tenant?.id) return [];

      let query = supabase
        .from('linkedin_queue')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('scheduled_for', { ascending: true });

      if (accountId) {
        query = query.eq('linkedin_account_id', accountId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
    refetchInterval: 30000, // Atualizar a cada 30s
  });

  // Cancelar item da fila
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('linkedin_queue')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-queue'] });
      toast.success('Item cancelado');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  // Retry item falho
  const retryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('linkedin_queue')
        .update({
          status: 'pending',
          scheduled_for: new Date().toISOString(),
          retry_count: supabase.raw('retry_count + 1'),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-queue'] });
      toast.success('Item reagendado');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const pendingCount = queueItems?.filter(item => item.status === 'pending').length || 0;
  const processingCount = queueItems?.filter(item => item.status === 'processing').length || 0;
  const completedCount = queueItems?.filter(item => item.status === 'completed').length || 0;
  const failedCount = queueItems?.filter(item => item.status === 'failed').length || 0;

  return {
    queueItems,
    isLoading,
    pendingCount,
    processingCount,
    completedCount,
    failedCount,
    cancel: cancelMutation.mutate,
    isCancelling: cancelMutation.isPending,
    retry: retryMutation.mutate,
    isRetrying: retryMutation.isPending,
  };
}

