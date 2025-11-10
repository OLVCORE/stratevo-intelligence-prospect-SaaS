/**
 * RECEITA DISCOVERY
 * Busca empresas com CNAE similar via Receita Federal
 */

import { CompanyProfile, SimilarCompanyResult, calculateSimilarity } from '@/lib/engines/similarity';
import { supabase } from '@/integrations/supabase/client';

export async function searchReceitaSimilar(target: CompanyProfile): Promise<SimilarCompanyResult[]> {
  try {
    if (!target.cnae) return [];
    
    // Buscar empresas com CNAE similar na nossa base
    const cnaeGroup = target.cnae.substring(0, 3); // Grupo CNAE
    
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .ilike('raw_data->>cnae', `${cnaeGroup}%`)
      .neq('id', target.id || '')
      .limit(30);
    
    if (error || !data) return [];
    
    const candidates: SimilarCompanyResult[] = data.map((company: any) => {
      const rawData = company.raw_data || {};
      const candidate: CompanyProfile = {
        id: company.id,
        name: company.name,
        cnpj: company.cnpj,
        sector: company.industry,
        state: rawData.uf,
        city: rawData.municipio,
        employees: company.employees,
        porte: rawData.porte,
        cnae: rawData.cnae
      };
      
      const similarity = calculateSimilarity(target, candidate);
      
      return {
        ...candidate,
        similarity,
        source: 'receita',
        discoveryMethod: 'cnae-match',
        discoveredAt: new Date().toISOString(),
        needsEnrichment: false,
        alreadyInDatabase: true,
        existingId: company.id
      };
    });
    
    return candidates.filter(c => c.similarity.overallScore >= 60);
  } catch (error) {
    console.error('[RECEITA-DISCOVERY] Erro:', error);
    return [];
  }
}

