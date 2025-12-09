/**
 * MC9 V2.1: Serviço de Normalização de CSV de Prospecção
 * 
 * Converte linhas brutas de CSV em objetos NormalizedProspect
 * com validação e normalização de dados
 */

import type {
  RawProspectRow,
  NormalizedProspect,
  ProspectSource,
  ColumnMapping,
} from '@/types/prospecting';

/**
 * Normaliza CNPJ: remove tudo que não é número, valida tamanho
 */
function normalizeCNPJ(cnpj: string | null | undefined): string | null {
  if (!cnpj) return null;
  
  const cleaned = cnpj.replace(/\D/g, '');
  
  // CNPJ deve ter 14 dígitos
  if (cleaned.length === 14) {
    return cleaned;
  }
  
  // Se não tiver 14 dígitos, retorna limpo mas não validado
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Normaliza website: adiciona https:// se necessário, remove espaços
 */
function normalizeWebsite(website: string | null | undefined): string | null {
  if (!website) return null;
  
  let cleaned = website.trim();
  if (!cleaned) return null;
  
  // Remove espaços
  cleaned = cleaned.replace(/\s+/g, '');
  
  // Se não começar com http, adiciona https://
  if (!cleaned.match(/^https?:\/\//i)) {
    cleaned = `https://${cleaned}`;
  }
  
  // Extrair domínio base (remover paths)
  try {
    const url = new URL(cleaned);
    return `${url.protocol}//${url.hostname}`;
  } catch {
    // Se não conseguir fazer parse, retorna como está
    return cleaned;
  }
}

/**
 * Normaliza UF: converte nomes por extenso para siglas
 */
function normalizeUF(uf: string | null | undefined): string | null {
  if (!uf) return null;
  
  const cleaned = uf.trim().toUpperCase();
  if (!cleaned) return null;
  
  // Se já for sigla (2 caracteres), retorna
  if (cleaned.length === 2) {
    return cleaned;
  }
  
  // Mapeamento de estados por extenso para siglas
  const stateMap: Record<string, string> = {
    'ACRE': 'AC',
    'ALAGOAS': 'AL',
    'AMAPA': 'AP',
    'AMAZONAS': 'AM',
    'BAHIA': 'BA',
    'CEARA': 'CE',
    'DISTRITO FEDERAL': 'DF',
    'ESPIRITO SANTO': 'ES',
    'GOIAS': 'GO',
    'MARANHAO': 'MA',
    'MATO GROSSO': 'MT',
    'MATO GROSSO DO SUL': 'MS',
    'MINAS GERAIS': 'MG',
    'PARA': 'PA',
    'PARAIBA': 'PB',
    'PARANA': 'PR',
    'PERNAMBUCO': 'PE',
    'PIAUI': 'PI',
    'RIO DE JANEIRO': 'RJ',
    'RIO GRANDE DO NORTE': 'RN',
    'RIO GRANDE DO SUL': 'RS',
    'RONDONIA': 'RO',
    'RORAIMA': 'RR',
    'SANTA CATARINA': 'SC',
    'SAO PAULO': 'SP',
    'SERGIPE': 'SE',
    'TOCANTINS': 'TO',
  };
  
  return stateMap[cleaned] || cleaned;
}

/**
 * Normaliza email: lowercase, trim
 */
function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  
  const cleaned = email.trim().toLowerCase();
  if (!cleaned) return null;
  
  // Validação básica de email
  if (cleaned.includes('@') && cleaned.includes('.')) {
    return cleaned;
  }
  
  return null;
}

/**
 * Normaliza telefone: remove caracteres não numéricos
 */
function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Normaliza uma linha bruta do CSV para NormalizedProspect
 */
export function normalizeProspectRow(
  row: RawProspectRow,
  source: ProspectSource,
  icpId: string,
  sourceBatchId: string,
  columnMapping: Record<string, string> // { normalizedField: csvColumn }
): NormalizedProspect {
  // Função auxiliar para extrair valor do CSV
  const getValue = (field: string): string | null => {
    const csvColumn = columnMapping[field];
    if (!csvColumn) return null;
    
    const value = row[csvColumn];
    return value ? String(value).trim() : null;
  };
  
  // Extrair companyName (obrigatório)
  const companyName = getValue('companyName') || 
                      getValue('razao_social') || 
                      getValue('nome_fantasia') || 
                      getValue('nome_da_empresa') ||
                      Object.values(row).find(v => v && String(v).trim().length > 0)?.toString() || 
                      'Empresa sem nome';
  
  // Normalizar campos
  const cnpj = normalizeCNPJ(getValue('cnpj'));
  const website = normalizeWebsite(getValue('website') || getValue('site'));
  const sector = getValue('sector') || getValue('setor');
  const uf = normalizeUF(getValue('uf') || getValue('estado'));
  const city = getValue('city') || getValue('cidade') || getValue('municipio');
  const country = getValue('country') || getValue('pais') || 'Brasil';
  
  // Dados de contato
  const contactName = getValue('contactName') || getValue('contato_nome') || getValue('decisor_1_nome');
  const contactRole = getValue('contactRole') || getValue('contato_cargo') || getValue('decisor_1_cargo');
  const contactEmail = normalizeEmail(getValue('contactEmail') || getValue('contato_email') || getValue('decisor_1_email'));
  const contactPhone = normalizePhone(getValue('contactPhone') || getValue('contato_telefone') || getValue('decisor_1_telefone'));
  const linkedinUrl = getValue('linkedinUrl') || getValue('linkedin') || getValue('decisor_1_linkedin');
  
  // Notas
  const notes = getValue('notes') || getValue('observacoes') || getValue('notas');
  
  return {
    source,
    sourceBatchId,
    icpId,
    companyName,
    cnpj,
    website,
    sector,
    uf,
    city,
    country,
    contactName,
    contactRole,
    contactEmail,
    contactPhone,
    linkedinUrl,
    notes,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Normaliza múltiplas linhas do CSV
 */
export function normalizeCsvRows(
  rows: RawProspectRow[],
  source: ProspectSource,
  icpId: string,
  sourceBatchId: string,
  columnMapping: Record<string, string>
): NormalizedProspect[] {
  return rows
    .filter(row => {
      // Filtrar linhas vazias
      const hasData = Object.values(row).some(v => v && String(v).trim().length > 0);
      return hasData;
    })
    .map(row => normalizeProspectRow(row, source, icpId, sourceBatchId, columnMapping))
    .filter(prospect => {
      // Filtrar prospects sem nome de empresa
      return prospect.companyName && prospect.companyName.trim().length > 0;
    });
}

/**
 * Gera mapeamento automático para Empresas Aqui
 */
export function generateEmpresasAquiMapping(csvHeaders: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  // Mapeamento conhecido de Empresas Aqui
  const knownMappings: Record<string, string> = {
    'Razão Social': 'companyName',
    'CNPJ': 'cnpj',
    'Site': 'website',
    'UF': 'uf',
    'Município': 'city',
    'Setor': 'sector',
    'Contato': 'contactName',
    'Cargo': 'contactRole',
    'Email': 'contactEmail',
    'Telefone': 'contactPhone',
    'LinkedIn': 'linkedinUrl',
  };
  
  csvHeaders.forEach(header => {
    const normalizedHeader = header.trim();
    if (knownMappings[normalizedHeader]) {
      mapping[knownMappings[normalizedHeader]] = normalizedHeader;
    }
  });
  
  return mapping;
}

