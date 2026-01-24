/**
 * 🚨 MICROCICLO 4 — Hook para Gerenciar Estados Canônicos no Frontend
 * 
 * Este hook fornece funções para:
 * - Obter estado canônico atual de uma entidade
 * - Validar se uma transição é permitida
 * - Verificar se uma ação pode ser executada
 */

import { useMemo } from 'react';
import { 
  CanonicalState, 
  getCanonicalState, 
  canTransitionTo, 
  validateStateTransition,
  getTransitionErrorMessage 
} from '@/lib/utils/stateTransitionValidator';

export interface UseCanonicalStateOptions {
  entity: any;
  entityType: 'prospecting_candidate' | 'qualified_prospect' | 'company' | 'quarantine' | 'lead' | 'deal';
}

export interface UseCanonicalStateResult {
  currentState: CanonicalState;
  canTransitionTo: (targetState: CanonicalState) => boolean;
  getTransitionError: (targetState: CanonicalState) => string | null;
  isActionAllowed: (action: 'enrich' | 'approve' | 'create_lead' | 'create_deal' | 'move_to_pool' | 'move_to_pipeline' | 'discard') => boolean;
  getActionError: (action: 'enrich' | 'approve' | 'create_lead' | 'create_deal' | 'move_to_pool' | 'move_to_pipeline' | 'discard') => string | null;
}

/**
 * Hook para gerenciar estado canônico de uma entidade
 */
