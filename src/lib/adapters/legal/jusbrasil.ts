// ✅ Adapter para buscar dados jurídicos no JusBrasil
import { logger } from '@/lib/utils/logger';
import { cache, CacheKeys } from '@/lib/utils/cache';

export interface JusBrasilData {
  cnpj: string;
  companyName: string;
  totalProcesses: number;
  activeProcesses: number;
  processes: Array<{
    id: string;
    number: string;
    court: string;
    type: string;
    subject: string;
    status: string;
    startDate: string;
    lastUpdate?: string;
    value?: number;
    parties: Array<{
      name: string;
      role: string;
    }>;
  }>;
  processesByType: {
    trabalhista: number;
    civel: number;
    tributario: number;
    criminal: number;
    outros: number;
  };
  processesByStatus: {
    ativo: number;
    arquivado: number;
    suspenso: number;
    finalizado: number;
  };
  riskLevel: 'baixo' | 'medio' | 'alto' | 'critico';
  legalHealthScore: number;
}

export interface JusBrasilOptions {
  includeArchived?: boolean;
  maxResults?: number;
}

/**
 * Busca dados jurídicos da empresa no JusBrasil
 */
export async function fetchJusBrasilData(
  cnpj: string,
  options: JusBrasilOptions = {}
): Promise<JusBrasilData> {
  const cacheKey = `jusbrasil:${cnpj}`;
  
  // Verificar cache
  const cached = cache.get<JusBrasilData>(cacheKey);
  if (cached) {
    logger.info('JUSBRASIL', 'Cache hit', { cnpj });
    return cached;
  }

  try {
    logger.info('JUSBRASIL', 'Fetching legal data', { cnpj });

    // 🔥 PROIBIDO: Dados mockados foram removidos
    // Se integração com JusBrasil não estiver disponível, retornar dados vazios
    // NUNCA retornar dados fake - isso viola a regra sagrada da plataforma
    
    // TODO: Implementar integração real com JusBrasil API ou scraping
    // Por enquanto, retornar estrutura vazia (não dados fake)
    const emptyData: JusBrasilData = {
      cnpj,
      companyName: '', // Será preenchido quando houver integração real
      totalProcesses: 0,
      activeProcesses: 0,
      processes: [],
      processesByType: {
        trabalhista: 0,
        civel: 0,
        tributario: 0,
        criminal: 0,
        outros: 0
      },
      processesByStatus: {
        ativo: 0,
        arquivado: 0,
        suspenso: 0,
        finalizado: 0
      },
      riskLevel: 'baixo',
      legalHealthScore: 100 // Score perfeito quando não há processos
    };

    logger.warn('JUSBRASIL', 'Integração não implementada - retornando dados vazios', { cnpj });
    return emptyData;
  } catch (error) {
    logger.error('JUSBRASIL', 'Failed to fetch legal data', { error, cnpj });
    throw error;
  }
}

/**
 * Calcula nível de risco jurídico baseado nos processos
 */
export function calculateLegalRiskLevel(data: JusBrasilData): 'baixo' | 'medio' | 'alto' | 'critico' {
  const { totalProcesses, activeProcesses, processesByType } = data;

  // Processos criminais são críticos
  if (processesByType.criminal > 0) return 'critico';

  // Muitos processos ativos
  if (activeProcesses > 10) return 'critico';
  if (activeProcesses > 5) return 'alto';

  // Total de processos
  if (totalProcesses > 20) return 'alto';
  if (totalProcesses > 10) return 'medio';
  if (totalProcesses > 5) return 'medio';

  return 'baixo';
}

/**
 * Calcula score de saúde jurídica (0-100)
 */
export function calculateLegalHealthScore(data: JusBrasilData): number {
  let score = 100;

  // Penaliza por processos ativos
  score -= data.activeProcesses * 5;

  // Penaliza por processos criminais
  score -= data.processesByType.criminal * 20;

  // Penaliza por volume total
  if (data.totalProcesses > 20) score -= 20;
  else if (data.totalProcesses > 10) score -= 10;
  else if (data.totalProcesses > 5) score -= 5;

  // Penaliza por processos trabalhistas (indicam problemas internos)
  score -= data.processesByType.trabalhista * 3;

  return Math.max(0, Math.min(100, score));
}
