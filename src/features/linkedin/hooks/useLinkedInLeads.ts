// src/features/linkedin/hooks/useLinkedInLeads.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LinkedInLead } from "../types/linkedin.types";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";
import { importLinkedInLeads } from "../services/linkedinApi";

export function useLinkedInLeads(campaignId?: string) {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  // Buscar leads
  const { data: leads, isLoading, error } = useQuery({
    queryKey: ['linkedin-leads', tenant?.id, campaignId],
    queryFn: async (): Promise<LinkedInLead[]> => {
      if (!tenant?.id) return [];

      let query = supabase
        .from('linkedin_leads')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('imported_at', { ascending: false });

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  // Importar leads
  const importMutation = useMutation({
    mutationFn: async (params: {
      linkedin_account_id: string;
      search_url: string;
      campaign_id?: string;
      max_results?: number;
    }) => {
      const result = await importLinkedInLeads(params);
      if (!result.success) {
        throw new Error('Erro ao importar leads');
      }
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-leads'] });
      queryClient.invalidateQueries({ queryKey: ['linkedin-campaigns'] });
      toast.success(`${data.imported} leads importados com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao importar: ${error.message}`);
    },
  });

  // Deletar lead
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('linkedin_leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-leads'] });
      toast.success('Lead removido');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  // Vincular com CRM
  const linkToCrmMutation = useMutation({
    mutationFn: async ({ leadId, crmLeadId }: { leadId: string; crmLeadId: string }) => {
      const { error } = await supabase
        .from('linkedin_leads')
        .update({ crm_lead_id: crmLeadId })
        .eq('id', leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-leads'] });
      toast.success('Lead vinculado ao CRM');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  return {
    leads,
    isLoading,
    error,
    import: importMutation.mutate,
    isImporting: importMutation.isPending,
    delete: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    linkToCrm: linkToCrmMutation.mutate,
    isLinking: linkToCrmMutation.isPending,
  };
}

