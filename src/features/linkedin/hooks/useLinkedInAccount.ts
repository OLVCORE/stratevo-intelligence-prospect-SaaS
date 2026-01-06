// src/features/linkedin/hooks/useLinkedInAccount.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LinkedInAccount, LinkedInConnectFormData } from "../types/linkedin.types";
import { toast } from "sonner";
import { connectLinkedInAccount, syncLinkedInStatus } from "../services/linkedinApi";
import { useTenant } from "@/hooks/useTenant";

export function useLinkedInAccount() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  // Buscar conta conectada
  const { data: account, isLoading, error } = useQuery({
    queryKey: ['linkedin-account', tenant?.id],
    queryFn: async (): Promise<LinkedInAccount | null> => {
      if (!tenant?.id) return null;

      const { data, error } = await supabase
        .from('linkedin_accounts')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!tenant?.id,
  });

  // Conectar conta LinkedIn
  const connectMutation = useMutation({
    mutationFn: async (formData: LinkedInConnectFormData) => {
      const result = await connectLinkedInAccount(formData);
      if (!result.success) {
        throw new Error(result.error || 'Erro ao conectar');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-account'] });
      toast.success('Conta LinkedIn conectada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao conectar: ${error.message}`);
    },
  });

  // Desconectar conta
  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from('linkedin_accounts')
        .update({ status: 'disconnected' })
        .eq('id', accountId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-account'] });
      toast.success('Conta LinkedIn desconectada');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desconectar: ${error.message}`);
    },
  });

  // Sincronizar convites
  const syncMutation = useMutation({
    mutationFn: async ({ accountId, syncType }: { accountId: string; syncType: string }) => {
      const result = await syncLinkedInStatus({
        linkedin_account_id: accountId,
        sync_type: syncType as any,
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro na sincronização');
      }

      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-leads'] });
      queryClient.invalidateQueries({ queryKey: ['linkedin-account'] });
      toast.success(`Sincronização concluída: ${data.items_updated || 0} atualizados`);
    },
    onError: (error: Error) => {
      toast.error(`Erro na sincronização: ${error.message}`);
    },
  });

  return {
    account,
    isLoading,
    error,
    connect: connectMutation.mutate,
    isConnecting: connectMutation.isPending,
    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
  };
}

