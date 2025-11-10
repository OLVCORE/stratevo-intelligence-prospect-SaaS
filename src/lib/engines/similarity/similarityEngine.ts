/**
 * SIMILARITY ENGINE - MAIN
 * 
 * Motor principal de similaridade multi-dimensional
 * Inspirado em ZoomInfo, Apollo, Lusha, Seamless.AI
 * 
 * Combina 5 dimensões de similaridade:
 * 1. Firmográficos (40%) - Receita, funcionários, porte
 * 2. Tecnográficos (25%) - Stack tecnológico
 * 3. Geográficos (15%) - Localização
 * 4. Indústria (15%) - CNAE, setor
 * 5. Comportamentais (5%) - Contratações, funding
 */

import { 
  CompanyProfile, 
  SimilarityScore, 
  SimilarityOptions,
  SimilarityWeights 
} from './types';
import { calculateFirmographicsSimilarity } from './firmographicsSimilarity';
import { calculateTechnographicsSimilarity } from './technographicsSimilarity';
import { calculateGeographicSimilarity } from './geographicSimilarity';
import { calculateIndustrySimilarity } from './industrySimilarity';
import { calculateBehavioralSimilarity } from './behavioralSimilarity';

/**
 * PESOS PADRÃO (Best Practice - baseado em ZoomInfo)
 */
const DEFAULT_WEIGHTS: SimilarityWeights = {
  firmographics: 0.40,   // 40%
  technographics: 0.25,  // 25%
  geographic: 0.15,      // 15%
  industry: 0.15,        // 15%
  behavioral: 0.05       // 5%
};

/**
 * Determina tier (nível de qualidade) baseado no score
 */
function determineTier(score: number): 'excellent' | 'premium' | 'qualified' | 'potential' | 'low' {
  if (score >= 85) return 'excellent'; // 85-100: Excelente match
  if (score >= 70) return 'premium';   // 70-84: Premium (muito bom)
  if (score >= 55) return 'qualified'; // 55-69: Qualificado
  if (score >= 40) return 'potential'; // 40-54: Potencial
  return 'low';                        // 0-39: Baixo
}

/**
 * Determina nível de confiança baseado em dados disponíveis
 */
function determineConfidence(
  target: CompanyProfile,
  candidate: CompanyProfile
): 'high' | 'medium' | 'low' {
  let dataPoints = 0;
  let totalPossiblePoints = 20;
  
  // Firmográficos (5 pontos)
  if (target.revenue && candidate.revenue) dataPoints++;
  if (target.employees && candidate.employees) dataPoints++;
  if (target.porte && candidate.porte) dataPoints++;
  if (target.growthRate !== undefined && candidate.growthRate !== undefined) dataPoints++;
  if (target.capitalSocial && candidate.capitalSocial) dataPoints++;
  
  // Tecnográficos (5 pontos)
  if (target.technologies && target.technologies.length > 0 && 
      candidate.technologies && candidate.technologies.length > 0) dataPoints++;
  if (target.cloudProviders && target.cloudProviders.length > 0 &&
      candidate.cloudProviders && candidate.cloudProviders.length > 0) dataPoints++;
  if (target.marketingTools && target.marketingTools.length > 0 &&
      candidate.marketingTools && candidate.marketingTools.length > 0) dataPoints++;
  if (target.erpSystem && candidate.erpSystem) dataPoints++;
  dataPoints++; // Bonus por ter dados tech em geral
  
  // Geográficos (4 pontos)
  if (target.state && candidate.state) dataPoints++;
  if (target.city && candidate.city) dataPoints++;
  if (target.latitude && target.longitude && candidate.latitude && candidate.longitude) dataPoints++;
  dataPoints++; // Bonus por localização
  
  // Indústria (3 pontos)
  if (target.cnae && candidate.cnae) dataPoints++;
  if (target.sector && candidate.sector) dataPoints++;
  if (target.subsector && candidate.subsector) dataPoints++;
  
  // Comportamentais (3 pontos)
  if (target.hiringTrends !== undefined && candidate.hiringTrends !== undefined) dataPoints++;
  if (target.fundingStage && candidate.fundingStage) dataPoints++;
  if (target.buyingSignals && target.buyingSignals.length > 0 &&
      candidate.buyingSignals && candidate.buyingSignals.length > 0) dataPoints++;
  
  const completeness = (dataPoints / totalPossiblePoints);
  
  if (completeness >= 0.70) return 'high';    // 70%+ de dados = alta confiança
  if (completeness >= 0.40) return 'medium';  // 40-69% = média confiança
  return 'low';                               // <40% = baixa confiança
}

/**
 * Aplica ajustes baseados em opções especiais
 */
function applyOptionAdjustments(
  baseScore: number,
  breakdown: any,
  options: SimilarityOptions,
  geoScore: number,
  techScore: number,
  industryScore: number
): number {
  let adjustedScore = baseScore;
  
  // Priorizar geografia
  if (options.prioritizeGeo && geoScore >= 80) {
    adjustedScore = Math.min(100, adjustedScore + 5); // +5 bonus
  }
  
  // Priorizar tecnologia
  if (options.prioritizeTech && techScore >= 75) {
    adjustedScore = Math.min(100, adjustedScore + 5); // +5 bonus
  }
  
  // Exigir match de indústria (strict)
  if (options.strictIndustry && industryScore < 60) {
    adjustedScore = Math.max(0, adjustedScore - 20); // -20 penalidade
  }
  
  return adjustedScore;
}

