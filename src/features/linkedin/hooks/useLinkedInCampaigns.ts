// src/features/linkedin/hooks/useLinkedInCampaigns.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LinkedInCampaign, LinkedInCampaignFormData } from "../types/linkedin.types";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";

export function useLinkedInCampaigns(accountId?: string) {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  // Buscar campanhas
  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ['linkedin-campaigns', tenant?.id, accountId],
    queryFn: async (): Promise<LinkedInCampaign[]> => {
      if (!tenant?.id) return [];

      let query = supabase
        .from('linkedin_campaigns')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (accountId) {
        query = query.eq('linkedin_account_id', accountId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  // Criar campanha
  const createMutation = useMutation({
    mutationFn: async (formData: LinkedInCampaignFormData) => {
      if (!tenant?.id || !accountId) throw new Error('Tenant e conta LinkedIn são obrigatórios');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('linkedin_campaigns')
        .insert({
          tenant_id: tenant.id,
          linkedin_account_id: accountId,
          name: formData.name,
          description: formData.description,
          search_url: formData.search_url,
          connection_degree: formData.connection_degree,
          invite_message_template: formData.invite_message_template,
          max_invites_per_day: formData.max_invites_per_day,
          max_total_invites: formData.max_total_invites,
          start_date: formData.start_date?.toISOString(),
          end_date: formData.end_date?.toISOString(),
          created_by: user.id,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-campaigns'] });
      toast.success('Campanha criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar campanha: ${error.message}`);
    },
  });

  // Atualizar campanha
  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: Partial<LinkedInCampaignFormData> }) => {
      const updateData: any = {};
      if (formData.name) updateData.name = formData.name;
      if (formData.description !== undefined) updateData.description = formData.description;
      if (formData.search_url !== undefined) updateData.search_url = formData.search_url;
      if (formData.connection_degree) updateData.connection_degree = formData.connection_degree;
      if (formData.invite_message_template !== undefined) updateData.invite_message_template = formData.invite_message_template;
      if (formData.max_invites_per_day) updateData.max_invites_per_day = formData.max_invites_per_day;
      if (formData.max_total_invites) updateData.max_total_invites = formData.max_total_invites;
      if (formData.start_date) updateData.start_date = formData.start_date.toISOString();
      if (formData.end_date) updateData.end_date = formData.end_date.toISOString();

      const { data, error } = await supabase
        .from('linkedin_campaigns')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-campaigns'] });
      toast.success('Campanha atualizada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  // Deletar campanha
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('linkedin_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-campaigns'] });
      toast.success('Campanha deletada');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao deletar: ${error.message}`);
    },
  });

  // Ativar/Pausar campanha
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'paused' }) => {
      const { error } = await supabase
        .from('linkedin_campaigns')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedin-campaigns'] });
      toast.success('Status da campanha atualizado');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  return {
    campaigns,
    isLoading,
    error,
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    delete: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    toggleStatus: toggleStatusMutation.mutate,
    isToggling: toggleStatusMutation.isPending,
  };
}

