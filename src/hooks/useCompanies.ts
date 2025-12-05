import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Company, Inserts } from '@/lib/db';
import { useTenant } from '@/contexts/TenantContext';

export const COMPANIES_QUERY_KEY = ['companies'];

// Hook otimizado com paginação e filtros
export function useCompanies(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const { page = 0, pageSize = 50, search = '', sortBy = 'created_at', sortOrder = 'desc' } = options || {};
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  
  return useQuery({
    queryKey: [...COMPANIES_QUERY_KEY, tenantId, page, pageSize, search, sortBy, sortOrder],
    queryFn: async () => {
      console.log('[useCompanies] 🔍 Buscando empresas para tenant:', tenantId);
      
      let query = supabase
        .from('companies')
        .select('*', { count: 'exact' });
      
      // 🔥 CRÍTICO: Filtrar por tenant_id
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      // Filtro de busca
      if (search) {
        query = query.or(`company_name.ilike.%${search}%,cnpj.ilike.%${search}%`); // FIX: company_name não name
      }

      // Ordenação
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Paginação
      const from = page * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      
      if (error) {
        console.error('[useCompanies] ❌ Query error:', error);
        console.error('[useCompanies] 📝 Query details:', { tenantId, search, sortBy, sortOrder, page, pageSize });
        // Retornar vazio em vez de quebrar
        return { 
          data: [] as Company[], 
          count: 0,
          page,
          pageSize,
          totalPages: 0
        };
      }
      
      console.log('[useCompanies] ✅ Encontradas:', count, 'empresas para tenant:', tenantId);
      
      return { 
        data: data as Company[], 
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },
    enabled: !!tenantId, // 🔥 Só buscar se tiver tenant
    staleTime: 5 * 1000, // ✅ 5 segundos (atualiza mais rápido)
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true, // ✅ Revalida ao focar janela
  });
}

// Hook para buscar todas as empresas (usar com cuidado)
export function useAllCompanies() {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  
  return useQuery({
    queryKey: ['companies', 'all', tenantId],
    queryFn: async () => {
      console.log('[useAllCompanies] 🔍 Buscando TODAS empresas para tenant:', tenantId);
      
      let query = supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      
      // 🔥 CRÍTICO: Filtrar por tenant_id
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      console.log('[useAllCompanies] ✅ Total encontrado:', data?.length || 0);
      
      return data as Company[];
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  
  return useMutation({
    mutationFn: async (company: Inserts<'companies'>) => {
      if (!tenant) {
        throw new Error('Tenant não disponível');
      }

      const { data, error } = await supabase
        .from('companies')
        .insert([{
          ...company,
          tenant_id: tenant.id,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Company> }) => {
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['company', variables.id] });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // ✅ DELETE DIRETO (sem Edge Function - como Quarentena)
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: COMPANIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
