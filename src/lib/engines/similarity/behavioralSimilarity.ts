/**
 * BEHAVIORAL SIMILARITY
 * 
 * Calcula similaridade baseada em comportamentos e sinais:
 * - Tendências de contratação (hiring trends)
 * - Estágio de funding (seed, series A/B/C, IPO)
 * - Sinais de compra (buying signals)
 * - Atividade recente (notícias, expansão)
 * - Tráfego do site
 * 
 * Peso no score geral: 5%
 */

import { CompanyProfile } from './types';

interface BehavioralScore {
  hiringScore: number;
  fundingScore: number;
  buyingSignalsScore: number;
  activityScore: number;
  overallScore: number;
  reasons: string[];
}

/**
 * Calcula similaridade de tendências de contratação
 * Empresas contratando = sinal positivo (crescimento)
 */
function calculateHiringTrendsSimilarity(
  targetHiring: number | undefined,
  candidateHiring: number | undefined
): number {
  if (targetHiring === undefined && candidateHiring === undefined) return 50;
  if (targetHiring === undefined || candidateHiring === undefined) return 40;
  
  // Ambas contratando (positivo) = ótimo sinal
  if (targetHiring > 0 && candidateHiring > 0) return 95;
  
  // Ambas não contratando = neutro
  if (targetHiring === 0 && candidateHiring === 0) return 60;
  
  // Ambas demitindo (negativo) = situação similar mas ruim
  if (targetHiring < 0 && candidateHiring < 0) return 70;
  
  // Uma contratando, outra não = diferente
  if ((targetHiring > 0 && candidateHiring <= 0) || (targetHiring <= 0 && candidateHiring > 0)) {
    return 40;
  }
  
  return 50;
}

/**
 * Calcula similaridade de estágio de funding
 */
function calculateFundingStageSimilarity(
  targetFunding: string | undefined,
  candidateFunding: string | undefined
): number {
  if (!targetFunding && !candidateFunding) return 50;
  if (!targetFunding || !candidateFunding) return 40;
  
  // Hierarquia de funding stages
  const fundingHierarchy = ['none', 'seed', 'series-a', 'series-b', 'series-c', 'ipo'];
  
  const targetIndex = fundingHierarchy.indexOf(targetFunding.toLowerCase());
  const candidateIndex = fundingHierarchy.indexOf(candidateFunding.toLowerCase());
  
  if (targetIndex === -1 || candidateIndex === -1) return 50;
  
  // Mesmo estágio = 100
  if (targetIndex === candidateIndex) return 100;
  
  // Diferença de 1 estágio = 80
  const diff = Math.abs(targetIndex - candidateIndex);
  if (diff === 1) return 80;
  
  // Diferença de 2 estágios = 60
  if (diff === 2) return 60;
  
  // Diferença de 3+ estágios = 40
  return 40;
}

/**
 * Calcula similaridade de buying signals (sinais de compra)
 * Ex: "contratando", "expansão", "nova tecnologia", "novo escritório"
 */
function calculateBuyingSignalsSimilarity(
  targetSignals: string[] = [],
  candidateSignals: string[] = []
): number {
  if (targetSignals.length === 0 && candidateSignals.length === 0) return 50;
  if (targetSignals.length === 0 || candidateSignals.length === 0) return 40;
  
  // Jaccard similarity para sinais
  const normalizedTarget = targetSignals.map(s => s.toLowerCase().trim());
  const normalizedCandidate = candidateSignals.map(s => s.toLowerCase().trim());
  
  const intersection = normalizedTarget.filter(signal => 
    normalizedCandidate.includes(signal)
  );
  
  const union = [...new Set([...normalizedTarget, ...normalizedCandidate])];
  
  const similarity = (intersection.length / union.length) * 100;
  
  // Boost: Ambas têm sinais de compra = bom (independente de overlap)
  if (targetSignals.length > 0 && candidateSignals.length > 0) {
    return Math.min(100, similarity + 30); // +30 bonus
  }
  
  return Math.round(similarity);
}

/**
 * Calcula similaridade de atividade recente
 * Baseado em número de notícias recentes
 */
function calculateActivitySimilarity(
  targetActivity: number | undefined,
  candidateActivity: number | undefined,
  targetTraffic?: number,
  candidateTraffic?: number
): number {
  // Componente 1: Notícias recentes
  let newsScore = 50;
  if (targetActivity !== undefined && candidateActivity !== undefined) {
    // Ambas com notícias = ativo
    if (targetActivity > 0 && candidateActivity > 0) {
      newsScore = 90;
    }
    // Ambas sem notícias = menos ativo
    else if (targetActivity === 0 && candidateActivity === 0) {
      newsScore = 60;
    }
    // Uma com notícias, outra não
    else {
      newsScore = 50;
    }
  }
  
  // Componente 2: Tráfego do site (se disponível)
  let trafficScore = 50;
  if (targetTraffic !== undefined && candidateTraffic !== undefined && 
      targetTraffic > 0 && candidateTraffic > 0) {
    
    const diff = Math.abs(targetTraffic - candidateTraffic);
    const avgTraffic = (targetTraffic + candidateTraffic) / 2;
    const percentageDiff = (diff / avgTraffic) * 100;
    
    if (percentageDiff <= 20) trafficScore = 100;
    else if (percentageDiff <= 50) trafficScore = 80;
    else if (percentageDiff <= 100) trafficScore = 60;
    else trafficScore = 40;
  }
  
  // Média ponderada
  return (newsScore * 0.6 + trafficScore * 0.4);
}

/**
 * FUNÇÃO PRINCIPAL: Calcula score comportamental
 */
export function calculateBehavioralSimilarity(
  target: CompanyProfile,
  candidate: CompanyProfile
): BehavioralScore {
  const hiringScore = calculateHiringTrendsSimilarity(
    target.hiringTrends,
    candidate.hiringTrends
  );
  
  const fundingScore = calculateFundingStageSimilarity(
    target.fundingStage,
    candidate.fundingStage
  );
  
  const buyingSignalsScore = calculateBuyingSignalsSimilarity(
    target.buyingSignals,
    candidate.buyingSignals
  );
  
  const activityScore = calculateActivitySimilarity(
    target.recentNews,
    candidate.recentNews,
    target.websiteTraffic,
    candidate.websiteTraffic
  );
  
  // Pesos internos (soma = 1.0)
  const overallScore = (
    hiringScore * 0.35 +          // 35% peso
    fundingScore * 0.20 +         // 20% peso
    buyingSignalsScore * 0.25 +   // 25% peso
    activityScore * 0.20          // 20% peso
  );
  
  // Gerar razões textuais
  const reasons: string[] = [];
  
  if (hiringScore >= 90) {
    reasons.push(`Ambas contratando`);
  }
  
  if (fundingScore === 100 && target.fundingStage && target.fundingStage !== 'none') {
    reasons.push(`Mesmo estágio de funding (${target.fundingStage})`);
  }
  
  if (buyingSignalsScore >= 70 && target.buyingSignals && target.buyingSignals.length > 0) {
    reasons.push(`Sinais de compra similares`);
  }
  
  if (activityScore >= 80 && target.recentNews && target.recentNews > 0) {
    reasons.push(`Ambas com atividade recente`);
  }
  
  return {
    hiringScore,
    fundingScore,
    buyingSignalsScore,
    activityScore,
    overallScore,
    reasons
  };
}

