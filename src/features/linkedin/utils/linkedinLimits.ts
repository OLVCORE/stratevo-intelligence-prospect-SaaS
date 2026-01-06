// src/features/linkedin/utils/linkedinLimits.ts

/**
 * Limites seguros para automação LinkedIn
 * Baseado em práticas recomendadas para evitar bloqueios
 */

export const LINKEDIN_LIMITS = {
  // Convites
  MAX_DAILY_INVITES: 25,           // Máximo recomendado por dia
  MAX_WEEKLY_INVITES: 100,         // Máximo por semana
  MAX_MONTHLY_INVITES: 500,        // Máximo por mês
  
  // Mensagens
  MAX_DAILY_MESSAGES: 50,           // Máximo de mensagens por dia
  MAX_WEEKLY_MESSAGES: 200,         // Máximo por semana
  
  // Delays (em segundos)
  MIN_DELAY_BETWEEN_INVITES: 30,    // Mínimo entre convites
  MAX_DELAY_BETWEEN_INVITES: 120,   // Máximo entre convites
  MIN_DELAY_BETWEEN_MESSAGES: 60,   // Mínimo entre mensagens
  MAX_DELAY_BETWEEN_MESSAGES: 300,  // Máximo entre mensagens
  
  // Horários de trabalho (padrão)
  DEFAULT_WORK_START: '08:00',
  DEFAULT_WORK_END: '18:00',
  DEFAULT_TIMEZONE: 'America/Sao_Paulo',
  
  // Scraping
  MAX_LEADS_PER_IMPORT: 100,        // Máximo de leads por importação
  MAX_SEARCH_PAGES: 40,             // Máximo de páginas de busca (25 por página)
  
  // Retries
  MAX_RETRIES: 3,                    // Máximo de tentativas
  RETRY_DELAY_SECONDS: 300,         // Delay entre tentativas (5 min)
} as const;

/**
 * Verifica se está dentro do horário de trabalho
 */
export function isWithinWorkingHours(
  start: string,
  end: string,
  timezone: string = LINKEDIN_LIMITS.DEFAULT_TIMEZONE
): boolean {
  const now = new Date();
  const currentHour = parseInt(
    now.toLocaleString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      hour12: false,
    })
  );
  
  const [startHour] = start.split(':').map(Number);
  const [endHour] = end.split(':').map(Number);
  
  return currentHour >= startHour && currentHour < endHour;
}

/**
 * Calcula delay randômico entre ações
 */
export function getRandomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

