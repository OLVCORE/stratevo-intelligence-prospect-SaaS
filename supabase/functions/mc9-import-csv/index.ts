import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

/**
 * MC9 V2.1: Normaliza CNPJ
 */
function normalizeCNPJ(cnpj: string | null | undefined): string | null {
  if (!cnpj) return null;
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.length === 14 ? cleaned : cleaned.length > 0 ? cleaned : null;
}

/**
 * MC9 V2.1: Normaliza website
 */
function normalizeWebsite(website: string | null | undefined): string | null {
  if (!website) return null;
  let cleaned = website.trim().replace(/\s+/g, '');
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
 * MC9 V2.1: Normaliza UF
 */
function normalizeUF(uf: string | null | undefined): string | null {
  if (!uf) return null;
  const cleaned = uf.trim().toUpperCase();
  if (cleaned.length === 2) return cleaned;
  const stateMap: Record<string, string> = {
    'ACRE': 'AC', 'ALAGOAS': 'AL', 'AMAPA': 'AP', 'AMAZONAS': 'AM',
    'BAHIA': 'BA', 'CEARA': 'CE', 'DISTRITO FEDERAL': 'DF', 'ESPIRITO SANTO': 'ES',
    'GOIAS': 'GO', 'MARANHAO': 'MA', 'MATO GROSSO': 'MT', 'MATO GROSSO DO SUL': 'MS',
    'MINAS GERAIS': 'MG', 'PARA': 'PA', 'PARAIBA': 'PB', 'PARANA': 'PR',
    'PERNAMBUCO': 'PE', 'PIAUI': 'PI', 'RIO DE JANEIRO': 'RJ', 'RIO GRANDE DO NORTE': 'RN',
    'RIO GRANDE DO SUL': 'RS', 'RONDONIA': 'RO', 'RORAIMA': 'RR', 'SANTA CATARINA': 'SC',
    'SAO PAULO': 'SP', 'SERGIPE': 'SE', 'TOCANTINS': 'TO',
  };
  return stateMap[cleaned] || cleaned;
}

/**
 * MC9 V2.1: Normaliza email
 */
function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const cleaned = email.trim().toLowerCase();
  return cleaned.includes('@') && cleaned.includes('.') ? cleaned : null;
}

/**
 * MC9 V2.1: Normaliza telefone
 */
function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * MC9 V2.1: Normaliza uma linha do CSV
 */
function normalizeProspectRow(
  row: any,
  source: string,
  icpId: string,
  sourceBatchId: string,
  columnMapping: Record<string, string>
): any {
  const getValue = (field: string): string | null => {
    const csvColumn = columnMapping[field];
    if (!csvColumn) return null;
    const value = row[csvColumn];
    return value ? String(value).trim() : null;
  };
  
  const companyName = getValue('companyName') || 
                      getValue('razao_social') || 
                      getValue('nome_fantasia') || 
                      getValue('nome_da_empresa') ||
                      Object.values(row).find((v: any) => v && String(v).trim().length > 0)?.toString() || 
                      'Empresa sem nome';
  
  return {
    source,
    source_batch_id: sourceBatchId,
    icp_id: icpId,
    company_name: companyName,
    cnpj: normalizeCNPJ(getValue('cnpj')),
    website: normalizeWebsite(getValue('website') || getValue('site')),
    sector: getValue('sector') || getValue('setor'),
    uf: normalizeUF(getValue('uf') || getValue('estado')),
    city: getValue('city') || getValue('cidade') || getValue('municipio'),
    country: getValue('country') || getValue('pais') || 'Brasil',
    contact_name: getValue('contactName') || getValue('contato_nome') || getValue('decisor_1_nome'),
    contact_role: getValue('contactRole') || getValue('contato_cargo') || getValue('decisor_1_cargo'),
    contact_email: normalizeEmail(getValue('contactEmail') || getValue('contato_email') || getValue('decisor_1_email')),
    contact_phone: normalizePhone(getValue('contactPhone') || getValue('contato_telefone') || getValue('decisor_1_telefone')),
    linkedin_url: getValue('linkedinUrl') || getValue('linkedin') || getValue('decisor_1_linkedin'),
    notes: getValue('notes') || getValue('observacoes') || getValue('notas'),
  };
}

/**
 * MC9 V2.1: Extrai domínio de website
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
 * MC9 V2.1: Normaliza CNPJ para comparação
 */
function normalizeCNPJForComparison(cnpj: string | null | undefined): string | null {
  if (!cnpj) return null;
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.length === 14 ? cleaned : null;
}

