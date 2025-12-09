/**
 * Serviço para persistir dados de enriquecimento de empresas qualificadas
 */

import { supabase } from '@/integrations/supabase/client';

export interface QualifiedEnrichmentParams {
  stockId: string;
  tenantId: string;
  cnpj: string;
  fantasia?: string | null;
  cnae_principal?: string | null;
  cnae_tipo?: 'MANUFATURA' | 'COMERCIO' | 'SERVICOS' | 'AGRO' | 'OUTROS' | null;
  data_quality?: 'COMPLETO' | 'PARCIAL' | 'RUIM' | null;
  fit_score?: number | null;
  grade?: 'A+' | 'A' | 'B' | 'C' | 'D' | null;
  origem?: string | null;
  raw?: any;
}

/**
 * Salva ou atualiza dados de enriquecimento
 */
export async function saveQualifiedEnrichment(params: QualifiedEnrichmentParams) {
  const { stockId, tenantId, cnpj, ...rest } = params;

  try {
    const { data, error } = await (supabase as any)
      .from('qualified_stock_enrichment')
      .upsert(
        {
          stock_id: stockId,
          tenant_id: tenantId,
          cnpj,
          ...rest,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'stock_id,cnpj',
          ignoreDuplicates: false,
        }
      )
      .select();

    if (error) {
      // Se a tabela não existe (PGRST116), apenas logar e continuar
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        console.warn('[saveQualifiedEnrichment] ⚠️ Tabela não existe ainda. Aplicar migration:', error);
        return { data: null, error: null }; // Não falhar, apenas avisar
      }
      console.error('[saveQualifiedEnrichment] Erro:', error);
      throw error;
    }

    console.log('[saveQualifiedEnrichment] ✅ Dados salvos:', { stockId, cnpj });
    return { data, error: null };
  } catch (error: any) {
    // Se a tabela não existe, não falhar
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
      console.warn('[saveQualifiedEnrichment] ⚠️ Tabela não existe ainda. Aplicar migration:', error);
      return { data: null, error: null };
    }
    console.error('[saveQualifiedEnrichment] Erro ao salvar:', error);
    return { data: null, error };
  }
}

/**
 * Classifica CNAE por tipo
 */
export function classifyCnaeType(cnaeCode?: string | null): 'MANUFATURA' | 'COMERCIO' | 'SERVICOS' | 'AGRO' | 'OUTROS' | null {
  if (!cnaeCode) return null;

  const code = parseInt(cnaeCode.substring(0, 2), 10);

  // CNAE por faixa
  if (code >= 1 && code <= 3) return 'AGRO';
  if (code >= 10 && code <= 33) return 'MANUFATURA';
  if (code >= 45 && code <= 47) return 'COMERCIO';
  if (code >= 49 && code <= 53) return 'SERVICOS'; // Transporte, armazenagem, correio
  if (code >= 55 && code <= 56) return 'SERVICOS'; // Alojamento e alimentação
  if (code >= 58 && code <= 63) return 'SERVICOS'; // Informação e comunicação
  if (code >= 64 && code <= 66) return 'SERVICOS'; // Atividades financeiras
  if (code >= 68) return 'SERVICOS'; // Outros serviços

  return 'OUTROS';
}

/**
 * Calcula data_quality baseado nos dados disponíveis
 */
export function calculateDataQuality(data: any): 'COMPLETO' | 'PARCIAL' | 'RUIM' {
  let score = 0;
  const maxScore = 10;

  // Razão social (2 pontos)
  if (data.nome || data.razao_social) score += 2;

  // Fantasia (1 ponto)
  if (data.fantasia || data.nome_fantasia) score += 1;

  // Endereço completo (2 pontos)
  if (data.logradouro && data.municipio && data.uf) score += 2;

  // CNAE (1 ponto)
  if (data.atividade_principal?.length > 0 || data.cnae_fiscal) score += 1;

  // Contato (2 pontos)
  if (data.email) score += 1;
  if (data.telefone) score += 1;

  // QSA (1 ponto)
  if (data.qsa?.length > 0) score += 1;

  // Website (1 ponto)
  if (data.website) score += 1;

  if (score >= 8) return 'COMPLETO';
  if (score >= 5) return 'PARCIAL';
  return 'RUIM';
}

/**
 * Calcula fit_score básico (0-100)
 * Nota: Este é um cálculo simplificado. O cálculo completo é feito pelo process_qualification_job
 */
export function calculateBasicFitScore(data: any, icpMatch?: boolean): number {
  let score = 0;

  // Dados completos (20 pontos)
  const dataQuality = calculateDataQuality(data);
  if (dataQuality === 'COMPLETO') score += 20;
  else if (dataQuality === 'PARCIAL') score += 10;

  // Website (5 pontos)
  if (data.website) score += 5;

  // Contato (5 pontos)
  if (data.email || data.telefone) score += 5;

  // Setor/CNAE (40 pontos - se houver match com ICP)
  if (icpMatch && (data.atividade_principal?.length > 0 || data.cnae_fiscal)) {
    score += 40;
  } else if (data.atividade_principal?.length > 0 || data.cnae_fiscal) {
    score += 20; // Setor presente mas sem match ICP
  }

  // Localização (30 pontos - simplificado)
  if (data.municipio && data.uf) {
    score += 30;
  } else if (data.uf) {
    score += 15;
  }

  return Math.min(100, score);
}

/**
 * Calcula grade baseado no fit_score
 */
export function calculateGrade(fitScore: number | null): 'A+' | 'A' | 'B' | 'C' | 'D' | null {
  if (fitScore === null || fitScore === undefined) return null;

  if (fitScore >= 90) return 'A+';
  if (fitScore >= 75) return 'A';
  if (fitScore >= 60) return 'B';
  if (fitScore >= 40) return 'C';
  return 'D';
}

