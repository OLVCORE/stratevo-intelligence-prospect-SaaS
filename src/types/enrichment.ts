/**
 * Tipos para o Sistema de Extração e Enriquecimento de Decisores.
 * Alinhados ao contrato da Edge Function enrich-apollo-decisores e à tabela decision_makers.
 */

/** Input para enriquecimento (empresa + identificadores opcionais) */
export interface EnrichmentInput {
  company_id?: string;
  company_name?: string;
  domain?: string;
  linkedin_url?: string;
  apollo_org_id?: string;
  /** URL do Apollo (será normalizada para apollo_org_id) */
  apollo_url?: string;
  city?: string;
  state?: string;
  industry?: string;
  cep?: string;
  fantasia?: string;
  analysis_id?: string;
  qualified_prospect_id?: string;
  /** Quando true e apollo_org_id informado, ignora idempotência e reexecuta (Apollo ID Manual) */
  force_refresh?: boolean;
}

/** Classificação de poder de decisão (edge: buying_power) */
export type BuyingPower = 'decision-maker' | 'influencer' | 'user';

/** Uma linha de decisor (espelho dos campos usados na UI e no banco) */
export interface DecisionMakerRow {
  id?: string;
  company_id?: string;
  apollo_person_id?: string | null;
  apollo_organization_id?: string | null;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  title?: string | null;
  seniority?: string | null;
  email?: string | null;
  email_status?: string | null;
  phone?: string | null;
  mobile_phone?: string | null;
  linkedin_url?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  people_auto_score_value?: number | null;
  people_auto_score_label?: string | null;
  recommendations_score?: number | null;
  company_name?: string | null;
  company_employees?: number | null;
  company_industries?: string[] | null;
  company_keywords?: string[] | null;
  /** Classificação estratégica (edge: buying_power) */
  buying_power?: BuyingPower;
  data_sources?: string[] | null;
  raw_apollo_data?: Record<string, unknown> | null;
}

/** Resposta padronizada da Edge enrich-apollo-decisores */
export interface EnrichmentEdgeResponse {
  executed: boolean;
  skipped: boolean;
  reason: string;
  success: boolean;
  source_used?: string;
  decision_makers_inserted?: number;
  decision_makers_total?: number;
  lusha_complemented?: number;
  organization?: {
    name?: string;
    linkedin_url?: string;
    description?: string;
    apollo_id?: string;
  } | null;
  statistics?: {
    total: number;
    decision_makers: number;
    influencers: number;
    users: number;
  };
  main_decision_maker?: DecisionMakerRow | null;
  message?: string;
  error?: string;
  organization_found?: boolean;
  organization_id_used?: string | null;
  /** Preenchido quando decision_makers_total === 0: org_not_found, no_people_in_apollo, idempotency_skip, apollo_key_missing */
  reason_empty?: string;
}

/** Resultado normalizado do orquestrador (para a UI) */
export interface EnrichmentResult {
  success: boolean;
  skipped: boolean;
  executed: boolean;
  sourceUsed: string;
  decisionMakersInserted: number;
  decisionMakersTotal: number;
  lushaComplemented: number;
  organization: EnrichmentEdgeResponse['organization'];
  statistics: EnrichmentEdgeResponse['statistics'];
  message: string;
  error?: string;
  organizationFound?: boolean;
  organizationIdUsed?: string | null;
  reasonEmpty?: string;
}
