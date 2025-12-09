import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

/**
 * Similar Companies: Normaliza CNPJ para comparação
 */
function normalizeCNPJForComparison(cnpj: string | null | undefined): string | null {
  if (!cnpj) return null;
  const cleaned = String(cnpj).replace(/\D/g, '');
  return cleaned.length === 14 ? cleaned : null;
}

/**
 * Similar Companies: Extrai domínio de website
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
 * Similar Companies: Calcula score de similaridade (0-1)
 */
function calculateSimilarityScore(
  base: any,
  candidate: any
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // 1. CNAE principal igual ou prefixo similar (+0.4)
  const baseCNAE = base.cnae_principal || base.sector || '';
  const candidateCNAE = candidate.cnae_principal || candidate.sector || '';
  
  if (baseCNAE && candidateCNAE) {
    const baseCNAEClean = String(baseCNAE).replace(/\D/g, '').substring(0, 4);
    const candidateCNAEClean = String(candidateCNAE).replace(/\D/g, '').substring(0, 4);
    
    if (baseCNAEClean === candidateCNAEClean && baseCNAEClean.length >= 4) {
      score += 0.4;
      reasons.push(`Mesmo CNAE principal ${baseCNAE}`);
    } else if (baseCNAEClean && candidateCNAEClean && baseCNAEClean.substring(0, 2) === candidateCNAEClean.substring(0, 2)) {
      score += 0.2;
      reasons.push(`CNAE similar (mesma divisão)`);
    }
  }

  // 2. UF igual (+0.2)
  if (base.uf && candidate.uf && base.uf === candidate.uf) {
    score += 0.2;
    reasons.push(`Mesma UF: ${base.uf}`);
  }

  // 3. Porte equivalente (+0.2)
  const porteMap: Record<string, string[]> = {
    'micro': ['micro'],
    'pequena': ['pequena', 'pequeno'],
    'media': ['media', 'medio', 'média', 'médio'],
    'grande': ['grande'],
  };

  if (base.porte && candidate.porte) {
    const basePorte = String(base.porte).toLowerCase();
    const candidatePorte = String(candidate.porte).toLowerCase();
    
    for (const [key, values] of Object.entries(porteMap)) {
      if (values.includes(basePorte) && values.includes(candidatePorte)) {
        score += 0.2;
        reasons.push(`Porte semelhante (${key})`);
        break;
      }
    }
  }

  // 4. Website domínio similar (+0.1)
  const baseDomain = extractDomain(base.website);
  const candidateDomain = extractDomain(candidate.website);
  
  if (baseDomain && candidateDomain) {
    const baseDomainParts = baseDomain.split('.');
    const candidateDomainParts = candidateDomain.split('.');
    
    if (baseDomainParts.length >= 2 && candidateDomainParts.length >= 2) {
      const baseMain = baseDomainParts[baseDomainParts.length - 2];
      const candidateMain = candidateDomainParts[candidateDomainParts.length - 2];
      
      if (baseMain === candidateMain) {
        score += 0.1;
        reasons.push(`Domínio similar`);
      }
    }
  }

  // 5. Setor textual similar (+0.1)
  if (base.sector && candidate.sector) {
    const baseSector = String(base.sector).toLowerCase();
    const candidateSector = String(candidate.sector).toLowerCase();
    
    if (baseSector.includes(candidateSector) || candidateSector.includes(baseSector)) {
      score += 0.1;
      reasons.push(`Setor similar`);
    }
  }

  // Garantir que score não ultrapasse 1.0
  score = Math.min(score, 1.0);

  return { score, reasons };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const { tenantId, baseCompanyId, cnpj, limit = 50 } = await req.json();

    console.log('[SimilarCompanies] Busca iniciada', {
      tenantId,
      baseCompanyId,
      cnpj,
      limit,
    });

    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: 'tenantId obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!baseCompanyId && !cnpj) {
      return new Response(
        JSON.stringify({ error: 'baseCompanyId ou cnpj obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: { headers: { 'x-my-custom-header': 'mc9-similar-companies' } },
      }
    );

    // 1) Buscar baseCompany
    let baseCompany: any = null;

    if (baseCompanyId) {
      const { data: company } = await supabaseClient
        .from('companies')
        .select('*')
        .eq('id', baseCompanyId)
        .eq('tenant_id', tenantId)
        .single();

      if (company) {
        baseCompany = {
          id: company.id,
          sourceTable: 'companies' as const,
          tenantId: company.tenant_id,
          companyName: company.razao_social || company.nome_fantasia || 'Empresa sem nome',
          cnpj: company.cnpj,
          website: company.website,
          uf: company.uf,
          city: company.municipio || company.cidade,
          sector: company.cnae_principal || company.segmento,
          porte: company.porte,
          cnae_principal: company.cnae_principal,
        };
      }
    } else if (cnpj) {
      const cnpjClean = normalizeCNPJForComparison(cnpj);
      if (cnpjClean) {
        const { data: company } = await supabaseClient
          .from('companies')
          .select('*')
          .eq('cnpj', cnpjClean)
          .eq('tenant_id', tenantId)
          .maybeSingle();

        if (company) {
          baseCompany = {
            id: company.id,
            sourceTable: 'companies' as const,
            tenantId: company.tenant_id,
            companyName: company.razao_social || company.nome_fantasia || 'Empresa sem nome',
            cnpj: company.cnpj,
            website: company.website,
            uf: company.uf,
            city: company.municipio || company.cidade,
            sector: company.cnae_principal || company.segmento,
            porte: company.porte,
            cnae_principal: company.cnae_principal,
          };
        } else {
          // Fallback: buscar em prospecting_candidates
          const { data: candidate } = await supabaseClient
            .from('prospecting_candidates')
            .select('*')
            .eq('cnpj', cnpjClean)
            .eq('tenant_id', tenantId)
            .maybeSingle();

          if (candidate) {
            baseCompany = {
              id: candidate.id,
              sourceTable: 'prospecting_candidates' as const,
              tenantId: candidate.tenant_id,
              companyName: candidate.company_name,
              cnpj: candidate.cnpj,
              website: candidate.website,
              uf: candidate.uf,
              city: candidate.city,
              sector: candidate.sector,
              porte: null,
              cnae_principal: candidate.sector,
            };
          }
        }
      }
    }

    if (!baseCompany) {
      return new Response(
        JSON.stringify({ error: 'Empresa base não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2) Buscar candidatos no mesmo tenant
    const candidates: any[] = [];

    // Buscar em companies
    let query = supabaseClient
      .from('companies')
      .select('id, tenant_id, razao_social, nome_fantasia, cnpj, website, uf, municipio, cidade, cnae_principal, segmento, porte')
      .eq('tenant_id', tenantId)
      .neq('id', baseCompany.id);

    // Filtros básicos para reduzir candidatos
    if (baseCompany.uf) {
      query = query.eq('uf', baseCompany.uf);
    }
    if (baseCompany.cnae_principal) {
      const cnaePrefix = String(baseCompany.cnae_principal).replace(/\D/g, '').substring(0, 2);
      if (cnaePrefix) {
        query = query.like('cnae_principal', `${cnaePrefix}%`);
      }
    }

    const { data: companies } = await query.limit(200);

    if (companies) {
      companies.forEach((c: any) => {
        candidates.push({
          id: c.id,
          sourceTable: 'companies' as const,
          tenantId: c.tenant_id,
          companyName: c.razao_social || c.nome_fantasia || 'Empresa sem nome',
          cnpj: c.cnpj,
          website: c.website,
          uf: c.uf,
          city: c.municipio || c.cidade,
          sector: c.cnae_principal || c.segmento,
          porte: c.porte,
          cnae_principal: c.cnae_principal,
        });
      });
    }

    // Buscar em prospecting_candidates
    let candidateQuery = supabaseClient
      .from('prospecting_candidates')
      .select('id, tenant_id, company_name, cnpj, website, uf, city, sector')
      .eq('tenant_id', tenantId)
      .neq('id', baseCompany.id);

    if (baseCompany.uf) {
      candidateQuery = candidateQuery.eq('uf', baseCompany.uf);
    }
    if (baseCompany.sector) {
      candidateQuery = candidateQuery.ilike('sector', `${baseCompany.sector}%`);
    }

    const { data: prospectingCandidates } = await candidateQuery.limit(100);

    if (prospectingCandidates) {
      prospectingCandidates.forEach((c: any) => {
        candidates.push({
          id: c.id,
          sourceTable: 'prospecting_candidates' as const,
          tenantId: c.tenant_id,
          companyName: c.company_name,
          cnpj: c.cnpj,
          website: c.website,
          uf: c.uf,
          city: c.city,
          sector: c.sector,
          porte: null,
          cnae_principal: c.sector,
        });
      });
    }

    // 3) Calcular scores
    const scored: Array<{ candidate: any; score: number; reasons: string[] }> = [];

    for (const candidate of candidates) {
      const { score, reasons } = calculateSimilarityScore(baseCompany, candidate);
      
      if (score > 0) {
        scored.push({
          candidate,
          score,
          reasons,
        });
      }
    }

    // 4) Ordenar por score e limitar
    scored.sort((a, b) => b.score - a.score);
    const topMatches = scored.slice(0, limit).map(item => ({
      candidate: item.candidate,
      score: item.score,
      reasons: item.reasons,
    }));

    const result = {
      baseCompany: {
        id: baseCompany.id,
        sourceTable: baseCompany.sourceTable,
        tenantId: baseCompany.tenantId,
        companyName: baseCompany.companyName,
        cnpj: baseCompany.cnpj,
        website: baseCompany.website,
        uf: baseCompany.uf,
        city: baseCompany.city,
        sector: baseCompany.sector,
        porte: baseCompany.porte,
      },
      topMatches,
    };

    console.log('[SimilarCompanies] Busca concluída', {
      baseCompany: baseCompany.companyName,
      matchesCount: topMatches.length,
    });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[SimilarCompanies] ❌ Erro inesperado:', error);
    return new Response(
      JSON.stringify({ error: `Erro interno na busca de empresas similares: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

