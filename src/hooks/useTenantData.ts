// src/hooks/useTenantData.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenant, useTenantSupabase } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para buscar empresas do tenant atual
 */
export function useTenantCompanies() {
  const { tenant } = useTenant();
  const tenantSupabase = useTenantSupabase();

  return useQuery({
    queryKey: ['tenant-companies', tenant?.id],
    queryFn: async () => {
      if (!tenant || !tenantSupabase) {
        throw new Error('Tenant não disponível');
      }

      // Buscar empresas do schema do tenant
      // Nota: Isso requer uma view ou função que acesse o schema dinâmico
      // Por enquanto, usamos uma abordagem com RLS baseada em tenant_id
      const { data, error } = await tenantSupabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: !!tenant,
  });
}

/**
 * Hook para criar empresa no tenant atual
 */
export function useCreateTenantCompany() {
  const { tenant } = useTenant();
  const tenantSupabase = useTenantSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (empresaData: any) => {
      if (!tenant || !tenantSupabase) {
        throw new Error('Tenant não disponível');
      }

      const { data, error } = await tenantSupabase
        .from('companies')
        .insert({
          ...empresaData,
          tenant_id: tenant.id, // Garantir isolamento
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-companies', tenant?.id] });
    },
  });
}

/**
 * Hook para buscar decisores do tenant atual
 */
export function useTenantDecisores(empresaId?: string) {
  const { tenant } = useTenant();
  const tenantSupabase = useTenantSupabase();

  return useQuery({
    queryKey: ['tenant-decisores', tenant?.id, empresaId],
    queryFn: async () => {
      if (!tenant || !tenantSupabase) {
        throw new Error('Tenant não disponível');
      }

      let query = tenantSupabase
        .from('decision_makers')
        .select('*')
        .order('created_at', { ascending: false });

      if (empresaId) {
        query = query.eq('company_id', empresaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!tenant,
  });
}

/**
 * Hook para buscar ICP Profile do tenant atual
 */
export function useTenantICPProfile() {
  const { tenant } = useTenant();
  const tenantSupabase = useTenantSupabase();

  return useQuery({
    queryKey: ['tenant-icp-profile', tenant?.id],
    queryFn: async () => {
      if (!tenant || !tenantSupabase) {
        throw new Error('Tenant não disponível');
      }

      // Buscar ICP Profile do schema do tenant
      // Isso requer acesso direto ao schema ou uma função SQL
      const { data, error } = await tenantSupabase
        .rpc('get_icp_profile', { tenant_schema: tenant.schema_name })
        .single();

      if (error) {
        // Fallback: buscar via tabela se existir
        const { data: fallbackData, error: fallbackError } = await tenantSupabase
          .from('icp_profile')
          .select('*')
          .limit(1)
          .single();

        if (fallbackError) throw fallbackError;
        return fallbackData;
      }

      return data;
    },
    enabled: !!tenant,
  });
}

/**
 * Hook para atualizar ICP Profile do tenant
 */
export function useUpdateTenantICPProfile() {
  const { tenant } = useTenant();
  const tenantSupabase = useTenantSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: any) => {
      if (!tenant || !tenantSupabase) {
        throw new Error('Tenant não disponível');
      }

      const { data, error } = await tenantSupabase
        .rpc('update_icp_profile', {
          tenant_schema: tenant.schema_name,
          profile_data: profileData,
        })
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-icp-profile', tenant?.id] });
    },
  });
}

