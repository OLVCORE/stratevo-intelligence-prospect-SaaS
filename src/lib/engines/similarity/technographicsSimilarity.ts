/**
 * TECHNOGRAPHICS SIMILARITY
 * 
 * Calcula similaridade baseada em stack tecnológico:
 * - Tecnologias em uso (frameworks, linguagens, tools)
 * - Cloud providers (AWS, Azure, GCP)
 * - Marketing tools (HubSpot, RD Station, etc.)
 * - ERP system
 * 
 * Peso no score geral: 25%
 */

import { CompanyProfile } from './types';

interface TechnographicsScore {
  techStackScore: number;
  cloudScore: number;
  marketingScore: number;
  erpScore: number;
  overallScore: number;
  reasons: string[];
}

/**
 * Calcula Jaccard Similarity entre dois arrays
 * Jaccard = |A ∩ B| / |A ∪ B|
 */
function jaccardSimilarity(setA: string[] = [], setB: string[] = []): number {
  if (setA.length === 0 && setB.length === 0) return 50; // Ambos vazios = neutro
  if (setA.length === 0 || setB.length === 0) return 30; // Um vazio = baixo
  
  // Normalizar (lowercase, trim)
  const normalizedA = setA.map(item => item.toLowerCase().trim());
  const normalizedB = setB.map(item => item.toLowerCase().trim());
  
  // Interseção (elementos em ambos)
  const intersection = normalizedA.filter(item => normalizedB.includes(item));
  
  // União (elementos únicos em A ou B)
  const union = [...new Set([...normalizedA, ...normalizedB])];
  
  // Jaccard Similarity
  const similarity = (intersection.length / union.length) * 100;
  
  return Math.round(similarity);
}

/**
 * Calcula similaridade de tech stack (frameworks, linguagens, ferramentas)
 */
function calculateTechStackSimilarity(
  targetTech: string[] = [],
  candidateTech: string[] = []
): number {
  return jaccardSimilarity(targetTech, candidateTech);
}

/**
 * Calcula similaridade de cloud providers
 * Empresas que usam os mesmos clouds tendem a ser similares
 */
function calculateCloudSimilarity(
  targetCloud: string[] = [],
  candidateCloud: string[] = []
): number {
  if (targetCloud.length === 0 && candidateCloud.length === 0) return 50;
  
  const jaccard = jaccardSimilarity(targetCloud, candidateCloud);
  
  // Boost: se ambas usam cloud (qualquer um) = bom sinal
  if (targetCloud.length > 0 && candidateCloud.length > 0) {
    return Math.min(100, jaccard + 20); // +20 bonus por ambas usarem cloud
  }
  
  return jaccard;
}

/**
 * Calcula similaridade de marketing tools
 * Ex: HubSpot, RD Station, Mailchimp, ActiveCampaign
 */
function calculateMarketingToolsSimilarity(
  targetTools: string[] = [],
  candidateTools: string[] = []
): number {
  return jaccardSimilarity(targetTools, candidateTools);
}

/**
 * Calcula similaridade de ERP
 * Match exato = 100, diferente = 30, ausente = 50
 */
function calculateERPSimilarity(
  targetERP: string | undefined,
  candidateERP: string | undefined
): number {
  if (!targetERP && !candidateERP) return 50; // Ambos sem ERP
  if (!targetERP || !candidateERP) return 40; // Um sem ERP
  
  // Normalizar
  const normalizedTarget = targetERP.toLowerCase().trim();
  const normalizedCandidate = candidateERP.toLowerCase().trim();
  
  // Match exato
  if (normalizedTarget === normalizedCandidate) return 100;
  
  // Partial match (ex: "SAP" vs "SAP Business One")
  if (normalizedTarget.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedTarget)) {
    return 80;
  }
  
  // ERPs diferentes = diferença significativa
  return 30;
}

/**
 * Identifica tecnologias comuns (para razões textuais)
 */
function findCommonTechnologies(
  targetTech: string[] = [],
  candidateTech: string[] = []
): string[] {
  const normalizedTarget = targetTech.map(t => t.toLowerCase().trim());
  const normalizedCandidate = candidateTech.map(t => t.toLowerCase().trim());
  
  return targetTech.filter((tech, index) => 
    normalizedCandidate.includes(normalizedTarget[index])
  );
}

/**
 * FUNÇÃO PRINCIPAL: Calcula score tecnográfico
 */
export function calculateTechnographicsSimilarity(
  target: CompanyProfile,
  candidate: CompanyProfile
): TechnographicsScore {
  const techStackScore = calculateTechStackSimilarity(
    target.technologies,
    candidate.technologies
  );
  
  const cloudScore = calculateCloudSimilarity(
    target.cloudProviders,
    candidate.cloudProviders
  );
  
  const marketingScore = calculateMarketingToolsSimilarity(
    target.marketingTools,
    candidate.marketingTools
  );
  
  const erpScore = calculateERPSimilarity(
    target.erpSystem,
    candidate.erpSystem
  );
  
  // Pesos internos (soma = 1.0)
  const overallScore = (
    techStackScore * 0.50 +  // 50% peso (mais importante)
    cloudScore * 0.20 +      // 20% peso
    marketingScore * 0.15 +  // 15% peso
    erpScore * 0.15          // 15% peso
  );
  
  // Gerar razões textuais
  const reasons: string[] = [];
  
  if (techStackScore >= 70) {
    const commonTech = findCommonTechnologies(target.technologies, candidate.technologies);
    if (commonTech.length > 0) {
      reasons.push(`Stack similar: ${commonTech.slice(0, 3).join(', ')}`);
    }
  }
  
  if (cloudScore >= 70 && target.cloudProviders && candidate.cloudProviders) {
    const commonCloud = findCommonTechnologies(target.cloudProviders, candidate.cloudProviders);
    if (commonCloud.length > 0) {
      reasons.push(`Mesmo cloud: ${commonCloud.join(', ')}`);
    }
  }
  
  if (erpScore === 100 && target.erpSystem) {
    reasons.push(`Mesmo ERP (${target.erpSystem})`);
  }
  
  if (marketingScore >= 70) {
    reasons.push(`Ferramentas de marketing similares`);
  }
  
  return {
    techStackScore,
    cloudScore,
    marketingScore,
    erpScore,
    overallScore,
    reasons
  };
}

