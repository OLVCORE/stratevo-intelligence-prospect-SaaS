/**
 * 🚨 MICROCICLO 3 — VALIDADOR DE TRANSIÇÕES DE ESTADO
 * 
 * Este utilitário valida transições de estado conforme o fluxo canônico:
 * 
 * RAW → BASE → POOL → ACTIVE → PIPELINE
 * 
 * REGRA DE OURO: Nenhuma transição pode pular etapas
 */

export type CanonicalState = 
  | 'RAW'        // Entrada inicial (lista/busca)
  | 'BASE'       // Empresa qualificada
  | 'POOL'       // Governança comercial (quarentena ICP)
  | 'ACTIVE'     // SALES TARGET (lead aprovado)
  | 'PIPELINE'   // Oportunidade ativa
  | 'DISCARDED'; // Descartado

export interface StateTransitionResult {
  allowed: boolean;
  from: CanonicalState;
  to: CanonicalState;
  reason?: string;
  errorCode?: 'INVALID_TRANSITION' | 'SKIP_DETECTED' | 'REGRESSION_DETECTED';
}

/**
 * Ordem canônica dos estados (sequencial)
 */
const STATE_ORDER: Record<CanonicalState, number> = {
  RAW: 0,
  BASE: 1,
  POOL: 2,
  ACTIVE: 3,
  PIPELINE: 4,
  DISCARDED: -1, // Estado terminal, não tem ordem
};

/**
 * Transições permitidas (sequenciais)
 * ✅ AJUSTADO: BASE pode ir direto para ACTIVE (Quarentena eliminada)
 */
const ALLOWED_TRANSITIONS: Record<CanonicalState, CanonicalState[]> = {
  RAW: ['BASE', 'DISCARDED'],
  BASE: ['ACTIVE', 'DISCARDED'], // ✅ BASE → ACTIVE (pula POOL, Quarentena eliminada)
  POOL: ['ACTIVE', 'DISCARDED'], // Mantido para compatibilidade com dados legados
  ACTIVE: ['PIPELINE', 'DISCARDED'],
  PIPELINE: ['DISCARDED'], // PIPELINE só pode ir para DISCARDED
  DISCARDED: [], // DISCARDED é terminal, não pode transicionar
};

/**
 * Valida se uma transição de estado é permitida
 * 
 * REGRA: Apenas transições sequenciais são permitidas
 * - RAW → BASE ✅
 * - BASE → POOL ✅
 * - POOL → ACTIVE ✅
 * - ACTIVE → PIPELINE ✅
 * - Qualquer → DISCARDED ✅
 * 
 * PROIBIDO:
 * - RAW → ACTIVE ❌ (pula BASE e POOL)
 * - BASE → ACTIVE ❌ (pula POOL)
 * - POOL → PIPELINE ❌ (pula ACTIVE)
 * - Qualquer regressão ❌
 */
export function validateStateTransition(
  from: CanonicalState,
  to: CanonicalState
): StateTransitionResult {
  // Se estados são iguais, não é transição
  if (from === to) {
    return {
      allowed: false,
      from,
      to,
      reason: 'Não é possível transicionar para o mesmo estado',
      errorCode: 'INVALID_TRANSITION',
    };
  }

  // DISCARDED é terminal - não pode transicionar
  if (from === 'DISCARDED') {
    return {
      allowed: false,
      from,
      to,
      reason: 'Não é possível transicionar a partir de DISCARDED (estado terminal)',
      errorCode: 'INVALID_TRANSITION',
    };
  }

  // Qualquer estado pode ir para DISCARDED
  if (to === 'DISCARDED') {
    return {
      allowed: true,
      from,
      to,
    };
  }

  // Verificar se transição está na lista de permitidas
  const allowedTargets = ALLOWED_TRANSITIONS[from];
  if (!allowedTargets.includes(to)) {
    // Verificar se é regressão
    const fromOrder = STATE_ORDER[from];
    const toOrder = STATE_ORDER[to];
    
    if (toOrder < fromOrder && toOrder >= 0) {
      return {
        allowed: false,
        from,
        to,
        reason: `Regressão de estado não permitida: ${from} → ${to}. O fluxo canônico não permite voltar etapas.`,
        errorCode: 'REGRESSION_DETECTED',
      };
    }

    // Verificar se é salto
    const orderDiff = toOrder - fromOrder;
    if (orderDiff > 1) {
      return {
        allowed: false,
        from,
        to,
        reason: `Salto de estado não permitido: ${from} → ${to}. O fluxo canônico requer transições sequenciais (RAW → BASE → POOL → ACTIVE → PIPELINE).`,
        errorCode: 'SKIP_DETECTED',
      };
    }

    return {
      allowed: false,
      from,
      to,
      reason: `Transição não permitida: ${from} → ${to}`,
      errorCode: 'INVALID_TRANSITION',
    };
  }

  return {
    allowed: true,
    from,
    to,
  };
}

