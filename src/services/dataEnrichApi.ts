/**
 * API Gateway olv-dataenrich - Enriquecimento de decisores (Apollo, LinkedIn, Lusha).
 * Base URL: https://trsybhuzfmxidieyfpzo.supabase.co/functions/v1/api-gateway
 */

const API_BASE = 'https://trsybhuzfmxidieyfpzo.supabase.co/functions/v1/api-gateway';

function getApiKey(): string {
  return import.meta.env.VITE_DATAENRICH_API_KEY ?? import.meta.env.VITE_STRATEVO_API_KEY ?? '';
}

export interface EnrichSingleInput {
  name: string;
  domain?: string;
  cnpj?: string;
  trade_name?: string;
  city?: string;
  state?: string;
  country?: string;
  industry?: string;
  company_id?: string;
}

/** Payload por empresa para enrich-batch (sync Motor de Qualificação → Data Enrich) */
export interface EnrichBatchCompany {
  name: string;
  domain?: string;
  cnpj?: string;
  trade_name?: string;
  city?: string;
  state?: string;
  country?: string;
  industry?: string;
}

export interface EnrichBatchResponse {
  success: boolean;
  message?: string;
  results?: Array<{ company_id?: string; success?: boolean; error?: string }>;
  total_sent?: number;
}

export interface EnrichSingleResponse {
  success: boolean;
  company_id?: string;
  enrichment_status?: string;
  message?: string;
}

export interface GetStatusResponse {
  success: boolean;
  status?: string;
  enrichment_sources?: string[];
  total_contacts?: number;
  last_enriched_at?: string;
}

/** Empresa retornada pelo Data Enrich (get-company). */
export interface DataEnrichCompany {
  id: string;
  name: string;
  trade_name?: string;
  cnpj?: string;
  domain?: string;
  industry?: string;
  description?: string;
  employee_count?: number;
  founding_year?: number;
  logo_url?: string;
  linkedin_url?: string;
  website_score?: number;
  trading_symbol?: string;
  keywords?: string[];
  sic_codes?: string[];
  naics_codes?: string[];
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  enrichment_status?: string;
  enrichment_sources?: string[];
  last_enriched_at?: string;
  apollo_raw_data?: Record<string, unknown>;
  linkedin_raw_data?: Record<string, unknown>;
  lusha_raw_data?: Record<string, unknown>;
}

export interface DataEnrichContact {
  id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  job_title?: string;
  department?: string;
  seniority?: string;
  email?: string;
  email_verified?: boolean;
  phone?: string;
  mobile_phone?: string;
  linkedin_url?: string;
  city?: string;
  state?: string;
  country?: string;
  data_sources?: string[];
  confidence_score?: number;
  apollo_raw_data?: Record<string, unknown>;
  linkedin_raw_data?: Record<string, unknown>;
  lusha_raw_data?: Record<string, unknown>;
  /** Fonte da verificação do email (ex: apollo, hunter). */
  email_verification_source?: string;
  /** Telefone verificado. */
  phone_verified?: boolean;
  /** ID do perfil LinkedIn. */
  linkedin_profile_id?: string;
  /** Localização textual (ex: "São Paulo, BR"). */
  location?: string;
  /** Grau de conexão LinkedIn (1, 2, 3). */
  connection_degree?: number;
  /** Número de conexões em comum. */
  mutual_connections?: number;
}

export interface GetContactsResponse {
  success: boolean;
  contacts?: DataEnrichContact[];
  total?: number;
  stats?: { decision_makers?: number; verified_emails?: number; with_phones?: number };
}

export interface GetCompanyResponse {
  success: boolean;
  company?: DataEnrichCompany;
}

export async function callDataEnrichApi<T = unknown>(
  action: string,
  data: Record<string, unknown>
): Promise<T> {
  const apiKey = getApiKey();
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-stratevo-api-key': apiKey,
    },
    body: JSON.stringify({ action, data }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error ?? json?.message ?? `API ${action} failed: ${res.status}`);
  }
  return json as T;
}

export async function enrichSingle(payload: EnrichSingleInput): Promise<EnrichSingleResponse> {
  const data: Record<string, unknown> = {
    name: payload.name,
    domain: payload.domain,
    cnpj: payload.cnpj,
    trade_name: payload.trade_name,
    city: payload.city,
    state: payload.state,
    country: payload.country ?? 'Brazil',
    industry: payload.industry,
  };
  if (payload.company_id) data.company_id = payload.company_id;
  return callDataEnrichApi<EnrichSingleResponse>('enrich-single', data);
}

export async function getStatus(companyId: string): Promise<GetStatusResponse> {
  return callDataEnrichApi<GetStatusResponse>('get-status', { company_id: companyId });
}

export async function getCompany(companyId: string): Promise<GetCompanyResponse> {
  return callDataEnrichApi<GetCompanyResponse>('get-company', { company_id: companyId });
}

export async function getContacts(companyId: string): Promise<GetContactsResponse> {
  return callDataEnrichApi<GetContactsResponse>('get-contacts', { company_id: companyId });
}

/**
 * Envia múltiplas empresas para o Data Enrich (enrich-batch).
 * Usado após "Enviar para Banco de Empresas" para sincronizar com Lovable.
 */
export async function enrichBatch(companies: EnrichBatchCompany[]): Promise<EnrichBatchResponse> {
  return callDataEnrichApi<EnrichBatchResponse>('enrich-batch', { companies });
}

const SYNC_RETRY_ATTEMPTS = 3;
const SYNC_RETRY_DELAY_MS = 2000;

/**
 * enrich-batch com retry para maior garantia de sucesso.
 * Usado no fluxo "Enviar para Banco de Empresas".
 */
export async function enrichBatchWithRetry(
  companies: EnrichBatchCompany[]
): Promise<{ success: boolean; syncedCount: number; lastError?: string }> {
  let lastError: string | undefined;
  for (let attempt = 1; attempt <= SYNC_RETRY_ATTEMPTS; attempt++) {
    try {
      const result = await enrichBatch(companies);
      if (result?.success) {
        return { success: true, syncedCount: companies.length };
      }
      lastError = result?.message ?? 'Resposta sem sucesso';
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
    if (attempt < SYNC_RETRY_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, SYNC_RETRY_DELAY_MS));
    }
  }
  return { success: false, syncedCount: 0, lastError };
}

export function isDataEnrichConfigured(): boolean {
  return !!getApiKey();
}
