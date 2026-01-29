/**
 * Orquestrador de enriquecimento de decisores.
 * Normaliza input, chama a Edge Function enrich-apollo-decisores e devolve resultado tipado.
 * Sistema de fallback: LinkedIn URL → Apollo Org ID → Apollo busca por nome + filtros (CEP, fantasia, cidade, estado).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  EnrichmentInput,
  EnrichmentResult,
  EnrichmentEdgeResponse,
} from '@/types/enrichment';

const EDGE_FUNCTION_NAME = 'enrich-apollo-decisores';

/** Extrai Apollo Organization ID de URL (ex.: .../organizations/64696fd0fd539b0001ca5d01/people) */
export function extractApolloOrgIdFromUrl(url: string): string | null {
  if (!url?.trim()) return null;
  const match = url.trim().match(/organizations\/([a-f0-9]{24})/i);
  return match ? match[1] : null;
}

/** Normaliza domain: sem protocolo/www (Apollo espera apenas hostname) */
function normalizeDomain(domain: string | undefined): string | undefined {
  if (!domain?.trim()) return undefined;
  return domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] || undefined;
}

/** Normaliza input para o body da Edge: apollo_url → apollo_org_id, domain limpo, etc. */
export function normalizeEnrichmentInput(input: EnrichmentInput): Record<string, unknown> {
  const apolloOrgId =
    input.apollo_org_id ||
    (input.apollo_url ? extractApolloOrgIdFromUrl(input.apollo_url) : null);

  return {
    company_id: input.company_id || undefined,
    company_name: input.company_name || undefined,
    domain: normalizeDomain(input.domain) || input.domain || undefined,
    linkedin_url: input.linkedin_url || undefined,
    apollo_org_id: apolloOrgId || undefined,
    force_refresh: input.force_refresh === true ? true : undefined,
    city: input.city || undefined,
    state: input.state || undefined,
    industry: input.industry || undefined,
    cep: input.cep || undefined,
    fantasia: input.fantasia || undefined,
    analysis_id: input.analysis_id || undefined,
    qualified_prospect_id: input.qualified_prospect_id || undefined,
    modes: ['people', 'company'] as string[],
  };
}

/** Mapeia resposta da Edge para EnrichmentResult */
function mapEdgeResponseToResult(data: unknown): EnrichmentResult {
  const raw = data as EnrichmentEdgeResponse | undefined;
  if (!raw) {
    return {
      success: false,
      skipped: false,
      executed: false,
      sourceUsed: 'unknown',
      decisionMakersInserted: 0,
      decisionMakersTotal: 0,
      lushaComplemented: 0,
      organization: null,
      statistics: undefined,
      message: 'Resposta inválida da API',
      error: 'Resposta inválida',
    };
  }

  return {
    success: raw.success === true,
    skipped: raw.skipped === true,
    executed: raw.executed === true,
    sourceUsed: raw.source_used ?? 'apollo',
    decisionMakersInserted: raw.decision_makers_inserted ?? 0,
    decisionMakersTotal: raw.decision_makers_total ?? 0,
    lushaComplemented: raw.lusha_complemented ?? 0,
    organization: raw.organization ?? null,
    statistics: raw.statistics,
    message: raw.message ?? (raw.error ?? ''),
    error: raw.error,
    organizationFound: raw.organization_found,
    organizationIdUsed: raw.organization_id_used ?? undefined,
    reasonEmpty: raw.reason_empty,
  };
}

/**
 * Executa enriquecimento de decisores via Edge Function.
 * Fluxo: normaliza input → chama enrich-apollo-decisores → retorna resultado tipado.
 *
 * @param supabase - Cliente Supabase (auth para invoke)
 * @param input - Dados da empresa e identificadores opcionais (Apollo URL, LinkedIn URL, etc.)
 * @returns Resultado normalizado (sucesso, totais, fonte usada, mensagem)
 */
export async function enrichCompany(
  supabase: SupabaseClient,
  input: EnrichmentInput
): Promise<EnrichmentResult> {
  const body = normalizeEnrichmentInput(input);

  const { data, error: invokeError } = await supabase.functions.invoke(
    EDGE_FUNCTION_NAME,
    { body }
  );

  if (invokeError) {
    console.error('[EnrichmentOrchestrator] Erro ao invocar Edge:', invokeError);
    return {
      success: false,
      skipped: false,
      executed: false,
      sourceUsed: 'none',
      decisionMakersInserted: 0,
      decisionMakersTotal: 0,
      lushaComplemented: 0,
      organization: null,
      statistics: undefined,
      message: invokeError.message ?? 'Erro ao buscar decisores',
      error: invokeError.message,
    };
  }

  const result = mapEdgeResponseToResult(data);
  if (result.error && !result.success) {
    result.message = result.error;
  }
  return result;
}
