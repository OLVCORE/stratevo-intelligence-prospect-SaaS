/**
 * 🔧 NORMALIZADOR UNIVERSAL DE DADOS DE EMPRESAS
 * 
 * Este módulo garante que os dados sejam migrados e exibidos corretamente
 * entre todas as etapas do pipeline (Base de Empresas → Quarentena ICP → Leads Aprovados)
 */

export interface NormalizedCompanyData {
  // Identificação
  id: string;
  company_id?: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  
  // Localização
  uf?: string;
  municipio?: string;
  porte?: string;
  
  // Atividade
  segmento?: string;
  setor?: string;
  cnae_principal?: string;
  
  // Contato
  website?: string;
  website_encontrado?: string;
  email?: string;
  telefone?: string;
  linkedin_url?: string;
  
  // Scores e Análises
  icp_score?: number;
  fit_score?: number;
  website_fit_score?: number;
  purchase_intent_score?: number;
  purchase_intent_type?: 'potencial' | 'real';
  
  // Status e Classificações
  status?: string;
  temperatura?: 'hot' | 'warm' | 'cold';
  grade?: string;
  totvs_status?: string;
  
  // Origem
  source_name?: string;
  origem?: string;
  
  // Dados brutos (preservar tudo)
  raw_data?: Record<string, any>;
  raw_analysis?: Record<string, any>;
  
  // Relacionamentos
  icp_id?: string;
  tenant_id?: string;
  
  // Produtos e matches
  website_products_match?: any[];
}

/**
 * Normaliza dados de uma empresa vinda de `companies` para formato padrão
 */
export function normalizeFromCompanies(company: any): NormalizedCompanyData {
  const rawData = (company.raw_data && typeof company.raw_data === 'object' && !Array.isArray(company.raw_data))
    ? company.raw_data as Record<string, any>
    : {};
  
  const receitaData = rawData?.receita_federal || rawData?.receita || {};
  
  // ✅ PRESERVAR TODOS OS DADOS ENRIQUECIDOS (campos diretos + raw_data)
  return {
    id: company.id,
    company_id: company.id,
    cnpj: company.cnpj || '',
    razao_social: company.company_name || company.name || receitaData.razao_social || receitaData.nome || 'N/A',
    nome_fantasia: receitaData.nome_fantasia || receitaData.fantasia || company.nome_fantasia || null,
    uf: (company.location as any)?.state || receitaData.uf || company.uf || null,
    municipio: (company.location as any)?.city || receitaData.municipio || company.municipio || null,
    porte: receitaData.porte || company.porte_estimado || company.porte || null,
    segmento: company.industry || company.segmento || rawData?.setor_amigavel || rawData?.atividade_economica || null,
    setor: company.industry || company.setor || rawData?.setor_amigavel || null,
    cnae_principal: receitaData.cnae_fiscal || receitaData.atividade_principal?.[0]?.code || null,
    // ✅ WEBSITE: Priorizar website_encontrado (do enriquecimento), depois website, depois domain, depois raw_data
    website: company.website_encontrado || company.website || company.domain || rawData?.website || null,
    website_encontrado: company.website_encontrado || company.website || rawData?.website_encontrado || rawData?.website || null,
    email: company.email || receitaData.email || rawData?.email || null,
    telefone: receitaData.ddd_telefone_1 || receitaData.telefone || company.telefone || rawData?.telefone || null,
    linkedin_url: company.linkedin_url || rawData?.linkedin || rawData?.linkedin_url || null,
    icp_score: company.icp_score || (rawData as any)?.icp_score || 0,
    // ✅ FIT SCORE: Priorizar campo direto, depois raw_data
    fit_score: (company as any).fit_score ?? rawData?.fit_score ?? null,
    // ✅ WEBSITE FIT SCORE: Priorizar campo direto, depois raw_data (preservar enriquecimento)
    website_fit_score: company.website_fit_score ?? rawData?.website_fit_score ?? null,
    // ✅ PURCHASE INTENT: Priorizar campos diretos, depois raw_data
    purchase_intent_score: (company as any).purchase_intent_score ?? rawData?.purchase_intent_score ?? 0,
    purchase_intent_type: (company as any).purchase_intent_type || rawData?.purchase_intent_type || 'potencial',
    status: company.status || 'pendente',
    temperatura: company.temperatura || (rawData as any)?.temperatura || 'cold',
    // ✅ GRADE: Priorizar raw_data, depois campo direto
    grade: rawData?.grade || (company as any)?.grade || null,
    totvs_status: (company as any).totvs_status || rawData?.totvs_status || null,
    source_name: company.source_name || rawData?.source_name || null,
    origem: company.origem || 'upload_massa',
    // ✅ PRESERVAR raw_data COMPLETO (inclui todos os enriquecimentos)
    raw_data: rawData,
    raw_analysis: rawData, // Para compatibilidade
    icp_id: rawData?.icp_id || (company as any)?.icp_id || null,
    tenant_id: company.tenant_id || null,
    // ✅ WEBSITE PRODUCTS MATCH: Priorizar campo direto, depois raw_data (preservar enriquecimento)
    website_products_match: company.website_products_match || rawData?.website_products_match || [],
  };
}

