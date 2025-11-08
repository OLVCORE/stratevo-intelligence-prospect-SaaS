/**
 * ============================================================================
 * NORMALIZADOR UNIVERSAL DE DADOS DE EMPRESAS
 * ============================================================================
 * 
 * Recebe dados de QUALQUER fonte e normaliza para o schema do Supabase
 * 
 * FONTES SUPORTADAS:
 * - CSV Upload (campos customizados)
 * - API Brasil (brasilapi.com.br)
 * - ReceitaWS (receitaws.com.br)
 * - EmpresasAqui (empresasaqui.com.br)
 * - Entrada manual
 * 
 * SCHEMA SUPABASE (destino):
 * - company_name (TEXT)
 * - cnpj (TEXT)
 * - industry (TEXT)
 * - employees (INTEGER)
 * - revenue (NUMERIC)
 * - lead_score (NUMERIC)
 * - location (JSONB)
 * - raw_data (JSONB)
 * ============================================================================
 */

export interface NormalizedCompanyData {
  company_name: string;
  cnpj: string;
  industry?: string | null;
  employees?: number | null;
  revenue?: number | null;
  lead_score?: number | null;
  location?: {
    city?: string;
    state?: string;
    country?: string;
    address?: string;
    cep?: string;
  } | null;
  raw_data?: any;
}

export type DataSource = 'api_brasil' | 'receitaws' | 'empresas_aqui' | 'csv' | 'manual';

/**
 * Normaliza dados de API Brasil
 */
function normalizeApiBrasil(data: any): NormalizedCompanyData {
  return {
    company_name: data.razao_social || data.nome_fantasia || 'Empresa sem nome',
    cnpj: data.cnpj,
    industry: data.cnae_fiscal_descricao || null,
    employees: data.qsa?.length || null, // Quantidade de sócios como proxy
    revenue: null, // API Brasil não fornece
    lead_score: null,
    location: {
      city: data.municipio,
      state: data.uf,
      country: 'Brasil',
      address: [
        data.logradouro,
        data.numero,
        data.complemento,
        data.bairro
      ].filter(Boolean).join(', '),
      cep: data.cep
    },
    raw_data: {
      source: 'api_brasil',
      timestamp: new Date().toISOString(),
      original: data
    }
  };
}

/**
 * Normaliza dados de ReceitaWS
 */
function normalizeReceitaWS(data: any): NormalizedCompanyData {
  return {
    company_name: data.nome || data.fantasia || 'Empresa sem nome',
    cnpj: data.cnpj,
    industry: data.atividade_principal?.[0]?.text || null,
    employees: null, // ReceitaWS não fornece
    revenue: null,
    lead_score: null,
    location: {
      city: data.municipio,
      state: data.uf,
      country: 'Brasil',
      address: [
        data.logradouro,
        data.numero,
        data.complemento,
        data.bairro
      ].filter(Boolean).join(', '),
      cep: data.cep
    },
    raw_data: {
      source: 'receitaws',
      timestamp: new Date().toISOString(),
      original: data
    }
  };
}

/**
 * Normaliza dados de EmpresasAqui
 */
function normalizeEmpresasAqui(data: any): NormalizedCompanyData {
  return {
    company_name: data.razao_social || data.nome_fantasia || 'Empresa sem nome',
    cnpj: data.cnpj,
    industry: data.atividade_principal || null,
    employees: data.numero_funcionarios || null,
    revenue: data.faturamento || null,
    lead_score: null,
    location: {
      city: data.municipio,
      state: data.uf,
      country: 'Brasil',
      address: [
        data.logradouro,
        data.numero,
        data.complemento,
        data.bairro
      ].filter(Boolean).join(', '),
      cep: data.cep
    },
    raw_data: {
      source: 'empresas_aqui',
      timestamp: new Date().toISOString(),
      original: data
    }
  };
}

/**
 * Normaliza dados de CSV (mapeamento flexível)
 */
