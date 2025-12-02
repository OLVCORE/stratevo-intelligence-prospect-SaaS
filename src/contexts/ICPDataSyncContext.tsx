/**
 * 🔄 ICP Data Sync Context
 * Sistema centralizado para sincronizar dados do ICP em todas as páginas
 * Quando o ICP é regenerado, todas as páginas dependentes são notificadas
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useTenant } from './TenantContext';

interface ICPDataSyncContextType {
  // Estado de sincronização
  isRefreshing: boolean;
  lastUpdateTime: Date | null;
  refreshTrigger: number;
  
  // Funções
  triggerRefresh: (icpId?: string) => Promise<void>;
  forceRefreshAll: () => Promise<void>;
  
  // Estado do ICP atual
  currentIcpId: string | null;
  setCurrentIcpId: (id: string | null) => void;
  
  // Listeners
  subscribe: (callback: () => void) => () => void;
}

const ICPDataSyncContext = createContext<ICPDataSyncContextType | undefined>(undefined);

export function ICPDataSyncProvider({ children }: { children: React.ReactNode }) {
  const { tenant } = useTenant();
  const tenantId = tenant?.id;
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentIcpId, setCurrentIcpId] = useState<string | null>(null);
  
  // Lista de callbacks para notificar componentes
  const listenersRef = useRef<Set<() => void>>(new Set());
  
  // Função para inscrever listeners
  const subscribe = useCallback((callback: () => void) => {
    listenersRef.current.add(callback);
    // Retorna função de unsubscribe
    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);
  
  // Notificar todos os listeners
  const notifyListeners = useCallback(() => {
    console.log('[ICPDataSync] 🔔 Notificando', listenersRef.current.size, 'componentes');
    listenersRef.current.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[ICPDataSync] Erro ao notificar listener:', error);
      }
    });
  }, []);
  
  // Trigger refresh para um ICP específico
  const triggerRefresh = useCallback(async (icpId?: string) => {
    if (!tenantId) return;
    
    setIsRefreshing(true);
    try {
      console.log('[ICPDataSync] 🔄 Iniciando refresh do ICP:', icpId || currentIcpId);
      
      // Incrementar trigger para forçar re-render
      setRefreshTrigger(prev => prev + 1);
      
      // Atualizar timestamp
      setLastUpdateTime(new Date());
      
      // Notificar todos os listeners
      notifyListeners();
      
      // Aguardar um pouco para garantir que as queries foram executadas
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('[ICPDataSync] ✅ Refresh concluído');
    } catch (error) {
      console.error('[ICPDataSync] ❌ Erro ao fazer refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [tenantId, currentIcpId, notifyListeners]);
  
  // Force refresh de tudo
  const forceRefreshAll = useCallback(async () => {
    await triggerRefresh();
  }, [triggerRefresh]);
  
  // Polling automático para detectar mudanças no onboarding
  useEffect(() => {
    if (!tenantId) return;
    
    let intervalId: NodeJS.Timeout;
    let lastOnboardingUpdate: string | null = null;
    
    const checkForUpdates = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        // Buscar última atualização do onboarding
        const { data: session } = await (supabase as any)
          .from('onboarding_sessions')
          .select('updated_at')
          .eq('tenant_id', tenantId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (session?.updated_at) {
          // Se houve mudança, disparar refresh
          if (lastOnboardingUpdate && session.updated_at !== lastOnboardingUpdate) {
            console.log('[ICPDataSync] 🔍 Mudança detectada no onboarding, disparando refresh');
            await triggerRefresh();
          }
          lastOnboardingUpdate = session.updated_at;
        }
      } catch (error) {
        console.error('[ICPDataSync] Erro ao verificar atualizações:', error);
      }
    };
    
    // Verificar a cada 10 segundos
    intervalId = setInterval(checkForUpdates, 10000);
    
    // Primeira verificação imediata
    checkForUpdates();
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [tenantId, triggerRefresh]);
  
  const value: ICPDataSyncContextType = {
    isRefreshing,
    lastUpdateTime,
    refreshTrigger,
    triggerRefresh,
    forceRefreshAll,
    currentIcpId,
    setCurrentIcpId,
    subscribe,
  };
  
  return (
    <ICPDataSyncContext.Provider value={value}>
      {children}
    </ICPDataSyncContext.Provider>
  );
}

export function useICPDataSync() {
  const context = useContext(ICPDataSyncContext);
  if (!context) {
    throw new Error('useICPDataSync deve ser usado dentro de ICPDataSyncProvider');
  }
  return context;
}