/**
 * Normaliza dados de uma empresa vinda de `icp_analysis_results` para formato padrão
 */
export function normalizeFromICPResults(analysis: any): NormalizedCompanyData {
  const rawData = (analysis.raw_data && typeof analysis.raw_data === 'object' && !Array.isArray(analysis.raw_data))
    ? analysis.raw_data as Record<string, any>
    : {};
  
  const rawAnalysis = (analysis.raw_analysis && typeof analysis.raw_analysis === 'object' && !Array.isArray(analysis.raw_analysis))
    ? analysis.raw_analysis as Record<string, any>
    : {};
  
  // Priorizar raw_analysis, depois raw_data, depois campos diretos
  const receitaData = rawAnalysis?.receita_federal || rawData?.receita_federal || rawData?.receita || {};
  
  return {
    id: analysis.id,
    company_id: analysis.company_id || null,
    cnpj: analysis.cnpj || '',
    razao_social: analysis.razao_social || receitaData.razao_social || receitaData.nome || 'N/A',
    nome_fantasia: analysis.nome_fantasia || receitaData.nome_fantasia || receitaData.fantasia || null,
    uf: analysis.uf || receitaData.uf || null,
    municipio: analysis.municipio || receitaData.municipio || null,
    porte: analysis.porte || receitaData.porte || null,
    segmento: analysis.segmento || rawAnalysis?.setor_amigavel || rawData?.setor_amigavel || rawData?.atividade_economica || null,
    setor: analysis.segmento || analysis.setor || rawAnalysis?.setor_amigavel || rawData?.setor_amigavel || null,
    cnae_principal: analysis.cnae_principal || receitaData.cnae_fiscal || receitaData.atividade_principal?.[0]?.code || null,
    website: analysis.website || analysis.website_encontrado || rawAnalysis?.website || rawData?.website || null,
    website_encontrado: analysis.website_encontrado || analysis.website || rawAnalysis?.website_encontrado || rawData?.website_encontrado || null,
    email: analysis.email || receitaData.email || null,
    telefone: analysis.telefone || receitaData.ddd_telefone_1 || receitaData.telefone || null,
    linkedin_url: analysis.linkedin_url || rawAnalysis?.linkedin || rawData?.linkedin || null,
    icp_score: analysis.icp_score || (rawAnalysis as any)?.icp_score || (rawData as any)?.icp_score || 0,
    fit_score: rawAnalysis?.fit_score ?? rawData?.fit_score ?? analysis.fit_score ?? null,
    // ✅ WEBSITE FIT SCORE: Priorizar campo direto, depois raw_analysis, depois raw_data (preservar enriquecimento)
    website_fit_score: analysis.website_fit_score ?? rawAnalysis?.website_fit_score ?? rawData?.website_fit_score ?? null,
    // ✅ PURCHASE INTENT: Priorizar campos diretos, depois raw_analysis, depois raw_data
    purchase_intent_score: analysis.purchase_intent_score ?? rawAnalysis?.purchase_intent_score ?? rawData?.purchase_intent_score ?? 0,
    purchase_intent_type: analysis.purchase_intent_type || rawAnalysis?.purchase_intent_type || rawData?.purchase_intent_type || 'potencial',
    status: analysis.status || 'pendente',
    temperatura: analysis.temperatura || (rawAnalysis as any)?.temperatura || 'cold',
    grade: rawAnalysis?.grade || rawData?.grade || analysis.grade || null,
    totvs_status: analysis.totvs_status || null,
    source_name: analysis.source_name || rawAnalysis?.source_name || null,
    origem: analysis.origem || 'upload_massa',
    raw_data: { ...rawData, ...rawAnalysis }, // Merge dos dois
    raw_analysis: rawAnalysis,
    icp_id: rawAnalysis?.icp_id || rawData?.icp_id || analysis.icp_id || null,
    tenant_id: analysis.tenant_id || null,
    // ✅ WEBSITE PRODUCTS MATCH: Priorizar campo direto, depois raw_analysis, depois raw_data (preservar enriquecimento)
    website_products_match: analysis.website_products_match || rawAnalysis?.website_products_match || rawData?.website_products_match || [],
  };
}

