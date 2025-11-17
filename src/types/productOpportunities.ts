/**
 * TIPOS PARA PRODUTOS & OPORTUNIDADES
 * 
 * Estrutura completa para ARR (Annual Recurring Revenue) vs Recurrence
 * Incluindo período de contrato para estipular valor do ARR
 */

/**
 * Período de contrato (anos)
 */
export type ContractPeriod = 1 | 3 | 5;

/**
 * Fonte do valor ARR
 */
export type ARRSource = 'estimated' | 'totvs' | 'market' | 'edited';

/**
 * Valores ARR editáveis por produto
 * 
 * IMPORTANTE:
 * - ARR (arrMin/arrMax) = Valor RECORRENTE ANUAL (O MAIS IMPORTANTE para TOTVS)
 * - initialSoftware = Valor ONE-TIME do software (se houver)
 * - implementation = Valor ONE-TIME de implementação
 * - annualMaintenance = Valor RECORRENTE ANUAL de manutenção
 */
export interface EditedARR {
  // ========================================
  // RECURRENCE (ARR) - O MAIS IMPORTANTE
  // ========================================
  /**
   * ARR Mínimo (R$/ano) - Valor recorrente anual mínimo
   * Este é o valor MAIS IMPORTANTE para TOTVS
   */
  arrMin: number;
  
  /**
   * ARR Máximo (R$/ano) - Valor recorrente anual máximo
   * Este é o valor MAIS IMPORTANTE para TOTVS
   */
  arrMax: number;
  
  // ========================================
  // PERÍODO DE CONTRATO (CRÍTICO)
  // ========================================
  /**
   * Período de contrato (anos)
   * Usado para estipular o valor total do ARR ao longo do contrato
   * Ex: ARR de R$ 100K/ano × 3 anos = R$ 300K total
   */
  contractPeriod: ContractPeriod;
  
  // ========================================
  // ONE-TIME (Opcional)
  // ========================================
  /**
   * Software Inicial (R$) - Valor one-time do software (se houver)
   * Não confundir com ARR (recurrence)
   */
  initialSoftware?: number;
  
  /**
   * Implementação (R$) - Valor one-time de implementação
   */
  implementation?: number;
  
  // ========================================
  // RECURRENCE ADICIONAL
  // ========================================
  /**
   * Manutenção Anual (R$/ano) - Valor recorrente anual de manutenção
   * Adicional ao ARR base
   */
  annualMaintenance?: number;
  
  // ========================================
  // METADADOS DE ANÁLISE
  // ========================================
  /**
   * Probabilidade de fechamento (0-100%)
   * Calculada automaticamente baseado em:
   * - Maturidade digital
   * - Decisores identificados
   * - Saúde financeira
   * - Momento da empresa
   * - Tipo de venda (New Sale/Cross-Sell/Upsell)
   */
  probability: number;
  
  /**
   * ROI Esperado (meses) - Tempo esperado para retorno sobre investimento
   */
  roiMonths: number;
  
  /**
   * Timeline de Implementação (string) - Ex: "3-6 meses"
   * Calculada automaticamente baseado em:
   * - Complexidade do produto
   * - Tamanho da empresa
   * - Número de produtos
   * - Maturidade digital
   */
  timeline: string;
  
  /**
   * Fonte do valor
   */
  source: ARRSource;
  
  /**
   * Timestamp de edição
   */
  editedAt?: string;
  
  /**
   * User ID que editou
   */
  editedBy?: string;
}

/**
 * Potencial estimado calculado (total agregado)
 */
export interface PotentialEstimate {
  /**
   * ARR Total Mínimo (R$/ano) - Soma dos ARR mínimos de todos os produtos
   */
  arrTotalMin: number;
  
  /**
   * ARR Total Máximo (R$/ano) - Soma dos ARR máximos de todos os produtos
   */
  arrTotalMax: number;
  
  /**
   * Contrato 3 Anos - Valor total do ARR × 3 anos
   */
  contract3Years: {
    min: number;
    max: number;
  };
  
  /**
   * Contrato 5 Anos - Valor total do ARR × 5 anos
   */
  contract5Years: {
    min: number;
    max: number;
  };
  
  /**
   * Probabilidade Média - Média ponderada das probabilidades
   */
  probability: number;
  
  /**
   * Timeline Agregado - Timeline mais longo entre todos os produtos
   */
  timeline: string;
  
  /**
   * Quando foi recalculado
   */
  recalculatedAt: string;
}

/**
 * Produto & Oportunidade completo
 */
export interface ProductOpportunity {
  /**
   * Nome do produto
   */
  name: string;
  
  /**
   * Categoria do produto
   */
  category: string;
  
  /**
   * Prioridade (primary/relevant/future)
   */
  priority: 'primary' | 'relevant' | 'future';
  
  /**
   * Use case (por que foi recomendado)
   */
  useCase: string;
  
  /**
   * Valores ARR editáveis
   */
  editedARR?: EditedARR;
  
  /**
   * Evidências de detecção (se produto em uso)
   */
  evidences?: Array<{
    url: string;
    title: string;
    source: string;
  }>;
}

/**
 * Critérios de cálculo de probabilidade
 * 
 * Baseado em:
 * - Maturidade digital (0-100)
 * - Decisores C-Level identificados (0-1)
 * - Saúde financeira (excellent/good/fair/poor)
 * - Momento da empresa (expansion/stable/crisis)
 * - Tipo de venda (new-sale/cross-sell/upsell)
 * - Evidências de interesse (count)
 */
export interface ProbabilityCriteria {
  /**
   * Base de probabilidade (50%)
   */
  base: number;
  
  /**
   * Maturidade digital (0-10pts)
   */
  digitalMaturity: number;
  
  /**
   * Decisores C-Level identificados (+10pts se > 0)
   */
  cLevelDecisors: number;
  
  /**
   * Saúde financeira (+5-15pts)
   */
  healthScore: number;
  
  /**
   * Momento da empresa (+10pts se expansion, +5pts se stable, -5pts se crisis)
   */
  companyMoment: number;
  
  /**
   * Tipo de venda (+15pts se cross-sell, 0 se new-sale)
   */
  salesType: number;
  
  /**
   * Evidências de interesse (+5pts se > 0)
   */
  interestEvidences: number;
  
  /**
   * Total calculado (base + todos os fatores)
   */
  total: number;
  
  /**
   * Total limitado (30-95%)
   */
  final: number;
}

/**
 * Critérios de cálculo de timeline
 * 
 * Baseado em:
 * - Complexidade do produto (base time)
 * - Tamanho da empresa (pequena/média/grande)
 * - Número de produtos (1/2-3/4+)
 * - Maturidade digital (alta/baixa)
 */
export interface TimelineCriteria {
  /**
   * Tempo base do produto (meses)
   */
  productBaseTime: number;
  
  /**
   * Ajuste por porte (0-6 meses)
   */
  sizeAdjustment: number;
  
  /**
   * Ajuste por quantidade de produtos (0-2 meses)
   */
  quantityAdjustment: number;
  
  /**
   * Ajuste por maturidade digital (0-1 mês)
   */
  maturityAdjustment: number;
  
  /**
   * Total calculado (meses)
   */
  totalMonths: number;
  
  /**
   * Timeline formatado (string) - Ex: "3-6 meses"
   */
  formatted: string;
}

