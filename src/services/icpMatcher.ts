// src/services/icpMatcher.ts
// Verifica aderência de empresas ao ICP do tenant

export interface ICPMatchResult {
  score: number; // 0-100
  tier: 'excellent' | 'premium' | 'qualified' | 'potential' | 'low';
  reasons: string[];
}

export interface TenantICP {
  sectors: string[];
  niches: string[];
  cnaes: string[];
}

export interface CompanyProfile {
  sector_code?: string;
  niche_code?: string;
  cnaes?: string[];
}

/**
 * Calcula score de aderência ao ICP
 */
export function calculateICPMatch(
  company: CompanyProfile,
  tenantICP: TenantICP
): ICPMatchResult {
  const reasons: string[] = [];
  let score = 0;

  // 1. Match de Setor (+30 pontos)
  if (company.sector_code && tenantICP.sectors.includes(company.sector_code)) {
    score += 30;
    reasons.push(`✓ Setor match: ${company.sector_code} (+30)`);
  } else if (company.sector_code) {
    reasons.push(`✗ Setor diferente: ${company.sector_code} (0)`);
  } else {
    reasons.push(`⚠ Setor não identificado (0)`);
  }

  // 2. Match de Nicho (+30 pontos)
  if (company.niche_code && tenantICP.niches.includes(company.niche_code)) {
    score += 30;
    reasons.push(`✓ Nicho match: ${company.niche_code} (+30)`);
  } else if (company.niche_code) {
    reasons.push(`✗ Nicho diferente: ${company.niche_code} (0)`);
  } else {
    reasons.push(`⚠ Nicho não identificado (0)`);
  }

  // 3. Match de CNAE (+20 pontos)
  if (company.cnaes && company.cnaes.length > 0) {
    const matchingCNAEs = company.cnaes.filter(cnae => tenantICP.cnaes.includes(cnae));
    if (matchingCNAEs.length > 0) {
      score += 20;
      reasons.push(`✓ CNAE match: ${matchingCNAEs.join(', ')} (+20)`);
    } else {
      reasons.push(`✗ CNAEs não correspondem ao ICP (0)`);
    }
  } else {
    reasons.push(`⚠ CNAEs não disponíveis (0)`);
  }

  // 4. Setor relacionado (+10 pontos) - verificar setores relacionados
  if (company.sector_code && !tenantICP.sectors.includes(company.sector_code)) {
    const relatedSectors = getRelatedSectors(company.sector_code);
    const hasRelated = relatedSectors.some(s => tenantICP.sectors.includes(s));
    if (hasRelated) {
      score += 10;
      reasons.push(`✓ Setor relacionado (+10)`);
    }
  }

  // 5. Nicho relacionado (+10 pontos)
  if (company.niche_code && !tenantICP.niches.includes(company.niche_code)) {
    // Verificar se nicho está no mesmo setor que o tenant busca
    // Isso requer consulta ao banco, então por enquanto não adicionamos pontos
  }

  // Determinar tier baseado no score
  const tier = score >= 80 ? 'excellent' :
               score >= 60 ? 'premium' :
               score >= 40 ? 'qualified' :
               score >= 20 ? 'potential' : 'low';

  return {
    score: Math.min(100, score),
    tier,
    reasons,
  };
}

/**
 * Retorna setores relacionados (para matching parcial)
 */
function getRelatedSectors(sectorCode: string): string[] {
  const relatedMap: Record<string, string[]> = {
    'servicos': ['tecnologia', 'juridico'],
    'tecnologia': ['servicos'],
    'manufatura': ['distribuicao', 'logistica'],
    'distribuicao': ['varejo', 'logistica'],
    'varejo': ['distribuicao'],
    'logistica': ['distribuicao', 'manufatura'],
  };

  return relatedMap[sectorCode] || [];
}

