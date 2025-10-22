/**
 * Sequencer Engine - Lógica de seleção de variantes A/B
 * SEM MOCKS - distribuição ponderada determinística
 */

type Variant = {
  id: string;
  name: string;
  weight: number;
  template_id: string | null;
};

/**
 * Seleciona variante baseada em pesos (distribuição ponderada)
 * Usa hash do run_id para determinismo (mesmo run = mesma variante)
 */
export function selectVariant(variants: Variant[], runId: string, stepIndex: number): Variant {
  if (variants.length === 0) {
    throw new Error('Nenhuma variante disponível');
  }

  if (variants.length === 1) {
    return variants[0];
  }

  // Calcular pesos normalizados
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight === 0) {
    // Se todos os pesos forem 0, distribuir igualmente
    return variants[Math.floor(Math.random() * variants.length)];
  }

  // Hash simples do runId + stepIndex para determinismo
  const seed = hashString(`${runId}-${stepIndex}`);
  const randomValue = (seed % 100) / 100; // 0-1

  // Seleção ponderada
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight / totalWeight;
    if (randomValue <= cumulative) {
      return variant;
    }
  }

  // Fallback (não deveria acontecer)
  return variants[variants.length - 1];
}

/**
 * Hash simples de string para número
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Verifica se deve executar próximo passo
 * Considera: delay_days, business_hours, next_due_at
 */
export function shouldExecuteStep(
  lastEventTime: Date,
  delayDays: number,
  businessHours: boolean,
  now: Date = new Date()
): boolean {
  // Calcular next_due_at
  const nextDue = new Date(lastEventTime);
  nextDue.setDate(nextDue.getDate() + delayDays);

  // Se ainda não chegou a hora
  if (now < nextDue) return false;

  // Se requer business hours, verificar
  if (businessHours) {
    const hour = now.getHours();
    const day = now.getDay();

    // Horário comercial: 9h-18h, seg-sex
    const isWeekday = day >= 1 && day <= 5;
    const isBusinessHour = hour >= 9 && hour < 18;

    return isWeekday && isBusinessHour;
  }

  return true;
}

