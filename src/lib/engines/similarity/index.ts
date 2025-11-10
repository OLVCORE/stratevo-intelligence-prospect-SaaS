/**
 * SIMILARITY ENGINE - EXPORTS
 * 
 * Ponto de entrada único para o motor de similaridade
 */

// Tipos
export type {
  CompanyProfile,
  SimilarityScore,
  SimilarityOptions,
  SimilarityWeights,
  SimilarCompanyResult
} from './types';

// Motor principal
export {
  calculateSimilarity,
  calculateBatchSimilarity,
  compareSimilarities
} from './similarityEngine';

// Componentes individuais (para uso avançado)
export { calculateFirmographicsSimilarity } from './firmographicsSimilarity';
export { calculateTechnographicsSimilarity } from './technographicsSimilarity';
export { calculateGeographicSimilarity } from './geographicSimilarity';
export { calculateIndustrySimilarity } from './industrySimilarity';
export { calculateBehavioralSimilarity } from './behavioralSimilarity';

