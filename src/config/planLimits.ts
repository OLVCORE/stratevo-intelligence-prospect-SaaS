// src/config/planLimits.ts
// ============================================================================
// CONFIGURAÇÃO CENTRALIZADA DE LIMITES POR PLANO
// ============================================================================
// Este arquivo define os limites de recursos para cada plano da plataforma
// ============================================================================

export type PlanType = 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';

export interface PlanLimits {
  tenants: number;      // Número máximo de empresas (tenants)
  icps: number;         // Número máximo de ICPs por tenant
  users: number;        // Número máximo de usuários por tenant
  trialDays: number;    // Dias de trial (apenas para FREE)
  credits: number;      // Créditos iniciais
  requiresSalesContact: boolean; // Requer contato com vendas
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    tenants: 1,
    icps: 1,
    users: 1,
    trialDays: 14,
    credits: 10,
    requiresSalesContact: false,
  },
  STARTER: {
    tenants: 2,
    icps: 3,
    users: 2,
    trialDays: 0,
    credits: 100,
    requiresSalesContact: false,
  },
  GROWTH: {
    tenants: 5,
    icps: 10,
    users: 5,
    trialDays: 0,
    credits: 500,
    requiresSalesContact: false,
  },
  ENTERPRISE: {
    tenants: 15,
    icps: 999999, // Ilimitado
    users: 999999, // Consultar vendas (tratado como ilimitado no código)
    trialDays: 0,
    credits: 10000,
    requiresSalesContact: true,
  },
};

/**
 * Obtém os limites do plano
 */
export function getPlanLimits(plan: string): PlanLimits {
  const planKey = (plan?.toUpperCase() || 'FREE') as PlanType;
  return PLAN_LIMITS[planKey] || PLAN_LIMITS.FREE;
}

/**
 * Verifica se o plano permite mais recursos
 */
export function canAddMore(
  plan: string,
  resourceType: 'tenants' | 'icps' | 'users',
  currentCount: number
): boolean {
  const limits = getPlanLimits(plan);
  const limit = limits[resourceType];
  return currentCount < limit;
}

/**
 * Obtém mensagem de limite atingido
 */
export function getLimitMessage(
  plan: string,
  resourceType: 'tenants' | 'icps' | 'users'
): string {
  const limits = getPlanLimits(plan);
  const limit = limits[resourceType];
  
  const resourceNames = {
    tenants: 'empresas',
    icps: 'ICPs',
    users: 'usuários',
  };
  
  if (limits.requiresSalesContact && resourceType === 'users') {
    return `Para adicionar mais ${resourceNames[resourceType]}, entre em contato com nossa equipe de vendas.`;
  }
  
  return `Seu plano ${plan} permite no máximo ${limit} ${resourceNames[resourceType]}. Faça upgrade para adicionar mais.`;
}

/**
 * Obtém o próximo plano recomendado
 */
export function getUpgradePlan(currentPlan: string): PlanType | null {
  const upgradeMap: Record<string, PlanType | null> = {
    FREE: 'STARTER',
    STARTER: 'GROWTH',
    GROWTH: 'ENTERPRISE',
    ENTERPRISE: null,
  };
  
  return upgradeMap[currentPlan?.toUpperCase()] || 'STARTER';
}

/**
 * Formata o limite para exibição
 */
export function formatLimit(limit: number): string {
  if (limit >= 999999) {
    return 'Ilimitado';
  }
  return limit.toString();
}

/**
 * Obtém descrição completa do plano
 */
export function getPlanDescription(plan: string): string {
  const limits = getPlanLimits(plan);
  
  const parts = [
    `${formatLimit(limits.tenants)} empresa(s)`,
    `${formatLimit(limits.icps)} ICP(s)`,
    `${formatLimit(limits.users)} usuário(s)`,
  ];
  
  if (limits.trialDays > 0) {
    parts.push(`${limits.trialDays} dias de trial`);
  }
  
  return parts.join(' • ');
}

