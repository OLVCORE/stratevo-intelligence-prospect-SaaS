/**
 * INTERNAL DISCOVERY
 * Busca empresas similares na nossa própria base
 */

import { CompanyProfile, SimilarCompanyResult, calculateSimilarity } from '@/lib/engines/similarity';
import { supabase } from '@/integrations/supabase/client';

export async function searchInternalSimilar(target: CompanyProfile): Promise<SimilarCompanyResult[]> {
  try {
    // Buscar empresas na mesma região e setor
    let query = supabase
      .from('companies')
      .select('*')
      .neq('id', target.id || '')
      .limit(50);
    
    if (target.state) {
      query = query.or(`raw_data->>uf.eq.${target.state},raw_data->>state.eq.${target.state}`);
    }
    
    const { data, error } = await query;
    
    if (error || !data) return [];
    
    const candidates: SimilarCompanyResult[] = data
      .map((company: any) => {
        const rawData = company.raw_data || {};
        const candidate: CompanyProfile = {
          id: company.id,
          name: company.name,
          cnpj: company.cnpj,
          sector: company.industry,
          state: rawData.uf || rawData.state,
          city: rawData.municipio || rawData.city,
          employees: company.employees,
          revenue: rawData.faturamento_presumido,
          porte: rawData.porte,
          cnae: rawData.cnae,
          technologies: rawData.technologies || [],
          website: company.website
        };
        
        const similarity = calculateSimilarity(target, candidate);
        
        return {
          ...candidate,
          similarity,
          source: 'internal',
          discoveryMethod: 'database-match',
          discoveredAt: new Date().toISOString(),
          needsEnrichment: false,
          alreadyInDatabase: true,
          existingId: company.id
        };
      })
      .filter(c => c.similarity.overallScore >= 55);
    
    return candidates.sort((a, b) => b.similarity.overallScore - a.similarity.overallScore);
  } catch (error) {
    console.error('[INTERNAL-DISCOVERY] Erro:', error);
    return [];
  }
}

