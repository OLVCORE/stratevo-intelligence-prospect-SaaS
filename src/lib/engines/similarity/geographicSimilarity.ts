/**
 * GEOGRAPHIC SIMILARITY
 * 
 * Calcula similaridade baseada em localização:
 * - Mesmo estado (UF)
 * - Mesma região (Sul, Sudeste, Norte, etc.)
 * - Mesma cidade
 * - Distância geográfica (se lat/long disponível)
 * 
 * Peso no score geral: 15%
 */

import { CompanyProfile } from './types';

interface GeographicScore {
  stateScore: number;
  regionScore: number;
  cityScore: number;
  distanceScore: number;
  overallScore: number;
  reasons: string[];
}

/**
 * Mapa de estados para regiões do Brasil
 */
const STATE_TO_REGION: Record<string, string> = {
  // Norte
  'AC': 'Norte', 'AP': 'Norte', 'AM': 'Norte', 'PA': 'Norte', 'RO': 'Norte', 'RR': 'Norte', 'TO': 'Norte',
  // Nordeste
  'AL': 'Nordeste', 'BA': 'Nordeste', 'CE': 'Nordeste', 'MA': 'Nordeste', 'PB': 'Nordeste', 
  'PE': 'Nordeste', 'PI': 'Nordeste', 'RN': 'Nordeste', 'SE': 'Nordeste',
  // Centro-Oeste
  'DF': 'Centro-Oeste', 'GO': 'Centro-Oeste', 'MT': 'Centro-Oeste', 'MS': 'Centro-Oeste',
  // Sudeste
  'ES': 'Sudeste', 'MG': 'Sudeste', 'RJ': 'Sudeste', 'SP': 'Sudeste',
  // Sul
  'PR': 'Sul', 'RS': 'Sul', 'SC': 'Sul'
};

/**
 * Calcula similaridade de estado (UF)
 */
function calculateStateSimilarity(
  targetState: string | undefined,
  candidateState: string | undefined
): number {
  if (!targetState || !candidateState) return 50; // Neutro se ausente
  
  const normalizedTarget = targetState.toUpperCase().trim();
  const normalizedCandidate = candidateState.toUpperCase().trim();
  
  // Match exato = 100
  if (normalizedTarget === normalizedCandidate) return 100;
  
  // Estados diferentes = 30
  return 30;
}

/**
 * Calcula similaridade de região
 */
function calculateRegionSimilarity(
  targetState: string | undefined,
  candidateState: string | undefined,
  targetRegion?: string,
  candidateRegion?: string
): number {
  // Se regiões explícitas foram fornecidas
  if (targetRegion && candidateRegion) {
    if (targetRegion === candidateRegion) return 100;
    return 30;
  }
  
  // Inferir região a partir do estado
  if (!targetState || !candidateState) return 50;
  
  const normalizedTarget = targetState.toUpperCase().trim();
  const normalizedCandidate = candidateState.toUpperCase().trim();
  
  const targetInferredRegion = STATE_TO_REGION[normalizedTarget];
  const candidateInferredRegion = STATE_TO_REGION[normalizedCandidate];
  
  if (!targetInferredRegion || !candidateInferredRegion) return 50;
  
  // Mesma região = 80 (não 100 porque estados são diferentes)
  if (targetInferredRegion === candidateInferredRegion) return 80;
  
  // Regiões diferentes = 30
  return 30;
}

/**
 * Calcula similaridade de cidade
 */
function calculateCitySimilarity(
  targetCity: string | undefined,
  candidateCity: string | undefined
): number {
  if (!targetCity || !candidateCity) return 50;
  
  // Normalizar (lowercase, remover acentos)
  const normalizeCity = (city: string) => 
    city.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  
  const normalizedTarget = normalizeCity(targetCity);
  const normalizedCandidate = normalizeCity(candidateCity);
  
  // Match exato = 100
  if (normalizedTarget === normalizedCandidate) return 100;
  
  // Cidades diferentes = 20
  return 20;
}

/**
 * Calcula distância geográfica usando fórmula de Haversine
 * Retorna distância em km
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distância em km
}

/**
 * Calcula score baseado em distância geográfica
 */
function calculateDistanceSimilarity(
  targetLat: number | undefined,
  targetLon: number | undefined,
  candidateLat: number | undefined,
  candidateLon: number | undefined
): number {
  if (!targetLat || !targetLon || !candidateLat || !candidateLon) return 50;
  
  const distanceKm = calculateHaversineDistance(
    targetLat,
    targetLon,
    candidateLat,
    candidateLon
  );
  
  // Faixas de distância
  if (distanceKm <= 50) return 100;   // Até 50km = muito próximo
  if (distanceKm <= 100) return 90;   // Até 100km = próximo
  if (distanceKm <= 200) return 80;   // Até 200km = razoável
  if (distanceKm <= 500) return 60;   // Até 500km = distante
  if (distanceKm <= 1000) return 40;  // Até 1000km = muito distante
  
  return Math.max(20, 100 - (distanceKm / 50)); // Mínimo 20
}

/**
 * FUNÇÃO PRINCIPAL: Calcula score geográfico
 */
export function calculateGeographicSimilarity(
  target: CompanyProfile,
  candidate: CompanyProfile
): GeographicScore {
  const stateScore = calculateStateSimilarity(target.state, candidate.state);
  
  const regionScore = calculateRegionSimilarity(
    target.state,
    candidate.state,
    target.region,
    candidate.region
  );
  
  const cityScore = calculateCitySimilarity(target.city, candidate.city);
  
  const distanceScore = calculateDistanceSimilarity(
    target.latitude,
    target.longitude,
    candidate.latitude,
    candidate.longitude
  );
  
  // Pesos internos (soma = 1.0)
  // Se não tem lat/long, ignora distanceScore e redistribui peso
  const hasCoordinates = target.latitude && target.longitude && 
                          candidate.latitude && candidate.longitude;
  
  const overallScore = hasCoordinates
    ? (
        stateScore * 0.40 +     // 40% peso
        regionScore * 0.25 +    // 25% peso
        cityScore * 0.20 +      // 20% peso
        distanceScore * 0.15    // 15% peso
      )
    : (
        stateScore * 0.50 +     // 50% peso
        regionScore * 0.30 +    // 30% peso
        cityScore * 0.20        // 20% peso
      );
  
  // Gerar razões textuais
  const reasons: string[] = [];
  
  if (stateScore === 100 && target.state) {
    reasons.push(`Mesmo estado (${target.state})`);
  }
  
  if (cityScore === 100 && target.city) {
    reasons.push(`Mesma cidade (${target.city})`);
  }
  
  if (regionScore >= 80 && stateScore < 100 && target.state) {
    const region = STATE_TO_REGION[target.state.toUpperCase()];
    if (region) {
      reasons.push(`Mesma região (${region})`);
    }
  }
  
  if (hasCoordinates && distanceScore >= 80) {
    const distanceKm = calculateHaversineDistance(
      target.latitude!,
      target.longitude!,
      candidate.latitude!,
      candidate.longitude!
    );
    reasons.push(`Proximidade geográfica (${Math.round(distanceKm)}km)`);
  }
  
  return {
    stateScore,
    regionScore,
    cityScore,
    distanceScore: hasCoordinates ? distanceScore : 50,
    overallScore,
    reasons
  };
}

