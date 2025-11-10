/**
 * WEB DISCOVERY (Serper API)
 * Adapta busca web existente para o novo motor de similaridade
 */

import { CompanyProfile, SimilarCompanyResult, calculateSimilarity } from '@/lib/engines/similarity';
import { supabase } from '@/integrations/supabase/client';

export async function searchWebSimilar(target: CompanyProfile): Promise<SimilarCompanyResult[]> {
  try {
    const query = `empresas ${target.sector || ''} ${target.state || ''} Brasil`;
    
    const { data, error } = await supabase.functions.invoke('web-search', {
      body: { query, limit: 20, country: 'BR', language: 'pt' }
    });
    
    if (error || !data?.success) return [];
    
    const candidates: SimilarCompanyResult[] = data.results.map((result: any) => {
      const candidate: CompanyProfile = {
        name: result.title || '',
        cnpj: extractCNPJ(result.snippet || result.description || ''),
        sector: target.sector,
        state: extractState(result.snippet || result.description || ''),
        website: result.url
      };
      
      const similarity = calculateSimilarity(target, candidate);
      
      return {
        ...candidate,
        similarity,
        source: 'web',
        discoveryMethod: 'serper',
        discoveredAt: new Date().toISOString(),
        needsEnrichment: true,
        alreadyInDatabase: false
      };
    });
    
    return candidates.filter(c => c.similarity.overallScore >= 40);
  } catch (error) {
    console.error('[WEB-DISCOVERY] Erro:', error);
    return [];
  }
}

function extractCNPJ(text: string): string | undefined {
  const match = text.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
  return match ? match[0].replace(/[^\d]/g, '') : undefined;
}

function extractState(text: string): string | undefined {
  const states = ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE'];
  return states.find(state => text.toUpperCase().includes(state));
}

