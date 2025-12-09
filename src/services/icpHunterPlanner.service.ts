/**
 * MC9 V2.0: Hunter Planner (Expansão de Mercado)
 * 
 * Cria um plano de hunting externo sem executar buscas reais.
 * Planeja clusters, queries e template de planilha para o operador humano.
 */

import { supabase } from '@/integrations/supabase/client';
import type { MC9HunterPlanResult } from '@/types/icp';

/**
 * Executa MC9 V2.0 Hunter Planner para um ICP
 */
export async function runMC9HunterPlanner(params: {
  icpId: string;
  tenantId: string;
}): Promise<MC9HunterPlanResult> {
  const { icpId, tenantId } = params;

  console.log('[MC9-V2] 🎯 Iniciando hunter planner...', {
    icpId,
    tenantId,
  });

  try {
    // Chamar Edge Function
    const { data, error } = await supabase.functions.invoke('mc9-hunter-planner', {
      body: {
        icpId,
        tenantId,
      },
    });

    if (error) {
      console.error('[MC9-V2] ❌ Erro na Edge Function:', error);
      throw new Error(`Erro ao executar MC9 V2.0: ${error.message}`);
    }

    if (!data || !data.result) {
      throw new Error('Resposta inválida da Edge Function');
    }

    // Validar e retornar resultado
    const result = validateMC9HunterPlanResult(data.result);
    
    console.log('[MC9-V2] ✅ Hunter planner concluído:', {
      clustersCount: result.clusters.length,
      queriesCount: result.queries.length,
    });

    return result;
  } catch (error: any) {
    console.error('[MC9-V2] ❌ Erro ao executar hunter planner:', error);
    throw error;
  }
}

/**
 * Valida e normaliza o resultado retornado pela Edge Function
 */
function validateMC9HunterPlanResult(result: any): MC9HunterPlanResult {
  // Validar campos obrigatórios
  if (!result.icpId || typeof result.icpId !== 'string') {
    throw new Error('icpId inválido');
  }

  if (!result.decisionFromMC9 || !['SIM', 'NAO', 'PARCIAL'].includes(result.decisionFromMC9)) {
    throw new Error('Decisão MC9 inválida');
  }

  if (!result.summary || typeof result.summary !== 'object') {
    throw new Error('Summary inválido');
  }

  if (!Array.isArray(result.clusters)) {
    throw new Error('Clusters deve ser um array');
  }

  if (!Array.isArray(result.queries)) {
    throw new Error('Queries deve ser um array');
  }

  if (!result.spreadsheetTemplate || typeof result.spreadsheetTemplate !== 'object') {
    throw new Error('SpreadsheetTemplate inválido');
  }

  // Normalizar campos opcionais
  return {
    icpId: result.icpId,
    decisionFromMC9: result.decisionFromMC9 as MC9HunterPlanResult['decisionFromMC9'],
    summary: {
      mainSectors: Array.isArray(result.summary.mainSectors) ? result.summary.mainSectors : [],
      mainRegions: Array.isArray(result.summary.mainRegions) ? result.summary.mainRegions : [],
      highFitCount: typeof result.summary.highFitCount === 'number' ? result.summary.highFitCount : 0,
      mediumFitCount: typeof result.summary.mediumFitCount === 'number' ? result.summary.mediumFitCount : 0,
    },
    clusters: result.clusters.map((cluster: any) => ({
      name: cluster.name || 'Cluster sem nome',
      rationale: cluster.rationale || 'Sem justificativa',
      idealTitles: Array.isArray(cluster.idealTitles) ? cluster.idealTitles : [],
      idealDepartments: Array.isArray(cluster.idealDepartments) ? cluster.idealDepartments : [],
      idealCompanyAttributes: Array.isArray(cluster.idealCompanyAttributes) ? cluster.idealCompanyAttributes : [],
    })),
    queries: result.queries.map((query: any) => ({
      channel: query.channel || 'LINKEDIN',
      label: query.label || 'Query sem label',
      description: query.description || 'Sem descrição',
      query: query.query || '',
    })),
    spreadsheetTemplate: {
      columns: Array.isArray(result.spreadsheetTemplate.columns) 
        ? result.spreadsheetTemplate.columns 
        : [],
      notes: result.spreadsheetTemplate.notes || 'Sem instruções',
    },
    notesForOperator: result.notesForOperator || 'Sem orientações',
    generatedAt: result.generatedAt || new Date().toISOString(),
  };
}

