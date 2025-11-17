/**
 * UTILITÁRIOS PARA PRODUTOS & OPORTUNIDADES
 * 
 * Funções auxiliares para cálculos de ARR, probabilidade, timeline, etc.
 */

import type { EditedARR, PotentialEstimate, ProbabilityCriteria, TimelineCriteria, ContractPeriod } from '@/types/productOpportunities';

/**
 * Formatar valor monetário (R$)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formatar ARR (R$/ano)
 */
export function formatARR(value: number): string {
  return `${formatCurrency(value)}/ano`;
}

/**
 * Formatar valor total de contrato
 */
export function formatContractTotal(arrAnnual: number, years: number): string {
  const total = arrAnnual * years;
  return formatCurrency(total);
}

/**
 * Calcular probabilidade de fechamento
 * 
 * Baseado em:
 * - Maturidade digital (0-100)
 * - Decisores C-Level identificados (0-1)
 * - Saúde financeira (excellent/good/fair/poor)
 * - Momento da empresa (expansion/stable/crisis)
 * - Tipo de venda (new-sale/cross-sell/upsell)
 * - Evidências de interesse (count)
 */
export function calculateProbability(criteria: {
  digitalMaturity?: number; // 0-100
  cLevelDecisors?: number; // 0+
  healthScore?: 'excellent' | 'good' | 'fair' | 'poor';
  companyMoment?: 'expansion' | 'stable' | 'crisis';
  salesType?: 'new-sale' | 'cross-sell' | 'upsell';
  interestEvidences?: number; // 0+
}): ProbabilityCriteria {
  // Base de probabilidade
  const base = 50;
  
  // Maturidade digital (0-10pts)
  const digitalMaturity = Math.min(10, Math.floor((criteria.digitalMaturity || 0) / 10));
  
  // Decisores C-Level (+10pts se > 0)
  const cLevelDecisors = (criteria.cLevelDecisors || 0) > 0 ? 10 : 0;
  
  // Saúde financeira (+5-15pts)
  const healthScoreMap = {
    excellent: 15,
    good: 10,
    fair: 5,
    poor: 0,
  };
  const healthScore = healthScoreMap[criteria.healthScore || 'fair'];
  
  // Momento da empresa (+10pts se expansion, +5pts se stable, -5pts se crisis)
  const momentMap = {
    expansion: 10,
    stable: 5,
    crisis: -5,
  };
  const companyMoment = momentMap[criteria.companyMoment || 'stable'];
  
  // Tipo de venda (+15pts se cross-sell, +10pts se upsell, 0 se new-sale)
  const salesTypeMap = {
    'new-sale': 0,
    'cross-sell': 15,
    'upsell': 10,
  };
  const salesType = salesTypeMap[criteria.salesType || 'new-sale'];
  
  // Evidências de interesse (+5pts se > 0)
  const interestEvidences = (criteria.interestEvidences || 0) > 0 ? 5 : 0;
  
  // Total calculado
  const total = base + digitalMaturity + cLevelDecisors + healthScore + companyMoment + salesType + interestEvidences;
  
  // Total limitado (30-95%)
  const final = Math.max(30, Math.min(95, total));
  
  return {
    base,
    digitalMaturity,
    cLevelDecisors,
    healthScore,
    companyMoment,
    salesType,
    interestEvidences,
    total,
    final,
  };
}

/**
 * Calcular timeline de implementação
 * 
 * Baseado em:
 * - Complexidade do produto (base time em meses)
 * - Tamanho da empresa (pequena/média/grande)
 * - Número de produtos (1/2-3/4+)
 * - Maturidade digital (alta/baixa)
 */
export function calculateTimeline(criteria: {
  productBaseTime?: number; // meses (ex: 3, 6, 9, 12)
  size?: 'MICRO' | 'PEQUENA' | 'MÉDIA' | 'GRANDE' | 'DEMAIS';
  productCount?: number; // número de produtos
  digitalMaturity?: number; // 0-100
}): TimelineCriteria {
  // Tempo base do produto (default: 6 meses)
  const productBaseTime = criteria.productBaseTime || 6;
  
  // Ajuste por porte
  const sizeAdjustmentMap = {
    MICRO: 0,
    PEQUENA: 1,
    MÉDIA: 3,
    GRANDE: 6,
    DEMAIS: 6,
  };
  const sizeAdjustment = sizeAdjustmentMap[criteria.size || 'MÉDIA'];
  
  // Ajuste por quantidade de produtos
  const productCount = criteria.productCount || 1;
  let quantityAdjustment = 0;
  if (productCount > 3) {
    quantityAdjustment = 2;
  } else if (productCount > 1) {
    quantityAdjustment = 1;
  }
  
  // Ajuste por maturidade digital (alta = -20%, baixa = +20%)
  const digitalMaturity = criteria.digitalMaturity || 50;
  const maturityAdjustment = digitalMaturity < 50 ? 1 : 0; // +1 mês se maturidade baixa
  
  // Total calculado (meses)
  const totalMonths = productBaseTime + sizeAdjustment + quantityAdjustment + maturityAdjustment;
  
  // Timeline formatado (string) - Ex: "3-6 meses", "6-12 meses"
  let formatted = '';
  if (totalMonths <= 3) {
    formatted = '1-3 meses';
  } else if (totalMonths <= 6) {
    formatted = '3-6 meses';
  } else if (totalMonths <= 12) {
    formatted = '6-12 meses';
  } else if (totalMonths <= 18) {
    formatted = '12-18 meses';
  } else {
    formatted = '18+ meses';
  }
  
  return {
    productBaseTime,
    sizeAdjustment,
    quantityAdjustment,
    maturityAdjustment,
    totalMonths,
    formatted,
  };
}