/**
 * FUNÇÃO PRINCIPAL: Calcula similaridade completa entre duas empresas
 */
export function calculateSimilarity(
  target: CompanyProfile,
  candidate: CompanyProfile,
  options: SimilarityOptions = {}
): SimilarityScore {
  console.log('[SIMILARITY-ENGINE] Calculando similaridade:', {
    target: target.name,
    candidate: candidate.name
  });
  
  // Usar pesos customizados ou padrão
  const weights = options.weights || DEFAULT_WEIGHTS;
  
  // Calcular score de cada dimensão
  const firmographics = calculateFirmographicsSimilarity(target, candidate);
  const technographics = calculateTechnographicsSimilarity(target, candidate);
  const geographic = calculateGeographicSimilarity(target, candidate);
  const industry = calculateIndustrySimilarity(target, candidate);
  const behavioral = calculateBehavioralSimilarity(target, candidate);
  
  // Score geral ponderado
  let overallScore = (
    firmographics.overallScore * weights.firmographics +
    technographics.overallScore * weights.technographics +
    geographic.overallScore * weights.geographic +
    industry.overallScore * weights.industry +
    behavioral.overallScore * weights.behavioral
  );
  
  // Aplicar ajustes opcionais
  overallScore = applyOptionAdjustments(
    overallScore,
    {
      firmographics: firmographics.overallScore,
      technographics: technographics.overallScore,
      geographic: geographic.overallScore,
      industry: industry.overallScore,
      behavioral: behavioral.overallScore
    },
    options,
    geographic.overallScore,
    technographics.overallScore,
    industry.overallScore
  );
  
  // Arredondar para inteiro
  overallScore = Math.round(overallScore);
  
  // Aplicar threshold mínimo (se especificado)
  if (options.minScore && overallScore < options.minScore) {
    console.log('[SIMILARITY-ENGINE] Score abaixo do threshold:', overallScore, '<', options.minScore);
  }
  
  // Determinar tier e confiança
  const tier = determineTier(overallScore);
  const confidence = determineConfidence(target, candidate);
  
  // Consolidar razões de todas as dimensões
  const reasons = [
    ...firmographics.reasons,
    ...technographics.reasons,
    ...geographic.reasons,
    ...industry.reasons,
    ...behavioral.reasons
  ];
  
  // Breakdown detalhado (0-100 para cada dimensão)
  const breakdown = {
    firmographics: Math.round(firmographics.overallScore),
    technographics: Math.round(technographics.overallScore),
    geographic: Math.round(geographic.overallScore),
    industry: Math.round(industry.overallScore),
    behavioral: Math.round(behavioral.overallScore)
  };
  
  console.log('[SIMILARITY-ENGINE] Resultado:', {
    overallScore,
    tier,
    confidence,
    breakdown,
    reasonsCount: reasons.length
  });
  
  return {
    overallScore,
    breakdown,
    reasons: reasons.slice(0, 5), // Top 5 razões
    confidence,
    tier
  };
}

/**
 * FUNÇÃO AUXILIAR: Batch similarity (múltiplas empresas)
 */
export function calculateBatchSimilarity(
  target: CompanyProfile,
  candidates: CompanyProfile[],
  options: SimilarityOptions = {}
): Array<{ candidate: CompanyProfile; similarity: SimilarityScore }> {
  console.log('[SIMILARITY-ENGINE] Calculando similaridade em lote:', candidates.length, 'candidatos');
  
  const results = candidates.map(candidate => ({
    candidate,
    similarity: calculateSimilarity(target, candidate, options)
  }));
  
  // Filtrar por threshold (se especificado)
  const filtered = options.minScore
    ? results.filter(r => r.similarity.overallScore >= options.minScore)
    : results;
  
  // Ordenar por score (maior primeiro)
  filtered.sort((a, b) => b.similarity.overallScore - a.similarity.overallScore);
  
  console.log('[SIMILARITY-ENGINE] Resultados após filtro/ordenação:', filtered.length);
  
  return filtered;
}

/**
 * FUNÇÃO AUXILIAR: Comparar múltiplas empresas com a target
 */
export function compareSimilarities(
  target: CompanyProfile,
  candidates: CompanyProfile[],
  options: SimilarityOptions = {}
): {
  target: CompanyProfile;
  comparisons: Array<{
    candidate: CompanyProfile;
    similarity: SimilarityScore;
    rank: number;
  }>;
  statistics: {
    avgScore: number;
    maxScore: number;
    minScore: number;
    excellentCount: number;
    premiumCount: number;
    qualifiedCount: number;
  };
} {
  const results = calculateBatchSimilarity(target, candidates, options);
  
  const comparisons = results.map((result, index) => ({
    candidate: result.candidate,
    similarity: result.similarity,
    rank: index + 1
  }));
  
  const scores = results.map(r => r.similarity.overallScore);
  const avgScore = scores.length > 0 
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  
  const excellentCount = results.filter(r => r.similarity.tier === 'excellent').length;
  const premiumCount = results.filter(r => r.similarity.tier === 'premium').length;
  const qualifiedCount = results.filter(r => r.similarity.tier === 'qualified').length;
  
  return {
    target,
    comparisons,
    statistics: {
      avgScore,
      maxScore,
      minScore,
      excellentCount,
      premiumCount,
      qualifiedCount
    }
  };
}

