/**
 * 🚨 MICROCICLO 2 — VALIDADOR DE CONTEXTO DE ENRICHMENT
 * 
 * Este utilitário valida se o enrichment está sendo executado
 * no contexto correto conforme o fluxo canônico:
 * 
 * LISTA → BASE DE EMPRESAS → POOL COMERCIAL → SALES TARGET → PIPELINE
 * 
 * REGRA DE OURO: Enrichment SÓ é permitido em SALES TARGET
 */

export type EnrichmentContext = 
  | 'LISTA'                    // Upload ou Busca
  | 'BASE_EMPRESAS'            // companies, qualified_prospects, prospecting_candidates
  | 'POOL_COMERCIAL'           // leads_quarantine, quarentena ICP
  | 'SALES_TARGET'             // leads aprovados (ÚNICO PERMITIDO)
  | 'PIPELINE_VENDAS'          // CRM, deals
  | 'UNKNOWN';                 // Contexto não identificado

export interface EnrichmentValidationResult {
  allowed: boolean;
  context: EnrichmentContext;
  reason?: string;
  errorCode?: 'LEGACY_BLOCKED' | 'CONTEXT_INVALID' | 'NOT_SALES_TARGET';
}

/**
 * Determina o contexto atual baseado em:
 * - Tabela/entidade sendo manipulada
 * - Rota/página atual
 * - Parâmetros fornecidos
 */
export function determineEnrichmentContext(params: {
  entityType?: 'company' | 'prospect' | 'lead' | 'deal' | 'quarantine';
  tableName?: string;
  routePath?: string;
  leadId?: string;
  companyId?: string;
}): EnrichmentContext {
  const { entityType, tableName, routePath, leadId } = params;

  // Prioridade 1: Verificar se há leadId (indica SALES TARGET)
  if (leadId || entityType === 'lead') {
    // Verificar se é lead aprovado (SALES TARGET)
    if (routePath?.includes('/leads/approved') || routePath?.includes('/approved-leads')) {
      return 'SALES_TARGET';
    }
    // Leads em quarentena são POOL COMERCIAL
    if (routePath?.includes('/quarantine') || routePath?.includes('/icp-quarantine')) {
      return 'POOL_COMERCIAL';
    }
  }

  // Prioridade 2: Verificar tabela/entidade
  if (tableName) {
    if (tableName === 'leads' && routePath?.includes('/approved')) {
      return 'SALES_TARGET';
    }
    if (tableName === 'leads_quarantine' || tableName === 'quarantine') {
      return 'POOL_COMERCIAL';
    }
    if (tableName === 'companies' || tableName === 'qualified_prospects' || tableName === 'prospecting_candidates') {
      return 'BASE_EMPRESAS';
    }
    if (tableName === 'deals' || tableName === 'sdr_deals') {
      return 'PIPELINE_VENDAS';
    }
  }

  // Prioridade 3: Verificar rota
  if (routePath) {
    if (routePath.includes('/leads/approved') || routePath.includes('/approved-leads')) {
      return 'SALES_TARGET';
    }
    if (routePath.includes('/quarantine') || routePath.includes('/icp-quarantine')) {
      return 'POOL_COMERCIAL';
    }
    if (routePath.includes('/companies') || routePath.includes('/qualified') || routePath.includes('/prospecting')) {
      return 'BASE_EMPRESAS';
    }
    if (routePath.includes('/search') || routePath.includes('/upload')) {
      return 'LISTA';
    }
    if (routePath.includes('/crm') || routePath.includes('/pipeline') || routePath.includes('/deals')) {
      return 'PIPELINE_VENDAS';
    }
  }

  // Prioridade 4: Verificar entityType
  if (entityType === 'lead') {
    return 'SALES_TARGET'; // Assumir SALES TARGET se não houver mais contexto
  }
  if (entityType === 'quarantine') {
    return 'POOL_COMERCIAL';
  }
  if (entityType === 'company' || entityType === 'prospect') {
    return 'BASE_EMPRESAS';
  }
  if (entityType === 'deal') {
    return 'PIPELINE_VENDAS';
  }

  return 'UNKNOWN';
}

/**
 * Valida se o enrichment pode ser executado no contexto atual
 * 
 * REGRA DE OURO: Só permite em SALES_TARGET
 */
export function validateEnrichmentContext(params: {
  entityType?: 'company' | 'prospect' | 'lead' | 'deal' | 'quarantine';
  tableName?: string;
  routePath?: string;
  leadId?: string;
  companyId?: string;
  entityId?: string;
}): EnrichmentValidationResult {
  const context = determineEnrichmentContext(params);

  // ✅ ÚNICO CONTEXTO PERMITIDO: SALES_TARGET
  if (context === 'SALES_TARGET') {
    return {
      allowed: true,
      context: 'SALES_TARGET',
    };
  }

  // 🚫 TODOS OS OUTROS CONTEXTOS SÃO BLOQUEADOS
  const blockedContexts: Record<EnrichmentContext, string> = {
    LISTA: 'Enrichment não permitido durante upload ou busca. Apenas Leads Aprovados (Sales Target) podem ser enriquecidos.',
    BASE_EMPRESAS: 'Enrichment não permitido na Base de Empresas. Apenas Leads Aprovados (Sales Target) podem ser enriquecidos.',
    POOL_COMERCIAL: 'Enrichment não permitido no Pool Comercial (Quarentena). Apenas Leads Aprovados (Sales Target) podem ser enriquecidos.',
    PIPELINE_VENDAS: 'Enrichment não permitido no Pipeline de Vendas. Apenas Leads Aprovados (Sales Target) podem ser enriquecidos.',
    SALES_TARGET: '', // Permitido
    UNKNOWN: 'Contexto de enrichment não identificado. Apenas Leads Aprovados (Sales Target) podem ser enriquecidos.',
  };

  return {
    allowed: false,
    context,
    reason: blockedContexts[context],
    errorCode: 'NOT_SALES_TARGET',
  };
}

/**
 * Helper para obter rota atual (client-side)
 */
export function getCurrentRoutePath(): string {
  if (typeof window === 'undefined') return '';
  return window.location.pathname;
}

/**
 * Helper para verificar se está em SALES TARGET baseado na rota
 */
export function isInSalesTargetContext(): boolean {
  const routePath = getCurrentRoutePath();
  return routePath.includes('/leads/approved') || routePath.includes('/approved-leads');
}