function normalizeCSV(data: any, mapping?: Record<string, string>): NormalizedCompanyData {
  // Se há mapeamento, usa ele; senão, tenta inferir
  const getName = () => {
    if (mapping?.company_name) return data[mapping.company_name];
    return data.razao_social || data.nome || data.company_name || data.empresa || 'Empresa sem nome';
  };

  const getCnpj = () => {
    if (mapping?.cnpj) return data[mapping.cnpj];
    return data.cnpj || data.CNPJ || null;
  };

  const getIndustry = () => {
    if (mapping?.industry) return data[mapping.industry];
    return data.setor || data.segmento || data.industry || data.ramo || null;
  };

  const getEmployees = () => {
    if (mapping?.employees) {
      const val = data[mapping.employees];
      return val ? parseInt(val, 10) : null;
    }
    const val = data.funcionarios || data.employees || data.num_funcionarios;
    return val ? parseInt(val, 10) : null;
  };

  return {
    company_name: getName(),
    cnpj: getCnpj(),
    industry: getIndustry(),
    employees: getEmployees(),
    revenue: null,
    lead_score: null,
    location: null,
    raw_data: {
      source: 'csv',
      timestamp: new Date().toISOString(),
      original: data,
      mapping: mapping
    }
  };
}

/**
 * Normaliza dados de entrada manual
 */
function normalizeManual(data: any): NormalizedCompanyData {
  return {
    company_name: data.company_name || data.nome || 'Empresa sem nome',
    cnpj: data.cnpj || null,
    industry: data.industry || data.setor || null,
    employees: data.employees ? parseInt(data.employees, 10) : null,
    revenue: data.revenue ? parseFloat(data.revenue) : null,
    lead_score: data.lead_score ? parseFloat(data.lead_score) : null,
    location: data.location || null,
    raw_data: {
      source: 'manual',
      timestamp: new Date().toISOString(),
      original: data
    }
  };
}

/**
 * ============================================================================
 * FUNÇÃO PRINCIPAL: normalizeCompanyData
 * ============================================================================
 * 
 * Detecta automaticamente a fonte e normaliza os dados
 */
export function normalizeCompanyData(
  data: any,
  source: DataSource,
  mapping?: Record<string, string>
): NormalizedCompanyData {
  console.log(`📊 Normalizando dados de: ${source}`);

  try {
    let normalized: NormalizedCompanyData;

    switch (source) {
      case 'api_brasil':
        normalized = normalizeApiBrasil(data);
        break;
      case 'receitaws':
        normalized = normalizeReceitaWS(data);
        break;
      case 'empresas_aqui':
        normalized = normalizeEmpresasAqui(data);
        break;
      case 'csv':
        normalized = normalizeCSV(data, mapping);
        break;
      case 'manual':
        normalized = normalizeManual(data);
        break;
      default:
        console.warn('⚠️ Fonte desconhecida, usando normalização manual');
        normalized = normalizeManual(data);
    }

    console.log('✅ Dados normalizados:', normalized.company_name);
    return normalized;
  } catch (error: any) {
    console.error('❌ Erro ao normalizar dados:', error);
    // Fallback: retorna dados mínimos
    return {
      company_name: data.company_name || data.nome || data.razao_social || 'Empresa',
      cnpj: data.cnpj || null,
      raw_data: {
        source,
        error: error.message,
        original: data
      }
    };
  }
}

/**
 * ============================================================================
 * FUNÇÃO AUXILIAR: detectDataSource
 * ============================================================================
 * 
 * Tenta detectar automaticamente a fonte dos dados
 */
export function detectDataSource(data: any): DataSource {
  // API Brasil: tem 'razao_social' e 'cnae_fiscal_descricao'
  if (data.razao_social && data.cnae_fiscal_descricao) {
    return 'api_brasil';
  }

  // ReceitaWS: tem 'atividade_principal' como array
  if (data.atividade_principal && Array.isArray(data.atividade_principal)) {
    return 'receitaws';
  }

  // EmpresasAqui: tem 'numero_funcionarios'
  if (data.numero_funcionarios) {
    return 'empresas_aqui';
  }

  // CSV/Manual: qualquer outro
  return 'manual';
}

