// src/hooks/useUserTenants.ts
// [HF-STRATEVO-TENANT] Hook único para listar tenants do usuário via RPC

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserTenant = {
  id: string;
  nome?: string;
  name?: string;
  cnpj?: string;
  email?: string;
  plano?: string;
  status?: string;
  creditos?: number;
  data_expiracao?: string;
  created_at?: string;
  // incluir apenas campos que JÁ existam na resposta do RPC
};

type UseUserTenantsResult = {
  tenants: UserTenant[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useUserTenants(): UseUserTenantsResult {
  const [tenants, setTenants] = useState<UserTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 🔥 CRÍTICO: Bloqueio para evitar loops infinitos
  const isFetching = useRef(false);
  const lastFetchTime = useRef(0);

  const fetchTenants = async () => {
    // 🔥 BLOQUEIO: Evitar requisições repetidas
    const now = Date.now();
    if (isFetching.current || (now - lastFetchTime.current < 3000)) {
      console.log('[HF-STRATEVO-TENANT] ⏭️ Requisição bloqueada (já em execução ou muito recente)');
      return;
    }

    isFetching.current = true;
    lastFetchTime.current = now;
    setLoading(true);
    setError(null);

    console.log('[HF-STRATEVO-TENANT] useUserTenants -> chamando RPC get_user_tenants_complete');

    try {
      const { data, error: rpcError } = await (supabase as any).rpc('get_user_tenants_complete');

      if (rpcError) {
        // 🔥 CRÍTICO: Se erro 42P17, não tentar mais mas carregar tenants locais
        if (rpcError.code === '42P17' || rpcError.message?.includes('infinite recursion')) {
          console.warn('[HF-STRATEVO-TENANT] ⚠️ Erro 42P17 detectado, usando apenas tenants locais');
          setError('Erro de recursão infinita detectado');
          // Carregar apenas tenants locais quando há erro 42P17
          try {
            const localTenantsKey = 'local_tenants';
            const localTenantsJson = localStorage.getItem(localTenantsKey);
            if (localTenantsJson) {
              const localTenants = JSON.parse(localTenantsJson);
              const normalizedLocalTenants = localTenants.map((t: any) => ({
                id: t.id,
                nome: t.nome || '',
                name: t.nome || '',
                cnpj: t.cnpj || '',
                email: t.email || '',
                plano: t.plano || 'FREE',
                status: t.status || 'TRIAL',
                creditos: t.creditos || 0,
                data_expiracao: t.data_expiracao || undefined,
                created_at: t.created_at || undefined,
              }));
              setTenants(normalizedLocalTenants);
              console.log('[HF-STRATEVO-TENANT] ✅ Carregados', normalizedLocalTenants.length, 'tenants locais');
            } else {
              setTenants([]);
            }
          } catch (localError) {
            console.error('[HF-STRATEVO-TENANT] Erro ao carregar tenants locais:', localError);
            setTenants([]);
          }
        } else {
          console.error('[HF-STRATEVO-TENANT] Erro RPC get_user_tenants_complete', rpcError.message);
          setError(rpcError.message);
          // Mesmo com erro não-42P17, tentar carregar tenants locais como fallback
          try {
            const localTenantsKey = 'local_tenants';
            const localTenantsJson = localStorage.getItem(localTenantsKey);
            if (localTenantsJson) {
              const localTenants = JSON.parse(localTenantsJson);
              const normalizedLocalTenants = localTenants.map((t: any) => ({
                id: t.id,
                nome: t.nome || '',
                name: t.nome || '',
                cnpj: t.cnpj || '',
                email: t.email || '',
                plano: t.plano || 'FREE',
                status: t.status || 'TRIAL',
                creditos: t.creditos || 0,
                data_expiracao: t.data_expiracao || undefined,
                created_at: t.created_at || undefined,
              }));
              setTenants(normalizedLocalTenants);
            } else {
              setTenants([]);
            }
          } catch (localError) {
            setTenants([]);
          }
        }
      } else {
        console.log('[HF-STRATEVO-TENANT] Tenants do RPC:', data);
        // Normalizar os dados para garantir formato consistente
        const normalizedTenants = (data || []).map((t: any) => ({
          id: t.id,
          nome: t.nome || t.name || '',
          name: t.name || t.nome || '',
          cnpj: t.cnpj || '',
          email: t.email || '',
          plano: t.plano || 'FREE',
          status: t.status || 'ACTIVE',
          creditos: t.creditos || 0,
          data_expiracao: t.data_expiracao || undefined,
          created_at: t.created_at || undefined,
        }));
        
        // 🔥 CRÍTICO: Carregar tenants locais do localStorage e mesclar com tenants remotos
        try {
          const localTenantsKey = 'local_tenants';
          const localTenantsJson = localStorage.getItem(localTenantsKey);
          if (localTenantsJson) {
            const localTenants = JSON.parse(localTenantsJson);
            console.log('[HF-STRATEVO-TENANT] Tenants locais encontrados:', localTenants.length);
            // Mesclar tenants locais com remotos (evitar duplicatas por ID)
            // 🔥 CRÍTICO: Filtrar tenants locais temporários sem nome real (não mostrar "Nova Empresa")
            const allTenants = [...normalizedTenants];
            localTenants.forEach((localTenant: any) => {
              // Só adicionar tenant local se:
              // 1. Não está na lista de remotos
              // 2. Tem nome real (não é "Nova Empresa" ou genérico)
              const nomeReal = localTenant.nome || '';
              const isNomeGenerico = !nomeReal || 
                                    nomeReal.toLowerCase().includes('nova empresa') ||
                                    nomeReal.toLowerCase().includes('new company') ||
                                    nomeReal.trim() === '';
              
              if (!allTenants.find(t => t.id === localTenant.id) && !isNomeGenerico) {
                allTenants.push({
                  id: localTenant.id,
                  nome: nomeReal,
                  name: nomeReal,
                  cnpj: localTenant.cnpj || '',
                  email: localTenant.email || '',
                  plano: localTenant.plano || 'FREE',
                  status: localTenant.status || 'TRIAL',
                  creditos: localTenant.creditos || 0,
                  data_expiracao: localTenant.data_expiracao || undefined,
                  created_at: localTenant.created_at || undefined,
                });
              }
            });
            setTenants(allTenants);
          } else {
            setTenants(normalizedTenants);
          }
        } catch (localError) {
          console.error('[HF-STRATEVO-TENANT] Erro ao carregar tenants locais:', localError);
          setTenants(normalizedTenants);
        }
      }
    } catch (err: any) {
      console.error('[HF-STRATEVO-TENANT] Exceção ao chamar RPC:', err);
      setError(err.message || 'Erro desconhecido');
      setTenants([]);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!cancelled) {
        await fetchTenants();
      }
    }

    load();

    // 🔥 CRÍTICO: Escutar evento de atualização de tenant para refetch automático
    const handleTenantUpdated = () => {
      if (!cancelled) {
        console.log('[HF-STRATEVO-TENANT] Tenant atualizado, refetchando lista...');
        fetchTenants();
      }
    };

    window.addEventListener('tenant-updated', handleTenantUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener('tenant-updated', handleTenantUpdated);
    };
  }, []);

  return { tenants, loading, error, refetch: fetchTenants };
}

