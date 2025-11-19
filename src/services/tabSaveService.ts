/**
 * 💾 SERVIÇO DE SALVAMENTO DE ABAS
 * 
 * Gerencia salvamento individual e automático de cada aba do relatório TOTVS
 * Inclui debounce, retry, e persistência garantida
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TabSaveOptions {
  companyId: string;
  companyName?: string;
  stcHistoryId?: string;
  tabId: string;
  tabData: any;
  silent?: boolean; // Não mostrar toast de sucesso
}

const saveQueue = new Map<string, NodeJS.Timeout>();
const MAX_RETRIES = 3;

/**
 * Salva uma aba individual no banco de dados
 */
export async function saveTabToDatabase(options: TabSaveOptions): Promise<boolean> {
  const { companyId, companyName, stcHistoryId, tabId, tabData, silent = false } = options;

  if (!companyId) {
    console.error('[TAB-SAVE] ❌ companyId não fornecido');
    return false;
  }

  if (!tabData) {
    console.log(`[TAB-SAVE] ⚠️ Nenhum dado para salvar na aba '${tabId}'`);
    return false;
  }

  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      console.log(`[TAB-SAVE] 💾 Salvando aba '${tabId}' (tentativa ${retries + 1}/${MAX_RETRIES})...`);

      // Buscar relatório existente
      let reportId = stcHistoryId;
      
      if (!reportId) {
        const { data: existing } = await supabase
          .from('stc_verification_history')
          .select('id')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        reportId = existing?.id;
      }

      // Montar full_report
      let fullReport: any = {};
      
      if (reportId) {
        const { data: existingReport } = await supabase
          .from('stc_verification_history')
          .select('full_report')
          .eq('id', reportId)
          .single();
        
        fullReport = existingReport?.full_report || {};
      }

      // Mapear tabId para nome correto no full_report
      const reportKey = getReportKeyForTabId(tabId);
      fullReport[reportKey] = tabData;
      
      // Adicionar metadata
      fullReport.__meta = {
        ...fullReport.__meta,
        [`${tabId}_saved_at`]: new Date().toISOString(),
        [`${tabId}_version`]: (fullReport.__meta?.[`${tabId}_version`] || 0) + 1,
      };

      // Salvar ou atualizar
      if (reportId) {
        const { error } = await supabase
          .from('stc_verification_history')
          .update({ 
            full_report: fullReport, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', reportId);

        if (error) throw error;
        
        console.log(`[TAB-SAVE] ✅ Aba '${tabId}' salva com sucesso!`);
        
        if (!silent) {
          toast.success(`✅ ${getTabDisplayName(tabId)} salvo`, {
            description: 'Dados persistidos no banco de dados',
            duration: 2000,
          });
        }
        
        return true;
      } else {
        // Criar novo registro
        const { data: newReport, error } = await supabase
          .from('stc_verification_history')
          .insert({
            company_id: companyId,
            company_name: companyName || 'Empresa',
            full_report: fullReport,
          })
          .select('id')
          .single();

        if (error) throw error;
        
        console.log(`[TAB-SAVE] ✅ Nova aba '${tabId}' criada e salva!`);
        
        if (!silent) {
          toast.success(`✅ ${getTabDisplayName(tabId)} criado e salvo`, {
            description: 'Novo relatório criado',
            duration: 2000,
          });
        }
        
        return true;
      }
    } catch (error: any) {
      retries++;
      console.error(`[TAB-SAVE] ❌ Erro ao salvar aba '${tabId}' (tentativa ${retries}):`, error);
      
      if (retries >= MAX_RETRIES) {
        toast.error(`❌ Erro ao salvar ${getTabDisplayName(tabId)}`, {
          description: error.message || 'Tente novamente',
          duration: 5000,
        });
        return false;
      }
      
      // Aguardar antes de tentar novamente (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }

  return false;
}

/**
 * Salva uma aba com debounce (evita salvamentos excessivos)
 */
export function saveTabWithDebounce(
  options: TabSaveOptions,
  delay: number = 2000
): void {
  const key = `${options.companyId}-${options.tabId}`;
  
  // Cancelar salvamento anterior pendente
  if (saveQueue.has(key)) {
    clearTimeout(saveQueue.get(key)!);
  }
  
  // Agendar novo salvamento
  const timeout = setTimeout(async () => {
    await saveTabToDatabase({ ...options, silent: true });
    saveQueue.delete(key);
  }, delay);
  
  saveQueue.set(key, timeout);
}

/**
 * Salva todas as abas de uma vez (usado no botão "Salvar Tudo")
 */
export async function saveAllTabsToDatabase(
  companyId: string,
  companyName: string,
  stcHistoryId: string | undefined,
  tabsData: Record<string, any>
): Promise<{ success: number; failed: number }> {
  console.log('[TAB-SAVE] 💾 Salvando todas as abas...');
  
  let success = 0;
  let failed = 0;
  
  const promises = Object.entries(tabsData).map(async ([tabId, tabData]) => {
    if (!tabData) return;
    
    const result = await saveTabToDatabase({
      companyId,
      companyName,
      stcHistoryId,
      tabId,
      tabData,
      silent: true,
    });
    
    if (result) {
      success++;
    } else {
      failed++;
    }
  });
  
  await Promise.allSettled(promises);
  
  console.log(`[TAB-SAVE] ✅ Salvas: ${success} | ❌ Falhas: ${failed}`);
  
  if (success > 0) {
    toast.success(`✅ ${success} aba(s) salva(s)`, {
      description: failed > 0 ? `${failed} falha(s)` : 'Todas as abas foram salvas',
      duration: 3000,
    });
  }
  
  return { success, failed };
}

/**
 * Mapeia tabId para a chave correta no full_report
 */
function getReportKeyForTabId(tabId: string): string {
  const mapping: Record<string, string> = {
    'detection': 'detection_report',
    'decisors': 'decisors_report',
    'digital': 'digital_report',
    'competitors': 'competitors_report',
    'similar': 'similar_companies_report',
    'clients': 'clients_report',
    'analysis': 'analysis_report',
    'products': 'products_report',
    'opportunities': 'opportunities_report',
    'executive': 'executive_report',
    'keywords': 'keywords_seo_report',
  };
  
  return mapping[tabId] || `${tabId}_report`;
}

/**
 * Retorna nome amigável da aba
 */
function getTabDisplayName(tabId: string): string {
  const names: Record<string, string> = {
    'detection': 'TOTVS Check',
    'decisors': 'Decisores',
    'digital': 'Digital Intelligence',
    'competitors': 'Competidores',
    'similar': 'Empresas Similares',
    'clients': 'Client Discovery',
    'analysis': 'Análise 360°',
    'products': 'Produtos Recomendados',
    'opportunities': 'Oportunidades',
    'executive': 'Sumário Executivo',
    'keywords': 'Keywords SEO',
  };
  
  return names[tabId] || tabId;
}

/**
 * Limpa a fila de salvamento (útil para cleanup)
 */
export function clearSaveQueue(): void {
  saveQueue.forEach(timeout => clearTimeout(timeout));
  saveQueue.clear();
}

