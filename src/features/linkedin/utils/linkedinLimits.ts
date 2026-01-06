// src/features/linkedin/utils/linkedinLimits.ts

// Limites seguros do LinkedIn (baseados em boas práticas)
export const LINKEDIN_LIMITS = {
  // Convites
  MAX_INVITES_PER_DAY: 25,
  MAX_INVITES_PER_WEEK: 100,
  MAX_INVITES_PER_MONTH: 500,
  
  // Mensagens (após conexão)
  MAX_MESSAGES_PER_DAY: 50,
  MAX_MESSAGES_PER_WEEK: 200,
  
  // Buscas/Scraping
  MAX_SEARCH_RESULTS: 1000,
  MAX_PROFILES_PER_SEARCH: 100,
  
  // Delays (em segundos)
  MIN_DELAY_BETWEEN_INVITES: 60, // 1 minuto
  MAX_DELAY_BETWEEN_INVITES: 300, // 5 minutos
  MIN_DELAY_BETWEEN_MESSAGES: 30, // 30 segundos
  MAX_DELAY_BETWEEN_MESSAGES: 120, // 2 minutos
  
  // Horários de trabalho (padrão)
  WORK_START_HOUR: 9, // 9h
  WORK_END_HOUR: 18, // 18h
  WORK_DAYS: [1, 2, 3, 4, 5], // Segunda a Sexta
} as const;