Deno.serve(async (req) => {
  // Preflight CORS - DEVE retornar status 200 com headers CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const { tenantId, icpId, source, sourceBatchId, rows, columnMapping } = await req.json();

    console.log('[MC9-V2.1] Import started', { 
      tenantId, 
      icpId, 
      source, 
      totalRows: rows?.length || 0 
    });

    if (!tenantId || !icpId || !source || !sourceBatchId || !rows || !Array.isArray(rows)) {
      throw new Error('Parâmetros obrigatórios: tenantId, icpId, source, sourceBatchId, rows');
    }

    // Usar SERVICE_ROLE_KEY para bypass RLS e permitir inserções
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuração do Supabase incompleta (URL ou SERVICE_ROLE_KEY faltando)');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Normalizar linhas
    const normalizedRows = rows
      .filter((row: any) => {
        const hasData = Object.values(row).some((v: any) => v && String(v).trim().length > 0);
        return hasData;
      })
      .map((row: any) => normalizeProspectRow(row, source, icpId, sourceBatchId, columnMapping || {}))
      .filter((prospect: any) => prospect.company_name && prospect.company_name.trim().length > 0);

    if (normalizedRows.length === 0) {
      return new Response(
        JSON.stringify({ 
          insertedCount: 0, 
          duplicatesCount: 0, 
          batchId: sourceBatchId,
          warnings: ['Nenhuma linha válida encontrada no CSV']
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Deduplicação
    const cnpjsToCheck = normalizedRows
      .map((p: any) => normalizeCNPJForComparison(p.cnpj))
      .filter((cnpj: any): cnpj is string => cnpj !== null);
    
    const websitesToCheck = normalizedRows
      .map((p: any) => extractDomain(p.website))
      .filter((domain: any): domain is string => domain !== null);

    // Buscar empresas existentes por CNPJ
    const existingCompaniesByCNPJ = new Set<string>();
    if (cnpjsToCheck.length > 0) {
      const { data: companies } = await supabase
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
      const { data: companies } = await supabase
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
      const { data: candidates } = await supabase
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

    // Separar duplicados e para inserir
    const toInsert: any[] = [];
    const duplicates: any[] = [];

    for (const prospect of normalizedRows) {
      const normalizedCNPJ = normalizeCNPJForComparison(prospect.cnpj);
      const domain = extractDomain(prospect.website);
      
      let isDuplicate = false;
      let reason = '';
      
      if (normalizedCNPJ) {
        if (existingCompaniesByCNPJ.has(normalizedCNPJ)) {
          isDuplicate = true;
          reason = 'CNPJ já existente em companies';
        } else if (existingCandidatesByCNPJ.has(normalizedCNPJ)) {
          isDuplicate = true;
          reason = 'CNPJ já existente em prospecting_candidates';
        }
      }
      
      if (!isDuplicate && domain) {
        if (existingCompaniesByWebsite.has(domain)) {
          isDuplicate = true;
          reason = 'Website já vinculado a outra empresa em companies';
        }
      }
      
      if (isDuplicate) {
        duplicates.push({ prospect, reason });
      } else {
        toInsert.push({
          tenant_id: tenantId,
          ...prospect,
        });
      }
    }

    // 3. Inserir candidatos
    let insertedCount = 0;
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('prospecting_candidates')
        .insert(toInsert);
      
      if (insertError) {
        console.error('[MC9-V2.1] Error inserting candidates:', insertError);
        throw new Error(`Erro ao inserir candidatos: ${insertError.message}`);
      }
      
      insertedCount = toInsert.length;
    }

    const warnings: string[] = [];
    if (duplicates.length > 0) {
      warnings.push(`${duplicates.length} linhas ignoradas por duplicidade`);
    }
    if (normalizedRows.length < rows.length) {
      warnings.push(`${rows.length - normalizedRows.length} linhas vazias ou inválidas foram ignoradas`);
    }

    console.log('[MC9-V2.1] Import result', { 
      insertedCount, 
      duplicatesCount: duplicates.length,
      batchId: sourceBatchId
    });

    // Retornar resposta com formato esperado pelo frontend
    return new Response(
      JSON.stringify({
        insertedCount,
        importedCount: insertedCount, // Alias para compatibilidade
        duplicatesCount: duplicates.length,
        duplicatedCount: duplicates.length, // Alias para compatibilidade
        batchId: sourceBatchId,
        warnings,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('[MC9-V2.1] ❌ Error in import-csv Edge Function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

