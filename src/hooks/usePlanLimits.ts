// src/hooks/usePlanLimits.ts
// ============================================================================
// HOOK: Verificação de Limites do Plano
// ============================================================================
// Este hook fornece funções para verificar se o usuário pode criar mais
// recursos (tenants, ICPs, usuários) baseado no plano atual
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { 
  getPlanLimits, 
  canAddMore, 
  getLimitMessage, 
  getUpgradePlan,
  formatLimit,
  type PlanType 
} from '@/config/planLimits';

interface UserTenantsCount {
  count: number;
  tenants: Array<{
    id: string;
    nome: string;
    plano: string;
  }>;
}

interface PlanLimitsHook {
  // Estado
  isLoading: boolean;
  error: string | null;
  
  // Dados do plano atual
  currentPlan: PlanType;
  limits: ReturnType<typeof getPlanLimits>;
  
  // Contadores
  tenantCount: number;
  icpCount: number;
  userCount: number;
  
  // Verificações
  canCreateTenant: boolean;
  canCreateICP: boolean;
  canCreateUser: boolean;
  
  // Mensagens
  tenantLimitMessage: string | null;
  icpLimitMessage: string | null;
  userLimitMessage: string | null;
  
  // Upgrade
  upgradePlan: PlanType | null;
  
  // Funções
  refetch: () => void;
  checkLimit: (resourceType: 'tenants' | 'icps' | 'users') => boolean;
  getFormattedLimit: (resourceType: 'tenants' | 'icps' | 'users') => string;
}

/**
 * Hook para gerenciar limites do plano do usuário
 */
export function usePlanLimits(): PlanLimitsHook {
  const { user } = useAuth();
  const { tenant } = useTenant();
  
  // Buscar contagem de tenants do usuário
  const { 
    data: userTenants, 
    isLoading: loadingTenants,
    error: tenantsError,
    refetch: refetchTenants
  } = useQuery({
    queryKey: ['user-tenants-count', user?.id],
    queryFn: async (): Promise<UserTenantsCount> => {
      if (!user?.id) {
        return { count: 0, tenants: [] };
      }
      
      const { data, error } = await (supabase as any)
        .from('users')
        .select('tenant_id, tenants(id, nome, plano)')
        .eq('auth_user_id', user.id);
      
      if (error) {
        console.error('[usePlanLimits] Erro ao buscar tenants:', error);
        return { count: 0, tenants: [] };
      }
      
      const tenants = data
        ?.map((u: any) => u.tenants)
        .filter(Boolean) || [];
      
      return {
        count: tenants.length,
        tenants,
      };
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 segundos
  });
  
  // Buscar contagem de ICPs do tenant atual (BLOQUEADO se erro 42P17)
  const { 
    data: icpCount = 0,
    isLoading: loadingICPs,
    refetch: refetchICPs
  } = useQuery({
    queryKey: ['icp-count', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return 0;
      
      const { count, error } = await (supabase as any)
        .from('icp_profiles_metadata')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id);
      
      if (error) {
        // 🔥 CRÍTICO: Se erro 42P17, retornar 0 silenciosamente
        if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
          console.warn('[usePlanLimits] ⚠️ Erro 42P17 ao contar ICPs, retornando 0');
          return 0;
        }
        console.error('[usePlanLimits] Erro ao contar ICPs:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!tenant?.id,
    staleTime: 30000,
    retry: false, // 🔥 CRÍTICO: Desabilitar retries para evitar loops
    refetchOnWindowFocus: false, // 🔥 CRÍTICO: Não refazer requisição ao focar janela
    refetchOnReconnect: false, // 🔥 CRÍTICO: Não refazer requisição ao reconectar
  });
  
  // Buscar contagem de usuários do tenant atual (BLOQUEADO se erro 42P17)
  const { 
    data: userCount = 0,
    isLoading: loadingUsers,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['users-count', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return 0;
      
      const { count, error } = await (supabase as any)
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id);
      
      if (error) {
        // 🔥 CRÍTICO: Se erro 42P17, retornar 0 silenciosamente e BLOQUEAR futuras requisições
        if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
          console.warn('[usePlanLimits] ⚠️ Erro 42P17 ao contar usuários, bloqueando futuras requisições');
          // Retornar 0 e não tentar mais
          return 0;
        }
        console.error('[usePlanLimits] Erro ao contar usuários:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!tenant?.id,
    staleTime: 30000,
    retry: false, // 🔥 CRÍTICO: Desabilitar retries para evitar loops
    refetchOnWindowFocus: false, // 🔥 CRÍTICO: Não refazer requisição ao focar janela
    refetchOnReconnect: false, // 🔥 CRÍTICO: Não refazer requisição ao reconectar
  });
  
  // Determinar plano atual (do tenant mais recente ou FREE)
  const currentPlan = (
    userTenants?.tenants?.[0]?.plano || 
    tenant?.plano || 
    'FREE'
  ).toUpperCase() as PlanType;
  
  // Obter limites do plano
  const limits = getPlanLimits(currentPlan);
  
  // Contagem de tenants
  const tenantCount = userTenants?.count || 0;
  
  // Verificações de limite
  const canCreateTenant = canAddMore(currentPlan, 'tenants', tenantCount);
  const canCreateICP = canAddMore(currentPlan, 'icps', icpCount);
  const canCreateUser = canAddMore(currentPlan, 'users', userCount);
  
  // Mensagens de limite
  const tenantLimitMessage = !canCreateTenant 
    ? getLimitMessage(currentPlan, 'tenants') 
    : null;
  const icpLimitMessage = !canCreateICP 
    ? getLimitMessage(currentPlan, 'icps') 
    : null;
  const userLimitMessage = !canCreateUser 
    ? getLimitMessage(currentPlan, 'users') 
    : null;
  
  // Plano de upgrade recomendado
  const upgradePlan = getUpgradePlan(currentPlan);
  
  // Função para refetch de todos os dados
  const refetch = () => {
    refetchTenants();
    refetchICPs();
    refetchUsers();
  };
  
  // Função para verificar limite específico
  const checkLimit = (resourceType: 'tenants' | 'icps' | 'users'): boolean => {
    const counts = {
      tenants: tenantCount,
      icps: icpCount,
      users: userCount,
    };
    return canAddMore(currentPlan, resourceType, counts[resourceType]);
  };
  
  // Função para obter limite formatado
  const getFormattedLimit = (resourceType: 'tenants' | 'icps' | 'users'): string => {
    return formatLimit(limits[resourceType]);
  };
  
  return {
    isLoading: loadingTenants || loadingICPs || loadingUsers,
    error: tenantsError?.message || null,
    currentPlan,
    limits,
    tenantCount,
    icpCount,
    userCount,
    canCreateTenant,
    canCreateICP,
    canCreateUser,
    tenantLimitMessage,
    icpLimitMessage,
    userLimitMessage,
    upgradePlan,
    refetch,
    checkLimit,
    getFormattedLimit,
  };
}

/**
 * Hook simplificado para verificar apenas limite de tenants
 */
export function useCanCreateTenant(): {
  canCreate: boolean;
  currentCount: number;
  limit: number;
  message: string | null;
  isLoading: boolean;
} {
  const { 
    canCreateTenant, 
    tenantCount, 
    limits, 
    tenantLimitMessage,
    isLoading 
  } = usePlanLimits();
  
  return {
    canCreate: canCreateTenant,
    currentCount: tenantCount,
    limit: limits.tenants,
    message: tenantLimitMessage,
    isLoading,
  };
}

