// src/contexts/TenantContext.tsx
// [HF-STRATEVO-TENANT] Arquivo mapeado para fluxo de tenants/empresas

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { multiTenantService, type Tenant } from '@/services/multi-tenant.service';
import { supabase } from '@/integrations/supabase/client';

interface TenantContextType {
  tenant: Tenant | null;
  setTenant: (tenant: Tenant | null) => void;
  switchTenant: (tenantId: string) => Promise<void>; // 🔥 NOVO: Função para mudar tenant seguindo melhores práticas
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

  // ✅ Usar useCallback para evitar recriação e loops
  const loadTenant = useCallback(async () => {
    if (!user?.id) {
      setTenant(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 🆕 Buscar tenant preferido do localStorage
      const preferredTenantId = localStorage.getItem('selectedTenantId');

      // Buscar tenant do usuário (passando preferência se existir)
      let tenantData = await multiTenantService.obterTenantDoUsuario(user.id, preferredTenantId);

      // ✅ Se não encontrou e há tenant no localStorage, tentar buscar diretamente
      if (!tenantData && preferredTenantId) {
        try {
          console.log('[TenantContext] Tentando buscar tenant do localStorage diretamente:', preferredTenantId);
          tenantData = await multiTenantService.obterTenant(preferredTenantId);
          if (tenantData) {
            console.log('[TenantContext] ✅ Tenant encontrado via localStorage');
          } else {
            // 🔥 NOVO: Se obterTenant falhou, tentar buscar lista de tenants via RPC
            console.log('[TenantContext] ⚠️ obterTenant retornou null, tentando buscar lista de tenants...');
            try {
              const { createClient } = await import('@supabase/supabase-js');
              const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
              const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
              const supabaseClient = createClient(supabaseUrl, supabaseKey);
              
              const { data: tenantsList, error: listError } = await supabaseClient.rpc('get_user_tenants_complete');
              if (!listError && tenantsList && tenantsList.length > 0) {
                // Encontrar o tenant preferido na lista
                const foundTenant = tenantsList.find((t: any) => t.id === preferredTenantId);
                if (foundTenant) {
                  console.log('[TenantContext] ✅ Tenant encontrado na lista de tenants');
                  tenantData = foundTenant as any;
                } else if (tenantsList.length > 0) {
                  // Se não encontrou o preferido, usar o primeiro da lista
                  console.log('[TenantContext] ⚠️ Tenant preferido não encontrado, usando primeiro da lista');
                  tenantData = tenantsList[0] as any;
                }
              }
            } catch (listError) {
              console.warn('[TenantContext] Erro ao buscar lista de tenants:', listError);
            }
          }
        } catch (localError: any) {
          console.warn('[TenantContext] Erro ao buscar tenant do localStorage:', localError);
          // 🔥 NOVO: Se houver erro mas temos tenant no localStorage, tentar via RPC como último recurso
          if (preferredTenantId) {
            try {
              const { createClient } = await import('@supabase/supabase-js');
              const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
              const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
              const supabaseClient = createClient(supabaseUrl, supabaseKey);
              
              const { data: tenantsList, error: listError } = await supabaseClient.rpc('get_user_tenants_complete');
              if (!listError && tenantsList && tenantsList.length > 0) {
                const foundTenant = tenantsList.find((t: any) => t.id === preferredTenantId);
                if (foundTenant) {
                  console.log('[TenantContext] ✅ Tenant encontrado na lista após erro:', preferredTenantId);
                  tenantData = foundTenant as any;
                } else if (tenantsList.length > 0) {
                  console.log('[TenantContext] ⚠️ Usando primeiro tenant da lista após erro');
                  tenantData = tenantsList[0] as any;
                }
              }
            } catch (finalError) {
              console.warn('[TenantContext] Erro final ao buscar lista de tenants:', finalError);
            }
          }
        }
      }

      if (!tenantData) {
        // Não é erro se o usuário ainda não completou o onboarding
        setError(null); // Não definir erro para não bloquear onboarding
        setTenant(null);
        return;
      }

      // 🆕 Salvar o tenant atual no localStorage para próxima sessão
      localStorage.setItem('selectedTenantId', tenantData.id);
      
      setTenant(tenantData);
    } catch (err: any) {
      console.error('Erro ao carregar tenant:', err);
      // 🔥 NOVO: Se erro 406 (Not Acceptable) ou 500, tentar usar tenant do localStorage como último recurso
      if (err.status === 406 || err.status === 500 || err.code === 'PGRST301') {
        const localTenantId = localStorage.getItem('selectedTenantId');
        if (localTenantId) {
          try {
            // ✅ Tentar buscar via obterTenant primeiro
            const tenantData = await multiTenantService.obterTenant(localTenantId);
            if (tenantData) {
              console.log('[TenantContext] ✅ Usando tenant do localStorage após erro', err.status);
              setTenant(tenantData);
              setError(null);
              return;
            }
            
            // Se obterTenant falhou, tentar via RPC get_user_tenants_complete
            try {
              const { createClient } = await import('@supabase/supabase-js');
              const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
              const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
              const supabaseClient = createClient(supabaseUrl, supabaseKey);
              
              const { data: tenantsList, error: listError } = await supabaseClient.rpc('get_user_tenants_complete');
              if (!listError && tenantsList && tenantsList.length > 0) {
                const foundTenant = tenantsList.find((t: any) => t.id === localTenantId) || tenantsList[0];
                if (foundTenant) {
                  console.log('[TenantContext] ✅ Tenant encontrado via RPC após erro', err.status);
                  setTenant(foundTenant as any);
                  setError(null);
                  return;
                }
              }
            } catch (rpcError) {
              console.warn('[TenantContext] Erro ao buscar via RPC no fallback:', rpcError);
            }
            
            console.warn('[TenantContext] ⚠️ Não foi possível buscar tenant do banco após erro', err.status);
          } catch (fallbackError) {
            console.warn('[TenantContext] Erro no fallback:', fallbackError);
          }
        }
      }
      setError(err.message || 'Erro ao carregar workspace');
      setTenant(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadTenant();
  }, [loadTenant]);

  // 🔥 NOVO: Função switchTenant seguindo melhores práticas (Slack/Notion pattern)
  // Atualiza tenant, localStorage, dispara eventos e força refresh de todos os componentes
  const switchTenant = useCallback(async (tenantId: string) => {
    console.log('[TenantContext] 🔄 switchTenant chamado:', tenantId);
    
    if (!tenantId) {
      console.warn('[TenantContext] ⚠️ switchTenant: tenantId vazio');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Buscar dados completos do tenant
      let tenantData = await multiTenantService.obterTenant(tenantId);
      
      // 🔥 FALLBACK: Se obterTenant retornou null, tentar buscar via lista de tenants
      if (!tenantData) {
        console.warn('[TenantContext] ⚠️ obterTenant retornou null, tentando buscar via lista de tenants...');
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          const supabaseClient = createClient(supabaseUrl, supabaseKey);
          
          const { data: tenantsList, error: listError } = await supabaseClient.rpc('get_user_tenants_complete');
          if (!listError && tenantsList && tenantsList.length > 0) {
            // Encontrar o tenant desejado na lista
            const foundTenant = tenantsList.find((t: any) => t.id === tenantId);
            if (foundTenant) {
              console.log('[TenantContext] ✅ Tenant encontrado na lista de tenants via switchTenant');
              tenantData = foundTenant as any;
            } else if (tenantsList.length > 0) {
              // Se não encontrou o desejado, usar o primeiro da lista
              console.log('[TenantContext] ⚠️ Tenant desejado não encontrado, usando primeiro da lista');
              tenantData = tenantsList[0] as any;
            }
          }
        } catch (listError) {
          console.warn('[TenantContext] Erro ao buscar lista de tenants no switchTenant:', listError);
        }
      }
      
      // Se ainda não encontrou após todos os fallbacks, retornar erro
      if (!tenantData) {
        console.error('[TenantContext] ❌ Tenant não encontrado após todos os fallbacks:', tenantId);
        setError('Tenant não encontrado');
        setLoading(false);
        return;
      }

      // 2. Atualizar estado do contexto
      setTenant(tenantData);
      
      // 3. Salvar no localStorage (prioridade para próxima sessão)
      localStorage.setItem('selectedTenantId', tenantId);
      console.log('[TenantContext] ✅ Tenant atualizado no contexto e localStorage:', tenantData.nome);

      // 4. Disparar eventos para sincronizar todos os componentes
      window.dispatchEvent(new CustomEvent('tenant-switched', { 
        detail: { 
          tenantId: tenantData.id,
          tenant: tenantData
        } 
      }));
      
      window.dispatchEvent(new CustomEvent('tenant-changed', { 
        detail: { 
          tenantId: tenantData.id,
          nome: tenantData.nome,
          tenant: tenantData
        } 
      }));

      setError(null);
    } catch (err: any) {
      console.error('[TenantContext] ❌ Erro no switchTenant:', err);
      setError(err.message || 'Erro ao mudar tenant');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTenant = useCallback(async () => {
    console.log('[TenantContext] 🔄 refreshTenant chamado');
    if (!user?.id) {
      console.warn('[TenantContext] ⚠️ Usuário não encontrado para refreshTenant');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // ✅ Buscar tenant do localStorage (prioridade)
      const preferredTenantId = localStorage.getItem('selectedTenantId');
      console.log('[TenantContext] 📋 Tenant preferido do localStorage:', preferredTenantId);
      
      if (preferredTenantId) {
        // Buscar tenant diretamente pelo ID
        const tenantData = await multiTenantService.obterTenant(preferredTenantId);
        if (tenantData) {
          console.log('[TenantContext] ✅ Tenant encontrado via obterTenant:', tenantData.nome);
          setTenant(tenantData);
          setError(null);
          setLoading(false);
          return;
        }
      }
      
      // Se não encontrou pelo localStorage, tentar método normal
      console.log('[TenantContext] 🔄 Tentando método normal de busca...');
      await loadTenant();
    } catch (err: any) {
      console.error('[TenantContext] ❌ Erro no refreshTenant:', err);
      setError(err.message || 'Erro ao atualizar tenant');
      setLoading(false);
    }
  }, [user?.id, loadTenant]);
  
  // ✅ Escutar evento de mudança de tenant (tenant-changed)
  useEffect(() => {
    const handleTenantChanged = async (event: CustomEvent) => {
      const { tenantId, nome, tenant: tenantFromEvent } = event.detail;
      console.log('[TenantContext] 📢 Evento tenant-changed recebido:', { tenantId, nome });
      
      // Se o tenant atual é o que foi atualizado, atualizar imediatamente
      if (tenant?.id === tenantId && nome) {
        console.log('[TenantContext] 🔄 Atualizando nome do tenant no contexto:', nome);
        setTenant({ ...tenant, nome });
      }
      
      // Forçar recarregamento do tenant
      await refreshTenant();
    };
    
    window.addEventListener('tenant-changed', handleTenantChanged as EventListener);
    
    return () => {
      window.removeEventListener('tenant-changed', handleTenantChanged as EventListener);
    };
  }, [refreshTenant, tenant]);

  // 🔥 NOVO: Escutar evento tenant-switched (mudança completa de tenant)
  useEffect(() => {
    const handleTenantSwitched = async (event: CustomEvent) => {
      const { tenantId, tenant: tenantFromEvent } = event.detail;
      console.log('[TenantContext] 📢 Evento tenant-switched recebido:', { tenantId });
      
      // Se já temos o tenant completo no evento, usar diretamente
      if (tenantFromEvent) {
        console.log('[TenantContext] ✅ Usando tenant do evento:', tenantFromEvent.nome);
        setTenant(tenantFromEvent);
        localStorage.setItem('selectedTenantId', tenantId);
        return;
      }
      
      // Caso contrário, buscar do banco
      if (tenantId) {
        await switchTenant(tenantId);
      }
    };
    
    window.addEventListener('tenant-switched', handleTenantSwitched as EventListener);
    
    return () => {
      window.removeEventListener('tenant-switched', handleTenantSwitched as EventListener);
    };
  }, [switchTenant]);

  // [HF-STRATEVO-TENANT] Função setTenant para permitir que componentes externos definam o tenant
  const setTenantState = useCallback((next: Tenant | null) => {
    setTenant(next);
    try {
      if (next) {
        localStorage.setItem('selectedTenantId', next.id);
        console.log('[HF-STRATEVO-TENANT] setTenant =>', next.id, next.nome);
        
        // 🔥 NOVO: Disparar eventos para sincronização
        window.dispatchEvent(new CustomEvent('tenant-switched', { 
          detail: { 
            tenantId: next.id,
            tenant: next
          } 
        }));
      } else {
        localStorage.removeItem('selectedTenantId');
        console.log('[HF-STRATEVO-TENANT] setTenant => null (removido)');
      }
    } catch (e) {
      console.warn('[TenantProvider] Falha ao gravar tenant no localStorage', e);
    }
  }, []);

  const isActive = tenant
    ? tenant.status === 'ACTIVE' || tenant.status === 'TRIAL'
    : false;

  const creditos = tenant?.creditos || 0;

  const value = useMemo(
    () => ({
      tenant,
      setTenant: setTenantState,
      switchTenant, // 🔥 NOVO: Expor função switchTenant
      loading,
      error,
      refreshTenant,
      isActive,
      creditos,
    }),
    [tenant, setTenantState, switchTenant, loading, error, refreshTenant, isActive, creditos],
  );

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  
  // 🆕 Em vez de lançar erro, retornar valores padrão (mais robusto)
  // Isso evita crashes quando componentes são renderizados durante error recovery
  if (context === undefined) {
    console.warn('[useTenant] Chamado fora do TenantProvider - retornando valores padrão');
    return {
      tenant: null,
      setTenant: () => {},
      switchTenant: async () => {}, // 🔥 NOVO: Adicionar switchTenant aos valores padrão
      loading: false,
      error: null,
      refreshTenant: async () => {},
      isActive: false,
      creditos: 0,
    };
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