/**
 * Normaliza dados de uma empresa vinda de `qualified_prospects` para formato padrão
 */
export function normalizeFromQualifiedProspects(prospect: any): NormalizedCompanyData {
  const enrichmentData = (prospect.enrichment_data && typeof prospect.enrichment_data === 'object' && !Array.isArray(prospect.enrichment_data))
    ? prospect.enrichment_data as Record<string, any>
    : {};
  
  const aiAnalysis = (prospect.ai_analysis && typeof prospect.ai_analysis === 'object' && !Array.isArray(prospect.ai_analysis))
    ? prospect.ai_analysis as Record<string, any>
    : {};
  
  // ✅ PRESERVAR TODOS OS DADOS (campos diretos + enrichment_data + ai_analysis)
  // ✅ GARANTIR QUE TODOS OS CAMPOS SOLICITADOS ESTEJAM PRESENTES:
  // - Empresa (razao_social)
  // - CNPJ
  // - Origem
  // - Status CNPJ (situacao_cnpj)
  // - Setor
  // - UF (estado)
  // - Score ICP (icp_score)
  // - Status Análise (pipeline_status)
  // - Status Verificação (situacao_cnpj)
  // - ICP (icp_id)
  // - Fit Score
  // - Grade
  return {
    id: prospect.id,
    company_id: prospect.company_id || null,
    cnpj: prospect.cnpj || '',
    razao_social: prospect.razao_social || enrichmentData?.razao_social || 'N/A',
    nome_fantasia: prospect.nome_fantasia || enrichmentData?.nome_fantasia || null,
    // ✅ UF: Priorizar estado, depois enrichment_data
    uf: prospect.estado || enrichmentData?.uf || enrichmentData?.estado || null,
    municipio: prospect.cidade || enrichmentData?.cidade || enrichmentData?.municipio || null,
    porte: prospect.porte || enrichmentData?.porte || null,
    // ✅ SETOR: Priorizar setor, depois enrichment_data
    segmento: prospect.setor || enrichmentData?.setor || enrichmentData?.segmento || null,
    setor: prospect.setor || enrichmentData?.setor || null,
    cnae_principal: prospect.cnae_principal || enrichmentData?.cnae_principal || null,
    // ✅ WEBSITE: Priorizar campo direto, depois enrichment_data
    website: prospect.website || enrichmentData?.website || null,
    website_encontrado: prospect.website_encontrado || prospect.website || enrichmentData?.website_encontrado || enrichmentData?.website || null,
    email: enrichmentData?.email || null,
    telefone: enrichmentData?.telefone || enrichmentData?.telefone_1 || null,
    linkedin_url: enrichmentData?.linkedin_url || enrichmentData?.linkedin || null,
    // ✅ SCORE ICP: Priorizar enrichment_data, depois ai_analysis
    icp_score: enrichmentData?.icp_score || aiAnalysis?.icp_score || prospect.icp_score || 0,
    // ✅ FIT SCORE: Priorizar campo direto, depois enrichment_data
    fit_score: prospect.fit_score ?? enrichmentData?.fit_score ?? null,
    website_fit_score: prospect.website_fit_score ?? enrichmentData?.website_fit_score ?? null,
    purchase_intent_score: prospect.purchase_intent_score ?? enrichmentData?.purchase_intent_score ?? 0,
    purchase_intent_type: prospect.purchase_intent_type || enrichmentData?.purchase_intent_type || 'potencial',
    // ✅ STATUS ANÁLISE: Priorizar pipeline_status, depois enrichment_data
    status: prospect.pipeline_status === 'new' ? 'pendente' : prospect.pipeline_status || 'pendente',
    // ✅ STATUS CNPJ (Status Verificação): Priorizar situacao_cnpj
    // Nota: situacao_cnpj será preservado em raw_analysis
    temperatura: enrichmentData?.temperatura || aiAnalysis?.temperatura || 'cold',
    // ✅ GRADE: Priorizar campo direto, depois enrichment_data
    grade: prospect.grade || enrichmentData?.grade || null,
    totvs_status: enrichmentData?.totvs_status || null,
    // ✅ ORIGEM: Priorizar enrichment_data, depois default
    source_name: enrichmentData?.source_name || enrichmentData?.job_name || null,
    origem: enrichmentData?.origem || 'qualification_engine',
    // ✅ PRESERVAR enrichment_data e ai_analysis COMPLETOS (inclui TODOS os campos solicitados)
    raw_data: {
      ...enrichmentData,
      // ✅ PRESERVAR CAMPOS ESPECÍFICOS SOLICITADOS
      situacao_cnpj: prospect.situacao_cnpj || enrichmentData?.situacao_cnpj || null, // Status CNPJ / Status Verificação
      setor: prospect.setor || enrichmentData?.setor || null, // Setor
      estado: prospect.estado || enrichmentData?.estado || enrichmentData?.uf || null, // UF
      icp_score: enrichmentData?.icp_score || aiAnalysis?.icp_score || prospect.icp_score || 0, // Score ICP
      pipeline_status: prospect.pipeline_status || 'new', // Status Análise
      icp_id: prospect.icp_id || null, // ICP
      fit_score: prospect.fit_score || null, // Fit Score
      grade: prospect.grade || null, // Grade
      origem: enrichmentData?.origem || 'qualification_engine', // Origem
    },
    raw_analysis: {
      ...enrichmentData,
      ...aiAnalysis,
      job_id: prospect.job_id,
      icp_id: prospect.icp_id, // ✅ ICP
      fit_score: prospect.fit_score, // ✅ Fit Score
      grade: prospect.grade, // ✅ Grade
      situacao_cnpj: prospect.situacao_cnpj, // ✅ Status CNPJ / Status Verificação
      setor: prospect.setor, // ✅ Setor
      estado: prospect.estado, // ✅ UF
      icp_score: enrichmentData?.icp_score || aiAnalysis?.icp_score || prospect.icp_score || 0, // ✅ Score ICP
      pipeline_status: prospect.pipeline_status, // ✅ Status Análise
      origem: enrichmentData?.origem || 'qualification_engine', // ✅ Origem
      capital_social: prospect.capital_social,
      data_abertura: prospect.data_abertura,
      produtos: prospect.produtos,
      produtos_count: prospect.produtos_count,
      fit_reasons: prospect.fit_reasons,
      compatible_products: prospect.compatible_products,
      risk_flags: prospect.risk_flags,
    },
    icp_id: prospect.icp_id || null, // ✅ ICP
    tenant_id: prospect.tenant_id || null,
    // ✅ WEBSITE PRODUCTS MATCH: Priorizar campo direto, depois enrichment_data
    website_products_match: prospect.website_products_match || enrichmentData?.website_products_match || prospect.compatible_products || [],
  };
}