/**
 * Calcular potencial estimado (total agregado)
 * 
 * Soma todos os ARR dos produtos e calcula contratos multi-ano
 */
export function calculatePotentialEstimate(
  productsARR: Array<{ arrMin: number; arrMax: number; contractPeriod?: ContractPeriod }>
): PotentialEstimate {
  // ARR Total (soma)
  const arrTotalMin = productsARR.reduce((sum, p) => sum + (p.arrMin || 0), 0);
  const arrTotalMax = productsARR.reduce((sum, p) => sum + (p.arrMax || 0), 0);
  
  // Contrato 3 Anos
  const contract3Years = {
    min: arrTotalMin * 3,
    max: arrTotalMax * 3,
  };
  
  // Contrato 5 Anos
  const contract5Years = {
    min: arrTotalMin * 5,
    max: arrTotalMax * 5,
  };
  
  return {
    arrTotalMin,
    arrTotalMax,
    contract3Years,
    contract5Years,
    probability: 0, // Calculado separadamente (média ponderada)
    timeline: '', // Timeline mais longo
    recalculatedAt: new Date().toISOString(),
  };
}

/**
 * Extrair ARR de string (ex: "R$ 30K-50K/ano" ou "R$ 30.000-50.000/ano")
 */
export function parseARRFromString(value: string): { min: number; max: number } | null {
  // Remove espaços e converte para minúsculas
  const cleaned = value.replace(/\s/g, '').toLowerCase();
  
  // Regex para capturar valores monetários
  const regex = /r\$\s*([\d,.]+)(?:k|mil)?(?:\s*-\s*r\$\s*([\d,.]+)(?:k|mil)?)?/;
  const match = cleaned.match(regex);
  
  if (!match) return null;
  
  // Converter para número (remove pontos e vírgulas, trata K/mil)
  const parseValue = (val: string): number => {
    const num = parseFloat(val.replace(/[.,]/g, ''));
    if (val.toLowerCase().includes('k') || val.toLowerCase().includes('mil')) {
      return num * 1000;
    }
    return num;
  };
  
  const min = parseValue(match[1]);
  const max = match[2] ? parseValue(match[2]) : min;
  
  return { min, max };
}

/**
 * Tooltip explicativo para ARR
 */
export const ARR_TOOLTIP = `ARR (Annual Recurring Revenue) = Valor RECORRENTE ANUAL

✅ O MAIS IMPORTANTE para TOTVS: Este é o valor que a empresa pagará ANUALMENTE de forma recorrente.

💡 Diferente de:
- Software inicial: Valor one-time (único pagamento)
- Implementação: Valor one-time (único pagamento)
- Manutenção: Valor recorrente adicional (opcional)

📊 Exemplo:
- ARR: R$ 100.000/ano
- Contrato 3 anos: R$ 300.000 total
- Contrato 5 anos: R$ 500.000 total`;

/**
 * Tooltip explicativo para Probabilidade
 */
export const PROBABILITY_TOOLTIP = `Probabilidade de Fechamento (0-100%)

Baseado em análise de múltiplos fatores:

📊 Critérios (iterativo - refinar ao longo do tempo):
- Maturidade Digital (0-10pts)
- Decisores C-Level identificados (+10pts)
- Saúde Financeira (+5-15pts)
- Momento da Empresa (+10pts se expansão, +5pts se estável, -5pts se crise)
- Tipo de Venda (+15pts se cross-sell, +10pts se upsell, 0 se new-sale)
- Evidências de Interesse (+5pts se há evidências)

🎯 Range: 30-95% (ajustado automaticamente)`;

/**
 * Tooltip explicativo para Timeline
 */
export const TIMELINE_TOOLTIP = `Timeline de Implementação

Estimativa baseada em múltiplos fatores:

📊 Critérios (iterativo - refinar ao longo do tempo):
- Complexidade do Produto (tempo base)
- Tamanho da Empresa (micro: 0 meses, pequena: +1 mês, média: +3 meses, grande: +6 meses)
- Número de Produtos (1 produto: 0, 2-3 produtos: +1 mês, 4+ produtos: +2 meses)
- Maturidade Digital (alta: -20%, baixa: +20%)

🎯 Range típico: 1-18 meses`;

