// src/services/companyClassifier.ts
// Classifica empresas por Setor e Nicho baseado em CNAE

import { supabase } from '@/integrations/supabase/client';

export interface CompanyClassification {
  sector_code: string;
  sector_name: string;
  niche_code: string | null;
  niche_name: string | null;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Classifica empresa por CNAE principal
 */
export async function classifyCompanyByCNAE(
  cnaePrincipal: string,
  companyName: string = ''
): Promise<CompanyClassification> {
  if (!cnaePrincipal) {
    return {
      sector_code: 'servicos',
      sector_name: 'Prestadores de Serviços',
      niche_code: null,
      niche_name: null,
      confidence: 'low',
    };
  }

  // Buscar nichos que correspondem ao CNAE
  const { data: niches } = await supabase
    .from('niches')
    .select('sector_code, niche_code, niche_name, cnaes')
    .contains('cnaes', [cnaePrincipal]);

  if (niches && niches.length > 0) {
    const niche = niches[0];
    // Buscar setor
    const { data: sector } = await supabase
      .from('sectors')
      .select('sector_name')
      .eq('sector_code', niche.sector_code)
      .single();

    return {
      sector_code: niche.sector_code,
      sector_name: sector?.sector_name || niche.sector_code,
      niche_code: niche.niche_code,
      niche_name: niche.niche_name,
      confidence: 'high',
    };
  }

  // Fallback: Mapear CNAE para setor diretamente
  const sectorMapping = mapCNAEToSector(cnaePrincipal, companyName);

  return {
    sector_code: sectorMapping.code,
    sector_name: sectorMapping.name,
    niche_code: null,
    niche_name: null,
    confidence: 'medium',
  };
}

/**
 * Mapeia CNAE para Setor (fallback quando não há nicho específico)
 */
function mapCNAEToSector(cnaeCode: string, companyName: string = ''): { code: string; name: string } {
  const cnaeNum = parseInt(cnaeCode.substring(0, 2));
  const cnae4Digits = parseInt(cnaeCode.substring(0, 4));

  // Saúde (CNAE 86-87)
  if (cnaeNum === 86 || cnaeNum === 87) return { code: 'saude', name: 'Saúde' };
  if (cnae4Digits >= 3250 && cnae4Digits <= 3259) {
    const nameLower = companyName.toLowerCase();
    if (nameLower.includes('medic') || nameLower.includes('hospital') || nameLower.includes('ortoped')) {
      return { code: 'saude', name: 'Saúde' };
    }
  }

  // Logística (CNAE 49)
  if (cnaeNum === 49) return { code: 'logistica', name: 'Logística' };
  if (cnae4Digits >= 2941 && cnae4Digits <= 2949) return { code: 'logistica', name: 'Logística' };
  if (cnae4Digits >= 4900 && cnae4Digits <= 4999) return { code: 'logistica', name: 'Logística' };

  // Tecnologia (CNAE 62-63)
  if (cnaeNum === 62 || cnaeNum === 63) return { code: 'servicos', name: 'Prestadores de Serviços' };

  // Indústria (CNAE 25-33, exceto 29 que é transporte)
  if (cnaeNum >= 25 && cnaeNum <= 33 && cnaeNum !== 29) {
    return { code: 'manufatura', name: 'Manufatura' };
  }

  // Construção (CNAE 41-43)
  if (cnaeNum >= 41 && cnaeNum <= 43) return { code: 'construcao', name: 'Construção' };

  // Agronegócio (CNAE 01-03)
  if (cnaeNum >= 1 && cnaeNum <= 3) return { code: 'agro', name: 'Agro' };

  // Varejo (CNAE 47)
  if (cnaeNum === 47) return { code: 'varejo', name: 'Varejo' };

  // Educação (CNAE 85)
  if (cnaeNum === 85) return { code: 'educacional', name: 'Educacional' };

  // Distribuição (CNAE 46)
  if (cnaeNum === 64) return { code: 'financial_services', name: 'Financial Services' };

  // Default
  return { code: 'servicos', name: 'Prestadores de Serviços' };
}

/**
 * Classifica empresa por múltiplos CNAEs (principal + secundários)
 */
export async function classifyCompanyByMultipleCNAEs(
  cnaes: string[],
  companyName: string = ''
): Promise<CompanyClassification> {
  if (!cnaes || cnaes.length === 0) {
    return classifyCompanyByCNAE('', companyName);
  }

  // Tentar classificar por cada CNAE, priorizando o principal
  for (const cnae of cnaes) {
    const classification = await classifyCompanyByCNAE(cnae, companyName);
    if (classification.confidence === 'high') {
      return classification;
    }
  }

  // Se nenhum teve alta confiança, retornar o primeiro
  return classifyCompanyByCNAE(cnaes[0], companyName);
}

