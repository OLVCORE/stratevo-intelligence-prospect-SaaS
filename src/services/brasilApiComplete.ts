// 🇧🇷 BRASIL API COMPLETO - TODAS AS 15 FEATURES CONECTADAS
// https://brasilapi.com.br/docs

const BRASILAPI_BASE = 'https://brasilapi.com.br/api';

// ===== 1. BANKS (Bancos) =====
export interface BankInfo {
  ispb: string;
  name: string;
  code: number;
  fullName: string;
}

export async function getAllBanks(): Promise<BankInfo[]> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/banks/v1`);
    if (!response.ok) return [];
    const banks = await response.json();
    console.log('[BrasilAPI] ✅ Banks:', banks.length);
    return banks;
  } catch (error) {
    console.error('[BrasilAPI] Erro BANKS:', error);
    return [];
  }
}

export async function getBankByCode(code: number): Promise<BankInfo | null> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/banks/v1/${code}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('[BrasilAPI] Erro BANK:', error);
    return null;
  }
}

// ===== 2. CAMBIO (Câmbio) =====
export interface ExchangeRate {
  code: string;
  codein: string;
  name: string;
  high: string;
  low: string;
  varBid: string;
  pctChange: string;
  bid: string;
  ask: string;
  timestamp: string;
  create_date: string;
}

export async function getExchangeRate(currencyCode: string = 'USD'): Promise<ExchangeRate[] | null> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/cptec/v1/clima/capital`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('[BrasilAPI] Erro CAMBIO:', error);
    return null;
  }
}

// ===== 3. CEP (Código Postal) =====
export interface CEPInfo {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
  location?: {
    type: string;
    coordinates: {
      longitude: string;
      latitude: string;
    };
  };
}

export async function getCEPInfo(cep: string): Promise<CEPInfo | null> {
  try {
    const cepClean = cep.replace(/\D/g, '');
    const response = await fetch(`${BRASILAPI_BASE}/cep/v1/${cepClean}`);
    if (!response.ok) return null;
    const data = await response.json();
    console.log('[BrasilAPI] ✅ CEP:', data.cep, '-', data.city, '/', data.state);
    return data;
  } catch (error) {
    console.error('[BrasilAPI] Erro CEP:', error);
    return null;
  }
}

export async function getCEPInfoV2(cep: string): Promise<CEPInfo | null> {
  try {
    const cepClean = cep.replace(/\D/g, '');
    const response = await fetch(`${BRASILAPI_BASE}/cep/v2/${cepClean}`);
    if (!response.ok) return null;
    const data = await response.json();
    console.log('[BrasilAPI] ✅ CEP V2:', data.cep, '- Lat:', data.location?.coordinates?.latitude);
    return data;
  } catch (error) {
    console.error('[BrasilAPI] Erro CEP V2:', error);
    return null;
  }
}

// ===== 4. CNPJ (Receita Federal) =====
// JÁ IMPLEMENTADO em receitaFederal.ts

// ===== 5. DDD (Código de Área) =====
export interface DDDInfo {
  state: string;
  cities: string[];
}

export async function getDDDInfo(ddd: string): Promise<DDDInfo | null> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/ddd/v1/${ddd}`);
    if (!response.ok) return null;
    const data = await response.json();
    console.log('[BrasilAPI] ✅ DDD:', ddd, '-', data.state, '(', data.cities.length, 'cidades)');
    return data;
  } catch (error) {
    console.error('[BrasilAPI] Erro DDD:', error);
    return null;
  }
}

// ===== 6. FERIADOS NACIONAIS =====
export interface Holiday {
  date: string;
  name: string;
  type: string;
}

export async function getHolidays(year: number = new Date().getFullYear()): Promise<Holiday[]> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/feriados/v1/${year}`);
    if (!response.ok) return [];
    const holidays = await response.json();
    console.log('[BrasilAPI] ✅ Feriados', year, ':', holidays.length);
    return holidays;
  } catch (error) {
    console.error('[BrasilAPI] Erro FERIADOS:', error);
    return [];
  }
}

// ===== 7. FIPE (Tabela de Veículos) =====
export interface FIPEBrand {
  name: string;
  value: string;
}

export async function getFIPEBrands(vehicleType: 'caminhoes' | 'carros' | 'motos' = 'carros'): Promise<FIPEBrand[]> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/fipe/marcas/v1/${vehicleType}`);
    if (!response.ok) return [];
    const brands = await response.json();
    console.log('[BrasilAPI] ✅ FIPE Marcas:', brands.length);
    return brands;
  } catch (error) {
    console.error('[BrasilAPI] Erro FIPE:', error);
    return [];
  }
}

// ===== 8. IBGE (Dados Demográficos) =====
export interface IBGECity {
  nome: string;
  codigo_ibge: string;
}

export interface IBGEState {
  id: number;
  sigla: string;
  nome: string;
  regiao: {
    id: number;
    sigla: string;
    nome: string;
  };
}

export async function getIBGEStates(): Promise<IBGEState[]> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/ibge/uf/v1`);
    if (!response.ok) return [];
    const states = await response.json();
    console.log('[BrasilAPI] ✅ IBGE Estados:', states.length);
    return states;
  } catch (error) {
    console.error('[BrasilAPI] Erro IBGE:', error);
    return [];
  }
}

