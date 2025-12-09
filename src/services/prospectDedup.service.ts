/**
 * MC9 V2.1: Serviço de Deduplicação de Prospects
 * 
 * Verifica duplicidade contra empresas existentes e candidatos já importados
 */

import { supabase } from '@/integrations/supabase/client';
import type { NormalizedProspect, DedupedProspects } from '@/types/prospecting';

/**
 * Extrai domínio de um website
 */
function extractDomain(website: string | null | undefined): string | null {
  if (!website) return null;
  
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Normaliza CNPJ para comparação (remove formatação)
 */
function normalizeCNPJForComparison(cnpj: string | null | undefined): string | null {
  if (!cnpj) return null;
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.length === 14 ? cleaned : null;
}

/**
 * Verifica duplicidade de prospects contra empresas existentes e candidatos já importados
 */
export async function dedupeProspects(
  prospects: NormalizedProspect[],
  tenantId: string
): Promise<DedupedProspects> {
  const toInsert: NormalizedProspect[] = [];
  const duplicates: DedupedProspects['duplicates'] = [];
  
  // Coletar CNPJs e websites para busca em batch
  const cnpjsToCheck = prospects
    .map(p => normalizeCNPJForComparison(p.cnpj))
    .filter((cnpj): cnpj is string => cnpj !== null);
  
  const websitesToCheck = prospects
    .map(p => extractDomain(p.website))
    .filter((domain): domain is string => domain !== null);
  
  // Buscar empresas existentes por CNPJ
  const existingCompaniesByCNPJ = new Set<string>();
  if (cnpjsToCheck.length > 0) {
    const { data: companies } = await supabase
      .from('companies')
      .select('cnpj')
      .in('cnpj', cnpjsToCheck)
      .eq('tenant_id', tenantId);
    
    if (companies) {
      companies.forEach(c => {
        const normalized = normalizeCNPJForComparison(c.cnpj);
        if (normalized) {
          existingCompaniesByCNPJ.add(normalized);
        }
      });
    }
  }
  
  // Buscar empresas existentes por website (domínio)
  const existingCompaniesByWebsite = new Set<string>();
  if (websitesToCheck.length > 0) {
    const { data: companies } = await supabase
      .from('companies')
      .select('website')
      .eq('tenant_id', tenantId)
      .not('website', 'is', null);
    
    if (companies) {
      companies.forEach(c => {
        const domain = extractDomain(c.website);
        if (domain && websitesToCheck.includes(domain)) {
          existingCompaniesByWebsite.add(domain);
        }
      });
    }
  }
  
  // Buscar candidatos já importados por CNPJ
  const existingCandidatesByCNPJ = new Set<string>();
  if (cnpjsToCheck.length > 0) {
    const { data: candidates } = await supabase
      .from('prospecting_candidates')
      .select('cnpj')
      .in('cnpj', cnpjsToCheck)
      .eq('tenant_id', tenantId);
    
    if (candidates) {
      candidates.forEach(c => {
        const normalized = normalizeCNPJForComparison(c.cnpj);
        if (normalized) {
          existingCandidatesByCNPJ.add(normalized);
        }
      });
    }
  }
  
  // Processar cada prospect
  for (const prospect of prospects) {
    const normalizedCNPJ = normalizeCNPJForComparison(prospect.cnpj);
    const domain = extractDomain(prospect.website);
    
    let isDuplicate = false;
    let reason = '';
    
    // Verificar duplicidade por CNPJ
    if (normalizedCNPJ) {
      if (existingCompaniesByCNPJ.has(normalizedCNPJ)) {
        isDuplicate = true;
        reason = 'CNPJ já existente em companies';
      } else if (existingCandidatesByCNPJ.has(normalizedCNPJ)) {
        isDuplicate = true;
        reason = 'CNPJ já existente em prospecting_candidates';
      }
    }
    
    // Verificar duplicidade por website (se CNPJ não foi encontrado)
    if (!isDuplicate && domain) {
      if (existingCompaniesByWebsite.has(domain)) {
        isDuplicate = true;
        reason = 'Website já vinculado a outra empresa em companies';
      }
    }
    
    if (isDuplicate) {
      duplicates.push({ prospect, reason });
    } else {
      toInsert.push(prospect);
    }
  }
  
  return { toInsert, duplicates };
}

