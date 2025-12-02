/**
 * 🔄 Hook para sincronização de dados do ICP
 * Usa o contexto global para detectar mudanças e forçar refresh
 */

import { useEffect, useCallback, useState } from 'react';
import { useICPDataSync } from '@/contexts/ICPDataSyncContext';

interface UseICPDataSyncOptions {
  icpId?: string;
  autoRefresh?: boolean; // Se true, recarrega automaticamente quando há mudanças
  onRefresh?: () => void | Promise<void>; // Callback customizado ao detectar mudanças
}

export function useICPDataSyncHook(options: UseICPDataSyncOptions = {}) {
  const { icpId, autoRefresh = true, onRefresh } = options;
  const { refreshTrigger, lastUpdateTime, triggerRefresh, subscribe, isRefreshing } = useICPDataSync();
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Callback para ser chamado quando há mudanças
  const handleRefresh = useCallback(async () => {
    if (!autoRefresh) return;
    
    setIsLoading(true);
    try {
      console.log('[useICPDataSync] 🔄 Refresh detectado para ICP:', icpId);
      
      // Incrementar trigger local
      setLocalRefreshTrigger(prev => prev + 1);
      
      // Executar callback customizado se fornecido
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('[useICPDataSync] Erro ao executar refresh:', error);
    } finally {
      setIsLoading(false);
    }
  }, [autoRefresh, icpId, onRefresh]);
  
  // Inscrever no sistema de notificações
  useEffect(() => {
    const unsubscribe = subscribe(handleRefresh);
    return unsubscribe;
  }, [subscribe, handleRefresh]);
  
  // Detectar mudanças no refreshTrigger global
  useEffect(() => {
    if (refreshTrigger > 0) {
      handleRefresh();
    }
  }, [refreshTrigger, handleRefresh]);
  
  // Função para forçar refresh manual
  const forceRefresh = useCallback(async () => {
    await triggerRefresh(icpId);
    await handleRefresh();
  }, [triggerRefresh, icpId, handleRefresh]);
  
  return {
    refreshTrigger: localRefreshTrigger,
    lastUpdateTime,
    isRefreshing: isRefreshing || isLoading,
    forceRefresh,
    triggerRefresh: () => triggerRefresh(icpId),
  };
}

