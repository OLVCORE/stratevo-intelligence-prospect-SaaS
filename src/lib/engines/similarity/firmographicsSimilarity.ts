/**
 * FIRMOGRAPHICS SIMILARITY
 * 
 * Calcula similaridade baseada em dados firmográficos:
 * - Receita anual
 * - Número de funcionários
 * - Taxa de crescimento
 * - Porte da empresa
 * 
 * Peso no score geral: 40%
 */

import { CompanyProfile } from './types';

interface FirmographicsScore {
  revenueScore: number;
  employeesScore: number;
  growthScore: number;
  porteScore: number;
  overallScore: number;
  reasons: string[];
}

/**
 * Calcula proximidade de receita (0-100)
 * Usa faixa de ±30% como "similar"
 */
function calculateRevenueProximity(
  targetRevenue: number | undefined,
  candidateRevenue: number | undefined
): number {
  if (!targetRevenue || !candidateRevenue) return 50; // Score neutro se ausente
  
  const diff = Math.abs(targetRevenue - candidateRevenue);
  const avgRevenue = (targetRevenue + candidateRevenue) / 2;
  const percentageDiff = (diff / avgRevenue) * 100;
  
  // Faixas de similaridade
  if (percentageDiff <= 10) return 100; // ±10% = excelente match
  if (percentageDiff <= 20) return 90;  // ±20% = ótimo match
  if (percentageDiff <= 30) return 75;  // ±30% = bom match
  if (percentageDiff <= 50) return 60;  // ±50% = razoável
  if (percentageDiff <= 100) return 40; // ±100% = distante
  
  return Math.max(20, 100 - percentageDiff); // Mínimo 20
}

/**
 * Calcula proximidade de funcionários (0-100)
 * Usa faixa de ±25% como "similar"
 */
function calculateEmployeesProximity(
  targetEmployees: number | undefined,
  candidateEmployees: number | undefined
): number {
  if (!targetEmployees || !candidateEmployees) return 50;
  
  const diff = Math.abs(targetEmployees - candidateEmployees);
  const avgEmployees = (targetEmployees + candidateEmployees) / 2;
  const percentageDiff = (diff / avgEmployees) * 100;
  
  if (percentageDiff <= 15) return 100; // ±15% = excelente
  if (percentageDiff <= 25) return 90;  // ±25% = ótimo
  if (percentageDiff <= 40) return 75;  // ±40% = bom
  if (percentageDiff <= 60) return 60;  // ±60% = razoável
  if (percentageDiff <= 100) return 40;
  
  return Math.max(20, 100 - percentageDiff);
}

/**
 * Calcula similaridade de crescimento (0-100)
 * Empresas com crescimento similar são boas prospects
 */
function calculateGrowthSimilarity(
  targetGrowth: number | undefined,
  candidateGrowth: number | undefined
): number {
  if (targetGrowth === undefined || candidateGrowth === undefined) return 50;
  
  // Ambas em crescimento = bom sinal
  if (targetGrowth > 0 && candidateGrowth > 0) return 90;
  
  // Ambas em declínio = menos relevante
  if (targetGrowth < 0 && candidateGrowth < 0) return 60;
  
  // Uma crescendo, outra em declínio = diferente
  if ((targetGrowth > 0 && candidateGrowth < 0) || (targetGrowth < 0 && candidateGrowth > 0)) {
    return 30;
  }
  
  // Taxa de crescimento similar
  const diff = Math.abs(targetGrowth - candidateGrowth);
  if (diff <= 5) return 95;
  if (diff <= 10) return 85;
  if (diff <= 20) return 70;
  
  return Math.max(40, 100 - (diff * 2));
}

/**
 * Calcula similaridade de porte (0-100)
 * Classificação brasileira: MEI, ME, EPP, DEMAIS
 */
function calculatePorteSimilarity(
  targetPorte: string | undefined,
  candidatePorte: string | undefined
): number {
  if (!targetPorte || !candidatePorte) return 50;
  
  // Match exato = 100
  if (targetPorte === candidatePorte) return 100;
  
  // Classificação hierárquica
  const porteHierarchy = ['MEI', 'ME', 'EPP', 'DEMAIS', 'GRANDE'];
  const targetIndex = porteHierarchy.indexOf(targetPorte.toUpperCase());
  const candidateIndex = porteHierarchy.indexOf(candidatePorte.toUpperCase());
  
  if (targetIndex === -1 || candidateIndex === -1) return 50;
  
  const diff = Math.abs(targetIndex - candidateIndex);
  
  // Diferença de 1 nível = bom (ex: ME vs. EPP)
  if (diff === 1) return 80;
  
  // Diferença de 2 níveis = razoável (ex: ME vs. DEMAIS)
  if (diff === 2) return 60;
  
  // Diferença de 3+ níveis = distante (ex: MEI vs. GRANDE)
  return 40;
}

/**
 * FUNÇÃO PRINCIPAL: Calcula score firmográfico
 */
export function calculateFirmographicsSimilarity(
  target: CompanyProfile,
  candidate: CompanyProfile
): FirmographicsScore {
  const revenueScore = calculateRevenueProximity(target.revenue, candidate.revenue);
  const employeesScore = calculateEmployeesProximity(target.employees, candidate.employees);
  const growthScore = calculateGrowthSimilarity(target.growthRate, candidate.growthRate);
  const porteScore = calculatePorteSimilarity(target.porte, candidate.porte);
  
  // Pesos internos (soma = 1.0)
  // Receita e funcionários são mais importantes
  const overallScore = (
    revenueScore * 0.35 +     // 35% peso
    employeesScore * 0.35 +   // 35% peso
    growthScore * 0.15 +      // 15% peso
    porteScore * 0.15         // 15% peso
  );
  
  // Gerar razões textuais
  const reasons: string[] = [];
  
  if (revenueScore >= 80 && target.revenue && candidate.revenue) {
    const diffPercent = Math.abs(target.revenue - candidate.revenue) / target.revenue * 100;
    reasons.push(`Receita similar (±${diffPercent.toFixed(0)}%)`);
  }
  
  if (employeesScore >= 80 && candidate.employees) {
    reasons.push(`Porte similar (${candidate.employees} funcionários)`);
  }
  
  if (growthScore >= 80 && targetGrowth > 0 && candidateGrowth > 0) {
    reasons.push(`Ambas em crescimento`);
  }
  
  if (porteScore === 100 && target.porte) {
    reasons.push(`Mesmo porte (${target.porte})`);
  }
  
  return {
    revenueScore,
    employeesScore,
    growthScore,
    porteScore,
    overallScore,
    reasons
  };
}

