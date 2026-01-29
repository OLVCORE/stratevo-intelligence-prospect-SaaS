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
  country?: string;
  data_sources?: string[];
  confidence_score?: number;
  apollo_raw_data?: Record<string, unknown>;
  linkedin_raw_data?: Record<string, unknown>;
  lusha_raw_data?: Record<string, unknown>;
}

export interface GetContactsResponse {
  success: boolean;
  contacts?: DataEnrichContact[];
  total?: number;
  stats?: { decision_makers?: number; verified_emails?: number; with_phones?: number };
}

export interface GetCompanyResponse {
  success: boolean;
  company?: Record<string, unknown>;
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

export function isDataEnrichConfigured(): boolean {
  return !!getApiKey();
}