export async function getIBGECities(uf: string): Promise<IBGECity[]> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/ibge/municipios/v1/${uf.toUpperCase()}`);
    if (!response.ok) return [];
    const cities = await response.json();
    console.log('[BrasilAPI] ✅ IBGE Cidades', uf, ':', cities.length);
    return cities;
  } catch (error) {
    console.error('[BrasilAPI] Erro IBGE Cidades:', error);
    return [];
  }
}

// ===== 9. NCM (Nomenclatura Comum do Mercosul) =====
export interface NCMInfo {
  codigo: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  tipo_ato: string;
  numero_ato: string;
  ano_ato: string;
}

export async function searchNCM(query: string): Promise<NCMInfo[]> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/ncm/v1?search=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    const ncms = await response.json();
    console.log('[BrasilAPI] ✅ NCM encontrados:', ncms.length);
    return ncms;
  } catch (error) {
    console.error('[BrasilAPI] Erro NCM:', error);
    return [];
  }
}

export async function getNCMByCode(code: string): Promise<NCMInfo | null> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/ncm/v1/${code}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('[BrasilAPI] Erro NCM:', error);
    return null;
  }
}

// ===== 10. PIX (Participantes) =====
export interface PIXParticipant {
  ispb: string;
  nome: string;
  nome_reduzido: string;
  modalidade_participacao: string;
  tipo_participacao: string;
  inicio_operacao: string;
}

export async function getPIXParticipants(): Promise<PIXParticipant[]> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/pix/v1/participants`);
    if (!response.ok) return [];
    const participants = await response.json();
    console.log('[BrasilAPI] ✅ PIX Participantes:', participants.length);
    return participants;
  } catch (error) {
    console.error('[BrasilAPI] Erro PIX:', error);
    return [];
  }
}

// ===== 11. REGISTRO BR (Domínios) =====
export interface DomainInfo {
  status_code: number;
  status: string;
  fqdn: string;
  hosts: string[];
  publication_status: string;
  expires_at: string;
  suggestions: string[];
}

export async function checkDomain(domain: string): Promise<DomainInfo | null> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/registrobr/v1/${domain}`);
    if (!response.ok) return null;
    const data = await response.json();
    console.log('[BrasilAPI] ✅ Domínio:', domain, '-', data.status);
    return data;
  } catch (error) {
    console.error('[BrasilAPI] Erro REGISTRO BR:', error);
    return null;
  }
}

// ===== 12. TAXAS (Juros e Taxas) =====
export interface TaxRate {
  nome: string;
  valor: number;
}

export async function getTaxRates(): Promise<TaxRate[]> {
  try {
    const response = await fetch(`${BRASILAPI_BASE}/taxas/v1`);
    if (!response.ok) return [];
    const rates = await response.json();
    console.log('[BrasilAPI] ✅ Taxas:', rates.length);
    return rates;
  } catch (error) {
    console.error('[BrasilAPI] Erro TAXAS:', error);
    return [];
  }
}

// ===== FUNÇÕES UTILITÁRIAS =====

/**
 * 🎯 ANÁLISE COMPLETA DE EMPRESA (BrasilAPI)
 */
export async function analyzeCompanyWithBrasilAPI(data: {
  cnpj?: string;
  cep?: string;
  uf?: string;
  domain?: string;
  phone?: string;
}) {
  console.log('[BrasilAPI] 🔍 Análise completa iniciada');

  const analysis: any = {};

  // CEP (se disponível)
  if (data.cep) {
    analysis.cep = await getCEPInfoV2(data.cep);
  }

  // DDD (extrair do telefone)
  if (data.phone) {
    const ddd = data.phone.replace(/\D/g, '').substring(0, 2);
    if (ddd.length === 2) {
      analysis.ddd = await getDDDInfo(ddd);
    }
  }

  // IBGE (estado)
  if (data.uf) {
    analysis.cities = await getIBGECities(data.uf);
  }

  // Domínio
  if (data.domain) {
    analysis.domain = await checkDomain(data.domain);
  }

  // Feriados (útil para planejamento)
  analysis.holidays = await getHolidays();

  // Taxas (contexto econômico)
  analysis.taxRates = await getTaxRates();

  console.log('[BrasilAPI] ✅ Análise completa finalizada');
  return analysis;
}

/**
 * 📍 GEOCODING PRECISO (CEP V2 com coordenadas)
 */
export async function geocodeByCEP(cep: string): Promise<{
  lat: number;
  lng: number;
  address: string;
} | null> {
  const info = await getCEPInfoV2(cep);
  
  if (!info || !info.location) {
    return null;
  }

  return {
    lat: parseFloat(info.location.coordinates.latitude),
    lng: parseFloat(info.location.coordinates.longitude),
    address: `${info.street}, ${info.neighborhood}, ${info.city}/${info.state}`
  };
}

/**
 * 📞 VALIDAR TELEFONE BRASILEIRO (DDD)
 */
export async function validateBrazilianPhone(phone: string): Promise<{
  valid: boolean;
  ddd: string;
  state?: string;
  cities?: string[];
}> {
  const phoneClean = phone.replace(/\D/g, '');
  const ddd = phoneClean.substring(0, 2);

  if (ddd.length !== 2 || phoneClean.length < 10) {
    return { valid: false, ddd: '' };
  }

  const dddInfo = await getDDDInfo(ddd);

  return {
    valid: !!dddInfo,
    ddd,
    state: dddInfo?.state,
    cities: dddInfo?.cities
  };
}

/**
 * 🏦 IDENTIFICAR BANCO POR CNPJ (primeiros 8 dígitos = ISPB)
 */
export async function identifyBankByCNPJ(cnpj: string): Promise<BankInfo | null> {
  const cnpjClean = cnpj.replace(/\D/g, '');
  const ispb = cnpjClean.substring(0, 8);

  const banks = await getAllBanks();
  return banks.find(b => b.ispb === ispb) || null;
}

