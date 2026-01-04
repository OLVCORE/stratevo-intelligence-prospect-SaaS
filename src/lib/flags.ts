// ORDEM OPERACIONAL #SAFE-00 — Feature Flags Centralizadas
// Controle de modo seguro para desenvolvimento sem custo

/**
 * Lê uma flag de ambiente de forma segura
 */
export const flag = (name: string, def = '') =>
  String((import.meta as any)?.env?.[name] ?? def).trim().toLowerCase();

/**
 * Verifica se valor é truthy (1, true, on, yes)
 */
const truthy = (v: string) => ['1', 'true', 'on', 'yes'].includes(v);

/**
 * SAFE_MODE: Ativa proteções máximas (sem custos)
 * - Desabilita autosave automático
 * - Desabilita auto-discovery
 * - Bloqueia writes no Supabase
 * - Mostra banner de aviso
 */
export const SAFE_MODE = truthy(flag('VITE_SAFE_MODE'));

/**
 * DISABLE_AUTOSAVE: Desabilita salvamento automático
 * - scheduleSave vira no-op
 * - flushSave vira no-op
 * - Apenas salvamento manual na SaveBar
 */
export const DISABLE_AUTOSAVE = truthy(flag('VITE_DISABLE_AUTOSAVE'));

/**
 * DISABLE_AUTO_DISCOVERY: Desabilita discovery automático
 * - Discovery só roda com clique explícito no botão
 * - Economiza créditos de APIs (Serper, Hunter, etc.)
 */
export const DISABLE_AUTO_DISCOVERY = truthy(flag('VITE_DISABLE_AUTO_DISCOVERY'));

/**
 * BLOCK_WRITES: Bloqueia escrita no Supabase (dry-run)
 * - updateFullReport vira no-op
 * - Simula sucesso sem persistir
 * - Útil para testar UX sem side-effects
 */
export const BLOCK_WRITES = truthy(flag('VITE_BLOCK_WRITES'));

/**
 * DEBUG_SAVEBAR: Ativa telemetria de diagnóstico
 * - Logs detalhados de SaveBar e Autosave
 * - Helpers em src/lib/diag.ts
 */
export const DEBUG_SAVEBAR = truthy(flag('VITE_DEBUG_SAVEBAR'));

/**
 * ENABLE_PROSPECCAO: Ativa módulo de Prospecção Avançada
 * - Habilita rota /prospeccao-avancada
 * - Mostra menu no sidebar
 * - Permite busca avançada de empresas
 */
export const ENABLE_PROSPECCAO = truthy(flag('VITE_ENABLE_PROSPECCAO'));

/**
 * Log centralizado das flags no boot (dev only)
 * Chamado pelo main.tsx para mostrar flags ativas
 */
export function logFlagsOnBoot() {
  if (!import.meta.env.DEV) return;
  
  try {
    // Vite injeta as envs em import.meta.env como strings
    const env = (import.meta as any)?.env ?? {};
    
    // eslint-disable-next-line no-console
    console.log('[DIAG][BOOT] flags:', {
      VITE_SAFE_MODE: env?.VITE_SAFE_MODE ?? '',
      VITE_DISABLE_AUTOSAVE: env?.VITE_DISABLE_AUTOSAVE ?? '',
      VITE_DISABLE_AUTO_DISCOVERY: env?.VITE_DISABLE_AUTO_DISCOVERY ?? '',
      VITE_BLOCK_WRITES: env?.VITE_BLOCK_WRITES ?? '',
      VITE_DEBUG_SAVEBAR: env?.VITE_DEBUG_SAVEBAR ?? '',
      VITE_ENABLE_PROSPECCAO: env?.VITE_ENABLE_PROSPECCAO ?? '',
    });
    
    // Log consolidado (tabela)
    console.group('[FLAGS] 🚩 Feature Flags Carregadas');
    console.log('SAFE_MODE:', SAFE_MODE);
    console.log('DISABLE_AUTOSAVE:', DISABLE_AUTOSAVE);
    console.log('DISABLE_AUTO_DISCOVERY:', DISABLE_AUTO_DISCOVERY);
    console.log('BLOCK_WRITES:', BLOCK_WRITES);
    console.log('DEBUG_SAVEBAR:', DEBUG_SAVEBAR);
    console.log('ENABLE_PROSPECCAO:', ENABLE_PROSPECCAO, `(valor raw: "${env?.VITE_ENABLE_PROSPECCAO ?? 'não definido'}")`);
    console.groupEnd();
  } catch {
    // noop
  }
}
