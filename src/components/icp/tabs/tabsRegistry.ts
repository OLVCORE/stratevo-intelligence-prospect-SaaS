// Registry de abas do relatório ICP para salvar em lote
// Cada aba registra suas funções flushSave() e getStatus()

export type Status = 'draft' | 'processing' | 'completed' | 'error';

export type TabAPI = {
  flushSave: () => Promise<void>;
  getStatus: () => Status;
};

const registry = new Map<string, TabAPI>(); // key = tabKey, ex.: 'keywords', 'totvs'

/**
 * Registra uma aba no registry
 * Cada aba deve chamar isso no useEffect
 */
export const registerTab = (tabKey: string, api: TabAPI) => {
  console.log(`[REGISTRY] 📝 Registrando aba '${tabKey}'`);
  registry.set(tabKey, api);
};

/**
 * Remove uma aba do registry (cleanup)
 */
export const unregisterTab = (tabKey: string) => {
  console.log(`[REGISTRY] 🗑️ Removendo aba '${tabKey}'`);
  registry.delete(tabKey);
};

/**
 * Salva todas as abas registradas em paralelo
 * Retorna Promise.allSettled com resultado de cada aba
 */
export const saveAllTabs = async () => {
  console.log(`[REGISTRY] 💾 Salvando todas as abas (${registry.size} registradas)...`);
  const ops = [...registry.values()].map(api => api.flushSave());
  const results = await Promise.allSettled(ops);
  
  const successes = results.filter(r => r.status === 'fulfilled').length;
  const failures = results.filter(r => r.status === 'rejected').length;
  
  console.log(`[REGISTRY] ✅ Salvo: ${successes} abas | ❌ Falhas: ${failures}`);
  
  return results;
};

/**
 * Retorna status de todas as abas registradas
 */
export const getStatuses = (): Record<string, Status> => {
  const entries = [...registry.entries()].map(([k, api]) => [k, api.getStatus()] as const);
  return Object.fromEntries(entries);
};

/**
 * Verifica se há alguma aba que não está 'completed'
 */
export const hasNonCompleted = (): boolean => {
  return [...registry.values()].some(api => api.getStatus() !== 'completed');
};

/**
 * Conta quantas abas estão em cada status
 */
export const getStatusCounts = () => {
  const statuses = Object.values(getStatuses());
  return {
    draft: statuses.filter(s => s === 'draft').length,
    processing: statuses.filter(s => s === 'processing').length,
    completed: statuses.filter(s => s === 'completed').length,
    error: statuses.filter(s => s === 'error').length,
    total: statuses.length,
  };
};

