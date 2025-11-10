/**
 * INDUSTRY SIMILARITY
 * 
 * Calcula similaridade baseada em indústria/setor:
 * - CNAE (classificação nacional de atividades econômicas)
 * - Setor amigável (Indústria, Serviços, Varejo, etc.)
 * - Sub-setor
 * 
 * Peso no score geral: 15%
 */

import { CompanyProfile } from './types';

interface IndustryScore {
  cnaeScore: number;
  sectorScore: number;
  subsectorScore: number;
  overallScore: number;
  reasons: string[];
}

/**
 * Calcula similaridade de CNAE
 * CNAEs são hierárquicos: XXXX-X/YY
 * - Seção (1º dígito)
 * - Divisão (2 dígitos)
 * - Grupo (3 dígitos)
 * - Classe (4 dígitos)
 * - Subclasse (7 dígitos com hífen)
 */
function calculateCNAESimilarity(
  targetCNAE: string | undefined,
  candidateCNAE: string | undefined
): number {
  if (!targetCNAE || !candidateCNAE) return 50; // Neutro se ausente
  
  // Normalizar (remover pontos, hífens, barras, espaços)
  const normalize = (cnae: string) => cnae.replace(/[.\-\/\s]/g, '');
  
  const normalizedTarget = normalize(targetCNAE);
  const normalizedCandidate = normalize(candidateCNAE);
  
  // Match exato (subclasse) = 100
  if (normalizedTarget === normalizedCandidate) return 100;
  
  // Comparar níveis hierárquicos
  // Classe (4 dígitos) = 90
  if (normalizedTarget.substring(0, 4) === normalizedCandidate.substring(0, 4)) {
    return 90;
  }
  
  // Grupo (3 dígitos) = 75
  if (normalizedTarget.substring(0, 3) === normalizedCandidate.substring(0, 3)) {
    return 75;
  }
  
  // Divisão (2 dígitos) = 60
  if (normalizedTarget.substring(0, 2) === normalizedCandidate.substring(0, 2)) {
    return 60;
  }
  
  // Seção (1º dígito) = 40
  if (normalizedTarget.substring(0, 1) === normalizedCandidate.substring(0, 1)) {
    return 40;
  }
  
  // CNAEs completamente diferentes = 20
  return 20;
}

/**
 * Calcula similaridade de setor amigável
 * Ex: Indústria, Serviços, Varejo, Tecnologia, Saúde, etc.
 */
function calculateSectorSimilarity(
  targetSector: string | undefined,
  candidateSector: string | undefined
): number {
  if (!targetSector || !candidateSector) return 50;
  
  // Normalizar (lowercase, sem acentos)
  const normalize = (sector: string) =>
    sector.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  
  const normalizedTarget = normalize(targetSector);
  const normalizedCandidate = normalize(candidateSector);
  
  // Match exato = 100
  if (normalizedTarget === normalizedCandidate) return 100;
  
  // Partial match (um contém o outro)
  if (normalizedTarget.includes(normalizedCandidate) || 
      normalizedCandidate.includes(normalizedTarget)) {
    return 80;
  }
  
  // Setores relacionados (mapeamento manual)
  const relatedSectors: Record<string, string[]> = {
    'industria': ['fabricante', 'manufatura', 'producao'],
    'servicos': ['consultoria', 'prestador', 'terceirizacao'],
    'varejo': ['comercio', 'loja', 'distribuidor'],
    'tecnologia': ['software', 'ti', 'informatica', 'digital'],
    'saude': ['clinica', 'hospital', 'laboratorio', 'farmacia'],
    'educacao': ['escola', 'universidade', 'curso', 'ensino'],
    'construcao': ['construtora', 'engenharia', 'obra'],
    'agronegocio': ['agricultura', 'pecuaria', 'rural']
  };
  
  for (const [key, related] of Object.entries(relatedSectors)) {
    if ((normalizedTarget === key || related.some(r => normalizedTarget.includes(r))) &&
        (normalizedCandidate === key || related.some(r => normalizedCandidate.includes(r)))) {
      return 70; // Setores relacionados
    }
  }
  
  // Setores diferentes = 30
  return 30;
}

/**
 * Calcula similaridade de sub-setor
 */
function calculateSubsectorSimilarity(
  targetSubsector: string | undefined,
  candidateSubsector: string | undefined
): number {
  if (!targetSubsector || !candidateSubsector) return 50;
  
  const normalize = (subsector: string) =>
    subsector.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  
  const normalizedTarget = normalize(targetSubsector);
  const normalizedCandidate = normalize(candidateSubsector);
  
  // Match exato = 100
  if (normalizedTarget === normalizedCandidate) return 100;
  
  // Partial match
  if (normalizedTarget.includes(normalizedCandidate) || 
      candidateSubsector.includes(normalizedTarget)) {
    return 75;
  }
  
  // Sub-setores diferentes = 30
  return 30;
}

/**
 * FUNÇÃO PRINCIPAL: Calcula score de indústria
 */
export function calculateIndustrySimilarity(
  target: CompanyProfile,
  candidate: CompanyProfile
): IndustryScore {
  const cnaeScore = calculateCNAESimilarity(target.cnae, candidate.cnae);
  const sectorScore = calculateSectorSimilarity(target.sector, candidate.sector);
  const subsectorScore = calculateSubsectorSimilarity(target.subsector, candidate.subsector);
  
  // Pesos internos (soma = 1.0)
  const overallScore = (
    cnaeScore * 0.50 +      // 50% peso (mais importante - dado oficial)
    sectorScore * 0.35 +    // 35% peso
    subsectorScore * 0.15   // 15% peso
  );
  
  // Gerar razões textuais
  const reasons: string[] = [];
  
  if (cnaeScore === 100 && target.cnae) {
    reasons.push(`Mesmo CNAE (${target.cnae})`);
  } else if (cnaeScore >= 75 && target.cnae) {
    reasons.push(`CNAE similar (grupo ${target.cnae.substring(0, 3)})`);
  }
  
  if (sectorScore === 100 && target.sector) {
    reasons.push(`Mesmo setor (${target.sector})`);
  } else if (sectorScore >= 70) {
    reasons.push(`Setor relacionado`);
  }
  
  if (subsectorScore === 100 && target.subsector) {
    reasons.push(`Mesmo sub-setor (${target.subsector})`);
  }
  
  return {
    cnaeScore,
    sectorScore,
    subsectorScore,
    overallScore,
    reasons
  };
}

