// src/contexts/TenantContext.tsx

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { multiTenantService, type Tenant } from '@/services/multi-tenant.service';
import { supabase } from '@/integrations/supabase/client';

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  refreshTenant: () => Promise<void>;
  isActive: boolean;
  creditos: number;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTenant = async () => {
    if (!user?.id) {
      setTenant(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar tenant do usuário
      const tenantData = await multiTenantService.obterTenantDoUsuario(user.id);

      if (!tenantData) {
        setError('Usuário não está associado a nenhum tenant');
        setTenant(null);
        return;
      }

      setTenant(tenantData);
    } catch (err: any) {
      console.error('Erro ao carregar tenant:', err);
      setError(err.message || 'Erro ao carregar workspace');
      setTenant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenant();
  }, [user?.id]);

  const refreshTenant = async () => {
    await loadTenant();
  };

  const isActive = tenant
    ? tenant.status === 'ACTIVE' || tenant.status === 'TRIAL'
    : false;

  const creditos = tenant?.creditos || 0;

  return (
    <TenantContext.Provider
      value={{
        tenant,
        loading,
        error,
        refreshTenant,
        isActive,
        creditos,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

/**
 * Hook para obter cliente Supabase configurado para o schema do tenant
 */
export function useTenantSupabase() {
  const { tenant } = useTenant();

  if (!tenant) {
    return null;
  }

  // Retorna o cliente Supabase padrão
  // O isolamento será feito via RLS policies baseadas no tenant_id
  return supabase;
}

/**
 * Hook para verificar se o tenant está ativo antes de executar ações
 */
export function useRequireActiveTenant() {
  const { tenant, isActive, loading } = useTenant();

  if (loading) {
    return { canProceed: false, reason: 'loading' as const };
  }

  if (!tenant) {
    return { canProceed: false, reason: 'no_tenant' as const };
  }

  if (!isActive) {
    return {
      canProceed: false,
      reason: 'inactive' as const,
      message: 'Seu workspace está inativo ou suspenso. Entre em contato com o suporte.',
    };
  }

  return { canProceed: true };
}

/**
 * Hook para verificar créditos suficientes
 */
export function useRequireCredits(creditosNecessarios: number = 1) {
  const { creditos, tenant } = useTenant();

  if (!tenant) {
    return { hasCredits: false, reason: 'no_tenant' as const };
  }

  if (creditos < creditosNecessarios) {
    return {
      hasCredits: false,
      reason: 'insufficient' as const,
      message: `Esta ação requer ${creditosNecessarios} créditos. Você tem ${creditos}.`,
      creditosDisponiveis: creditos,
      creditosNecessarios,
    };
  }

  return { hasCredits: true, creditosDisponiveis: creditos };
}

