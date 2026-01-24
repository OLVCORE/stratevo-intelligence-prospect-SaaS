/**
 * Resolver Canônico de CNAE
 * 
 * Unifica a leitura de CNAE (principal + secundários) de múltiplas fontes:
 * - icp_analysis_results (fonte primária para empresas aprovadas)
 * - companies.raw_data (enrichment Receita Federal / APIs)
 * - companies.cnae_principal (fallback direto)
 * 
 * Prioridade:
 * 1. icp_analysis_results.cnae_principal (+ cnaes_secundarios)
 * 2. raw_data.atividade_principal / atividades_secundarias (Receita/APIs)
 * 3. companies.cnae_principal / cnae_descricao (fallback)
 */

export interface CNAEResolution {
  principal: {
    code: string | null;
    description: string | null;
  };
  secundarios: Array<{
    code: string;
    description: string | null;
  }>;
  fonte: 'icp_analysis' | 'receita_federal' | 'companies' | 'nenhuma';
}

/**
 * Resolve CNAE principal e secundários de uma empresa
 * 
 * @param company - Objeto da empresa (pode vir de companies ou icp_analysis_results)
 * @returns Resolução canônica do CNAE
 */
export function resolveCompanyCNAE(company: any): CNAEResolution {
  // ✅ MC2.4: Consolidar raw_data de múltiplas fontes
  // - companies.raw_data (estrutura padrão)
  // - qualified_prospects.enrichment.raw (estrutura do estoque)
  const rawData = (company as any).raw_data || (company as any).enrichment?.raw || {};
  const rawAnalysis = (company as any).raw_analysis || {};
  
  // ✅ MC2.4: Verificar também enrichment.cnae_principal (qualified_prospects)
  const enrichmentCNAE = (company as any).enrichment?.cnae_principal || null;
  
  // ========== PRIORIDADE 1: icp_analysis_results ==========
  // Se o objeto vem de icp_analysis_results, usar cnae_principal diretamente
  // Também verifica analysis_cnae_principal (adicionado pelo hook useCompanies)
  const fromICP = 
    (company as any).cnae_principal || 
    (company as any).analysis_cnae_principal ||
    rawAnalysis.cnae_principal ||
    enrichmentCNAE || // ✅ MC2.4: Incluir enrichment.cnae_principal
    null;
  if (fromICP) {
    // ✅ MC2.4: Buscar descrição também de enrichment.raw
    const enrichmentRaw = (company as any).enrichment?.raw || {};
    const icpDescription =
      (company as any).cnae_descricao ||
      rawAnalysis.cnae_descricao ||
      rawData.cnae_principal_descricao ||
      enrichmentRaw.receita_federal?.atividade_principal?.[0]?.text || // ✅ MC2.4: qualified_prospects
      enrichmentRaw.receita?.atividade_principal?.[0]?.text || // ✅ MC2.4: qualified_prospects
      enrichmentRaw.atividade_principal?.[0]?.text || // ✅ MC2.4: qualified_prospects
      enrichmentRaw.cnae_principal_descricao || // ✅ MC2.4: qualified_prospects
      null;
    
    // CNAEs secundários de icp_analysis_results (se existir campo)
    const secundarios: Array<{ code: string; description: string | null }> = [];
    if ((company as any).cnaes_secundarios && Array.isArray((company as any).cnaes_secundarios)) {
      (company as any).cnaes_secundarios.forEach((sec: any) => {
        if (sec && (sec.code || sec.codigo)) {
          secundarios.push({
            code: String(sec.code || sec.codigo).trim(),
            description: sec.description || sec.descricao || null,
          });
        }
      });
    }
    
    return {
      principal: {
        code: String(fromICP).trim(),
        description: icpDescription ? String(icpDescription).trim() : null,
      },
      secundarios,
      fonte: 'icp_analysis' as const,
    };
  }
  
  // ========== PRIORIDADE 2: raw_data (Receita Federal / APIs) ==========
  // ✅ MC2.4: Buscar também de enrichment.raw se raw_data não tiver
  const enrichmentRaw = (company as any).enrichment?.raw || {};
  const fromReceitaPrincipal =
    rawData.receita_federal?.atividade_principal?.[0]?.code ||
    rawData.receita?.atividade_principal?.[0]?.code ||
    rawData.atividade_principal?.[0]?.code ||
    rawData.cnae_fiscal ||
    rawData.cnae_principal ||
    enrichmentRaw.receita_federal?.atividade_principal?.[0]?.code || // ✅ MC2.4: qualified_prospects
    enrichmentRaw.receita?.atividade_principal?.[0]?.code || // ✅ MC2.4: qualified_prospects
    enrichmentRaw.atividade_principal?.[0]?.code || // ✅ MC2.4: qualified_prospects
    enrichmentRaw.cnae_fiscal || // ✅ MC2.4: qualified_prospects
    enrichmentRaw.cnae_principal || // ✅ MC2.4: qualified_prospects
    null;
  
  if (fromReceitaPrincipal) {
    const receitaDescription =
      rawData.receita_federal?.atividade_principal?.[0]?.text ||
      rawData.receita?.atividade_principal?.[0]?.text ||
      rawData.atividade_principal?.[0]?.text ||
      rawData.cnae_principal_descricao ||
      enrichmentRaw.receita_federal?.atividade_principal?.[0]?.text || // ✅ MC2.4: qualified_prospects
      enrichmentRaw.receita?.atividade_principal?.[0]?.text || // ✅ MC2.4: qualified_prospects
      enrichmentRaw.atividade_principal?.[0]?.text || // ✅ MC2.4: qualified_prospects
      enrichmentRaw.cnae_principal_descricao || // ✅ MC2.4: qualified_prospects
      null;
    
    // CNAEs secundários de raw_data (se existir)
    const secundarios: Array<{ code: string; description: string | null }> = [];
    const atividadesSecundarias =
      rawData.receita_federal?.atividades_secundarias ||
      rawData.receita?.atividades_secundarias ||
      rawData.atividades_secundarias ||
      enrichmentRaw.receita_federal?.atividades_secundarias || // ✅ MC2.4: qualified_prospects
      enrichmentRaw.receita?.atividades_secundarias || // ✅ MC2.4: qualified_prospects
      enrichmentRaw.atividades_secundarias || // ✅ MC2.4: qualified_prospects
      [];
    
    if (Array.isArray(atividadesSecundarias)) {
      atividadesSecundarias.forEach((sec: any) => {
        if (sec && (sec.code || sec.codigo)) {
          secundarios.push({
            code: String(sec.code || sec.codigo).trim(),
            description: sec.text || sec.texto || sec.description || sec.descricao || null,
          });
        }
      });
    }
    
    return {
      principal: {
        code: String(fromReceitaPrincipal).trim(),
        description: receitaDescription ? String(receitaDescription).trim() : null,
      },
      secundarios,
      fonte: 'receita_federal' as const,
    };
  }
  
  // ========== PRIORIDADE 3: companies (fallback direto) ==========
  const fromCompany = (company as any).cnae_principal || (company as any).cnae || null;
  if (fromCompany) {
    const companyDescription =
      (company as any).cnae_descricao ||
      rawData.cnae_descricao ||
      null;
    
    return {
      principal: {
        code: String(fromCompany).trim(),
        description: companyDescription ? String(companyDescription).trim() : null,
      },
      secundarios: [],
      fonte: 'companies' as const,
    };
  }
  
  // ========== NENHUMA FONTE ENCONTRADA ==========
  return {
    principal: {
      code: null,
      description: null,
    },
    secundarios: [],
    fonte: 'nenhuma' as const,
  };
}

/**
 * Formata CNAE para exibição: "CODIGO - DESCRIÇÃO"
 * 
 * @param resolution - Resolução canônica do CNAE
 * @returns String formatada ou null
 */
export function formatCNAEForDisplay(resolution: CNAEResolution): string | null {
  const { code, description } = resolution.principal;
  
  if (!code && !description) {
    return null;
  }
  
  const parts: string[] = [];
  if (code) parts.push(code);
  if (description) parts.push(description);
  
  return parts.length > 0 ? parts.join(' - ') : null;
}