export function useCanonicalState({ entity, entityType }: UseCanonicalStateOptions): UseCanonicalStateResult {
  const currentState = useMemo(() => {
    if (!entity) return 'BASE' as CanonicalState;
    return getCanonicalState(entity, entityType);
  }, [entity, entityType]);

  const canTransitionToState = (targetState: CanonicalState): boolean => {
    if (!entity) return false;
    const result = canTransitionTo(entity, entityType, targetState);
    return result.allowed;
  };

  const getTransitionError = (targetState: CanonicalState): string | null => {
    if (!entity) return 'Entidade não encontrada';
    const result = canTransitionTo(entity, entityType, targetState);
    if (result.allowed) return null;
    return getTransitionErrorMessage(result);
  };

  const isActionAllowed = (action: 'enrich' | 'approve' | 'create_lead' | 'create_deal' | 'move_to_pool' | 'move_to_pipeline' | 'discard'): boolean => {
    if (!entity) return false;

    switch (action) {
      case 'enrich':
        // Enrichment só permitido em ACTIVE (MICROCICLO 2)
        return currentState === 'ACTIVE';

      case 'approve':
        // Aprovar permitido em BASE ou POOL (BASE/POOL → ACTIVE)
        // ✅ BASE → ACTIVE: Quarentena eliminada, aprovação direta da Base de Empresas
        return currentState === 'BASE' || currentState === 'POOL';

      case 'create_lead':
        // Criar lead só permitido em ACTIVE (MICROCICLO 3)
        return currentState === 'ACTIVE';

      case 'create_deal':
        // Criar deal só permitido em ACTIVE (ACTIVE → PIPELINE)
        return currentState === 'ACTIVE';

      case 'move_to_pool':
        // Mover para POOL só permitido em BASE (BASE → POOL)
        return currentState === 'BASE';

      case 'move_to_pipeline':
        // Mover para PIPELINE só permitido em ACTIVE (ACTIVE → PIPELINE)
        return currentState === 'ACTIVE';

      case 'discard':
        // Descartar permitido de qualquer estado (exceto DISCARDED)
        return currentState !== 'DISCARDED';

      default:
        return false;
    }
  };

  const getActionError = (action: 'enrich' | 'approve' | 'create_lead' | 'create_deal' | 'move_to_pool' | 'move_to_pipeline' | 'discard'): string | null => {
    if (isActionAllowed(action)) return null;

    const actionErrors: Record<string, Record<CanonicalState, string>> = {
      enrich: {
        RAW: 'Enrichment não permitido. Empresa deve estar em ACTIVE (Sales Target).',
        BASE: 'Enrichment não permitido. Empresa deve estar em ACTIVE (Sales Target).',
        POOL: 'Enrichment não permitido. Empresa deve estar em ACTIVE (Sales Target).',
        ACTIVE: '', // Permitido
        PIPELINE: 'Enrichment não permitido. Empresa deve estar em ACTIVE (Sales Target).',
        DISCARDED: 'Enrichment não permitido. Empresa descartada.',
      },
      approve: {
        RAW: 'Aprovação não permitida. Empresa deve estar em BASE para aprovar para Leads Aprovados.',
        BASE: '', // ✅ Permitido - BASE → ACTIVE
        POOL: '', // Permitido - POOL → ACTIVE (compatibilidade)
        ACTIVE: 'Aprovação não permitida. Empresa já está em ACTIVE.',
        PIPELINE: 'Aprovação não permitida. Empresa já está em PIPELINE.',
        DISCARDED: 'Aprovação não permitida. Empresa descartada.',
      },
      create_lead: {
        RAW: 'Criação de lead não permitida. Empresa deve estar em ACTIVE (Sales Target).',
        BASE: 'Criação de lead não permitida. Empresa deve estar em ACTIVE (Sales Target).',
        POOL: 'Criação de lead não permitida. Empresa deve estar em ACTIVE (Sales Target).',
        ACTIVE: '', // Permitido
        PIPELINE: 'Criação de lead não permitida. Empresa já está em PIPELINE.',
        DISCARDED: 'Criação de lead não permitida. Empresa descartada.',
      },
      create_deal: {
        RAW: 'Criação de deal não permitida. Empresa deve estar em ACTIVE (Sales Target).',
        BASE: 'Criação de deal não permitida. Empresa deve estar em ACTIVE (Sales Target).',
        POOL: 'Criação de deal não permitida. Empresa deve estar em ACTIVE (Sales Target).',
        ACTIVE: '', // Permitido
        PIPELINE: 'Criação de deal não permitida. Empresa já tem deal ativo.',
        DISCARDED: 'Criação de deal não permitida. Empresa descartada.',
      },
      move_to_pool: {
        RAW: 'Mover para POOL não permitido. Empresa deve estar em BASE.',
        BASE: '', // Permitido
        POOL: 'Mover para POOL não permitido. Empresa já está em POOL.',
        ACTIVE: 'Mover para POOL não permitido. Regressão não permitida.',
        PIPELINE: 'Mover para POOL não permitido. Regressão não permitida.',
        DISCARDED: 'Mover para POOL não permitido. Empresa descartada.',
      },
      move_to_pipeline: {
        RAW: 'Mover para PIPELINE não permitido. Empresa deve estar em ACTIVE.',
        BASE: 'Mover para PIPELINE não permitido. Empresa deve estar em ACTIVE.',
        POOL: 'Mover para PIPELINE não permitido. Empresa deve estar em ACTIVE.',
        ACTIVE: '', // Permitido
        PIPELINE: 'Mover para PIPELINE não permitido. Empresa já está em PIPELINE.',
        DISCARDED: 'Mover para PIPELINE não permitido. Empresa descartada.',
      },
      discard: {
        RAW: '', // Permitido
        BASE: '', // Permitido
        POOL: '', // Permitido
        ACTIVE: '', // Permitido
        PIPELINE: '', // Permitido
        DISCARDED: 'Empresa já está descartada.',
      },
    };

    return actionErrors[action]?.[currentState] || 'Ação não permitida neste estado.';
  };

  return {
    currentState,
    canTransitionTo: canTransitionToState,
    getTransitionError,
    isActionAllowed,
    getActionError,
  };
}

/**
 * Helper para obter badge de estado canônico
 */
export function getStateBadgeVariant(state: CanonicalState): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (state) {
    case 'RAW':
      return 'outline';
    case 'BASE':
      return 'secondary';
    case 'POOL':
      return 'default';
    case 'ACTIVE':
      return 'default';
    case 'PIPELINE':
      return 'default';
    case 'DISCARDED':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * Helper para obter label de estado canônico
 */
export function getStateLabel(state: CanonicalState): string {
  const labels: Record<CanonicalState, string> = {
    RAW: 'RAW (Entrada)',
    BASE: 'BASE (Qualificada)',
    POOL: 'POOL (Quarentena)',
    ACTIVE: 'ACTIVE (Sales Target)',
    PIPELINE: 'PIPELINE (Deal Ativo)',
    DISCARDED: 'DISCARDED (Descartada)',
  };
  return labels[state] || state;
}
