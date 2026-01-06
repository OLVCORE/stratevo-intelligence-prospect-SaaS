// src/features/linkedin/hooks/useLinkedInInvites.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LinkedInLead } from "../types/linkedin.types";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import { sendLinkedInInvite, sendBulkLinkedInInvites } from "../services/linkedinApi";

export function useLinkedInInvites(accountId?: string) {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  // Buscar leads pendentes/na fila
  const { data: pendingLeads, isLoading } = useQuery({
    queryKey: ['linkedin-invites-pending', tenant?.id, accountId],
    queryFn: async (): Promise<LinkedInLead[]> => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase
        .from('linkedin_leads')
        .select('*')
        .eq('tenant_id', tenant.id)
        .in('invite_status', ['pending', 'queued'])
        .order('imported_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  // Buscar leads com convites enviados
  const { data: sentLeads } = useQuery({
    queryKey: ['linkedin-invites-sent', tenant?.id, accountId],
    queryFn: async (): Promise<LinkedInLead[]> => {
      if (!tenant?.id) return [];

      const { data, error } = await supabase
        .from('linkedin_leads')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('invite_status', 'sent')
        .order('invite_sent_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  // Enviar convite único
  const sendInviteMutation = useMutation({
    mutationFn: async (params: {
      linkedin_account_id: string;
      linkedin_lead_id: string;
      message?: string;
    }) => {
      const result = await sendLinkedInInvite(params);
      if (!result.success) {
        throw new Error(result.error || 'Erro ao enviar convite');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-invites-pending'] });
      queryClient.invalidateQueries({ queryKey: ['linkedin-invites-sent'] });
      queryClient.invalidateQueries({ queryKey: ['linkedin-leads'] });
      queryClient.invalidateQueries({ queryKey: ['linkedin-account'] });
      toast.success('Convite enviado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar: ${error.message}`);
    },
  });

  // Enviar convites em lote
  const sendBulkInvitesMutation = useMutation({
    mutationFn: async (params: {
      linkedin_account_id: string;
      lead_ids: string[];
      message_template?: string;
    }) => {
      const result = await sendBulkLinkedInInvites(params);
      if (!result.success) {
        throw new Error(result.error || 'Erro ao agendar convites');
      }
      return result;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-invites-pending'] });
      queryClient.invalidateQueries({ queryKey: ['linkedin-queue'] });
      toast.success(data.message || `${data.queued} convites agendados!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  return {
    pendingLeads,
    sentLeads,
    isLoading,
    sendInvite: sendInviteMutation.mutate,
    isSending: sendInviteMutation.isPending,
    sendBulkInvites: sendBulkInvitesMutation.mutate,
    isSendingBulk: sendBulkInvitesMutation.isPending,
  };
}

