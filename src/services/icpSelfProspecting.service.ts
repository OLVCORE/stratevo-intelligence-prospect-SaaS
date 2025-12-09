/**
 * MC9 V1: Self-Prospecting Engine
 * 
 * Avalia se vale a pena perseguir um ICP como prioridade, com base em:
 * - Distribuição de empresas por nível de fit (MC8)
 * - Setores e regiões predominantes
 * - Lista de alvos prioritários
 * - Scripts de abordagem por cluster
 */

import { supabase } from '@/integrations/supabase/client';
import type { MC9SelfProspectingResult } from '@/types/icp';

/**
 * Executa avaliação MC9 Self-Prospecting para um ICP
 */
export async function runMC9SelfProspecting(params: {
  icpId: string;
  tenantId: string;
}): Promise<MC9SelfProspectingResult> {
  const { icpId, tenantId } = params;

  console.log('[MC9] 🚀 Iniciando self-prospecting...', {
    icpId,
    tenantId,
  });

  try {
    // Chamar Edge Function
    const { data, error } = await supabase.functions.invoke('mc9-self-prospecting', {
      body: {
        icpId,
        tenantId,
      },
    });

    if (error) {
      console.error('[MC9] ❌ Erro na Edge Function:', error);
      throw new Error(`Erro ao executar MC9: ${error.message}`);
    }

    if (!data || !data.result) {
      throw new Error('Resposta inválida da Edge Function');
    }

    // Validar e retornar resultado
    const result = validateMC9Result(data.result);
    
    console.log('[MC9] ✅ Self-prospecting concluído:', {
      decision: result.decision,
      confidence: result.confidence,
      totalTargets: result.topTargets.length,
    });

    return result;
  } catch (error: any) {
    console.error('[MC9] ❌ Erro ao executar self-prospecting:', error);
    throw error;
  }
}

/**
 * Valida e normaliza o resultado retornado pela Edge Function
 */
function validateMC9Result(result: any): MC9SelfProspectingResult {
  // Validar campos obrigatórios
  if (!result.decision || !['SIM', 'NAO', 'PARCIAL'].includes(result.decision)) {
    throw new Error('Decisão global inválida');
  }

  if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
    throw new Error('Confiança inválida (deve ser entre 0 e 1)');
  }

  if (!result.rationale || typeof result.rationale !== 'string') {
    throw new Error('Rationale inválido');
  }

  if (!result.summary || typeof result.summary !== 'object') {
    throw new Error('Summary inválido');
  }

  if (!Array.isArray(result.topTargets)) {
    throw new Error('Top targets deve ser um array');
  }

  if (!result.scripts || typeof result.scripts !== 'object') {
    throw new Error('Scripts inválidos');
  }

  // Normalizar campos opcionais
  return {
    decision: result.decision as MC9SelfProspectingResult['decision'],
    confidence: result.confidence,
    rationale: result.rationale,
    summary: {
      totalCompanies: result.summary.totalCompanies || 0,
      byLevel: {
        ALTA: result.summary.byLevel?.ALTA || 0,
        MEDIA: result.summary.byLevel?.MEDIA || 0,
        BAIXA: result.summary.byLevel?.BAIXA || 0,
        DESCARTAR: result.summary.byLevel?.DESCARTAR || 0,
      },
      mainSectors: Array.isArray(result.summary.mainSectors) ? result.summary.mainSectors : [],
      mainRegions: Array.isArray(result.summary.mainRegions) ? result.summary.mainRegions : [],
    },
    topTargets: result.topTargets.map((target: any) => ({
      companyId: target.companyId || '',
      companyName: target.companyName || '',
      cnpj: target.cnpj || '',
      mc8Level: target.mc8Level || 'BAIXA',
      mc8Confidence: target.mc8Confidence || 0,
      uf: target.uf || null,
      sector: target.sector || null,
    })),
    scripts: {
      highFitScript: result.scripts.highFitScript || 'Script não disponível',
      mediumFitScript: result.scripts.mediumFitScript || 'Script não disponível',
    },
    generatedAt: result.generatedAt || new Date().toISOString(),
  };
}

