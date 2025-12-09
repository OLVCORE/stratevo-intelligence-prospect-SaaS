import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

const EMPRESAS_AQUI_API_KEY = Deno.env.get('EMPRESASAQUI_API_KEY');
const EMPRESAS_AQUI_BASE_URL = Deno.env.get('EMPRESASAQUI_BASE_URL') ?? 'https://api.empresasaqui.com.br';

/**
 * MC9 V2.2: Normaliza CNPJ
 */
function normalizeCNPJ(cnpj: string | null | undefined): string | null {
  if (!cnpj) return null;
  const cleaned = String(cnpj).replace(/\D/g, '');
  return cleaned.length === 14 ? cleaned : cleaned.length > 0 ? cleaned : null;
}

/**
 * MC9 V2.2: Normaliza website
 */
function normalizeWebsite(website: string | null | undefined): string | null {
  if (!website) return null;
  let cleaned = String(website).trim().replace(/\s+/g, '');
  if (!cleaned) return null;
  if (!cleaned.match(/^https?:\/\//i)) {
    cleaned = `https://${cleaned}`;
  }
  try {
    const url = new URL(cleaned);
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return cleaned;
  }
}

/**
 * MC9 V2.2: Normaliza uma linha da API Empresas Aqui
 */
function normalizeEmpresasAquiRow(row: any, icpId: string | null, sourceBatchId: string): any {
  const cnpj = normalizeCNPJ(row?.cnpj);
  const website = normalizeWebsite(row?.website);
  
  return {
    companyName: row?.razao_social ?? row?.nome_fantasia ?? 'Empresa sem nome',
    cnpj,
    website,
    uf: row?.uf ?? null,
    city: row?.municipio ?? null,
    sector: row?.cnae_principal ?? null,
    rawPayload: row,
    source: 'API_EMPRESAS_AQUI',
    sourceBatchId,
    icpId: icpId ?? null,
  };
}

/**
 * MC9 V2.2: Extrai domínio de website
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
 * MC9 V2.2: Normaliza CNPJ para comparação
 */
function normalizeCNPJForComparison(cnpj: string | null | undefined): string | null {
  if (!cnpj) return null;
  const cleaned = String(cnpj).replace(/\D/g, '');
  return cleaned.length === 14 ? cleaned : null;
}

/**
 * MC9 V2.2: Deduplica prospects
 */
async function dedupeProspects(params: {
  supabaseClient: any;
  tenantId: string;
  prospects: any[];
}): Promise<{ uniqueProspects: any[]; duplicatedCount: number }> {
  const { supabaseClient, tenantId, prospects } = params;
  
  const toInsert: any[] = [];
  let duplicatedCount = 0;
  
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
    const { data: companies } = await supabaseClient
      .from('companies')
      .select('cnpj')
      .in('cnpj', cnpjsToCheck)
      .eq('tenant_id', tenantId);
    
    if (companies) {
      companies.forEach((c: any) => {
        const normalized = normalizeCNPJForComparison(c.cnpj);
        if (normalized) {
          existingCompaniesByCNPJ.add(normalized);
        }
      });
    }
  }
  
  // Buscar empresas existentes por website
  const existingCompaniesByWebsite = new Set<string>();
  if (websitesToCheck.length > 0) {
    const { data: companies } = await supabaseClient
      .from('companies')
      .select('website')
      .eq('tenant_id', tenantId)
      .not('website', 'is', null);
    
    if (companies) {
      companies.forEach((c: any) => {
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
    const { data: candidates } = await supabaseClient
      .from('prospecting_candidates')
      .select('cnpj')
      .in('cnpj', cnpjsToCheck)
      .eq('tenant_id', tenantId);
    
    if (candidates) {
      candidates.forEach((c: any) => {
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
    
    if (normalizedCNPJ) {
      if (existingCompaniesByCNPJ.has(normalizedCNPJ) || existingCandidatesByCNPJ.has(normalizedCNPJ)) {
        isDuplicate = true;
      }
    }
    
    if (!isDuplicate && domain) {
      if (existingCompaniesByWebsite.has(domain)) {
        isDuplicate = true;
      }
    }
    
    if (isDuplicate) {
      duplicatedCount++;
    } else {
      toInsert.push(prospect);
    }
  }
  
  return { uniqueProspects: toInsert, duplicatedCount };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const { tenantId, icpId, filters } = await req.json();

    console.log('[MC9-V2.2] Import via API Empresas Aqui iniciado', {
      tenantId,
      icpId,
      filters,
    });

    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: 'tenantId obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!EMPRESAS_AQUI_API_KEY) {
      console.error('[MC9-V2.2] EMPRESASAQUI_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'EMPRESASAQUI_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: { headers: { 'x-my-custom-header': 'mc9-empresas-aqui-import' } },
      }
    );

    // 1) Montar URL e parâmetros de busca
    // NOTA: Ajustar conforme documentação real da API Empresas Aqui
    const searchParams = new URLSearchParams();
    if (filters?.cnae) searchParams.set('cnae', filters.cnae);
    if (filters?.uf) searchParams.set('uf', filters.uf);
    if (filters?.porte) searchParams.set('porte', filters.porte);
    if (filters?.page) searchParams.set('page', String(filters.page));
    if (filters?.pageSize) searchParams.set('pageSize', String(filters.pageSize || 50));

    const url = `${EMPRESAS_AQUI_BASE_URL}/empresas?${searchParams.toString()}`;

    console.log('[MC9-V2.2] Chamando API Empresas Aqui:', url);

    const resp = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${EMPRESAS_AQUI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('[MC9-V2.2] Erro Empresas Aqui:', resp.status, errorText);
      return new Response(
        JSON.stringify({ error: `Falha ao consultar Empresas Aqui: ${resp.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const json = await resp.json();

    // 2) Mapear resultado bruto
    // NOTA: Ajustar conforme estrutura real da resposta da API
    const rawCompanies: any[] = Array.isArray(json?.data) ? json.data : 
                                Array.isArray(json) ? json : [];

    if (rawCompanies.length === 0) {
      return new Response(
        JSON.stringify({
          totalEncontradas: 0,
          totalNovas: 0,
          totalDuplicadas: 0,
          pagina: filters?.page ?? 1,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3) Normalizar empresas
    const sourceBatchId = `api-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const normalized = rawCompanies.map((row) => normalizeEmpresasAquiRow(row, icpId, sourceBatchId));

    // 4) Deduplicar
    const { uniqueProspects, duplicatedCount } = await dedupeProspects({
      supabaseClient,
      tenantId,
      prospects: normalized,
    });

    // 5) Inserir os novos em prospecting_candidates
    let insertedCount = 0;
    if (uniqueProspects.length > 0) {
      const recordsToInsert = uniqueProspects.map((p) => ({
        tenant_id: tenantId,
        icp_id: icpId ?? null,
        source: 'API_EMPRESAS_AQUI',
        source_batch_id: sourceBatchId,
        company_name: p.companyName,
        cnpj: p.cnpj,
        website: p.website,
        uf: p.uf,
        city: p.city,
        sector: p.sector,
        country: 'Brasil',
        notes: JSON.stringify(p.rawPayload),
        status: 'pending',
      }));

      const { error: insertError } = await supabaseClient
        .from('prospecting_candidates')
        .insert(recordsToInsert);

      if (insertError) {
        console.error('[MC9-V2.2] Erro ao inserir prospects:', insertError);
        return new Response(
          JSON.stringify({ error: `Falha ao salvar prospects: ${insertError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      insertedCount = uniqueProspects.length;
    }

    const stats = {
      totalEncontradas: rawCompanies.length,
      totalNovas: insertedCount,
      totalDuplicadas: duplicatedCount,
      pagina: filters?.page ?? 1,
      paginasTotais: json?.meta?.totalPages ?? json?.pagination?.totalPages ?? undefined,
    };

    console.log('[MC9-V2.2] Importação Empresas Aqui concluída:', stats);

    return new Response(
      JSON.stringify(stats),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[MC9-V2.2] ❌ Erro inesperado:', error);
    return new Response(
      JSON.stringify({ error: `Erro interno na importação Empresas Aqui: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

