import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/utils/logger';
import { toastMessages } from '@/lib/utils/toastMessages';

export interface Deal {
  id: string;
  title: string;
  description?: string | null;
  company_id?: string | null;
  stage: string;
  value: number;
  probability: number;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expected_close_date?: string | null;
  created_at: string;
  companies?: { name?: string; company_name?: string; industry?: string; website?: string; domain?: string; linkedin_url?: string; sector_name?: string; raw_data?: Record<string, unknown>; apollo_organization_id?: string | null; apollo_url?: string | null };
}

const DEALS_QUERY_KEY = ['sdr_deals'];

export type DealFilters = { stage?: string; status?: string; company_id?: string };

export function useDeals(filters?: DealFilters) {
  return useQuery({
    queryKey: [...DEALS_QUERY_KEY, filters],
    queryFn: async () => {
      // Construir query base (evita "Type instantiation is excessively deep" no join Supabase)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase
        .from('sdr_deals')
        .select('*, companies:companies!sdr_deals_company_id_fkey(company_name, industry, website, domain, linkedin_url, sector_name, raw_data, apollo_organization_id, apollo_url)')
        .order('created_at', { ascending: false });
      
      // Filtro por deal_stage (coluna real da tabela)
      if (filters?.stage) query = query.eq('deal_stage', filters.stage);
      
      // Filtro por status
      if (filters?.status) query = query.eq('status', filters.status);
      
      // Filtro por company_id
      if (filters?.company_id) query = query.eq('company_id', filters.company_id);
      
      const { data, error } = await query;
      if (error) {
        console.error('❌ ERRO DETALHADO useDeals:', JSON.stringify(error, null, 2));
        logger.error('useDeals', 'Error fetching deals', error);
        return []; // Retornar array vazio em vez de quebrar
      }
      
      console.log('✅ Deals carregados:', data?.length || 0);
      
      // ✅ Normalizar para Deal: aceita deal_stage/deal_title/deal_value ou stage/title/value
      const rows = data ?? [];
      return rows.map((row: Record<string, unknown>) => ({
        ...row,
        stage: String(row.deal_stage ?? row.stage ?? ''),
        title: String(row.deal_title ?? row.title ?? ''),
        value: Number(row.deal_value ?? row.value ?? 0),
      })) as Deal[];
    },
    // ✅ HABILITADO: Agora temos deals criados com sucesso!
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (deal: { title: string; description?: string; company_id?: string; stage?: string; value?: number; priority?: string; assigned_to?: string; source?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const stage = deal.stage || 'discovery';
      const value = deal.value ?? 0;
      // Tabela usa deal_stage, deal_title, deal_value (FK em deal_stage)
      const dealToInsert = {
        deal_title: deal.title,
        deal_stage: stage,
        deal_value: value,
        description: deal.description || null,
        company_id: deal.company_id || null,
        probability: 0,
        priority: deal.priority || 'medium',
        assigned_to: deal.assigned_to || user?.id || null,
        source: deal.source || 'manual',
        status: 'open',
      };
      const { data, error } = await supabase.from('sdr_deals').insert([dealToInsert]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEY });
      toastMessages.success.created();
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealId, updates }: { dealId: string; updates: Record<string, any> }) => {
      // Mapear campos virtuais (stage/title/value) para colunas reais (deal_stage/deal_title/deal_value)
      const backendUpdates: Record<string, unknown> = { ...updates };
      if (updates.stage !== undefined) {
        backendUpdates.deal_stage = updates.stage;
        delete backendUpdates.stage;
      }
      if (updates.title !== undefined) {
        backendUpdates.deal_title = updates.title;
        delete backendUpdates.title;
      }
      if (updates.value !== undefined) {
        backendUpdates.deal_value = updates.value;
        delete backendUpdates.value;
      }
      const { data, error } = await supabase.from('sdr_deals').update(backendUpdates).eq('id', dealId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEY });
      toastMessages.success.updated();
    },
  });
}

export function useMoveDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealId, newStage }: { dealId: string; newStage: string }) => {
      const status = newStage === 'won' ? 'won' : newStage === 'lost' ? 'lost' : 'open';
      console.log('[useMoveDeal] Atualizando deal:', { dealId, newStage, status });
      const { data, error } = await supabase.from('sdr_deals').update({
        deal_stage: newStage,
        status,
      }).eq('id', dealId).select().single();
      if (error) {
        console.error('[useMoveDeal] Erro:', error);
        throw error;
      }
      console.log('[useMoveDeal] Deal atualizado:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEY });
      toastMessages.sdr.dealMoved();
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await supabase.from('sdr_deals').delete().eq('id', dealId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEY });
      toastMessages.success.deleted();
    },
  });
}

export function useBulkUpdateDeals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealIds, updates }: { dealIds: string[]; updates: Record<string, any> }) => {
      const backendUpdates: Record<string, unknown> = { ...updates };
      if (updates.stage !== undefined) {
        backendUpdates.deal_stage = updates.stage;
        delete backendUpdates.stage;
      }
      if (updates.title !== undefined) {
        backendUpdates.deal_title = updates.title;
        delete backendUpdates.title;
      }
      if (updates.value !== undefined) {
        backendUpdates.deal_value = updates.value;
        delete backendUpdates.value;
      }
      const promises = dealIds.map(id =>
        supabase.from('sdr_deals').update(backendUpdates).eq('id', id)
      );
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error('[useBulkUpdateDeals] Erros:', errors);
        throw errors[0].error;
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEY });
    },
  });
}

export interface DealActivity {
  id: string;
  deal_id: string;
  activity_type: string;
  description: string;
  old_value?: any;
  new_value?: any;
  created_at: string;
  created_by?: string;
}

export function useDealActivities(dealId: string) {
  return useQuery({
    queryKey: ['sdr_deal_activities', dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sdr_deal_activities')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DealActivity[];
    },
    enabled: !!dealId,
  });
}
