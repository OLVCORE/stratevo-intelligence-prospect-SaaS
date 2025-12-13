/**
 * Hook para gerenciar handoffs de deals (SDR → Vendedor)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from '@/hooks/use-toast';

export interface Handoff {
  id: string;
  deal_id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  from_user_name: string | null;
  to_user_name: string | null;
  handoff_type: 'auto' | 'manual';
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  accepted_at: string | null;
  notes: string | null;
}

export interface SalesRep {
  user_id: string;
  user_name: string;
  active_deals_count: number;
  role: string;
}

/**
 * Buscar histórico de handoffs de um deal
 */
export function useDealHandoffHistory(dealId: string | null) {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ['deal-handoff-history', dealId, tenantId],
    queryFn: async () => {
      if (!dealId || !tenantId) return [];

      const { data, error } = await supabase.rpc('get_deal_handoff_history', {
        p_deal_id: dealId,
        p_tenant_id: tenantId,
      });

      if (error) throw error;
      return (data || []) as Handoff[];
    },
    enabled: !!dealId && !!tenantId,
  });
}

/**
 * Buscar vendedores disponíveis
 */
export function useAvailableSalesReps() {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ['available-sales-reps', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase.rpc('get_available_sales_reps', {
        p_tenant_id: tenantId,
      });

      if (error) throw error;
      return (data || []) as SalesRep[];
    },
    enabled: !!tenantId,
  });
}

/**
 * Criar handoff manual
 */
export function useCreateHandoff() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dealId }: { dealId: string }) => {
      if (!tenantId) throw new Error('Tenant não encontrado');

      const { data, error } = await supabase.rpc('assign_sales_rep_to_deal', {
        p_deal_id: dealId,
        p_tenant_id: tenantId,
        p_handoff_type: 'manual',
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (result: any) => {
      if (result && result[0]?.success) {
        toast({
          title: '✅ Handoff criado!',
          description: result[0].message || 'Vendedor atribuído com sucesso',
        });
        queryClient.invalidateQueries({ queryKey: ['deal-handoff-history'] });
        queryClient.invalidateQueries({ queryKey: ['pipeline-deals'] });
        queryClient.invalidateQueries({ queryKey: ['deals'] });
      } else {
        toast({
          title: 'Atenção',
          description: result?.[0]?.message || 'Não foi possível criar handoff',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar handoff',
        description: error.message || 'Não foi possível criar handoff',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Aprovar handoff pendente
 */
export function useApproveHandoff() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ handoffId }: { handoffId: string }) => {
      if (!tenantId) throw new Error('Tenant não encontrado');

      const { error } = await supabase
        .from('deal_handoffs')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', handoffId)
        .eq('tenant_id', tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: '✅ Handoff aprovado!',
        description: 'Vendedor confirmado para o deal',
      });
      queryClient.invalidateQueries({ queryKey: ['deal-handoff-history'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-deals'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao aprovar handoff',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Rejeitar handoff pendente
 */
export function useRejectHandoff() {
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ handoffId, reason }: { handoffId: string; reason?: string }) => {
      if (!tenantId) throw new Error('Tenant não encontrado');

      const { error } = await supabase
        .from('deal_handoffs')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_reason: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', handoffId)
        .eq('tenant_id', tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Handoff rejeitado',
        description: 'O deal permanece sem vendedor atribuído',
      });
      queryClient.invalidateQueries({ queryKey: ['deal-handoff-history'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-deals'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao rejeitar handoff',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