/**
 * Determina o estado canônico de uma entidade baseado em seus campos
 */
export function getCanonicalState(
  entity: any,
  entityType: 'prospecting_candidate' | 'qualified_prospect' | 'company' | 'quarantine' | 'lead' | 'deal'
): CanonicalState {
  switch (entityType) {
    case 'prospecting_candidate':
      if (entity.status === 'rejected' || entity.status === 'failed') {
        return 'DISCARDED';
      }
      if (entity.status === 'qualified') {
        return 'BASE';
      }
      return 'RAW';

    case 'qualified_prospect':
      if (entity.pipeline_status === 'perdido') {
        return 'DISCARDED';
      }
      if (entity.pipeline_status === 'ganho' && entity.deal_id) {
        return 'PIPELINE';
      }
      return 'BASE';

    case 'company':
      // Se tem canonical_status, usar ele
      if (entity.canonical_status) {
        return entity.canonical_status as CanonicalState;
      }
      // Se tem lead aprovado, está em ACTIVE
      if (entity.lead_id || entity.lead_qualified_id) {
        return 'ACTIVE';
      }
      // Se tem deal ativo, está em PIPELINE
      if (entity.deal_id || entity.sdr_deal_id) {
        return 'PIPELINE';
      }
      // Caso contrário, está em BASE
      return 'BASE';

    case 'quarantine':
      if (entity.validation_status === 'approved') {
        return 'ACTIVE';
      }
      if (entity.validation_status === 'rejected' || entity.validation_status === 'duplicate' || entity.validation_status === 'invalid_data') {
        return 'DISCARDED';
      }
      return 'POOL';

    case 'lead':
      if (entity.status === 'perdido') {
        return 'DISCARDED';
      }
      if (entity.deal_id || entity.sdr_deal_id) {
        return 'PIPELINE';
      }
      // Leads só existem em ACTIVE (se não tiver deal)
      return 'ACTIVE';

    case 'deal':
      if (entity.stage === 'closed_lost') {
        return 'DISCARDED';
      }
      return 'PIPELINE';

    default:
      return 'RAW';
  }
}

/**
 * Verifica se uma entidade pode transicionar para um estado alvo
 */
export function canTransitionTo(
  entity: any,
  entityType: 'prospecting_candidate' | 'qualified_prospect' | 'company' | 'quarantine' | 'lead' | 'deal',
  targetState: CanonicalState
): StateTransitionResult {
  const currentState = getCanonicalState(entity, entityType);
  return validateStateTransition(currentState, targetState);
}

/**
 * Helper para obter mensagem de erro amigável
 */
export function getTransitionErrorMessage(result: StateTransitionResult): string {
  if (result.allowed) {
    return '';
  }

  const messages: Record<string, string> = {
    'SKIP_DETECTED': `Não é possível pular etapas. Transição de ${result.from} para ${result.to} requer etapas intermediárias.`,
    'REGRESSION_DETECTED': `Não é possível regredir no fluxo. Transição de ${result.from} para ${result.to} não é permitida.`,
    'INVALID_TRANSITION': `Transição inválida: ${result.from} → ${result.to}. ${result.reason || ''}`,
  };

  return messages[result.errorCode || 'INVALID_TRANSITION'] || result.reason || 'Transição não permitida';
}
