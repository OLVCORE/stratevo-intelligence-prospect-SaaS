// src/features/linkedin/hooks/useLinkedInAccount.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LinkedInAccount } from "../types/linkedin.types";
import { toast } from "sonner";
import { checkLinkedInOAuthStatus } from "@/services/linkedinOAuth";
import { useTenant } from "@/contexts/TenantContext";

export function useLinkedInAccount() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  // Buscar conta conectada (usando novo OAuth)
  const { data: account, isLoading, error } = useQuery({
    queryKey: ['linkedin-account', tenant?.id],
    queryFn: async (): Promise<LinkedInAccount | null> => {
      if (!tenant?.id) return null;

      // Usar novo método OAuth para verificar status
      const { connected, account: oauthAccount } = await checkLinkedInOAuthStatus();
      
      if (connected && oauthAccount) {
        // Se a conta OAuth existe e tem id, buscar dados completos da tabela
        if (oauthAccount.id) {
          const { data, error } = await supabase
            .from('linkedin_accounts')
            .select('*')
            .eq('id', oauthAccount.id)
            .maybeSingle();

          if (error) throw error;
          if (data) return data;
        }
        
        // Se não tem id (legacy), retornar o account como está (mas não é LinkedInAccount completo)
        // Neste caso, retornar null para forçar busca no tenant
      }

      // Fallback: buscar conta ativa no tenant
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

  // Desconectar conta
  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      // ✅ ATUALIZAR STATUS NO BANCO
      const { error } = await supabase
        .from('linkedin_accounts')
        .update({ status: 'disconnected' })
        .eq('id', accountId);

      if (error) throw error;

      // ✅ AGUARDAR UM POUCO PARA GARANTIR QUE O BANCO FOI ATUALIZADO
      await new Promise(resolve => setTimeout(resolve, 300));
    },
    onSuccess: () => {
      // ✅ INVALIDAR TODOS OS CACHES RELACIONADOS
      queryClient.invalidateQueries({ queryKey: ['linkedin-account'] });
      queryClient.invalidateQueries({ queryKey: ['linkedin'] });
      queryClient.removeQueries({ queryKey: ['linkedin-account'] });
      
      toast.success('Conta LinkedIn desconectada');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desconectar: ${error.message}`);
    },
  });

  return {
    account,
    isLoading,
    error,
    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,
  };
}

