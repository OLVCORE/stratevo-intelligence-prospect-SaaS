// ✅ Adapter para análise de score de crédito e saúde financeira
import { logger } from '@/lib/utils/logger';
import { cache } from '@/lib/utils/cache';

export interface FinancialHealthData {
  cnpj: string;
  companyName: string;
  creditScore: number; // 0-1000
  riskClassification: 'A' | 'B' | 'C' | 'D' | 'E';
  serasaData?: {
    score: number;
    negativacoes: number;
    protestos: number;
    chequesSemFundo: number;
    acoesJudiciais: number;
    falencias: number;
    recuperacoesJudiciais: number;
  };
  scpcData?: {
    score: number;
    pendenciasFinanceiras: number;
    valorTotal: number;
  };
  paymentHistory: {
    onTimePayments: number;
    latePayments: number;
    defaultPayments: number;
    avgPaymentDelay: number; // dias
  };
  debtIndicators: {
    totalDebt: number;
    currentDebt: number;
    overdueDebt: number;
    debtToRevenueRatio?: number;
  };
  predictiveRiskScore: number; // 0-100 (0 = alto risco, 100 = baixo risco)
  trends: {
    improving: boolean;
    stable: boolean;
    deteriorating: boolean;
  };
}

export interface CreditScoreOptions {
  includeHistory?: boolean;
  includePredictive?: boolean;
}

/**
 * Busca dados de saúde financeira e score de crédito
 */
export async function fetchFinancialHealthData(
  cnpj: string,
  options: CreditScoreOptions = {}
): Promise<FinancialHealthData> {
  const cacheKey = `financial:${cnpj}`;
  
  // Verificar cache
  const cached = cache.get<FinancialHealthData>(cacheKey);
  if (cached) {
    logger.info('FINANCIAL', 'Cache hit', { cnpj });
    return cached;
  }

  try {
    logger.info('FINANCIAL', 'Fetching financial health data', { cnpj });

    // 🔥 BUG 3 FIX: Retornar null/indefinido ao invés de zeros para indicar "dados não disponíveis"
    // Zeros fazem lógica downstream tratar como dados negativos (crédito falido, sem problemas legais)
    // ao invés de "dados não coletados ainda"
    
    // TODO: Implementar integração real com Serasa, Boa Vista SCPC, etc.
    // 🔥 BUG 6 FIX: Retornar estrutura com valores padrão estruturados ao invés de null as any
    // Isso previne TypeErrors quando código downstream tenta calcular com esses valores
    const emptyData: FinancialHealthData = {
      cnpj,
      companyName: '', // String vazia ao invés de null
      creditScore: 0, // Zero indica "não disponível" mas permite cálculos sem TypeError
      riskClassification: 'E' as any, // Classificação mais conservadora quando dados não disponíveis
      paymentHistory: {
        onTimePayments: 0,
        latePayments: 0,
        defaultPayments: 0,
        avgPaymentDelay: 0
      },
      debtIndicators: {
        totalDebt: 0,
        currentDebt: 0,
        overdueDebt: 0
      },
      predictiveRiskScore: 0,
      trends: {
        improving: false,
        stable: false,
        deteriorating: false
      }
    };

    logger.warn('FINANCIAL', 'Integração não implementada - retornando dados null (não disponíveis)', { cnpj });
    return emptyData;
  } catch (error) {
    logger.error('FINANCIAL', 'Failed to fetch financial data', { error, cnpj });
    throw error;
  }
}

/**
 * Calcula classificação de risco baseada no credit score
 */
export function calculateRiskClassification(creditScore: number): 'A' | 'B' | 'C' | 'D' | 'E' {
  if (creditScore >= 800) return 'A';
  if (creditScore >= 700) return 'B';
  if (creditScore >= 600) return 'C';
  if (creditScore >= 500) return 'D';
  return 'E';
}

/**
 * Calcula score preditivo de risco (0-100)
 */
export function calculatePredictiveRiskScore(data: FinancialHealthData): number {
  let score = 100;

  // Credit score (peso 30%)
  const creditScoreNormalized = (data.creditScore / 1000) * 30;
  score = creditScoreNormalized;

  // Histórico de pagamentos (peso 25%)
  const { onTimePayments, latePayments, defaultPayments } = data.paymentHistory;
  const totalPayments = onTimePayments + latePayments + defaultPayments;
  if (totalPayments > 0) {
    const paymentScore = (onTimePayments / totalPayments) * 25;
    score += paymentScore;
  }

  // Indicadores de dívida (peso 20%)
  const { overdueDebt, totalDebt, debtToRevenueRatio } = data.debtIndicators;
  let debtScore = 20;
  if (overdueDebt > 0) debtScore -= 10;
  if (debtToRevenueRatio && debtToRevenueRatio > 0.5) debtScore -= 5;
  if (debtToRevenueRatio && debtToRevenueRatio > 0.7) debtScore -= 5;
  score += debtScore;

  // Negativações e protestos (peso 25%)
  let negativeScore = 25;
  if (data.serasaData) {
    negativeScore -= data.serasaData.negativacoes * 5;
    negativeScore -= data.serasaData.protestos * 8;
    negativeScore -= data.serasaData.chequesSemFundo * 3;
    negativeScore -= data.serasaData.falencias * 25;
    negativeScore -= data.serasaData.recuperacoesJudiciais * 15;
  }
  score += Math.max(0, negativeScore);

  return Math.max(0, Math.min(100, score));
}

/**
 * Detecta tendência financeira
 */
export function detectFinancialTrend(
  current: FinancialHealthData,
  previous?: FinancialHealthData
): { improving: boolean; stable: boolean; deteriorating: boolean } {
  if (!previous) {
    return { improving: false, stable: true, deteriorating: false };
  }

  const scoreDiff = current.predictiveRiskScore - previous.predictiveRiskScore;

  if (scoreDiff > 5) return { improving: true, stable: false, deteriorating: false };
  if (scoreDiff < -5) return { improving: false, stable: false, deteriorating: true };
  return { improving: false, stable: true, deteriorating: false };
}
