/**
 * APOLLO DISCOVERY
 * Busca organizações similares via Apollo.io API
 */

import { CompanyProfile, SimilarCompanyResult, calculateSimilarity } from '@/lib/engines/similarity';

export async function searchApolloSimilar(target: CompanyProfile): Promise<SimilarCompanyResult[]> {
  try {
    // Apollo Organization Search API endpoint
    const apolloKey = import.meta.env.VITE_APOLLO_API_KEY;
    if (!apolloKey) return [];
    
    const response = await fetch('https://api.apollo.io/v1/organizations/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apolloKey
      },
      body: JSON.stringify({
        industry: target.sector,
        country: ['BR'],
        state: target.state ? [target.state] : undefined,
        organization_num_employees_ranges: target.employees ? [`${Math.max(1, target.employees - 50)},${target.employees + 50}`] : undefined,
        page: 1,
        per_page: 20
      })
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    const candidates: SimilarCompanyResult[] = (data.organizations || []).map((org: any) => {
      const candidate: CompanyProfile = {
        name: org.name,
        website: org.website_url,
        employees: org.estimated_num_employees,
        sector: org.industry,
        state: org.state,
        city: org.city,
        technologies: org.technologies || [],
        revenue: org.estimated_annual_revenue
      };
      
      const similarity = calculateSimilarity(target, candidate);
      
      return {
        ...candidate,
        similarity,
        source: 'apollo',
        discoveryMethod: 'apollo-org-search',
        discoveredAt: new Date().toISOString(),
        needsEnrichment: false,
        alreadyInDatabase: false
      };
    });
    
    return candidates.filter(c => c.similarity.overallScore >= 50);
  } catch (error) {
    console.error('[APOLLO-DISCOVERY] Erro:', error);
    return [];
  }
}

