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
  
  // ✅ CRÍTICO: Tentar extrair CNAE de companies.cnae_principal diretamente (fallback adicional)
  const directCNAE = (company as any).cnae_principal || null;
  
  // ========== PRIORIDADE 1: icp_analysis_results ==========
  // Se o objeto vem de icp_analysis_results, usar cnae_principal diretamente
  // Também verifica analysis_cnae_principal (adicionado pelo hook useCompanies)
  // ✅ CRÍTICO: Incluir directCNAE como primeira opção para garantir que código seja encontrado
  const fromICP = 
    directCNAE || // ✅ CRÍTICO: Verificar direto primeiro
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
  
  // ✅ CRÍTICO: Buscar CNAE em TODAS as estruturas possíveis de raw_data
  // Estruturas comuns: receita_federal, receita, atividade_principal (array ou objeto)
  const fromReceitaPrincipal =
    // Estrutura padrão Receita Federal (array)
    rawData.receita_federal?.atividade_principal?.[0]?.code ||
    rawData.receita?.atividade_principal?.[0]?.code ||
    rawData.atividade_principal?.[0]?.code ||
    // Estrutura alternativa (objeto direto)
    rawData.receita_federal?.atividade_principal?.code ||
    rawData.receita?.atividade_principal?.code ||
    rawData.atividade_principal?.code ||
    // Campos diretos
    rawData.cnae_fiscal ||
    rawData.cnae_principal ||
    rawData.cnae ||
    // ✅ MC2.4: qualified_prospects (enrichment.raw)
    enrichmentRaw.receita_federal?.atividade_principal?.[0]?.code ||
    enrichmentRaw.receita?.atividade_principal?.[0]?.code ||
    enrichmentRaw.atividade_principal?.[0]?.code ||
    enrichmentRaw.receita_federal?.atividade_principal?.code ||
    enrichmentRaw.receita?.atividade_principal?.code ||
    enrichmentRaw.atividade_principal?.code ||
    enrichmentRaw.cnae_fiscal ||
    enrichmentRaw.cnae_principal ||
    enrichmentRaw.cnae ||
    null;
  
  if (fromReceitaPrincipal) {
    // ✅ CRÍTICO: Buscar descrição em TODAS as estruturas possíveis
    const receitaDescription =
      // Estrutura padrão Receita Federal (array)
      rawData.receita_federal?.atividade_principal?.[0]?.text ||
      rawData.receita?.atividade_principal?.[0]?.text ||
      rawData.atividade_principal?.[0]?.text ||
      // Estrutura alternativa (objeto direto)
      rawData.receita_federal?.atividade_principal?.text ||
      rawData.receita?.atividade_principal?.text ||
      rawData.atividade_principal?.text ||
      // Campos diretos
      rawData.cnae_principal_descricao ||
      rawData.cnae_descricao ||
      rawData.descricao ||
      // ✅ MC2.4: qualified_prospects (enrichment.raw)
      enrichmentRaw.receita_federal?.atividade_principal?.[0]?.text ||
      enrichmentRaw.receita?.atividade_principal?.[0]?.text ||
      enrichmentRaw.atividade_principal?.[0]?.text ||
      enrichmentRaw.receita_federal?.atividade_principal?.text ||
      enrichmentRaw.receita?.atividade_principal?.text ||
      enrichmentRaw.atividade_principal?.text ||
      enrichmentRaw.cnae_principal_descricao ||
      enrichmentRaw.cnae_descricao ||
      enrichmentRaw.descricao ||
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
  // ✅ CRÍTICO: Verificar múltiplas variações do campo CNAE
  const fromCompany = 
    directCNAE ||
    (company as any).cnae_principal || 
    (company as any).cnae || 
    (company as any).cnae_fiscal ||
    rawData.cnae_fiscal ||
    rawData.cnae_principal ||
    null;
    
  if (fromCompany) {
    const companyDescription =
      (company as any).cnae_descricao ||
      rawData.cnae_descricao ||
      rawData.cnae_principal_descricao ||
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
 * Formata código CNAE no padrão oficial IBGE: "28.69-1/00"
 * Formato: NN.NN-N/NN (7 dígitos: 2 seção + 2 divisão + 1 grupo + 2 classe)
 * 
 * @param cnaeCode - Código CNAE (pode vir com ou sem formatação)
 * @returns Código formatado no padrão IBGE ou o código original se não puder formatar
 */
export function formatCNAECodeIBGE(cnaeCode: string | null): string | null {
  if (!cnaeCode) return null;
  
  const codeStr = String(cnaeCode).trim();
  
  // Se já está no formato IBGE (tem ponto, hífen e barra), retornar como está
  if (codeStr.includes('.') && codeStr.includes('-') && codeStr.includes('/')) {
    return codeStr;
  }
  
  // Remover todos os caracteres não numéricos
  const digitsOnly = codeStr.replace(/\D/g, '');
  
  // CNAE deve ter 7 dígitos no formato IBGE
  if (digitsOnly.length === 7) {
    // Formato: NN.NN-N/NN
    // Ex: "2869100" -> "28.69-1/00"
    return `${digitsOnly.substring(0, 2)}.${digitsOnly.substring(2, 4)}-${digitsOnly.substring(4, 5)}/${digitsOnly.substring(5, 7)}`;
  }
  
  // Se tem formato parcial (ex: "2869-1/00"), tentar completar
  if (codeStr.includes('-') && codeStr.includes('/')) {
    const match = codeStr.match(/(\d{2})(\d{2})-(\d)\/(\d{2})/);
    if (match) {
      return `${match[1]}.${match[2]}-${match[3]}/${match[4]}`;
    }
  }
  
  // Se não conseguir formatar, retornar original (pode ser que já esteja formatado de outra forma)
  return codeStr;
}

/**
 * Formata CNAE para exibição: "CÓDIGO IBGE - DESCRIÇÃO"
 * Formato oficial IBGE: "28.69-1/00 - Fabricação de..."
 * 
 * ✅ CRÍTICO: SEMPRE mostrar o código quando disponível, mesmo que descrição esteja ausente
 * 
 * @param resolution - Resolução canônica do CNAE
 * @returns String formatada ou null
 */
export function formatCNAEForDisplay(resolution: CNAEResolution): string | null {
  const { code, description } = resolution.principal;
  
  // ✅ PRIORIDADE 1: Se não tem código E não tem descrição, retornar null
  if (!code && !description) {
    return null;
  }
  
  // ✅ PRIORIDADE 2: FORMATAR CÓDIGO NO PADRÃO OFICIAL IBGE (sempre que existir)
  const formattedCode = formatCNAECodeIBGE(code);
  
  // ✅ CRÍTICO: Se tem código formatado, SEMPRE incluí-lo (mesmo sem descrição)
  const parts: string[] = [];
  if (formattedCode) {
    parts.push(formattedCode);
  }
  if (description) {
    parts.push(description);
  }
  
  // ✅ Se tem código mas não tem descrição, mostrar só o código
  // ✅ Se tem descrição mas não tem código, mostrar só a descrição (com aviso?)
  // ✅ Se tem ambos, mostrar "CÓDIGO - DESCRIÇÃO"
  
  return parts.length > 0 ? parts.join(' - ') : null;
}