/**
 * Normaliza dados brutos de APIs externas (API Brasil, ReceitaWS, EmpresasAqui) para formato padrão
 * Usado principalmente no DealFormDialog para enriquecimento de empresas
 */
export function normalizeCompanyData(rawData: any, source: 'api_brasil' | 'receitaws' | 'empresas_aqui'): {
  company_name: string;
  cnpj: string;
  industry?: string;
  location?: {
    city?: string;
    state?: string;
    address?: string;
    cep?: string;
  };
} {
  if (source === 'api_brasil') {
    // API Brasil retorna: razao_social, cnpj, descricao_situacao_cadastral, descricao_tipo_logradouro, logradouro, numero, bairro, municipio, uf, cep, descricao_atividade_principal
    return {
      company_name: rawData.razao_social || rawData.nome || 'N/A',
      cnpj: rawData.cnpj || '',
      industry: rawData.descricao_atividade_principal?.[0]?.descricao || rawData.atividade_principal?.[0]?.text || null,
      location: {
        city: rawData.municipio || null,
        state: rawData.uf || null,
        address: [
          rawData.descricao_tipo_logradouro,
          rawData.logradouro,
          rawData.numero,
          rawData.bairro
        ].filter(Boolean).join(', ') || null,
        cep: rawData.cep || null,
      },
    };
  } else if (source === 'receitaws') {
    // ReceitaWS retorna: nome, fantasia, cnpj, atividade_principal, logradouro, numero, bairro, municipio, uf, cep
    return {
      company_name: rawData.nome || rawData.fantasia || 'N/A',
      cnpj: rawData.cnpj || '',
      industry: rawData.atividade_principal?.[0]?.text || null,
      location: {
        city: rawData.municipio || null,
        state: rawData.uf || null,
        address: [
          rawData.logradouro,
          rawData.numero,
          rawData.bairro
        ].filter(Boolean).join(', ') || null,
        cep: rawData.cep || null,
      },
    };
  } else if (source === 'empresas_aqui') {
    // EmpresasAqui - formato pode variar, tentar campos comuns
    return {
      company_name: rawData.razao_social || rawData.nome || rawData.fantasia || 'N/A',
      cnpj: rawData.cnpj || '',
      industry: rawData.atividade_principal?.[0]?.text || rawData.descricao_atividade_principal || null,
      location: {
        city: rawData.municipio || rawData.cidade || null,
        state: rawData.uf || rawData.estado || null,
        address: [
          rawData.logradouro,
          rawData.numero,
          rawData.bairro
        ].filter(Boolean).join(', ') || null,
        cep: rawData.cep || null,
      },
    };
  }
  
  // Fallback genérico
  return {
    company_name: rawData.razao_social || rawData.nome || rawData.fantasia || 'N/A',
    cnpj: rawData.cnpj || '',
    industry: rawData.atividade_principal?.[0]?.text || rawData.industry || null,
    location: {
      city: rawData.municipio || rawData.cidade || null,
      state: rawData.uf || rawData.estado || null,
      address: rawData.logradouro || rawData.address || null,
      cep: rawData.cep || null,
    },
  };
}

