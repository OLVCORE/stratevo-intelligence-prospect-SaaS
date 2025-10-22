/**
 * Tipos centralizados do sistema
 */

export type EnrichmentSource =
  | 'receita-ws'
  | 'google-cse'
  | 'serper'
  | 'apollo'
  | 'hunter'
  | 'phantombuster';

export type EnrichmentStatus = 'pending' | 'enriching' | 'completed' | 'failed';

export interface Company {
  id: string;
  cnpj: string | null;
  website: string | null;
  name: string;
  trading_name: string | null;
  status: string;
  enrichment_status: EnrichmentStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EnrichmentLog {
  id: string;
  company_id: string;
  source: EnrichmentSource;
  raw_data: Record<string, unknown>;
  processed_data: Record<string, unknown>;
  status: 'success' | 'error';
  error_message: string | null;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}

export interface HealthCheckResult {
  healthy: boolean;
  checks: {
    supabase: {
      ok: boolean;
      error?: string;
    };
    env: {
      ok: boolean;
      missing?: string[];
    };
    apis: {
      [key: string]: {
        ok: boolean;
        error?: string;
      };
    };
  };
  timestamp: string;
}

