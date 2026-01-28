// src/hooks/useTenantConfig.ts
// Hooks para buscar configuração do tenant

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

/**
 * Hook para buscar configuração de busca do tenant
 */
export function useTenantSearchConfig() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['tenant-search-config', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;

      const { data, error } = await supabase
        .from('tenant_search_configs')
        .select('*')
        .eq('tenant_id', tenant.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    },
    enabled: !!tenant?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para buscar produtos do tenant
 */
export function useTenantProducts() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['tenant-products', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];

      // Schema real: ativo, nome, categoria, extraido_de (sem ordem_exibicao/display_order)
      const { data, error } = await supabase
        .from('tenant_products')
        .select('*')
        .eq('tenant_id', tenant.id)
        .or('ativo.eq.true,ativo.is.null')
        .order('nome', { ascending: true, nullsFirst: false });

      if (error) {
        // Se coluna ordem_exibicao/ativo não existir, tentar só ativo e order por nome
        if (error.code === '42703' || error.code === '42883' || error.status === 400 ||
            error.message?.includes('column') || error.message?.includes('does not exist')) {
          console.warn('[useTenantProducts] Erro em order/filtro, tentando ativo + nome');
          try {
            const { data: d2, error: e2 } = await supabase
              .from('tenant_products')
              .select('*')
              .eq('tenant_id', tenant.id)
              .or('ativo.eq.true,ativo.is.null')
              .order('nome', { ascending: true });
            if (!e2) return d2 || [];
          } catch (_) {}
          const { data: d3, error: e3 } = await supabase
            .from('tenant_products')
            .select('*')
            .eq('tenant_id', tenant.id);
          if (e3) {
            console.error('[useTenantProducts] Erro mesmo sem order:', e3);
            throw e3;
          }
          return d3 || [];
        }
        throw error;
      }
      return data || [];
    },
    enabled: !!tenant?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para buscar configuração de competidores do tenant
 */
export function useTenantCompetitorConfig() {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['tenant-competitor-config', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;

      const { data, error } = await supabase
        .from('tenant_competitor_configs')
        .select('*')
        .eq('tenant_id', tenant.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    },
    enabled: !!tenant?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para buscar configuração de setor
 */
export function useSectorConfig(sectorCode?: string) {
  const { tenant } = useTenant();
  const effectiveSectorCode = sectorCode || tenant?.sector_code;

  return useQuery({
    queryKey: ['sector-config', effectiveSectorCode],
    queryFn: async () => {
      if (!effectiveSectorCode) return null;

      const { data, error } = await supabase
        .from('sector_configs')
        .select('*')
        .eq('sector_code', effectiveSectorCode)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    },
    enabled: !!effectiveSectorCode,
    staleTime: 1000 * 60 * 60, // 1 hora (configuração de setor muda pouco)
  });
}

/**
 * Hook para criar/atualizar configuração de busca do tenant
 */
export function useUpdateTenantSearchConfig() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: {
      company_name: string;
      search_terms: string[];
      aliases?: string[];
      product_keywords?: string[];
    }) => {
      if (!tenant?.id) throw new Error('Tenant não disponível');

      const { data, error } = await supabase
        .from('tenant_search_configs')
        .upsert({
          tenant_id: tenant.id,
          ...config,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-search-config', tenant?.id] });
    },
  });
}

/**
 * Hook para criar/atualizar produto do tenant
 */
export function useCreateTenantProduct() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: {
      name: string;
      sku?: string;
      category?: string;
      description?: string;
      sector_fit?: string[];
      niche_fit?: string[];
      cnae_fit?: string[];
      use_cases?: string[];
      base_price?: number;
      priority?: string;
      product_type?: string;
    }) => {
      if (!tenant?.id) throw new Error('Tenant não disponível');

      const { data, error } = await supabase
        .from('tenant_products')
        .insert({
          tenant_id: tenant.id,
          ...product,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-products', tenant?.id] });
    },
  });
}

/**
 * Hook para atualizar produto do tenant
 */
export function useUpdateTenantProduct() {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      if (!tenant?.id) throw new Error('Tenant não disponível');

      const { data, error } = await supabase
        .from('tenant_products')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-products', tenant?.id] });
    },
  });
}

/**
 * Hook para gerar termos de busca dinamicamente baseados no tenant
 */
export function useTenantSearchTerms() {
  const { tenant } = useTenant();
  const { data: searchConfig } = useTenantSearchConfig();
  const { data: products } = useTenantProducts();

  return useQuery({
    queryKey: ['tenant-search-terms', tenant?.id, searchConfig?.id, products?.length],
    queryFn: async () => {
      if (!tenant) return [];

      const terms: string[] = [];

      // 1. Nome da empresa do tenant
      if (searchConfig?.company_name) {
        terms.push(searchConfig.company_name);
      } else if (tenant.nome) {
        terms.push(tenant.nome);
      }

      // 2. Termos de busca configurados
      if (searchConfig?.search_terms) {
        terms.push(...searchConfig.search_terms);
      }

      // 3. Aliases
      if (searchConfig?.aliases) {
        terms.push(...searchConfig.aliases);
      }

      // 4. Nomes dos produtos
      if (products && products.length > 0) {
        products.forEach(product => {
          if (product.name) terms.push(product.name);
          if (product.sku) terms.push(product.sku);
        });
      }

      // 5. Keywords dos produtos
      if (searchConfig?.product_keywords) {
        terms.push(...searchConfig.product_keywords);
      }

      // Remover duplicatas e vazios
      return [...new Set(terms.filter(t => t && t.trim()))];
    },
    enabled: !!tenant,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

