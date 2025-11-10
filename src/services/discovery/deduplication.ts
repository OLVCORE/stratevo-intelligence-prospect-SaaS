/**
 * DEDUPLICATION
 * Remove duplicatas de empresas por CNPJ
 */

import { SimilarCompanyResult } from '@/lib/engines/similarity';

/**
 * Remove duplicatas por CNPJ, mantendo a de maior score
 */
export function deduplicateByCNPJ(companies: SimilarCompanyResult[]): SimilarCompanyResult[] {
  const cnpjMap = new Map<string, SimilarCompanyResult>();
  
  companies.forEach(company => {
    if (!company.cnpj) {
      // Sem CNPJ, adiciona com ID único
      cnpjMap.set(`no-cnpj-${company.name}-${Math.random()}`, company);
      return;
    }
    
    const normalizedCNPJ = company.cnpj.replace(/[^\d]/g, '');
    
    const existing = cnpjMap.get(normalizedCNPJ);
    if (!existing || company.similarity.overallScore > existing.similarity.overallScore) {
      cnpjMap.set(normalizedCNPJ, company);
    }
  });
  
  return Array.from(cnpjMap.values());
}