/**
 * Prepara dados para inserção em `icp_analysis_results` a partir de dados normalizados
 */
export function prepareForICPInsertion(normalized: NormalizedCompanyData, tenantId: string): any {
  return {
    company_id: normalized.company_id,
    tenant_id: tenantId,
    cnpj: normalized.cnpj,
    razao_social: normalized.razao_social,
    nome_fantasia: normalized.nome_fantasia,
    uf: normalized.uf,
    municipio: normalized.municipio,
    porte: normalized.porte,
    cnae_principal: normalized.cnae_principal,
    website: normalized.website || normalized.website_encontrado,
    email: normalized.email,
    telefone: normalized.telefone,
    website_encontrado: normalized.website_encontrado,
    website_fit_score: normalized.website_fit_score,
    website_products_match: normalized.website_products_match,
    linkedin_url: normalized.linkedin_url,
    icp_score: normalized.icp_score,
    fit_score: normalized.fit_score,
    purchase_intent_score: normalized.purchase_intent_score,
    purchase_intent_type: normalized.purchase_intent_type,
    status: normalized.status || 'pendente',
    temperatura: normalized.temperatura,
    totvs_status: normalized.totvs_status,
    // ✅ ORIGEM: Priorizar job_name (nome do arquivo), depois source_file_name, depois origem normalizada
    // ✅ CORRIGIDO: Usar job_name para mostrar nome do arquivo na coluna origem (igual Estoque Qualificado)
    origem: (() => {
      const rawData = normalized.raw_data as any || {};
      // Prioridade: job_name > source_file_name > origem > source_name > default
      const origemFinal = rawData.job_name || 
                         rawData.source_file_name || 
                         normalized.origem || 
                         normalized.source_name || 
                         rawData.origem || 
                         rawData.source_name || 
                         'upload_massa';
      return origemFinal;
    })(),
    raw_data: normalized.raw_data || {},
    raw_analysis: {
      ...normalized.raw_analysis,
      icp_id: normalized.icp_id,
      fit_score: normalized.fit_score,
      grade: normalized.grade,
      source_name: normalized.source_name,
      source_type: 'manual',
      migrated_from_companies: true,
      migrated_at: new Date().toISOString(),
    },
  };
}
